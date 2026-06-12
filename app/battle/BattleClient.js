"use client";

import { useRef } from "react";

import SiteNav from "../components/SiteNav";
import useScrollReveal from "../components/useScrollReveal";
import { castBattleVote } from "../components/voteActions";

function delayClass(index) {
  if (index === 0) return "fi d1";
  if (index === 1) return "fi d2";
  if (index === 2) return "fi d3";
  if (index === 3) return "fi d4";
  return "fi";
}

export default function BattleClient({ battles = [] }) {
  const battleVotedRef = useRef({});

  useScrollReveal();

  const castBattle = (id, side) => castBattleVote(battleVotedRef, id, side);

  return (
    <>
      <SiteNav />

      <div className="page-hero">
        <div className="page-glow"></div>
        <div className="page-shell">
          <div className="page-head">
            <div>
              <div className="page-kicker">VOTE NOW</div>
              <h1 className="page-title">KastoChha Battle</h1>
              <p className="page-sub">Head to head debates where Nepal decides the winner.</p>
            </div>
            <div className="page-actions">
              <a className="btn-outline" href="/chat">Ask community</a>
              <a className="btn-red" href="/experience">Share review</a>
            </div>
          </div>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="battle-list bento-grid">
            {battles.length === 0 ? (
              <div className="battle-card bento-card empty-card" style={{ padding: "24px" }}>
                <div className="bs-name">No battles yet</div>
                <div className="bs-desc">Add battle rows in Supabase to start collecting votes.</div>
              </div>
            ) : (
              battles.map((battle, index) => {
                const totalVotes = (battle.left_votes || 0) + (battle.right_votes || 0);
                const leftPct = totalVotes
                  ? Math.round(((battle.left_votes || 0) / totalVotes) * 100)
                  : 0;
                const rightPct = 100 - leftPct;

                return (
                  <div className={`battle-card bento-card ${delayClass(index)}`} key={battle.id}>
                    <div className="battle-inner">
                      <div className="bside">
                        <div className="bs-cat">{battle.category}</div>
                        <div className="bs-name">{battle.left_title}</div>
                        <div className="bs-desc">{battle.left_desc}</div>
                        <div className="bs-vcnt" id={`b-${battle.id}-av`} data-count={battle.left_votes || 0}>
                          {(battle.left_votes || 0).toLocaleString("en-US")} votes
                        </div>
                      </div>
                      <div className="bvs">
                        <div className="bvs-line"></div>
                        <div className="bvs-badge">VS</div>
                        <div className="bvs-line"></div>
                      </div>
                      <div className="bside right">
                        <div className="bs-cat">{battle.category}</div>
                        <div className="bs-name">{battle.right_title}</div>
                        <div className="bs-desc">{battle.right_desc}</div>
                        <div className="bs-vcnt" id={`b-${battle.id}-bv`} data-count={battle.right_votes || 0}>
                          {(battle.right_votes || 0).toLocaleString("en-US")} votes
                        </div>
                      </div>
                    </div>
                    <div className="battle-actions">
                      <button
                        type="button"
                        className="b-vote-btn a"
                        onClick={() => castBattle(battle.id, "a")}
                      >
                        {battle.left_title} ramro chha
                      </button>
                      <div className="bvs-or">or</div>
                      <button
                        type="button"
                        className="b-vote-btn b"
                        onClick={() => castBattle(battle.id, "b")}
                      >
                        {battle.right_title} ramro chha
                      </button>
                    </div>
                    <div className="battle-result">
                      <div className="result-wrap">
                        <span className="rpct a" id={`b-${battle.id}-apct`}>{leftPct}%</span>
                        <div className="rtrack">
                          <div className="rfill-a" id={`b-${battle.id}-fa`} style={{ width: `${leftPct}%` }}></div>
                          <div className="rfill-b" id={`b-${battle.id}-fb`} style={{ width: `${rightPct}%` }}></div>
                        </div>
                        <span className="rpct b" id={`b-${battle.id}-bpct`}>{rightPct}%</span>
                      </div>
                      <div className="rtotal" id={`b-${battle.id}-tot`}>
                        {totalVotes.toLocaleString("en-US")} total votes
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </>
  );
}
