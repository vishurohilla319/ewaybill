import { EWayBillDocument, EWayBillItem } from "../types/ewayBill";

export function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Checks whether the supply is Intra-state or Inter-state based on
 * the actual dispatch location and actual destination location.
 */
export function isIntraStateSupply(bill: Partial<EWayBillDocument>): boolean {
  // Check export / import
  const subSupply = Number(bill.subSupplyType);
  if (subSupply === 2 || subSupply === 3) {
    return false; // Export and Import are always Inter-State (IGST)
  }

  const dispatchState = Number(
    bill.transType === 3 || bill.transType === 4
      ? bill.actFromStateCode || bill.fromStateCode
      : bill.fromStateCode
  );

  const destinationState = Number(
    bill.transType === 2 || bill.transType === 4
      ? bill.actToStateCode || bill.toStateCode
      : bill.toStateCode
  );

  if (!dispatchState || !destinationState) return true;
  if (dispatchState === 99 || destinationState === 99) return false;

  return dispatchState === destinationState;
}

/**
 * Re-calculates individual line item rates and amounts based on whether
 * the transaction is intra-state (CGST + SGST) or inter-state (IGST).
 */
export function calculateItemTaxes(
  item: EWayBillItem,
  isIntra: boolean,
  effectiveGstRate?: number
): {
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  totalItemAmount: number;
} {
  const taxable = roundToTwo(Number(item.taxableAmount) || 0);

  // If effective rate passed, use it, else deduce from existing rates
  let totalRate =
    effectiveGstRate !== undefined
      ? effectiveGstRate
      : item.igstRate > 0
      ? item.igstRate
      : (Number(item.cgstRate) || 0) + (Number(item.sgstRate) || 0);

  let cgstRate = 0;
  let sgstRate = 0;
  let igstRate = 0;

  if (isIntra) {
    cgstRate = roundToTwo(totalRate / 2);
    sgstRate = roundToTwo(totalRate / 2);
    igstRate = 0;
  } else {
    cgstRate = 0;
    sgstRate = 0;
    igstRate = totalRate;
  }

  const cgstAmount = roundToTwo((taxable * cgstRate) / 100);
  const sgstAmount = roundToTwo((taxable * sgstRate) / 100);
  const igstAmount = roundToTwo((taxable * igstRate) / 100);
  const cessRate = Number(item.cessRate) || 0;
  const cessNonadvol = Number(item.cessNonadvol) || 0;
  const cessAmount = roundToTwo((taxable * cessRate) / 100) + cessNonadvol;

  const totalItemAmount = roundToTwo(
    taxable + cgstAmount + sgstAmount + igstAmount + cessAmount
  );

  return {
    cgstRate,
    sgstRate,
    igstRate,
    cgstAmount,
    sgstAmount,
    igstAmount,
    cessAmount,
    totalItemAmount,
  };
}

/**
 * Auto-calculates all header totals and syncs line item rates.
 * Returns the updated bill document.
 */
export function recalculateBill(
  bill: EWayBillDocument,
  syncItemRatesWithStates: boolean = true
): EWayBillDocument {
  const isIntra = isIntraStateSupply(bill);

  let totalValue = 0;
  let cgstValue = 0;
  let sgstValue = 0;
  let igstValue = 0;
  let cessValue = 0;
  let cessNonAdvolValue = 0;

  const updatedItemList: EWayBillItem[] = (bill.itemList || []).map(
    (item, index) => {
      const taxable = roundToTwo(Number(item.taxableAmount) || 0);
      totalValue += taxable;

      let itemToUse = { ...item, itemNo: index + 1 };

      if (syncItemRatesWithStates) {
        const taxes = calculateItemTaxes(itemToUse, isIntra);
        itemToUse.cgstRate = taxes.cgstRate;
        itemToUse.sgstRate = taxes.sgstRate;
        itemToUse.igstRate = taxes.igstRate;

        cgstValue += taxes.cgstAmount;
        sgstValue += taxes.sgstAmount;
        igstValue += taxes.igstAmount;
        cessValue += roundToTwo((taxable * (Number(item.cessRate) || 0)) / 100);
        cessNonAdvolValue += Number(item.cessNonadvol) || 0;
      } else {
        const itemCgst = roundToTwo(
          (taxable * (Number(itemToUse.cgstRate) || 0)) / 100
        );
        const itemSgst = roundToTwo(
          (taxable * (Number(itemToUse.sgstRate) || 0)) / 100
        );
        const itemIgst = roundToTwo(
          (taxable * (Number(itemToUse.igstRate) || 0)) / 100
        );
        const itemCess = roundToTwo(
          (taxable * (Number(itemToUse.cessRate) || 0)) / 100
        );
        const nonAdvol = Number(itemToUse.cessNonadvol) || 0;

        cgstValue += itemCgst;
        sgstValue += itemSgst;
        igstValue += itemIgst;
        cessValue += itemCess;
        cessNonAdvolValue += nonAdvol;
      }

      return itemToUse;
    }
  );

  totalValue = roundToTwo(totalValue);
  cgstValue = roundToTwo(cgstValue);
  sgstValue = roundToTwo(sgstValue);
  igstValue = roundToTwo(igstValue);
  cessValue = roundToTwo(cessValue);
  cessNonAdvolValue = roundToTwo(cessNonAdvolValue);

  const otherValue = roundToTwo(Number(bill.otherValue) || 0);
  const totInvValue = roundToTwo(
    totalValue +
      cgstValue +
      sgstValue +
      igstValue +
      cessValue +
      cessNonAdvolValue +
      otherValue
  );

  return {
    ...bill,
    itemList: updatedItemList,
    totalValue,
    cgstValue,
    sgstValue,
    igstValue,
    cessValue,
    cessNonAdvolValue,
    otherValue,
    totInvValue,
  };
}
