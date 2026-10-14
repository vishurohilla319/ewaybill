"use client";

import React, { useState } from "react";
import {
  Files,
  Plus,
  Trash2,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Copy,
  Layers,
  FileJson,
  Eye,
  RefreshCw,
} from "lucide-react";
import {
  CompanyProfile,
  EWayBillDocument,
  ValidationError,
} from "../../lib/types/ewayBill";
import { validateBulkDocuments, validateEWayBill } from "../../lib/engine/validator";
import {
  formatJsonPayload,
  generateBulkEWayBillJson,
  generateExportFilename,
} from "../../lib/engine/jsonGenerator";

interface BulkGenerationViewProps {
  batchBills: EWayBillDocument[];
  onRemoveFromBatch: (index: number) => void;
  onClearBatch: () => void;
  onEditBill: (bill: EWayBillDocument) => void;
  onTabChange: (tab: string) => void;
  activeCompany?: CompanyProfile;
  schemaVersion: string;
  onExportSuccess: (filename: string, jsonPayload: string, bills: EWayBillDocument[]) => void;
  onPreviewJson: (
    jsonStr: string,
    filename: string,
    invoiceCount: number,
    totalVal: number,
    errs: ValidationError[],
    bills?: EWayBillDocument[]
  ) => void;
}

export const BulkGenerationView: React.FC<BulkGenerationViewProps> = ({
  batchBills,
  onRemoveFromBatch,
  onClearBatch,
  onEditBill,
  onTabChange,
  activeCompany,
  schemaVersion,
  onExportSuccess,
  onPreviewJson,
}) => {
  const [selectedBillForErrors, setSelectedBillForErrors] = useState<{
    bill: EWayBillDocument;
    errors: ValidationError[];
  } | null>(null);

  const { validBills, invalidBills, allErrors } = validateBulkDocuments(batchBills);

  const totalTaxable = batchBills.reduce(
    (acc, b) => acc + (Number(b.totalValue) || 0),
    0
  );
  const totalTax = batchBills.reduce(
    (acc, b) =>
      acc +
      (Number(b.cgstValue) || 0) +
      (Number(b.sgstValue) || 0) +
      (Number(b.igstValue) || 0) +
      (Number(b.cessValue) || 0),
    0
  );
  const totalInvoiceValue = batchBills.reduce(
    (acc, b) => acc + (Number(b.totInvValue) || 0),
    0
  );

  const handleExportBatch = () => {
    if (batchBills.length === 0) {
      alert("No invoices in bulk batch to export.");
      return;
    }

    if (invalidBills.length > 0) {
      const confirmContinue = confirm(
        `Warning: ${invalidBills.length} invoice(s) in this batch have schema validation errors. Are you sure you want to export anyway?`
      );
      if (!confirmContinue) return;
    }

    const payload = generateBulkEWayBillJson(batchBills, schemaVersion);
    const jsonStr = formatJsonPayload(payload);
    const filename = generateExportFilename(`EWB_BULK_BATCH_${batchBills.length}INV`);

    onExportSuccess(filename, jsonStr, batchBills);
  };

  const handlePreviewBatch = () => {
    if (batchBills.length === 0) {
      alert("No invoices in bulk batch.");
      return;
    }
    const payload = generateBulkEWayBillJson(batchBills, schemaVersion);
    const jsonStr = formatJsonPayload(payload);
    const filename = generateExportFilename(`EWB_BULK_BATCH_${batchBills.length}INV`);

    onPreviewJson(jsonStr, filename, batchBills.length, totalInvoiceValue, allErrors, batchBills);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Files className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-800">
                Bulk E-Way Bill Generation Queue
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-semibold">
                {batchBills.length} Invoices Loaded
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Combine multi-document consignments into a single portal-compliant bulk JSON upload file
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onTabChange("create")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Single Bill</span>
          </button>

          <button
            onClick={() => onTabChange("import")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Import Excel</span>
          </button>

          {batchBills.length > 0 && (
            <>
              <button
                onClick={handlePreviewBatch}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview JSON</span>
              </button>

              <button
                onClick={handleExportBatch}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Bulk JSON</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">
            Total Batch Invoices
          </span>
          <div className="text-2xl font-bold text-slate-800 mt-1">
            {batchBills.length}
          </div>
          <div className="text-xs mt-1 flex items-center gap-2">
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {validBills.length} Ready
            </span>
            {invalidBills.length > 0 && (
              <span className="text-rose-700 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-600" /> {invalidBills.length} Need Fix
              </span>
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">
            Total Assessable Value
          </span>
          <div className="text-xl font-bold text-slate-800 mt-1">
            ₹{totalTaxable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Net taxable sum
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">
            Total Combined Taxes
          </span>
          <div className="text-xl font-bold text-slate-800 mt-1">
            ₹{totalTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            CGST, SGST, IGST & Cess
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">
            Total Invoice Value
          </span>
          <div className="text-xl font-bold text-indigo-700 mt-1">
            ₹{totalInvoiceValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono">
            NIC Bulk Version: {schemaVersion}
          </div>
        </div>
      </div>

      {/* Invoices Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Queued Invoices for Bulk File Generation
            </h3>
          </div>

          {batchBills.length > 0 && (
            <button
              onClick={() => {
                if (confirm("Clear all invoices from the current bulk batch?")) {
                  onClearBatch();
                }
              }}
              className="text-xs text-rose-600 hover:text-rose-800 font-medium inline-flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Entire Queue</span>
            </button>
          )}
        </div>

        {batchBills.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Files className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-slate-700">
              Bulk Queue is Currently Empty
            </div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Add invoices from the Create E-Way Bill form or import an Excel spreadsheet with multiple invoices to build your bulk JSON file.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => onTabChange("create")}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                Create Invoice
              </button>
              <button
                onClick={() => onTabChange("import")}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                Import Excel
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left acc-table min-w-[900px]">
              <thead>
                <tr>
                  <th>Doc No / Date</th>
                  <th>Consignor (From)</th>
                  <th>Consignee (To)</th>
                  <th>Items</th>
                  <th>Taxable Amt</th>
                  <th>Total Value</th>
                  <th>Transport / Vehicle</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {batchBills.map((b, idx) => {
                  const billErrs = validateEWayBill(b);
                  const hardErrCount = billErrs.filter((e) => e.severity === "error").length;
                  const isValid = hardErrCount === 0;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td>
                        <div className="font-mono font-bold text-slate-800 text-xs">
                          {b.docNo || "N/A"}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {b.docDate} • {b.docType}
                        </div>
                      </td>
                      <td>
                        <div className="font-medium text-slate-800 text-xs truncate max-w-[180px]">
                          {b.fromTrdName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {b.fromGstin} ({b.fromPlace})
                        </div>
                      </td>
                      <td>
                        <div className="font-medium text-slate-800 text-xs truncate max-w-[180px]">
                          {b.toTrdName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {b.toGstin} ({b.toPlace})
                        </div>
                      </td>
                      <td>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                          {b.itemList?.length || 0} item(s)
                        </span>
                      </td>
                      <td className="font-mono text-xs font-semibold text-slate-700">
                        ₹{(Number(b.totalValue) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="font-mono text-xs font-bold text-slate-900">
                        ₹{(Number(b.totInvValue) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <div className="text-xs text-slate-700 font-mono">
                          {b.vehicleNo ? b.vehicleNo : b.transporterId ? `ID: ${b.transporterId.substring(0, 8)}...` : "Part-B Pending"}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {b.transDistance} KM • Mode {b.transMode}
                        </div>
                      </td>
                      <td>
                        {isValid ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Valid
                          </span>
                        ) : (
                          <button
                            onClick={() => setSelectedBillForErrors({ bill: b, errors: billErrs })}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 hover:bg-rose-100 transition-colors"
                          >
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            {hardErrCount} Error(s)
                          </button>
                        )}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEditBill(b)}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100"
                            title="Edit Invoice"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onRemoveFromBatch(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                            title="Remove from batch"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Error Details Modal */}
      {selectedBillForErrors && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="text-sm font-bold text-slate-800">
                Errors in Invoice: {selectedBillForErrors.bill.docNo}
              </h4>
              <button
                onClick={() => setSelectedBillForErrors(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto space-y-2">
              {selectedBillForErrors.errors.map((err, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded text-xs border ${
                    err.severity === "error"
                      ? "bg-rose-50 border-rose-200 text-rose-800"
                      : "bg-amber-50 border-amber-200 text-amber-800"
                  }`}
                >
                  <strong className="font-semibold">{err.field}:</strong> {err.message}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  onEditBill(selectedBillForErrors.bill);
                  setSelectedBillForErrors(null);
                }}
                className="px-3 py-1.5 rounded bg-indigo-600 text-white text-xs font-semibold"
              >
                Open in Edit Form
              </button>
              <button
                onClick={() => setSelectedBillForErrors(null)}
                className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
