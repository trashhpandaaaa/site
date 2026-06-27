import { NextResponse } from "next/server";

import { createServerSupabase } from "../../../../../lib/supabase/server";
import { requireRole, ROLE } from "../../../../../lib/auth/roles";
import { getContentType, sanitizeContent } from "../../../../../lib/admin/contentTypes";

// GET  /api/admin/content/<type>      -> list rows
// POST /api/admin/content/<type>      -> create a row
export async function GET(request, { params }) {
  const authResult = await requireRole(ROLE.ADMIN);
  if (!authResult.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: authResult.status });
  }

  const config = getContentType(params.type);
  if (!config) {
    return NextResponse.json({ error: "Unknown content type." }, { status: 404 });
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from(config.table)
    .select("*")
    .order(config.order.column, { ascending: config.order.ascending });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rows: data });
}

export async function POST(request, { params }) {
  const authResult = await requireRole(ROLE.ADMIN);
  if (!authResult.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: authResult.status });
  }

  const config = getContentType(params.type);
  if (!config) {
    return NextResponse.json({ error: "Unknown content type." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const { values, error: validationError } = sanitizeContent(params.type, body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { data, error } = await supabase.from(config.table).insert(values).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ row: data });
}
