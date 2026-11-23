'use client';

import { motion } from 'motion/react';
import { Bookmark, Check, X } from 'lucide-react';
import type { AuthUser, DepartmentRecord } from '../types/pust';

interface DepartmentModalProps {
  department: DepartmentRecord | null;
  onClose: () => void;
  user: AuthUser | null;
  isBookmarked: boolean;
  onToggleBookmark: (dept: DepartmentRecord) => void;
  onOpenPortal: () => void;
}

export function DepartmentModal({
  department,
  onClose,
  user,
  isBookmarked,
  onToggleBookmark,
  onOpenPortal,
}: DepartmentModalProps) {
  if (!department) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-[2px] p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dept-modal-title"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        style={{ animationDuration: '220ms' }}
        className="w-full max-w-2xl bg-white border border-stone-200 shadow-2xl max-h-[90vh] overflow-y-auto animate__animated animate__fadeInUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 bg-gradient-to-r from-emerald-950 via-emerald-800 to-emerald-700" />
        <div className="flex items-start justify-between gap-6 px-6 py-5 border-b border-stone-200 bg-[#FAF8F4]">
          <div>
            <p className="font-mono text-xs tracking-wider uppercase text-emerald-800">
              {department.code} · {department.faculty}
            </p>
            <h3
              id="dept-modal-title"
              className="font-serif text-2xl font-medium text-slate-900 mt-1"
            >
              Department of {department.name}
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Chairman: <span className="font-medium text-slate-900">{department.chairmanName}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close department details"
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-[15px] leading-relaxed text-slate-700">{department.summary}</p>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-y border-stone-200 py-4 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wider text-slate-500">Established</dt>
              <dd className="font-mono tabular-nums text-slate-900 mt-0.5">
                {department.established}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-slate-500">Annual Intake</dt>
              <dd className="font-mono tabular-nums text-slate-900 mt-0.5">
                {department.intakeSeats} Undergraduate Seats
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-slate-500">Degree Programs</dt>
              <dd className="text-slate-900 mt-0.5">{department.degrees.join(' · ')}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-slate-500">Location</dt>
              <dd className="text-slate-900 mt-0.5">{department.building}, Rajapur Campus</dd>
            </div>
          </dl>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-2.5">
                Research Priorities
              </h4>
              <ul className="space-y-2 text-sm text-slate-800">
                {department.researchFocus.map((topic) => (
                  <li key={topic} className="pb-2 border-b border-stone-200/80 last:border-b-0">
                    {topic}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-emerald-800 mb-2.5">
                Academic Laboratories
              </h4>
              <ul className="space-y-2 text-sm text-slate-800">
                {department.laboratories.map((lab) => (
                  <li key={lab} className="pb-2 border-b border-stone-200/80 last:border-b-0">
                    {lab}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-stone-200">
            {user ? (
              <button
                type="button"
                onClick={() => onToggleBookmark(department)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-emerald-800 text-emerald-800 hover:bg-emerald-800 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isBookmarked ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                {isBookmarked ? 'Saved in Portal' : 'Bookmark Department'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPortal();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-stone-300 text-slate-700 hover:border-emerald-800 hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Bookmark className="w-4 h-4" />
                Sign in to Bookmark
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-sm font-medium bg-emerald-800 text-white hover:bg-emerald-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Close Prospectus
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
