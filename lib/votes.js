// Per-user vote ledger. Inserting into user_votes (unique on user/target)
// is what stops a user from voting twice on the same thing.

function isDuplicate(error) {
  return error?.code === "23505" || (error?.message || "").includes("duplicate key");
}

function isMissingTable(error) {
  return (
    error?.code === "42P01" ||
    error?.code === "PGRST205" ||
    (error?.message || "").includes("user_votes")
  );
}

// Returns:
//   { ok: true }                       — vote recorded, proceed with the count update
//   { ok: false, duplicate: true }     — this user already voted on this target
//   { ok: false, error: true }         — unexpected ledger failure; fail closed (don't count)
//   { ok: true, unguarded: true }      — ledger table missing (migration not applied);
//                                        proceed so voting still works, just without dedup
export async function recordVote(supabase, { userId, targetType, targetId, value }) {
  const { error } = await supabase.from("user_votes").insert({
    user_id: userId,
    target_type: targetType,
    target_id: targetId,
    value
  });

  if (!error) return { ok: true };
  if (isDuplicate(error)) return { ok: false, duplicate: true };
  if (isMissingTable(error)) return { ok: true, unguarded: true };

  // Unknown ledger failure: fail closed. We couldn't confirm this isn't a
  // replay, so don't count the vote — better to ask the user to retry than to
  // let the counters be stuffed.
  console.error("user_votes insert failed:", error.message);
  return { ok: false, error: true };
}
