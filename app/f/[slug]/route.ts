import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;

  const { data: formUrl, error } = await supabaseAdmin.rpc(
    "increment_clicks_and_get_url",
    { p_slug: slug }
  );

  if (error || !formUrl) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  return NextResponse.redirect(formUrl);
}
