'use client';

import { motion } from 'motion/react';
import { Bookmark, Check, Printer, Trash2, X } from 'lucide-react';
import type { AuthUser, NoticeRecord } from '../types/pust';

interface NoticeModalProps {
  notice: NoticeRecord | null;
  onClose: () => void;
  user: AuthUser | null;
  isBookmarked: boolean;
  onToggleBookmark: (notice: NoticeRecord) => void;
  onDeleteNotice?: (id: string) => void;
  onOpenPortal: () => void;
}

export function NoticeModal({
  notice,
  onClose,
  user,
  isBookmarked,
  onToggleBookmark,
  onDeleteNotice,
  onOpenPortal,
}: NoticeModalProps) {
  if (!notice) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-[2px] p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notice-modal-title"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="w-full max-w-2xl bg-white border border-stone-200 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-6 px-6 py-5 border-b border-stone-200 bg-[#FAF8F4]">
          <div>
            <p className="font-mono text-xs tracking-wider uppercase text-emerald-800 tabular-nums">
              {notice.referenceNo} · {notice.category} · {notice.publishedAt}
            </p>
            <h3
              id="notice-modal-title"
              className="font-serif text-2xl font-medium text-slate-900 mt-1.5 leading-snug"
            >
              {notice.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close circular"
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="text-xs text-slate-600 border-b border-stone-200 pb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              Issued by:{' '}
              <span className="font-medium text-slate-900">
                {notice.authorName || notice.departmentCode}
              </span>
              <span className="mx-2" aria-hidden="true">
                ·
              </span>
              Unit: <span className="font-mono">{notice.departmentCode}</span>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 hover:underline cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Circular
            </button>
          </div>

          <p className="text-[15px] font-medium text-slate-900 leading-relaxed">{notice.summary}</p>
          <p className="text-[15px] text-slate-700 leading-relaxed whitespace-pre-line">
            {notice.body}
          </p>
          {notice.attachmentName && (
            <div className="border border-stone-200 bg-[#FAF8F4] px-4 py-2.5 text-xs font-mono text-slate-700">
              Official Attachment: {notice.attachmentName}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 pt-5 border-t border-stone-200">
            <div className="flex items-center gap-3">
              {user ? (
                <button
                  type="button"
                  onClick={() => onToggleBookmark(notice)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-emerald-800 text-emerald-800 hover:bg-emerald-800 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {isBookmarked ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                  {isBookmarked ? 'Saved' : 'Save Circular'}
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
                  Sign in to Save
                </button>
              )}

              {user?.role === 'admin' && onDeleteNotice && (
                <button
                  type="button"
                  onClick={() => onDeleteNotice(notice.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium border border-red-300 text-red-700 hover:bg-red-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-sm font-medium bg-emerald-800 text-white hover:bg-emerald-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Done Reading
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
