import * as XLSX from "xlsx";
import { CompanyProfile, EWayBillDocument, EWayBillItem } from "../types/ewayBill";
import { recalculateBill } from "./calculator";
import { validateEWayBill } from "./validator";

export interface ParsedExcelResult {
  bills: EWayBillDocument[];
  totalRows: number;
  totalInvoices: number;
  validInvoices: number;
  invalidInvoices: number;
  rowErrors: { row: number; invoiceNo: string; message: string }[];
}

export function generateExcelTemplate(): Uint8Array {
  const headers = [
    "Doc No",
    "Doc Date (DD/MM/YYYY)",
    "Doc Type (INV/BIL/CHL)",
    "Supply Type (O/I)",
    "Sub Supply Type (1-12)",
    "Transaction Type (1-4)",
    "From GSTIN",
    "From Legal/Trade Name",
    "From Address 1",
    "From Address 2",
    "From Place",
    "From Pincode",
    "From State Code",
    "Actual Dispatch State Code",
    "To GSTIN",
    "To Legal/Trade Name",
    "To Address 1",
    "To Address 2",
    "To Place",
    "To Pincode",
    "To State Code",
    "Actual Ship-To State Code",
    "Item Name",
    "Item Description",
    "HSN Code",
    "Quantity",
    "Unit (NOS/KGS/BOX)",
    "Taxable Amount (Rs)",
    "CGST Rate (%)",
    "SGST Rate (%)",
    "IGST Rate (%)",
    "Cess Rate (%)",
    "Other Charges (Rs)",
    "Transport Mode (1:Road, 2:Rail, 3:Air, 4:Ship)",
    "Distance (KM)",
    "Transporter ID",
    "Transporter Name",
    "Vehicle No",
    "Vehicle Type (R/O)",
    "Transport Doc No",
    "Transport Doc Date",
  ];

  const sampleRows = [
    [
      "INV-2026-001",
      "14/10/2026",
      "INV",
      "O",
      1,
      1,
      "07AAAAA0000A1Z5",
      "Fin Tax Enterprises Ltd",
      "Plot 42, Okhla Industrial Area Phase 3",
      "Near Metro Station",
      "New Delhi",
      110020,
      7,
      7,
      "07BBBBB1111B1Z2",
      "Apex Technologies Pvt Ltd",
      "B-14, Connaught Place",
      "Barakhamba Road",
      "New Delhi",
      110001,
      7,
      7,
      "Industrial Control Valves",
      "High pressure brass valve 25mm",
      84818030,
      10,
      "NOS",
      50000,
      9,
      9,
      0,
      0,
      0,
      "1",
      25,
      "",
      "",
      "DL01AB1234",
      "R",
      "",
      "",
    ],
    [
      "INV-2026-001",
      "14/10/2026",
      "INV",
      "O",
      1,
      1,
      "07AAAAA0000A1Z5",
      "Fin Tax Enterprises Ltd",
      "Plot 42, Okhla Industrial Area Phase 3",
      "Near Metro Station",
      "New Delhi",
      110020,
      7,
      7,
      "07BBBBB1111B1Z2",
      "Apex Technologies Pvt Ltd",
      "B-14, Connaught Place",
      "Barakhamba Road",
      "New Delhi",
      110001,
      7,
      7,
      "Pipe Flanges 25mm",
      "Stainless steel pipe fittings",
      73072100,
      20,
      "NOS",
      20000,
      9,
      9,
      0,
      0,
      0,
      "1",
      25,
      "",
      "",
      "DL01AB1234",
      "R",
      "",
      "",
    ],
    [
      "INV-2026-002",
      "14/10/2026",
      "INV",
      "O",
      1,
      1,
      "07AAAAA0000A1Z5",
      "Fin Tax Enterprises Ltd",
      "Plot 42, Okhla Industrial Area Phase 3",
      "",
      "New Delhi",
      110020,
      7,
      7,
      "27CCCCC2222C1Z9",
      "Maharastra Logistics & Distribution",
      "Plot 88, MIDC Industrial Estate",
      "Andheri East",
      "Mumbai",
      400093,
      27,
      27,
      "Electric Motors 5HP",
      "Three-phase AC induction motors",
      85015210,
      5,
      "NOS",
      125000,
      0,
      0,
      18,
      0,
      500,
      "1",
      1420,
      "27AABCT3928D1ZQ",
      "Safexpress Logistics",
      "MH04AB5678",
      "R",
      "LR-89324",
      "14/10/2026",
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

  // Adjust column widths
  ws["!cols"] = headers.map(() => ({ wch: 22 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "EWayBill_Bulk_Template");

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Uint8Array(wbout);
}

function parseFormattedDate(val: any): string {
  if (!val) return "";
  const str = String(val).trim();
  if (
    typeof val === "number" ||
    (!str.includes("/") && !str.includes("-") && !isNaN(Number(str)))
  ) {
    const num = Math.floor(Number(str));
    if (num > 1000) {
      const parsed = XLSX.SSF.parse_date_code(num);
      if (parsed) {
        return `${String(parsed.d).padStart(2, "0")}/${String(
          parsed.m
        ).padStart(2, "0")}/${parsed.y}`;
      }
    }
  }

  // DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    return str;
  }

  // DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
    return str.replace(/-/g, "/");
  }

  // YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ymdMatch) {
    return `${String(ymdMatch[3]).padStart(2, "0")}/${String(
      ymdMatch[2]
    ).padStart(2, "0")}/${ymdMatch[1]}`;
  }

  // DD-Mon-YY or DD-Mon-YYYY (e.g. 14-Oct-26 or 14-Oct-2026)
  const dMonY = str.match(/^(\d{1,2})[-/ ]([A-Za-z]{3,9})[-/ ](\d{2,4})$/);
  if (dMonY) {
    const day = parseInt(dMonY[1], 10);
    const monStr = dMonY[2].toLowerCase();
    const months: Record<string, number> = {
      jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
      jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
    };
    const m = months[monStr.substring(0, 3)] || 1;
    let y = parseInt(dMonY[3], 10);
    if (y < 100) y += 2000;
    return `${String(day).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
  }

  return str;
}

export function isTallyInvoiceSheet(grid: any[][]): boolean {
  if (!grid || grid.length < 5) return false;
  let text = "";
  for (let r = 0; r < Math.min(grid.length, 25); r++) {
    text += " " + grid[r].map((c) => String(c || "")).join(" ").toLowerCase();
  }
  const hasInvoiceNo = text.includes("invoice no");
  const hasBuyerOrConsignee =
    text.includes("buyer") || text.includes("consignee");
  const hasTaxInvoice = text.includes("tax invoice");
  const hasDescription =
    text.includes("description of") || text.includes("goods and services");

  return (
    (hasInvoiceNo || hasTaxInvoice) && (hasBuyerOrConsignee || hasDescription)
  );
}

export function parseTallyInvoiceGrid(
  grid: any[][],
  defaultUserGstin?: string,
  defaultFromPin?: number
): EWayBillDocument | null {
  let docNo = "";
  let docDate = "";
  let fromTrdName = "";
  let fromAddr1 = "";
  let fromAddr2 = "";
  let fromPlace = "";
  let fromGstin = "";
  let fromStateCode = 0;
  let fromPincode = defaultFromPin || 0;

  let toTrdName = "";
  let toAddr1 = "";
  let toAddr2 = "";
  let toPlace = "";
  let toGstin = "";
  let toStateCode = 0;
  let toPincode = 0;

  // Scan first 25 rows for document metadata & header fields
  for (let r = 0; r < Math.min(grid.length, 25); r++) {
    const row = grid[r];
    for (let c = 0; c < row.length; c++) {
      const cell = String(row[c] || "").trim();

      if (/^invoice\s*no\.?$/i.test(cell)) {
        if (r + 1 < grid.length && grid[r + 1][c]) {
          docNo = String(grid[r + 1][c]).trim();
        } else if (c + 1 < row.length && row[c + 1]) {
          docNo = String(row[c + 1]).trim();
        }
      }

      if (/^dated$/i.test(cell)) {
        if (r + 1 < grid.length && grid[r + 1][c]) {
          docDate = parseFormattedDate(grid[r + 1][c]);
        } else if (c + 1 < row.length && row[c + 1]) {
          docDate = parseFormattedDate(row[c + 1]);
        }
      }

      if (/gstin/i.test(cell) && r < 10) {
        const match = cell.match(
          /([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})/i
        );
        if (match && !fromGstin) {
          fromGstin = match[1].toUpperCase();
          if (!fromStateCode)
            fromStateCode = parseInt(fromGstin.substring(0, 2), 10);
        }
      }

      if (/state\s*name/i.test(cell) && r < 10) {
        const match = cell.match(/code\s*:\s*(\d+)/i);
        if (match && !fromStateCode) fromStateCode = parseInt(match[1], 10);
      }
    }
  }

  // Seller Details in column 0 of rows 2-6
  const sellerLines: string[] = [];
  for (let r = 2; r <= 6; r++) {
    if (grid[r] && grid[r][0]) {
      const val = String(grid[r][0]).trim();
      if (
        !val.toLowerCase().startsWith("gstin") &&
        !val.toLowerCase().startsWith("state") &&
        !val.toLowerCase().startsWith("contact")
      ) {
        sellerLines.push(val);
      }
    }
  }
  if (sellerLines.length > 0) {
    fromTrdName = sellerLines[0];
    fromAddr1 = sellerLines[1] || "";
    fromAddr2 = sellerLines[2] || "";
    fromPlace = sellerLines[3] || sellerLines[2] || sellerLines[1] || "";
  }

  sellerLines.forEach((line) => {
    const pinMatch = line.match(/\b(\d{6})\b/);
    if (pinMatch && !fromPincode) {
      fromPincode = parseInt(pinMatch[1], 10);
    }
  });

  // Buyer / Consignee blocks
  for (let r = 7; r < Math.min(grid.length, 22); r++) {
    const row = grid[r];
    const cell0 = String(row[0] || "").trim();

    if (/^consignee|^buyer/i.test(cell0)) {
      for (let subR = r + 1; subR < Math.min(r + 8, grid.length); subR++) {
        const subRow = grid[subR];
        const val0 = String(subRow[0] || "").trim();
        const fullRowStr = subRow
          .map((x) => String(x || "").trim())
          .join(" ");

        if (
          !toTrdName &&
          val0 &&
          !val0.toLowerCase().startsWith("gstin") &&
          !val0.toLowerCase().startsWith("state")
        ) {
          toTrdName = val0;
          continue;
        }

        if (
          toTrdName &&
          !toAddr1 &&
          val0 &&
          !val0.toLowerCase().startsWith("gstin") &&
          !val0.toLowerCase().startsWith("state")
        ) {
          toAddr1 = val0;
          const pinMatch = val0.match(/\b(\d{6})\b/);
          if (pinMatch) toPincode = parseInt(pinMatch[1], 10);
          const parts = val0.split(",").map((s) => s.trim()).filter(Boolean);
          if (parts.length >= 3) {
            toPlace = parts[parts.length - 3] || parts[parts.length - 2];
          } else if (parts.length >= 2) {
            toPlace = parts[parts.length - 2];
          }
          continue;
        }

        const gstinMatch = fullRowStr.match(
          /([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})/i
        );
        if (gstinMatch && !toGstin) {
          toGstin = gstinMatch[1].toUpperCase();
          if (!toStateCode) toStateCode = parseInt(toGstin.substring(0, 2), 10);
        }

        const stateMatch = fullRowStr.match(/code\s*:\s*(\d+)/i);
        if (stateMatch && !toStateCode) {
          toStateCode = parseInt(stateMatch[1], 10);
        }
      }
    }
  }

  // Fallback for supplier PIN if omitted in printed header
  if (!fromPincode) {
    if (fromPlace.toLowerCase().includes("saharanpur")) fromPincode = 247001;
    else if (fromStateCode === 9) fromPincode = 201301;
    else fromPincode = 110001;
  }

  // Extract HSN tax rates summary
  const hsnRates = new Map<string, number>();
  for (let r = 25; r < grid.length; r++) {
    const row = grid[r];
    const val0 = String(row[0] || "").trim();
    if (/^\d{4,8}$/.test(val0)) {
      for (let c = 1; c < row.length; c++) {
        const cVal = String(row[c] || "").trim();
        if (cVal.endsWith("%")) {
          const rateNum = parseFloat(cVal);
          if (!isNaN(rateNum)) hsnRates.set(val0, rateNum);
        } else if (Number(cVal) > 0 && Number(cVal) < 1) {
          hsnRates.set(val0, Math.round(Number(cVal) * 100));
        }
      }
    }
  }

  // Find line items table header
  let itemHeaderRow = -1;
  let hsnCol = -1;
  let descCol = -1;
  let qtyCol = -1;
  let unitCol = -1;
  let amountCol = -1;

  for (let r = 15; r < 25; r++) {
    const row = grid[r];
    for (let c = 0; c < row.length; c++) {
      const cell = String(row[c] || "").trim().toLowerCase();
      if (cell.includes("description") || cell.includes("goods and services")) {
        itemHeaderRow = r;
        descCol = c;
      }
      if (cell.includes("hsn")) hsnCol = c;
      if (cell === "quantity" || cell === "qty") qtyCol = c;
      if (cell === "per" || cell === "unit") unitCol = c;
      if (cell === "amount") amountCol = c;
    }
    if (itemHeaderRow !== -1 && hsnCol !== -1) break;
  }

  if (itemHeaderRow === -1 || !docNo) {
    return null;
  }

  const items: EWayBillItem[] = [];
  let declaredRoundOff = 0;
  let declaredIgst = 0;
  let declaredCgst = 0;
  let declaredSgst = 0;
  let declaredTotalInv = 0;

  for (let r = itemHeaderRow + 1; r < grid.length; r++) {
    const row = grid[r];
    const col0 = String(row[0] || "").trim();
    const fullRowStr = row.map((x) => String(x || "").trim()).join(" ");
    const lowerRow = fullRowStr.toLowerCase();

    // Check for end of items table (Total row or Amount Chargeable or HSN/SAC table)
    const isTotalRow = row.some((c: any) => {
      const s = String(c || "").trim().toLowerCase();
      return s === "total";
    });

    if (
      isTotalRow ||
      lowerRow.includes("amount chargeable") ||
      lowerRow.includes("hsn/sac")
    ) {
      const amtMatch = row[amountCol] || row[row.length - 1];
      if (amtMatch && !isNaN(Number(amtMatch)) && Number(amtMatch) > 0) {
        declaredTotalInv = Number(amtMatch);
      }
      break;
    }

    // Check if it's a Round Off row
    if (lowerRow.includes("round off") || lowerRow.includes("roundoff")) {
      const amt =
        amountCol !== -1 ? Number(row[amountCol]) : Number(row[row.length - 1]);
      if (!isNaN(amt)) {
        declaredRoundOff = amt;
      }
      continue;
    }

    // Check if it's a Tax Ledger row (IGST, CGST, SGST)
    if (lowerRow.includes("igst")) {
      const amt =
        amountCol !== -1 ? Number(row[amountCol]) : Number(row[row.length - 1]);
      if (!isNaN(amt) && amt > 0) declaredIgst = amt;
      continue;
    }
    if (lowerRow.includes("cgst")) {
      const amt =
        amountCol !== -1 ? Number(row[amountCol]) : Number(row[row.length - 1]);
      if (!isNaN(amt) && amt > 0) declaredCgst = amt;
      continue;
    }
    if (lowerRow.includes("sgst")) {
      const amt =
        amountCol !== -1 ? Number(row[amountCol]) : Number(row[row.length - 1]);
      if (!isNaN(amt) && amt > 0) declaredSgst = amt;
      continue;
    }

    // Regular item with serial number in col 0
    if (/^\d+$/.test(col0)) {
      const desc = descCol !== -1 ? String(row[descCol] || "").trim() : "";
      const hsn = hsnCol !== -1 ? String(row[hsnCol] || "").trim() : "";
      const qty = qtyCol !== -1 ? Number(row[qtyCol]) || 1 : 1;
      let unit =
        unitCol !== -1 ? String(row[unitCol] || "NOS").trim().toUpperCase() : "NOS";
      if (unit === "PC") unit = "PCS";
      const amt = amountCol !== -1 ? Number(row[amountCol]) || 0 : 0;

      const gstRate = hsnRates.get(hsn) || 18;

      items.push({
        itemNo: items.length + 1,
        productName: desc || "Goods",
        productDesc: desc,
        hsnCode: hsn,
        quantity: qty,
        qtyUnit: unit,
        taxableAmount: amt,
        cgstRate: 0,
        sgstRate: 0,
        igstRate: gstRate,
        cessRate: 0,
      });
      continue;
    }

    // Additional taxable ledger / service row (e.g. FREIGHT & CARTAGE (GST))
    let itemDesc = "";
    let itemHsn = "";
    let itemAmt = amountCol !== -1 ? Number(row[amountCol]) || 0 : 0;

    for (let c = 0; c < row.length; c++) {
      const cellStr = String(row[c] || "").trim();
      if (!cellStr) continue;

      if (/^\d{4,8}$/.test(cellStr)) {
        itemHsn = cellStr;
      } else if (
        c !== amountCol &&
        isNaN(Number(cellStr)) &&
        cellStr.length > 2
      ) {
        if (!itemDesc) itemDesc = cellStr;
      }
    }

    if (itemAmt > 0 && (itemDesc || itemHsn)) {
      const gstRate = (itemHsn ? hsnRates.get(itemHsn) : undefined) || 18;

      items.push({
        itemNo: items.length + 1,
        productName: itemDesc || "Freight / Additional Charges",
        productDesc: itemDesc || "Freight / Additional Charges",
        hsnCode: itemHsn || "996511",
        quantity: 1,
        qtyUnit: "OTH",
        taxableAmount: itemAmt,
        cgstRate: 0,
        sgstRate: 0,
        igstRate: gstRate,
        cessRate: 0,
      });
    }
  }

  if (items.length === 0) return null;

  return {
    userGstin: defaultUserGstin || fromGstin,
    supplyType: "O",
    subSupplyType: 1,
    docType: "INV",
    docNo,
    docDate: docDate || "14/10/2026",
    transType: 1,

    fromGstin,
    fromTrdName,
    fromAddr1,
    fromAddr2,
    fromPlace,
    fromPincode,
    actFromStateCode: fromStateCode,
    fromStateCode,

    toGstin,
    toTrdName,
    toAddr1,
    toAddr2,
    toPlace: toPlace || "Dehradun",
    toPincode,
    actToStateCode: toStateCode,
    toStateCode,

    totalValue: 0,
    cgstValue: 0,
    sgstValue: 0,
    igstValue: 0,
    cessValue: 0,
    cessNonAdvolValue: 0,
    otherValue: declaredRoundOff,
    totInvValue: declaredTotalInv || 0,

    transDistance: 100,
    transMode: "1",
    vehicleType: "R",

    itemList: items,
  };
}

function findHeaderRowIndex(grid: any[][]): number {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  for (let r = 0; r < Math.min(grid.length, 15); r++) {
    const row = grid[r];
    for (const cell of row) {
      const norm = normalize(String(cell || ""));
      if (
        norm === "docno" ||
        norm === "documentno" ||
        norm === "invoiceno" ||
        norm === "invno" ||
        norm === "invoicenumber"
      ) {
        return r;
      }
    }
  }
  return -1;
}

export function parseExcelFile(
  data: ArrayBuffer,
  defaultCompanyOrGstin?: Partial<CompanyProfile> | string
): ParsedExcelResult {
  const wb = XLSX.read(data, { type: "array" });
  const rowErrors: { row: number; invoiceNo: string; message: string }[] = [];
  const billsMap = new Map<string, EWayBillDocument>();

  const defaultUserGstin =
    typeof defaultCompanyOrGstin === "string"
      ? defaultCompanyOrGstin
      : defaultCompanyOrGstin?.gstin || "";

  const defaultFromPin =
    typeof defaultCompanyOrGstin === "object"
      ? Number(defaultCompanyOrGstin?.pincode) || undefined
      : undefined;

  let totalRawRows = 0;

  // 1. Check if any sheet is a Tally Tax Invoice format
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const grid: any[][] = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      defval: "",
    });
    totalRawRows += grid.length;

    if (isTallyInvoiceSheet(grid)) {
      const tallyBill = parseTallyInvoiceGrid(
        grid,
        defaultUserGstin,
        defaultFromPin
      );
      if (tallyBill) {
        billsMap.set(tallyBill.docNo, tallyBill);
      }
    }
  }

  // 2. If no Tally invoices found, proceed with Tabular bulk import
  if (billsMap.size === 0) {
    const normalizeKey = (key: string) =>
      key.toLowerCase().replace(/[^a-z0-9]/g, "");

    let hasFoundAnyHeaders = false;

    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      const grid: any[][] = XLSX.utils.sheet_to_json(ws, {
        header: 1,
        defval: "",
      });

      const headerIdx = findHeaderRowIndex(grid);
      if (headerIdx === -1) {
        continue;
      }

      hasFoundAnyHeaders = true;
      const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, {
        range: headerIdx,
        defval: "",
      });

      rawRows.forEach((row, idx) => {
        const rowNum = headerIdx + idx + 2;
        const normalizedRow: Record<string, any> = {};
        for (const [k, v] of Object.entries(row)) {
          normalizedRow[normalizeKey(k)] = v;
        }

        const docNo = String(
          normalizedRow["docno"] ||
            normalizedRow["documentno"] ||
            normalizedRow["invoiceno"] ||
            normalizedRow["invno"] ||
            ""
        ).trim();

        if (!docNo) {
          rowErrors.push({
            row: rowNum,
            invoiceNo: "N/A",
            message: "Missing invoice / document number in row.",
          });
          return;
        }

        let docDate = parseFormattedDate(
          normalizedRow["docdate"] ||
            normalizedRow["documentdate"] ||
            normalizedRow["invoicedate"] ||
            ""
        );

        const fromGstin = String(
          normalizedRow["fromgstin"] ||
            normalizedRow["suppliergstin"] ||
            defaultUserGstin ||
            ""
        ).trim().toUpperCase();

        const toGstin = String(
          normalizedRow["togstin"] || normalizedRow["recipientgstin"] || ""
        ).trim().toUpperCase();

        const fromStateCode =
          Number(
            normalizedRow["fromstatecode"] ||
              normalizedRow["fromstate"] ||
              (fromGstin.length >= 2 && !isNaN(Number(fromGstin.substring(0, 2)))
                ? fromGstin.substring(0, 2)
                : 0)
          ) || 0;

        const toStateCode =
          Number(
            normalizedRow["tostatecode"] ||
              normalizedRow["tostate"] ||
              (toGstin.length >= 2 && !isNaN(Number(toGstin.substring(0, 2)))
                ? toGstin.substring(0, 2)
                : 0)
          ) || 0;

        const actFromStateCode =
          Number(
            normalizedRow["actualdispatchstatecode"] ||
              normalizedRow["actfromstatecode"] ||
              fromStateCode
          ) || fromStateCode;

        const actToStateCode =
          Number(
            normalizedRow["actualshiptostatecode"] ||
              normalizedRow["acttostatecode"] ||
              toStateCode
          ) || toStateCode;

        const productName = String(
          normalizedRow["itemname"] ||
            normalizedRow["productname"] ||
            normalizedRow["goodsdesc"] ||
            "Item"
        ).trim();

        const productDesc = String(
          normalizedRow["itemdescription"] ||
            normalizedRow["productdesc"] ||
            productName
        ).trim();

        const hsnCode =
          normalizedRow["hsncode"] || normalizedRow["hsn"] || 0;

        const quantity =
          Number(normalizedRow["quantity"] || normalizedRow["qty"] || 1) || 1;

        const qtyUnit = String(
          normalizedRow["unit"] ||
            normalizedRow["qtyunit"] ||
            normalizedRow["uqc"] ||
            "NOS"
        ).trim().toUpperCase();

        const taxableAmount =
          Number(
            normalizedRow["taxableamount"] ||
              normalizedRow["taxableamountrs"] ||
              normalizedRow["taxablevalue"] ||
              normalizedRow["taxablevaluers"] ||
              normalizedRow["value"] ||
              0
          ) || 0;

        const cgstRate =
          Number(normalizedRow["cgstrate"] || normalizedRow["cgst"] || 0) || 0;
        const sgstRate =
          Number(normalizedRow["sgstrate"] || normalizedRow["sgst"] || 0) || 0;
        const igstRate =
          Number(normalizedRow["igstrate"] || normalizedRow["igst"] || 0) || 0;
        const cessRate =
          Number(normalizedRow["cessrate"] || normalizedRow["cess"] || 0) || 0;

        const otherCharges =
          Number(
            normalizedRow["othercharges"] ||
              normalizedRow["otherchargesrs"] ||
              normalizedRow["othervalue"] ||
              0
          ) || 0;

        const item: EWayBillItem = {
          itemNo: 1,
          productName,
          productDesc,
          hsnCode,
          quantity,
          qtyUnit,
          taxableAmount,
          cgstRate,
          sgstRate,
          igstRate,
          cessRate,
          cessNonadvol: 0,
        };

        if (billsMap.has(docNo)) {
          const existing = billsMap.get(docNo)!;
          item.itemNo = existing.itemList.length + 1;
          existing.itemList.push(item);
        } else {
          const newBill: EWayBillDocument = {
            userGstin: defaultUserGstin || fromGstin,
            supplyType: (String(normalizedRow["supplytype"] || "O").toUpperCase() ===
            "I"
              ? "I"
              : "O") as "O" | "I",
            subSupplyType:
              Number(
                normalizedRow["subsupplytype"] || normalizedRow["subsupply"] || 1
              ) || 1,
            subSupplyDesc: String(normalizedRow["subsupplydesc"] || "").trim(),
            docType: (String(normalizedRow["doctype"] || "INV").toUpperCase() ||
              "INV") as any,
            docNo,
            docDate: docDate || "14/10/2026",
            transType:
              Number(
                normalizedRow["transactiontype"] ||
                  normalizedRow["transtype"] ||
                  1
              ) || 1,

            fromGstin,
            fromTrdName: String(
              normalizedRow["fromlegaltradename"] ||
                normalizedRow["fromname"] ||
                normalizedRow["fromtrdname"] ||
                ""
            ).trim(),
            fromAddr1: String(
              normalizedRow["fromaddress1"] ||
                normalizedRow["fromaddr1"] ||
                normalizedRow["fromaddress"] ||
                ""
            ).trim(),
            fromAddr2: String(
              normalizedRow["fromaddress2"] || normalizedRow["fromaddr2"] || ""
            ).trim(),
            fromPlace: String(
              normalizedRow["fromplace"] || normalizedRow["fromcity"] || ""
            ).trim(),
            fromPincode:
              Number(
                normalizedRow["frompincode"] || normalizedRow["frompin"] || 0
              ) || 0,
            actFromStateCode,
            fromStateCode,

            toGstin,
            toTrdName: String(
              normalizedRow["tolegaltradename"] ||
                normalizedRow["toname"] ||
                normalizedRow["totrdname"] ||
                ""
            ).trim(),
            toAddr1: String(
              normalizedRow["toaddress1"] ||
                normalizedRow["toaddr1"] ||
                normalizedRow["toaddress"] ||
                ""
            ).trim(),
            toAddr2: String(
              normalizedRow["toaddress2"] || normalizedRow["toaddr2"] || ""
            ).trim(),
            toPlace: String(
              normalizedRow["toplace"] || normalizedRow["tocity"] || ""
            ).trim(),
            toPincode:
              Number(
                normalizedRow["topincode"] || normalizedRow["topin"] || 0
              ) || 0,
            actToStateCode,
            toStateCode,

            totalValue: taxableAmount,
            cgstValue: 0,
            sgstValue: 0,
            igstValue: 0,
            cessValue: 0,
            cessNonAdvolValue: 0,
            otherValue: otherCharges,
            totInvValue: 0,

            transporterId: String(
              normalizedRow["transporterid"] || normalizedRow["transid"] || ""
            ).trim(),
            transporterName: String(
              normalizedRow["transportername"] || normalizedRow["transname"] || ""
            ).trim(),
            transMode: String(
              normalizedRow["transportmode"] ||
                normalizedRow["transmode"] ||
                "1"
            ).trim(),
            transDistance:
              Number(
                normalizedRow["distance"] ||
                  normalizedRow["transdistance"] ||
                  100
              ) || 100,
            transDocNo: String(
              normalizedRow["transportdocno"] || normalizedRow["transdocno"] || ""
            ).trim(),
            transDocDate: String(
              normalizedRow["transportdocdate"] ||
                normalizedRow["transdocdate"] ||
                ""
            ).trim(),
            vehicleNo: String(
              normalizedRow["vehicleno"] || normalizedRow["vehiclenumber"] || ""
            ).trim(),
            vehicleType: (String(
              normalizedRow["vehicletype"] || "R"
            ).toUpperCase() === "O"
              ? "O"
              : "R") as any,

            itemList: [item],
          };

          billsMap.set(docNo, newBill);
        }
      });
    }

    if (!hasFoundAnyHeaders && billsMap.size === 0) {
      rowErrors.push({
        row: 1,
        invoiceNo: "N/A",
        message:
          "Unrecognized spreadsheet structure. Missing invoice / document number column (expected 'Doc No' or 'Invoice No'). Please download the standard bulk template using 'Download Excel Template' or upload a Tally Tax Invoice export.",
      });
    }
  }

  const parsedBills: EWayBillDocument[] = [];
  let validInvoices = 0;
  let invalidInvoices = 0;

  for (const bill of billsMap.values()) {
    const recalculated = recalculateBill(bill, true);
    const errors = validateEWayBill(recalculated);
    const hasError = errors.some((e) => e.severity === "error");

    if (hasError) {
      invalidInvoices++;
      errors
        .filter((e) => e.severity === "error")
        .forEach((err) => {
          rowErrors.push({
            row: 0,
            invoiceNo: bill.docNo,
            message: `${err.field}: ${err.message}`,
          });
        });
    } else {
      validInvoices++;
    }

    parsedBills.push(recalculated);
  }

  return {
    bills: parsedBills,
    totalRows: totalRawRows,
    totalInvoices: parsedBills.length,
    validInvoices,
    invalidInvoices,
    rowErrors,
  };
}
