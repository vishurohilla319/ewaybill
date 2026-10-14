import { NextResponse } from "next/server";
import { sql } from "@/lib/db/neon";
import { TransporterMaster } from "@/lib/types/ewayBill";

export async function GET() {
  if (!sql) {
    return NextResponse.json({ error: "Database not connected" }, { status: 503 });
  }

  try {
    const rows = await sql`
      SELECT 
        id, 
        transporter_id as "transporterId", 
        name, 
        phone, 
        email 
      FROM transporters 
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
    const transporter: TransporterMaster = await req.json();
    const id = transporter.id || `trans-${Date.now()}`;

    await sql`
      INSERT INTO transporters (id, transporter_id, name, phone, email)
      VALUES (
        ${id}, 
        ${transporter.transporterId.toUpperCase()}, 
        ${transporter.name}, 
        ${transporter.phone || ""}, 
        ${transporter.email || ""}
      )
      ON CONFLICT (id) DO UPDATE SET
        transporter_id = EXCLUDED.transporter_id,
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        email = EXCLUDED.email;
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
      return NextResponse.json({ error: "Missing transporter ID" }, { status: 400 });
    }

    await sql`DELETE FROM transporters WHERE id = ${id};`;
    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
