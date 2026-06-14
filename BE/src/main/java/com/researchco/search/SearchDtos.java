package com.researchco.search;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

public class SearchDtos {

    public record SearchRequest(
            @NotBlank @Size(max = 255) String keyword,
            @Size(max = 10) String countryCode,
            @Size(max = 10) String languageCode,
            @Size(max = 20) String timeRange
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
