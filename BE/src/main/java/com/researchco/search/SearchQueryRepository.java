package com.researchco.search;

import com.researchco.user.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SearchQueryRepository extends JpaRepository<SearchQueryEntity, UUID> {
    List<SearchQueryEntity> findByUserOrderByCreatedAtDesc(UserEntity user);

    long countByUser(UserEntity user);

    long countByUserAndCreatedAtAfter(UserEntity user, LocalDateTime after);

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    List<SearchQueryEntity> findTop10ByUserOrderByCreatedAtDesc(UserEntity user);

    List<SearchQueryEntity> findByUserAndKeywordAndCountryCodeAndLanguageCode(
            UserEntity user,
            String keyword,
            String countryCode,
            String languageCode
    );

    Optional<SearchQueryEntity> findTopByUserAndKeywordIgnoreCaseOrderByCreatedAtDesc(UserEntity user, String keyword);

    @Query("SELECT q FROM SearchQueryEntity q WHERE EXISTS (SELECT s FROM AnalysisSnapshotEntity s WHERE s.searchQuery = q AND s.updatedAt > :since) AND LOWER(TRIM(q.keyword)) = LOWER(TRIM(:keyword)) ORDER BY q.createdAt DESC")
    List<SearchQueryEntity> findByKeywordWithFreshSnapshot(@Param("keyword") String keyword, @Param("since") LocalDateTime since);

    @Query("SELECT q FROM SearchQueryEntity q WHERE EXISTS (SELECT s FROM AnalysisSnapshotEntity s WHERE s.searchQuery = q) AND LOWER(TRIM(q.keyword)) = LOWER(TRIM(:keyword)) ORDER BY q.createdAt DESC")
    List<SearchQueryEntity> findByKeywordWithAnySnapshot(@Param("keyword") String keyword);

    Optional<SearchQueryEntity> findFirstByKeywordIgnoreCaseOrderByCreatedAtDesc(String keyword);
}
