"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  Building2,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Briefcase,
  KeyRound,
} from "lucide-react";
import { AuthSession, RegisterPayload, UserRole } from "../../lib/types/auth";
import { AuthService, DEFAULT_USERS } from "../../lib/storage/authService";
import { STATE_CODES, STATE_OPTIONS } from "../../lib/constants/gstData";
import { isValidGstin } from "../../lib/engine/validator";

interface LoginPageProps {
  onLoginSuccess: (session: AuthSession) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Login form state
  const [userIdInput, setUserIdInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");

  // Register form state
  const [registerData, setRegisterData] = useState<RegisterPayload>({
    userId: "",
    fullName: "",
    email: "",
    password: "",
    role: "Taxpayer",
    companyName: "",
    companyGstin: "",
    stateCode: 7,
    pincode: "110001",
    address: "",
    place: "New Delhi",
  });

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!userIdInput.trim()) {
      setErrorMessage("Please enter your User ID or Email.");
      return;
    }
    if (!passwordInput) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const res = AuthService.login({
        userId: userIdInput,
        password: passwordInput,
      });

      setLoading(false);
      if (res.success && res.session) {
        onLoginSuccess(res.session);
      } else {
        setErrorMessage(res.error || "Authentication failed.");
      }
    }, 200);
  };

  const handleQuickLogin = (userIndex: number) => {
    const demoUser = DEFAULT_USERS[userIndex];
    if (!demoUser) return;

    setLoading(true);
    setErrorMessage(null);
    setTimeout(() => {
      const res = AuthService.login({
        userId: demoUser.userId,
        password: demoUser.password,
      });
      setLoading(false);
      if (res.success && res.session) {
        onLoginSuccess(res.session);
      }
    }, 150);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!registerData.userId.trim()) {
      setErrorMessage("User ID is required.");
      return;
    }
    if (!registerData.fullName.trim()) {
      setErrorMessage("Full Name is required.");
      return;
    }
    if (!registerData.email.trim()) {
      setErrorMessage("Email address is required.");
      return;
    }
    if (registerData.password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    if (registerData.companyGstin) {
      const cleanGstin = registerData.companyGstin.trim().toUpperCase();
      if (!isValidGstin(cleanGstin) && cleanGstin !== "URP") {
        setErrorMessage("Please enter a valid 15-character GSTIN or leave blank for default.");
        return;
      }
    }

    setLoading(true);
    setTimeout(() => {
      const res = AuthService.register(registerData);
      setLoading(false);
      if (res.success && res.session) {
        onLoginSuccess(res.session);
      } else {
        setErrorMessage(res.error || "Registration failed.");
      }
    }, 250);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col justify-start sm:justify-center items-center py-6 px-4 sm:px-6 text-slate-100 overflow-y-auto">
      {/* Brand Header */}
      <div className="text-center mb-4 max-w-md flex-shrink-0">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 shadow-md shadow-indigo-500/30 text-white mb-2">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
          Fin Tax <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">E-Way Bill</span>
        </h1>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Indian GST Bulk JSON Generation & Accounting Software
        </p>
        <div className="text-[10px] text-indigo-300 font-medium">
          Software Developed by <strong className="text-white">Vishu Rohilla</strong>
        </div>
      </div>

      {/* Main Auth Card */}
      <div className="bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex-shrink-0 my-auto mb-6">
        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 text-xs font-bold">
          <button
            onClick={() => {
              setActiveTab("login");
              setErrorMessage(null);
            }}
            className={`py-3 flex items-center justify-center gap-2 transition-all ${
              activeTab === "login"
                ? "bg-white text-indigo-600 border-b-2 border-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In with User ID</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("register");
              setErrorMessage(null);
            }}
            className={`py-3 flex items-center justify-center gap-2 transition-all ${
              activeTab === "register"
                ? "bg-white text-indigo-600 border-b-2 border-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Account</span>
          </button>
        </div>

        {/* Card Body */}
        <div className="p-5 sm:p-6">
          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {activeTab === "login" ? (
            /* --- LOGIN FORM --- */
            <div className="space-y-4">
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    User ID or Registered Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={userIdInput}
                      onChange={(e) => setUserIdInput(e.target.value)}
                      placeholder="e.g. vishu.rohilla or accounts_admin"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Enter account password"
                      className="w-full pl-9 pr-10 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              {/* Quick 1-Click Demo Profiles */}
              <div className="pt-3 border-t border-slate-100">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                  <span>Fast 1-Click Demo Profiles</span>
                  <span className="text-indigo-600 font-semibold">Click to login</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {DEFAULT_USERS.map((usr, i) => (
                    <button
                      key={usr.id}
                      type="button"
                      onClick={() => handleQuickLogin(i)}
                      className="p-2 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-left transition-all group flex flex-col justify-between"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className={`w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${usr.avatarColor || "bg-indigo-600"}`}>
                          {usr.fullName.charAt(0)}
                        </div>
                        <span className="text-[11px] font-bold text-slate-800 group-hover:text-indigo-700 truncate">
                          {usr.fullName.split(" ")[0]}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate">
                        ID: {usr.userId}
                      </div>
                      <div className="text-[9px] text-indigo-600 font-semibold mt-1">
                        {usr.role} ➔
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* --- REGISTRATION FORM --- */
            <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    User ID (Username) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={registerData.userId}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, userId: e.target.value.toLowerCase() })
                    }
                    placeholder="e.g. vishu_accounts"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={registerData.fullName}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, fullName: e.target.value })
                    }
                    placeholder="e.g. Vishu Rohilla"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Corporate Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={registerData.email}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, email: e.target.value })
                    }
                    placeholder="user@enterprise.com"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={registerData.password}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, password: e.target.value })
                    }
                    placeholder="Min 6 characters"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Role
                  </label>
                  <select
                    value={registerData.role}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        role: e.target.value as UserRole,
                      })
                    }
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white focus:outline-none"
                  >
                    <option value="Admin">Administrator / CA</option>
                    <option value="Taxpayer">Taxpayer / Business Owner</option>
                    <option value="Accountant">Chief Accountant</option>
                    <option value="Transporter">Transporter / Fleet</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Registered GSTIN
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    value={registerData.companyGstin}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      const update: any = { companyGstin: val };
                      if (val.length >= 2) {
                        const st = parseInt(val.substring(0, 2), 10);
                        if (!isNaN(st) && STATE_CODES[st]) {
                          update.stateCode = st;
                        }
                      }
                      setRegisterData({ ...registerData, ...update });
                    }}
                    placeholder="15-digit GSTIN"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono uppercase focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Company / Entity Legal Name
                </label>
                <input
                  type="text"
                  value={registerData.companyName}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, companyName: e.target.value })
                  }
                  placeholder="e.g. Rohilla Technologies Pvt Ltd"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    State
                  </label>
                  <select
                    value={registerData.stateCode}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        stateCode: Number(e.target.value),
                      })
                    }
                    className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white focus:outline-none"
                  >
                    {STATE_OPTIONS.map((st) => (
                      <option key={st.code} value={st.code}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    City / Place
                  </label>
                  <input
                    type="text"
                    value={registerData.place}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, place: e.target.value })
                    }
                    placeholder="e.g. New Delhi"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    PIN Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={registerData.pincode}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, pincode: e.target.value })
                    }
                    placeholder="6 digits"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Register Account & Enter Portal</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Card Footer */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 text-center text-[10px] text-slate-500">
          Fin Tax E-Way Bill System • Production Ready • Safe Local Data Isolation
        </div>
      </div>
    </div>
  );
};
