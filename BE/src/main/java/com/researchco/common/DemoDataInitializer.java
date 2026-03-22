package com.researchco.common;

import com.researchco.plan.PlanEntity;
import com.researchco.plan.PlanRepository;
import com.researchco.provider.SearchProviderRepository;
import com.researchco.subscription.UserSubscriptionEntity;
import com.researchco.subscription.UserSubscriptionRepository;
import com.researchco.user.UserEntity;
import com.researchco.user.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DemoDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PlanRepository planRepository;
    private final SearchProviderRepository searchProviderRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final PasswordEncoder passwordEncoder;

    public DemoDataInitializer(UserRepository userRepository,
                               PlanRepository planRepository,
                               SearchProviderRepository searchProviderRepository,
                               UserSubscriptionRepository userSubscriptionRepository,
                               PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.planRepository = planRepository;
        this.searchProviderRepository = searchProviderRepository;
        this.userSubscriptionRepository = userSubscriptionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        PlanEntity freePlan = planRepository.findByName("FREE").orElse(null);
        PlanEntity businessPlan = planRepository.findByName("BUSINESS").orElse(null);

        seedUser("demo@skimai.local", "Demo User", "USER", freePlan);
        seedUser("admin@skimai.local", "Admin", "ADMIN", businessPlan != null ? businessPlan : freePlan);
        searchProviderRepository.findByProviderCode("YOUTUBE_API").ifPresent(provider -> {
            provider.setIsActive(true);
            searchProviderRepository.save(provider);
        });
    }

    private void seedUser(String email, String fullName, String role, PlanEntity plan) {
        if (userRepository.existsByEmail(email) || plan == null) {
            return;
        }

        UserEntity user = UserEntity.builder()
                .fullName(fullName)
                .email(email)
                .passwordHash(passwordEncoder.encode("123456"))
                .role(role)
                .status("ACTIVE")
                .build();
        userRepository.save(user);

        userSubscriptionRepository.save(UserSubscriptionEntity.builder()
                .user(user)
                .plan(plan)
                .startDate(LocalDateTime.now())
                .status("ACTIVE")
                .build());
    }
}
