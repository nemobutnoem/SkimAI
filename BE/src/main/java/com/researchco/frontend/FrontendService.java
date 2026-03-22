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
import com.researchco.provider.ai.AiProvider;
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
    private final AiProvider aiProvider;
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
                           ProviderOrchestrator providerOrchestrator,
                           AiProvider aiProvider) {
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
        this.aiProvider = aiProvider;
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

        List<FrontendDtos.KeywordMetric> keywords = snapshot != null
                ? snapshotKeywordRepository.findBySnapshotId(snapshot.getId()).stream()
                .sorted(Comparator.comparing(SnapshotKeywordEntity::getMentionCount).reversed())
                .limit(4)
                .map(sk -> new FrontendDtos.KeywordMetric(sk.getKeyword(), sk.getMentionCount(), 0L, 0L, 0L, 0.0))
                .toList()
                : List.of();

        List<String> news = sourceItemRepository.findBySearchQueryId(query.getId()).stream()
                .map(SourceItemEntity::getTitle)
                .filter(title -> title != null && !title.isBlank())
                .limit(3)
                .toList();

        String kw = query.getKeyword();
        List<FrontendDtos.InsightItem> fallbackInsights = List.of(
                new FrontendDtos.InsightItem("Trend Insight", "Search interest for \"" + kw + "\" is showing steady activity. Consumer attention typically peaks during key seasonal windows."),
                new FrontendDtos.InsightItem("Media Signal", "Limited media coverage detected for \"" + kw + "\". Expanding source coverage may reveal additional market signals."),
                new FrontendDtos.InsightItem("Social Sentiment", "Sentiment data for \"" + kw + "\" is still being collected. Initial signals suggest neutral-to-positive reception."),
                new FrontendDtos.InsightItem("Keyword Opportunity", "Related keyword data for \"" + kw + "\" is limited. Consider broadening search scope to uncover emerging opportunities.")
        );

        return new FrontendDtos.AnalysisResponse(
                kw,
                query.getId().toString(),
                snapshot != null ? snapshot.getId().toString() : null,
                fallbackInsights,
                keywords.isEmpty() ? List.of(
                        new FrontendDtos.KeywordMetric("agent workflow", 0, 0L, 0L, 0L, 0.0),
                        new FrontendDtos.KeywordMetric("marketing automation", 0, 0L, 0L, 0L, 0.0),
                        new FrontendDtos.KeywordMetric("insight dashboard", 0, 0L, 0L, 0L, 0.0),
                        new FrontendDtos.KeywordMetric("keyword trend", 0, 0L, 0L, 0L, 0.0)
                ) : keywords,
                news.isEmpty() ? List.of(
                        "Recent public content is still limited for this keyword.",
                        "Expand source coverage to improve depth."
                ) : news,
                List.of("Compare competitors", "Forecast demand", "Analyze top keywords", "Audience insights")
        );
    }

    public FrontendDtos.DeepInsightResponse getDeepInsight(FrontendDtos.DeepInsightRequest request) {
        FrontendDtos.AnalysisResponse analysis = getAnalysis(request.keyword());
        return aiProvider.generateDeepInsight(analysis, request.source());
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
        System.out.println("[DEBUG] Active providers: " + activeCodes + " for keyword=\"" + keyword + "\"");
        if (activeCodes.isEmpty()) {
            System.out.println("[DEBUG] No active providers found!");
            return List.of();
        }
        List<NormalizedSourceItem> results = providerOrchestrator.aggregate(activeCodes, keyword, "US", "en", "7d");
        System.out.println("[DEBUG] YouTube returned " + results.size() + " items for keyword=\"" + keyword + "\"");
        return results;
    }

    private FrontendDtos.AnalysisResponse buildLiveAnalysis(String keyword, List<NormalizedSourceItem> items) {
        String kw = keyword == null || keyword.isBlank() ? "AI Agent" : keyword;

        // Aggregate total metrics across all items
        long totalViews = 0L;
        long totalLikes = 0L;
        long totalComments = 0L;
        double totalEngagement = 0.0;
        Set<String> channels = new HashSet<>();
        long positive = 0;
        long negative = 0;
        long neutral = 0;

        for (NormalizedSourceItem item : items) {
            if (item.rawPayload() instanceof Map<?, ?> payload) {
                totalViews += toLong(payload.get("viewCount"));
                totalLikes += toLong(payload.get("likeCount"));
                totalComments += toLong(payload.get("commentCount"));
                totalEngagement += toDouble(payload.get("engagementRate"));
            }
            if (item.sourceName() != null && !item.sourceName().isBlank()) {
                channels.add(item.sourceName());
            }
            String sentiment = item.sentimentLabel();
            if ("POSITIVE".equalsIgnoreCase(sentiment)) positive++;
            else if ("NEGATIVE".equalsIgnoreCase(sentiment)) negative++;
            else neutral++;
        }

        double avgEngagement = items.isEmpty() ? 0.0 : totalEngagement / items.size();
        String engagementPct = String.format("%.2f", avgEngagement * 100);

        // 1 — Trend Insight
        String trendText = String.format(
                "Across %d videos analyzed, \"%s\" generated %s total views with an average engagement rate of %s%%. %s",
                items.size(), kw, formatCompact(totalViews), engagementPct,
                totalViews > 100000
                        ? "This indicates strong and growing consumer interest."
                        : "The topic is emerging — early positioning could capture rising demand."
        );

        // 2 — Media Signal
        String topChannels = channels.stream().limit(3).collect(Collectors.joining(", "));
        String mediaText = String.format(
                "Content about \"%s\" is actively produced by %d creator(s) including %s. %s",
                kw, channels.size(), topChannels.isEmpty() ? "various channels" : topChannels,
                channels.size() >= 3
                        ? "A competitive content landscape suggests high market relevance."
                        : "Limited creator coverage presents an opportunity for early market voice."
        );

        // 3 — Social Sentiment
        long totalSentiment = positive + negative + neutral;
        int positiveRate = totalSentiment > 0 ? (int) (positive * 100 / totalSentiment) : 0;
        int negativeRate = totalSentiment > 0 ? (int) (negative * 100 / totalSentiment) : 0;
        String sentimentText = String.format(
                "%d%% positive and %d%% negative sentiment detected across %s likes and %s comments. %s",
                positiveRate, negativeRate, formatCompact(totalLikes), formatCompact(totalComments),
                positiveRate >= 60
                        ? "Overall reception is favorable — strong foundation for market entry."
                        : positiveRate >= 30
                                ? "Mixed signals detected — deeper competitor analysis recommended."
                                : "Caution advised — negative sentiment may indicate market friction."
        );

        // 4 — Keyword Opportunity (build keywords first)
        Map<String, int[]> tokenStats = new HashMap<>();
        for (NormalizedSourceItem item : items) {
            long itemViews = 0L;
            long itemLikes = 0L;
            long itemComments = 0L;
            double itemEngagement = 0.0;
            if (item.rawPayload() instanceof Map<?, ?> payload) {
                itemViews = toLong(payload.get("viewCount"));
                itemLikes = toLong(payload.get("likeCount"));
                itemComments = toLong(payload.get("commentCount"));
                itemEngagement = toDouble(payload.get("engagementRate"));
            }
            Set<String> tokens = new HashSet<>();
            tokens.addAll(tokenize(item.title()));
            String cleanDesc = cleanSnippet(item.snippet(), "");
            if (cleanDesc != null) {
                tokens.addAll(tokenize(cleanDesc));
            }
            for (String token : tokens) {
                tokenStats.computeIfAbsent(token, k -> new int[5]);
                int[] stats = tokenStats.get(token);
                stats[0]++;
                stats[1] += (int) itemViews;
                stats[2] += (int) itemLikes;
                stats[3] += (int) itemComments;
                stats[4] += (int) (itemEngagement * 10000);
            }
        }

        Set<String> stopWords = new HashSet<>(List.of(
                "about", "after", "agent", "with", "from", "this", "that", "have", "your",
                "what", "when", "where", "which", "into", "they", "them", "more", "than", "then",
                "youtube", "video", "market", "analysis", "trend", "trends", "news",
                "comments", "duration", "topics", "search", "result", "views", "likes",
                "subscribers", "tags", "best", "review", "2024", "2025", "2026"
        ));
        String keywordLower = kw.trim().toLowerCase(Locale.ROOT);

        List<FrontendDtos.KeywordMetric> relatedKeywords = tokenStats.entrySet().stream()
                .filter(entry -> entry.getKey().length() >= 4)
                .filter(entry -> !stopWords.contains(entry.getKey()))
                .filter(entry -> !entry.getKey().equals(keywordLower))
                .sorted((a, b) -> Integer.compare(b.getValue()[0], a.getValue()[0]))
                .limit(6)
                .map(entry -> {
                    int[] s = entry.getValue();
                    double avgEng = s[0] > 0 ? (s[4] / 10000.0) / s[0] : 0.0;
                    return new FrontendDtos.KeywordMetric(entry.getKey(), s[0], (long) s[1], (long) s[2], (long) s[3], avgEng);
                })
                .toList();

        String topKws = relatedKeywords.stream().limit(3).map(FrontendDtos.KeywordMetric::keyword)
                .map(k -> "\"" + k + "\"")
                .collect(Collectors.joining(", "));
        String kwOpportunityText = relatedKeywords.isEmpty()
                ? "No strong related keyword signals detected yet for \"" + kw + "\". Consider broadening the search scope."
                : String.format(
                        "Trending related keywords %s show high co-occurrence with \"%s\", indicating expanding market segments worth targeting.",
                        topKws, kw
                );

        List<FrontendDtos.InsightItem> insights = List.of(
                new FrontendDtos.InsightItem("Trend Insight", trendText),
                new FrontendDtos.InsightItem("Media Signal", mediaText),
                new FrontendDtos.InsightItem("Social Sentiment", sentimentText),
                new FrontendDtos.InsightItem("Keyword Opportunity", kwOpportunityText)
        );

        List<String> news = items.stream()
                .map(NormalizedSourceItem::title)
                .filter(title -> title != null && !title.isBlank())
                .distinct()
                .limit(4)
                .toList();

        List<String> suggestedActions = new ArrayList<>();
        suggestedActions.add("Compare creator momentum");
        suggestedActions.add("Track related intent keywords");
        suggestedActions.add(positive >= negative ? "Double down on positive demand signals" : "Investigate negative sentiment sources");
        suggestedActions.add("Review top YouTube narratives");

        return new FrontendDtos.AnalysisResponse(
                kw,
                null,
                null,
                insights,
                relatedKeywords.isEmpty() ? List.of(
                        new FrontendDtos.KeywordMetric("demand", 0, 0L, 0L, 0L, 0.0),
                        new FrontendDtos.KeywordMetric("review", 0, 0L, 0L, 0L, 0.0),
                        new FrontendDtos.KeywordMetric("trend", 0, 0L, 0L, 0L, 0.0),
                        new FrontendDtos.KeywordMetric("comparison", 0, 0L, 0L, 0L, 0.0)
                ) : relatedKeywords,
                news.isEmpty() ? List.of("No recent public content found for this keyword.") : news,
                suggestedActions.stream().distinct().limit(4).toList()
        );
    }

    private List<String> tokenize(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        return List.of(value.toLowerCase(Locale.ROOT).split("\\s+")).stream()
                .filter(token -> !token.startsWith("http"))
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

    private String cleanSnippet(String snippet, String titleFallback) {
        String text = snippet;
        if (text != null) {
            if (text.contains(" ; views=")) {
                text = text.substring(0, text.indexOf(" ; views="));
            } else if (text.startsWith("views=")) {
                text = "";
            }
        }
        if (text != null && !text.isBlank()) {
            return text.length() <= 250 ? text : text.substring(0, 250) + "...";
        }
        if (titleFallback != null && !titleFallback.isBlank()) {
            return titleFallback.length() <= 250 ? titleFallback : titleFallback.substring(0, 250) + "...";
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

    private long toLong(Object value) {
        if (value instanceof Number n) {
            return n.longValue();
        }
        if (value instanceof String s) {
            try { return Long.parseLong(s); } catch (NumberFormatException ignored) {}
        }
        return 0L;
    }

    private double toDouble(Object value) {
        if (value instanceof Number n) {
            return n.doubleValue();
        }
        if (value instanceof String s) {
            try { return Double.parseDouble(s); } catch (NumberFormatException ignored) {}
        }
        return 0.0;
    }

    private String formatCompact(long value) {
        if (value >= 1_000_000) {
            return String.format("%.1fM", value / 1_000_000.0);
        }
        if (value >= 1_000) {
            return String.format("%.1fK", value / 1_000.0);
        }
        return String.valueOf(value);
    }
}
