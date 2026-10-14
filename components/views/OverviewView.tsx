"use client";

import React from "react";
import {
  FilePlus,
  Files,
  FileSpreadsheet,
  Download,
  Building2,
  PackageCheck,
  ShieldCheck,
  ExternalLink,
  History,
  FileClock,
  ArrowRight,
  HelpCircle,
  Truck,
  Database,
  CheckCircle2,
} from "lucide-react";
import {
  CompanyProfile,
  ExportHistoryRecord,
  DraftBill,
} from "../../lib/types/ewayBill";
import { downloadJsonFile } from "../../lib/engine/jsonGenerator";

interface OverviewViewProps {
  onTabChange: (tab: string) => void;
  activeCompany?: CompanyProfile;
  drafts: DraftBill[];
  history: ExportHistoryRecord[];
  itemsCount: number;
  transportersCount: number;
  onOpenUploadGuide: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onTabChange,
  activeCompany,
  drafts,
  history,
  itemsCount,
  transportersCount,
  onOpenUploadGuide,
}) => {
  const totalInvoicesExported = history.reduce(
    (acc, curr) => acc + curr.invoiceCount,
    0
  );
  const totalValueExported = history.reduce(
    (acc, curr) => acc + curr.totalValue,
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-xl p-6 text-white shadow-md relative overflow-hidden border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Official Indian GST Bulk Generator Tool</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">
              Fin Tax E-Way Bill JSON Generator
            </h2>
            <p className="text-slate-300 text-xs md:text-sm mt-1 leading-relaxed">
              Create portal-ready, fully validated bulk JSON files for manual
              upload to the official Indian E-Way Bill portal (ewaybillgst.gov.in).
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
              <span>Software Developed by</span>
              <span className="font-semibold text-indigo-300">Vishu Rohilla</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onTabChange("create")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md transition-all"
            >
              <FilePlus className="w-4 h-4" />
              <span>Create E-Way Bill</span>
            </button>
            <button
              onClick={() => onTabChange("import")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Import Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Neon Cloud Database Status Ribbon */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-950">Neon Serverless PostgreSQL Database</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Connected (Live)
              </span>
            </div>
            <p className="text-[11px] text-emerald-800 mt-0.5 font-mono">
              Host: ep-falling-wind-b4e32ibs-pooler.c-6.us-east-2.aws.neon.tech • Tables: users, companies, transporters, items, drafts, history
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900 bg-white/70 px-3 py-1.5 rounded-lg border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Cloud Sync Active</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Company Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              Active Taxpayer
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-sm font-bold text-slate-800 truncate">
              {activeCompany?.tradeName || activeCompany?.legalName || "Select Company"}
            </div>
            <div className="text-xs font-mono text-slate-500 truncate mt-0.5">
              GSTIN: {activeCompany?.gstin || "N/A"}
            </div>
          </div>
          <button
            onClick={() => onTabChange("companies")}
            className="mt-3 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
          >
            Manage Companies <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Total Invoices Exported */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              Total Invoices Exported
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-800">
              {totalInvoicesExported}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Across {history.length} bulk JSON file(s)
            </div>
          </div>
          <button
            onClick={() => onTabChange("history")}
            className="mt-3 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
          >
            View Export History <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Total Export Value */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              Total Export Value
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <span className="font-bold text-sm">₹</span>
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-800 truncate">
              ₹{totalValueExported.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Total assessable cargo value
            </div>
          </div>
          <div className="mt-3 text-[11px] font-medium text-slate-400">
            Validated for Bulk Upload
          </div>
        </div>

        {/* Saved Drafts & Masters */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              Drafts & Masters
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileClock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <div className="text-lg font-bold text-slate-800">
                {drafts.length}
              </div>
              <div className="text-[11px] text-slate-500">Saved Drafts</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-slate-800">
                {itemsCount}
              </div>
              <div className="text-[11px] text-slate-500">Master Items</div>
            </div>
          </div>
          <button
            onClick={() => onTabChange("drafts")}
            className="mt-3 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
          >
            Review Drafts <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Action Cards & Portal Instructions Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Operations (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Quick Operations
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => onTabChange("create")}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-sm text-left transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2.5 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <FilePlus className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                  Single E-Way Bill
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Interactive form with live tax calculation, HSN auto-fill, and immediate JSON download.
                </p>
              </div>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600">
                Open Form <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>

            <button
              onClick={() => onTabChange("bulk")}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-sm text-left transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Files className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                  Bulk Batch Generator
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Assemble multiple bills into a single official payload with one-click export.
                </p>
              </div>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
                Manage Batch <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>

            <button
              onClick={() => onTabChange("import")}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-400 hover:shadow-sm text-left transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">
                  Excel Import Tool
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Upload spreadsheet invoices with automatic line item aggregation and error detection.
                </p>
              </div>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                Upload Excel <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>
          </div>

          {/* Recent Exports Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm mt-6">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-500" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Recent JSON Exports
                </h4>
              </div>
              {history.length > 0 && (
                <button
                  onClick={() => onTabChange("history")}
                  className="text-xs font-semibold text-indigo-600 hover:underline"
                >
                  View All ({history.length})
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No JSON exports yet. Generate an E-Way Bill or upload an Excel file to start.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left acc-table">
                  <thead>
                    <tr>
                      <th>Filename / Date</th>
                      <th>Company</th>
                      <th>Invoices</th>
                      <th>Total Value</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice(0, 4).map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                        <td>
                          <div className="font-mono font-semibold text-slate-800 text-xs">
                            {record.filename}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {record.timestamp}
                          </div>
                        </td>
                        <td className="text-xs text-slate-700">
                          {record.companyName}
                        </td>
                        <td>
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-xs text-slate-700">
                            {record.invoiceCount} bill(s)
                          </span>
                        </td>
                        <td className="font-semibold text-slate-800 text-xs">
                          ₹{record.totalValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="text-right">
                          <button
                            onClick={() => downloadJsonFile(record.jsonPayload, record.filename)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                          >
                            <Download className="w-3 h-3 text-slate-500" />
                            <span>Download</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Portal Information Card (1 col) */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Official Portal Workflow
          </h3>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <span>Bulk JSON Workflow</span>
            </div>

            <ol className="text-xs text-slate-600 space-y-2.5 list-decimal pl-4 leading-relaxed">
              <li>
                <strong>Generate & Download JSON:</strong> Create validated invoices in Fin Tax and download the official <code>.json</code> file.
              </li>
              <li>
                <strong>Log into Portal:</strong> Visit{" "}
                <a
                  href="https://ewaybillgst.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 font-semibold underline inline-flex items-center gap-0.5"
                >
                  ewaybillgst.gov.in <ExternalLink className="w-2.5 h-2.5" />
                </a>{" "}
                with your registered taxpayer credentials and 2FA.
              </li>
              <li>
                <strong>Bulk Generation:</strong> Go to <em>E-Waybill ➔ Generate Bulk</em> in the portal menu.
              </li>
              <li>
                <strong>Upload & Verify:</strong> Choose your downloaded JSON and submit. The portal generates genuine 12-digit EWB numbers.
              </li>
            </ol>

            <div className="pt-2">
              <button
                onClick={onOpenUploadGuide}
                className="w-full py-2 px-3 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                <span>View Full Step-by-Step Guide</span>
              </button>
            </div>

            <div className="border-t border-slate-100 pt-3 text-[11px] text-slate-500 leading-normal">
              <strong>Portal Schema Note:</strong> The official NIC portal bulk utility enforces strict GSTIN prefix state match, alphanumeric invoice number rules, and mandatory Part-B transport details.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
