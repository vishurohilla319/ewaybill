"use client";

import React, { useState } from "react";
import {
  Truck,
  Plus,
  Trash2,
  Edit3,
  Phone,
  Mail,
  X,
  Search,
} from "lucide-react";
import { TransporterMaster } from "../../lib/types/ewayBill";
import { isValidGstin } from "../../lib/engine/validator";

interface TransporterMasterViewProps {
  transporters: TransporterMaster[];
  onSaveTransporter: (transporter: TransporterMaster) => void;
  onDeleteTransporter: (id: string) => void;
}

export const TransporterMasterView: React.FC<TransporterMasterViewProps> = ({
  transporters,
  onSaveTransporter,
  onDeleteTransporter,
}) => {
  const [editing, setEditing] = useState<TransporterMaster | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleOpenNew = () => {
    setEditing({
      id: `trans-${Date.now()}`,
      transporterId: "",
      name: "",
      phone: "",
      email: "",
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: TransporterMaster) => {
    setEditing({ ...t });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;

    const cleanId = editing.transporterId.trim().toUpperCase();
    if (!cleanId || cleanId.length !== 15) {
      setErrorMsg("Transporter ID / TRANSIN must be a 15-character GSTIN or Transporter ID.");
      return;
    }

    if (!editing.name.trim()) {
      setErrorMsg("Transporter Name is required.");
      return;
    }

    onSaveTransporter({
      ...editing,
      transporterId: cleanId,
      name: editing.name.trim(),
    });
    setIsModalOpen(false);
    setEditing(null);
  };

  const filtered = transporters.filter((t) => {
    const q = searchTerm.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.transporterId.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">
              Transporter Master Directory ({transporters.length})
            </h2>
            <p className="text-xs text-slate-500">
              Maintain reusable profiles of logistics partners and fleets with 15-character TRANSIN / GSTIN codes
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenNew}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Transporter</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by Transporter ID or company name..."
          className="w-full text-xs text-slate-800 focus:outline-none"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {t.name}
                  </h3>
                  <div className="mt-1 font-mono text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded inline-block">
                    {t.transporterId}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(t)}
                    className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete transporter ${t.name}?`)) {
                        onDeleteTransporter(t.id);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {(t.phone || t.email) && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-500">
                  {t.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{t.phone}</span>
                    </div>
                  )}
                  {t.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>{t.email}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">
                {editing.id ? "Edit Transporter" : "Add Transporter"}
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
                  Transporter ID / GSTIN / TRANSIN <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={15}
                  value={editing.transporterId}
                  onChange={(e) =>
                    setEditing({ ...editing, transporterId: e.target.value.toUpperCase() })
                  }
                  placeholder="15-character GSTIN or TRANSIN"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 font-mono uppercase focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Transporter Legal / Trade Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editing.name}
                  onChange={(e) =>
                    setEditing({ ...editing, name: e.target.value })
                  }
                  placeholder="e.g. VRL Logistics Ltd"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={editing.phone || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, phone: e.target.value })
                  }
                  placeholder="+91 ..."
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Booking Email
                </label>
                <input
                  type="email"
                  value={editing.email || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, email: e.target.value })
                  }
                  placeholder="booking@transporter.com"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
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
                  Save Transporter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
