package com.researchco.search;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;
import java.util.List;

public class SearchDtos {

    public record SearchRequest(
            @NotBlank String keyword,
            String countryCode,
            String languageCode,
            String timeRange
    ) {
    }

    public record SearchResponse(
            String searchQueryId,
            String status,
            String snapshotId,
            int totalSources
    ) {
    }

    public record SourceItemResponse(
            String id,
            String providerCode,
            String platform,
            String contentType,
            String title,
            String snippet,
            String url,
            String sourceName,
            String authorName,
            LocalDateTime publishedAt,
            String sentimentLabel
    ) {
    }

    public record SearchHistoryItem(
            String id,
            String keyword,
            String status,
            LocalDateTime createdAt
    ) {
    }

    public record SearchHistoryResponse(List<SearchHistoryItem> items) {
    }
}
