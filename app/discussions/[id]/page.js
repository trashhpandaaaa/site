import SiteNav from "../../components/SiteNav";
import DiscussionsGrid from "../../components/DiscussionsGrid";
import SharePanel from "../../components/SharePanel";
import { getReviewById } from "../../../lib/supabase/queries";
import { shareMetadata } from "../../../lib/share";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const review = await getReviewById(params.id);
  if (!review) return { title: "Discussion not found - KastoChha" };
  const replies = review.comment_count || 0;
  const likes = review.upvotes || 0;
  return shareMetadata({
    type: "discussions",
    path: `/discussions/${review.id}`,
    title: review.title || review.topic || "KastoChha discussion",
    description: review.summary,
    kicker: review.category,
    stat: `${replies} replies · ${likes} likes`
  });
}

export default async function DiscussionPermalink({ params }) {
  const review = await getReviewById(params.id);

  if (!review) {
    return (
      <>
        <SiteNav />
        <div className="page-hero"><div className="page-shell"><h1 className="page-title">Discussion not found</h1>
          <p className="page-sub">It may have been removed. <a href="/experience">Browse discussions →</a></p></div></div>
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
              <div className="page-kicker">{review.category}</div>
              <h1 className="page-title">{review.title || review.topic}</h1>
              {review.summary ? <p className="page-sub">{review.summary}</p> : null}
            </div>
            <a className="sec-all" href="/experience">All discussions -&gt;</a>
          </div>
        </div>
      </div>

      <section className="section">
        <div className="permalink-single" style={{ maxWidth: 560 }}>
          <DiscussionsGrid reviews={[review]} limit={1} />
          <SharePanel
            url={`/discussions/${review.id}`}
            text={review.title || review.topic || "KastoChha discussion"}
            heading="Share this discussion"
          />
        </div>
      </section>
    </>
  );
}
