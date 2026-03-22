package com.researchco.frontend;

import com.researchco.plan.PlanEntity;
import com.researchco.plan.PlanRepository;
import com.researchco.provider.NormalizedSourceItem;
import com.researchco.provider.ProviderOrchestrator;
import com.researchco.provider.SearchProviderEntity;
import com.researchco.provider.SearchProviderRepository;
import com.researchco.report.ReportRepository;
import com.researchco.search.SearchQueryEntity;
import com.researchco.search.SearchQueryRepository;
import com.researchco.search.SourceItemEntity;
import com.researchco.search.SourceItemRepository;
import com.researchco.snapshot.AnalysisSnapshotEntity;
import com.researchco.snapshot.AnalysisSnapshotRepository;
import com.researchco.snapshot.SnapshotInsightRepository;
import com.researchco.snapshot.SnapshotKeywordEntity;
import com.researchco.snapshot.SnapshotKeywordRepository;
import com.researchco.subscription.UserSubscriptionEntity;
import com.researchco.subscription.UserSubscriptionRepository;
import com.researchco.user.UserEntity;
import com.researchco.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class FrontendService {

    private final SearchQueryRepository searchQueryRepository;
    private final AnalysisSnapshotRepository analysisSnapshotRepository;
    private final SnapshotInsightRepository snapshotInsightRepository;
    private final SnapshotKeywordRepository snapshotKeywordRepository;
    private final SourceItemRepository sourceItemRepository;
    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final PlanRepository planRepository;
    private final SearchProviderRepository searchProviderRepository;
    private final ProviderOrchestrator providerOrchestrator;
    private final AtomicReference<Map<String, Boolean>> notificationSettings = new AtomicReference<>(
            new LinkedHashMap<>(Map.of(
                    "emailUpdates", true,
                    "weeklyReport", true,
                    "usageAlerts", false
            ))
    );

    public FrontendService(SearchQueryRepository searchQueryRepository,
                           AnalysisSnapshotRepository analysisSnapshotRepository,
                           SnapshotInsightRepository snapshotInsightRepository,
                           SnapshotKeywordRepository snapshotKeywordRepository,
                           SourceItemRepository sourceItemRepository,
                           ReportRepository reportRepository,
                           UserRepository userRepository,
                           UserSubscriptionRepository userSubscriptionRepository,
                           PlanRepository planRepository,
                           SearchProviderRepository searchProviderRepository,
                           ProviderOrchestrator providerOrchestrator) {
        this.searchQueryRepository = searchQueryRepository;
        this.analysisSnapshotRepository = analysisSnapshotRepository;
        this.snapshotInsightRepository = snapshotInsightRepository;
        this.snapshotKeywordRepository = snapshotKeywordRepository;
        this.sourceItemRepository = sourceItemRepository;
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
        this.userSubscriptionRepository = userSubscriptionRepository;
        this.planRepository = planRepository;
        this.searchProviderRepository = searchProviderRepository;
        this.providerOrchestrator = providerOrchestrator;
    }

    public FrontendDtos.DashboardResponse getDashboard() {
        List<SearchQueryEntity> recentQueries = searchQueryRepository.findAll().stream()
                .sorted(Comparator.comparing(SearchQueryEntity::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .limit(3)
                .toList();

        return new FrontendDtos.DashboardResponse(
                List.of(
                        new FrontendDtos.KpiItem("Documents", String.valueOf(reportRepository.count())),
                        new FrontendDtos.KpiItem("Insights", String.valueOf(snapshotInsightRepository.count())),
                        new FrontendDtos.KpiItem("Reports", String.valueOf(reportRepository.count()))
                ),
                recentQueries.stream()
                        .map(query -> new FrontendDtos.RecentItem(
                                query.getId().toString(),
                                query.getKeyword(),
                                query.getCreatedAt() != null ? query.getCreatedAt().toString() : LocalDateTime.now().toString()
                        ))
                        .toList()
        );
    }

    public FrontendDtos.AccountOverviewResponse getAccountOverview() {
        UserEntity user = preferredUser();
        Optional<UserSubscriptionEntity> subscription = userSubscriptionRepository.findFirstByUserAndStatusOrderByStartDateDesc(user, "ACTIVE");
        PlanEntity plan = subscription.map(UserSubscriptionEntity::getPlan).orElseGet(() ->
                planRepository.findByName("FREE").orElse(null)
        );

        long queryCount = searchQueryRepository.countByUser(user);
        long reportCount = reportRepository.countByUserId(user.getId());

        return new FrontendDtos.AccountOverviewResponse(
                new FrontendDtos.Profile(user.getFullName(), user.getEmail(), "SkimAI Labs"),
                List.of(
                        new FrontendDtos.UsageItem("API Calls", Math.min(95, (int) queryCount * 18 + 24)),
                        new FrontendDtos.UsageItem("Storage", Math.min(95, (int) reportCount * 22 + 18)),
                        new FrontendDtos.UsageItem("Team Seats", "BUSINESS".equalsIgnoreCase(plan != null ? plan.getName() : "") ? 80 : 30)
                ),
                List.of(
                        new FrontendDtos.InvoiceItem("inv_031", "2026-03-01", money(plan), "paid"),
                        new FrontendDtos.InvoiceItem("inv_030", "2026-02-01", money(plan), "paid")
                ),
                new LinkedHashMap<>(notificationSettings.get())
        );
    }

    @Transactional
    public Map<String, Boolean> saveNotificationSettings(Map<String, Boolean> settings) {
        Map<String, Boolean> normalized = new LinkedHashMap<>();
        normalized.put("emailUpdates", Boolean.TRUE.equals(settings.get("emailUpdates")));
        normalized.put("weeklyReport", Boolean.TRUE.equals(settings.get("weeklyReport")));
        normalized.put("usageAlerts", Boolean.TRUE.equals(settings.get("usageAlerts")));
        notificationSettings.set(normalized);
        return normalized;
    }

    public FrontendDtos.AnalysisResponse getAnalysis(String keyword) {
        List<NormalizedSourceItem> liveItems = fetchLiveSources(keyword);
        if (!liveItems.isEmpty()) {
            return buildLiveAnalysis(keyword, liveItems);
        }

        SearchQueryEntity query = findQueryByKeyword(keyword).orElseGet(() -> fallbackQuery(keyword));
        AnalysisSnapshotEntity snapshot = analysisSnapshotRepository.findBySearchQueryId(query.getId()).orElse(null);

        List<String> insights = snapshot != null
                ? snapshotInsightRepository.findBySnapshotId(snapshot.getId()).stream().map(item -> item.getContent()).limit(4).toList()
                : List.of();

        List<String> keywords = snapshot != null
                ? snapshotKeywordRepository.findBySnapshotId(snapshot.getId()).stream()
                .sorted(Comparator.comparing(SnapshotKeywordEntity::getMentionCount).reversed())
                .map(SnapshotKeywordEntity::getKeyword)
                .limit(4)
                .toList()
                : List.of();

        List<String> news = sourceItemRepository.findBySearchQueryId(query.getId()).stream()
                .map(SourceItemEntity::getTitle)
                .filter(title -> title != null && !title.isBlank())
                .limit(3)
                .toList();

        return new FrontendDtos.AnalysisResponse(
                query.getKeyword(),
                query.getId().toString(),
                snapshot != null ? snapshot.getId().toString() : null,
                insights.isEmpty() ? List.of(
                        "Search volume spikes around peak browsing windows.",
                        "Demand appears strongest in SME and ecommerce segments.",
                        "Positive sentiment clusters around automation benefits.",
                        "Comparison-oriented searches are rising this week."
                ) : insights,
                keywords.isEmpty() ? List.of("agent workflow", "marketing automation", "insight dashboard", "keyword trend") : keywords,
                news.isEmpty() ? List.of(
                        "Recent public content is still limited for this keyword.",
                        "Expand source coverage to improve depth."
                ) : news,
                List.of("Compare competitors", "Forecast demand", "Analyze top keywords", "Audience insights")
        );
    }

    public FrontendDtos.DeepInsightResponse getDeepInsight(FrontendDtos.DeepInsightRequest request) {
        FrontendDtos.AnalysisResponse analysis = getAnalysis(request.keyword());
        return new FrontendDtos.DeepInsightResponse(
                analysis.keyword(),
                request.source(),
                "Market demand is clustering around practical use cases, creator comparisons, and performance signals.",
                analysis.relatedKeywords().stream()
                        .limit(4)
                        .map(value -> "Push deeper content around \"" + value + "\" in the next sprint.")
                        .toList(),
                "Prioritize the fastest-growing demand cluster and track creator momentum week over week."
        );
    }

    public List<FrontendDtos.ExpertItem> getExperts() {
        return List.of(
                new FrontendDtos.ExpertItem("e1", "Ngoc Bui", "Market Strategy", 4.9, 20),
                new FrontendDtos.ExpertItem("e2", "Tuan Ho", "Consumer Insight", 4.8, 18),
                new FrontendDtos.ExpertItem("e3", "Trang Le", "Growth Planning", 4.7, 22)
        );
    }

    public FrontendDtos.ExpertQuestionResponse submitExpertQuestion(FrontendDtos.ExpertQuestionRequest request) {
        return new FrontendDtos.ExpertQuestionResponse(
                "ticket_" + System.currentTimeMillis(),
                "queued",
                12,
                LocalDateTime.now().toString()
        );
    }

    public List<FrontendDtos.PricingPlan> getPricing() {
        return planRepository.findAll().stream()
                .map(plan -> new FrontendDtos.PricingPlan(
                        plan.getName().toLowerCase(Locale.ROOT),
                        titleCase(plan.getName()),
                        plan.getPrice() != null ? plan.getPrice().intValue() : 0,
                        plan.getPrice() != null ? plan.getPrice().multiply(java.math.BigDecimal.TEN).intValue() : 0,
                        List.of(
                                (plan.getSearchLimit() != null && plan.getSearchLimit() >= 9999 ? "Unlimited" : plan.getSearchLimit()) + " searches/month",
                                (plan.getExportLimit() != null && plan.getExportLimit() >= 999 ? "Unlimited" : plan.getExportLimit()) + " exports/month",
                                plan.getDescription() != null ? plan.getDescription() : "Flexible plan"
                        )
                ))
                .toList();
    }

    private List<NormalizedSourceItem> fetchLiveSources(String keyword) {
        List<SearchProviderEntity> activeProviders = searchProviderRepository.findByIsActiveTrue();
        Set<String> activeCodes = activeProviders.stream()
                .map(SearchProviderEntity::getProviderCode)
                .collect(Collectors.toSet());
        if (activeCodes.isEmpty()) {
            return List.of();
        }
        return providerOrchestrator.aggregate(activeCodes, keyword, "US", "en", "7d");
    }

    private FrontendDtos.AnalysisResponse buildLiveAnalysis(String keyword, List<NormalizedSourceItem> items) {
        List<String> insights = items.stream()
                .map(item -> firstMeaningfulText(item.snippet(), item.title()))
                .filter(text -> text != null && !text.isBlank())
                .distinct()
                .limit(4)
                .toList();

        List<String> news = items.stream()
                .map(NormalizedSourceItem::title)
                .filter(title -> title != null && !title.isBlank())
                .distinct()
                .limit(4)
                .toList();

        Map<String, Integer> tokenCount = new HashMap<>();
        for (NormalizedSourceItem item : items) {
            for (String token : tokenize(item.title())) {
                tokenCount.merge(token, 1, Integer::sum);
            }
            for (String token : tokenize(item.snippet())) {
                tokenCount.merge(token, 1, Integer::sum);
            }
        }

        Set<String> stopWords = new HashSet<>(List.of(
                "about", "after", "agent", "bike", "with", "from", "this", "that", "have", "your",
                "what", "when", "where", "which", "into", "they", "them", "more", "than", "then",
                "youtube", "video", "market", "analysis", "trend", "trends", "news", "views", "likes",
                "comments", "duration", "topics", "search", "result"
        ));

        List<String> relatedKeywords = tokenCount.entrySet().stream()
                .filter(entry -> entry.getKey().length() >= 4)
                .filter(entry -> !stopWords.contains(entry.getKey()))
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .map(Map.Entry::getKey)
                .distinct()
                .limit(4)
                .toList();

        long positive = items.stream().filter(item -> "POSITIVE".equalsIgnoreCase(item.sentimentLabel())).count();
        long negative = items.stream().filter(item -> "NEGATIVE".equalsIgnoreCase(item.sentimentLabel())).count();

        List<String> suggestedActions = new ArrayList<>();
        suggestedActions.add("Compare creator momentum");
        suggestedActions.add("Track related intent keywords");
        suggestedActions.add(positive >= negative ? "Double down on positive demand signals" : "Investigate negative sentiment sources");
        suggestedActions.add("Review top YouTube narratives");

        return new FrontendDtos.AnalysisResponse(
                keyword == null || keyword.isBlank() ? "AI Agent" : keyword,
                null,
                null,
                insights.isEmpty() ? List.of("No live insight found for this keyword yet.") : insights,
                relatedKeywords.isEmpty() ? List.of("demand", "review", "trend", "comparison") : relatedKeywords,
                news.isEmpty() ? List.of("No recent public content found for this keyword.") : news,
                suggestedActions.stream().distinct().limit(4).toList()
        );
    }

    private List<String> tokenize(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        return List.of(value.toLowerCase(Locale.ROOT).split("\\s+")).stream()
                .map(token -> token.replaceAll("[^a-z0-9]", ""))
                .filter(token -> !token.isBlank())
                .toList();
    }

    private String firstMeaningfulText(String primary, String fallback) {
        if (primary != null && !primary.isBlank()) {
            return primary.length() <= 180 ? primary : primary.substring(0, 180);
        }
        if (fallback != null && !fallback.isBlank()) {
            return fallback.length() <= 180 ? fallback : fallback.substring(0, 180);
        }
        return null;
    }

    private Optional<SearchQueryEntity> findQueryByKeyword(String keyword) {
        String normalized = keyword == null ? "" : keyword.trim().toLowerCase(Locale.ROOT);
        return searchQueryRepository.findAll().stream()
                .filter(item -> item.getKeyword() != null && item.getKeyword().trim().toLowerCase(Locale.ROOT).equals(normalized))
                .findFirst();
    }

    private SearchQueryEntity fallbackQuery(String keyword) {
        return SearchQueryEntity.builder()
                .id(UUID.randomUUID())
                .keyword(keyword == null || keyword.isBlank() ? "AI Agent" : keyword)
                .createdAt(LocalDateTime.now())
                .build();
    }

    private UserEntity preferredUser() {
        return userRepository.findByEmail("demo@skimai.local")
                .or(() -> userRepository.findByEmail("user@test.com"))
                .orElseGet(() -> userRepository.findAll().stream().findFirst().orElseGet(() ->
                        UserEntity.builder()
                                .id(UUID.randomUUID())
                                .fullName("Demo User")
                                .email("demo@skimai.local")
                                .role("USER")
                                .status("ACTIVE")
                                .build()
                ));
    }

    private String money(PlanEntity plan) {
        int amount = plan != null && plan.getPrice() != null ? plan.getPrice().intValue() : 0;
        return "$" + amount;
    }

    private String titleCase(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String lower = value.toLowerCase(Locale.ROOT);
        return Character.toUpperCase(lower.charAt(0)) + lower.substring(1);
    }
}
