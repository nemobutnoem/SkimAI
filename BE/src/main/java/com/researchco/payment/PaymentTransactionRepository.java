package com.researchco.payment;

import com.researchco.user.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransactionEntity, UUID> {
    Optional<PaymentTransactionEntity> findByProviderSessionId(String providerSessionId);

    List<PaymentTransactionEntity> findByUserOrderByCreatedAtDesc(UserEntity user);

    List<PaymentTransactionEntity> findTop10ByOrderByCreatedAtDesc();

    List<PaymentTransactionEntity> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}
