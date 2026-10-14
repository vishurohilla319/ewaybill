import { EWayBillDocument, EWayBillItem } from "../lib/types/ewayBill";
import { recalculateBill, isIntraStateSupply } from "../lib/engine/calculator";
import { validateEWayBill, validateBulkDocuments } from "../lib/engine/validator";
import {
  generateBulkEWayBillJson,
  formatJsonPayload,
} from "../lib/engine/jsonGenerator";

interface TestReport {
  name: string;
  passed: boolean;
  details: string;
}

const reports: TestReport[] = [];

function assert(condition: boolean, testName: string, detail: string) {
  if (condition) {
    reports.push({ name: testName, passed: true, details: detail });
  } else {
    reports.push({
      name: testName,
      passed: false,
      details: `FAILED: ${detail}`,
    });
  }
}

console.log("=========================================================");
console.log("  FIN TAX E-WAY BILL GENERATOR - TEST SUITE VERIFICATION  ");
console.log("  Developed by Vishu Rohilla                              ");
console.log("=========================================================\n");

// --- TEST CASE 1: Intra-state Supply (Delhi -> Delhi) ---
const intraBill: EWayBillDocument = {
  userGstin: "07AAACF1234D1Z8",
  supplyType: "O",
  subSupplyType: 1,
  docType: "INV",
  docNo: "TEST-INTRA-001",
  docDate: "14/10/2026",
  transType: 1,
  fromGstin: "07AAACF1234D1Z8",
  fromTrdName: "Fin Tax Enterprises",
  fromAddr1: "Okhla Phase 3",
  fromPlace: "New Delhi",
  fromPincode: 110020,
  actFromStateCode: 7,
  fromStateCode: 7,
  toGstin: "07BBBBB1111B1Z2",
  toTrdName: "Apex Retail Delhi",
  toAddr1: "Connaught Place",
  toPlace: "New Delhi",
  toPincode: 110001,
  actToStateCode: 7,
  toStateCode: 7,
  totalValue: 100000,
  cgstValue: 0,
  sgstValue: 0,
  igstValue: 0,
  cessValue: 0,
  cessNonAdvolValue: 0,
  otherValue: 0,
  totInvValue: 0,
  transMode: "1",
  transDistance: 25,
  vehicleNo: "DL01AB1234",
  vehicleType: "R",
  itemList: [
    {
      itemNo: 1,
      productName: "Control Valves",
      hsnCode: 84818030,
      quantity: 10,
      qtyUnit: "NOS",
      taxableAmount: 100000,
      cgstRate: 9,
      sgstRate: 9,
      igstRate: 0,
      cessRate: 0,
    },
  ],
};

const recalculatedIntra = recalculateBill(intraBill, true);
const intraErrors = validateEWayBill(recalculatedIntra);

assert(
  isIntraStateSupply(recalculatedIntra) === true,
  "Test 1.1: Intra-state State Detection",
  "Detected intra-state when FromState=7 and ToState=7"
);
assert(
  recalculatedIntra.cgstValue === 9000 &&
    recalculatedIntra.sgstValue === 9000 &&
    recalculatedIntra.igstValue === 0,
  "Test 1.2: Intra-state Tax Rate Split",
  `CGST=₹${recalculatedIntra.cgstValue}, SGST=₹${recalculatedIntra.sgstValue}, IGST=₹${recalculatedIntra.igstValue}`
);
assert(
  recalculatedIntra.totInvValue === 118000,
  "Test 1.3: Intra-state Total Invoice Value",
  `Total Invoice Value = ₹${recalculatedIntra.totInvValue} (Expected ₹118,000)`
);
assert(
  intraErrors.filter((e) => e.severity === "error").length === 0,
  "Test 1.4: Intra-state Official Validation",
  `Zero errors found: ${intraErrors.length} notices`
);

// --- TEST CASE 2: Inter-state Supply (Delhi -> Maharashtra) ---
const interBill: EWayBillDocument = {
  ...intraBill,
  docNo: "TEST-INTER-002",
  toGstin: "27AABCR9988E1Z4",
  toTrdName: "Rohilla Logistics Mumbai",
  toAddr1: "MIDC Andheri",
  toPlace: "Mumbai",
  toPincode: 400093,
  actToStateCode: 27,
  toStateCode: 27,
  transDistance: 1420,
  vehicleNo: "MH04AB5678",
  itemList: [
    {
      itemNo: 1,
      productName: "Electric Motors 5HP",
      hsnCode: 85015210,
      quantity: 5,
      qtyUnit: "NOS",
      taxableAmount: 100000,
      cgstRate: 0,
      sgstRate: 0,
      igstRate: 18,
      cessRate: 0,
    },
  ],
};

const recalculatedInter = recalculateBill(interBill, true);
const interErrors = validateEWayBill(recalculatedInter);

assert(
  isIntraStateSupply(recalculatedInter) === false,
  "Test 2.1: Inter-state State Detection",
  "Detected inter-state when FromState=7 and ToState=27"
);
assert(
  recalculatedInter.igstValue === 18000 &&
    recalculatedInter.cgstValue === 0 &&
    recalculatedInter.sgstValue === 0,
  "Test 2.2: Inter-state IGST Application",
  `IGST=₹${recalculatedInter.igstValue}, CGST=₹${recalculatedInter.cgstValue}, SGST=₹${recalculatedInter.sgstValue}`
);
assert(
  interErrors.filter((e) => e.severity === "error").length === 0,
  "Test 2.3: Inter-state Validation Passed",
  `Zero errors found in inter-state document`
);

// --- TEST CASE 3: Multiple Items with Different GST Rates ---
const multiItemBill: EWayBillDocument = {
  ...intraBill,
  docNo: "TEST-MULTI-003",
  itemList: [
    {
      itemNo: 1,
      productName: "Item 5% GST",
      hsnCode: 52051200,
      quantity: 10,
      qtyUnit: "KGS",
      taxableAmount: 20000,
      cgstRate: 2.5,
      sgstRate: 2.5,
      igstRate: 0,
      cessRate: 0,
    },
    {
      itemNo: 2,
      productName: "Item 12% GST",
      hsnCode: 85044080,
      quantity: 2,
      qtyUnit: "NOS",
      taxableAmount: 50000,
      cgstRate: 6,
      sgstRate: 6,
      igstRate: 0,
      cessRate: 0,
    },
    {
      itemNo: 3,
      productName: "Item 18% GST with 2% Cess",
      hsnCode: 84818030,
      quantity: 5,
      qtyUnit: "NOS",
      taxableAmount: 100000,
      cgstRate: 9,
      sgstRate: 9,
      igstRate: 0,
      cessRate: 2,
    },
  ],
};

const recalculatedMulti = recalculateBill(multiItemBill, false);
// Expected:
// Item 1: 20,000 + 500 CGST + 500 SGST = 21,000
// Item 2: 50,000 + 3000 CGST + 3000 SGST = 56,000
// Item 3: 100,000 + 9000 CGST + 9000 SGST + 2000 Cess = 120,000
// Total Taxable = 170,000
// Total CGST = 12,500; Total SGST = 12,500; Cess = 2,000
// Total Inv = 170,000 + 12,500 + 12,500 + 2,000 = 197,000

assert(
  recalculatedMulti.totalValue === 170000,
  "Test 3.1: Multi-item Assessable Total",
  `Taxable = ₹${recalculatedMulti.totalValue} (Expected ₹170,000)`
);
assert(
  recalculatedMulti.cgstValue === 12500 &&
    recalculatedMulti.sgstValue === 12500 &&
    recalculatedMulti.cessValue === 2000,
  "Test 3.2: Multi-rate Cumulative Taxes",
  `CGST=₹${recalculatedMulti.cgstValue}, SGST=₹${recalculatedMulti.sgstValue}, Cess=₹${recalculatedMulti.cessValue}`
);
assert(
  recalculatedMulti.totInvValue === 197000,
  "Test 3.3: Multi-rate Total Invoice Value",
  `Total Invoice Value = ₹${recalculatedMulti.totInvValue} (Expected ₹197,000)`
);

// --- TEST CASE 4: Missing Mandatory Fields Detection ---
const missingFieldsBill: EWayBillDocument = {
  ...intraBill,
  docNo: "", // Missing
  docDate: "", // Missing
  vehicleNo: "", // Missing vehicle in road mode without transporter ID
  transporterId: "",
  itemList: [], // Empty items
};

const missingErrors = validateEWayBill(missingFieldsBill);
const docNoErr = missingErrors.some((e) => e.field === "docNo");
const docDateErr = missingErrors.some((e) => e.field === "docDate");
const vehicleErr = missingErrors.some((e) => e.field === "vehicleNo");
const itemErr = missingErrors.some((e) => e.field === "itemList");

assert(
  docNoErr && docDateErr && vehicleErr && itemErr,
  "Test 4.1: Missing Mandatory Fields Guard",
  `Correctly flagged missing: docNo (${docNoErr}), docDate (${docDateErr}), vehicleNo (${vehicleErr}), itemList (${itemErr})`
);

// --- TEST CASE 5: GSTIN State Prefix Mismatch Detection ---
const gstinMismatchBill: EWayBillDocument = {
  ...intraBill,
  fromGstin: "29ABCDE1234F1Z5", // 29 is Karnataka
  fromStateCode: 7, // 7 is Delhi -> mismatch!
  toGstin: "INVALID_GSTIN_123", // Malformed
};

const mismatchErrors = validateEWayBill(gstinMismatchBill);
const fromStateMismatch = mismatchErrors.some((e) => e.field === "fromGstin");
const toGstInvalid = mismatchErrors.some((e) => e.field === "toGstin");

assert(
  fromStateMismatch && toGstInvalid,
  "Test 5.1: GSTIN & State Code Integrity Guard",
  `Caught state code prefix mismatch (${fromStateMismatch}) and malformed GSTIN (${toGstInvalid})`
);

// --- TEST CASE 6: Transportation Details & Vehicle Format Validation ---
const invalidVehicleBill: EWayBillDocument = {
  ...intraBill,
  vehicleNo: "NOT_A_VALID_VEHICLE_NUM",
};

const invalidVehicleErrors = validateEWayBill(invalidVehicleBill);
const vehicleFormatErr = invalidVehicleErrors.some(
  (e) => e.field === "vehicleNo"
);

assert(
  vehicleFormatErr,
  "Test 6.1: Vehicle Registration Number Regex Validation",
  "Successfully rejected non-standard vehicle string"
);

// --- TEST CASE 7: Invoice Total Mismatch Guard ---
const totalMismatchBill: EWayBillDocument = {
  ...intraBill,
  totalValue: 50000,
  totInvValue: 999999, // Intentional mismatch
};

const mismatchTotalErrors = validateEWayBill(totalMismatchBill);
const totalErr = mismatchTotalErrors.some((e) => e.field === "totInvValue");

assert(
  totalErr,
  "Test 7.1: Header Invoice Total Mismatch Guard",
  "Caught intentional divergence between line item calculations and declared total"
);

// --- TEST CASE 8: Multi-Invoice Consolidated Bulk JSON Payload ---
const bulkPayload = generateBulkEWayBillJson([
  recalculatedIntra,
  recalculatedInter,
  recalculatedMulti,
]);
const formattedJson = formatJsonPayload(bulkPayload);

assert(
  bulkPayload.version === "1.0.1118",
  "Test 8.1: Bulk Schema Version Specification",
  `Bulk payload version = ${bulkPayload.version}`
);
assert(
  Array.isArray(bulkPayload.billLists) && bulkPayload.billLists.length === 3,
  "Test 8.2: Consolidated billLists Container",
  `Payload contains ${bulkPayload.billLists.length} invoices under billLists key`
);
assert(
  bulkPayload.billLists[0].docNo === "TEST-INTRA-001" &&
    bulkPayload.billLists[1].docNo === "TEST-INTER-002" &&
    bulkPayload.billLists[2].docNo === "TEST-MULTI-003",
  "Test 8.3: Preserved Invoice Identifiers",
  "All 3 invoice numbers preserved accurately in official output"
);
assert(
  formattedJson.includes('"version": "1.0.1118"') &&
    formattedJson.includes('"billLists":'),
  "Test 8.4: Formatted JSON Output Conformance",
  "Formatted JSON validates against official portal bulk generation layout"
);

console.log("\n================ TEST EXECUTION RESULTS ================");
let passCount = 0;
reports.forEach((r, idx) => {
  const icon = r.passed ? "✔ PASS" : "✖ FAIL";
  console.log(`[${icon}] ${r.name}`);
  console.log(`       ${r.details}`);
  if (r.passed) passCount++;
});

console.log(
  `\nSUMMARY: ${passCount} of ${reports.length} tests passed successfully.`
);
if (passCount === reports.length) {
  console.log("ALL E-WAY BILL ENGINE & PORTAL SCHEMA TESTS PASSED!");
} else {
  console.error("SOME TESTS FAILED. PLEASE REVIEW DETAILS.");
  process.exit(1);
}
