"use client";

import React, { useState } from "react";
import {
  X,
  Copy,
  Check,
  Download,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";
import { ValidationError } from "../lib/types/ewayBill";
import { downloadJsonFile } from "../lib/engine/jsonGenerator";

interface JsonPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  jsonContent: string;
  filename: string;
  invoiceCount: number;
  totalValue: number;
  errors: ValidationError[];
  onOpenUploadGuide: () => void;
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
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"json" | "validation">("json");

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
              <FileJson className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-800">
                  NIC Bulk E-Way Bill JSON Preview
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                  {filename}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                <span>Invoices: <strong className="text-slate-700">{invoiceCount}</strong></span>
                <span>•</span>
                <span>Total Value: <strong className="text-slate-700">₹{totalValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></span>
                <span>•</span>
                {isValid ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Portal Schema Validated
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-rose-700 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    {hardErrors.length} Validation Error(s)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab switch */}
        <div className="px-6 border-b border-slate-200 bg-white flex items-center gap-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab("json")}
            className={`py-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "json"
                ? "border-indigo-600 text-indigo-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>JSON Output</span>
            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-[10px] text-slate-600">
              Formatted
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
            <span>Validation Report</span>
            {hardErrors.length > 0 && (
              <span className="px-1.5 py-0.2 rounded bg-rose-100 text-[10px] text-rose-700 font-bold">
                {hardErrors.length}
              </span>
            )}
            {warnings.length > 0 && hardErrors.length === 0 && (
              <span className="px-1.5 py-0.2 rounded bg-amber-100 text-[10px] text-amber-700 font-bold">
                {warnings.length}
              </span>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden p-4 bg-slate-900 text-slate-100 relative">
          {activeTab === "json" ? (
            <pre className="h-full overflow-y-auto text-xs font-mono p-4 bg-slate-950 rounded-lg text-emerald-400 border border-slate-800 select-all leading-relaxed">
              <code>{jsonContent}</code>
            </pre>
          ) : (
            <div className="h-full overflow-y-auto p-4 bg-white text-slate-800 rounded-lg border border-slate-200 space-y-3">
              {errors.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">
                    No Validation Errors
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
                          <span>{err.invoiceNo ? `[${err.invoiceNo}] ` : ""}Field: {err.field}</span>
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

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
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
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
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
