package com.researchco.search;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SourceItemRepository extends JpaRepository<SourceItemEntity, UUID> {
    List<SourceItemEntity> findBySearchQueryId(UUID searchQueryId);
}
