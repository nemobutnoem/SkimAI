package com.researchco.provider;

import java.util.List;

public interface SearchProvider {
    String providerCode();

    List<NormalizedSourceItem> search(String keyword, String countryCode, String languageCode, String timeRange);
}
