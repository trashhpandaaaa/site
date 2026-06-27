"use client";

import ShareRow from "./ShareRow";

// Prominent share block used at the bottom of each permalink page.
export default function SharePanel({ url, text, heading = "Share this" }) {
  return (
    <div className="share-panel">
      <div className="share-panel-text">
        <div className="share-panel-title">{heading}</div>
        <p className="share-panel-sub">Copy the link or post it straight to social — it shows up as a card.</p>
      </div>
      <ShareRow url={url} text={text} label="Share" />
    </div>
  );
}
