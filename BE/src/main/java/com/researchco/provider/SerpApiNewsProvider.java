package com.researchco.provider;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Component
public class SerpApiNewsProvider implements SearchProvider {

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String apiKey;
    private final int maxResults;

    public SerpApiNewsProvider(ObjectMapper objectMapper,
                               @Value("${integration.serpapi.api-key:}") String apiKey,
                               @Value("${integration.serpapi.news-max-results:5}") int maxResults) {
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.maxResults = maxResults;
        this.httpClient = HttpClient.newHttpClient();
    }

    @Override
    public String providerCode() {
        return "SERPAPI_NEWS";
    }

    @Override
    public List<NormalizedSourceItem> search(String keyword, String countryCode, String languageCode, String timeRange) {
        if (apiKey == null || apiKey.isBlank()) {
            return List.of();
        }

        try {
            URI uri = UriComponentsBuilder
                    .fromUriString("https://serpapi.com/search.json")
                    .queryParam("engine", "google")
                    .queryParam("tbm", "nws")
                    .queryParam("q", keyword)
                    .queryParam("google_domain", resolveGoogleDomain(countryCode))
                    .queryParam("gl", blankToNull(countryCode))
                    .queryParam("hl", blankToNull(languageCode))
                    .queryParam("num", maxResults)
                    .queryParam("api_key", apiKey)
                    .encode()
                    .build()
                    .toUri();

            JsonNode root = getJson(uri);
            if (root == null || !root.path("news_results").isArray()) {
                return List.of();
            }

            List<NormalizedSourceItem> items = new ArrayList<>();
            for (JsonNode result : root.path("news_results")) {
                String title = text(result, "title", keyword + " news");
                String snippet = text(result, "snippet", "News coverage related to " + keyword);
                String link = text(result, "link", "");
                if (link.isBlank()) {
                    continue;
                }

                Map<String, Object> rawPayload = new LinkedHashMap<>();
                rawPayload.put("provider", providerCode());
                rawPayload.put("keyword", keyword);
                rawPayload.put("position", result.path("position").asInt(0));
                rawPayload.put("date", text(result, "date", ""));
                rawPayload.put("publishedAt", text(result, "published_at", ""));
                rawPayload.put("thumbnail", text(result, "thumbnail", ""));
                rawPayload.put("favicon", text(result, "favicon", ""));

                items.add(new NormalizedSourceItem(
                        providerCode(),
                        "NEWS",
                        "ARTICLE",
                        title,
                        snippet,
                        link,
                        text(result, "source", inferSourceName(link)),
                        text(result, "source", "SerpApi News"),
                        parsePublishedAt(result),
                        inferSentiment(title + " " + snippet),
                        rawPayload
                ));
            }
            return items;
        } catch (Exception e) {
            System.err.println("[SERPAPI_NEWS] Search failed for keyword=\"" + keyword + "\": " + e.getMessage());
            return List.of();
        }
    }

    private JsonNode getJson(URI uri) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(uri).GET().build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            System.err.println("[SERPAPI_NEWS] HTTP " + response.statusCode() + " for request.");
            System.err.println("[SERPAPI_NEWS] Response body: " + response.body());
            return null;
        }
        return objectMapper.readTree(response.body());
    }

    private String resolveGoogleDomain(String countryCode) {
        if (countryCode == null || countryCode.isBlank()) {
            return "google.com";
        }
        return switch (countryCode.trim().toLowerCase(Locale.ROOT)) {
            case "vn" -> "google.com.vn";
            case "us" -> "google.com";
            case "uk", "gb" -> "google.co.uk";
            default -> "google.com";
        };
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private String text(JsonNode node, String field, String fallback) {
        if (node == null) {
            return fallback;
        }
        String value = node.path(field).asText("");
        return value == null || value.isBlank() ? fallback : value;
    }

    private String inferSourceName(String link) {
        String normalized = link.replaceFirst("^https?://", "");
        int slash = normalized.indexOf('/');
        return slash > 0 ? normalized.substring(0, slash) : normalized;
    }

    private String inferSentiment(String text) {
        String normalized = text.toLowerCase(Locale.ROOT);
        if (normalized.contains("growth") || normalized.contains("launch") || normalized.contains("expand") || normalized.contains("funding")) {
            return "POSITIVE";
        }
        if (normalized.contains("risk") || normalized.contains("lawsuit") || normalized.contains("decline") || normalized.contains("drop")) {
            return "NEGATIVE";
        }
        return "NEUTRAL";
    }

    private LocalDateTime parsePublishedAt(JsonNode result) {
        String publishedAt = text(result, "published_at", "");
        if (!publishedAt.isBlank()) {
            try {
                return OffsetDateTime.parse(publishedAt).toLocalDateTime();
            } catch (Exception ignored) {
            }
        }
        return LocalDateTime.now();
    }
}
