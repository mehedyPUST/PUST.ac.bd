'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Building2,
  Calendar,
  CheckCircle2,
  FileText,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  UserPlus,
  X,
  XCircle,
} from 'lucide-react';
import { pustApi } from '../lib/api';
import type {
  AuthUser,
  DepartmentRecord,
  RoleAssignment,
  UserRole,
} from '../types/pust';

/** Catalog aligned with common Bangladesh public-university office orders. */
const APPOINTMENT_CATALOG: {
  appointmentType: RoleAssignment['appointmentType'];
  label: string;
  description: string;
  role: UserRole;
  defaultScopeType: RoleAssignment['scopeType'];
  defaultTitle: string;
  typicalTermMonths: number | null;
}[] = [
  {
    appointmentType: 'department_chairman',
    label: 'Department Chairman / Head',
    description: 'Heads an academic department (home or another department).',
    role: 'chairman',
    defaultScopeType: 'department',
    defaultTitle: 'Chairman',
    typicalTermMonths: 36,
  },
  {
    appointmentType: 'hall_provost',
    label: 'Hall Provost',
    description: 'Residential hall head; usually a senior teacher on additional duty.',
    role: 'hall',
    defaultScopeType: 'hall',
    defaultTitle: 'Provost',
    typicalTermMonths: 12,
  },
  {
    appointmentType: 'assistant_provost',
    label: 'Assistant Provost',
    description: 'Supports hall administration under the Provost.',
    role: 'hall',
    defaultScopeType: 'hall',
    defaultTitle: 'Assistant Provost',
    typicalTermMonths: 12,
  },
  {
    appointmentType: 'house_tutor',
    label: 'House Tutor',
    description: 'Hall residential tutor duty for a fixed term.',
    role: 'hall',
    defaultScopeType: 'hall',
    defaultTitle: 'House Tutor',
    typicalTermMonths: 12,
  },
  {
    appointmentType: 'proctor',
    label: 'Proctor',
    description: 'University discipline and campus order (Proctorial body).',
    role: 'proctor',
    defaultScopeType: 'university',
    defaultTitle: 'Proctor',
    typicalTermMonths: 24,
  },
  {
    appointmentType: 'assistant_proctor',
    label: 'Assistant Proctor',
    description: 'Supports the Proctor; common additional duty for teachers.',
    role: 'proctor',
    defaultScopeType: 'university',
    defaultTitle: 'Assistant Proctor',
    typicalTermMonths: 12,
  },
  {
    appointmentType: 'student_advisor',
    label: 'Student Advisor',
    description: 'University or department student welfare and counselling advisor.',
    role: 'advisor',
    defaultScopeType: 'university',
    defaultTitle: 'Student Advisor',
    typicalTermMonths: 12,
  },
  {
    appointmentType: 'dean',
    label: 'Dean of Faculty',
    description: 'Heads a faculty/school; appointed from senior professors.',
    role: 'dean',
    defaultScopeType: 'faculty',
    defaultTitle: 'Dean',
    typicalTermMonths: 36,
  },
  {
    appointmentType: 'director_office',
    label: 'Director / Office in-charge',
    description: 'Acting director of a cell, lab, or central office.',
    role: 'registrar',
    defaultScopeType: 'office',
    defaultTitle: 'Director',
    typicalTermMonths: 24,
  },
  {
    appointmentType: 'other',
    label: 'Other additional duty',
    description: 'Custom appointment with a clear title and scope.',
    role: 'teacher',
    defaultScopeType: 'university',
    defaultTitle: 'Additional Duty',
    typicalTermMonths: 12,
  },
];

const HALL_OPTIONS = [
  'July 06 Hall (Male Hall 1)',
  'Swadhinota Hall (Male Hall 2)',
  'Matribhasha Hall (Female Hall 1)',
  'Ganatantra Hall (Female Hall 2)',
];

const FACULTY_OPTIONS = [
  'Faculty of Engineering and Technology',
  'Faculty of Science',
  'Faculty of Business Studies',
  'Faculty of Humanities and Social Science',
  'Faculty of Life and Earth Science',
];

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function addMonthsIso(isoDate: string, months: number): string {
  const d = new Date(isoDate + 'T12:00:00');
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function formatTerm(a: RoleAssignment): string {
  const from = a.effectiveFrom?.slice(0, 10) || '—';
  const until = a.effectiveUntil?.slice(0, 10);
  return until ? `${from} → ${until}` : `${from} → until further orders`;
}

export interface AssignAdditionalRolesModalProps {
  open: boolean;
  onClose: () => void;
  user: AuthUser;
  departments?: DepartmentRecord[];
  onUpdated?: (user: AuthUser) => void;
}

export function AssignAdditionalRolesModal({
  open,
  onClose,
  user: initialUser,
  departments = [],
  onUpdated,
}: AssignAdditionalRolesModalProps) {
  const [user, setUser] = useState(initialUser);
  const [appointmentType, setAppointmentType] =
    useState<RoleAssignment['appointmentType']>('department_chairman');
  const [title, setTitle] = useState('Chairman');
  const [scopeType, setScopeType] = useState<RoleAssignment['scopeType']>('department');
  const [scopeCode, setScopeCode] = useState('');
  const [scopeName, setScopeName] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(todayIsoDate());
  const [effectiveUntil, setEffectiveUntil] = useState('');
  const [untilFurtherOrders, setUntilFurtherOrders] = useState(false);
  const [orderReference, setOrderReference] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const catalogEntry = useMemo(
    () =>
      APPOINTMENT_CATALOG.find((c) => c.appointmentType === appointmentType) ||
      APPOINTMENT_CATALOG[0],
    [appointmentType]
  );

  const applyCatalogDefaults = useCallback((type: RoleAssignment['appointmentType']) => {
    const entry =
      APPOINTMENT_CATALOG.find((c) => c.appointmentType === type) || APPOINTMENT_CATALOG[0];
    setAppointmentType(type);
    setTitle(entry.defaultTitle);
    setScopeType(entry.defaultScopeType);
    setScopeCode('');
    setScopeName(entry.defaultScopeType === 'university' ? 'University-wide' : '');
    const from = todayIsoDate();
    setEffectiveFrom(from);
    if (entry.typicalTermMonths) {
      setEffectiveUntil(addMonthsIso(from, entry.typicalTermMonths));
      setUntilFurtherOrders(false);
    } else {
      setEffectiveUntil('');
      setUntilFurtherOrders(true);
    }
    setOrderReference('');
    setNotes('');
  }, []);

  useEffect(() => {
    if (!open) return;
    setUser(initialUser);
    setError(null);
    setFeedback(null);
    applyCatalogDefaults('department_chairman');
  }, [open, initialUser, applyCatalogDefaults]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  function applyDepartmentScope(code: string) {
    const dept = departments.find((d) => d.code.toUpperCase() === code.toUpperCase());
    setScopeCode(code.toUpperCase());
    setScopeName(dept ? `Department of ${dept.name}` : code.toUpperCase());
    if (appointmentType === 'department_chairman' && dept) {
      setTitle(`Chairman, Department of ${dept.name}`);
    }
  }

  function applyHallScope(hall: string) {
    setScopeCode(hall);
    setScopeName(hall);
    if (appointmentType === 'hall_provost') setTitle(`Provost, ${hall}`);
    if (appointmentType === 'assistant_provost') setTitle(`Assistant Provost, ${hall}`);
    if (appointmentType === 'house_tutor') setTitle(`House Tutor, ${hall}`);
  }

  function applyFacultyScope(faculty: string) {
    setScopeCode(faculty);
    setScopeName(faculty);
    if (appointmentType === 'dean') setTitle(`Dean, ${faculty}`);
  }

  async function handleAssign(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    if (
      !scopeCode.trim() &&
      (scopeType === 'department' || scopeType === 'hall' || scopeType === 'faculty')
    ) {
      setError('Select the department, hall, or faculty this appointment applies to.');
      return;
    }
    if (!title.trim()) {
      setError('Official appointment title is required.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await pustApi.assignAdditionalRole(user.id, {
        role: catalogEntry.role,
        appointmentType,
        scopeType,
        scopeCode: scopeCode.trim() || undefined,
        scopeName: scopeName.trim() || undefined,
        title: title.trim(),
        effectiveFrom,
        ...(untilFurtherOrders || !effectiveUntil.trim()
          ? {}
          : { effectiveUntil: effectiveUntil.trim() }),
        ...(orderReference.trim() ? { orderReference: orderReference.trim() } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
      setUser(res.user);
      onUpdated?.(res.user);
      setFeedback(
        `Recorded appointment: ${res.assignment.title} (${formatTerm(res.assignment)}). Home department and primary role (${res.user.role}) are unchanged.`
      );
      applyCatalogDefaults(appointmentType);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to record appointment.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(assignmentId: string) {
    setError(null);
    setFeedback(null);
    setRemovingId(assignmentId);
    try {
      const res = await pustApi.removeAdditionalRole(user.id, assignmentId);
      setUser(res.user);
      onUpdated?.(res.user);
      setFeedback('Appointment removed from this account.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove appointment.');
    } finally {
      setRemovingId(null);
    }
  }

  if (!open) return null;

  const assignments = user.additionalRoles || [];
  const activeCount = assignments.filter((a) => a.status !== 'ended').length;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/65 backdrop-blur-[2px] p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-roles-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-2xl border border-stone-200 shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-br from-pust-950 via-pust-900 to-pust-800 text-white px-5 py-4 flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0 space-y-1">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-pust-200">
              Additional duty · office appointment
            </p>
            <h2
              id="assign-roles-title"
              className="font-serif text-lg sm:text-xl font-medium text-white leading-snug flex items-center gap-2"
            >
              <Shield className="w-5 h-5 shrink-0 text-pust-200" />
              Administrative appointments
            </h2>
            <p className="text-xs text-pust-100/90 truncate">
              {user.name} · primary {user.role} · home dept {user.departmentCode}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] px-3.5 py-3 text-slate-700 leading-relaxed space-y-1.5">
            <p>
              <strong>Professional model:</strong> one portal identity per teacher. Home
              department and primary role stay fixed. Chairman, hall provost, proctor, student
              advisor, dean, and similar duties are recorded as <em>time-bound appointments</em>{' '}
              (as on VC/office orders), not as a second login account.
            </p>
            <p className="text-[11px] text-slate-500">
              Typical terms: Hall / Student Advisor ~1 year; Chairman / Dean ~2–3 years; or
              “until further orders.”
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-red-800 flex items-start gap-2"
            >
              <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {feedback && (
            <div
              role="status"
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-emerald-900 flex items-start gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{feedback}</span>
            </div>
          )}

          <div className="rounded-xl border border-stone-200 bg-white p-3 space-y-2">
            <p className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              Current appointments ({activeCount} active)
            </p>
            {assignments.length === 0 ? (
              <p className="text-slate-500">No additional duties yet.</p>
            ) : (
              <ul className="space-y-2">
                {assignments.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-start justify-between gap-2 rounded-lg border border-stone-200 bg-[#FAF9F6] px-3 py-2.5"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <p className="font-semibold text-slate-900">{a.title}</p>
                      <p className="text-slate-600">
                        {a.scopeName || a.scopeCode || a.scopeType}
                        <span className="ml-1.5 font-mono text-[10px] text-slate-500">
                          {a.appointmentType || a.role}
                        </span>
                      </p>
                      <p className="font-mono text-[11px] text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatTerm(a)}
                        {a.status && a.status !== 'active' ? ` · ${a.status}` : ''}
                      </p>
                      {a.orderReference && (
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {a.orderReference}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(a.id)}
                      disabled={removingId === a.id}
                      className="h-8 px-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 transition-colors cursor-pointer shrink-0 inline-flex items-center gap-1 disabled:opacity-60"
                    >
                      {removingId === a.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      End
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form onSubmit={handleAssign} className="space-y-3 border-t border-stone-200 pt-4">
            <p className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Record new appointment
            </p>

            <label className="block space-y-1">
              <span className="font-medium text-slate-700">Appointment type</span>
              <select
                value={appointmentType}
                onChange={(e) =>
                  applyCatalogDefaults(e.target.value as RoleAssignment['appointmentType'])
                }
                className="w-full h-9 px-3 rounded-lg border border-stone-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-pust-800/30 focus:border-pust-800"
              >
                {APPOINTMENT_CATALOG.map((opt) => (
                  <option key={opt.appointmentType} value={opt.appointmentType}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-500 block">{catalogEntry.description}</span>
            </label>

            <label className="block space-y-1">
              <span className="font-medium text-slate-700">Official title (as on order)</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full h-9 px-3 rounded-lg border border-stone-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-pust-800/30 focus:border-pust-800"
              />
            </label>

            {scopeType === 'department' && (
              <label className="block space-y-1">
                <span className="font-medium text-slate-700">Department (scope)</span>
                <select
                  value={scopeCode}
                  onChange={(e) => applyDepartmentScope(e.target.value)}
                  required
                  className="w-full h-9 px-3 rounded-lg border border-stone-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-pust-800/30 focus:border-pust-800"
                >
                  <option value="">Select department…</option>
                  {departments.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.name} ({d.code})
                      {d.code.toUpperCase() === user.departmentCode.toUpperCase()
                        ? ' · home'
                        : ''}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {scopeType === 'hall' && (
              <label className="block space-y-1">
                <span className="font-medium text-slate-700">Residential hall</span>
                <select
                  value={scopeCode}
                  onChange={(e) => applyHallScope(e.target.value)}
                  required
                  className="w-full h-9 px-3 rounded-lg border border-stone-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-pust-800/30 focus:border-pust-800"
                >
                  <option value="">Select hall…</option>
                  {HALL_OPTIONS.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {scopeType === 'faculty' && (
              <label className="block space-y-1">
                <span className="font-medium text-slate-700">Faculty / school</span>
                <select
                  value={scopeCode}
                  onChange={(e) => applyFacultyScope(e.target.value)}
                  required
                  className="w-full h-9 px-3 rounded-lg border border-stone-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-pust-800/30 focus:border-pust-800"
                >
                  <option value="">Select faculty…</option>
                  {FACULTY_OPTIONS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {(scopeType === 'university' || scopeType === 'office') && (
              <label className="block space-y-1">
                <span className="font-medium text-slate-700">
                  {scopeType === 'office' ? 'Office / cell name' : 'Scope label'}
                </span>
                <input
                  type="text"
                  value={scopeName}
                  onChange={(e) => {
                    setScopeName(e.target.value);
                    setScopeCode(e.target.value);
                  }}
                  placeholder={
                    scopeType === 'office' ? 'e.g. Central Laboratory' : 'University-wide'
                  }
                  className="w-full h-9 px-3 rounded-lg border border-stone-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-pust-800/30 focus:border-pust-800"
                />
              </label>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="font-medium text-slate-700">Effective from</span>
                <input
                  type="date"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  required
                  className="w-full h-9 px-3 rounded-lg border border-stone-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-pust-800/30 focus:border-pust-800"
                />
              </label>
              <label className="block space-y-1">
                <span className="font-medium text-slate-700">Effective until</span>
                <input
                  type="date"
                  value={effectiveUntil}
                  onChange={(e) => {
                    setEffectiveUntil(e.target.value);
                    setUntilFurtherOrders(false);
                  }}
                  disabled={untilFurtherOrders}
                  className="w-full h-9 px-3 rounded-lg border border-stone-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-pust-800/30 focus:border-pust-800 disabled:bg-stone-100"
                />
              </label>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={untilFurtherOrders}
                onChange={(e) => {
                  setUntilFurtherOrders(e.target.checked);
                  if (e.target.checked) setEffectiveUntil('');
                }}
                className="rounded border-stone-300 text-pust-900 focus:ring-pust-800"
              />
              <span className="text-slate-700">Until further orders (no fixed end date)</span>
            </label>

            <label className="block space-y-1">
              <span className="font-medium text-slate-700">Office order / memo ref (optional)</span>
              <input
                type="text"
                value={orderReference}
                onChange={(e) => setOrderReference(e.target.value)}
                placeholder="e.g. PUST/Reg/Admin/2026/…"
                className="w-full h-9 px-3 rounded-lg border border-stone-300 bg-white font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-pust-800/30 focus:border-pust-800"
              />
            </label>
            <label className="block space-y-1">
              <span className="font-medium text-slate-700">Notes (optional)</span>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal note for admin record"
                className="w-full h-9 px-3 rounded-lg border border-stone-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-pust-800/30 focus:border-pust-800"
              />
            </label>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-3.5 rounded-lg border border-stone-300 bg-white text-slate-700 hover:bg-stone-50 transition-colors cursor-pointer"
              >
                Done
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="h-9 px-4 rounded-lg bg-pust-900 text-white font-semibold hover:bg-pust-950 disabled:opacity-60 transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    Record appointment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
