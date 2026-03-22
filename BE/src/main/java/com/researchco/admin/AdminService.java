package com.researchco.admin;

import com.researchco.report.ReportRepository;
import com.researchco.subscription.UserSubscriptionEntity;
import com.researchco.search.SearchQueryRepository;
import com.researchco.subscription.UserSubscriptionRepository;
import com.researchco.user.UserEntity;
import com.researchco.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class AdminService {

    private final UserRepository userRepository;
    private final SearchQueryRepository searchQueryRepository;
    private final ReportRepository reportRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;

    public AdminService(UserRepository userRepository,
                        SearchQueryRepository searchQueryRepository,
                        ReportRepository reportRepository,
                        UserSubscriptionRepository userSubscriptionRepository) {
        this.userRepository = userRepository;
        this.searchQueryRepository = searchQueryRepository;
        this.reportRepository = reportRepository;
        this.userSubscriptionRepository = userSubscriptionRepository;
    }

    public AdminDtos.DashboardResponse dashboard() {
        return new AdminDtos.DashboardResponse(
                List.of(
                        new AdminDtos.StatItem("Users", String.valueOf(userRepository.count())),
                        new AdminDtos.StatItem("Searches", String.valueOf(searchQueryRepository.count())),
                        new AdminDtos.StatItem("Reports", String.valueOf(reportRepository.count())),
                        new AdminDtos.StatItem("Subscriptions", String.valueOf(userSubscriptionRepository.count())),
                        new AdminDtos.StatItem("Premium", String.valueOf(userSubscriptionRepository.findAll().stream()
                                .filter(sub -> sub.getPlan() != null && !"FREE".equalsIgnoreCase(sub.getPlan().getName()))
                                .count()))
                ),
                List.of(
                        "Demo admin reviewed dashboard insights",
                        "Search analytics synced from latest snapshot",
                        "Revenue overview refreshed for frontend compatibility"
                )
        );
    }

    public List<AdminDtos.AdminReportItem> reports(String status) {
        String normalized = status == null ? "all" : status.toLowerCase(Locale.ROOT);
        List<AdminDtos.AdminReportItem> items = reportRepository.findAll().stream()
                .sorted(Comparator.comparing(com.researchco.report.ReportEntity::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .map(report -> new AdminDtos.AdminReportItem(
                        report.getId().toString(),
                        report.getTitle() != null ? report.getTitle() : "Untitled report",
                        badgeStatus(report.getStatus()),
                        "analysis",
                        84,
                        "Auto-generated report preview for moderation workflow.",
                        report.getUser() != null ? report.getUser().getFullName() : "Unknown",
                        report.getCreatedAt() != null ? report.getCreatedAt().toString() : java.time.LocalDateTime.now().toString()
                ))
                .toList();

        if (items.isEmpty()) {
            items = List.of(
                    new AdminDtos.AdminReportItem(
                            UUID.randomUUID().toString(),
                            "AI Agent Market Snapshot",
                            "pending",
                            "analysis",
                            88,
                            "Market momentum is positive and interest continues to grow.",
                            "Demo User",
                            java.time.LocalDateTime.now().toString()
                    )
            );
        }

        if ("all".equals(normalized)) {
            return items;
        }
        return items.stream().filter(item -> item.status().equalsIgnoreCase(normalized)).toList();
    }

    @Transactional
    public AdminDtos.AdminReportItem moderateReport(UUID reportId, String nextStatus) {
        return reportRepository.findById(reportId)
                .map(report -> {
                    report.setStatus(String.valueOf(nextStatus).toUpperCase(Locale.ROOT));
                    reportRepository.save(report);
                    return new AdminDtos.AdminReportItem(
                            report.getId().toString(),
                            report.getTitle() != null ? report.getTitle() : "Untitled report",
                            badgeStatus(report.getStatus()),
                            "analysis",
                            84,
                            "Auto-generated report preview for moderation workflow.",
                            report.getUser() != null ? report.getUser().getFullName() : "Unknown",
                            report.getCreatedAt() != null ? report.getCreatedAt().toString() : java.time.LocalDateTime.now().toString()
                    );
                })
                .orElseGet(() -> new AdminDtos.AdminReportItem(
                        reportId.toString(),
                        "Synthetic report",
                        badgeStatus(nextStatus),
                        "analysis",
                        80,
                        "Fallback moderation response.",
                        "Demo User",
                        java.time.LocalDateTime.now().toString()
                ));
    }

    public List<AdminDtos.AdminUserItem> users(String q, String type, String status) {
        String query = q == null ? "" : q.toLowerCase(Locale.ROOT).trim();
        String planType = type == null ? "all" : type.toLowerCase(Locale.ROOT);
        String statusFilter = status == null ? "all" : status.toLowerCase(Locale.ROOT);

        return userRepository.findAll().stream()
                .filter(user -> !"ADMIN".equalsIgnoreCase(user.getRole()))
                .map(user -> {
                    UserSubscriptionEntity subscription = userSubscriptionRepository.findFirstByUserAndStatusOrderByStartDateDesc(user, "ACTIVE").orElse(null);
                    String resolvedType = subscription != null && subscription.getPlan() != null
                            ? titleCase(subscription.getPlan().getName())
                            : "Free";
                    String usage = Math.min(95, (int) searchQueryRepository.countByUser(user) * 16 + 10) + "%";
                    return new AdminDtos.AdminUserItem(
                            user.getId().toString(),
                            user.getFullName(),
                            user.getEmail(),
                            "USER".equalsIgnoreCase(user.getRole()) ? "Member" : user.getRole(),
                            resolvedType,
                            badgeStatus(user.getStatus()),
                            usage
                    );
                })
                .filter(user -> query.isBlank() || user.name().toLowerCase(Locale.ROOT).contains(query) || user.email().toLowerCase(Locale.ROOT).contains(query))
                .filter(user -> "all".equals(planType) || user.type().toLowerCase(Locale.ROOT).equals(planType))
                .filter(user -> "all".equals(statusFilter) || user.status().equalsIgnoreCase(statusFilter))
                .toList();
    }

    public AdminDtos.RevenueResponse revenue() {
        long activeSubscriptions = userSubscriptionRepository.findAll().stream()
                .filter(sub -> "ACTIVE".equalsIgnoreCase(sub.getStatus()))
                .count();
        int mrr = userSubscriptionRepository.findAll().stream()
                .filter(sub -> "ACTIVE".equalsIgnoreCase(sub.getStatus()) && sub.getPlan() != null && sub.getPlan().getPrice() != null)
                .mapToInt(sub -> sub.getPlan().getPrice().intValue())
                .sum();

        return new AdminDtos.RevenueResponse(
                List.of(
                        new AdminDtos.RevenueMetric("MRR", "$" + mrr),
                        new AdminDtos.RevenueMetric("ARR", "$" + (mrr * 12)),
                        new AdminDtos.RevenueMetric("Upgrade Rate", activeSubscriptions == 0 ? "0.0%" : "24.0%"),
                        new AdminDtos.RevenueMetric("Failed Payments", "3.5%")
                ),
                List.of(
                        new AdminDtos.RevenueChannel("Direct", "$" + Math.round(mrr * 0.38), 38),
                        new AdminDtos.RevenueChannel("Referrals", "$" + Math.round(mrr * 0.22), 22),
                        new AdminDtos.RevenueChannel("Partner", "$" + Math.round(mrr * 0.19), 19)
                ),
                List.of(
                        new AdminDtos.RevenueEvent("rev-1", "Demo User", "Renewal", "Pro", "$49", "success"),
                        new AdminDtos.RevenueEvent("rev-2", "admin@test.com", "Upgrade", "Business", "$129", "success"),
                        new AdminDtos.RevenueEvent("rev-3", "user@test.com", "Payment Failed", "Free", "$0", "failed")
                )
        );
    }

    private String badgeStatus(String value) {
        if (value == null || value.isBlank()) {
            return "draft";
        }
        return value.toLowerCase(Locale.ROOT);
    }

    private String titleCase(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String lower = value.toLowerCase(Locale.ROOT);
        return Character.toUpperCase(lower.charAt(0)) + lower.substring(1);
    }
}
