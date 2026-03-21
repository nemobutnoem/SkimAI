package com.researchco.admin;

import com.researchco.report.ReportRepository;
import com.researchco.search.SearchQueryRepository;
import com.researchco.subscription.UserSubscriptionRepository;
import com.researchco.user.UserRepository;
import org.springframework.stereotype.Service;

@Service
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
                userRepository.count(),
                searchQueryRepository.count(),
                reportRepository.count(),
                userSubscriptionRepository.count()
        );
    }
}
