'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { CreditCard, Printer } from 'lucide-react';
import { pustApi } from '../../lib/api';
import { usePust } from '../PustContext';
import { PortalRecordsSkeleton } from '../PustSkeletons';
import { DigitalCheckoutModal, type CheckoutTarget } from './DigitalCheckoutModal';
import { DigitalDocumentModal, type DigitalDocumentData } from './DigitalDocumentModal';
import type {
  AuthUser,
  HallApplicationRecord,
  HallCircularRecord,
  HallDueRecord,
  PaymentGatewayConfig,
} from '../../types/pust';

const HALL_OPTIONS = [
  { value: 'July 06 Hall', label: 'July 06 Hall (Male Hall-1)' },
  { value: 'Male Hall-1', label: 'Male Hall-1 (July 06 Hall)' },
  { value: 'Male Hall-2', label: 'Male Hall-2 (Swadhinota Hall)' },
  { value: 'Female Hall-1', label: 'Female Hall-1 (Matribhasha Hall)' },
  { value: 'Female Hall-2', label: 'Female Hall-2 (Ganatantra Hall)' },
];

const HALL_NAMES = HALL_OPTIONS.map((o) => o.value);

interface HallPanelProps {
  user: AuthUser;
}

export function HallPanel({ user }: HallPanelProps) {
  const { navigateTo } = usePust();
  const [circulars, setCirculars] = useState<HallCircularRecord[]>([]);
  const [applications, setApplications] = useState<HallApplicationRecord[]>([]);
  const [dues, setDues] = useState<HallDueRecord[]>([]);
  const [gateways, setGateways] = useState<PaymentGatewayConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [checkoutTarget, setCheckoutTarget] = useState<CheckoutTarget | null>(null);
  const [activeDoc, setActiveDoc] = useState<DigitalDocumentData | null>(null);

  // Student application state
  const [applyCircularId, setApplyCircularId] = useState('');
  const [applyStatement, setApplyStatement] = useState('');

  const defaultHall = HALL_NAMES.includes(user.hallAffiliation)
    ? user.hallAffiliation
    : 'July 06 Hall';

  // Hall Officer circular creation
  const [hallName, setHallName] = useState(defaultHall);
  const [circTitle, setCircTitle] = useState('');
  const [vacantSeats, setVacantSeats] = useState(25);
  const [deadline, setDeadline] = useState('2026-12-20');
  const [circDesc, setCircDesc] = useState('');

  // Hall seat review & reassignment state
  const [seatInputs, setSeatInputs] = useState<Record<string, { seat: string; note: string }>>({});

  // Hall Due creation state
  const [dueAcademicId, setDueAcademicId] = useState('');
  const [dueHallName, setDueHallName] = useState(defaultHall);
  const [dueFeeTitle, setDueFeeTitle] = useState('Semester Residential & Dining Fee');
  const [dueAmount, setDueAmount] = useState(1250);

  const initializedHallCircularRef = useRef(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await pustApi.getHallsOverview();
      setCirculars(data.circulars);
      setApplications(data.applications);
      setDues(data.dues);
      setGateways(data.gateways || []);
      if (data.circulars.length > 0 && !initializedHallCircularRef.current) {
        initializedHallCircularRef.current = true;
        setApplyCircularId(data.circulars[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load hall records.');
    } finally {
      setLoading(false);
    }
  }, []);

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

  function openClearanceModal(d: HallDueRecord) {
    if (!d.clearanceRef) return;
    setActiveDoc({
      kind: 'hall_clearance',
      serialCode: d.clearanceRef,
      title: 'Official Hall Financial Clearance',
      subtitle: `${d.hallName} · Provost Office Clearance Record`,
      holderName: d.studentName,
      academicId: d.academicId,
      departmentCode: user.departmentCode || 'PUST',
      issuedAt: d.clearedAt || new Date().toISOString().slice(0, 10),
      issuedBy: d.clearedBy || `${d.hallName} Office`,
      statusLabel: d.status,
      rows: [
        { label: 'Clearance Reference', value: d.clearanceRef },
        { label: 'Residential Hall', value: d.hallName },
        { label: 'Fee Description', value: d.feeTitle },
        { label: 'Settled Amount', value: `BDT ${d.amountBdt.toLocaleString()}` },
        {
          label: 'Payment & Receipt',
          value: d.receiptNo
            ? `${d.receiptNo} (${d.paymentMethod || 'Digital'} · ${d.paymentRef || ''})`
            : `${d.paymentMethod || 'Treasury'} (${d.paymentRef || 'Verified'})`,
        },
      ],
      footerNote:
        'Exam registration systems recognize this Hall Financial Clearance automatically.',
    });
  }

  const pendingApps = applications.filter((a) => a.status === 'pending').length;
  const unclearedDues = dues.filter((d) => d.status !== 'Cleared').length;

  return (
    <div className="space-y-6">
      {/* Role-Specific Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-pust-800">
            {user.role === 'student'
              ? `Residential Affiliation · ${user.hallAffiliation}`
              : 'Residential Hall Administration & Financial Clearance'}
          </p>
          <h2 className="font-serif text-2xl font-medium text-slate-900 mt-1">
            {user.role === 'student'
              ? 'My Hall Seat Allocation, Vacancies & Financial Dues'
              : 'July 06 Hall & Dormitories — Seats, History & Clearances'}
          </h2>
        </div>
        <p className="font-mono text-xs text-slate-600 tabular-nums">
          {circulars.length} vacancy circular(s) · {pendingApps} pending app(s) · {unclearedDues}{' '}
          uncleared due(s)
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

      {/* Hall Office Vacancy Circular Publisher */}
      {(user.role === 'hall' || user.role === 'admin') && (
        <form
          onSubmit={handlePublishCircular}
          className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs"
        >
          <h3 className="font-serif text-lg font-medium text-slate-900">
            Publish Hall Seat Vacancy Circular
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <select
              value={hallName}
              onChange={(e) => setHallName(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-800 focus:outline-none"
            >
              {HALL_OPTIONS.map((h) => (
                <option key={h.value} value={h.value}>
                  {h.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              required
              value={circTitle}
              onChange={(e) => setCircTitle(e.target.value)}
              placeholder="Circular Title"
              className="sm:col-span-2 px-3 py-2 text-sm rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-800 focus:outline-none"
            />
            <input
              type="number"
              min={1}
              required
              value={vacantSeats}
              onChange={(e) => setVacantSeats(Number(e.target.value))}
              placeholder="Vacant Seats"
              className="px-3 py-2 text-sm rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-800 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="date"
              required
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-800 focus:outline-none"
            />
            <input
              type="text"
              required
              value={circDesc}
              onChange={(e) => setCircDesc(e.target.value)}
              placeholder="Eligibility criteria and allotment note..."
              className="sm:col-span-3 px-3 py-2 text-sm rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-800 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 text-sm font-medium rounded-lg bg-pust-900 hover:bg-pust-950 text-white cursor-pointer"
          >
            Publish Hall Circular
          </button>
        </form>
      )}

      {/* Active Vacancy Circulars */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <h3 className="font-serif text-lg font-medium text-slate-900">
          Open Hall Seat Vacancy Circulars
        </h3>
        {circulars.length === 0 ? (
          <p className="text-sm text-slate-600">No open hall seat circulars currently active.</p>
        ) : (
          <div className="rounded-xl divide-y divide-slate-200 border border-slate-200 overflow-hidden">
            {circulars.map((c) => (
              <div key={c.id} className="p-4 space-y-1 hover:bg-[#F7F7F5]/60 transition-colors">
                <p className="font-mono text-xs text-pust-800 tabular-nums">
                  {c.hallName} · {c.vacantSeats} Vacant Seats · Deadline {c.deadline}
                </p>
                <p className="font-serif text-base font-medium text-slate-900">{c.title}</p>
                <p className="text-xs text-slate-600">{c.description}</p>
              </div>
            ))}
          </div>
        )}

        {user.role === 'student' && circulars.length > 0 && (
          <form onSubmit={handleApplyHall} className="pt-4 border-t border-slate-200 space-y-3">
            <p className="font-mono text-xs uppercase tracking-wider text-slate-600">
              Apply for Residential Hall Seat
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={applyCircularId}
                onChange={(e) => setApplyCircularId(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-800 focus:outline-none"
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
                className="sm:col-span-2 px-3 py-2 text-sm rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-800 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium rounded-lg bg-pust-900 hover:bg-pust-950 text-white cursor-pointer"
            >
              Submit Hall Seat Application
            </button>
          </form>
        )}
      </div>

      {/* Seat Applications & Full Seat Change History */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <h3 className="font-serif text-lg font-medium text-slate-900">
          Hall Seat Applications &amp; Retained Seat History
        </h3>
        {loading ? (
          <PortalRecordsSkeleton rows={3} />
        ) : applications.length === 0 ? (
          <p className="text-sm text-slate-600">No hall seat applications on record.</p>
        ) : (
          <div className="rounded-xl divide-y divide-slate-200 border border-slate-200 overflow-hidden">
            {applications.map((app) => {
              const input = seatInputs[app.id] || { seat: app.assignedSeat || 'Room 204 · Bed A', note: '' };
              return (
                <div key={app.id} className="p-4 space-y-3 hover:bg-[#F7F7F5]/60 transition-colors">
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">
                        {app.studentName} · <span className="font-mono">{app.academicId}</span> (
                        {app.departmentCode})
                      </p>
                      <p className="font-mono text-xs text-pust-800 tabular-nums">
                        {app.hallName} · Status: {app.status.toUpperCase()}
                        {app.assignedSeat ? ` · Current Seat: ${app.assignedSeat}` : ''}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">{app.statement}</p>
                    </div>
                  </div>

                  {app.seatHistory.length > 0 && (
                    <div className="bg-[#F7F7F5] rounded-xl border border-slate-200 p-3.5 text-xs space-y-1">
                      <p className="font-mono font-semibold uppercase tracking-wider text-slate-500">
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
                        className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-800 focus:outline-none"
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
                        className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-800 focus:outline-none"
                      />
                      {app.status === 'pending' ? (
                        <div className="flex gap-2 md:col-span-2">
                          <button
                            type="button"
                            onClick={() => handleReviewHallApp(app, 'accepted')}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-pust-900 text-white hover:bg-pust-950 cursor-pointer whitespace-nowrap"
                          >
                            Approve &amp; Allot Seat
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReviewHallApp(app, 'rejected')}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-300 text-red-700 hover:bg-red-50 cursor-pointer whitespace-nowrap"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleReassignSeat(app)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-pust-800 text-pust-800 hover:bg-pust-900 hover:text-white cursor-pointer whitespace-nowrap"
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

      {/* Hall Financial Dues & Digital Checkout + Clearances */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-serif text-lg font-medium text-slate-900">
              Hall Dues, Fee Checkout &amp; Financial Clearances
            </h3>
            <p className="text-xs text-slate-600">
              Examination form fill-up automatically verifies that all Hall dues are cleared.
            </p>
          </div>
        </div>

        {(user.role === 'hall' || user.role === 'admin') && (
          <form
            onSubmit={handleCreateDue}
            className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-[#F7F7F5] rounded-xl border border-slate-200 p-4"
          >
            <input
              type="text"
              required
              value={dueAcademicId}
              onChange={(e) => setDueAcademicId(e.target.value)}
              placeholder="Academic ID"
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:border-pust-800 focus:outline-none"
            />
            <select
              value={dueHallName}
              onChange={(e) => setDueHallName(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:border-pust-800 focus:outline-none"
            >
              {HALL_OPTIONS.map((h) => (
                <option key={h.value} value={h.value}>
                  {h.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              required
              value={dueFeeTitle}
              onChange={(e) => setDueFeeTitle(e.target.value)}
              placeholder="Fee Title"
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:border-pust-800 focus:outline-none"
            />
            <input
              type="number"
              min={50}
              required
              value={dueAmount}
              onChange={(e) => setDueAmount(Number(e.target.value))}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:border-pust-800 focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium rounded-lg bg-pust-900 text-white hover:bg-pust-950 cursor-pointer whitespace-nowrap"
            >
              Issue Hall Due
            </button>
          </form>
        )}

        {loading ? (
          <PortalRecordsSkeleton rows={2} />
        ) : dues.length === 0 ? (
          <p className="text-sm text-slate-600">No residential Hall dues on record.</p>
        ) : (
          <div className="rounded-xl divide-y divide-slate-200 border border-slate-200 overflow-hidden">
            {dues.map((d) => (
              <div key={d.id} className="p-4 space-y-2 hover:bg-[#F7F7F5]/60 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">
                      {d.feeTitle} · {d.hallName}
                    </p>
                    <p className="font-mono text-xs text-slate-500 tabular-nums mt-0.5">
                      {d.studentName} ({d.academicId}) · ৳{d.amountBdt.toLocaleString()} ·{' '}
                      <span
                        className={`font-semibold ${
                          d.status === 'Cleared'
                            ? 'text-pust-800'
                            : d.status === 'Payment Submitted'
                            ? 'text-amber-700'
                            : 'text-red-700'
                        }`}
                      >
                        {d.status}
                      </span>
                      {d.receiptNo ? ` · Receipt: ${d.receiptNo}` : ''}
                      {d.clearanceRef ? ` · Clearance: ${d.clearanceRef}` : ''}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {user.role === 'student' && d.status === 'Unpaid' && (
                      <button
                        type="button"
                        onClick={() =>
                          setCheckoutTarget({
                            targetType: 'hall_due',
                            targetId: d.id,
                            title: d.feeTitle,
                            subtitle: `${d.hallName} · Academic ID ${d.academicId}`,
                            amountBdt: d.amountBdt,
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-pust-900 text-white hover:bg-pust-950 cursor-pointer whitespace-nowrap"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        Pay Online (৳{d.amountBdt.toLocaleString()})
                      </button>
                    )}

                    {(user.role === 'hall' || user.role === 'admin') && d.status !== 'Cleared' && (
                      <button
                        type="button"
                        onClick={() => handleClearDue(d)}
                        className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-pust-900 text-white hover:bg-pust-950 cursor-pointer whitespace-nowrap"
                      >
                        Confirm &amp; Issue Clearance
                      </button>
                    )}

                    {d.status === 'Cleared' && d.clearanceRef && (
                      <button
                        type="button"
                        onClick={() => openClearanceModal(d)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:border-pust-800 hover:text-pust-900 cursor-pointer whitespace-nowrap"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print Hall Clearance
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <DigitalCheckoutModal
        target={checkoutTarget}
        gateways={gateways}
        onClose={() => setCheckoutTarget(null)}
        onSuccess={async (receipt, updatedTarget, meta) => {
          const updatedDue = updatedTarget as HallDueRecord | undefined;
          setFeedback(
            meta?.autoCleared || updatedDue?.status === 'Cleared'
              ? `Payment ${receipt.receiptNo} verified via ${receipt.gatewayName}. Hall Clearance ${
                  updatedDue?.clearanceRef || ''
                } auto-issued and examinations unlocked.`
              : `Payment ${receipt.receiptNo} verified via ${receipt.gatewayName}. Awaiting Hall Office clearance confirmation.`
          );
          await refresh();
        }}
      />

      <DigitalDocumentModal
        doc={activeDoc}
        onClose={() => setActiveDoc(null)}
        onOpenVerify={(code) => navigateTo(`/verify?code=${encodeURIComponent(code)}`)}
      />
    </div>
  );
}
