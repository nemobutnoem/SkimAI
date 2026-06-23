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
        LocalDateTime cutoff = LocalDateTime.now().minusDays(7);
        marketTrendRepository.findTop8ByUpdatedAtAfterOrderByTrendScoreDescUpdatedAtDesc(cutoff).stream()
                .map(trend -> {
                    String market = safeMarketLabel(trend.getMarket(), trend.getKeyword());
                    String keyword = trend.getKeyword() == null || trend.getKeyword().isBlank() ? market : trend.getKeyword();
                    return new HomeDtos.TrendItem(
                        "trend-" + market.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-"),
                        keyword,
                        formatChange(trend.getChangePct()),
                        trend.getSentiment(),
                        market,
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
            new HomeDtos.TrendItem("trend-ai", "Trợ lý AI", "+34%", "positive", "Công nghệ & AI", 12, "Cập nhật vài phút trước"),
            new HomeDtos.TrendItem("trend-ebike", "Xe máy điện", "+21%", "positive", "Xe điện & Di động", 8, "Cập nhật vài phút trước"),
            new HomeDtos.TrendItem("trend-tiktok", "Xu hướng TikTok Shop", "+18%", "neutral", "Thương mại & Bán lẻ", 15, "Cập nhật vài phút trước"),
            new HomeDtos.TrendItem("trend-coffee", "Cà phê muối", "+12%", "positive", "F&B & Tiêu dùng", 6, "Cập nhật vài phút trước")
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
            return "Market signal";
        }
        return "Signals from " + keyword;
    }

    private String safeMarketLabel(String market, String keyword) {
        if (market != null && !market.isBlank()) {
            return market;
        }
        String normalized = keyword == null ? "" : keyword.toLowerCase(Locale.ROOT);
        if (normalized.contains("ai") || normalized.contains("agent") || normalized.contains("automation") || normalized.contains("trợ lý")) {
            return "Công nghệ & AI";
        }
        if (normalized.contains("bike") || normalized.contains("mobility") || normalized.contains("vehicle") || normalized.contains("xe điện") || normalized.contains("xe máy")) {
            return "Xe điện & Di động";
        }
        if (normalized.contains("shop") || normalized.contains("commerce") || normalized.contains("retail") || normalized.contains("thương mại") || normalized.contains("bán lẻ")) {
            return "Thương mại & Bán lẻ";
        }
        if (normalized.contains("pho") || normalized.contains("food") || normalized.contains("beverage") || normalized.contains("cà phê") || normalized.contains("ăn") || normalized.contains("uống")) {
            return "F&B & Tiêu dùng";
        }
        return "Thị trường Mới nổi";
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
