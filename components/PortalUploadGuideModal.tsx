"use client";

import React from "react";
import {
  X,
  ExternalLink,
  Download,
  LogIn,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  ShieldAlert,
} from "lucide-react";

interface PortalUploadGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadAction?: () => void;
  hasDownloadAvailable?: boolean;
}

export const PortalUploadGuideModal: React.FC<PortalUploadGuideModalProps> = ({
  isOpen,
  onClose,
  onDownloadAction,
  hasDownloadAvailable = false,
}) => {
  if (!isOpen) return null;

  const steps = [
    {
      num: 1,
      title: "Download the Official JSON File",
      desc: "Export your validated invoice or bulk batch from Fin Tax E-Way Bill Generator to receive an official schema-compliant .json file.",
      icon: Download,
    },
    {
      num: 2,
      title: "Access the Official E-Way Bill Portal",
      desc: "Open the authorized government portal: https://ewaybillgst.gov.in in your web browser.",
      icon: ExternalLink,
      link: "https://ewaybillgst.gov.in",
    },
    {
      num: 3,
      title: "Sign in with Authorized Taxpayer Credentials",
      desc: "Complete your manual login using Username, Password, Captcha, and 2FA OTP verification. (Never share your portal credentials with third-party utilities).",
      icon: LogIn,
    },
    {
      num: 4,
      title: "Navigate to Bulk Generation Menu",
      desc: "In the portal navigation sidebar, click on: E-Waybill ➔ Generate Bulk.",
      icon: UploadCloud,
    },
    {
      num: 5,
      title: "Upload the Generated JSON File",
      desc: "Click 'Choose File', select the downloaded .json file from your computer, and click 'Upload & Generate'.",
      icon: FileJson,
    },
    {
      num: 6,
      title: "Review Portal Response & E-Way Bill Numbers",
      desc: "The NIC portal will process your file. Valid bills will receive official 12-digit E-Way Bill numbers with QR codes. Any row-level issues will be highlighted by the portal for correction.",
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Official E-Way Bill Portal Upload Guide
              </h2>
              <p className="text-xs text-slate-500">
                Official NIC Indian GST Bulk Generation workflow instructions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notice Banner */}
        <div className="px-6 py-3 bg-amber-50 border-b border-amber-200 flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <strong className="font-semibold">Legal Disclaimer:</strong> An
            E-Way Bill is officially generated <strong>only</strong> after
            successful processing on the National Informatics Centre (NIC) portal.
            Fin Tax E-Way Bill Generator prepares verified JSON files but does not
            bypass 2FA or automate portal submissions.
          </div>
        </div>

        {/* Steps List */}
        <div className="p-6 overflow-y-auto space-y-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="flex items-start gap-3.5 p-3 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/50 transition-all"
              >
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm">
                  {step.num}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <span>{step.title}</span>
                    {step.link && (
                      <a
                        href={step.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline inline-flex items-center gap-1 text-[11px]"
                      >
                        Visit Portal <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <a
            href="https://ewaybillgst.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Open https://ewaybillgst.gov.in <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <div className="flex items-center gap-2">
            {hasDownloadAvailable && onDownloadAction && (
              <button
                onClick={onDownloadAction}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download JSON File</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
