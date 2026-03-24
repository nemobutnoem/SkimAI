package com.researchco.home;

import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class HomeService {

    private final MarketTrendRepository marketTrendRepository;

    public HomeService(MarketTrendRepository marketTrendRepository) {
        this.marketTrendRepository = marketTrendRepository;
    }

    public List<HomeDtos.TrendItem> getHomeTrends() {
        Map<String, HomeDtos.TrendItem> uniqueTrends = new LinkedHashMap<>();
        marketTrendRepository.findTop8ByOrderByTrendScoreDescUpdatedAtDesc().stream()
                .map(trend -> {
                    String market = safeMarketLabel(trend.getMarket(), trend.getKeyword());
                    String keyword = trend.getKeyword() == null || trend.getKeyword().isBlank() ? market : trend.getKeyword();
                    return new HomeDtos.TrendItem(
                        "trend-" + market.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-"),
                        market,
                        formatChange(trend.getChangePct()),
                        trend.getSentiment(),
                        formatSignalLabel(keyword),
                        trend.getSourceCount(),
                        formatUpdatedAt(trend.getUpdatedAt())
                    );
                })
                .filter(item -> item.sourceCount() > 0)
                .forEach(item -> uniqueTrends.putIfAbsent(item.name(), item));

        List<HomeDtos.TrendItem> trends = uniqueTrends.values().stream()
                .limit(4)
                .toList();

        if (trends.size() >= 3) {
            return trends;
        }

        List<HomeDtos.TrendItem> fallback = List.of(
                new HomeDtos.TrendItem("trend-ai-automation", "AI & Automation", "+34%", "positive", "Signals from AI Agent", 3, "Updated moments ago"),
                new HomeDtos.TrendItem("trend-mobility-consumer", "Mobility & Consumer", "+21%", "positive", "Signals from Electric bike", 3, "Updated moments ago"),
                new HomeDtos.TrendItem("trend-commerce-platforms", "Commerce & Platforms", "+18%", "neutral", "Signals from TikTok Shop trends", 3, "Updated moments ago"),
                new HomeDtos.TrendItem("trend-food-lifestyle", "Food & Lifestyle", "-6%", "negative", "Signals from Pho", 2, "Updated moments ago")
        );

        if (trends.isEmpty()) {
            return fallback;
        }

        LinkedHashMap<String, HomeDtos.TrendItem> merged = new LinkedHashMap<>();
        trends.forEach(item -> merged.putIfAbsent(item.name(), item));
        fallback.forEach(item -> merged.putIfAbsent(item.name(), item));
        return merged.values().stream().limit(4).toList();
    }

    private String formatChange(int value) {
        return value > 0 ? "+" + value + "%" : value + "%";
    }

    private String formatSignalLabel(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return "AI-generated market signal";
        }
        return "AI signals from " + keyword;
    }

    private String safeMarketLabel(String market, String keyword) {
        if (market != null && !market.isBlank()) {
            return market;
        }
        String normalized = keyword == null ? "" : keyword.toLowerCase(Locale.ROOT);
        if (normalized.contains("ai") || normalized.contains("agent") || normalized.contains("automation")) {
            return "AI & Automation";
        }
        if (normalized.contains("bike") || normalized.contains("mobility") || normalized.contains("vehicle")) {
            return "Mobility & Consumer";
        }
        if (normalized.contains("shop") || normalized.contains("commerce") || normalized.contains("retail")) {
            return "Commerce & Platforms";
        }
        if (normalized.contains("pho") || normalized.contains("food") || normalized.contains("beverage")) {
            return "Food & Lifestyle";
        }
        return "Emerging Market";
    }

    private String formatUpdatedAt(LocalDateTime updatedAt) {
        if (updatedAt == null) {
            return "Updated recently";
        }
        Duration duration = Duration.between(updatedAt, LocalDateTime.now());
        long minutes = Math.max(0, duration.toMinutes());
        if (minutes < 1) {
            return "Updated moments ago";
        }
        if (minutes < 60) {
            return "Updated " + minutes + " min ago";
        }
        long hours = duration.toHours();
        if (hours < 24) {
            return "Updated " + hours + "h ago";
        }
        long days = duration.toDays();
        return "Updated " + days + "d ago";
    }
}
