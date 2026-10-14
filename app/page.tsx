"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "../components/Sidebar";
import { Header } from "../components/Header";
import { JsonPreviewModal } from "../components/JsonPreviewModal";
import { PortalUploadGuideModal } from "../components/PortalUploadGuideModal";
import { OverviewView } from "../components/views/OverviewView";
import { CreateBillView } from "../components/views/CreateBillView";
import { BulkGenerationView } from "../components/views/BulkGenerationView";
import { ExcelImportView } from "../components/views/ExcelImportView";
import { DraftsView } from "../components/views/DraftsView";
import { HistoryView } from "../components/views/HistoryView";
import { CompanyMasterView } from "../components/views/CompanyMasterView";
import { TransporterMasterView } from "../components/views/TransporterMasterView";
import { ItemMasterView } from "../components/views/ItemMasterView";
import { InstructionsView } from "../components/views/InstructionsView";
import { SettingsView } from "../components/views/SettingsView";
import { LoginPage } from "../components/auth/LoginPage";
import { UserProfileModal } from "../components/auth/UserProfileModal";
import { AuthSession, UserAccount } from "../lib/types/auth";
import { AuthService, DEFAULT_USERS } from "../lib/storage/authService";
import {
  AppSettings,
  CompanyProfile,
  DraftBill,
  EWayBillDocument,
  ExportHistoryRecord,
  ItemMaster,
  TransporterMaster,
  ValidationError,
} from "../lib/types/ewayBill";
import {
  DEFAULT_COMPANIES,
  DEFAULT_ITEMS,
  DEFAULT_SETTINGS,
  DEFAULT_TRANSPORTERS,
  StorageService,
} from "../lib/storage/store";
import { downloadJsonFile } from "../lib/engine/jsonGenerator";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [currentTab, setCurrentTab] = useState<string>("dashboard");

  // Authentication State
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Persistent States
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string>("");
  const [transporters, setTransporters] = useState<TransporterMaster[]>([]);
  const [items, setItems] = useState<ItemMaster[]>([]);
  const [drafts, setDrafts] = useState<DraftBill[]>([]);
  const [history, setHistory] = useState<ExportHistoryRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Active bulk batch queue
  const [batchBills, setBatchBills] = useState<EWayBillDocument[]>([]);

  // Loaded draft for editing
  const [loadedDraft, setLoadedDraft] = useState<DraftBill | null>(null);

  // Modals
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    jsonContent: string;
    filename: string;
    invoiceCount: number;
    totalValue: number;
    errors: ValidationError[];
  }>({
    isOpen: false,
    jsonContent: "",
    filename: "",
    invoiceCount: 0,
    totalValue: 0,
    errors: [],
  });

  const [isUploadGuideOpen, setIsUploadGuideOpen] = useState(false);
  const [lastExportedPayload, setLastExportedPayload] = useState<{
    jsonContent: string;
    filename: string;
  } | null>(null);

  // Load from storage on mount
  useEffect(() => {
    const loadedCompanies = StorageService.getCompanies();
    const loadedActiveId = StorageService.getActiveCompanyId();
    const loadedTransporters = StorageService.getTransporters();
    const loadedItems = StorageService.getItems();
    const loadedDrafts = StorageService.getDrafts();
    const loadedHistory = StorageService.getHistory();
    const loadedSettings = StorageService.getSettings();

    // Load auth session or auto-initialize with default admin session if first visit
    let currentSession = AuthService.getSession();
    if (!currentSession) {
      // Auto-start with default session so the user gets straight to work,
      // or they can switch user anytime using User ID & Password
      const defaultUser = DEFAULT_USERS[0]; // Vishu Rohilla
      currentSession = {
        user: defaultUser,
        token: `fintax_tok_${Date.now()}`,
        loginTime: new Date().toLocaleString("en-IN"),
      };
      AuthService.setSession(currentSession);
    }

    setSession(currentSession);
    setCompanies(loadedCompanies);
    setActiveCompanyId(loadedActiveId);
    setTransporters(loadedTransporters);
    setItems(loadedItems);
    setDrafts(loadedDrafts);
    setHistory(loadedHistory);
    setSettings(loadedSettings);
    setMounted(true);
  }, []);

  const activeCompany =
    companies.find((c) => c.id === activeCompanyId) || companies[0];

  // Auth Handlers
  const handleLoginSuccess = (newSession: AuthSession) => {
    setSession(newSession);
    const userCompany = companies.find((c) => c.id === newSession.user.companyId);
    if (userCompany) {
      setActiveCompanyId(userCompany.id);
      StorageService.setActiveCompanyId(userCompany.id);
    }
  };

  const handleLogout = () => {
    AuthService.logout();
    setSession(null);
  };

  const handleSwitchUser = (targetUserId: string) => {
    const allUsers = AuthService.getUsers();
    const target = allUsers.find((u) => u.userId === targetUserId);
    if (!target) return;

    const res = AuthService.login({
      userId: target.userId,
      password: target.password,
    });

    if (res.success && res.session) {
      setSession(res.session);
      setIsProfileModalOpen(false);
      // Switch to company
      if (target.companyId) {
        setActiveCompanyId(target.companyId);
        StorageService.setActiveCompanyId(target.companyId);
      }
    }
  };

  // Company management
  const handleSelectActiveCompany = (id: string) => {
    setActiveCompanyId(id);
    StorageService.setActiveCompanyId(id);
  };

  const handleSaveCompany = (comp: CompanyProfile) => {
    const existing = companies.findIndex((c) => c.id === comp.id);
    let updated: CompanyProfile[];
    if (existing >= 0) {
      updated = [...companies];
      updated[existing] = comp;
    } else {
      updated = [...companies, comp];
    }
    setCompanies(updated);
    StorageService.saveCompanies(updated);
  };

  const handleDeleteCompany = (id: string) => {
    const updated = companies.filter((c) => c.id !== id);
    setCompanies(updated);
    StorageService.saveCompanies(updated);
    if (activeCompanyId === id && updated.length > 0) {
      setActiveCompanyId(updated[0].id);
      StorageService.setActiveCompanyId(updated[0].id);
    }
  };

  // Transporter management
  const handleSaveTransporter = (trans: TransporterMaster) => {
    const existing = transporters.findIndex((t) => t.id === trans.id);
    let updated: TransporterMaster[];
    if (existing >= 0) {
      updated = [...transporters];
      updated[existing] = trans;
    } else {
      updated = [...transporters, trans];
    }
    setTransporters(updated);
    StorageService.saveTransporters(updated);
  };

  const handleDeleteTransporter = (id: string) => {
    const updated = transporters.filter((t) => t.id !== id);
    setTransporters(updated);
    StorageService.saveTransporters(updated);
  };

  // Item management
  const handleSaveItem = (item: ItemMaster) => {
    const existing = items.findIndex((i) => i.id === item.id);
    let updated: ItemMaster[];
    if (existing >= 0) {
      updated = [...items];
      updated[existing] = item;
    } else {
      updated = [...items, item];
    }
    setItems(updated);
    StorageService.saveItems(updated);
  };

  const handleDeleteItem = (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    StorageService.saveItems(updated);
  };

  // Drafts
  const handleSaveDraft = (draft: DraftBill) => {
    StorageService.addDraft(draft);
    setDrafts(StorageService.getDrafts());
  };

  const handleDeleteDraft = (id: string) => {
    StorageService.deleteDraft(id);
    setDrafts(StorageService.getDrafts());
  };

  const handleLoadDraft = (draft: DraftBill) => {
    setLoadedDraft(draft);
    setCurrentTab("create");
  };

  // Batch queue
  const handleAddToBatch = (bill: EWayBillDocument) => {
    setBatchBills((prev) => [...prev, bill]);
  };

  const handleAddMultipleToBatch = (bills: EWayBillDocument[]) => {
    setBatchBills((prev) => [...prev, ...bills]);
  };

  const handleRemoveFromBatch = (index: number) => {
    setBatchBills((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearBatch = () => {
    setBatchBills([]);
  };

  const handleEditBillFromBatch = (bill: EWayBillDocument) => {
    setLoadedDraft({
      id: `batch-edit-${Date.now()}`,
      name: `Batch Edit - ${bill.docNo}`,
      bill,
      updatedAt: new Date().toLocaleString("en-IN"),
    });
    setCurrentTab("create");
  };

  // Settings
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
  };

  const handleResetFactoryData = () => {
    StorageService.saveCompanies(DEFAULT_COMPANIES);
    StorageService.setActiveCompanyId(DEFAULT_COMPANIES[0].id);
    StorageService.saveTransporters(DEFAULT_TRANSPORTERS);
    StorageService.saveItems(DEFAULT_ITEMS);
    StorageService.saveDrafts([]);
    StorageService.saveSettings(DEFAULT_SETTINGS);

    setCompanies(DEFAULT_COMPANIES);
    setActiveCompanyId(DEFAULT_COMPANIES[0].id);
    setTransporters(DEFAULT_TRANSPORTERS);
    setItems(DEFAULT_ITEMS);
    setDrafts([]);
    setSettings(DEFAULT_SETTINGS);
  };

  // Export success handler
  const handleExportSuccess = (
    filename: string,
    jsonPayload: string,
    billsInput: EWayBillDocument | EWayBillDocument[]
  ) => {
    const bills = Array.isArray(billsInput) ? billsInput : [billsInput];
    const totalVal = bills.reduce(
      (acc, b) => acc + (Number(b.totalValue) || 0),
      0
    );
    const totalTax = bills.reduce(
      (acc, b) =>
        acc +
        (Number(b.cgstValue) || 0) +
        (Number(b.sgstValue) || 0) +
        (Number(b.igstValue) || 0) +
        (Number(b.cessValue) || 0),
      0
    );

    const historyRecord: ExportHistoryRecord = {
      id: `exp-${Date.now()}`,
      timestamp: new Date().toLocaleString("en-IN"),
      filename,
      companyName: activeCompany?.tradeName || activeCompany?.legalName || "N/A",
      companyGstin: activeCompany?.gstin || "N/A",
      invoiceCount: bills.length,
      invoiceNumbers: bills.map((b) => b.docNo),
      totalValue: totalVal,
      totalTax,
      schemaVersion: settings.schemaVersion,
      jsonPayload,
    };

    StorageService.addHistoryRecord(historyRecord);
    setHistory(StorageService.getHistory());

    // Trigger download in browser
    downloadJsonFile(jsonPayload, filename);

    // Save for guide modal
    setLastExportedPayload({ jsonContent: jsonPayload, filename });

    // Open upload instructions modal directly
    setIsUploadGuideOpen(true);
  };

  // Preview JSON trigger
  const handleOpenPreview = (
    jsonContent: string,
    filename: string,
    invoiceCount: number,
    totalValue: number,
    errors: ValidationError[]
  ) => {
    setPreviewModal({
      isOpen: true,
      jsonContent,
      filename,
      invoiceCount,
      totalValue,
      errors,
    });
  };

  if (!mounted) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold tracking-wider text-slate-300">
            Initializing Fin Tax E-Way Bill Generator...
          </span>
        </div>
      </div>
    );
  }

  // If user is logged out, show the Login / Register screen
  if (!session) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          if (tab !== "create") setLoadedDraft(null);
        }}
        activeCompany={activeCompany}
        companies={companies}
        onSelectCompany={handleSelectActiveCompany}
        currentUser={session.user}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          activeCompany={activeCompany}
          schemaVersion={settings.schemaVersion}
          onOpenInstructions={() => setIsUploadGuideOpen(true)}
          currentUser={session.user}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onLogout={handleLogout}
        />

        {/* Tab View Container */}
        <main className="flex-1 overflow-y-auto p-6">
          {currentTab === "dashboard" && (
            <OverviewView
              onTabChange={setCurrentTab}
              activeCompany={activeCompany}
              drafts={drafts}
              history={history}
              itemsCount={items.length}
              transportersCount={transporters.length}
              onOpenUploadGuide={() => setIsUploadGuideOpen(true)}
            />
          )}

          {currentTab === "create" && (
            <CreateBillView
              activeCompany={activeCompany}
              transporters={transporters}
              itemsMaster={items}
              onSaveDraft={handleSaveDraft}
              onAddToBulkBatch={handleAddToBatch}
              onExportSuccess={(filename, json, bill) =>
                handleExportSuccess(filename, json, bill)
              }
              onPreviewJson={handleOpenPreview}
              loadedDraft={loadedDraft}
              onClearLoadedDraft={() => setLoadedDraft(null)}
            />
          )}

          {currentTab === "bulk" && (
            <BulkGenerationView
              batchBills={batchBills}
              onRemoveFromBatch={handleRemoveFromBatch}
              onClearBatch={handleClearBatch}
              onEditBill={handleEditBillFromBatch}
              onTabChange={setCurrentTab}
              activeCompany={activeCompany}
              schemaVersion={settings.schemaVersion}
              onExportSuccess={handleExportSuccess}
              onPreviewJson={handleOpenPreview}
            />
          )}

          {currentTab === "import" && (
            <ExcelImportView
              activeCompany={activeCompany}
              schemaVersion={settings.schemaVersion}
              onAddBillsToBatch={handleAddMultipleToBatch}
              onTabChange={setCurrentTab}
              onExportSuccess={handleExportSuccess}
              onPreviewJson={handleOpenPreview}
            />
          )}

          {currentTab === "drafts" && (
            <DraftsView
              drafts={drafts}
              onLoadDraft={handleLoadDraft}
              onDeleteDraft={handleDeleteDraft}
              onAddToBatch={handleAddToBatch}
              onTabChange={setCurrentTab}
            />
          )}

          {currentTab === "history" && (
            <HistoryView
              history={history}
              onClearHistory={() => {
                StorageService.clearHistory();
                setHistory([]);
              }}
              onPreviewJson={handleOpenPreview}
            />
          )}

          {currentTab === "companies" && (
            <CompanyMasterView
              companies={companies}
              activeCompanyId={activeCompanyId}
              onSelectActiveCompany={handleSelectActiveCompany}
              onSaveCompany={handleSaveCompany}
              onDeleteCompany={handleDeleteCompany}
            />
          )}

          {currentTab === "transporters" && (
            <TransporterMasterView
              transporters={transporters}
              onSaveTransporter={handleSaveTransporter}
              onDeleteTransporter={handleDeleteTransporter}
            />
          )}

          {currentTab === "items" && (
            <ItemMasterView
              items={items}
              onSaveItem={handleSaveItem}
              onDeleteItem={handleDeleteItem}
            />
          )}

          {currentTab === "instructions" && (
            <InstructionsView onTabChange={setCurrentTab} />
          )}

          {currentTab === "settings" && (
            <SettingsView
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onResetFactoryData={handleResetFactoryData}
            />
          )}
        </main>
      </div>

      {/* JSON Preview Modal */}
      <JsonPreviewModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal((prev) => ({ ...prev, isOpen: false }))}
        jsonContent={previewModal.jsonContent}
        filename={previewModal.filename}
        invoiceCount={previewModal.invoiceCount}
        totalValue={previewModal.totalValue}
        errors={previewModal.errors}
        onOpenUploadGuide={() => setIsUploadGuideOpen(true)}
      />

      {/* Portal Upload Instructions Guide Modal */}
      <PortalUploadGuideModal
        isOpen={isUploadGuideOpen}
        onClose={() => setIsUploadGuideOpen(false)}
        hasDownloadAvailable={!!lastExportedPayload}
        onDownloadAction={() => {
          if (lastExportedPayload) {
            downloadJsonFile(
              lastExportedPayload.jsonContent,
              lastExportedPayload.filename
            );
          }
        }}
      />

      {/* User Profile & Password Change Modal */}
      {session && (
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          currentUser={session.user}
          onLogout={handleLogout}
          onSwitchUser={handleSwitchUser}
        />
      )}
    </div>
  );
}
