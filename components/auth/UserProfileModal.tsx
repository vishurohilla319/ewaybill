"use client";

import React, { useState } from "react";
import {
  X,
  User,
  ShieldCheck,
  Building2,
  KeyRound,
  LogOut,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Mail,
} from "lucide-react";
import { UserAccount } from "../../lib/types/auth";
import { AuthService } from "../../lib/storage/authService";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onLogout: () => void;
  onSwitchUser: (userId: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogout,
  onSwitchUser,
}) => {
  const [activeTab, setActiveTab] = useState<"profile" | "password" | "users">("profile");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!isOpen) return null;

  const allUsers = AuthService.getUsers();

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (newPassword !== confirmPassword) {
      setStatusMessage({ type: "error", text: "New passwords do not match." });
      return;
    }

    const res = AuthService.changePassword(currentUser.userId, oldPassword, newPassword);
    if (res.success) {
      setStatusMessage({ type: "success", text: "Password changed successfully!" });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setStatusMessage({ type: "error", text: res.error || "Failed to change password." });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full text-white font-bold flex items-center justify-center ${currentUser.avatarColor || "bg-indigo-600"} shadow-sm`}>
              {currentUser.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800">
                  {currentUser.fullName}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                  {currentUser.role}
                </span>
              </div>
              <div className="text-xs font-mono text-slate-500">
                User ID: <span className="font-semibold text-slate-700">{currentUser.userId}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 border-b border-slate-200 bg-white text-xs font-semibold text-center">
          <button
            onClick={() => {
              setActiveTab("profile");
              setStatusMessage(null);
            }}
            className={`py-2.5 border-b-2 transition-colors ${
              activeTab === "profile"
                ? "border-indigo-600 text-indigo-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Account Details
          </button>
          <button
            onClick={() => {
              setActiveTab("password");
              setStatusMessage(null);
            }}
            className={`py-2.5 border-b-2 transition-colors ${
              activeTab === "password"
                ? "border-indigo-600 text-indigo-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Change Password
          </button>
          <button
            onClick={() => {
              setActiveTab("users");
              setStatusMessage(null);
            }}
            className={`py-2.5 border-b-2 transition-colors ${
              activeTab === "users"
                ? "border-indigo-600 text-indigo-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Switch User ({allUsers.length})
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto max-h-96 text-xs space-y-4">
          {statusMessage && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                statusMessage.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/70 space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Registered Name:</span>
                  <strong className="text-slate-800 font-medium">{currentUser.fullName}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>User Login ID:</span>
                  <strong className="font-mono text-slate-800">{currentUser.userId}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Corporate Email:</span>
                  <strong className="text-slate-800 font-medium">{currentUser.email}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Assigned Role:</span>
                  <span className="font-bold text-indigo-700">{currentUser.role}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/70 space-y-2">
                <div className="text-[11px] font-bold uppercase text-slate-400">
                  Associated Taxpayer Company
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Entity Name:</span>
                  <strong className="text-slate-800 font-medium">{currentUser.companyName}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Taxpayer GSTIN:</span>
                  <strong className="font-mono text-slate-800">{currentUser.companyGstin}</strong>
                </div>
                {currentUser.lastLogin && (
                  <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-200/60">
                    <span>Last Login Timestamp:</span>
                    <span className="font-mono text-[11px] text-slate-600">{currentUser.lastLogin}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "password" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Current Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-colors"
                >
                  Update Password
                </button>
              </div>
            </form>
          )}

          {activeTab === "users" && (
            <div className="space-y-2">
              <p className="text-[11px] text-slate-500">
                Switch session to another registered user account:
              </p>

              {allUsers.map((usr) => (
                <div
                  key={usr.id}
                  className={`p-2.5 rounded-lg border flex items-center justify-between transition-all ${
                    usr.userId === currentUser.userId
                      ? "bg-indigo-50/50 border-indigo-300"
                      : "bg-slate-50/50 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-full text-white font-bold flex items-center justify-center text-xs ${usr.avatarColor || "bg-indigo-600"}`}>
                      {usr.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">
                        {usr.fullName}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {usr.userId} • {usr.role}
                      </div>
                    </div>
                  </div>

                  {usr.userId === currentUser.userId ? (
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                      Current
                    </span>
                  ) : (
                    <button
                      onClick={() => onSwitchUser(usr.userId)}
                      className="px-2.5 py-1 rounded bg-white hover:bg-indigo-600 hover:text-white border border-slate-200 text-slate-700 font-semibold text-[11px] transition-all shadow-sm"
                    >
                      Switch
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
