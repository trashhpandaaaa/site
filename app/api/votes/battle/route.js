import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { createServerSupabase } from "../../../../lib/supabase/server";
import { recordVote, undoVote } from "../../../../lib/votes";
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
  const side = payload.side === "a" ? "a" : payload.side === "b" ? "b" : "";

  if (!UUID_RE.test(id) || !side) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const supabase = createServerSupabase();

    const vote = await recordVote(supabase, {
      userId,
      targetType: "battle",
      targetId: id,
      value: side
    });
    if (!vote.ok) {
      if (vote.duplicate) {
        return NextResponse.json(
          { error: "You already voted on this battle." },
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
      "increment_battle_vote",
      { p_id: id, p_side: side }
    );

    const battle = Array.isArray(updated) ? updated[0] : updated;

    if (updateError || !battle) {
      // Counter never moved — release the ledger row so the vote isn't burned.
      if (!vote.unguarded) {
        await undoVote(supabase, { userId, targetType: "battle", targetId: id });
      }
      if (updateError) {
        console.error("battle vote increment failed:", updateError.message);
        return NextResponse.json(
          { error: "Could not record your vote. Please try again." },
          { status: 500 }
        );
      }
      return NextResponse.json({ error: "Battle not found." }, { status: 404 });
    }

    return NextResponse.json({ battle });
  } catch (error) {
    console.error("POST /api/votes/battle failed:", error?.message || error);
    return NextResponse.json({ error: "Failed to update vote." }, { status: 500 });
  }
}
