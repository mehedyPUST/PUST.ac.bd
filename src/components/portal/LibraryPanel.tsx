'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { pustApi } from '../../lib/api';
import { PortalRecordsSkeleton } from '../PustSkeletons';
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
  const [applications, setApplications] = useState<LibraryApplicationRecord[]>([]);
  const [cards, setCards] = useState<LibraryCardRecord[]>([]);
  const [borrows, setBorrows] = useState<LibraryBorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
          Central Library Membership &amp; Digital Cards
        </p>
        <h2 className="font-serif text-2xl font-medium text-slate-900 mt-1">
          Library Clearance, Chairman JSON Seal &amp; Borrowing Ledger
        </h2>
      </div>

      {error && (
        <div className="p-3.5 border border-red-200 bg-red-50 text-sm text-red-900">{error}</div>
      )}
      {feedback && (
        <div className="p-3.5 border border-emerald-200 bg-emerald-50 text-sm text-emerald-900">
          {feedback}
        </div>
      )}

      {/* Student Actions & Digital Library Card */}
      {user.role === 'student' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 bg-white border border-slate-200 p-6 space-y-4">
            <h3 className="font-serif text-lg font-medium text-slate-900">
              Library Membership Workflow
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Submit your library application to your Department Chairman. Once sealed with the
              Chairman’s official digital signature JSON, Central Library verifies and activates your
              Digital Library Card (with optional Physical Card linkage).
            </p>
            {applications.length === 0 || applications[0]?.status === 'rejected' ? (
              <button
                type="button"
                onClick={handleApplyLibrary}
                className="px-5 py-2.5 text-sm font-medium bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer"
              >
                Apply for Central Library Membership
              </button>
            ) : (
              <div className="border border-slate-200 bg-slate-50 p-4 space-y-2 text-sm">
                <p className="font-mono text-xs text-emerald-700 uppercase">
                  Application Status: {applications[0].status.replace(/_/g, ' ')}
                </p>
                {applications[0].chairmanSeal && (
                  <div className="text-xs text-slate-700 bg-white border border-slate-200 p-3 font-mono">
                    <p>Seal: {applications[0].chairmanSeal.officialSeal}</p>
                    <p>Signed By: {applications[0].chairmanSeal.digitalSignature}</p>
                    <p>Hash: {applications[0].chairmanSeal.verificationHash}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-6 bg-white border border-slate-200 p-6 space-y-3">
            <h3 className="font-serif text-lg font-medium text-slate-900">
              My Digital Library Card
            </h3>
            {cards.length === 0 ? (
              <p className="text-sm text-slate-600">
                No active Digital Library Card issued yet. Complete Chairman seal &amp; Library
                verification first.
              </p>
            ) : (
              cards.map((card) => (
                <div
                  key={card.id}
                  className="border border-emerald-300 bg-emerald-50/40 p-5 space-y-2"
                >
                  <p className="font-mono text-xs uppercase text-emerald-700">
                    PUST Central Library · {card.status}
                  </p>
                  <p className="font-mono text-lg font-semibold text-slate-900 tabular-nums">
                    {card.digitalCardNo}
                  </p>
                  <p className="text-sm text-slate-800">
                    {card.studentName} · ID {card.academicId} · {card.departmentCode} ({card.session}
                    )
                  </p>
                  <p className="font-mono text-xs text-slate-600">
                    Valid Until: {card.validUntil}
                    {card.physicalCardRef ? ` · Physical Card: ${card.physicalCardRef}` : ''}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Chairman Queue */}
      {user.role === 'chairman' && (
        <div className="bg-white border border-slate-200 p-6 space-y-4">
          <h3 className="font-serif text-lg font-medium text-slate-900">
            Department Chairman Library Seal &amp; Forwarding Queue
          </h3>
          {applications.length === 0 ? (
            <p className="text-sm text-slate-600">No departmental library applications yet.</p>
          ) : (
            <div className="divide-y divide-slate-200 border border-slate-200">
              {applications.map((app) => {
                const input = sealInputs[app.id] || {
                  officialSeal: `OFFICIAL SEAL — Dept. of ${user.departmentCode}, PUST`,
                  digitalSignature: user.name,
                  note: 'Bonafide student verified for library access.',
                };
                return (
                  <div key={app.id} className="p-4 space-y-3">
                    <div className="flex flex-wrap justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-900">
                          {app.studentName} · <span className="font-mono">{app.academicId}</span>
                        </p>
                        <p className="font-mono text-xs text-slate-500">
                          Session {app.session} · Status: {app.status.replace(/_/g, ' ')}
                        </p>
                      </div>
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
                          className="px-3 py-2 text-xs border border-slate-300 bg-slate-50"
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
                          className="px-3 py-2 text-xs border border-slate-300 bg-slate-50"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleChairmanSeal(app, 'forward')}
                            className="px-3.5 py-2 text-xs font-medium bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer"
                          >
                            Seal JSON &amp; Forward
                          </button>
                          <button
                            type="button"
                            onClick={() => handleChairmanSeal(app, 'reject')}
                            className="px-3.5 py-2 text-xs font-medium border border-red-300 text-red-700 hover:bg-red-50 cursor-pointer"
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
      )}

      {/* Library Office / Admin Queue & Borrowing Log */}
      {(user.role === 'library' || user.role === 'admin') && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 p-6 space-y-4">
            <h3 className="font-serif text-lg font-medium text-slate-900">
              Library Verification &amp; Digital Card Issuance
            </h3>
            {applications.length === 0 ? (
              <p className="text-sm text-slate-600">No applications awaiting library verification.</p>
            ) : (
              <div className="divide-y divide-slate-200 border border-slate-200">
                {applications.map((app) => (
                  <div key={app.id} className="p-4 space-y-2">
                    <div className="flex flex-wrap justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-900">
                          {app.studentName} · <span className="font-mono">{app.academicId}</span> (
                          {app.departmentCode})
                        </p>
                        <p className="font-mono text-xs text-emerald-700">
                          Status: {app.status.replace(/_/g, ' ')}
                        </p>
                      </div>
                      {app.chairmanSeal && (
                        <div className="font-mono text-[11px] text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5">
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
                          className="px-3 py-1.5 text-xs border border-slate-300 bg-slate-50 w-72"
                        />
                        <button
                          type="button"
                          onClick={() => handleLibraryVerify(app, 'approve')}
                          className="px-4 py-1.5 text-xs font-medium bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer"
                        >
                          Verify Seal &amp; Issue Card
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLibraryVerify(app, 'reject')}
                          className="px-4 py-1.5 text-xs font-medium border border-red-300 text-red-700 hover:bg-red-50 cursor-pointer"
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

          <form
            onSubmit={handleBorrowBook}
            className="bg-white border border-slate-200 p-6 space-y-4"
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
                className="px-3 py-2 text-sm border border-slate-300 bg-slate-50"
              />
              <input
                type="text"
                required
                value={borrowTitle}
                onChange={(e) => setBorrowTitle(e.target.value)}
                placeholder="Book Title"
                className="px-3 py-2 text-sm border border-slate-300 bg-slate-50"
              />
              <input
                type="text"
                required
                value={borrowIsbn}
                onChange={(e) => setBorrowIsbn(e.target.value)}
                placeholder="ISBN / Call No."
                className="px-3 py-2 text-sm border border-slate-300 bg-slate-50"
              />
              <input
                type="date"
                required
                value={borrowDue}
                onChange={(e) => setBorrowDue(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-300 bg-slate-50"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer"
            >
              Checkout Book
            </button>
          </form>
        </div>
      )}

      {/* Borrowing & Return History Table */}
      <div className="bg-white border border-slate-200 p-6 space-y-4">
        <h3 className="font-serif text-lg font-medium text-slate-900">
          Book Borrowing &amp; Return Ledger
        </h3>
        {loading ? (
          <PortalRecordsSkeleton rows={3} />
        ) : borrows.length === 0 ? (
          <p className="text-sm text-slate-600">No active or archived book checkouts recorded.</p>
        ) : (
          <div className="divide-y divide-slate-200 border border-slate-200">
            {borrows.map((b) => (
              <div
                key={b.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm"
              >
                <div>
                  <p className="font-medium text-slate-900">{b.bookTitle}</p>
                  <p className="font-mono text-xs text-slate-500 tabular-nums">
                    {b.academicId} · ISBN {b.isbn} · Borrowed {b.borrowedAt} · Due {b.dueAt} ·{' '}
                    <span className="text-emerald-700 font-semibold">{b.status}</span>
                  </p>
                </div>
                {(user.role === 'library' || user.role === 'admin') && b.status === 'Borrowed' && (
                  <button
                    type="button"
                    onClick={() => handleReturnBook(b.id)}
                    className="px-3.5 py-1.5 text-xs font-medium border border-emerald-700 text-emerald-700 hover:bg-emerald-700 hover:text-white cursor-pointer"
                  >
                    Mark Returned
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
