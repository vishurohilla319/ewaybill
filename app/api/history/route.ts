import { NextResponse } from "next/server";
import { sql } from "@/lib/db/neon";
import { ExportHistoryRecord } from "@/lib/types/ewayBill";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!sql) {
    return NextResponse.json({ error: "Database not connected" }, { status: 503 });
  }

  try {
    const rows = await sql`
      SELECT 
        id, 
        created_at as "timestamp", 
        filename, 
        company_name as "companyName", 
        company_gstin as "companyGstin", 
        invoice_count as "invoiceCount", 
        invoice_numbers as "invoiceNumbers", 
        total_value as "totalValue", 
        total_tax as "totalTax", 
        schema_version as "schemaVersion", 
        json_payload as "jsonPayload"
      FROM export_history 
      ORDER BY created_at DESC;
    `;
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!sql) {
    return NextResponse.json({ error: "Database not connected" }, { status: 503 });
  }

  try {
    const record: ExportHistoryRecord = await req.json();
    const id = record.id || `hist-${Date.now()}`;

    await sql`
      INSERT INTO export_history (
        id, filename, company_name, company_gstin, invoice_count, invoice_numbers, total_value, total_tax, schema_version, json_payload, created_at
      ) VALUES (
        ${id}, 
        ${record.filename}, 
        ${record.companyName}, 
        ${record.companyGstin}, 
        ${Number(record.invoiceCount)}, 
        ${record.invoiceNumbers || []}, 
        ${Number(record.totalValue)}, 
        ${Number(record.totalTax)}, 
        ${record.schemaVersion || "1.0.0621"}, 
        ${record.jsonPayload}, 
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (id) DO NOTHING;
    `;

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!sql) {
    return NextResponse.json({ error: "Database not connected" }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing history ID" }, { status: 400 });
    }

    await sql`DELETE FROM export_history WHERE id = ${id};`;
    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
