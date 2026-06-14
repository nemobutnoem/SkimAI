package com.researchco.snapshot;

import com.researchco.search.SearchQueryEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "analysis_snapshots")
public class AnalysisSnapshotEntity {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "search_query_id", nullable = false, unique = true)
    private SearchQueryEntity searchQuery;

    @Column(name = "summary_text", columnDefinition = "TEXT")
    private String summaryText;

    @Builder.Default
    @Column(name = "total_sources", nullable = false, columnDefinition = "integer default 0")
    private Integer totalSources = 0;

    @Builder.Default
    @Column(name = "positive_count", nullable = false, columnDefinition = "integer default 0")
    private Integer positiveCount = 0;

    @Builder.Default
    @Column(name = "neutral_count", nullable = false, columnDefinition = "integer default 0")
    private Integer neutralCount = 0;

    @Builder.Default
    @Column(name = "negative_count", nullable = false, columnDefinition = "integer default 0")
    private Integer negativeCount = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
