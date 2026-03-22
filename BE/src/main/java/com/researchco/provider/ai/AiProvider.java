package com.researchco.provider.ai;

import com.researchco.frontend.FrontendDtos;

public interface AiProvider {
    /**
     * Lấy contextData và trả về DeepInsightResponse
     * @param contextData Dữ liệu thô gửi lên
     * @param source Kiểu nguồn
     * @return Kết quả insight xử lý xong
     */
    FrontendDtos.DeepInsightResponse generateDeepInsight(FrontendDtos.AnalysisResponse contextData, String source);
}
