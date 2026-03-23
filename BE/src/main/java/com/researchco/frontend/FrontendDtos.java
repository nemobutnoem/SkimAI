package com.researchco.frontend;

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

    public record KeywordMetric(
            String keyword,
            int mentionCount,
            long totalViews,
            long totalLikes,
            long totalComments,
            double avgEngagement
    ) {
    }

    public record InsightItem(String label, String text) {
    }

    public record AnalysisResponse(
            String keyword,
            String searchQueryId,
            String snapshotId,
            List<String> dataSources,
            List<InsightItem> insights,
            List<KeywordMetric> relatedKeywords,
            List<String> news,
            List<String> suggestedActions
    ) {
    }

    public record DeepInsightRequest(String keyword, String source) {
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
            StrategicRecommendation strategicRecommendation
    ) {
    }

    public record ExpertItem(String id, String name, String domain, double rating, int price) {
    }

    public record ExpertQuestionRequest(String topic, String expertId, String question) {
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
            String planId,
            String billingCycle
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
            String providerSessionId
    ) {
    }

    public record SalesContactRequest(
            String planId,
            String billingCycle,
            String contactName,
            String workEmail,
            String companyName,
            Integer teamSize,
            String note
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

    public record PricingCheckoutConfirmRequest(String providerSessionId) {
    }
}
