import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

function isNonEmptyRow(row: unknown): row is unknown[] {
  return Array.isArray(row) && row.some(cell => cell !== null && cell !== undefined && cell !== "");
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
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    
    const dataRows = (json.slice(1) as unknown[]).filter(isNonEmptyRow);
    const totalSubmissions = dataRows.length;

    if (totalSubmissions === 0) {
      return NextResponse.json({ error: "No valid submissions found" }, { status: 400 });
    }

    // Latest form
    const { data: latestForm } = await supabaseAdmin
      .from('forms')
      .select('slug')
      .order('created_at', { ascending: false })
      .limit(1);

    if (!latestForm?.[0]?.slug) {
      return NextResponse.json({ error: "No forms found" }, { status: 400 });
    }

    const targetSlug = latestForm[0].slug;

    const { error: updateError } = await supabaseAdmin
      .from("forms")
      .update({ submissions: totalSubmissions })
      .eq("slug", targetSlug);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: `Set submissions to ${totalSubmissions}`,
      totalSubmissions,
      targetForm: targetSlug
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
