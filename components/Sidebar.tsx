"use client";

import React from "react";
import {
  LayoutDashboard,
  FilePlus,
  Files,
  FileSpreadsheet,
  FileClock,
  History,
  Building2,
  Truck,
  PackageCheck,
  Settings,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { CompanyProfile } from "../lib/types/ewayBill";

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  activeCompany?: CompanyProfile;
  companies: CompanyProfile[];
  onSelectCompany: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  activeCompany,
  companies,
  onSelectCompany,
}) => {
  const menuItems = [
    { id: "dashboard", label: "Overview Dashboard", icon: LayoutDashboard },
    { id: "create", label: "Create E-Way Bill", icon: FilePlus, badge: "Form" },
    { id: "bulk", label: "Bulk E-Way Bill", icon: Files, badge: "Batch" },
    { id: "import", label: "Excel Import", icon: FileSpreadsheet },
    { id: "drafts", label: "Saved Drafts", icon: FileClock },
    { id: "history", label: "Export History", icon: History },
  ];

  const masterItems = [
    { id: "companies", label: "Company Management", icon: Building2 },
    { id: "transporters", label: "Transporter Master", icon: Truck },
    { id: "items", label: "Item & HSN Master", icon: PackageCheck },
    { id: "instructions", label: "Portal Instructions", icon: HelpCircle },
    { id: "settings", label: "System Settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col h-screen flex-shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <ShieldCheck className="w-5 h-5 text-indigo-100" />
          </div>
          <div>
            <div className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              Fin Tax <span className="text-xs bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">E-Way Bill</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              NIC JSON Bulk Generator
            </div>
          </div>
        </div>

        {/* Developer Attribution */}
        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Developed by</span>
          <span className="font-semibold text-indigo-300 hover:text-indigo-200 transition-colors">
            Vishu Rohilla
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
        <div>
          <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Transactions
          </div>
          <div className="space-y-0.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        isActive
                          ? "bg-indigo-500 text-white"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Masters & Settings
          </div>
          <div className="space-y-0.5">
            {masterItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Company Selector in Footer */}
      <div className="p-3 bg-slate-950 border-t border-slate-800">
        <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1 flex items-center justify-between">
          <span>Active Company</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>
        <select
          value={activeCompany?.id || ""}
          onChange={(e) => onSelectCompany(e.target.value)}
          aria-label="Active Company"
          className="w-full bg-slate-900 border border-slate-700 rounded text-xs text-slate-200 px-2 py-1.5 focus:outline-none focus:border-indigo-500 font-medium truncate"
        >
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.tradeName || c.legalName} ({c.gstin.substring(0, 5)}...)
            </option>
          ))}
        </select>
        {activeCompany && (
          <div className="mt-1.5 text-[10px] text-slate-400 font-mono truncate">
            GSTIN: <span className="text-slate-300">{activeCompany.gstin}</span>
          </div>
        )}

        <a
          href="https://ewaybillgst.gov.in"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2.5 flex items-center justify-center gap-1.5 w-full py-1.5 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
        >
          <span>Official Portal</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </a>
      </div>
    </aside>
  );
};
