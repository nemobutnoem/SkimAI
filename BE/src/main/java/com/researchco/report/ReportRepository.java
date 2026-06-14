package com.researchco.report;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReportRepository extends JpaRepository<ReportEntity, UUID> {
    long countByUserId(UUID userId);

    long countByUserIdAndStatusIgnoreCase(UUID userId, String status);

    List<ReportEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<ReportEntity> findByUserIdAndStatusIgnoreCaseOrderByCreatedAtDesc(UUID userId, String status);

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    List<ReportEntity> findTop3ByStatusIgnoreCaseOrderByCreatedAtDesc(String status);

    List<ReportEntity> findAllByOrderByCreatedAtDesc();

    List<ReportEntity> findByStatusIgnoreCaseOrderByCreatedAtDesc(String status);

    @Query("SELECT r FROM ReportEntity r WHERE r.user.id = :userId AND LOWER(r.status) = LOWER(:status) AND r.searchQuery IS NOT NULL AND LOWER(TRIM(r.searchQuery.keyword)) = LOWER(TRIM(:keyword)) AND LOWER(TRIM(r.title)) = LOWER(TRIM(:title)) ORDER BY r.createdAt DESC")
    Optional<ReportEntity> findFirstCachedDeepInsight(@Param("userId") UUID userId, @Param("status") String status, @Param("keyword") String keyword, @Param("title") String title);
}
