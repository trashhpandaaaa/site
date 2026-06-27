"use client";

import { useRef } from "react";

import ShareRow from "./ShareRow";
import { castBattleVote } from "./voteActions";
import { delayClass } from "./sectionHelpers";

// Build the full-bleed background for one side: a product photo if provided,
// otherwise a brand-coloured gradient fading into near-black for legibility.
function sideStyle(image, color, fallback) {
  if (image) {
    return {
      backgroundImage: `linear-gradient(180deg, rgba(8,6,5,.18) 0%, rgba(8,6,5,.66) 100%), url(${image})`
    };
  }
  const c = color || fallback;
  return { backgroundImage: `linear-gradient(150deg, ${c} 0%, rgba(10,8,7,.74) 118%)` };
}

export default function BattleSplit({ battles = [] }) {
  const votedRef = useRef({});
  const vote = (id, side) => castBattleVote(votedRef, id, side);

  if (battles.length === 0) {
    return (
      <div className="bsplit-list">
        <div className="bsplit empty-card" style={{ padding: 28 }}>
          <div className="tcard-title">No battles yet</div>
          <p className="tcard-quote">Add rows to <strong>battles</strong> in Supabase to start collecting votes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bsplit-list">
      {battles.map((battle, index) => {
        const left = battle.left_votes || 0;
        const right = battle.right_votes || 0;
        const total = left + right;
        const leftPct = total ? Math.round((left / total) * 100) : 50;
        const rightPct = total ? 100 - leftPct : 50;
        const leader =
          total === 0 ? "Even" : left === right ? "Dead heat" : left > right ? battle.left_title : battle.right_title;

        return (
          <article className={`bsplit bento-card ${delayClass(index)} ${index === 0 ? "is-hero" : ""}`} key={battle.id}>
            <div className="bsplit-stage">
              <div className="bsplit-side left" style={sideStyle(battle.left_image, battle.left_color, "#c8102e")}>
                <span className="bsplit-cat">{battle.category}</span>
                <h3 className="bsplit-name">{battle.left_title}</h3>
                {battle.left_desc ? <p className="bsplit-desc">{battle.left_desc}</p> : null}
                <button type="button" className="bsplit-btn" onClick={() => vote(battle.id, "a")}>
                  Vote {battle.left_title} →
                </button>
              </div>

              <div className="bsplit-side right" style={sideStyle(battle.right_image, battle.right_color, "#1f5fae")}>
                <span className="bsplit-cat">{battle.category}</span>
                <h3 className="bsplit-name">{battle.right_title}</h3>
                {battle.right_desc ? <p className="bsplit-desc">{battle.right_desc}</p> : null}
                <button type="button" className="bsplit-btn" onClick={() => vote(battle.id, "b")}>
                  Vote {battle.right_title} →
                </button>
              </div>

              <span className="bsplit-pct left" id={`b-${battle.id}-apct`}>{leftPct}%</span>
              <span className="bsplit-pct right" id={`b-${battle.id}-bpct`}>{rightPct}%</span>
              <div className="bsplit-vs" aria-hidden>VS</div>

              <span className="bsplit-count left" id={`b-${battle.id}-av`} data-count={left} hidden>
                {left.toLocaleString("en-US")} votes
              </span>
              <span className="bsplit-count right" id={`b-${battle.id}-bv`} data-count={right} hidden>
                {right.toLocaleString("en-US")} votes
              </span>
            </div>

            <div className="bsplit-bar">
              <div className="bsplit-fill a" id={`b-${battle.id}-fa`} style={{ width: `${leftPct}%` }} />
              <div className="bsplit-fill b" id={`b-${battle.id}-fb`} style={{ width: `${rightPct}%` }} />
            </div>

            <div className="bsplit-foot">
              <div className="bsplit-tally">
                <span id={`b-${battle.id}-tot`}>{total.toLocaleString("en-US")} total votes</span>
                <span className="bsplit-leader"> · {leader} leading</span>
              </div>
              <ShareRow
                text={`${battle.left_title} vs ${battle.right_title}`}
                url={`/battle/${battle.id}`}
                label="Share"
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}
