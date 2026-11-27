'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import QRCode from 'qrcode';
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Link2,
  Mail,
  MapPin,
  Phone,
  QrCode,
  Share2,
  UserPlus,
  X,
} from 'lucide-react';
import { getDepartmentPersonHref, getInitials, type PersonRoleCategory } from '../lib/departmentPeople';
import { buildPersonVCard, downloadPersonVCard, getVCardFilename } from '../lib/vcard';
import type { DepartmentPersonRecord, DepartmentRecord } from '../types/pust';

export type ShareQrMode = 'profile' | 'vcard';

interface ShareProfileModalProps {
  open: boolean;
  onClose: () => void;
  person: DepartmentPersonRecord;
  department: Pick<DepartmentRecord, 'code' | 'name' | 'building' | 'contactEmail' | 'contactPhone'>;
  roleCategory?: PersonRoleCategory;
}

export function ShareProfileModal({
  open,
  onClose,
  person,
  department,
  roleCategory = 'Faculty Member',
}: ShareProfileModalProps) {
  const [qrMode, setQrMode] = useState<ShareQrMode>('profile');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrError, setQrError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [savedVCard, setSavedVCard] = useState(false);
  const [nativeShareSupported, setNativeShareSupported] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
      setNativeShareSupported(typeof navigator.share === 'function');
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setCopiedLink(false);
    setSavedVCard(false);
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const relativeProfileHref = useMemo(
    () => getDepartmentPersonHref(department.code, person.id),
    [department.code, person.id]
  );

  const profileUrl = origin ? `${origin}${relativeProfileHref}` : relativeProfileHref;

  const compactVCardPayload = useMemo(
    () =>
      buildPersonVCard({
        person,
        department,
        profileUrl,
        compact: true,
      }),
    [person, department, profileUrl]
  );

  const qrPayload = qrMode === 'profile' ? profileUrl : compactVCardPayload;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setQrError(null);

    QRCode.toDataURL(qrPayload, {
      width: 560,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#450305',
        light: '#FFFFFF',
      },
    })
      .then((dataUrl) => {
        if (!cancelled) {
          setQrDataUrl(dataUrl);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQrError('Unable to generate QR code for this profile.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, qrPayload]);

  if (!open) return null;

  const officeLocation = person.officeLocation?.trim() || `${department.building}, Rajapur Campus`;

  async function handleCopyLink() {
    let ok = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(profileUrl);
        ok = true;
      }
    } catch {
      ok = false;
    }
    if (!ok) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = profileUrl;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        ok = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {
        ok = false;
      }
    }
    if (!ok) return;
    setCopiedLink(true);
    window.setTimeout(() => setCopiedLink(false), 2000);
  }

  function handleSaveVCard() {
    downloadPersonVCard({
      person,
      department,
      profileUrl,
    });
    setSavedVCard(true);
    window.setTimeout(() => setSavedVCard(false), 2200);
  }

  function handleDownloadQrImage() {
    if (!qrDataUrl) return;
    const baseName = getVCardFilename(person.name, department.code).replace(/\.vcf$/, '');
    const suffix = qrMode === 'profile' ? 'profile-qr' : 'contact-qr';
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `${baseName}-${suffix}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function handleNativeShare() {
    if (typeof navigator.share !== 'function') return;
    try {
      await navigator.share({
        title: `${person.name} — PUST ${department.code}`,
        text: `${person.name}, ${person.designation}, Department of ${department.name}, Pabna University of Science and Technology`,
        url: profileUrl,
      });
    } catch {
      // User dismissed share sheet
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-[2px] p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-profile-modal-title"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-xl rounded-2xl bg-white border border-stone-200 shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-5 sm:px-6 py-4 border-b border-stone-200 bg-[#FAF9F6]">
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-widest text-pust-800 font-semibold flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 shrink-0" />
              Share Faculty Profile · {department.code}
            </p>
            <h2
              id="share-profile-modal-title"
              className="font-serif text-xl sm:text-2xl font-medium text-slate-950 mt-1 leading-snug truncate"
            >
              {person.name}
            </h2>
            <p className="text-xs text-slate-600 truncate">
              {person.designation} · {roleCategory}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close share dialog"
            className="min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-stone-200/70 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* QR Mode Toggle */}
          <div
            role="tablist"
            aria-label="QR code format"
            className="grid grid-cols-2 gap-1.5 p-1 rounded-xl border border-stone-200 bg-[#FAF9F6]"
          >
            <button
              type="button"
              role="tab"
              aria-selected={qrMode === 'profile'}
              onClick={() => setQrMode('profile')}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                qrMode === 'profile'
                  ? 'bg-pust-900 text-white shadow-xs'
                  : 'text-slate-700 hover:text-pust-900 hover:bg-white'
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              Profile Page QR
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={qrMode === 'vcard'}
              onClick={() => setQrMode('vcard')}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                qrMode === 'vcard'
                  ? 'bg-pust-900 text-white shadow-xs'
                  : 'text-slate-700 hover:text-pust-900 hover:bg-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 shrink-0" />
              Save Contact QR
            </button>
          </div>

          {/* QR Code Frame */}
          <div className="rounded-2xl border border-stone-200 bg-[#FAF8F4] p-5 flex flex-col items-center text-center gap-4">
            <div className="rounded-xl border border-stone-200 bg-white p-3.5 shadow-xs">
              {qrError ? (
                <div className="w-48 h-48 flex items-center justify-center text-xs text-red-700 px-3">
                  {qrError}
                </div>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={
                    qrMode === 'profile'
                      ? `QR code linking to ${person.name} profile page`
                      : `vCard contact QR code for ${person.name}`
                  }
                  className="w-48 h-48 sm:w-52 sm:h-52 object-contain block"
                />
              ) : (
                <div
                  className="w-48 h-48 sm:w-52 sm:h-52 flex items-center justify-center bg-stone-100 rounded-lg text-xs font-mono text-slate-500"
                  aria-label="Generating QR code"
                >
                  {getInitials(person.name)} · Generating QR...
                </div>
              )}
            </div>

            <div className="space-y-1 max-w-md">
              <p className="text-xs font-semibold text-slate-900">
                {qrMode === 'profile'
                  ? 'Scan to open official PUST faculty profile page'
                  : 'Scan with phone camera to save directly to Contacts'}
              </p>
              <p className="font-mono text-[11px] text-slate-600 break-all leading-relaxed">
                {qrMode === 'profile'
                  ? profileUrl
                  : `vCard 3.0 · ${person.name} (${department.code})`}
              </p>
            </div>
          </div>

          {/* Primary Actions: Save Contact (.vcf), Copy Link, Download QR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleSaveVCard}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                savedVCard
                  ? 'bg-emerald-700 text-white'
                  : 'bg-pust-900 text-white hover:bg-pust-950'
              }`}
            >
              {savedVCard ? (
                <>
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Contact Card Saved (.vcf)</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 shrink-0" />
                  <span>Save Contact (.vcf)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                copiedLink
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-white border-stone-300 text-slate-900 hover:border-pust-700 hover:text-pust-900'
              }`}
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Profile Link Copied</span>
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4 shrink-0" />
                  <span>Copy Profile Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={!qrDataUrl}
              onClick={handleDownloadQrImage}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold border border-stone-300 bg-[#FAF9F6] text-slate-800 hover:border-pust-700 hover:text-pust-900 disabled:opacity-50 transition-colors cursor-pointer ${
                nativeShareSupported ? '' : 'sm:col-span-2'
              }`}
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Download QR Image (PNG)</span>
            </button>

            {nativeShareSupported && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold border border-stone-300 bg-[#FAF9F6] text-slate-800 hover:border-pust-700 hover:text-pust-900 transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4 shrink-0" />
                <span>Share via Device...</span>
              </button>
            )}
          </div>

          {/* Contact Summary Included in Device Save */}
          <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                Contact Details Included
              </p>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-pust-800 hover:underline cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                Copy URL
              </button>
            </div>

            <dl className="space-y-1.5 text-xs text-slate-700">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-pust-800 shrink-0 mt-0.5" />
                <span>
                  Department of {department.name}, PUST · {officeLocation}
                </span>
              </div>
              {person.phones.map((phone, idx) => (
                <div key={`${phone.value}-${idx}`} className="flex items-center gap-2 font-mono">
                  <Phone className="w-3.5 h-3.5 text-pust-700 shrink-0" />
                  <span>{phone.value}</span>
                  <span className="text-[11px] text-slate-500">({phone.type})</span>
                </div>
              ))}
              {person.emails.map((email, idx) => (
                <div key={`${email.value}-${idx}`} className="flex items-center gap-2 font-mono">
                  <Mail className="w-3.5 h-3.5 text-lapis-700 shrink-0" />
                  <span className="break-all">{email.value}</span>
                  <span className="text-[11px] text-slate-500 shrink-0">({email.type})</span>
                </div>
              ))}
              {person.phones.length === 0 && person.emails.length === 0 && (
                <p className="text-[11px] text-slate-500 pt-0.5">
                  Direct personal phone or email is not listed; the saved contact includes name,
                  designation, department office location, and profile URL.
                </p>
              )}
            </dl>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
