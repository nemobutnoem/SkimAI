package com.researchco.search;

import com.researchco.user.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SearchQueryRepository extends JpaRepository<SearchQueryEntity, UUID> {
    List<SearchQueryEntity> findByUserOrderByCreatedAtDesc(UserEntity user);

    long countByUser(UserEntity user);
}
