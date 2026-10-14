# Fin Tax E-Way Bill Generator

A professional, production-ready web application for generating official Indian Goods and Services Tax (GST) **Electronic Way Bill (E-Way Bill) Bulk JSON** payloads, fully compatible with the National Informatics Centre (NIC) bulk upload portal ([ewaybillgst.gov.in](https://ewaybillgst.gov.in)).

> **Software Developed by Vishu Rohilla**  
> *Fin Tax Technologies • Enterprise Accounting & Taxation Suite*

---

## 📌 Main Objective & Regulatory Compliance

Under Indian GST rules, registered taxpayers and logistics providers transporting goods valuing over ₹50,000 are required to carry an E-Way Bill.

**Fin Tax E-Way Bill Generator** enables businesses, accountants, and transporters to generate official, schema-validated bulk JSON files (`.json`) from:
1. An interactive, intelligent **Single Invoice Form**
2. A **Bulk Batch Queue** combining multiple invoices into one consolidated file
3. A high-speed **Excel / CSV Import Tool** that automatically groups line items by invoice number

> [!IMPORTANT]
> **Manual Portal Upload Requirement:** In accordance with official Indian GST IT security policies, this software **never** automates taxpayer login, stores user passwords, or bypasses CAPTCHA / 2-Factor Authentication (2FA). Users manually upload the generated JSON file to the official government portal (`ewaybillgst.gov.in ➔ E-Waybill ➔ Generate Bulk`) to receive official 12-digit E-Way Bill numbers.

---

## 🚀 Key Features

### 1. Modern Accounting-Grade Dashboard
- **Overview KPIs:** Active taxpayer entity, total exported invoices, total assessable cargo value, and saved drafts.
- **Dark Navigation Sidebar:** Fast access to Transactions, Masters, Settings, and Official Guidelines.
- **Active Company Indicator:** Switch between multiple registered GSTINs with one click.

### 2. Intelligent Invoice & Transport Details Form
- **Transaction Types:**
  - Type 1: Regular (Direct supply)
  - Type 2: Bill To - Ship To
  - Type 3: Bill From - Dispatch From (Godown / Factory movement)
  - Type 4: Combination of 2 & 3
- **Auto-Fill & Master Integration:**
  - 1-click fill from active company profile
  - 1-click select from Item Catalog and Transporter Master
  - State code auto-extraction from 15-digit GSTIN prefix
- **Multi-Item Line Table:** Add unlimited products per invoice with individual HSN codes, quantities, and GST rates.
- **Transportation Details (Part B):**
  - Road, Rail, Air, and Ship modes
  - Indian vehicle registration format verification (`DL01AB1234`)
  - Transporter ID / TRANSIN validation
  - Distance (KM) threshold checks

### 3. Automatic Tax Calculation Engine
- **Intra-State vs. Inter-State Auto-Apportionment:** Automatically checks actual dispatch state vs. actual destination state.
  - *Intra-State:* Splits total rate equally into **CGST** and **SGST**; sets IGST to 0.
  - *Inter-State / Export / Import:* Applies **IGST**; sets CGST and SGST to 0.
- **Real-Time Header Reconciliation:** Dynamically calculates total taxable amount, applicable taxes, cess, other charges, and total invoice value (`totInvValue`).
- **Rounding Tolerance Guard:** Verifies that header totals match line item sums within configurable tolerance.

### 4. Official NIC Portal Bulk JSON Generation Engine
- Strict conformity to the official NIC bulk upload JSON schema:
  ```json
  {
    "version": "1.0.1118",
    "billLists": [
      {
        "userGstin": "07AAACF1234D1Z8",
        "supplyType": "O",
        "subSupplyType": 1,
        "docType": "INV",
        "docNo": "INV-2026/01",
        "docDate": "14/10/2026",
        "transType": 1,
        "fromGstin": "07AAACF1234D1Z8",
        "fromTrdName": "Fin Tax Solutions Pvt Ltd",
        "fromAddr1": "Plot No. 45, Barakhamba Road",
        "fromPlace": "New Delhi",
        "fromPincode": 110001,
        "actFromStateCode": 7,
        "fromStateCode": 7,
        "toGstin": "27AABCR9988E1Z4",
        "toTrdName": "Rohilla Logistics Mumbai",
        "toAddr1": "Gala 12, MIDC Industrial Area",
        "toPlace": "Mumbai",
        "toPincode": 400093,
        "actToStateCode": 27,
        "toStateCode": 27,
        "totalValue": 45000.0,
        "cgstValue": 0.0,
        "sgstValue": 0.0,
        "igstValue": 8100.0,
        "cessValue": 0.0,
        "cessNonAdvolValue": 0.0,
        "otherValue": 0.0,
        "totInvValue": 53100.0,
        "transMode": "1",
        "transDistance": "1420",
        "vehicleNo": "DL01AB1234",
        "vehicleType": "R",
        "itemList": [
          {
            "itemNo": 1,
            "productName": "Industrial Power Cable 4-Core",
            "hsnCode": 85444990,
            "quantity": 100,
            "qtyUnit": "MTR",
            "cgstRate": 0,
            "sgstRate": 0,
            "igstRate": 18,
            "cessRate": 0,
            "taxableAmount": 45000.0
          }
        ]
      }
    ]
  }
  ```
- **Live JSON Preview Modal:** Instant code viewer, copy-to-clipboard, and direct file download (`.json`).
- **Comprehensive Validation Report:** Field-specific callouts before allowing download.

### 5. Excel Import & Processing Tool
- **Downloadable `.xlsx` Template:** Includes official column headers and valid sample entries.
- **Smart Column Matching:** Handles shorthand and standard column titles.
- **Multi-Item Line Grouping:** Automatically merges spreadsheet rows sharing the same document number into a single multi-item invoice.
- **Row-Level Error Audit:** Displays invalid fields and missing columns before export.

### 6. Masters & Data Management
- **Company Master:** Maintain multiple legal entities, branch godowns, and GSTINs.
- **Transporter Master:** Store fleet operators and 15-character TRANSIN / GSTIN codes.
- **Item & HSN Master:** Product catalog with HSN codes, UQC units, and default GST rates.
- **Saved Drafts:** Save and resume incomplete invoices anytime.
- **Export Audit History:** Review previous exports and re-download JSON files.
- **Settings:** Configure schema version (`1.0.1118`, `1.0.0421`, `1.0.0123`), rounding tolerance, and defaults.

---

## 🛠️ Technology Stack & Architecture

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5.7+ (Strict mode)
- **Styling:** Tailwind CSS + Lucide Icons
- **Spreadsheet Engine:** SheetJS (`xlsx`)
- **Architecture Layers:**
  - `lib/types/ewayBill.ts` – Official schema contracts and interfaces
  - `lib/constants/gstData.ts` – State codes, units, document codes, rates
  - `lib/engine/calculator.ts` – Mathematical tax calculation & auto-split engine
  - `lib/engine/validator.ts` – Official NIC portal business rule validation
  - `lib/engine/jsonGenerator.ts` – Bulk schema serialization & download engine
  - `lib/engine/excelParser.ts` – Template generation & spreadsheet parser
  - `lib/storage/store.ts` – Local persistence repository with demo presets
  - `components/views/` – Modular application views

---

## 🧪 Comprehensive Verification & Test Suite

The test suite validates the calculation engine, validation guardrails, and JSON structure against official portal specifications.

To run the automated test suite:
```bash
npm test
```

### Verified Test Cases:
1. **Intra-state Supply (Delhi -> Delhi):** Correct 50/50 CGST & SGST apportionment, IGST = 0.
2. **Inter-state Supply (Delhi -> Maharashtra):** IGST applied, CGST & SGST = 0.
3. **Multi-Item Invoice:** Mixed 5%, 12%, 18% GST rates and Cess properly summed into header values.
4. **Missing Mandatory Fields:** Enforces presence of Document Number, Date, Vehicle Details, and Line Items.
5. **GSTIN State Code Match:** Catches discrepancies between the GSTIN 2-digit prefix and declared state code.
6. **Vehicle Registration Validation:** Rejects malformed vehicle registration strings.
7. **Invoice Total Mismatch Guard:** Flags deviations between line items and header totals.
8. **Consolidated Bulk JSON:** Verifies multi-invoice batch serialization under the official `billLists` array.

---

## 📋 Official Portal Upload Instructions

1. Generate and download your `.json` file from Fin Tax.
2. Open the official E-Way Bill portal: [https://ewaybillgst.gov.in](https://ewaybillgst.gov.in).
3. Sign in using your registered taxpayer username, password, and 2FA credentials.
4. Go to **E-Waybill ➔ Generate Bulk** in the left sidebar menu.
5. Click **Choose File**, select the downloaded `.json` file, and click **Upload & Generate**.
6. The NIC portal validates the file and issues official 12-digit E-Way Bill numbers.

---

## 👨‍💻 Author & Credits

**Fin Tax E-Way Bill Generator**  
Developed by **Vishu Rohilla**  
*Release 2026.1 • Production Ready*
