\-- =========================

\-- EXTENSIONS

\-- =========================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";



\-- =========================

\-- USERS

\-- =========================

CREATE TABLE users (

&#x20;   id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),

&#x20;   full\_name VARCHAR(100) NOT NULL,

&#x20;   email VARCHAR(150) UNIQUE NOT NULL,

&#x20;   password\_hash TEXT NOT NULL,

&#x20;   avatar\_url TEXT,

&#x20;   role VARCHAR(20) NOT NULL DEFAULT 'USER',

&#x20;   status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

&#x20;   created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,

&#x20;   updated\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP

);



\-- =========================

\-- PLANS

\-- =========================

CREATE TABLE plans (

&#x20;   id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),

&#x20;   name VARCHAR(50) UNIQUE NOT NULL,

&#x20;   price DECIMAL(12,2) DEFAULT 0,

&#x20;   search\_limit INT DEFAULT 0,

&#x20;   export\_limit INT DEFAULT 0,

&#x20;   description TEXT,

&#x20;   created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP

);



INSERT INTO plans (name, price, search\_limit, export\_limit)

VALUES

('FREE', 0, 10, 0),

('STANDARD', 149000, 100, 20),

('PREMIUM', 299000, 500, 100),

('BUSINESS', 999000, 999999, 999999);



\-- =========================

\-- USER SUBSCRIPTION

\-- =========================

CREATE TABLE user\_subscriptions (

&#x20;   id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),

&#x20;   user\_id UUID REFERENCES users(id),

&#x20;   plan\_id UUID REFERENCES plans(id),

&#x20;   start\_date TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,

&#x20;   end\_date TIMESTAMP,

&#x20;   status VARCHAR(20) DEFAULT 'ACTIVE'

);



\-- =========================

\-- SEARCH QUERY

\-- =========================

CREATE TABLE search\_queries (

&#x20;   id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),

&#x20;   user\_id UUID REFERENCES users(id),

&#x20;   keyword VARCHAR(255) NOT NULL,

&#x20;   country\_code VARCHAR(10),

&#x20;   language\_code VARCHAR(10),

&#x20;   time\_range VARCHAR(20),

&#x20;   status VARCHAR(20) DEFAULT 'PENDING',

&#x20;   created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP

);



\-- =========================

\-- PROVIDERS

\-- =========================

CREATE TABLE search\_providers (

&#x20;   id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),

&#x20;   provider\_code VARCHAR(50) UNIQUE NOT NULL,

&#x20;   provider\_name VARCHAR(100),

&#x20;   is\_active BOOLEAN DEFAULT TRUE

);



INSERT INTO search\_providers (provider\_code, provider\_name)

VALUES

('SERPAPI\_GOOGLE', 'SerpApi Google'),

('SERPAPI\_NEWS', 'SerpApi News'),

('YOUTUBE\_API', 'YouTube API');



\-- =========================

\-- SOURCE ITEMS (RAW + NORMALIZED)

\-- =========================

CREATE TABLE source\_items (

&#x20;   id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),

&#x20;   search\_query\_id UUID REFERENCES search\_queries(id),

&#x20;   provider\_id UUID REFERENCES search\_providers(id),

&#x20;   platform VARCHAR(50),

&#x20;   content\_type VARCHAR(50),

&#x20;   title TEXT,

&#x20;   snippet TEXT,

&#x20;   url TEXT,

&#x20;   source\_name VARCHAR(255),

&#x20;   author\_name VARCHAR(255),

&#x20;   published\_at TIMESTAMP,

&#x20;   sentiment\_label VARCHAR(20),

&#x20;   raw\_payload JSONB,

&#x20;   created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP

);



\-- =========================

\-- SNAPSHOT (DASHBOARD)

\-- =========================

CREATE TABLE analysis\_snapshots (

&#x20;   id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),

&#x20;   search\_query\_id UUID UNIQUE REFERENCES search\_queries(id),

&#x20;   summary\_text TEXT,

&#x20;   total\_sources INT DEFAULT 0,

&#x20;   positive\_count INT DEFAULT 0,

&#x20;   neutral\_count INT DEFAULT 0,

&#x20;   negative\_count INT DEFAULT 0,

&#x20;   created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP

);



\-- =========================

\-- INSIGHTS

\-- =========================

CREATE TABLE snapshot\_insights (

&#x20;   id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),

&#x20;   snapshot\_id UUID REFERENCES analysis\_snapshots(id),

&#x20;   title VARCHAR(255),

&#x20;   content TEXT,

&#x20;   created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP

);



\-- =========================

\-- KEYWORDS

\-- =========================

CREATE TABLE snapshot\_keywords (

&#x20;   id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),

&#x20;   snapshot\_id UUID REFERENCES analysis\_snapshots(id),

&#x20;   keyword VARCHAR(255),

&#x20;   mention\_count INT DEFAULT 0

);



\-- =========================

\-- CHART DATA

\-- =========================

CREATE TABLE snapshot\_charts (

&#x20;   id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),

&#x20;   snapshot\_id UUID REFERENCES analysis\_snapshots(id),

&#x20;   chart\_type VARCHAR(50),

&#x20;   chart\_data JSONB

);



\-- =========================

\-- REPORTS

\-- =========================

CREATE TABLE reports (

&#x20;   id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),

&#x20;   user\_id UUID REFERENCES users(id),

&#x20;   search\_query\_id UUID REFERENCES search\_queries(id),

&#x20;   snapshot\_id UUID REFERENCES analysis\_snapshots(id),

&#x20;   title VARCHAR(255),

&#x20;   report\_content JSONB,

&#x20;   status VARCHAR(20) DEFAULT 'DRAFT',

&#x20;   created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP

);



\-- =========================

\-- REPORT EXPORT

\-- =========================

CREATE TABLE report\_exports (

&#x20;   id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),

&#x20;   report\_id UUID REFERENCES reports(id),

&#x20;   export\_type VARCHAR(20),

&#x20;   file\_url TEXT,

&#x20;   created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP

);



\-- =========================

\-- SAVED SEARCH

\-- =========================

CREATE TABLE saved\_searches (

&#x20;   id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),

&#x20;   user\_id UUID REFERENCES users(id),

&#x20;   search\_query\_id UUID REFERENCES search\_queries(id),

&#x20;   created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP

);



\-- =========================

\-- ADMIN LOG

\-- =========================

CREATE TABLE admin\_actions (

&#x20;   id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),

&#x20;   admin\_user\_id UUID REFERENCES users(id),

&#x20;   action\_type VARCHAR(50),

&#x20;   target\_id UUID,

&#x20;   created\_at TIMESTAMP DEFAULT CURRENT\_TIMESTAMP

);

