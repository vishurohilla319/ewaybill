import * as XLSX from "xlsx";
import { EWayBillDocument, EWayBillItem } from "../types/ewayBill";
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

export function parseExcelFile(
  data: ArrayBuffer,
  defaultUserGstin?: string
): ParsedExcelResult {
  const wb = XLSX.read(data, { type: "array" });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, {
    defval: "",
  });

  const rowErrors: { row: number; invoiceNo: string; message: string }[] = [];
  const billsMap = new Map<string, EWayBillDocument>();

  const normalizeKey = (key: string) =>
    key.toLowerCase().replace(/[^a-z0-9]/g, "");

  rawRows.forEach((row, idx) => {
    const rowNum = idx + 2; // header is row 1
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

    // Parse date
    let docDate = String(
      normalizedRow["docdate"] ||
        normalizedRow["documentdate"] ||
        normalizedRow["invoicedate"] ||
        ""
    ).trim();

    // In case Excel parsed it as a number
    if (typeof docDate === "number" || (!docDate.includes("/") && !isNaN(Number(docDate)))) {
      const parsedDate = XLSX.SSF.parse_date_code(Number(docDate));
      if (parsedDate) {
        docDate = `${String(parsedDate.d).padStart(2, "0")}/${String(
          parsedDate.m
        ).padStart(2, "0")}/${parsedDate.y}`;
      }
    }

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

    // Item details
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
          normalizedRow["taxablevalue"] ||
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
          Number(normalizedRow["subsupplytype"] || normalizedRow["subsupply"] || 1) ||
          1,
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
        otherValue:
          Number(
            normalizedRow["othercharges"] || normalizedRow["othervalue"] || 0
          ) || 0,
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

  const parsedBills: EWayBillDocument[] = [];
  let validInvoices = 0;
  let invalidInvoices = 0;

  for (const bill of billsMap.values()) {
    // Recalculate totals
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
    totalRows: rawRows.length,
    totalInvoices: parsedBills.length,
    validInvoices,
    invalidInvoices,
    rowErrors,
  };
}
