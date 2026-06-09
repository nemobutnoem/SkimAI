INSERT INTO plans (name, price, search_limit, export_limit, deep_insight_limit, description, created_at)
VALUES
    ('FREE', 0.00, 10, 0, 0, '10 searches/month, community access, no exports', CURRENT_TIMESTAMP),
    ('STARTER', 0.40, 100, 10, 2, '100 searches/month, basic insight, export PDF', CURRENT_TIMESTAMP),
    ('TEAM', 1.20, 500, 100, 10, '500 searches/month, advanced insight, competitor view, priority processing', CURRENT_TIMESTAMP),
    ('ENTERPRISE', 59.99, 999999, 999999, 9999, 'Unlimited searches, unlimited exports, API integration, admin dashboard, priority support', CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING;

INSERT INTO search_providers (provider_code, provider_name, is_active)
VALUES
    ('SERPAPI_GOOGLE', 'SerpApi Google', TRUE),
    ('SERPAPI_NEWS', 'SerpApi News', TRUE),
    ('YOUTUBE_API', 'YouTube API', TRUE)
ON CONFLICT (provider_code) DO NOTHING;

-- Reset usage tracking for testing convenience on startup (Disabled for production deploy)
-- DELETE FROM ai_usage;

INSERT INTO system_settings (setting_key, setting_value)
VALUES
    ('ai_provider', 'GEMINI'),
    ('ai_model', 'gemini-2.5-flash'),
    ('ai_api_key', ''),
    ('ai_endpoint', '')
ON CONFLICT (setting_key) DO NOTHING;
