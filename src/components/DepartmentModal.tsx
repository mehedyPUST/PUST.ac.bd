'use client';

import { useEffect } from 'react';
import { motion } from 'motion/react';
import { Bookmark, Check, Pencil, X } from 'lucide-react';
import type { AuthUser, DepartmentRecord } from '../types/pust';

interface DepartmentModalProps {
  department: DepartmentRecord | null;
  onClose: () => void;
  user: AuthUser | null;
  isBookmarked: boolean;
  onToggleBookmark: (dept: DepartmentRecord) => void;
  onOpenPortal: () => void;
  editMode?: boolean;
  onEditDepartment?: (dept: DepartmentRecord) => void;
}

export function DepartmentModal({
  department,
  onClose,
  user,
  isBookmarked,
  onToggleBookmark,
  onOpenPortal,
  editMode = false,
  onEditDepartment,
}: DepartmentModalProps) {
  useEffect(() => {
    if (!department) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [department, onClose]);

  if (!department) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dept-modal-title"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-2xl rounded-2xl bg-white border border-stone-200 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-4 sm:px-6 py-4 sm:py-5 border-b border-stone-200 bg-[#FAF9F6]">
          <div>
            <p className="font-mono text-xs tracking-wider uppercase text-pust-800">
              {department.code} · {department.faculty}
            </p>
            <h3
              id="dept-modal-title"
              className="font-serif text-xl sm:text-2xl font-medium text-slate-900 mt-1"
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
            className="min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          <p className="text-[15px] leading-relaxed text-slate-700">{department.summary}</p>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-[#FAF9F6] border border-stone-200 p-4 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wider text-slate-500">Established &amp; Dept Code</dt>
              <dd className="font-mono tabular-nums text-slate-900 mt-0.5 font-medium">
                {department.established}
                {department.officialCode ? ` · Code ${department.officialCode}` : ''}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-slate-500">Teachers &amp; Annual Intake</dt>
              <dd className="font-mono tabular-nums text-slate-900 mt-0.5 font-medium">
                {department.facultyCount ? `${department.facultyCount} Teachers · ` : ''}
                {department.intakeSeats} Undergraduate Seats
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-slate-500">Degree Programs</dt>
              <dd className="text-slate-900 mt-0.5 font-medium">{department.degrees.join(' · ')}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-slate-500">
                {department.researchTotal !== undefined ? 'Campus Wing & Research Index' : 'Location'}
              </dt>
              <dd className="text-slate-900 mt-0.5 font-medium">
                {department.building}, Rajapur Campus
                {department.researchTotal !== undefined && (
                  <span className="block font-mono text-xs text-pust-800 mt-0.5 tabular-nums">
                    {department.researchTotal.toLocaleString('en-US')} Indexed Works
                  </span>
                )}
              </dd>
            </div>
          </dl>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-pust-800 mb-2.5">
                Research Priorities
              </h4>
              <ul className="space-y-2 text-sm text-slate-800 prose-justify">
                {department.researchFocus.map((topic) => (
                  <li key={topic} className="pb-2 border-b border-slate-100 last:border-b-0 leading-relaxed">
                    {topic}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-pust-800 mb-2.5">
                Academic Laboratories
              </h4>
              <ul className="space-y-2 text-sm text-slate-800 prose-justify">
                {department.laboratories.map((lab) => (
                  <li key={lab} className="pb-2 border-b border-slate-100 last:border-b-0 leading-relaxed">
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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-pust-700 text-pust-800 hover:bg-pust-700 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-stone-300 text-slate-700 hover:border-pust-700 hover:text-pust-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Bookmark className="w-4 h-4" />
                Sign in to Bookmark
              </button>
            )}

            <div className="flex flex-wrap items-center gap-2.5">
              {user?.role === 'admin' && editMode && onEditDepartment && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEditDepartment(department);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border border-amber-400 bg-amber-50 text-amber-950 hover:bg-amber-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                  Edit Department
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-lg text-sm font-medium bg-pust-700 text-white hover:bg-pust-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Close Prospectus
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
