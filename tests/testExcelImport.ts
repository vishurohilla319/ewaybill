import * as XLSX from "xlsx";
import { generateExcelTemplate, parseExcelFile } from "../lib/engine/excelParser";

console.log("=========================================================");
console.log("  EXCEL PARSER ENHANCEMENTS TEST SUITE                  ");
console.log("=========================================================\n");

// TEST 1: Default Bulk Template
console.log("[TEST 1] Testing standard bulk template generation and parsing...");
const templateBytes = generateExcelTemplate();
const templateResult = parseExcelFile(templateBytes.buffer as ArrayBuffer, "07AAAAA0000A1Z5");
console.log(` - Total rows: ${templateResult.totalRows}`);
console.log(` - Total invoices: ${templateResult.totalInvoices}`);
console.log(` - Valid invoices: ${templateResult.validInvoices}`);
console.log(` - Invalid invoices: ${templateResult.invalidInvoices}`);
if (templateResult.totalInvoices === 2 && templateResult.validInvoices === 2) {
  console.log("✔ PASS: Standard bulk template parsed perfectly (2 grouped invoices)!\n");
} else {
  console.error("❌ FAIL: Bulk template parsing issue", templateResult.rowErrors);
  process.exit(1);
}

// TEST 2: User's Tally Tax Invoice
console.log("[TEST 2] Testing Tally Tax Invoice export parsing (user's exact file)...");
const tallyCsv = `,,,,,Tax Invoice,,,,,,,,,,
,,,,,,,,,,,,,,,
N.H AGENCIES,,,,,,Invoice No.,,e-Way Bill No.,Dated,,,,,,
NAVEEN NAGAR,,,,,,NH/26-27/0260,,,14-Oct-26,,,,,,
NEAR SHIV MANDIR,,,,,,Delivery Note,,,Mode/Terms of Payment,,,,,,
SAHARANPUR,,,,,,,,,,,,,,,
GSTIN/UIN: 09APHPN0801J1ZY,,,,,,Reference No. & Date.,,,Other References,,,,,,
"State Name :  Uttar Pradesh, Code : 09",,,,,,,,,,,,,,,
Contact : 7895585800,,,,,,Buyer's Order No.,,,Dated,,,,,,
Consignee (Ship to),,,,,,,,,,,,,,,
VAIBHAV ENTERPRISES DDN,,,,,,Dispatch Doc No.,,,Delivery Note Date,,,,,,
"98, BALAWALA, BALAWALA DEHRADUN, Dehradun, Uttarakhand, 248001",,,,,,,,,,,,,,,
GSTIN/UIN:,,,05AFWPC3163R2ZT,,,Dispatched through,,,Destination,,,,,,
State Name :,,,"Uttarakhand, Code : 05",,,,,,,,,,,,
Buyer (Bill to),,,,,,Terms of Delivery,,,,,,,,,
VAIBHAV ENTERPRISES DDN,,,,,,,,,,,,,,,
"98, BALAWALA, BALAWALA DEHRADUN, Dehradun, Uttarakhand, 248001",,,,,,,,,,,,,,,
GSTIN/UIN:,,,05AFWPC3163R2ZT,,,,,,,,,,,,
State Name :,,,"Uttarakhand, Code : 05",,,,,,,,,,,,
Sl,Description of,,,,,,,HSN/SAC,Part No.,Quantity,Rate,Rate,per,Disc. %,Amount
No.,Goods and Services,,,,,,,,,,(Incl. of Tax),,,,
1,CHIMNEY HOOD JUNTO CH0080,,,,,,,84146000,,1,13080.01,11084.75,PC,,11084.75
2,CHIMNEY HOOD JUNTO CH0033,,,,,,,84146000,,1,10560,8949.15,PC,,8949.15
3,JUNTO AP0401 INFRARED STEEL FRAME,,,,,,,85166000,,6,2700.01,2288.14,PC,,13728.84
4,COOKTOP JUNTO CG0003,,,,,,,73211110,,1,3960,3355.93,PC,,3355.93
5,COOKTOP JUNTO CG0003J,,,,,,,73211110,,1,2730,2313.56,PC,,2313.56
6,JUNTO AIR FRYER 4 LTR 1200 WATT AP0452,,,,,,,85094010,,2,3300,2796.61,PC,,5593.22
,,,,,,,,,,,,,,,45025.45
,,FREIGHT & CARTAGE (GST),,,,,,996511,,,,,,,200
,,IGST,,,,,,,,,,,,,8140.59
,Less :,ROUND OFF,,,,,,,,,,,,,-0.04
,Total,,,,,,,,,12,,,,,53366
Amount Chargeable (in words),,,,,,E. & O.E,,,,,,,,,
INR Fifty Three Thousand Three Hundred Sixty Six Only,,,,,,,,,,,,,,,
HSN/SAC,,,,,,,,,,,Taxable,IGST,,Total,
,,,,,,,,,,,Value,Rate,Amount,Tax Amount,
84146000,,,,,,,,,,,20033.9,18%,3606.11,3606.11,
85166000,,,,,,,,,,,13728.84,18%,2471.19,2471.19,
73211110,,,,,,,,,,,5669.49,18%,1020.51,1020.51,
85094010,,,,,,,,,,,5593.22,18%,1006.78,1006.78,
996511,,,,,,,,,,,200,18%,36,36,
Total,,,,,,,,,,,"45,225.45",,"8,140.59","8,140.59",
Tax Amount (in words)  :,,,,,,INR Eight Thousand One Hundred Forty and Fifty Nine paise Only,,,,,,,,,
Company's PAN :,,,APHPN0801,,,Company's Bank Details,,,,,,,,,
Declaration,,,,,,A/c Holder's Name:,N H AGENCIES,,,,,,,,
We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.,,,,,,Bank Name:,KOTAK MAHINDRA BANK,,,,,,,,
,,,,,,A/c No.:,6012802960,,,,,,,,
,,,,,,Branch & IFS Code:,SAHARANPUR & KKBK0005303,,,,,,,,
,,,,,,SWIFT Code:,,,,,,,,,
,,,,,,for N.H AGENCIES,,,,,,,,,
,,,,,,,,,,,,,,,
,,,,,,Authorised Signatory,,,,,,,,,
SUBJECT TO SAHARANPUR JURISDICTION,,,,,,,,,,,,,,,
This is a Computer Generated Invoice,,,,,,,,,,,,,,,`;

const tallyWb = XLSX.read(tallyCsv, { type: "string" });
const tallyArray = XLSX.write(tallyWb, { bookType: "xlsx", type: "array" });
const tallyResult = parseExcelFile(tallyArray, {
  gstin: "09APHPN0801J1ZY",
  pincode: "247001",
  tradeName: "N.H AGENCIES",
  legalName: "N.H AGENCIES",
  place: "SAHARANPUR",
  stateCode: 9,
  id: "test",
  address1: "NAVEEN NAGAR"
});

console.log(` - Total rows: ${tallyResult.totalRows}`);
console.log(` - Total invoices: ${tallyResult.totalInvoices}`);
console.log(` - Grouped Doc No: ${tallyResult.bills[0]?.docNo}`);
console.log(` - Items count: ${tallyResult.bills[0]?.itemList.length}`);
console.log(` - Total taxable: ₹${tallyResult.bills[0]?.totalValue}`);
console.log(` - Total IGST: ₹${tallyResult.bills[0]?.igstValue}`);
console.log(` - Total Invoice Value: ₹${tallyResult.bills[0]?.totInvValue}`);

if (
  tallyResult.totalInvoices === 1 &&
  tallyResult.bills[0]?.docNo === "NH/26-27/0260" &&
  tallyResult.bills[0]?.itemList.length === 6 &&
  tallyResult.bills[0]?.fromGstin === "09APHPN0801J1ZY" &&
  tallyResult.bills[0]?.toGstin === "05AFWPC3163R2ZT"
) {
  console.log("✔ PASS: User's Tally Tax Invoice parsed cleanly and accurately!\n");
} else {
  console.error("❌ FAIL: Tally parsing mismatch", tallyResult);
  process.exit(1);
}

// TEST 3: Offset Header Rows (Row 1 is Title, Row 2 has Column Headers)
console.log("[TEST 3] Testing spreadsheet with title at Row 1 and column headers at Row 2...");
const offsetCsv = `My Company Sales Export - October 2026,,,,,,,,
Doc No,Doc Date,Doc Type,Supply Type,From GSTIN,To GSTIN,Item Name,HSN Code,Quantity,Unit,Taxable Amount,IGST Rate
INV-OFFSET-99,14/10/2026,INV,O,07AAAAA0000A1Z5,27CCCCC2222C1Z9,Motor,85015210,1,NOS,50000,18`;

const offsetWb = XLSX.read(offsetCsv, { type: "string" });
const offsetArray = XLSX.write(offsetWb, { bookType: "xlsx", type: "array" });
const offsetResult = parseExcelFile(offsetArray, "07AAAAA0000A1Z5");
console.log(` - Total invoices: ${offsetResult.totalInvoices}`);
console.log(` - Doc No: ${offsetResult.bills[0]?.docNo}`);

if (offsetResult.totalInvoices === 1 && offsetResult.bills[0]?.docNo === "INV-OFFSET-99") {
  console.log("✔ PASS: Offset header detected and parsed successfully!\n");
} else {
  console.error("❌ FAIL: Offset header parsing failed", offsetResult);
  process.exit(1);
}

console.log("ALL EXCEL IMPORT & TALLY PARSING TESTS COMPLETED SUCCESSFULLY!");
