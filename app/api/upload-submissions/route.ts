import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

// Check if a row has any non-empty cell (ignores whitespace)
function isNonEmptyRow(row: unknown): row is unknown[] {
  return Array.isArray(row) && row.some(cell => String(cell).trim() !== "");
}

// Extract form name from filename first, fallback to sheet name
function extractFormName(file: File, workbook: XLSX.WorkBook): string {
  let formName = file.name
    .replace(/\.xlsx$/i, "")               // remove extension
    .replace(/[-_]\d+-\d+$/i, "")         // remove dash/underscore + numbers at end
    .replace(/\(\d+\s*\d*\)$/i, "")       // remove trailing (1), (1 1), etc.
    .replace(/[-_]/g, " ")                 // replace hyphens/underscores with space
    .trim();

  // Fallback to sheet name if filename is empty or generic
  if (!formName || formName.toLowerCase() === "sheet1") {
    formName = workbook.SheetNames[0]?.replace("Sheet", "").trim() || "Default Form";
  }

  return formName;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Read Excel file
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

    // Skip header row, filter empty rows
    const dataRows = (json.slice(1) as unknown[]).filter(isNonEmptyRow);
    const totalSubmissions = dataRows.length;

    if (totalSubmissions === 0) {
      return NextResponse.json({ error: "No valid submissions found" }, { status: 400 });
    }

    const formName = extractFormName(file, workbook);
    console.log("Extracted form name:", formName);

    // 1️⃣ Try exact match first
    let { data: targetForms, error } = await supabaseAdmin
      .from("forms")
      .select("slug, name")
      .eq("name", formName)
      .limit(1);

    // 2️⃣ Fallback to fuzzy match
    if (!targetForms?.[0]) {
      ({ data: targetForms, error } = await supabaseAdmin
        .from("forms")
        .select("slug, name")
        .ilike("name", `%${formName}%`)
        .limit(1));
    }

    if (error || !targetForms?.[0]) {
      return NextResponse.json(
        {
          error: `No form found matching "${formName}"`,
          detected: formName,
          filename: file.name,
        },
        { status: 400 }
      );
    }

    const targetSlug = targetForms[0].slug;
    const matchedFormName = targetForms[0].name;

    // Overwrite submissions count (Excel is source of truth)
    const { error: updateError } = await supabaseAdmin
      .from("forms")
      .update({ submissions: totalSubmissions })
      .eq("slug", targetSlug);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `✅ "${formName}" → "${matchedFormName}" set to ${totalSubmissions}`,
      detected: formName,
      matched: matchedFormName,
      totalSubmissions,
      slug: targetSlug,
      // Optional: preview first 5 rows
      rowsPreview: dataRows.slice(0, 5),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
