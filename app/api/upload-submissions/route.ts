import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

function isNonEmptyRow(row: unknown): row is unknown[] {
  return Array.isArray(row) && row.some(cell => cell !== null && cell !== undefined && cell !== "");
}

function cleanFormName(filename: string): string {
  // "Test-Survey-A-1-1.xlsx" → "Test A"
  return filename
    .replace(/\.xlsx$/i, '')
    .replace(/[-_]\d+-\d+$/i, '')  // Remove -1-1 or _1-1
    .replace(/[-_]/g, ' ')         // Convert -/_ to spaces
    .replace(/\b\w/g, l => l.toUpperCase())  // Title case
    .trim();
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

    // ✅ FILENAME MATCHING - Perfect for Microsoft Forms
    const rawFilename = file.name;
    const cleanName = cleanFormName(rawFilename);
    
    console.log('Filename:', rawFilename);
    console.log('Matched form name:', cleanName);

    const { data: targetForms, error: formError } = await supabaseAdmin
      .from('forms')
      .select('slug, name')
      .eq('name', cleanName)
      .limit(1);

    if (formError || !targetForms?.[0]) {
      return NextResponse.json({ 
        error: `Form "${cleanName}" not found`,
        filename: rawFilename,
        matchedName: cleanName
      }, { status: 400 });
    }

    const targetSlug = targetForms[0].slug;

    const { error: updateError } = await supabaseAdmin
      .from("forms")
      .update({ submissions: totalSubmissions })
      .eq("slug", targetSlug);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: `✅ "${rawFilename}" → "${cleanName}" set to ${totalSubmissions} submissions`,
      filename: rawFilename,
      matchedForm: cleanName,
      totalSubmissions,
      targetSlug
    });

  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to process file" }, { status: 500 });
  }
}
