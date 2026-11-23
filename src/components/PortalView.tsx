import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { LogOut, Search } from 'lucide-react';
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
  StudentRecord,
  UserRole,
  ViceChancellorRecord,
} from '../types/pust';

const HALL_OPTIONS = [
  'July 06 Hall',
  'Male Hall-1',
  'Male Hall-2',
  'Female Hall-1',
  'Female Hall-2',
  'Non-Residential',
];

const SESSION_FILTERS = ['ALL', '2025-26', '2024-25', '2023-24', '2022-23', '2021-22'];

interface PortalViewProps {
  user: AuthUser | null;
  departments: DepartmentRecord[];
  bookmarks: BookmarkRecord[];
  bootstrapStatus: BootstrapStatus;
  aboutSections: AboutContentRecord[];
  vcProfiles: ViceChancellorRecord[];
  galleryItems: GalleryItemRecord[];
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
  const [offHall, setOffHall] = useState('Academic Block');

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
    Record<string, { chairmanNotes?: string; adminNotes?: string; disciplinaryStatus?: StudentRecord['disciplinaryStatus']; disciplinaryNotes?: string }>
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
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
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
            className="text-sm font-medium text-emerald-700 hover:text-emerald-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            ← Back to Public Website
          </button>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setAuthError(null);
              }}
              className={`px-4 py-2 text-xs sm:text-sm font-medium cursor-pointer ${
                authMode === 'login'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-100 text-slate-700 hover:text-emerald-800'
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
              className={`px-4 py-2 text-xs sm:text-sm font-medium cursor-pointer ${
                authMode === 'student-token'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-100 text-slate-700 hover:text-emerald-800'
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
              className={`px-4 py-2 text-xs sm:text-sm font-medium cursor-pointer ${
                authMode === 'officer'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-100 text-slate-700 hover:text-emerald-800'
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
                className={`px-4 py-2 text-xs sm:text-sm font-medium cursor-pointer ${
                  authMode === 'admin-claim'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:text-emerald-800'
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
                className={`px-4 py-2 text-xs sm:text-sm font-medium cursor-pointer ${
                  authMode === 'admin-passcode'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:text-emerald-800'
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
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 bg-slate-50 focus:outline-none focus:border-emerald-600 focus:bg-white"
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
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 bg-slate-50 focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-medium bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-60 cursor-pointer"
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
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 bg-slate-50 font-mono"
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
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 bg-slate-50"
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
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 bg-slate-50"
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
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 bg-slate-50"
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
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 bg-slate-50"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-medium bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-60 cursor-pointer"
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
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 bg-slate-50"
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
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 bg-slate-50"
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
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 bg-slate-50"
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
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1">
                    Department / Office Unit
                  </label>
                  <select
                    value={offDept}
                    onChange={(e) => setOffDept(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 bg-slate-50"
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
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 bg-slate-50"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-medium bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-60 cursor-pointer"
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
                className="w-full px-3.5 py-2 text-sm border border-slate-300 bg-slate-50"
              />
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@pust.ac.bd"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 bg-slate-50"
              />
              <input
                type="password"
                minLength={8}
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Strong Password (8+ chars)"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 bg-slate-50"
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-medium bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer"
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
                className="w-full px-3.5 py-2 text-sm border border-slate-300 bg-slate-50"
              />
              <input
                type="password"
                required
                value={adminPasscode}
                onChange={(e) => setAdminPasscode(e.target.value)}
                placeholder="Server ADMIN_PASSCODE"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 bg-slate-50"
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-medium bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer"
              >
                Sign In as Admin
              </button>
            </form>
          )}
        </div>
      </section>
    );
  }

  // Authenticated Role-Based Portal Workspace
  const portalTabs: Array<{ id: PortalTab; label: string }> = [
    { id: 'overview', label: 'Overview & Bookmarks' },
    { id: 'students', label: user.role === 'student' ? 'My Academic Profile' : 'Student Database' },
    { id: 'library', label: 'Library & Digital Card' },
    { id: 'halls', label: 'Residential Halls & Dues' },
    { id: 'exams', label: 'Exams, Admit Cards & Results' },
    { id: 'certificates', label: 'Certificate & 4-Office Clearance' },
    ...(user.role !== 'student'
      ? [{ id: 'governance' as PortalTab, label: 'Notices, Tokens & CMS' }]
      : []),
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase text-emerald-700">
            Authenticated Role: {user.role.toUpperCase()} · {user.departmentCode} · ID{' '}
            {user.academicId}
            {user.session ? ` · Session ${user.session}` : ''}
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl font-medium text-slate-900 mt-1">
            {user.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {user.email} · {user.hallAffiliation}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onBackToSite}
            className="px-4 py-2 text-xs sm:text-sm font-medium border border-slate-300 text-slate-700 hover:border-emerald-700 hover:text-emerald-700 cursor-pointer"
          >
            Public Website
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium border border-slate-300 text-slate-700 hover:border-red-400 hover:text-red-700 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Portal Module Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-4">
        {portalTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-emerald-700 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-300 hover:text-emerald-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview & Saved Bookmarks */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 bg-white border border-slate-200 p-6 space-y-4">
            <h2 className="font-serif text-xl font-medium text-slate-900">
              Saved Departments &amp; Circulars ({bookmarks.length})
            </h2>
            {bookmarks.length === 0 ? (
              <p className="text-sm text-slate-600">
                No saved bookmarks yet. Bookmark departments or notices while browsing the public
                site.
              </p>
            ) : (
              <div className="divide-y divide-slate-200 border border-slate-200">
                {bookmarks.map((b) => (
                  <div key={b.id} className="p-3.5 flex items-center justify-between gap-3 text-sm">
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
                      className="text-xs text-red-700 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-6 bg-white border border-slate-200 p-6 space-y-3">
            <h2 className="font-serif text-xl font-medium text-slate-900">
              Active Digital Services for {user.role.toUpperCase()}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Use the navigation tabs above to manage Library Membership cards, Residential Hall
              vacancies &amp; clearances, Semester Examination form fill-up &amp; Admit Cards,
              4-office Certificate clearances, and Departmental/Central Notices.
            </p>
            {user.role === 'teacher' && (
              <div className="p-4 border border-emerald-200 bg-emerald-50/40 text-xs space-y-1 font-mono">
                <p>Assigned Courses: {(user.assignedCourses || []).join(', ') || 'Pending Chairman assignment'}</p>
                <p>Assigned Sessions: {(user.assignedSessions || []).join(', ') || 'Pending Chairman assignment'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Combinable Student Database (Dept + Session + Search) */}
      {activeTab === 'students' && (
        <div className="bg-white border border-slate-200 p-6 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="font-serif text-2xl font-medium text-slate-900">
                {user.role === 'student'
                  ? 'My Verified Student Record'
                  : 'University Student Database (Combinable Dept + Session Filters)'}
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Filter simultaneously by Department and Session to inspect academic standing, hall
                seat allocation, disciplinary status, and departmental notes.
              </p>
            </div>

            {user.role !== 'student' && (
              <div className="flex flex-wrap gap-2">
                <select
                  value={stuDeptFilter}
                  disabled={user.role === 'chairman' || user.role === 'teacher'}
                  onChange={(e) => setStuDeptFilter(e.target.value)}
                  className="px-3 py-2 text-xs border border-slate-300 bg-slate-50"
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
                  className="px-3 py-2 text-xs border border-slate-300 bg-slate-50"
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
                    className="pl-8 pr-3 py-2 text-xs border border-slate-300 bg-slate-50"
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

          <div className="divide-y divide-slate-200 border border-slate-200">
            {students.map((stu) => {
              const edit = studentEditNotes[stu.id] || {};
              return (
                <div key={stu.id} className="p-4 space-y-2 text-sm">
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">
                        {stu.name} · <span className="font-mono">{stu.academicId}</span>
                      </p>
                      <p className="font-mono text-xs text-emerald-700 tabular-nums">
                        {stu.departmentCode} · Session {stu.session} · Sem {stu.currentSemester}{' '}
                        (Completed {stu.completedSemesters}/8) · CGPA {stu.cgpa.toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Hall: {stu.hallName} ({stu.seatNumber}) · Disciplinary:{' '}
                        <span className="font-semibold">{stu.disciplinaryStatus}</span> —{' '}
                        {stu.disciplinaryNotes}
                      </p>
                      <p className="text-xs text-slate-500">
                        Chairman Note: {stu.chairmanNotes} · Admin Note: {stu.adminNotes || '—'}
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
                          className="flex-1 min-w-[200px] px-3 py-1.5 text-xs border border-slate-300 bg-slate-50"
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
                          className="flex-1 min-w-[200px] px-3 py-1.5 text-xs border border-slate-300 bg-slate-50"
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
                                  disciplinaryStatus: e.target.value as StudentRecord['disciplinaryStatus'],
                                },
                              }))
                            }
                            className="px-2.5 py-1.5 text-xs border border-slate-300 bg-slate-50"
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
                            className="flex-1 min-w-[200px] px-3 py-1.5 text-xs border border-slate-300 bg-slate-50"
                          />
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => handleSaveStudentRecord(stu)}
                        className="px-3.5 py-1.5 text-xs font-medium bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer"
                      >
                        Save Record Note
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
    </section>
  );
}
