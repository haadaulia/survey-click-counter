export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  const { data, error } = await supabaseAdmin
    .from("forms")
    .select("slug, name, form_url, clicks, submissions, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const origin = req.nextUrl.origin;

  const forms = (data ?? []).map((f) => ({
    id: f.slug,
    name: f.name,
    formUrl: f.form_url,
    trackedLink: `${origin}/f/${f.slug}`,
    clicks: f.clicks,
    submissions: f.submissions,
  }));

  return NextResponse.json(forms);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, formUrl } = body;

  if (!name || !formUrl) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // basic URL validation
  let parsed: URL;
  try {
    parsed = new URL(formUrl);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // allowlist (tighten as needed)
  const allowedHosts = new Set(["forms.office.com", "forms.cloud.microsoft"]);
  if (!allowedHosts.has(parsed.host)) {
    return NextResponse.json({ error: "URL host not allowed" }, { status: 400 });
  }

  const baseSlug = name.toLowerCase().trim().replace(/\s+/g, "-");
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;

  const { data, error } = await supabaseAdmin
    .from("forms")
    .insert({ slug, name, form_url: formUrl })
    .select("slug, name, form_url, clicks, submissions")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const origin = req.nextUrl.origin;

  return NextResponse.json(
    {
      id: data.slug,
      name: data.name,
      formUrl: data.form_url,
      trackedLink: `${origin}/f/${data.slug}`,
      clicks: data.clicks,
      submissions: data.submissions,
    },
    { status: 201 }
  );
}

export async function DELETE(req: NextRequest) {

  const slug = req.nextUrl.searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("forms").delete().eq("slug", slug);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
