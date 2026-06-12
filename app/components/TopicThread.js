"use client";

import { IconArrowDown, IconArrowUp, IconChat } from "./icons";
import { formatTimeAgo, scoreOf, verdictTone } from "../../lib/topics";

// One Reddit-style topic thread: a collapsed header with the verdict breakdown
// and top comment, expanding to the full list of experiences with up/down votes.
// Shared by the homepage wall and the dedicated Experience page so both render
// identically.
export default function TopicThread({ topic, isOpen, onToggle, onVote, voted }) {
  const total = topic.verdicts.pos + topic.verdicts.neu + topic.verdicts.neg;
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);

  return (
    <article className="topic-thread">
      <header className="topic-head">
        <div className="topic-meta-top">
          <span className="topic-cat">{topic.category}</span>
          <span className="topic-count-pill">
            {topic.count} experience{topic.count === 1 ? "" : "s"}
          </span>
        </div>
        <h2 className="topic-title">{topic.title}</h2>
      </header>

      {total > 0 ? (
        <div className="verdict-block">
          <div className="verdict-bar" aria-hidden="true">
            {topic.verdicts.pos > 0 ? (
              <span
                className="verdict-seg pos"
                style={{ width: `${pct(topic.verdicts.pos)}%` }}
              />
            ) : null}
            {topic.verdicts.neu > 0 ? (
              <span
                className="verdict-seg neu"
                style={{ width: `${pct(topic.verdicts.neu)}%` }}
              />
            ) : null}
            {topic.verdicts.neg > 0 ? (
              <span
                className="verdict-seg neg"
                style={{ width: `${pct(topic.verdicts.neg)}%` }}
              />
            ) : null}
          </div>
          <div className="verdict-legend">
            <span className="verdict-chip pos">Ramro {topic.verdicts.pos}</span>
            <span className="verdict-chip neu">Thikai {topic.verdicts.neu}</span>
            <span className="verdict-chip neg">Naramro {topic.verdicts.neg}</span>
          </div>
        </div>
      ) : null}

      {!isOpen ? (
        <p className="topic-preview">
          <span className="topic-preview-by">
            {topic.top.author_name || "Anonymous"}:
          </span>{" "}
          {topic.top.summary}
        </p>
      ) : null}

      <div className="topic-foot">
        <button
          type="button"
          className="topic-toggle"
          onClick={() => onToggle(topic.slug)}
          aria-expanded={isOpen}
        >
          <IconChat className="icon" />
          {isOpen
            ? "Hide experiences"
            : `Read ${topic.count} experience${topic.count === 1 ? "" : "s"}`}
        </button>
        <span className="topic-foot-meta">
          net {topic.score >= 0 ? "+" : ""}
          {topic.score} · updated {formatTimeAgo(topic.lastActivity)}
        </span>
      </div>

      {isOpen ? (
        <div className="exp-list">
          {topic.experiences.map((exp) => {
            const tone = verdictTone(exp.verdict);
            const timeLabel = formatTimeAgo(exp.created_at);
            return (
              <div className="exp-item" key={exp.id}>
                <div className="review-vote">
                  <button
                    type="button"
                    className="vote-btn"
                    aria-label="Upvote"
                    disabled={voted?.has(exp.id)}
                    onClick={() => onVote(exp.id, "up")}
                  >
                    <IconArrowUp className="icon" />
                  </button>
                  <span className="vote-count">{scoreOf(exp)}</span>
                  <button
                    type="button"
                    className="vote-btn"
                    aria-label="Downvote"
                    disabled={voted?.has(exp.id)}
                    onClick={() => onVote(exp.id, "down")}
                  >
                    <IconArrowDown className="icon" />
                  </button>
                </div>
                <div className="exp-body">
                  <div className="exp-meta">
                    <span className="exp-author">
                      {exp.author_name || "Anonymous"}
                    </span>
                    {timeLabel ? <span>{timeLabel}</span> : null}
                    {exp.verdict ? (
                      <span className={`exp-verdict ${tone}`}>{exp.verdict}</span>
                    ) : null}
                  </div>
                  <p className="exp-text">{exp.summary}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </article>
  );
}
