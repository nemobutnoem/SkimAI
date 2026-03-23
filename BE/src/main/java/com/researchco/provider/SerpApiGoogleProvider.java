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
public class SerpApiGoogleProvider implements SearchProvider {

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String apiKey;
    private final int maxResults;

    public SerpApiGoogleProvider(ObjectMapper objectMapper,
                                 @Value("${integration.serpapi.api-key:}") String apiKey,
                                 @Value("${integration.serpapi.google-max-results:5}") int maxResults) {
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.maxResults = maxResults;
        this.httpClient = HttpClient.newHttpClient();
    }

    @Override
    public String providerCode() {
        return "SERPAPI_GOOGLE";
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
            if (root == null || !root.path("organic_results").isArray()) {
                return List.of();
            }

            List<NormalizedSourceItem> items = new ArrayList<>();
            for (JsonNode result : root.path("organic_results")) {
                String title = text(result, "title", keyword + " market result");
                String snippet = text(result, "snippet", "Search result related to " + keyword);
                String link = text(result, "link", "");
                if (link.isBlank()) {
                    continue;
                }

                Map<String, Object> rawPayload = new LinkedHashMap<>();
                rawPayload.put("provider", providerCode());
                rawPayload.put("keyword", keyword);
                rawPayload.put("position", result.path("position").asInt(0));
                rawPayload.put("displayedLink", text(result, "displayed_link", ""));
                rawPayload.put("cachedPageLink", text(result, "cached_page_link", ""));
                rawPayload.put("relatedPagesLink", text(result, "related_pages_link", ""));
                rawPayload.put("date", text(result, "date", ""));
                rawPayload.put("richSnippet", result.path("rich_snippet"));

                items.add(new NormalizedSourceItem(
                        providerCode(),
                        "GOOGLE",
                        "WEB",
                        title,
                        snippet,
                        link,
                        inferSourceName(link, result),
                        inferAuthorName(result),
                        parsePublishedAt(result.path("date").asText("")),
                        inferSentiment(title + " " + snippet),
                        rawPayload
                ));
            }
            return items;
        } catch (Exception e) {
            System.err.println("[SERPAPI_GOOGLE] Search failed for keyword=\"" + keyword + "\": " + e.getMessage());
            return List.of();
        }
    }

    private JsonNode getJson(URI uri) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(uri).GET().build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            System.err.println("[SERPAPI_GOOGLE] HTTP " + response.statusCode() + " for request.");
            System.err.println("[SERPAPI_GOOGLE] Response body: " + response.body());
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

    private String inferSourceName(String link, JsonNode result) {
        String displayed = text(result, "displayed_link", "");
        if (!displayed.isBlank()) {
            return displayed;
        }
        String normalized = link.replaceFirst("^https?://", "");
        int slash = normalized.indexOf('/');
        return slash > 0 ? normalized.substring(0, slash) : normalized;
    }

    private String inferAuthorName(JsonNode result) {
        String favicon = text(result, "favicon", "");
        if (!favicon.isBlank()) {
            return favicon;
        }
        return "SerpApi Google";
    }

    private String inferSentiment(String text) {
        String normalized = text.toLowerCase(Locale.ROOT);
        if (normalized.contains("growth") || normalized.contains("surge") || normalized.contains("increase")) {
            return "POSITIVE";
        }
        if (normalized.contains("risk") || normalized.contains("decline") || normalized.contains("drop")) {
            return "NEGATIVE";
        }
        return "NEUTRAL";
    }

    private LocalDateTime parsePublishedAt(String value) {
        if (value == null || value.isBlank()) {
            return LocalDateTime.now();
        }
        try {
            return OffsetDateTime.parse(value).toLocalDateTime();
        } catch (Exception ignored) {
            return LocalDateTime.now();
        }
    }
}
