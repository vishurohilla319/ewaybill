import { NextResponse } from "next/server";
import { sql } from "@/lib/db/neon";
import { DraftBill } from "@/lib/types/ewayBill";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!sql) {
    return NextResponse.json({ error: "Database not connected" }, { status: 503 });
  }

  try {
    const rows = await sql`
      SELECT 
        id, 
        name, 
        company_id as "companyId", 
        bill_data as "bill", 
        updated_at as "updatedAt"
      FROM drafts 
      ORDER BY updated_at DESC;
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
    const draft: DraftBill = await req.json();
    const id = draft.id || `draft-${Date.now()}`;

    await sql`
      INSERT INTO drafts (id, name, company_id, bill_data, updated_at)
      VALUES (
        ${id}, 
        ${draft.name}, 
        ${draft.companyId || ""}, 
        ${JSON.stringify(draft.bill)}, 
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        company_id = EXCLUDED.company_id,
        bill_data = EXCLUDED.bill_data,
        updated_at = CURRENT_TIMESTAMP;
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
      return NextResponse.json({ error: "Missing draft ID" }, { status: 400 });
    }

    await sql`DELETE FROM drafts WHERE id = ${id};`;
    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
