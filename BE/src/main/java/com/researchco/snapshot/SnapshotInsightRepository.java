package com.researchco.snapshot;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SnapshotInsightRepository extends JpaRepository<SnapshotInsightEntity, UUID> {
    List<SnapshotInsightEntity> findBySnapshotId(UUID snapshotId);
}
