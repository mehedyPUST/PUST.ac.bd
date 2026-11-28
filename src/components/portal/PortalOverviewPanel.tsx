'use client';

import {
  ArrowRight,
  Bell,
  Bookmark,
  Receipt,
  ShieldCheck,
  ShieldPlus,
  Trash2,
} from 'lucide-react';
import type {
  AuthUser,
  BookmarkRecord,
  NoticeRecord,
  PaymentReceiptRecord,
  StudentRecord,
} from '../../types/pust';
import { ROLE_LABELS, type PortalTab, type PortalTabItem } from './portalMeta';

interface PortalOverviewPanelProps {
  user: AuthUser;
  portalTabs: PortalTabItem[];
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
  onAddCoAdmin?: () => void;
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
  onAddCoAdmin,
}: PortalOverviewPanelProps) {
  const quickModules = portalTabs.filter((t) => t.id !== 'overview');

  return (
    <div className="space-y-6">
      {/* KPI / Identity Strip */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-4">
          <div className="space-y-1">
            <p className="font-mono text-[11px] uppercase tracking-wider text-pust-800 font-semibold">
              {ROLE_LABELS[user.role]}
            </p>
            <h2 className="font-serif text-2xl font-medium text-slate-950">
              Welcome, {user.name}
            </h2>
            <p className="text-xs text-slate-600">
              {user.officeName || user.departmentCode} · Academic / Employee ID{' '}
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                {user.academicId}
              </span>
              {user.designation ? ` · ${user.designation}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {user.role === 'admin' && onAddCoAdmin && (
              <button
                type="button"
                onClick={onAddCoAdmin}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-pust-900 text-xs font-semibold text-white hover:bg-pust-950 cursor-pointer whitespace-nowrap shrink-0"
              >
                <ShieldPlus className="w-4 h-4" />
                <span>Add Co-Admin</span>
              </button>
            )}
            <button
              type="button"
              onClick={onNavigateVerify}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-xs font-semibold text-slate-800 hover:border-pust-800 hover:text-pust-900 cursor-pointer whitespace-nowrap shrink-0"
            >
              <ShieldCheck className="w-4 h-4 text-pust-800" />
              <span>Verify Documents</span>
            </button>
          </div>
        </div>

        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {user.role === 'student' && studentSelf ? (
            <>
              <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] px-4 py-3">
                <dt className="text-[11px] text-slate-600">Current Semester</dt>
                <dd className="font-mono text-xl font-semibold text-slate-950 tabular-nums mt-0.5">
                  Semester {studentSelf.currentSemester}
                </dd>
              </div>
              <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] px-4 py-3">
                <dt className="text-[11px] text-slate-600">Cumulative CGPA</dt>
                <dd className="font-mono text-xl font-semibold text-pust-900 tabular-nums mt-0.5">
                  {studentSelf.cgpa.toFixed(2)}
                </dd>
              </div>
              <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] px-4 py-3">
                <dt className="text-[11px] text-slate-600">Hall &amp; Seat</dt>
                <dd className="text-sm font-semibold text-slate-950 mt-1 truncate">
                  {studentSelf.hallName} · {studentSelf.seatNumber}
                </dd>
              </div>
              <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] px-4 py-3">
                <dt className="text-[11px] text-slate-600">Conduct Status</dt>
                <dd className="text-sm font-semibold text-emerald-700 mt-1">
                  {studentSelf.disciplinaryStatus}
                </dd>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] px-4 py-3">
                <dt className="text-[11px] text-slate-600">Assigned Unit</dt>
                <dd className="font-mono text-lg font-semibold text-slate-950 mt-0.5 truncate">
                  {user.officeCode || user.departmentCode}
                </dd>
              </div>
              <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] px-4 py-3">
                <dt className="text-[11px] text-slate-600">Visible Student Records</dt>
                <dd className="font-mono text-xl font-semibold text-pust-900 tabular-nums mt-0.5">
                  {loadingStudents ? '...' : studentsCount}
                </dd>
              </div>
              <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] px-4 py-3">
                <dt className="text-[11px] text-slate-600">Targeted Circulars</dt>
                <dd className="font-mono text-xl font-semibold text-slate-950 tabular-nums mt-0.5">
                  {targetedNotifications.length}
                </dd>
              </div>
              <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] px-4 py-3">
                <dt className="text-[11px] text-slate-600">Saved Bookmarks</dt>
                <dd className="font-mono text-xl font-semibold text-slate-950 tabular-nums mt-0.5">
                  {bookmarks.length}
                </dd>
              </div>
            </>
          )}
        </dl>
      </div>

      {/* Quick Module Launch Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickModules.map((mod, idx) => {
          const Icon = mod.icon;
          return (
            <button
              key={mod.id}
              type="button"
              onClick={() => onSelectTab(mod.id)}
              className={`text-left rounded-2xl border border-stone-200 p-5 transition-colors hover:border-pust-800 cursor-pointer flex flex-col justify-between gap-3 ${
                idx % 2 === 0 ? 'bg-white' : 'bg-[#FAF9F6]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="p-2 rounded-xl bg-pust-50 text-pust-900">
                  <Icon className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <h3 className="font-serif text-base font-medium text-slate-950">{mod.label}</h3>
                <p className="text-xs text-slate-600 mt-0.5">{mod.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Targeted Notifications & Receipts/Bookmarks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-stone-200 pb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-pust-800" />
              <h3 className="font-serif text-lg font-medium text-slate-950">
                Recent Circulars &amp; Notices
              </h3>
            </div>
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              {targetedNotifications.length}
            </span>
          </div>

          {targetedNotifications.length === 0 ? (
            <p className="text-xs text-slate-600">No recent circulars targeted to your unit.</p>
          ) : (
            <div className="divide-y divide-stone-200">
              {targetedNotifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => onOpenNotice(n)}
                  className="w-full text-left py-3 hover:bg-[#FAF9F6] px-2 -mx-2 rounded-lg transition-colors cursor-pointer space-y-0.5"
                >
                  <p className="font-mono text-[11px] text-pust-800 tabular-nums">
                    {n.publishedAt} · {n.referenceNo} · {n.departmentCode}
                  </p>
                  <p className="text-sm font-medium text-slate-900 line-clamp-1">{n.title}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-stone-200 pb-3">
            <div className="flex items-center gap-2">
              {receipts.length > 0 ? (
                <Receipt className="w-4 h-4 text-pust-800" />
              ) : (
                <Bookmark className="w-4 h-4 text-pust-800" />
              )}
              <h3 className="font-serif text-lg font-medium text-slate-950">
                {receipts.length > 0 ? 'Recent Digital Payment Receipts' : 'Saved Portal Bookmarks'}
              </h3>
            </div>
          </div>

          {receipts.length > 0 ? (
            <div className="divide-y divide-stone-200 text-xs">
              {receipts.slice(0, 5).map((r) => (
                <div
                  key={r.id}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{r.title}</p>
                    <p className="font-mono text-[11px] text-slate-500 tabular-nums">
                      {r.receiptNo} · BDT {r.amountBdt.toLocaleString('en-US')} · {r.paidAt}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenReceipt(r)}
                    className="px-2.5 py-1.5 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-800 hover:border-pust-800 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Receipt
                  </button>
                </div>
              ))}
            </div>
          ) : bookmarks.length === 0 ? (
            <p className="text-xs text-slate-600">
              No saved bookmarks yet. Bookmark notices or departments across the website for quick access.
            </p>
          ) : (
            <div className="divide-y divide-stone-200 text-xs">
              {bookmarks.map((b) => (
                <div
                  key={b.id}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{b.title}</p>
                    <p className="font-mono text-[11px] text-slate-500 truncate">{b.subtitle}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void onRemoveBookmark(b.itemId)}
                    aria-label="Remove bookmark"
                    className="p-1.5 rounded-lg border border-stone-200 text-slate-500 hover:text-red-700 hover:border-red-200 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
