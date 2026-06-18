package com.researchco.snapshot;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

public interface SnapshotKeywordRepository extends JpaRepository<SnapshotKeywordEntity, UUID> {
    List<SnapshotKeywordEntity> findBySnapshotId(UUID snapshotId);

    @Modifying
    @Transactional
    @Query("delete from SnapshotKeywordEntity s where s.snapshot.id = ?1")
    void deleteBySnapshotId(UUID snapshotId);
}
