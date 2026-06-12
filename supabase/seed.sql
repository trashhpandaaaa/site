BEGIN;

-- Minimal seeds for KastoChha demo content

INSERT INTO trending_topics (rank, category, title, description, badge_label, badge_tone, trend_note, votes_yes, votes_no, likes, comments)
VALUES (1, 'Technology', 'Mobile data price hike', 'Discussion on recent mobile data price increases', 'Hot', 'positive', 'up 12%', 10, 2, 50, 8)
ON CONFLICT DO NOTHING;

INSERT INTO featured_stories (slot, title, description, why_text, link_url, icon)
VALUES ('main', 'How to save on mobile', 'Saving tips for Nepali users', 'Important tips and tricks', '/blog/welcome', 'star')
ON CONFLICT DO NOTHING;

INSERT INTO battles ("order", category, left_title, left_desc, left_votes, right_title, right_desc, right_votes)
VALUES (1, 'Mobile', 'Affordable plans', 'Cheap but limited', 10, 'Premium plans', 'Expensive but reliable', 5)
ON CONFLICT DO NOTHING;

INSERT INTO reviews (category, topic, topic_slug, title, summary, verdict, upvotes, downvotes, author_name, user_id)
VALUES ('Technology', 'Phone battery life', 'phone-battery-life', 'Phone battery life', 'Battery dies quickly after heavy use', 'Thikai chha', 3, 0, 'Sita', 'user_123')
ON CONFLICT DO NOTHING;

INSERT INTO site_stats ("order", label, value)
VALUES (1, 'Total posts', '1')
ON CONFLICT DO NOTHING;

INSERT INTO blog_posts (slug, title, excerpt, content, status, author_user_id, author_name, reading_time, published_at)
VALUES ('welcome', 'Welcome to KastoChha', 'Intro to the community', 'Welcome to KastoChha — share real experiences.', 'published', 'system', 'KastoChha', 1, now())
ON CONFLICT DO NOTHING;

INSERT INTO chat_queries (query, response, user_id)
VALUES ('phone battery', 'Try lowering screen brightness and background refresh.', NULL)
ON CONFLICT DO NOTHING;

COMMIT;
