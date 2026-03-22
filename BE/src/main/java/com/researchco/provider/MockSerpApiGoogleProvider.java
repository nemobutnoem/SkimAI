package com.researchco.provider;

import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Component
public class MockSerpApiGoogleProvider implements SearchProvider {

    @Override
    public String providerCode() {
        return "SERPAPI_GOOGLE";
    }

    @Override
    public List<NormalizedSourceItem> search(String keyword, String countryCode, String languageCode, String timeRange) {
        return List.of(
                new NormalizedSourceItem(
                        providerCode(),
                        "GOOGLE",
                        "WEB",
                        "Market overview for " + keyword,
                        "General market signals related to " + keyword,
                        "https://example.com/google/" + keyword,
                        "Example Search",
                        "System",
                        LocalDateTime.now().minusHours(4),
                        "POSITIVE",
                        Map.of("provider", providerCode(), "keyword", keyword)
                ),
                new NormalizedSourceItem(
                        providerCode(),
                        "GOOGLE",
                        "WEB",
                        keyword + " competitor analysis",
                        "Competitor movement and product update patterns.",
                        "https://example.com/google/competitor/" + keyword,
                        "Insights Blog",
                        "Analyst",
                        LocalDateTime.now().minusHours(12),
                        "NEUTRAL",
                        Map.of("provider", providerCode(), "keyword", keyword)
                )
        );
    }
}
