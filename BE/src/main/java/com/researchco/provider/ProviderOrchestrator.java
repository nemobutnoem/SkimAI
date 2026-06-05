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
        List<java.util.concurrent.CompletableFuture<List<NormalizedSourceItem>>> futures = activeProviderCodes.stream()
                .map(providersByCode::get)
                .filter(java.util.Objects::nonNull)
                .map(provider -> java.util.concurrent.CompletableFuture.supplyAsync(() -> {
                    try {
                        return provider.search(keyword, countryCode, languageCode, timeRange);
                    } catch (Exception e) {
                        System.err.println("[ERROR] Failed fetching from provider: " + provider.providerCode());
                        e.printStackTrace();
                        return List.<NormalizedSourceItem>of();
                    }
                }))
                .toList();

        return futures.stream()
                .map(java.util.concurrent.CompletableFuture::join)
                .flatMap(List::stream)
                .collect(Collectors.toList());
    }
}
