'use client';

import { ArrowRight, Bell, Bookmark, Receipt } from 'lucide-react';
import type {
  AuthUser,
  BookmarkRecord,
  NoticeRecord,
  PaymentReceiptRecord,
  StudentRecord,
} from '../../types/pust';
import {
  ROLE_LABELS,
  ROLE_SCOPE_SUMMARY,
  type PortalTab,
  type PortalTabDef,
} from './portalMeta';

interface PortalOverviewPanelProps {
  user: AuthUser;
  portalTabs: PortalTabDef[];
  studentSelf: StudentRecord | null;
  studentsCount: number;
  loadingStudents: boolean;
  receipts: PaymentReceiptRecord[];
  targetedNotifications: NoticeRecord[];
  bookmarks: BookmarkRecord[];
  onSelectTab: (tab: PortalTab) => void;
  onOpenReceipt: (receipt: PaymentReceiptRecord) => void;
  onNavigateVerify: () => void;
  onOpenNotice: (notice: NoticeRecord) => void;
  onRemoveBookmark: (itemId: string) => Promise<void>;
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
  onSelectTab,
  onOpenReceipt,
  onNavigateVerify,
  onOpenNotice,
  onRemoveBookmark,
}: PortalOverviewPanelProps) {
  const actionModules = portalTabs.filter((t) => t.id !== 'overview');

  return (
    <div className="space-y-6">
      {/* Unified 4-Cell Metric Bar (Hairline Divided, Single-Elevation Depth) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-200 bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="bg-gradient-to-br from-pust-950 via-pust-900 to-pust-800 text-white p-5 space-y-1">
          <p className="text-xs font-medium text-pust-200 text-left">Active Role Scope</p>
          <p className="font-serif text-xl font-medium text-white text-left">
            {ROLE_LABELS[user.role]}
          </p>
          <p className="font-mono text-xs text-pust-100/90 tabular-nums text-left">
            {user.departmentCode} · ID {user.academicId}
          </p>
        </div>

        {user.role === 'student' ? (
          <>
            <div className="p-5 space-y-1">
              <p className="text-xs font-medium text-slate-500 text-left">Academic Standing</p>
              <p className="font-serif text-2xl font-medium text-slate-900 tabular-nums text-left">
                {studentSelf ? `CGPA ${studentSelf.cgpa.toFixed(2)}` : 'Syncing...'}
              </p>
              <p className="font-mono text-xs text-slate-600 tabular-nums text-left">
                {studentSelf
                  ? `Sem ${studentSelf.currentSemester} · ${studentSelf.completedSemesters}/8 completed`
                  : 'Fetching academic record'}
              </p>
            </div>
            <div className="p-5 space-y-1">
              <p className="text-xs font-medium text-slate-500 text-left">
                Residential Hall &amp; Seat
              </p>
              <p className="font-serif text-xl font-medium text-slate-900 truncate text-left">
                {studentSelf?.hallName || user.hallAffiliation}
              </p>
              <p className="font-mono text-xs text-slate-600 tabular-nums truncate text-left">
                {studentSelf?.seatNumber || 'Seat pending verification'}
              </p>
            </div>
          </>
        ) : user.role === 'teacher' ? (
          <>
            <div className="p-5 space-y-1">
              <p className="text-xs font-medium text-slate-500 text-left">Assigned Courses</p>
              <p className="font-serif text-2xl font-medium text-slate-900 tabular-nums text-left">
                {(user.assignedCourses || []).length}
              </p>
              <p className="font-mono text-xs text-slate-600 truncate text-left">
                {(user.assignedCourses || []).join(', ') || 'Pending assignment'}
              </p>
            </div>
            <div className="p-5 space-y-1">
              <p className="text-xs font-medium text-slate-500 text-left">Department Students</p>
              <p className="font-serif text-2xl font-medium text-slate-900 tabular-nums text-left">
                {loadingStudents ? '...' : studentsCount}
              </p>
              <p className="text-xs text-slate-600 text-left">Scoped to {user.departmentCode}</p>
            </div>
          </>
        ) : (
          <>
            <div className="p-5 space-y-1">
              <p className="text-xs font-medium text-slate-500 text-left">Scoped Student Records</p>
              <p className="font-serif text-2xl font-medium text-slate-900 tabular-nums text-left">
                {loadingStudents ? '...' : studentsCount}
              </p>
              <p className="text-xs text-slate-600 text-left">
                {user.role === 'chairman'
                  ? `${user.departmentCode} Department`
                  : user.role === 'hall'
                  ? user.hallAffiliation
                  : 'University-wide scope'}
              </p>
            </div>
            <div className="p-5 space-y-1">
              <p className="text-xs font-medium text-slate-500 text-left">Targeted Bulletins</p>
              <p className="font-serif text-2xl font-medium text-slate-900 tabular-nums text-left">
                {targetedNotifications.length}
              </p>
              <p className="text-xs text-slate-600 text-left">Scoped to {user.departmentCode}</p>
            </div>
          </>
        )}

        <div className="p-5 space-y-1">
          <p className="text-xs font-medium text-slate-500 text-left">
            {user.role === 'student' ? 'Targeted Bulletins' : 'Workspace Modules'}
          </p>
          <p className="font-serif text-2xl font-medium text-slate-900 tabular-nums text-left">
            {user.role === 'student' ? targetedNotifications.length : actionModules.length}
          </p>
          <p className="font-mono text-xs text-slate-600 tabular-nums text-left">
            {user.role === 'student'
              ? `${receipts.length} receipt(s) · ${bookmarks.length} bookmarks`
              : `Authorized for ${user.role}`}
          </p>
        </div>
      </div>

      {/* Role Scope & Direct Module Action Matrix */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-pust-800 text-left">
              Authorized Office Workflows
            </p>
            <h2 className="font-serif text-xl font-medium text-slate-900 mt-0.5">
              {ROLE_LABELS[user.role]} Responsibilities &amp; Quick Launch
            </h2>
          </div>
          <span className="font-mono text-xs text-slate-500 tabular-nums">
            {actionModules.length} authorized modules
          </span>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed max-w-3xl text-left">
          {ROLE_SCOPE_SUMMARY[user.role]}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-stone-200 border border-stone-200 rounded-xl overflow-hidden">
          {actionModules.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className="text-left p-4 bg-white hover:bg-[#FAF9F6] transition-colors flex items-start justify-between gap-3 group cursor-pointer"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className="w-8 h-8 rounded-lg bg-[#FAF9F6] border border-stone-200 text-pust-800 group-hover:bg-pust-900 group-hover:text-white group-hover:border-pust-900 transition-colors flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-serif text-base font-medium text-slate-900 group-hover:text-pust-900 truncate text-left">
                      {tab.label}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5 truncate text-left">{tab.desc}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-pust-800 shrink-0 mt-1 transition-colors" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Verified Payment Receipts Ledger (Student & Admin) */}
      {(user.role === 'student' || user.role === 'admin') && receipts.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between gap-3 border-b border-stone-200">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-pust-800" />
              <h2 className="font-serif text-xl font-medium text-slate-900">
                Verified Digital Payment Receipts ({receipts.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={onNavigateVerify}
              className="inline-flex items-center gap-1 text-xs font-semibold text-pust-800 hover:underline cursor-pointer whitespace-nowrap"
            >
              <span>Verify on Public Registry</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-stone-200">
            {receipts.slice(0, 5).map((r) => (
              <div
                key={r.id}
                className="px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs hover:bg-[#FAF9F6] transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm text-slate-900 text-left">{r.title}</p>
                  <p className="font-mono text-slate-500 tabular-nums mt-0.5 text-left">
                    {r.receiptNo} · {r.gatewayName} ({r.transactionId}) · Paid{' '}
                    <span className="font-semibold text-pust-900">
                      BDT {r.amountBdt.toLocaleString('en-US')}
                    </span>{' '}
                    on {r.paidAt}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenReceipt(r)}
                  className="min-h-[34px] px-3 py-1.5 font-semibold rounded-lg border border-stone-300 bg-white text-slate-700 hover:border-pust-800 hover:text-pust-900 cursor-pointer whitespace-nowrap shrink-0"
                >
                  View Official Receipt
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Targeted Bulletins & Bookmarks Split */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-7 bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between gap-3 border-b border-stone-200">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-pust-800" />
              <h2 className="font-serif text-xl font-medium text-slate-900">
                Targeted Circulars &amp; Notices
              </h2>
            </div>
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              {targetedNotifications.length} active
            </span>
          </div>

          {targetedNotifications.length === 0 ? (
            <p className="p-6 text-sm text-slate-600 text-left">
              No targeted notices or alerts at this time.
            </p>
          ) : (
            <div className="divide-y divide-stone-200">
              {targetedNotifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => onOpenNotice(n)}
                  className="w-full text-left px-6 py-4 space-y-1 text-sm hover:bg-[#FAF9F6] transition-colors cursor-pointer"
                >
                  <p className="font-mono text-[11px] text-pust-800 tabular-nums text-left">
                    {n.publishedAt} · {n.category} · {n.departmentCode}
                    {n.targetSession ? ` · Session ${n.targetSession}` : ''}
                    {n.targetCourseCode ? ` · ${n.targetCourseCode}` : ''}
                  </p>
                  <p className="font-medium text-slate-900 text-left">{n.title}</p>
                  <p className="text-xs text-slate-600 text-left">{n.summary}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="xl:col-span-5 bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between gap-3 border-b border-stone-200">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-pust-800" />
              <h2 className="font-serif text-xl font-medium text-slate-900">
                Saved Bookmarks ({bookmarks.length})
              </h2>
            </div>
          </div>

          {bookmarks.length === 0 ? (
            <p className="p-6 text-sm text-slate-600 text-left">
              No saved bookmarks yet. Bookmark departments or circulars while browsing the public
              website.
            </p>
          ) : (
            <div className="divide-y divide-stone-200">
              {bookmarks.map((b) => (
                <div
                  key={b.id}
                  className="px-6 py-3.5 flex items-center justify-between gap-3 text-sm hover:bg-[#FAF9F6] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate text-left">{b.title}</p>
                    <p className="text-xs text-slate-500 truncate text-left">{b.subtitle}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveBookmark(b.itemId)}
                    className="text-xs font-medium text-red-700 hover:underline shrink-0 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {user.role === 'teacher' && (
            <div className="px-6 py-4 border-t border-stone-200 bg-[#FAF9F6] text-xs space-y-1.5">
              <p className="font-semibold text-pust-900 text-left">Chairman Course Assignment</p>
              <p className="font-mono text-slate-700 text-left">
                Courses: {(user.assignedCourses || []).join(', ') || 'Pending Chairman assignment'}
              </p>
              <p className="font-mono text-slate-700 text-left">
                Sessions:{' '}
                {(user.assignedSessions || []).join(', ') || 'Pending Chairman assignment'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
