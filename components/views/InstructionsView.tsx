"use client";

import React from "react";
import {
  HelpCircle,
  ExternalLink,
  Download,
  LogIn,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  FileJson,
  KeyRound,
  FileCheck,
} from "lucide-react";

interface InstructionsViewProps {
  onTabChange: (tab: string) => void;
}

export const InstructionsView: React.FC<InstructionsViewProps> = ({
  onTabChange,
}) => {
  const steps = [
    {
      num: 1,
      title: "Step 1: Download JSON Payload from Fin Tax",
      desc: "After creating your single invoice or assembling your multi-invoice batch in Fin Tax E-Way Bill Generator, run schema validation and click 'Download JSON'. The software generates a file strictly conforming to the official NIC bulk specification.",
      badge: "In Fin Tax App",
      icon: Download,
    },
    {
      num: 2,
      title: "Step 2: Navigate to Official Indian E-Way Bill Portal",
      desc: "Open your web browser and navigate to the authorized government portal: https://ewaybillgst.gov.in. Verify that the URL is exact and secured with official SSL certificates.",
      badge: "Official Portal",
      link: "https://ewaybillgst.gov.in",
      icon: ExternalLink,
    },
    {
      num: 3,
      title: "Step 3: Secure Taxpayer Authentication & 2FA",
      desc: "Log in using the taxpayer's authorized Username, Password, Captcha, and Two-Factor Authentication (2FA OTP via SMS or Sandbox Auth app). Never use third-party tools that prompt for your raw portal passwords.",
      badge: "Security & Compliance",
      icon: LogIn,
    },
    {
      num: 4,
      title: "Step 4: Go to Bulk Generation Menu",
      desc: "In the taxpayer portal dashboard, look at the left sidebar menu and click: E-Waybill ➔ Generate Bulk.",
      badge: "Portal Navigation",
      icon: UploadCloud,
    },
    {
      num: 5,
      title: "Step 5: Select & Upload Your Downloaded JSON File",
      desc: "Click 'Choose File' (or 'Browse'), locate the .json file exported by Fin Tax on your computer, and press 'Upload & Generate'.",
      badge: "File Upload",
      icon: FileJson,
    },
    {
      num: 6,
      title: "Step 6: Review Results & Receive Official E-Way Bill Numbers",
      desc: "The NIC bulk engine processes your file. For successful transactions, you will receive official 12-digit E-Way Bill numbers (e.g. 101234567890) along with valid printable PDFs and QR codes. If the portal flags any business rule mismatch, correct the flagged line in Fin Tax and re-export.",
      badge: "Confirmation",
      icon: CheckCircle2,
    },
  ];

  const commonErrors = [
    {
      code: "101",
      title: "State code of supplier / recipient does not match GSTIN prefix",
      solution: "Ensure fromStateCode matches the first 2 digits of fromGstin, and toStateCode matches the first 2 digits of toGstin (or use 99 for export/import).",
    },
    {
      code: "105",
      title: "Document date cannot be future date",
      solution: "Invoices cannot bear a date later than the current transaction date.",
    },
    {
      code: "109",
      title: "Sum of Item Taxable Values does not equal Total Value",
      solution: "Fin Tax automatically computes and synchronizes this. Check whether manual rounding or overrides were entered.",
    },
    {
      code: "112",
      title: "Vehicle number format is invalid",
      solution: "Format must follow standard Indian transport authority registration (e.g. DL01AB1234 without dashes or spaces).",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">
              Official Portal Upload & Compliance Guide
            </h2>
            <p className="text-xs text-slate-500">
              Clear manual operating procedure for submitting generated JSON files to https://ewaybillgst.gov.in
            </p>
          </div>
        </div>

        <a
          href="https://ewaybillgst.gov.in"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors flex-shrink-0"
        >
          <span>Open ewaybillgst.gov.in</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Security & Regulatory Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-4">
        <ShieldAlert className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1.5 text-xs text-amber-900 leading-relaxed">
          <h3 className="font-bold text-sm text-amber-950">
            Important Compliance Notice on Generation Status
          </h3>
          <p>
            An E-Way Bill has <strong>NOT</strong> been legally generated until
            confirmed and assigned a genuine 12-digit E-Way Bill Number by the
            National Informatics Centre (NIC) portal.
          </p>
          <p>
            Fin Tax E-Way Bill Generator provides precision schema formatting
            and client-side mathematical/tax validation. In strict compliance
            with government IT security guidelines, this application does{" "}
            <strong>not</strong> store taxpayer passwords or automate CAPTCHA
            bypass. Taxpayers must upload generated files through authorized
            portal sessions.
          </p>
        </div>
      </div>

      {/* Step by step card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b pb-2">
          Step-by-Step Portal Submission Workflow
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                        {step.num}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {step.title}
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                      {step.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mt-2">
                    {step.desc}
                  </p>
                </div>

                {step.link && (
                  <div className="mt-3 pt-2 border-t border-slate-200/60">
                    <a
                      href={step.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                    >
                      <span>Visit Official Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Common Portal Error Codes & Resolution */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b pb-2">
          Official Portal Error Resolution Cheat Sheet
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {commonErrors.map((err, i) => (
            <div
              key={i}
              className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1"
            >
              <div className="font-bold text-slate-800 flex items-center gap-2">
                <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 font-mono text-[10px]">
                  Code {err.code}
                </span>
                <span>{err.title}</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                <strong>Fix:</strong> {err.solution}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
