import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { createServerSupabase } from "../../../../lib/supabase/server";
import { recordVote, undoVote } from "../../../../lib/votes";
import { checkRateLimit, retryAfterSeconds } from "../../../../lib/ratelimit";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The atomic counter function ships in migration 0002. Until that has been
// applied to the database, calling it fails with "function not found".
function isMissingFunction(error) {
  const message = (error?.message || "").toLowerCase();
  return (
    error?.code === "PGRST202" ||
    error?.code === "42883" ||
    message.includes("increment_review_vote")
  );
}

// Non-atomic fallback used only when the RPC is missing: read the current
// counts and write them back +1. Susceptible to lost increments under heavy
// concurrency, but keeps voting working until the migration is applied.
async function incrementFallback(supabase, id, direction) {
  const { data: current, error: readError } = await supabase
    .from("reviews")
    .select("upvotes, downvotes")
    .eq("id", id)
    .maybeSingle();
  if (readError) return { data: null, error: readError };
  if (!current) return { data: null, error: null };

  const patch =
    direction === "up"
      ? { upvotes: (current.upvotes || 0) + 1 }
      : { downvotes: (current.downvotes || 0) + 1 };

  return supabase.from("reviews").update(patch).eq("id", id).select().single();
}

export async function POST(request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await checkRateLimit("vote", userId);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many votes, please slow down." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds(rl.reset)) } }
    );
  }

  const payload = await request.json().catch(() => ({}));
  const id = (payload.id || "").toString();
  const direction = payload.direction === "up" ? "up" : payload.direction === "down" ? "down" : "";

  if (!UUID_RE.test(id) || !direction) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const supabase = createServerSupabase();

    const vote = await recordVote(supabase, {
      userId,
      targetType: "review",
      targetId: id,
      value: direction
    });
    if (!vote.ok) {
      if (vote.duplicate) {
        return NextResponse.json(
          { error: "You already voted on this experience." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Could not record your vote. Please try again." },
        { status: 500 }
      );
    }

    // Atomic increment so concurrent votes can't clobber each other.
    let { data: updated, error: updateError } = await supabase.rpc(
      "increment_review_vote",
      { p_id: id, p_direction: direction }
    );

    // DB doesn't have the function yet (migration 0002 pending) — fall back to
    // a plain update so voting still works.
    if (updateError && isMissingFunction(updateError)) {
      ({ data: updated, error: updateError } = await incrementFallback(
        supabase,
        id,
        direction
      ));
    }

    const review = Array.isArray(updated) ? updated[0] : updated;

    if (updateError || !review) {
      // The counter never moved, but the ledger row above was inserted —
      // release it so this user's vote isn't burned forever.
      if (!vote.unguarded) {
        await undoVote(supabase, { userId, targetType: "review", targetId: id });
      }
      if (updateError) {
        console.error("review vote increment failed:", updateError.message);
        return NextResponse.json(
          { error: "Could not record your vote. Please try again." },
          { status: 500 }
        );
      }
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }

    return NextResponse.json({ review });
  } catch (error) {
    console.error("POST /api/votes/review failed:", error?.message || error);
    return NextResponse.json({ error: "Failed to update review." }, { status: 500 });
  }
}
