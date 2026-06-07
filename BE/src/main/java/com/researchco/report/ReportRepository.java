package com.researchco.report;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface ReportRepository extends JpaRepository<ReportEntity, UUID> {
    long countByUserId(UUID userId);

    List<ReportEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<ReportEntity> findByUserIdAndStatusIgnoreCaseOrderByCreatedAtDesc(UUID userId, String status);

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    List<ReportEntity> findTop3ByStatusIgnoreCaseOrderByCreatedAtDesc(String status);
}
