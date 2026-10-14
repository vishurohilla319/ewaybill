import { AuthSession, LoginCredentials, RegisterPayload, UserAccount } from "../types/auth";
import { CompanyProfile } from "../types/ewayBill";
import { StorageService } from "./store";

const STORAGE_KEYS = {
  USERS: "fintax_ewb_users",
  SESSION: "fintax_ewb_session",
};

export const DEFAULT_USERS: UserAccount[] = [
  {
    id: "usr-1",
    userId: "vishu.rohilla",
    fullName: "Vishu Rohilla",
    email: "vishu@fintax.in",
    password: "Password@123",
    role: "Admin",
    companyId: "comp-1",
    companyName: "Fin Tax Solutions Pvt Ltd",
    companyGstin: "07AAACF1234D1Z8",
    createdAt: "14/10/2026",
    avatarColor: "bg-indigo-600",
  },
  {
    id: "usr-2",
    userId: "accounts_admin",
    fullName: "Finance & Accounts Head",
    email: "accounts@fintax.in",
    password: "Password@123",
    role: "Accountant",
    companyId: "comp-1",
    companyName: "Fin Tax Solutions Pvt Ltd",
    companyGstin: "07AAACF1234D1Z8",
    createdAt: "14/10/2026",
    avatarColor: "bg-emerald-600",
  },
  {
    id: "usr-3",
    userId: "taxpayer_mumbai",
    fullName: "Rajesh Rohilla",
    email: "rajesh@rohilla-industries.com",
    password: "Password@123",
    role: "Taxpayer",
    companyId: "comp-2",
    companyName: "Rohilla Logistics & Manufacturing Co.",
    companyGstin: "27AABCR9988E1Z4",
    createdAt: "14/10/2026",
    avatarColor: "bg-purple-600",
  },
];

function safeGet<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    return defaultValue;
  }
}

function safeSet<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key}:`, e);
  }
}

export const AuthService = {
  getUsers: (): UserAccount[] => {
    return safeGet<UserAccount[]>(STORAGE_KEYS.USERS, DEFAULT_USERS);
  },

  saveUsers: (users: UserAccount[]): void => {
    safeSet(STORAGE_KEYS.USERS, users);
  },

  getSession: (): AuthSession | null => {
    return safeGet<AuthSession | null>(STORAGE_KEYS.SESSION, null);
  },

  setSession: (session: AuthSession | null): void => {
    if (session) {
      safeSet(STORAGE_KEYS.SESSION, session);
    } else {
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEYS.SESSION);
      }
    }
  },

  login: (credentials: LoginCredentials): { success: boolean; session?: AuthSession; error?: string } => {
    const users = AuthService.getUsers();
    const cleanUserId = credentials.userId.trim().toLowerCase();

    const user = users.find(
      (u) =>
        u.userId.toLowerCase() === cleanUserId ||
        u.email.toLowerCase() === cleanUserId
    );

    if (!user) {
      return { success: false, error: "Invalid User ID or Email. Please check credentials." };
    }

    if (user.password !== credentials.password) {
      return { success: false, error: "Incorrect password. Please try again." };
    }

    const updatedUser = {
      ...user,
      lastLogin: new Date().toLocaleString("en-IN"),
    };

    // Update lastLogin in storage
    const updatedUsers = users.map((u) => (u.id === user.id ? updatedUser : u));
    AuthService.saveUsers(updatedUsers);

    // Create session
    const session: AuthSession = {
      user: updatedUser,
      token: `fintax_tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      loginTime: new Date().toLocaleString("en-IN"),
    };

    AuthService.setSession(session);

    // If company exists in storage, switch to it
    if (user.companyId) {
      StorageService.setActiveCompanyId(user.companyId);
    }

    return { success: true, session };
  },

  register: (payload: RegisterPayload): { success: boolean; session?: AuthSession; error?: string } => {
    const users = AuthService.getUsers();
    const cleanUserId = payload.userId.trim().toLowerCase();

    if (!cleanUserId || cleanUserId.length < 3) {
      return { success: false, error: "User ID must be at least 3 characters long." };
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(cleanUserId)) {
      return { success: false, error: "User ID can only contain letters, numbers, periods, and underscores." };
    }

    if (users.some((u) => u.userId.toLowerCase() === cleanUserId)) {
      return { success: false, error: "This User ID is already taken. Please choose another." };
    }

    if (users.some((u) => u.email.toLowerCase() === payload.email.trim().toLowerCase())) {
      return { success: false, error: "An account with this email address already exists." };
    }

    if (!payload.password || payload.password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters long." };
    }

    // Auto-create company for new user
    const newCompId = `comp-${Date.now()}`;
    const newCompany: CompanyProfile = {
      id: newCompId,
      legalName: payload.companyName.trim() || `${payload.fullName}'s Enterprise`,
      tradeName: payload.companyName.trim() || `${payload.fullName}'s Enterprise`,
      gstin: payload.companyGstin.trim().toUpperCase() || "07AAACF1234D1Z8",
      address1: payload.address.trim() || "Corporate Head Office",
      place: payload.place.trim() || "New Delhi",
      pincode: payload.pincode.trim() || "110001",
      stateCode: payload.stateCode || 7,
      phone: "",
      email: payload.email.trim(),
      isDefault: false,
    };

    const companies = StorageService.getCompanies();
    StorageService.saveCompanies([...companies, newCompany]);
    StorageService.setActiveCompanyId(newCompId);

    const colors = ["bg-indigo-600", "bg-emerald-600", "bg-purple-600", "bg-blue-600", "bg-teal-600"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      userId: cleanUserId,
      fullName: payload.fullName.trim(),
      email: payload.email.trim(),
      password: payload.password,
      role: payload.role || "Taxpayer",
      companyId: newCompId,
      companyName: newCompany.tradeName,
      companyGstin: newCompany.gstin,
      createdAt: new Date().toLocaleDateString("en-IN"),
      lastLogin: new Date().toLocaleString("en-IN"),
      avatarColor: randomColor,
    };

    AuthService.saveUsers([...users, newUser]);

    const session: AuthSession = {
      user: newUser,
      token: `fintax_tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      loginTime: new Date().toLocaleString("en-IN"),
    };

    AuthService.setSession(session);
    return { success: true, session };
  },

  logout: (): void => {
    AuthService.setSession(null);
  },

  updateUser: (userId: string, updates: Partial<UserAccount>): boolean => {
    const users = AuthService.getUsers();
    const idx = users.findIndex((u) => u.userId === userId || u.id === userId);
    if (idx === -1) return false;

    const updatedUser = { ...users[idx], ...updates };
    users[idx] = updatedUser;
    AuthService.saveUsers(users);

    const session = AuthService.getSession();
    if (session && (session.user.id === updatedUser.id || session.user.userId === updatedUser.userId)) {
      AuthService.setSession({ ...session, user: updatedUser });
    }
    return true;
  },

  changePassword: (userId: string, oldPass: string, newPass: string): { success: boolean; error?: string } => {
    const users = AuthService.getUsers();
    const user = users.find((u) => u.userId === userId || u.id === userId);
    if (!user) return { success: false, error: "User not found." };
    if (user.password !== oldPass) return { success: false, error: "Current password does not match." };
    if (newPass.length < 6) return { success: false, error: "New password must be at least 6 characters." };

    user.password = newPass;
    AuthService.saveUsers(users);
    return { success: true };
  },
};
