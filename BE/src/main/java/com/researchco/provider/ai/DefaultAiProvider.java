package com.researchco.provider.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.researchco.admin.SystemSettingEntity;
import com.researchco.admin.SystemSettingRepository;
import com.researchco.frontend.FrontendDtos;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger log = LoggerFactory.getLogger(DefaultAiProvider.class);

    private final String apiKey;
    private final String model;
    private final SystemSettingRepository systemSettingRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper mapper = new ObjectMapper();

    public DefaultAiProvider(
            @Value("${integration.gemini.api-key:}") String apiKey,
            @Value("${integration.gemini.model:gemini-2.5-flash}") String model,
            SystemSettingRepository systemSettingRepository) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.model = (model == null || model.isBlank()) ? "gemini-2.5-flash" : model.trim();
        this.systemSettingRepository = systemSettingRepository;
        
        org.springframework.http.client.SimpleClientHttpRequestFactory factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(5000);
        this.restTemplate = new RestTemplate(factory);
    }

    @Override
    public FrontendDtos.DeepInsightResponse generateDeepInsight(FrontendDtos.AnalysisResponse contextData,
            String source) {
        DeepInsightBlueprint blueprint = buildBlueprint(contextData, source);

        String activeProvider = systemSettingRepository.findById("ai_provider")
                .map(SystemSettingEntity::getValue)
                .map(String::toUpperCase)
                .orElse("GEMINI");

        String activeModel = systemSettingRepository.findById("ai_model")
                .map(SystemSettingEntity::getValue)
                .filter(v -> !v.isBlank())
                .orElse(this.model);

        String activeApiKey = systemSettingRepository.findById("ai_api_key")
                .map(SystemSettingEntity::getValue)
                .filter(v -> !v.isBlank())
                .orElse(this.apiKey);

        String activeEndpoint = systemSettingRepository.findById("ai_endpoint")
                .map(SystemSettingEntity::getValue)
                .filter(v -> !v.isBlank())
                .orElse("");

        if (activeApiKey.isBlank()) {
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
                Act as a senior market research strategist. You are writing a professional, comprehensive deep market insight report in Vietnamese.
                
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
                - synthesize the entire evidence set above in Vietnamese.
                - write concrete research-grade findings, not generic filler. All texts, opportunities, recommendations, and labels MUST be in Vietnamese.
                - do not repeat the keyword alone without evidence.

                Return only valid JSON with this exact structure:
                {
                  "marketInsight": "Một đoạn phân tích sâu sắc từ 4-5 câu tiếng Việt tổng hợp các tín hiệu mạnh mẽ nhất từ dữ liệu nguồn, phân tích rõ lý do nhu cầu tăng/giảm...",
                  "opportunities": [
                    "Cơ hội thị trường cụ thể 1 bằng tiếng Việt (ví dụ: phát triển nội dung ngách, ý tưởng sản phẩm...)",
                    "Cơ hội thị trường cụ thể 2 bằng tiếng Việt...",
                    "Cơ hội thị trường cụ thể 3 bằng tiếng Việt...",
                    "Cơ hội thị trường cụ thể 4 bằng tiếng Việt..."
                  ],
                  "recommendation": "Khuyến nghị chiến lược cụ thể bằng tiếng Việt, hướng dẫn chi tiết người dùng nên thử nghiệm, định vị hoặc ưu tiên hành động gì tiếp theo...",
                  "stats": [
                    { "value": "Giá trị chỉ số 1 (ví dụ: 85%% hoặc Cao/Thấp)", "label": "Tên chỉ số 1 (ví dụ: Điểm tiềm năng thị trường)" },
                    { "value": "Giá trị chỉ số 2", "label": "Tên chỉ số 2 (ví dụ: Mức độ cạnh tranh)" },
                    { "value": "Giá trị chỉ số 3", "label": "Tên chỉ số 3 (ví dụ: Khả năng sinh lời)" }
                  ],
                  "mediaSignals": [
                    { "title": "Tên tín hiệu 1 (ví dụ: Tín hiệu nhu cầu)", "desc": "Mô tả chi tiết tín hiệu nhu cầu từ dữ liệu bằng tiếng Việt..." },
                    { "title": "Tên tín hiệu 2 (víệu: Động lực thảo luận)", "desc": "Mô tả chi tiết động lực thảo luận bằng tiếng Việt..." },
                    { "title": "Tên tín hiệu 3 (ví dụ: Hệ quả cạnh tranh)", "desc": "Mô tả chi tiết hệ quả cạnh tranh bằng tiếng Việt..." }
                  ],
                  "trendPoints": [
                    { "label": "Từ khóa liên quan 1", "value": 85, "note": "Ghi chú xu hướng bằng tiếng Việt (ví dụ: +25%% lượt thảo luận)" },
                    { "label": "Từ khóa liên quan 2", "value": 70, "note": "Ghi chú xu hướng bằng tiếng Việt..." },
                    { "label": "Từ khóa liên quan 3", "value": 60, "note": "Ghi chú xu hướng bằng tiếng Việt..." },
                    { "label": "Từ khóa liên quan 4", "value": 50, "note": "Ghi chú xu hướng bằng tiếng Việt..." },
                    { "label": "Từ khóa liên quan 5", "value": 40, "note": "Ghi chú xu hướng bằng tiếng Việt..." },
                    { "label": "Từ khóa liên quan 6", "value": 30, "note": "Ghi chú xu hướng bằng tiếng Việt..." }
                  ],
                  "sentiment": {
                    "positivePct": 65,
                    "neutralPct": 25,
                    "negativePct": 10,
                    "topics": [
                      { "name": "Chủ đề thảo luận ngách 1", "change": "+35%% lượng đề cập" },
                      { "name": "Chủ đề thảo luận ngách 2", "change": "+18%% lượng đề cập" },
                      { "name": "Chủ đề thảo luận ngách 3", "change": "+12%% lượng đề cập" },
                      { "name": "Chủ đề thảo luận ngách 4", "change": "+8%% lượng đề cập" }
                    ]
                  },
                  "strategicStats": [
                    { "value": "Giá trị chỉ số chiến lược 1", "label": "Tên chỉ số chiến lược 1 (ví dụ: Quy mô tương tác)" },
                    { "value": "Giá trị chỉ số chiến lược 2", "label": "Tên chỉ số chiến lược 2 (ví dụ: Lượng thảo luận tích cực)" },
                    { "value": "Giá trị chỉ số chiến lược 3", "label": "Tên chỉ số chiến lược 3 (ví dụ: Chủ đề phụ tốt nhất)" }
                  ],
                  "competitors": [
                    {
                      "name": "Tên đối thủ/Kênh nổi bật từ dữ liệu nguồn",
                      "channelUrl": "Đường dẫn URL của kênh/website (ví dụ: https://www.youtube.com/@techlead)",
                      "strengthLevel": "Mạnh hoặc Trung bình hoặc Mới nổi",
                      "followers": "Số followers/subs ước tính (ví dụ: 1.4M subs hoặc 45K followers)",
                      "frequency": "Tần suất hoạt động (ví dụ: 2 video/tuần hoặc Hàng ngày)",
                      "note": "AI nhận xét ngắn gọn về ngách nội dung hoặc thế mạnh của họ bằng tiếng Việt"
                    }
                  ],
                  "targetPersona": {
                    "description": "Đoạn mô tả ngắn gọn 2-3 câu bằng tiếng Việt về chân dung khách hàng quan tâm đến chủ đề này",
                    "painPoints": [
                      "Nỗi đau/Vấn đề lớn nhất 1",
                      "Nỗi đau/Vấn đề lớn nhất 2",
                      "Nỗi đau/Vấn đề lớn nhất 3"
                    ],
                    "searchIntents": [
                      "Hành vi/Ý định tìm kiếm 1",
                      "Hành vi/Ý định tìm kiếm 2",
                      "Hành vi/Ý định tìm kiếm 3"
                    ]
                  }
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

        String responseText = "";
        try {
            if ("OPENAI".equalsIgnoreCase(activeProvider)) {
                Map<String, Object> requestBody = Map.of(
                        "model", activeModel,
                        "messages", List.of(Map.of("role", "user", "content", prompt)),
                        "response_format", Map.of("type", "json_object")
                );

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.setBearerAuth(activeApiKey);
                HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

                String url = activeEndpoint.isBlank() ? "https://api.openai.com/v1/chat/completions" : activeEndpoint;
                if (!activeEndpoint.isBlank() && !url.toLowerCase(Locale.ROOT).contains("/chat/completions")) {
                    url = url.endsWith("/") ? url + "chat/completions" : url + "/chat/completions";
                }
                ResponseEntity<String> response = restTemplate.postForEntity(url, requestEntity, String.class);
                JsonNode root = mapper.readTree(response.getBody());
                responseText = root.path("choices").get(0).path("message").path("content").asText();
            } else {
                Map<String, Object> requestBody = Map.of(
                        "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                        "generationConfig", Map.of("responseMimeType", "application/json"));

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

                String url;
                if (activeEndpoint.isBlank()) {
                    url = "https://generativelanguage.googleapis.com/v1beta/models/" + activeModel + ":generateContent?key=" + activeApiKey;
                } else {
                    url = activeEndpoint.endsWith("/") ? activeEndpoint + activeModel + ":generateContent?key=" + activeApiKey 
                            : activeEndpoint + "/" + activeModel + ":generateContent?key=" + activeApiKey;
                }

                ResponseEntity<String> response = restTemplate.postForEntity(url, requestEntity, String.class);
                JsonNode root = mapper.readTree(response.getBody());
                responseText = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
            }

            if (responseText.startsWith("```json")) {
                responseText = responseText.substring(7);
            }
            if (responseText.endsWith("```")) {
                responseText = responseText.substring(0, responseText.length() - 3);
            }

            JsonNode jsonResult = mapper.readTree(responseText);

            List<String> opportunities = new ArrayList<>();
            jsonResult.path("opportunities").forEach(node -> opportunities.add(node.asText()));

            final List<FrontendDtos.StatItem> statsList = new ArrayList<>();
            jsonResult.path("stats").forEach(node -> statsList.add(new FrontendDtos.StatItem(
                    node.path("value").asText(),
                    node.path("label").asText()
            )));
            List<FrontendDtos.StatItem> stats = statsList.isEmpty() ? blueprint.stats() : statsList;

            final List<FrontendDtos.SignalItem> mediaSignalsList = new ArrayList<>();
            jsonResult.path("mediaSignals").forEach(node -> mediaSignalsList.add(new FrontendDtos.SignalItem(
                    node.path("title").asText(),
                    node.path("desc").asText()
            )));
            List<FrontendDtos.SignalItem> mediaSignals = mediaSignalsList.isEmpty() ? blueprint.mediaSignals() : mediaSignalsList;

            final List<FrontendDtos.TrendPoint> trendPointsList = new ArrayList<>();
            jsonResult.path("trendPoints").forEach(node -> trendPointsList.add(new FrontendDtos.TrendPoint(
                    node.path("label").asText(),
                    node.path("value").asInt(50),
                    node.path("note").asText()
            )));
            List<FrontendDtos.TrendPoint> trendPoints = trendPointsList.isEmpty() ? blueprint.trendPoints() : trendPointsList;

            JsonNode sentNode = jsonResult.path("sentiment");
            int pos = sentNode.path("positivePct").asInt(60);
            int neu = sentNode.path("neutralPct").asInt(30);
            int neg = sentNode.path("negativePct").asInt(10);
            
            List<FrontendDtos.SentimentBar> bars = List.of(
                    new FrontendDtos.SentimentBar("Tích cực", pos, "var(--green)", "text-green"),
                    new FrontendDtos.SentimentBar("Trung lập", neu, "var(--gray-500)", ""),
                    new FrontendDtos.SentimentBar("Tiêu cực", neg, "var(--red)", "text-red")
            );

            final List<FrontendDtos.TopicItem> topicsList = new ArrayList<>();
            sentNode.path("topics").forEach(node -> topicsList.add(new FrontendDtos.TopicItem(
                    node.path("name").asText(),
                    node.path("change").asText()
            )));
            List<FrontendDtos.TopicItem> topics = topicsList.isEmpty() ? blueprint.sentiment().topics() : topicsList;

            FrontendDtos.SentimentBlock sentiment = new FrontendDtos.SentimentBlock(bars, topics);

            final List<FrontendDtos.StatItem> strategicStatsList = new ArrayList<>();
            jsonResult.path("strategicStats").forEach(node -> strategicStatsList.add(new FrontendDtos.StatItem(
                    node.path("value").asText(),
                    node.path("label").asText()
            )));
            List<FrontendDtos.StatItem> strategicStats = strategicStatsList.isEmpty() ? blueprint.strategicStats() : strategicStatsList;

            final List<FrontendDtos.CompetitorMapItem> competitorsList = new ArrayList<>();
            jsonResult.path("competitors").forEach(node -> competitorsList.add(new FrontendDtos.CompetitorMapItem(
                    node.path("name").asText("Nguồn đối thủ"),
                    node.path("channelUrl").asText(""),
                    node.path("strengthLevel").asText("Trung bình"),
                    node.path("followers").asText("—"),
                    node.path("frequency").asText("—"),
                    node.path("note").asText("—")
            )));
            List<FrontendDtos.CompetitorMapItem> competitors = competitorsList.isEmpty() ? blueprint.competitors() : competitorsList;

            JsonNode personaNode = jsonResult.path("targetPersona");
            String desc = personaNode.path("description").asText(blueprint.targetPersona().description());
            final List<String> painPoints = new ArrayList<>();
            personaNode.path("painPoints").forEach(node -> painPoints.add(node.asText()));
            if (painPoints.isEmpty()) {
                painPoints.addAll(blueprint.targetPersona().painPoints());
            }
            final List<String> searchIntents = new ArrayList<>();
            personaNode.path("searchIntents").forEach(node -> searchIntents.add(node.asText()));
            if (searchIntents.isEmpty()) {
                searchIntents.addAll(blueprint.targetPersona().searchIntents());
            }
            FrontendDtos.TargetPersona targetPersona = new FrontendDtos.TargetPersona(desc, painPoints, searchIntents);

            return new FrontendDtos.DeepInsightResponse(
                    contextData.keyword(),
                    source,
                    jsonResult.path("marketInsight").asText("No insight available."),
                    opportunities.isEmpty() ? List.of("No opportunities found.") : opportunities,
                    jsonResult.path("recommendation").asText("No recommendation available."),
                    stats,
                    mediaSignals,
                    trendPoints,
                    sentiment,
                    buildOpportunityCards(opportunities, blueprint.keyword()),
                    new FrontendDtos.StrategicRecommendation(
                            "Hướng đi chiến lược từ AI",
                            jsonResult.path("recommendation").asText("No recommendation available."),
                            strategicStats
                    ),
                    competitors,
                    targetPersona
            );

        } catch (Exception e) {
            log.error("Deep insight generation failed", e);
            return blueprint.toResponse();
        }
    }

    @Override
    public List<LiveTrendSignal> generateLiveTrends(Map<String, List<String>> marketSeeds) {
        if (marketSeeds == null || marketSeeds.isEmpty()) {
            return List.of();
        }
        if (apiKey.isBlank()) {
            return fallbackLiveTrends(new LinkedHashMap<>());
        }

        String seedsText = marketSeeds.entrySet().stream()
                .map(entry -> entry.getKey() + " => " + String.join(", ", entry.getValue()))
                .collect(Collectors.joining("\n- ", "- ", ""));

        String prompt = String.format(
                """
                You are generating 4 hot LIVE market trends for a market-research homepage.

                Identify 4 distinct, popular, or emerging industries/markets currently trending globally or in Vietnam (e.g. Artificial Intelligence, Green Energy, Sustainable Fashion, E-commerce, Food & Beverage, Smart Devices, etc.).

                For each market, identify a specific search keyword or topic that is driving this trend.

                You can use these seed ideas for inspiration if you want, but you are free to generate completely new and hotter trending markets:
                %s

                Return exactly 4 trends in valid JSON format:
                {
                  "trends": [
                    {
                      "market": "Tên ngành hàng/thị trường (ví dụ: Artificial Intelligence hoặc Năng lượng xanh)",
                      "keyword": "Từ khóa tìm kiếm hot (ví dụ: Generative AI hoặc Xe máy điện)",
                      "trendScore": 160,
                      "changePct": 22,
                      "sentiment": "positive",
                      "sourceCount": 28
                    }
                  ]
                }

                Constraints:
                - Return exactly 4 trend entries.
                - trendScore: integer from 50 to 320
                - changePct: integer from -35 to 80
                - sentiment: one of positive, neutral, negative
                - sourceCount: integer from 6 to 60
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
                return fallbackLiveTrends(new LinkedHashMap<>());
            }

            List<LiveTrendSignal> trends = new ArrayList<>();
            for (JsonNode node : trendsNode) {
                String market = node.path("market").asText("Emerging Market");
                String keyword = node.path("keyword").asText(market);

                long trendScore = clampLong(node.path("trendScore").asLong(120), 50, 320);
                int changePct = clamp(node.path("changePct").asInt(0), -35, 80);
                String sentiment = normalizeSentiment(node.path("sentiment").asText("neutral"));
                int sourceCount = clamp(node.path("sourceCount").asInt(18), 6, 60);

                trends.add(new LiveTrendSignal(market, keyword, trendScore, changePct, sentiment, sourceCount));
            }

            if (trends.isEmpty()) {
                return fallbackLiveTrends(new LinkedHashMap<>());
            }
            return trends;
        } catch (Exception ignored) {
            return fallbackLiveTrends(new LinkedHashMap<>());
        }
    }

    private List<LiveTrendSignal> fallbackLiveTrends(LinkedHashMap<String, List<String>> seeds) {
        List<FallbackSeed> allFallbacks = List.of(
            new FallbackSeed("Artificial Intelligence", "Generative AI tools", "positive", 180, 24),
            new FallbackSeed("Green Tech", "Electric bikes", "positive", 140, 15),
            new FallbackSeed("E-commerce", "TikTok Shop trends", "neutral", 210, 18),
            new FallbackSeed("Food & Lifestyle", "Pho", "positive", 110, 8),
            new FallbackSeed("Personal Finance", "Digital gold investment", "neutral", 95, 2),
            new FallbackSeed("Health & Wellness", "Plant-based milk", "positive", 130, 12),
            new FallbackSeed("Smart Home", "IoT security devices", "neutral", 115, 6),
            new FallbackSeed("Travel & Tourism", "Glamping trends", "positive", 150, 21),
            new FallbackSeed("Entertainment", "Short-form video editing", "positive", 175, 30),
            new FallbackSeed("EdTech", "AI coding assistants", "positive", 160, 27)
        );

        long hourSeed = System.currentTimeMillis() / (1000L * 60L * 60L);
        Random random = new Random(hourSeed);

        List<FallbackSeed> selected = new ArrayList<>(allFallbacks);
        java.util.Collections.shuffle(selected, random);
        List<FallbackSeed> subList = selected.subList(0, 4);

        List<LiveTrendSignal> list = new ArrayList<>();
        for (FallbackSeed seed : subList) {
            long score = seed.baseScore() + random.nextInt(30);
            int change = seed.baseChange() + random.nextInt(10);
            int sourceCount = 10 + random.nextInt(25);
            list.add(new LiveTrendSignal(seed.market(), seed.query(), score, change, seed.sentiment(), sourceCount));
        }

        return list;
    }

    private record FallbackSeed(String market, String query, String sentiment, int baseScore, int baseChange) {}

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
                "Dựa trên các tín hiệu hiện tại từ %s, từ khóa \"%s\" ghi nhận %d lượt đề cập và khoảng %s lượt xem tổng hợp. Tương tác trung bình đạt %.2f%%, cho thấy %s.",
                source,
                keyword,
                totalMentions,
                formatCompact(totalViews),
                avgEngagement * 100,
                avgEngagement >= 0.04 ? "sự quan tâm mạnh mẽ từ khách hàng mục tiêu với tỷ lệ tương tác cao" : "đây là một xu hướng mới nổi cần theo dõi thêm để đánh giá tiềm năng thực tế"
        );

        List<String> opportunities = new ArrayList<>();
        if (!topKeywords.isBlank()) {
            opportunities.add("Xây dựng nhóm nội dung xoay quanh " + topKeywords + " để tối ưu hóa lưu lượng tìm kiếm ngách cho \"" + keyword + "\".");
        }
        if (!news.isEmpty()) {
            opportunities.add("Tận dụng thông điệp chính từ tin tức nổi bật \"" + news.get(0) + "\" để triển khai chiến dịch truyền thông hoặc kiểm thử thông điệp quảng cáo.");
        }
        if (!summaryLines.isEmpty()) {
            opportunities.add("Chuyển đổi nhận định hàng đầu thành định hướng thử nghiệm sản phẩm: " + summaryLines.get(0));
        }
        opportunities.add("Đo lường đà tương tác của người sáng tạo nội dung trước khi gia tăng ngân sách quảng cáo cho từ khóa \"" + keyword + "\".");

        String recommendation = String.format(
                "Ưu tiên chạy chiến dịch thử nghiệm quy mô nhỏ cho từ khóa \"%s\" tập trung vào nguồn %s để kiểm chứng tỷ lệ chuyển đổi, sau đó mở rộng sang các từ khóa liên quan.",
                keyword,
                source.toLowerCase(Locale.ROOT)
        );

        List<FrontendDtos.StatItem> stats = List.of(
                new FrontendDtos.StatItem(formatCompact(totalViews), "Tổng lượt xem"),
                new FrontendDtos.StatItem(String.valueOf(totalMentions), "Số lượt đề cập"),
                new FrontendDtos.StatItem(String.format(Locale.ROOT, "%.2f%%", avgEngagement * 100), "Tương tác trung bình")
        );

        List<FrontendDtos.SignalItem> mediaSignals = new ArrayList<>();
        mediaSignals.add(new FrontendDtos.SignalItem(
                "Tín hiệu nhu cầu khách hàng",
                String.format(
                        Locale.ROOT,
                        "Từ khóa \"%s\" đang tạo ra %s lượt xem trên các cụm chủ đề liên quan, chứng tỏ có lượng cầu thực tế rõ ràng.",
                        keyword,
                        formatCompact(totalViews)
                )
        ));
        mediaSignals.add(new FrontendDtos.SignalItem(
                "Động lực thảo luận",
                news.isEmpty()
                        ? "Các chủ đề tin tức công khai còn hạn chế, lượng thảo luận chủ yếu được thúc đẩy bởi nhu cầu tìm kiếm tự nhiên của người dùng."
                        : "Các bài viết gần đây như \"" + news.get(0) + "\" đang thu hút lượng thảo luận tích cực trên mạng xã hội."
        ));
        mediaSignals.add(new FrontendDtos.SignalItem(
                "Hệ quả cạnh tranh",
                topKeywords.isBlank()
                        ? "Thị trường ngách này chưa có đối thủ thống trị rõ ràng, mở ra cơ hội lớn cho người đi đầu."
                        : "Sự xuất hiện của các từ khóa ngách như " + topKeywords + " cho thấy thị trường đang phân mảnh thành các nhu cầu nhỏ hơn."
        ));

        int positive = clamp((int) Math.round(45 + avgEngagement * 900), 35, 82);
        int negative = clamp((int) Math.round(8 + Math.max(0, 0.03 - avgEngagement) * 400), 6, 24);
        int neutral = Math.max(0, 100 - positive - negative);
        List<FrontendDtos.SentimentBar> bars = List.of(
                new FrontendDtos.SentimentBar("Tích cực", positive, "var(--green)", "text-green"),
                new FrontendDtos.SentimentBar("Trung lập", neutral, "var(--gray-500)", ""),
                new FrontendDtos.SentimentBar("Tiêu cực", negative, "var(--red)", "text-red")
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
                            "%s lượt xem • %d đề cập",
                            formatCompact(metric.totalViews()),
                            metric.mentionCount()
                    );
                    return new FrontendDtos.TrendPoint(metric.keyword(), momentum, note);
                })
                .toList();
        List<FrontendDtos.StatItem> strategicStats = List.of(
                new FrontendDtos.StatItem(formatCompact(totalLikes), "Tổng lượt thích"),
                new FrontendDtos.StatItem(formatCompact(totalComments), "Tổng bình luận"),
                new FrontendDtos.StatItem(topKeywords.isBlank() ? keyword : topKeywords, "Chủ đề phụ tiềm năng")
        );

        List<FrontendDtos.CompetitorMapItem> fallbackCompetitors = List.of(
                new FrontendDtos.CompetitorMapItem(
                        keyword + " Channel",
                        "https://www.youtube.com",
                        "Mạnh",
                        "850K subs",
                        "3 video/tuần",
                        "Chuyên hướng dẫn và cung cấp các giải pháp tối ưu hóa thực tế cho " + keyword + "."
                ),
                new FrontendDtos.CompetitorMapItem(
                        keyword + " Hub",
                        "https://www.google.com",
                        "Trung bình",
                        "120K followers",
                        "1 video/tuần",
                        "Review so sánh hiệu năng và đánh giá ưu nhược điểm các dòng sản phẩm liên quan."
                ),
                new FrontendDtos.CompetitorMapItem(
                        keyword + " Lab",
                        "https://www.github.com",
                        "Mới nổi",
                        "35K followers",
                        "Hàng tuần",
                        "Chia sẻ kinh nghiệm lập trình, tích hợp hệ sinh thái và tự động hóa nâng cao."
                )
        );

        FrontendDtos.TargetPersona fallbackPersona = new FrontendDtos.TargetPersona(
                "Nhóm người dùng quan tâm đến \"" + keyword + "\", bao gồm các cá nhân đam mê công nghệ giải pháp, doanh nghiệp vừa và nhỏ (SMEs) và các kỹ sư tích hợp hệ thống đang tìm kiếm giải pháp tối ưu hóa hiệu năng và chi phí.",
                List.of(
                        "Thiếu tài liệu hướng dẫn tiếng Việt chi tiết và các tình huống ứng dụng thực tế.",
                        "Khó khăn trong việc tích hợp và đồng bộ hóa với hệ thống thiết bị sẵn có.",
                        "Độ trễ tín hiệu và độ ổn định của giải pháp chưa đạt kỳ vọng khi vận hành quy mô lớn."
                ),
                List.of(
                        "Tìm kiếm các bài viết hướng dẫn từng bước (Step-by-step) và video lập trình DIY.",
                        "So sánh chi phí, hiệu năng và độ tương thích giữa các thương hiệu cùng phân khúc.",
                        "Tìm kiếm phản hồi thực tế từ cộng đồng người dùng trước khi quyết định đầu tư."
                )
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
                        ? List.of(new FrontendDtos.TrendPoint(keyword, 52, "Tín hiệu cơ sở"))
                        : trendPoints,
                new FrontendDtos.SentimentBlock(
                        bars,
                        topics.isEmpty()
                                ? List.of(new FrontendDtos.TopicItem(keyword, "+10%"))
                                : topics
                ),
                opportunityCards,
                strategicStats,
                fallbackCompetitors,
                fallbackPersona
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
                            "Cơ hội AI 1",
                            "Thử nghiệm một dự án chuyên biệt xoay quanh \"" + keyword + "\" để kiểm chứng nhu cầu khách hàng.",
                            "green"
                    )
            );
        }

        List<String> themes = List.of("green", "blue", "orange", "purple");
        List<FrontendDtos.OpportunityCard> cards = new ArrayList<>();
        for (int i = 0; i < Math.min(4, opportunities.size()); i++) {
            cards.add(new FrontendDtos.OpportunityCard(
                    "Cơ hội AI " + (i + 1),
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

    @Override
    public String normalizeKeyword(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return "";
        }
        
        String clean = keyword.trim().toLowerCase(Locale.ROOT);
        
        // Hardcoded common rules for instant response
        if (clean.equals("ai") || clean.equals("artificial intelligence") || clean.equals("tri tue nhan tao") || clean.equals("trí tuệ nhân tạo")) {
            return "artificial intelligence";
        }
        if (clean.equals("bike") || clean.equals("electric bike") || clean.equals("xe dap dien") || clean.equals("xe đạp điện") || clean.equals("e-bike")) {
            return "electric bike";
        }

        String activeProvider = systemSettingRepository.findById("ai_provider")
                .map(SystemSettingEntity::getValue)
                .map(String::toUpperCase)
                .orElse("GEMINI");

        String activeModel = systemSettingRepository.findById("ai_model")
                .map(SystemSettingEntity::getValue)
                .filter(v -> !v.isBlank())
                .orElse(this.model);

        String activeApiKey = systemSettingRepository.findById("ai_api_key")
                .map(SystemSettingEntity::getValue)
                .filter(v -> !v.isBlank())
                .orElse(this.apiKey);

        String activeEndpoint = systemSettingRepository.findById("ai_endpoint")
                .map(SystemSettingEntity::getValue)
                .filter(v -> !v.isBlank())
                .orElse("");

        if (activeApiKey.isBlank()) {
            return clean;
        }

        String prompt = String.format(
                """
                You are a search query normalizer. Your job is to translate and map the given search keyword/phrase to a standard, canonical, normalized topic name.
                The canonical name should be the most common standard English name or standard noun phrase representing the core subject.
                
                Rules:
                - Keep it lowercase.
                - Do not include explanation, punctuation, or extra words.
                - Return only the normalized string.
                
                Input Keyword: "%s"
                Normalized Canonical Keyword:
                """,
                keyword
        );

        try {
            String responseText = "";
            if ("OPENAI".equalsIgnoreCase(activeProvider)) {
                Map<String, Object> requestBody = Map.of(
                        "model", activeModel,
                        "messages", List.of(Map.of("role", "user", "content", prompt)),
                        "temperature", 0.0
                );

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.setBearerAuth(activeApiKey);
                HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

                String url = activeEndpoint.isBlank() ? "https://api.openai.com/v1/chat/completions" : activeEndpoint;
                if (!activeEndpoint.isBlank() && !url.toLowerCase(Locale.ROOT).contains("/chat/completions")) {
                    url = url.endsWith("/") ? url + "chat/completions" : url + "/chat/completions";
                }
                ResponseEntity<String> response = restTemplate.postForEntity(url, requestEntity, String.class);
                JsonNode root = mapper.readTree(response.getBody());
                responseText = root.path("choices").get(0).path("message").path("content").asText();
            } else {
                Map<String, Object> requestBody = Map.of(
                        "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                        "generationConfig", Map.of("temperature", 0.0));

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

                String url;
                if (activeEndpoint.isBlank()) {
                    url = "https://generativelanguage.googleapis.com/v1beta/models/" + activeModel + ":generateContent?key=" + activeApiKey;
                } else {
                    url = activeEndpoint.endsWith("/") ? activeEndpoint + activeModel + ":generateContent?key=" + activeApiKey 
                            : activeEndpoint + "/" + activeModel + ":generateContent?key=" + activeApiKey;
                }

                ResponseEntity<String> response = restTemplate.postForEntity(url, requestEntity, String.class);
                JsonNode root = mapper.readTree(response.getBody());
                responseText = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
            }

            return responseText.trim().replaceAll("\"", "").toLowerCase(Locale.ROOT);
        } catch (Exception e) {
            log.warn("Keyword normalization failed: {}", e.getMessage());
            return clean;
        }
    }

    private String fallbackTimeRange(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return "2y";
        }
        String clean = keyword.trim().toLowerCase(Locale.ROOT);
        
        // Fast-moving industries: tech, fashion, electronics, trends, startups
        if (clean.matches(".*(ai|artificial|intelligence|chatgpt|gpt|gemini|openai|gpu|nvidia|deepseek|claude|llm|software|app|technology|iphone|samsung|điện thoại|laptop|gaming|crypto|bitcoin|blockchain|thời trang|fashion|quần áo|xu hướng|trend|tiktok|facebook|social).*")) {
            return "6m";
        }
        
        // Heavy/slow-moving industries or B2B/finance/real estate: banking, invest, finance, real estate, b2b, manufacturing
        if (clean.matches(".*(bất động sản|nhà đất|căn hộ|chung cư|tài chính|đầu tư|chứng khoán|cổ phiếu|b2b|ngân hàng|bank|credit|lãi suất|bảo hiểm|insurance|heavy|manufacturing|logistic|chuỗi cung ứng|economic|kinh tế|sản xuất).*")) {
            return "5y";
        }
        
        // Default to FMCG / retail (2 years)
        return "2y";
    }

    @Override
    public String inferTimeRange(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return "2y";
        }
        
        String clean = keyword.trim().toLowerCase(Locale.ROOT);
        
        String activeProvider = systemSettingRepository.findById("ai_provider")
                .map(SystemSettingEntity::getValue)
                .map(String::toUpperCase)
                .orElse("GEMINI");

        String activeModel = systemSettingRepository.findById("ai_model")
                .map(SystemSettingEntity::getValue)
                .filter(v -> !v.isBlank())
                .orElse(this.model);

        String activeApiKey = systemSettingRepository.findById("ai_api_key")
                .map(SystemSettingEntity::getValue)
                .filter(v -> !v.isBlank())
                .orElse(this.apiKey);

        String activeEndpoint = systemSettingRepository.findById("ai_endpoint")
                .map(SystemSettingEntity::getValue)
                .filter(v -> !v.isBlank())
                .orElse("");

        if (activeApiKey.isBlank()) {
            return fallbackTimeRange(clean);
        }

        String prompt = String.format(
                """
                You are a market research assistant. Your task is to analyze the given topic or keyword and determine which industry it belongs to, and then assign the most appropriate historical data collection timeframe based on the industry's volatility and lifecycle.
                
                Industry Rules:
                1. Technology, electronics, fashion, trend-driven topics, or highly volatile subjects: Use "6m" (6 months) or "1y" (1 year) because product lifecycles are extremely short and trends change constantly.
                2. FMCG (Fast Moving Consumer Goods), retail, food & beverage, general consumer products: Use "2y" (2 years) as it is ideal to evaluate shopping habits.
                3. Finance, banking, investing, real estate, B2B, infrastructure, heavy industries: Use "5y" (5 years) or "3y" (3 years) to see economic cycles, trends, fluctuations, and economic rounds.
                
                Input Keyword: "%s"
                
                Respond ONLY with one of the following timeframe codes (no explanations, no punctuation):
                - "6m" (for fast-moving tech/electronics/fashion)
                - "1y" (for moderate tech/fashion/volatile subjects)
                - "2y" (for FMCG/retail/general F&B)
                - "3y" (for B2B/heavy industries)
                - "5y" (for finance/banking/real estate)
                
                Timeframe Code:
                """,
                keyword
        );

        try {
            String responseText = "";
            if ("OPENAI".equalsIgnoreCase(activeProvider)) {
                Map<String, Object> requestBody = Map.of(
                        "model", activeModel,
                        "messages", List.of(Map.of("role", "user", "content", prompt)),
                        "temperature", 0.0
                );

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.setBearerAuth(activeApiKey);
                HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

                String url = activeEndpoint.isBlank() ? "https://api.openai.com/v1/chat/completions" : activeEndpoint;
                if (!activeEndpoint.isBlank() && !url.toLowerCase(Locale.ROOT).contains("/chat/completions")) {
                    url = url.endsWith("/") ? url + "chat/completions" : url + "/chat/completions";
                }
                ResponseEntity<String> response = restTemplate.postForEntity(url, requestEntity, String.class);
                JsonNode root = mapper.readTree(response.getBody());
                responseText = root.path("choices").get(0).path("message").path("content").asText();
            } else {
                Map<String, Object> requestBody = Map.of(
                        "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                        "generationConfig", Map.of("temperature", 0.0));

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

                String url;
                if (activeEndpoint.isBlank()) {
                    url = "https://generativelanguage.googleapis.com/v1beta/models/" + activeModel + ":generateContent?key=" + activeApiKey;
                } else {
                    url = activeEndpoint.endsWith("/") ? activeEndpoint + activeModel + ":generateContent?key=" + activeApiKey 
                            : activeEndpoint + "/" + activeModel + ":generateContent?key=" + activeApiKey;
                }

                ResponseEntity<String> response = restTemplate.postForEntity(url, requestEntity, String.class);
                JsonNode root = mapper.readTree(response.getBody());
                responseText = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
            }

            String result = responseText.trim().replaceAll("\"", "").toLowerCase(Locale.ROOT);
            if (result.equals("6m") || result.equals("1y") || result.equals("2y") || result.equals("3y") || result.equals("5y")) {
                return result;
            }
            return fallbackTimeRange(clean);
        } catch (Exception e) {
            log.warn("Industry timeframe inference failed: {}", e.getMessage());
            return fallbackTimeRange(clean);
        }
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
            List<FrontendDtos.StatItem> strategicStats,
            List<FrontendDtos.CompetitorMapItem> competitors,
            FrontendDtos.TargetPersona targetPersona
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
                    ),
                    competitors,
                    targetPersona
            );
        }
    }
}
