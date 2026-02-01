import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

function isNonEmptyRow(row: unknown): row is unknown[] {
  if (!Array.isArray(row)) return false;
  return row.some(cell => cell !== null && cell !== undefined && cell !== "");
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    // defval: "" makes empty cells explicit, helps row checks behave consistently
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

    // Rows: [0] is header in Microsoft Forms export
    const dataRows = (json.slice(1) as unknown[]).filter(isNonEmptyRow);

    const totalSubmissions = dataRows.length;

    if (totalSubmissions === 0) {
      return NextResponse.json(
        { error: "No valid submissions found in Excel file" },
        { status: 400 }
      );
    }

    // Latest form
    const { data: latestForm, error: latestFormError } = await supabaseAdmin
      .from("forms")
      .select("slug")
      .order("created_at", { ascending: false })
      .limit(1);

    if (latestFormError) {
      return NextResponse.json(
        { error: latestFormError.message },
        { status: 500 }
      );
    }

    const targetSlug = latestForm?.[0]?.slug;
    if (!targetSlug) {
      return NextResponse.json({ error: "No forms found" }, { status: 400 });
    }

    // Source-of-truth update (no loop, no overcounting)
    const { error: updateError } = await supabaseAdmin
      .from("forms")
      .update({ submissions: totalSubmissions })
      .eq("slug", targetSlug);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Updated submissions to ${totalSubmissions} for ${targetSlug}`,
      totalSubmissions,
      targetForm: targetSlug,
      totalRowsInSheet: json.length,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process file" },
      { status: 500 }
    );
  }
}
