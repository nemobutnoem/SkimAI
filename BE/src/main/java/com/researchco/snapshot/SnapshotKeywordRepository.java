package com.researchco.snapshot;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SnapshotKeywordRepository extends JpaRepository<SnapshotKeywordEntity, UUID> {
    List<SnapshotKeywordEntity> findBySnapshotId(UUID snapshotId);
}
