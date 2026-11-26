'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Bookmark,
  Check,
  ExternalLink,
  FileDown,
  FileText,
  Pencil,
  Printer,
  Trash2,
  X,
} from 'lucide-react';
import { detectAttachmentType, isSafeMediaUrl } from '../lib/media';
import type { AuthUser, NoticeRecord } from '../types/pust';

interface NoticeModalProps {
  notice: NoticeRecord | null;
  onClose: () => void;
  user: AuthUser | null;
  isBookmarked: boolean;
  onToggleBookmark: (notice: NoticeRecord) => void;
  onDeleteNotice?: (id: string) => void;
  onOpenPortal: () => void;
  editMode?: boolean;
  onEditNotice?: (notice: NoticeRecord) => void;
}

export function NoticeModal({
  notice,
  onClose,
  user,
  isBookmarked,
  onToggleBookmark,
  onDeleteNotice,
  onOpenPortal,
  editMode = false,
  onEditNotice,
}: NoticeModalProps) {
  const [showInlinePdf, setShowInlinePdf] = useState(false);

  useEffect(() => {
    setShowInlinePdf(false);
  }, [notice?.id]);

  useEffect(() => {
    if (!notice) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [notice, onClose]);

  if (!notice) return null;

  const safeAttachmentUrl =
    notice.attachmentUrl && isSafeMediaUrl(notice.attachmentUrl) ? notice.attachmentUrl : null;
  const attachmentKind = detectAttachmentType(
    safeAttachmentUrl || notice.attachmentName || '',
    notice.attachmentType
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-[2px] p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notice-modal-title"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-6 px-6 py-5 border-b border-slate-200 bg-slate-50">
          <div>
            <p className="font-mono text-xs tracking-wider uppercase text-pust-800 tabular-nums">
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
            className="min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          <div className="text-xs text-slate-600 border-b border-slate-200 pb-3 flex flex-wrap items-center justify-between gap-2">
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
              className="inline-flex items-center gap-1.5 text-xs font-medium text-pust-800 hover:underline cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Circular
            </button>
          </div>

          <p className="text-[15px] font-medium text-slate-900 leading-relaxed text-left">
            {notice.summary}
          </p>
          <p className="text-[15px] text-slate-700 leading-relaxed whitespace-pre-line text-left">
            {notice.body}
          </p>

          {(notice.attachmentName || safeAttachmentUrl) && (
            <div className="rounded-xl border border-slate-200 bg-[#F7F7F5] p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-pust-800 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
                      Official Attachment{attachmentKind === 'pdf' ? ' (PDF)' : attachmentKind === 'image' ? ' (Image)' : ''}
                    </p>
                    <p className="text-xs font-mono font-medium text-slate-900 truncate">
                      {notice.attachmentName || 'Circular Document'}
                    </p>
                  </div>
                </div>
                {safeAttachmentUrl && (
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {attachmentKind === 'pdf' && (
                      <button
                        type="button"
                        onClick={() => setShowInlinePdf((prev) => !prev)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-300 bg-white text-slate-800 hover:border-pust-800 hover:text-pust-900 cursor-pointer whitespace-nowrap"
                      >
                        {showInlinePdf ? 'Hide Preview' : 'Preview PDF'}
                      </button>
                    )}
                    <a
                      href={safeAttachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-pust-900 text-white hover:bg-pust-950 whitespace-nowrap"
                    >
                      {attachmentKind === 'pdf' ? (
                        <>
                          <FileDown className="w-3.5 h-3.5" />
                          Open / Download PDF
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open Full File
                        </>
                      )}
                    </a>
                  </div>
                )}
              </div>

              {safeAttachmentUrl && attachmentKind === 'image' && (
                <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                  <img
                    src={safeAttachmentUrl}
                    alt={notice.attachmentName || notice.title}
                    referrerPolicy="no-referrer"
                    className="w-full max-h-96 object-contain"
                  />
                </div>
              )}

              {safeAttachmentUrl && attachmentKind === 'pdf' && showInlinePdf && (
                <iframe
                  src={safeAttachmentUrl}
                  title={notice.attachmentName || notice.title}
                  className="w-full h-96 rounded-lg border border-slate-200 bg-white"
                />
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 pt-5 border-t border-slate-200">
            <div className="flex items-center gap-3">
              {user ? (
                <button
                  type="button"
                  onClick={() => onToggleBookmark(notice)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-pust-800 text-pust-900 hover:bg-pust-900 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
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
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-slate-300 text-slate-700 hover:border-pust-800 hover:text-pust-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Bookmark className="w-4 h-4" />
                  Sign in to Save
                </button>
              )}

              {user?.role === 'admin' && editMode && onEditNotice && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEditNotice(notice);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold border border-amber-400 bg-amber-50 text-amber-950 hover:bg-amber-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                  Edit Circular
                </button>
              )}

              {user?.role === 'admin' && onDeleteNotice && (
                <button
                  type="button"
                  onClick={() => onDeleteNotice(notice.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium border border-red-300 text-red-700 hover:bg-red-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-pust-900 text-white hover:bg-pust-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Done Reading
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
