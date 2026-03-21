package com.researchco.search;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    @PostMapping
    public SearchDtos.SearchResponse search(@Valid @RequestBody SearchDtos.SearchRequest request) {
        return searchService.executeSearch(request);
    }

    @GetMapping("/{id}/sources")
    public List<SearchDtos.SourceItemResponse> getSources(@PathVariable("id") UUID id) {
        return searchService.getSources(id);
    }

    @GetMapping("/history")
    public SearchDtos.SearchHistoryResponse history() {
        return searchService.history();
    }
}
