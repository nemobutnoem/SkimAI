package com.researchco.search;

import com.researchco.common.AppException;
import com.researchco.plan.PlanEntity;
import com.researchco.provider.NormalizedSourceItem;
import com.researchco.provider.ProviderOrchestrator;
import com.researchco.provider.SearchProviderEntity;
import com.researchco.provider.SearchProviderRepository;
import com.researchco.security.SecurityUtils;
import com.researchco.snapshot.AnalysisSnapshotEntity;
import com.researchco.snapshot.AnalysisSnapshotRepository;
import com.researchco.snapshot.SnapshotChartEntity;
import com.researchco.snapshot.SnapshotChartRepository;
import com.researchco.snapshot.SnapshotInsightEntity;
import com.researchco.snapshot.SnapshotInsightRepository;
import com.researchco.snapshot.SnapshotKeywordEntity;
import com.researchco.snapshot.SnapshotKeywordRepository;
import com.researchco.subscription.UserSubscriptionEntity;
import com.researchco.subscription.UserSubscriptionRepository;
import com.researchco.user.UserEntity;
import com.researchco.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SearchService {

    private final UserRepository userRepository;
    private final SearchQueryRepository searchQueryRepository;
    private final SourceItemRepository sourceItemRepository;
    private final SearchProviderRepository searchProviderRepository;
    private final ProviderOrchestrator providerOrchestrator;
    private final AnalysisSnapshotRepository analysisSnapshotRepository;
    private final SnapshotInsightRepository snapshotInsightRepository;
    private final SnapshotKeywordRepository snapshotKeywordRepository;
    private final SnapshotChartRepository snapshotChartRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;

    public SearchService(UserRepository userRepository,
                         SearchQueryRepository searchQueryRepository,
                         SourceItemRepository sourceItemRepository,
                         SearchProviderRepository searchProviderRepository,
                         ProviderOrchestrator providerOrchestrator,
                         AnalysisSnapshotRepository analysisSnapshotRepository,
                         SnapshotInsightRepository snapshotInsightRepository,
                         SnapshotKeywordRepository snapshotKeywordRepository,
                         SnapshotChartRepository snapshotChartRepository,
                         UserSubscriptionRepository userSubscriptionRepository) {
        this.userRepository = userRepository;
        this.searchQueryRepository = searchQueryRepository;
        this.sourceItemRepository = sourceItemRepository;
        this.searchProviderRepository = searchProviderRepository;
        this.providerOrchestrator = providerOrchestrator;
        this.analysisSnapshotRepository = analysisSnapshotRepository;
        this.snapshotInsightRepository = snapshotInsightRepository;
        this.snapshotKeywordRepository = snapshotKeywordRepository;
        this.snapshotChartRepository = snapshotChartRepository;
        this.userSubscriptionRepository = userSubscriptionRepository;
    }

    @Transactional
    public SearchDtos.SearchResponse executeSearch(SearchDtos.SearchRequest request) {
        UserEntity user = currentUserOrThrow();
        validateSearchLimit(user);

        SearchQueryEntity query = SearchQueryEntity.builder()
                .user(user)
                .keyword(request.keyword())
                .countryCode(request.countryCode())
                .languageCode(request.languageCode())
                .timeRange(request.timeRange())
                .status("PROCESSING")
                .build();
        searchQueryRepository.save(query);

        List<SearchProviderEntity> activeProviders = searchProviderRepository.findByIsActiveTrue();
        Set<String> activeCodes = activeProviders.stream().map(SearchProviderEntity::getProviderCode).collect(Collectors.toSet());
        Map<String, SearchProviderEntity> providerMap = activeProviders.stream()
                .collect(Collectors.toMap(SearchProviderEntity::getProviderCode, p -> p));

        List<NormalizedSourceItem> items = providerOrchestrator.aggregate(
                activeCodes,
                request.keyword(),
                request.countryCode(),
                request.languageCode(),
                request.timeRange()
        );

        List<SourceItemEntity> sourceEntities = items.stream()
                .filter(item -> providerMap.containsKey(item.providerCode()))
                .map(item -> SourceItemEntity.builder()
                        .searchQuery(query)
                        .provider(providerMap.get(item.providerCode()))
                        .platform(item.platform())
                        .contentType(item.contentType())
                        .title(item.title())
                        .snippet(item.snippet())
                        .url(item.url())
                        .sourceName(item.sourceName())
                        .authorName(item.authorName())
                        .publishedAt(item.publishedAt())
                        .sentimentLabel(item.sentimentLabel())
                        .rawPayload(item.rawPayload())
                        .build())
                .toList();
        sourceItemRepository.saveAll(sourceEntities);

        long positive = sourceEntities.stream().filter(i -> "POSITIVE".equalsIgnoreCase(i.getSentimentLabel())).count();
        long neutral = sourceEntities.stream().filter(i -> "NEUTRAL".equalsIgnoreCase(i.getSentimentLabel())).count();
        long negative = sourceEntities.stream().filter(i -> "NEGATIVE".equalsIgnoreCase(i.getSentimentLabel())).count();

        AnalysisSnapshotEntity snapshot = AnalysisSnapshotEntity.builder()
                .searchQuery(query)
                .summaryText("Collected " + sourceEntities.size() + " sources for keyword '" + request.keyword() + "'.")
                .totalSources(sourceEntities.size())
                .positiveCount((int) positive)
                .neutralCount((int) neutral)
                .negativeCount((int) negative)
                .build();
        analysisSnapshotRepository.save(snapshot);

        snapshotInsightRepository.save(SnapshotInsightEntity.builder()
                .snapshot(snapshot)
                .title("Market momentum")
                .content("Top sentiment trend is " + strongestSentiment((int) positive, (int) neutral, (int) negative) + ".")
                .build());

        Map<String, Integer> keywordCount = new HashMap<>();
        for (SourceItemEntity item : sourceEntities) {
            if (item.getTitle() == null) {
                continue;
            }
            for (String token : item.getTitle().toLowerCase().split("\\s+")) {
                String cleaned = token.replaceAll("[^a-z0-9]", "");
                if (cleaned.length() >= 4) {
                    keywordCount.merge(cleaned, 1, Integer::sum);
                }
            }
        }
        keywordCount.entrySet().stream()
                .sorted(Map.Entry.comparingByValue(Comparator.reverseOrder()))
                .limit(5)
                .forEach(entry -> snapshotKeywordRepository.save(SnapshotKeywordEntity.builder()
                        .snapshot(snapshot)
                        .keyword(entry.getKey())
                        .mentionCount(entry.getValue())
                        .build()));

        Map<String, Integer> sentimentChart = Map.of(
                "positive", (int) positive,
                "neutral", (int) neutral,
                "negative", (int) negative
        );
        snapshotChartRepository.save(SnapshotChartEntity.builder()
                .snapshot(snapshot)
                .chartType("SENTIMENT_DONUT")
                .chartData(sentimentChart)
                .build());

        query.setStatus("COMPLETED");
        searchQueryRepository.save(query);

        return new SearchDtos.SearchResponse(query.getId().toString(), query.getStatus(), snapshot.getId().toString(), sourceEntities.size());
    }

    public List<SearchDtos.SourceItemResponse> getSources(UUID searchQueryId) {
        SearchQueryEntity query = searchQueryRepository.findById(searchQueryId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Search query not found"));
        checkOwnershipOrAdmin(query.getUser().getId());
        return sourceItemRepository.findBySearchQueryId(searchQueryId).stream()
                .map(item -> new SearchDtos.SourceItemResponse(
                        item.getId().toString(),
                        item.getProvider().getProviderCode(),
                        item.getPlatform(),
                        item.getContentType(),
                        item.getTitle(),
                        item.getSnippet(),
                        item.getUrl(),
                        item.getSourceName(),
                        item.getAuthorName(),
                        item.getPublishedAt(),
                        item.getSentimentLabel()
                ))
                .toList();
    }

    public SearchDtos.SearchHistoryResponse history() {
        UserEntity user = currentUserOrThrow();
        List<SearchDtos.SearchHistoryItem> items = searchQueryRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .map(query -> new SearchDtos.SearchHistoryItem(
                        query.getId().toString(),
                        query.getKeyword(),
                        query.getStatus(),
                        query.getCreatedAt()
                ))
                .toList();
        return new SearchDtos.SearchHistoryResponse(items);
    }

    private void validateSearchLimit(UserEntity user) {
        UserSubscriptionEntity subscription = userSubscriptionRepository.findFirstByUserAndStatusOrderByStartDateDesc(user, "ACTIVE")
                .orElseThrow(() -> new AppException(HttpStatus.FORBIDDEN, "No active subscription"));
        PlanEntity plan = subscription.getPlan();
        Integer limit = plan.getSearchLimit();
        if (limit != null && limit > 0) {
            long used = searchQueryRepository.countByUser(user);
            if (used >= limit) {
                throw new AppException(HttpStatus.FORBIDDEN, "Search limit reached for plan " + plan.getName());
            }
        }
    }

    private UserEntity currentUserOrThrow() {
        UUID userId = SecurityUtils.currentUserId();
        if (userId == null) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private void checkOwnershipOrAdmin(UUID ownerId) {
        UUID currentUserId = SecurityUtils.currentUserId();
        String role = SecurityUtils.currentRole();
        if (currentUserId == null) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
        if (!currentUserId.equals(ownerId) && !"ADMIN".equalsIgnoreCase(role)) {
            throw new AppException(HttpStatus.FORBIDDEN, "Forbidden");
        }
    }

    private String strongestSentiment(int positive, int neutral, int negative) {
        if (positive >= neutral && positive >= negative) {
            return "POSITIVE";
        }
        if (negative >= neutral) {
            return "NEGATIVE";
        }
        return "NEUTRAL";
    }
}
