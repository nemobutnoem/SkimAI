package com.researchco.search;

import com.researchco.provider.SearchProviderEntity;
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
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "source_items")
public class SourceItemEntity {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "search_query_id", nullable = false)
    private SearchQueryEntity searchQuery;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "provider_id", nullable = false)
    private SearchProviderEntity provider;

    @Column(length = 50)
    private String platform;

    @Column(name = "content_type", length = 50)
    private String contentType;

    @Column
    private String title;

    @Column
    private String snippet;

    @Column
    private String url;

    @Column(name = "source_name")
    private String sourceName;

    @Column(name = "author_name")
    private String authorName;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "sentiment_label", length = 20)
    private String sentimentLabel;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "raw_payload")
    private Object rawPayload;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
