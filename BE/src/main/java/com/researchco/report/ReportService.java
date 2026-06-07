package com.researchco.report;

import com.researchco.common.AppException;
import com.researchco.search.SearchQueryEntity;
import com.researchco.search.SearchQueryRepository;
import com.researchco.security.SecurityUtils;
import com.researchco.snapshot.AnalysisSnapshotEntity;
import com.researchco.snapshot.AnalysisSnapshotRepository;
import com.researchco.user.UserEntity;
import com.researchco.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ReportService {

    private final ReportRepository reportRepository;
    private final SearchQueryRepository searchQueryRepository;
    private final AnalysisSnapshotRepository analysisSnapshotRepository;
    private final UserRepository userRepository;

    public ReportService(ReportRepository reportRepository,
                         SearchQueryRepository searchQueryRepository,
                         AnalysisSnapshotRepository analysisSnapshotRepository,
                         UserRepository userRepository) {
        this.reportRepository = reportRepository;
        this.searchQueryRepository = searchQueryRepository;
        this.analysisSnapshotRepository = analysisSnapshotRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ReportDtos.ReportResponse createReport(ReportDtos.CreateReportRequest request) {
        UUID userId = SecurityUtils.currentUserId();
        String role = SecurityUtils.currentRole();
        if (userId == null) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.UNAUTHORIZED, "User not found"));

        UUID searchQueryId = UUID.fromString(request.searchQueryId());
        SearchQueryEntity query = searchQueryRepository.findById(searchQueryId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Search query not found"));
        if (!query.getUser().getId().equals(userId) && !"ADMIN".equalsIgnoreCase(role)) {
            throw new AppException(HttpStatus.FORBIDDEN, "Forbidden");
        }

        AnalysisSnapshotEntity snapshot = analysisSnapshotRepository.findBySearchQueryId(searchQueryId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Snapshot not found"));

        Map<String, Object> reportContent = Map.of(
                "keyword", query.getKeyword(),
                "summary", snapshot.getSummaryText(),
                "totalSources", snapshot.getTotalSources(),
                "sentiment", Map.of(
                        "positive", snapshot.getPositiveCount(),
                        "neutral", snapshot.getNeutralCount(),
                        "negative", snapshot.getNegativeCount()
                ),
                "generatedAt", LocalDateTime.now().toString()
        );

        ReportEntity report = ReportEntity.builder()
                .user(user)
                .searchQuery(query)
                .snapshot(snapshot)
                .title(request.title())
                .reportContent(reportContent)
                .status("DRAFT")
                .build();
        reportRepository.save(report);

        return new ReportDtos.ReportResponse(
                report.getId().toString(),
                query.getId().toString(),
                snapshot.getId().toString(),
                report.getTitle(),
                report.getStatus(),
                report.getCreatedAt()
        );
    }

    @Transactional(readOnly = true)
    public List<ReportDtos.UserReportResponse> getUserReports(String status) {
        UUID userId = SecurityUtils.currentUserId();
        if (userId == null) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        List<ReportEntity> reports;
        if (status != null && !status.trim().isEmpty() && !"all".equalsIgnoreCase(status)) {
            reports = reportRepository.findByUserIdAndStatusIgnoreCaseOrderByCreatedAtDesc(userId, status.trim());
        } else {
            reports = reportRepository.findByUserIdOrderByCreatedAtDesc(userId);
        }

        return reports.stream()
                .map(r -> new ReportDtos.UserReportResponse(
                        r.getId().toString(),
                        r.getTitle(),
                        r.getStatus(),
                        r.getSearchQuery() != null ? r.getSearchQuery().getKeyword() : "",
                        r.getCreatedAt()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public ReportDtos.ReportDetailsResponse getUserReportById(UUID reportId) {
        UUID userId = SecurityUtils.currentUserId();
        String role = SecurityUtils.currentRole();
        if (userId == null) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        ReportEntity report = reportRepository.findById(reportId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Report not found"));

        if (!report.getUser().getId().equals(userId) && !"ADMIN".equalsIgnoreCase(role)) {
            throw new AppException(HttpStatus.FORBIDDEN, "Forbidden");
        }

        return new ReportDtos.ReportDetailsResponse(
                report.getId().toString(),
                report.getTitle(),
                report.getStatus(),
                report.getSearchQuery() != null ? report.getSearchQuery().getKeyword() : "",
                report.getReportContent(),
                report.getCreatedAt()
        );
    }
}
