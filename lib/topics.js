import { topicSlug } from "./slug";

export const VERDICT_TONES = {
  "ramro chha": "pos",
  "thikai chha": "neu",
  "naramro chha": "neg"
};

export function verdictTone(value) {
  if (!value) return "neu";
  return VERDICT_TONES[value.trim().toLowerCase()] || "neu";
}

export function scoreOf(item) {
  return (item.upvotes || 0) - (item.downvotes || 0);
}

export function formatTimeAgo(value) {
  if (!value) return "";
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

// Collapse a flat list of reviews into topic threads keyed by their slug, so
// multiple experiences about the same subject live under one heading.
export function buildTopics(items) {
  const map = new Map();

  for (const item of items) {
    const slug =
      item.topic_slug || topicSlug(item.topic || item.title) || "general";
    if (!map.has(slug)) {
      map.set(slug, { slug, experiences: [] });
    }
    map.get(slug).experiences.push(item);
  }

  const topics = [];
  for (const group of map.values()) {
    const experiences = group.experiences;
    // The oldest post sets the canonical title/category for the thread.
    const oldest = experiences.reduce((acc, item) =>
      new Date(item.created_at) < new Date(acc.created_at) ? item : acc
    );
    const lastActivity = experiences.reduce(
      (acc, item) =>
        new Date(item.created_at) > new Date(acc) ? item.created_at : acc,
      experiences[0].created_at
    );

    const verdicts = { pos: 0, neu: 0, neg: 0 };
    let score = 0;
    for (const item of experiences) {
      verdicts[verdictTone(item.verdict)] += 1;
      score += scoreOf(item);
    }

    const top = experiences.reduce((acc, item) =>
      scoreOf(item) > scoreOf(acc) ? item : acc
    );

    topics.push({
      slug: group.slug,
      title: oldest.topic || oldest.title,
      category: oldest.category || "General",
      experiences,
      top,
      count: experiences.length,
      score,
      verdicts,
      lastActivity
    });
  }

  return topics;
}
