# System Overview - ResearchCo / SkimAI

## 1. Overview

ResearchCo is a market intelligence web application.

The system allows users to:
- input a keyword
- collect data from multiple sources (Google, News, YouTube)
- analyze and summarize market signals
- view insights in a dashboard
- generate report-ready output

The goal is to help small research and product teams:
- reduce manual research time
- understand market trends quickly
- produce internal reports efficiently

---

## 2. High-Level Architecture

Frontend → Backend → Database

- Frontend: React
- Backend: Java Spring Boot
- Database: PostgreSQL (hosted on Supabase)

External data providers:
- SerpApi (Google, News)
- YouTube API
- future providers (Serper, crawler)

---

## 3. Core System Flow

1. User enters a keyword
2. Backend receives request
3. Backend calls one or more data providers
4. Data is normalized into a standard format
5. Data is stored in database
6. Backend generates a market snapshot
7. Frontend displays dashboard
8. User can export a report

---

## 4. User Roles

### User
- perform keyword search
- view dashboard
- generate reports
- manage saved searches

### Admin
- manage users
- review reports
- monitor system usage
- manage plans and subscriptions

---

## 5. Core Features

- Authentication (JWT-based)
- Keyword search
- Multi-source data aggregation
- Dashboard snapshot (insights, charts, keywords)
- Source listing
- Report generation
- Subscription plans
- Admin dashboard

---

## 6. Provider-Based Design

The system supports multiple data providers.

Architecture:
- SearchProvider (interface)
- SerpApiProvider
- YoutubeApiProvider (future)
- SerperProvider (future)

All providers must:
- fetch data
- normalize output
- return consistent structure

Frontend must NOT depend on provider-specific responses.

---

## 7. Data Flow

User → Search Query → Source Items → Snapshot → Report

- search_queries: stores keyword search
- source_items: raw + normalized data
- analysis_snapshots: processed dashboard data
- reports: final output

---

## 8. Key Design Principles

- Separation of concerns (frontend / backend / database)
- Provider abstraction (no vendor lock-in)
- Data normalization
- MVP-first development
- Scalable architecture

---

## 9. MVP Scope

Included:
- keyword search
- dashboard snapshot
- basic insights
- report generation
- subscription logic (basic)

Not included yet:
- real-time alerts
- team collaboration
- deep analytics
- enterprise features

---

## 10. Notes

- Supabase is used only as PostgreSQL hosting
- Backend handles all business logic
- Frontend communicates only with backend APIs