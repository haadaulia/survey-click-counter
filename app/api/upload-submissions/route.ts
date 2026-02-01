import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

function isNonEmptyRow(row: unknown): row is unknown[] {
  return Array.isArray(row) && row.some(cell => cell !== null && cell !== undefined && cell !== "");
}

function cleanFormName(name: string): string {
  // Remove (1-1), (1-2), etc. and trim
  return name.replace(/\s*\(\d+-\d+\)$/i, '').trim();
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
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as unknown[][];

    // Count data rows (skip header)
    const dataRows = (json.slice(1) as unknown[]).filter(isNonEmptyRow);
    const totalSubmissions = dataRows.length;

    if (totalSubmissions === 0) {
      return NextResponse.json({ error: "No valid submissions found" }, { status: 400 });
    }

    // ✅ SMART FORM MATCHING - Type safe
    const rawFormName = (json[0]?.[0] as string | undefined)?.toString() || '';
    const cleanName = cleanFormName(rawFormName);
    console.log('Raw Excel name:', rawFormName);
    console.log('Cleaned name:', cleanName);

    // Find form by cleaned name
    const { data: targetForms, error: formError } = await supabaseAdmin
      .from('forms')
      .select('slug, name')
      .eq('name', cleanName)
      .limit(1);

    if (formError || !targetForms?.[0]) {
      return NextResponse.json({ 
        error: `Form "${cleanName}" not found`,
        rawName: rawFormName,
        detected: cleanName
      }, { status: 400 });
    }

    const targetSlug = targetForms[0].slug;

    // Set submissions count
    const { error: updateError } = await supabaseAdmin
      .from("forms")
      .update({ submissions: totalSubmissions })
      .eq("slug", targetSlug);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: `✅ "${rawFormName}" → "${cleanName}" set to ${totalSubmissions} submissions`,
      rawFormName,
      matchedForm: cleanName,
      totalSubmissions,
      targetSlug
    });

  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to process file" }, { status: 500 });
  }
}
