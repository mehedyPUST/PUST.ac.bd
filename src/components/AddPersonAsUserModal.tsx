'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  RefreshCw,
  Shield,
  UserPlus,
  X,
  XCircle,
} from 'lucide-react';
import { pustApi } from '../lib/api';
import type { PersonRoleCategory } from '../lib/departmentPeople';
import type {
  ApprovalStatus,
  AuthUser,
  DepartmentPersonRecord,
  DepartmentRecord,
  UserRole,
} from '../types/pust';
import { AssignAdditionalRolesModal } from './AssignAdditionalRolesModal';
import { usePust } from './PustContext';

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'teacher', label: 'Faculty / Teacher (recommended primary)' },
  { value: 'chairman', label: 'Department Chairman (primary — prefer additional role instead)' },
  { value: 'registrar', label: 'Office / Registrar Officer' },
  { value: 'proctor', label: 'Proctorial Officer' },
  { value: 'library', label: 'Library Officer' },
  { value: 'hall', label: 'Hall Provost / Officer' },
  { value: 'dean', label: 'Dean' },
  { value: 'advisor', label: 'Student Advisor' },
  { value: 'vc', label: 'Vice-Chancellor / Pro-VC' },
];

function generateTempLoginToken(): string {
  const pool = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i += 1) {
    suffix += pool[Math.floor(Math.random() * pool.length)];
  }
  return `PUST-TMP-${suffix}`;
}

function roleCategoryToGroup(
  roleCategory: PersonRoleCategory
): 'faculty' | 'contractual' | 'officer' {
  if (roleCategory === 'Department Officer') return 'officer';
  if (roleCategory === 'Faculty Member (Contractual)') return 'contractual';
  return 'faculty';
}

function defaultRoleForCategory(roleCategory: PersonRoleCategory): UserRole {
  // Faculty / chairman profiles: primary account is always teacher;
  // chairman, hall, proctor, dean, advisor, etc. are assigned as additional roles.
  if (roleCategory === 'Department Officer') return 'registrar';
  return 'teacher';
}

export interface AddPersonAsUserModalProps {
  open: boolean;
  onClose: () => void;
  person: DepartmentPersonRecord;
  department: DepartmentRecord;
  roleCategory: PersonRoleCategory;
  onCreated?: (user: AuthUser) => void;
}

export function AddPersonAsUserModal({
  open,
  onClose,
  person,
  department,
  roleCategory,
  onCreated,
}: AddPersonAsUserModalProps) {
  const { departments: ctxDepartments } = usePust();
  const group = roleCategoryToGroup(roleCategory);
  const deptCode = (department.code || '').trim().toUpperCase();
  // Prefer the real chairmanProfile.id when the UI resolved a synthetic `${dept.id}-chair` person
  const claimMemberId = (() => {
    const rawId = (person.id || '').trim();
    if (
      roleCategory === 'Chairman' &&
      department.chairmanProfile?.id &&
      (rawId === `${department.id}-chair` || rawId === department.chairmanProfile.id)
    ) {
      return department.chairmanProfile.id;
    }
    return rawId;
  })();

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [name, setName] = useState(person.name);
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState(person.designation || '');
  const [role, setRole] = useState<UserRole>(defaultRoleForCategory(roleCategory));
  const [academicId, setAcademicId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(true);
  const [hallAffiliation, setHallAffiliation] = useState('');
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>('approved');
  const [courses, setCourses] = useState('');
  const [sessions, setSessions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [issuedSecret, setIssuedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [createdUser, setCreatedUser] = useState<AuthUser | null>(null);
  const [assignRolesOpen, setAssignRolesOpen] = useState(false);

  const claimedBy = useMemo(() => {
    return (
      users.find(
        (u) =>
          (u.claimedFacultyMemberId === claimMemberId ||
            u.claimedFacultyMemberId === person.id) &&
          (u.claimedDepartmentCode || u.departmentCode || '').toUpperCase() === deptCode
      ) || null
    );
  }, [users, claimMemberId, person.id, deptCode]);

  const resetForm = useCallback(() => {
    const primaryEmail = (person.emails?.[0]?.value || '').trim();
    const isOfficer = group === 'officer';
    const existingCount = users.filter((u) => {
      const userDept = (u.departmentCode || '').toString().trim().toUpperCase();
      if (userDept !== deptCode) return false;
      return isOfficer
        ? u.role !== 'student' && u.role !== 'teacher' && u.role !== 'chairman'
        : u.role === 'teacher' || u.role === 'chairman';
    }).length;
    const suggestedId = isOfficer
      ? `PUST-${deptCode}-OFF-${String(existingCount + 1).padStart(2, '0')}`
      : `PUST-${deptCode}-FAC-${String(existingCount + 1).padStart(2, '0')}`;
    const hall = (
      person.officeLocation ||
      department.building ||
      'Academic Block'
    ).trim();

    setName(person.name);
    setEmail(primaryEmail);
    setDesignation(
      person.designation || (isOfficer ? 'Department Officer' : 'Faculty Member')
    );
    setRole(defaultRoleForCategory(roleCategory));
    setAcademicId(suggestedId);
    setPassword(generateTempLoginToken());
    setShowPassword(true);
    setMustChangePassword(true);
    setHallAffiliation(hall.length >= 2 ? hall : 'Academic Block');
    setApprovalStatus('approved');
    setCourses('');
    setSessions('');
    setError(
      primaryEmail
        ? null
        : 'This directory profile has no email on file. Enter a valid institutional email before creating the portal account.'
    );
    setFeedback(null);
    setIssuedSecret(null);
    setCopied(false);
  }, [person, department, roleCategory, group, deptCode, users]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingUsers(true);
    setError(null);
    setFeedback(null);
    setIssuedSecret(null);
    pustApi
      .getUsers()
      .then((res) => {
        if (cancelled) return;
        setUsers(Array.isArray(res.users) ? res.users : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Unable to load existing portal users.');
        setUsers([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingUsers(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, person.id]);

  useEffect(() => {
    if (!open || loadingUsers) return;
    resetForm();
  }, [open, loadingUsers, resetForm]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFeedback(null);

    if (claimedBy) {
      setError(
        `This profile is already linked to ${claimedBy.name} (${claimedBy.email} · ${claimedBy.academicId}).`
      );
      return;
    }

    if (password.length < 8) {
      setError('Initial password must be at least 8 characters.');
      return;
    }
    const emailTrimmed = email.trim();
    if (!emailTrimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      setError('A valid institutional email is required to create the portal account.');
      return;
    }
    const hallTrimmed = hallAffiliation.trim();
    if (hallTrimmed.length < 2) {
      setError('Office / building affiliation must be at least 2 characters.');
      return;
    }

    const isOfficer = group === 'officer';
    const canLink =
      isOfficer
        ? role !== 'student' && role !== 'admin'
        : role === 'teacher' || role === 'chairman';
    if (!canLink) {
      setError(
        isOfficer
          ? 'Linked officer profiles require a non-student, non-admin portal role.'
          : 'Linked faculty profiles require Teacher or Department Chairman role.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const assignedCourses =
        role === 'teacher'
          ? courses
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [];
      const assignedSessions =
        role === 'teacher'
          ? sessions
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [];

      const secret = password;
      const res = await pustApi.createAdminUser({
        name: name.trim(),
        email: emailTrimmed,
        password: secret,
        role,
        departmentCode: deptCode,
        academicId: academicId.trim(),
        hallAffiliation: hallTrimmed,
        officeCode: deptCode,
        officeName: `Department of ${department.name}`,
        designation: designation.trim() || undefined,
        approvalStatus,
        assignedCourses,
        assignedSessions,
        mustChangePassword,
        claimedFacultyMemberId: claimMemberId,
        claimedDepartmentCode: deptCode,
        claimedFacultyGroup: group,
      });

      setIssuedSecret(secret);
      setCreatedUser(res.user);
      setFeedback(
        `Added ${res.user.name} as ${ROLE_OPTIONS.find((r) => r.value === res.user.role)?.label || res.user.role} and linked to this directory profile.${mustChangePassword ? ' First-login password change is required.' : ''} You can now assign additional roles (hall provost, other-dept chairman, proctor, dean, advisor, …).`
      );
      onCreated?.(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create portal account.');
    } finally {
      setSubmitting(false);
    }
  }

  async function copyCredentials() {
    if (!issuedSecret) return;
    const text = `Name: ${name.trim()}\nEmail: ${email.trim()}\nAcademic ID: ${academicId.trim()}\nTemporary password: ${issuedSecret}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy to clipboard.');
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/65 backdrop-blur-[2px] p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-person-as-user-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl border border-stone-200 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-br from-pust-900 via-pust-800 to-pust-700 text-white px-5 py-4 flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0 space-y-1">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-pust-200">
              Create portal account · {department.code} · {roleCategory}
            </p>
            <h2
              id="add-person-as-user-title"
              className="font-serif text-lg sm:text-xl font-medium text-white leading-snug flex items-center gap-2"
            >
              <UserPlus className="w-5 h-5 shrink-0 text-pust-200" />
              <span className="truncate">Add as site user</span>
            </h2>
            <p className="text-xs text-pust-100/90 truncate">{person.name}</p>
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
          {loadingUsers ? (
            <p className="text-slate-600 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Checking existing portal accounts…
            </p>
          ) : claimedBy ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 space-y-2">
              <p className="font-semibold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Already linked to a portal account
              </p>
              <p className="text-emerald-900">{claimedBy.name}</p>
              <p className="font-mono text-[11px] text-emerald-700 break-all">
                {claimedBy.email} · {claimedBy.academicId} · primary: {claimedBy.role}
              </p>
              {(claimedBy.additionalRoles || []).length > 0 && (
                <p className="text-[11px] text-emerald-800">
                  Additional:{' '}
                  {(claimedBy.additionalRoles || [])
                    .map((a) => a.title || a.role)
                    .join(', ')}
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  setCreatedUser(claimedBy);
                  setAssignRolesOpen(true);
                }}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-emerald-300 bg-white text-emerald-900 hover:bg-emerald-100 transition-colors cursor-pointer font-semibold"
              >
                <Shield className="w-3.5 h-3.5" />
                Assign additional roles
              </button>
            </div>
          ) : null}

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
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-emerald-900 space-y-2"
            >
              <p className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{feedback}</span>
              </p>
              {issuedSecret && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <code className="font-mono text-[11px] bg-white/80 border border-emerald-200 rounded-lg px-2 py-1 break-all">
                    {issuedSecret}
                  </code>
                  <button
                    type="button"
                    onClick={copyCredentials}
                    className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-emerald-300 bg-white text-emerald-900 hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy credentials'}
                  </button>
                </div>
              )}
            </div>
          )}

          {!claimedBy && !issuedSecret && (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1 sm:col-span-2">
                  <span className="font-medium text-slate-700">Full name</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full h-9 px-3 rounded-lg border border-stone-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-pust-800/30 focus:border-pust-800"
                  />
                </label>
                <label className="block space-y-1 sm:col-span-2">
                  <span className="font-medium text-slate-700">Institutional email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@pust.ac.bd"
                    className="w-full h-9 px-3 rounded-lg border border-stone-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-pust-800/30 focus:border-pust-800"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="font-medium text-slate-700">Designation</span>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-stone-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-pust-800/30 focus:border-pust-800"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="font-medium text-slate-700">Portal role</span>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full h-9 px-3 rounded-lg border border-stone-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-pust-800/30 focus:border-pust-800"
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1">
                  <span className="font-medium text-slate-700">Academic / staff ID</span>
                  <input
                    type="text"
                    value={academicId}
                    onChange={(e) => setAcademicId(e.target.value)}
                    required
                    className="w-full h-9 px-3 rounded-lg border border-stone-300 bg-white font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-pust-800/30 focus:border-pust-800"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="font-medium text-slate-700">Office / building</span>
                  <input
                    type="text"
                    value={hallAffiliation}
                    onChange={(e) => setHallAffiliation(e.target.value)}
                    required
                    className="w-full h-9 px-3 rounded-lg border border-stone-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-pust-800/30 focus:border-pust-800"
                  />
                </label>
                <label className="block space-y-1 sm:col-span-2">
                  <span className="font-medium text-slate-700 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" />
                    Temporary password / login token
                  </span>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        className="w-full h-9 px-3 pr-10 rounded-lg border border-stone-300 bg-white font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-pust-800/30 focus:border-pust-800"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPassword(generateTempLoginToken());
                        setShowPassword(true);
                      }}
                      className="h-9 px-3 rounded-lg border border-stone-300 bg-[#FAF9F6] text-slate-800 hover:border-pust-700 hover:text-pust-800 transition-colors cursor-pointer shrink-0"
                      title="Generate temporary token"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </label>
                <label className="flex items-center gap-2 sm:col-span-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mustChangePassword}
                    onChange={(e) => setMustChangePassword(e.target.checked)}
                    className="rounded border-stone-300 text-pust-900 focus:ring-pust-800"
                  />
                  <span className="text-slate-700">Require password change on first login</span>
                </label>
                <label className="block space-y-1">
                  <span className="font-medium text-slate-700">Approval status</span>
                  <select
                    value={approvalStatus}
                    onChange={(e) => setApprovalStatus(e.target.value as ApprovalStatus)}
                    className="w-full h-9 px-3 rounded-lg border border-stone-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-pust-800/30 focus:border-pust-800"
                  >
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </label>
                {role === 'teacher' && (
                  <>
                    <label className="block space-y-1 sm:col-span-2">
                      <span className="font-medium text-slate-700">
                        Assigned courses (comma-separated)
                      </span>
                      <input
                        type="text"
                        value={courses}
                        onChange={(e) => setCourses(e.target.value)}
                        placeholder="e.g. PHAR 1101, PHAR 1203"
                        className="w-full h-9 px-3 rounded-lg border border-stone-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-pust-800/30 focus:border-pust-800"
                      />
                    </label>
                    <label className="block space-y-1 sm:col-span-2">
                      <span className="font-medium text-slate-700">
                        Assigned sessions (comma-separated)
                      </span>
                      <input
                        type="text"
                        value={sessions}
                        onChange={(e) => setSessions(e.target.value)}
                        placeholder="e.g. 2022-23, 2023-24"
                        className="w-full h-9 px-3 rounded-lg border border-stone-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-pust-800/30 focus:border-pust-800"
                      />
                    </label>
                  </>
                )}
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Create the <strong>primary</strong> account first (usually Teacher). After
                creation you can assign hall provost, chairman of another department, proctor,
                dean, student advisor, and other appointments without changing the primary role.
                Linked to profile <span className="font-mono">{claimMemberId}</span> · unit{' '}
                <strong>
                  {department.name} ({deptCode})
                </strong>
                .
              </p>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-9 px-3.5 rounded-lg border border-stone-300 bg-white text-slate-700 hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || loadingUsers}
                  className="h-9 px-4 rounded-lg bg-pust-700 text-white font-semibold hover:bg-pust-800 disabled:opacity-60 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Creating…
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      Create site user
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {(claimedBy || issuedSecret) && (
            <div className="flex flex-wrap justify-end gap-2 pt-1">
              {(createdUser || claimedBy) && (
                <button
                  type="button"
                  onClick={() => {
                    setCreatedUser(createdUser || claimedBy);
                    setAssignRolesOpen(true);
                  }}
                  className="h-9 px-3.5 rounded-lg border border-pust-700 text-pust-800 bg-white font-semibold hover:bg-pust-50 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Assign additional roles
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-4 rounded-lg bg-pust-700 text-white font-semibold hover:bg-pust-800 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>

      {assignRolesOpen && (createdUser || claimedBy) && (
        <AssignAdditionalRolesModal
          open={true}
          onClose={() => setAssignRolesOpen(false)}
          user={(createdUser || claimedBy)!}
          departments={
            ctxDepartments?.length
              ? ctxDepartments
              : [department]
          }
          onUpdated={(u) => {
            setCreatedUser(u);
            onCreated?.(u);
          }}
        />
      )}
    </div>
  );
}
