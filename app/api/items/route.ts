import { NextResponse } from "next/server";
import { sql } from "@/lib/db/neon";
import { ItemMaster } from "@/lib/types/ewayBill";

export async function GET() {
  if (!sql) {
    return NextResponse.json({ error: "Database not connected" }, { status: 503 });
  }

  try {
    const rows = await sql`
      SELECT 
        id, 
        name, 
        description, 
        hsn_code as "hsnCode", 
        unit, 
        default_gst_rate as "defaultGstRate", 
        cess_rate as "cessRate", 
        cess_nonadvol as "cessNonadvol" 
      FROM items 
      ORDER BY name ASC;
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
    const item: ItemMaster = await req.json();
    const id = item.id || `item-${Date.now()}`;

    await sql`
      INSERT INTO items (
        id, name, description, hsn_code, unit, default_gst_rate, cess_rate, cess_nonadvol
      ) VALUES (
        ${id}, 
        ${item.name}, 
        ${item.description || ""}, 
        ${item.hsnCode}, 
        ${item.unit}, 
        ${Number(item.defaultGstRate)}, 
        ${Number(item.cessRate || 0)}, 
        ${Number(item.cessNonadvol || 0)}
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        hsn_code = EXCLUDED.hsn_code,
        unit = EXCLUDED.unit,
        default_gst_rate = EXCLUDED.default_gst_rate,
        cess_rate = EXCLUDED.cess_rate,
        cess_nonadvol = EXCLUDED.cess_nonadvol;
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
      return NextResponse.json({ error: "Missing item ID" }, { status: 400 });
    }

    await sql`DELETE FROM items WHERE id = ${id};`;
    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
