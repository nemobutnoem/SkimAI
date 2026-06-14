package com.researchco.usage;

import com.researchco.user.UserEntity;
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
@Table(name = "ai_usage")
public class AiUsageEntity {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(name = "feature", nullable = false, length = 50)
    private String feature;

    @Column(name = "period_key", nullable = false, length = 20)
    private String periodKey;

    @Builder.Default
    @Column(name = "used_count", nullable = false, columnDefinition = "integer default 0")
    private Integer usedCount = 0;

    @Builder.Default
    @Column(name = "addon_credits", nullable = false, columnDefinition = "integer default 0")
    private Integer addonCredits = 0;
}

