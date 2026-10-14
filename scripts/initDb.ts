import { neon } from "@neondatabase/serverless";
import * as fs from "fs";
import * as path from "path";

// Read DATABASE_URL from .env.local if not already in process.env
let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const match = line.match(/^\s*DATABASE_URL\s*=\s*["']?(.*?)["']?\s*$/);
      if (match) {
        databaseUrl = match[1];
        break;
      }
    }
  }
}

if (!databaseUrl) {
  console.error("❌ ERROR: DATABASE_URL is not found in process.env or .env.local");
  process.exit(1);
}

const sql = neon(databaseUrl);

async function initializeDatabase() {
  console.log("🚀 Connecting to Neon PostgreSQL...");

  try {
    // 1. Users Table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) UNIQUE NOT NULL,
        full_name VARCHAR(128) NOT NULL,
        email VARCHAR(128) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(32) NOT NULL DEFAULT 'Taxpayer',
        company_id VARCHAR(64),
        company_name VARCHAR(255),
        company_gstin VARCHAR(15),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMPTZ
      );
    `;
    console.log("✅ Users table verified");

    // 2. Companies Table
    await sql`
      CREATE TABLE IF NOT EXISTS companies (
        id VARCHAR(64) PRIMARY KEY,
        legal_name VARCHAR(255) NOT NULL,
        trade_name VARCHAR(255) NOT NULL,
        gstin VARCHAR(15) NOT NULL,
        address1 TEXT NOT NULL,
        address2 TEXT,
        place VARCHAR(128) NOT NULL,
        pincode VARCHAR(10) NOT NULL,
        state_code INTEGER NOT NULL,
        phone VARCHAR(32),
        email VARCHAR(128),
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log("✅ Companies table verified");

    // 3. Transporters Table
    await sql`
      CREATE TABLE IF NOT EXISTS transporters (
        id VARCHAR(64) PRIMARY KEY,
        transporter_id VARCHAR(32) NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(32),
        email VARCHAR(128),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log("✅ Transporters table verified");

    // 4. Items Table
    await sql`
      CREATE TABLE IF NOT EXISTS items (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        hsn_code VARCHAR(32) NOT NULL,
        unit VARCHAR(16) NOT NULL,
        default_gst_rate NUMERIC(6, 2) NOT NULL DEFAULT 18,
        cess_rate NUMERIC(6, 2) DEFAULT 0,
        cess_nonadvol NUMERIC(10, 2) DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log("✅ Items table verified");

    // 5. Drafts Table
    await sql`
      CREATE TABLE IF NOT EXISTS drafts (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        company_id VARCHAR(64),
        bill_data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log("✅ Drafts table verified");

    // 6. Export History Table
    await sql`
      CREATE TABLE IF NOT EXISTS export_history (
        id VARCHAR(64) PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        company_gstin VARCHAR(15) NOT NULL,
        invoice_count INTEGER NOT NULL,
        invoice_numbers TEXT[] NOT NULL,
        total_value NUMERIC(14, 2) NOT NULL,
        total_tax NUMERIC(14, 2) NOT NULL,
        schema_version VARCHAR(32) NOT NULL,
        json_payload TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log("✅ Export History table verified");

    // Seed default seed data if empty
    const userCount = await sql`SELECT count(*) FROM users;`;
    if (Number(userCount[0].count) === 0) {
      console.log("🌱 Seeding default user accounts...");
      await sql`
        INSERT INTO users (id, user_id, full_name, email, password_hash, role, company_id, company_name, company_gstin)
        VALUES
          ('user-vishu', 'vishu.rohilla', 'Vishu Rohilla (Lead Developer)', 'vishu@fintax.in', 'fintax123', 'Admin', 'comp-1', 'Fin Tax Solutions Pvt Ltd', '07AAACF1234D1Z8'),
          ('user-admin', 'accounts_admin', 'Senior Accounts Manager', 'accounts@fintax.in', 'fintax123', 'Accountant', 'comp-1', 'Fin Tax Solutions Pvt Ltd', '07AAACF1234D1Z8'),
          ('user-mumbai', 'taxpayer_mumbai', 'Rohilla Logistics Head', 'mumbai@rohilla.com', 'fintax123', 'Taxpayer', 'comp-2', 'Rohilla Logistics & Manufacturing Co.', '27AABCR9988E1Z4')
        ON CONFLICT (id) DO NOTHING;
      `;
    }

    const companyCount = await sql`SELECT count(*) FROM companies;`;
    if (Number(companyCount[0].count) === 0) {
      console.log("🌱 Seeding default companies...");
      await sql`
        INSERT INTO companies (id, legal_name, trade_name, gstin, address1, address2, place, pincode, state_code, phone, email, is_default)
        VALUES
          ('comp-1', 'Fin Tax Solutions Pvt Ltd', 'Fin Tax Technologies', '07AAACF1234D1Z8', 'Plot No. 45, Barakhamba Road', 'Connaught Place', 'New Delhi', '110001', 7, '+91 9876543210', 'billing@fintax.in', true),
          ('comp-2', 'Rohilla Logistics & Manufacturing Co.', 'Rohilla Industries', '27AABCR9988E1Z4', 'Gala No 12, Phase 2, MIDC Industrial Area', 'Andheri East', 'Mumbai', '400093', 27, '+91 9811223344', 'dispatch@rohilla-industries.com', false)
        ON CONFLICT (id) DO NOTHING;
      `;
    }

    const transporterCount = await sql`SELECT count(*) FROM transporters;`;
    if (Number(transporterCount[0].count) === 0) {
      console.log("🌱 Seeding default transporters...");
      await sql`
        INSERT INTO transporters (id, transporter_id, name, phone, email)
        VALUES
          ('trans-1', '07AAACT2345K1Z9', 'Delhi Super Fast Roadlines', '+91 9811001122', 'booking@delhisuperfast.com'),
          ('trans-2', '27AABCT9988M1Z2', 'Western Express Cargo Logistics', '+91 9822334455', 'ops@westernexpress.com')
        ON CONFLICT (id) DO NOTHING;
      `;
    }

    const itemCount = await sql`SELECT count(*) FROM items;`;
    if (Number(itemCount[0].count) === 0) {
      console.log("🌱 Seeding default items...");
      await sql`
        INSERT INTO items (id, name, description, hsn_code, unit, default_gst_rate)
        VALUES
          ('item-1', 'Industrial Motor 5HP', 'Three phase industrial induction motor', '8501', 'NOS', 18),
          ('item-2', 'Mild Steel Sheet 2mm', 'Hot rolled mild steel structural sheet', '7208', 'KGS', 18),
          ('item-3', 'Brass Hardware Fasteners', 'Hex bolts, nuts, and precision washers', '7415', 'KGS', 12)
        ON CONFLICT (id) DO NOTHING;
      `;
    }

    console.log("🎉 NEON DATABASE INITIALIZATION COMPLETE!");
    const testResult = await sql`SELECT version();`;
    console.log("Connected PostgreSQL Version:", testResult[0].version);
  } catch (error) {
    console.error("❌ Database initialization error:", error);
    process.exit(1);
  }
}

initializeDatabase();
