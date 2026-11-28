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
  onDeleteNotice?: (id: string) => Promise<void> | void;
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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    setShowInlinePdf(false);
    setConfirmDelete(false);
    setDeleting(false);
    setDeleteError(null);
  }, [notice?.id]);

  useEffect(() => {
    if (!notice) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !deleting) onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [notice, deleting, onClose]);

  if (!notice) return null;

  async function handleConfirmDeleteClick() {
    if (!notice || !onDeleteNotice) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await onDeleteNotice(notice.id);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Unable to remove notice.');
    } finally {
      setDeleting(false);
    }
  }

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
      onClick={() => {
        if (!deleting) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl rounded-2xl bg-white border border-stone-200 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-6 px-6 py-5 border-b border-stone-200 bg-[#FAF9F6]">
          <div>
            <p className="font-mono text-xs tracking-wider uppercase text-pust-700 tabular-nums">
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
            disabled={deleting}
            onClick={onClose}
            aria-label="Close circular"
            className="min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-stone-200/70 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
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
            <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-pust-700 shrink-0" />
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
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-300 bg-white text-slate-800 hover:border-pust-700 hover:text-pust-800 cursor-pointer whitespace-nowrap"
                      >
                        {showInlinePdf ? 'Hide Preview' : 'Preview PDF'}
                      </button>
                    )}
                    <a
                      href={safeAttachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-pust-700 text-white hover:bg-pust-800 whitespace-nowrap"
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
                <div className="rounded-lg border border-stone-200 bg-white overflow-hidden">
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
                  className="w-full h-96 rounded-lg border border-stone-200 bg-white"
                />
              )}
            </div>
          )}

          {deleteError && (
            <div
              role="alert"
              className="px-3.5 py-2.5 rounded-xl border border-red-200 bg-red-50 text-xs font-medium text-red-900"
            >
              {deleteError}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 pt-5 border-t border-stone-200">
            <div className="flex flex-wrap items-center gap-3">
              {user ? (
                <button
                  type="button"
                  onClick={() => onToggleBookmark(notice)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-pust-700 text-pust-800 hover:bg-pust-700 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
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
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-stone-300 text-slate-700 hover:border-pust-700 hover:text-pust-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
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

              {onDeleteNotice &&
                user &&
                (user.role === 'admin' ||
                  user.role === 'registrar' ||
                  user.role === 'vc' ||
                  (user.role === 'chairman' &&
                    notice.departmentCode.toUpperCase() === user.departmentCode.toUpperCase())) && (
                confirmDelete ? (
                  <div className="inline-flex items-center gap-2">
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => void handleConfirmDeleteClick()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold bg-red-700 text-white hover:bg-red-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
                    >
                      <Trash2 className="w-4 h-4" />
                      {deleting ? 'Removing...' : 'Confirm Remove'}
                    </button>
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => {
                        setConfirmDelete(false);
                        setDeleteError(null);
                      }}
                      className="px-3 py-2 rounded-lg text-sm font-medium border border-stone-300 bg-white text-slate-700 hover:text-slate-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmDelete(true);
                      setDeleteError(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium border border-red-300 text-red-700 hover:bg-red-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                )
              )}
            </div>

            <button
              type="button"
              disabled={deleting}
              onClick={onClose}
              className="px-5 py-2 rounded-lg text-sm font-medium bg-pust-700 text-white hover:bg-pust-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
            >
              Done Reading
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
