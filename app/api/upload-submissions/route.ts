import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

// Check if a row has any non-empty cell
function isNonEmptyRow(row: unknown[]): boolean {
  return Array.isArray(row) && row.some(cell => String(cell).trim() !== "");
}

// Normalize form names
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\.xlsx$/i, "")
    .replace(/\(\d+[-\s]?\d*\)$/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Extract form name from filename or sheet
function extractFormName(file: File, workbook: XLSX.WorkBook): string {
  let formName = normalizeName(file.name);
  if (!formName || formName === "sheet1") {
    formName = normalizeName(workbook.SheetNames[0] || "Default Form");
  }
  return formName;
}

// Generate unique slug for new forms
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
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const { data: allForms } = await supabaseAdmin
      .from("forms")
      .select("slug, name, submissions");

    const results: any[] = [];

    for (const file of files) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

        const dataRows = (json.slice(1) as unknown[][]).filter(isNonEmptyRow);
        const totalSubmissions = dataRows.length;

        if (totalSubmissions === 0) {
          results.push({ file: file.name, error: "No valid submissions found" });
          continue;
        }

        const formName = extractFormName(file, workbook);
        const normalized = normalizeName(formName);

        let matchedForm = allForms?.find(f => normalizeName(f.name) === normalized)
          || allForms?.find(f => normalizeName(f.name).includes(normalized));

        let targetSlug: string;
        let matchedFormName: string;

        if (!matchedForm) {
          // New form
          matchedFormName = formName;
          const baseSlug = formName.toLowerCase().replace(/\s+/g, "-");
          targetSlug = await generateUniqueSlug(baseSlug);

          const { data: insertData, error: insertError } = await supabaseAdmin
            .from("forms")
            .insert([{ slug: targetSlug, name: matchedFormName, submissions: totalSubmissions }])
            .select()
            .single();

          if (insertError) {
            results.push({ file: file.name, error: insertError.message });
            continue;
          }

          matchedFormName = insertData.name;
        } else {
          // Existing form
          targetSlug = matchedForm.slug;
          matchedFormName = matchedForm.name;

          const { error: updateError } = await supabaseAdmin
            .from("forms")
            .update({ submissions: totalSubmissions })
            .eq("slug", targetSlug);

          if (updateError) {
            results.push({ file: file.name, error: updateError.message });
            continue;
          }
        }

        results.push({
          file: file.name,
          matched: matchedFormName,
          totalSubmissions,
        });
      } catch (fileError: any) {
        results.push({ file: file.name, error: fileError.message });
      }
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
