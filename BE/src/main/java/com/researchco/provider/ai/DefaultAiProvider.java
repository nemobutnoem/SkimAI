package com.researchco.provider.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.researchco.frontend.FrontendDtos;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DefaultAiProvider implements AiProvider {

    private final String API_KEY = "AIzaSyBMdN4kjzutR-DC5-WX80AhIkUJX6JCOrQ";
    private final String URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key="
            + API_KEY;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    public FrontendDtos.DeepInsightResponse generateDeepInsight(FrontendDtos.AnalysisResponse contextData,
            String source) {
        String keywordsSummary = contextData.relatedKeywords() == null ? ""
                : contextData.relatedKeywords().stream()
                        .limit(10)
                        .map(k -> String.format("%s (Views: %d, Likes: %d)", k.keyword(), k.totalViews(),
                                k.totalLikes()))
                        .collect(Collectors.joining(", "));

        String prompt = String.format(
                "Act as a professional Marketing Strategist. Analyze the following actual search data for the keyword '%s' (Source: %s).\n"
                        +
                        "Related Keywords & Metrics:\n%s\n\n" +
                        "Based on this data, return a JSON object with this exact structure (do not include markdown formatting or code blocks):\n"
                        +
                        "{\n" +
                        "  \"marketInsight\": \"1-2 sentences summarizing the overall market demand and clustering.\",\n"
                        +
                        "  \"opportunities\": [\"Actionable content opportunity 1\", \"Actionable opportunity 2\", \"Actionable opportunity 3\", \"Actionable opportunity 4\"],\n"
                        +
                        "  \"recommendation\": \"1 sentence strategic recommendation.\"\n" +
                        "}",
                contextData.keyword(), source, keywordsSummary);

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                "generationConfig", Map.of("responseMimeType", "application/json"));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(URL, requestEntity, String.class);
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
                    jsonResult.path("recommendation").asText("No recommendation available."));

        } catch (Exception e) {
            e.printStackTrace();
            return new FrontendDtos.DeepInsightResponse(
                    contextData.keyword(),
                    source,
                    "Failed to generate insight from AI. Error: " + e.getMessage(),
                    List.of("Check API Key", "Check network connection", "Check Spring Boot logs"),
                    "Please try again later.");
        }
    }
}
