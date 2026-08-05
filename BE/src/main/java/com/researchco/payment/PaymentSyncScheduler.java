package com.researchco.payment;

import com.researchco.frontend.FrontendDtos;
import com.researchco.frontend.FrontendService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentSyncScheduler {

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final FrontendService frontendService;

    @Scheduled(fixedDelay = 300000) // Run every 5 minutes (300,000 milliseconds)
    public void syncPendingPayments() {
        log.info("Starting automatic payment status synchronization...");
        try {
            List<PaymentTransactionEntity> pendingTransactions = paymentTransactionRepository.findByStatus("PENDING");
            if (pendingTransactions.isEmpty()) {
                log.info("No pending payment transactions found to synchronize.");
                return;
            }

            log.info("Found {} pending transaction(s) to check.", pendingTransactions.size());
            for (PaymentTransactionEntity tx : pendingTransactions) {
                if (tx.getProviderSessionId() == null || tx.getProviderSessionId().trim().isEmpty()) {
                    log.warn("Transaction ID {} has status PENDING but missing providerSessionId. Skipping.", tx.getId());
                    continue;
                }
                try {
                    log.info("Verifying payment status for user: {}, transaction: {}, providerSessionId: {}", 
                            tx.getUser() != null ? tx.getUser().getEmail() : "Unknown",
                            tx.getId(),
                            tx.getProviderSessionId());
                    
                    FrontendDtos.PricingCheckoutConfirmRequest confirmRequest = 
                            new FrontendDtos.PricingCheckoutConfirmRequest(tx.getProviderSessionId());
                    
                    FrontendDtos.PricingCheckoutResponse response = frontendService.confirmCheckout(confirmRequest);
                    
                    log.info("Verification result for transaction {}: status={}, message={}", 
                            tx.getId(), response.status(), response.message());
                } catch (Exception e) {
                    log.error("Error verifying payment for transaction ID: {}", tx.getId(), e);
                }
            }
        } catch (Exception e) {
            log.error("Error during automatic payment status synchronization", e);
        }
        log.info("Automatic payment status synchronization completed.");
    }
}
