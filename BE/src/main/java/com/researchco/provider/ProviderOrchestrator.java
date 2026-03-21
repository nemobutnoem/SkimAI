package com.researchco.provider;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ProviderOrchestrator {

    private final Map<String, SearchProvider> providersByCode;

    public ProviderOrchestrator(List<SearchProvider> providers) {
        this.providersByCode = providers.stream()
                .collect(Collectors.toMap(SearchProvider::providerCode, Function.identity()));
    }

    public List<NormalizedSourceItem> aggregate(Set<String> activeProviderCodes,
                                                String keyword,
                                                String countryCode,
                                                String languageCode,
                                                String timeRange) {
        List<NormalizedSourceItem> items = new ArrayList<>();
        for (String providerCode : activeProviderCodes) {
            SearchProvider provider = providersByCode.get(providerCode);
            if (provider != null) {
                items.addAll(provider.search(keyword, countryCode, languageCode, timeRange));
            }
        }
        return items;
    }
}
