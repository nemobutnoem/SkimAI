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

    public record AccountOverviewResponse(
            Profile profile,
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

    public record AnalysisResponse(
            String keyword,
            String searchQueryId,
            String snapshotId,
            List<String> insights,
            List<KeywordMetric> relatedKeywords,
            List<String> news,
            List<String> suggestedActions
    ) {
    }

    public record DeepInsightRequest(String keyword, String source) {
    }

    public record DeepInsightResponse(
            String keyword,
            String source,
            String marketInsight,
            List<String> opportunities,
            String recommendation
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
            int monthly,
            int yearly,
            List<String> features
    ) {
    }
}
