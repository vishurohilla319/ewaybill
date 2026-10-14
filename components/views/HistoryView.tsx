"use client";

import React, { useState } from "react";
import {
  History,
  Download,
  Eye,
  Trash2,
  FileJson,
  Search,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import {
  EWayBillDocument,
  ExportHistoryRecord,
  ValidationError,
} from "../../lib/types/ewayBill";
import { downloadJsonFile } from "../../lib/engine/jsonGenerator";

interface HistoryViewProps {
  history: ExportHistoryRecord[];
  onClearHistory: () => void;
  onPreviewJson: (
    jsonStr: string,
    filename: string,
    invoiceCount: number,
    totalVal: number,
    errs: ValidationError[],
    bills?: EWayBillDocument[]
  ) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  onClearHistory,
  onPreviewJson,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = history.filter((rec) => {
    const q = searchTerm.toLowerCase();
    return (
      rec.filename.toLowerCase().includes(q) ||
      rec.companyName.toLowerCase().includes(q) ||
      rec.companyGstin.toLowerCase().includes(q) ||
      rec.invoiceNumbers.some((n) => n.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">
              JSON Export Audit History ({history.length})
            </h2>
            <p className="text-xs text-slate-500">
              Audit trail of previously generated portal-compliant JSON packages. Re-download files anytime for official portal bulk upload.
            </p>
          </div>
        </div>

        {history.length > 0 && (
          <button
            onClick={() => {
              if (confirm("Clear all export history logs? Downloaded files on your computer will remain unaffected.")) {
                onClearHistory();
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search export history by filename, invoice numbers, company name or GSTIN..."
          className="w-full text-xs text-slate-800 focus:outline-none"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            Clear
          </button>
        )}
      </div>

      {/* History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {history.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <FileJson className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-slate-700">
              No JSON Export History
            </div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Every time you download an E-Way Bill JSON file, an audit snapshot will be archived here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left acc-table min-w-[900px]">
              <thead>
                <tr>
                  <th>JSON Filename</th>
                  <th>Export Timestamp</th>
                  <th>Company (Taxpayer)</th>
                  <th>Invoices Included</th>
                  <th>Assessable Value</th>
                  <th>Total Taxes</th>
                  <th>Schema</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                    <td>
                      <div className="font-mono font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <FileJson className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                        <span>{rec.filename}</span>
                      </div>
                    </td>
                    <td className="text-xs text-slate-500 font-mono">
                      {rec.timestamp}
                    </td>
                    <td>
                      <div className="text-xs font-medium text-slate-800 truncate max-w-[160px]">
                        {rec.companyName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {rec.companyGstin}
                      </div>
                    </td>
                    <td>
                      <div className="text-xs font-semibold text-slate-700">
                        {rec.invoiceCount} bill(s)
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]" title={rec.invoiceNumbers.join(", ")}>
                        {rec.invoiceNumbers.slice(0, 3).join(", ")}
                        {rec.invoiceNumbers.length > 3 ? "..." : ""}
                      </div>
                    </td>
                    <td className="font-mono text-xs font-semibold text-slate-700">
                      ₹{rec.totalValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="font-mono text-xs text-slate-700">
                      ₹{rec.totalTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">
                        v{rec.schemaVersion}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() =>
                            onPreviewJson(
                              rec.jsonPayload,
                              rec.filename,
                              rec.invoiceCount,
                              rec.totalValue + rec.totalTax,
                              []
                            )
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                          title="Preview JSON Payload"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>

                        <button
                          onClick={() => downloadJsonFile(rec.jsonPayload, rec.filename)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors"
                          title="Download original JSON file"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
