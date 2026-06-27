import SiteNav from "../../components/SiteNav";
import SharePanel from "../../components/SharePanel";
import { getFeaturedStoryById } from "../../../lib/supabase/queries";
import { shareMetadata } from "../../../lib/share";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const story = await getFeaturedStoryById(params.id);
  if (!story) return { title: "Story not found - KastoChha" };
  return shareMetadata({
    type: "featured",
    path: `/featured/${story.id}`,
    title: story.title,
    description: story.description,
    kicker: story.why_text || "Featured"
  });
}

export default async function FeaturedPermalink({ params }) {
  const story = await getFeaturedStoryById(params.id);

  if (!story) {
    return (
      <>
        <SiteNav />
        <div className="page-hero"><div className="page-shell"><h1 className="page-title">Story not found</h1>
          <p className="page-sub">It may have been removed. <a href="/featured">Browse featured →</a></p></div></div>
      </>
    );
  }

  return (
    <>
      <SiteNav />
      <div className="page-hero">
        <div className="page-glow"></div>
        <div className="page-shell">
          <div className="page-head">
            <div>
              <div className="page-kicker">{story.why_text || "Featured"}</div>
              <h1 className="page-title">{story.title}</h1>
              {story.description ? <p className="page-sub">{story.description}</p> : null}
            </div>
            <a className="sec-all" href="/featured">All featured -&gt;</a>
          </div>
        </div>
      </div>

      <section className="section">
        <div className="permalink-single" style={{ maxWidth: 720 }}>
          <article className="bento-card" style={{ padding: 28, borderRadius: 16 }}>
            <span className="fc-why">{story.why_text || "Featured"}</span>
            <h2 className="fc-title" style={{ fontSize: "1.7rem", marginTop: 6 }}>{story.title}</h2>
            {story.description ? <p className="fc-desc">{story.description}</p> : null}
            {story.link_url ? (
              <a className="fc-read" href={story.link_url}>Read full story -&gt;</a>
            ) : null}
          </article>
          <SharePanel url={`/featured/${story.id}`} text={story.title} heading="Share this story" />
        </div>
      </section>
    </>
  );
}
