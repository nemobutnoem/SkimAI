package com.researchco.frontend;

import com.researchco.plan.PlanEntity;
import com.researchco.plan.PlanRepository;
import com.researchco.common.AppException;
import com.researchco.payment.PaymentTransactionEntity;
import com.researchco.payment.PaymentTransactionRepository;
import com.researchco.provider.NormalizedSourceItem;
import com.researchco.provider.ProviderOrchestrator;
import com.researchco.provider.SearchProviderEntity;
import com.researchco.provider.SearchProviderRepository;
import com.researchco.report.ReportRepository;
import com.researchco.search.SearchQueryEntity;
import com.researchco.search.SearchQueryRepository;
import com.researchco.search.SourceItemEntity;
import com.researchco.search.SourceItemRepository;
import com.researchco.sales.SalesLeadEntity;
import com.researchco.sales.SalesLeadRepository;
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
import com.researchco.security.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
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
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final SearchProviderRepository searchProviderRepository;
    private final SalesLeadRepository salesLeadRepository;
    private final ProviderOrchestrator providerOrchestrator;
    private final AiProvider aiProvider;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final String stripeSecretKey;
    private final String frontendBaseUrl;
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
                           PaymentTransactionRepository paymentTransactionRepository,
                           SearchProviderRepository searchProviderRepository,
                           SalesLeadRepository salesLeadRepository,
                           ProviderOrchestrator providerOrchestrator,
                           AiProvider aiProvider,
                           ObjectMapper objectMapper,
                           @Value("${integration.stripe.secret-key:}") String stripeSecretKey,
                           @Value("${app.frontend-base-url:http://localhost:5173}") String frontendBaseUrl) {
        this.searchQueryRepository = searchQueryRepository;
        this.analysisSnapshotRepository = analysisSnapshotRepository;
        this.snapshotInsightRepository = snapshotInsightRepository;
        this.snapshotKeywordRepository = snapshotKeywordRepository;
        this.sourceItemRepository = sourceItemRepository;
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
        this.userSubscriptionRepository = userSubscriptionRepository;
        this.planRepository = planRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.searchProviderRepository = searchProviderRepository;
        this.salesLeadRepository = salesLeadRepository;
        this.providerOrchestrator = providerOrchestrator;
        this.aiProvider = aiProvider;
        this.objectMapper = objectMapper;
        this.stripeSecretKey = stripeSecretKey;
        this.frontendBaseUrl = frontendBaseUrl;
    }

    public FrontendDtos.DashboardResponse getDashboard() {
        UserEntity user = preferredUser();
        List<SearchQueryEntity> recentQueries = searchQueryRepository.findTop10ByUserOrderByCreatedAtDesc(user);

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
        List<FrontendDtos.InvoiceItem> invoices = paymentTransactionRepository.findByUserOrderByCreatedAtDesc(user).stream()
                .limit(3)
                .map(tx -> new FrontendDtos.InvoiceItem(
                        "inv_" + tx.getId().toString().substring(0, 8),
                        tx.getCreatedAt() != null ? tx.getCreatedAt().toLocalDate().toString() : LocalDateTime.now().toLocalDate().toString(),
                        "$" + tx.getAmount().intValue(),
                        displayPaymentStatus(tx.getStatus())
                ))
                .toList();
        UserSubscriptionEntity currentSubscription = subscription.orElse(null);
        String renewsAt = currentSubscription != null && currentSubscription.getEndDate() != null
                ? currentSubscription.getEndDate().toString()
                : null;
        String billingCycle = currentSubscription != null && currentSubscription.getEndDate() != null && currentSubscription.getStartDate() != null
                && currentSubscription.getEndDate().isAfter(currentSubscription.getStartDate().plusMonths(11))
                ? "yearly"
                : "monthly";

        return new FrontendDtos.AccountOverviewResponse(
                new FrontendDtos.Profile(user.getFullName(), user.getEmail(), "SkimAI Labs"),
                new FrontendDtos.CurrentSubscription(
                        plan != null ? plan.getName().toLowerCase(Locale.ROOT) : "free",
                        titleCase(plan != null ? plan.getName() : "FREE"),
                        currentSubscription != null ? currentSubscription.getStatus() : "ACTIVE",
                        billingCycle,
                        renewsAt
                ),
                List.of(
                        new FrontendDtos.UsageItem("API Calls", Math.min(95, (int) queryCount * 18 + 24)),
                        new FrontendDtos.UsageItem("Storage", Math.min(95, (int) reportCount * 22 + 18)),
                        new FrontendDtos.UsageItem("Team Seats", "ENTERPRISE".equalsIgnoreCase(plan != null ? plan.getName() : "") ? 80 : 30)
                ),
                invoices,
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

    @Transactional
    public FrontendDtos.AnalysisResponse getAnalysis(String keyword) {
        LocaleProfile localeProfile = resolveLocaleProfile(keyword);
        SearchQueryEntity trackedQuery = recordSearchActivity(keyword, localeProfile);
        List<NormalizedSourceItem> liveItems = fetchLiveSources(keyword);
        if (!liveItems.isEmpty()) {
            return buildLiveAnalysis(trackedQuery, keyword, liveItems);
        }

        SearchQueryEntity query = trackedQuery != null ? trackedQuery : findQueryByKeyword(keyword).orElseGet(() -> fallbackQuery(keyword));
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
                availableAnalysisSources(),
                fallbackInsights,
                keywords,
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
        UserEntity user = preferredUser();
        String currentPlanId = userSubscriptionRepository.findFirstByUserAndStatusOrderByStartDateDesc(user, "ACTIVE")
                .map(UserSubscriptionEntity::getPlan)
                .map(PlanEntity::getName)
                .map(name -> name.toLowerCase(Locale.ROOT))
                .orElse("free");

        return planRepository.findAll().stream()
                .filter(plan -> List.of("FREE", "STARTER", "TEAM", "ENTERPRISE").contains(plan.getName().toUpperCase(Locale.ROOT)))
                .sorted(Comparator.comparingInt(plan -> planTier(plan.getName())))
                .map(plan -> new FrontendDtos.PricingPlan(
                        plan.getName().toLowerCase(Locale.ROOT),
                        titleCase(plan.getName()),
                        priceLabel(plan.getPrice()),
                        priceLabel(plan.getPrice() != null ? plan.getPrice().multiply(new BigDecimal("10")) : BigDecimal.ZERO),
                        pricingFeatures(plan),
                        plan.getName().equalsIgnoreCase(currentPlanId),
                        plan.getName().equalsIgnoreCase(currentPlanId) ? "Current plan" :
                                "ENTERPRISE".equalsIgnoreCase(plan.getName()) ? "Contact sales" : "Start now"
                ))
                .toList();
    }

    @Transactional
    public FrontendDtos.PricingCheckoutResponse checkout(FrontendDtos.PricingCheckoutRequest request) {
        String planId = request.planId() == null ? "" : request.planId().trim().toUpperCase(Locale.ROOT);
        String cycle = normalizeBillingCycle(request.billingCycle());
        PlanEntity plan = planRepository.findByName(planId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Plan not found"));

        if ("ENTERPRISE".equalsIgnoreCase(plan.getName())) {
            return new FrontendDtos.PricingCheckoutResponse(
                    "redirect_to_sales",
                    "Enterprise plan requires a sales consultation before activation.",
                    plan.getName().toLowerCase(Locale.ROOT),
                    titleCase(plan.getName()),
                    cycle,
                    null,
                    moneyForCycle(plan, cycle),
                    null,
                    null,
                    null
            );
        }

        if (stripeSecretKey == null || stripeSecretKey.isBlank()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Stripe secret key is missing. Add STRIPE_SECRET_KEY before using checkout.");
        }

        UserEntity user = preferredUser();
        PaymentTransactionEntity payment = PaymentTransactionEntity.builder()
                .user(user)
                .plan(plan)
                .billingCycle(cycle)
                .provider("STRIPE")
                .amount(resolveAmount(plan, cycle))
                .status("PENDING")
                .build();
        payment = paymentTransactionRepository.save(payment);

        StripeCheckoutSession session = createStripeCheckoutSession(payment);
        payment.setProviderSessionId(session.id());
        payment.setCheckoutUrl(session.url());
        paymentTransactionRepository.save(payment);

        return new FrontendDtos.PricingCheckoutResponse(
                "pending_payment",
                "Checkout session created. Redirecting to secure payment.",
                plan.getName().toLowerCase(Locale.ROOT),
                titleCase(plan.getName()),
                cycle,
                "inv_" + payment.getId().toString().substring(0, 8),
                moneyForCycle(plan, cycle),
                null,
                session.url(),
                session.id()
        );
    }

    public FrontendDtos.SalesContactResponse contactSales(FrontendDtos.SalesContactRequest request) {
        if (request.contactName() == null || request.contactName().isBlank()
                || request.workEmail() == null || request.workEmail().isBlank()
                || request.companyName() == null || request.companyName().isBlank()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Please complete contact name, work email, and company name.");
        }

        String cycle = normalizeBillingCycle(request.billingCycle());
        SalesLeadEntity lead = salesLeadRepository.save(SalesLeadEntity.builder()
                .contactName(request.contactName().trim())
                .workEmail(request.workEmail().trim().toLowerCase(Locale.ROOT))
                .companyName(request.companyName().trim())
                .teamSize(request.teamSize())
                .billingCycle(cycle)
                .planName("ENTERPRISE")
                .note(request.note())
                .status("NEW")
                .build());

        String leadId = "lead_" + System.currentTimeMillis();
        return new FrontendDtos.SalesContactResponse(
                "queued",
                leadId,
                "Enterprise sales request received for the " + cycle + " billing cycle. Our team will contact you shortly.",
                "Enterprise",
                lead.getCompanyName()
        );
    }

    @Transactional
    public FrontendDtos.PricingCheckoutResponse confirmCheckout(FrontendDtos.PricingCheckoutConfirmRequest request) {
        if (request.providerSessionId() == null || request.providerSessionId().isBlank()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Missing provider session id");
        }
        PaymentTransactionEntity payment = paymentTransactionRepository.findByProviderSessionId(request.providerSessionId())
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Payment session not found"));

        StripeSessionStatus session = fetchStripeSessionStatus(request.providerSessionId());
        if (!"paid".equalsIgnoreCase(session.paymentStatus())) {
            payment.setStatus("CANCELLED".equalsIgnoreCase(payment.getStatus()) ? payment.getStatus() : "PENDING");
            paymentTransactionRepository.save(payment);
            return new FrontendDtos.PricingCheckoutResponse(
                    "pending_payment",
                    "Payment has not been completed yet.",
                    payment.getPlan().getName().toLowerCase(Locale.ROOT),
                    titleCase(payment.getPlan().getName()),
                    payment.getBillingCycle(),
                "inv_" + payment.getId().toString().substring(0, 8),
                "$" + priceLabel(payment.getAmount()),
                null,
                null,
                payment.getProviderSessionId()
            );
        }

        if (!"PAID".equalsIgnoreCase(payment.getStatus())) {
            LocalDateTime now = LocalDateTime.now();
            List<UserSubscriptionEntity> activeSubscriptions = userSubscriptionRepository.findByUserAndStatus(payment.getUser(), "ACTIVE");
            for (UserSubscriptionEntity active : activeSubscriptions) {
                active.setStatus("ENDED");
                active.setEndDate(now);
            }
            userSubscriptionRepository.saveAll(activeSubscriptions);

            LocalDateTime renewsAt = "yearly".equals(payment.getBillingCycle()) ? now.plusYears(1) : now.plusMonths(1);
            UserSubscriptionEntity nextSubscription = UserSubscriptionEntity.builder()
                    .user(payment.getUser())
                    .plan(payment.getPlan())
                    .status("ACTIVE")
                    .startDate(now)
                    .endDate(renewsAt)
                    .build();
            userSubscriptionRepository.save(nextSubscription);

            payment.setStatus("PAID");
            payment.setCompletedAt(now);
            paymentTransactionRepository.save(payment);
        }

        LocalDateTime renewsAt = "yearly".equals(payment.getBillingCycle())
                ? payment.getCompletedAt().plusYears(1)
                : payment.getCompletedAt().plusMonths(1);
        return new FrontendDtos.PricingCheckoutResponse(
                "success",
                titleCase(payment.getPlan().getName()) + " plan activated successfully.",
                payment.getPlan().getName().toLowerCase(Locale.ROOT),
                titleCase(payment.getPlan().getName()),
                payment.getBillingCycle(),
                "inv_" + payment.getId().toString().substring(0, 8),
                "$" + priceLabel(payment.getAmount()),
                renewsAt.toString(),
                null,
                payment.getProviderSessionId()
        );
    }

    private List<NormalizedSourceItem> fetchLiveSources(String keyword) {
        LocaleProfile localeProfile = resolveLocaleProfile(keyword);
        List<SearchProviderEntity> activeProviders = searchProviderRepository.findByIsActiveTrue();
        Set<String> activeCodes = activeProviders.stream()
                .map(SearchProviderEntity::getProviderCode)
                .collect(Collectors.toSet());
        System.out.println("[DEBUG] Active providers: " + activeCodes + " for keyword=\"" + keyword + "\"");
        if (activeCodes.isEmpty()) {
            System.out.println("[DEBUG] No active providers found!");
            return List.of();
        }
        List<NormalizedSourceItem> results = providerOrchestrator.aggregate(
                activeCodes,
                keyword,
                localeProfile.countryCode(),
                localeProfile.languageCode(),
                "7d"
        );
        System.out.println("[DEBUG] Aggregated " + results.size() + " items for keyword=\"" + keyword + "\" with locale "
                + localeProfile.countryCode() + "/" + localeProfile.languageCode());
        return results;
    }

    private FrontendDtos.AnalysisResponse buildLiveAnalysis(SearchQueryEntity trackedQuery, String keyword, List<NormalizedSourceItem> items) {
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
                trackedQuery != null ? trackedQuery.getId().toString() : null,
                null,
                availableAnalysisSources(),
                insights,
                relatedKeywords,
                news.isEmpty() ? List.of("No recent public content found for this keyword.") : news,
                suggestedActions.stream().distinct().limit(4).toList()
        );
    }

    private SearchQueryEntity recordSearchActivity(String keyword, LocaleProfile localeProfile) {
        UserEntity user = preferredUser();
        String normalizedKeyword = (keyword == null || keyword.isBlank()) ? "AI Agent" : keyword.trim();
        return searchQueryRepository.save(SearchQueryEntity.builder()
                .user(user)
                .keyword(normalizedKeyword)
                .countryCode(localeProfile.countryCode())
                .languageCode(localeProfile.languageCode())
                .timeRange("7d")
                .status("COMPLETED")
                .build());
    }

    private List<String> availableAnalysisSources() {
        List<String> labels = searchProviderRepository.findByIsActiveTrue().stream()
                .map(SearchProviderEntity::getProviderCode)
                .map(this::providerLabel)
                .distinct()
                .toList();
        if (labels.isEmpty()) {
            return List.of("Cross-source synthesis");
        }
        List<String> withSynthesis = new ArrayList<>(labels);
        withSynthesis.add("Cross-source synthesis");
        return withSynthesis.stream().distinct().toList();
    }

    private String providerLabel(String providerCode) {
        return switch (providerCode == null ? "" : providerCode.trim().toUpperCase(Locale.ROOT)) {
            case "SERPAPI_GOOGLE" -> "Google Search";
            case "SERPAPI_NEWS" -> "Google News";
            case "YOUTUBE_API" -> "YouTube Signals";
            default -> titleCase(providerCode == null ? "Research Source" : providerCode.replace('_', ' '));
        };
    }

    private LocaleProfile resolveLocaleProfile(String keyword) {
        String value = keyword == null ? "" : keyword.trim().toLowerCase(Locale.ROOT);
        boolean hasNonAscii = value.chars().anyMatch(ch -> ch > 127);
        boolean vietnameseHint = hasNonAscii
                || value.contains("pho")
                || value.contains("viet")
                || value.contains("banh")
                || value.contains("shopee")
                || value.contains("tiki")
                || value.contains("zalo");
        return vietnameseHint ? new LocaleProfile("VN", "vi") : new LocaleProfile("US", "en");
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
        java.util.UUID currentUserId = SecurityUtils.currentUserId();
        if (currentUserId != null) {
            Optional<UserEntity> currentUser = userRepository.findById(currentUserId);
            if (currentUser.isPresent()) {
                return currentUser.get();
            }
        }
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
        return "$" + priceLabel(plan != null ? plan.getPrice() : BigDecimal.ZERO);
    }

    private String moneyForCycle(PlanEntity plan, String cycle) {
        BigDecimal amount = resolveAmount(plan, cycle);
        return "$" + priceLabel(amount);
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

    private String normalizeBillingCycle(String value) {
        return "yearly".equalsIgnoreCase(value) ? "yearly" : "monthly";
    }

    private record LocaleProfile(String countryCode, String languageCode) {
    }

    private BigDecimal resolveAmount(PlanEntity plan, String cycle) {
        if (plan == null || plan.getPrice() == null) {
            return BigDecimal.ZERO;
        }
        return "yearly".equals(cycle) ? plan.getPrice().multiply(BigDecimal.TEN) : plan.getPrice();
    }

    private StripeCheckoutSession createStripeCheckoutSession(PaymentTransactionEntity payment) {
        try {
            Map<String, String> params = new LinkedHashMap<>();
            params.put("mode", "payment");
            params.put("success_url", frontendBaseUrl + "/pricing?payment=success&session_id={CHECKOUT_SESSION_ID}");
            params.put("cancel_url", frontendBaseUrl + "/pricing?payment=cancelled");
            params.put("client_reference_id", payment.getId().toString());
            params.put("metadata[userId]", payment.getUser().getId().toString());
            params.put("metadata[planId]", payment.getPlan().getName().toLowerCase(Locale.ROOT));
            params.put("metadata[billingCycle]", payment.getBillingCycle());
            params.put("metadata[paymentTransactionId]", payment.getId().toString());
            params.put("line_items[0][price_data][currency]", "usd");
            params.put("line_items[0][price_data][product_data][name]", "SkimAI " + titleCase(payment.getPlan().getName()) + " Plan");
            params.put("line_items[0][price_data][product_data][description]", payment.getBillingCycle() + " billing cycle for market insight access");
            params.put("line_items[0][price_data][unit_amount]", String.valueOf(payment.getAmount().movePointRight(2).intValue()));
            params.put("line_items[0][quantity]", "1");

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.stripe.com/v1/checkout/sessions"))
                    .header("Authorization", "Bearer " + stripeSecretKey)
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(toFormBody(params)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 300) {
                throw new AppException(HttpStatus.BAD_GATEWAY, stripeErrorMessage(response.body()));
            }
            JsonNode root = objectMapper.readTree(response.body());
            return new StripeCheckoutSession(root.path("id").asText(), root.path("url").asText());
        } catch (AppException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new AppException(HttpStatus.BAD_GATEWAY, "Unable to create Stripe checkout session");
        }
    }

    private StripeSessionStatus fetchStripeSessionStatus(String providerSessionId) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.stripe.com/v1/checkout/sessions/" + providerSessionId))
                    .header("Authorization", "Bearer " + stripeSecretKey)
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 300) {
                throw new AppException(HttpStatus.BAD_GATEWAY, stripeErrorMessage(response.body()));
            }
            JsonNode root = objectMapper.readTree(response.body());
            return new StripeSessionStatus(root.path("id").asText(), root.path("status").asText(), root.path("payment_status").asText());
        } catch (AppException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new AppException(HttpStatus.BAD_GATEWAY, "Unable to verify Stripe checkout session");
        }
    }

    private String toFormBody(Map<String, String> params) {
        return params.entrySet().stream()
                .map(entry -> URLEncoder.encode(entry.getKey(), StandardCharsets.UTF_8) + "=" +
                        URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8))
                .collect(Collectors.joining("&"));
    }

    private String stripeErrorMessage(String body) {
        try {
            JsonNode root = objectMapper.readTree(body);
            String message = root.path("error").path("message").asText();
            return message == null || message.isBlank() ? "Stripe request failed" : message;
        } catch (Exception ignored) {
            return "Stripe request failed";
        }
    }

    private String displayPaymentStatus(String status) {
        if (status == null) {
            return "pending";
        }
        return switch (status.toUpperCase(Locale.ROOT)) {
            case "PAID" -> "paid";
            case "PENDING" -> "pending";
            case "CANCELLED" -> "failed";
            default -> status.toLowerCase(Locale.ROOT);
        };
    }

    private record StripeCheckoutSession(String id, String url) {}

    private record StripeSessionStatus(String id, String status, String paymentStatus) {}

    private int planTier(String name) {
        if (name == null) {
            return 99;
        }
        return switch (name.toUpperCase(Locale.ROOT)) {
            case "FREE" -> 0;
            case "STARTER" -> 1;
            case "TEAM" -> 2;
            case "ENTERPRISE" -> 3;
            default -> 99;
        };
    }

    private List<String> pricingFeatures(PlanEntity plan) {
        if (plan == null || plan.getName() == null) {
            return List.of("Flexible plan");
        }
        return switch (plan.getName().toUpperCase(Locale.ROOT)) {
            case "FREE" -> List.of(
                    "10 searches/month",
                    "Community access",
                    "No exports"
            );
            case "STARTER" -> List.of(
                    "100 searches/month",
                    "Basic market analysis",
                    "AI Summary",
                    "Export PDF"
            );
            case "TEAM" -> List.of(
                    "500 searches/month",
                    "Advanced AI Deep Insight",
                    "Competitor view",
                    "Priority processing"
            );
            case "ENTERPRISE" -> List.of(
                    "Unlimited searches",
                    "Unlimited exports",
                    "Team usage",
                    "Admin dashboard",
                    "Priority support"
            );
            default -> List.of(
                    (plan.getSearchLimit() != null && plan.getSearchLimit() >= 9999 ? "Unlimited" : plan.getSearchLimit()) + " searches/month",
                    (plan.getExportLimit() != null && plan.getExportLimit() >= 999 ? "Unlimited" : plan.getExportLimit()) + " exports/month",
                    plan.getDescription() != null ? plan.getDescription() : "Flexible plan"
            );
        };
    }

    private String priceLabel(BigDecimal amount) {
        if (amount == null) {
            return "0";
        }
        return amount.stripTrailingZeros().toPlainString();
    }
}
