package com.researchco.home;

import com.researchco.provider.ai.AiProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.UUID;

@Component
public class MarketTrendUpdater {

    private final MarketTrendRepository marketTrendRepository;
    private final AiProvider aiProvider;
    private final String seedKeywords;

    public MarketTrendUpdater(MarketTrendRepository marketTrendRepository,
                              AiProvider aiProvider,
                              @Value("${home.live-trends.seed-keywords:AI & Automation=AI Agent|Generative AI|AI automation;Mobility & Consumer=Electric bike|Urban mobility|EV commute;Commerce & Platforms=TikTok Shop trends|Social Commerce|Creator commerce;Food & Lifestyle=Pho|Vietnamese street food|Quick noodle recipes}") String seedKeywords) {
        this.marketTrendRepository = marketTrendRepository;
        this.aiProvider = aiProvider;
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
        List<MarketSeed> seeds = parseSeeds(seedKeywords);
        if (seeds.isEmpty()) {
            seedFallbackTrends();
            return;
        }

        marketTrendRepository.deleteByMarketNotIn(seeds.stream().map(MarketSeed::market).toList());

        LinkedHashMap<String, List<String>> seedMap = new LinkedHashMap<>();
        seeds.forEach(seed -> seedMap.put(seed.market(), seed.queries()));

        List<AiProvider.LiveTrendSignal> signals = aiProvider.generateLiveTrends(seedMap);
        if (signals.isEmpty()) {
            seedFallbackTrends();
            return;
        }

        for (AiProvider.LiveTrendSignal signal : signals) {
            upsertTrend(signal, seedMap.getOrDefault(signal.market(), List.of(signal.keyword())));
        }
    }

    private void upsertTrend(AiProvider.LiveTrendSignal signal, List<String> seedKeywords) {
        String market = signal.market() == null || signal.market().isBlank() ? "Emerging Market" : signal.market();
        String resolvedKeyword = signal.keyword();
        if (resolvedKeyword == null || resolvedKeyword.isBlank()) {
            resolvedKeyword = seedKeywords.isEmpty() ? market : seedKeywords.get(0);
        }
        final String keyword = resolvedKeyword;

        MarketTrendEntity trend = marketTrendRepository.findByMarket(market)
                .or(() -> marketTrendRepository.findByKeyword(keyword))
                .orElseGet(() -> MarketTrendEntity.builder()
                        .keyword(keyword)
                        .market(market)
                        .previousScore(0L)
                        .build());

        String uniqueKeyword = ensureUniqueKeyword(keyword, market, trend.getId(), seedKeywords);

        long previous = trend.getTrendScore();
        long score = Math.max(50L, signal.trendScore());
        trend.setKeyword(uniqueKeyword);
        trend.setMarket(market);
        trend.setPreviousScore(previous);
        trend.setTrendScore(score);
        trend.setSourceCount(Math.max(1, signal.sourceCount()));
        int aiChangePct = signal.changePct();
        trend.setChangePct(aiChangePct == 0 ? computeChangePct(previous, score) : clamp(aiChangePct, -99, 250));
        trend.setSentiment(normalizeSentiment(signal.sentiment()));
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

    private String normalizeSentiment(String sentiment) {
        if ("negative".equalsIgnoreCase(sentiment)) {
            return "negative";
        }
        if ("positive".equalsIgnoreCase(sentiment)) {
            return "positive";
        }
        return "neutral";
    }

    private int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }

    private String ensureUniqueKeyword(String candidate,
                                       String market,
                                       UUID currentId,
                                       List<String> seedKeywords) {
        String base = (candidate == null || candidate.isBlank()) ? market : candidate.trim();
        if (!isKeywordTakenByOtherRow(base, currentId)) {
            return base;
        }

        String seedFallback = (seedKeywords == null || seedKeywords.isEmpty())
                ? market + " Signal"
                : seedKeywords.get(0).trim();
        if (!isKeywordTakenByOtherRow(seedFallback, currentId)) {
            return seedFallback;
        }

        String marketFallback = market + " Signal";
        if (!isKeywordTakenByOtherRow(marketFallback, currentId)) {
            return marketFallback;
        }

        return market + " Signal " + System.currentTimeMillis();
    }

    private boolean isKeywordTakenByOtherRow(String keyword, UUID currentId) {
        return marketTrendRepository.findByKeyword(keyword)
                .map(existing -> currentId == null || !existing.getId().equals(currentId))
                .orElse(false);
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
