package com.researchco.snapshot;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SnapshotChartRepository extends JpaRepository<SnapshotChartEntity, UUID> {
    List<SnapshotChartEntity> findBySnapshotId(UUID snapshotId);
}
