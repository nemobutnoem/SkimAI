package com.researchco.payment;

import com.researchco.user.UserEntity;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransactionEntity, UUID> {
    Optional<PaymentTransactionEntity> findByProviderSessionId(String providerSessionId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM PaymentTransactionEntity p WHERE p.providerSessionId = :sessionId")
    Optional<PaymentTransactionEntity> findByProviderSessionIdForUpdate(@Param("sessionId") String sessionId);

    List<PaymentTransactionEntity> findByUserOrderByCreatedAtDesc(UserEntity user);

    List<PaymentTransactionEntity> findTop10ByOrderByCreatedAtDesc();

    List<PaymentTransactionEntity> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}
