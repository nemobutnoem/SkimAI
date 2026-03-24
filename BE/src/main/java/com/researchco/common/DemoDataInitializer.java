package com.researchco.common;

import com.researchco.plan.PlanEntity;
import com.researchco.plan.PlanRepository;
import com.researchco.payment.PaymentTransactionEntity;
import com.researchco.payment.PaymentTransactionRepository;
import com.researchco.provider.SearchProviderRepository;
import com.researchco.subscription.UserSubscriptionEntity;
import com.researchco.subscription.UserSubscriptionRepository;
import com.researchco.user.UserEntity;
import com.researchco.user.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Component
public class DemoDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PlanRepository planRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final SearchProviderRepository searchProviderRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final PasswordEncoder passwordEncoder;

    public DemoDataInitializer(UserRepository userRepository,
                               PlanRepository planRepository,
                               PaymentTransactionRepository paymentTransactionRepository,
                               SearchProviderRepository searchProviderRepository,
                               UserSubscriptionRepository userSubscriptionRepository,
                               PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.planRepository = planRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.searchProviderRepository = searchProviderRepository;
        this.userSubscriptionRepository = userSubscriptionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        migrateLegacyPlans();

        PlanEntity freePlan = planRepository.findByName("FREE").orElse(null);
        PlanEntity enterprisePlan = planRepository.findByName("ENTERPRISE").orElse(null);

        seedUser("demo@skimai.local", "Demo User", "USER", freePlan);
        seedUser("admin@skimai.local", "Admin", "ADMIN", enterprisePlan != null ? enterprisePlan : freePlan);
        searchProviderRepository.findByProviderCode("YOUTUBE_API").ifPresent(provider -> {
            provider.setIsActive(true);
            searchProviderRepository.save(provider);
        });
    }

    private void migrateLegacyPlans() {
        Map<String, String> legacyToCurrent = Map.of(
                "STANDARD", "STARTER",
                "PREMIUM", "TEAM",
                "BUSINESS", "ENTERPRISE"
        );

        for (Map.Entry<String, String> entry : legacyToCurrent.entrySet()) {
            PlanEntity legacyPlan = planRepository.findByName(entry.getKey()).orElse(null);
            PlanEntity currentPlan = planRepository.findByName(entry.getValue()).orElse(null);
            if (legacyPlan == null || currentPlan == null) {
                continue;
            }

            List<UserSubscriptionEntity> subscriptions = userSubscriptionRepository.findAll().stream()
                    .filter(subscription -> subscription.getPlan() != null && legacyPlan.getId().equals(subscription.getPlan().getId()))
                    .toList();
            subscriptions.forEach(subscription -> subscription.setPlan(currentPlan));
            userSubscriptionRepository.saveAll(subscriptions);

            List<PaymentTransactionEntity> payments = paymentTransactionRepository.findAll().stream()
                    .filter(payment -> payment.getPlan() != null && legacyPlan.getId().equals(payment.getPlan().getId()))
                    .toList();
            payments.forEach(payment -> payment.setPlan(currentPlan));
            paymentTransactionRepository.saveAll(payments);

            planRepository.delete(legacyPlan);
        }
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
