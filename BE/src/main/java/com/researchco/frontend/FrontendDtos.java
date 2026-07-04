package com.researchco.frontend;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.Map;

public class FrontendDtos {

    public record KpiItem(String label, String value) {
    }

    public record RecentItem(String id, String title, String createdAt) {
    }

    public record DashboardResponse(List<KpiItem> kpis, List<RecentItem> recent) {
    }

    public record Profile(String name, String email, String company) {
    }

    public record UsageItem(String label, int value) {
    }

    public record InvoiceItem(String id, String date, String amount, String status) {
    }

    public record CurrentSubscription(
            String planId,
            String planName,
            String status,
            String billingCycle,
            String renewsAt
    ) {
    }

    public record AccountOverviewResponse(
            Profile profile,
            CurrentSubscription subscription,
            List<UsageItem> usage,
            List<InvoiceItem> invoices,
            Map<String, Boolean> notifications
    ) {
    }

    public record ProfileUpdateRequest(
            @NotBlank(message = "Họ và tên không được để trống")
            @Size(max = 100)
            String name,
            @Size(max = 100)
            String company
    ) {}

    public record PasswordChangeRequest(
            @NotBlank(message = "Mật khẩu hiện tại không được để trống")
            String currentPassword,
            @NotBlank(message = "Mật khẩu mới không được để trống")
            @Size(min = 6, message = "Mật khẩu mới phải có ít nhất 6 ký tự")
            String newPassword
    ) {}

    public record KeywordMetric(
            String keyword,
            int mentionCount,
            long totalViews,
            long totalLikes,
            long totalComments,
            double avgEngagement
    ) {
    }

    public record InsightItem(
            String label,
            String text,
            String evidenceSource,
            int confidence,
            String evidenceSignal
    ) {
    }

    public record AnalysisResponse(
            String keyword,
            String searchQueryId,
            String snapshotId,
            List<String> dataSources,
            List<InsightItem> insights,
            List<KeywordMetric> relatedKeywords,
            List<String> news,
            List<String> suggestedActions,
            DataQuality dataQuality,
            ResearchGuard researchGuard
    ) {
    }

    public record DataQuality(
            int freshnessMinutes,
            int sourceDiversity,
            int evidenceCoveragePct,
            String confidenceBand
    ) {
    }

    public record ResearchGuard(
            int intentScore,
            String status,
            String message,
            List<String> suggestedKeywords,
            boolean deepInsightEnabled
    ) {
    }

    public record ProjectSnapshotPoint(
            String label,
            String value
    ) {
    }

    public record ProjectWorkflowResponse(
            String projectName,
            String currentKeyword,
            List<String> compareKeywords,
            List<ProjectSnapshotPoint> timeline
    ) {
    }

    public record AlertItem(
            String id,
            String severity,
            String title,
            String status,
            String action
    ) {
    }

    public record CompetitorSignal(
            String label,
            String value,
            String note
    ) {
    }

    public record EvidenceItem(
            String source,
            String title,
            String metric,
            String signal,
            String url,
            String sentiment,
            String platform
    ) {
    }

    public record CompareItem(
            String keyword,
            long observedViews,
            int mentions,
            long comments,
            double avgEngagement
    ) {
    }

    public record TimeSeriesPoint(
            String label,
            long value
    ) {
    }

    public record DeepInsightRequest(
            @NotBlank @Size(max = 255) String keyword,
            @Size(max = 100) String source
    ) {
    }

    public record StatItem(String value, String label) {
    }

    public record SignalItem(String title, String desc) {
    }

    public record TrendPoint(String label, int value, String note) {
    }

    public record SentimentBar(String label, int pct, String color, String cls) {
    }

    public record TopicItem(String name, String change) {
    }

    public record SentimentBlock(List<SentimentBar> bars, List<TopicItem> topics) {
    }

    public record OpportunityCard(String title, String desc, String theme) {
    }

    public record StrategicRecommendation(String title, String desc, List<StatItem> stats) {
    }

    public record CompetitorMapItem(
            String name,
            String channelUrl,
            String strengthLevel,
            String followers,
            String frequency,
            String note
    ) {}

    public record TargetPersona(
            String description,
            List<String> painPoints,
            List<String> searchIntents
    ) {}

    public record RegionContribution(String regionName, int percentage, String demandLevel) {}

    public record RegionalPotential(
            String analysisText,
            List<RegionContribution> topRegions,
            List<String> geographicInsights
    ) {}

    public record MarketOverview(
            String industrySize,
            List<String> keyCharacteristics
    ) {}

    public record PurchasingCriterion(
            String criterion,
            String importance,
            String description
    ) {}

    public record MarketSegmentationItem(
            String segmentName,
            String targetAudience,
            String strategy
    ) {}

    public record ConsumerBehaviour(
            List<PurchasingCriterion> purchasingCriteria,
            List<MarketSegmentationItem> marketSegmentation
    ) {}

    public record SwotMatrix(
            List<String> strengths,
            List<String> weaknesses,
            List<String> opportunities,
            List<String> threats
    ) {}

    public record DeepInsightResponse(
            String keyword,
            String source,
            String marketInsight,
            List<String> opportunities,
            String recommendation,
            List<StatItem> stats,
            List<SignalItem> mediaSignals,
            List<TrendPoint> trendPoints,
            SentimentBlock sentiment,
            List<OpportunityCard> opportunityCards,
            StrategicRecommendation strategicRecommendation,
            List<CompetitorMapItem> competitors,
            TargetPersona targetPersona,
            RegionalPotential regionalPotential,
            MarketOverview marketOverview,
            ConsumerBehaviour consumerBehaviour,
            SwotMatrix swot,
            List<String> references
    ) {
    }

    public record ExpertItem(String id, String name, String domain, double rating, int price) {
    }

    public record ExpertQuestionRequest(
            @NotBlank @Size(max = 255) String topic,
            @NotBlank @Size(max = 36) String expertId,
            @NotBlank @Size(max = 2000) String question
    ) {
    }

    public record ExpertQuestionResponse(String id, String status, int etaHours, String createdAt) {
    }

    public record PricingPlan(
            String id,
            String name,
            String monthly,
            String yearly,
            List<String> features,
            boolean current,
            String ctaLabel
    ) {
    }

    public record PricingCheckoutRequest(
            @NotBlank String planId,
            @NotBlank @Size(max = 20) String billingCycle,
            @NotBlank @Size(max = 30) String provider
    ) {
    }

    public record PricingCheckoutResponse(
            String status,
            String message,
            String planId,
            String planName,
            String billingCycle,
            String invoiceId,
            String amount,
            String renewsAt,
            String checkoutUrl,
            String providerSessionId,
            String bankId,
            String bankAccountNo,
            String bankAccountName,
            String momoPhone,
            String momoAccountName
    ) {
    }

    public record SalesContactRequest(
            @NotBlank String planId,
            @NotBlank @Size(max = 20) String billingCycle,
            @NotBlank @Size(min = 1, max = 120) String contactName,
            @NotBlank @Email @Size(max = 160) String workEmail,
            @NotBlank @Size(min = 1, max = 160) String companyName,
            @Min(1) Integer teamSize,
            @Size(max = 2000) String note
    ) {
    }

    public record SalesContactResponse(
            String status,
            String leadId,
            String message,
            String planName,
            String companyName
    ) {
    }

    public record PricingCheckoutConfirmRequest(@NotBlank String providerSessionId) {
    }
}
