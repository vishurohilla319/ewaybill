import {
  AppSettings,
  CompanyProfile,
  DraftBill,
  ExportHistoryRecord,
  ItemMaster,
  TransporterMaster,
} from "../types/ewayBill";

export const DEFAULT_COMPANIES: CompanyProfile[] = [];
export const DEFAULT_TRANSPORTERS: TransporterMaster[] = [];
export const DEFAULT_ITEMS: ItemMaster[] = [];

export const DEFAULT_SETTINGS: AppSettings = {
  schemaVersion: "1.0.0621",
  defaultSupplyType: "O",
  defaultSubSupplyType: 1,
  defaultDocType: "INV",
  defaultTransMode: "1",
  defaultVehicleType: "R",
  autoCalculateTax: true,
  roundOffTolerance: 1,
  developerCredit: "E-Way Bill Bulk Portal & Verification Generator",
};

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

/**
 * Resolves the active user ID from session or explicitly passed argument.
 */
export function getCurrentUserId(overrideUserId?: string): string {
  if (overrideUserId && overrideUserId.trim()) {
    return overrideUserId.trim().toLowerCase();
  }
  if (typeof window === "undefined") return "";
  try {
    const rawSession = localStorage.getItem("fintax_ewb_session");
    if (rawSession) {
      const session = JSON.parse(rawSession);
      if (session?.user?.userId) {
        return String(session.user.userId).trim().toLowerCase();
      }
    }
  } catch {}
  return "";
}

/**
 * Returns a storage key strictly partitioned by user.
 */
export function getUserStorageKey(baseKey: string, overrideUserId?: string): string {
  const uid = getCurrentUserId(overrideUserId);
  return uid ? `usr_${uid}_${baseKey}` : `fintax_ewb_${baseKey}`;
}

/**
 * Looks up user details from registered user accounts in localStorage.
 */
function findRegisteredUser(userId: string): any {
  if (typeof window === "undefined" || !userId) return null;
  try {
    const raw = localStorage.getItem("fintax_ewb_users");
    if (!raw) return null;
    const users = JSON.parse(raw);
    if (!Array.isArray(users)) return null;
    return users.find(
      (u: any) => String(u.userId || "").toLowerCase() === userId.toLowerCase()
    );
  } catch {
    return null;
  }
}

async function apiPost(endpoint: string, data: any) {
  if (typeof window === "undefined") return;
  try {
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (err) {
    console.warn(`Failed background sync to ${endpoint}:`, err);
  }
}

async function apiDelete(endpoint: string, id: string) {
  if (typeof window === "undefined") return;
  try {
    await fetch(`${endpoint}?id=${id}`, {
      method: "DELETE",
    });
  } catch (err) {
    console.warn(`Failed background delete to ${endpoint}:`, err);
  }
}

export const StorageService = {
  // Sync background data if needed
  syncFromNeon: async (): Promise<boolean> => {
    return true;
  },

  getCompanies: (userId?: string): CompanyProfile[] => {
    const uid = getCurrentUserId(userId);
    const key = getUserStorageKey("companies", uid);
    const stored = safeGet<CompanyProfile[] | null>(key, null);

    if (stored && Array.isArray(stored) && stored.length > 0) {
      // Filter out any legacy dummy companies if they exist
      const cleaned = stored.filter((c) => c.id !== "comp-1" && c.id !== "comp-2");
      return cleaned.length > 0 ? cleaned : stored;
    }

    // If no companies saved for this specific user yet, initialize from their registered profile
    if (uid) {
      const regUser = findRegisteredUser(uid);
      if (regUser) {
        const cleanGstin = String(regUser.companyGstin || "").trim().toUpperCase();
        const cleanName =
          String(regUser.companyName || "").trim() || `${regUser.fullName}'s Business`;
        const stateNum =
          cleanGstin.length >= 2 ? parseInt(cleanGstin.substring(0, 2), 10) || 7 : 7;

        const initialCompany: CompanyProfile = {
          id: regUser.companyId || `comp-${uid}-${Date.now()}`,
          legalName: cleanName,
          tradeName: cleanName,
          gstin: cleanGstin,
          address1: "Main Business Office",
          place: "City",
          pincode: "110001",
          stateCode: stateNum,
          isDefault: true,
        };
        safeSet(key, [initialCompany]);
        return [initialCompany];
      }
    }

    return [];
  },

  saveCompanies: (
    companies: CompanyProfile[],
    syncRemote: boolean = true,
    userId?: string
  ): void => {
    const key = getUserStorageKey("companies", userId);
    safeSet(key, companies);
    if (syncRemote) {
      companies.forEach((comp) => apiPost("/api/companies", comp));
    }
  },

  getActiveCompanyId: (userId?: string): string => {
    const uid = getCurrentUserId(userId);
    const companies = StorageService.getCompanies(uid);
    const key = getUserStorageKey("active_company_id", uid);
    const stored = safeGet<string>(key, "");
    if (stored && companies.some((c) => c.id === stored)) return stored;
    const defaultComp = companies.find((c) => c.isDefault) || companies[0];
    return defaultComp ? defaultComp.id : "";
  },

  setActiveCompanyId: (id: string, userId?: string): void => {
    const key = getUserStorageKey("active_company_id", userId);
    safeSet(key, id);
  },

  getActiveCompany: (userId?: string): CompanyProfile | undefined => {
    const uid = getCurrentUserId(userId);
    const companies = StorageService.getCompanies(uid);
    const activeId = StorageService.getActiveCompanyId(uid);
    return companies.find((c) => c.id === activeId) || companies[0];
  },

  getTransporters: (userId?: string): TransporterMaster[] => {
    const key = getUserStorageKey("transporters", userId);
    return safeGet<TransporterMaster[]>(key, []);
  },

  saveTransporters: (
    transporters: TransporterMaster[],
    syncRemote: boolean = true,
    userId?: string
  ): void => {
    const key = getUserStorageKey("transporters", userId);
    safeSet(key, transporters);
    if (syncRemote) {
      transporters.forEach((trans) => apiPost("/api/transporters", trans));
    }
  },

  getItems: (userId?: string): ItemMaster[] => {
    const key = getUserStorageKey("items", userId);
    return safeGet<ItemMaster[]>(key, []);
  },

  saveItems: (
    items: ItemMaster[],
    syncRemote: boolean = true,
    userId?: string
  ): void => {
    const key = getUserStorageKey("items", userId);
    safeSet(key, items);
    if (syncRemote) {
      items.forEach((item) => apiPost("/api/items", item));
    }
  },

  getDrafts: (userId?: string): DraftBill[] => {
    const key = getUserStorageKey("drafts", userId);
    return safeGet<DraftBill[]>(key, []);
  },

  saveDrafts: (drafts: DraftBill[], userId?: string): void => {
    const key = getUserStorageKey("drafts", userId);
    safeSet(key, drafts);
  },

  addDraft: (draft: DraftBill, userId?: string): void => {
    const drafts = StorageService.getDrafts(userId);
    const existingIdx = drafts.findIndex((d) => d.id === draft.id);
    if (existingIdx >= 0) {
      drafts[existingIdx] = draft;
    } else {
      drafts.unshift(draft);
    }
    const key = getUserStorageKey("drafts", userId);
    safeSet(key, drafts);
    apiPost("/api/drafts", draft);
  },

  deleteDraft: (id: string, userId?: string): void => {
    const drafts = StorageService.getDrafts(userId).filter((d) => d.id !== id);
    const key = getUserStorageKey("drafts", userId);
    safeSet(key, drafts);
    apiDelete("/api/drafts", id);
  },

  getHistory: (userId?: string): ExportHistoryRecord[] => {
    const key = getUserStorageKey("history", userId);
    return safeGet<ExportHistoryRecord[]>(key, []);
  },

  addHistoryRecord: (record: ExportHistoryRecord, userId?: string): void => {
    const history = StorageService.getHistory(userId);
    history.unshift(record);
    if (history.length > 100) history.pop();
    const key = getUserStorageKey("history", userId);
    safeSet(key, history);
    apiPost("/api/history", record);
  },

  clearHistory: (userId?: string): void => {
    const key = getUserStorageKey("history", userId);
    safeSet(key, []);
  },

  getSettings: (userId?: string): AppSettings => {
    const key = getUserStorageKey("settings", userId);
    let stored = safeGet<AppSettings | null>(key, null);

    if (!stored && key !== "fintax_ewb_settings") {
      stored = safeGet<AppSettings | null>("fintax_ewb_settings", null);
    }

    const resolved: AppSettings = { ...DEFAULT_SETTINGS, ...(stored || {}) };

    if (!resolved.schemaVersion || resolved.schemaVersion === "1.0.1118") {
      resolved.schemaVersion = "1.0.0621";
      safeSet(key, resolved);
      if (typeof window !== "undefined" && key !== "fintax_ewb_settings") {
        try {
          const globalStored = safeGet<AppSettings | null>("fintax_ewb_settings", null);
          if (globalStored && globalStored.schemaVersion === "1.0.1118") {
            globalStored.schemaVersion = "1.0.0621";
            safeSet("fintax_ewb_settings", globalStored);
          }
        } catch {}
      }
    }

    return resolved;
  },

  saveSettings: (settings: AppSettings, userId?: string): void => {
    const key = getUserStorageKey("settings", userId);
    safeSet(key, settings);
  },
};
