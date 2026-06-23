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
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class MarketTrendUpdater {

    private final MarketTrendRepository marketTrendRepository;
    private final AiProvider aiProvider;
    private final String seedKeywords;

    public MarketTrendUpdater(MarketTrendRepository marketTrendRepository,
                              AiProvider aiProvider,
                              @Value("${home.live-trends.seed-keywords:Market Research=consumer demand|market signals|category growth;Mobility & Consumer=Electric bike|Urban mobility|EV commute;Commerce & Platforms=TikTok Shop trends|Social Commerce|Creator commerce;Food & Lifestyle=Pho|Vietnamese street food|Quick noodle recipes}") String seedKeywords) {
        this.marketTrendRepository = marketTrendRepository;
        this.aiProvider = aiProvider;
        this.seedKeywords = seedKeywords;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void warmUp() {
        if (marketTrendRepository.count() > 0) {
            return;
        }
        refresh();
    }

    @Scheduled(
            fixedDelayString = "${home.live-trends.refresh-ms:3600000}",
            initialDelayString = "${home.live-trends.refresh-ms:3600000}"
    )
    public void refresh() {
        List<MarketSeed> seeds = parseSeeds(seedKeywords);
        LinkedHashMap<String, List<String>> seedMap = new LinkedHashMap<>();
        seeds.forEach(seed -> seedMap.put(seed.market(), seed.queries()));

        List<AiProvider.LiveTrendSignal> signals = aiProvider.generateLiveTrends(seedMap);
        if (signals.isEmpty()) {
            saveFallbackTrends();
            return;
        }

        saveSignals(signals);
    }

    @Transactional
    public void saveSignals(List<AiProvider.LiveTrendSignal> signals) {
        // Cache old trends to preserve previous scores
        Map<String, Long> oldScores = marketTrendRepository.findAll().stream()
                .filter(t -> t.getMarket() != null)
                .collect(Collectors.toMap(
                        t -> t.getMarket().toLowerCase(java.util.Locale.ROOT),
                        MarketTrendEntity::getTrendScore,
                        (s1, s2) -> s1
                ));

        marketTrendRepository.deleteAll();

        for (AiProvider.LiveTrendSignal signal : signals) {
            String market = signal.market() == null || signal.market().isBlank() ? "Emerging Market" : signal.market();
            String keyword = signal.keyword() == null || signal.keyword().isBlank() ? market : signal.keyword();
            
            long previous = oldScores.getOrDefault(market.toLowerCase(java.util.Locale.ROOT), 0L);
            long score = Math.max(50L, signal.trendScore());
            if (previous == 0L) {
                double factor = 1.0 + (signal.changePct() / 100.0);
                previous = Math.round(score / factor);
            }

            MarketTrendEntity trend = MarketTrendEntity.builder()
                    .keyword(keyword)
                    .market(market)
                    .previousScore(previous)
                    .trendScore(score)
                    .sourceCount(Math.max(1, signal.sourceCount()))
                    .changePct(signal.changePct())
                    .sentiment(normalizeSentiment(signal.sentiment()))
                    .build();

            marketTrendRepository.save(trend);
        }
    }

    @Transactional
    public void saveFallbackTrends() {
        List<FallbackSeed> allFallbacks = List.of(
            new FallbackSeed("Công nghệ & AI", "Trợ lý AI doanh nghiệp", "positive", 180, 24),
            new FallbackSeed("Xe điện & Di động", "Xe máy điện", "positive", 140, 15),
            new FallbackSeed("Thương mại & Bán lẻ", "Xu hướng TikTok Shop", "neutral", 210, 18),
            new FallbackSeed("F&B & Tiêu dùng", "Cà phê muối", "positive", 110, 8),
            new FallbackSeed("Tài chính Cá nhân", "Tích lũy vàng kỹ thuật số", "neutral", 95, 2),
            new FallbackSeed("Sức khỏe & Đời sống", "Sữa hạt dinh dưỡng", "positive", 130, 12),
            new FallbackSeed("Nhà thông minh", "Thiết bị an ninh IoT", "neutral", 115, 6),
            new FallbackSeed("Du lịch & Trải nghiệm", "Xu hướng Glamping", "positive", 150, 21),
            new FallbackSeed("Giải trí & Truyền thông", "Video ngắn (TikTok/Shorts)", "positive", 175, 30),
            new FallbackSeed("Giáo dục & Công nghệ", "AI hỗ trợ học tập", "positive", 160, 27)
        );

        long hourSeed = System.currentTimeMillis() / (1000L * 60L * 60L);
        java.util.Random random = new java.util.Random(hourSeed);
        
        List<FallbackSeed> selected = new java.util.ArrayList<>(allFallbacks);
        java.util.Collections.shuffle(selected, random);
        List<FallbackSeed> subList = selected.subList(0, 4);

        marketTrendRepository.deleteAll();
        for (FallbackSeed seed : subList) {
            long score = seed.baseScore() + random.nextInt(30);
            int change = seed.baseChange() + random.nextInt(10);
            long previous = Math.round(score / (1.0 + (change / 100.0)));
            int sourceCount = 10 + random.nextInt(25);

            MarketTrendEntity trend = MarketTrendEntity.builder()
                    .keyword(seed.query())
                    .market(seed.market())
                    .previousScore(previous)
                    .trendScore(score)
                    .changePct(change)
                    .sourceCount(sourceCount)
                    .sentiment(seed.sentiment())
                    .build();
            marketTrendRepository.save(trend);
        }
    }

    private record FallbackSeed(String market, String query, String sentiment, int baseScore, int baseChange) {}

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
