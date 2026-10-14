import { NextResponse } from "next/server";
import { sql } from "@/lib/db/neon";
import { LoginCredentials, RegisterPayload } from "@/lib/types/auth";

export async function POST(req: Request) {
  if (!sql) {
    return NextResponse.json({ error: "Database not connected" }, { status: 503 });
  }

  try {
    const body = await req.json();
    const action = body.action || "login";

    if (action === "login") {
      const { userId, password }: LoginCredentials = body;
      if (!userId || !password) {
        return NextResponse.json({ error: "User ID and Password are required" }, { status: 400 });
      }

      const users = await sql`
        SELECT 
          id, 
          user_id as "userId", 
          full_name as "fullName", 
          email, 
          password_hash, 
          role, 
          company_id as "companyId", 
          company_name as "companyName", 
          company_gstin as "companyGstin", 
          created_at as "createdAt"
        FROM users 
        WHERE LOWER(user_id) = LOWER(${userId.trim()})
        LIMIT 1;
      `;

      if (users.length === 0) {
        return NextResponse.json({ error: "Invalid User ID or Password" }, { status: 401 });
      }

      const user = users[0];
      if (user.password_hash !== password.trim()) {
        return NextResponse.json({ error: "Invalid User ID or Password" }, { status: 401 });
      }

      // Update last_login
      await sql`UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ${user.id};`;

      const { password_hash, ...safeUser } = user;
      return NextResponse.json({
        success: true,
        user: safeUser,
        token: `neon_session_${user.id}_${Date.now()}`,
      });
    }

    if (action === "register") {
      const payload: RegisterPayload = body;
      if (!payload.userId || !payload.password || !payload.companyName || !payload.companyGstin) {
        return NextResponse.json({ error: "Missing mandatory fields" }, { status: 400 });
      }

      const existing = await sql`
        SELECT id FROM users WHERE LOWER(user_id) = LOWER(${payload.userId.trim()}) LIMIT 1;
      `;
      if (existing.length > 0) {
        return NextResponse.json({ error: "User ID already exists. Please choose another." }, { status: 409 });
      }

      const companyId = `comp-${Date.now()}`;
      const userId = `user-${Date.now()}`;

      // Insert company
      await sql`
        INSERT INTO companies (
          id, legal_name, trade_name, gstin, address1, place, pincode, state_code, is_default
        ) VALUES (
          ${companyId}, 
          ${payload.companyName}, 
          ${payload.companyName}, 
          ${payload.companyGstin.toUpperCase()}, 
          ${payload.address || "Main Road"}, 
          ${payload.place || "City"}, 
          ${payload.pincode || "110001"}, 
          ${Number(payload.stateCode) || 7}, 
          false
        ) ON CONFLICT (id) DO NOTHING;
      `;

      // Insert user
      await sql`
        INSERT INTO users (
          id, user_id, full_name, email, password_hash, role, company_id, company_name, company_gstin
        ) VALUES (
          ${userId}, 
          ${payload.userId.trim()}, 
          ${payload.fullName.trim()}, 
          ${payload.email.trim()}, 
          ${payload.password.trim()}, 
          ${payload.role || "Taxpayer"}, 
          ${companyId}, 
          ${payload.companyName}, 
          ${payload.companyGstin.toUpperCase()}
        );
      `;

      const newUser = {
        id: userId,
        userId: payload.userId.trim(),
        fullName: payload.fullName.trim(),
        email: payload.email.trim(),
        role: payload.role || "Taxpayer",
        companyId,
        companyName: payload.companyName,
        companyGstin: payload.companyGstin.toUpperCase(),
        createdAt: new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        user: newUser,
        token: `neon_session_${userId}_${Date.now()}`,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
