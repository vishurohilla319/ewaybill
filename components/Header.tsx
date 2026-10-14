"use client";

import React, { useState } from "react";
import {
  FilePlus,
  HelpCircle,
  ExternalLink,
  ShieldAlert,
  Building,
  User,
  LogOut,
  ChevronDown,
  KeyRound,
} from "lucide-react";
import { CompanyProfile } from "../lib/types/ewayBill";
import { UserAccount } from "../lib/types/auth";

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  activeCompany?: CompanyProfile;
  schemaVersion: string;
  onOpenInstructions: () => void;
  currentUser?: UserAccount;
  onOpenProfile?: () => void;
  onLogout?: () => void;
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
  currentUser,
  onOpenProfile,
  onLogout,
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const currentInfo = TAB_TITLES[currentTab] || {
    title: "E-Way Bill Generator",
    subtitle: "Production-ready portal JSON generation software",
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0 z-10 shadow-sm relative">
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
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-mono text-slate-600">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
          <span>NIC Bulk v{schemaVersion}</span>
        </div>

        {/* Portal Notice Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
          <span>Manual Portal Upload</span>
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

        {/* User Account Menu */}
        {currentUser && (
          <div className="relative pl-2 border-l border-slate-200">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div
                className={`w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center ${
                  currentUser.avatarColor || "bg-indigo-600"
                } shadow-sm`}
              >
                {currentUser.fullName.charAt(0)}
              </div>
              <div className="hidden md:flex flex-col text-left leading-tight">
                <span className="text-xs font-bold text-slate-800 max-w-[120px] truncate">
                  {currentUser.fullName}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {currentUser.userId}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setUserMenuOpen(false)}
                ></div>
                <div className="absolute right-0 top-12 z-30 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <div className="font-bold text-slate-800">
                      {currentUser.fullName}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {currentUser.email}
                    </div>
                    <div className="mt-1">
                      <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                        {currentUser.role}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      if (onOpenProfile) onOpenProfile();
                    }}
                    className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors font-medium"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>My Profile & Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      if (onLogout) onLogout();
                    }}
                    className="w-full px-3.5 py-2 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors font-medium border-t border-slate-100"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
