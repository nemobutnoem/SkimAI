INSERT INTO plans (name, price, search_limit, export_limit, description, created_at)
VALUES
    ('FREE', 0, 10, 0, 'Free plan', CURRENT_TIMESTAMP),
    ('STANDARD', 149000, 100, 20, 'Standard plan', CURRENT_TIMESTAMP),
    ('PREMIUM', 299000, 500, 100, 'Premium plan', CURRENT_TIMESTAMP),
    ('BUSINESS', 999000, 999999, 999999, 'Business plan', CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING;

INSERT INTO search_providers (provider_code, provider_name, is_active)
VALUES
    ('SERPAPI_GOOGLE', 'SerpApi Google', FALSE),
    ('SERPAPI_NEWS', 'SerpApi News', FALSE),
    ('YOUTUBE_API', 'YouTube API', TRUE)
ON CONFLICT (provider_code) DO UPDATE SET is_active = EXCLUDED.is_active;
