-- KastoChha redesign migration (idempotent — safe to run repeatedly).
-- Adds the neutral trending poll option, battle split-screen styling columns,
-- and the reels table that back the homepage redesign.

-- Trending: neutral "Thikai Chha" poll option + refreshed default labels.
alter table trending_topics add column if not exists votes_mid int not null default 0;
alter table trending_topics add column if not exists mid_label text default 'Thikai Chha';
alter table trending_topics alter column yes_label set default 'Thik Chha';
alter table trending_topics alter column no_label set default 'Thik Chhaina';

-- Battles: per-side gradient colour or product photo (both optional).
alter table battles add column if not exists left_color text;
alter table battles add column if not exists left_image text;
alter table battles add column if not exists right_color text;
alter table battles add column if not exists right_image text;

-- Reviews: ensure reply counter exists (used by the discussions grid).
alter table reviews add column if not exists comment_count int not null default 0;

-- Reels rail for the homepage.
create table if not exists reels (
  id uuid primary key default gen_random_uuid(),
  "order" int not null default 0,
  tag text not null,
  title text not null,
  handle text,
  accent text,
  video_url text,
  channel_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_reels_order on reels("order");
