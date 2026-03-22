package com.researchco.snapshot;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class SnapshotDtos {

    public record InsightItem(String title, String content) {
    }

    public record KeywordItem(String keyword, Integer mentionCount) {
    }

    public record ChartItem(String chartType, Object chartData) {
    }

    public record SnapshotResponse(
            String snapshotId,
            String searchQueryId,
            String summaryText,
            Integer totalSources,
            Integer positiveCount,
            Integer neutralCount,
            Integer negativeCount,
            LocalDateTime createdAt,
            List<InsightItem> insights,
            List<KeywordItem> keywords,
            List<ChartItem> charts
    ) {
    }
}
