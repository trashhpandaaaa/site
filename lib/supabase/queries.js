import { unstable_noStore as noStore } from "next/cache";

import { createServerSupabase } from "./server";

async function safeQuery(runQuery, fallback = []) {
  noStore();
  try {
    const supabase = createServerSupabase();
    const { data, error } = await runQuery(supabase);
    if (error) {
      console.error("Supabase query failed:", error.message);
      return fallback;
    }
    return data ?? fallback;
  } catch (error) {
    console.error("Supabase unavailable:", error?.message || error);
    return fallback;
  }
}

export async function getTrendingTopics() {
  return safeQuery((supabase) =>
    supabase.from("trending_topics").select("*").order("rank", { ascending: true })
  );
}

export async function getFeaturedStories() {
  return safeQuery((supabase) =>
    supabase.from("featured_stories").select("*").order("slot", { ascending: true })
  );
}

// Single-row lookups used by the shareable permalink pages.
function getById(table, id) {
  return safeQuery(
    (supabase) => supabase.from(table).select("*").eq("id", id).single(),
    null
  );
}

export function getTrendingTopicById(id) {
  return getById("trending_topics", id);
}

export function getBattleById(id) {
  return getById("battles", id);
}

export function getReviewById(id) {
  return getById("reviews", id);
}

export function getFeaturedStoryById(id) {
  return getById("featured_stories", id);
}

export async function getBattles() {
  return safeQuery((supabase) =>
    supabase.from("battles").select("*").order("order", { ascending: true })
  );
}

export async function getReviews(limit = 200) {
  return safeQuery((supabase) =>
    supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)
  );
}

export async function getSiteStats() {
  return safeQuery((supabase) =>
    supabase.from("site_stats").select("*").order("order", { ascending: true })
  );
}

// Niche reel channels for the homepage rail. Falls back to a baked-in set so the
// section always renders, even before the `reels` table is created/seeded.
// Reels store an embeddable link (video_url) — nothing is hosted. video_url here
// is a stable placeholder so the inline player works out of the box; swap these
// for real YouTube/Instagram/TikTok/Vimeo links via /admin/content/reels.
const DEMO_EMBED = "https://www.youtube.com/watch?v=jNQXAC9IVRw";
const FALLBACK_REELS = [
  { id: "reel-paisa", tag: "Paisa", title: "IPO ma paisa lagaune ho?", handle: "@kasto_chha_paisa", accent: "#5a1f24", video_url: DEMO_EMBED, channel_url: "https://www.youtube.com/results?search_query=nepal+ipo" },
  { id: "reel-travels", tag: "Travels", title: "ABC Trek kasto chha?", handle: "@kasto_chha_travels", accent: "#143b52", video_url: DEMO_EMBED, channel_url: "https://www.youtube.com/results?search_query=annapurna+base+camp+trek" },
  { id: "reel-motors", tag: "Motors", title: "Deepal S07 first drive", handle: "@kasto_chha_motors", accent: "#6b3110", video_url: DEMO_EMBED, channel_url: "https://www.youtube.com/results?search_query=deepal+s07" },
  { id: "reel-food", tag: "Food", title: "Best momo in Kathmandu", handle: "@kasto_chha_food", accent: "#5c4310", video_url: DEMO_EMBED, channel_url: "https://www.youtube.com/results?search_query=best+momo+kathmandu" },
  { id: "reel-tech", tag: "Tech", title: "iPhone 17 hands-on", handle: "@kasto_chha_tech", accent: "#332a52", video_url: DEMO_EMBED, channel_url: "https://www.youtube.com/results?search_query=iphone+17" }
];

export async function getReels() {
  const rows = await safeQuery((supabase) =>
    supabase.from("reels").select("*").order("order", { ascending: true })
  );
  return rows && rows.length ? rows : FALLBACK_REELS;
}

export async function getBlogPosts() {
  return safeQuery((supabase) =>
    supabase
      .from("blog_posts")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false })
  );
}

export async function getBlogPostBySlug(slug) {
  return safeQuery(
    (supabase) =>
      supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single(),
    null
  );
}

export async function getBlogPostsForSitemap() {
  return safeQuery((supabase) =>
    supabase
      .from("blog_posts")
      .select("slug, updated_at, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
  );
}

export async function getBlogComments(postId) {
  return safeQuery((supabase) =>
    supabase
      .from("blog_comments")
      .select("*")
      .eq("post_id", postId)
      .eq("status", "published")
      .order("created_at", { ascending: true })
  );
}

export async function getHomeData() {
  const [trending, featured, battles, reviews, stats, reels] = await Promise.all([
    getTrendingTopics(),
    getFeaturedStories(),
    getBattles(),
    getReviews(40),
    getSiteStats(),
    getReels()
  ]);

  return {
    trending,
    featured,
    battles,
    reviews,
    stats,
    reels
  };
}

export async function getRecentChatQueries(limit = 6) {
  return safeQuery((supabase) =>
    supabase
      .from("chat_queries")
      .select("query, created_at")
      .order("created_at", { ascending: false })
      .limit(limit)
  );
}

export async function getUserChatQueries(userId, limit = 6) {
  if (!userId) return [];
  return safeQuery((supabase) =>
    supabase
      .from("chat_queries")
      .select("query, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)
  );
}
