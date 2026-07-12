import { auth } from "@clerk/nextjs/server";

import { createServerSupabase } from "../../../../lib/supabase/server";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

// Manage a signed-in user's chat search history.
//   DELETE { id }        -> remove one history entry
//   DELETE { all: true } -> clear the whole history
// Every delete is scoped to the caller's own user_id, so one user can never
// delete another's rows even though we use the service-role client.
export async function DELETE(request) {
  const { userId } = await auth();
  if (!userId) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const payload = await request.json().catch(() => ({}));
  const id = (payload.id || "").toString().trim();
  const all = payload.all === true;

  if (!id && !all) {
    return jsonResponse({ error: "Provide an id or all:true." }, 400);
  }

  try {
    const supabase = createServerSupabase();
    let query = supabase.from("chat_queries").delete().eq("user_id", userId);
    if (!all) query = query.eq("id", id);

    const { error } = await query;
    if (error) {
      return jsonResponse({ error: error.message }, 500);
    }
    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse({ error: error?.message || "Delete failed." }, 500);
  }
}
