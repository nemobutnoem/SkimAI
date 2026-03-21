package com.researchco.provider;

import java.time.LocalDateTime;

public record NormalizedSourceItem(
        String providerCode,
        String platform,
        String contentType,
        String title,
        String snippet,
        String url,
        String sourceName,
        String authorName,
        LocalDateTime publishedAt,
        String sentimentLabel,
        Object rawPayload
) {
}
