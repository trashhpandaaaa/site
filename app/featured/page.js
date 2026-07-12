import SiteNav from "../components/SiteNav";
import { getBlogPosts, getFeaturedStories } from "../../lib/supabase/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Featured - KastoChha News",
  description:
    "The KastoChha front page: daily stories, curated editor's picks, and in-depth editorial opinions from across Nepal."
};

function plainText(html = "") {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function snippet(post, max = 180) {
  const text = post.excerpt || post.seo_description || plainText(post.content || "");
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
}

// Newspaper-style date label: "Today" / "Yesterday" / "Jul 12".
function newsDate(value) {
  if (!value) return "";
  const date = new Date(value);
  const now = new Date();
  const day = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((day(now) - day(date)) / 86400000);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function byline(post) {
  const parts = [`By ${post.author_name || "KastoChha"}`];
  if (post.published_at) parts.push(newsDate(post.published_at));
  if (post.reading_time) parts.push(`${post.reading_time} min read`);
  return parts.join(" · ");
}

function storyHref(story) {
  return story.link_url || `/featured/${story.id}`;
}

export default async function FeaturedPage() {
  const [posts, stories] = await Promise.all([getBlogPosts(), getFeaturedStories()]);

  const dateline = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const [lead, ...rest] = posts;
  const secondary = rest.slice(0, 2);
  const more = rest.slice(2);
  const latest = posts.slice(0, 7);

  const mainPick = stories.find((item) => item.slot === "main");
  const otherPicks = stories.filter((item) => item !== mainPick);
  const picks = [mainPick, ...otherPicks].filter(Boolean).slice(0, 4);

  const isEmpty = posts.length === 0 && stories.length === 0;

  return (
    <>
      <SiteNav />

      {/* Newspaper masthead */}
      <header className="np-masthead">
        <div className="np-shell">
          <div className="np-dateline">
            <span>{dateline} · Kathmandu</span>
            <span className="np-dateline-right">Nepal&apos;s Curious Community Network</span>
          </div>
          <h1 className="np-nameplate">
            Featured <em>KastoChha</em>
          </h1>
          <p className="np-motto">Curated Reviews and In-Depth Editorial Opinions — updated daily.</p>
          <div className="np-rule-double" aria-hidden="true"></div>
        </div>
      </header>

      <main className="np-main" id="main">
        <div className="np-shell">
          {isEmpty ? (
            <div className="bento-card empty-card" style={{ padding: "24px" }}>
              <div className="fc-title">The newsroom is quiet</div>
              <div className="fc-desc">
                Publish posts (blog_posts, status = published) or add featured stories to fill the front page.
              </div>
            </div>
          ) : (
            <>
              {/* Front page: lead + secondary on the left, picks + latest rail on the right */}
              <div className="np-front">
                <section className="np-front-left">
                  {lead ? (
                    <article className="np-lead">
                      <a href={`/blog/${lead.slug}`} className="np-lead-link">
                        <div className="np-kicker">Top Story</div>
                        <h2 className="np-lead-headline">{lead.title}</h2>
                        {lead.cover_image_url ? (
                          <figure className="np-lead-figure">
                            <img src={lead.cover_image_url} alt="" loading="lazy" />
                          </figure>
                        ) : null}
                        <p className="np-lead-summary">{snippet(lead, 260)}</p>
                        <div className="np-byline">{byline(lead)}</div>
                      </a>
                    </article>
                  ) : (
                    mainPick && (
                      <article className="np-lead">
                        <a href={storyHref(mainPick)} className="np-lead-link">
                          <div className="np-kicker">{mainPick.why_text || "Editor's Pick"}</div>
                          <h2 className="np-lead-headline">{mainPick.title}</h2>
                          <p className="np-lead-summary">{mainPick.description}</p>
                        </a>
                      </article>
                    )
                  )}

                  {secondary.length > 0 ? (
                    <div className="np-secondary">
                      {secondary.map((post) => (
                        <article className="np-story" key={post.id}>
                          <a href={`/blog/${post.slug}`}>
                            <h3 className="np-headline">{post.title}</h3>
                            <p className="np-summary">{snippet(post, 140)}</p>
                            <div className="np-byline">{byline(post)}</div>
                          </a>
                        </article>
                      ))}
                    </div>
                  ) : null}
                </section>

                <aside className="np-rail">
                  {picks.length > 0 ? (
                    <section className="np-rail-block">
                      <h2 className="np-section-label">Editor&apos;s Picks</h2>
                      <div className="np-picks">
                        {picks.map((story) => (
                          <article className="np-pick" key={story.id}>
                            <a href={storyHref(story)}>
                              {story.why_text ? (
                                <div className="np-pick-why">{story.why_text}</div>
                              ) : null}
                              <h3 className="np-pick-title">{story.title}</h3>
                              {story.description ? (
                                <p className="np-pick-desc">{story.description}</p>
                              ) : null}
                            </a>
                          </article>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {latest.length > 0 ? (
                    <section className="np-rail-block">
                      <h2 className="np-section-label">The Latest</h2>
                      <ol className="np-latest">
                        {latest.map((post) => (
                          <li key={post.id}>
                            <a href={`/blog/${post.slug}`} className="np-latest-item">
                              <span className="np-latest-time">{newsDate(post.published_at)}</span>
                              <span className="np-latest-title">{post.title}</span>
                            </a>
                          </li>
                        ))}
                      </ol>
                    </section>
                  ) : null}
                </aside>
              </div>

              {more.length > 0 ? (
                <section className="np-more">
                  <h2 className="np-section-label np-more-label">More from KastoChha</h2>
                  <div className="np-more-grid">
                    {more.map((post) => (
                      <article className="np-more-cell" key={post.id}>
                        <a href={`/blog/${post.slug}`}>
                          {post.cover_image_url ? (
                            <div className="np-more-media">
                              <img src={post.cover_image_url} alt="" loading="lazy" />
                            </div>
                          ) : null}
                          <h3 className="np-headline np-more-headline">{post.title}</h3>
                          <p className="np-summary">{snippet(post, 110)}</p>
                          <div className="np-byline">{byline(post)}</div>
                        </a>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          )}
        </div>
      </main>
    </>
  );
}
