'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { pustApi } from '../../lib/api';
import { PortalRecordsSkeleton } from '../PustSkeletons';
import type {
  AuthUser,
  HallApplicationRecord,
  HallCircularRecord,
  HallDueRecord,
} from '../../types/pust';

const HALL_NAMES = [
  'July 06 Hall',
  'Male Hall-1',
  'Male Hall-2',
  'Female Hall-1',
  'Female Hall-2',
];

interface HallPanelProps {
  user: AuthUser;
}

export function HallPanel({ user }: HallPanelProps) {
  const [circulars, setCirculars] = useState<HallCircularRecord[]>([]);
  const [applications, setApplications] = useState<HallApplicationRecord[]>([]);
  const [dues, setDues] = useState<HallDueRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Student application state
  const [applyCircularId, setApplyCircularId] = useState('');
  const [applyStatement, setApplyStatement] = useState('');

  // Student due payment state
  const [payDueInputs, setPayDueInputs] = useState<
    Record<string, { method: string; ref: string }>
  >({});

  // Hall Officer circular creation
  const [hallName, setHallName] = useState('July 06 Hall');
  const [circTitle, setCircTitle] = useState('');
  const [vacantSeats, setVacantSeats] = useState(25);
  const [deadline, setDeadline] = useState('2026-12-20');
  const [circDesc, setCircDesc] = useState('');

  // Hall seat review & reassignment state
  const [seatInputs, setSeatInputs] = useState<Record<string, { seat: string; note: string }>>({});

  // Hall Due creation state
  const [dueAcademicId, setDueAcademicId] = useState('');
  const [dueHallName, setDueHallName] = useState('July 06 Hall');
  const [dueFeeTitle, setDueFeeTitle] = useState('Semester Residential & Dining Fee');
  const [dueAmount, setDueAmount] = useState(1250);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await pustApi.getHallsOverview();
      setCirculars(data.circulars);
      setApplications(data.applications);
      setDues(data.dues);
      if (data.circulars.length > 0 && !applyCircularId) {
        setApplyCircularId(data.circulars[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load hall records.');
    } finally {
      setLoading(false);
    }
  }, [applyCircularId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handlePublishCircular(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      await pustApi.createHallCircular({
        hallName,
        title: circTitle,
        vacantSeats: Number(vacantSeats),
        deadline,
        description: circDesc,
      });
      setFeedback(`Published vacancy circular for ${hallName}.`);
      setCircTitle('');
      setCircDesc('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to publish circular.');
    }
  }

  async function handleApplyHall(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      await pustApi.applyHall({ circularId: applyCircularId, statement: applyStatement });
      setFeedback('Hall seat application submitted.');
      setApplyStatement('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to apply.');
    }
  }

  async function handleReviewHallApp(
    app: HallApplicationRecord,
    status: 'accepted' | 'rejected'
  ) {
    setError(null);
    setFeedback(null);
    const input = seatInputs[app.id] || {
      seat: 'Room 304 · Bed B',
      note: 'Verified departmental standing and seat availability.',
    };
    try {
      await pustApi.reviewHallApp(app.id, {
        status,
        reviewNote: input.note,
        assignedSeat: status === 'accepted' ? input.seat : undefined,
      });
      setFeedback(`Updated hall application for ${app.academicId}.`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to review hall application.');
    }
  }

  async function handleReassignSeat(app: HallApplicationRecord) {
    setError(null);
    setFeedback(null);
    const input = seatInputs[app.id];
    if (!input?.seat?.trim()) {
      setError('Enter the new seat number before reassigning.');
      return;
    }
    try {
      await pustApi.reassignHallSeat(app.id, {
        assignedSeat: input.seat,
        note: input.note || 'Hall seat reassigned by Provost office.',
      });
      setFeedback(`Seat reassigned for ${app.academicId} (history preserved).`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reassign seat.');
    }
  }

  async function handleCreateDue(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      await pustApi.createHallDue({
        academicId: dueAcademicId,
        hallName: dueHallName,
        feeTitle: dueFeeTitle,
        amountBdt: Number(dueAmount),
      });
      setFeedback(`Issued Hall fee due for ${dueAcademicId}.`);
      setDueAcademicId('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create hall due.');
    }
  }

  async function handlePayDue(due: HallDueRecord) {
    setError(null);
    setFeedback(null);
    const input = payDueInputs[due.id] || { method: 'Bangla QR', ref: '' };
    if (!input.ref.trim()) {
      setError('Enter your payment transaction reference.');
      return;
    }
    try {
      await pustApi.payHallDue(due.id, { paymentMethod: input.method, paymentRef: input.ref });
      setFeedback(`Payment submitted for ${due.feeTitle}. Awaiting Hall Office clearance.`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit payment.');
    }
  }

  async function handleClearDue(due: HallDueRecord) {
    setError(null);
    setFeedback(null);
    try {
      const res = await pustApi.clearHallDue(due.id);
      setFeedback(`Generated Hall Financial Clearance ${res.due.clearanceRef ?? ''}.`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate clearance.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
          Residential Hall Administration &amp; Financial Clearance
        </p>
        <h2 className="font-serif text-2xl font-medium text-slate-900 mt-1">
          July 06 Hall &amp; Residential Dormitories — Seats, History &amp; Clearances
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

      {/* Hall Office Vacancy Circular Publisher */}
      {(user.role === 'hall' || user.role === 'admin') && (
        <form
          onSubmit={handlePublishCircular}
          className="bg-white border border-slate-200 p-6 space-y-4"
        >
          <h3 className="font-serif text-lg font-medium text-slate-900">
            Publish Hall Seat Vacancy Circular
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <select
              value={hallName}
              onChange={(e) => setHallName(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 bg-slate-50"
            >
              {HALL_NAMES.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            <input
              type="text"
              required
              value={circTitle}
              onChange={(e) => setCircTitle(e.target.value)}
              placeholder="Circular Title"
              className="sm:col-span-2 px-3 py-2 text-sm border border-slate-300 bg-slate-50"
            />
            <input
              type="number"
              min={1}
              required
              value={vacantSeats}
              onChange={(e) => setVacantSeats(Number(e.target.value))}
              placeholder="Vacant Seats"
              className="px-3 py-2 text-sm border border-slate-300 bg-slate-50"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="date"
              required
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 bg-slate-50"
            />
            <input
              type="text"
              required
              value={circDesc}
              onChange={(e) => setCircDesc(e.target.value)}
              placeholder="Eligibility criteria and allotment note..."
              className="sm:col-span-3 px-3 py-2 text-sm border border-slate-300 bg-slate-50"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 text-sm font-medium bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer"
          >
            Publish Hall Circular
          </button>
        </form>
      )}

      {/* Active Vacancy Circulars */}
      <div className="bg-white border border-slate-200 p-6 space-y-4">
        <h3 className="font-serif text-lg font-medium text-slate-900">
          Open Hall Seat Vacancy Circulars
        </h3>
        <div className="divide-y divide-slate-200 border border-slate-200">
          {circulars.map((c) => (
            <div key={c.id} className="p-4 space-y-1">
              <p className="font-mono text-xs text-emerald-700 tabular-nums">
                {c.hallName} · {c.vacantSeats} Vacant Seats · Deadline {c.deadline}
              </p>
              <p className="font-serif text-base font-medium text-slate-900">{c.title}</p>
              <p className="text-xs text-slate-600">{c.description}</p>
            </div>
          ))}
        </div>

        {user.role === 'student' && circulars.length > 0 && (
          <form onSubmit={handleApplyHall} className="pt-4 border-t border-slate-200 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Apply for Residential Hall Seat
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={applyCircularId}
                onChange={(e) => setApplyCircularId(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-300 bg-slate-50"
              >
                {circulars.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.hallName} — {c.title}
                  </option>
                ))}
              </select>
              <input
                type="text"
                required
                value={applyStatement}
                onChange={(e) => setApplyStatement(e.target.value)}
                placeholder="State residential need, permanent district, and semester standing..."
                className="sm:col-span-2 px-3 py-2 text-sm border border-slate-300 bg-slate-50"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer"
            >
              Submit Hall Seat Application
            </button>
          </form>
        )}
      </div>

      {/* Seat Applications & Full Seat Change History */}
      <div className="bg-white border border-slate-200 p-6 space-y-4">
        <h3 className="font-serif text-lg font-medium text-slate-900">
          Hall Seat Applications &amp; Seat History
        </h3>
        {loading ? (
          <PortalRecordsSkeleton rows={3} />
        ) : applications.length === 0 ? (
          <p className="text-sm text-slate-600">No hall seat applications on record.</p>
        ) : (
          <div className="divide-y divide-slate-200 border border-slate-200">
            {applications.map((app) => {
              const input = seatInputs[app.id] || { seat: app.assignedSeat || 'Room 204 · Bed A', note: '' };
              return (
                <div key={app.id} className="p-4 space-y-3">
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">
                        {app.studentName} · <span className="font-mono">{app.academicId}</span> (
                        {app.departmentCode})
                      </p>
                      <p className="font-mono text-xs text-emerald-700">
                        {app.hallName} · Status: {app.status.toUpperCase()}
                        {app.assignedSeat ? ` · Current Seat: ${app.assignedSeat}` : ''}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">{app.statement}</p>
                    </div>
                  </div>

                  {app.seatHistory.length > 0 && (
                    <div className="bg-slate-50 border border-slate-200 p-3 text-xs space-y-1">
                      <p className="font-semibold uppercase tracking-wider text-slate-500">
                        Retained Seat Change History
                      </p>
                      {app.seatHistory.map((h, i) => (
                        <p key={`${h.assignedAt}-${i}`} className="font-mono text-slate-700">
                          {h.seatNumber} — {h.note} ({h.assignedBy}, {h.assignedAt.slice(0, 10)})
                        </p>
                      ))}
                    </div>
                  )}

                  {(user.role === 'hall' || user.role === 'admin') && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 pt-2">
                      <input
                        type="text"
                        value={input.seat}
                        onChange={(e) =>
                          setSeatInputs((prev) => ({
                            ...prev,
                            [app.id]: { ...input, seat: e.target.value },
                          }))
                        }
                        placeholder="Room & Bed (e.g. Room 304 · Bed B)"
                        className="px-3 py-1.5 text-xs border border-slate-300 bg-slate-50"
                      />
                      <input
                        type="text"
                        value={input.note}
                        onChange={(e) =>
                          setSeatInputs((prev) => ({
                            ...prev,
                            [app.id]: { ...input, note: e.target.value },
                          }))
                        }
                        placeholder="Allotment / Reassignment Note"
                        className="px-3 py-1.5 text-xs border border-slate-300 bg-slate-50"
                      />
                      {app.status === 'pending' ? (
                        <div className="flex gap-2 md:col-span-2">
                          <button
                            type="button"
                            onClick={() => handleReviewHallApp(app, 'accepted')}
                            className="px-3 py-1.5 text-xs font-medium bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer"
                          >
                            Approve &amp; Allot Seat
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReviewHallApp(app, 'rejected')}
                            className="px-3 py-1.5 text-xs font-medium border border-red-300 text-red-700 hover:bg-red-50 cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleReassignSeat(app)}
                          className="px-3 py-1.5 text-xs font-medium border border-emerald-700 text-emerald-700 hover:bg-emerald-700 hover:text-white cursor-pointer"
                        >
                          Update / Reassign Seat
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Hall Financial Dues & Clearances */}
      <div className="bg-white border border-slate-200 p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-serif text-lg font-medium text-slate-900">
              Hall Dues, Fee Payments &amp; Financial Clearances
            </h3>
            <p className="text-xs text-slate-600">
              Examination form fill-up automatically checks that all Hall dues are cleared.
            </p>
          </div>
        </div>

        {(user.role === 'hall' || user.role === 'admin') && (
          <form
            onSubmit={handleCreateDue}
            className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-slate-50 border border-slate-200 p-4"
          >
            <input
              type="text"
              required
              value={dueAcademicId}
              onChange={(e) => setDueAcademicId(e.target.value)}
              placeholder="Academic ID"
              className="px-3 py-2 text-xs border border-slate-300 bg-white"
            />
            <select
              value={dueHallName}
              onChange={(e) => setDueHallName(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 bg-white"
            >
              {HALL_NAMES.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            <input
              type="text"
              required
              value={dueFeeTitle}
              onChange={(e) => setDueFeeTitle(e.target.value)}
              placeholder="Fee Title"
              className="px-3 py-2 text-xs border border-slate-300 bg-white"
            />
            <input
              type="number"
              min={50}
              required
              value={dueAmount}
              onChange={(e) => setDueAmount(Number(e.target.value))}
              className="px-3 py-2 text-xs border border-slate-300 bg-white"
            />
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer"
            >
              Issue Hall Due
            </button>
          </form>
        )}

        {dues.length === 0 ? (
          <p className="text-sm text-slate-600">No residential Hall dues on record.</p>
        ) : (
          <div className="divide-y divide-slate-200 border border-slate-200">
            {dues.map((d) => {
              const payInput = payDueInputs[d.id] || { method: 'Bangla QR', ref: '' };
              return (
                <div key={d.id} className="p-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <div>
                      <p className="font-medium text-slate-900">
                        {d.feeTitle} · {d.hallName}
                      </p>
                      <p className="font-mono text-xs text-slate-500 tabular-nums">
                        {d.studentName} ({d.academicId}) · ৳{d.amountBdt} ·{' '}
                        <span className="font-semibold text-emerald-700">{d.status}</span>
                        {d.clearanceRef ? ` · Clearance: ${d.clearanceRef}` : ''}
                      </p>
                    </div>

                    {(user.role === 'hall' || user.role === 'admin') && d.status !== 'Cleared' && (
                      <button
                        type="button"
                        onClick={() => handleClearDue(d)}
                        className="px-3.5 py-1.5 text-xs font-medium bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer"
                      >
                        Confirm &amp; Issue Clearance
                      </button>
                    )}
                  </div>

                  {user.role === 'student' && d.status === 'Unpaid' && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      <select
                        value={payInput.method}
                        onChange={(e) =>
                          setPayDueInputs((prev) => ({
                            ...prev,
                            [d.id]: { ...payInput, method: e.target.value },
                          }))
                        }
                        className="px-3 py-1.5 text-xs border border-slate-300 bg-slate-50"
                      >
                        <option value="Bangla QR">Bangla QR</option>
                        <option value="SSLCommerz">SSLCommerz</option>
                        <option value="bKash MFS">bKash MFS</option>
                      </select>
                      <input
                        type="text"
                        value={payInput.ref}
                        onChange={(e) =>
                          setPayDueInputs((prev) => ({
                            ...prev,
                            [d.id]: { ...payInput, ref: e.target.value },
                          }))
                        }
                        placeholder="Transaction Ref (e.g. TXN-HALL-901)"
                        className="px-3 py-1.5 text-xs border border-slate-300 bg-slate-50 w-60"
                      />
                      <button
                        type="button"
                        onClick={() => handlePayDue(d)}
                        className="px-4 py-1.5 text-xs font-medium bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer"
                      >
                        Submit Hall Fee Payment
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
