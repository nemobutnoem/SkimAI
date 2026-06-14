package com.researchco.snapshot;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "snapshot_keywords")
public class SnapshotKeywordEntity {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "snapshot_id", nullable = false)
    private AnalysisSnapshotEntity snapshot;

    @Column(nullable = false, length = 255)
    private String keyword;

    @Builder.Default
    @Column(name = "mention_count", nullable = false, columnDefinition = "integer default 0")
    private Integer mentionCount = 0;

    @Builder.Default
    @Column(name = "total_views", columnDefinition = "bigint default 0")
    private Long totalViews = 0L;

    @Builder.Default
    @Column(name = "total_comments", columnDefinition = "bigint default 0")
    private Long totalComments = 0L;

    @Column(name = "avg_engagement")
    private Double avgEngagement;
}
