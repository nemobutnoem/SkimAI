INSERT INTO plans (name, price, search_limit, export_limit, description, created_at)
VALUES
    ('FREE', 0.00, 10, 0, '10 searches/month, community access, no exports', CURRENT_TIMESTAMP),
    ('STARTER', 7.99, 100, 10, '100 searches/month, basic insight, export PDF', CURRENT_TIMESTAMP),
    ('TEAM', 14.99, 500, 100, '500 searches/month, advanced insight, competitor view, priority processing', CURRENT_TIMESTAMP),
    ('ENTERPRISE', 59.99, 999999, 999999, 'Unlimited searches, unlimited exports, team usage, admin dashboard, priority support', CURRENT_TIMESTAMP)
ON CONFLICT (name) DO UPDATE SET
    price = EXCLUDED.price,
    search_limit = EXCLUDED.search_limit,
    export_limit = EXCLUDED.export_limit,
    description = EXCLUDED.description;

INSERT INTO search_providers (provider_code, provider_name, is_active)
VALUES
    ('SERPAPI_GOOGLE', 'SerpApi Google', TRUE),
    ('SERPAPI_NEWS', 'SerpApi News', TRUE),
    ('YOUTUBE_API', 'YouTube API', TRUE)
ON CONFLICT (provider_code) DO UPDATE SET is_active = EXCLUDED.is_active;
