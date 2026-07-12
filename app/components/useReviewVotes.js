"use client";

import { useCallback, useEffect, useState } from "react";

// Shared optimistic voting state for review/experience items.
// - Applies the vote locally right away and locks the item.
// - Reverts the local bump if the server rejects it; unlocks on retryable errors.
// - A 409 (already voted) keeps the item locked.
// - Locked votes {id: "up"|"down"} persist in localStorage so refreshing the
//   page doesn't re-enable buttons for things the user already voted on.
const STORAGE_KEY = "kc_review_votes_v1";

function loadStoredVotes() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return new Map(
      Object.entries(parsed).filter(([, dir]) => dir === "up" || dir === "down")
    );
  } catch {
    return null;
  }
}

function saveStoredVotes(map) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(Object.fromEntries(map))
    );
  } catch {
    // Storage full/blocked — persistence is best-effort.
  }
}

export default function useReviewVotes(initialItems) {
  const [items, setItems] = useState(initialItems);
  // Map of id -> "up" | "down" (or "pending" while a vote is in flight).
  const [voted, setVoted] = useState(() => new Map());

  // Hydrate previously cast votes after mount (not in the initializer, so the
  // server-rendered markup matches the first client render).
  useEffect(() => {
    const stored = loadStoredVotes();
    if (stored && stored.size) {
      setVoted((prev) => {
        const next = new Map(stored);
        for (const [id, dir] of prev) next.set(id, dir);
        return next;
      });
    }
  }, []);

  const applyDelta = useCallback((id, direction, delta) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const next = { ...item };
        if (direction === "up") next.upvotes = Math.max(0, (next.upvotes || 0) + delta);
        else next.downvotes = Math.max(0, (next.downvotes || 0) + delta);
        return next;
      })
    );
  }, []);

  const lockVote = useCallback((id, direction, persist) => {
    setVoted((prev) => {
      const next = new Map(prev);
      next.set(id, direction);
      if (persist) {
        const durable = new Map(
          [...next].filter(([, dir]) => dir === "up" || dir === "down")
        );
        saveStoredVotes(durable);
      }
      return next;
    });
  }, []);

  const unlockVote = useCallback((id) => {
    setVoted((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const handleVote = useCallback(
    async (id, direction) => {
      if (voted.has(id)) return;
      lockVote(id, "pending", false);
      applyDelta(id, direction, 1);

      try {
        const response = await fetch("/api/votes/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ id, direction })
        });

        if (response.status === 401) {
          // Not signed in: undo the local bump before leaving so the state is
          // clean if the user comes back via the back button.
          applyDelta(id, direction, -1);
          unlockVote(id);
          window.location.href = "/sign-in";
          return;
        }

        if (response.status === 409) {
          // Already voted (e.g. in a previous session) — undo the local bump
          // but keep the buttons locked, and remember the direction attempted.
          applyDelta(id, direction, -1);
          lockVote(id, direction, true);
          return;
        }

        if (!response.ok) {
          applyDelta(id, direction, -1);
          unlockVote(id);
          return;
        }

        const payload = await response.json();
        lockVote(id, direction, true);
        if (payload?.review) {
          setItems((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, ...payload.review } : item
            )
          );
        }
      } catch {
        applyDelta(id, direction, -1);
        unlockVote(id);
      }
    },
    [voted, applyDelta, lockVote, unlockVote]
  );

  const voteOf = useCallback(
    (id) => {
      const dir = voted.get(id);
      return dir === "up" || dir === "down" ? dir : null;
    },
    [voted]
  );

  return { items, setItems, voted, handleVote, voteOf };
}
