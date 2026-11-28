'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Edit3,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  RefreshCw,
  ScrollText,
  Search,
  Ticket,
  UserCheck,
  UserPlus,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { pustApi } from '../../lib/api';
import { AdminFacultyRequestsPanel } from './AdminFacultyRequestsPanel';
import type {
  ApprovalStatus,
  AuditLogRecord,
  AuthUser,
  DepartmentRecord,
  SignupTokenRecord,
} from '../../types/pust';

export type DepartmentPeopleSection = 'teachers' | 'faculty-requests' | 'students' | 'activity';

interface DepartmentPeoplePanelProps {
  currentUser: AuthUser;
  departments: DepartmentRecord[];
  initialSection?: DepartmentPeopleSection | null;
  onConsumeInitialSection?: () => void;
  onUsersChanged?: () => void;
  onCmsChange?: () => Promise<void>;
  onPendingFacultyRequestsChange?: (count: number) => void;
}

const PUST_HALL_OPTIONS = [
  'July 06 Hall (Male Hall 1)',
  'Swadhinota Hall (Male Hall 2)',
  'Matribhasha Hall (Female Hall 1)',
  'Ganatantra Hall (Female Hall 2)',
  'Non-Resident / Academic Block',
];

function generateStrongPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '@#$%&*';
  const all = upper + lower + digits + symbols;
  const pick = (pool: string) => pool[Math.floor(Math.random() * pool.length)];
  const chars = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  while (chars.length < 12) chars.push(pick(all));
  return chars.sort(() => Math.random() - 0.5).join('');
}

function formatDateTime(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DepartmentPeoplePanel({
  currentUser,
  departments,
  initialSection,
  onConsumeInitialSection,
  onUsersChanged,
  onCmsChange,
  onPendingFacultyRequestsChange,
}: DepartmentPeoplePanelProps) {
  const deptCode = currentUser.departmentCode.toUpperCase();
  const departmentObj = useMemo(
    () => departments.find((d) => d.code.toUpperCase() === deptCode) || null,
    [departments, deptCode]
  );
  const deptTitle = departmentObj ? `${departmentObj.name} (${deptCode})` : `Department of ${deptCode}`;
  const defaultBuilding = departmentObj?.building || 'Academic Building';

  const [activeSection, setActiveSection] = useState<DepartmentPeopleSection>(
    initialSection || 'teachers'
  );
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [tokens, setTokens] = useState<SignupTokenRecord[]>([]);
  const [activityLogs, setActivityLogs] = useState<AuditLogRecord[]>([]);
  const [pendingFacultyCount, setPendingFacultyCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  // Filters
  const [teacherSearch, setTeacherSearch] = useState('');
  const [teacherStatusFilter, setTeacherStatusFilter] = useState<'all' | ApprovalStatus>('all');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentSessionFilter, setStudentSessionFilter] = useState('ALL');
  const [studentStatusFilter, setStudentStatusFilter] = useState<'all' | ApprovalStatus>('all');
  const [activitySearch, setActivitySearch] = useState('');

  // Modal: Create Teacher
  const [showCreateTeacherModal, setShowCreateTeacherModal] = useState(false);
  const [tName, setTName] = useState('');
  const [tDesignation, setTDesignation] = useState('Lecturer');
  const [tEmail, setTEmail] = useState('');
  const [tAcademicId, setTAcademicId] = useState('');
  const [tBuilding, setTBuilding] = useState(defaultBuilding);
  const [tPassword, setTPassword] = useState('');
  const [showTPassword, setShowTPassword] = useState(false);
  const [tStatus, setTStatus] = useState<ApprovalStatus>('approved');
  const [tCourses, setTCourses] = useState('');
  const [tSessions, setTSessions] = useState('');
  const [creatingTeacher, setCreatingTeacher] = useState(false);

  // Modal: Create Student
  const [showCreateStudentModal, setShowCreateStudentModal] = useState(false);
  const [sName, setSName] = useState('');
  const [sEmail, setSEmail] = useState('');
  const [sAcademicId, setSAcademicId] = useState('');
  const [sSession, setSSession] = useState('2025-26');
  const [sHall, setSHall] = useState(PUST_HALL_OPTIONS[0]);
  const [sPassword, setSPassword] = useState('');
  const [showSPassword, setShowSPassword] = useState(false);
  const [sStatus, setSStatus] = useState<ApprovalStatus>('approved');
  const [creatingStudent, setCreatingStudent] = useState(false);

  // Modal: Issue Signup Token
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokName, setTokName] = useState('');
  const [tokEmail, setTokEmail] = useState('');
  const [tokPhone, setTokPhone] = useState('');
  const [tokAcademicId, setTokAcademicId] = useState('');
  const [tokSession, setTokSession] = useState('2025-26');
  const [tokHall, setTokHall] = useState(PUST_HALL_OPTIONS[0]);
  const [creatingToken, setCreatingToken] = useState(false);

  // Modal: Edit Teacher or Student
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAcademicId, setEditAcademicId] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editSession, setEditSession] = useState('');
  const [editHall, setEditHall] = useState('');
  const [editStatus, setEditStatus] = useState<ApprovalStatus>('approved');
  const [editCourses, setEditCourses] = useState('');
  const [editSessions, setEditSessions] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Modal: Reset Password
  const [passwordTarget, setPasswordTarget] = useState<AuthUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, tokensRes, reqRes] = await Promise.all([
        pustApi.getUsers(),
        pustApi.getSignupTokens(),
        pustApi.getAdminFacultyProfileRequests().catch(() => ({ requests: [] })),
      ]);
      setUsers(usersRes.users);
      setTokens(tokensRes.tokens);
      const pendingCount = reqRes.requests.filter((r) => r.status === 'pending').length;
      setPendingFacultyCount(pendingCount);
      onPendingFacultyRequestsChange?.(pendingCount);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Unable to load ${deptCode} teachers, students, and onboarding records.`
      );
    } finally {
      setLoading(false);
    }
  }, [deptCode, onPendingFacultyRequestsChange]);

  const loadLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const res = await pustApi.getAuditLogs({ limit: 80 });
      setActivityLogs(res.logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load department activity log.');
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeSection === 'activity') {
      void loadLogs();
    }
  }, [activeSection, loadLogs]);

  useEffect(() => {
    if (!initialSection) return;
    setActiveSection(initialSection);
    onConsumeInitialSection?.();
  }, [initialSection, onConsumeInitialSection]);

  // Escape closes any active modal
  useEffect(() => {
    const anyModal =
      showCreateTeacherModal ||
      showCreateStudentModal ||
      showTokenModal ||
      Boolean(editingUser) ||
      Boolean(passwordTarget);
    if (!anyModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setShowCreateTeacherModal(false);
      setShowCreateStudentModal(false);
      setShowTokenModal(false);
      setEditingUser(null);
      setPasswordTarget(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    showCreateTeacherModal,
    showCreateStudentModal,
    showTokenModal,
    editingUser,
    passwordTarget,
  ]);

  const teachers = useMemo(
    () =>
      users
        .filter((u) => u.role === 'teacher')
        .sort((a, b) => {
          if (a.approvalStatus === 'pending' && b.approvalStatus !== 'pending') return -1;
          if (b.approvalStatus === 'pending' && a.approvalStatus !== 'pending') return 1;
          return a.name.localeCompare(b.name);
        }),
    [users]
  );

  const students = useMemo(
    () =>
      users
        .filter((u) => u.role === 'student')
        .sort((a, b) => {
          if (a.approvalStatus === 'pending' && b.approvalStatus !== 'pending') return -1;
          if (b.approvalStatus === 'pending' && a.approvalStatus !== 'pending') return 1;
          return a.name.localeCompare(b.name);
        }),
    [users]
  );

  const pendingAccountsCount = useMemo(
    () => users.filter((u) => u.approvalStatus === 'pending').length,
    [users]
  );

  const availableSessions = useMemo(() => {
    const set = new Set<string>();
    for (const s of students) {
      if (s.session) set.add(s.session);
    }
    for (const t of tokens) {
      if (t.session) set.add(t.session);
    }
    return Array.from(set).sort().reverse();
  }, [students, tokens]);

  const filteredTeachers = useMemo(() => {
    const q = teacherSearch.trim().toLowerCase();
    return teachers.filter((t) => {
      if (teacherStatusFilter !== 'all' && t.approvalStatus !== teacherStatusFilter) return false;
      if (!q) return true;
      const hay = [
        t.name,
        t.email,
        t.academicId,
        t.designation || '',
        ...(t.assignedCourses || []),
        ...(t.assignedSessions || []),
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [teachers, teacherSearch, teacherStatusFilter]);

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    return students.filter((s) => {
      if (studentStatusFilter !== 'all' && s.approvalStatus !== studentStatusFilter) return false;
      if (studentSessionFilter !== 'ALL' && (s.session || '') !== studentSessionFilter) {
        return false;
      }
      if (!q) return true;
      const hay = [s.name, s.email, s.academicId, s.session || '', s.hallAffiliation]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [students, studentSearch, studentSessionFilter, studentStatusFilter]);

  const filteredTokens = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    return tokens.filter((t) => {
      if (studentSessionFilter !== 'ALL' && t.session !== studentSessionFilter) return false;
      if (!q) return true;
      const hay = [t.token, t.studentName, t.studentEmail, t.academicId, t.session, t.hallAffiliation]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [tokens, studentSearch, studentSessionFilter]);

  const filteredLogs = useMemo(() => {
    const q = activitySearch.trim().toLowerCase();
    if (!q) return activityLogs;
    return activityLogs.filter((entry) =>
      [entry.actorName, entry.actorRole, entry.action, entry.target, entry.details || '']
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [activityLogs, activitySearch]);

  function openCreateTeacher() {
    setError(null);
    setFeedback(null);
    setTName('');
    setTDesignation('Lecturer');
    setTEmail('');
    setTAcademicId('');
    setTBuilding(defaultBuilding);
    setTPassword('');
    setShowTPassword(false);
    setTStatus('approved');
    setTCourses('');
    setTSessions('');
    setShowCreateTeacherModal(true);
  }

  function openCreateStudent() {
    setError(null);
    setFeedback(null);
    setSName('');
    setSEmail('');
    setSAcademicId('');
    setSSession('2025-26');
    setSHall(PUST_HALL_OPTIONS[0]);
    setSPassword('');
    setShowSPassword(false);
    setSStatus('approved');
    setShowCreateStudentModal(true);
  }

  function openIssueToken() {
    setError(null);
    setFeedback(null);
    setTokName('');
    setTokEmail('');
    setTokPhone('');
    setTokAcademicId('');
    setTokSession('2025-26');
    setTokHall(PUST_HALL_OPTIONS[0]);
    setShowTokenModal(true);
  }

  function openEditModal(u: AuthUser) {
    setError(null);
    setFeedback(null);
    setEditingUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditAcademicId(u.academicId);
    setEditDesignation(u.designation || '');
    setEditSession(u.session || '2025-26');
    setEditHall(u.hallAffiliation);
    setEditStatus(u.approvalStatus);
    setEditCourses((u.assignedCourses || []).join(', '));
    setEditSessions((u.assignedSessions || []).join(', '));
  }

  async function handleCreateTeacher(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    if (tPassword.length < 8) {
      setError('Initial password must be at least 8 characters.');
      return;
    }
    setCreatingTeacher(true);
    try {
      const courses = tCourses
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
      const sessions = tSessions
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await pustApi.createAdminUser({
        name: tName.trim(),
        email: tEmail.trim(),
        password: tPassword,
        role: 'teacher',
        departmentCode: deptCode,
        academicId: tAcademicId.trim(),
        hallAffiliation: tBuilding.trim() || defaultBuilding,
        officeName: `Department of ${deptCode}`,
        designation: tDesignation.trim() || 'Lecturer',
        approvalStatus: tStatus,
        assignedCourses: courses,
        assignedSessions: sessions,
      });
      setShowCreateTeacherModal(false);
      setFeedback(`Provisioned ${deptCode} teacher account for ${res.user.name} (${res.user.email}).`);
      await loadData();
      onUsersChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create teacher account.');
    } finally {
      setCreatingTeacher(false);
    }
  }

  async function handleCreateStudent(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    if (sPassword.length < 8) {
      setError('Initial password must be at least 8 characters.');
      return;
    }
    setCreatingStudent(true);
    try {
      const res = await pustApi.createAdminUser({
        name: sName.trim(),
        email: sEmail.trim(),
        password: sPassword,
        role: 'student',
        departmentCode: deptCode,
        academicId: sAcademicId.trim(),
        session: sSession.trim() || '2025-26',
        hallAffiliation: sHall,
        approvalStatus: sStatus,
      });
      setShowCreateStudentModal(false);
      setFeedback(
        `Created ${deptCode} student account for ${res.user.name} (ID ${res.user.academicId}).`
      );
      await loadData();
      onUsersChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create student account.');
    } finally {
      setCreatingStudent(false);
    }
  }

  async function handleIssueToken(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    setCreatingToken(true);
    try {
      const res = await pustApi.createSignupToken({
        studentName: tokName.trim(),
        studentEmail: tokEmail.trim(),
        studentPhone: tokPhone.trim(),
        departmentCode: deptCode,
        session: tokSession.trim(),
        academicId: tokAcademicId.trim(),
        hallAffiliation: tokHall,
      });
      setShowTokenModal(false);
      setFeedback(
        `Issued single-use onboarding token ${res.token.token} for ${res.token.studentName} (${res.token.academicId}).`
      );
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to issue signup token.');
    } finally {
      setCreatingToken(false);
    }
  }

  async function handleSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setError(null);
    setFeedback(null);
    setSavingEdit(true);
    try {
      const courses = editCourses
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
      const sessions = editSessions
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await pustApi.updateAdminUser(editingUser.id, {
        name: editName.trim(),
        email: editEmail.trim(),
        academicId: editAcademicId.trim(),
        hallAffiliation: editHall.trim(),
        approvalStatus: editStatus,
        ...(editingUser.role === 'teacher'
          ? {
              designation: editDesignation.trim(),
              assignedCourses: courses,
              assignedSessions: sessions,
            }
          : {
              session: editSession.trim(),
            }),
      });
      setEditingUser(null);
      setFeedback(`Updated ${res.user.role} account for ${res.user.name}.`);
      await loadData();
      onUsersChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update department account.');
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleQuickStatus(u: AuthUser, nextStatus: 'approved' | 'rejected') {
    setError(null);
    setFeedback(null);
    setBusyUserId(u.id);
    try {
      await pustApi.approveUser(u.id, nextStatus);
      setFeedback(
        nextStatus === 'approved'
          ? `Approved ${u.name} (${u.role}) for ${deptCode} portal access.`
          : `Suspended ${u.name} (${u.role}) portal access.`
      );
      await loadData();
      onUsersChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update account status.');
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    if (!passwordTarget) return;
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    setError(null);
    setFeedback(null);
    setSavingPassword(true);
    try {
      await pustApi.resetAdminUserPassword(passwordTarget.id, newPassword);
      setFeedback(`Password updated for ${passwordTarget.name} (${passwordTarget.email}).`);
      setPasswordTarget(null);
      setNewPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset user password.');
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleCopyToken(tok: SignupTokenRecord) {
    try {
      await navigator.clipboard.writeText(tok.token);
      setCopiedTokenId(tok.id);
      window.setTimeout(() => {
        setCopiedTokenId((cur) => (cur === tok.id ? null : cur));
      }, 2000);
    } catch {
      setFeedback(`Signup token: ${tok.token}`);
    }
  }

  return (
    <div className="space-y-6">
      {/* Feedback & Error Alerts */}
      {feedback && (
        <div
          role="status"
          className="px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-medium text-emerald-900 flex items-center justify-between gap-3"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{feedback}</span>
          </span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-emerald-700 hover:text-emerald-950 cursor-pointer shrink-0"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-xs font-medium text-red-900 flex items-center justify-between gap-3"
        >
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
            <span>{error}</span>
          </span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-700 hover:text-red-950 cursor-pointer shrink-0"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header + 4-Column KPI Strip + Segmented Section Switcher */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-200 pb-4">
          <div className="space-y-1">
            <p className="font-mono text-[11px] font-semibold text-pust-800 uppercase tracking-wider">
              Department Account Governance · {deptTitle}
            </p>
            <h2 className="font-serif text-xl sm:text-2xl font-medium text-slate-950">
              {deptCode} Teachers, Students &amp; Profile Approvals
            </h2>
            <p className="text-xs text-slate-600 max-w-3xl">
              Provision and manage faculty and student accounts strictly within {deptCode}, assign teaching courses, issue single-use admission tokens, and publish verified faculty directory updates. Permanent account deletions and cross-department transfers remain under Central University Admin.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              void loadData();
              if (activeSection === 'activity') void loadLogs();
            }}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-stone-300 bg-[#F7F7F5] text-slate-700 hover:border-pust-800 hover:text-slate-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 self-start lg:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh {deptCode} Directory</span>
          </button>
        </div>

        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] px-4 py-3">
            <dt className="text-[11px] font-medium text-slate-600">Department Teachers</dt>
            <dd className="font-mono text-2xl font-semibold text-slate-950 tabular-nums mt-0.5">
              {teachers.length}
            </dd>
          </div>
          <div className="rounded-xl border border-stone-200 bg-[#FBF6EE] px-4 py-3">
            <dt className="text-[11px] font-medium text-slate-600">Pending Profile Edits</dt>
            <dd className="font-mono text-2xl font-semibold text-amber-800 tabular-nums mt-0.5">
              {pendingFacultyCount}
            </dd>
          </div>
          <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] px-4 py-3">
            <dt className="text-[11px] font-medium text-slate-600">Department Students</dt>
            <dd className="font-mono text-2xl font-semibold text-pust-900 tabular-nums mt-0.5">
              {students.length}
            </dd>
          </div>
          <div className="rounded-xl border border-stone-200 bg-[#F5F7FA] px-4 py-3">
            <dt className="text-[11px] font-medium text-slate-600">Pending Account Approvals</dt>
            <dd className="font-mono text-2xl font-semibold text-slate-950 tabular-nums mt-0.5">
              {pendingAccountsCount}
            </dd>
          </div>
        </dl>

        {/* Sub-view Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-stone-100 border border-stone-200">
            <button
              type="button"
              onClick={() => setActiveSection('teachers')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSection === 'teachers'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Teachers ({teachers.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('faculty-requests')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSection === 'faculty-requests'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>
                Faculty Profile Approvals
                {pendingFacultyCount > 0 ? ` (${pendingFacultyCount} Pending)` : ''}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('students')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSection === 'students'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Students &amp; Tokens ({students.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('activity')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSection === 'activity'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ScrollText className="w-3.5 h-3.5" />
              <span>Department Activity</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: TEACHERS */}
      {activeSection === 'teachers' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-stone-200 pb-4">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative w-full sm:w-80">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                  placeholder={`Search ${deptCode} teachers by name, email, ID, course...`}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                />
              </div>

              <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-stone-100 border border-stone-200">
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'approved', label: 'Approved' },
                    { id: 'pending', label: 'Pending' },
                    { id: 'rejected', label: 'Suspended' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTeacherStatusFilter(item.id)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      teacherStatusFilter === item.id
                        ? 'bg-white text-slate-950 shadow-xs'
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={openCreateTeacher}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-pust-900 text-white hover:bg-pust-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start lg:self-auto"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add {deptCode} Teacher</span>
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((row) => (
                <div
                  key={row}
                  className="h-12 rounded-xl bg-stone-100 animate-pulse border border-stone-200"
                />
              ))}
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] p-8 text-center space-y-2">
              <Users className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="text-sm font-medium text-slate-900">
                No {deptCode} teacher accounts match the current filter
              </p>
              <p className="text-xs text-slate-600">
                Create a faculty account directly for your department or clear active search filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-stone-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F7F7F5] border-b border-stone-200 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3 w-12 font-mono">S.N</th>
                    <th className="py-2.5 px-3">Teacher &amp; Contact</th>
                    <th className="py-2.5 px-3">ID &amp; Directory Link</th>
                    <th className="py-2.5 px-3">Courses &amp; Sessions</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {filteredTeachers.map((t, idx) => {
                    const isBusy = busyUserId === t.id;
                    return (
                      <tr
                        key={t.id}
                        className={idx % 2 === 0 ? 'bg-white' : 'bg-[#FAF9F6]'}
                      >
                        <td className="py-3 px-3 font-mono text-slate-500 tabular-nums align-top">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3 align-top">
                          <p className="font-semibold text-slate-950">{t.name}</p>
                          <p className="text-[11px] text-slate-600">
                            {t.designation || 'Faculty Member'} · {t.hallAffiliation}
                          </p>
                          <p className="font-mono text-[11px] text-slate-500 break-all">
                            {t.email}
                          </p>
                        </td>
                        <td className="py-3 px-3 align-top">
                          <p className="font-mono text-slate-800 tabular-nums">
                            ID: {t.academicId}
                          </p>
                          {t.claimedFacultyMemberId ? (
                            <p className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 mt-0.5">
                              <UserCheck className="w-3.5 h-3.5 shrink-0" />
                              <span>Linked to Public Directory</span>
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Directory profile unclaimed
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-3 align-top">
                          <p className="font-mono text-[11px] text-slate-800">
                            Courses: {(t.assignedCourses || []).join(', ') || 'None assigned'}
                          </p>
                          <p className="font-mono text-[11px] text-slate-500 mt-0.5">
                            Sessions: {(t.assignedSessions || []).join(', ') || '—'}
                          </p>
                        </td>
                        <td className="py-3 px-3 align-top whitespace-nowrap">
                          {t.approvalStatus === 'approved' ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approved</span>
                            </span>
                          ) : t.approvalStatus === 'pending' ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-amber-800">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Pending</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-semibold text-red-700">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Suspended</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 align-top text-right whitespace-nowrap">
                          <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                            {t.approvalStatus !== 'approved' && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => void handleQuickStatus(t, 'approved')}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-pust-900 text-white font-medium hover:bg-pust-950 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                            )}
                            {t.approvalStatus === 'approved' && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => void handleQuickStatus(t, 'rejected')}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 bg-white text-red-700 font-medium hover:bg-red-50 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Suspend</span>
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => openEditModal(t)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white text-slate-700 hover:border-pust-800 hover:text-pust-900 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit / Assign</span>
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => {
                                setError(null);
                                setPasswordTarget(t);
                                setNewPassword('');
                                setShowResetPassword(false);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white text-slate-700 hover:border-pust-800 hover:text-pust-900 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              <span>Password</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: FACULTY PROFILE APPROVALS */}
      {activeSection === 'faculty-requests' && (
        <AdminFacultyRequestsPanel
          actorRole="chairman"
          departmentCode={deptCode}
          onPendingCountChange={(count) => {
            setPendingFacultyCount(count);
            onPendingFacultyRequestsChange?.(count);
          }}
          onCmsChange={onCmsChange}
        />
      )}

      {/* SECTION 3: STUDENTS & ONBOARDING TOKENS */}
      {activeSection === 'students' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 space-y-4">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-stone-200 pb-4">
              <div className="flex flex-wrap items-center gap-2.5 flex-1">
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder={`Search ${deptCode} students, ID, or token...`}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  />
                </div>

                <select
                  value={studentSessionFilter}
                  onChange={(e) => setStudentSessionFilter(e.target.value)}
                  aria-label="Filter by session"
                  className="px-3 py-2 text-xs rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                >
                  <option value="ALL">All Sessions</option>
                  {availableSessions.map((sess) => (
                    <option key={sess} value={sess}>
                      Session {sess}
                    </option>
                  ))}
                </select>

                <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-stone-100 border border-stone-200">
                  {(
                    [
                      { id: 'all', label: 'All' },
                      { id: 'approved', label: 'Approved' },
                      { id: 'pending', label: 'Pending' },
                      { id: 'rejected', label: 'Suspended' },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setStudentStatusFilter(item.id)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        studentStatusFilter === item.id
                          ? 'bg-white text-slate-950 shadow-xs'
                          : 'text-slate-600 hover:text-slate-950'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={openIssueToken}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-pust-900 bg-white text-pust-900 hover:bg-pust-900 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Issue Signup Token</span>
                </button>
                <button
                  type="button"
                  onClick={openCreateStudent}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-pust-900 text-white hover:bg-pust-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Student Account</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((row) => (
                  <div
                    key={row}
                    className="h-12 rounded-xl bg-stone-100 animate-pulse border border-stone-200"
                  />
                ))}
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] p-8 text-center space-y-2">
                <GraduationCap className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-sm font-medium text-slate-900">
                  No {deptCode} student accounts match the current filter
                </p>
                <p className="text-xs text-slate-600">
                  Provision a student account directly or issue a single-use onboarding token below.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-stone-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F7F7F5] border-b border-stone-200 text-slate-600 font-semibold">
                      <th className="py-2.5 px-3 w-12 font-mono">S.N</th>
                      <th className="py-2.5 px-3">Student &amp; Email</th>
                      <th className="py-2.5 px-3">Academic ID &amp; Session</th>
                      <th className="py-2.5 px-3">Hall Affiliation</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {filteredStudents.map((s, idx) => {
                      const isBusy = busyUserId === s.id;
                      return (
                        <tr
                          key={s.id}
                          className={idx % 2 === 0 ? 'bg-white' : 'bg-[#FAF9F6]'}
                        >
                          <td className="py-3 px-3 font-mono text-slate-500 tabular-nums align-top">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-3 align-top">
                            <p className="font-semibold text-slate-950">{s.name}</p>
                            <p className="font-mono text-[11px] text-slate-500 break-all">
                              {s.email}
                            </p>
                          </td>
                          <td className="py-3 px-3 align-top whitespace-nowrap">
                            <p className="font-mono text-slate-900 tabular-nums">
                              ID: {s.academicId}
                            </p>
                            <p className="font-mono text-[11px] text-slate-500 tabular-nums">
                              Session: {s.session || '—'}
                            </p>
                          </td>
                          <td className="py-3 px-3 align-top text-slate-700">
                            {s.hallAffiliation}
                          </td>
                          <td className="py-3 px-3 align-top whitespace-nowrap">
                            {s.approvalStatus === 'approved' ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Approved</span>
                              </span>
                            ) : s.approvalStatus === 'pending' ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-amber-800">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Pending</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-semibold text-red-700">
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Suspended</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 align-top text-right whitespace-nowrap">
                            <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                              {s.approvalStatus !== 'approved' && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => void handleQuickStatus(s, 'approved')}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-pust-900 text-white font-medium hover:bg-pust-950 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>
                              )}
                              {s.approvalStatus === 'approved' && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => void handleQuickStatus(s, 'rejected')}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 bg-white text-red-700 font-medium hover:bg-red-50 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Suspend</span>
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => openEditModal(s)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white text-slate-700 hover:border-pust-800 hover:text-pust-900 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => {
                                  setError(null);
                                  setPasswordTarget(s);
                                  setNewPassword('');
                                  setShowResetPassword(false);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white text-slate-700 hover:border-pust-800 hover:text-pust-900 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                                <span>Password</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Single-Use Student Onboarding Tokens Ledger */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-3">
              <div>
                <h3 className="font-serif text-lg font-medium text-slate-950">
                  {deptCode} Single-Use Student Signup Tokens ({filteredTokens.length})
                </h3>
                <p className="text-xs text-slate-600">
                  Students can redeem an unused token on the Portal sign-up screen to self-register into {deptCode}.
                </p>
              </div>
              <button
                type="button"
                onClick={openIssueToken}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-stone-300 bg-[#F7F7F5] text-slate-800 hover:border-pust-800 hover:text-pust-900 cursor-pointer whitespace-nowrap"
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>Generate Token</span>
              </button>
            </div>

            {filteredTokens.length === 0 ? (
              <p className="text-xs text-slate-600">
                No {deptCode} signup tokens issued for the active filter.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-stone-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F7F7F5] border-b border-stone-200 text-slate-600 font-semibold">
                      <th className="py-2.5 px-3 w-12 font-mono">S.N</th>
                      <th className="py-2.5 px-3">Signup Token</th>
                      <th className="py-2.5 px-3">Student &amp; Email</th>
                      <th className="py-2.5 px-3">Academic ID</th>
                      <th className="py-2.5 px-3">Session &amp; Hall</th>
                      <th className="py-2.5 px-3">State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {filteredTokens.map((tok, idx) => (
                      <tr
                        key={tok.id}
                        className={idx % 2 === 0 ? 'bg-white' : 'bg-[#FAF9F6]'}
                      >
                        <td className="py-2.5 px-3 font-mono text-slate-500 tabular-nums">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <span className="font-mono font-semibold text-pust-900">
                              {tok.token}
                            </span>
                            <button
                              type="button"
                              onClick={() => void handleCopyToken(tok)}
                              aria-label={`Copy token ${tok.token}`}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded border border-stone-200 bg-white text-[11px] text-slate-600 hover:border-pust-800 hover:text-pust-900 cursor-pointer"
                            >
                              <Copy className="w-3 h-3" />
                              <span>{copiedTokenId === tok.id ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="font-medium text-slate-950">{tok.studentName}</p>
                          <p className="font-mono text-[11px] text-slate-500">
                            {tok.studentEmail}
                          </p>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-800 tabular-nums">
                          {tok.academicId}
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="font-mono text-[11px] text-slate-800 tabular-nums">
                            {tok.session}
                          </p>
                          <p className="text-[11px] text-slate-500">{tok.hallAffiliation}</p>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {tok.used ? (
                            <span className="text-slate-500 font-medium">Redeemed</span>
                          ) : (
                            <span className="text-emerald-700 font-semibold">Available</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 4: DEPARTMENT ACTIVITY LOG */}
      {activeSection === 'activity' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
            <div>
              <h3 className="font-serif text-lg font-medium text-slate-950">
                {deptCode} Department Activity &amp; Audit Trail
              </h3>
              <p className="text-xs text-slate-600">
                Scoped ledger of account provisioning, approvals, password resets, and faculty profile reviews inside {deptCode}.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={activitySearch}
                  onChange={(e) => setActivitySearch(e.target.value)}
                  placeholder="Filter activity log..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                />
              </div>
              <button
                type="button"
                onClick={() => void loadLogs()}
                disabled={loadingLogs}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-stone-300 bg-[#F7F7F5] text-slate-700 hover:border-pust-800 cursor-pointer whitespace-nowrap shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
                <span>Reload</span>
              </button>
            </div>
          </div>

          {loadingLogs ? (
            <div className="space-y-2">
              {[1, 2, 3].map((row) => (
                <div
                  key={row}
                  className="h-11 rounded-lg bg-stone-100 animate-pulse border border-stone-200"
                />
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <p className="text-xs text-slate-600 py-4">
              No {deptCode} activity records match your filter.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-stone-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F7F7F5] border-b border-stone-200 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3 w-12 font-mono">S.N</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Actor</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Target</th>
                    <th className="py-2.5 px-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {filteredLogs.map((entry, idx) => (
                    <tr
                      key={entry.id}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-[#FAF9F6]'}
                    >
                      <td className="py-2.5 px-3 font-mono text-slate-500 tabular-nums align-top">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap align-top">
                        {formatDateTime(entry.timestamp)}
                      </td>
                      <td className="py-2.5 px-3 align-top">
                        <p className="font-medium text-slate-900">{entry.actorName}</p>
                        <p className="font-mono text-[11px] text-slate-500 uppercase">
                          {entry.actorRole}
                        </p>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900 align-top">
                        {entry.action}
                      </td>
                      <td className="py-2.5 px-3 text-slate-800 align-top">{entry.target}</td>
                      <td className="py-2.5 px-3 text-slate-600 align-top max-w-xs break-words">
                        {entry.details || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ADD DEPARTMENT TEACHER */}
      {showCreateTeacherModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Add Department Teacher"
          onClick={() => setShowCreateTeacherModal(false)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-white rounded-2xl border border-stone-200 shadow-2xl overflow-hidden my-auto"
          >
            <div className="px-6 py-4 border-b border-stone-200 bg-[#FAF9F6] flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] font-semibold text-pust-800">
                  Scoped to {deptTitle}
                </p>
                <h3 className="font-serif text-lg font-medium text-slate-950">
                  Add {deptCode} Teacher Account
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateTeacherModal(false)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTeacher} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    value={tName}
                    onChange={(e) => setTName(e.target.value)}
                    placeholder="e.g. Dr. Farhana Yasmin"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={tDesignation}
                    onChange={(e) => setTDesignation(e.target.value)}
                    placeholder="Lecturer / Assistant Professor"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Institutional Email
                  </label>
                  <input
                    type="email"
                    required
                    value={tEmail}
                    onChange={(e) => setTEmail(e.target.value)}
                    placeholder="teacher@pust.ac.bd"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Employee / Faculty ID
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    value={tAcademicId}
                    onChange={(e) => setTAcademicId(e.target.value)}
                    placeholder={`e.g. PUST-${deptCode}-FAC-12`}
                    className="w-full px-3 py-2 font-mono rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Department Building
                  </label>
                  <input
                    type="text"
                    required
                    value={tBuilding}
                    onChange={(e) => setTBuilding(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Account Status</label>
                  <select
                    value={tStatus}
                    onChange={(e) => setTStatus(e.target.value as ApprovalStatus)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  >
                    <option value="approved">Approved (Active Immediately)</option>
                    <option value="pending">Pending Review</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-medium text-slate-700">Initial Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setTPassword(generateStrongPassword());
                        setShowTPassword(true);
                      }}
                      className="text-[11px] font-medium text-pust-800 hover:underline cursor-pointer"
                    >
                      Generate Strong
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showTPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={tPassword}
                      onChange={(e) => setTPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full pr-9 pl-3 py-2 font-mono rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowTPassword((v) => !v)}
                      aria-label="Toggle password visibility"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      {showTPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Assigned Courses (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={tCourses}
                    onChange={(e) => setTCourses(e.target.value)}
                    placeholder={`e.g. ${deptCode}-3101, ${deptCode}-3103`}
                    className="w-full px-3 py-2 font-mono rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Assigned Sessions (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={tSessions}
                    onChange={(e) => setTSessions(e.target.value)}
                    placeholder="e.g. 2022-23, 2023-24"
                    className="w-full px-3 py-2 font-mono rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateTeacherModal(false)}
                  className="px-4 py-2 rounded-lg border border-stone-300 bg-white text-slate-700 font-medium hover:text-slate-950 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTeacher}
                  className="px-5 py-2 rounded-lg bg-pust-900 text-white font-semibold hover:bg-pust-950 disabled:opacity-60 cursor-pointer"
                >
                  {creatingTeacher ? 'Creating Teacher...' : `Create ${deptCode} Teacher`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE STUDENT ACCOUNT */}
      {showCreateStudentModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Create Student Account"
          onClick={() => setShowCreateStudentModal(false)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-white rounded-2xl border border-stone-200 shadow-2xl overflow-hidden my-auto"
          >
            <div className="px-6 py-4 border-b border-stone-200 bg-[#FAF9F6] flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] font-semibold text-pust-800">
                  Scoped to {deptTitle}
                </p>
                <h3 className="font-serif text-lg font-medium text-slate-950">
                  Create {deptCode} Student Account
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateStudentModal(false)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Student Full Name</label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    value={sName}
                    onChange={(e) => setSName(e.target.value)}
                    placeholder="e.g. Tasnim Tabassum"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Student Email</label>
                  <input
                    type="email"
                    required
                    value={sEmail}
                    onChange={(e) => setSEmail(e.target.value)}
                    placeholder="student@pust.ac.bd"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Academic Roll / ID</label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    value={sAcademicId}
                    onChange={(e) => setSAcademicId(e.target.value)}
                    placeholder="e.g. 220105"
                    className="w-full px-3 py-2 font-mono rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Academic Session</label>
                  <input
                    type="text"
                    required
                    minLength={4}
                    value={sSession}
                    onChange={(e) => setSSession(e.target.value)}
                    placeholder="e.g. 2025-26"
                    className="w-full px-3 py-2 font-mono rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Hall Affiliation</label>
                  <select
                    value={sHall}
                    onChange={(e) => setSHall(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  >
                    {PUST_HALL_OPTIONS.map((hall) => (
                      <option key={hall} value={hall}>
                        {hall}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Account Status</label>
                  <select
                    value={sStatus}
                    onChange={(e) => setSStatus(e.target.value as ApprovalStatus)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  >
                    <option value="approved">Approved (Active Immediately)</option>
                    <option value="pending">Pending Review</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-medium text-slate-700">Initial Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setSPassword(generateStrongPassword());
                        setShowSPassword(true);
                      }}
                      className="text-[11px] font-medium text-pust-800 hover:underline cursor-pointer"
                    >
                      Generate Strong
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showSPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={sPassword}
                      onChange={(e) => setSPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full pr-9 pl-3 py-2 font-mono rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSPassword((v) => !v)}
                      aria-label="Toggle password visibility"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      {showSPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateStudentModal(false)}
                  className="px-4 py-2 rounded-lg border border-stone-300 bg-white text-slate-700 font-medium hover:text-slate-950 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingStudent}
                  className="px-5 py-2 rounded-lg bg-pust-900 text-white font-semibold hover:bg-pust-950 disabled:opacity-60 cursor-pointer"
                >
                  {creatingStudent ? 'Creating Student...' : `Create ${deptCode} Student`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ISSUE SINGLE-USE STUDENT SIGNUP TOKEN */}
      {showTokenModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Issue Student Signup Token"
          onClick={() => setShowTokenModal(false)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-white rounded-2xl border border-stone-200 shadow-2xl overflow-hidden my-auto"
          >
            <div className="px-6 py-4 border-b border-stone-200 bg-[#FAF9F6] flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] font-semibold text-pust-800">
                  Single-Use Onboarding · {deptCode}
                </p>
                <h3 className="font-serif text-lg font-medium text-slate-950">
                  Issue {deptCode} Student Signup Token
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTokenModal(false)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleIssueToken} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Student Name</label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    value={tokName}
                    onChange={(e) => setTokName(e.target.value)}
                    placeholder="e.g. Nabil Hasan"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Student Email</label>
                  <input
                    type="email"
                    required
                    value={tokEmail}
                    onChange={(e) => setTokEmail(e.target.value)}
                    placeholder="student@pust.ac.bd"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    minLength={6}
                    value={tokPhone}
                    onChange={(e) => setTokPhone(e.target.value)}
                    placeholder="+880-17XX-XXXXXX"
                    className="w-full px-3 py-2 font-mono rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Academic Roll / ID</label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    value={tokAcademicId}
                    onChange={(e) => setTokAcademicId(e.target.value)}
                    placeholder="e.g. 250112"
                    className="w-full px-3 py-2 font-mono rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Session</label>
                  <input
                    type="text"
                    required
                    minLength={4}
                    value={tokSession}
                    onChange={(e) => setTokSession(e.target.value)}
                    placeholder="e.g. 2025-26"
                    className="w-full px-3 py-2 font-mono rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Hall Affiliation</label>
                  <select
                    value={tokHall}
                    onChange={(e) => setTokHall(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  >
                    {PUST_HALL_OPTIONS.map((hall) => (
                      <option key={hall} value={hall}>
                        {hall}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowTokenModal(false)}
                  className="px-4 py-2 rounded-lg border border-stone-300 bg-white text-slate-700 font-medium hover:text-slate-950 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingToken}
                  className="px-5 py-2 rounded-lg bg-pust-900 text-white font-semibold hover:bg-pust-950 disabled:opacity-60 cursor-pointer"
                >
                  {creatingToken ? 'Issuing Token...' : 'Issue Signup Token'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT DEPARTMENT TEACHER OR STUDENT */}
      {editingUser && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Edit Department Account"
          onClick={() => setEditingUser(null)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-white rounded-2xl border border-stone-200 shadow-2xl overflow-hidden my-auto"
          >
            <div className="px-6 py-4 border-b border-stone-200 bg-[#FAF9F6] flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] font-semibold text-pust-800 uppercase">
                  {deptCode} {editingUser.role} · ID {editingUser.academicId}
                </p>
                <h3 className="font-serif text-lg font-medium text-slate-950">
                  Edit {editingUser.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs">
              <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] px-3.5 py-2.5 text-[11px] text-slate-600">
                Department (<span className="font-mono font-semibold text-slate-900">{deptCode}</span>) and role (<span className="font-mono font-semibold text-slate-900 uppercase">{editingUser.role}</span>) are locked to department governance. Role changes or department transfers require Central University Admin.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Academic / Employee ID</label>
                  <input
                    type="text"
                    required
                    value={editAcademicId}
                    onChange={(e) => setEditAcademicId(e.target.value)}
                    className="w-full px-3 py-2 font-mono rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Account Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as ApprovalStatus)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  >
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Suspended / Rejected</option>
                  </select>
                </div>

                {editingUser.role === 'teacher' ? (
                  <>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Designation</label>
                      <input
                        type="text"
                        value={editDesignation}
                        onChange={(e) => setEditDesignation(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Building / Office</label>
                      <input
                        type="text"
                        required
                        value={editHall}
                        onChange={(e) => setEditHall(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        Assigned Courses (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={editCourses}
                        onChange={(e) => setEditCourses(e.target.value)}
                        placeholder={`e.g. ${deptCode}-3101, ${deptCode}-3205`}
                        className="w-full px-3 py-2 font-mono rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        Assigned Sessions (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={editSessions}
                        onChange={(e) => setEditSessions(e.target.value)}
                        placeholder="e.g. 2022-23, 2023-24"
                        className="w-full px-3 py-2 font-mono rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Session</label>
                      <input
                        type="text"
                        value={editSession}
                        onChange={(e) => setEditSession(e.target.value)}
                        placeholder="e.g. 2025-26"
                        className="w-full px-3 py-2 font-mono rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Hall Affiliation</label>
                      <select
                        value={PUST_HALL_OPTIONS.includes(editHall) ? editHall : '__custom'}
                        onChange={(e) => {
                          if (e.target.value !== '__custom') setEditHall(e.target.value);
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                      >
                        {PUST_HALL_OPTIONS.map((hall) => (
                          <option key={hall} value={hall}>
                            {hall}
                          </option>
                        ))}
                        {!PUST_HALL_OPTIONS.includes(editHall) && (
                          <option value="__custom">{editHall}</option>
                        )}
                      </select>
                    </div>
                  </>
                )}
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-lg border border-stone-300 bg-white text-slate-700 font-medium hover:text-slate-950 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 rounded-lg bg-pust-900 text-white font-semibold hover:bg-pust-950 disabled:opacity-60 cursor-pointer"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: RESET PASSWORD */}
      {passwordTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Reset Account Password"
          onClick={() => setPasswordTarget(null)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-2xl border border-stone-200 shadow-2xl overflow-hidden my-auto"
          >
            <div className="px-6 py-4 border-b border-stone-200 bg-[#FAF9F6] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-pust-900" />
                <h3 className="font-serif text-lg font-medium text-slate-950">Reset Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setPasswordTarget(null)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="p-6 space-y-4 text-xs">
              <p className="text-slate-600">
                Set a new sign-in password for <strong className="text-slate-900">{passwordTarget.name}</strong> ({passwordTarget.email}).
              </p>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-medium text-slate-700">New Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setNewPassword(generateStrongPassword());
                      setShowResetPassword(true);
                    }}
                    className="text-[11px] font-medium text-pust-800 hover:underline cursor-pointer"
                  >
                    Generate Strong
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full pr-9 pl-3 py-2 font-mono rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword((v) => !v)}
                    aria-label="Toggle password visibility"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 cursor-pointer"
                  >
                    {showResetPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setPasswordTarget(null)}
                  className="px-4 py-2 rounded-lg border border-stone-300 bg-white text-slate-700 font-medium hover:text-slate-950 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-5 py-2 rounded-lg bg-pust-900 text-white font-semibold hover:bg-pust-950 disabled:opacity-60 cursor-pointer"
                >
                  {savingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
