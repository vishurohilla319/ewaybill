"use client";

import React, { useState, useEffect } from "react";
import {
  FilePlus,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Download,
  Save,
  Layers,
  Sparkles,
  ArrowRight,
  Info,
  Building,
  Truck,
  RotateCcw,
} from "lucide-react";
import {
  CompanyProfile,
  DraftBill,
  EWayBillDocument,
  EWayBillItem,
  ItemMaster,
  TransporterMaster,
  ValidationError,
} from "../../lib/types/ewayBill";
import {
  DOC_TYPES,
  STATE_CODES,
  STATE_OPTIONS,
  SUB_SUPPLY_TYPES,
  SUPPLY_TYPES,
  TRANSACTION_TYPES,
  TRANSPORT_MODES,
  UNIT_CODES,
  VEHICLE_TYPES,
} from "../../lib/constants/gstData";
import {
  isIntraStateSupply,
  recalculateBill,
  roundToTwo,
} from "../../lib/engine/calculator";
import { validateEWayBill } from "../../lib/engine/validator";
import {
  formatJsonPayload,
  generateBulkEWayBillJson,
  generateExportFilename,
} from "../../lib/engine/jsonGenerator";

interface CreateBillViewProps {
  activeCompany?: CompanyProfile;
  transporters: TransporterMaster[];
  itemsMaster: ItemMaster[];
  onSaveDraft: (draft: DraftBill) => void;
  onAddToBulkBatch: (bill: EWayBillDocument) => void;
  onExportSuccess: (filename: string, jsonPayload: string, bill: EWayBillDocument) => void;
  onPreviewJson: (
    jsonStr: string,
    filename: string,
    invoiceCount: number,
    totalVal: number,
    errs: ValidationError[]
  ) => void;
  loadedDraft?: DraftBill | null;
  onClearLoadedDraft?: () => void;
}

export const CreateBillView: React.FC<CreateBillViewProps> = ({
  activeCompany,
  transporters,
  itemsMaster,
  onSaveDraft,
  onAddToBulkBatch,
  onExportSuccess,
  onPreviewJson,
  loadedDraft,
  onClearLoadedDraft,
}) => {
  const getTodayFormatted = () => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getInitialBill = (comp?: CompanyProfile): EWayBillDocument => {
    return {
      userGstin: comp?.gstin || "07AAACF1234D1Z8",
      supplyType: "O",
      subSupplyType: 1,
      subSupplyDesc: "",
      docType: "INV",
      docNo: "INV-" + Math.floor(1000 + Math.random() * 9000),
      docDate: getTodayFormatted(),
      transType: 1,

      // From
      fromGstin: comp?.gstin || "07AAACF1234D1Z8",
      fromTrdName: comp?.tradeName || comp?.legalName || "Fin Tax Solutions Pvt Ltd",
      fromAddr1: comp?.address1 || "Plot No. 45, Barakhamba Road",
      fromAddr2: comp?.address2 || "Connaught Place",
      fromPlace: comp?.place || "New Delhi",
      fromPincode: comp ? Number(comp.pincode) : 110001,
      actFromStateCode: comp?.stateCode || 7,
      fromStateCode: comp?.stateCode || 7,

      // To
      toGstin: "27AABCR9988E1Z4",
      toTrdName: "Rohilla Logistics & Manufacturing Co.",
      toAddr1: "Gala No 12, Phase 2, MIDC Industrial Area",
      toAddr2: "Andheri East",
      toPlace: "Mumbai",
      toPincode: 400093,
      actToStateCode: 27,
      toStateCode: 27,

      totalValue: 0,
      cgstValue: 0,
      sgstValue: 0,
      igstValue: 0,
      cessValue: 0,
      cessNonAdvolValue: 0,
      otherValue: 0,
      totInvValue: 0,

      transporterId: "",
      transporterName: "",
      transDocNo: "",
      transDocDate: "",
      transMode: "1",
      transDistance: 1420,
      vehicleNo: "DL01AB1234",
      vehicleType: "R",

      itemList: [
        {
          itemNo: 1,
          productName: "Industrial Power Cable 4-Core",
          productDesc: "Heavy duty copper armoured cable 1100V",
          hsnCode: 85444990,
          quantity: 100,
          qtyUnit: "MTR",
          taxableAmount: 45000,
          cgstRate: 0,
          sgstRate: 0,
          igstRate: 18,
          cessRate: 0,
          cessNonadvol: 0,
        },
      ],
    };
  };

  const [bill, setBill] = useState<EWayBillDocument>(() => {
    if (loadedDraft) return loadedDraft.bill;
    return getInitialBill(activeCompany);
  });

  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Recalculate and validate whenever relevant fields change
  useEffect(() => {
    const recalculated = recalculateBill(bill, true);
    // Only update if numbers changed to prevent infinite loop
    if (
      recalculated.totalValue !== bill.totalValue ||
      recalculated.totInvValue !== bill.totInvValue ||
      recalculated.cgstValue !== bill.cgstValue ||
      recalculated.igstValue !== bill.igstValue
    ) {
      setBill(recalculated);
    }
    const errors = validateEWayBill(recalculated);
    setValidationErrors(errors);
  }, [
    bill.itemList,
    bill.fromStateCode,
    bill.toStateCode,
    bill.actFromStateCode,
    bill.actToStateCode,
    bill.transType,
    bill.subSupplyType,
    bill.otherValue,
  ]);

  // When active company changes, offer to sync
  const handleSyncCompany = () => {
    if (!activeCompany) return;
    setBill((prev) => ({
      ...prev,
      userGstin: activeCompany.gstin,
      fromGstin: activeCompany.gstin,
      fromTrdName: activeCompany.tradeName || activeCompany.legalName,
      fromAddr1: activeCompany.address1,
      fromAddr2: activeCompany.address2 || "",
      fromPlace: activeCompany.place,
      fromPincode: Number(activeCompany.pincode),
      fromStateCode: activeCompany.stateCode,
      actFromStateCode: activeCompany.stateCode,
    }));
  };

  const handleUpdateField = (field: keyof EWayBillDocument, value: any) => {
    setBill((prev) => {
      const updated = { ...prev, [field]: value };

      // Auto update state code when GSTIN entered
      if (
        (field === "fromGstin" || field === "toGstin") &&
        typeof value === "string" &&
        value.trim().length >= 2 &&
        value.trim().toUpperCase() !== "URP"
      ) {
        const stateNum = parseInt(value.substring(0, 2), 10);
        if (!isNaN(stateNum) && STATE_CODES[stateNum]) {
          if (field === "fromGstin") {
            updated.fromStateCode = stateNum;
            if (updated.transType === 1 || updated.transType === 2) {
              updated.actFromStateCode = stateNum;
            }
          } else {
            updated.toStateCode = stateNum;
            if (updated.transType === 1 || updated.transType === 3) {
              updated.actToStateCode = stateNum;
            }
          }
        }
      }

      // If user sets URP for recipient
      if (field === "toGstin" && value.toUpperCase() === "URP") {
        if (updated.subSupplyType === 3) {
          updated.toStateCode = 99;
          updated.actToStateCode = 99;
          updated.toPincode = 999999;
        }
      }

      return updated;
    });
  };

  // Item list handlers
  const handleItemChange = (index: number, field: keyof EWayBillItem, val: any) => {
    const updatedItems = [...bill.itemList];
    updatedItems[index] = { ...updatedItems[index], [field]: val };

    const updatedBill = { ...bill, itemList: updatedItems };
    const recalculated = recalculateBill(updatedBill, true);
    setBill(recalculated);
  };

  const handleAddItem = () => {
    const isIntra = isIntraStateSupply(bill);
    const newItem: EWayBillItem = {
      itemNo: bill.itemList.length + 1,
      productName: "",
      productDesc: "",
      hsnCode: "",
      quantity: 1,
      qtyUnit: "NOS",
      taxableAmount: 0,
      cgstRate: isIntra ? 9 : 0,
      sgstRate: isIntra ? 9 : 0,
      igstRate: isIntra ? 0 : 18,
      cessRate: 0,
      cessNonadvol: 0,
    };
    const updatedBill = { ...bill, itemList: [...bill.itemList, newItem] };
    setBill(recalculateBill(updatedBill, true));
  };

  const handleDeleteItem = (index: number) => {
    if (bill.itemList.length <= 1) {
      alert("At least one item is mandatory in an E-Way Bill.");
      return;
    }
    const updated = bill.itemList.filter((_, i) => i !== index);
    const updatedBill = { ...bill, itemList: updated };
    setBill(recalculateBill(updatedBill, true));
  };

  const handleDuplicateItem = (index: number) => {
    const itemToClone = bill.itemList[index];
    const cloned = { ...itemToClone, itemNo: bill.itemList.length + 1 };
    const updatedBill = { ...bill, itemList: [...bill.itemList, cloned] };
    setBill(recalculateBill(updatedBill, true));
  };

  const handleSelectMasterItem = (index: number, itemId: string) => {
    const found = itemsMaster.find((it) => it.id === itemId);
    if (!found) return;

    const isIntra = isIntraStateSupply(bill);
    const rate = found.defaultGstRate || 18;

    const updatedItems = [...bill.itemList];
    updatedItems[index] = {
      ...updatedItems[index],
      productName: found.name,
      productDesc: found.description || found.name,
      hsnCode: found.hsnCode,
      qtyUnit: found.unit || "NOS",
      cgstRate: isIntra ? rate / 2 : 0,
      sgstRate: isIntra ? rate / 2 : 0,
      igstRate: isIntra ? 0 : rate,
      cessRate: found.cessRate || 0,
      cessNonadvol: found.cessNonadvol || 0,
    };
    const updatedBill = { ...bill, itemList: updatedItems };
    setBill(recalculateBill(updatedBill, true));
  };

  const handleSelectTransporter = (transId: string) => {
    const found = transporters.find((t) => t.id === transId);
    if (!found) return;
    setBill((prev) => ({
      ...prev,
      transporterId: found.transporterId,
      transporterName: found.name,
    }));
  };

  // Actions
  const handleSaveDraftAction = () => {
    const draft: DraftBill = {
      id: loadedDraft ? loadedDraft.id : `draft-${Date.now()}`,
      name: `${bill.docNo || "Draft"} - ${bill.toTrdName || "Consignee"}`,
      bill,
      updatedAt: new Date().toLocaleString("en-IN"),
    };
    onSaveDraft(draft);
    setSaveSuccessMsg("Draft saved successfully!");
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleAddToBatchAction = () => {
    const errors = validateEWayBill(bill);
    const hardErrors = errors.filter((e) => e.severity === "error");
    if (hardErrors.length > 0) {
      alert(`Cannot add to batch due to ${hardErrors.length} validation error(s). Please review errors.`);
      return;
    }
    onAddToBulkBatch(bill);
    setSaveSuccessMsg(`Invoice ${bill.docNo} added to Bulk Batch!`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handlePreviewAction = () => {
    const recalculated = recalculateBill(bill, true);
    const payload = generateBulkEWayBillJson([recalculated]);
    const jsonStr = formatJsonPayload(payload);
    const filename = generateExportFilename(`EWB_${bill.docNo.replace(/[^A-Za-z0-9]/g, "")}`);
    const errs = validateEWayBill(recalculated);

    onPreviewJson(jsonStr, filename, 1, recalculated.totInvValue, errs);
  };

  const handleDirectDownloadAction = () => {
    const recalculated = recalculateBill(bill, true);
    const errors = validateEWayBill(recalculated);
    const hardErrors = errors.filter((e) => e.severity === "error");

    if (hardErrors.length > 0) {
      alert(`Validation failed with ${hardErrors.length} error(s). Click 'Preview & Validate' to inspect issues.`);
      return;
    }

    const payload = generateBulkEWayBillJson([recalculated]);
    const jsonStr = formatJsonPayload(payload);
    const filename = generateExportFilename(`EWB_${bill.docNo.replace(/[^A-Za-z0-9]/g, "")}`);

    onExportSuccess(filename, jsonStr, recalculated);
  };

  const handleResetForm = () => {
    if (confirm("Reset current form to blank defaults?")) {
      setBill(getInitialBill(activeCompany));
      if (onClearLoadedDraft) onClearLoadedDraft();
    }
  };

  const isIntra = isIntraStateSupply(bill);
  const hardErrors = validationErrors.filter((e) => e.severity === "error");
  const warnings = validationErrors.filter((e) => e.severity === "warning");

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FilePlus className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-800">
                Invoice & Transport Details Form
              </h2>
              <span
                className={`text-xs px-2 py-0.5 rounded font-semibold ${
                  isIntra
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "bg-purple-50 text-purple-700 border border-purple-200"
                }`}
              >
                {isIntra ? "Intra-State (CGST + SGST)" : "Inter-State (IGST)"}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Form strictly mapped to official Indian E-Way Bill NIC bulk schema
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {saveSuccessMsg && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md animate-pulse">
              {saveSuccessMsg}
            </span>
          )}

          <button
            onClick={handleResetForm}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
            title="Reset form"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleSaveDraftAction}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            <span>Save Draft</span>
          </button>

          <button
            onClick={handleAddToBatchAction}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Add to Bulk Batch</span>
          </button>

          <button
            onClick={handlePreviewAction}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <span>Preview & Validate</span>
          </button>

          <button
            onClick={handleDirectDownloadAction}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download JSON</span>
          </button>
        </div>
      </div>

      {/* Validation Alert Bar */}
      {hardErrors.length > 0 && (
        <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs space-y-1.5">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{hardErrors.length} Schema Validation Error(s) detected:</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1 pl-6">
            {hardErrors.slice(0, 4).map((err, i) => (
              <div key={i} className="text-slate-700 truncate">
                • <strong className="font-semibold text-rose-800">{err.field}:</strong> {err.message}
              </div>
            ))}
            {hardErrors.length > 4 && (
              <div className="text-indigo-600 font-semibold cursor-pointer" onClick={handlePreviewAction}>
                + {hardErrors.length - 4} more errors. Click here to view all in Validation Report.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section 1: Transaction & Document Information */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2.5">
          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] flex items-center justify-center font-bold">1</span>
          <span>Transaction & Document Classification</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Supply Type */}
          <div>
            <label className="block text-slate-600 font-medium mb-1">
              Supply Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={bill.supplyType}
              onChange={(e) => handleUpdateField("supplyType", e.target.value)}
              className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500 bg-white"
            >
              {SUPPLY_TYPES.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sub Supply Type */}
          <div>
            <label className="block text-slate-600 font-medium mb-1">
              Sub-Supply Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={bill.subSupplyType}
              onChange={(e) => handleUpdateField("subSupplyType", Number(e.target.value))}
              className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500 bg-white"
            >
              {(SUB_SUPPLY_TYPES[bill.supplyType] || SUB_SUPPLY_TYPES.O).map((sub) => (
                <option key={sub.code} value={sub.code}>
                  {sub.code} - {sub.label}
                </option>
              ))}
            </select>
          </div>

          {/* Document Type */}
          <div>
            <label className="block text-slate-600 font-medium mb-1">
              Document Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={bill.docType}
              onChange={(e) => handleUpdateField("docType", e.target.value)}
              className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500 bg-white"
            >
              {DOC_TYPES.map((dt) => (
                <option key={dt.code} value={dt.code}>
                  {dt.code} - {dt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Transaction Type */}
          <div>
            <label className="block text-slate-600 font-medium mb-1">
              Transaction Flow Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={bill.transType}
              onChange={(e) => handleUpdateField("transType", Number(e.target.value))}
              className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500 bg-white"
            >
              {TRANSACTION_TYPES.map((tt) => (
                <option key={tt.code} value={tt.code}>
                  {tt.code} - {tt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Document Number */}
          <div>
            <label className="block text-slate-600 font-medium mb-1">
              Document / Invoice No. <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              maxLength={16}
              value={bill.docNo}
              onChange={(e) => handleUpdateField("docNo", e.target.value.toUpperCase())}
              placeholder="e.g. INV-2026/01"
              className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 font-mono uppercase focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[10px] text-slate-400">Max 16 chars (A-Z, 0-9, /, -)</span>
          </div>

          {/* Document Date */}
          <div>
            <label className="block text-slate-600 font-medium mb-1 flex items-center justify-between">
              <span>Document Date <span className="text-rose-500">*</span></span>
              <button
                type="button"
                onClick={() => handleUpdateField("docDate", getTodayFormatted())}
                className="text-indigo-600 hover:underline text-[10px]"
              >
                Today
              </button>
            </label>
            <input
              type="text"
              value={bill.docDate}
              onChange={(e) => handleUpdateField("docDate", e.target.value)}
              placeholder="DD/MM/YYYY"
              className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[10px] text-slate-400">Strict format: DD/MM/YYYY</span>
          </div>

          {/* Sub Supply Desc if Others */}
          {Number(bill.subSupplyType) === 8 && (
            <div className="sm:col-span-2">
              <label className="block text-slate-600 font-medium mb-1">
                Sub-Supply Description <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={bill.subSupplyDesc || ""}
                onChange={(e) => handleUpdateField("subSupplyDesc", e.target.value)}
                placeholder="Reason for supply (mandatory when sub-supply is Others)"
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Consignor (From) & Consignee (To) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bill From (Supplier) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] flex items-center justify-center font-bold">2A</span>
              <span>Bill From (Consignor / Supplier)</span>
            </h3>
            {activeCompany && (
              <button
                type="button"
                onClick={handleSyncCompany}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
              >
                <Building className="w-3 h-3" />
                <span>Fill from {activeCompany.tradeName || "Active Co."}</span>
              </button>
            )}
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Supplier GSTIN <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={15}
                  value={bill.fromGstin}
                  onChange={(e) => handleUpdateField("fromGstin", e.target.value.toUpperCase())}
                  placeholder="15-character GSTIN or URP"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 font-mono uppercase focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Supplier Trade / Legal Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={bill.fromTrdName}
                  onChange={(e) => handleUpdateField("fromTrdName", e.target.value)}
                  placeholder="Supplier business name"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Address Line 1 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={bill.fromAddr1}
                onChange={(e) => handleUpdateField("fromAddr1", e.target.value)}
                placeholder="Building / Plot No., Industrial Area"
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  City / Place <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={bill.fromPlace}
                  onChange={(e) => handleUpdateField("fromPlace", e.target.value)}
                  placeholder="e.g. New Delhi"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  PIN Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  value={bill.fromPincode || ""}
                  onChange={(e) => handleUpdateField("fromPincode", Number(e.target.value))}
                  placeholder="6 digits"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  State <span className="text-rose-500">*</span>
                </label>
                <select
                  value={bill.fromStateCode}
                  onChange={(e) => {
                    const sc = Number(e.target.value);
                    handleUpdateField("fromStateCode", sc);
                    if (bill.transType === 1 || bill.transType === 2) {
                      handleUpdateField("actFromStateCode", sc);
                    }
                  }}
                  className="w-full border border-slate-300 rounded px-2 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500 bg-white"
                >
                  {STATE_OPTIONS.map((st) => (
                    <option key={st.code} value={st.code}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* If Dispatch From differs (TransType 3 or 4) */}
            {(bill.transType === 3 || bill.transType === 4) && (
              <div className="mt-3 p-3 rounded-lg border border-indigo-200 bg-indigo-50/50 space-y-2">
                <div className="font-semibold text-indigo-900 flex items-center justify-between text-xs">
                  <span>Actual Dispatch From Location (Plant / Godown)</span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">Trans Type {bill.transType}</span>
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Actual Dispatch State Code <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={bill.actFromStateCode}
                    onChange={(e) => handleUpdateField("actFromStateCode", Number(e.target.value))}
                    className="w-full border border-slate-300 rounded px-2 py-1 text-slate-800 bg-white"
                  >
                    {STATE_OPTIONS.map((st) => (
                      <option key={st.code} value={st.code}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bill To (Buyer / Consignee) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] flex items-center justify-center font-bold">2B</span>
              <span>Bill To (Consignee / Buyer)</span>
            </h3>
            <button
              type="button"
              onClick={() => handleUpdateField("toGstin", "URP")}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Set Unregistered (URP)
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Recipient GSTIN <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={15}
                  value={bill.toGstin}
                  onChange={(e) => handleUpdateField("toGstin", e.target.value.toUpperCase())}
                  placeholder="15-character GSTIN or URP"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 font-mono uppercase focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Recipient Trade / Legal Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={bill.toTrdName}
                  onChange={(e) => handleUpdateField("toTrdName", e.target.value)}
                  placeholder="Buyer business name"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Address Line 1 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={bill.toAddr1}
                onChange={(e) => handleUpdateField("toAddr1", e.target.value)}
                placeholder="Buyer delivery/office address"
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  City / Place <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={bill.toPlace}
                  onChange={(e) => handleUpdateField("toPlace", e.target.value)}
                  placeholder="e.g. Mumbai"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  PIN Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  value={bill.toPincode || ""}
                  onChange={(e) => handleUpdateField("toPincode", Number(e.target.value))}
                  placeholder="6 digits (999999 for export)"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  State <span className="text-rose-500">*</span>
                </label>
                <select
                  value={bill.toStateCode}
                  onChange={(e) => {
                    const sc = Number(e.target.value);
                    handleUpdateField("toStateCode", sc);
                    if (bill.transType === 1 || bill.transType === 3) {
                      handleUpdateField("actToStateCode", sc);
                    }
                  }}
                  className="w-full border border-slate-300 rounded px-2 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500 bg-white"
                >
                  {STATE_OPTIONS.map((st) => (
                    <option key={st.code} value={st.code}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* If Ship To differs (TransType 2 or 4) */}
            {(bill.transType === 2 || bill.transType === 4) && (
              <div className="mt-3 p-3 rounded-lg border border-indigo-200 bg-indigo-50/50 space-y-2">
                <div className="font-semibold text-indigo-900 flex items-center justify-between text-xs">
                  <span>Actual Delivery / Ship-To Location</span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">Trans Type {bill.transType}</span>
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Actual Ship-To State Code <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={bill.actToStateCode}
                    onChange={(e) => handleUpdateField("actToStateCode", Number(e.target.value))}
                    className="w-full border border-slate-300 rounded px-2 py-1 text-slate-800 bg-white"
                  >
                    {STATE_OPTIONS.map((st) => (
                      <option key={st.code} value={st.code}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Item and Goods List (Multi-item) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] flex items-center justify-center font-bold">3</span>
            <span>Item & Commodity Details ({bill.itemList.length} items)</span>
          </h3>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Item</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left acc-table min-w-[850px]">
            <thead>
              <tr>
                <th className="w-8">#</th>
                <th className="w-64">Product & Description</th>
                <th className="w-28">HSN Code</th>
                <th className="w-24">Qty</th>
                <th className="w-24">Unit</th>
                <th className="w-32">Taxable Amt (₹)</th>
                {isIntra ? (
                  <>
                    <th className="w-24">CGST %</th>
                    <th className="w-24">SGST %</th>
                  </>
                ) : (
                  <th className="w-28">IGST %</th>
                )}
                <th className="w-20">Cess %</th>
                <th className="w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bill.itemList.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="font-bold text-slate-500 text-xs">
                    {idx + 1}
                  </td>
                  <td>
                    <div className="space-y-1">
                      {itemsMaster.length > 0 && (
                        <select
                          onChange={(e) => {
                            if (e.target.value) handleSelectMasterItem(idx, e.target.value);
                          }}
                          defaultValue=""
                          aria-label="Fill from Master Items"
                          className="w-full text-[10px] border border-slate-200 rounded px-1.5 py-0.5 bg-slate-50 text-slate-600 focus:outline-none"
                        >
                          <option value="">-- Fill from Master Items --</option>
                          {itemsMaster.map((im) => (
                            <option key={im.id} value={im.id}>
                              {im.name} ({im.hsnCode})
                            </option>
                          ))}
                        </select>
                      )}
                      <input
                        type="text"
                        value={item.productName}
                        onChange={(e) => handleItemChange(idx, "productName", e.target.value)}
                        placeholder="Product Name"
                        className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 font-medium"
                      />
                    </div>
                  </td>
                  <td>
                    <input
                      type="text"
                      value={item.hsnCode}
                      onChange={(e) => handleItemChange(idx, "hsnCode", e.target.value.replace(/\D/g, ""))}
                      placeholder="e.g. 8471"
                      className="w-full border border-slate-300 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="any"
                      value={item.quantity || ""}
                      onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))}
                      placeholder="1"
                      className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500 text-right font-mono"
                    />
                  </td>
                  <td>
                    <select
                      value={item.qtyUnit}
                      onChange={(e) => handleItemChange(idx, "qtyUnit", e.target.value)}
                      className="w-full border border-slate-300 rounded px-1.5 py-1 text-xs bg-white focus:outline-none"
                    >
                      {UNIT_CODES.map((u) => (
                        <option key={u.code} value={u.code}>
                          {u.code}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      value={item.taxableAmount || ""}
                      onChange={(e) => handleItemChange(idx, "taxableAmount", Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full border border-slate-300 rounded px-2 py-1 text-xs font-mono text-right focus:outline-none focus:border-indigo-500 font-semibold"
                    />
                  </td>
                  {isIntra ? (
                    <>
                      <td>
                        <input
                          type="number"
                          step="0.1"
                          value={item.cgstRate}
                          onChange={(e) => {
                            const rate = Number(e.target.value);
                            handleItemChange(idx, "cgstRate", rate);
                            handleItemChange(idx, "sgstRate", rate);
                          }}
                          className="w-full border border-slate-300 rounded px-1.5 py-1 text-xs font-mono text-right focus:outline-none"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.1"
                          value={item.sgstRate}
                          onChange={(e) => {
                            const rate = Number(e.target.value);
                            handleItemChange(idx, "sgstRate", rate);
                            handleItemChange(idx, "cgstRate", rate);
                          }}
                          className="w-full border border-slate-300 rounded px-1.5 py-1 text-xs font-mono text-right focus:outline-none"
                        />
                      </td>
                    </>
                  ) : (
                    <td>
                      <input
                        type="number"
                        step="0.1"
                        value={item.igstRate}
                        onChange={(e) => handleItemChange(idx, "igstRate", Number(e.target.value))}
                        className="w-full border border-slate-300 rounded px-1.5 py-1 text-xs font-mono text-right focus:outline-none"
                      />
                    </td>
                  )}
                  <td>
                    <input
                      type="number"
                      step="0.1"
                      value={item.cessRate || 0}
                      onChange={(e) => handleItemChange(idx, "cessRate", Number(e.target.value))}
                      className="w-full border border-slate-300 rounded px-1.5 py-1 text-xs font-mono text-right focus:outline-none"
                    />
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleDuplicateItem(idx)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                        title="Duplicate line"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                        title="Delete line"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 4: Transportation & Vehicle Details (Part B) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2.5">
          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] flex items-center justify-center font-bold">4</span>
          <span>Transportation Details (Part B Transit Movement)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Transport Mode */}
          <div>
            <label className="block text-slate-600 font-medium mb-1">
              Transport Mode <span className="text-rose-500">*</span>
            </label>
            <select
              value={bill.transMode}
              onChange={(e) => handleUpdateField("transMode", e.target.value)}
              className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500 bg-white"
            >
              {TRANSPORT_MODES.map((tm) => (
                <option key={tm.code} value={tm.code}>
                  {tm.label}
                </option>
              ))}
            </select>
          </div>

          {/* Approximate Distance */}
          <div>
            <label className="block text-slate-600 font-medium mb-1">
              Approximate Distance (KM) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={bill.transDistance || ""}
              onChange={(e) => handleUpdateField("transDistance", Number(e.target.value))}
              placeholder="e.g. 150"
              className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[10px] text-slate-400">Direct road/transit distance</span>
          </div>

          {/* Transporter ID */}
          <div>
            <label className="block text-slate-600 font-medium mb-1 flex items-center justify-between">
              <span>Transporter ID / GSTIN</span>
              {transporters.length > 0 && (
                <span className="text-[10px] text-indigo-600 font-semibold">Master Available</span>
              )}
            </label>
            <div className="space-y-1">
              {transporters.length > 0 && (
                <select
                  onChange={(e) => {
                    if (e.target.value) handleSelectTransporter(e.target.value);
                  }}
                  defaultValue=""
                  aria-label="Pick from Transporter Master"
                  className="w-full text-[10px] border border-slate-200 rounded px-1.5 py-0.5 bg-slate-50 text-slate-600 focus:outline-none"
                >
                  <option value="">-- Pick from Transporter Master --</option>
                  {transporters.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.transporterId})
                    </option>
                  ))}
                </select>
              )}
              <input
                type="text"
                maxLength={15}
                value={bill.transporterId || ""}
                onChange={(e) => handleUpdateField("transporterId", e.target.value.toUpperCase())}
                placeholder="15-digit GSTIN / TRANSIN"
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 font-mono uppercase focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Transporter Name */}
          <div>
            <label className="block text-slate-600 font-medium mb-1">
              Transporter Name
            </label>
            <input
              type="text"
              value={bill.transporterName || ""}
              onChange={(e) => handleUpdateField("transporterName", e.target.value)}
              placeholder="e.g. VRL Logistics Ltd"
              className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Mode 1: Road fields */}
          {bill.transMode === "1" && (
            <>
              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Vehicle Number <span className="text-slate-400 font-normal">(if Part-B completed)</span>
                </label>
                <input
                  type="text"
                  value={bill.vehicleNo || ""}
                  onChange={(e) => handleUpdateField("vehicleNo", e.target.value.toUpperCase().replace(/\s/g, ""))}
                  placeholder="e.g. DL01AB1234"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 font-mono uppercase focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-400">Format: Standard RTO Registration</span>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Vehicle Type
                </label>
                <select
                  value={bill.vehicleType || "R"}
                  onChange={(e) => handleUpdateField("vehicleType", e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500 bg-white"
                >
                  {VEHICLE_TYPES.map((vt) => (
                    <option key={vt.code} value={vt.code}>
                      {vt.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Mode 2,3,4: Document fields */}
          {["2", "3", "4"].includes(bill.transMode || "") && (
            <>
              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Transport Doc No. (RR / AWB / BL) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={bill.transDocNo || ""}
                  onChange={(e) => handleUpdateField("transDocNo", e.target.value)}
                  placeholder="Receipt / Airway bill number"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Transport Doc Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={bill.transDocDate || ""}
                  onChange={(e) => handleUpdateField("transDocDate", e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Section 5: Financial Totals Summary Card */}
      <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg border border-slate-800">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-2 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Official Tax Computation
            </span>
            <h4 className="text-xl font-bold">
              Automatic Tax & Value Reconciliation
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Taxes are automatically apportioned into CGST/SGST (for intra-state movements) or IGST (for inter-state dispatches) according to the NIC E-Way Bill schema rules. Values can be reviewed prior to export.
            </p>
          </div>

          <div className="lg:col-span-2 bg-slate-950/80 rounded-lg p-4 border border-slate-800 space-y-2.5 text-xs font-mono">
            <div className="flex justify-between text-slate-300">
              <span>Total Taxable Amount (Assessable Value):</span>
              <span className="font-semibold text-white">
                ₹{bill.totalValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>

            {isIntra ? (
              <>
                <div className="flex justify-between text-slate-300">
                  <span>Central GST (CGST Value):</span>
                  <span>₹{bill.cgstValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>State GST (SGST Value):</span>
                  <span>₹{bill.sgstValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-slate-300">
                <span>Integrated GST (IGST Value):</span>
                <span>₹{bill.igstValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            {bill.cessValue > 0 && (
              <div className="flex justify-between text-slate-300">
                <span>Cess Value:</span>
                <span>₹{bill.cessValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-slate-800">
              <span className="font-sans text-xs">Other Charges / Rounding (₹):</span>
              <input
                type="number"
                step="0.01"
                value={bill.otherValue || ""}
                onChange={(e) => handleUpdateField("otherValue", Number(e.target.value))}
                placeholder="0.00"
                className="w-28 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-right text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-between items-center text-sm font-bold text-emerald-400 pt-2 border-t border-slate-800">
              <span>Total Invoice Value (totInvValue):</span>
              <span className="text-base">
                ₹{bill.totInvValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
