import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { createServerSupabase } from "../../../../lib/supabase/server";
import { requireRole, ROLE } from "../../../../lib/auth/roles";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif"
};

export async function POST(request) {
  const authResult = await requireRole(ROLE.ADMIN);
  if (!authResult.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: authResult.status });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "File is required." }, { status: 400 });
  }

  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    return NextResponse.json(
      { error: "Unsupported file type. Upload a JPEG, PNG, WebP, GIF, or AVIF image." },
      { status: 415 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is too large (max 5 MB)." }, { status: 413 });
  }

  const bucket = "blog-covers";
  // Generate the storage key ourselves so an attacker-supplied filename can't
  // inject path segments or unexpected content types into the bucket.
  const fileName = `${Date.now()}-${randomUUID()}.${extension}`;
  const supabase = createServerSupabase();

  const { error } = await supabase.storage.from(bucket).upload(fileName, file, {
    upsert: false,
    contentType: file.type
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return NextResponse.json({ url: data.publicUrl });
}
