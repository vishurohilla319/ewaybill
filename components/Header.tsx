"use client";

import React from "react";
import {
  FilePlus,
  HelpCircle,
  ExternalLink,
  ShieldAlert,
  Building,
} from "lucide-react";
import { CompanyProfile } from "../lib/types/ewayBill";

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  activeCompany?: CompanyProfile;
  schemaVersion: string;
  onOpenInstructions: () => void;
}

const TAB_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: {
    title: "Overview Dashboard",
    subtitle: "Monitor active billing operations, quick stats, and official portal readiness.",
  },
  create: {
    title: "Create E-Way Bill",
    subtitle: "Input invoice, party, and transportation details to generate an official bulk-compatible JSON bill.",
  },
  bulk: {
    title: "Bulk E-Way Bill Generation",
    subtitle: "Manage and export multi-invoice batches into a single portal-compliant JSON file.",
  },
  import: {
    title: "Excel Import & Conversion",
    subtitle: "Upload standard spreadsheet files, auto-group line items, validate, and convert to bulk JSON.",
  },
  drafts: {
    title: "Saved Drafts",
    subtitle: "Resume editing previously saved E-Way Bill forms.",
  },
  history: {
    title: "JSON Export History",
    subtitle: "Audit log of generated JSON packages available for instant re-download.",
  },
  companies: {
    title: "Company Management",
    subtitle: "Manage taxpayer profiles, registered GSTINs, and billing addresses.",
  },
  transporters: {
    title: "Transporter Master",
    subtitle: "Maintain reusable transporter profiles, TRANSIN/GSTIN codes, and vehicle fleets.",
  },
  items: {
    title: "Item & HSN Master",
    subtitle: "Configure standard goods catalog, HSN codes, and default GST rates.",
  },
  instructions: {
    title: "Official Portal Upload Guide",
    subtitle: "Step-by-step manual upload procedure for ewaybillgst.gov.in.",
  },
  settings: {
    title: "System Settings",
    subtitle: "Configure schema version, rounding tolerances, and export preferences.",
  },
};

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  activeCompany,
  schemaVersion,
  onOpenInstructions,
}) => {
  const currentInfo = TAB_TITLES[currentTab] || {
    title: "E-Way Bill Generator",
    subtitle: "Production-ready portal JSON generation software",
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0 z-10 shadow-sm">
      <div className="flex flex-col">
        <h1 className="text-lg font-bold text-slate-800 leading-tight">
          {currentInfo.title}
        </h1>
        <p className="text-xs text-slate-500 hidden sm:block">
          {currentInfo.subtitle}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Schema Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-mono text-slate-600">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          <span>NIC Bulk v{schemaVersion}</span>
        </div>

        {/* Portal Notice Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
          <span>Manual Portal Upload Required</span>
        </div>

        {/* Upload Guide Button */}
        <button
          onClick={onOpenInstructions}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
          title="How to upload generated JSON to the official portal"
        >
          <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden sm:inline">Upload Guide</span>
        </button>

        {/* Direct New Bill Button if not already on Create */}
        {currentTab !== "create" && (
          <button
            onClick={() => onTabChange("create")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span>Create Bill</span>
          </button>
        )}
      </div>
    </header>
  );
};
