import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const params = await context.params;  // Await the Promise
  const slug = params.slug;

  const { data, error } = await supabase
    .from("forms")
    .select("submissions")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    console.error("Submission lookup error", error);
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  const { error: updateError } = await supabase
    .from("forms")
    .update({ submissions: data.submissions + 1 })
    .eq("slug", slug);

  if (updateError) {
    console.error("Submission update error", updateError);
  }
  return NextResponse.redirect(`/thank-you?form=${encodeURIComponent(slug)}`);
}
