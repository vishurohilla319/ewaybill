import { NextResponse } from "next/server";
import { sql } from "@/lib/db/neon";
import { CompanyProfile } from "@/lib/types/ewayBill";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!sql) {
    return NextResponse.json({ error: "Database not connected" }, { status: 503 });
  }

  try {
    const rows = await sql`
      SELECT 
        id, 
        legal_name as "legalName", 
        trade_name as "tradeName", 
        gstin, 
        address1, 
        address2, 
        place, 
        pincode, 
        state_code as "stateCode", 
        phone, 
        email, 
        is_default as "isDefault"
      FROM companies 
      ORDER BY is_default DESC, legal_name ASC;
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
    const company: CompanyProfile = await req.json();
    const id = company.id || `comp-${Date.now()}`;

    // If marked default, unset other defaults
    if (company.isDefault) {
      await sql`UPDATE companies SET is_default = false;`;
    }

    await sql`
      INSERT INTO companies (
        id, legal_name, trade_name, gstin, address1, address2, place, pincode, state_code, phone, email, is_default
      ) VALUES (
        ${id}, 
        ${company.legalName}, 
        ${company.tradeName || company.legalName}, 
        ${company.gstin.toUpperCase()}, 
        ${company.address1}, 
        ${company.address2 || ""}, 
        ${company.place}, 
        ${company.pincode}, 
        ${Number(company.stateCode)}, 
        ${company.phone || ""}, 
        ${company.email || ""}, 
        ${Boolean(company.isDefault)}
      )
      ON CONFLICT (id) DO UPDATE SET
        legal_name = EXCLUDED.legal_name,
        trade_name = EXCLUDED.trade_name,
        gstin = EXCLUDED.gstin,
        address1 = EXCLUDED.address1,
        address2 = EXCLUDED.address2,
        place = EXCLUDED.place,
        pincode = EXCLUDED.pincode,
        state_code = EXCLUDED.state_code,
        phone = EXCLUDED.phone,
        email = EXCLUDED.email,
        is_default = EXCLUDED.is_default;
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
      return NextResponse.json({ error: "Missing company ID" }, { status: 400 });
    }

    await sql`DELETE FROM companies WHERE id = ${id};`;
    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
