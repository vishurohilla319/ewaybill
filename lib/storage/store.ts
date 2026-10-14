import {
  AppSettings,
  CompanyProfile,
  DraftBill,
  ExportHistoryRecord,
  ItemMaster,
  TransporterMaster,
} from "../types/ewayBill";

const STORAGE_KEYS = {
  COMPANIES: "fintax_ewb_companies",
  ACTIVE_COMPANY_ID: "fintax_ewb_active_company_id",
  TRANSPORTERS: "fintax_ewb_transporters",
  ITEMS: "fintax_ewb_items",
  DRAFTS: "fintax_ewb_drafts",
  HISTORY: "fintax_ewb_history",
  SETTINGS: "fintax_ewb_settings",
};

export const DEFAULT_COMPANIES: CompanyProfile[] = [
  {
    id: "comp-1",
    legalName: "Fin Tax Solutions Pvt Ltd",
    tradeName: "Fin Tax Technologies",
    gstin: "07AAACF1234D1Z8",
    address1: "Plot No. 45, Barakhamba Road",
    address2: "Connaught Place",
    place: "New Delhi",
    pincode: "110001",
    stateCode: 7,
    phone: "+91 9876543210",
    email: "billing@fintax.in",
    isDefault: true,
  },
  {
    id: "comp-2",
    legalName: "Rohilla Logistics & Manufacturing Co.",
    tradeName: "Rohilla Industries",
    gstin: "27AABCR9988E1Z4",
    address1: "Gala No 12, Phase 2, MIDC Industrial Area",
    address2: "Andheri East",
    place: "Mumbai",
    pincode: "400093",
    stateCode: 27,
    phone: "+91 9811223344",
    email: "dispatch@rohilla-industries.com",
    isDefault: false,
  },
];

export const DEFAULT_TRANSPORTERS: TransporterMaster[] = [
  {
    id: "trans-1",
    transporterId: "07AAACT2345K1Z9",
    name: "Delhi Super Fast Roadlines",
    phone: "+91 9811001122",
    email: "booking@delhisuperfast.com",
  },
  {
    id: "trans-2",
    transporterId: "27AABCV8765L1Z1",
    name: "Vishu Logistics & Cargo Express",
    phone: "+91 9922334455",
    email: "ops@vishulogistics.com",
  },
];

export const DEFAULT_ITEMS: ItemMaster[] = [
  {
    id: "item-1",
    name: "Industrial Power Cable 4-Core",
    description: "Heavy duty copper armoured cable 1100V",
    hsnCode: "85444990",
    unit: "MTR",
    defaultGstRate: 18,
    cessRate: 0,
  },
  {
    id: "item-2",
    name: "High Precision Pressure Sensors",
    description: "Digital pneumatic pressure transducer 4-20mA",
    hsnCode: "90262000",
    unit: "NOS",
    defaultGstRate: 18,
    cessRate: 0,
  },
  {
    id: "item-3",
    name: "Heavy Duty Galvanized Steel Bolts",
    description: "Grade 8.8 M16x75mm hex bolts with nuts",
    hsnCode: "73181500",
    unit: "KGS",
    defaultGstRate: 18,
    cessRate: 0,
  },
  {
    id: "item-4",
    name: "Solar Inverter 10kVA",
    description: "Three-phase grid-tied solar photovoltaic inverter",
    hsnCode: "85044080",
    unit: "NOS",
    defaultGstRate: 12,
    cessRate: 0,
  },
  {
    id: "item-5",
    name: "Organic Cotton Yarn 30s",
    description: "Combed ring spun cotton yarn for knitting",
    hsnCode: "52051200",
    unit: "KGS",
    defaultGstRate: 5,
    cessRate: 0,
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  schemaVersion: "1.0.1118",
  defaultSupplyType: "O",
  defaultSubSupplyType: 1,
  defaultDocType: "INV",
  defaultTransMode: "1",
  defaultVehicleType: "R",
  autoCalculateTax: true,
  roundOffTolerance: 2.0,
  developerCredit: "Fin Tax E-Way Bill Generator • Developed by Vishu Rohilla",
};

function safeGet<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Error reading key ${key} from storage:`, e);
    return defaultValue;
  }
}

function safeSet<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing key ${key} to storage:`, e);
  }
}

// Background sync helpers with Neon API routes
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
    await fetch(`${endpoint}?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  } catch (err) {
    console.warn(`Failed background delete to ${endpoint}:`, err);
  }
}

export const StorageService = {
  // Sync all masters and records from Neon PostgreSQL
  syncFromNeon: async (): Promise<boolean> => {
    if (typeof window === "undefined") return false;
    try {
      const [compRes, transRes, itemRes, draftRes, histRes] = await Promise.allSettled([
        fetch("/api/companies").then((r) => r.ok ? r.json() : null),
        fetch("/api/transporters").then((r) => r.ok ? r.json() : null),
        fetch("/api/items").then((r) => r.ok ? r.json() : null),
        fetch("/api/drafts").then((r) => r.ok ? r.json() : null),
        fetch("/api/history").then((r) => r.ok ? r.json() : null),
      ]);

      if (compRes.status === "fulfilled" && compRes.value && compRes.value.length > 0) {
        StorageService.saveCompanies(compRes.value, false);
      }
      if (transRes.status === "fulfilled" && transRes.value && transRes.value.length > 0) {
        StorageService.saveTransporters(transRes.value, false);
      }
      if (itemRes.status === "fulfilled" && itemRes.value && itemRes.value.length > 0) {
        StorageService.saveItems(itemRes.value, false);
      }
      if (draftRes.status === "fulfilled" && draftRes.value) {
        safeSet(STORAGE_KEYS.DRAFTS, draftRes.value);
      }
      if (histRes.status === "fulfilled" && histRes.value) {
        safeSet(STORAGE_KEYS.HISTORY, histRes.value);
      }
      return true;
    } catch (e) {
      console.warn("Neon sync could not complete:", e);
      return false;
    }
  },

  getCompanies: (): CompanyProfile[] => {
    return safeGet<CompanyProfile[]>(
      STORAGE_KEYS.COMPANIES,
      DEFAULT_COMPANIES
    );
  },

  saveCompanies: (companies: CompanyProfile[], syncRemote: boolean = true): void => {
    safeSet(STORAGE_KEYS.COMPANIES, companies);
    if (syncRemote) {
      companies.forEach((comp) => apiPost("/api/companies", comp));
    }
  },

  getActiveCompanyId: (): string => {
    const companies = StorageService.getCompanies();
    const stored = safeGet<string>(STORAGE_KEYS.ACTIVE_COMPANY_ID, "");
    if (stored && companies.some((c) => c.id === stored)) return stored;
    const defaultComp = companies.find((c) => c.isDefault) || companies[0];
    return defaultComp ? defaultComp.id : "";
  },

  setActiveCompanyId: (id: string): void => {
    safeSet(STORAGE_KEYS.ACTIVE_COMPANY_ID, id);
  },

  getActiveCompany: (): CompanyProfile | undefined => {
    const companies = StorageService.getCompanies();
    const activeId = StorageService.getActiveCompanyId();
    return companies.find((c) => c.id === activeId) || companies[0];
  },

  getTransporters: (): TransporterMaster[] => {
    return safeGet<TransporterMaster[]>(
      STORAGE_KEYS.TRANSPORTERS,
      DEFAULT_TRANSPORTERS
    );
  },

  saveTransporters: (transporters: TransporterMaster[], syncRemote: boolean = true): void => {
    safeSet(STORAGE_KEYS.TRANSPORTERS, transporters);
    if (syncRemote) {
      transporters.forEach((trans) => apiPost("/api/transporters", trans));
    }
  },

  getItems: (): ItemMaster[] => {
    return safeGet<ItemMaster[]>(STORAGE_KEYS.ITEMS, DEFAULT_ITEMS);
  },

  saveItems: (items: ItemMaster[], syncRemote: boolean = true): void => {
    safeSet(STORAGE_KEYS.ITEMS, items);
    if (syncRemote) {
      items.forEach((item) => apiPost("/api/items", item));
    }
  },

  getDrafts: (): DraftBill[] => {
    return safeGet<DraftBill[]>(STORAGE_KEYS.DRAFTS, []);
  },

  saveDrafts: (drafts: DraftBill[]): void => {
    safeSet(STORAGE_KEYS.DRAFTS, drafts);
  },

  addDraft: (draft: DraftBill): void => {
    const drafts = StorageService.getDrafts();
    const existingIdx = drafts.findIndex((d) => d.id === draft.id);
    if (existingIdx >= 0) {
      drafts[existingIdx] = draft;
    } else {
      drafts.unshift(draft);
    }
    safeSet(STORAGE_KEYS.DRAFTS, drafts);
    apiPost("/api/drafts", draft);
  },

  deleteDraft: (id: string): void => {
    const drafts = StorageService.getDrafts().filter((d) => d.id !== id);
    safeSet(STORAGE_KEYS.DRAFTS, drafts);
    apiDelete("/api/drafts", id);
  },

  getHistory: (): ExportHistoryRecord[] => {
    return safeGet<ExportHistoryRecord[]>(STORAGE_KEYS.HISTORY, []);
  },

  addHistoryRecord: (record: ExportHistoryRecord): void => {
    const history = StorageService.getHistory();
    history.unshift(record);
    if (history.length > 100) history.pop();
    safeSet(STORAGE_KEYS.HISTORY, history);
    apiPost("/api/history", record);
  },

  clearHistory: (): void => {
    safeSet(STORAGE_KEYS.HISTORY, []);
  },

  getSettings: (): AppSettings => {
    return safeGet<AppSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  },

  saveSettings: (settings: AppSettings): void => {
    safeSet(STORAGE_KEYS.SETTINGS, settings);
  },
};
