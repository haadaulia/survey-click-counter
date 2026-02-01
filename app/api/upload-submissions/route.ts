import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

// Check if a row has any non-empty cell (ignores whitespace)
function isNonEmptyRow(row: unknown): row is unknown[] {
  return Array.isArray(row) && row.some(cell => String(cell).trim() !== "");
}

// Normalize form names for matching
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\.xlsx$/i, "")
    .replace(/\(\d+[-\s]?\d*\)$/i, "") // remove (1), (1-1), (1 1)
    .replace(/[-_]/g, " ")             // hyphens/underscores → space
    .replace(/\s+/g, " ")              // collapse multiple spaces
    .trim();
}

// Extract form name from filename first, fallback to sheet name
function extractFormName(file: File, workbook: XLSX.WorkBook): string {
  let formName = normalizeName(file.name);

  // Fallback to sheet name
  if (!formName || formName === "sheet1") {
    formName = normalizeName(workbook.SheetNames[0] || "Default Form");
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
    console.log("Normalized form name:", formName);

    // Fetch all forms from DB
    const { data: allForms, error } = await supabaseAdmin
      .from("forms")
      .select("slug, name, submissions"); // get previous submission count

    if (error || !allForms || allForms.length === 0) {
      return NextResponse.json({ error: "No forms found in DB" }, { status: 500 });
    }

    // Match normalized name
    let matchedForm = allForms.find(f => normalizeName(f.name) === formName);

    // Fallback: partial match if exact fails
    if (!matchedForm) {
      matchedForm = allForms.find(f => normalizeName(f.name).includes(formName));
    }

    if (!matchedForm) {
      return NextResponse.json(
        {
          error: `No form found matching "${formName}"`,
          detected: formName,
          filename: file.name,
        },
        { status: 400 }
      );
    }

    const targetSlug = matchedForm.slug;
    const matchedFormName = matchedForm.name;
    const previousSubmissions = matchedForm.submissions || 0;
    const difference = totalSubmissions - previousSubmissions;

    // Respond with a "preview" instead of auto-applying update
    return NextResponse.json({
      success: true,
      message: `Detected submission count for "${matchedFormName}"`,
      detected: formName,
      matched: matchedFormName,
      previousSubmissions,
      newSubmissions: totalSubmissions,
      difference, // positive = increased, negative = decreased
      slug: targetSlug,
      rowsPreview: dataRows.slice(0, 5),
      actionRequired: Math.abs(difference) > 0 // flag to prompt user if there’s a change
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
