import { EWayBillBulkPayload, EWayBillDocument } from "../types/ewayBill";
import { roundToTwo } from "./calculator";

/**
 * Sanitizes and converts an internal EWayBillDocument into the strict official
 * NIC E-Way Bill schema representation.
 */
export function sanitizeDocumentForOfficialJson(
  doc: EWayBillDocument
): Record<string, any> {
  const transTypeNum = Number(doc.transType || doc.transactionType || 1);

  const cleanItem = (item: any, idx: number) => {
    const hsnNum = isNaN(Number(item.hsnCode))
      ? parseInt(String(item.hsnCode).replace(/\D/g, "") || "0", 10)
      : Number(item.hsnCode);

    return {
      itemNo: idx + 1,
      productName: String(item.productName || "").trim().substring(0, 100),
      productDesc: String(item.productDesc || "").trim().substring(0, 100),
      hsnCode: hsnNum,
      quantity: Number(item.quantity) || 0,
      qtyUnit: String(item.qtyUnit || "NOS").trim().toUpperCase().substring(0, 3),
      cgstRate: Number(item.cgstRate) || 0,
      sgstRate: Number(item.sgstRate) || 0,
      igstRate: Number(item.igstRate) || 0,
      cessRate: Number(item.cessRate) || 0,
      cessNonadvol: Number(item.cessNonadvol) || 0,
      taxableAmount: roundToTwo(Number(item.taxableAmount) || 0),
    };
  };

  const cleanDoc: Record<string, any> = {
    userGstin: String(doc.userGstin || "").trim().toUpperCase(),
    supplyType: String(doc.supplyType || "O").trim().toUpperCase(),
    subSupplyType: Number(doc.subSupplyType) || 1,
    subSupplyDesc: doc.subSupplyDesc ? String(doc.subSupplyDesc).trim() : "",
    docType: String(doc.docType || "INV").trim().toUpperCase(),
    docNo: String(doc.docNo || "").trim(),
    docDate: String(doc.docDate || "").trim(),
    transType: transTypeNum,

    // Supplier / Consignor
    fromGstin: String(doc.fromGstin || "").trim().toUpperCase(),
    fromTrdName: String(doc.fromTrdName || "").trim().substring(0, 100),
    fromAddr1: String(doc.fromAddr1 || "").trim().substring(0, 100),
    fromAddr2: doc.fromAddr2 ? String(doc.fromAddr2).trim().substring(0, 100) : "",
    fromPlace: String(doc.fromPlace || "").trim().substring(0, 50),
    fromPincode: Number(doc.fromPincode) || 0,
    actFromStateCode: Number(doc.actFromStateCode || doc.fromStateCode) || 0,
    fromStateCode: Number(doc.fromStateCode) || 0,

    // Recipient / Consignee
    toGstin: String(doc.toGstin || "").trim().toUpperCase(),
    toTrdName: String(doc.toTrdName || "").trim().substring(0, 100),
    toAddr1: String(doc.toAddr1 || "").trim().substring(0, 100),
    toAddr2: doc.toAddr2 ? String(doc.toAddr2).trim().substring(0, 100) : "",
    toPlace: String(doc.toPlace || "").trim().substring(0, 50),
    toPincode: Number(doc.toPincode) || 0,
    actToStateCode: Number(doc.actToStateCode || doc.toStateCode) || 0,
    toStateCode: Number(doc.toStateCode) || 0,

    // Value Details
    totalValue: roundToTwo(Number(doc.totalValue) || 0),
    cgstValue: roundToTwo(Number(doc.cgstValue) || 0),
    sgstValue: roundToTwo(Number(doc.sgstValue) || 0),
    igstValue: roundToTwo(Number(doc.igstValue) || 0),
    cessValue: roundToTwo(Number(doc.cessValue) || 0),
    cessNonAdvolValue: roundToTwo(Number(doc.cessNonAdvolValue) || 0),
    otherValue: roundToTwo(Number(doc.otherValue) || 0),
    totInvValue: roundToTwo(Number(doc.totInvValue) || 0),

    // Transport Details
    transporterId: doc.transporterId
      ? String(doc.transporterId).trim().toUpperCase()
      : "",
    transporterName: doc.transporterName
      ? String(doc.transporterName).trim().substring(0, 100)
      : "",
    transDocNo: doc.transDocNo ? String(doc.transDocNo).trim() : "",
    transDocDate: doc.transDocDate ? String(doc.transDocDate).trim() : "",
    transMode: doc.transMode ? String(doc.transMode).trim() : "1",
    transDistance: String(Math.round(Number(doc.transDistance) || 0)),
    vehicleNo: doc.vehicleNo
      ? String(doc.vehicleNo).trim().toUpperCase().replace(/[\s-]/g, "")
      : "",
    vehicleType: doc.vehicleType
      ? String(doc.vehicleType).trim().toUpperCase()
      : "",

    // Item List
    itemList: (doc.itemList || []).map((it, idx) => cleanItem(it, idx)),
  };

  return cleanDoc;
}

/**
 * Builds the official Portal-compatible Bulk E-Way Bill JSON payload.
 */
export function generateBulkEWayBillJson(
  documents: EWayBillDocument[],
  version: string = "1.0.1118"
): EWayBillBulkPayload {
  const sanitizedList = documents.map((doc) =>
    sanitizeDocumentForOfficialJson(doc)
  ) as EWayBillDocument[];

  return {
    version: version || "1.0.1118",
    billLists: sanitizedList,
  };
}

/**
 * Converts the generated payload to a formatted JSON string.
 */
export function formatJsonPayload(payload: EWayBillBulkPayload): string {
  return JSON.stringify(payload, null, 2);
}

/**
 * Generates an official standard download filename:
 * e.g., EWB_BULK_20261014_143000.json
 */
export function generateExportFilename(prefix: string = "EWB_BULK"): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");

  return `${prefix}_${yyyy}${mm}${dd}_${hh}${min}${ss}.json`;
}

/**
 * Downloads a string as a file directly in the browser.
 */
export function downloadJsonFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
