package com.researchco.subscription;

import com.researchco.user.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserSubscriptionRepository extends JpaRepository<UserSubscriptionEntity, UUID> {
    Optional<UserSubscriptionEntity> findFirstByUserAndStatusOrderByStartDateDesc(UserEntity user, String status);

    List<UserSubscriptionEntity> findByUserOrderByStartDateDesc(UserEntity user);

    List<UserSubscriptionEntity> findByUserAndStatus(UserEntity user, String status);

    List<UserSubscriptionEntity> findByStatus(String status);

    long countByStartDateBetween(LocalDateTime start, LocalDateTime end);

    long countByUser(UserEntity user);
}
