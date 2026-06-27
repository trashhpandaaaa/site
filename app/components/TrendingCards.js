"use client";

import { useRef } from "react";

import ShareRow from "./ShareRow";
import { castTrendingVote } from "./voteActions";
import { catTone, delayClass, formatTimeAgo } from "./sectionHelpers";
import { IconMeh, IconThumb, IconThumbDown } from "./icons";

// Trending poll grid. Each card asks a "kasto chha?" question and collects a
// three-way verdict: Thik Chha / Thikai Chha / Thik Chhaina. Optimistic voting
// is handled by castTrendingVote against the #tr-<id>-* nodes below.
export default function TrendingCards({ topics = [] }) {
  const votedRef = useRef({});
  const vote = (id, side) => castTrendingVote(votedRef, id, side);

  if (topics.length === 0) {
    return (
      <div className="tcard-grid">
        <article className="tcard empty-card">
          <h3 className="tcard-title">No trending topics yet</h3>
          <p className="tcard-quote">Add rows to <strong>trending_topics</strong> in Supabase to populate this section.</p>
        </article>
      </div>
    );
  }

  return (
    <div className="tcard-grid">
      {topics.map((topic, index) => {
        const yes = topic.votes_yes || 0;
        const mid = topic.votes_mid || 0;
        const no = topic.votes_no || 0;
        const total = yes + mid + no;
        const time = formatTimeAgo(topic.created_at);
        const tone = catTone(topic.category);

        return (
          <article className={`tcard bento-card ${delayClass(index)}`} key={topic.id} id={`tr-${topic.id}`}>
            <div className="tcard-cat" style={{ color: tone }}>
              <span className="tcard-glyph" style={{ background: tone }} aria-hidden />
              {topic.category}
            </div>

            <h3 className="tcard-title">{topic.title}</h3>
            {topic.description ? <p className="tcard-quote">&ldquo;{topic.description}&rdquo;</p> : null}

            <div className="tcard-divider" />

            <div className="tcard-poll">
              <div className="tcard-polls">
                <button type="button" className="tpoll yes" onClick={() => vote(topic.id, "yes")}>
                  <span className="tpoll-ico"><IconThumb className="icon" /></span>
                  {topic.yes_label || "Thik Chha"}
                  <b className="tpoll-n" id={`tr-${topic.id}-y`} data-count={yes}>{yes}</b>
                </button>
                <button type="button" className="tpoll mid" onClick={() => vote(topic.id, "mid")}>
                  <span className="tpoll-ico"><IconMeh className="icon" /></span>
                  {topic.mid_label || "Thikai Chha"}
                  <b className="tpoll-n" id={`tr-${topic.id}-m`} data-count={mid}>{mid}</b>
                </button>
                <button type="button" className="tpoll no" onClick={() => vote(topic.id, "no")}>
                  <span className="tpoll-ico"><IconThumbDown className="icon" /></span>
                  {topic.no_label || "Thik Chhaina"}
                  <b className="tpoll-n" id={`tr-${topic.id}-n`} data-count={no}>{no}</b>
                </button>
              </div>
              <span className="tcard-meta" id={`tr-${topic.id}-meta`} data-time={time}>
                {total.toLocaleString("en-US")} votes{time ? ` · ${time}` : ""}
              </span>
            </div>

            <ShareRow text={topic.title} url={`/trending/${topic.id}`} label="Share" />
          </article>
        );
      })}
    </div>
  );
}
