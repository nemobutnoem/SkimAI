package com.researchco.search;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface SavedSearchRepository extends JpaRepository<SavedSearchEntity, UUID> {
}
