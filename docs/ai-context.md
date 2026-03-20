# Project Context - ResearchCo / SkimAI

## 1. Overview

This is a market intelligence web application.

Users input a keyword, and the system:
- fetches data from multiple sources (Google, News, YouTube)
- normalizes the data
- stores it in PostgreSQL
- generates a market snapshot
- displays insights in a dashboard
- allows report generation

## 2. Tech Stack

- Backend: Java (Spring Boot)
- Frontend: React
- Database: PostgreSQL (Supabase as cloud DB)
- Build tool: Maven
- API style: REST

## 3. Architecture

Frontend → Backend (Spring Boot) → PostgreSQL

- Backend handles all business logic
- Supabase is used only as PostgreSQL database (NOT as backend)
- System must support multiple data providers

## 4. Provider Architecture

We use a provider pattern:

SearchProvider (interface)
- SerpApiProvider
- YoutubeApiProvider (future)
- SerperProvider (future)

All providers must:
- fetch data
- normalize to a common format
- return consistent DTOs

Frontend must NOT depend on raw provider responses.

## 5. Core Features

- User authentication (JWT)
- Keyword search
- Market snapshot (dashboard)
- Source listing
- Report generation
- Subscription plans
- Admin dashboard

## 6. Database Tables

- users
- plans
- user_subscriptions
- search_queries
- search_providers
- source_items
- analysis_snapshots
- snapshot_insights
- snapshot_keywords
- snapshot_charts
- reports
- report_exports
- saved_searches
- admin_actions

## 7. Core API Endpoints

- POST /api/auth/register
- POST /api/auth/login
- POST /api/search
- GET /api/snapshots/{id}
- GET /api/search/{id}/sources
- GET /api/search/history
- POST /api/reports
- GET /api/admin/dashboard

## 8. Development Goal

- Build MVP first
- Keep architecture scalable
- Use clean code practices
- Prioritize working flow over perfection

## 9. Coding Guidelines

- Use layered architecture (controller, service, repository)
- Use DTOs for request/response
- Use constructor injection
- Avoid tight coupling with external APIs
- Normalize all external data

## 10. Notes

- Supabase is used only as PostgreSQL
- Do NOT use Supabase auth or API
- Backend must remain independent of data providers