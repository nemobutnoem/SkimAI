package com.researchco.home;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MarketTrendRepository extends JpaRepository<MarketTrendEntity, UUID> {
    List<MarketTrendEntity> findTop8ByOrderByTrendScoreDescUpdatedAtDesc();

    Optional<MarketTrendEntity> findByKeyword(String keyword);

    Optional<MarketTrendEntity> findByMarket(String market);

    void deleteByMarketNotIn(List<String> markets);
}
