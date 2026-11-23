'use client';

import { useMemo, useState } from 'react';
import { Check, Download, ExternalLink, Printer, ShieldCheck, X } from 'lucide-react';
import { PustCrest } from '../PustCrest';

export type DigitalDocumentKind =
  | 'certificate'
  | 'admit_card'
  | 'library_card'
  | 'hall_clearance'
  | 'receipt'
  | 'transcript';

export interface DigitalDocumentData {
  kind: DigitalDocumentKind;
  serialCode: string;
  verificationHash?: string;
  title: string;
  subtitle: string;
  holderName: string;
  academicId: string;
  departmentCode: string;
  session?: string;
  issuedAt: string;
  issuedBy: string;
  statusLabel: string;
  rows: Array<{ label: string; value: string }>;
  tableHeaders?: string[];
  tableRows?: string[][];
  footerNote?: string;
}

interface DigitalDocumentModalProps {
  doc: DigitalDocumentData | null;
  onClose: () => void;
  onOpenVerify?: (code: string) => void;
}

function buildDeterministicMatrix(seedStr: string, size = 13): boolean[][] {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const drawFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const border = r === 0 || r === 4 || c === 0 || c === 4;
        const center = r === 2 && c === 2;
        grid[r0 + r][c0 + c] = border || center;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 5);
  drawFinder(size - 5, 0);

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTopLeft = r < 6 && c < 6;
      const inTopRight = r < 6 && c >= size - 6;
      const inBottomLeft = r >= size - 6 && c < 6;
      if (inTopLeft || inTopRight || inBottomLeft) continue;
      h ^= (r * 31 + c * 17) & 0xff;
      h = Math.imul(h, 16777619);
      grid[r][c] = (h >>> 0) % 2 === 0;
    }
  }
  return grid;
}

export function VerificationQrSvg({ seed, size = 84 }: { seed: string; size?: number }) {
  const matrix = useMemo(() => buildDeterministicMatrix(seed, 13), [seed]);
  const cell = size / 13;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`Verification QR code for ${seed}`}
      className="bg-white p-1 border border-slate-200 rounded-lg shrink-0"
    >
      {matrix.map((row, rIdx) =>
        row.map((filled, cIdx) =>
          filled ? (
            <rect
              key={`${rIdx}-${cIdx}`}
              x={cIdx * cell}
              y={rIdx * cell}
              width={cell}
              height={cell}
              fill="#0F172A"
            />
          ) : null
        )
      )}
    </svg>
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function DigitalDocumentModal({ doc, onClose, onOpenVerify }: DigitalDocumentModalProps) {
  const [copied, setCopied] = useState(false);

  if (!doc) return null;

  const computedHash =
    doc.verificationHash ||
    `SHA256-${doc.serialCode.replace(/[^A-Z0-9]/gi, '').slice(0, 12).toUpperCase()}`;

  function handleCopySerial() {
    if (!doc) return;
    navigator.clipboard?.writeText(doc.serialCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function handleDownloadHtml() {
    if (!doc) return;
    const rowsHtml = doc.rows
      .map(
        (r) =>
          `<tr><th style="text-align:left;padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;width:36%;font-size:12px;color:#475569;">${escapeHtml(
            r.label
          )}</th><td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:13px;color:#0f172a;font-weight:600;">${escapeHtml(
            r.value
          )}</td></tr>`
      )
      .join('');

    const tableHtml =
      doc.tableHeaders && doc.tableRows
        ? `<table style="width:100%;border-collapse:collapse;margin-top:18px;">
            <thead><tr>${doc.tableHeaders
              .map(
                (h) =>
                  `<th style="text-align:left;padding:8px 10px;border:1px solid #cbd5e1;background:#064e3b;color:#ffffff;font-size:11px;text-transform:uppercase;">${escapeHtml(
                    h
                  )}</th>`
              )
              .join('')}</tr></thead>
            <tbody>${doc.tableRows
              .map(
                (row) =>
                  `<tr>${row
                    .map(
                      (cell) =>
                        `<td style="padding:8px 10px;border:1px solid #e2e8f0;font-size:12px;color:#0f172a;">${escapeHtml(
                          cell
                        )}</td>`
                    )
                    .join('')}</tr>`
              )
              .join('')}</tbody>
          </table>`
        : '';

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(doc.serialCode)} — ${escapeHtml(doc.title)}</title>
</head>
<body style="font-family:Georgia,serif;background:#f7f7f5;padding:32px;color:#0f172a;">
  <div style="max-width:780px;margin:0 auto;background:#ffffff;border:2px solid #064e3b;padding:36px;">
    <div style="border-bottom:2px solid #e2e8f0;padding-bottom:18px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <div style="font-family:sans-serif;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#065f46;font-weight:700;">Pabna University of Science and Technology</div>
        <h1 style="margin:6px 0 4px;font-size:24px;color:#0f172a;">${escapeHtml(doc.title)}</h1>
        <p style="margin:0;font-family:sans-serif;font-size:13px;color:#475569;">${escapeHtml(doc.subtitle)}</p>
      </div>
      <div style="text-align:right;font-family:monospace;font-size:12px;">
        <div style="font-weight:700;color:#064e3b;">${escapeHtml(doc.serialCode)}</div>
        <div style="color:#64748b;margin-top:4px;">${escapeHtml(doc.statusLabel)}</div>
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-family:sans-serif;">
      <tr><th style="text-align:left;padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;width:36%;font-size:12px;color:#475569;">Student / Holder</th><td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:13px;font-weight:600;">${escapeHtml(doc.holderName)}</td></tr>
      <tr><th style="text-align:left;padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-size:12px;color:#475569;">Academic ID</th><td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:13px;font-family:monospace;">${escapeHtml(doc.academicId)}</td></tr>
      <tr><th style="text-align:left;padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-size:12px;color:#475569;">Department</th><td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:13px;">${escapeHtml(doc.departmentCode)}${doc.session ? ` (${escapeHtml(doc.session)})` : ''}</td></tr>
      ${rowsHtml}
    </table>
    ${tableHtml}
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;font-family:sans-serif;font-size:11px;color:#475569;display:flex;justify-content:space-between;gap:16px;">
      <div>Issued by: <strong>${escapeHtml(doc.issuedBy)}</strong> on ${escapeHtml(doc.issuedAt)}</div>
      <div style="font-family:monospace;">Hash: ${escapeHtml(computedHash)}</div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.serialCode}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center p-4 overflow-y-auto print:static print:bg-white print:p-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby="digital-doc-title"
    >
      <div className="print-only-document bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden my-auto print:shadow-none print:border-2 print:border-emerald-900 print:rounded-none">
        {/* Toolbar hidden when printing */}
        <div className="print:hidden px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-900">
            <ShieldCheck className="w-4 h-4" />
            <span>Official Verified Digital Record</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
            <button
              type="button"
              onClick={handleDownloadHtml}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-900 text-white hover:bg-emerald-950 whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" /> Download Copy
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close document viewer"
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Official Document Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-5">
            <div className="flex items-start gap-3.5">
              <PustCrest size={48} className="shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-800">
                  Pabna University of Science and Technology
                </p>
                <h2
                  id="digital-doc-title"
                  className="font-serif text-xl sm:text-2xl font-medium text-slate-900 mt-1"
                >
                  {doc.title}
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">{doc.subtitle}</p>
              </div>
            </div>
            <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1.5 shrink-0">
              <VerificationQrSvg seed={`${doc.serialCode}:${computedHash}`} size={76} />
              <div className="text-left sm:text-right">
                <button
                  type="button"
                  onClick={handleCopySerial}
                  className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-emerald-900 hover:underline"
                  title="Copy serial code"
                >
                  {doc.serialCode}
                  {copied && <Check className="w-3 h-3 text-emerald-700" />}
                </button>
                <p className="text-[11px] font-medium text-emerald-800 mt-0.5 text-left sm:text-right">
                  {doc.statusLabel}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] uppercase tracking-wider text-slate-500">
                Holder Name
              </span>
              <p className="font-semibold text-slate-900 mt-0.5">{doc.holderName}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] uppercase tracking-wider text-slate-500">
                Academic ID & Department
              </span>
              <p className="font-mono font-semibold text-slate-900 mt-0.5 tabular-nums">
                {doc.academicId} · {doc.departmentCode}
                {doc.session ? ` (${doc.session})` : ''}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-200">
            {doc.rows.map((r) => (
              <div
                key={r.label}
                className="px-4 py-2.5 flex items-center justify-between gap-4 text-xs bg-white"
              >
                <span className="text-slate-500">{r.label}</span>
                <span className="font-medium text-slate-900 text-right tabular-nums">{r.value}</span>
              </div>
            ))}
          </div>

          {doc.tableHeaders && doc.tableRows && doc.tableRows.length > 0 && (
            <div className="rounded-xl border border-slate-200 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                    {doc.tableHeaders.map((h) => (
                      <th key={h} className="px-3.5 py-2.5 font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {doc.tableRows.map((row, idx) => (
                    <tr key={idx}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3.5 py-2.5 text-slate-800 tabular-nums">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              <p>
                Authorized by <strong className="text-slate-900">{doc.issuedBy}</strong> ·{' '}
                <span className="tabular-nums">{doc.issuedAt}</span>
              </p>
              <p className="font-mono text-[11px] text-slate-500 mt-0.5">
                Digest: {computedHash}
              </p>
              {doc.footerNote && <p className="text-[11px] text-slate-500 mt-1">{doc.footerNote}</p>}
            </div>
            {onOpenVerify && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenVerify(doc.serialCode);
                }}
                className="print:hidden inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 whitespace-nowrap"
              >
                Verify Publicly <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
