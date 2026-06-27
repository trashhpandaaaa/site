import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { createServerSupabase } from "../../../../lib/supabase/server";
import { recordVote } from "../../../../lib/votes";
import { checkRateLimit, retryAfterSeconds } from "../../../../lib/ratelimit";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    const { data: updated, error: updateError } = await supabase.rpc(
      "increment_review_vote",
      { p_id: id, p_direction: direction }
    );

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    const review = Array.isArray(updated) ? updated[0] : updated;
    if (!review) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }

    return NextResponse.json({ review });
  } catch (error) {
    console.error("POST /api/votes/review failed:", error?.message || error);
    return NextResponse.json({ error: "Failed to update review." }, { status: 500 });
  }
}
