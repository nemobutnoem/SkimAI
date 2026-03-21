package com.researchco.admin;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AdminActionRepository extends JpaRepository<AdminActionEntity, UUID> {
}
