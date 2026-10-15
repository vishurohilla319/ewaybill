export interface EWayBillItem {
  itemNo: number;
  productName: string;
  productDesc?: string;
  hsnCode: number | string;
  quantity: number;
  qtyUnit: string;
  taxableAmount: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cessRate: number;
  cessNonadvol?: number;
}

export interface EWayBillDocument {
  id?: string;
  userGstin: string;
  supplyType: "O" | "I";
  subSupplyType: number | string;
  subSupplyDesc?: string;
  docType: "INV" | "BIL" | "BOE" | "CHL" | "CNT" | "OTH";
  docNo: string;
  docDate: string; // DD/MM/YYYY
  transType: number; // 1: Regular, 2: Bill To - Ship To, 3: Bill From - Dispatch From, 4: Combo
  transactionType?: number;

  // Bill From & Dispatch From
  fromGstin: string;
  fromTrdName: string;
  fromAddr1: string;
  fromAddr2?: string;
  fromPlace: string;
  fromPincode: number;
  actFromStateCode: number;
  fromStateCode: number;

  // Bill To & Ship To
  toGstin: string;
  toTrdName: string;
  toAddr1: string;
  toAddr2?: string;
  toPlace: string;
  toPincode: number;
  actToStateCode: number;
  toStateCode: number;

  // Tax and Value totals
  totalValue: number; // Assessable / Taxable value
  cgstValue: number;
  sgstValue: number;
  igstValue: number;
  cessValue: number;
  cessNonAdvolValue: number;
  otherValue: number;
  totInvValue: number;

  // Transportation Details (Part B)
  transporterId?: string;
  transporterName?: string;
  transDocNo?: string;
  transDocDate?: string; // DD/MM/YYYY
  transMode?: string; // "1" Road, "2" Rail, "3" Air, "4" Ship
  transDistance: number | string; // in KM
  vehicleNo?: string;
  vehicleType?: "R" | "O" | ""; // R: Regular, O: ODC

  // Item List
  itemList: EWayBillItem[];
}

export interface EWayBillBulkPayload {
  version: string;
  billLists: EWayBillDocument[];
}

export interface ValidationError {
  invoiceNo?: string;
  field: string;
  message: string;
  severity: "error" | "warning";
}

export interface CompanyProfile {
  id: string;
  legalName: string;
  tradeName: string;
  gstin: string;
  address1: string;
  address2?: string;
  place: string;
  pincode: string;
  stateCode: number;
  phone?: string;
  email?: string;
  isDefault?: boolean;
}

export interface TransporterMaster {
  id: string;
  transporterId: string; // 15-char Transporter ID or GSTIN
  name: string;
  phone?: string;
  email?: string;
}

export interface ItemMaster {
  id: string;
  name: string;
  description?: string;
  hsnCode: string;
  unit: string;
  defaultGstRate: number;
  cessRate?: number;
  cessNonadvol?: number;
}

export interface DraftBill {
  id: string;
  name: string;
  companyId?: string;
  bill: EWayBillDocument;
  updatedAt: string;
}

export interface ExportHistoryRecord {
  id: string;
  timestamp: string;
  filename: string;
  companyName: string;
  companyGstin: string;
  invoiceCount: number;
  invoiceNumbers: string[];
  totalValue: number;
  totalTax: number;
  schemaVersion: string;
  jsonPayload: string;
}

export interface AppSettings {
  schemaVersion: "1.0.0621" | "1.0.1118" | "1.0.0421" | "1.0.0123" | string;
  defaultSupplyType: "O" | "I";
  defaultSubSupplyType: number;
  defaultDocType: "INV" | "BIL" | "BOE" | "CHL" | "OTH";
  defaultTransMode: string;
  defaultVehicleType: "R" | "O";
  autoCalculateTax: boolean;
  roundOffTolerance: number;
  developerCredit: string;
}
