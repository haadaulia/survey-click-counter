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

// Generate unique slug from base, avoiding collisions in a set
function generateUniqueSlug(baseSlug: string, existingSlugs: Set<string>) {
  let slug = baseSlug;
  let counter = 1;
  while (existingSlugs.has(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  existingSlugs.add(slug);
  return slug;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Fetch all existing forms once
    const { data: allForms, error: fetchError } = await supabaseAdmin
      .from("forms")
      .select("slug, name");

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const existingSlugs = new Set(allForms?.map(f => f.slug) || []);
    const slugMap = new Map<string, string>(); // normalizedName -> slug
    allForms?.forEach(f => slugMap.set(normalizeName(f.name), f.slug));

    const batchUpsert: any[] = [];
    const results: any[] = [];

    // Process all files
    for (const file of files) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

        const rows = json as unknown[][];
        const dataRows = rows.slice(1).filter(isNonEmptyRow);
        const totalSubmissions = dataRows.length;

        if (totalSubmissions === 0) {
          results.push({ file: file.name, error: "No valid submissions found" });
          continue;
        }

        const formName = extractFormName(file, workbook);
        const normalized = normalizeName(formName);

        let slug: string;
        let isNewForm = false;

        if (slugMap.has(normalized)) {
          slug = slugMap.get(normalized)!;
        } else {
          isNewForm = true;
          const baseSlug = normalized.replace(/\s+/g, "-");
          slug = generateUniqueSlug(baseSlug, existingSlugs);
          slugMap.set(normalized, slug);
        }

        batchUpsert.push({
          slug,
          name: formName,
          submissions: totalSubmissions,
        });

        results.push({
          file: file.name,
          slug,
          totalSubmissions,
          message: isNewForm
            ? `New form "${formName}" will be created with ${totalSubmissions} submissions`
            : `Existing form "${formName}" will be updated to ${totalSubmissions} submissions`,
        });
      } catch (fileError: any) {
        results.push({ file: file.name, error: fileError.message });
      }
    }

    if (batchUpsert.length > 0) {
      // Use upsert to create new forms or update existing ones in one call
      const { error: upsertError } = await supabaseAdmin
        .from("forms")
        .upsert(batchUpsert, { onConflict: "slug" });

      if (upsertError) {
        return NextResponse.json({ error: upsertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
