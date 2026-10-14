"use client";

import React, { useState } from "react";
import {
  Building2,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Star,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  X,
} from "lucide-react";
import { CompanyProfile } from "../../lib/types/ewayBill";
import { STATE_CODES, STATE_OPTIONS } from "../../lib/constants/gstData";
import { isValidGstin } from "../../lib/engine/validator";

interface CompanyMasterViewProps {
  companies: CompanyProfile[];
  activeCompanyId: string;
  onSelectActiveCompany: (id: string) => void;
  onSaveCompany: (company: CompanyProfile) => void;
  onDeleteCompany: (id: string) => void;
}

export const CompanyMasterView: React.FC<CompanyMasterViewProps> = ({
  companies,
  activeCompanyId,
  onSelectActiveCompany,
  onSaveCompany,
  onDeleteCompany,
}) => {
  const [editingCompany, setEditingCompany] = useState<CompanyProfile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleOpenNew = () => {
    setEditingCompany({
      id: `comp-${Date.now()}`,
      legalName: "",
      tradeName: "",
      gstin: "",
      address1: "",
      address2: "",
      place: "",
      pincode: "",
      stateCode: 7,
      phone: "",
      email: "",
      isDefault: false,
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (comp: CompanyProfile) => {
    setEditingCompany({ ...comp });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;

    if (!editingCompany.legalName.trim()) {
      setErrorMsg("Company Legal Name is required.");
      return;
    }

    const cleanGstin = editingCompany.gstin.trim().toUpperCase();
    if (!isValidGstin(cleanGstin) || cleanGstin === "URP") {
      setErrorMsg("Valid 15-character registered GSTIN is required.");
      return;
    }

    const gstState = parseInt(cleanGstin.substring(0, 2), 10);
    if (gstState !== editingCompany.stateCode) {
      setErrorMsg(
        `State code in GSTIN (${gstState}) does not match selected State Code (${editingCompany.stateCode}).`
      );
      return;
    }

    if (!editingCompany.address1.trim()) {
      setErrorMsg("Business Address is required.");
      return;
    }
    if (!editingCompany.place.trim()) {
      setErrorMsg("City / Place is required.");
      return;
    }
    if (!editingCompany.pincode || editingCompany.pincode.length !== 6) {
      setErrorMsg("Valid 6-digit PIN code is required.");
      return;
    }

    onSaveCompany({
      ...editingCompany,
      tradeName: editingCompany.tradeName || editingCompany.legalName,
      gstin: cleanGstin,
    });
    setIsModalOpen(false);
    setEditingCompany(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">
              Taxpayer Company Management
            </h2>
            <p className="text-xs text-slate-500">
              Configure multiple business entities, registered GSTINs, and dispatch addresses. The selected active company auto-fills E-Way Bill consignor details.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenNew}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Company</span>
        </button>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {companies.map((comp) => {
          const isActive = comp.id === activeCompanyId;

          return (
            <div
              key={comp.id}
              className={`bg-white rounded-xl border p-5 shadow-sm transition-all relative flex flex-col justify-between ${
                isActive
                  ? "border-indigo-500 ring-2 ring-indigo-500/20"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-800">
                        {comp.tradeName || comp.legalName}
                      </h3>
                      {isActive && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                          Active Taxpayer
                        </span>
                      )}
                    </div>
                    {comp.tradeName && comp.legalName !== comp.tradeName && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Legal: {comp.legalName}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(comp)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100 transition-colors"
                      title="Edit Company"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {companies.length > 1 && (
                      <button
                        onClick={() => {
                          if (confirm(`Delete company ${comp.tradeName || comp.legalName}?`)) {
                            onDeleteCompany(comp.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                        title="Delete Company"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-500">GSTIN:</span>
                    <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                      {comp.gstin}
                    </span>
                  </div>

                  <div className="flex items-start gap-1.5 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span>
                      {comp.address1}
                      {comp.address2 ? `, ${comp.address2}` : ""},{" "}
                      {comp.place} - {comp.pincode} ({STATE_CODES[comp.stateCode]} [{comp.stateCode}])
                    </span>
                  </div>

                  {(comp.phone || comp.email) && (
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-slate-500 text-[11px]">
                      {comp.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" /> {comp.phone}
                        </span>
                      )}
                      {comp.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" /> {comp.email}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  State Code: {comp.stateCode}
                </span>

                {!isActive && (
                  <button
                    onClick={() => onSelectActiveCompany(comp.id)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-semibold transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Switch to this Company</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && editingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">
                {editingCompany.id ? "Edit Company Details" : "Add New Company"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-5 space-y-3.5 text-xs">
              {errorMsg && (
                <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Legal Registered Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingCompany.legalName}
                  onChange={(e) =>
                    setEditingCompany({ ...editingCompany, legalName: e.target.value })
                  }
                  placeholder="e.g. Acme Industries Private Limited"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Trade / Brand Name
                </label>
                <input
                  type="text"
                  value={editingCompany.tradeName}
                  onChange={(e) =>
                    setEditingCompany({ ...editingCompany, tradeName: e.target.value })
                  }
                  placeholder="e.g. Acme Technologies"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    GSTIN <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    value={editingCompany.gstin}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      const update: any = { gstin: val };
                      if (val.length >= 2) {
                        const st = parseInt(val.substring(0, 2), 10);
                        if (!isNaN(st) && STATE_CODES[st]) {
                          update.stateCode = st;
                        }
                      }
                      setEditingCompany({ ...editingCompany, ...update });
                    }}
                    placeholder="15-character GSTIN"
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 font-mono uppercase focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    State <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editingCompany.stateCode}
                    onChange={(e) =>
                      setEditingCompany({
                        ...editingCompany,
                        stateCode: Number(e.target.value),
                      })
                    }
                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-slate-800 bg-white focus:outline-none"
                  >
                    {STATE_OPTIONS.map((st) => (
                      <option key={st.code} value={st.code}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Business Address Line 1 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingCompany.address1}
                  onChange={(e) =>
                    setEditingCompany({ ...editingCompany, address1: e.target.value })
                  }
                  placeholder="Plot / Office No., Industrial Area"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Address Line 2 (Optional)
                </label>
                <input
                  type="text"
                  value={editingCompany.address2 || ""}
                  onChange={(e) =>
                    setEditingCompany({ ...editingCompany, address2: e.target.value })
                  }
                  placeholder="Landmark / Sector"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    City / Place <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingCompany.place}
                    onChange={(e) =>
                      setEditingCompany({ ...editingCompany, place: e.target.value })
                    }
                    placeholder="e.g. New Delhi"
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    PIN Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={editingCompany.pincode}
                    onChange={(e) =>
                      setEditingCompany({ ...editingCompany, pincode: e.target.value })
                    }
                    placeholder="6 digits"
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Phone Contact
                  </label>
                  <input
                    type="text"
                    value={editingCompany.phone || ""}
                    onChange={(e) =>
                      setEditingCompany({ ...editingCompany, phone: e.target.value })
                    }
                    placeholder="+91 ..."
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Billing Email
                  </label>
                  <input
                    type="email"
                    value={editingCompany.email || ""}
                    onChange={(e) =>
                      setEditingCompany({ ...editingCompany, email: e.target.value })
                    }
                    placeholder="billing@company.com"
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
                >
                  Save Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
