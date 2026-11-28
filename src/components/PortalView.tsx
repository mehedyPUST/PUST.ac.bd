'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import {
  BadgeCheck,
  Bell,
  ChevronLeft,
  ChevronRight,
  Home,
  LayoutGrid,
  Lock,
  LogOut,
  Menu,
  Moon,
  RefreshCw,
  ShieldCheck,
  Sun,
  X,
} from 'lucide-react';
import { getAvailableRoleContexts } from '../lib/roleContext';
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
import { RoleSwitcherControl } from './portal/RoleSwitcherControl';
import { StudentDashboardSection } from './portal/StudentDashboardSection';
import { TeacherProfilePanel } from './portal/TeacherProfilePanel';
import {
  getActiveRoleTabs,
  ROLE_LABELS,
  VALID_PORTAL_TABS,
  type PortalTab,
  type PortalTabItem,
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

const PRIMARY_GROUP_TABS = new Set<PortalTab>([
  'overview',
  'student-dashboard',
  'exams',
  'library',
  'halls',
  'certificates',
  'students',
]);

const TAB_ICON_TONES: Record<PortalTab, string> = {
  overview: 'text-pust-700 dark:text-gold-300',
  'student-dashboard': 'text-lapis-600 dark:text-cerulean-400',
  exams: 'text-amber-700 dark:text-amber-400',
  library: 'text-teal-700 dark:text-teal-400',
  halls: 'text-emerald-700 dark:text-emerald-400',
  certificates: 'text-pust-700 dark:text-pust-300',
  students: 'text-lapis-600 dark:text-cerulean-400',
  profile: 'text-cerulean-700 dark:text-cerulean-400',
  users: 'text-lapis-600 dark:text-cerulean-400',
  approvals: 'text-amber-700 dark:text-amber-400',
  workflow: 'text-teal-700 dark:text-teal-400',
  governance: 'text-pust-700 dark:text-pust-300',
  audit: 'text-slate-600 dark:text-slate-400',
};

function getInitials(name: string): string {
  const parts = name
    .replace(/^(Prof\.|Dr\.|Md\.|Mr\.|Ms\.)\s+/i, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'PU';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
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
  const {
    navigateTo,
    setActiveNotice,
    editMode,
    toggleEditMode,
    openCmsDirectory,
    loadStudentDashboard,
    profile,
  } = usePust();

  const [activeTab, setActiveTab] = useState<PortalTab>('overview');
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [switchingRole, setSwitchingRole] = useState(false);
  const [roleSwitchError, setRoleSwitchError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [refreshingWorkspace, setRefreshingWorkspace] = useState(false);
  const [portalDark, setPortalDark] = useState(false);

  const workspaceTopRef = useRef<HTMLElement>(null);
  const navRailRef = useRef<HTMLElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const tabButtonRefs = useRef<Partial<Record<PortalTab, HTMLButtonElement | null>>>({});

  // Restore saved portal dark mode preference safely on client mount
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('pust-portal-dark');
      if (saved === 'true') {
        setPortalDark(true);
      }
    } catch {
      // Storage unavailable
    }
  }, []);

  function togglePortalDark() {
    setPortalDark((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem('pust-portal-dark', String(next));
      } catch {
        // Storage unavailable
      }
      return next;
    });
  }

  useEffect(() => {
    if (!notificationsOpen) return;
    function handleOutside(e: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setNotificationsOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [notificationsOpen]);

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
    'accounts' | 'existing-profiles' | 'faculty-requests' | DepartmentPeopleSection | null
  >(null);
  const [pendingFacultyRequestCount, setPendingFacultyRequestCount] = useState(0);

  const userId = user?.id ?? null;
  const userRole = user?.role ?? null;
  const userMustChangePassword = Boolean(user?.mustChangePassword);

  useEffect(() => {
    if (!userId) return;
    if (userMustChangePassword) {
      setActiveTab('profile');
      return;
    }
    if (requestedTabParam && VALID_PORTAL_TABS.includes(requestedTabParam)) {
      setActiveTab(requestedTabParam);
    } else if (!requestedTabParam) {
      setActiveTab((curr) => (curr === 'overview' ? curr : curr));
    }
    if (
      userRole === 'admin' &&
      (requestedActionParam === 'create-admin' || requestedActionParam === 'create-officer')
    ) {
      setPendingDirectoryAction(requestedActionParam);
    }
    if (
      userRole === 'admin' &&
      (requestedSectionParam === 'accounts' ||
        requestedSectionParam === 'existing-profiles' ||
        requestedSectionParam === 'faculty-requests')
    ) {
      setPendingDirectorySection(requestedSectionParam);
    } else if (
      userRole === 'chairman' &&
      (requestedSectionParam === 'teachers' ||
        requestedSectionParam === 'existing-profiles' ||
        requestedSectionParam === 'faculty-requests' ||
        requestedSectionParam === 'students' ||
        requestedSectionParam === 'activity')
    ) {
      setPendingDirectorySection(requestedSectionParam);
    }
  }, [
    userId,
    userRole,
    userMustChangePassword,
    requestedTabParam,
    requestedActionParam,
    requestedSectionParam,
  ]);

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

  const selectTab = useCallback(
    (nextTab: PortalTab, options?: { scrollToTop?: boolean }) => {
      const effectiveTab: PortalTab =
        user?.mustChangePassword && nextTab !== 'profile' ? 'profile' : nextTab;
      setActiveTab(effectiveTab);
      setMobileMenuOpen(false);
      if (typeof window === 'undefined') return;

      const url = new URL(window.location.href);
      if (effectiveTab === 'overview') {
        url.searchParams.delete('tab');
      } else {
        url.searchParams.set('tab', effectiveTab);
      }
      url.searchParams.delete('action');
      url.searchParams.delete('section');
      window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);

      const shouldScroll = options?.scrollToTop ?? true;
      if (shouldScroll) {
        const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        const rawTop = workspaceTopRef.current
          ? workspaceTopRef.current.getBoundingClientRect().top + window.scrollY - 24
          : 0;
        const targetY = rawTop <= 40 ? 0 : rawTop;
        if (Math.abs(window.scrollY - targetY) > 12 && window.scrollY > targetY) {
          window.scrollTo({ top: targetY, behavior: reduced ? 'auto' : 'smooth' });
        }
      }
    },
    [user?.mustChangePassword]
  );

  const ensureActiveSidebarLinkVisible = useCallback(() => {
    if (typeof window === 'undefined') return;
    const navEl = navRailRef.current;
    const btnEl = tabButtonRefs.current[activeTab];
    if (!navEl || !btnEl) return;

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const behavior: ScrollBehavior = reduced ? 'auto' : 'smooth';
    const isDesktopColumn = window.matchMedia('(min-width: 1024px)').matches;
    if (!isDesktopColumn || navEl.scrollHeight <= navEl.clientHeight + 2) return;

    const navBox = navEl.getBoundingClientRect();
    const elBox = btnEl.getBoundingClientRect();
    const elTop = elBox.top - navBox.top + navEl.scrollTop;
    const elBottom = elTop + btnEl.offsetHeight;
    if (elTop < navEl.scrollTop) {
      navEl.scrollTo({ top: Math.max(0, elTop - 8), behavior });
    } else if (elBottom > navEl.scrollTop + navEl.clientHeight) {
      navEl.scrollTo({ top: elBottom - navEl.clientHeight + 8, behavior });
    }
  }, [activeTab]);

  useEffect(() => {
    if (!user) return;
    const id = window.requestAnimationFrame(() => {
      ensureActiveSidebarLinkVisible();
    });
    return () => window.cancelAnimationFrame(id);
  }, [user, activeTab, ensureActiveSidebarLinkVisible]);

  const roleContexts = useMemo(() => (user ? getAvailableRoleContexts(user) : []), [user]);
  const activeRoleKey = user?.activeRoleKey || 'primary';

  async function handleAuthenticated(authedUser: AuthUser) {
    setLogoutError(null);
    setRoleSwitchError(null);
    onUserChange(authedUser);
    await Promise.all([onBookmarksChange(), onNoticesChange(), onCmsChange()]);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }

  async function handleLogout() {
    try {
      await pustApi.logout();
      setRoleSwitchError(null);
      setMobileMenuOpen(false);
      onUserChange(null);
      await Promise.all([onNoticesChange(), onCmsChange()]);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    } catch (err) {
      setLogoutError(err instanceof Error ? err.message : 'Unable to sign out cleanly.');
    }
  }

  async function handleRefreshWorkspace() {
    if (!user || refreshingWorkspace) return;
    setRefreshingWorkspace(true);
    try {
      await Promise.all([
        loadStudents(),
        onNoticesChange(),
        onBookmarksChange(),
        user.role === 'student' ? loadStudentDashboard() : Promise.resolve(),
      ]);
    } finally {
      setRefreshingWorkspace(false);
    }
  }

  async function handleSwitchRole(roleKey: string) {
    if (!user || switchingRole || roleKey === activeRoleKey) return;
    setRoleSwitchError(null);
    setSwitchingRole(true);
    try {
      const res = await pustApi.switchRole(roleKey);
      const nextUser = res.user;
      setPendingDirectoryAction(null);
      setPendingDirectorySection(null);
      onUserChange(nextUser);
      const nextTabs = getActiveRoleTabs(
        nextUser.role,
        nextUser.departmentCode,
        nextUser.hallAffiliation
      );
      const nextTab: PortalTab = nextUser.mustChangePassword
        ? 'profile'
        : nextTabs.some((t) => t.id === activeTab)
        ? activeTab
        : 'overview';
      selectTab(nextTab, { scrollToTop: false });
      await onNoticesChange();
    } catch (err) {
      setRoleSwitchError(
        err instanceof Error ? err.message : 'Unable to switch active portal role.'
      );
    } finally {
      setSwitchingRole(false);
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

  function focusSignInGateway() {
    if (typeof window === 'undefined') return;
    const emailEl = document.getElementById('portal-signin-email') as HTMLInputElement | null;
    if (emailEl) {
      emailEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      window.setTimeout(() => {
        emailEl.focus({ preventScroll: true });
      }, 250);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  if (!user) {
    return (
      <div className="space-y-2 pb-12">
        <PortalAuthGateway
          departments={departments}
          bootstrapStatus={bootstrapStatus}
          initialAuthError={logoutError}
          requestedTab={requestedTabParam}
          onAuthenticated={handleAuthenticated}
          onNavigateVerify={() => navigateTo('/verify')}
          onBackToSite={onBackToSite}
        />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <StudentDashboardSection onFocusSignIn={focusSignInGateway} />
        </div>
      </div>
    );
  }

  const mustChangePassword = Boolean(user.mustChangePassword);
  const portalTabs = getActiveRoleTabs(
    user.role,
    user.departmentCode,
    user.hallAffiliation
  );
  const resolvedTab: PortalTab = mustChangePassword
    ? 'profile'
    : portalTabs.some((t) => t.id === activeTab)
    ? activeTab
    : portalTabs[0].id;
  const activeTabMeta = portalTabs.find((t) => t.id === resolvedTab) || portalTabs[0];
  const studentSelf = user.role === 'student' ? students[0] ?? null : null;
  const isPortalChairman = user.role === 'chairman';
  const isPortalAdmin = user.role === 'admin';

  const primaryGroupTabs = portalTabs.filter((t) => PRIMARY_GROUP_TABS.has(t.id));
  const secondaryGroupTabs = portalTabs.filter((t) => !PRIMARY_GROUP_TABS.has(t.id));

  function renderNavGroup(title: string, items: PortalTabItem[], collapsed: boolean) {
    if (items.length === 0) return null;
    return (
      <div className="space-y-1">
        {!collapsed && (
          <p className="px-3 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-left">
            {title}
          </p>
        )}
        {items.map((tab) => {
          const Icon = tab.icon;
          const isActive = resolvedTab === tab.id;
          const isLocked = mustChangePassword && tab.id !== 'profile';
          const iconTone = isActive
            ? 'text-pust-700 dark:text-gold-300'
            : TAB_ICON_TONES[tab.id] || 'text-slate-500';
          return (
            <button
              key={tab.id}
              ref={(el) => {
                if (!collapsed) tabButtonRefs.current[tab.id] = el;
              }}
              type="button"
              disabled={isLocked}
              title={collapsed ? tab.label : undefined}
              onClick={() => selectTab(tab.id)}
              className={`w-full flex items-center gap-2.5 rounded-lg text-[13px] transition-colors text-left ${
                collapsed ? 'justify-center px-1 py-2' : 'px-3 py-2'
              } ${
                isActive
                  ? 'bg-pust-50 dark:bg-pust-950/65 border border-pust-200 dark:border-pust-800/75 text-pust-800 dark:text-pust-100 font-semibold cursor-pointer'
                  : isLocked
                  ? 'border border-transparent text-slate-400 dark:text-slate-600 opacity-60 cursor-not-allowed'
                  : 'border border-transparent text-slate-700 dark:text-slate-300 hover:bg-[#F8F7F4] dark:hover:bg-slate-800/70 hover:text-slate-950 dark:hover:text-white font-medium cursor-pointer'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${iconTone}`} />
              {!collapsed && (
                <span className="min-w-0 flex-1 flex items-center justify-between gap-1.5">
                  <span className="truncate">{tab.label}</span>
                  {tab.sourceBadge && !isLocked && (
                    <span className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                      {tab.sourceBadge}
                    </span>
                  )}
                  {isLocked && <Lock className="w-3 h-3 shrink-0" />}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  function renderSidebarFooter(collapsed: boolean) {
    if (!user) return null;
    return (
      <div
        className={`shrink-0 border-t border-stone-200/80 dark:border-slate-800 space-y-1.5 ${
          collapsed ? 'p-1.5' : 'p-2'
        }`}
      >
        {/* User Profile Card */}
        <div
          className={`rounded-lg border border-stone-200 dark:border-slate-800 bg-[#FAF9F6] dark:bg-slate-900 ${
            collapsed ? 'p-1 flex justify-center' : 'p-2 space-y-2'
          }`}
        >
          <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}>
            <span
              title={`${user.name} (${ROLE_LABELS[user.role]})`}
              className={`rounded-full bg-pust-800 text-white font-semibold flex items-center justify-center shrink-0 ${
                collapsed ? 'w-7 h-7 text-[11px]' : 'w-8 h-8 text-xs'
              }`}
            >
              {getInitials(user.name)}
            </span>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate text-left">
                    {user.name}
                  </p>
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate text-left tabular-nums">
                  {ROLE_LABELS[user.role]} · {user.academicId}
                </p>
              </div>
            )}
          </div>

          {!collapsed && roleContexts.length > 1 && (
            <RoleSwitcherControl
              variant="sidebar"
              contexts={roleContexts}
              activeKey={activeRoleKey}
              switching={switchingRole}
              disabled={mustChangePassword}
              onSwitch={handleSwitchRole}
            />
          )}
        </div>

        {/* Dark Mode Toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={portalDark}
          aria-label="Toggle portal dark mode"
          title={collapsed ? (portalDark ? 'Switch to light mode' : 'Switch to dark mode') : undefined}
          onClick={togglePortalDark}
          className={`w-full rounded-lg border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-1.5 flex items-center ${
            collapsed ? 'justify-center px-1' : 'justify-between px-3'
          } gap-2 hover:bg-[#FAF9F6] dark:hover:bg-slate-800 transition-colors cursor-pointer`}
        >
          <span className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200">
            {portalDark ? (
              <Sun className="w-3.5 h-3.5 text-gold-400 shrink-0" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-pust-700 shrink-0" />
            )}
            {!collapsed && <span>Dark Mode</span>}
          </span>
          {!collapsed && (
            <span
              aria-hidden="true"
              className={`w-8 h-4.5 rounded-full p-0.5 transition-colors flex items-center ${
                portalDark ? 'bg-pust-600 justify-end' : 'bg-stone-200 justify-start'
              }`}
            >
              <span className="w-3.5 h-3.5 rounded-full bg-white shadow-2xs" />
            </span>
          )}
        </button>

        {/* Sign Out */}
        <button
          type="button"
          title={collapsed ? 'Sign Out' : undefined}
          onClick={handleLogout}
          className={`w-full rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/25 hover:bg-red-50 dark:hover:bg-red-950/45 py-1.5 flex items-center justify-center gap-2 text-xs font-semibold text-red-600 dark:text-red-400 transition-colors cursor-pointer whitespace-nowrap ${
            collapsed ? 'px-1' : 'px-3'
          }`}
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    );
  }

  return (
    <section
      ref={workspaceTopRef}
      className={`portal-shell flex-1 w-full bg-[#F8F7F4] dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors ${
        portalDark ? 'dark' : ''
      }`}
    >
      <div className="max-w-[1600px] mx-auto px-2.5 sm:px-3.5 pb-2.5 min-h-screen flex flex-col lg:flex-row gap-2.5 items-stretch">
        {/* Left Sidebar Column (Desktop — Sticky Grid 1 & Grid 3) */}
        <div
          className={`hidden lg:flex flex-col gap-2.5 shrink-0 transition-all duration-200 lg:sticky lg:top-0 lg:pt-2.5 lg:pb-2.5 lg:self-start lg:h-screen ${
            sidebarCollapsed ? 'w-[56px]' : 'w-[252px]'
          }`}
        >
          {/* Grid 1: Floating Brand Card */}
          <div
            data-portal-grid="user-dashboard"
            className={`shrink-0 rounded-lg border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 h-[58px] flex items-center ${
              sidebarCollapsed ? 'justify-center px-1.5' : 'gap-2.5 px-3'
            }`}
          >
            <div className="w-8 h-8 rounded-md bg-pust-50 dark:bg-pust-950/60 border border-pust-200/80 dark:border-pust-800/60 flex items-center justify-center shrink-0">
              <PustCrest variant="primary" size={24} />
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-950 dark:text-white leading-tight truncate text-left">
                  PUST Portal
                </p>
                <p className="text-[11px] font-semibold text-pust-700 dark:text-gold-300 leading-tight truncate text-left">
                  Dashboard
                </p>
              </div>
            )}
          </div>

          {/* Grid 3: Floating Sidebar Navigation Card */}
          <aside
            data-portal-grid="sidebar-links"
            aria-label="Portal workspace navigation"
            className="relative flex-1 min-h-0 flex flex-col rounded-lg border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900"
          >
            {/* Floating Collapse Edge Toggle */}
            <button
              type="button"
              onClick={() => setSidebarCollapsed((v) => !v)}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 shadow-xs items-center justify-center text-slate-500 dark:text-slate-300 hover:text-pust-700 dark:hover:text-white z-20 cursor-pointer transition-colors"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronLeft className="w-3.5 h-3.5" />
              )}
            </button>

            <nav
              ref={navRailRef}
              aria-label="Campus portal workspace modules"
              className={`flex-1 min-h-0 overflow-y-auto no-scrollbar ${
                sidebarCollapsed ? 'px-1.5 py-2.5 space-y-2' : 'px-2.5 py-3 space-y-4'
              }`}
            >
              {renderNavGroup('Academics & Services', primaryGroupTabs, sidebarCollapsed)}
              {renderNavGroup('Governance & Account', secondaryGroupTabs, sidebarCollapsed)}
            </nav>

            {renderSidebarFooter(sidebarCollapsed)}
          </aside>
        </div>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 lg:hidden flex">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-slate-950/45 backdrop-blur-2xs"
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                aria-label="Mobile portal navigation"
                className="relative z-10 w-[280px] max-w-[85vw] h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col"
              >
                <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-pust-50 dark:bg-pust-950/60 border border-pust-200/80 flex items-center justify-center shrink-0">
                      <PustCrest variant="primary" size={24} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-950 dark:text-white truncate">
                        PUST Portal
                      </p>
                      <p className="text-[11px] font-semibold text-pust-700 dark:text-gold-300">
                        Dashboard
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Close portal menu"
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <nav className="flex-1 min-h-0 overflow-y-auto px-2.5 py-3 space-y-4">
                  {renderNavGroup('Academics & Services', primaryGroupTabs, false)}
                  {renderNavGroup('Governance & Account', secondaryGroupTabs, false)}
                </nav>

                {renderSidebarFooter(false)}
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

        {/* Right Workspace Column */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Grid 2: Sticky Navbar Wrapper with Opaque Top Backdrop Mask */}
          <div className="sticky top-0 z-30 pt-2.5 pb-2.5 bg-[#F8F7F4] dark:bg-slate-950">
            <header
              data-portal-grid="university-name"
              className="rounded-lg border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 sm:px-4 py-2 min-h-[58px] flex items-center justify-between gap-2.5"
            >
            {/* Left: Mobile Trigger + Breadcrumb */}
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open portal navigation menu"
                className="lg:hidden h-8.5 w-8.5 inline-flex items-center justify-center rounded-md border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-[#FAF9F6] cursor-pointer shrink-0"
              >
                <Menu className="w-4 h-4" />
              </button>

              <nav aria-label="Portal breadcrumb" className="flex items-center gap-2 text-sm min-w-0">
                <span className="text-slate-400 dark:text-slate-500 font-medium hidden sm:inline whitespace-nowrap">
                  PUST Portal
                </span>
                <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">/</span>
                <span className="font-semibold text-slate-900 dark:text-white truncate">
                  {activeTabMeta.label}
                </span>
              </nav>
            </div>

            {/* Right: Utility Action Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={onBackToSite}
                className="h-8.5 inline-flex items-center gap-1.5 px-2.5 rounded-md border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-stone-300 hover:bg-[#FAF9F6] dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5 text-slate-500 dark:text-slate-300" />
                <span>Home</span>
              </button>

              {roleContexts.length > 1 && (
                <div className="hidden md:block">
                  <RoleSwitcherControl
                    variant="header"
                    contexts={roleContexts}
                    activeKey={activeRoleKey}
                    switching={switchingRole}
                    disabled={mustChangePassword}
                    onSwitch={handleSwitchRole}
                  />
                </div>
              )}

              {/* Notifications Popover */}
              <div ref={notificationsRef} className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen((v) => !v)}
                  aria-label="Toggle targeted circulars"
                  aria-expanded={notificationsOpen}
                  className="relative h-8.5 w-8.5 inline-flex items-center justify-center rounded-md border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-[#FAF9F6] dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
                >
                  <Bell className="w-4 h-4" />
                  {targetedNotifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-pust-700 text-white font-mono text-[10px] font-bold flex items-center justify-center tabular-nums">
                      {targetedNotifications.length}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg z-40 overflow-hidden">
                    <div className="px-4 py-3 border-b border-stone-100 dark:border-slate-800 flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        Targeted Circulars
                      </p>
                      <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                        {targetedNotifications.length}
                      </span>
                    </div>
                    {targetedNotifications.length === 0 ? (
                      <p className="p-4 text-xs text-slate-500">
                        No recent circulars targeted to your unit.
                      </p>
                    ) : (
                      <div className="divide-y divide-stone-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
                        {targetedNotifications.map((n) => (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => {
                              setNotificationsOpen(false);
                              setActiveNotice(n);
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-[#FAF9F6] dark:hover:bg-slate-800 transition-colors cursor-pointer space-y-0.5"
                          >
                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                              {n.title}
                            </p>
                            <p className="font-mono text-[10px] text-slate-500 tabular-nums">
                              {n.publishedAt} · {n.departmentCode}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {user.role === 'admin' ? (
                <>
                  <div className="hidden xl:block">
                    <AdminModeSwitch
                      checked={editMode}
                      onToggle={toggleEditMode}
                      variant="desktop"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={openCmsDirectory}
                    className="h-8.5 inline-flex items-center gap-1.5 px-2.5 rounded-md border border-pust-200 dark:border-pust-800 bg-pust-50 dark:bg-pust-950/55 text-xs font-semibold text-pust-800 dark:text-pust-200 hover:bg-pust-100 dark:hover:bg-pust-900/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">CMS Directory</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => navigateTo('/verify')}
                  className="h-8.5 inline-flex items-center gap-1.5 px-2.5 rounded-md border border-pust-200 dark:border-pust-800 bg-pust-50 dark:bg-pust-950/55 text-xs font-semibold text-pust-800 dark:text-pust-200 hover:bg-pust-100 dark:hover:bg-pust-900/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Verify Registry</span>
                </button>
              )}

              <button
                type="button"
                onClick={togglePortalDark}
                aria-label={portalDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className="h-8.5 w-8.5 inline-flex items-center justify-center rounded-md border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-[#FAF9F6] dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
              >
                {portalDark ? (
                  <Sun className="w-4 h-4 text-gold-400" />
                ) : (
                  <Moon className="w-4 h-4 text-pust-700" />
                )}
              </button>

              <button
                type="button"
                onClick={() => void handleRefreshWorkspace()}
                disabled={refreshingWorkspace}
                aria-label="Refresh portal data"
                className="h-8.5 w-8.5 inline-flex items-center justify-center rounded-md border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-[#FAF9F6] dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0 disabled:opacity-60"
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshingWorkspace ? 'animate-spin' : ''}`}
                />
              </button>
            </div>
            </header>
          </div>

          {/* Grid 4: Main Workspace Canvas */}
          <div data-portal-grid="main-contents" className="flex-1 min-w-0 space-y-2.5">
            {(logoutError || roleSwitchError) && (
              <div
                role="alert"
                className="p-3 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-xs text-red-900 dark:text-red-200"
              >
                {roleSwitchError || logoutError}
              </div>
            )}

            <motion.div
              key={`${activeRoleKey}-${resolvedTab}`}
              initial={{ opacity: 0.85, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
            >
              {resolvedTab === 'overview' && (
                <div className="space-y-2.5">
                  <PortalOverviewPanel
                    user={user}
                    portalTabs={portalTabs}
                    studentSelf={studentSelf}
                    studentsCount={students.length}
                    loadingStudents={loadingStudents}
                    receipts={receipts}
                    targetedNotifications={targetedNotifications}
                    bookmarks={bookmarks}
                    roleContexts={roleContexts}
                    activeRoleKey={activeRoleKey}
                    switchingRole={switchingRole}
                    onSwitchRole={handleSwitchRole}
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
                  {user.role === 'student' && (
                    <StudentDashboardSection
                      onSelectTab={(tab) => selectTab(tab)}
                      onOpenReceipt={openReceiptModal}
                    />
                  )}
                </div>
              )}

              {resolvedTab === 'student-dashboard' && (
                <StudentDashboardSection
                  onSelectTab={(tab) => selectTab(tab)}
                  onOpenReceipt={openReceiptModal}
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
                    roleContexts={roleContexts}
                    activeRoleKey={activeRoleKey}
                    switchingRole={switchingRole}
                    onSwitchRole={handleSwitchRole}
                    onUserChange={onUserChange}
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
              {resolvedTab === 'users' && isPortalAdmin && (
                <AdminUserDirectoryPanel
                  currentUser={user}
                  departments={departments}
                  offices={profile?.adminOffices}
                  initialAction={pendingDirectoryAction}
                  initialSection={
                    pendingDirectorySection === 'accounts' ||
                    pendingDirectorySection === 'existing-profiles' ||
                    pendingDirectorySection === 'faculty-requests'
                      ? pendingDirectorySection
                      : null
                  }
                  onConsumeInitialAction={() => setPendingDirectoryAction(null)}
                  onConsumeInitialSection={() => setPendingDirectorySection(null)}
                  onUsersChanged={loadStudents}
                  onCmsChange={onCmsChange}
                  onSelfUpdated={(updated) => onUserChange(updated)}
                  onPendingFacultyRequestsChange={setPendingFacultyRequestCount}
                />
              )}

              {resolvedTab === 'users' && isPortalChairman && !isPortalAdmin && (
                <DepartmentPeoplePanel
                  currentUser={user}
                  departments={departments}
                  initialSection={
                    pendingDirectorySection === 'teachers' ||
                    pendingDirectorySection === 'existing-profiles' ||
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
                  onUserChange={onUserChange}
                />
              )}
            </motion.div>
          </div>
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
