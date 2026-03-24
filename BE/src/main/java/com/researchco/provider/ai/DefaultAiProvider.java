package com.researchco.provider.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.researchco.frontend.FrontendDtos;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Locale;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class DefaultAiProvider implements AiProvider {

    private final String apiKey;
    private final String model;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    public DefaultAiProvider(
            @Value("${integration.gemini.api-key:}") String apiKey,
            @Value("${integration.gemini.model:gemini-2.5-flash}") String model) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.model = (model == null || model.isBlank()) ? "gemini-2.5-flash" : model.trim();
    }

    @Override
    public FrontendDtos.DeepInsightResponse generateDeepInsight(FrontendDtos.AnalysisResponse contextData,
            String source) {
        DeepInsightBlueprint blueprint = buildBlueprint(contextData, source);

        if (apiKey.isBlank()) {
            return blueprint.toResponse();
        }

        String keywordsSummary = contextData.relatedKeywords() == null ? ""
                : contextData.relatedKeywords().stream()
                        .limit(10)
                        .map(k -> String.format(
                                Locale.ROOT,
                                "%s (mentions=%d, views=%d, likes=%d, comments=%d, avgEngagement=%.4f)",
                                k.keyword(),
                                k.mentionCount(),
                                k.totalViews(),
                                k.totalLikes(),
                                k.totalComments(),
                                k.avgEngagement()))
                        .collect(Collectors.joining(", "));
        String existingInsights = contextData.insights() == null ? ""
                : contextData.insights().stream()
                        .map(insight -> insight.label() + ": " + insight.text())
                        .collect(Collectors.joining("\n"));
        String newsSummary = contextData.news() == null ? ""
                : contextData.news().stream()
                        .limit(6)
                        .collect(Collectors.joining("\n- ", "- ", ""));
        String suggestedActions = contextData.suggestedActions() == null ? ""
                : String.join(", ", contextData.suggestedActions());

        String prompt = String.format(
                """
                Act as a senior market research strategist.

                You are NOT analyzing only the keyword. You must synthesize the full research context that has already been collected from external APIs for the keyword "%s".

                Selected source focus: %s

                Existing market insight cards:
                %s

                Integrated sources currently available in the system:
                %s

                Related keywords and metrics:
                %s

                Recent source headlines:
                %s

                Suggested analyst actions already derived from the data:
                %s

                Your task:
                - synthesize the entire evidence set above
                - identify demand signals, audience behavior, competitive patterns, and marketable angles
                - avoid repeating the keyword alone without evidence
                - write concrete research-grade findings, not generic filler

                Return only valid JSON with this exact structure:
                {
                  "marketInsight": "A dense 3-4 sentence synthesis that combines the strongest signals from the provided insight cards, keyword metrics, and recent headlines.",
                  "opportunities": [
                    "Specific market opportunity 1 grounded in the provided data",
                    "Specific market opportunity 2 grounded in the provided data",
                    "Specific market opportunity 3 grounded in the provided data",
                    "Specific market opportunity 4 grounded in the provided data"
                  ],
                  "recommendation": "A concrete strategic recommendation that tells the user what to test, position, or prioritize next based on the combined evidence."
                }
                """,
                contextData.keyword(),
                source,
                existingInsights.isBlank() ? "- No prior insight cards available." : existingInsights,
                contextData.dataSources() == null || contextData.dataSources().isEmpty()
                        ? "- No integrated source metadata available."
                        : String.join(", ", contextData.dataSources()),
                keywordsSummary.isBlank() ? "- No related keyword metrics available." : keywordsSummary,
                newsSummary.isBlank() ? "- No recent headlines available." : newsSummary,
                suggestedActions.isBlank() ? "- No suggested actions available." : suggestedActions);

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                "generationConfig", Map.of("responseMimeType", "application/json"));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);
        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model
                + ":generateContent?key=" + apiKey;

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, requestEntity, String.class);
            JsonNode root = mapper.readTree(response.getBody());
            String responseText = root.path("candidates").get(0).path("content").path("parts").get(0).path("text")
                    .asText();

            // Lọc bỏ markdown codeblock nếu Gemini cố tình trả về
            if (responseText.startsWith("```json")) {
                responseText = responseText.substring(7);
            }
            if (responseText.endsWith("```")) {
                responseText = responseText.substring(0, responseText.length() - 3);
            }

            JsonNode jsonResult = mapper.readTree(responseText);

            List<String> opportunities = new ArrayList<>();
            jsonResult.path("opportunities").forEach(node -> opportunities.add(node.asText()));

            return new FrontendDtos.DeepInsightResponse(
                    contextData.keyword(),
                    source,
                    jsonResult.path("marketInsight").asText("No insight available."),
                    opportunities.isEmpty() ? List.of("No opportunities found.") : opportunities,
                    jsonResult.path("recommendation").asText("No recommendation available."),
                    blueprint.stats(),
                    blueprint.mediaSignals(),
                    blueprint.trendPoints(),
                    blueprint.sentiment(),
                    buildOpportunityCards(opportunities, blueprint.keyword()),
                    new FrontendDtos.StrategicRecommendation(
                            "AI-generated direction",
                            jsonResult.path("recommendation").asText("No recommendation available."),
                            blueprint.strategicStats()
                    ));

        } catch (Exception e) {
            e.printStackTrace();
            return blueprint.toResponse();
        }
    }

    @Override
    public List<LiveTrendSignal> generateLiveTrends(Map<String, List<String>> marketSeeds) {
        if (marketSeeds == null || marketSeeds.isEmpty()) {
            return List.of();
        }

        LinkedHashMap<String, List<String>> normalizedSeeds = new LinkedHashMap<>();
        marketSeeds.forEach((market, keywords) -> {
            if (market == null || market.isBlank()) {
                return;
            }
            List<String> cleanKeywords = keywords == null
                    ? List.of(market)
                    : keywords.stream()
                            .filter(value -> value != null && !value.isBlank())
                            .distinct()
                            .toList();
            normalizedSeeds.put(market.trim(), cleanKeywords.isEmpty() ? List.of(market.trim()) : cleanKeywords);
        });

        if (normalizedSeeds.isEmpty()) {
            return List.of();
        }

        if (apiKey.isBlank()) {
            return fallbackLiveTrends(normalizedSeeds);
        }

        String seedsText = normalizedSeeds.entrySet().stream()
                .map(entry -> entry.getKey() + " => " + String.join(", ", entry.getValue()))
                .collect(Collectors.joining("\n- ", "- ", ""));

        String prompt = String.format(
                """
                You are generating LIVE market hot trends for a market-research homepage.

                Important:
                - The output is AI-generated trend intelligence (not direct raw API metrics).
                - Keep it realistic and business-oriented.
                - Return exactly one trend per market provided.

                Market seeds:
                %s

                Return only valid JSON:
                {
                  "trends": [
                    {
                      "market": "AI & Automation",
                      "keyword": "AI Agent",
                      "trendScore": 160,
                      "changePct": 22,
                      "sentiment": "positive",
                      "sourceCount": 28
                    }
                  ]
                }

                Constraints:
                - trendScore: integer from 50 to 320
                - changePct: integer from -35 to 80
                - sentiment: one of positive, neutral, negative
                - sourceCount: integer from 6 to 60
                - keyword should be one of the seed keywords for that market
                """,
                seedsText);

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                "generationConfig", Map.of("responseMimeType", "application/json"));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);
        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model
                + ":generateContent?key=" + apiKey;

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, requestEntity, String.class);
            JsonNode root = mapper.readTree(response.getBody());
            String responseText = root.path("candidates").get(0).path("content").path("parts").get(0).path("text")
                    .asText();

            if (responseText.startsWith("```json")) {
                responseText = responseText.substring(7);
            }
            if (responseText.endsWith("```")) {
                responseText = responseText.substring(0, responseText.length() - 3);
            }

            JsonNode jsonResult = mapper.readTree(responseText);
            JsonNode trendsNode = jsonResult.path("trends");
            if (!trendsNode.isArray() || trendsNode.isEmpty()) {
                return fallbackLiveTrends(normalizedSeeds);
            }

            List<LiveTrendSignal> trends = new ArrayList<>();
            for (JsonNode node : trendsNode) {
                String market = node.path("market").asText("");
                if (!normalizedSeeds.containsKey(market)) {
                    continue;
                }

                List<String> seedKeywords = normalizedSeeds.get(market);
                String keyword = node.path("keyword").asText(seedKeywords.get(0));
                if (!seedKeywords.contains(keyword)) {
                    keyword = seedKeywords.get(0);
                }

                long trendScore = clampLong(node.path("trendScore").asLong(120), 50, 320);
                int changePct = clamp(node.path("changePct").asInt(0), -35, 80);
                String sentiment = normalizeSentiment(node.path("sentiment").asText("neutral"));
                int sourceCount = clamp(node.path("sourceCount").asInt(18), 6, 60);

                trends.add(new LiveTrendSignal(market, keyword, trendScore, changePct, sentiment, sourceCount));
            }

            if (trends.isEmpty()) {
                return fallbackLiveTrends(normalizedSeeds);
            }
            return trends;
        } catch (Exception ignored) {
            return fallbackLiveTrends(normalizedSeeds);
        }
    }

    private DeepInsightBlueprint buildBlueprint(FrontendDtos.AnalysisResponse contextData, String source) {
        String keyword = contextData.keyword();
        List<FrontendDtos.KeywordMetric> keywordMetrics = contextData.relatedKeywords() == null
                ? List.of()
                : contextData.relatedKeywords();
        List<String> news = contextData.news() == null ? List.of() : contextData.news();
        List<String> summaryLines = contextData.insights() == null
                ? List.of()
                : contextData.insights().stream()
                        .map(FrontendDtos.InsightItem::text)
                        .filter(text -> text != null && !text.isBlank())
                        .toList();

        long totalMentions = keywordMetrics.stream()
                .mapToLong(FrontendDtos.KeywordMetric::mentionCount)
                .sum();
        long totalViews = keywordMetrics.stream()
                .mapToLong(FrontendDtos.KeywordMetric::totalViews)
                .sum();
        double avgEngagement = keywordMetrics.stream()
                .mapToDouble(FrontendDtos.KeywordMetric::avgEngagement)
                .average()
                .orElse(0.0);
        long totalLikes = keywordMetrics.stream()
                .mapToLong(FrontendDtos.KeywordMetric::totalLikes)
                .sum();
        long totalComments = keywordMetrics.stream()
                .mapToLong(FrontendDtos.KeywordMetric::totalComments)
                .sum();

        String topKeywords = keywordMetrics.stream()
                .limit(3)
                .map(FrontendDtos.KeywordMetric::keyword)
                .collect(Collectors.joining(", "));

        String marketInsight = String.format(
                Locale.ROOT,
                "Based on current %s signals, \"%s\" shows %d related keyword mentions and about %s aggregated views. Average engagement is %.2f%%, suggesting %s.",
                source,
                keyword,
                totalMentions,
                formatCompact(totalViews),
                avgEngagement * 100,
                avgEngagement >= 0.04 ? "healthy audience interest with strong interaction" : "an emerging topic that still needs deeper validation"
        );

        List<String> opportunities = new ArrayList<>();
        if (!topKeywords.isBlank()) {
            opportunities.add("Create content clusters around " + topKeywords + " to capture adjacent intent around \"" + keyword + "\".");
        }
        if (!news.isEmpty()) {
            opportunities.add("Use the strongest narrative from recent coverage such as \"" + news.get(0) + "\" to anchor campaigns or content tests.");
        }
        if (!summaryLines.isEmpty()) {
            opportunities.add("Turn the top insight into an experiment brief: " + summaryLines.get(0));
        }
        opportunities.add("Benchmark creator momentum and comment activity before expanding budget on \"" + keyword + "\".");

        String recommendation = String.format(
                "Prioritize a focused test campaign for \"%s\" using %s as the primary signal, then expand into the best-performing related keyword themes.",
                keyword,
                source.toLowerCase(Locale.ROOT)
        );

        List<FrontendDtos.StatItem> stats = List.of(
                new FrontendDtos.StatItem(formatCompact(totalViews), "Aggregated Views"),
                new FrontendDtos.StatItem(String.valueOf(totalMentions), "Keyword Mentions"),
                new FrontendDtos.StatItem(String.format(Locale.ROOT, "%.2f%%", avgEngagement * 100), "Avg Engagement")
        );

        List<FrontendDtos.SignalItem> mediaSignals = new ArrayList<>();
        mediaSignals.add(new FrontendDtos.SignalItem(
                "Audience demand signal",
                String.format(
                        Locale.ROOT,
                        "\"%s\" is generating %s views across related keyword clusters, which suggests measurable user curiosity and content consumption.",
                        keyword,
                        formatCompact(totalViews)
                )
        ));
        mediaSignals.add(new FrontendDtos.SignalItem(
                "Conversation driver",
                news.isEmpty()
                        ? "Recent public narratives are still limited, so growth is being driven mainly by discoverability and related keyword intent."
                        : "Recent narratives such as \"" + news.get(0) + "\" are shaping attention around the topic."
        ));
        mediaSignals.add(new FrontendDtos.SignalItem(
                "Competitive implication",
                topKeywords.isBlank()
                        ? "The topic still needs broader source coverage before we can identify clear adjacent segments."
                        : "Adjacent search intent around " + topKeywords + " suggests the market is fragmenting into sub-needs that competitors can target."
        ));

        int positive = clamp((int) Math.round(45 + avgEngagement * 900), 35, 82);
        int negative = clamp((int) Math.round(8 + Math.max(0, 0.03 - avgEngagement) * 400), 6, 24);
        int neutral = Math.max(0, 100 - positive - negative);
        List<FrontendDtos.SentimentBar> bars = List.of(
                new FrontendDtos.SentimentBar("Positive", positive, "var(--green)", "text-green"),
                new FrontendDtos.SentimentBar("Neutral", neutral, "var(--gray-500)", ""),
                new FrontendDtos.SentimentBar("Negative", negative, "var(--red)", "text-red")
        );
        List<FrontendDtos.TopicItem> topics = keywordMetrics.stream()
                .sorted(Comparator.comparingLong(FrontendDtos.KeywordMetric::totalViews).reversed())
                .limit(4)
                .map(metric -> new FrontendDtos.TopicItem(metric.keyword(), "+" + Math.max(6, metric.mentionCount() * 7) + "%"))
                .toList();

        List<FrontendDtos.OpportunityCard> opportunityCards = buildOpportunityCards(opportunities, keyword);
        long maxViews = keywordMetrics.stream()
                .mapToLong(FrontendDtos.KeywordMetric::totalViews)
                .max()
                .orElse(0L);
        List<FrontendDtos.TrendPoint> trendPoints = keywordMetrics.stream()
                .sorted(Comparator.comparingLong(FrontendDtos.KeywordMetric::totalViews).reversed())
                .limit(6)
                .map(metric -> {
                    int momentum = maxViews > 0
                            ? clamp((int) Math.round((metric.totalViews() * 100.0) / maxViews), 12, 100)
                            : clamp(metric.mentionCount() * 12, 12, 100);
                    String note = String.format(
                            Locale.ROOT,
                            "%s views • %d mentions",
                            formatCompact(metric.totalViews()),
                            metric.mentionCount()
                    );
                    return new FrontendDtos.TrendPoint(metric.keyword(), momentum, note);
                })
                .toList();
        List<FrontendDtos.StatItem> strategicStats = List.of(
                new FrontendDtos.StatItem(formatCompact(totalLikes), "Total Likes"),
                new FrontendDtos.StatItem(formatCompact(totalComments), "Total Comments"),
                new FrontendDtos.StatItem(topKeywords.isBlank() ? keyword : topKeywords, "Best Adjacent Themes")
        );

        return new DeepInsightBlueprint(
                keyword,
                source,
                marketInsight,
                opportunities.stream().limit(4).toList(),
                recommendation,
                stats,
                mediaSignals,
                trendPoints.isEmpty()
                        ? List.of(new FrontendDtos.TrendPoint(keyword, 52, "Baseline trend signal"))
                        : trendPoints,
                new FrontendDtos.SentimentBlock(
                        bars,
                        topics.isEmpty()
                                ? List.of(new FrontendDtos.TopicItem(keyword, "+10%"))
                                : topics
                ),
                opportunityCards,
                strategicStats
        );
    }

    private String formatCompact(long value) {
        if (value >= 1_000_000) {
            return String.format(Locale.ROOT, "%.1fM", value / 1_000_000.0);
        }
        if (value >= 1_000) {
            return String.format(Locale.ROOT, "%.1fK", value / 1_000.0);
        }
        return String.valueOf(value);
    }

    private List<FrontendDtos.OpportunityCard> buildOpportunityCards(List<String> opportunities, String keyword) {
        if (opportunities == null || opportunities.isEmpty()) {
            return List.of(
                    new FrontendDtos.OpportunityCard(
                            "AI Opportunity 1",
                            "Create a dedicated experiment around \"" + keyword + "\" to validate audience demand.",
                            "green"
                    )
            );
        }

        List<String> themes = List.of("green", "blue", "orange", "purple");
        List<FrontendDtos.OpportunityCard> cards = new ArrayList<>();
        for (int i = 0; i < Math.min(4, opportunities.size()); i++) {
            cards.add(new FrontendDtos.OpportunityCard(
                    "AI Opportunity " + (i + 1),
                    opportunities.get(i),
                    themes.get(i % themes.size())
            ));
        }
        return cards;
    }

    private int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }

    private long clampLong(long value, long min, long max) {
        return Math.max(min, Math.min(max, value));
    }

    private String normalizeSentiment(String sentiment) {
        if ("positive".equalsIgnoreCase(sentiment)) {
            return "positive";
        }
        if ("negative".equalsIgnoreCase(sentiment)) {
            return "negative";
        }
        return "neutral";
    }

    private List<LiveTrendSignal> fallbackLiveTrends(LinkedHashMap<String, List<String>> seeds) {
        long hourSeed = System.currentTimeMillis() / (1000L * 60L * 60L);
        Random random = new Random(hourSeed);
        List<LiveTrendSignal> list = new ArrayList<>();

        for (Map.Entry<String, List<String>> entry : seeds.entrySet()) {
            String market = entry.getKey();
            List<String> keywords = entry.getValue();
            String keyword = keywords.get(random.nextInt(keywords.size()));
            long score = 90 + random.nextInt(140);
            int change = -10 + random.nextInt(42);
            int sourceCount = 10 + random.nextInt(30);
            String sentiment = change > 8 ? "positive" : (change < -5 ? "negative" : "neutral");
            list.add(new LiveTrendSignal(market, keyword, score, change, sentiment, sourceCount));
        }

        return list;
    }

    private record DeepInsightBlueprint(
            String keyword,
            String source,
            String marketInsight,
            List<String> opportunities,
            String recommendation,
            List<FrontendDtos.StatItem> stats,
            List<FrontendDtos.SignalItem> mediaSignals,
            List<FrontendDtos.TrendPoint> trendPoints,
            FrontendDtos.SentimentBlock sentiment,
            List<FrontendDtos.OpportunityCard> opportunityCards,
            List<FrontendDtos.StatItem> strategicStats
    ) {
        FrontendDtos.DeepInsightResponse toResponse() {
            return new FrontendDtos.DeepInsightResponse(
                    keyword,
                    source,
                    marketInsight,
                    opportunities,
                    recommendation,
                    stats,
                    mediaSignals,
                    trendPoints,
                    sentiment,
                    opportunityCards,
                    new FrontendDtos.StrategicRecommendation(
                            "Market-backed direction",
                            recommendation,
                            strategicStats
                    )
            );
        }
    }
}
