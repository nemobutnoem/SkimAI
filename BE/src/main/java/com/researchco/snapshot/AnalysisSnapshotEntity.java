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

    @Column(name = "summary_text")
    private String summaryText;

    @Column(name = "total_sources")
    private Integer totalSources;

    @Column(name = "positive_count")
    private Integer positiveCount;

    @Column(name = "neutral_count")
    private Integer neutralCount;

    @Column(name = "negative_count")
    private Integer negativeCount;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
