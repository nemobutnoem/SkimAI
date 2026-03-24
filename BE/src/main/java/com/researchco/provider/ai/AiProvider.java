package com.researchco.provider.ai;

import com.researchco.frontend.FrontendDtos;

import java.util.List;
import java.util.Map;

public interface AiProvider {
    /**
     * Lấy contextData và trả về DeepInsightResponse
     * @param contextData Dữ liệu thô gửi lên
     * @param source Kiểu nguồn
     * @return Kết quả insight xử lý xong
     */
    FrontendDtos.DeepInsightResponse generateDeepInsight(FrontendDtos.AnalysisResponse contextData, String source);

    List<LiveTrendSignal> generateLiveTrends(Map<String, List<String>> marketSeeds);

    record LiveTrendSignal(
            String market,
            String keyword,
            long trendScore,
            int changePct,
            String sentiment,
            int sourceCount
    ) {
    }
}
