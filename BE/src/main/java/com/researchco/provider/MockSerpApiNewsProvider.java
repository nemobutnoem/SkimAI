package com.researchco.provider;

import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Component
public class MockSerpApiNewsProvider implements SearchProvider {

    @Override
    public String providerCode() {
        return "SERPAPI_NEWS";
    }

    @Override
    public List<NormalizedSourceItem> search(String keyword, String countryCode, String languageCode, String timeRange) {
        return List.of(
                new NormalizedSourceItem(
                        providerCode(),
                        "NEWS",
                        "ARTICLE",
                        keyword + " demand increased in Q1",
                        "News trend summary for " + keyword,
                        "https://example.com/news/trend/" + keyword,
                        "Market News",
                        "Editor",
                        LocalDateTime.now().minusDays(1),
                        "POSITIVE",
                        Map.of("provider", providerCode(), "keyword", keyword)
                ),
                new NormalizedSourceItem(
                        providerCode(),
                        "NEWS",
                        "ARTICLE",
                        "Risks around " + keyword + " supply chain",
                        "Potential risks and constraints for " + keyword,
                        "https://example.com/news/risk/" + keyword,
                        "Business News",
                        "Reporter",
                        LocalDateTime.now().minusDays(2),
                        "NEGATIVE",
                        Map.of("provider", providerCode(), "keyword", keyword)
                )
        );
    }
}
