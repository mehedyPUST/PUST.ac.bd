'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { LayoutGrid, LogOut } from 'lucide-react';
import { pustApi } from '../lib/api';
import { AdminModeSwitch } from './AdminModeSwitch';
import { PustCrest } from './PustCrest';
import { usePust } from './PustContext';
import { PwaInstallButton } from './PwaManager';
import { AdminCmsPanel } from './portal/AdminCmsPanel';
import { ApprovalDashboardPanel } from './portal/ApprovalDashboardPanel';
import { CertificatePanel } from './portal/CertificatePanel';
import { DigitalDocumentModal, type DigitalDocumentData } from './portal/DigitalDocumentModal';
import { ExamPanel } from './portal/ExamPanel';
import { HallPanel } from './portal/HallPanel';
import { LibraryPanel } from './portal/LibraryPanel';
import { OfficeFlowPanel } from './portal/OfficeFlowPanel';
import { PortalAuthGateway } from './portal/PortalAuthGateway';
import { PortalOverviewPanel } from './portal/PortalOverviewPanel';
import { PortalStudentLedgerPanel } from './portal/PortalStudentLedgerPanel';
import {
  getRoleTabs,
  ROLE_LABELS,
  VALID_PORTAL_TABS,
  type PortalTab,
} from './portal/portalMeta';
import type {
  AboutContentRecord,
  AuthUser,
  BannerSlideRecord,
  BookmarkRecord,
  BootstrapStatus,
  DepartmentRecord,
  GalleryItemRecord,
  NoticeRecord,
  PaymentReceiptRecord,
  StudentRecord,
  ViceChancellorRecord,
} from '../types/pust';

interface PortalViewProps {
  user: AuthUser | null;
  departments: DepartmentRecord[];
  bookmarks: BookmarkRecord[];
  bootstrapStatus: BootstrapStatus;
  aboutSections: AboutContentRecord[];
  vcProfiles: ViceChancellorRecord[];
  galleryItems: GalleryItemRecord[];
  bannerSlides?: BannerSlideRecord[];
  notices?: NoticeRecord[];
  onUserChange: (user: AuthUser | null) => void;
  onBookmarksChange: () => Promise<void>;
  onNoticesChange: () => Promise<void>;
  onCmsChange: () => Promise<void>;
  onBackToSite: () => void;
}

export function PortalView({
  user,
  departments,
  bookmarks,
  bootstrapStatus,
  aboutSections,
  vcProfiles,
  galleryItems,
  bannerSlides = [],
  notices = [],
  onUserChange,
  onBookmarksChange,
  onNoticesChange,
  onCmsChange,
  onBackToSite,
}: PortalViewProps) {
  const { navigateTo, setActiveNotice, editMode, toggleEditMode, openCmsDirectory } = usePust();

  const [activeTab, setActiveTab] = useState<PortalTab>('overview');
  const [logoutError, setLogoutError] = useState<string | null>(null);

  // Combinable Student Database & Receipts State
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [receipts, setReceipts] = useState<PaymentReceiptRecord[]>([]);
  const [activeDoc, setActiveDoc] = useState<DigitalDocumentData | null>(null);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [stuDeptFilter, setStuDeptFilter] = useState('ALL');
  const [stuSessionFilter, setStuSessionFilter] = useState('ALL');
  const [stuSearch, setStuSearch] = useState('');

  const loadStudents = useCallback(async () => {
    if (!user) return;
    setLoadingStudents(true);
    try {
      const effectiveDept =
        user.role === 'chairman' || user.role === 'teacher'
          ? user.departmentCode
          : stuDeptFilter;
      const [res, rcptRes] = await Promise.all([
        pustApi.getStudents({
          department: effectiveDept,
          session: stuSessionFilter,
          search: stuSearch,
        }),
        user.role === 'student' || user.role === 'admin'
          ? pustApi.getPaymentReceipts().catch(() => ({ receipts: [] }))
          : Promise.resolve({ receipts: [] }),
      ]);
      setStudents(res.students);
      setReceipts(rcptRes.receipts);
    } catch {
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  }, [user, stuDeptFilter, stuSessionFilter, stuSearch]);

  const searchParams = useSearchParams();
  const requestedTabParam = searchParams.get('tab') as PortalTab | null;

  useEffect(() => {
    if (!user) return;
    if (requestedTabParam && VALID_PORTAL_TABS.includes(requestedTabParam)) {
      setActiveTab(requestedTabParam);
    } else {
      setActiveTab('overview');
    }
  }, [user, requestedTabParam]);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'chairman' || user.role === 'teacher') {
      setStuDeptFilter(user.departmentCode);
    } else {
      setStuDeptFilter('ALL');
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadStudents();
    }
  }, [user, loadStudents]);

  const targetedNotifications = useMemo(() => {
    if (!user) return [];
    return notices
      .filter((n) => {
        if (['admin', 'registrar', 'vc'].includes(user.role)) return true;
        if (n.boardScope === 'central') return true;
        if (n.departmentCode === user.departmentCode) {
          if (!n.targetSession || !user.session) return true;
          return n.targetSession === user.session;
        }
        return false;
      })
      .slice(0, 6);
  }, [notices, user]);

  async function handleAuthenticated(authedUser: AuthUser) {
    setLogoutError(null);
    onUserChange(authedUser);
    await Promise.all([onBookmarksChange(), onNoticesChange(), onCmsChange()]);
  }

  async function handleLogout() {
    try {
      await pustApi.logout();
      onUserChange(null);
      await Promise.all([onNoticesChange(), onCmsChange()]);
    } catch (err) {
      setLogoutError(err instanceof Error ? err.message : 'Unable to sign out cleanly.');
    }
  }

  function openReceiptModal(rcpt: PaymentReceiptRecord) {
    setActiveDoc({
      kind: 'receipt',
      serialCode: rcpt.receiptNo,
      title: 'Official Digital Payment Receipt',
      subtitle: `${rcpt.title} — PUST Treasury & Finance Ledger`,
      holderName: rcpt.studentName,
      academicId: rcpt.academicId,
      departmentCode: rcpt.departmentCode,
      issuedAt: rcpt.paidAt,
      issuedBy: `${rcpt.gatewayName} / PUST Finance`,
      statusLabel: rcpt.status,
      rows: [
        { label: 'Receipt Reference', value: rcpt.receiptNo },
        { label: 'Gateway Transaction ID', value: rcpt.transactionId },
        { label: 'Payment Channel', value: `${rcpt.gatewayName} (${rcpt.accountMask || 'Digital'})` },
        { label: 'Amount Settled', value: `BDT ${rcpt.amountBdt.toLocaleString('en-US')}` },
        { label: 'Target Record ID', value: rcpt.targetId },
      ],
      footerNote:
        'Computer-generated digital fee receipt verifiable on the PUST Public Verification Registry.',
    });
  }

  if (!user) {
    return (
      <PortalAuthGateway
        departments={departments}
        bootstrapStatus={bootstrapStatus}
        initialAuthError={logoutError}
        onAuthenticated={handleAuthenticated}
        onNavigateVerify={() => navigateTo('/verify')}
        onBackToSite={onBackToSite}
      />
    );
  }

  const portalTabs = getRoleTabs(user.role, user.departmentCode, user.hallAffiliation);
  const resolvedTab: PortalTab = portalTabs.some((t) => t.id === activeTab)
    ? activeTab
    : portalTabs[0].id;
  const activeTabMeta = portalTabs.find((t) => t.id === resolvedTab) || portalTabs[0];
  const studentSelf = user.role === 'student' ? students[0] ?? null : null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Responsive Workspace Sidebar (horizontal rail on mobile, sticky 272px column on lg+) */}
        <aside className="w-full lg:w-[272px] shrink-0 bg-white rounded-2xl border border-stone-200 overflow-hidden lg:sticky lg:top-24">
          <div className="bg-gradient-to-br from-pust-950 via-pust-900 to-pust-800 text-white p-4 sm:p-5 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <PustCrest variant="light" size={30} className="shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-pust-200 truncate text-left">
                    {ROLE_LABELS[user.role]}
                  </p>
                  <p className="font-serif text-base sm:text-lg font-medium text-white leading-snug truncate text-left">
                    {user.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Sign out of portal"
                className="lg:hidden inline-flex items-center gap-1 min-h-[38px] px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white/15 hover:bg-white/25 text-white whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
            <p className="font-mono text-xs text-pust-100/90 tabular-nums text-left">
              {user.departmentCode} · ID {user.academicId}
              {user.session ? ` · ${user.session}` : ''}
            </p>
          </div>

          <nav
            aria-label="Campus portal workspace modules"
            className="flex lg:flex-col overflow-x-auto no-scrollbar lg:overflow-visible gap-1.5 lg:gap-1 p-2.5"
          >
            {portalTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = resolvedTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`lg:w-full flex items-center gap-2 lg:gap-2.5 px-3 py-2 lg:py-2.5 text-left rounded-xl transition-colors cursor-pointer whitespace-nowrap lg:whitespace-normal shrink-0 lg:shrink ${
                    isActive
                      ? 'bg-pust-900 text-white'
                      : 'bg-stone-100 lg:bg-transparent text-slate-700 hover:bg-[#FAF9F6] hover:text-pust-900'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="min-w-0 lg:flex-1">
                    <span className="block text-xs sm:text-[13px] font-semibold lg:truncate">
                      {tab.label}
                    </span>
                    <span
                      className={`hidden lg:block text-[11px] truncate ${
                        isActive ? 'text-pust-100/85' : 'text-slate-500'
                      }`}
                    >
                      {tab.desc}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="hidden lg:block p-3 border-t border-stone-200 bg-[#FAF9F6] space-y-2">
            {user.role === 'admin' && (
              <button
                type="button"
                onClick={openCmsDirectory}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-pust-900 text-white hover:bg-pust-950 transition-colors cursor-pointer whitespace-nowrap"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Site-Wide CMS Directory</span>
              </button>
            )}
            <PwaInstallButton variant="portal" />
            <button
              type="button"
              onClick={() => navigateTo('/verify')}
              className="w-full px-3 py-2 text-xs font-medium rounded-lg bg-white border border-stone-300 text-slate-700 hover:border-pust-800 hover:text-pust-900 transition-colors cursor-pointer whitespace-nowrap"
            >
              Public Document Verification
            </button>
            <button
              type="button"
              onClick={onBackToSite}
              className="w-full px-3 py-2 text-xs font-medium rounded-lg bg-white border border-stone-300 text-slate-700 hover:border-pust-800 hover:text-pust-900 transition-colors cursor-pointer whitespace-nowrap"
            >
              Public University Website
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-white border border-stone-300 text-slate-700 hover:border-red-400 hover:text-red-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Workspace Viewport */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          {/* Top Contextual Breadcrumb Header */}
          <div className="bg-white rounded-2xl border border-stone-200 px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-xs text-slate-500 text-left truncate">
                Digital Campus / {ROLE_LABELS[user.role]} /{' '}
                <span className="text-pust-800 font-semibold">{activeTabMeta.label}</span>
              </p>
              <h1 className="font-serif text-xl sm:text-2xl font-medium text-slate-900 mt-0.5 truncate">
                {activeTabMeta.label}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end shrink-0">
              {user.role === 'admin' && (
                <>
                  <AdminModeSwitch
                    checked={editMode}
                    onToggle={toggleEditMode}
                    variant="desktop"
                  />
                  <button
                    type="button"
                    onClick={openCmsDirectory}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-pust-900 text-white hover:bg-pust-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>CMS Directory</span>
                  </button>
                </>
              )}
              <p className="font-mono text-xs text-slate-600 tabular-nums truncate max-w-full text-left">
                {user.email} · {user.hallAffiliation}
              </p>
            </div>
          </div>

          {logoutError && (
            <div
              role="alert"
              className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-xs text-red-900"
            >
              {logoutError}
            </div>
          )}

          {/* Active Workspace Module */}
          <AnimatePresence mode="wait">
            <motion.div
              key={resolvedTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
            >
              {resolvedTab === 'overview' && (
                <PortalOverviewPanel
                  user={user}
                  portalTabs={portalTabs}
                  studentSelf={studentSelf}
                  studentsCount={students.length}
                  loadingStudents={loadingStudents}
                  receipts={receipts}
                  targetedNotifications={targetedNotifications}
                  bookmarks={bookmarks}
                  onSelectTab={setActiveTab}
                  onOpenReceipt={openReceiptModal}
                  onNavigateVerify={() => navigateTo('/verify')}
                  onOpenNotice={(n) => setActiveNotice(n)}
                  onRemoveBookmark={async (itemId) => {
                    await pustApi.removeBookmark(itemId);
                    await onBookmarksChange();
                  }}
                />
              )}

              {resolvedTab === 'students' && (
                <PortalStudentLedgerPanel
                  user={user}
                  departments={departments}
                  students={students}
                  studentSelf={studentSelf}
                  loadingStudents={loadingStudents}
                  stuDeptFilter={stuDeptFilter}
                  stuSessionFilter={stuSessionFilter}
                  stuSearch={stuSearch}
                  onDeptFilterChange={setStuDeptFilter}
                  onSessionFilterChange={setStuSessionFilter}
                  onSearchChange={setStuSearch}
                  onReloadStudents={loadStudents}
                />
              )}

              {resolvedTab === 'approvals' && (
                <ApprovalDashboardPanel
                  user={user}
                  departments={departments}
                  onOpenTab={(tab) => setActiveTab(tab as PortalTab)}
                />
              )}

              {resolvedTab === 'workflow' && (
                <OfficeFlowPanel user={user} onOpenTab={(tab) => setActiveTab(tab as PortalTab)} />
              )}

              {resolvedTab === 'library' && <LibraryPanel user={user} />}
              {resolvedTab === 'halls' && <HallPanel user={user} />}
              {resolvedTab === 'exams' && <ExamPanel user={user} departments={departments} />}
              {resolvedTab === 'certificates' && <CertificatePanel user={user} />}
              {resolvedTab === 'governance' && user.role !== 'student' && (
                <AdminCmsPanel
                  user={user}
                  departments={departments}
                  aboutSections={aboutSections}
                  vcProfiles={vcProfiles}
                  galleryItems={galleryItems}
                  bannerSlides={bannerSlides}
                  notices={notices}
                  onNoticesChange={onNoticesChange}
                  onCmsChange={onCmsChange}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <DigitalDocumentModal
        doc={activeDoc}
        onClose={() => setActiveDoc(null)}
        onOpenVerify={(code) => navigateTo(`/verify?code=${encodeURIComponent(code)}`)}
      />
    </section>
  );
}
