package com.researchco.report;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class ReportDtos {

    public record CreateReportRequest(
            @NotBlank String searchQueryId,
            @NotBlank @Size(max = 500) String title
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

    public record UserReportResponse(
            String id,
            String title,
            String status,
            String keyword,
            LocalDateTime createdAt
    ) {
    }

    public record ReportDetailsResponse(
            String id,
            String title,
            String status,
            String keyword,
            java.util.Map<String, Object> reportContent,
            LocalDateTime createdAt
    ) {
    }
}
