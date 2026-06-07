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
                  ]
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
                      "keyword": "consumer demand",
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
