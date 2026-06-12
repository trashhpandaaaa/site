"use client";

import { useCallback, useState } from "react";

// Shared optimistic voting state for review/experience items.
// - Applies the vote locally right away.
// - Reverts the local bump if the server rejects it.
// - A 409 (already voted) keeps the item locked; other failures unlock it
//   so the user can retry.
export default function useReviewVotes(initialItems) {
  const [items, setItems] = useState(initialItems);
  const [voted, setVoted] = useState(() => new Set());

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

  const handleVote = useCallback(
    async (id, direction) => {
      if (voted.has(id)) return;
      setVoted((prev) => new Set(prev).add(id));
      applyDelta(id, direction, 1);

      const unlock = () => {
        setVoted((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      };

      try {
        const response = await fetch("/api/votes/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ id, direction })
        });

        if (response.status === 401) {
          window.location.href = "/sign-in";
          return;
        }

        if (response.status === 409) {
          // Already voted (e.g. in a previous session) — undo the local bump
          // but keep the buttons locked.
          applyDelta(id, direction, -1);
          return;
        }

        if (!response.ok) {
          applyDelta(id, direction, -1);
          unlock();
          return;
        }

        const payload = await response.json();
        if (payload?.review) {
          setItems((prev) =>
            prev.map((item) => (item.id === id ? payload.review : item))
          );
        }
      } catch {
        applyDelta(id, direction, -1);
        unlock();
      }
    },
    [voted, applyDelta]
  );

  return { items, setItems, voted, handleVote };
}
