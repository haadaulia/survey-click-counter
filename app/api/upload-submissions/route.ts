import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

// Check if a row has any non-empty cell (ignores whitespace)
function isNonEmptyRow(row: unknown[]): boolean {
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

  if (!formName || formName === "sheet1") {
    formName = normalizeName(workbook.SheetNames[0] || "Default Form");
  }

  return formName;
}

// Generate a unique slug for a new form
async function generateUniqueSlug(baseSlug: string) {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const { data: existing, error } = await supabaseAdmin
      .from("forms")
      .select("slug")
      .eq("slug", slug)
      .limit(1);

    if (error) throw new Error(error.message);
    if (!existing || existing.length === 0) break;

    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
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

    // Correctly slice rows after header and filter non-empty
    const rows = json as unknown[][];
    const dataRows = rows.slice(1).filter(isNonEmptyRow);
    const totalSubmissions = dataRows.length;

    if (totalSubmissions === 0) {
      return NextResponse.json({ error: "No valid submissions found" }, { status: 400 });
    }

    const formName = extractFormName(file, workbook);
    console.log("Normalized form name:", formName);
    console.log("Total submissions detected:", totalSubmissions);

    // Fetch all forms from DB
    const { data: allForms, error } = await supabaseAdmin
      .from("forms")
      .select("slug, name, submissions");

    if (error) {
      return NextResponse.json({ error: "Error fetching forms from DB" }, { status: 500 });
    }

    // Match normalized name
    let matchedForm = allForms?.find(f => normalizeName(f.name) === formName);
    if (!matchedForm) {
      matchedForm = allForms?.find(f => normalizeName(f.name).includes(formName));
    }

    let targetSlug: string;
    let matchedFormName: string;

    // Handle new forms
    if (!matchedForm) {
      matchedFormName = formName;
      const baseSlug = formName.toLowerCase().replace(/\s+/g, "-");
      targetSlug = await generateUniqueSlug(baseSlug);

      const { data: insertData, error: insertError } = await supabaseAdmin
        .from("forms")
        .insert([{ slug: targetSlug, name: matchedFormName, submissions: totalSubmissions }])
        .select()
        .single();

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      matchedFormName = insertData.name;
    } else {
      targetSlug = matchedForm.slug;
      matchedFormName = matchedForm.name;

      const { error: updateError } = await supabaseAdmin
        .from("forms")
        .update({ submissions: totalSubmissions })
        .eq("slug", targetSlug);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: `✅ "${matchedFormName}" submissions set to ${totalSubmissions}`,
      detected: formName,
      matched: matchedFormName,
      totalSubmissions,
      slug: targetSlug,
      rowsPreview: dataRows.slice(0, 5),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
