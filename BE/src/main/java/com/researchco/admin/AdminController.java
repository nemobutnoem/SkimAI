package com.researchco.admin;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/dashboard")
    public AdminDtos.DashboardResponse dashboard() {
        return adminService.dashboard();
    }

    @GetMapping("/reports")
    public List<AdminDtos.AdminReportItem> reports(@RequestParam(defaultValue = "all") String status) {
        return adminService.reports(status);
    }

    @PostMapping("/reports/{reportId}/moderate")
    public AdminDtos.AdminReportItem moderate(@PathVariable UUID reportId,
                                              @Valid @RequestBody AdminDtos.ModerateReportRequest request) {
        return adminService.moderateReport(reportId, request.status());
    }

    @GetMapping("/users")
    public List<AdminDtos.AdminUserItem> users(@RequestParam(required = false) String q,
                                               @RequestParam(defaultValue = "all") String type,
                                               @RequestParam(defaultValue = "all") String status) {
        return adminService.users(q, type, status);
    }

    @GetMapping("/revenue")
    public AdminDtos.RevenueResponse revenue() {
        return adminService.revenue();
    }
}
