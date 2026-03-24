package com.researchco.usage;

import com.researchco.user.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AiUsageRepository extends JpaRepository<AiUsageEntity, UUID> {

    Optional<AiUsageEntity> findByUserAndFeatureAndPeriodKey(UserEntity user, String feature, String periodKey);
}

