package com.researchco.search;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

public interface SourceItemRepository extends JpaRepository<SourceItemEntity, UUID> {
    List<SourceItemEntity> findBySearchQueryId(UUID searchQueryId);

    @Modifying
    @Transactional
    @Query("delete from SourceItemEntity s where s.searchQuery.id = ?1")
    void deleteBySearchQueryId(UUID searchQueryId);
}
