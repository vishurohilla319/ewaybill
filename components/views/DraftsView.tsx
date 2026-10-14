"use client";

import React, { useState } from "react";
import {
  FileClock,
  Trash2,
  Edit3,
  Layers,
  Search,
  ArrowRight,
  FilePlus,
} from "lucide-react";
import { DraftBill, EWayBillDocument } from "../../lib/types/ewayBill";

interface DraftsViewProps {
  drafts: DraftBill[];
  onLoadDraft: (draft: DraftBill) => void;
  onDeleteDraft: (id: string) => void;
  onAddToBatch: (bill: EWayBillDocument) => void;
  onTabChange: (tab: string) => void;
}

export const DraftsView: React.FC<DraftsViewProps> = ({
  drafts,
  onLoadDraft,
  onDeleteDraft,
  onAddToBatch,
  onTabChange,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = drafts.filter((d) => {
    const q = searchTerm.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      (d.bill.docNo && d.bill.docNo.toLowerCase().includes(q)) ||
      (d.bill.toTrdName && d.bill.toTrdName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <FileClock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">
              Saved Drafts ({drafts.length})
            </h2>
            <p className="text-xs text-slate-500">
              Resume editing previously saved E-Way Bill drafts or queue them for bulk generation
            </p>
          </div>
        </div>

        <button
          onClick={() => onTabChange("create")}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <FilePlus className="w-3.5 h-3.5" />
          <span>New E-Way Bill</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search drafts by invoice number, recipient, or draft name..."
          className="w-full text-xs text-slate-800 focus:outline-none"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            Clear
          </button>
        )}
      </div>

      {/* Drafts List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {drafts.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <FileClock className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-slate-700">
              No Saved Drafts
            </div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You can save any partially filled E-Way Bill form as a draft to resume later.
            </p>
            <button
              onClick={() => onTabChange("create")}
              className="mt-2 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              Start New Bill
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left acc-table">
              <thead>
                <tr>
                  <th>Draft Name / Doc No</th>
                  <th>Recipient (Buyer)</th>
                  <th>Items</th>
                  <th>Total Invoice Value</th>
                  <th>Last Modified</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((draft) => (
                  <tr key={draft.id} className="hover:bg-slate-50/70 transition-colors">
                    <td>
                      <div className="font-bold text-slate-800 text-xs">
                        {draft.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Doc: {draft.bill.docNo || "Not specified"} ({draft.bill.docType})
                      </div>
                    </td>
                    <td>
                      <div className="font-medium text-slate-800 text-xs">
                        {draft.bill.toTrdName || "Unassigned"}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {draft.bill.toGstin || "N/A"}
                      </div>
                    </td>
                    <td>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                        {draft.bill.itemList?.length || 0} item(s)
                      </span>
                    </td>
                    <td className="font-mono text-xs font-bold text-slate-800">
                      ₹{(Number(draft.bill.totInvValue) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="text-[11px] text-slate-500 font-mono">
                      {draft.updatedAt}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            onLoadDraft(draft);
                            onTabChange("create");
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-medium transition-colors"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Resume</span>
                        </button>
                        <button
                          onClick={() => {
                            onAddToBatch(draft.bill);
                            alert(`Draft added to Bulk Batch!`);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                          title="Add to Bulk Batch"
                        >
                          <Layers className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Delete this draft permanently?")) {
                              onDeleteDraft(draft.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                          title="Delete Draft"
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
        )}
      </div>
    </div>
  );
};
