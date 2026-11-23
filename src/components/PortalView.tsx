'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Award,
  Bell,
  BookOpen,
  Building,
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { pustApi } from '../lib/api';
import { AdminCmsPanel } from './portal/AdminCmsPanel';
import { CertificatePanel } from './portal/CertificatePanel';
import { ExamPanel } from './portal/ExamPanel';
import { HallPanel } from './portal/HallPanel';
import { LibraryPanel } from './portal/LibraryPanel';
import type {
  AboutContentRecord,
  AuthUser,
  BookmarkRecord,
  BootstrapStatus,
  DepartmentRecord,
  GalleryItemRecord,
  NoticeRecord,
  StudentRecord,
  UserRole,
  ViceChancellorRecord,
} from '../types/pust';

const SESSION_FILTERS = ['ALL', '2025-26', '2024-25', '2023-24', '2022-23', '2021-22'];

interface PortalViewProps {
  user: AuthUser | null;
  departments: DepartmentRecord[];
  bookmarks: BookmarkRecord[];
  bootstrapStatus: BootstrapStatus;
  aboutSections: AboutContentRecord[];
  vcProfiles: ViceChancellorRecord[];
  galleryItems: GalleryItemRecord[];
  notices?: NoticeRecord[];
  onUserChange: (user: AuthUser | null) => void;
  onBookmarksChange: () => Promise<void>;
  onNoticesChange: () => Promise<void>;
  onCmsChange: () => Promise<void>;
  onBackToSite: () => void;
}

type AuthMode = 'login' | 'student-token' | 'officer' | 'admin-claim' | 'admin-passcode';
type PortalTab =
  | 'overview'
  | 'students'
  | 'library'
  | 'halls'
  | 'exams'
  | 'certificates'
  | 'governance';

export function PortalView({
  user,
  departments,
  bookmarks,
  bootstrapStatus,
  aboutSections,
  vcProfiles,
  galleryItems,
  notices = [],
  onUserChange,
  onBookmarksChange,
  onNoticesChange,
  onCmsChange,
  onBackToSite,
}: PortalViewProps) {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [activeTab, setActiveTab] = useState<PortalTab>('overview');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Student Token Signup fields
  const [stuToken, setStuToken] = useState('');
  const [stuName, setStuName] = useState('');
  const [stuEmail, setStuEmail] = useState('');
  const [stuPassword, setStuPassword] = useState('');
  const [stuDocs, setStuDocs] = useState('SSC Marksheet, HSC Marksheet, GST Admit Slip');

  // Officer / Teacher Registration fields
  const [offName, setOffName] = useState('');
  const [offEmail, setOffEmail] = useState('');
  const [offPassword, setOffPassword] = useState('');
  const [offRole, setOffRole] = useState<Exclude<UserRole, 'admin' | 'student'>>('teacher');
  const [offDept, setOffDept] = useState('CSE');
  const [offAcademicId, setOffAcademicId] = useState('');
  const [offHall] = useState('Academic Block');

  // Admin Claim / Passcode
  const [adminName, setAdminName] = useState('PUST Admin Office');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPasscode, setAdminPasscode] = useState('');

  // Combinable Student Database State
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [stuDeptFilter, setStuDeptFilter] = useState('ALL');
  const [stuSessionFilter, setStuSessionFilter] = useState('ALL');
  const [stuSearch, setStuSearch] = useState('');
  const [studentEditNotes, setStudentEditNotes] = useState<
    Record<
      string,
      {
        chairmanNotes?: string;
        adminNotes?: string;
        disciplinaryStatus?: StudentRecord['disciplinaryStatus'];
        disciplinaryNotes?: string;
      }
    >
  >({});
  const [stuSavedMsg, setStuSavedMsg] = useState<string | null>(null);

  const loadStudents = useCallback(async () => {
    if (!user) return;
    try {
      const res = await pustApi.getStudents({
        department: stuDeptFilter,
        session: stuSessionFilter,
        search: stuSearch,
      });
      setStudents(res.students);
    } catch {
      setStudents([]);
    }
  }, [user, stuDeptFilter, stuSessionFilter, stuSearch]);

  useEffect(() => {
    if (user) {
      loadStudents();
    }
  }, [user, loadStudents]);

  const targetedNotifications = useMemo(() => {
    if (!user) return [];
    return notices
      .filter((n) => {
        if (n.boardScope === 'central') return true;
        if (n.departmentCode === user.departmentCode) {
          if (!n.targetSession || !user.session) return true;
          return n.targetSession === user.session;
        }
        return false;
      })
      .slice(0, 5);
  }, [notices, user]);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setAuthMessage(null);
    setSubmitting(true);
    try {
      const res = await pustApi.login(loginEmail, loginPassword);
      onUserChange(res.user);
      await Promise.all([onBookmarksChange(), onNoticesChange()]);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStudentSignup(e: FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setAuthMessage(null);
    setSubmitting(true);
    try {
      const docs = stuDocs
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await pustApi.registerStudent({
        signupToken: stuToken,
        name: stuName,
        email: stuEmail,
        password: stuPassword,
        admissionDocuments: docs.length > 0 ? docs : ['Admission Verification Packet'],
      });
      setAuthMessage(res.pendingMessage);
      setAuthMode('login');
      setLoginEmail(stuEmail);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Student token registration failed.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOfficerSignup(e: FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setAuthMessage(null);
    setSubmitting(true);
    try {
      const res = await pustApi.registerOfficer({
        name: offName,
        email: offEmail,
        password: offPassword,
        role: offRole,
        departmentCode: offDept,
        academicId: offAcademicId,
        hallAffiliation: offHall,
      });
      setAuthMessage(res.pendingMessage);
      setAuthMode('login');
      setLoginEmail(offEmail);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Officer registration failed.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAdminClaim(e: FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setSubmitting(true);
    try {
      const res = await pustApi.bootstrapAdmin({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
      });
      onUserChange(res.user);
      await Promise.all([onBookmarksChange(), onNoticesChange()]);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Admin Office setup failed.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAdminPasscode(e: FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setSubmitting(true);
    try {
      const res = await pustApi.adminPasscodeLogin({
        name: adminName,
        email: adminEmail,
        passcode: adminPasscode,
      });
      onUserChange(res.user);
      await Promise.all([onBookmarksChange(), onNoticesChange()]);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Admin passcode sign-in failed.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    await pustApi.logout();
    onUserChange(null);
    await onNoticesChange();
  }

  async function handleSaveStudentRecord(stu: StudentRecord) {
    const patch = studentEditNotes[stu.id];
    if (!patch) return;
    await pustApi.updateStudentRecords(stu.id, patch);
    setStuSavedMsg(`Updated record for ${stu.name} (${stu.academicId}).`);
    await loadStudents();
  }

  // Unauthenticated Auth Screen
  if (!user) {
    return (
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-200 pb-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-emerald-800">
              PUST Integrated Digital University Platform
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-medium text-slate-900 mt-1">
              Campus Portal &amp; Institutional Services
            </h1>
            <p className="text-sm text-slate-600 mt-2">
              Sign in with your approved account, activate your admitted Student portal using a
              departmental signup token, or apply for an Officer/Teacher account.
            </p>
          </div>
          <button
            type="button"
            onClick={onBackToSite}
            className="text-sm font-medium text-emerald-800 hover:text-emerald-950 whitespace-nowrap shrink-0 cursor-pointer"
          >
            ← Back to Public Website
          </button>
        </div>

        <div className="bg-white border border-stone-200 p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap gap-2 border-b border-stone-200 pb-4">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setAuthError(null);
              }}
              className={`px-4 py-2 text-xs sm:text-sm font-medium whitespace-nowrap cursor-pointer ${
                authMode === 'login'
                  ? 'bg-emerald-800 text-white'
                  : 'bg-stone-100 text-slate-700 hover:text-emerald-800'
              }`}
            >
              Member Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('student-token');
                setAuthError(null);
              }}
              className={`px-4 py-2 text-xs sm:text-sm font-medium whitespace-nowrap cursor-pointer ${
                authMode === 'student-token'
                  ? 'bg-emerald-800 text-white'
                  : 'bg-stone-100 text-slate-700 hover:text-emerald-800'
              }`}
            >
              Student Token Signup
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('officer');
                setAuthError(null);
              }}
              className={`px-4 py-2 text-xs sm:text-sm font-medium whitespace-nowrap cursor-pointer ${
                authMode === 'officer'
                  ? 'bg-emerald-800 text-white'
                  : 'bg-stone-100 text-slate-700 hover:text-emerald-800'
              }`}
            >
              Officer / Teacher Signup
            </button>
            {!bootstrapStatus.adminConfigured && !bootstrapStatus.envAdminActive && (
              <button
                type="button"
                onClick={() => {
                  setAuthMode('admin-claim');
                  setAuthError(null);
                }}
                className={`px-4 py-2 text-xs sm:text-sm font-medium whitespace-nowrap cursor-pointer ${
                  authMode === 'admin-claim'
                    ? 'bg-emerald-800 text-white'
                    : 'bg-stone-100 text-slate-700 hover:text-emerald-800'
                }`}
              >
                Claim Initial Admin Office
              </button>
            )}
            {bootstrapStatus.envAdminActive && (
              <button
                type="button"
                onClick={() => {
                  setAuthMode('admin-passcode');
                  setAuthError(null);
                }}
                className={`px-4 py-2 text-xs sm:text-sm font-medium whitespace-nowrap cursor-pointer ${
                  authMode === 'admin-passcode'
                    ? 'bg-emerald-800 text-white'
                    : 'bg-stone-100 text-slate-700 hover:text-emerald-800'
                }`}
              >
                Admin Passcode Sign In
              </button>
            )}
          </div>

          {authError && (
            <div className="p-3.5 border border-red-200 bg-red-50 text-sm text-red-900">
              {authError}
            </div>
          )}
          {authMessage && (
            <div className="p-3.5 border border-emerald-200 bg-emerald-50 text-sm text-emerald-900">
              {authMessage}
            </div>
          )}

          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1.5">
                  Institutional Email
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="member@pust.ac.bd"
                  className="w-full px-3.5 py-2.5 text-sm border border-stone-300 bg-stone-50 focus:outline-none focus:border-emerald-700 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-3.5 py-2.5 text-sm border border-stone-300 bg-stone-50 focus:outline-none focus:border-emerald-700 focus:bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-medium bg-emerald-800 text-white hover:bg-emerald-900 disabled:opacity-60 cursor-pointer"
              >
                {submitting ? 'Signing In...' : 'Sign In to Campus Portal'}
              </button>
            </form>
          )}

          {authMode === 'student-token' && (
            <form onSubmit={handleStudentSignup} className="space-y-4 max-w-xl">
              <p className="text-xs text-slate-600">
                Student accounts require a unique signup token issued by your Department Chairman or
                the Admin Office after admission verification.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1">
                    Portal Signup Token
                  </label>
                  <input
                    type="text"
                    required
                    value={stuToken}
                    onChange={(e) => setStuToken(e.target.value)}
                    placeholder="PUST-CSE-..."
                    className="w-full px-3.5 py-2 text-sm border border-stone-300 bg-stone-50 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={stuName}
                    onChange={(e) => setStuName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-stone-300 bg-stone-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={stuEmail}
                    onChange={(e) => setStuEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-stone-300 bg-stone-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1">
                    Password (8+ characters)
                  </label>
                  <input
                    type="password"
                    minLength={8}
                    required
                    value={stuPassword}
                    onChange={(e) => setStuPassword(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-stone-300 bg-stone-50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1">
                  Admission Documents Submitted (comma-separated)
                </label>
                <input
                  type="text"
                  required
                  value={stuDocs}
                  onChange={(e) => setStuDocs(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-stone-300 bg-stone-50"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-medium bg-emerald-800 text-white hover:bg-emerald-900 disabled:opacity-60 cursor-pointer"
              >
                {submitting ? 'Submitting...' : 'Submit for Chairman Approval'}
              </button>
            </form>
          )}

          {authMode === 'officer' && (
            <form onSubmit={handleOfficerSignup} className="space-y-4 max-w-xl">
              <p className="text-xs text-slate-600">
                Teachers require approval from their Department Chairman; Registrar, VC, Chairman,
                Proctor, Library, and Hall officers require approval from the Admin Office.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={offName}
                    onChange={(e) => setOffName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-stone-300 bg-stone-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1">
                    Official Role
                  </label>
                  <select
                    value={offRole}
                    onChange={(e) =>
                      setOffRole(e.target.value as Exclude<UserRole, 'admin' | 'student'>)
                    }
                    className="w-full px-3.5 py-2 text-sm border border-stone-300 bg-stone-50"
                  >
                    <option value="teacher">Teacher (Chairman Approval)</option>
                    <option value="chairman">Department Chairman (Admin Approval)</option>
                    <option value="registrar">Registrar Office (Admin Approval)</option>
                    <option value="vc">Vice-Chancellor Office (Admin Approval)</option>
                    <option value="proctor">Proctor Office (Admin Approval)</option>
                    <option value="library">Library Office (Admin Approval)</option>
                    <option value="hall">Hall Provost / Office (Admin Approval)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={offEmail}
                    onChange={(e) => setOffEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-stone-300 bg-stone-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1">
                    Password (8+ chars)
                  </label>
                  <input
                    type="password"
                    minLength={8}
                    required
                    value={offPassword}
                    onChange={(e) => setOffPassword(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-stone-300 bg-stone-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1">
                    Department / Office Unit
                  </label>
                  <select
                    value={offDept}
                    onChange={(e) => setOffDept(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-stone-300 bg-stone-50"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.code}>
                        {d.code} — {d.name}
                      </option>
                    ))}
                    <option value="ADMIN">Central Administration</option>
                    <option value="LIB">Central Library</option>
                    <option value="HALL">Hall Office</option>
                    <option value="PROCTOR">Proctorial Office</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1">
                    Officer / Faculty ID
                  </label>
                  <input
                    type="text"
                    required
                    value={offAcademicId}
                    onChange={(e) => setOffAcademicId(e.target.value)}
                    placeholder="PUST-FAC-104"
                    className="w-full px-3.5 py-2 text-sm border border-stone-300 bg-stone-50"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-medium bg-emerald-800 text-white hover:bg-emerald-900 disabled:opacity-60 cursor-pointer"
              >
                Submit Officer / Teacher Application
              </button>
            </form>
          )}

          {authMode === 'admin-claim' && (
            <form onSubmit={handleAdminClaim} className="space-y-4 max-w-md">
              <p className="text-xs text-slate-600">
                First-time setup: claim the central Admin Office account to approve officers,
                issue tokens, configure payments, and manage CMS content.
              </p>
              <input
                type="text"
                required
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="Admin Officer Name"
                className="w-full px-3.5 py-2 text-sm border border-stone-300 bg-stone-50"
              />
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@pust.ac.bd"
                className="w-full px-3.5 py-2 text-sm border border-stone-300 bg-stone-50"
              />
              <input
                type="password"
                minLength={8}
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Strong Password (8+ chars)"
                className="w-full px-3.5 py-2 text-sm border border-stone-300 bg-stone-50"
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-medium bg-emerald-800 text-white hover:bg-emerald-900 cursor-pointer"
              >
                Claim Admin Office Account
              </button>
            </form>
          )}

          {authMode === 'admin-passcode' && (
            <form onSubmit={handleAdminPasscode} className="space-y-4 max-w-md">
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@pust.ac.bd"
                className="w-full px-3.5 py-2 text-sm border border-stone-300 bg-stone-50"
              />
              <input
                type="password"
                required
                value={adminPasscode}
                onChange={(e) => setAdminPasscode(e.target.value)}
                placeholder="Server ADMIN_PASSCODE"
                className="w-full px-3.5 py-2 text-sm border border-stone-300 bg-stone-50"
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-medium bg-emerald-800 text-white hover:bg-emerald-900 cursor-pointer"
              >
                Sign In as Admin
              </button>
            </form>
          )}
        </div>
      </section>
    );
  }

  // Authenticated Role-Based Portal Workspace (256px Sidebar + Contextual Breadcrumb Header)
  const portalTabs: Array<{ id: PortalTab; label: string; icon: typeof LayoutDashboard }> = [
    { id: 'overview', label: 'Overview & Notifications', icon: LayoutDashboard },
    {
      id: 'students',
      label: user.role === 'student' ? 'My Academic Profile' : 'Student Database',
      icon: Users,
    },
    { id: 'library', label: 'Library & Digital Card', icon: BookOpen },
    { id: 'halls', label: 'Residential Halls & Dues', icon: Building },
    { id: 'exams', label: 'Exams, Admit Cards & Results', icon: FileSpreadsheet },
    { id: 'certificates', label: 'Certificate & 4-Office Clearance', icon: Award },
    ...(user.role !== 'student'
      ? [{ id: 'governance' as PortalTab, label: 'Notices, Tokens & CMS', icon: ShieldCheck }]
      : []),
  ];

  const activeTabLabel = portalTabs.find((t) => t.id === activeTab)?.label || 'Overview';

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* 256px Workspace Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 bg-white border border-stone-200">
          <div className="p-5 border-b border-stone-200 space-y-1">
            <p className="font-mono text-[11px] uppercase tracking-wider text-emerald-800">
              {user.role.toUpperCase()} · {user.departmentCode}
            </p>
            <p className="font-serif text-lg font-medium text-slate-900 leading-snug">
              {user.name}
            </p>
            <p className="font-mono text-xs text-slate-500 tabular-nums">
              ID {user.academicId}
              {user.session ? ` · ${user.session}` : ''}
            </p>
          </div>

          <nav aria-label="Campus portal workspace modules" className="p-2 space-y-1">
            {portalTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-emerald-800 text-white'
                      : 'text-slate-700 hover:bg-stone-100 hover:text-emerald-900'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-3 border-t border-stone-200 space-y-2">
            <button
              type="button"
              onClick={onBackToSite}
              className="w-full px-3 py-2 text-xs font-medium border border-stone-300 text-slate-700 hover:border-emerald-800 hover:text-emerald-800 transition-colors cursor-pointer"
            >
              Public Website
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium border border-stone-300 text-slate-700 hover:border-red-400 hover:text-red-700 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Workspace Surface */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          {/* Top Contextual Breadcrumb Header */}
          <div className="bg-white border border-stone-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="font-mono text-xs text-slate-500">
                Digital Campus / <span className="text-emerald-800 font-semibold">{activeTabLabel}</span>
              </p>
              <h1 className="font-serif text-xl sm:text-2xl font-medium text-slate-900 mt-0.5">
                {activeTabLabel}
              </h1>
            </div>
            <p className="font-mono text-xs text-slate-600 tabular-nums">
              {user.email} · {user.hallAffiliation}
            </p>
          </div>

          {/* Tab 1: Overview, In-App Notifications & Saved Bookmarks */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                {/* Targeted In-App Notifications */}
                <div className="xl:col-span-7 bg-white border border-stone-200 p-6 space-y-4">
                  <div className="flex items-center justify-between gap-3 border-b border-stone-200 pb-3">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-emerald-800" />
                      <h2 className="font-serif text-xl font-medium text-slate-900">
                        Institutional &amp; Targeted Notifications
                      </h2>
                    </div>
                    <span className="font-mono text-xs text-slate-500 tabular-nums">
                      {targetedNotifications.length} active
                    </span>
                  </div>

                  {targetedNotifications.length === 0 ? (
                    <p className="text-sm text-slate-600">
                      No targeted notices or alerts at this time.
                    </p>
                  ) : (
                    <div className="divide-y divide-stone-200 border border-stone-200">
                      {targetedNotifications.map((n) => (
                        <div key={n.id} className="p-3.5 space-y-1 text-sm">
                          <p className="font-mono text-[11px] text-emerald-800 tabular-nums">
                            {n.publishedAt} · {n.category} · {n.departmentCode}
                            {n.targetSession ? ` · Session ${n.targetSession}` : ''}
                            {n.targetCourseCode ? ` · ${n.targetCourseCode}` : ''}
                          </p>
                          <p className="font-medium text-slate-900">{n.title}</p>
                          <p className="text-xs text-slate-600">{n.summary}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Saved Bookmarks */}
                <div className="xl:col-span-5 bg-white border border-stone-200 p-6 space-y-4">
                  <h2 className="font-serif text-xl font-medium text-slate-900 border-b border-stone-200 pb-3">
                    Saved Departments &amp; Circulars ({bookmarks.length})
                  </h2>
                  {bookmarks.length === 0 ? (
                    <p className="text-sm text-slate-600">
                      No saved bookmarks yet. Bookmark departments or notices while browsing the
                      public site.
                    </p>
                  ) : (
                    <div className="divide-y divide-stone-200 border border-stone-200">
                      {bookmarks.map((b) => (
                        <div
                          key={b.id}
                          className="p-3.5 flex items-center justify-between gap-3 text-sm"
                        >
                          <div>
                            <p className="font-medium text-slate-900">{b.title}</p>
                            <p className="text-xs text-slate-500">{b.subtitle}</p>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              await pustApi.removeBookmark(b.itemId);
                              await onBookmarksChange();
                            }}
                            className="text-xs text-red-700 hover:underline shrink-0 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {user.role === 'teacher' && (
                    <div className="p-4 border border-emerald-200 bg-emerald-50/40 text-xs space-y-1 font-mono">
                      <p className="font-semibold text-emerald-900">Teaching Assignment</p>
                      <p>
                        Courses:{' '}
                        {(user.assignedCourses || []).join(', ') || 'Pending Chairman assignment'}
                      </p>
                      <p>
                        Sessions:{' '}
                        {(user.assignedSessions || []).join(', ') || 'Pending Chairman assignment'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Combinable Student Database (Dept + Session + Search) */}
          {activeTab === 'students' && (
            <div className="bg-white border border-stone-200 p-6 space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-stone-200 pb-4">
                <div>
                  <h2 className="font-serif text-2xl font-medium text-slate-900">
                    {user.role === 'student'
                      ? 'My Verified Student Record'
                      : 'University Student Database (Combinable Dept + Session Filters)'}
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    Filter simultaneously by Department and Session to inspect academic standing,
                    hall seat allocation, disciplinary status, and departmental notes.
                  </p>
                </div>

                {user.role !== 'student' && (
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={stuDeptFilter}
                      disabled={user.role === 'chairman' || user.role === 'teacher'}
                      onChange={(e) => setStuDeptFilter(e.target.value)}
                      className="px-3 py-2 text-xs border border-stone-300 bg-stone-50"
                    >
                      <option value="ALL">All Departments</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.code}>
                          {d.code}
                        </option>
                      ))}
                    </select>
                    <select
                      value={stuSessionFilter}
                      onChange={(e) => setStuSessionFilter(e.target.value)}
                      className="px-3 py-2 text-xs border border-stone-300 bg-stone-50"
                    >
                      {SESSION_FILTERS.map((s) => (
                        <option key={s} value={s}>
                          {s === 'ALL' ? 'All Sessions' : `Session ${s}`}
                        </option>
                      ))}
                    </select>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="search"
                        value={stuSearch}
                        onChange={(e) => setStuSearch(e.target.value)}
                        placeholder="Name or ID..."
                        className="pl-8 pr-3 py-2 text-xs border border-stone-300 bg-stone-50"
                      />
                    </div>
                  </div>
                )}
              </div>

              {stuSavedMsg && (
                <div className="p-3 border border-emerald-200 bg-emerald-50 text-xs text-emerald-900">
                  {stuSavedMsg}
                </div>
              )}

              {students.length === 0 ? (
                <div className="py-8 text-sm text-slate-600">
                  No student records match the current Department/Session filter.
                </div>
              ) : (
                <div className="divide-y divide-stone-200 border border-stone-200">
                  {students.map((stu) => {
                    const edit = studentEditNotes[stu.id] || {};
                    return (
                      <div key={stu.id} className="p-4 space-y-2 text-sm">
                        <div className="flex flex-wrap justify-between gap-2">
                          <div>
                            <p className="font-medium text-slate-900">
                              {stu.name} · <span className="font-mono">{stu.academicId}</span>
                            </p>
                            <p className="font-mono text-xs text-emerald-800 tabular-nums">
                              {stu.departmentCode} · Session {stu.session} · Sem{' '}
                              {stu.currentSemester} (Completed {stu.completedSemesters}/8) · CGPA{' '}
                              {stu.cgpa.toFixed(2)}
                            </p>
                            <p className="text-xs text-slate-600 mt-0.5">
                              Hall: {stu.hallName} ({stu.seatNumber}) · Disciplinary:{' '}
                              <span className="font-semibold">{stu.disciplinaryStatus}</span> —{' '}
                              {stu.disciplinaryNotes}
                            </p>
                            <p className="text-xs text-slate-500">
                              Chairman Note: {stu.chairmanNotes} · Admin Note:{' '}
                              {stu.adminNotes || '—'}
                            </p>
                          </div>
                        </div>

                        {['chairman', 'admin', 'proctor'].includes(user.role) && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {user.role === 'chairman' && (
                              <input
                                type="text"
                                value={edit.chairmanNotes ?? stu.chairmanNotes}
                                onChange={(e) =>
                                  setStudentEditNotes((prev) => ({
                                    ...prev,
                                    [stu.id]: { ...edit, chairmanNotes: e.target.value },
                                  }))
                                }
                                placeholder="Update Chairman note..."
                                className="flex-1 min-w-[200px] px-3 py-1.5 text-xs border border-stone-300 bg-stone-50"
                              />
                            )}
                            {user.role === 'admin' && (
                              <input
                                type="text"
                                value={edit.adminNotes ?? stu.adminNotes}
                                onChange={(e) =>
                                  setStudentEditNotes((prev) => ({
                                    ...prev,
                                    [stu.id]: { ...edit, adminNotes: e.target.value },
                                  }))
                                }
                                placeholder="Update Admin note..."
                                className="flex-1 min-w-[200px] px-3 py-1.5 text-xs border border-stone-300 bg-stone-50"
                              />
                            )}
                            {user.role === 'proctor' && (
                              <>
                                <select
                                  value={edit.disciplinaryStatus ?? stu.disciplinaryStatus}
                                  onChange={(e) =>
                                    setStudentEditNotes((prev) => ({
                                      ...prev,
                                      [stu.id]: {
                                        ...edit,
                                        disciplinaryStatus: e.target
                                          .value as StudentRecord['disciplinaryStatus'],
                                      },
                                    }))
                                  }
                                  className="px-2.5 py-1.5 text-xs border border-stone-300 bg-stone-50"
                                >
                                  <option value="Clear">Clear</option>
                                  <option value="Warning">Warning</option>
                                  <option value="Under Review">Under Review</option>
                                </select>
                                <input
                                  type="text"
                                  value={edit.disciplinaryNotes ?? stu.disciplinaryNotes}
                                  onChange={(e) =>
                                    setStudentEditNotes((prev) => ({
                                      ...prev,
                                      [stu.id]: { ...edit, disciplinaryNotes: e.target.value },
                                    }))
                                  }
                                  placeholder="Disciplinary remarks..."
                                  className="flex-1 min-w-[200px] px-3 py-1.5 text-xs border border-stone-300 bg-stone-50"
                                />
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => handleSaveStudentRecord(stu)}
                              className="px-3.5 py-1.5 text-xs font-medium bg-emerald-800 text-white hover:bg-emerald-900 cursor-pointer"
                            >
                              Save Record Note
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'library' && <LibraryPanel user={user} />}
          {activeTab === 'halls' && <HallPanel user={user} />}
          {activeTab === 'exams' && <ExamPanel user={user} departments={departments} />}
          {activeTab === 'certificates' && <CertificatePanel user={user} />}
          {activeTab === 'governance' && user.role !== 'student' && (
            <AdminCmsPanel
              user={user}
              departments={departments}
              aboutSections={aboutSections}
              vcProfiles={vcProfiles}
              galleryItems={galleryItems}
              onNoticesChange={onNoticesChange}
              onCmsChange={onCmsChange}
            />
          )}
        </div>
      </div>
    </section>
  );
}
