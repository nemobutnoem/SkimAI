package com.researchco.admin;

public class AdminDtos {
    public record StatItem(
            String label,
            String value
    ) {
    }

    public record DashboardResponse(
            java.util.List<StatItem> stats,
            java.util.List<String> activities
    ) {
    }

    public record AdminReportItem(
            String id,
            String title,
            String status,
            String category,
            int aiScore,
            String summary,
            String author,
            String updatedAt
    ) {
    }

    public record ModerateReportRequest(String status) {
    }

    public record AdminUserItem(
            String id,
            String name,
            String email,
            String role,
            String type,
            String status,
            String usage
    ) {
    }

    public record RevenueMetric(
            String label,
            String value
    ) {
    }

    public record RevenueChannel(
            String name,
            String amount,
            int pct
    ) {
    }

    public record RevenueEvent(
            String id,
            String user,
            String event,
            String plan,
            String amount,
            String status
    ) {
    }

    public record RevenueResponse(
            java.util.List<RevenueMetric> metrics,
            java.util.List<RevenueChannel> channels,
            java.util.List<RevenueEvent> events
    ) {
    }
}
