package com.researchco.report;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public class ReportDtos {

    public record CreateReportRequest(
            @NotNull String searchQueryId,
            @NotBlank String title
    ) {
    }

    public record ReportResponse(
            String reportId,
            String searchQueryId,
            String snapshotId,
            String title,
            String status,
            LocalDateTime createdAt
    ) {
    }
}
