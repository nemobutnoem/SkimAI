package com.researchco.frontend;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class FrontendController {

    private final FrontendService frontendService;

    public FrontendController(FrontendService frontendService) {
        this.frontendService = frontendService;
    }

    @GetMapping("/dashboard")
    public FrontendDtos.DashboardResponse getDashboard() {
        return frontendService.getDashboard();
    }

    @GetMapping("/account/overview")
    public FrontendDtos.AccountOverviewResponse getAccountOverview() {
        return frontendService.getAccountOverview();
    }

    @PutMapping("/account/notifications")
    public Map<String, Boolean> saveNotificationSettings(@RequestBody Map<String, Boolean> settings) {
        return frontendService.saveNotificationSettings(settings);
    }

    @GetMapping("/analysis")
    public FrontendDtos.AnalysisResponse getAnalysis(@RequestParam(name = "keyword", defaultValue = "AI Agent") String keyword) {
        return frontendService.getAnalysis(keyword);
    }

    @PostMapping("/deep-insight")
    public FrontendDtos.DeepInsightResponse getDeepInsight(@RequestBody FrontendDtos.DeepInsightRequest request) {
        return frontendService.getDeepInsight(request);
    }

    @GetMapping("/experts")
    public List<FrontendDtos.ExpertItem> getExperts() {
        return frontendService.getExperts();
    }

    @PostMapping("/experts/questions")
    public FrontendDtos.ExpertQuestionResponse submitExpertQuestion(@RequestBody FrontendDtos.ExpertQuestionRequest request) {
        return frontendService.submitExpertQuestion(request);
    }

    @GetMapping("/pricing")
    public List<FrontendDtos.PricingPlan> getPricing() {
        return frontendService.getPricing();
    }

    @PostMapping("/pricing/checkout")
    public FrontendDtos.PricingCheckoutResponse checkout(@RequestBody FrontendDtos.PricingCheckoutRequest request) {
        return frontendService.checkout(request);
    }

    @PostMapping("/pricing/contact-sales")
    public FrontendDtos.SalesContactResponse contactSales(@RequestBody FrontendDtos.SalesContactRequest request) {
        return frontendService.contactSales(request);
    }

    @PostMapping("/pricing/confirm")
    public FrontendDtos.PricingCheckoutResponse confirmCheckout(@RequestBody FrontendDtos.PricingCheckoutConfirmRequest request) {
        return frontendService.confirmCheckout(request);
    }
}
