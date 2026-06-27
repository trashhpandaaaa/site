#!/usr/bin/env node
/**
 * Bootstrap / change a user's role in Clerk publicMetadata.
 *
 *   node scripts/set_role.js <email-or-userId> <role>
 *
 * role: super_admin | admin | user
 *
 * Use this to grant the FIRST super admin (the in-app /admin/roles page requires
 * you to already be an admin, so the very first one must be set out-of-band).
 * Reads CLERK_SECRET_KEY from .env.local or .env. Talks to the Clerk Backend API
 * directly via fetch so it has no dependency on the Next.js runtime.
 */
try { require("dotenv").config({ path: ".env.local" }); } catch (e) {}
try { require("dotenv").config(); } catch (e) {}

const VALID_ROLES = ["super_admin", "admin", "user"];
const API = "https://api.clerk.com/v1";

async function clerk(path, init = {}) {
  const key = process.env.CLERK_SECRET_KEY;
  if (!key) throw new Error("CLERK_SECRET_KEY is missing. Add it to .env.local.");
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.headers || {})
    }
  });
  const text = await res.text();
  let body;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) {
    const msg = body?.errors?.[0]?.message || body?.message || text || res.statusText;
    throw new Error(`Clerk ${path} -> ${res.status}: ${msg}`);
  }
  return body;
}

async function resolveUserId(identifier) {
  if (identifier.startsWith("user_")) return identifier;
  // Look up by email address.
  const list = await clerk(`/users?email_address=${encodeURIComponent(identifier)}&limit=1`);
  const user = Array.isArray(list) ? list[0] : list?.data?.[0];
  if (!user) {
    throw new Error(
      `No Clerk user found for "${identifier}". Make sure they have signed in at least once.`
    );
  }
  return user.id;
}

async function main() {
  const [identifier, role] = process.argv.slice(2);
  if (!identifier || !role) {
    console.error("Usage: node scripts/set_role.js <email-or-userId> <role>");
    console.error("role: super_admin | admin | user");
    process.exit(1);
  }
  if (!VALID_ROLES.includes(role)) {
    console.error(`Invalid role "${role}". Use one of: ${VALID_ROLES.join(", ")}`);
    process.exit(1);
  }

  const userId = await resolveUserId(identifier.trim());
  await clerk(`/users/${userId}/metadata`, {
    method: "PATCH",
    body: JSON.stringify({ public_metadata: { role } })
  });

  console.log(`✓ Set ${identifier} (${userId}) to "${role}".`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
