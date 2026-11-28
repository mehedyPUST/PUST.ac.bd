'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Building2,
  Check,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  KeyRound,
  RefreshCw,
  Search,
  ShieldPlus,
  Trash2,
  UserPlus,
  X,
  XCircle,
} from 'lucide-react';
import { DEFAULT_ADMIN_OFFICES } from '../../lib/adminOffices';
import { pustApi } from '../../lib/api';
import type {
  AdministrationOfficeRecord,
  ApprovalStatus,
  AuthUser,
  DepartmentRecord,
  UserRole,
} from '../../types/pust';

interface AdminUserDirectoryPanelProps {
  currentUser: AuthUser;
  departments: DepartmentRecord[];
  offices?: AdministrationOfficeRecord[];
  initialAction?: 'create-admin' | 'create-officer' | null;
  onConsumeInitialAction?: () => void;
  onUsersChanged?: () => void;
}

interface OfficeUnitOption {
  key: string;
  group:
    | 'Academic Departments'
    | 'Executive & Administrative Offices'
    | 'Residential Halls & Welfare Services'
    | 'Research, ICT & Quality Cells'
    | 'Central Administration';
  code: string;
  name: string;
  defaultRole: UserRole;
  defaultHallAffiliation: string;
}

const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  admin: 'University Admin',
  registrar: 'Office / Registrar Officer',
  vc: 'Vice-Chancellor / Pro-VC',
  chairman: 'Department Chairman',
  teacher: 'Faculty / Teacher',
  proctor: 'Proctorial Officer',
  library: 'Library Officer',
  hall: 'Hall Provost / Officer',
  student: 'Student',
};

const OFFICER_AND_TEACHER_ROLES: UserRole[] = [
  'teacher',
  'chairman',
  'registrar',
  'vc',
  'proctor',
  'library',
  'hall',
];

const ALL_ROLES: UserRole[] = [
  'admin',
  'registrar',
  'vc',
  'chairman',
  'teacher',
  'proctor',
  'library',
  'hall',
  'student',
];

function resolveDefaultRoleForOffice(office: AdministrationOfficeRecord): UserRole {
  if (office.slug === 'vc-office' || office.slug === 'pro-vc-office') return 'vc';
  if (office.slug === 'proctor-office') return 'proctor';
  if (office.slug === 'central-library') return 'library';
  if (
    office.slug === 'male-hall-1' ||
    office.slug === 'male-hall-2' ||
    office.slug === 'female-hall-1' ||
    office.slug === 'female-hall-2'
  ) {
    return 'hall';
  }
  return 'registrar';
}

function resolveDefaultHallForOffice(office: AdministrationOfficeRecord): string {
  if (office.slug === 'male-hall-1') return 'July 06 Hall (Male Hall 1)';
  if (office.slug === 'male-hall-2') return 'Swadhinota Hall (Male Hall 2)';
  if (office.slug === 'female-hall-1') return 'Matribhasha Hall (Female Hall 1)';
  if (office.slug === 'female-hall-2') return 'Ganatantra Hall (Female Hall 2)';
  return office.location || office.name || 'Administrative Building';
}

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

export function AdminUserDirectoryPanel({
  currentUser,
  departments,
  offices,
  initialAction,
  onConsumeInitialAction,
  onUsersChanged,
}: AdminUserDirectoryPanelProps) {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'officers' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ApprovalStatus>('all');
  const [unitFilter, setUnitFilter] = useState('ALL');

  // Create Officer / Teacher Modal
  const [showCreateOfficerModal, setShowCreateOfficerModal] = useState(false);
  const [officerUnitKey, setOfficerUnitKey] = useState('');
  const [officerRole, setOfficerRole] = useState<UserRole>('teacher');
  const [officerName, setOfficerName] = useState('');
  const [officerDesignation, setOfficerDesignation] = useState('');
  const [officerEmail, setOfficerEmail] = useState('');
  const [officerAcademicId, setOfficerAcademicId] = useState('');
  const [officerDeptCode, setOfficerDeptCode] = useState('');
  const [officerOfficeName, setOfficerOfficeName] = useState('');
  const [officerHallAffiliation, setOfficerHallAffiliation] = useState('Administrative Building');
  const [officerPassword, setOfficerPassword] = useState('');
  const [showOfficerPassword, setShowOfficerPassword] = useState(false);
  const [officerStatus, setOfficerStatus] = useState<ApprovalStatus>('approved');
  const [officerCourses, setOfficerCourses] = useState('');
  const [officerSessions, setOfficerSessions] = useState('');
  const [creatingOfficer, setCreatingOfficer] = useState(false);

  // Create Admin Modal
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [adminDesignation, setAdminDesignation] = useState('University System Administrator');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminBuilding, setAdminBuilding] = useState('Administrative Building');
  const [adminStatus, setAdminStatus] = useState<ApprovalStatus>('approved');
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  // Edit User Modal
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('teacher');
  const [editDeptCode, setEditDeptCode] = useState('');
  const [editOfficeCode, setEditOfficeCode] = useState('');
  const [editOfficeName, setEditOfficeName] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editAcademicId, setEditAcademicId] = useState('');
  const [editHallAffiliation, setEditHallAffiliation] = useState('');
  const [editStatus, setEditStatus] = useState<ApprovalStatus>('approved');
  const [editCourses, setEditCourses] = useState('');
  const [editSessions, setEditSessions] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Reset Password Modal
  const [passwordTarget, setPasswordTarget] = useState<AuthUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Inline Delete Confirmation & Row Busy State
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const officeCatalog = useMemo<OfficeUnitOption[]>(() => {
    const resolvedOffices =
      offices && offices.length > 0 ? offices : DEFAULT_ADMIN_OFFICES;
    const options: OfficeUnitOption[] = [
      {
        key: 'central:ADMIN',
        group: 'Central Administration',
        code: 'ADMIN',
        name: 'Central Administration & System Governance',
        defaultRole: 'registrar',
        defaultHallAffiliation: 'Administrative Building',
      },
    ];

    for (const dept of departments) {
      options.push({
        key: `dept:${dept.code}`,
        group: 'Academic Departments',
        code: dept.code,
        name: `Department of ${dept.name} (${dept.code})`,
        defaultRole: 'teacher',
        defaultHallAffiliation: dept.building || 'Academic Block',
      });
    }

    for (const office of resolvedOffices) {
      const group: OfficeUnitOption['group'] =
        office.category === 'Residential Halls & Accommodation' ||
        office.category === 'Student Welfare & Campus Services'
          ? 'Residential Halls & Welfare Services'
          : office.category === 'Research, ICT & Quality Cells'
          ? 'Research, ICT & Quality Cells'
          : 'Executive & Administrative Offices';
      options.push({
        key: `office:${office.slug}`,
        group,
        code: office.code,
        name: `${office.name} (${office.code})`,
        defaultRole: resolveDefaultRoleForOffice(office),
        defaultHallAffiliation: resolveDefaultHallForOffice(office),
      });
    }

    return options;
  }, [departments, offices]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await pustApi.getUsers();
      setUsers(res.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load user directory.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    const hasOpenModal =
      showCreateOfficerModal || showCreateAdminModal || Boolean(editingUser) || Boolean(passwordTarget);
    if (!hasOpenModal) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      setShowCreateOfficerModal(false);
      setShowCreateAdminModal(false);
      setEditingUser(null);
      setPasswordTarget(null);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showCreateOfficerModal, showCreateAdminModal, editingUser, passwordTarget]);

  const summary = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === 'admin').length;
    const officersAndTeachers = users.filter(
      (u) => u.role !== 'admin' && u.role !== 'student'
    ).length;
    const pending = users.filter((u) => u.approvalStatus === 'pending').length;
    const students = users.filter((u) => u.role === 'student').length;
    return { total, admins, officersAndTeachers, pending, students };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users
      .filter((u) => {
        if (roleFilter === 'officers') {
          if (u.role === 'admin' || u.role === 'student') return false;
        } else if (roleFilter !== 'all' && u.role !== roleFilter) {
          return false;
        }
        if (statusFilter !== 'all' && u.approvalStatus !== statusFilter) {
          return false;
        }
        if (unitFilter !== 'ALL') {
          const matchesDept = u.departmentCode?.toUpperCase() === unitFilter.toUpperCase();
          const matchesOffice = u.officeCode?.toUpperCase() === unitFilter.toUpperCase();
          if (!matchesDept && !matchesOffice) return false;
        }
        if (q) {
          const hay = [
            u.name,
            u.email,
            u.academicId,
            u.role,
            u.departmentCode,
            u.officeCode || '',
            u.officeName || '',
            u.designation || '',
            u.hallAffiliation,
          ]
            .join(' ')
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.approvalStatus === 'pending' && b.approvalStatus !== 'pending') return -1;
        if (b.approvalStatus === 'pending' && a.approvalStatus !== 'pending') return 1;
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (b.role === 'admin' && a.role !== 'admin') return 1;
        return a.name.localeCompare(b.name);
      });
  }, [users, roleFilter, statusFilter, unitFilter, searchQuery]);

  const openCreateOfficerModal = useCallback(() => {
    const defaultOpt =
      officeCatalog.find((o) => o.group === 'Academic Departments') || officeCatalog[0];
    setError(null);
    setFeedback(null);
    setOfficerUnitKey(defaultOpt?.key || 'central:ADMIN');
    setOfficerRole(defaultOpt?.defaultRole || 'teacher');
    setOfficerDeptCode(defaultOpt?.code || 'CSE');
    setOfficerOfficeName(defaultOpt?.name || '');
    setOfficerHallAffiliation(defaultOpt?.defaultHallAffiliation || 'Administrative Building');
    setOfficerName('');
    setOfficerDesignation('');
    setOfficerEmail('');
    setOfficerAcademicId('');
    setOfficerPassword('');
    setShowOfficerPassword(false);
    setOfficerStatus('approved');
    setOfficerCourses('');
    setOfficerSessions('');
    setShowCreateOfficerModal(true);
  }, [officeCatalog]);

  function handleOfficerUnitChange(nextKey: string) {
    setOfficerUnitKey(nextKey);
    const found = officeCatalog.find((o) => o.key === nextKey);
    if (!found) return;
    setOfficerRole(found.defaultRole);
    setOfficerDeptCode(found.code);
    setOfficerOfficeName(found.name.replace(/\s+\([^)]+\)$/, ''));
    setOfficerHallAffiliation(found.defaultHallAffiliation);
  }

  const openCreateAdminModal = useCallback(() => {
    const existingIds = new Set(users.map((u) => u.academicId.toUpperCase()));
    let nextIdx = users.filter((u) => u.role === 'admin').length + 1;
    while (existingIds.has(`PUST-ADMIN-${String(nextIdx).padStart(2, '0')}`)) {
      nextIdx += 1;
    }
    const suggestedNum = String(nextIdx).padStart(2, '0');
    setError(null);
    setFeedback(null);
    setAdminName('');
    setAdminDesignation('University System Administrator');
    setAdminEmail('');
    setAdminId(`PUST-ADMIN-${suggestedNum}`);
    setAdminPassword('');
    setAdminConfirmPassword('');
    setShowAdminPassword(false);
    setAdminBuilding('Administrative Building');
    setAdminStatus('approved');
    setShowCreateAdminModal(true);
  }, [users]);

  useEffect(() => {
    if (!initialAction || loading) return;
    if (initialAction === 'create-admin') {
      openCreateAdminModal();
      onConsumeInitialAction?.();
    } else if (initialAction === 'create-officer') {
      openCreateOfficerModal();
      onConsumeInitialAction?.();
    }
  }, [initialAction, loading, openCreateAdminModal, openCreateOfficerModal, onConsumeInitialAction]);

  function openEditModalFor(u: AuthUser) {
    setError(null);
    setFeedback(null);
    setEditingUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditDeptCode(u.departmentCode);
    setEditOfficeCode(u.officeCode || u.departmentCode);
    setEditOfficeName(u.officeName || '');
    setEditDesignation(u.designation || '');
    setEditAcademicId(u.academicId);
    setEditHallAffiliation(u.hallAffiliation);
    setEditStatus(u.approvalStatus);
    setEditCourses((u.assignedCourses || []).join(', '));
    setEditSessions((u.assignedSessions || []).join(', '));
  }

  async function handleCreateOfficerSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    if (officerPassword.length < 8) {
      setError('Initial password must be at least 8 characters.');
      return;
    }
    setCreatingOfficer(true);
    try {
      const courses =
        officerRole === 'teacher'
          ? officerCourses
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [];
      const sessions =
        officerRole === 'teacher'
          ? officerSessions
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [];
      const res = await pustApi.createAdminUser({
        name: officerName.trim(),
        email: officerEmail.trim(),
        password: officerPassword,
        role: officerRole,
        departmentCode: officerDeptCode.trim().toUpperCase(),
        academicId: officerAcademicId.trim(),
        hallAffiliation: officerHallAffiliation.trim(),
        officeCode: officerDeptCode.trim().toUpperCase(),
        officeName: officerOfficeName.trim() || undefined,
        designation: officerDesignation.trim() || undefined,
        approvalStatus: officerStatus,
        assignedCourses: courses,
        assignedSessions: sessions,
      });
      setShowCreateOfficerModal(false);
      setFeedback(
        `Created ${ROLE_DISPLAY_NAMES[res.user.role]} account for ${res.user.name} (${res.user.officeName || res.user.departmentCode}).`
      );
      await loadUsers();
      onUsersChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create officer/teacher account.');
    } finally {
      setCreatingOfficer(false);
    }
  }

  async function handleCreateAdminSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    if (adminPassword.length < 8) {
      setError('Admin password must be at least 8 characters.');
      return;
    }
    if (adminPassword !== adminConfirmPassword) {
      setError('Admin password and confirmation do not match.');
      return;
    }
    setCreatingAdmin(true);
    try {
      const res = await pustApi.createAdminUser({
        name: adminName.trim(),
        email: adminEmail.trim(),
        password: adminPassword,
        role: 'admin',
        departmentCode: 'ADMIN',
        academicId: adminId.trim(),
        hallAffiliation: adminBuilding.trim() || 'Administrative Building',
        officeCode: 'ADMIN',
        officeName: 'Central Administration & System Governance',
        designation: adminDesignation.trim() || 'University System Administrator',
        approvalStatus: adminStatus,
      });
      setShowCreateAdminModal(false);
      setFeedback(
        `Created co-administrator account for ${res.user.name} (${res.user.email}) with full system permissions.`
      );
      await loadUsers();
      onUsersChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create administrator account.');
    } finally {
      setCreatingAdmin(false);
    }
  }

  async function handleSaveUserEdit(e: FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setError(null);
    setFeedback(null);
    setSavingEdit(true);
    try {
      const courses = editCourses
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const sessions = editSessions
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await pustApi.updateAdminUser(editingUser.id, {
        name: editName.trim(),
        email: editEmail.trim(),
        role: editRole,
        departmentCode: editDeptCode.trim().toUpperCase(),
        officeCode: editOfficeCode.trim().toUpperCase() || editDeptCode.trim().toUpperCase(),
        officeName: editOfficeName.trim(),
        designation: editDesignation.trim(),
        academicId: editAcademicId.trim(),
        hallAffiliation: editHallAffiliation.trim(),
        approvalStatus: editStatus,
        ...(editRole === 'teacher'
          ? { assignedCourses: courses, assignedSessions: sessions }
          : {}),
      });
      setEditingUser(null);
      setFeedback(`Updated directory account for ${res.user.name}.`);
      await loadUsers();
      onUsersChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save account changes.');
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleQuickApproval(u: AuthUser, nextStatus: 'approved' | 'rejected') {
    setError(null);
    setFeedback(null);
    setBusyUserId(u.id);
    try {
      await pustApi.approveUser(u.id, nextStatus);
      setFeedback(`${u.name} marked as ${nextStatus}.`);
      await loadUsers();
      onUsersChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update approval status.');
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleResetPasswordSubmit(e: FormEvent) {
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
      setFeedback(`Password updated for ${passwordTarget.name}.`);
      setPasswordTarget(null);
      setNewPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset user password.');
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleConfirmDelete(u: AuthUser) {
    setError(null);
    setFeedback(null);
    setBusyUserId(u.id);
    try {
      await pustApi.deleteAdminUser(u.id);
      setConfirmDeleteId(null);
      setFeedback(`Removed account ${u.name} (${u.email}) from user directory.`);
      await loadUsers();
      onUsersChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete account.');
    } finally {
      setBusyUserId(null);
    }
  }

  const groupedUnitOptions = useMemo(() => {
    const groups: Array<{ label: OfficeUnitOption['group']; items: OfficeUnitOption[] }> = [
      { label: 'Academic Departments', items: [] },
      { label: 'Executive & Administrative Offices', items: [] },
      { label: 'Residential Halls & Welfare Services', items: [] },
      { label: 'Research, ICT & Quality Cells', items: [] },
      { label: 'Central Administration', items: [] },
    ];
    for (const opt of officeCatalog) {
      groups.find((g) => g.label === opt.group)?.items.push(opt);
    }
    return groups.filter((g) => g.items.length > 0);
  }, [officeCatalog]);

  return (
    <div className="space-y-6">
      {/* Feedback & Error Alerts */}
      {feedback && (
        <div
          role="status"
          className="px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-medium text-emerald-900 flex items-center justify-between gap-3"
        >
          <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-emerald-700 hover:text-emerald-950 cursor-pointer"
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
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-700 hover:text-red-950 cursor-pointer"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Provisioning Actions */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-200 pb-4">
          <div className="space-y-1">
            <h2 className="font-serif text-xl font-medium text-slate-950">
              University User Directory &amp; Account Provisioning
            </h2>
            <p className="text-xs text-slate-600">
              Create officer and faculty accounts across all university offices and academic departments, provision new administrator accounts, and manage directory permissions.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={openCreateOfficerModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-pust-900 text-white hover:bg-pust-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Officer / Teacher</span>
            </button>
            <button
              type="button"
              onClick={openCreateAdminModal}
              title="Add another administrator with your exact same full system powers"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border border-pust-900 bg-white text-pust-900 hover:bg-pust-900 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShieldPlus className="w-4 h-4" />
              <span>Add Co-Admin</span>
            </button>
            <button
              type="button"
              onClick={() => void loadUsers()}
              disabled={loading}
              aria-label="Refresh directory"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-stone-300 bg-[#F7F7F5] text-slate-700 hover:border-pust-800 hover:text-slate-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* 4-Column KPI Strip */}
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] px-4 py-3">
            <dt className="text-[11px] font-medium text-slate-600">Total Directory Accounts</dt>
            <dd className="font-mono text-2xl font-semibold text-slate-950 tabular-nums mt-0.5">
              {summary.total}
            </dd>
          </div>
          <div className="rounded-xl border border-stone-200 bg-[#F5F7FA] px-4 py-3">
            <dt className="text-[11px] font-medium text-slate-600">University Admins</dt>
            <dd className="font-mono text-2xl font-semibold text-pust-900 tabular-nums mt-0.5">
              {summary.admins}
            </dd>
          </div>
          <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] px-4 py-3">
            <dt className="text-[11px] font-medium text-slate-600">Officers &amp; Faculty</dt>
            <dd className="font-mono text-2xl font-semibold text-slate-950 tabular-nums mt-0.5">
              {summary.officersAndTeachers}
            </dd>
          </div>
          <div className="rounded-xl border border-stone-200 bg-[#FBF6EE] px-4 py-3">
            <dt className="text-[11px] font-medium text-slate-600">Pending Approvals</dt>
            <dd className="font-mono text-2xl font-semibold text-amber-800 tabular-nums mt-0.5">
              {summary.pending}
            </dd>
          </div>
        </dl>

        {/* Search & Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-1">
          <div className="lg:col-span-5 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, email, academic ID, office, or designation..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
            />
          </div>

          <div className="lg:col-span-3">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'all' | 'officers' | UserRole)}
              aria-label="Filter by role"
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
            >
              <option value="all">All Roles ({summary.total})</option>
              <option value="admin">Admins ({summary.admins})</option>
              <option value="officers">Officers &amp; Faculty ({summary.officersAndTeachers})</option>
              <option value="teacher">Teachers Only</option>
              <option value="chairman">Department Chairmen</option>
              <option value="registrar">Administrative / Registrar Officers</option>
              <option value="vc">Vice-Chancellor / Pro-VC Office</option>
              <option value="proctor">Proctor Office</option>
              <option value="library">Central Library Office</option>
              <option value="hall">Hall Provosts</option>
              <option value="student">Students ({summary.students})</option>
            </select>
          </div>

          <div className="lg:col-span-4">
            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              aria-label="Filter by office or department"
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
            >
              <option value="ALL">All University Offices &amp; Departments</option>
              {groupedUnitOptions.map((grp) => (
                <optgroup key={grp.label} label={grp.label}>
                  {grp.items.map((opt) => (
                    <option key={opt.key} value={opt.code}>
                      {opt.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        {/* Approval Status Segmented Filter */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-stone-100 border border-stone-200">
            {(
              [
                { id: 'all', label: 'All Statuses' },
                { id: 'approved', label: 'Approved' },
                { id: 'pending', label: `Pending (${summary.pending})` },
                { id: 'rejected', label: 'Rejected' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setStatusFilter(item.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                  statusFilter === item.id
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <p className="font-mono text-xs text-slate-600 tabular-nums">
            Showing {filteredUsers.length} of {users.length} accounts
          </p>
        </div>

        {/* Directory Table / List */}
        {loading && users.length === 0 ? (
          <div className="space-y-2 py-4">
            {[1, 2, 3, 4].map((row) => (
              <div
                key={row}
                className="h-14 rounded-xl bg-stone-100 animate-pulse border border-stone-200"
              />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] p-8 text-center space-y-3">
            <p className="text-sm font-medium text-slate-800">
              {users.length === 0
                ? 'No directory accounts found yet.'
                : 'No accounts match your search or filter criteria.'}
            </p>
            <p className="text-xs text-slate-600">
              {users.length === 0
                ? 'Provision your first university officer, faculty member, or administrator account.'
                : 'Try clearing filters or create a new account directly.'}
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              {(searchQuery || roleFilter !== 'all' || statusFilter !== 'all' || unitFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setRoleFilter('all');
                    setStatusFilter('all');
                    setUnitFilter('ALL');
                  }}
                  className="px-3.5 py-2 text-xs font-medium rounded-lg border border-stone-300 bg-white text-slate-700 hover:border-pust-800 cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
              <button
                type="button"
                onClick={openCreateOfficerModal}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-pust-900 text-white hover:bg-pust-950 cursor-pointer"
              >
                Create Officer / Teacher
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-stone-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F7F7F5] border-b border-stone-200 text-slate-600 font-medium">
                  <th className="py-3 px-4">User &amp; Contact</th>
                  <th className="py-3 px-3">Role &amp; ID</th>
                  <th className="py-3 px-3">Office / Department</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredUsers.map((u, idx) => {
                  const isSelf = u.id === currentUser.id;
                  const isBusy = busyUserId === u.id;
                  const isDeleting = confirmDeleteId === u.id;
                  const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-[#FAF9F6]';
                  const officeLabel = u.officeName || u.departmentCode;

                  return (
                    <tr key={u.id} className={`${rowBg} hover:bg-[#F3EFE8]/60 transition-colors`}>
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-0.5 min-w-[190px]">
                          <p className="font-semibold text-sm text-slate-950 flex flex-wrap items-center gap-1.5">
                            <span>{u.name}</span>
                            {isSelf && (
                              <span className="font-mono text-[11px] font-medium text-pust-800">
                                · Current Session
                              </span>
                            )}
                          </p>
                          {u.designation && (
                            <p className="text-xs text-slate-700">{u.designation}</p>
                          )}
                          <p className="font-mono text-[11px] text-slate-500 break-all">
                            {u.email}
                          </p>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 align-top whitespace-nowrap">
                        <div className="space-y-0.5">
                          <p className="font-medium text-slate-900">
                            {ROLE_DISPLAY_NAMES[u.role]}
                          </p>
                          <p className="font-mono text-[11px] text-slate-600 tabular-nums">
                            ID: {u.academicId}
                          </p>
                          {u.role === 'teacher' &&
                            ((u.assignedCourses?.length ?? 0) > 0 ||
                              (u.assignedSessions?.length ?? 0) > 0) && (
                              <p className="font-mono text-[11px] text-pust-800 max-w-[210px] truncate">
                                Courses: {(u.assignedCourses || []).join(', ') || '—'}
                              </p>
                            )}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 align-top">
                        <div className="space-y-0.5 min-w-[160px] max-w-[240px]">
                          <p className="font-medium text-slate-900">{officeLabel}</p>
                          <p className="font-mono text-[11px] text-slate-500">
                            {u.officeCode || u.departmentCode} · {u.hallAffiliation}
                          </p>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 align-top whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 font-medium ${
                            u.approvalStatus === 'approved'
                              ? 'text-emerald-700'
                              : u.approvalStatus === 'rejected'
                              ? 'text-red-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {u.approvalStatus === 'approved' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          ) : u.approvalStatus === 'rejected' ? (
                            <XCircle className="w-3.5 h-3.5 shrink-0" />
                          ) : null}
                          <span className="capitalize">{u.approvalStatus}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        {isDeleting ? (
                          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                            <span className="text-[11px] font-medium text-red-800 mr-1">
                              Delete user?
                            </span>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => void handleConfirmDelete(u)}
                              className="px-2.5 py-1.5 rounded-lg bg-red-700 text-white font-semibold hover:bg-red-800 disabled:opacity-50 cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white text-slate-700 hover:text-slate-950 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            {u.approvalStatus !== 'approved' && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => void handleQuickApproval(u, 'approved')}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-pust-900 text-white font-medium hover:bg-pust-950 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Approve
                              </button>
                            )}
                            {u.approvalStatus === 'pending' && !isSelf && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => void handleQuickApproval(u, 'rejected')}
                                className="px-2.5 py-1.5 rounded-lg border border-red-200 bg-white text-red-700 font-medium hover:bg-red-50 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                              >
                                Reject
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => openEditModalFor(u)}
                              title="Edit account, role, or office"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white text-slate-700 hover:border-pust-800 hover:text-pust-900 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => {
                                setError(null);
                                setPasswordTarget(u);
                                setNewPassword('');
                                setShowResetPassword(false);
                              }}
                              title="Reset account password"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white text-slate-700 hover:border-pust-800 hover:text-pust-900 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              Password
                            </button>
                            {!isSelf && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => setConfirmDeleteId(u.id)}
                                title="Delete account"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 bg-white text-red-700 hover:bg-red-50 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal 1: Create Officer or Teacher Account for Any Office / Department */}
      {showCreateOfficerModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-[2px] p-4 overflow-y-auto"
          onClick={() => setShowCreateOfficerModal(false)}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-2xl border border-stone-200 shadow-2xl overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-stone-200 bg-[#FAF9F6] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-pust-900 shrink-0" />
                <div>
                  <h3 className="font-serif text-lg font-medium text-slate-950">
                    Create Officer or Teacher Account
                  </h3>
                  <p className="text-xs text-slate-600">
                    Provision faculty or administrative officer credentials for any university office or department.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateOfficerModal(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-stone-200/70 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOfficerSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block font-medium text-slate-700 mb-1">
                    Assigned University Office or Academic Department
                  </label>
                  <select
                    required
                    value={officerUnitKey}
                    onChange={(e) => handleOfficerUnitChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  >
                    {groupedUnitOptions.map((grp) => (
                      <optgroup key={grp.label} label={grp.label}>
                        {grp.items.map((opt) => (
                          <option key={opt.key} value={opt.key}>
                            {opt.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Portal Account Role
                  </label>
                  <select
                    required
                    value={officerRole}
                    onChange={(e) => setOfficerRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  >
                    {OFFICER_AND_TEACHER_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_DISPLAY_NAMES[r]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Official Designation
                  </label>
                  <input
                    type="text"
                    value={officerDesignation}
                    onChange={(e) => setOfficerDesignation(e.target.value)}
                    placeholder="e.g. Assistant Professor, Section Officer, Provost"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    value={officerName}
                    onChange={(e) => setOfficerName(e.target.value)}
                    placeholder="e.g. Dr. Md. Rafiqul Islam"
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
                    value={officerEmail}
                    onChange={(e) => setOfficerEmail(e.target.value)}
                    placeholder="officer@pust.ac.bd"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Employee / Academic ID
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    value={officerAcademicId}
                    onChange={(e) => setOfficerAcademicId(e.target.value)}
                    placeholder="e.g. PUST-FAC-104 or PUST-REG-09"
                    className="w-full px-3 py-2 font-mono rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Unit Code &amp; Building / Hall
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      required
                      minLength={2}
                      value={officerDeptCode}
                      onChange={(e) => setOfficerDeptCode(e.target.value.toUpperCase())}
                      placeholder="Code"
                      className="px-2.5 py-2 font-mono uppercase rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                    />
                    <input
                      type="text"
                      required
                      minLength={2}
                      value={officerHallAffiliation}
                      onChange={(e) => setOfficerHallAffiliation(e.target.value)}
                      placeholder="Building / Hall"
                      className="col-span-2 px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-medium text-slate-700">Initial Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setOfficerPassword(generateStrongPassword());
                        setShowOfficerPassword(true);
                      }}
                      className="text-[11px] font-medium text-pust-800 hover:underline cursor-pointer"
                    >
                      Generate Strong
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showOfficerPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={officerPassword}
                      onChange={(e) => setOfficerPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full pr-9 pl-3 py-2 font-mono rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOfficerPassword((v) => !v)}
                      aria-label="Toggle password visibility"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      {showOfficerPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Initial Account Status
                  </label>
                  <select
                    value={officerStatus}
                    onChange={(e) => setOfficerStatus(e.target.value as ApprovalStatus)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  >
                    <option value="approved">Approved (Active Immediately)</option>
                    <option value="pending">Pending Review</option>
                  </select>
                </div>

                {officerRole === 'teacher' && (
                  <>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        Assigned Courses (optional, comma-separated)
                      </label>
                      <input
                        type="text"
                        value={officerCourses}
                        onChange={(e) => setOfficerCourses(e.target.value)}
                        placeholder="e.g. CSE-3201, CSE-3203"
                        className="w-full px-3 py-2 font-mono rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        Assigned Sessions (optional, comma-separated)
                      </label>
                      <input
                        type="text"
                        value={officerSessions}
                        onChange={(e) => setOfficerSessions(e.target.value)}
                        placeholder="e.g. 2022-23, 2023-24"
                        className="w-full px-3 py-2 font-mono rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateOfficerModal(false)}
                  className="px-4 py-2 rounded-lg border border-stone-300 bg-white text-slate-700 font-medium hover:text-slate-950 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingOfficer}
                  className="px-5 py-2 rounded-lg bg-pust-900 text-white font-semibold hover:bg-pust-950 disabled:opacity-60 cursor-pointer"
                >
                  {creatingOfficer ? 'Creating Account...' : 'Create Officer / Teacher Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Create New University Admin Account */}
      {showCreateAdminModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-[2px] p-4 overflow-y-auto"
          onClick={() => setShowCreateAdminModal(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl border border-stone-200 shadow-2xl overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-stone-200 bg-[#FAF9F6] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <ShieldPlus className="w-4 h-4 text-pust-900 shrink-0" />
                <div>
                  <h3 className="font-serif text-lg font-medium text-slate-950">
                    Add Co-Administrator (Same Full Power)
                  </h3>
                  <p className="text-xs text-slate-600">
                    Provision an additional admin account with identical, unrestricted permissions.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateAdminModal(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-stone-200/70 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAdminSubmit} className="p-6 space-y-3.5 text-xs">
              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-950 leading-relaxed space-y-1">
                <p className="font-semibold">Full Administrative Parity</p>
                <p>
                  This account shares your exact system authority: User Directory &amp; Co-Admin provisioning, Audit Log inspection, Public CMS &amp; Edit Mode, Finance &amp; Gateways, and all Academic Office workflows.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block font-medium text-slate-700 mb-1">
                    Administrator Full Name
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="e.g. Md. Tariqul Islam"
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
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin.office@pust.ac.bd"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Administrator ID
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    value={adminId}
                    onChange={(e) => setAdminId(e.target.value)}
                    placeholder="PUST-ADMIN-02"
                    className="w-full px-3 py-2 font-mono rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={adminDesignation}
                    onChange={(e) => setAdminDesignation(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Office Building</label>
                  <input
                    type="text"
                    required
                    value={adminBuilding}
                    onChange={(e) => setAdminBuilding(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-medium text-slate-700">Initial Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        const pw = generateStrongPassword();
                        setAdminPassword(pw);
                        setAdminConfirmPassword(pw);
                        setShowAdminPassword(true);
                      }}
                      className="text-[11px] font-medium text-pust-800 hover:underline cursor-pointer"
                    >
                      Generate
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showAdminPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full pr-9 pl-3 py-2 font-mono rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword((v) => !v)}
                      aria-label="Toggle password visibility"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      {showAdminPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={adminConfirmPassword}
                    onChange={(e) => setAdminConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full px-3 py-2 font-mono rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-medium text-slate-700 mb-1">Account Status</label>
                  <select
                    value={adminStatus}
                    onChange={(e) => setAdminStatus(e.target.value as ApprovalStatus)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  >
                    <option value="approved">Approved — Immediate Full Admin Login</option>
                    <option value="pending">Pending Review (Login blocked until approved)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateAdminModal(false)}
                  className="px-4 py-2 rounded-lg border border-stone-300 bg-white text-slate-700 font-medium hover:text-slate-950 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingAdmin}
                  className="px-5 py-2 rounded-lg bg-pust-900 text-white font-semibold hover:bg-pust-950 disabled:opacity-60 cursor-pointer"
                >
                  {creatingAdmin ? 'Creating Co-Admin...' : 'Create Co-Admin Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Edit User Details, Role & Office Assignment */}
      {editingUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-[2px] p-4 overflow-y-auto"
          onClick={() => setEditingUser(null)}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-2xl border border-stone-200 shadow-2xl overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-stone-200 bg-[#FAF9F6] flex items-center justify-between gap-3">
              <div>
                <h3 className="font-serif text-lg font-medium text-slate-950">
                  Edit User Account · {editingUser.name}
                </h3>
                <p className="text-xs text-slate-600">
                  Update role, assigned office or department, designation, and activation state.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-stone-200/70 cursor-pointer"
                aria-label="Close edit modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUserEdit} className="p-6 space-y-4 text-xs">
              {editRole === 'admin' && editingUser.role !== 'admin' && (
                <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-950 leading-relaxed">
                  Promoting this user to <strong>University Admin</strong> grants the exact same full system powers as your own administrator account.
                </div>
              )}
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
                  <label className="block font-medium text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Role</label>
                  <select
                    value={editRole}
                    disabled={editingUser.id === currentUser.id}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 disabled:opacity-60 focus:bg-white focus:outline-none focus:border-pust-800"
                  >
                    {ALL_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_DISPLAY_NAMES[r]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Account Status</label>
                  <select
                    value={editStatus}
                    disabled={editingUser.id === currentUser.id}
                    onChange={(e) => setEditStatus(e.target.value as ApprovalStatus)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 disabled:opacity-60 focus:bg-white focus:outline-none focus:border-pust-800"
                  >
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Department / Office Code
                  </label>
                  <input
                    type="text"
                    required
                    value={editDeptCode}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setEditDeptCode(val);
                      setEditOfficeCode(val);
                    }}
                    className="w-full px-3 py-2 font-mono uppercase rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Assigned Office / Unit Name
                  </label>
                  <select
                    value={
                      officeCatalog.find(
                        (o) =>
                          o.code === editDeptCode &&
                          o.name.replace(/\s+\([^)]+\)$/, '') === editOfficeName
                      )?.key || ''
                    }
                    onChange={(e) => {
                      const found = officeCatalog.find((o) => o.key === e.target.value);
                      if (found) {
                        setEditDeptCode(found.code);
                        setEditOfficeCode(found.code);
                        setEditOfficeName(found.name.replace(/\s+\([^)]+\)$/, ''));
                        setEditHallAffiliation(found.defaultHallAffiliation);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  >
                    <option value="">Keep custom ({editOfficeName || editDeptCode})</option>
                    {groupedUnitOptions.map((grp) => (
                      <optgroup key={grp.label} label={grp.label}>
                        {grp.items.map((opt) => (
                          <option key={opt.key} value={opt.key}>
                            {opt.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={editDesignation}
                    onChange={(e) => setEditDesignation(e.target.value)}
                    placeholder="Official title / designation"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Employee / Academic ID
                  </label>
                  <input
                    type="text"
                    required
                    value={editAcademicId}
                    onChange={(e) => setEditAcademicId(e.target.value)}
                    className="w-full px-3 py-2 font-mono rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-medium text-slate-700 mb-1">
                    Building / Hall Affiliation
                  </label>
                  <input
                    type="text"
                    required
                    value={editHallAffiliation}
                    onChange={(e) => setEditHallAffiliation(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  />
                </div>

                {editRole === 'teacher' && (
                  <>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        Assigned Courses (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={editCourses}
                        onChange={(e) => setEditCourses(e.target.value)}
                        placeholder="e.g. CSE-3201, CSE-3203"
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
                  {savingEdit ? 'Saving...' : 'Save Account Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Admin Password Reset */}
      {passwordTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-[2px] p-4 overflow-y-auto"
          onClick={() => setPasswordTarget(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl border border-stone-200 shadow-2xl overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-stone-200 bg-[#FAF9F6] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-pust-900" />
                <h3 className="font-serif text-lg font-medium text-slate-950">Reset Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setPasswordTarget(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleResetPasswordSubmit} className="p-6 space-y-4 text-xs">
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
