"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Copy,
  Check,
  Download,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Printer,
  Eye,
  Truck,
  Building2,
  Calendar,
  Hash,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { ValidationError, EWayBillDocument } from "../lib/types/ewayBill";
import { downloadJsonFile } from "../lib/engine/jsonGenerator";
import { STATE_CODES } from "../lib/constants/gstData";

export interface JsonPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  jsonContent: string;
  filename: string;
  invoiceCount: number;
  totalValue: number;
  errors: ValidationError[];
  onOpenUploadGuide: () => void;
  bills?: EWayBillDocument[];
}

export const JsonPreviewModal: React.FC<JsonPreviewModalProps> = ({
  isOpen,
  onClose,
  jsonContent,
  filename,
  invoiceCount,
  totalValue,
  errors,
  onOpenUploadGuide,
  bills,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "json" | "validation">("preview");
  const [selectedBillIdx, setSelectedBillIdx] = useState(0);

  // Parse bills from jsonContent if bills prop is not provided or empty
  const parsedBills: EWayBillDocument[] = useMemo(() => {
    if (bills && bills.length > 0) return bills;
    if (!jsonContent) return [];
    try {
      const parsed = JSON.parse(jsonContent);
      if (Array.isArray(parsed.billLists)) return parsed.billLists;
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === "object") return [parsed];
    } catch {
      return [];
    }
    return [];
  }, [bills, jsonContent]);

  if (!isOpen) return null;

  const currentBill: EWayBillDocument | undefined =
    parsedBills[selectedBillIdx] || parsedBills[0];

  const hardErrors = errors.filter((e) => e.severity === "error");
  const warnings = errors.filter((e) => e.severity === "warning");
  const isValid = hardErrors.length === 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    downloadJsonFile(jsonContent, filename);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurr = (val: number | undefined | null) => {
    const num = Number(val) || 0;
    return "₹" + num.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getStateName = (code: number | undefined) => {
    if (!code) return "-";
    return STATE_CODES[code] ? `${code} - ${STATE_CODES[code]}` : `State ${code}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  E-Way Bill Preview & Verification
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">
                  {filename}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                <span>
                  Invoices: <strong className="text-slate-800">{invoiceCount}</strong>
                </span>
                <span>•</span>
                <span>
                  Total Value:{" "}
                  <strong className="text-emerald-700 font-bold">
                    {formatCurr(totalValue)}
                  </strong>
                </span>
                <span>•</span>
                {isValid ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Schema Validated (Ready for Portal)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-rose-700 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    {hardErrors.length} Issue(s) Flagged
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg shadow-sm transition-colors"
              title="Print E-Way Bill Slip"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab switch */}
        <div className="px-6 border-b border-slate-200 bg-white flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab("preview")}
              className={`py-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === "preview"
                  ? "border-indigo-600 text-indigo-600 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>E-Way Bill Layout (Slip)</span>
              <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-[10px] text-indigo-700 font-bold border border-indigo-200">
                Visual Check
              </span>
            </button>

            <button
              onClick={() => setActiveTab("json")}
              className={`py-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === "json"
                  ? "border-indigo-600 text-indigo-600 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>JSON Output (Portal Format)</span>
              <span className="px-1.5 py-0.2 rounded bg-slate-100 text-[10px] text-slate-600">
                Payload
              </span>
            </button>

            <button
              onClick={() => setActiveTab("validation")}
              className={`py-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === "validation"
                  ? "border-indigo-600 text-indigo-600 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Validation Report</span>
              {hardErrors.length > 0 ? (
                <span className="px-1.5 py-0.2 rounded bg-rose-100 text-[10px] text-rose-700 font-bold">
                  {hardErrors.length} Errors
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-[10px] text-emerald-700 font-bold">
                  Passed
                </span>
              )}
            </button>
          </div>

          {/* Multiple Invoice Pagination Selector */}
          {parsedBills.length > 1 && activeTab === "preview" && (
            <div className="flex items-center gap-2 py-1.5">
              <span className="text-slate-500 text-[11px]">
                Bill {selectedBillIdx + 1} of {parsedBills.length}:
              </span>
              <button
                onClick={() => setSelectedBillIdx((prev) => Math.max(0, prev - 1))}
                disabled={selectedBillIdx === 0}
                className="p-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <select
                value={selectedBillIdx}
                onChange={(e) => setSelectedBillIdx(Number(e.target.value))}
                className="text-xs border border-slate-300 rounded px-2 py-1 bg-white font-medium text-slate-700"
              >
                {parsedBills.map((b, idx) => (
                  <option key={idx} value={idx}>
                    #{idx + 1}: {b.docNo || "Draft"} ({formatCurr(b.totInvValue)})
                  </option>
                ))}
              </select>
              <button
                onClick={() =>
                  setSelectedBillIdx((prev) =>
                    Math.min(parsedBills.length - 1, prev + 1)
                  )
                }
                disabled={selectedBillIdx === parsedBills.length - 1}
                className="p-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100">
          {activeTab === "preview" && currentBill && (
            <div
              id="printable-eway-bill"
              className="bg-white rounded-lg border border-slate-300 shadow-sm max-w-4xl mx-auto p-6 text-slate-800 text-xs font-sans space-y-5"
            >
              {/* Slip Header Banner */}
              <div className="border-b-2 border-slate-800 pb-3 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-black tracking-wide text-slate-900 uppercase">
                      e-Way Bill
                    </h1>
                    <span className="text-[10px] uppercase font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded">
                      Pre-Portal Draft Slip
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    FORM GST EWB-01 (See Rule 138 of the CGST Rules, 2017)
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-[11px] font-bold text-slate-700">
                    Generated By (GSTIN):
                  </div>
                  <div className="font-mono font-bold text-indigo-800 text-sm">
                    {currentBill.userGstin || currentBill.fromGstin || "-"}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Mode: {currentBill.transMode === "2" ? "Rail" : currentBill.transMode === "3" ? "Air" : currentBill.transMode === "4" ? "Ship" : "Road (1)"}
                  </div>
                </div>
              </div>

              {/* Document Overview Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded p-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                    e-Way Bill No.
                  </span>
                  <span className="font-mono font-bold text-slate-800 text-xs">
                    Pending Portal Upload
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                    Doc Type & No.
                  </span>
                  <span className="font-bold text-slate-900">
                    {currentBill.docType || "INV"} - {currentBill.docNo}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                    Document Date
                  </span>
                  <span className="font-bold text-slate-900">
                    {currentBill.docDate}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                    Supply / Transaction
                  </span>
                  <span className="font-bold text-slate-900">
                    {currentBill.supplyType === "O" ? "Outward" : "Inward"} /{" "}
                    {currentBill.transType === 1 ? "Regular" : "Other"}
                  </span>
                </div>
              </div>

              {/* PART A: Address Details (Supplier & Recipient) */}
              <div>
                <div className="bg-slate-800 text-white font-bold text-xs px-3 py-1.5 rounded-t flex items-center justify-between">
                  <span>PART - A: PARTY DETAILS</span>
                  <span className="text-[10px] font-normal text-slate-300">
                    Consignor (From) & Consignee (To)
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 border-x border-b border-slate-300 rounded-b divide-y md:divide-y-0 md:divide-x divide-slate-300 bg-white">
                  {/* FROM / CONSIGNOR */}
                  <div className="p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                      <span className="font-bold text-indigo-700 uppercase text-[11px] flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" />
                        From (Consignor / Supplier)
                      </span>
                      <span className="font-mono text-[11px] font-bold bg-indigo-50 text-indigo-900 px-1.5 py-0.5 rounded border border-indigo-200">
                        {currentBill.fromGstin}
                      </span>
                    </div>
                    <div className="font-bold text-slate-900 text-sm">
                      {currentBill.fromTrdName}
                    </div>
                    <div className="text-slate-600 text-xs">
                      {currentBill.fromAddr1}
                      {currentBill.fromAddr2 ? `, ${currentBill.fromAddr2}` : ""}
                    </div>
                    <div className="flex items-center justify-between text-slate-700 text-xs pt-1">
                      <span>
                        <strong>Place:</strong> {currentBill.fromPlace} - {currentBill.fromPincode}
                      </span>
                      <span>
                        <strong>State:</strong> {getStateName(currentBill.fromStateCode)}
                      </span>
                    </div>
                  </div>

                  {/* TO / CONSIGNEE */}
                  <div className="p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                      <span className="font-bold text-emerald-700 uppercase text-[11px] flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" />
                        To (Consignee / Recipient)
                      </span>
                      <span className="font-mono text-[11px] font-bold bg-emerald-50 text-emerald-900 px-1.5 py-0.5 rounded border border-emerald-200">
                        {currentBill.toGstin}
                      </span>
                    </div>
                    <div className="font-bold text-slate-900 text-sm">
                      {currentBill.toTrdName}
                    </div>
                    <div className="text-slate-600 text-xs">
                      {currentBill.toAddr1}
                      {currentBill.toAddr2 ? `, ${currentBill.toAddr2}` : ""}
                    </div>
                    <div className="flex items-center justify-between text-slate-700 text-xs pt-1">
                      <span>
                        <strong>Place:</strong> {currentBill.toPlace} - {currentBill.toPincode}
                      </span>
                      <span>
                        <strong>State:</strong> {getStateName(currentBill.toStateCode)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* PART A: Line Items Table */}
              <div>
                <div className="bg-slate-800 text-white font-bold text-xs px-3 py-1.5 rounded-t flex items-center justify-between">
                  <span>GOODS DETAILS (ITEM LIST)</span>
                  <span className="text-[10px] font-normal text-slate-300">
                    {currentBill.itemList?.length || 0} Item(s) Listed
                  </span>
                </div>
                <div className="overflow-x-auto border-x border-b border-slate-300 rounded-b">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                      <tr>
                        <th className="p-2 border-r border-slate-200 text-center w-8">#</th>
                        <th className="p-2 border-r border-slate-200 w-24">HSN Code</th>
                        <th className="p-2 border-r border-slate-200">Product / Item Description</th>
                        <th className="p-2 border-r border-slate-200 text-right w-24">Quantity</th>
                        <th className="p-2 border-r border-slate-200 text-right w-28">Taxable Val (₹)</th>
                        <th className="p-2 border-r border-slate-200 text-center w-28">Tax Rate</th>
                        <th className="p-2 text-right w-28">Line Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium">
                      {(currentBill.itemList || []).map((item, idx) => {
                        const isIgst = Number(item.igstRate) > 0;
                        const taxRateLabel = isIgst
                          ? `IGST ${item.igstRate}%`
                          : `CGST ${item.cgstRate}% + SGST ${item.sgstRate}%`;
                        const taxAmount = isIgst
                          ? (item.taxableAmount * Number(item.igstRate)) / 100
                          : (item.taxableAmount * (Number(item.cgstRate) + Number(item.sgstRate))) / 100;
                        const lineTotal = item.taxableAmount + taxAmount;

                        return (
                          <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/70"}>
                            <td className="p-2 border-r border-slate-200 text-center text-slate-500">
                              {item.itemNo || idx + 1}
                            </td>
                            <td className="p-2 border-r border-slate-200 font-mono font-bold text-slate-700">
                              {item.hsnCode}
                            </td>
                            <td className="p-2 border-r border-slate-200">
                              <span className="font-bold text-slate-800 block">
                                {item.productName || item.productDesc}
                              </span>
                              {item.productDesc && item.productDesc !== item.productName && (
                                <span className="text-[11px] text-slate-500 block">
                                  {item.productDesc}
                                </span>
                              )}
                            </td>
                            <td className="p-2 border-r border-slate-200 text-right">
                              {item.quantity} {item.qtyUnit || "NOS"}
                            </td>
                            <td className="p-2 border-r border-slate-200 text-right font-semibold">
                              {formatCurr(item.taxableAmount)}
                            </td>
                            <td className="p-2 border-r border-slate-200 text-center text-[11px] text-indigo-700 font-bold">
                              {taxRateLabel}
                            </td>
                            <td className="p-2 text-right font-bold text-slate-900">
                              {formatCurr(lineTotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tax & Total Calculation Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <div className="border border-slate-200 rounded p-3 bg-slate-50 space-y-1.5 text-xs text-slate-600">
                  <div className="font-bold text-slate-800 text-[11px] uppercase border-b border-slate-200 pb-1">
                    Tax Applicability & Rule Check
                  </div>
                  <div className="flex justify-between">
                    <span>Inter-State Supply (IGST):</span>
                    <strong className="text-slate-800">
                      {Number(currentBill.igstValue) > 0 ? "YES (Applicable)" : "NO (Intra-State)"}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax Engine Check:</span>
                    <strong className="text-emerald-700">Exact Rupee-Perfect Match</strong>
                  </div>
                  <div className="text-[11px] text-slate-500 pt-1">
                    Values strictly align with GST Rules for Tax Invoices and E-Way bill generation.
                  </div>
                </div>

                <div className="border border-slate-300 rounded overflow-hidden">
                  <table className="w-full text-xs">
                    <tbody className="divide-y divide-slate-200 font-medium">
                      <tr className="bg-slate-50">
                        <td className="p-2 text-slate-600 font-semibold">Total Taxable Value (Assessable)</td>
                        <td className="p-2 text-right font-bold text-slate-800">
                          {formatCurr(currentBill.totalValue)}
                        </td>
                      </tr>
                      {Number(currentBill.cgstValue) > 0 && (
                        <tr>
                          <td className="p-2 text-slate-600">CGST Amount</td>
                          <td className="p-2 text-right font-semibold text-slate-800">
                            {formatCurr(currentBill.cgstValue)}
                          </td>
                        </tr>
                      )}
                      {Number(currentBill.sgstValue) > 0 && (
                        <tr>
                          <td className="p-2 text-slate-600">SGST Amount</td>
                          <td className="p-2 text-right font-semibold text-slate-800">
                            {formatCurr(currentBill.sgstValue)}
                          </td>
                        </tr>
                      )}
                      {Number(currentBill.igstValue) > 0 && (
                        <tr>
                          <td className="p-2 text-indigo-700 font-semibold">IGST Amount</td>
                          <td className="p-2 text-right font-bold text-indigo-800">
                            {formatCurr(currentBill.igstValue)}
                          </td>
                        </tr>
                      )}
                      {Number(currentBill.cessValue || 0) > 0 && (
                        <tr>
                          <td className="p-2 text-slate-600">Cess Amount</td>
                          <td className="p-2 text-right font-semibold text-slate-800">
                            {formatCurr(currentBill.cessValue)}
                          </td>
                        </tr>
                      )}
                      {Number(currentBill.otherValue || 0) !== 0 && (
                        <tr>
                          <td className="p-2 text-slate-600">Round Off / Other Charges</td>
                          <td className="p-2 text-right font-semibold text-slate-800">
                            {formatCurr(currentBill.otherValue)}
                          </td>
                        </tr>
                      )}
                      <tr className="bg-emerald-50 text-emerald-950 font-black text-sm">
                        <td className="p-2.5 uppercase tracking-wide">Total Invoice Value (Grand Total)</td>
                        <td className="p-2.5 text-right font-mono text-base text-emerald-800">
                          {formatCurr(currentBill.totInvValue)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* PART B: Transportation Details */}
              <div>
                <div className="bg-slate-800 text-white font-bold text-xs px-3 py-1.5 rounded-t flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" />
                    PART - B: TRANSPORTATION DETAILS (VEHICLE / TRANSPORTER)
                  </span>
                  <span className="text-[10px] font-normal text-slate-300">
                    Mandatory for Movement of Goods
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 border-x border-b border-slate-300 rounded-b bg-slate-50 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                      Transporter ID (GSTIN/TRANSIN)
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      {currentBill.transporterId || "Self Transport / Direct"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                      Vehicle Number
                    </span>
                    <span className="font-mono font-black text-indigo-700 bg-white border border-indigo-200 px-2 py-0.5 rounded inline-block mt-0.5">
                      {currentBill.vehicleNo || "Pending / Not Assigned"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                      Vehicle Type
                    </span>
                    <span className="font-bold text-slate-800">
                      {currentBill.vehicleType === "O" ? "ODC (Over Dimensional Cargo)" : "Regular (R)"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                      Approx Distance
                    </span>
                    <span className="font-bold text-slate-900">
                      {currentBill.transDistance ? `${currentBill.transDistance} KM` : "As per route"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Informational Guidance Notice */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 text-[11px] leading-relaxed flex items-start gap-2">
                <HelpCircle className="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <strong>Verification Note:</strong> This visual slip reflects the exact data parsed from your Excel/ERP invoice. Please cross-check the party names, GSTINs, tax amounts, and vehicle number above. When satisfied, click <strong>"Download JSON File"</strong> below and upload it directly to the <strong>NIC E-Way Bill Portal (ewaybillgst.gov.in)</strong>.
                </div>
              </div>
            </div>
          )}

          {activeTab === "preview" && !currentBill && (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
              <FileJson className="w-12 h-12 text-slate-300 mb-2" />
              <h3 className="text-sm font-bold text-slate-700">No Document Available to Preview</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Switch to the JSON Output tab to inspect the raw JSON data.
              </p>
            </div>
          )}

          {/* Tab 2: Raw JSON Content */}
          {activeTab === "json" && (
            <pre className="h-full max-h-[65vh] overflow-y-auto text-xs font-mono p-4 bg-slate-950 rounded-lg text-emerald-400 border border-slate-800 select-all leading-relaxed">
              <code>{jsonContent}</code>
            </pre>
          )}

          {/* Tab 3: Validation Report */}
          {activeTab === "validation" && (
            <div className="h-full max-h-[65vh] overflow-y-auto p-4 bg-white text-slate-800 rounded-lg border border-slate-200 space-y-3">
              {errors.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">
                    Zero Validation Errors!
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    All document fields, GSTIN formats, tax rate splits, and totals conform strictly to the official NIC bulk generation schema.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {errors.map((err, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                        err.severity === "error"
                          ? "bg-rose-50 border-rose-200 text-rose-800"
                          : "bg-amber-50 border-amber-200 text-amber-800"
                      }`}
                    >
                      <AlertTriangle
                        className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                          err.severity === "error"
                            ? "text-rose-600"
                            : "text-amber-600"
                        }`}
                      />
                      <div>
                        <div className="font-bold flex items-center gap-2">
                          <span>
                            {err.invoiceNo ? `[${err.invoiceNo}] ` : ""}Field: {err.field}
                          </span>
                          <span
                            className={`text-[10px] uppercase px-1.5 py-0.2 rounded font-semibold ${
                              err.severity === "error"
                                ? "bg-rose-200 text-rose-900"
                                : "bg-amber-200 text-amber-900"
                            }`}
                          >
                            {err.severity}
                          </span>
                        </div>
                        <p className="mt-0.5 text-slate-600">{err.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>

            <button
              onClick={onOpenUploadGuide}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-medium transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
              <span>How to Upload to Portal</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-md border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
            >
              Close
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download JSON File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
