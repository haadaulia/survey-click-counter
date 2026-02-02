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
    const applyUpdate = req.nextUrl.searchParams.get("apply") === "true";

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
      .select("slug, name, submissions");

    if (error) {
      return NextResponse.json({ error: "Error fetching forms from DB" }, { status: 500 });
    }

    // Try exact match first
    let matchedForm = allForms?.find(f => normalizeName(f.name) === formName);

    // Fallback: partial match
    if (!matchedForm) {
      matchedForm = allForms?.find(f => normalizeName(f.name).includes(formName));
    }

    // If still not found → create a new form automatically
    let isNewForm = false;
    let targetSlug: string;
    let previousSubmissions = 0;
    let matchedFormName: string;

    if (!matchedForm) {
      isNewForm = true;
      matchedFormName = formName;
      targetSlug = formName.toLowerCase().replace(/\s+/g, "-"); // simple slug
      if (applyUpdate) {
        // Insert new form
        const { data: insertData, error: insertError } = await supabaseAdmin
          .from("forms")
          .insert([{ slug: targetSlug, name: matchedFormName, submissions: totalSubmissions }])
          .select()
          .single();

        if (insertError) {
          return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        previousSubmissions = 0;
        matchedFormName = insertData.name;
      }
    } else {
      targetSlug = matchedForm.slug;
      matchedFormName = matchedForm.name;
      previousSubmissions = matchedForm.submissions || 0;
    }

    const difference = totalSubmissions - previousSubmissions;

    // Apply update if flag is set
    let updateApplied = false;
    if (!isNewForm && applyUpdate) {
      const { error: updateError } = await supabaseAdmin
        .from("forms")
        .update({ submissions: totalSubmissions })
        .eq("slug", targetSlug);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
      updateApplied = true;
    }

    // Return preview + update status
    return NextResponse.json({
      success: updateApplied || isNewForm,
      message: applyUpdate
        ? `✅ Submissions updated for "${matchedFormName}"`
        : `Preview: "${matchedFormName}" has ${previousSubmissions} submissions`,
      detected: formName,
      matched: matchedFormName,
      previousSubmissions,
      newSubmissions: totalSubmissions,
      difference,
      slug: targetSlug,
      rowsPreview: dataRows.slice(0, 5),
      actionRequired: difference !== 0,
      isNewForm,
      updateApplied,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
