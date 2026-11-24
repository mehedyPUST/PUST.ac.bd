'use client';

import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  Printer,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { pustApi } from '../lib/api';
import { resolveUniversityContent } from '../lib/cmsDefaults';
import type { VerificationLookupResult } from '../types/pust';
import { EditTriggerButton } from './EditTriggerButton';
import { usePust } from './PustContext';
import { PustCrest } from './PustCrest';
import { VerificationQrSvg } from './portal/DigitalDocumentModal';

export function VerifyPage({ onNavigate }: { onNavigate?: (route: string) => void }) {
  const { profile } = usePust();
  const { verifyPageConfig } = resolveUniversityContent(profile);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationLookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  async function runVerification(rawCode: string) {
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
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code && code.trim().length >= 4) {
      setQuery(code.trim());
      runVerification(code.trim());
    }
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    runVerification(query);
  }

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-10">
      {/* Header */}
      <header className="editable-region border-b border-slate-200 pb-8 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-pust-800">
            {verifyPageConfig.kicker}
          </p>
          <EditTriggerButton
            target={{ kind: 'verify-page' }}
            label="Edit Verify Page"
            variant="compact"
          />
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-medium text-slate-900 mt-2">
          {verifyPageConfig.title}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mt-3 leading-relaxed">
          {verifyPageConfig.subtitle}
        </p>
      </header>

      {/* Search & Quick Examples */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5 print:hidden">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter serial (e.g. PUST-CERT-CSE-2026A1 or PUST-RCPT-2026-091)"
              className="w-full pl-10 pr-4 py-3 text-sm font-mono rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pust-700/20 focus:border-pust-700"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-pust-900 text-white text-sm font-semibold hover:bg-pust-950 disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            <ShieldCheck className="w-4 h-4" />
            {loading ? 'Verifying...' : 'Verify Serial'}
          </button>
        </form>

        <div className="pt-2 border-t border-slate-100 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
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
                className="text-left px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:border-pust-700 hover:bg-pust-50/50 transition-colors cursor-pointer"
              >
                <span className="block text-[11px] text-slate-500">{item.label}</span>
                <span className="font-mono text-xs font-medium text-pust-900">{item.code}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Area */}
      {hasSearched && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50/80 p-6 flex items-start gap-3.5">
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
      )}

      {result && (
        <article className="print-only-document bg-white rounded-2xl border border-pust-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-pust-950 text-white flex flex-wrap items-center justify-between gap-3">
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
            <button
              type="button"
              onClick={() => window.print()}
              className="print:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" /> Print Verification Slip
            </button>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-slate-200 pb-6">
              <div className="flex items-start gap-4">
                <PustCrest size={52} className="shrink-0" />
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-pust-800">
                    {result.documentType}
                  </span>
                  <h2 className="font-serif text-2xl font-medium text-slate-900 mt-1">
                    {result.title}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Issued by <strong className="text-slate-800">{result.issuedBy}</strong> on{' '}
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[11px] uppercase tracking-wider text-slate-500">Holder Name</p>
                <p className="text-sm font-semibold text-slate-900 mt-1">{result.holderName}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[11px] uppercase tracking-wider text-slate-500">Academic ID</p>
                <p className="font-mono text-sm font-semibold text-slate-900 mt-1 tabular-nums">
                  {result.academicId}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[11px] uppercase tracking-wider text-slate-500">
                  Department / Session
                </p>
                <p className="text-sm font-semibold text-slate-900 mt-1">
                  {result.departmentCode}
                  {result.session ? ` · ${result.session}` : ''}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 divide-y divide-slate-200">
              {result.details.map((row) => (
                <div
                  key={row.label}
                  className="px-4 py-3 flex items-center justify-between gap-4 text-xs"
                >
                  <span className="text-slate-500">{row.label}</span>
                  <span className="font-medium text-slate-900 text-right tabular-nums">
                    {row.value}
                  </span>
                </div>
              ))}
              <div className="px-4 py-3 flex items-center justify-between gap-4 text-xs bg-slate-50">
                <span className="text-slate-500">Integrity Digest</span>
                <span className="font-mono text-pust-900 font-medium">
                  {result.verificationHash}
                </span>
              </div>
            </div>
          </div>
        </article>
      )}

      {/* Helpful footer bridge */}
      {!result && (
        <div className="editable-region grid grid-cols-1 sm:grid-cols-2 gap-4 print:hidden">
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
            <FileCheck2 className="w-5 h-5 text-pust-800" />
            <h3 className="font-serif text-lg font-medium text-slate-900">
              {verifyPageConfig.employerCardTitle}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {verifyPageConfig.employerCardBody}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between gap-3">
            <div className="space-y-1.5">
              <h3 className="font-serif text-lg font-medium text-slate-900">
                {verifyPageConfig.portalCardTitle}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
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
          </div>
        </div>
      )}
    </section>
  );
}
