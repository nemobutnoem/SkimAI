package com.researchco.provider;

public record YoutubeBehaviorMetrics(
        long viewCount,
        long likeCount,
        long commentCount,
        long subscriberCount,
        double engagementRate,
        double commentIntensity
) {
}
