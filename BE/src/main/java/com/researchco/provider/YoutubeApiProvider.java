package com.researchco.provider;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Component
public class YoutubeApiProvider implements SearchProvider {

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String apiKey;
    private final int maxResults;

    public YoutubeApiProvider(ObjectMapper objectMapper,
                              @Value("${integration.youtube.api-key:}") String apiKey,
                              @Value("${integration.youtube.max-results:5}") int maxResults) {
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.maxResults = maxResults;
        this.httpClient = HttpClient.newHttpClient();
    }

    @Override
    public String providerCode() {
        return "YOUTUBE_API";
    }

    @Override
    public List<NormalizedSourceItem> search(String keyword, String countryCode, String languageCode, String timeRange) {
        if (apiKey == null || apiKey.isBlank()) {
            return List.of();
        }

        try {
            JsonNode items = searchItems(keyword, countryCode, languageCode);
            if (items == null || !items.isArray()) {
                return List.of();
            }

            List<String> videoIds = new ArrayList<>();
            Set<String> channelIds = new HashSet<>();
            for (JsonNode item : items) {
                String videoId = item.path("id").path("videoId").asText("");
                if (!videoId.isBlank()) {
                    videoIds.add(videoId);
                }
                String channelId = item.path("snippet").path("channelId").asText("");
                if (!channelId.isBlank()) {
                    channelIds.add(channelId);
                }
            }

            Map<String, JsonNode> videoDetails = fetchVideoDetails(videoIds);
            Map<String, JsonNode> channelDetails = fetchChannelDetails(channelIds);

            List<NormalizedSourceItem> results = new ArrayList<>();
            for (JsonNode item : items) {
                JsonNode id = item.path("id");
                JsonNode snippet = item.path("snippet");
                String videoId = id.path("videoId").asText("");
                if (videoId.isBlank()) {
                    continue;
                }

                String title = snippet.path("title").asText(keyword + " on YouTube");
                String description = snippet.path("description").asText("YouTube video related to " + keyword);
                String channelTitle = snippet.path("channelTitle").asText("YouTube");
                String channelId = snippet.path("channelId").asText("");
                String publishedAt = snippet.path("publishedAt").asText("");
                String thumbnail = snippet.path("thumbnails").path("high").path("url").asText(
                        snippet.path("thumbnails").path("medium").path("url").asText("")
                );

                JsonNode videoDetail = videoDetails.get(videoId);
                JsonNode channelDetail = channelDetails.get(channelId);
                YoutubeBehaviorMetrics metrics = buildMetrics(videoDetail, channelDetail);
                String duration = videoDetail != null ? videoDetail.path("contentDetails").path("duration").asText("") : "";
                List<String> tags = extractTexts(videoDetail != null ? videoDetail.path("snippet").path("tags") : null);
                List<String> topicCategories = extractTexts(videoDetail != null ? videoDetail.path("topicDetails").path("topicCategories") : null);

                String enrichedSnippet = buildSnippet(description, metrics, duration, tags, topicCategories);

                Map<String, Object> rawPayload = new HashMap<>();
                rawPayload.put("provider", providerCode());
                rawPayload.put("videoId", videoId);
                rawPayload.put("channelId", channelId);
                rawPayload.put("channelTitle", channelTitle);
                rawPayload.put("keyword", keyword);
                rawPayload.put("timeRange", timeRange);
                rawPayload.put("thumbnail", thumbnail);
                rawPayload.put("duration", duration);
                rawPayload.put("tags", tags);
                rawPayload.put("topicCategories", topicCategories);
                rawPayload.put("viewCount", metrics.viewCount());
                rawPayload.put("likeCount", metrics.likeCount());
                rawPayload.put("commentCount", metrics.commentCount());
                rawPayload.put("subscriberCount", metrics.subscriberCount());
                rawPayload.put("engagementRate", metrics.engagementRate());
                rawPayload.put("commentIntensity", metrics.commentIntensity());

                results.add(new NormalizedSourceItem(
                        providerCode(),
                        "YOUTUBE",
                        "VIDEO",
                        title,
                        enrichedSnippet,
                        "https://www.youtube.com/watch?v=" + URLEncoder.encode(videoId, StandardCharsets.UTF_8),
                        channelTitle,
                        channelTitle,
                        parsePublishedAt(publishedAt),
                        "NEUTRAL",
                        rawPayload
                ));
            }
            return results;
        } catch (Exception e) {
            System.err.println("[YOUTUBE_API] Search failed for keyword=\"" + keyword + "\": " + e.getMessage());
            e.printStackTrace();
            return List.of();
        }
    }

    private JsonNode searchItems(String keyword, String countryCode, String languageCode) throws Exception {
        URI uri = UriComponentsBuilder
                .fromUriString("https://www.googleapis.com/youtube/v3/search")
                .queryParam("part", "snippet")
                .queryParam("type", "video")
                .queryParam("q", keyword)
                .queryParam("maxResults", maxResults)
                .queryParam("regionCode", blankToNull(countryCode))
                .queryParam("relevanceLanguage", blankToNull(languageCode))
                .queryParam("key", apiKey)
                .encode()
                .build()
                .toUri();

        JsonNode root = getJson(uri);
        return root != null ? root.path("items") : null;
    }

    private Map<String, JsonNode> fetchVideoDetails(List<String> videoIds) throws Exception {
        if (videoIds.isEmpty()) {
            return Map.of();
        }

        URI uri = UriComponentsBuilder
                .fromUriString("https://www.googleapis.com/youtube/v3/videos")
                .queryParam("part", "snippet,statistics,contentDetails,topicDetails")
                .queryParam("id", String.join(",", videoIds))
                .queryParam("key", apiKey)
                .build(true)
                .toUri();

        JsonNode root = getJson(uri);
        if (root == null || !root.path("items").isArray()) {
            return Map.of();
        }

        Map<String, JsonNode> details = new HashMap<>();
        for (JsonNode item : root.path("items")) {
            String id = item.path("id").asText("");
            if (!id.isBlank()) {
                details.put(id, item);
            }
        }
        return details;
    }

    private Map<String, JsonNode> fetchChannelDetails(Set<String> channelIds) throws Exception {
        if (channelIds.isEmpty()) {
            return Map.of();
        }

        URI uri = UriComponentsBuilder
                .fromUriString("https://www.googleapis.com/youtube/v3/channels")
                .queryParam("part", "snippet,statistics")
                .queryParam("id", String.join(",", channelIds))
                .queryParam("key", apiKey)
                .build(true)
                .toUri();

        JsonNode root = getJson(uri);
        if (root == null || !root.path("items").isArray()) {
            return Map.of();
        }

        Map<String, JsonNode> details = new HashMap<>();
        for (JsonNode item : root.path("items")) {
            String id = item.path("id").asText("");
            if (!id.isBlank()) {
                details.put(id, item);
            }
        }
        return details;
    }

    private JsonNode getJson(URI uri) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(uri).GET().build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            System.err.println("[YOUTUBE_API] HTTP " + response.statusCode() + " for: " + uri.toString().replaceAll("key=[^&]+", "key=***"));
            System.err.println("[YOUTUBE_API] Response body: " + response.body());
            return null;
        }
        return objectMapper.readTree(response.body());
    }

    private YoutubeBehaviorMetrics buildMetrics(JsonNode videoDetail, JsonNode channelDetail) {
        long viewCount = parseLong(videoDetail, "statistics", "viewCount");
        long likeCount = parseLong(videoDetail, "statistics", "likeCount");
        long commentCount = parseLong(videoDetail, "statistics", "commentCount");
        long subscriberCount = parseLong(channelDetail, "statistics", "subscriberCount");
        double engagementRate = viewCount == 0 ? 0.0 : (double) (likeCount + commentCount) / viewCount;
        double commentIntensity = viewCount == 0 ? 0.0 : (double) commentCount / viewCount;
        return new YoutubeBehaviorMetrics(viewCount, likeCount, commentCount, subscriberCount, engagementRate, commentIntensity);
    }

    private long parseLong(JsonNode node, String parent, String child) {
        if (node == null) {
            return 0L;
        }
        String value = node.path(parent).path(child).asText("0");
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException ignored) {
            return 0L;
        }
    }

    private List<String> extractTexts(JsonNode arrayNode) {
        if (arrayNode == null || !arrayNode.isArray()) {
            return List.of();
        }
        List<String> values = new ArrayList<>();
        for (JsonNode item : arrayNode) {
            String value = item.asText("");
            if (!value.isBlank()) {
                values.add(value);
            }
        }
        return values;
    }

    private String buildSnippet(String description,
                                YoutubeBehaviorMetrics metrics,
                                String duration,
                                List<String> tags,
                                List<String> topicCategories) {
        List<String> parts = new ArrayList<>();
        if (description != null && !description.isBlank()) {
            parts.add(description);
        }
        parts.add("views=" + metrics.viewCount());
        parts.add("likes=" + metrics.likeCount());
        parts.add("comments=" + metrics.commentCount());
        parts.add("subscribers=" + metrics.subscriberCount());
        if (!duration.isBlank()) {
            parts.add("duration=" + duration);
        }
        if (!tags.isEmpty()) {
            parts.add("tags=" + tags.stream().limit(5).collect(Collectors.joining("|")));
        }
        if (!topicCategories.isEmpty()) {
            parts.add("topics=" + topicCategories.stream().limit(3).collect(Collectors.joining("|")));
        }
        return String.join(" ; ", parts);
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
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
