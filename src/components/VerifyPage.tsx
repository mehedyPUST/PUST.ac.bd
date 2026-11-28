'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  FileCheck2,
  Link2,
  Printer,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { pustApi } from '../lib/api';
import { resolveUniversityContent } from '../lib/cmsDefaults';
import type { VerificationLookupResult } from '../types/pust';
import { EditTriggerButton } from './EditTriggerButton';
import { MotionCard, MotionReveal } from './MotionPrimitives';
import { usePust } from './PustContext';
import { PustCrest } from './PustCrest';
import { PageHeaderAndSectionSkeleton, PortalRecordsSkeleton } from './PustSkeletons';
import { VerificationQrSvg } from './portal/DigitalDocumentModal';

export function VerifyPage({ onNavigate }: { onNavigate?: (route: string) => void }) {
  const { profile, loadingData, dataError, retryLoad } = usePust();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationLookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedField, setCopiedField] = useState<'link' | 'hash' | null>(null);

  const searchParams = useSearchParams();
  const codeParam = searchParams.get('code')?.trim() || '';
  const lastAutoCodeRef = useRef<string>('');

  async function handleCopyText(text: string, field: 'link' | 'hash') {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      window.setTimeout(() => {
        setCopiedField((prev) => (prev === field ? null : prev));
      }, 2000);
    } catch {
      // Clipboard unavailable in restricted browser context
    }
  }

  const runVerification = useCallback(async (rawCode: string) => {
    const clean = rawCode.trim();
    if (clean.length < 4) {
      setError('Enter a valid serial number or SHA-256 verification digest.');
      setResult(null);
      setHasSearched(true);
      return;
    }
    setLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const res = await pustApi.verifyDocument(clean);
      setResult(res.verification);
    } catch (err) {
      setResult(null);
      setError(
        err instanceof Error
          ? err.message
          : 'No matching official PUST digital document was found for this serial.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (codeParam.length >= 4 && codeParam !== lastAutoCodeRef.current) {
      lastAutoCodeRef.current = codeParam;
      setQuery(codeParam);
      void runVerification(codeParam);
    }
  }, [codeParam, runVerification]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    runVerification(query);
  }

  if (loadingData && !profile) {
    return <PageHeaderAndSectionSkeleton />;
  }

  if (!profile) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 space-y-3">
          <h1 className="font-serif text-xl font-medium text-red-950">
            Document Verification Portal Unavailable
          </h1>
          <p className="text-sm text-red-800">
            {dataError || 'Unable to load registry configuration from the university server.'}
          </p>
          <button
            type="button"
            onClick={() => retryLoad()}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-pust-700 text-white hover:bg-pust-800 cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      </section>
    );
  }

  const { verifyPageConfig } = resolveUniversityContent(profile);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-10">
      {/* Header */}
      <header className="editable-region border-b border-stone-200 pb-8 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-pust-700 text-left">
            {verifyPageConfig.kicker}
          </p>
          <EditTriggerButton
            target={{ kind: 'verify-page' }}
            label="Edit Verify Page"
            variant="compact"
          />
        </div>
        <h1 className="font-serif text-fluid-h1 font-semibold text-slate-950 mt-2 tracking-tight">
          {verifyPageConfig.title}
        </h1>
        <p className="text-fluid-lead text-slate-700 max-w-2xl mt-3 leading-[1.72] text-left">
          {verifyPageConfig.subtitle}
        </p>
      </header>

      {/* Search & Quick Examples */}
      <MotionReveal className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 space-y-5 print:hidden">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter serial (e.g. PUST-CERT-CSE-2026A1 or PUST-RCPT-2026-091)"
              className="w-full pl-10 pr-4 py-3 text-sm font-mono rounded-lg border border-stone-300 bg-[#FAF9F6] focus:bg-white text-slate-950 placeholder:font-sans placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-pust-600/20 focus:border-pust-700"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary-sheen inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-white text-sm font-semibold disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            {loading ? 'Verifying...' : 'Verify Serial'}
          </button>
        </form>

        {verifyPageConfig.sampleSerials.length > 0 && (
          <div className="pt-3 border-t border-stone-200 space-y-2.5">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-stone-500 text-left">
              Verify Issued Registry Records
            </p>
            <div className="flex flex-wrap gap-2">
              {verifyPageConfig.sampleSerials.map((item) => (
                <button
                  key={`${item.label}-${item.code}`}
                  type="button"
                  onClick={() => {
                    setQuery(item.code);
                    runVerification(item.code);
                  }}
                  className="text-left px-3 py-1.5 rounded-lg border border-stone-200 bg-[#FAF9F6] hover:border-pust-700/50 hover:bg-white transition-colors cursor-pointer"
                >
                  <span className="block text-[11px] font-medium text-stone-600">{item.label}</span>
                  <span className="font-mono text-xs font-semibold text-pust-800">{item.code}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </MotionReveal>

      {/* Results Area */}
      {loading && <PortalRecordsSkeleton rows={3} />}

      {!loading && hasSearched && error && (
        <MotionReveal>
          <div className="rounded-2xl border border-red-200 card-gradient-crimson p-6 flex items-start gap-3.5">
            <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h2 className="font-serif text-lg font-medium text-red-950">Verification Not Found</h2>
              <p className="text-sm text-red-800">{error}</p>
              <p className="text-xs text-red-700 pt-1">
                Double-check the exact serial code printed beside the QR matrix on the university
                document.
              </p>
            </div>
          </div>
        </MotionReveal>
      )}

      {!loading && result && (
        <MotionReveal>
          <article className="print-only-document bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-pust-900 via-pust-800 to-pust-700 text-white flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-pust-200">
                  Cryptographically Verified Record
                </p>
                <p className="text-sm font-medium">
                  {result.documentType} · {result.status}
                </p>
              </div>
            </div>
            <div className="print:hidden flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const shareUrl =
                    typeof window !== 'undefined'
                      ? `${window.location.origin}/verify?code=${encodeURIComponent(result.serialCode)}`
                      : `/verify?code=${encodeURIComponent(result.serialCode)}`;
                  handleCopyText(shareUrl, 'link');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white whitespace-nowrap cursor-pointer"
              >
                {copiedField === 'link' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" /> Copied Link
                  </>
                ) : (
                  <>
                    <Link2 className="w-3.5 h-3.5" /> Copy Verify Link
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white whitespace-nowrap cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Print Verification Slip
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-stone-200 pb-6">
              <div className="flex items-start gap-4">
                <PustCrest size={52} className="shrink-0" />
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-pust-700">
                    {result.documentType}
                  </span>
                  <h2 className="font-serif text-2xl font-semibold text-slate-950 mt-1">
                    {result.title}
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    Issued by <strong className="text-slate-900">{result.issuedBy}</strong> on{' '}
                    <span className="tabular-nums">{result.issuedAt}</span>
                  </p>
                </div>
              </div>
              <div className="flex sm:flex-col items-center sm:items-end gap-3 shrink-0">
                <VerificationQrSvg
                  seed={`${result.serialCode}:${result.verificationHash}`}
                  size={84}
                />
                <span className="font-mono text-xs font-semibold text-pust-900">
                  {result.serialCode}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-stone-200 rounded-xl border border-stone-200 overflow-hidden">
              <div className="p-4 bg-[#FAF9F6]">
                <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-stone-500 text-left">
                  Holder Name
                </p>
                <p className="text-sm font-semibold text-slate-950 mt-1 text-left">
                  {result.holderName}
                </p>
              </div>
              <div className="p-4 bg-[#FAF9F6]">
                <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-stone-500 text-left">
                  Academic ID
                </p>
                <p className="font-mono text-sm font-semibold text-slate-950 mt-1 tabular-nums text-left">
                  {result.academicId}
                </p>
              </div>
              <div className="p-4 bg-[#FAF9F6]">
                <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-stone-500 text-left">
                  Department / Session
                </p>
                <p className="text-sm font-semibold text-slate-950 mt-1 text-left">
                  {result.departmentCode}
                  {result.session ? ` · ${result.session}` : ''}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-stone-200 divide-y divide-stone-200">
              {result.details.map((row) => (
                <div
                  key={row.label}
                  className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 text-xs"
                >
                  <span className="text-slate-600 font-medium">{row.label}</span>
                  <span className="font-semibold text-slate-950 sm:text-right tabular-nums break-words">
                    {row.value}
                  </span>
                </div>
              ))}
              <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-4 text-xs bg-[#FAF9F6]">
                <span className="text-slate-600 font-medium">Integrity Digest</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-pust-900 font-medium break-all">
                    {result.verificationHash}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyText(result.verificationHash, 'hash')}
                    aria-label="Copy verification digest"
                    className="print:hidden inline-flex items-center gap-1 px-2 py-1 rounded border border-stone-200 bg-white text-[11px] font-medium text-slate-700 hover:border-pust-700 hover:text-pust-800 cursor-pointer shrink-0"
                  >
                    {copiedField === 'hash' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-700" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </article>
        </MotionReveal>
      )}

      {/* Helpful footer bridge */}
      {!result && (
        <div className="editable-region grid grid-cols-1 sm:grid-cols-2 gap-4 print:hidden items-stretch">
          <MotionCard
            delay={0}
            className="h-full bg-white rounded-xl border border-stone-200 p-5 space-y-2"
          >
            <FileCheck2 className="w-5 h-5 text-pust-800" />
            <h3 className="font-serif text-lg font-medium text-slate-900 text-left">
              {verifyPageConfig.employerCardTitle}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed text-left">
              {verifyPageConfig.employerCardBody}
            </p>
          </MotionCard>
          <MotionCard
            delay={0.06}
            className="h-full bg-white rounded-xl border border-stone-200 p-5 flex flex-col justify-between gap-3"
          >
            <div className="space-y-1.5">
              <h3 className="font-serif text-lg font-medium text-slate-900 text-left">
                {verifyPageConfig.portalCardTitle}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed text-left">
                {verifyPageConfig.portalCardBody}
              </p>
            </div>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('/portal')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-pust-900 hover:underline self-start cursor-pointer"
              >
                Open Campus Portal <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </MotionCard>
        </div>
      )}
    </section>
  );
}
