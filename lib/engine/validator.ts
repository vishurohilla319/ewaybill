import { EWayBillDocument, ValidationError } from "../types/ewayBill";
import { STATE_CODES, UNIT_CODES } from "../constants/gstData";
import { isIntraStateSupply, roundToTwo } from "./calculator";

const GSTIN_REGEX =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const VEHICLE_REGEX =
  /^[A-Z]{2}[0-9]{1,2}(?:[A-Z]{1,3})?[0-9]{4}$|^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$|^[A-Z]{2}[0-9]{2}[0-9]{4}$/i;
const DATE_REGEX = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/(19|20)\d\d$/;

export function isValidGstin(gstin: string): boolean {
  if (!gstin) return false;
  const upper = gstin.trim().toUpperCase();
  if (upper === "URP") return true;
  return GSTIN_REGEX.test(upper);
}

export function isValidTransporterId(transId: string): boolean {
  if (!transId) return false;
  const clean = transId.trim().toUpperCase();
  // Validates standard 15-digit GSTIN or TRANSIN (e.g. 07AAAAA0000A1Z5 or common enrollment starting with 88)
  return /^[0-9]{2}[0-9A-Z]{13}$/.test(clean);
}

export function isValidVehicleNo(vehicleNo: string): boolean {
  if (!vehicleNo) return false;
  // Strip spaces, dashes
  const clean = vehicleNo.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return VEHICLE_REGEX.test(clean);
}

export function isValidDateStr(dateStr: string): boolean {
  if (!dateStr || !DATE_REGEX.test(dateStr)) return false;
  const parts = dateStr.split("/");
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  const d = new Date(year, month, day);
  return (
    d.getFullYear() === year &&
    d.getMonth() === month &&
    d.getDate() === day
  );
}

export function validateEWayBill(
  bill: EWayBillDocument,
  tolerance: number = 2.0
): ValidationError[] {
  const errors: ValidationError[] = [];
  const invNo = bill.docNo || "Unknown Invoice";

  const addError = (field: string, message: string) => {
    errors.push({ invoiceNo: invNo, field, message, severity: "error" });
  };

  const addWarning = (field: string, message: string) => {
    errors.push({ invoiceNo: invNo, field, message, severity: "warning" });
  };

  // 1. User GSTIN
  if (!bill.userGstin) {
    addError("userGstin", "User GSTIN is required.");
  } else if (!isValidGstin(bill.userGstin) || bill.userGstin.toUpperCase() === "URP") {
    addError("userGstin", "User GSTIN must be a valid 15-character registered GSTIN.");
  }

  // 2. Supply Type & Sub Supply Type
  if (!bill.supplyType || !["O", "I"].includes(bill.supplyType)) {
    addError("supplyType", "Supply Type must be 'O' (Outward) or 'I' (Inward).");
  }

  const subType = Number(bill.subSupplyType);
  if (isNaN(subType) || subType < 1 || subType > 12) {
    addError("subSupplyType", "Valid Sub-Supply Type code (1-12) is required.");
  } else if (subType === 8 && (!bill.subSupplyDesc || bill.subSupplyDesc.trim().length === 0)) {
    addError(
      "subSupplyDesc",
      "Sub-supply description is mandatory when sub-supply type is 'Others' (8)."
    );
  }

  // 3. Document Details
  if (!bill.docType) {
    addError("docType", "Document Type is required (e.g., INV, BIL, CHL).");
  }

  if (!bill.docNo || bill.docNo.trim().length === 0) {
    addError("docNo", "Document / Invoice Number is mandatory.");
  } else if (bill.docNo.length > 16) {
    addError("docNo", "Document Number cannot exceed 16 characters.");
  } else if (!/^[A-Za-z0-9\/-]+$/.test(bill.docNo)) {
    addError("docNo", "Document Number can only contain alphanumeric characters, slash (/), and hyphen (-).");
  }

  if (!bill.docDate) {
    addError("docDate", "Document Date is mandatory.");
  } else if (!isValidDateStr(bill.docDate)) {
    addError("docDate", "Document Date must be in DD/MM/YYYY format.");
  }

  // 4. From Details (Consignor)
  const fromGstinClean = (bill.fromGstin || "").trim().toUpperCase();
  if (!fromGstinClean) {
    addError("fromGstin", "Supplier (From) GSTIN is required.");
  } else if (!isValidGstin(fromGstinClean)) {
    addError("fromGstin", "Invalid Supplier GSTIN format (15 characters or 'URP').");
  } else if (fromGstinClean !== "URP") {
    const fromGstState = parseInt(fromGstinClean.substring(0, 2), 10);
    if (fromGstState !== Number(bill.fromStateCode)) {
      addError(
        "fromGstin",
        `Supplier GSTIN state prefix (${fromGstState}) does not match From State Code (${bill.fromStateCode}).`
      );
    }
  }

  if (!bill.fromTrdName || bill.fromTrdName.trim().length < 2) {
    addError("fromTrdName", "Supplier Trade/Legal Name is mandatory (min 2 chars).");
  }
  if (!bill.fromAddr1 || bill.fromAddr1.trim().length === 0) {
    addError("fromAddr1", "Supplier Address Line 1 is mandatory.");
  }
  if (!bill.fromPlace || bill.fromPlace.trim().length === 0) {
    addError("fromPlace", "Supplier City / Place is mandatory.");
  }

  const fromPin = Number(bill.fromPincode);
  if (isNaN(fromPin) || fromPin <= 0) {
    addError("fromPincode", "Valid 6-digit Supplier PIN code is required.");
  } else if (fromPin.toString().length !== 6 && fromPin !== 999999) {
    addError("fromPincode", "Supplier PIN code must be 6 digits (or 999999 for import).");
  }

  const fromState = Number(bill.fromStateCode);
  if (!STATE_CODES[fromState]) {
    addError("fromStateCode", "Invalid Supplier State Code.");
  }

  // Dispatch From (Actual)
  const actFromState = Number(bill.actFromStateCode || bill.fromStateCode);
  if (!STATE_CODES[actFromState]) {
    addError("actFromStateCode", "Invalid Actual Dispatch State Code.");
  }

  // 5. To Details (Consignee)
  const toGstinClean = (bill.toGstin || "").trim().toUpperCase();
  if (!toGstinClean) {
    addError("toGstin", "Recipient (To) GSTIN is required.");
  } else if (!isValidGstin(toGstinClean)) {
    addError("toGstin", "Invalid Recipient GSTIN format (15 characters or 'URP').");
  } else if (toGstinClean !== "URP") {
    const toGstState = parseInt(toGstinClean.substring(0, 2), 10);
    if (toGstState !== Number(bill.toStateCode)) {
      addError(
        "toGstin",
        `Recipient GSTIN state prefix (${toGstState}) does not match To State Code (${bill.toStateCode}).`
      );
    }
  }

  if (!bill.toTrdName || bill.toTrdName.trim().length < 2) {
    addError("toTrdName", "Recipient Trade/Legal Name is mandatory (min 2 chars).");
  }
  if (!bill.toAddr1 || bill.toAddr1.trim().length === 0) {
    addError("toAddr1", "Recipient Address Line 1 is mandatory.");
  }
  if (!bill.toPlace || bill.toPlace.trim().length === 0) {
    addError("toPlace", "Recipient City / Place is mandatory.");
  }

  const toPin = Number(bill.toPincode);
  if (isNaN(toPin) || toPin <= 0) {
    addError("toPincode", "Valid 6-digit Recipient PIN code is required.");
  } else if (toPin.toString().length !== 6 && toPin !== 999999) {
    addError("toPincode", "Recipient PIN code must be 6 digits (or 999999 for export).");
  }

  const toState = Number(bill.toStateCode);
  if (!STATE_CODES[toState]) {
    addError("toStateCode", "Invalid Recipient State Code.");
  }

  // Ship To (Actual)
  const actToState = Number(bill.actToStateCode || bill.toStateCode);
  if (!STATE_CODES[actToState]) {
    addError("actToStateCode", "Invalid Actual Ship-To State Code.");
  }

  // 6. Special Export / Import Rules
  if (subType === 3) {
    // Export
    if (toGstinClean !== "URP") {
      addError("toGstin", "For Export supplies, Recipient GSTIN must be 'URP'.");
    }
    if (toState !== 99) {
      addError("toStateCode", "For Export supplies, To State Code must be 99.");
    }
    if (toPin !== 999999) {
      addError("toPincode", "For Export supplies, To PIN code must be 999999.");
    }
  } else if (subType === 2) {
    // Import
    if (fromGstinClean !== "URP") {
      addError("fromGstin", "For Import supplies, Supplier GSTIN must be 'URP'.");
    }
    if (fromState !== 99) {
      addError("fromStateCode", "For Import supplies, From State Code must be 99.");
    }
    if (fromPin !== 999999) {
      addError("fromPincode", "For Import supplies, From PIN code must be 999999.");
    }
  }

  // 7. Distance
  const dist = Number(bill.transDistance);
  if (isNaN(dist) || dist <= 0) {
    addError("transDistance", "Approximate transport distance is mandatory and must be greater than 0 km.");
  } else if (dist > 4000) {
    addWarning("transDistance", "Distance exceeds 4,000 km. Verify transport route.");
  }

  // 8. Transportation Mode & Part-B
  const mode = bill.transMode ? String(bill.transMode).trim() : "1";
  const cleanTransId = (bill.transporterId || "").trim().toUpperCase();
  const cleanVehNo = (bill.vehicleNo || "").trim().toUpperCase().replace(/[^A-Za-z0-9]/g, "");
  const hasTransporter = cleanTransId.length > 0;
  const hasVehicle = cleanVehNo.length > 0;

  if (hasTransporter) {
    if (!isValidTransporterId(cleanTransId)) {
      addError(
        "transporterId",
        "Transporter ID must be a valid 15-character GSTIN or TRANSIN (e.g. 07AAAAA0000A1Z5 or common enrollment starting with 88)."
      );
    }
  }

  if (mode === "1") {
    // Road
    if (!hasVehicle && !hasTransporter) {
      addError(
        "vehicleNo",
        "For Road transport, either Vehicle Number (for Part-B) or Transporter ID (to delegate Part-B) is mandatory."
      );
    }
    if (hasVehicle) {
      if (!isValidVehicleNo(cleanVehNo)) {
        addError(
          "vehicleNo",
          `Invalid vehicle registration number format: '${bill.vehicleNo}'. Format example: DL01AB1234 or MH12DE1428.`
        );
      }
      if (!bill.vehicleType || !["R", "O"].includes(bill.vehicleType)) {
        addError("vehicleType", "Vehicle Type is mandatory when vehicle number is provided (R for Regular, O for ODC).");
      }
    }
  } else if (["2", "3", "4"].includes(mode)) {
    // Rail, Air, Ship
    if (!bill.transDocNo || bill.transDocNo.trim().length === 0) {
      addError(
        "transDocNo",
        `Transport document number (RR / Airway Bill / Bill of Lading) is mandatory for transport mode ${mode}.`
      );
    }
    if (!bill.transDocDate || !isValidDateStr(bill.transDocDate)) {
      addError(
        "transDocDate",
        "Transport document date in DD/MM/YYYY format is mandatory for Rail/Air/Ship."
      );
    }
  }

  // 9. Items Validation
  if (!bill.itemList || bill.itemList.length === 0) {
    addError("itemList", "At least one item is mandatory in the invoice.");
  } else {
    const isIntra = isIntraStateSupply(bill);
    let calculatedTaxableSum = 0;
    const validUnitCodes = new Set(UNIT_CODES.map((u) => u.code));

    bill.itemList.forEach((item, idx) => {
      const itemIdx = idx + 1;
      if (!item.productName || item.productName.trim().length === 0) {
        addError(`item_${itemIdx}_productName`, `Item #${itemIdx}: Product name is required.`);
      }

      const hsnStr = String(item.hsnCode || "").trim();
      if (!hsnStr) {
        addError(`item_${itemIdx}_hsnCode`, `Item #${itemIdx}: HSN Code is mandatory.`);
      } else if (!/^\d{2,8}$/.test(hsnStr)) {
        addError(
          `item_${itemIdx}_hsnCode`,
          `Item #${itemIdx}: HSN Code must be numeric and between 2 to 8 digits (current: '${hsnStr}').`
        );
      }

      const qty = Number(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        addError(`item_${itemIdx}_quantity`, `Item #${itemIdx}: Quantity must be greater than 0.`);
      }

      if (!item.qtyUnit || !validUnitCodes.has(item.qtyUnit.toUpperCase())) {
        addWarning(
          `item_${itemIdx}_qtyUnit`,
          `Item #${itemIdx}: Quantity unit '${item.qtyUnit}' is not in standard NIC list. Recommended: NOS, KGS, PCS, BOX.`
        );
      }

      const taxable = Number(item.taxableAmount);
      if (isNaN(taxable) || taxable <= 0) {
        addError(
          `item_${itemIdx}_taxableAmount`,
          `Item #${itemIdx}: Taxable amount must be greater than 0.`
        );
      } else {
        calculatedTaxableSum += taxable;
      }

      // Tax consistency
      const cgst = Number(item.cgstRate) || 0;
      const sgst = Number(item.sgstRate) || 0;
      const igst = Number(item.igstRate) || 0;

      if (isIntra) {
        if (igst > 0) {
          addError(
            `item_${itemIdx}_igstRate`,
            `Item #${itemIdx}: Intra-state supply cannot have IGST rate. Use CGST and SGST.`
          );
        }
        if (cgst !== sgst) {
          addError(
            `item_${itemIdx}_cgstRate`,
            `Item #${itemIdx}: CGST rate (${cgst}%) and SGST rate (${sgst}%) must be identical in intra-state transactions.`
          );
        }
      } else {
        if (cgst > 0 || sgst > 0) {
          addError(
            `item_${itemIdx}_cgstRate`,
            `Item #${itemIdx}: Inter-state supply cannot have CGST or SGST. Use IGST.`
          );
        }
      }
    });

    // 10. Totals Validation
    calculatedTaxableSum = roundToTwo(calculatedTaxableSum);
    const declaredTaxable = roundToTwo(Number(bill.totalValue) || 0);

    if (Math.abs(calculatedTaxableSum - declaredTaxable) > tolerance) {
      addError(
        "totalValue",
        `Header Total Taxable Value (₹${declaredTaxable}) does not match the sum of items taxable values (₹${calculatedTaxableSum}).`
      );
    }

    const expectedTotInvValue = roundToTwo(
      declaredTaxable +
        (Number(bill.cgstValue) || 0) +
        (Number(bill.sgstValue) || 0) +
        (Number(bill.igstValue) || 0) +
        (Number(bill.cessValue) || 0) +
        (Number(bill.cessNonAdvolValue) || 0) +
        (Number(bill.otherValue) || 0)
    );

    const declaredTotInvValue = roundToTwo(Number(bill.totInvValue) || 0);
    if (Math.abs(expectedTotInvValue - declaredTotInvValue) > tolerance) {
      addError(
        "totInvValue",
        `Total Invoice Value (₹${declaredTotInvValue}) does not equal Taxable Value + Taxes + Other Charges (₹${expectedTotInvValue}).`
      );
    }

    if (declaredTotInvValue < 50000) {
      addWarning(
        "totInvValue",
        `Invoice value (₹${declaredTotInvValue}) is less than ₹50,000. E-Way Bill is optional unless transporting specific notified goods.`
      );
    }
  }

  return errors;
}

export function validateBulkDocuments(
  bills: EWayBillDocument[]
): {
  validBills: EWayBillDocument[];
  invalidBills: { bill: EWayBillDocument; errors: ValidationError[] }[];
  allErrors: ValidationError[];
} {
  const validBills: EWayBillDocument[] = [];
  const invalidBills: { bill: EWayBillDocument; errors: ValidationError[] }[] = [];
  const allErrors: ValidationError[] = [];

  bills.forEach((bill) => {
    const billErrors = validateEWayBill(bill);
    const hardErrors = billErrors.filter((e) => e.severity === "error");

    if (hardErrors.length > 0) {
      invalidBills.push({ bill, errors: billErrors });
    } else {
      validBills.push(bill);
    }
    allErrors.push(...billErrors);
  });

  return { validBills, invalidBills, allErrors };
}
