import { NextResponse } from "next/server";

import { createServerSupabase } from "../../../../../../lib/supabase/server";
import { requireRole, ROLE } from "../../../../../../lib/auth/roles";
import { getContentType, sanitizeContent } from "../../../../../../lib/admin/contentTypes";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function resolve(params) {
  const config = getContentType(params.type);
  if (!config) return { error: NextResponse.json({ error: "Unknown content type." }, { status: 404 }) };
  if (!UUID_RE.test(params.id || "")) {
    return { error: NextResponse.json({ error: "Invalid id." }, { status: 400 }) };
  }
  return { config };
}

export async function GET(request, { params }) {
  const authResult = await requireRole(ROLE.ADMIN);
  if (!authResult.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: authResult.status });
  }
  const { config, error } = resolve(params);
  if (error) return error;

  const supabase = createServerSupabase();
  const { data, error: dbError } = await supabase
    .from(config.table)
    .select("*")
    .eq("id", params.id)
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 404 });
  }
  return NextResponse.json({ row: data });
}

export async function PUT(request, { params }) {
  const authResult = await requireRole(ROLE.ADMIN);
  if (!authResult.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: authResult.status });
  }
  const { config, error } = resolve(params);
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const { values, error: validationError } = sanitizeContent(params.type, body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { data, error: dbError } = await supabase
    .from(config.table)
    .update(values)
    .eq("id", params.id)
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }
  return NextResponse.json({ row: data });
}

export async function DELETE(request, { params }) {
  // Deleting content is restricted to super admins.
  const authResult = await requireRole(ROLE.SUPER_ADMIN);
  if (!authResult.ok) {
    return NextResponse.json(
      { error: authResult.status === 403 ? "Only super admins can delete content." : "Unauthorized" },
      { status: authResult.status }
    );
  }
  const { config, error } = resolve(params);
  if (error) return error;

  const supabase = createServerSupabase();
  const { error: dbError } = await supabase.from(config.table).delete().eq("id", params.id);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
