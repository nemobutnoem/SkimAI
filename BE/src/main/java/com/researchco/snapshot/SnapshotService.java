package com.researchco.snapshot;

import com.researchco.common.AppException;
import com.researchco.search.SearchQueryEntity;
import com.researchco.search.SearchQueryRepository;
import com.researchco.security.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class SnapshotService {

    private final AnalysisSnapshotRepository analysisSnapshotRepository;
    private final SearchQueryRepository searchQueryRepository;
    private final SnapshotInsightRepository snapshotInsightRepository;
    private final SnapshotKeywordRepository snapshotKeywordRepository;
    private final SnapshotChartRepository snapshotChartRepository;

    public SnapshotService(AnalysisSnapshotRepository analysisSnapshotRepository,
                           SearchQueryRepository searchQueryRepository,
                           SnapshotInsightRepository snapshotInsightRepository,
                           SnapshotKeywordRepository snapshotKeywordRepository,
                           SnapshotChartRepository snapshotChartRepository) {
        this.analysisSnapshotRepository = analysisSnapshotRepository;
        this.searchQueryRepository = searchQueryRepository;
        this.snapshotInsightRepository = snapshotInsightRepository;
        this.snapshotKeywordRepository = snapshotKeywordRepository;
        this.snapshotChartRepository = snapshotChartRepository;
    }

    public SnapshotDtos.SnapshotResponse getSnapshot(UUID snapshotId) {
        AnalysisSnapshotEntity snapshot = analysisSnapshotRepository.findById(snapshotId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Snapshot not found"));
        SearchQueryEntity query = searchQueryRepository.findById(snapshot.getSearchQuery().getId())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Search query not found"));

        UUID currentUserId = SecurityUtils.currentUserId();
        String role = SecurityUtils.currentRole();
        if (currentUserId == null) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        if (!currentUserId.equals(query.getUser().getId()) && !"ADMIN".equalsIgnoreCase(role)) {
            throw new AppException(HttpStatus.FORBIDDEN, "Forbidden");
        }

        return new SnapshotDtos.SnapshotResponse(
                snapshot.getId().toString(),
                query.getId().toString(),
                snapshot.getSummaryText(),
                snapshot.getTotalSources(),
                snapshot.getPositiveCount(),
                snapshot.getNeutralCount(),
                snapshot.getNegativeCount(),
                snapshot.getCreatedAt(),
                snapshotInsightRepository.findBySnapshotId(snapshot.getId()).stream()
                        .map(i -> new SnapshotDtos.InsightItem(i.getTitle(), i.getContent()))
                        .toList(),
                snapshotKeywordRepository.findBySnapshotId(snapshot.getId()).stream()
                        .map(k -> new SnapshotDtos.KeywordItem(k.getKeyword(), k.getMentionCount()))
                        .toList(),
                snapshotChartRepository.findBySnapshotId(snapshot.getId()).stream()
                        .map(c -> new SnapshotDtos.ChartItem(c.getChartType(), c.getChartData()))
                        .toList()
        );
    }
}
