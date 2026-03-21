package com.researchco.admin;

public class AdminDtos {
    public record DashboardResponse(
            long totalUsers,
            long totalSearches,
            long totalReports,
            long activeSubscriptions
    ) {
    }
}
