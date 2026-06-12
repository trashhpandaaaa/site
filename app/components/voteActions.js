"use client";

// Shared optimistic vote handlers for the DOM-driven cards (trending topics and
// battles). Used by the homepage, /trending, and /battle so the behaviour stays
// identical everywhere:
// - bump the numbers immediately,
// - sync with the server response,
// - revert the bump if the server rejects the vote,
// - a 409 (already voted) keeps the card locked; other errors allow a retry.

function fmt(n) {
  return n.toLocaleString("en-US");
}

export async function castTrendingVote(votedRef, id, side) {
  if (votedRef.current[id]) return;
  votedRef.current[id] = side;

  const yesEl = document.getElementById(`tr-${id}-y`);
  const noEl = document.getElementById(`tr-${id}-n`);
  const bar = document.getElementById(`tr-${id}-bar`);
  const card = document.getElementById(`tr-${id}`);
  const prevYes = Number(yesEl?.dataset.count || yesEl?.textContent || 0);
  const prevNo = Number(noEl?.dataset.count || noEl?.textContent || 0);

  const render = (yes, no, votedSide) => {
    if (yesEl) {
      yesEl.textContent = fmt(yes);
      yesEl.dataset.count = String(yes);
    }
    if (noEl) {
      noEl.textContent = fmt(no);
      noEl.dataset.count = String(no);
    }
    const total = yes + no;
    if (bar) bar.style.width = `${total ? Math.round((yes / total) * 100) : 0}%`;
    if (card) {
      card.querySelector(".vbtn.yes")?.classList.toggle("voted", votedSide === "yes");
      card.querySelector(".vbtn.no")?.classList.toggle("voted", votedSide === "no");
      const totalEl = card.querySelector(".vote-total");
      if (totalEl) totalEl.textContent = `${fmt(total)} total votes`;
    }
  };

  const revert = (unlock) => {
    render(prevYes, prevNo, unlock ? null : side);
    if (unlock) delete votedRef.current[id];
  };

  render(prevYes + (side === "yes" ? 1 : 0), prevNo + (side === "no" ? 1 : 0), side);

  try {
    const response = await fetch("/api/votes/trending", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, side })
    });

    if (response.status === 401) {
      window.location.href = "/sign-in";
      return;
    }

    if (!response.ok) {
      revert(response.status !== 409);
      return;
    }

    const payload = await response.json();
    if (!payload?.topic) return;
    render(payload.topic.votes_yes || 0, payload.topic.votes_no || 0, side);
  } catch {
    revert(true);
  }
}

export async function castBattleVote(votedRef, id, side) {
  if (votedRef.current[id]) return;
  votedRef.current[id] = side;

  const leftEl = document.getElementById(`b-${id}-av`);
  const rightEl = document.getElementById(`b-${id}-bv`);
  const leftFill = document.getElementById(`b-${id}-fa`);
  const rightFill = document.getElementById(`b-${id}-fb`);
  const leftPctEl = document.getElementById(`b-${id}-apct`);
  const rightPctEl = document.getElementById(`b-${id}-bpct`);
  const totalEl = document.getElementById(`b-${id}-tot`);
  const prevLeft = Number(leftEl?.dataset.count || 0);
  const prevRight = Number(rightEl?.dataset.count || 0);

  const render = (left, right) => {
    const total = left + right;
    const leftPct = total ? Math.round((left / total) * 100) : 0;
    const rightPct = total ? 100 - leftPct : 0;
    if (leftEl) {
      leftEl.textContent = `${fmt(left)} votes`;
      leftEl.dataset.count = String(left);
    }
    if (rightEl) {
      rightEl.textContent = `${fmt(right)} votes`;
      rightEl.dataset.count = String(right);
    }
    if (leftFill) leftFill.style.width = `${leftPct}%`;
    if (rightFill) rightFill.style.width = `${rightPct}%`;
    if (leftPctEl) leftPctEl.textContent = `${leftPct}%`;
    if (rightPctEl) rightPctEl.textContent = `${rightPct}%`;
    if (totalEl) totalEl.textContent = `${fmt(total)} total votes`;
  };

  const revert = (unlock) => {
    render(prevLeft, prevRight);
    if (unlock) delete votedRef.current[id];
  };

  render(prevLeft + (side === "a" ? 1 : 0), prevRight + (side === "b" ? 1 : 0));

  try {
    const response = await fetch("/api/votes/battle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, side })
    });

    if (response.status === 401) {
      window.location.href = "/sign-in";
      return;
    }

    if (!response.ok) {
      revert(response.status !== 409);
      return;
    }

    const payload = await response.json();
    if (!payload?.battle) return;
    render(payload.battle.left_votes || 0, payload.battle.right_votes || 0);
  } catch {
    revert(true);
  }
}
