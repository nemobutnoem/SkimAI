package com.researchco.feedback;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SupportFeedbackRepository extends JpaRepository<SupportFeedbackEntity, UUID> {
    List<SupportFeedbackEntity> findAllByOrderByCreatedAtDesc();
}
