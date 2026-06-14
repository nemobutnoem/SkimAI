package com.researchco.provider;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
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
@Table(name = "search_providers")
public class SearchProviderEntity {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Column(name = "provider_code", nullable = false, unique = true, length = 50)
    private String providerCode;

    @Column(name = "provider_name", length = 100)
    private String providerName;

    @Builder.Default
    @Column(name = "is_active", nullable = false, columnDefinition = "boolean default true")
    private Boolean isActive = true;
}
