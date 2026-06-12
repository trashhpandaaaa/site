import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { createServerSupabase } from "../../../../lib/supabase/server";
import { recordVote } from "../../../../lib/votes";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json(
        { error: "You already voted on this experience." },
        { status: 409 }
      );
    }

    const { data: current, error } = await supabase
      .from("reviews")
      .select("upvotes, downvotes")
      .eq("id", id)
      .single();

    if (error || !current) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }

    const nextUpvotes = (current.upvotes || 0) + (direction === "up" ? 1 : 0);
    const nextDownvotes = (current.downvotes || 0) + (direction === "down" ? 1 : 0);

    const { data: updated, error: updateError } = await supabase
      .from("reviews")
      .update({ upvotes: nextUpvotes, downvotes: nextDownvotes })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ review: updated });
  } catch (error) {
    console.error("POST /api/votes/review failed:", error?.message || error);
    return NextResponse.json({ error: "Failed to update review." }, { status: 500 });
  }
}
