package com.researchco.admin;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class AdminDtos {
    public record StatItem(
            String label,
            String value,
            String change,
            Boolean negative
    ) {
    }

    public record ChartSeries(
            java.util.List<String> labels,
            java.util.List<Double> values
    ) {
    }

    public record PendingRequest(
            String id,
            String user,
            String type,
            String status
    ) {
    }

    public record Distribution(
            int premiumPct,
            int standardPct
    ) {
    }

    public record ActivityItem(
            String label,
            String description,
            String createdAt
    ) {
    }

    public record DashboardResponse(
            java.util.List<StatItem> stats,
            java.util.List<ActivityItem> activities,
            ChartSeries userGrowth,
            ChartSeries revenue,
            Distribution distribution,
            java.util.List<PendingRequest> pendingRequests
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
    public record AdminPlanItem(
            String id,
            String name,
            java.math.BigDecimal price,
            Integer searchLimit,
            Integer exportLimit,
            Integer deepInsightLimit,
            String description
    ) {}

    public record UpdatePlanRequest(
            @NotNull @DecimalMin("0.00") java.math.BigDecimal price,
            @NotNull @Min(0) Integer searchLimit,
            @NotNull @Min(0) Integer exportLimit,
            @Min(0) Integer deepInsightLimit,
            @Size(max = 500) String description
    ) {}
}
