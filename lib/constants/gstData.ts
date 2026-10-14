export interface StateInfo {
  code: number;
  name: string;
  tin: string;
}

export const STATE_CODES: Record<number, string> = {
  1: "Jammu and Kashmir",
  2: "Himachal Pradesh",
  3: "Punjab",
  4: "Chandigarh",
  5: "Uttarakhand",
  6: "Haryana",
  7: "Delhi",
  8: "Rajasthan",
  9: "Uttar Pradesh",
  10: "Bihar",
  11: "Sikkim",
  12: "Arunachal Pradesh",
  13: "Nagaland",
  14: "Manipur",
  15: "Mizoram",
  16: "Tripura",
  17: "Meghalaya",
  18: "Assam",
  19: "West Bengal",
  20: "Jharkhand",
  21: "Odisha",
  22: "Chhattisgarh",
  23: "Madhya Pradesh",
  24: "Gujarat",
  25: "Daman and Diu",
  26: "Dadra and Nagar Haveli",
  27: "Maharashtra",
  28: "Andhra Pradesh (Old)",
  29: "Karnataka",
  30: "Goa",
  31: "Lakshadweep",
  32: "Kerala",
  33: "Tamil Nadu",
  34: "Puducherry",
  35: "Andaman and Nicobar Islands",
  36: "Telangana",
  37: "Andhra Pradesh (New)",
  38: "Ladakh",
  97: "Other Territory",
  99: "Centre Jurisdiction / Export / Import",
};

export const STATE_OPTIONS = Object.entries(STATE_CODES).map(([code, name]) => ({
  code: Number(code),
  tin: Number(code) < 10 ? `0${code}` : `${code}`,
  name,
  label: `${Number(code) < 10 ? `0${code}` : code} - ${name}`,
}));

export const SUPPLY_TYPES = [
  { value: "O", label: "Outward (Supply / Sale)" },
  { value: "I", label: "Inward (Purchase / Procurement)" },
];

export const SUB_SUPPLY_TYPES: Record<string, { code: number; label: string; desc?: string }[]> = {
  O: [
    { code: 1, label: "Supply", desc: "Regular supply of goods" },
    { code: 3, label: "Export", desc: "Goods sent for export outside India" },
    { code: 4, label: "Job Work", desc: "Goods sent for job work" },
    { code: 5, label: "For Own Use", desc: "Movement between company branches/godowns" },
    { code: 7, label: "Sales Return", desc: "Rejection / return of goods from buyer" },
    { code: 8, label: "Others", desc: "Other types of outward supply (Description mandatory)" },
    { code: 9, label: "SKD / CKD / Lots", desc: "Semi / Completely knocked down movement" },
    { code: 10, label: "Line Sales", desc: "Direct delivery to retailers/wholesalers" },
    { code: 11, label: "Recipient Not Known", desc: "Consignment where buyer is determined later" },
    { code: 12, label: "Exhibition or Fair", desc: "Movement for exhibition/display" },
  ],
  I: [
    { code: 1, label: "Supply", desc: "Purchased from registered/unregistered dealer" },
    { code: 2, label: "Import", desc: "Inward supply received from overseas" },
    { code: 5, label: "For Own Use", desc: "Transfer of goods into warehouse" },
    { code: 6, label: "Job Work Returns", desc: "Goods returned after completion of job work" },
    { code: 7, label: "Sales Return", desc: "Return inward received" },
    { code: 8, label: "Others", desc: "Other inward movement (Description mandatory)" },
    { code: 9, label: "SKD / CKD / Lots", desc: "Semi / Completely knocked down inward movement" },
    { code: 12, label: "Exhibition or Fair", desc: "Return from exhibition" },
  ],
};

export const DOC_TYPES = [
  { code: "INV", label: "Tax Invoice" },
  { code: "BIL", label: "Bill of Supply" },
  { code: "BOE", label: "Bill of Entry" },
  { code: "CHL", label: "Delivery Challan" },
  { code: "CNT", label: "Credit Note" },
  { code: "OTH", label: "Others" },
];

export const TRANSACTION_TYPES = [
  { code: 1, label: "Regular", desc: "Billed from supplier location, shipped to buyer location" },
  { code: 2, label: "Bill To - Ship To", desc: "Buyer is billed, but goods delivered to third-party consignee" },
  { code: 3, label: "Bill From - Dispatch From", desc: "Goods physically dispatched from a godown/plant different from billing address" },
  { code: 4, label: "Combination of 2 and 3", desc: "Both dispatch location and ship-to location differ from billing parties" },
];

export const TRANSPORT_MODES = [
  { code: "1", label: "1 - Road" },
  { code: "2", label: "2 - Rail" },
  { code: "3", label: "3 - Air" },
  { code: "4", label: "4 - Ship" },
];

export const VEHICLE_TYPES = [
  { code: "R", label: "R - Regular" },
  { code: "O", label: "O - ODC (Over Dimensional Cargo)" },
];

export const UNIT_CODES = [
  { code: "NOS", label: "NOS - Numbers" },
  { code: "PCS", label: "PCS - Pieces" },
  { code: "KGS", label: "KGS - Kilograms" },
  { code: "MTR", label: "MTR - Meters" },
  { code: "BOX", label: "BOX - Boxes" },
  { code: "BAG", label: "BAG - Bags" },
  { code: "BTL", label: "BTL - Bottles" },
  { code: "CAN", label: "CAN - Cans" },
  { code: "CTN", label: "CTN - Cartons" },
  { code: "DOZ", label: "DOZ - Dozens" },
  { code: "GMS", label: "GMS - Grams" },
  { code: "KLR", label: "KLR - Kilolitre" },
  { code: "LTR", label: "LTR - Litres" },
  { code: "PAC", label: "PAC - Packs" },
  { code: "PRS", label: "PRS - Pairs" },
  { code: "QTL", label: "QTL - Quintal" },
  { code: "ROL", label: "ROL - Rolls" },
  { code: "SET", label: "SET - Sets" },
  { code: "SQF", label: "SQF - Square Feet" },
  { code: "SQM", label: "SQM - Square Meters" },
  { code: "TON", label: "TON - Metric Ton" },
  { code: "TUB", label: "TUB - Tubes" },
  { code: "UNT", label: "UNT - Units" },
  { code: "YDS", label: "YDS - Yards" },
  { code: "OTH", label: "OTH - Others" },
];

export const GST_RATES = [0, 0.1, 0.25, 1.5, 3, 5, 6, 7.5, 12, 18, 28];
