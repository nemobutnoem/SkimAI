package com.researchco.home;

import com.researchco.provider.NormalizedSourceItem;
import com.researchco.provider.ProviderOrchestrator;
import com.researchco.provider.SearchProviderEntity;
import com.researchco.provider.SearchProviderRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class MarketTrendUpdater {

    private final MarketTrendRepository marketTrendRepository;
    private final SearchProviderRepository searchProviderRepository;
    private final ProviderOrchestrator providerOrchestrator;
    private final String seedKeywords;

    public MarketTrendUpdater(MarketTrendRepository marketTrendRepository,
                              SearchProviderRepository searchProviderRepository,
                              ProviderOrchestrator providerOrchestrator,
                              @Value("${home.live-trends.seed-keywords:AI & Automation=AI Agent|Generative AI|AI automation;Mobility & Consumer=Electric bike|Urban mobility|EV commute;Commerce & Platforms=TikTok Shop trends|Social Commerce|Creator commerce;Food & Lifestyle=Pho|Vietnamese street food|Quick noodle recipes}") String seedKeywords) {
        this.marketTrendRepository = marketTrendRepository;
        this.searchProviderRepository = searchProviderRepository;
        this.providerOrchestrator = providerOrchestrator;
        this.seedKeywords = seedKeywords;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void warmUp() {
        boolean needsBackfill = marketTrendRepository.findAll().stream()
                .anyMatch(trend -> trend.getMarket() == null || trend.getMarket().isBlank());
        if (marketTrendRepository.count() == 0 || needsBackfill) {
            refresh();
        }
    }

    @Transactional
    @Scheduled(
            fixedDelayString = "${home.live-trends.refresh-ms:3600000}",
            initialDelayString = "${home.live-trends.refresh-ms:3600000}"
    )
    public void refresh() {
        Set<String> activeCodes = searchProviderRepository.findByIsActiveTrue().stream()
                .map(SearchProviderEntity::getProviderCode)
                .collect(Collectors.toSet());

        List<MarketSeed> seeds = parseSeeds(seedKeywords);

        if (activeCodes.isEmpty() || seeds.isEmpty()) {
            seedFallbackTrends();
            return;
        }

        marketTrendRepository.deleteByMarketNotIn(seeds.stream().map(MarketSeed::market).toList());

        for (MarketSeed seed : seeds) {
            List<NormalizedSourceItem> items = new ArrayList<>();
            for (String query : seed.queries()) {
                items.addAll(providerOrchestrator.aggregate(activeCodes, query, "US", "en", "24h"));
            }
            upsertTrend(seed, items);
        }
    }

    private void upsertTrend(MarketSeed seed, List<NormalizedSourceItem> items) {
        long views = 0L;
        long likes = 0L;
        long comments = 0L;
        int positive = 0;
        int negative = 0;

        Set<String> uniqueSources = new LinkedHashSet<>();
        for (NormalizedSourceItem item : items) {
            if (item.sourceName() != null && !item.sourceName().isBlank()) {
                uniqueSources.add(item.sourceName());
            }
            if (item.rawPayload() instanceof Map<?, ?> payload) {
                views += toLong(payload.get("viewCount"));
                likes += toLong(payload.get("likeCount"));
                comments += toLong(payload.get("commentCount"));
            }
            if ("POSITIVE".equalsIgnoreCase(item.sentimentLabel())) {
                positive++;
            } else if ("NEGATIVE".equalsIgnoreCase(item.sentimentLabel())) {
                negative++;
            }
        }

        long score = Math.max(1L,
                items.size() * 12L
                        + uniqueSources.size() * 8L
                        + Math.round(Math.log10(Math.max(views, 1L)) * 20)
                        + Math.round(Math.log10(Math.max(likes + comments, 1L)) * 12));

        MarketTrendEntity trend = marketTrendRepository.findByMarket(seed.market())
                .or(() -> marketTrendRepository.findByKeyword(seed.primaryQuery()))
                .orElseGet(() -> MarketTrendEntity.builder()
                        .keyword(seed.primaryQuery())
                        .market(seed.market())
                        .previousScore(0L)
                        .build());

        long previous = trend.getTrendScore();
        trend.setKeyword(seed.primaryQuery());
        trend.setMarket(seed.market());
        trend.setPreviousScore(previous);
        trend.setTrendScore(score);
        trend.setSourceCount(Math.max(items.size(), uniqueSources.size()));
        trend.setChangePct(computeChangePct(previous, score));
        trend.setSentiment(resolveSentiment(positive, negative));
        marketTrendRepository.save(trend);
    }

    private void seedFallbackTrends() {
        List<MarketSeed> defaults = List.of(
                new MarketSeed("AI & Automation", List.of("AI Agent")),
                new MarketSeed("Mobility & Consumer", List.of("Electric bike")),
                new MarketSeed("Commerce & Platforms", List.of("TikTok Shop trends")),
                new MarketSeed("Food & Lifestyle", List.of("Pho"))
        );
        int seedScore = 100;
        marketTrendRepository.deleteByMarketNotIn(defaults.stream().map(MarketSeed::market).toList());
        for (MarketSeed seed : defaults) {
            MarketTrendEntity trend = marketTrendRepository.findByMarket(seed.market())
                    .or(() -> marketTrendRepository.findByKeyword(seed.primaryQuery()))
                    .orElseGet(() -> MarketTrendEntity.builder()
                            .keyword(seed.primaryQuery())
                            .market(seed.market())
                            .build());
            trend.setKeyword(seed.primaryQuery());
            trend.setMarket(seed.market());
            trend.setPreviousScore(trend.getTrendScore());
            trend.setTrendScore(seedScore);
            trend.setChangePct(seedScore == 100 ? 24 : 12);
            trend.setSourceCount(3);
            trend.setSentiment(seedScore >= 100 ? "positive" : "neutral");
            marketTrendRepository.save(trend);
            seedScore -= 10;
        }
    }

    private int computeChangePct(long previous, long current) {
        if (previous <= 0) {
            return (int) Math.max(8, Math.min(42, current / 4));
        }
        double raw = ((double) current - previous) / previous * 100.0;
        int rounded = (int) Math.round(raw);
        if (rounded == 0 && current != previous) {
            return current > previous ? 1 : -1;
        }
        return Math.max(-99, Math.min(rounded, 250));
    }

    private String resolveSentiment(int positive, int negative) {
        if (positive > negative) {
            return "positive";
        }
        if (negative > positive) {
            return "negative";
        }
        return "neutral";
    }

    private long toLong(Object value) {
        if (value instanceof Number n) {
            return n.longValue();
        }
        if (value instanceof String s) {
            try {
                return Long.parseLong(s);
            } catch (NumberFormatException ignored) {
            }
        }
        return 0L;
    }

    private List<MarketSeed> parseSeeds(String rawSeeds) {
        return Arrays.stream(rawSeeds.split(";"))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .map(entry -> {
                    String[] parts = entry.split("=", 2);
                    String market = parts[0].trim();
                    List<String> queries = parts.length > 1
                            ? Arrays.stream(parts[1].split("\\|"))
                            .map(String::trim)
                            .filter(value -> !value.isBlank())
                            .distinct()
                            .toList()
                            : List.of(market);
                    return new MarketSeed(market, queries.isEmpty() ? List.of(market) : queries);
                })
                .filter(seed -> !seed.market().isBlank())
                .toList();
    }

    private record MarketSeed(String market, List<String> queries) {
        private String primaryQuery() {
            return queries.isEmpty() ? market : queries.get(0);
        }
    }
}
