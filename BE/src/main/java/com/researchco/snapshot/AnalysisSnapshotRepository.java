package com.researchco.snapshot;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AnalysisSnapshotRepository extends JpaRepository<AnalysisSnapshotEntity, UUID> {
    Optional<AnalysisSnapshotEntity> findBySearchQueryId(UUID searchQueryId);
}
