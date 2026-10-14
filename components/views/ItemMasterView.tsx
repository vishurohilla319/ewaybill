"use client";

import React, { useState } from "react";
import {
  PackageCheck,
  Plus,
  Trash2,
  Edit3,
  X,
  Search,
} from "lucide-react";
import { ItemMaster } from "../../lib/types/ewayBill";
import { GST_RATES, UNIT_CODES } from "../../lib/constants/gstData";

interface ItemMasterViewProps {
  items: ItemMaster[];
  onSaveItem: (item: ItemMaster) => void;
  onDeleteItem: (id: string) => void;
}

export const ItemMasterView: React.FC<ItemMasterViewProps> = ({
  items,
  onSaveItem,
  onDeleteItem,
}) => {
  const [editing, setEditing] = useState<ItemMaster | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleOpenNew = () => {
    setEditing({
      id: `item-${Date.now()}`,
      name: "",
      description: "",
      hsnCode: "",
      unit: "NOS",
      defaultGstRate: 18,
      cessRate: 0,
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (it: ItemMaster) => {
    setEditing({ ...it });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;

    if (!editing.name.trim()) {
      setErrorMsg("Product / Item Name is required.");
      return;
    }

    const cleanHsn = editing.hsnCode.replace(/\D/g, "");
    if (!cleanHsn || cleanHsn.length < 2 || cleanHsn.length > 8) {
      setErrorMsg("HSN Code must be numeric and between 2 to 8 digits.");
      return;
    }

    onSaveItem({
      ...editing,
      name: editing.name.trim(),
      hsnCode: cleanHsn,
    });
    setIsModalOpen(false);
    setEditing(null);
  };

  const filtered = items.filter((it) => {
    const q = searchTerm.toLowerCase();
    return (
      it.name.toLowerCase().includes(q) ||
      it.hsnCode.includes(q) ||
      (it.description && it.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <PackageCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">
              Item & HSN Code Master Directory ({items.length})
            </h2>
            <p className="text-xs text-slate-500">
              Maintain product catalog with standardized HSN codes, measurement units, and default GST rates for rapid invoice creation
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenNew}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search products by item name, HSN code, or description..."
          className="w-full text-xs text-slate-800 focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left acc-table">
          <thead>
            <tr>
              <th>Item Name & Description</th>
              <th>HSN Code</th>
              <th>Unit</th>
              <th>Default GST %</th>
              <th>Cess %</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((it) => (
              <tr key={it.id} className="hover:bg-slate-50/70 transition-colors">
                <td>
                  <div className="font-bold text-slate-800 text-xs">
                    {it.name}
                  </div>
                  {it.description && (
                    <div className="text-[11px] text-slate-400 truncate max-w-md">
                      {it.description}
                    </div>
                  )}
                </td>
                <td>
                  <span className="font-mono font-semibold text-slate-800 text-xs bg-slate-100 px-2 py-0.5 rounded">
                    {it.hsnCode}
                  </span>
                </td>
                <td className="text-xs font-semibold text-slate-600">
                  {it.unit}
                </td>
                <td>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs">
                    {it.defaultGstRate}%
                  </span>
                </td>
                <td className="text-xs text-slate-500">
                  {it.cessRate ? `${it.cessRate}%` : "0%"}
                </td>
                <td className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleOpenEdit(it)}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete product ${it.name}?`)) {
                          onDeleteItem(it.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">
                {editing.id ? "Edit Product" : "Add Product"}
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
                  Product / Commodity Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editing.name}
                  onChange={(e) =>
                    setEditing({ ...editing, name: e.target.value })
                  }
                  placeholder="e.g. Copper Armoured Cable"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Item Description
                </label>
                <input
                  type="text"
                  value={editing.description || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, description: e.target.value })
                  }
                  placeholder="Technical specifications or trade details"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    HSN Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={8}
                    value={editing.hsnCode}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        hsnCode: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    placeholder="2 to 8 digits"
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Default Unit <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editing.unit}
                    onChange={(e) =>
                      setEditing({ ...editing, unit: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-slate-800 bg-white focus:outline-none"
                  >
                    {UNIT_CODES.map((u) => (
                      <option key={u.code} value={u.code}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Default GST Rate (%) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editing.defaultGstRate}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        defaultGstRate: Number(e.target.value),
                      })
                    }
                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-slate-800 bg-white focus:outline-none font-semibold"
                  >
                    {GST_RATES.map((r) => (
                      <option key={r} value={r}>
                        {r}%
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Cess Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editing.cessRate || 0}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        cessRate: Number(e.target.value),
                      })
                    }
                    placeholder="0"
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
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
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
