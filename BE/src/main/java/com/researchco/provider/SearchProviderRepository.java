package com.researchco.provider;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SearchProviderRepository extends JpaRepository<SearchProviderEntity, UUID> {
    List<SearchProviderEntity> findByIsActiveTrue();

    Optional<SearchProviderEntity> findByProviderCode(String providerCode);
}
