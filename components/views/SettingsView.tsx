"use client";

import React, { useState } from "react";
import {
  Settings,
  Save,
  CheckCircle2,
  ShieldCheck,
  RotateCcw,
  Sliders,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";
import { AppSettings } from "../../lib/types/ewayBill";
import {
  DOC_TYPES,
  SUB_SUPPLY_TYPES,
  SUPPLY_TYPES,
  TRANSPORT_MODES,
  VEHICLE_TYPES,
} from "../../lib/constants/gstData";

interface SettingsViewProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onResetFactoryData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onResetFactoryData,
}) => {
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">
              System Configuration & Schema Rules
            </h2>
            <p className="text-xs text-slate-500">
              Manage official NIC JSON schema versioning, validation tolerances, and default form presets
            </p>
          </div>
        </div>

        {savedSuccess && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings Saved!</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Schema Version */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Official NIC JSON Schema Version
            </h3>
          </div>

          <div className="space-y-2 text-xs">
            <label className="block text-slate-700 font-medium">
              Target Schema Version Specification
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  version: "1.0.0621",
                  label: "1.0.0621 (Official Portal Standard - Recommended)",
                  desc: "Current mandatory standard required by official ewaybillgst.gov.in portal",
                },
                {
                  version: "1.0.1118",
                  label: "1.0.1118 (Legacy NIC Tool Version)",
                  desc: "Previous bulk tool format (may trigger 'download latest version' alert on portal)",
                },
                {
                  version: "1.0.0421",
                  label: "1.0.0421 (API & Offline Tool Legacy)",
                  desc: "Compatible with previous bulk offline tool release",
                },
              ].map((v) => (
                <label
                  key={v.version}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                    formData.schemaVersion === v.version
                      ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div>
                    <input
                      type="radio"
                      name="schemaVersion"
                      value={v.version}
                      checked={formData.schemaVersion === v.version}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          schemaVersion: e.target.value as any,
                        })
                      }
                      className="sr-only"
                    />
                    <div className="font-bold text-slate-800 text-xs">
                      {v.label}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                      {v.desc}
                    </p>
                  </div>
                  {formData.schemaVersion === v.version && (
                    <span className="mt-2 text-[10px] font-bold text-indigo-600 uppercase tracking-wide">
                      Active Schema
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Calculation & Validation Rules */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Validation & Tax Calculation Controls
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="block text-slate-700 font-medium">
                Round-off Tolerance Limit (₹)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="10"
                value={formData.roundOffTolerance}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    roundOffTolerance: Number(e.target.value),
                  })
                }
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <span className="text-[10px] text-slate-400">
                Allowable discrepancy between sum of line item taxes and declared invoice total (Standard: ₹2.00)
              </span>
            </div>

            <div className="space-y-1">
              <label className="block text-slate-700 font-medium">
                Auto-Synchronize State Taxes (CGST/SGST vs IGST)
              </label>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.autoCalculateTax}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      autoCalculateTax: e.target.checked,
                    })
                  }
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span className="text-xs text-slate-700 font-medium">
                  Automatically split rates according to actual dispatch & destination states
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Default Values */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Form Default Values
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Default Supply Type
              </label>
              <select
                value={formData.defaultSupplyType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    defaultSupplyType: e.target.value as any,
                  })
                }
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 bg-white"
              >
                {SUPPLY_TYPES.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Default Document Type
              </label>
              <select
                value={formData.defaultDocType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    defaultDocType: e.target.value as any,
                  })
                }
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 bg-white"
              >
                {DOC_TYPES.map((dt) => (
                  <option key={dt.code} value={dt.code}>
                    {dt.code} - {dt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Default Transport Mode
              </label>
              <select
                value={formData.defaultTransMode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    defaultTransMode: e.target.value,
                  })
                }
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 bg-white"
              >
                {TRANSPORT_MODES.map((tm) => (
                  <option key={tm.code} value={tm.code}>
                    {tm.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Developer Attribution Card */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-xl p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-800">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
              Software Credits & Engineering
            </div>
            <h4 className="text-base font-bold text-white mt-0.5">
              Fin Tax E-Way Bill Generator
            </h4>
            <p className="text-xs text-slate-300 mt-1">
              Developed by <strong className="text-white font-semibold">Vishu Rohilla</strong> • Engineered for full Indian GST Portal compliance.
            </p>
          </div>
          <div className="text-xs text-indigo-200 font-mono bg-indigo-900/60 px-3 py-1.5 rounded-lg border border-indigo-700/50">
            Release 2026.1 • Production Ready
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => {
              if (
                confirm(
                  "Reset sample companies, transporters, items, and settings to factory defaults?"
                )
              ) {
                onResetFactoryData();
                alert("Reset complete. Default data restored.");
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Demo Data</span>
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
