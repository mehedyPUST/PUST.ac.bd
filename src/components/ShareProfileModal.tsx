'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, Download, QrCode, X } from 'lucide-react';
import { getDepartmentPersonHref, type PersonRoleCategory } from '../lib/departmentPeople';
import type { DepartmentPersonRecord, DepartmentRecord } from '../types/pust';

interface ShareProfileModalProps {
  open: boolean;
  onClose: () => void;
  person: DepartmentPersonRecord;
  department: DepartmentRecord;
  roleCategory: PersonRoleCategory;
}

export function ShareProfileModal({
  open,
  onClose,
  person,
  department,
  roleCategory,
}: ShareProfileModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const relativePath = getDepartmentPersonHref(department.code, person.id);
  const fullUrl =
    typeof window !== 'undefined' ? `${window.location.origin}${relativePath}` : relativePath;

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked
    }
  }

  function handleDownloadVCard() {
    const primaryPhone = person.phones[0]?.value || '';
    const primaryEmail = person.emails[0]?.value || '';
    const vcf = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${person.name}`,
      `ORG:Pabna University of Science and Technology;Department of ${department.name}`,
      `TITLE:${person.designation}`,
      primaryPhone ? `TEL;TYPE=WORK,VOICE:${primaryPhone}` : '',
      primaryEmail ? `EMAIL;TYPE=INTERNET,WORK:${primaryEmail}` : '',
      `URL:${fullUrl}`,
      'END:VCARD',
    ]
      .filter(Boolean)
      .join('\r\n');

    const blob = new Blob([vcf], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${person.id || 'pust-contact'}.vcf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-profile-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl border border-stone-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-stone-200 bg-[#FAF9F6] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-pust-800" />
            <h2 id="share-profile-title" className="font-serif text-lg font-medium text-slate-950">
              Share Faculty / Staff Card
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close share dialog"
            className="p-1.5 rounded-lg text-slate-500 hover:bg-stone-200/70 hover:text-slate-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-4 rounded-xl border border-stone-200 bg-[#FAF9F6] space-y-1">
            <p className="font-mono text-[11px] uppercase tracking-wider text-pust-800 font-semibold">
              {department.code} · {roleCategory}
            </p>
            <p className="font-serif text-lg font-medium text-slate-950">{person.name}</p>
            <p className="text-xs text-slate-600">{person.designation}</p>
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">
              Official Profile URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={fullUrl}
                aria-label="Official profile URL"
                className="flex-1 px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-700"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-pust-900 text-white hover:bg-pust-950 cursor-pointer whitespace-nowrap shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-200">
            <button
              type="button"
              onClick={handleDownloadVCard}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-stone-300 bg-white text-slate-800 hover:border-pust-800 hover:text-pust-900 cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              Save Contact (.vcf)
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 hover:bg-slate-200 cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
