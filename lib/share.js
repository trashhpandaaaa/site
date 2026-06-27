// Shared helpers for content permalinks and their social-preview (OG) images.
// Keeping this in one place means cards, permalink pages, and the OG endpoint
// all agree on URLs.

export const SHARE_PATHS = {
  trending: (id) => `/trending/${id}`,
  battles: (id) => `/battle/${id}`,
  battle: (id) => `/battle/${id}`,
  discussions: (id) => `/discussions/${id}`,
  featured: (id) => `/featured/${id}`
};

export function permalink(type, id) {
  const fn = SHARE_PATHS[type];
  return fn ? fn(id) : "/";
}

// Build the /api/og query string for a content item. Only short, display-safe
// fields are passed; the endpoint renders the branded card.
export function ogImagePath({ type, kicker, title, subtitle, stat }) {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  if (kicker) params.set("kicker", kicker);
  if (title) params.set("title", title);
  if (subtitle) params.set("subtitle", subtitle);
  if (stat) params.set("stat", stat);
  return `/api/og?${params.toString()}`;
}

// Standard metadata block for a permalink page. `path` and the og image are
// relative; Next resolves them against metadataBase (NEXT_PUBLIC_SITE_URL).
export function shareMetadata({ type, path, title, description, kicker, stat }) {
  const og = ogImagePath({ type, kicker, title, subtitle: description, stat });
  const fullTitle = `${title} - KastoChha`;
  return {
    title: fullTitle,
    description: description || "Real opinions from real people across Nepal.",
    alternates: { canonical: path },
    openGraph: {
      title,
      description: description || "Real opinions from real people across Nepal.",
      url: path,
      siteName: "KastoChha",
      type: "article",
      images: [{ url: og, width: 1200, height: 630, alt: title }]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: description || "Real opinions from real people across Nepal.",
      images: [og]
    }
  };
}
