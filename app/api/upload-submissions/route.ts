import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

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
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    console.log('=== EXCEL DEBUG ===');
    console.log('Total rows:', json.length);
    console.log('Headers:', json[0]);
    console.log('First data row:', json[1]);

    // FIXED: Type-safe row counting
    const dataRows = json.slice(1) as (unknown[])[];
    const totalSubmissions = dataRows.filter((row): row is unknown[] => 
      Array.isArray(row) && 
      row.length > 0 && 
      row.some(cell => cell !== null && cell !== undefined && cell !== "")
    ).length;

    console.log('Valid submissions found:', totalSubmissions);

    if (totalSubmissions === 0) {
      return NextResponse.json({ error: "No valid submissions found in Excel file" }, { status: 400 });
    }

    // Get LATEST form (assumes sorting works)
    const { data: latestForm } = await supabaseAdmin
      .from('forms')
      .select('slug')
      .order('created_at', { ascending: false })
      .limit(1);

    if (!latestForm?.[0]?.slug) {
      return NextResponse.json({ error: "No forms found" }, { status: 400 });
    }

    const targetSlug = latestForm[0].slug;
    console.log('Target form:', targetSlug);

    // Process each valid submission
    let successCount = 0;
    let skipCount = 0;

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      
      // Skip truly empty rows
      if (!row || row.length === 0 || row.every(cell => cell === null || cell === undefined || cell === "")) {
        console.log(`Skipping empty row ${i + 2}`);
        skipCount++;
        continue;
      }

      console.log(`Processing submission ${i + 1}:`, row[3] || 'anonymous');

      const { error } = await supabaseAdmin.rpc("increment_submissions", {
        slug: targetSlug
      });
      
      if (error) {
        console.error(`RPC failed for row ${i + 2}:`, error);
        skipCount++;
      } else {
        successCount++;
      }
    }

    return NextResponse.json({ 
      success: true,
      message: `✅ Processed ${totalSubmissions} submissions for ${targetSlug}`,
      totalRows: json.length - 1,
      successful: successCount,
      skipped: skipCount,
      targetForm: targetSlug
    });

  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to process file" 
    }, { status: 500 });
  }
}
