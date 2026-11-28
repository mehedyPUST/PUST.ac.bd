'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { ExternalLink, LayoutGrid, LogOut, User } from 'lucide-react';
import { pustApi } from '../lib/api';
import { AdminModeSwitch } from './AdminModeSwitch';
import { PustCrest } from './PustCrest';
import { usePust } from './PustContext';
import { AdminAuditLogPanel } from './portal/AdminAuditLogPanel';
import { AdminCmsPanel } from './portal/AdminCmsPanel';
import { AdminUserDirectoryPanel } from './portal/AdminUserDirectoryPanel';
import { ApprovalDashboardPanel } from './portal/ApprovalDashboardPanel';
import { CertificatePanel } from './portal/CertificatePanel';
import {
  DepartmentPeoplePanel,
  type DepartmentPeopleSection,
} from './portal/DepartmentPeoplePanel';
import { DigitalDocumentModal, type DigitalDocumentData } from './portal/DigitalDocumentModal';
import { ExamPanel } from './portal/ExamPanel';
import { HallPanel } from './portal/HallPanel';
import { LibraryPanel } from './portal/LibraryPanel';
import { OfficeFlowPanel } from './portal/OfficeFlowPanel';
import { PortalAuthGateway } from './portal/PortalAuthGateway';
import { PortalOverviewPanel } from './portal/PortalOverviewPanel';
import { PortalProfilePanel } from './portal/PortalProfilePanel';
import { PortalStudentLedgerPanel } from './portal/PortalStudentLedgerPanel';
import { TeacherProfilePanel } from './portal/TeacherProfilePanel';
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
  const { navigateTo, setActiveNotice, editMode, toggleEditMode, openCmsDirectory, profile } =
    usePust();

  const [activeTab, setActiveTab] = useState<PortalTab>('overview');
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const workspaceTopRef = useRef<HTMLElement>(null);
  const navRailRef = useRef<HTMLElement>(null);
  const tabButtonRefs = useRef<Partial<Record<PortalTab, HTMLButtonElement | null>>>({});

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
  const requestedActionParam = searchParams.get('action');
  const requestedSectionParam = searchParams.get('section');
  const [pendingDirectoryAction, setPendingDirectoryAction] = useState<
    'create-admin' | 'create-officer' | null
  >(null);
  const [pendingDirectorySection, setPendingDirectorySection] = useState<
    'accounts' | 'faculty-requests' | DepartmentPeopleSection | null
  >(null);
  const [pendingFacultyRequestCount, setPendingFacultyRequestCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    if (requestedTabParam && VALID_PORTAL_TABS.includes(requestedTabParam)) {
      setActiveTab(requestedTabParam);
    } else {
      setActiveTab('overview');
    }
    if (
      user.role === 'admin' &&
      (requestedActionParam === 'create-admin' || requestedActionParam === 'create-officer')
    ) {
      setPendingDirectoryAction(requestedActionParam);
    }
    if (
      user.role === 'admin' &&
      (requestedSectionParam === 'accounts' || requestedSectionParam === 'faculty-requests')
    ) {
      setPendingDirectorySection(requestedSectionParam);
    } else if (
      user.role === 'chairman' &&
      (requestedSectionParam === 'teachers' ||
        requestedSectionParam === 'faculty-requests' ||
        requestedSectionParam === 'students' ||
        requestedSectionParam === 'activity')
    ) {
      setPendingDirectorySection(requestedSectionParam);
    }
  }, [user, requestedTabParam, requestedActionParam, requestedSectionParam]);

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'chairman')) {
      setPendingFacultyRequestCount(0);
      return;
    }
    let cancelled = false;
    pustApi
      .getAdminFacultyProfileRequests()
      .then((res) => {
        if (!cancelled) {
          setPendingFacultyRequestCount(
            res.requests.filter((r) => r.status === 'pending').length
          );
        }
      })
      .catch(() => {
        if (!cancelled) setPendingFacultyRequestCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

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

  const selectTab = useCallback((nextTab: PortalTab, options?: { scrollToTop?: boolean }) => {
    setActiveTab(nextTab);
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    if (nextTab === 'overview') {
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', nextTab);
    }
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);

    const shouldScroll = options?.scrollToTop ?? true;
    if (shouldScroll) {
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const rawTop = workspaceTopRef.current
        ? workspaceTopRef.current.getBoundingClientRect().top + window.scrollY - 96
        : 0;
      const targetY = rawTop <= 60 ? 0 : rawTop;
      if (Math.abs(window.scrollY - targetY) > 12 && window.scrollY > targetY) {
        window.scrollTo({ top: targetY, behavior: reduced ? 'auto' : 'smooth' });
      }
    }
  }, []);

  // Keep active mobile horizontal tab centered without affecting vertical page scroll
  useEffect(() => {
    if (!user || typeof window === 'undefined') return;
    const navEl = navRailRef.current;
    const btnEl = tabButtonRefs.current[activeTab];
    if (!navEl || !btnEl) return;
    if (navEl.scrollWidth <= navEl.clientWidth + 2) return;

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const targetLeft = btnEl.offsetLeft - (navEl.clientWidth - btnEl.offsetWidth) / 2;
    navEl.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: reduced ? 'auto' : 'smooth',
    });
  }, [user, activeTab]);

  async function handleAuthenticated(authedUser: AuthUser) {
    setLogoutError(null);
    onUserChange(authedUser);
    await Promise.all([onBookmarksChange(), onNoticesChange(), onCmsChange()]);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }

  async function handleLogout() {
    try {
      await pustApi.logout();
      onUserChange(null);
      await Promise.all([onNoticesChange(), onCmsChange()]);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
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
        requestedTab={requestedTabParam}
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
    <section
      ref={workspaceTopRef}
      className="portal-shell max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10"
    >
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Responsive Workspace Sidebar (horizontal rail on mobile, viewport-bounded sticky 272px column on lg+) */}
        <aside className="w-full lg:w-[272px] shrink-0 bg-white rounded-2xl border border-stone-200 overflow-hidden lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:flex lg:flex-col">
          <div className="shrink-0 bg-gradient-to-br from-pust-950 via-pust-900 to-pust-800 text-white p-4 sm:p-5 space-y-2">
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
            <div className="space-y-0.5 pt-0.5 border-t border-white/10">
              <p className="font-mono text-xs text-pust-100/90 tabular-nums text-left truncate">
                {user.departmentCode} · ID {user.academicId}
                {user.session ? ` · ${user.session}` : ''}
              </p>
              <p className="font-mono text-[11px] text-pust-200/80 text-left truncate">
                {user.email}
              </p>
            </div>
          </div>

          <nav
            ref={navRailRef}
            aria-label="Campus portal workspace modules"
            className="flex lg:flex-col overflow-x-auto no-scrollbar overscroll-x-contain lg:flex-1 lg:min-h-0 lg:overflow-x-hidden lg:overflow-y-auto lg:overscroll-contain gap-1.5 lg:gap-1 p-2.5"
          >
            {portalTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = resolvedTab === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(el) => {
                    tabButtonRefs.current[tab.id] = el;
                  }}
                  type="button"
                  onClick={() => selectTab(tab.id)}
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

          <div className="hidden lg:block shrink-0 p-3 border-t border-stone-200 bg-[#FAF9F6] space-y-2">
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
          <header className="bg-white rounded-2xl border border-stone-200 px-5 sm:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="min-w-0 space-y-0.5">
              <p className="font-mono text-[11px] text-slate-500 text-left truncate">
                Digital Campus / {ROLE_LABELS[user.role]} /{' '}
                <span className="text-pust-800 font-semibold">{activeTabMeta.label}</span>
              </p>
              <h1 className="font-serif text-xl sm:text-2xl font-medium text-slate-950 leading-tight truncate">
                {activeTabMeta.label}
              </h1>
              <p className="font-mono text-[11px] text-slate-500 tabular-nums truncate text-left">
                {user.email} · {user.hallAffiliation}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 md:justify-end shrink-0">
              {resolvedTab !== 'profile' && (
                <button
                  type="button"
                  onClick={() => selectTab('profile')}
                  className="h-9 inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-medium border border-stone-300 bg-[#FAF9F6] text-slate-800 hover:border-pust-800 hover:text-pust-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-pust-800" />
                  <span>My Profile</span>
                </button>
              )}
              <button
                type="button"
                onClick={onBackToSite}
                className="h-9 inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-medium border border-stone-300 bg-white text-slate-700 hover:border-pust-800 hover:text-pust-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Public Site</span>
              </button>
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
                    className="h-9 inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-semibold bg-pust-900 text-white hover:bg-pust-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>CMS Directory</span>
                  </button>
                </>
              )}
            </div>
          </header>

          {logoutError && (
            <div
              role="alert"
              className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-xs text-red-900"
            >
              {logoutError}
            </div>
          )}

          {/* Active Workspace Module (no exit-wait height collapse so scrolling stays silky smooth) */}
          <motion.div
            key={resolvedTab}
            initial={{ opacity: 0.85, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
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
                onSelectTab={(tab) => selectTab(tab)}
                onOpenReceipt={openReceiptModal}
                onNavigateVerify={() => navigateTo('/verify')}
                onOpenNotice={(n) => setActiveNotice(n)}
                onRemoveBookmark={async (itemId) => {
                  await pustApi.removeBookmark(itemId);
                  await onBookmarksChange();
                }}
                onAddCoAdmin={
                  user.role === 'admin'
                    ? () => {
                        setPendingDirectoryAction('create-admin');
                        selectTab('users');
                      }
                    : undefined
                }
                pendingFacultyRequestsCount={pendingFacultyRequestCount}
                onReviewFacultyRequests={
                  user.role === 'admin' || user.role === 'chairman'
                    ? () => {
                        setPendingDirectorySection('faculty-requests');
                        selectTab('users');
                      }
                    : undefined
                }
              />
            )}

            {resolvedTab === 'profile' &&
              (user.role === 'teacher' ? (
                <TeacherProfilePanel
                  user={user}
                  onUserChange={onUserChange}
                  onViewDepartment={(code) =>
                    navigateTo(`/academics/departments/${encodeURIComponent(code.toLowerCase())}`)
                  }
                />
              ) : (
                <PortalProfilePanel
                  user={user}
                  portalTabs={portalTabs}
                  studentSelf={studentSelf}
                  studentsCount={students.length}
                  loadingStudents={loadingStudents}
                  receipts={receipts}
                  targetedNotifications={targetedNotifications}
                  bookmarks={bookmarks}
                  onSelectTab={(tab) => selectTab(tab)}
                  onOpenReceipt={openReceiptModal}
                  onNavigateVerify={() => navigateTo('/verify')}
                  onRemoveBookmark={async (itemId) => {
                    await pustApi.removeBookmark(itemId);
                    await onBookmarksChange();
                  }}
                  onViewDepartment={(code) =>
                    navigateTo(`/academics/departments/${encodeURIComponent(code.toLowerCase())}`)
                  }
                />
              ))}

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
                onOpenTab={(tab) => selectTab(tab as PortalTab)}
              />
            )}

            {resolvedTab === 'workflow' && (
              <OfficeFlowPanel user={user} onOpenTab={(tab) => selectTab(tab as PortalTab)} />
            )}

            {resolvedTab === 'library' && <LibraryPanel user={user} />}
            {resolvedTab === 'halls' && <HallPanel user={user} />}
            {resolvedTab === 'exams' && <ExamPanel user={user} departments={departments} />}
            {resolvedTab === 'certificates' && <CertificatePanel user={user} />}
            {resolvedTab === 'users' && user.role === 'admin' && (
              <AdminUserDirectoryPanel
                currentUser={user}
                departments={departments}
                offices={profile?.adminOffices}
                initialAction={pendingDirectoryAction}
                initialSection={
                  pendingDirectorySection === 'accounts' ||
                  pendingDirectorySection === 'faculty-requests'
                    ? pendingDirectorySection
                    : null
                }
                onConsumeInitialAction={() => setPendingDirectoryAction(null)}
                onConsumeInitialSection={() => setPendingDirectorySection(null)}
                onUsersChanged={loadStudents}
                onCmsChange={onCmsChange}
                onPendingFacultyRequestsChange={setPendingFacultyRequestCount}
              />
            )}

            {resolvedTab === 'users' && user.role === 'chairman' && (
              <DepartmentPeoplePanel
                currentUser={user}
                departments={departments}
                initialSection={
                  pendingDirectorySection === 'teachers' ||
                  pendingDirectorySection === 'faculty-requests' ||
                  pendingDirectorySection === 'students' ||
                  pendingDirectorySection === 'activity'
                    ? pendingDirectorySection
                    : null
                }
                onConsumeInitialSection={() => setPendingDirectorySection(null)}
                onUsersChanged={loadStudents}
                onCmsChange={onCmsChange}
                onPendingFacultyRequestsChange={setPendingFacultyRequestCount}
              />
            )}

            {resolvedTab === 'audit' && user.role === 'admin' && <AdminAuditLogPanel />}

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
