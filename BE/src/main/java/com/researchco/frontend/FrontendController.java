package com.researchco.frontend;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;

@Validated
@RestController
@RequestMapping("/api")
public class FrontendController {

    private final FrontendService frontendService;
    private final StreamingAnalysisService streamingAnalysisService;
    private final org.springframework.core.task.AsyncTaskExecutor taskExecutor;
    private final java.util.concurrent.ConcurrentHashMap<String, Object> keywordLocks = new java.util.concurrent.ConcurrentHashMap<>();

    public FrontendController(
            FrontendService frontendService,
            StreamingAnalysisService streamingAnalysisService,
            org.springframework.core.task.AsyncTaskExecutor taskExecutor) {
        this.frontendService = frontendService;
        this.streamingAnalysisService = streamingAnalysisService;
        this.taskExecutor = taskExecutor;
    }

    private Object getLock(String keyword) {
        String normalized = keyword == null ? "" : keyword.trim().toLowerCase(java.util.Locale.ROOT);
        return keywordLocks.computeIfAbsent(normalized, k -> new Object());
    }

    @GetMapping("/dashboard")
    public FrontendDtos.DashboardResponse getDashboard() {
        return frontendService.getDashboard();
    }

    @GetMapping("/account/overview")
    public FrontendDtos.AccountOverviewResponse getAccountOverview() {
        return frontendService.getAccountOverview();
    }

    @PutMapping("/account/profile")
    public FrontendDtos.Profile updateProfile(@RequestBody @jakarta.validation.Valid FrontendDtos.ProfileUpdateRequest request) {
        return frontendService.updateProfile(request);
    }

    @PostMapping("/account/password")
    public Map<String, String> changePassword(@RequestBody @jakarta.validation.Valid FrontendDtos.PasswordChangeRequest request) {
        frontendService.changePassword(request);
        return Map.of("message", "Đổi mật khẩu thành công!");
    }

    @PutMapping("/account/notifications")
    public Map<String, Boolean> saveNotificationSettings(@RequestBody Map<String, Boolean> settings) {
        return frontendService.saveNotificationSettings(settings);
    }

    @GetMapping("/analysis")
    public FrontendDtos.AnalysisResponse getAnalysis(@RequestParam(name = "keyword", defaultValue = "") @Size(max = 255) String keyword) {
        synchronized (getLock(keyword)) {
            return frontendService.getAnalysis(keyword);
        }
    }

    @PostMapping("/reports/export")
    public Map<String, Object> exportReport(@RequestParam(name = "keyword", defaultValue = "") @Size(max = 255) String keyword) {
        return frontendService.exportReport(keyword);
    }

    @GetMapping("/analysis/stream")
    public SseEmitter getAnalysisStream(@RequestParam(name = "keyword", defaultValue = "") @Size(max = 255) String keyword) {
        java.util.UUID userId = com.researchco.security.SecurityUtils.currentUserId();
        SseEmitter emitter = new SseEmitter(300000L); // 5 min timeout
        taskExecutor.execute(() -> {
            synchronized (getLock(keyword)) {
                streamingAnalysisService.streamAnalysis(keyword, userId, emitter);
            }
        });
        return emitter;
    }

    @GetMapping("/analysis/project")
    public FrontendDtos.ProjectWorkflowResponse getProjectWorkflow(@RequestParam(name = "keyword", defaultValue = "") @Size(max = 255) String keyword) {
        synchronized (getLock(keyword)) {
            return frontendService.getProjectWorkflow(keyword);
        }
    }

    @GetMapping("/analysis/alerts")
    public List<FrontendDtos.AlertItem> getAnalysisAlerts(@RequestParam(name = "keyword", defaultValue = "") @Size(max = 255) String keyword) {
        synchronized (getLock(keyword)) {
            return frontendService.getAnalysisAlerts(keyword);
        }
    }

    @GetMapping("/analysis/competitor")
    public List<FrontendDtos.CompetitorSignal> getCompetitorSignals(@RequestParam(name = "keyword", defaultValue = "") @Size(max = 255) String keyword) {
        synchronized (getLock(keyword)) {
            return frontendService.getCompetitorSignals(keyword);
        }
    }

    @GetMapping("/analysis/evidence")
    public List<FrontendDtos.EvidenceItem> getAnalysisEvidence(@RequestParam(name = "keyword", defaultValue = "") @Size(max = 255) String keyword) {
        synchronized (getLock(keyword)) {
            return frontendService.getAnalysisEvidence(keyword);
        }
    }

    @GetMapping("/analysis/compare")
    public List<FrontendDtos.CompareItem> getAnalysisCompare(@RequestParam(name = "keyword", defaultValue = "") @Size(max = 255) String keyword) {
        synchronized (getLock(keyword)) {
            return frontendService.getAnalysisCompare(keyword);
        }
    }

    @GetMapping("/analysis/timeline")
    public List<FrontendDtos.TimeSeriesPoint> getAnalysisTimeline(@RequestParam(name = "keyword", defaultValue = "") @Size(max = 255) String keyword) {
        synchronized (getLock(keyword)) {
            return frontendService.getAnalysisTimeline(keyword);
        }
    }

    @PostMapping("/deep-insight")
    public FrontendDtos.DeepInsightResponse getDeepInsight(@RequestBody @Valid FrontendDtos.DeepInsightRequest request) {
        synchronized (getLock(request.keyword())) {
            return frontendService.getDeepInsight(request);
        }
    }

    @GetMapping("/experts")
    public List<FrontendDtos.ExpertItem> getExperts() {
        return frontendService.getExperts();
    }

    @PostMapping("/experts/questions")
    public FrontendDtos.ExpertQuestionResponse submitExpertQuestion(@RequestBody @Valid FrontendDtos.ExpertQuestionRequest request) {
        return frontendService.submitExpertQuestion(request);
    }

    @GetMapping("/pricing")
    public List<FrontendDtos.PricingPlan> getPricing() {
        return frontendService.getPricing();
    }

    @PostMapping("/pricing/checkout")
    public FrontendDtos.PricingCheckoutResponse checkout(@RequestBody @Valid FrontendDtos.PricingCheckoutRequest request) {
        return frontendService.checkout(request);
    }

    @PostMapping("/pricing/contact-sales")
    public FrontendDtos.SalesContactResponse contactSales(@RequestBody @Valid FrontendDtos.SalesContactRequest request) {
        return frontendService.contactSales(request);
    }

    @PostMapping("/pricing/confirm")
    public FrontendDtos.PricingCheckoutResponse confirmCheckout(@RequestBody @Valid FrontendDtos.PricingCheckoutConfirmRequest request) {
        return frontendService.confirmCheckout(request);
    }

    @PostMapping("/payment/payos-webhook")
    public Map<String, Object> payosWebhook(@RequestBody Map<String, Object> payload) {
        return frontendService.handlePayOsWebhook(payload);
    }
}
