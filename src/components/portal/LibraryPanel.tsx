'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, Clock, QrCode, ShieldCheck } from 'lucide-react';
import { pustApi } from '../../lib/api';
import { usePust } from '../PustContext';
import { PortalRecordsSkeleton } from '../PustSkeletons';
import { DigitalDocumentModal, type DigitalDocumentData } from './DigitalDocumentModal';
import type {
  AuthUser,
  LibraryApplicationRecord,
  LibraryBorrowRecord,
  LibraryCardRecord,
} from '../../types/pust';

interface LibraryPanelProps {
  user: AuthUser;
}

export function LibraryPanel({ user }: LibraryPanelProps) {
  const { navigateTo } = usePust();
  const [applications, setApplications] = useState<LibraryApplicationRecord[]>([]);
  const [cards, setCards] = useState<LibraryCardRecord[]>([]);
  const [borrows, setBorrows] = useState<LibraryBorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeDoc, setActiveDoc] = useState<DigitalDocumentData | null>(null);

  const [sealInputs, setSealInputs] = useState<
    Record<string, { officialSeal: string; digitalSignature: string; note: string }>
  >({});
  const [physicalRefs, setPhysicalRefs] = useState<Record<string, string>>({});
  const [borrowAcademicId, setBorrowAcademicId] = useState('');
  const [borrowTitle, setBorrowTitle] = useState('');
  const [borrowIsbn, setBorrowIsbn] = useState('');
  const [borrowDue, setBorrowDue] = useState('2026-12-15');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await pustApi.getLibraryOverview();
      setApplications(data.applications);
      setCards(data.cards);
      setBorrows(data.borrows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load library records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleApplyLibrary() {
    setError(null);
    setFeedback(null);
    try {
      const res = await pustApi.applyLibrary();
      setFeedback(
        `Library membership application ${res.application.id} submitted to ${user.departmentCode} Chairman.`
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to apply.');
    }
  }

  async function handleChairmanSeal(app: LibraryApplicationRecord, decision: 'forward' | 'reject') {
    setError(null);
    setFeedback(null);
    const input = sealInputs[app.id] || {
      officialSeal: `OFFICIAL SEAL — Dept. of ${user.departmentCode}, PUST`,
      digitalSignature: user.name,
      note: 'Verified bonafide student of department.',
    };
    try {
      await pustApi.chairmanSealLibrary(app.id, {
        decision,
        officialSeal: input.officialSeal,
        digitalSignature: input.digitalSignature,
        note: input.note,
      });
      setFeedback(
        decision === 'forward'
          ? `Forwarded ${app.academicId} to Central Library with verified Chairman JSON seal.`
          : `Declined library application for ${app.academicId}.`
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to process Chairman decision.');
    }
  }

  async function handleLibraryVerify(
    app: LibraryApplicationRecord,
    decision: 'approve' | 'reject'
  ) {
    setError(null);
    setFeedback(null);
    try {
      const res = await pustApi.verifyLibrary(app.id, {
        decision,
        physicalCardRef: physicalRefs[app.id] || undefined,
      });
      setFeedback(
        decision === 'approve'
          ? `Issued Digital Library Card ${res.card?.digitalCardNo ?? ''} for ${app.academicId}.`
          : `Declined library verification for ${app.academicId}.`
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to verify library card.');
    }
  }

  async function handleBorrowBook(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      await pustApi.borrowBook({
        academicId: borrowAcademicId,
        bookTitle: borrowTitle,
        isbn: borrowIsbn,
        dueAt: borrowDue,
      });
      setFeedback(`Book "${borrowTitle}" checked out to ${borrowAcademicId}.`);
      setBorrowAcademicId('');
      setBorrowTitle('');
      setBorrowIsbn('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to record book checkout.');
    }
  }

  async function handleReturnBook(id: string) {
    setError(null);
    setFeedback(null);
    try {
      await pustApi.returnBook(id);
      setFeedback('Book marked as returned.');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to mark book returned.');
    }
  }

  function openCardModal(card: LibraryCardRecord) {
    setActiveDoc({
      kind: 'library_card',
      serialCode: card.digitalCardNo,
      verificationHash: card.verificationHash,
      title: 'Official Digital Library Membership Card',
      subtitle: 'Central Library & Information Center · Rajapur Campus',
      holderName: card.studentName,
      academicId: card.academicId,
      departmentCode: card.departmentCode,
      session: card.session,
      issuedAt: card.issuedAt,
      issuedBy: 'Central Library & Chairman Seal',
      statusLabel: card.status,
      rows: [
        { label: 'Digital Card Serial', value: card.digitalCardNo },
        { label: 'Linked Physical Ref', value: card.physicalCardRef || 'Digital Card Only' },
        { label: 'Validity Period', value: `${card.issuedAt} to ${card.validUntil}` },
        { label: 'Card Standing', value: card.status },
      ],
      footerNote:
        'Present this QR-sealed Digital Library Card at the Central Library circulation desk or verify publicly.',
    });
  }

  const pendingChairmanCount = applications.filter((a) => a.status === 'pending_chairman').length;
  const pendingLibraryCount = applications.filter((a) => a.status === 'forwarded_to_library').length;
  const latestApp = applications[0] ?? null;

  const pipelineStep =
    cards.length > 0 || latestApp?.status === 'approved'
      ? 3
      : latestApp?.status === 'forwarded_to_library'
      ? 2
      : latestApp?.status === 'pending_chairman'
      ? 1
      : 0;

  return (
    <div className="space-y-6">
      {/* Role-Specific Module Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-pust-800">
            {user.role === 'student'
              ? 'Central Library Membership & Books'
              : user.role === 'chairman'
              ? `Department of ${user.departmentCode} · Chairman Endorsement`
              : 'Central Library Verification & Circulation'}
          </p>
          <h2 className="font-serif text-2xl font-medium text-slate-900 mt-1">
            {user.role === 'student'
              ? 'My Digital Library Card & Borrowing Ledger'
              : user.role === 'chairman'
              ? 'Chairman Library Seal Queue & Departmental Cards'
              : 'Library Clearance, Card Issuance & Borrowing Desk'}
          </h2>
        </div>
        <p className="font-mono text-xs text-slate-600 tabular-nums">
          {user.role === 'chairman'
            ? `${pendingChairmanCount} awaiting seal · ${cards.length} dept cards`
            : user.role === 'library' || user.role === 'admin'
            ? `${pendingLibraryCount} awaiting verification · ${cards.length} active cards`
            : `${cards.length} active card · ${borrows.length} loan record(s)`}
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-sm text-red-900">
          {error}
        </div>
      )}
      {feedback && (
        <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 text-sm text-emerald-900">
          {feedback}
        </div>
      )}

      {/* Student Actions, Visual 3-Step Pipeline & Digital Library Card */}
      {user.role === 'student' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-serif text-lg font-medium text-slate-900">
                Library Membership Pipeline
              </h3>

              {/* Visual 3-Step Digital Pipeline */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { step: 1, title: 'Application', subtitle: 'Student submitted' },
                  { step: 2, title: 'Chairman Seal', subtitle: 'Dept JSON signed' },
                  { step: 3, title: 'Active Card', subtitle: 'Library verified' },
                ].map((s) => {
                  const done = pipelineStep >= s.step;
                  return (
                    <div
                      key={s.step}
                      className={`p-3 rounded-xl border ${
                        done
                          ? 'border-emerald-700 bg-emerald-50/70'
                          : 'border-slate-200 bg-[#F7F7F5]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-mono font-semibold text-[11px] text-pust-900">
                        {done ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        Step {s.step}
                      </div>
                      <p className="font-medium text-slate-900 mt-1">{s.title}</p>
                      <p className="text-[11px] text-slate-500">{s.subtitle}</p>
                    </div>
                  );
                })}
              </div>

              {latestApp && latestApp.status !== 'rejected' && (
                <div className="rounded-xl border border-slate-200 bg-[#F7F7F5] p-4 space-y-2 text-sm">
                  <p className="font-mono text-xs text-pust-800 uppercase font-semibold">
                    Current Stage: {latestApp.status.replace(/_/g, ' ')}
                  </p>
                  {latestApp.chairmanSeal && (
                    <div className="text-xs text-slate-700 bg-white rounded-lg border border-slate-200 p-3 font-mono space-y-0.5">
                      <p>Seal: {latestApp.chairmanSeal.officialSeal}</p>
                      <p>Signed By: {latestApp.chairmanSeal.digitalSignature}</p>
                      <p>Hash: {latestApp.chairmanSeal.verificationHash}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {(!latestApp || latestApp.status === 'rejected') && (
              <div>
                <button
                  type="button"
                  onClick={handleApplyLibrary}
                  className="px-5 py-2.5 text-sm font-medium rounded-lg bg-pust-900 hover:bg-pust-950 text-white shadow-xs transition-all cursor-pointer"
                >
                  Apply for Central Library Membership
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-xs">
            <h3 className="font-serif text-lg font-medium text-slate-900">
              My Digital Library Card
            </h3>
            {cards.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-[#F7F7F5] p-5 text-sm text-slate-600">
                No active Digital Library Card issued yet. Apply on the left to start Chairman
                endorsement and Library verification.
              </div>
            ) : (
              cards.map((card) => (
                <div
                  key={card.id}
                  className="bg-gradient-to-br from-pust-950 via-pust-900 to-pust-800 text-white rounded-2xl p-6 space-y-3.5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-white/15 pb-2.5">
                    <p className="font-mono text-[11px] uppercase tracking-widest text-pust-200 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      PUST Central Library
                    </p>
                    <p className="font-mono text-[11px] uppercase tracking-wider text-pust-100">
                      {card.status}
                    </p>
                  </div>
                  <p className="font-mono text-xl font-semibold text-white tabular-nums tracking-wide">
                    {card.digitalCardNo}
                  </p>
                  <p className="text-sm text-pust-50">
                    {card.studentName} · ID {card.academicId} · {card.departmentCode} ({card.session})
                  </p>
                  <p className="font-mono text-xs text-pust-200 tabular-nums">
                    Valid Until: {card.validUntil}
                    {card.physicalCardRef ? ` · Physical Ref: ${card.physicalCardRef}` : ''}
                  </p>
                  <div className="pt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openCardModal(card)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white text-pust-950 hover:bg-pust-50 cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      View Digital Card &amp; QR
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        navigateTo(`/verify?code=${encodeURIComponent(card.digitalCardNo)}`)
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-white/25 text-white hover:bg-white/10 cursor-pointer"
                    >
                      Verify Serial
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Chairman Queue */}
      {user.role === 'chairman' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <h3 className="font-serif text-lg font-medium text-slate-900">
              Department Chairman Library Seal &amp; Forwarding Queue
            </h3>
            {loading ? (
              <PortalRecordsSkeleton rows={3} />
            ) : applications.length === 0 ? (
              <p className="text-sm text-slate-600">No departmental library applications yet.</p>
            ) : (
              <div className="rounded-xl divide-y divide-slate-200 border border-slate-200 overflow-hidden">
                {applications.map((app) => {
                  const input = sealInputs[app.id] || {
                    officialSeal: `OFFICIAL SEAL — Dept. of ${user.departmentCode}, PUST`,
                    digitalSignature: user.name,
                    note: 'Bonafide student verified for library access.',
                  };
                  return (
                    <div key={app.id} className="p-4 space-y-3 hover:bg-[#F7F7F5]/60 transition-colors">
                      <div className="flex flex-wrap justify-between gap-2">
                        <div>
                          <p className="font-medium text-slate-900">
                            {app.studentName} · <span className="font-mono">{app.academicId}</span>
                          </p>
                          <p className="font-mono text-xs text-slate-500 tabular-nums">
                            Session {app.session} · Status:{' '}
                            <span className="text-pust-800 font-semibold">
                              {app.status.replace(/_/g, ' ')}
                            </span>
                          </p>
                        </div>
                        {app.chairmanSeal && (
                          <div className="font-mono text-[11px] text-slate-600 bg-[#F7F7F5] rounded-lg border border-slate-200 px-3 py-1.5">
                            Seal Hash: {app.chairmanSeal.verificationHash}
                          </div>
                        )}
                      </div>

                      {app.status === 'pending_chairman' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                          <input
                            type="text"
                            value={input.officialSeal}
                            onChange={(e) =>
                              setSealInputs((prev) => ({
                                ...prev,
                                [app.id]: { ...input, officialSeal: e.target.value },
                              }))
                            }
                            placeholder="Official Chairman Seal"
                            className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-800 focus:outline-none"
                          />
                          <input
                            type="text"
                            value={input.digitalSignature}
                            onChange={(e) =>
                              setSealInputs((prev) => ({
                                ...prev,
                                [app.id]: { ...input, digitalSignature: e.target.value },
                              }))
                            }
                            placeholder="Digital Signature"
                            className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-800 focus:outline-none"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleChairmanSeal(app, 'forward')}
                              className="px-3.5 py-2 text-xs font-medium rounded-lg bg-pust-900 text-white hover:bg-pust-950 cursor-pointer whitespace-nowrap"
                            >
                              Seal JSON &amp; Forward
                            </button>
                            <button
                              type="button"
                              onClick={() => handleChairmanSeal(app, 'reject')}
                              className="px-3.5 py-2 text-xs font-medium rounded-lg border border-red-300 text-red-700 hover:bg-red-50 cursor-pointer whitespace-nowrap"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <h3 className="font-serif text-lg font-medium text-slate-900">
              Issued Library Cards — Dept. of {user.departmentCode} ({cards.length})
            </h3>
            {cards.length === 0 ? (
              <p className="text-sm text-slate-600">
                No departmental library cards issued yet.
              </p>
            ) : (
              <div className="rounded-xl divide-y divide-slate-200 border border-slate-200 text-sm overflow-hidden">
                {cards.map((c) => (
                  <div key={c.id} className="p-3.5 flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-slate-900">
                      {c.studentName} · <span className="font-mono">{c.academicId}</span>
                    </p>
                    <div className="flex items-center gap-3">
                      <p className="font-mono text-xs text-pust-800 tabular-nums">
                        {c.digitalCardNo} · Valid {c.validUntil}
                      </p>
                      <button
                        type="button"
                        onClick={() => openCardModal(c)}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-300 text-slate-700 hover:border-pust-800 hover:text-pust-900 cursor-pointer"
                      >
                        View Card
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Library Office / Admin Queue & Borrowing Log */}
      {(user.role === 'library' || user.role === 'admin') && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <h3 className="font-serif text-lg font-medium text-slate-900">
              Library Verification &amp; Digital Card Issuance
            </h3>
            {loading ? (
              <PortalRecordsSkeleton rows={3} />
            ) : applications.length === 0 ? (
              <p className="text-sm text-slate-600">No applications awaiting library verification.</p>
            ) : (
              <div className="rounded-xl divide-y divide-slate-200 border border-slate-200 overflow-hidden">
                {applications.map((app) => (
                  <div key={app.id} className="p-4 space-y-2 hover:bg-[#F7F7F5]/60 transition-colors">
                    <div className="flex flex-wrap justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-900">
                          {app.studentName} · <span className="font-mono">{app.academicId}</span> (
                          {app.departmentCode})
                        </p>
                        <p className="font-mono text-xs text-pust-800">
                          Status: {app.status.replace(/_/g, ' ')}
                        </p>
                      </div>
                      {app.chairmanSeal && (
                        <div className="font-mono text-[11px] text-slate-600 bg-[#F7F7F5] rounded-lg border border-slate-200 px-3 py-1.5">
                          Seal JSON Verified: {app.chairmanSeal.officialSeal} ·{' '}
                          {app.chairmanSeal.verificationHash}
                        </div>
                      )}
                    </div>

                    {app.status === 'forwarded_to_library' && (
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <input
                          type="text"
                          value={physicalRefs[app.id] ?? ''}
                          onChange={(e) =>
                            setPhysicalRefs((prev) => ({ ...prev, [app.id]: e.target.value }))
                          }
                          placeholder="Optional Physical Card Ref (e.g. PHY-2026-042)"
                          className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-800 focus:outline-none w-72"
                        />
                        <button
                          type="button"
                          onClick={() => handleLibraryVerify(app, 'approve')}
                          className="px-4 py-1.5 text-xs font-medium rounded-lg bg-pust-900 text-white hover:bg-pust-950 cursor-pointer whitespace-nowrap"
                        >
                          Verify Seal &amp; Issue Card
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLibraryVerify(app, 'reject')}
                          className="px-4 py-1.5 text-xs font-medium rounded-lg border border-red-300 text-red-700 hover:bg-red-50 cursor-pointer whitespace-nowrap"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {cards.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-xs">
              <h3 className="font-serif text-lg font-medium text-slate-900">
                Active Issued Library Cards ({cards.length})
              </h3>
              <div className="rounded-xl divide-y divide-slate-200 border border-slate-200 text-xs overflow-hidden">
                {cards.map((c) => (
                  <div key={c.id} className="p-3.5 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-medium text-sm text-slate-900">{c.studentName}</span> ·{' '}
                      <span className="font-mono text-slate-600">{c.academicId}</span> ({c.departmentCode})
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-pust-800 font-semibold">{c.digitalCardNo}</span>
                      <button
                        type="button"
                        onClick={() => openCardModal(c)}
                        className="px-2.5 py-1 rounded-lg border border-slate-300 text-slate-700 hover:border-pust-800 hover:text-pust-900 cursor-pointer"
                      >
                        View Card &amp; QR
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form
            onSubmit={handleBorrowBook}
            className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs"
          >
            <h3 className="font-serif text-lg font-medium text-slate-900">
              Record Book Borrowing
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input
                type="text"
                required
                value={borrowAcademicId}
                onChange={(e) => setBorrowAcademicId(e.target.value)}
                placeholder="Student Academic ID"
                className="px-3 py-2 text-sm rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-800 focus:outline-none"
              />
              <input
                type="text"
                required
                value={borrowTitle}
                onChange={(e) => setBorrowTitle(e.target.value)}
                placeholder="Book Title"
                className="px-3 py-2 text-sm rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-800 focus:outline-none"
              />
              <input
                type="text"
                required
                value={borrowIsbn}
                onChange={(e) => setBorrowIsbn(e.target.value)}
                placeholder="ISBN / Call No."
                className="px-3 py-2 text-sm rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-800 focus:outline-none"
              />
              <input
                type="date"
                required
                value={borrowDue}
                onChange={(e) => setBorrowDue(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-800 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium rounded-lg bg-pust-900 hover:bg-pust-950 text-white cursor-pointer"
            >
              Checkout Book
            </button>
          </form>
        </div>
      )}

      {/* Borrowing & Return History Table */}
      {(user.role === 'student' || user.role === 'library' || user.role === 'admin') && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <h3 className="font-serif text-lg font-medium text-slate-900">
            Book Borrowing &amp; Return Ledger
          </h3>
          {loading ? (
            <PortalRecordsSkeleton rows={3} />
          ) : borrows.length === 0 ? (
            <p className="text-sm text-slate-600">No active or archived book checkouts recorded.</p>
          ) : (
            <div className="rounded-xl divide-y divide-slate-200 border border-slate-200 overflow-hidden">
              {borrows.map((b) => (
                <div
                  key={b.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-slate-900">{b.bookTitle}</p>
                    <p className="font-mono text-xs text-slate-500 tabular-nums">
                      {b.academicId} · ISBN {b.isbn} · Borrowed {b.borrowedAt} · Due {b.dueAt} ·{' '}
                      <span className="text-pust-800 font-semibold">{b.status}</span>
                    </p>
                  </div>
                  {(user.role === 'library' || user.role === 'admin') && b.status === 'Borrowed' && (
                    <button
                      type="button"
                      onClick={() => handleReturnBook(b.id)}
                      className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-pust-800 text-pust-800 hover:bg-pust-900 hover:text-white cursor-pointer whitespace-nowrap"
                    >
                      Mark Returned
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <DigitalDocumentModal
        doc={activeDoc}
        onClose={() => setActiveDoc(null)}
        onOpenVerify={(code) => navigateTo(`/verify?code=${encodeURIComponent(code)}`)}
      />
    </div>
  );
}
