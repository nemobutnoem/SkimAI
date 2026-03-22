package com.researchco.home;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HomeService {

    public List<HomeDtos.TrendItem> getHomeTrends() {
        return List.of(
                new HomeDtos.TrendItem("trend-ai-agent", "AI Agent", "+34%", "positive"),
                new HomeDtos.TrendItem("trend-electric-bike", "Electric bike", "+21%", "positive"),
                new HomeDtos.TrendItem("trend-tiktok-shop", "TikTok Shop trends", "+18%", "neutral"),
                new HomeDtos.TrendItem("trend-social-commerce", "Social Commerce", "-6%", "negative")
        );
    }
}
