package com.researchco.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<UserEntity, UUID> {
    Optional<UserEntity> findByEmail(String email);

    boolean existsByEmail(String email);

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COUNT(u) FROM UserEntity u WHERE LOWER(u.role) != 'admin'")
    long countNonAdmin();

    @Query("SELECT COUNT(u) FROM UserEntity u WHERE LOWER(u.role) != 'admin' AND u.createdAt > :start AND u.createdAt < :end")
    long countNonAdminByCreatedAtBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT u FROM UserEntity u WHERE LOWER(u.role) != 'admin'")
    List<UserEntity> findAllNonAdmin();
}
