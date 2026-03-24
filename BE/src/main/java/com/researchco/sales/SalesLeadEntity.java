package com.researchco.sales;

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
@Table(name = "sales_leads")
public class SalesLeadEntity {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Column(name = "contact_name", nullable = false, length = 120)
    private String contactName;

    @Column(name = "work_email", nullable = false, length = 160)
    private String workEmail;

    @Column(name = "company_name", nullable = false, length = 160)
    private String companyName;

    @Column(name = "team_size")
    private Integer teamSize;

    @Column(name = "billing_cycle", nullable = false, length = 20)
    private String billingCycle;

    @Column(name = "plan_name", nullable = false, length = 50)
    private String planName;

    @Column(name = "note", length = 2000)
    private String note;

    @Column(nullable = false, length = 30)
    private String status;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
