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
    
    // Handle both CSV and Excel
    let json: any[];
    
    if (file.name.endsWith('.csv')) {
      const text = buffer.toString('utf-8');
      const workbook = XLSX.read(text, { type: 'string' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      json = XLSX.utils.sheet_to_json(sheet);
    } else {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      json = XLSX.utils.sheet_to_json(sheet);
    }

    // Process each row
    let successCount = 0;
    let errorCount = 0;
    
    for (const row of json) {
      const slug = row["Form slug"] || row["slug"] || row["Slug"];
      const submissions = parseInt(row["Submissions"] || row["submissions"] || "0");
      
      if (!slug) {
        errorCount++;
        continue;
      }

      // Increment submissions the specified number of times
      for (let i = 0; i < submissions; i++) {
        const { error } = await supabaseAdmin.rpc("increment_submissions", { 
          p_slug: slug 
        });
        
        if (error) {
          console.error(`Error incrementing for ${slug}:`, error);
          errorCount++;
          break;
        }
      }
      
      if (!error) successCount++;
    }

    return NextResponse.json({ 
      ok: true, 
      processed: successCount,
      errors: errorCount 
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ 
      error: "Failed to process file" 
    }, { status: 500 });
  }
}