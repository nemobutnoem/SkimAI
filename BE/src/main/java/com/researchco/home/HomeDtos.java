package com.researchco.home;

import java.util.List;

public class HomeDtos {

    public record TrendItem(
            String id,
            String name,
            String change,
            String sentiment,
            String market,
            int sourceCount,
            String updatedAt
    ) {
    }

    public record HomeTrendsResponse(
            List<TrendItem> items
    ) {
    }
}
