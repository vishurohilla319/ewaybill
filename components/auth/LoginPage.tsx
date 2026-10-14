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
import { AuthService } from "../../lib/storage/authService";
import { STATE_CODES, STATE_OPTIONS } from "../../lib/constants/gstData";
import { isValidGstin } from "../../lib/engine/validator";

interface LoginPageProps {
  onLoginSuccess: (session: AuthSession) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const existingUsers = AuthService.getUsers();
  const [activeTab, setActiveTab] = useState<"login" | "register">(
    existingUsers.length === 0 ? "register" : "login"
  );
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
    stateCode: 9,
    pincode: "",
    address: "",
    place: "",
  });

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanInput = userIdInput.trim();
    if (!cleanInput) {
      setErrorMessage("Please enter your User ID or Email.");
      return;
    }
    if (!passwordInput) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const res = await AuthService.login({
        userId: cleanInput,
        password: passwordInput,
      });

      setLoading(false);
      if (res.success && res.session) {
        onLoginSuccess(res.session);
      } else {
        setErrorMessage(
          res.error || "Authentication failed. Please check your User ID and password."
        );
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err?.message || "Login failed. Please try again.");
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUserId = registerData.userId.trim().toLowerCase();
    if (!cleanUserId) {
      setErrorMessage("User ID is required. Please choose a User ID.");
      return;
    }
    if (cleanUserId.length < 3) {
      setErrorMessage("User ID must be at least 3 characters long.");
      return;
    }
    if (!/^[a-zA-Z0-9._-]+$/.test(cleanUserId)) {
      setErrorMessage("User ID can only contain letters, numbers, periods, and hyphens.");
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
        setErrorMessage("Please enter a valid 15-character GSTIN (e.g. 09APHPN0801J1ZY).");
        return;
      }
    }

    setLoading(true);
    try {
      const res = await AuthService.register({
        ...registerData,
        userId: cleanUserId,
      });
      setLoading(false);
      if (res.success && res.session) {
        onLoginSuccess(res.session);
      } else {
        setErrorMessage(res.error || "Registration failed. Please try a different User ID.");
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err?.message || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col justify-start sm:justify-center items-center py-6 px-4 sm:px-6 text-slate-100 overflow-y-auto">
      {/* Brand Header */}
      <div className="text-center mb-4 max-w-md flex-shrink-0">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 shadow-md shadow-indigo-500/30 text-white mb-2">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
          E-Way Bill Generator
        </h1>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Indian GST Bulk JSON Generation & Verification Portal
        </p>
      </div>

      {/* Main Auth Card */}
      <div className="bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex-shrink-0 my-auto mb-6">
        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 text-xs font-bold">
          <button
            type="button"
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
            <span>Create User ID</span>
          </button>

          <button
            type="button"
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
            <span>Sign In</span>
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
              <div className="text-center pb-2">
                <h2 className="text-sm font-bold text-slate-800">
                  Sign In with Your User ID
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter your registered User ID or email address to access your bills.
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} method="POST" action="#" className="space-y-3.5">
                <div>
                  <label htmlFor="login-username" className="block text-xs font-semibold text-slate-700 mb-1">
                    User ID or Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      id="login-username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      required
                      value={userIdInput}
                      onChange={(e) => setUserIdInput(e.target.value)}
                      placeholder="Enter your User ID or Email"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700 mb-1">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
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

              {/* Switch to Register link */}
              <div className="pt-4 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-500 mb-2">
                  Don't have a User ID yet?
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("register");
                    setErrorMessage(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create New User ID (Sign Up)</span>
                </button>
              </div>
            </div>
          ) : (
            /* --- REGISTRATION FORM (CREATE USER ID) --- */
            <form onSubmit={handleRegisterSubmit} method="POST" action="#" className="space-y-3.5 text-xs">
              <div className="text-center pb-1">
                <h2 className="text-sm font-bold text-slate-800">
                  Create Your User Account
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set up your own User ID and business details.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-userId" className="block font-semibold text-slate-700 mb-1">
                    Choose User ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="reg-userId"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={registerData.userId}
                    onChange={(e) =>
                      setRegisterData({
                        ...registerData,
                        userId: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""),
                      })
                    }
                    placeholder="e.g. nh_agencies or mohit"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold text-indigo-700 focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Letters, numbers, dots, and hyphens (min 3 chars)
                  </span>
                </div>

                <div>
                  <label htmlFor="reg-password" className="block font-semibold text-slate-700 mb-1">
                    Set Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="reg-password"
                    name="new-password"
                    type="password"
                    autoComplete="new-password"
                    required
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
                  <label htmlFor="reg-fullname" className="block font-semibold text-slate-700 mb-1">
                    Your Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="reg-fullname"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={registerData.fullName}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, fullName: e.target.value })
                    }
                    placeholder="e.g. Mohit Jain"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="reg-email" className="block font-semibold text-slate-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="reg-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={registerData.email}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, email: e.target.value })
                    }
                    placeholder="e.g. contact@domain.com"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-company" className="block font-semibold text-slate-700 mb-1">
                    Company / Firm Name
                  </label>
                  <input
                    id="reg-company"
                    name="organization"
                    type="text"
                    value={registerData.companyName}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, companyName: e.target.value })
                    }
                    placeholder="e.g. N.H AGENCIES"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label htmlFor="reg-gstin" className="block font-semibold text-slate-700 mb-1">
                    Registered GSTIN (15 Digits)
                  </label>
                  <input
                    id="reg-gstin"
                    name="gstin"
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
                    placeholder="e.g. 09APHPN0801J1ZY"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono uppercase focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="reg-state" className="block font-semibold text-slate-700 mb-1">
                    State
                  </label>
                  <select
                    id="reg-state"
                    name="state"
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
                  <label htmlFor="reg-place" className="block font-semibold text-slate-700 mb-1">
                    City / Place
                  </label>
                  <input
                    id="reg-place"
                    name="address-level2"
                    type="text"
                    value={registerData.place}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, place: e.target.value })
                    }
                    placeholder="e.g. Modinagar"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="reg-pincode" className="block font-semibold text-slate-700 mb-1">
                    PIN Code
                  </label>
                  <input
                    id="reg-pincode"
                    name="postal-code"
                    type="text"
                    maxLength={6}
                    value={registerData.pincode}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, pincode: e.target.value })
                    }
                    placeholder="e.g. 201204"
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
                    <span>Create User ID & Enter Portal</span>
                  </>
                )}
              </button>

              {/* Switch to Login link */}
              <div className="pt-3 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-500 mb-1.5">
                  Already created a User ID?
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("login");
                    setErrorMessage(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 text-xs font-semibold transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In with Existing User ID</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Card Footer */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 text-center text-[10px] text-slate-500">
          E-Way Bill Generation System • Secure Isolated Storage
        </div>
      </div>
    </div>
  );
};
