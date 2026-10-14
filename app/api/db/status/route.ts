import { NextResponse } from "next/server";
import { sql } from "@/lib/db/neon";

export async function GET() {
  if (!sql) {
    return NextResponse.json(
      { connected: false, message: "DATABASE_URL not configured" },
      { status: 503 }
    );
  }

  try {
    const startTime = Date.now();
    const versionRes = await sql`SELECT version();`;
    const latency = Date.now() - startTime;

    const [userCount] = await sql`SELECT count(*) FROM users;`;
    const [companyCount] = await sql`SELECT count(*) FROM companies;`;
    const [transCount] = await sql`SELECT count(*) FROM transporters;`;
    const [itemCount] = await sql`SELECT count(*) FROM items;`;
    const [draftCount] = await sql`SELECT count(*) FROM drafts;`;
    const [historyCount] = await sql`SELECT count(*) FROM export_history;`;

    return NextResponse.json({
      connected: true,
      provider: "Neon Serverless PostgreSQL",
      latencyMs: latency,
      version: versionRes[0]?.version || "PostgreSQL 18+",
      stats: {
        users: Number(userCount.count),
        companies: Number(companyCount.count),
        transporters: Number(transCount.count),
        items: Number(itemCount.count),
        drafts: Number(draftCount.count),
        history: Number(historyCount.count),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        connected: false,
        error: error.message || "Failed to query Neon PostgreSQL",
      },
      { status: 500 }
    );
  }
}
