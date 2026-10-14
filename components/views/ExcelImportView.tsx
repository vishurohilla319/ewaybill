"use client";

import React, { useState, useRef } from "react";
import {
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Layers,
  FileCheck,
  FileX,
  Eye,
  Trash2,
  Truck,
  Check,
  Plus,
} from "lucide-react";
import {
  CompanyProfile,
  EWayBillDocument,
  TransporterMaster,
  ValidationError,
} from "../../lib/types/ewayBill";
import { recalculateBill } from "../../lib/engine/calculator";
import { validateEWayBill } from "../../lib/engine/validator";
import {
  generateExcelTemplate,
  parseExcelFile,
  ParsedExcelResult,
} from "../../lib/engine/excelParser";
import {
  formatJsonPayload,
  generateBulkEWayBillJson,
  generateExportFilename,
} from "../../lib/engine/jsonGenerator";

interface ExcelImportViewProps {
  activeCompany?: CompanyProfile;
  transporters?: TransporterMaster[];
  schemaVersion: string;
  onAddBillsToBatch: (bills: EWayBillDocument[]) => void;
  onTabChange: (tab: string) => void;
  onExportSuccess: (filename: string, jsonPayload: string, bills: EWayBillDocument[]) => void;
  onPreviewJson: (
    jsonStr: string,
    filename: string,
    invoiceCount: number,
    totalVal: number,
    errs: ValidationError[]
  ) => void;
}

export const ExcelImportView: React.FC<ExcelImportViewProps> = ({
  activeCompany,
  transporters = [],
  schemaVersion,
  onAddBillsToBatch,
  onTabChange,
  onExportSuccess,
  onPreviewJson,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedExcelResult | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick Part-B Transport State
  const [transporterId, setTransporterId] = useState<string>("");
  const [transporterName, setTransporterName] = useState<string>("");
  const [vehicleNo, setVehicleNo] = useState<string>("");
  const [vehicleType, setVehicleType] = useState<"R" | "O">("R");
  const [transDistance, setTransDistance] = useState<number>(100);
  const [transportApplied, setTransportApplied] = useState<boolean>(false);

  const handleSelectTransporter = (tId: string) => {
    const found = transporters.find((t) => t.id === tId);
    if (found) {
      setTransporterId(found.transporterId);
      setTransporterName(found.name);
      setTransportApplied(false);
    }
  };

  const handleApplyTransportDetails = () => {
    if (!parsedResult || parsedResult.bills.length === 0) return;

    const cleanTransId = transporterId.trim().toUpperCase();
    const cleanTransName = transporterName.trim();
    const cleanVehNo = vehicleNo.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

    const updatedBills = parsedResult.bills.map((bill) => {
      const updated: EWayBillDocument = {
        ...bill,
        transMode: "1",
        transDistance: Number(transDistance) || 100,
        transporterId: cleanTransId || undefined,
        transporterName: cleanTransName || undefined,
        vehicleNo: cleanVehNo || undefined,
        vehicleType: cleanVehNo ? vehicleType : undefined,
      };
      return recalculateBill(updated, true);
    });

    const newRowErrors: { row: number; invoiceNo: string; message: string }[] = [];
    let validCount = 0;
    let invalidCount = 0;

    updatedBills.forEach((b) => {
      const errors = validateEWayBill(b);
      const hasError = errors.some((e) => e.severity === "error");
      if (hasError) {
        invalidCount++;
        errors
          .filter((e) => e.severity === "error")
          .forEach((err) => {
            newRowErrors.push({
              row: 0,
              invoiceNo: b.docNo,
              message: `${err.field}: ${err.message}`,
            });
          });
      } else {
        validCount++;
      }
    });

    setParsedResult({
      ...parsedResult,
      bills: updatedBills,
      validInvoices: validCount,
      invalidInvoices: invalidCount,
      rowErrors: newRowErrors,
    });
    setTransportApplied(true);
  };

  const handleDownloadTemplate = () => {
    const templateBytes = generateExcelTemplate();
    const blob = new Blob([templateBytes as any], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "FinTax_EWayBill_Bulk_Template.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleProcessFile = (file: File) => {
    setIsProcessing(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const result = parseExcelFile(buffer, activeCompany);
        setParsedResult(result);
      } catch (err: any) {
        alert(`Failed to parse spreadsheet file: ${err?.message || err}`);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleProcessFile(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleAddToBatch = () => {
    if (!parsedResult || parsedResult.bills.length === 0) return;
    onAddBillsToBatch(parsedResult.bills);
    onTabChange("bulk");
  };

  const handleDirectExport = () => {
    if (!parsedResult || parsedResult.bills.length === 0) return;

    if (parsedResult.invalidInvoices > 0) {
      const proceed = confirm(
        `Notice: ${parsedResult.invalidInvoices} invoice(s) contain validation errors. Are you sure you wish to export now?`
      );
      if (!proceed) return;
    }

    const payload = generateBulkEWayBillJson(parsedResult.bills, schemaVersion);
    const jsonStr = formatJsonPayload(payload);
    const filename = generateExportFilename(`EWB_IMPORT_${parsedResult.bills.length}INV`);

    onExportSuccess(filename, jsonStr, parsedResult.bills);
  };

  const handlePreview = () => {
    if (!parsedResult || parsedResult.bills.length === 0) return;
    const payload = generateBulkEWayBillJson(parsedResult.bills, schemaVersion);
    const jsonStr = formatJsonPayload(payload);
    const filename = generateExportFilename(`EWB_IMPORT_${parsedResult.bills.length}INV`);

    const totalVal = parsedResult.bills.reduce(
      (acc, b) => acc + (Number(b.totInvValue) || 0),
      0
    );

    const mappedErrs: ValidationError[] = parsedResult.rowErrors.map((r) => ({
      invoiceNo: r.invoiceNo,
      field: "Row validation",
      message: r.message,
      severity: "error",
    }));

    onPreviewJson(
      jsonStr,
      filename,
      parsedResult.bills.length,
      totalVal,
      mappedErrs
    );
  };

  const handleClear = () => {
    setParsedResult(null);
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">
              Excel / CSV Bulk Invoices Import
            </h2>
            <p className="text-xs text-slate-500">
              Import hundreds of multi-item invoices from Excel, auto-group line items, validate against official schema, and export to JSON
            </p>
          </div>
        </div>

        <button
          onClick={handleDownloadTemplate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold shadow-sm transition-colors flex-shrink-0"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Download Excel Template (.xlsx)</span>
        </button>
      </div>

      {/* Upload Dropzone */}
      {!parsedResult ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`bg-white rounded-xl border-2 border-dashed p-10 text-center transition-all cursor-pointer ${
            dragOver
              ? "border-emerald-500 bg-emerald-50/30"
              : "border-slate-300 hover:border-emerald-400"
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />

          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-sm">
            <UploadCloud className="w-7 h-7" />
          </div>

          <h3 className="text-sm font-bold text-slate-800">
            {isProcessing ? "Processing Spreadsheet..." : "Click to select or drag & drop Excel / CSV file"}
          </h3>
          <p className="text-xs text-slate-500 max-w-lg mx-auto mt-1">
            Supports Bulk Invoices (.xlsx, .xls, .csv) and direct Tally Tax Invoice exports. Multi-item invoices are automatically parsed and structured.
          </p>

          <div className="mt-4 flex items-center justify-center gap-3 text-xs text-slate-500">
            <span className="px-2 py-0.5 rounded bg-slate-100 font-mono">.xlsx</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 font-mono">.xls</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 font-mono">.csv</span>
          </div>
        </div>
      ) : (
        /* Parsed Results Overview */
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs font-mono">
                XLS
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800 font-mono">
                  {fileName}
                </div>
                <div className="text-xs text-slate-500">
                  {parsedResult.totalRows} row(s) processed into {parsedResult.totalInvoices} grouped invoice(s)
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleClear}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Upload Another</span>
              </button>

              <button
                onClick={handlePreview}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview JSON</span>
              </button>

              <button
                onClick={handleAddToBatch}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Add All to Bulk Queue</span>
              </button>

              <button
                onClick={handleDirectExport}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Direct to JSON</span>
              </button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">
                Raw Sheet Rows
              </span>
              <div className="text-2xl font-bold text-slate-800 mt-1">
                {parsedResult.totalRows}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">
                Grouped Invoices
              </span>
              <div className="text-2xl font-bold text-slate-800 mt-1">
                {parsedResult.totalInvoices}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5" /> Valid Invoices
              </span>
              <div className="text-2xl font-bold text-emerald-700 mt-1">
                {parsedResult.validInvoices}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-rose-700 uppercase flex items-center gap-1">
                <FileX className="w-3.5 h-3.5" /> Invoices with Errors
              </span>
              <div className="text-2xl font-bold text-rose-700 mt-1">
                {parsedResult.invalidInvoices}
              </div>
            </div>
          </div>

          {/* Quick Part-B Transport Assignment Card */}
          <div className="bg-white rounded-xl border border-indigo-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 bg-gradient-to-r from-indigo-50/80 to-slate-50 border-b border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                    <span>Part-B Transport Details (Transporter ID / Vehicle No)</span>
                    <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-mono">Required for Road Transport</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Transporter ID (15-character GSTIN/TRANSIN) daalein Part-B delegate karne ke liye, ya Vehicle No. daalein.
                  </p>
                </div>
              </div>

              {transportApplied && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Transport Applied
                </span>
              )}
            </div>

            <div className="p-5 space-y-4 bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {transporters && transporters.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Choose Saved Transporter
                    </label>
                    <select
                      onChange={(e) => handleSelectTransporter(e.target.value)}
                      className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                    >
                      <option value="">-- Select Transporter --</option>
                      {transporters.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.transporterId})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Transporter ID (GSTIN/TRANSIN) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={transporterId}
                    onChange={(e) => {
                      setTransporterId(e.target.value.toUpperCase());
                      setTransportApplied(false);
                    }}
                    placeholder="e.g. 05AAAAA0000A1Z5"
                    maxLength={15}
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Transporter Name
                  </label>
                  <input
                    type="text"
                    value={transporterName}
                    onChange={(e) => {
                      setTransporterName(e.target.value);
                      setTransportApplied(false);
                    }}
                    placeholder="e.g. SafeXpress Logistics"
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Vehicle Number (Optional if ID set)
                  </label>
                  <input
                    type="text"
                    value={vehicleNo}
                    onChange={(e) => {
                      setVehicleNo(e.target.value.toUpperCase());
                      setTransportApplied(false);
                    }}
                    placeholder="e.g. DL01AB1234"
                    maxLength={10}
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Approx Distance (KM)
                  </label>
                  <input
                    type="number"
                    value={transDistance}
                    onChange={(e) => {
                      setTransDistance(Number(e.target.value) || 0);
                      setTransportApplied(false);
                    }}
                    min={1}
                    max={4000}
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <div className="text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">Notice:</span> Road Transport me ya toh 15-character <strong>Transporter ID</strong> enter karein ya <strong>Vehicle Number</strong> daalein.
                </div>

                <button
                  type="button"
                  onClick={handleApplyTransportDetails}
                  disabled={!transporterId.trim() && !vehicleNo.trim()}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors ${
                    transporterId.trim() || vehicleNo.trim()
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>Apply Transporter Details to Invoices</span>
                </button>
              </div>
            </div>
          </div>

          {/* Validation Warnings / Error Log */}
          {parsedResult.rowErrors.length > 0 && (
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 space-y-2">
              <div className="text-xs font-bold text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Spreadsheet Error Log ({parsedResult.rowErrors.length} issues detected):</span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1 text-xs text-rose-900 font-mono">
                {parsedResult.rowErrors.map((err, i) => (
                  <div key={i} className="pl-6 text-[11px]">
                    • [Inv: {err.invoiceNo}] {err.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Parsed Invoices Preview Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Parsed Invoices Preview
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {parsedResult.bills.length} invoices ready for review
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left acc-table min-w-[900px]">
                <thead>
                  <tr>
                    <th>Doc No / Date</th>
                    <th>Supplier (From)</th>
                    <th>Buyer (To)</th>
                    <th>Items Count</th>
                    <th>Assessable Value</th>
                    <th>Total Inv Value</th>
                    <th>Transport Mode</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedResult.bills.map((b, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="font-mono text-xs font-bold text-slate-800">
                        {b.docNo}
                        <div className="text-[10px] text-slate-400 font-normal">
                          {b.docDate} • {b.docType}
                        </div>
                      </td>
                      <td className="text-xs text-slate-700">
                        <div className="font-medium truncate max-w-[180px]">{b.fromTrdName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{b.fromGstin}</div>
                      </td>
                      <td className="text-xs text-slate-700">
                        <div className="font-medium truncate max-w-[180px]">{b.toTrdName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{b.toGstin}</div>
                      </td>
                      <td>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                          {b.itemList.length} item(s)
                        </span>
                      </td>
                      <td className="font-mono text-xs font-semibold text-slate-800">
                        ₹{(Number(b.totalValue) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="font-mono text-xs font-bold text-emerald-700">
                        ₹{(Number(b.totInvValue) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="text-xs text-slate-600">
                        <div className="font-medium">
                          {b.transporterId ? (
                            <span className="font-mono text-[11px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                              ID: {b.transporterId}
                            </span>
                          ) : b.vehicleNo ? (
                            <span className="font-mono text-[11px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              Veh: {b.vehicleNo}
                            </span>
                          ) : (
                            <span className="text-[11px] text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                              Part-B Pending
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Mode {b.transMode || "1"} • {b.transDistance || 100} KM
                        </div>
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Parsed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
