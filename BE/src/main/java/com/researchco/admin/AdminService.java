package com.researchco.admin;

import com.researchco.payment.PaymentTransactionEntity;
import com.researchco.payment.PaymentTransactionRepository;
import com.researchco.report.ReportEntity;
import com.researchco.report.ReportRepository;
import com.researchco.snapshot.AnalysisSnapshotEntity;
import com.researchco.common.AppException;
import com.researchco.subscription.UserSubscriptionEntity;
import com.researchco.search.SearchQueryRepository;
import com.researchco.subscription.UserSubscriptionRepository;
import com.researchco.user.UserEntity;
import com.researchco.user.UserRepository;
import com.researchco.plan.PlanEntity;
import com.researchco.plan.PlanRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class AdminService {

    private final UserRepository userRepository;
    private final SearchQueryRepository searchQueryRepository;
    private final ReportRepository reportRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final AdminActionRepository adminActionRepository;
    private final PlanRepository planRepository;
    private final SystemSettingRepository systemSettingRepository;

    public AdminService(UserRepository userRepository,
                        SearchQueryRepository searchQueryRepository,
                        ReportRepository reportRepository,
                        UserSubscriptionRepository userSubscriptionRepository,
                        PaymentTransactionRepository paymentTransactionRepository,
                        AdminActionRepository adminActionRepository,
                        PlanRepository planRepository,
                        SystemSettingRepository systemSettingRepository) {
        this.userRepository = userRepository;
        this.searchQueryRepository = searchQueryRepository;
        this.reportRepository = reportRepository;
        this.userSubscriptionRepository = userSubscriptionRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.adminActionRepository = adminActionRepository;
        this.planRepository = planRepository;
        this.systemSettingRepository = systemSettingRepository;
    }

    public List<AdminDtos.AdminPlanItem> getPlans() {
        return planRepository.findAll().stream()
                .filter(plan -> List.of("FREE", "STARTER", "TEAM").contains(plan.getName().toUpperCase(java.util.Locale.ROOT)))
                .sorted((p1, p2) -> {
                    List<String> order = List.of("FREE", "STARTER", "TEAM");
                    return Integer.compare(
                            order.indexOf(p1.getName().toUpperCase(java.util.Locale.ROOT)),
                            order.indexOf(p2.getName().toUpperCase(java.util.Locale.ROOT))
                    );
                })
                .map(plan -> new AdminDtos.AdminPlanItem(
                        plan.getId().toString(),
                        plan.getName(),
                        plan.getPrice(),
                        plan.getSearchLimit(),
                        plan.getExportLimit(),
                        plan.getDeepInsightLimit(),
                        plan.getDescription()
                ))
                .toList();
    }

    @Transactional
    public AdminDtos.AdminPlanItem updatePlan(UUID planId, AdminDtos.UpdatePlanRequest request) {
        PlanEntity plan = planRepository.findById(planId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Plan not found"));
        plan.setPrice(request.price());
        plan.setSearchLimit(request.searchLimit());
        plan.setExportLimit(request.exportLimit());
        plan.setDeepInsightLimit(request.deepInsightLimit());
        plan.setDescription(request.description());
        planRepository.save(plan);
        return new AdminDtos.AdminPlanItem(
                plan.getId().toString(),
                plan.getName(),
                plan.getPrice(),
                plan.getSearchLimit(),
                plan.getExportLimit(),
                plan.getDeepInsightLimit(),
                plan.getDescription()
        );
    }

    public AdminDtos.DashboardResponse dashboard() {
        LocalDate today = LocalDate.now();
        YearMonth currentMonth = YearMonth.from(today);
        YearMonth prevMonth = currentMonth.minusMonths(1);
        LocalDateTime currentStart = currentMonth.atDay(1).atStartOfDay();
        LocalDateTime currentEnd = currentMonth.plusMonths(1).atDay(1).atStartOfDay();
        LocalDateTime prevStart = prevMonth.atDay(1).atStartOfDay();
        LocalDateTime prevEnd = prevMonth.plusMonths(1).atDay(1).atStartOfDay();

        long usersCurrent = userRepository.countNonAdminByCreatedAtBetween(currentStart, currentEnd);
        long usersPrev = userRepository.countNonAdminByCreatedAtBetween(prevStart, prevEnd);

        long searchesCurrent = searchQueryRepository.countByCreatedAtBetween(currentStart, currentEnd);
        long searchesPrev = searchQueryRepository.countByCreatedAtBetween(prevStart, prevEnd);

        long reportsCurrent = reportRepository.countByCreatedAtBetween(currentStart, currentEnd);
        long reportsPrev = reportRepository.countByCreatedAtBetween(prevStart, prevEnd);

        List<UserSubscriptionEntity> allSubscriptions = userSubscriptionRepository.findAllNonAdmin();

        long subscriptionsCurrent = allSubscriptions.stream()
                .filter(sub -> sub.getStartDate() != null && sub.getStartDate().isAfter(currentStart) && sub.getStartDate().isBefore(currentEnd))
                .count();
        long subscriptionsPrev = allSubscriptions.stream()
                .filter(sub -> sub.getStartDate() != null && sub.getStartDate().isAfter(prevStart) && sub.getStartDate().isBefore(prevEnd))
                .count();

        List<UserSubscriptionEntity> activeSubscriptions = allSubscriptions.stream()
                .filter(sub -> "ACTIVE".equalsIgnoreCase(sub.getStatus()))
                .toList();
        long premiumActive = activeSubscriptions.stream()
                .filter(sub -> sub.getPlan() != null && !"FREE".equalsIgnoreCase(sub.getPlan().getName()))
                .count();
        int premiumPct = pct(premiumActive, activeSubscriptions.size());
        int standardPct = activeSubscriptions.isEmpty() ? 0 : Math.max(0, 100 - premiumPct);

        Map<YearMonth, Long> premiumByMonth = allSubscriptions.stream()
                .filter(sub -> sub.getStartDate() != null)
                .filter(sub -> sub.getPlan() != null && !"FREE".equalsIgnoreCase(sub.getPlan().getName()))
                .collect(Collectors.groupingBy(sub -> YearMonth.from(sub.getStartDate()), Collectors.counting()));
        long premiumCurrent = premiumByMonth.getOrDefault(currentMonth, 0L);
        long premiumPrev = premiumByMonth.getOrDefault(prevMonth, 0L);

        AdminDtos.ChartSeries userGrowth = buildMonthlyCountSeries(
                7,
                (start, end) -> countNonAdminUsersBetween(start, end)
        );

        AdminDtos.ChartSeries revenue = buildMonthlyAmountSeries(6);

        List<AdminDtos.ActivityItem> activities = adminActionRepository.findTop10ByOrderByCreatedAtDesc().stream()
                .filter(action -> action.getAdminUser() != null && "USER".equalsIgnoreCase(action.getAdminUser().getRole()))
                .map(this::toActivityItem)
                .toList();

        List<AdminDtos.PendingRequest> pendingRequests = reportRepository.findTop3ByStatusIgnoreCaseOrderByCreatedAtDesc("PENDING").stream()
                .map(this::toPendingRequest)
                .toList();

        return new AdminDtos.DashboardResponse(
                List.of(
                        stat("Users", countAllNonAdminUsers(), usersCurrent, usersPrev),
                        stat("Searches", searchQueryRepository.count(), searchesCurrent, searchesPrev),
                        stat("Reports", reportRepository.count(), reportsCurrent, reportsPrev),
                        stat("Subscriptions", allSubscriptions.size(), subscriptionsCurrent, subscriptionsPrev),
                        stat("Premium", premiumActive, premiumCurrent, premiumPrev)
                ),
                activities,
                userGrowth,
                revenue,
                new AdminDtos.Distribution(premiumPct, standardPct),
                pendingRequests
        );
    }

    public List<AdminDtos.AdminReportItem> reports(String status) {
        String normalized = status == null ? "all" : status.toLowerCase(Locale.ROOT);
        List<com.researchco.report.ReportEntity> reports = "all".equals(normalized)
                ? reportRepository.findAllByOrderByCreatedAtDesc()
                : reportRepository.findByStatusIgnoreCaseOrderByCreatedAtDesc(normalized);
        return reports.stream().map(this::toAdminReportItem).toList();
    }

    @Transactional
    public AdminDtos.AdminReportItem moderateReport(UUID reportId, String nextStatus) {
        ReportEntity report = reportRepository.findById(reportId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Report not found"));
        report.setStatus(String.valueOf(nextStatus).toUpperCase(Locale.ROOT));
        reportRepository.save(report);
        return toAdminReportItem(report);
    }

    public List<AdminDtos.AdminUserItem> users(String q, String type, String status) {
        String query = q == null ? "" : q.toLowerCase(Locale.ROOT).trim();
        String planType = type == null ? "all" : type.toLowerCase(Locale.ROOT);
        String statusFilter = status == null ? "all" : status.toLowerCase(Locale.ROOT);
                LocalDateTime since = LocalDateTime.now().minusDays(30);

        List<UserEntity> allUsers = userRepository.findAllNonAdmin();
        Map<UUID, UserSubscriptionEntity> activeSubByUser = userSubscriptionRepository.findAllActiveNonAdmin()
                .stream()
                .collect(Collectors.toMap(
                        s -> s.getUser().getId(),
                        s -> s,
                        (a, b) -> a
                ));

        List<AdminDtos.AdminUserItem> mapped = allUsers.stream()
                .map(user -> {
                    UserSubscriptionEntity subscription = activeSubByUser.get(user.getId());
                    String planName = subscription != null && subscription.getPlan() != null
                            ? subscription.getPlan().getName() : "FREE";
                    String resolvedType = titleCase(planName);
                    long monthCount = searchQueryRepository.countByUserAndCreatedAtAfter(user, since);
                    Integer searchLimit = subscription != null && subscription.getPlan() != null ? subscription.getPlan().getSearchLimit() : null;
                    String usage = formatUsagePct(monthCount, searchLimit);
                    return new AdminDtos.AdminUserItem(
                            user.getId().toString(),
                            user.getFullName(),
                            user.getEmail(),
                            "USER".equalsIgnoreCase(user.getRole()) ? "Thành viên" : user.getRole(),
                            resolvedType,
                            badgeStatus(user.getStatus()),
                            usage
                    );
                })
                .toList();

        return mapped.stream()
                .filter(u -> query.isBlank() || u.name().toLowerCase(Locale.ROOT).contains(query) || u.email().toLowerCase(Locale.ROOT).contains(query))
                .filter(u -> matchesPlanTypeFilter(u.type(), planType))
                .filter(u -> "all".equals(statusFilter) || u.status().equalsIgnoreCase(statusFilter))
                .toList();
    }

    public AdminDtos.RevenueResponse revenue() {
                List<UserSubscriptionEntity> activeSubscriptions = userSubscriptionRepository.findByStatus("ACTIVE").stream()
                                .filter(sub -> sub.getUser() != null && !"ADMIN".equalsIgnoreCase(sub.getUser().getRole()))
                                .toList();
                BigDecimal mrr = activeSubscriptions.stream()
                                .map(sub -> sub.getPlan() == null ? null : sub.getPlan().getPrice())
                                .filter(Objects::nonNull)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                long paidActive = activeSubscriptions.stream()
                                .filter(sub -> sub.getPlan() != null && !"FREE".equalsIgnoreCase(sub.getPlan().getName()))
                                .count();
                String upgradeRate = activeSubscriptions.isEmpty()
                                ? "0.0%"
                                : String.format(Locale.ROOT, "%.1f%%", (paidActive * 100.0) / activeSubscriptions.size());

                LocalDateTime since = LocalDateTime.now().minusDays(30);
                LocalDateTime now = LocalDateTime.now();
                List<PaymentTransactionEntity> last30 = paymentTransactionRepository.findByCreatedAtBetween(since, now);
                long total30 = last30.size();
                long failed30 = last30.stream().filter(tx -> !"PAID".equalsIgnoreCase(tx.getStatus())).count();
                String failedRate = total30 == 0 ? "0.0%" : String.format(Locale.ROOT, "%.1f%%", (failed30 * 100.0) / total30);

                Map<String, BigDecimal> paidByProvider = last30.stream()
                                .filter(tx -> "PAID".equalsIgnoreCase(tx.getStatus()))
                                .filter(tx -> tx.getProvider() != null)
                                .collect(Collectors.groupingBy(
                                                tx -> tx.getProvider().toUpperCase(Locale.ROOT),
                                                LinkedHashMap::new,
                                                Collectors.reducing(BigDecimal.ZERO, PaymentTransactionEntity::getAmount, BigDecimal::add)
                                ));
                BigDecimal totalPaid = paidByProvider.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);
                List<AdminDtos.RevenueChannel> channels = paidByProvider.entrySet().stream()
                                .map(entry -> new AdminDtos.RevenueChannel(
                                                entry.getKey(),
                                                "$" + priceLabel(entry.getValue()),
                                                pct(entry.getValue(), totalPaid)
                                ))
                                .toList();

                List<AdminDtos.RevenueEvent> events = paymentTransactionRepository.findTop10ByOrderByCreatedAtDesc().stream()
                                .map(this::toRevenueEvent)
                                .toList();

                return new AdminDtos.RevenueResponse(
                                List.of(
                                                new AdminDtos.RevenueMetric("MRR", "$" + priceLabel(mrr)),
                                                new AdminDtos.RevenueMetric("ARR", "$" + priceLabel(mrr.multiply(BigDecimal.valueOf(12L)))),
                                                new AdminDtos.RevenueMetric("Upgrade Rate", upgradeRate),
                                                new AdminDtos.RevenueMetric("Failed Payments", failedRate)
                                ),
                                channels,
                                events
                );
    }

        private AdminDtos.ActivityItem toActivityItem(AdminActionEntity action) {
                String label = action.getActionType() == null ? "Admin action" : titleCase(action.getActionType().replace('_', ' '));
                String description = action.getTargetId() == null ? "" : "Target: " + action.getTargetId();
                String createdAt = action.getCreatedAt() == null ? null : action.getCreatedAt().toString();
                return new AdminDtos.ActivityItem(label, description, createdAt);
        }

        private AdminDtos.PendingRequest toPendingRequest(ReportEntity report) {
                String user = report.getUser() != null ? report.getUser().getFullName() : "Unknown";
                String type = report.getSearchQuery() != null && report.getSearchQuery().getKeyword() != null
                                ? report.getSearchQuery().getKeyword()
                                : (report.getTitle() != null ? report.getTitle() : "Report");
                return new AdminDtos.PendingRequest(
                                report.getId().toString(),
                                user,
                                type,
                                badgeStatus(report.getStatus())
                );
        }

        private AdminDtos.AdminReportItem toAdminReportItem(ReportEntity report) {
                AnalysisSnapshotEntity snapshot = report.getSnapshot();
                int aiScore = computeAiScore(snapshot);
                String summary = snapshot != null && snapshot.getSummaryText() != null ? snapshot.getSummaryText() : "";
                String author = report.getUser() != null ? report.getUser().getFullName() : "Unknown";
                String updatedAt = report.getCreatedAt() != null ? report.getCreatedAt().toString() : LocalDateTime.now().toString();
                return new AdminDtos.AdminReportItem(
                                report.getId().toString(),
                                report.getTitle() != null ? report.getTitle() : "Untitled report",
                                badgeStatus(report.getStatus()),
                                "analysis",
                                aiScore,
                                summary,
                                author,
                                updatedAt
                );
        }

        private int computeAiScore(AnalysisSnapshotEntity snapshot) {
                if (snapshot == null) {
                        return 0;
                }
                int sources = snapshot.getTotalSources() == null ? 0 : snapshot.getTotalSources();
                int positive = snapshot.getPositiveCount() == null ? 0 : snapshot.getPositiveCount();
                int neutral = snapshot.getNeutralCount() == null ? 0 : snapshot.getNeutralCount();
                int negative = snapshot.getNegativeCount() == null ? 0 : snapshot.getNegativeCount();
                int total = positive + neutral + negative;
                double positiveRatio = total == 0 ? 0.0 : (positive / (double) total);

                double score = 20.0 + Math.min(60.0, sources * 4.0) + (positiveRatio * 20.0);
                return clamp((int) Math.round(score), 0, 100);
        }

        private AdminDtos.RevenueEvent toRevenueEvent(PaymentTransactionEntity tx) {
                String user = tx.getUser() != null ? tx.getUser().getEmail() : "Unknown";
                String plan = tx.getPlan() != null ? titleCase(tx.getPlan().getName()) : "";
                String amount = tx.getAmount() == null ? "$0.00" : "$" + priceLabel(tx.getAmount());
                String status = tx.getStatus() == null ? "pending" : tx.getStatus().toLowerCase(Locale.ROOT);
                String badge = "PAID".equalsIgnoreCase(tx.getStatus()) ? "success" : ("CANCELLED".equalsIgnoreCase(tx.getStatus()) ? "failed" : "draft");
                return new AdminDtos.RevenueEvent(
                                tx.getId().toString(),
                                user,
                                status,
                                plan,
                                amount,
                                badge
                );
        }

        private AdminDtos.StatItem stat(String label, long total, long currentMonth, long prevMonth) {
                double changePct = percentChange(currentMonth, prevMonth);
                boolean negative = changePct < 0;
                String change = String.format(Locale.ROOT, "%+.1f%%", changePct);
                return new AdminDtos.StatItem(label, String.valueOf(total), change, negative);
        }

        private double percentChange(long current, long previous) {
                if (previous == 0) {
                        return current == 0 ? 0.0 : 100.0;
                }
                return ((current - previous) * 100.0) / previous;
        }

        private AdminDtos.ChartSeries buildMonthlyCountSeries(int months, CountProvider provider) {
                List<YearMonth> yearMonths = java.util.stream.IntStream.range(0, months)
                                .mapToObj(i -> YearMonth.now().minusMonths(months - 1L - i))
                                .toList();
                List<String> labels = yearMonths.stream()
                                .map(ym -> ym.getMonth().getDisplayName(TextStyle.SHORT, new Locale("vi", "VN")))
                                .toList();
                List<Double> values = yearMonths.stream()
                                .map(ym -> {
                                        LocalDateTime start = ym.atDay(1).atStartOfDay();
                                        LocalDateTime end = ym.plusMonths(1).atDay(1).atStartOfDay();
                                        return (double) provider.count(start, end);
                                })
                                .toList();
                return new AdminDtos.ChartSeries(labels, values);
        }

        private AdminDtos.ChartSeries buildMonthlyAmountSeries(int months) {
                List<YearMonth> yearMonths = java.util.stream.IntStream.range(0, months)
                                .mapToObj(i -> YearMonth.now().minusMonths(months - 1L - i))
                                .toList();
                List<String> labels = yearMonths.stream()
                                .map(ym -> ym.getMonth().getDisplayName(TextStyle.SHORT, new Locale("vi", "VN")))
                                .toList();
                List<Double> values = yearMonths.stream()
                                .map(ym -> {
                                        LocalDateTime start = ym.atDay(1).atStartOfDay();
                                        LocalDateTime end = ym.plusMonths(1).atDay(1).atStartOfDay();
                                        BigDecimal sum = paymentTransactionRepository.findByCreatedAtBetween(start, end).stream()
                                                        .filter(tx -> "PAID".equalsIgnoreCase(tx.getStatus()))
                                                        .map(PaymentTransactionEntity::getAmount)
                                                        .filter(Objects::nonNull)
                                                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                                        return sum.doubleValue();
                                })
                                .toList();
                return new AdminDtos.ChartSeries(labels, values);
        }

        private String formatUsagePct(long used, Integer limit) {
                if (limit == null || limit <= 0) {
                        return "0%";
                }
                if (limit >= 999_999) {
                        return "0%";
                }
                int pct = (int) Math.round(Math.min(100.0, (used * 100.0) / limit));
                return pct + "%";
        }

        private boolean matchesPlanTypeFilter(String userTypeLabel, String filter) {
                if (filter == null || "all".equalsIgnoreCase(filter)) {
                        return true;
                }
                String normalizedType = userTypeLabel == null ? "" : userTypeLabel.toLowerCase(Locale.ROOT);
                if ("paid".equalsIgnoreCase(filter)) {
                        return !normalizedType.equals("free");
                }
                return normalizedType.equals(filter.toLowerCase(Locale.ROOT));
        }

        private int pct(long part, long total) {
                if (total <= 0) {
                        return 0;
                }
                return (int) Math.round((part * 100.0) / total);
        }

        private int pct(BigDecimal part, BigDecimal total) {
                if (part == null || total == null || total.compareTo(BigDecimal.ZERO) == 0) {
                        return 0;
                }
                return part.multiply(BigDecimal.valueOf(100L)).divide(total, 0, RoundingMode.HALF_UP).intValue();
        }

        private String priceLabel(BigDecimal value) {
                if (value == null) {
                        return "0.00";
                }
                return value.setScale(2, RoundingMode.HALF_UP).toPlainString();
        }

        private int clamp(int value, int min, int max) {
                if (value < min) {
                        return min;
                }
                return Math.min(value, max);
        }

        private long countNonAdminUsersBetween(LocalDateTime start, LocalDateTime end) {
                return userRepository.countNonAdminByCreatedAtBetween(start, end);
        }

        private long countAllNonAdminUsers() {
                return userRepository.countNonAdmin();
        }

        private interface CountProvider {
                long count(LocalDateTime start, LocalDateTime end);
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

    public Map<String, String> getSettings() {
        return systemSettingRepository.findAll().stream()
                .collect(Collectors.toMap(SystemSettingEntity::getKey, SystemSettingEntity::getValue));
    }

    @Transactional
    public Map<String, String> updateSettings(Map<String, String> settings) {
        settings.forEach((key, value) -> {
            SystemSettingEntity entity = systemSettingRepository.findById(key)
                    .orElseGet(() -> SystemSettingEntity.builder().key(key).build());
            entity.setValue(value);
            systemSettingRepository.save(entity);
        });
        return getSettings();
    }
}
