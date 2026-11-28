'use client';

import {
  ArrowLeftRight,
  ArrowRight,
  Bookmark,
  Check,
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  LayoutDashboard,
  Receipt,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import type { RoleContextOption } from '../../lib/roleContext';
import type {
  AuthUser,
  BookmarkRecord,
  NoticeRecord,
  PaymentReceiptRecord,
  StudentRecord,
  UserRole,
} from '../../types/pust';
import { ROLE_LABELS, type PortalTab, type PortalTabItem } from './portalMeta';
import { AccountSecurityPasswordCard } from './AccountSecurityPasswordCard';

interface PortalProfilePanelProps {
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
  onUserChange?: (user: AuthUser) => void;
  onSelectTab: (tab: PortalTab) => void;
  onOpenReceipt: (receipt: PaymentReceiptRecord) => void;
  onNavigateVerify: () => void;
  onRemoveBookmark: (itemId: string) => Promise<void>;
  onViewDepartment?: (departmentCode: string) => void;
}

const ROLE_SCOPE_DESCRIPTIONS: Record<UserRole, string> = {
  student:
    'Manage your academic record, digital library card, residential hall allotment and dues, semester examination forms, fee receipts, and four-office graduation clearances.',
  teacher:
    'Review your departmental roster, manage assigned courses and marksheets, publish course circulars, and maintain your verified public faculty directory profile.',
  chairman:
    'Lead departmental approvals, issue student signup tokens, verify library and exam forms, oversee departmental notices, and grant Chairman clearances.',
  library:
    'Verify Chairman-sealed library applications, issue digital and physical library cards, track book loans, and clear graduating students.',
  hall:
    'Publish residential hall vacancy circulars, allot seats, reconcile hall dues, and sign Hall clearances for graduating residents.',
  proctor:
    'Review student conduct and disciplinary standing across departments and issue Proctorial clearances.',
  registrar:
    'Oversee university-wide student records, review inquiries, publish central circulars, and audit governance actions.',
  vc:
    'Monitor institutional student records, executive notices, examinations, and campus-wide governance audit logs.',
  dean:
    'Oversee faculty-level student academic standing, examination schedules, and inter-departmental requests across constituent departments.',
  advisor:
    'Guide student welfare, counselling requests, and advisory notices across assigned cohorts.',
  admin:
    'Full institutional oversight across user approvals, departmental tokens, payment gateways, public CMS content, examinations, and final certificate issuance.',
};

export function PortalProfilePanel({
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
  onUserChange,
  onSelectTab,
  onOpenReceipt,
  onNavigateVerify,
  onRemoveBookmark,
  onViewDepartment,
}: PortalProfilePanelProps) {
  const initials = user.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');

  const quickTabs = portalTabs.filter((t) => t.id !== 'profile' && t.id !== 'overview').slice(0, 4);
  const mustChangePassword = Boolean(user.mustChangePassword);

  return (
    <div className="space-y-6">
      {mustChangePassword && (
        <AccountSecurityPasswordCard user={user} onUserChange={onUserChange} />
      )}

      {/* Unified Identity & Institutional Credentials Card */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-stone-200 dark:border-slate-800 border-t-2 border-t-pust-700 overflow-hidden">
        <div className="bg-[#FAF9F6] dark:bg-slate-800/80 border-b border-stone-200 dark:border-slate-800 px-5 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-pust-800 dark:text-gold-300 uppercase tracking-wider">
              {ROLE_LABELS[user.role]}
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">ID {user.academicId}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={mustChangePassword}
              onClick={() => onSelectTab('overview')}
              className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-pust-700 dark:hover:border-gold-400 hover:text-pust-800 dark:hover:text-gold-300 transition-colors whitespace-nowrap cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>
            {onViewDepartment && user.departmentCode && !['ADMIN', 'REG', 'LIB', 'HALL', 'PROCTOR'].includes(user.departmentCode) && (
              <button
                type="button"
                onClick={() => onViewDepartment(user.departmentCode)}
                className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-pust-700 dark:hover:border-gold-400 hover:text-pust-800 dark:hover:text-gold-300 transition-colors whitespace-nowrap cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Dept Page</span>
              </button>
            )}
            <button
              type="button"
              onClick={onNavigateVerify}
              className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-pust-700 dark:hover:border-gold-400 hover:text-pust-800 dark:hover:text-gold-300 transition-colors whitespace-nowrap cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-pust-800 dark:text-gold-300" />
              <span>Verify Registry</span>
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-lg bg-pust-700 text-white font-serif text-xl font-semibold flex items-center justify-center shrink-0">
                {initials || 'PU'}
              </div>
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h2 className="font-serif text-2xl font-medium text-slate-950 dark:text-slate-100 leading-tight">
                    {user.name}
                  </h2>
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{user.approvalStatus.toUpperCase()}</span>
                  </span>
                </div>
                <p className="text-sm font-medium text-pust-800 dark:text-gold-300">
                  {user.designation || ROLE_LABELS[user.role]} · {user.officeName || user.departmentCode}
                </p>
                <p className="font-mono text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed prose-justify">
              {ROLE_SCOPE_DESCRIPTIONS[user.role]}
            </p>

            {roleContexts.length > 1 && onSwitchRole && (
              <div className="rounded-xl border border-stone-200 dark:border-slate-700 bg-[#FAF9F6] dark:bg-slate-800/80 p-3.5 space-y-2.5">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ArrowLeftRight className="w-3.5 h-3.5 text-pust-800 dark:text-gold-300" />
                  <span>Assigned Roles &amp; Appointments ({roleContexts.length})</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {roleContexts.map((ctx) => {
                    const isActive = ctx.key === activeRoleKey;
                    return (
                      <button
                        key={ctx.key}
                        type="button"
                        disabled={mustChangePassword || switchingRole || isActive}
                        onClick={() => onSwitchRole(ctx.key)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                          isActive
                            ? 'bg-pust-700 border-pust-700 text-white font-semibold cursor-default'
                            : 'bg-white dark:bg-slate-900 border-stone-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-pust-700 dark:hover:border-gold-400 hover:text-pust-800 dark:hover:text-gold-300 cursor-pointer disabled:opacity-50'
                        }`}
                      >
                        {isActive && <Check className="w-3.5 h-3.5 shrink-0" />}
                        <span>{ctx.title}</span>
                        <span
                          className={`font-mono text-[10px] ${
                            isActive ? 'text-pust-100' : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          ({ctx.scopeLabel})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <dl className="lg:col-span-5 rounded-xl border border-stone-200 dark:border-slate-700 bg-[#FAF9F6] dark:bg-slate-800/80 divide-y divide-stone-200 dark:divide-slate-700 text-xs">
            <div className="px-4 py-2.5 flex items-center justify-between gap-4">
              <dt className="font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 shrink-0">
                Academic / ID
              </dt>
              <dd className="font-mono font-semibold text-slate-950 dark:text-slate-100 tabular-nums text-right truncate">
                {user.academicId}
              </dd>
            </div>
            <div className="px-4 py-2.5 flex items-center justify-between gap-4">
              <dt className="font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 shrink-0">
                Unit / Dept
              </dt>
              <dd className="font-mono font-medium text-slate-900 dark:text-slate-100 text-right truncate">
                {user.officeCode || user.departmentCode}
              </dd>
            </div>
            <div className="px-4 py-2.5 flex items-center justify-between gap-4">
              <dt className="font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 shrink-0">
                Hall / Office
              </dt>
              <dd className="font-medium text-slate-900 dark:text-slate-100 text-right truncate">
                {studentSelf?.hallName || user.hallAffiliation || 'Academic Block'}
              </dd>
            </div>
            <div className="px-4 py-2.5 flex items-center justify-between gap-4">
              <dt className="font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 shrink-0">
                {user.role === 'student' ? 'Session' : 'Role Scope'}
              </dt>
              <dd className="font-mono text-slate-800 dark:text-slate-200 tabular-nums text-right truncate">
                {user.session ||
                  (user.assignedSessions && user.assignedSessions.length > 0
                    ? user.assignedSessions.join(', ')
                    : ROLE_LABELS[user.role])}
              </dd>
            </div>
            <div className="px-4 py-2.5 flex items-center justify-between gap-4">
              <dt className="font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 shrink-0">
                Account Created
              </dt>
              <dd className="font-mono text-slate-700 dark:text-slate-300 tabular-nums text-right truncate">
                {user.createdAt?.slice(0, 10) || 'Verified'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Uniform 4-Column Quantitative Standing Strip */}
      <dl className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {user.role === 'student' ? (
          <>
            <div className="rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 flex flex-col justify-between gap-1.5">
              <dt className="font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Academic ID &amp; Session
              </dt>
              <dd className="font-serif text-xl font-medium text-slate-950 dark:text-slate-100 tabular-nums">
                {studentSelf?.academicId || user.academicId}
              </dd>
              <dd className="font-mono text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                {user.departmentCode} · {studentSelf?.session || user.session || 'Active'}
              </dd>
            </div>
            <div className="rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 flex flex-col justify-between gap-1.5">
              <dt className="font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Cumulative Standing
              </dt>
              <dd className="font-serif text-2xl font-medium text-pust-800 dark:text-gold-300 tabular-nums">
                {studentSelf ? `CGPA ${studentSelf.cgpa.toFixed(2)}` : loadingStudents ? '...' : 'Syncing'}
              </dd>
              <dd className="text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                {studentSelf
                  ? `Semester ${studentSelf.currentSemester} (${studentSelf.completedSemesters}/8 completed)`
                  : 'Fetching academic record'}
              </dd>
            </div>
            <div className="rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 flex flex-col justify-between gap-1.5">
              <dt className="font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Hall &amp; Seat
              </dt>
              <dd className="font-serif text-xl font-medium text-slate-950 dark:text-slate-100 truncate">
                {studentSelf?.hallName || user.hallAffiliation}
              </dd>
              <dd className="font-mono text-xs text-slate-600 dark:text-slate-300 tabular-nums truncate">
                {studentSelf?.seatNumber || 'Seat pending verification'}
              </dd>
            </div>
            <div className="rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 flex flex-col justify-between gap-1.5">
              <dt className="font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Conduct &amp; Results
              </dt>
              <dd className="font-serif text-xl font-medium text-emerald-700 dark:text-emerald-400">
                {studentSelf?.disciplinaryStatus || 'Clear'}
              </dd>
              <dd className="text-xs text-slate-600 dark:text-slate-300 truncate">
                {studentSelf?.allResultsPublished ? 'All 8 results published' : 'Coursework in progress'}
              </dd>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 flex flex-col justify-between gap-1.5">
              <dt className="font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Assigned Unit
              </dt>
              <dd className="font-serif text-xl font-medium text-slate-950 dark:text-slate-100 truncate">
                {user.officeCode || user.departmentCode}
              </dd>
              <dd className="text-xs text-slate-600 dark:text-slate-300 truncate">
                {user.officeName || user.hallAffiliation || 'University Unit'}
              </dd>
            </div>
            <div className="rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 flex flex-col justify-between gap-1.5">
              <dt className="font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Visible Student Records
              </dt>
              <dd className="font-serif text-2xl font-medium text-pust-800 dark:text-gold-300 tabular-nums">
                {loadingStudents ? '...' : studentsCount}
              </dd>
              <dd className="text-xs text-slate-600 dark:text-slate-300 truncate">
                Authorized directory scope
              </dd>
            </div>
            <div className="rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 flex flex-col justify-between gap-1.5">
              <dt className="font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Targeted Circulars
              </dt>
              <dd className="font-serif text-2xl font-medium text-slate-950 dark:text-slate-100 tabular-nums">
                {targetedNotifications.length}
              </dd>
              <dd className="text-xs text-slate-600 dark:text-slate-300 truncate">Active notices in scope</dd>
            </div>
            <div className="rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 flex flex-col justify-between gap-1.5">
              <dt className="font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Saved Bookmarks
              </dt>
              <dd className="font-serif text-2xl font-medium text-slate-950 dark:text-slate-100 tabular-nums">
                {bookmarks.length}
              </dd>
              <dd className="text-xs text-slate-600 dark:text-slate-300 truncate">Pinned items across site</dd>
            </div>
          </>
        )}
      </dl>

      {/* Aligned 12-Column Details & Activity Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-7 space-y-6">
          {user.role === 'student' && studentSelf ? (
            <>
              <div className="bg-white dark:bg-slate-900 rounded-lg border border-stone-200 dark:border-slate-800 p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-stone-200 dark:border-slate-800 pb-3">
                  <h3 className="font-serif text-lg font-medium text-slate-950 dark:text-slate-100">
                    Academic &amp; Administrative Remarks
                  </h3>
                  <span className="font-mono text-xs text-slate-500 dark:text-slate-400">Official Ledger</span>
                </div>
                <dl className="divide-y divide-stone-200 dark:divide-slate-800 text-xs sm:text-sm">
                  <div className="py-3 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
                    <dt className="font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 sm:w-36 shrink-0 pt-0.5">
                      Chairman Note
                    </dt>
                    <dd className="text-slate-700 dark:text-slate-300 prose-justify flex-1">
                      {studentSelf.chairmanNotes || 'No remarks recorded.'}
                    </dd>
                  </div>
                  <div className="py-3 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
                    <dt className="font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 sm:w-36 shrink-0 pt-0.5">
                      Admin Office
                    </dt>
                    <dd className="text-slate-700 dark:text-slate-300 prose-justify flex-1">
                      {studentSelf.adminNotes || 'No remarks recorded.'}
                    </dd>
                  </div>
                  <div className="py-3 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
                    <dt className="font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 sm:w-36 shrink-0 pt-0.5">
                      Proctor Note
                    </dt>
                    <dd className="text-slate-700 dark:text-slate-300 prose-justify flex-1">
                      {studentSelf.disciplinaryNotes || 'Clear standing.'}
                    </dd>
                  </div>
                  <div className="py-3 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                    <dt className="font-mono text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 sm:w-36 shrink-0">
                      Phone Contact
                    </dt>
                    <dd className="font-mono text-xs text-slate-800 dark:text-slate-200 tabular-nums">
                      {studentSelf.phone || 'On institutional file'}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-lg border border-stone-200 dark:border-slate-800 p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-stone-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-pust-800 dark:text-gold-300" />
                    <h3 className="font-serif text-lg font-medium text-slate-950 dark:text-slate-100">
                      Verified Admission Documents
                    </h3>
                  </div>
                  <span className="font-mono text-xs text-pust-800 dark:text-gold-300">Verified Packet</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {studentSelf.admissionDocuments.length > 0
                    ? studentSelf.admissionDocuments.join(' · ')
                    : 'Admission packet verified on file.'}
                </p>
                {studentSelf.digitalDocuments && studentSelf.digitalDocuments.length > 0 && (
                  <div className="rounded-xl border border-stone-200 dark:border-slate-700 divide-y divide-stone-200 dark:divide-slate-700 overflow-hidden">
                    {studentSelf.digitalDocuments.map((dd, i) => (
                      <div
                        key={`${dd.fileName}-${i}`}
                        className="px-4 py-2.5 bg-[#FAF9F6] dark:bg-slate-800/80 text-xs font-mono text-slate-700 dark:text-slate-300 flex flex-wrap items-center justify-between gap-2"
                      >
                        <span className="font-medium text-slate-900 dark:text-slate-100 truncate min-w-0">
                          {dd.fileName}
                        </span>
                        <span className="text-pust-800 dark:text-gold-300 tabular-nums shrink-0">
                          {dd.sizeLabel} · {dd.verifiedHash}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-stone-200 dark:border-slate-800 p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-stone-200 dark:border-slate-800 pb-3">
                <h3 className="font-serif text-lg font-medium text-slate-950 dark:text-slate-100">
                  Authorized Modules &amp; Quick Navigation
                </h3>
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  {portalTabs.length} tabs
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {quickTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      disabled={mustChangePassword}
                      onClick={() => onSelectTab(tab.id)}
                      className="h-full text-left p-4 rounded-xl border border-stone-200 dark:border-slate-700 bg-[#FAF9F6] dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 hover:border-pust-700 dark:hover:border-gold-400 transition-colors flex items-center justify-between gap-3 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 text-pust-800 dark:text-gold-300 group-hover:bg-pust-700 group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-serif text-sm font-medium text-slate-950 dark:text-slate-100 truncate">
                            {tab.label}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-300 truncate mt-0.5">
                            {mustChangePassword ? 'Unlock after password update' : tab.desc}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-pust-800 dark:group-hover:text-gold-300 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Rail: Saved Bookmarks & Digital Receipts */}
        <div className="xl:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-stone-200 dark:border-slate-800 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-stone-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-pust-800 dark:text-gold-300" />
                <h3 className="font-serif text-lg font-medium text-slate-950 dark:text-slate-100">
                  Saved Bookmarks
                </h3>
              </div>
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {bookmarks.length}
              </span>
            </div>

            {bookmarks.length === 0 ? (
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                No saved bookmarks yet. Bookmark departments or notices across the website for quick access.
              </p>
            ) : (
              <div className="rounded-xl border border-stone-200 dark:border-slate-800 divide-y divide-stone-200 dark:divide-slate-800 overflow-hidden text-xs">
                {bookmarks.map((b) => (
                  <div
                    key={b.id}
                    className="px-3.5 py-3 flex items-center justify-between gap-3 bg-white dark:bg-slate-900 hover:bg-[#FAF9F6] dark:hover:bg-slate-800/80"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{b.title}</p>
                      <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {b.subtitle}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void onRemoveBookmark(b.itemId)}
                      aria-label="Remove bookmark"
                      className="p-1.5 rounded-lg border border-stone-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-red-700 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {(user.role === 'student' || user.role === 'admin') && receipts.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-stone-200 dark:border-slate-800 p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-stone-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-pust-800 dark:text-gold-300" />
                  <h3 className="font-serif text-lg font-medium text-slate-950 dark:text-slate-100">
                    Recent Payment Receipts
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={onNavigateVerify}
                  className="text-xs font-medium text-pust-800 dark:text-gold-300 hover:underline cursor-pointer"
                >
                  Verify →
                </button>
              </div>
              <div className="rounded-xl border border-stone-200 dark:border-slate-800 divide-y divide-stone-200 dark:divide-slate-800 overflow-hidden text-xs">
                {receipts.slice(0, 4).map((r) => (
                  <div
                    key={r.id}
                    className="px-3.5 py-3 flex items-center justify-between gap-3 bg-white dark:bg-slate-900 hover:bg-[#FAF9F6] dark:hover:bg-slate-800/80"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{r.title}</p>
                      <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums truncate mt-0.5">
                        {r.receiptNo} · BDT {r.amountBdt.toLocaleString('en-US')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenReceipt(r)}
                      className="h-8 px-2.5 rounded-lg border border-stone-300 dark:border-slate-700 bg-[#FAF9F6] dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:border-pust-700 dark:hover:border-gold-400 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      Receipt
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {!mustChangePassword && (
        <AccountSecurityPasswordCard user={user} onUserChange={onUserChange} />
      )}
    </div>
  );
}
