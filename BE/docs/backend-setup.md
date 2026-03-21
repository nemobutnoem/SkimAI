\# Backend Setup Guide - ResearchCo / SkimAI



\## 1. Overview



The backend is built using Java Spring Boot.



Responsibilities:

\- handle business logic

\- connect to PostgreSQL (Supabase)

\- integrate external APIs (SerpApi, YouTube)

\- normalize data

\- generate snapshots and reports

\- expose REST APIs



\---



\## 2. Tech Stack



\- Java

\- Spring Boot

\- Maven

\- Spring Web

\- Spring Data JPA

\- PostgreSQL Driver

\- Spring Security

\- JWT

\- Lombok



Database:

\- PostgreSQL (hosted on Supabase)



\---



\## 3. Architecture



Frontend → Backend → Database



\- React calls REST APIs

\- Java backend processes logic

\- Supabase is used only as PostgreSQL



\---



\## 4. Important Rules



\- Do NOT use Supabase Auth

\- Do NOT use Supabase publishable key in backend

\- Backend handles all logic

\- Providers must be abstracted



\---



\## 5. Project Structure



```text

src/main/java/com/researchco

├── auth

├── user

├── plan

├── search

├── provider

├── snapshot

├── report

├── admin

└── common

