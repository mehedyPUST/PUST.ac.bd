'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Building2,
  CheckCircle2,
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

const ADDITIONAL_ROLE_OPTIONS: {
  value: UserRole;
  label: string;
  defaultScopeType: RoleAssignment['scopeType'];
  defaultTitle: string;
}[] = [
  {
    value: 'chairman',
    label: 'Department Chairman',
    defaultScopeType: 'department',
    defaultTitle: 'Department Chairman',
  },
  {
    value: 'hall',
    label: 'Hall Provost / Officer',
    defaultScopeType: 'hall',
    defaultTitle: 'Hall Provost',
  },
  {
    value: 'proctor',
    label: 'Proctorial Officer',
    defaultScopeType: 'university',
    defaultTitle: 'Assistant Proctor',
  },
  {
    value: 'dean',
    label: 'Dean / Faculty Head',
    defaultScopeType: 'faculty',
    defaultTitle: 'Dean',
  },
  {
    value: 'advisor',
    label: 'Student Advisor',
    defaultScopeType: 'department',
    defaultTitle: 'Student Advisor',
  },
  {
    value: 'registrar',
    label: 'Registrar / Office Officer',
    defaultScopeType: 'office',
    defaultTitle: 'Office Officer',
  },
  {
    value: 'library',
    label: 'Library Officer',
    defaultScopeType: 'office',
    defaultTitle: 'Library Officer',
  },
  {
    value: 'vc',
    label: 'VC / Pro-VC assignment',
    defaultScopeType: 'university',
    defaultTitle: 'Pro-Vice-Chancellor',
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
  const [role, setRole] = useState<UserRole>('chairman');
  const [scopeType, setScopeType] = useState<RoleAssignment['scopeType']>('department');
  const [scopeCode, setScopeCode] = useState('');
  const [scopeName, setScopeName] = useState('');
  const [title, setTitle] = useState('Department Chairman');
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setUser(initialUser);
    setError(null);
    setFeedback(null);
    const opt = ADDITIONAL_ROLE_OPTIONS[0];
    setRole(opt.value);
    setScopeType(opt.defaultScopeType);
    setTitle(opt.defaultTitle);
    setScopeCode('');
    setScopeName('');
  }, [open, initialUser]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const roleOption = useMemo(
    () => ADDITIONAL_ROLE_OPTIONS.find((o) => o.value === role) || ADDITIONAL_ROLE_OPTIONS[0],
    [role]
  );

  const handleRoleChange = useCallback((next: UserRole) => {
    const opt = ADDITIONAL_ROLE_OPTIONS.find((o) => o.value === next);
    setRole(next);
    if (opt) {
      setScopeType(opt.defaultScopeType);
      setTitle(opt.defaultTitle);
      setScopeCode('');
      setScopeName('');
    }
  }, []);

  function applyDepartmentScope(code: string) {
    const dept = departments.find((d) => d.code.toUpperCase() === code.toUpperCase());
    setScopeCode(code.toUpperCase());
    setScopeName(dept ? `Department of ${dept.name}` : code.toUpperCase());
  }

  function applyHallScope(hall: string) {
    setScopeCode(hall);
    setScopeName(hall);
  }

  function applyFacultyScope(faculty: string) {
    setScopeCode(faculty);
    setScopeName(faculty);
  }

  async function handleAssign(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    if (!scopeCode.trim() && (scopeType === 'department' || scopeType === 'hall' || scopeType === 'faculty')) {
      setError('Select a department, hall, or faculty for this appointment.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await pustApi.assignAdditionalRole(user.id, {
        role,
        scopeType,
        scopeCode: scopeCode.trim() || undefined,
        scopeName: scopeName.trim() || undefined,
        title: title.trim() || undefined,
      });
      setUser(res.user);
      onUpdated?.(res.user);
      setFeedback(
        `Assigned ${res.assignment.title || res.assignment.role} (${res.assignment.scopeName || res.assignment.scopeCode || res.assignment.scopeType}). Primary role stays ${res.user.role}.`
      );
      setScopeCode('');
      setScopeName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to assign role.');
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
      setFeedback('Additional role removed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove role.');
    } finally {
      setRemovingId(null);
    }
  }

  if (!open) return null;

  const assignments = user.additionalRoles || [];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/65 backdrop-blur-[2px] p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-roles-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl border border-stone-200 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-br from-pust-950 via-pust-900 to-pust-800 text-white px-5 py-4 flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0 space-y-1">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-pust-200">
              Multi-role appointments
            </p>
            <h2
              id="assign-roles-title"
              className="font-serif text-lg sm:text-xl font-medium text-white leading-snug flex items-center gap-2"
            >
              <Shield className="w-5 h-5 shrink-0 text-pust-200" />
              Assign additional roles
            </h2>
            <p className="text-xs text-pust-100/90 truncate">
              {user.name} · primary: {user.role} · {user.departmentCode}
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
          <p className="text-slate-600 leading-relaxed">
            Keep the account as a <strong>teacher</strong> (or other primary role). Add hall provost,
            chairman of another department, proctor, dean, student advisor, and similar appointments
            here without changing the primary login role.
          </p>

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

          <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] p-3 space-y-2">
            <p className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              Current additional roles ({assignments.length})
            </p>
            {assignments.length === 0 ? (
              <p className="text-slate-500">None yet — assign the first appointment below.</p>
            ) : (
              <ul className="space-y-2">
                {assignments.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-start justify-between gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">
                        {a.title || a.role}
                        <span className="ml-1.5 font-mono text-[10px] font-normal text-slate-500">
                          {a.role}
                        </span>
                      </p>
                      <p className="text-slate-600 truncate">
                        {a.scopeName || a.scopeCode || a.scopeType}
                      </p>
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
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form onSubmit={handleAssign} className="space-y-3 border-t border-stone-200 pt-4">
            <p className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Add appointment
            </p>
            <label className="block space-y-1">
              <span className="font-medium text-slate-700">Role</span>
              <select
                value={role}
                onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                className="w-full h-9 px-3 rounded-lg border border-stone-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-pust-800/30 focus:border-pust-800"
              >
                {ADDITIONAL_ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="font-medium text-slate-700">Display title</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={roleOption.defaultTitle}
                className="w-full h-9 px-3 rounded-lg border border-stone-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-pust-800/30 focus:border-pust-800"
              />
            </label>

            {scopeType === 'department' && (
              <label className="block space-y-1">
                <span className="font-medium text-slate-700">Department scope</span>
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
                    </option>
                  ))}
                </select>
              </label>
            )}
            {scopeType === 'hall' && (
              <label className="block space-y-1">
                <span className="font-medium text-slate-700">Hall</span>
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
                <span className="font-medium text-slate-700">Faculty</span>
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
                <span className="font-medium text-slate-700">Scope label (optional)</span>
                <input
                  type="text"
                  value={scopeName}
                  onChange={(e) => {
                    setScopeName(e.target.value);
                    setScopeCode(e.target.value);
                  }}
                  placeholder={scopeType === 'university' ? 'University-wide' : 'Office name'}
                  className="w-full h-9 px-3 rounded-lg border border-stone-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-pust-800/30 focus:border-pust-800"
                />
              </label>
            )}

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
                    Assigning…
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    Assign role
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
