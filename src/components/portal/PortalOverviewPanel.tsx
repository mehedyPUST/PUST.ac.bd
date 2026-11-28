'use client';

import { useState } from 'react';
import {
  ArrowLeftRight,
  ArrowRight,
  Bell,
  Bookmark,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  GraduationCap,
  LayoutGrid,
  Receipt,
  ShieldCheck,
  ShieldPlus,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import type { RoleContextOption } from '../../lib/roleContext';
import type {
  AuthUser,
  BookmarkRecord,
  NoticeRecord,
  PaymentReceiptRecord,
  StudentRecord,
} from '../../types/pust';
import {
  ROLE_LABELS,
  VALID_PORTAL_TABS,
  type PortalTab,
  type PortalTabItem,
} from './portalMeta';

interface PortalOverviewPanelProps {
  user: AuthUser;
  portalTabs: PortalTabItem[];
  studentSelf: StudentRecord | null;
  studentsCount: number;
  loadingStudents: boolean;
  receipts: PaymentReceiptRecord[];
  targetedNotifications: NoticeRecord[];
  bookmarks: BookmarkRecord[];
  roleContexts?: RoleContextOption[];
  activeRoleKey?: string;
  switchingRole?: boolean;
  onSwitchRole?: (roleKey: string) => void;
  onSelectTab: (tab: PortalTab) => void;
  onOpenReceipt: (receipt: PaymentReceiptRecord) => void;
  onNavigateVerify: () => void;
  onOpenNotice: (notice: NoticeRecord) => void;
  onRemoveBookmark: (itemId: string) => Promise<void>;
  onAddCoAdmin?: () => void;
  pendingFacultyRequestsCount?: number;
  onReviewFacultyRequests?: () => void;
}

export function PortalOverviewPanel({
  user,
  portalTabs,
  studentSelf,
  studentsCount,
  loadingStudents,
  receipts,
  targetedNotifications,
  bookmarks,
  roleContexts = [],
  activeRoleKey = 'primary',
  switchingRole = false,
  onSwitchRole,
  onSelectTab,
  onOpenReceipt,
  onNavigateVerify,
  onOpenNotice,
  onRemoveBookmark,
  onAddCoAdmin,
  pendingFacultyRequestsCount = 0,
  onReviewFacultyRequests,
}: PortalOverviewPanelProps) {
  const [rightPanelTab, setRightPanelTab] = useState<'notices' | 'records'>(
    targetedNotifications.length > 0 || receipts.length === 0 ? 'notices' : 'records'
  );

  const quickModules = portalTabs.filter((t) => t.id !== 'overview');
  const totalSettledBdt = receipts.reduce((sum, r) => sum + (r.amountBdt || 0), 0);
  const semesterNum = studentSelf?.currentSemester ?? 1;
  const degreeProgressPct = Math.min(100, Math.max(12, Math.round((semesterNum / 8) * 100)));
  const moduleCoveragePct = Math.min(
    100,
    Math.max(15, Math.round((portalTabs.length / VALID_PORTAL_TABS.length) * 100))
  );
  const bookmarkRatioPct = Math.min(100, Math.round((bookmarks.length / 8) * 100));

  return (
    <div className="space-y-2.5">
      {/* Band 1: Active Cycle & Institutional Banner Card */}
      <section
        aria-label="Workspace summary banner"
        className="rounded-lg border border-pust-200/90 dark:border-pust-800/60 bg-white dark:bg-slate-900 px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-pust-700 dark:text-gold-300">
              {ROLE_LABELS[user.role]} · Active Workspace
            </span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">
              ·
            </span>
            <span>Unit: {user.officeCode || user.departmentCode}</span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">
              ·
            </span>
            <span className="font-mono tabular-nums">ID: {user.academicId}</span>
            {user.session && (
              <>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">
                  ·
                </span>
                <span className="font-mono tabular-nums">Session: {user.session}</span>
              </>
            )}
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">
              ·
            </span>
            <span className="font-semibold text-amber-700 dark:text-amber-400 tabular-nums">
              {targetedNotifications.length} active{' '}
              {targetedNotifications.length === 1 ? 'circular' : 'circulars'}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-950 dark:text-white tracking-tight leading-snug text-left">
            {user.officeName
              ? `${user.officeName} — PUST Digital Campus Workspace`
              : `PUST ${user.departmentCode} — Academic, Administrative & Service Portal`}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {user.role === 'admin' && onAddCoAdmin && (
            <button
              type="button"
              onClick={onAddCoAdmin}
              className="h-9 inline-flex items-center gap-1.5 px-3.5 rounded-md bg-pust-700 text-xs font-semibold text-white hover:bg-pust-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <ShieldPlus className="w-3.5 h-3.5" />
              <span>Add Co-Admin</span>
            </button>
          )}
          <button
            type="button"
            onClick={onNavigateVerify}
            className="h-9 inline-flex items-center gap-1.5 px-3.5 rounded-md border border-stone-200 dark:border-slate-700 bg-[#FAF9F6] dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:border-pust-700 hover:text-pust-800 dark:hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Verify Documents</span>
          </button>
        </div>
      </section>

      {/* Multi-Role Switcher Strip (if user holds multiple university appointments) */}
      {roleContexts.length > 1 && onSwitchRole && (
        <div className="rounded-lg border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 shrink-0">
            <ArrowLeftRight className="w-3.5 h-3.5 text-pust-700 dark:text-gold-300" />
            <span>Active Appointments ({roleContexts.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {roleContexts.map((ctx) => {
              const isActive = ctx.key === activeRoleKey;
              return (
                <button
                  key={ctx.key}
                  type="button"
                  disabled={switchingRole || isActive}
                  onClick={() => onSwitchRole(ctx.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-pust-700 border-pust-700 text-white cursor-default'
                      : 'bg-[#FAF9F6] dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-pust-700 hover:text-pust-800 cursor-pointer disabled:opacity-60'
                  }`}
                >
                  {isActive && <Check className="w-3.5 h-3.5 shrink-0" />}
                  <span>{ctx.title}</span>
                  <span
                    className={`font-mono text-[10px] ${
                      isActive ? 'text-pust-100' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    · {ctx.scopeLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Band 2: 4 Calibrated Institutional KPI Stat Cards */}
      <dl className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
        {user.role === 'student' && studentSelf ? (
          <>
            {/* Card 1: PUST Maroon */}
            <div className="rounded-lg border border-pust-200 dark:border-pust-800/60 bg-[#FDF7F7] dark:bg-pust-950/35 p-4 sm:p-5 flex flex-col justify-between gap-3">
              <div className="flex items-start justify-between gap-2">
                <dt className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Cumulative CGPA
                </dt>
                <span className="w-9 h-9 rounded-md bg-pust-700 text-white flex items-center justify-center shrink-0">
                  <GraduationCap className="w-4 h-4" />
                </span>
              </div>
              <div>
                <dd className="font-mono text-2xl sm:text-[28px] font-bold text-pust-700 dark:text-pust-300 tabular-nums leading-none">
                  {studentSelf.cgpa.toFixed(2)}
                </dd>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-left">
                  {studentSelf.departmentCode} · 4.00 grading scale
                </p>
              </div>
            </div>

            {/* Card 2: Academic Lapis */}
            <div className="rounded-lg border border-cerulean-200 dark:border-cerulean-800/60 bg-[#F4F8FB] dark:bg-cerulean-950/35 p-4 sm:p-5 flex flex-col justify-between gap-3">
              <div className="flex items-start justify-between gap-2">
                <dt className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Current Semester
                </dt>
                <span className="w-9 h-9 rounded-md bg-lapis-600 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </span>
              </div>
              <div>
                <dd className="font-mono text-2xl sm:text-[28px] font-bold text-lapis-700 dark:text-cerulean-300 tabular-nums leading-none">
                  Sem {studentSelf.currentSemester}
                </dd>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 truncate text-left">
                  {studentSelf.hallName} · {studentSelf.seatNumber}
                </p>
              </div>
            </div>

            {/* Card 3: Heritage Gold / Amber */}
            <div className="rounded-lg border border-gold-200 dark:border-amber-800/60 bg-[#FCF9EE] dark:bg-amber-950/30 p-4 sm:p-5 flex flex-col justify-between gap-3">
              <div className="flex items-start justify-between gap-2">
                <dt className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Settled Payments
                </dt>
                <span className="w-9 h-9 rounded-md bg-amber-600 text-white flex items-center justify-center shrink-0">
                  <Receipt className="w-4 h-4" />
                </span>
              </div>
              <div>
                <dd className="font-mono text-2xl sm:text-[28px] font-bold text-amber-700 dark:text-amber-300 tabular-nums leading-none">
                  ৳{totalSettledBdt.toLocaleString('en-US')}
                </dd>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 tabular-nums text-left">
                  {receipts.length} verified payment receipt(s)
                </p>
              </div>
            </div>

            {/* Card 4: Botanical Emerald */}
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-[#F2F9F5] dark:bg-emerald-950/30 p-4 sm:p-5 flex flex-col justify-between gap-3">
              <div className="flex items-start justify-between gap-2">
                <dt className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Conduct Standing
                </dt>
                <span className="w-9 h-9 rounded-md bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <div>
                <dd className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400 leading-none truncate">
                  {studentSelf.disciplinaryStatus}
                </dd>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-left">
                  Proctor &amp; residential clearance status
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Card 1: PUST Maroon */}
            <div className="rounded-lg border border-pust-200 dark:border-pust-800/60 bg-[#FDF7F7] dark:bg-pust-950/35 p-4 sm:p-5 flex flex-col justify-between gap-3">
              <div className="flex items-start justify-between gap-2">
                <dt className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Visible Student Records
                </dt>
                <span className="w-9 h-9 rounded-md bg-pust-700 text-white flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </span>
              </div>
              <div>
                <dd className="font-mono text-2xl sm:text-[28px] font-bold text-pust-700 dark:text-pust-300 tabular-nums leading-none">
                  {loadingStudents ? '...' : studentsCount.toLocaleString('en-US')}
                </dd>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-left">
                  Scoped to {user.departmentCode} registry
                </p>
              </div>
            </div>

            {/* Card 2: Academic Lapis */}
            <div className="rounded-lg border border-cerulean-200 dark:border-cerulean-800/60 bg-[#F4F8FB] dark:bg-cerulean-950/35 p-4 sm:p-5 flex flex-col justify-between gap-3">
              <div className="flex items-start justify-between gap-2">
                <dt className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Targeted Circulars
                </dt>
                <span className="w-9 h-9 rounded-md bg-lapis-600 text-white flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4" />
                </span>
              </div>
              <div>
                <dd className="font-mono text-2xl sm:text-[28px] font-bold text-lapis-700 dark:text-cerulean-300 tabular-nums leading-none">
                  {targetedNotifications.length}
                </dd>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-left">
                  Central &amp; {user.departmentCode} notices
                </p>
              </div>
            </div>

            {/* Card 3: Heritage Gold / Amber */}
            <div className="rounded-lg border border-gold-200 dark:border-amber-800/60 bg-[#FCF9EE] dark:bg-amber-950/30 p-4 sm:p-5 flex flex-col justify-between gap-3">
              <div className="flex items-start justify-between gap-2">
                <dt className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Assigned Unit
                </dt>
                <span className="w-9 h-9 rounded-md bg-amber-600 text-white flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </span>
              </div>
              <div>
                <dd className="font-mono text-2xl sm:text-[28px] font-bold text-amber-700 dark:text-amber-300 leading-none truncate">
                  {user.officeCode || user.departmentCode}
                </dd>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 truncate text-left">
                  {user.designation || ROLE_LABELS[user.role]}
                </p>
              </div>
            </div>

            {/* Card 4: Botanical Emerald */}
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-[#F2F9F5] dark:bg-emerald-950/30 p-4 sm:p-5 flex flex-col justify-between gap-3">
              <div className="flex items-start justify-between gap-2">
                <dt className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Workspace Modules
                </dt>
                <span className="w-9 h-9 rounded-md bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <LayoutGrid className="w-4 h-4" />
                </span>
              </div>
              <div>
                <dd className="font-mono text-2xl sm:text-[28px] font-bold text-emerald-700 dark:text-emerald-400 tabular-nums leading-none">
                  {quickModules.length}
                </dd>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 tabular-nums text-left">
                  {bookmarks.length} saved bookmark(s)
                </p>
              </div>
            </div>
          </>
        )}
      </dl>

      {/* Band 3: Unified 4-Cell Operational Summary Strip */}
      <div className="rounded-lg border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-200 dark:divide-slate-800 overflow-hidden">
        {/* Cell 1 */}
        <div className="p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {user.role === 'student' ? 'Degree Term Progress' : 'Role Module Scope'}
            </span>
            <Calendar className="w-3.5 h-3.5 text-pust-700 dark:text-gold-300 shrink-0" />
          </div>
          <p className="font-mono text-base font-bold text-slate-900 dark:text-white tabular-nums">
            {user.role === 'student' ? (
              <>
                Sem {semesterNum}{' '}
                <span className="text-sm font-normal text-slate-400">/ 8</span>
              </>
            ) : (
              <>
                {portalTabs.length}{' '}
                <span className="text-sm font-normal text-slate-400">
                  / {VALID_PORTAL_TABS.length} active
                </span>
              </>
            )}
          </p>
          <div className="h-1.5 w-full rounded-full bg-stone-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-pust-700 dark:bg-pust-500 transition-all duration-300"
              style={{
                width: `${user.role === 'student' ? degreeProgressPct : moduleCoveragePct}%`,
              }}
            />
          </div>
        </div>

        {/* Cell 2 */}
        <div className="p-4 space-y-1.5">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Active Notices Feed
          </p>
          <p className="font-mono text-base font-bold text-amber-700 dark:text-amber-400 tabular-nums">
            {targetedNotifications.length}{' '}
            <span className="text-sm font-normal text-slate-400">circulars</span>
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 text-left">
            {targetedNotifications[0]?.publishedAt
              ? `Latest published ${targetedNotifications[0].publishedAt}`
              : 'Synced with central notice board'}
          </p>
        </div>

        {/* Cell 3 */}
        <div className="p-4 space-y-1.5">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {user.role === 'admin' || user.role === 'chairman'
              ? 'Faculty Profile Queue'
              : user.role === 'teacher'
              ? 'Directory Claim Status'
              : 'Receipts & Verification'}
          </p>
          <p className="font-mono text-base font-bold text-slate-900 dark:text-white tabular-nums">
            {user.role === 'admin' || user.role === 'chairman' ? (
              <>
                {pendingFacultyRequestsCount}{' '}
                <span className="text-sm font-normal text-slate-400">pending</span>
              </>
            ) : user.role === 'teacher' ? (
              <span
                className={
                  user.claimedFacultyMemberId
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-amber-700 dark:text-amber-400'
                }
              >
                {user.claimedFacultyMemberId ? 'Claimed' : 'Action Pending'}
              </span>
            ) : (
              <>
                {receipts.length}{' '}
                <span className="text-sm font-normal text-slate-400">receipts</span>
              </>
            )}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 text-left">
            {user.role === 'admin' || user.role === 'chairman'
              ? pendingFacultyRequestsCount > 0
                ? 'Awaiting verification in directory'
                : 'No profile approvals waiting'
              : user.role === 'teacher'
              ? user.claimedDepartmentCode || user.departmentCode
              : 'Digital ledger verified on portal'}
          </p>
        </div>

        {/* Cell 4 */}
        <div className="p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              Saved Bookmarks
            </span>
            <Bookmark className="w-3.5 h-3.5 text-gold-600 dark:text-gold-400 shrink-0" />
          </div>
          <p className="font-mono text-base font-bold text-slate-900 dark:text-white tabular-nums">
            {bookmarks.length}{' '}
            <span className="text-sm font-normal text-slate-400">/ 8 pinned</span>
          </p>
          <div className="h-1.5 w-full rounded-full bg-stone-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gold-500 dark:bg-gold-400 transition-all duration-300"
              style={{ width: `${Math.max(8, bookmarkRatioPct)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Band 4: Dual Operational Cards (Left: Actions & Quick Modules, Right: Circulars & Receipts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 items-start">
        {/* Left Operational Card */}
        <section
          aria-label="Workspace actions and modules"
          className="rounded-lg border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-stone-100 dark:border-slate-800 bg-[#FAF9F6]/60 dark:bg-slate-900 flex items-center justify-between gap-2">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Workspace Queue &amp; Modules
            </h3>
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {quickModules.length} available
            </span>
          </div>

          <div className="p-4 space-y-4">
            {/* Conditional Priority Queue Callout or Clean Empty Queue Notice */}
            {(user.role === 'admin' || user.role === 'chairman') &&
            pendingFacultyRequestsCount > 0 &&
            onReviewFacultyRequests ? (
              <div className="rounded-md border border-amber-300 dark:border-amber-700/70 bg-[#FCF9EE] dark:bg-amber-950/30 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <Clock className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-xs font-semibold text-amber-950 dark:text-amber-200">
                      {pendingFacultyRequestsCount} Faculty Profile Request
                      {pendingFacultyRequestsCount > 1 ? 's' : ''} Pending
                    </p>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300/90 text-left">
                      Review submitted profile updates or new faculty entries.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onReviewFacultyRequests}
                  className="h-8 inline-flex items-center gap-1.5 px-3 rounded-lg bg-pust-700 text-white text-xs font-semibold hover:bg-pust-800 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Review</span>
                </button>
              </div>
            ) : user.role === 'teacher' ? (
              <div className="rounded-md border border-dashed border-stone-300 dark:border-slate-700 bg-[#FAF9F6] dark:bg-slate-800/40 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {user.claimedFacultyMemberId
                      ? `Directory Profile Claimed (${user.claimedDepartmentCode || user.departmentCode})`
                      : `Claim Your ${user.departmentCode} Faculty Profile`}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 text-left">
                    {user.claimedFacultyMemberId
                      ? 'Submit public biography or research edits anytime.'
                      : 'Link your account to your department directory profile.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectTab('profile')}
                  className="h-8 inline-flex items-center gap-1.5 px-3 rounded-lg bg-pust-700 text-white text-xs font-semibold hover:bg-pust-800 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>{user.claimedFacultyMemberId ? 'Manage' : 'Claim'}</span>
                </button>
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-stone-200 dark:border-slate-700 bg-[#FAF9F6] dark:bg-slate-800/35 px-4 py-3 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No urgent approval queues are currently blocking your workspace.
                </p>
              </div>
            )}

            {/* Quick Launch List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {quickModules.slice(0, 6).map((mod) => {
                const Icon = mod.icon;
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => onSelectTab(mod.id)}
                    className="group text-left rounded-md border border-stone-200 dark:border-slate-800 bg-[#FAF9F6]/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:border-pust-600/60 dark:hover:border-pust-500/60 px-3.5 py-2.5 transition-colors cursor-pointer flex items-center justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-8 h-8 rounded-lg bg-pust-50 dark:bg-pust-950/60 border border-pust-200/70 dark:border-pust-800/60 text-pust-700 dark:text-gold-300 flex items-center justify-center shrink-0">
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {mod.label}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate text-left">
                          {mod.desc}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-pust-700 dark:group-hover:text-gold-300 shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Right Operational Card */}
        <section
          aria-label="Recent notices and portal records"
          className="rounded-lg border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
        >
          <div className="px-5 py-3.5 border-b border-stone-100 dark:border-slate-800 bg-[#FAF9F6]/60 dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                {rightPanelTab === 'notices'
                  ? 'Recent Circulars & Notices'
                  : receipts.length > 0
                  ? 'Payment Receipts'
                  : 'Saved Bookmarks'}
              </h3>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="inline-flex items-center p-0.5 rounded-lg bg-stone-100 dark:bg-slate-800 border border-stone-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setRightPanelTab('notices')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    rightPanelTab === 'notices'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Notices ({targetedNotifications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRightPanelTab('records')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    rightPanelTab === 'records'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {receipts.length > 0
                    ? `Receipts (${receipts.length})`
                    : `Bookmarks (${bookmarks.length})`}
                </button>
              </div>
              <span className="font-mono text-xs font-semibold text-pust-700 dark:text-gold-300 tabular-nums">
                {rightPanelTab === 'notices'
                  ? targetedNotifications.length
                  : receipts.length > 0
                  ? receipts.length
                  : bookmarks.length}
              </span>
            </div>
          </div>

          <div className="px-5 py-2">
            {rightPanelTab === 'notices' ? (
              targetedNotifications.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No recent circulars targeted to your unit.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100 dark:divide-slate-800">
                  {targetedNotifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => onOpenNotice(n)}
                      className="w-full py-3 flex items-center justify-between gap-4 text-left hover:bg-[#FAF9F6] dark:hover:bg-slate-800/50 -mx-2 px-2 rounded-lg transition-colors cursor-pointer"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {n.title}
                        </p>
                        <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums truncate">
                          {n.publishedAt} · {n.referenceNo} · {n.departmentCode}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-pust-700 dark:text-gold-300 whitespace-nowrap shrink-0">
                        View
                      </span>
                    </button>
                  ))}
                </div>
              )
            ) : receipts.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {receipts.slice(0, 5).map((r) => (
                  <div
                    key={r.id}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {r.title}
                      </p>
                      <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums truncate">
                        {r.receiptNo} · ৳{r.amountBdt.toLocaleString('en-US')} · {r.paidAt}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenReceipt(r)}
                      className="text-xs font-semibold text-pust-700 dark:text-pust-300 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Receipt
                    </button>
                  </div>
                ))}
              </div>
            ) : bookmarks.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No saved bookmarks yet. Bookmark notices or departments across the site for quick access.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {bookmarks.map((b) => (
                  <div
                    key={b.id}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {b.title}
                      </p>
                      <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {b.subtitle}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void onRemoveBookmark(b.itemId)}
                      aria-label="Remove bookmark"
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-red-600 hover:border-red-200 cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
