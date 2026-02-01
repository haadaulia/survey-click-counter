import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

function isNonEmptyRow(row: unknown): row is unknown[] {
  return Array.isArray(row) && row.some(cell => cell !== null && cell !== undefined && cell !== "");
}

function extractFormName(file: File, workbook: XLSX.WorkBook): string {
  // Try filename first
  let formName = file.name
    .replace(/\.xlsx$/i, '')
    .replace(/[-_]\d+-\d+$/i, '')
    .replace(/[-_]/g, ' ')
    .trim();

  // Fallback to sheet name
  if (!formName || formName === 'Sheet1') {
    formName = workbook.SheetNames[0]?.replace('Sheet', '').trim() || 'Default Form';
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

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

    const dataRows = (json.slice(1) as unknown[]).filter(isNonEmptyRow);
    const totalSubmissions = dataRows.length;

    if (totalSubmissions === 0) {
      return NextResponse.json({ error: "No valid submissions found" }, { status: 400 });
    }

    // ✅ SMART NAME EXTRACTION
    const formName = extractFormName(file, workbook);
    console.log('Extracted form name:', formName);

    // FUZZY MATCH - finds form with name CONTAINING extracted name
    const { data: targetForms, error } = await supabaseAdmin
      .from('forms')
      .select('slug, name')
      .ilike('name', `%${formName}%`)  // Contains match
      .limit(1);

    if (error || !targetForms?.[0]) {
      return NextResponse.json({ 
        error: `No form found matching "${formName}"`,
        detected: formName,
        filename: file.name
      }, { status: 400 });
    }

    const targetSlug = targetForms[0].slug;
    const matchedFormName = targetForms[0].name;

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
      slug: targetSlug
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
