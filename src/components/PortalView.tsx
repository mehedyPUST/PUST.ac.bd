'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  ArrowRight,
  Award,
  Bell,
  BookOpen,
  Building,
  Check,
  Eye,
  EyeOff,
  FileSpreadsheet,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import { pustApi } from '../lib/api';
import { PortalRecordsSkeleton } from './PustSkeletons';
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

  const [showPassword, setShowPassword] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  // Combinable Student Database State
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
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
    setLoadingStudents(true);
    try {
      const effectiveDept =
        user.role === 'chairman' || user.role === 'teacher'
          ? user.departmentCode
          : stuDeptFilter;
      const res = await pustApi.getStudents({
        department: effectiveDept,
        session: stuSessionFilter,
        search: stuSearch,
      });
      setStudents(res.students);
    } catch {
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  }, [user, stuDeptFilter, stuSessionFilter, stuSearch]);

  useEffect(() => {
    if (!user) return;
    setActiveTab('overview');
    if (user.role === 'chairman' || user.role === 'teacher') {
      setStuDeptFilter(user.departmentCode);
    } else {
      setStuDeptFilter('ALL');
    }
  }, [user]);

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

  const toggleAdmissionDoc = (docLabel: string) => {
    const existing = stuDocs
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (existing.includes(docLabel)) {
      const next = existing.filter((d) => d !== docLabel);
      setStuDocs(next.join(', '));
    } else {
      setStuDocs([...existing, docLabel].join(', '));
    }
  };

  // Unauthenticated Auth Screen
  if (!user) {
    const authModeMeta: Record<
      AuthMode,
      { eyebrow: string; title: string; summary: string }
    > = {
      login: {
        eyebrow: 'Institutional Sign In',
        title: 'Access Your Digital Campus Workspace',
        summary:
          'Sign in with your approved PUST email and password to manage library cards, residential hall seats, semester exam forms, and 4-office certificate clearances.',
      },
      'student-token': {
        eyebrow: 'Token-Verified Admission Onboarding',
        title: 'Activate Your Admitted Student Portal',
        summary:
          'Use the unique token issued by your Department Chairman or Admin Office to bind your Academic ID, submit verification documents, and unlock portal services.',
      },
      officer: {
        eyebrow: 'Faculty & Officer Registration',
        title: 'Apply for Institutional Office Access',
        summary:
          'Department Teachers are routed to their Chairman for approval; Chairmen, Registrar, VC, Proctor, Library, and Hall officers are verified by the Admin Office.',
      },
      'admin-claim': {
        eyebrow: 'First-Time Governance Bootstrap',
        title: 'Claim Central Admin Office Credentials',
        summary:
          'Initialize the central Admin Office account to approve officers, issue departmental student tokens, publish circulars, and manage university CMS data.',
      },
      'admin-passcode': {
        eyebrow: 'Environment Passcode Verification',
        title: 'Sign In via Server Admin Passcode',
        summary:
          'Authenticate as the central Admin Office using your institutional email and server-configured ADMIN_PASSCODE.',
      },
    };

    const currentMeta = authModeMeta[authMode];
    const selectedDocsList = stuDocs
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    return (
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-emerald-800">
              PUST Integrated Digital University Platform
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-medium text-slate-900 mt-1">
              Campus Portal Sign In &amp; Account Registration
            </h1>
          </div>
          <button
            type="button"
            onClick={onBackToSite}
            className="text-sm font-medium text-emerald-800 hover:text-emerald-950 whitespace-nowrap shrink-0 cursor-pointer"
          >
            ← Back to Public Website
          </button>
        </div>

        {/* Split Institutional Auth Studio Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 bg-white border border-stone-200 shadow-sm overflow-hidden">
          {/* Left Column: Single-Color Deep Emerald Gradient Banner & Workflow Cards */}
          <div className="lg:col-span-5 bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 text-white p-7 sm:p-8 flex flex-col justify-between gap-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                {!logoFailed && (
                  <img
                    src="https://pust.ac.bd/includes/images/pust_logo.png?key=38"
                    alt="PUST Crest"
                    referrerPolicy="no-referrer"
                    onError={() => setLogoFailed(true)}
                    className="w-10 h-10 object-contain bg-white p-1 shrink-0"
                  />
                )}
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-emerald-200">
                    Rajapur Campus · Pabna
                  </p>
                  <p className="font-serif text-base font-medium text-white">
                    Digital Campus Gateway
                  </p>
                </div>
              </div>

              <div
                key={authMode}
                className="space-y-2.5 animate__animated animate__fadeIn"
                style={{ animationDuration: '240ms' }}
              >
                <p className="font-mono text-[11px] uppercase tracking-widest text-emerald-300">
                  {currentMeta.eyebrow}
                </p>
                <h2 className="font-serif text-2xl font-medium text-white leading-snug">
                  {currentMeta.title}
                </h2>
                <p className="text-sm text-emerald-100/90 leading-relaxed">
                  {currentMeta.summary}
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                <div className="bg-white/10 border border-white/15 p-3.5 space-y-1">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-emerald-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Role-Verified Governance
                  </p>
                  <p className="text-xs text-emerald-50/90 leading-relaxed">
                    Strict separation across Student, Teacher, Chairman, Library, Hall, Proctor,
                    Registrar, VC, and Admin Office permissions.
                  </p>
                </div>

                <div className="bg-white/10 border border-white/15 p-3.5 space-y-1">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-emerald-200 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" />
                    Authenticated Campus Services
                  </p>
                  <p className="text-xs text-emerald-50/90 leading-relaxed">
                    Digital Library Card seals, Hall seat &amp; dues clearance, Exam Admit Cards,
                    and 4-Office Certificate tracking.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/15 flex items-center justify-between gap-2 font-mono text-[11px] text-emerald-200">
              <span>
                Storage:{' '}
                {bootstrapStatus.storageBackend === 'mongodb'
                  ? 'MongoDB Native Cluster'
                  : 'Seeded Portal Database'}
              </span>
              <span>HttpOnly JWT</span>
            </div>
          </div>

          {/* Right Column: Interactive Sign In / Sign Up Forms */}
          <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 space-y-6 bg-white">
            {/* Segmented Mode Switcher */}
            <div className="flex flex-wrap gap-1.5 border-b border-stone-200 pb-4">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError(null);
                  setShowPassword(false);
                }}
                className={`px-3.5 py-2 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  authMode === 'login'
                    ? 'bg-emerald-800 text-white'
                    : 'bg-[#FAF8F4] border border-stone-200 text-slate-700 hover:border-emerald-400 hover:text-emerald-800'
                }`}
              >
                Member Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('student-token');
                  setAuthError(null);
                  setShowPassword(false);
                }}
                className={`px-3.5 py-2 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  authMode === 'student-token'
                    ? 'bg-emerald-800 text-white'
                    : 'bg-[#FAF8F4] border border-stone-200 text-slate-700 hover:border-emerald-400 hover:text-emerald-800'
                }`}
              >
                Student Token Signup
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('officer');
                  setAuthError(null);
                  setShowPassword(false);
                }}
                className={`px-3.5 py-2 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  authMode === 'officer'
                    ? 'bg-emerald-800 text-white'
                    : 'bg-[#FAF8F4] border border-stone-200 text-slate-700 hover:border-emerald-400 hover:text-emerald-800'
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
                    setShowPassword(false);
                  }}
                  className={`px-3.5 py-2 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    authMode === 'admin-claim'
                      ? 'bg-emerald-800 text-white'
                      : 'bg-[#FAF8F4] border border-stone-200 text-slate-700 hover:border-emerald-400 hover:text-emerald-800'
                  }`}
                >
                  Claim Admin Office
                </button>
              )}
              {bootstrapStatus.envAdminActive && (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('admin-passcode');
                    setAuthError(null);
                    setShowPassword(false);
                  }}
                  className={`px-3.5 py-2 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    authMode === 'admin-passcode'
                      ? 'bg-emerald-800 text-white'
                      : 'bg-[#FAF8F4] border border-stone-200 text-slate-700 hover:border-emerald-400 hover:text-emerald-800'
                  }`}
                >
                  Admin Passcode
                </button>
              )}
            </div>

            {authError && (
              <div className="p-3.5 border border-red-200 bg-red-50 text-sm text-red-900 animate__animated animate__fadeIn">
                {authError}
              </div>
            )}
            {authMessage && (
              <div className="p-3.5 border border-emerald-200 bg-emerald-50 text-sm text-emerald-900 animate__animated animate__fadeIn">
                {authMessage}
              </div>
            )}

            {/* 1. Member Sign In Form */}
            {authMode === 'login' && (
              <form
                key="form-login"
                onSubmit={handleLogin}
                className="space-y-5 animate__animated animate__fadeIn"
                style={{ animationDuration: '240ms' }}
              >
                <div className="space-y-4">
                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-600 mb-1.5">
                      Institutional Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="member@pust.ac.bd"
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-700 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-600 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full pl-10 pr-10 py-2.5 text-sm border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-700 focus:bg-white transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-800 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 text-sm font-medium bg-gradient-to-r from-emerald-900 to-emerald-800 hover:from-emerald-950 hover:to-emerald-900 text-white shadow-xs disabled:opacity-60 transition-all cursor-pointer"
                  >
                    {submitting ? 'Signing In...' : 'Sign In to Campus Portal'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('student-token')}
                    className="text-xs font-medium text-emerald-800 hover:underline cursor-pointer"
                  >
                    Have an admission token? Activate account →
                  </button>
                </div>
              </form>
            )}

            {/* 2. Student Token Signup Form */}
            {authMode === 'student-token' && (
              <form
                key="form-student"
                onSubmit={handleStudentSignup}
                className="space-y-4 animate__animated animate__fadeIn"
                style={{ animationDuration: '240ms' }}
              >
                <div className="p-3.5 bg-[#FAF8F4] border border-stone-200 text-xs text-slate-700 leading-relaxed">
                  Step 1: Enter your departmental signup token · Step 2: Submit credentials &amp;
                  admission documents · Step 3: Your Department Chairman approves access.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-600 mb-1">
                      Portal Signup Token
                    </label>
                    <input
                      type="text"
                      required
                      value={stuToken}
                      onChange={(e) => setStuToken(e.target.value)}
                      placeholder="PUST-CSE-..."
                      className="w-full px-3.5 py-2.5 text-sm border border-stone-300 bg-[#FAF8F4] font-mono focus:outline-none focus:border-emerald-700 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-600 mb-1">
                      Student Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={stuName}
                      onChange={(e) => setStuName(e.target.value)}
                      placeholder="Full name as on SSC/HSC"
                      className="w-full px-3.5 py-2.5 text-sm border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-700 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-600 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={stuEmail}
                      onChange={(e) => setStuEmail(e.target.value)}
                      placeholder="student@pust.ac.bd"
                      className="w-full px-3.5 py-2.5 text-sm border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-700 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-600 mb-1">
                      Password (8+ chars)
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        minLength={8}
                        required
                        value={stuPassword}
                        onChange={(e) => setStuPassword(e.target.value)}
                        placeholder="Minimum 8 characters"
                        className="w-full pr-10 px-3.5 py-2.5 text-sm border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-700 focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-800 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-600">
                    Admission Documents Verified / Submitted
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'SSC Marksheet',
                      'HSC Marksheet',
                      'GST Admit Slip',
                      'NID / Birth Certificate',
                    ].map((docLabel) => {
                      const active = selectedDocsList.includes(docLabel);
                      return (
                        <button
                          key={docLabel}
                          type="button"
                          onClick={() => toggleAdmissionDoc(docLabel)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs border transition-colors cursor-pointer ${
                            active
                              ? 'bg-emerald-800 text-white border-emerald-900'
                              : 'bg-[#FAF8F4] text-slate-700 border-stone-200 hover:border-emerald-700'
                          }`}
                        >
                          {active && <Check className="w-3 h-3" />}
                          {docLabel}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    required
                    value={stuDocs}
                    onChange={(e) => setStuDocs(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-stone-300 bg-[#FAF8F4] font-mono focus:outline-none focus:border-emerald-700 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 text-sm font-medium bg-gradient-to-r from-emerald-900 to-emerald-800 hover:from-emerald-950 hover:to-emerald-900 text-white shadow-xs disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? 'Submitting Registration...' : 'Submit for Chairman Approval'}
                </button>
              </form>
            )}

            {/* 3. Officer / Teacher Registration Form */}
            {authMode === 'officer' && (
              <form
                key="form-officer"
                onSubmit={handleOfficerSignup}
                className="space-y-4 animate__animated animate__fadeIn"
                style={{ animationDuration: '240ms' }}
              >
                <div className="p-3.5 bg-[#FAF8F4] border border-stone-200 flex items-start gap-2.5 text-xs text-slate-700">
                  <UserCheck className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                  <span>
                    {offRole === 'teacher'
                      ? `Teachers in ${offDept} are approved directly by the ${offDept} Department Chairman.`
                      : 'Registrar, VC, Chairman, Proctor, Library, and Hall officer accounts require Admin Office verification.'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-600 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={offName}
                      onChange={(e) => setOffName(e.target.value)}
                      placeholder="Dr. / Mr. / Ms. Full Name"
                      className="w-full px-3.5 py-2.5 text-sm border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-700 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-600 mb-1">
                      Official Role
                    </label>
                    <select
                      value={offRole}
                      onChange={(e) =>
                        setOffRole(e.target.value as Exclude<UserRole, 'admin' | 'student'>)
                      }
                      className="w-full px-3.5 py-2.5 text-sm border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-700 focus:bg-white"
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
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-600 mb-1">
                      Institutional Email
                    </label>
                    <input
                      type="email"
                      required
                      value={offEmail}
                      onChange={(e) => setOffEmail(e.target.value)}
                      placeholder="name@pust.ac.bd"
                      className="w-full px-3.5 py-2.5 text-sm border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-700 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-600 mb-1">
                      Password (8+ chars)
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        minLength={8}
                        required
                        value={offPassword}
                        onChange={(e) => setOffPassword(e.target.value)}
                        placeholder="Minimum 8 characters"
                        className="w-full pr-10 px-3.5 py-2.5 text-sm border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-700 focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-800 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-600 mb-1">
                      Department / Office Unit
                    </label>
                    <select
                      value={offDept}
                      onChange={(e) => setOffDept(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-700 focus:bg-white"
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
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-600 mb-1">
                      Officer / Faculty ID
                    </label>
                    <input
                      type="text"
                      required
                      value={offAcademicId}
                      onChange={(e) => setOffAcademicId(e.target.value)}
                      placeholder="PUST-FAC-104"
                      className="w-full px-3.5 py-2.5 text-sm border border-stone-300 bg-[#FAF8F4] font-mono focus:outline-none focus:border-emerald-700 focus:bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 text-sm font-medium bg-gradient-to-r from-emerald-900 to-emerald-800 hover:from-emerald-950 hover:to-emerald-900 text-white shadow-xs disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? 'Submitting Application...' : 'Submit Officer / Teacher Application'}
                </button>
              </form>
            )}

            {/* 4. First-Time Claim Admin Form */}
            {authMode === 'admin-claim' && (
              <form
                key="form-admin-claim"
                onSubmit={handleAdminClaim}
                className="space-y-4 max-w-md animate__animated animate__fadeIn"
                style={{ animationDuration: '240ms' }}
              >
                <div className="p-3.5 bg-[#FAF8F4] border border-stone-200 text-xs text-slate-700 leading-relaxed">
                  First-time setup: claim the central Admin Office account to approve officers,
                  issue tokens, configure payments, and manage CMS content.
                </div>
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-600 mb-1">
                    Admin Officer Name
                  </label>
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="Admin Officer Name"
                    className="w-full px-3.5 py-2.5 text-sm border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-700 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-600 mb-1">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@pust.ac.bd"
                    className="w-full px-3.5 py-2.5 text-sm border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-700 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-600 mb-1">
                    Strong Password (8+ chars)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      minLength={8}
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Strong Password (8+ chars)"
                      className="w-full pr-10 px-3.5 py-2.5 text-sm border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-700 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-800 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 text-sm font-medium bg-gradient-to-r from-emerald-900 to-emerald-800 hover:from-emerald-950 hover:to-emerald-900 text-white shadow-xs disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? 'Claiming Admin Account...' : 'Claim Admin Office Account'}
                </button>
              </form>
            )}

            {/* 5. Server ADMIN_PASSCODE Login Form */}
            {authMode === 'admin-passcode' && (
              <form
                key="form-admin-passcode"
                onSubmit={handleAdminPasscode}
                className="space-y-4 max-w-md animate__animated animate__fadeIn"
                style={{ animationDuration: '240ms' }}
              >
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-600 mb-1">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@pust.ac.bd"
                    className="w-full px-3.5 py-2.5 text-sm border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-700 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-600 mb-1">
                    Server ADMIN_PASSCODE
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={adminPasscode}
                      onChange={(e) => setAdminPasscode(e.target.value)}
                      placeholder="Enter ADMIN_PASSCODE"
                      className="w-full pr-10 px-3.5 py-2.5 text-sm border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-700 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      aria-label={showPassword ? 'Hide passcode' : 'Show passcode'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-800 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 text-sm font-medium bg-gradient-to-r from-emerald-900 to-emerald-800 hover:from-emerald-950 hover:to-emerald-900 text-white shadow-xs disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? 'Verifying Passcode...' : 'Sign In as Admin'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Role-Criteria Tab & Workspace Configuration
  const ROLE_LABELS: Record<UserRole, string> = {
    student: 'Admitted Student',
    teacher: 'Faculty Member',
    chairman: 'Department Chairman',
    library: 'Central Library Officer',
    hall: 'Hall Provost & Office',
    proctor: 'Proctorial Office',
    registrar: 'Office of the Registrar',
    vc: 'Vice-Chancellor Office',
    admin: 'Central Admin Office',
  };

  const ROLE_SCOPE_SUMMARY: Record<UserRole, string> = {
    student:
      'Manage your academic standing, digital library card, residential hall seat & dues, semester exam forms, and 4-office graduation clearances.',
    teacher:
      'Inspect your departmental class roster, monitor assigned courses & sessions, review exam schedules, and publish course or session notices.',
    chairman:
      'Approve department teachers & students, issue student signup tokens, seal library applications, verify exam forms & results, and grant Chairman clearances.',
    library:
      'Verify Chairman-sealed library applications, issue digital & physical library cards, record book checkouts/returns, and sign Library certificate clearances.',
    hall:
      'Publish residential seat vacancy circulars, allot & reassign hall seats, clear financial dues, and grant Hall certificate clearances.',
    proctor:
      'Review student conduct & disciplinary standing across departments and issue Proctorial clearances for graduating certificates.',
    registrar:
      'Oversee university-wide student directory records, review incoming admission inquiries, publish central circulars, and audit governance actions.',
    vc:
      'Monitor institutional student records, publish executive university circulars, and review campus-wide governance audit logs.',
    admin:
      'Full administrative control over officer approvals, student tokens, financial gateways, public CMS content, and final certificate issuance.',
  };

  const getRoleTabs = (
    role: UserRole
  ): Array<{ id: PortalTab; label: string; icon: typeof LayoutDashboard; desc: string }> => {
    switch (role) {
      case 'student':
        return [
          { id: 'overview', label: 'My Campus Overview', icon: LayoutDashboard, desc: 'Standing, alerts & shortcuts' },
          { id: 'students', label: 'My Academic Profile', icon: GraduationCap, desc: 'CGPA, hall & remarks' },
          { id: 'library', label: 'Library & Digital Card', icon: BookOpen, desc: 'Card & borrowed books' },
          { id: 'halls', label: 'Hall Seat & Dues', icon: Building, desc: 'Vacancies, seat & payments' },
          { id: 'exams', label: 'Exams, Admit & Results', icon: FileSpreadsheet, desc: 'Forms, fees & SGPA' },
          { id: 'certificates', label: 'Certificate Clearances', icon: Award, desc: '4-office graduation tracker' },
        ];
      case 'teacher':
        return [
          { id: 'overview', label: 'Faculty Overview', icon: LayoutDashboard, desc: 'Assigned courses & alerts' },
          { id: 'students', label: 'Department Class Roster', icon: Users, desc: `${user.departmentCode} student records` },
          { id: 'exams', label: 'Courses & Exam Results', icon: FileSpreadsheet, desc: 'Department courses & grades' },
          { id: 'governance', label: 'Course Notice Publisher', icon: ShieldCheck, desc: 'Course & session circulars' },
        ];
      case 'chairman':
        return [
          { id: 'overview', label: 'Chairman Desk', icon: LayoutDashboard, desc: `${user.departmentCode} office summary` },
          { id: 'students', label: 'Department Students', icon: Users, desc: 'Roster & Chairman remarks' },
          { id: 'library', label: 'Chairman Library Seals', icon: BookOpen, desc: 'Sign & forward applications' },
          { id: 'exams', label: 'Exams, Courses & Results', icon: FileSpreadsheet, desc: 'Admit cards & SGPA entry' },
          { id: 'certificates', label: 'Chairman Clearances', icon: Award, desc: 'Graduation office sign-off' },
          { id: 'governance', label: 'Dept Approvals & Tokens', icon: ShieldCheck, desc: 'Tokens, faculty & notices' },
        ];
      case 'library':
        return [
          { id: 'overview', label: 'Library Overview', icon: LayoutDashboard, desc: 'Card queue & alerts' },
          { id: 'library', label: 'Cards & Borrowing Desk', icon: BookOpen, desc: 'Verify seals & checkouts' },
          { id: 'certificates', label: 'Library Clearances', icon: Award, desc: '4-office graduation sign-off' },
          { id: 'governance', label: 'Library Circulars', icon: ShieldCheck, desc: 'Publish library notices' },
        ];
      case 'hall':
        return [
          { id: 'overview', label: 'Hall Provost Overview', icon: LayoutDashboard, desc: `${user.hallAffiliation} summary` },
          { id: 'students', label: 'Hall Residents Roster', icon: Users, desc: 'Resident standing & rooms' },
          { id: 'halls', label: 'Seats, Circulars & Dues', icon: Building, desc: 'Allotments & clearances' },
          { id: 'certificates', label: 'Hall Clearances', icon: Award, desc: '4-office graduation sign-off' },
          { id: 'governance', label: 'Hall Notice Board', icon: ShieldCheck, desc: 'Publish hall circulars' },
        ];
      case 'proctor':
        return [
          { id: 'overview', label: 'Proctorial Overview', icon: LayoutDashboard, desc: 'Conduct & clearance queue' },
          { id: 'students', label: 'Student Conduct Ledger', icon: Users, desc: 'Disciplinary status & notes' },
          { id: 'certificates', label: 'Proctorial Clearances', icon: Award, desc: '4-office graduation sign-off' },
          { id: 'governance', label: 'Proctorial Notices', icon: ShieldCheck, desc: 'Publish conduct circulars' },
        ];
      case 'registrar':
      case 'vc':
        return [
          { id: 'overview', label: 'Executive Overview', icon: LayoutDashboard, desc: 'Governance metrics & alerts' },
          { id: 'students', label: 'University Student Directory', icon: Users, desc: 'All departments & sessions' },
          { id: 'governance', label: 'Governance, Notices & Audit', icon: ShieldCheck, desc: 'Circulars, inquiries & logs' },
        ];
      case 'admin':
      default:
        return [
          { id: 'overview', label: 'Admin Command Overview', icon: LayoutDashboard, desc: 'Institution-wide summary' },
          { id: 'students', label: 'All-Dept Student Database', icon: Users, desc: 'Directory & Admin remarks' },
          { id: 'library', label: 'Library Oversight', icon: BookOpen, desc: 'Cards & borrowing ledger' },
          { id: 'halls', label: 'Residential Halls', icon: Building, desc: 'Seats, circulars & dues' },
          { id: 'exams', label: 'Exams, Courses & Results', icon: FileSpreadsheet, desc: 'Circulars, admits & grades' },
          { id: 'certificates', label: 'Final Certificate Issuance', icon: Award, desc: '4-office tracker & serials' },
          { id: 'governance', label: 'Notices, Tokens & CMS', icon: ShieldCheck, desc: 'Approvals, gateways & CMS' },
        ];
    }
  };

  const portalTabs = getRoleTabs(user.role);
  const resolvedTab: PortalTab = portalTabs.some((t) => t.id === activeTab)
    ? activeTab
    : portalTabs[0].id;
  const activeTabMeta = portalTabs.find((t) => t.id === resolvedTab) || portalTabs[0];
  const studentSelf = user.role === 'student' ? students[0] ?? null : null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* 264px Role-Criteria Workspace Sidebar */}
        <aside className="w-full lg:w-68 shrink-0 bg-white border border-stone-200 shadow-xs overflow-hidden lg:sticky lg:top-24">
          <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 text-white p-5 space-y-1.5">
            <p className="font-mono text-[11px] uppercase tracking-wider text-emerald-200">
              {ROLE_LABELS[user.role]} · {user.departmentCode}
            </p>
            <p className="font-serif text-lg font-medium text-white leading-snug">
              {user.name}
            </p>
            <p className="font-mono text-xs text-emerald-100/90 tabular-nums">
              ID {user.academicId}
              {user.session ? ` · ${user.session}` : ''}
            </p>
          </div>

          <nav aria-label="Campus portal workspace modules" className="p-2.5 space-y-1">
            {portalTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = resolvedTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-900 to-emerald-800 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-[#FAF8F4] hover:text-emerald-900'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs sm:text-[13px] font-medium truncate">
                      {tab.label}
                    </span>
                    <span
                      className={`block text-[11px] truncate ${
                        isActive ? 'text-emerald-100/85' : 'text-slate-500'
                      }`}
                    >
                      {tab.desc}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="p-3 border-t border-stone-200 bg-[#FAF8F4]/70 space-y-2">
            <button
              type="button"
              onClick={onBackToSite}
              className="w-full px-3 py-2 text-xs font-medium bg-white border border-stone-300 text-slate-700 hover:border-emerald-800 hover:text-emerald-800 transition-colors cursor-pointer whitespace-nowrap"
            >
              Public University Website
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-white border border-stone-300 text-slate-700 hover:border-red-400 hover:text-red-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Workspace Surface */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          {/* Top Contextual Breadcrumb Header */}
          <div className="bg-white border border-stone-200 shadow-xs overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-emerald-900 to-emerald-700" />
            <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="font-mono text-xs text-slate-500">
                  Digital Campus / {ROLE_LABELS[user.role]} /{' '}
                  <span className="text-emerald-800 font-semibold">{activeTabMeta.label}</span>
                </p>
                <h1 className="font-serif text-xl sm:text-2xl font-medium text-slate-900 mt-0.5">
                  {activeTabMeta.label}
                </h1>
              </div>
              <p className="font-mono text-xs text-slate-600 tabular-nums">
                {user.email} · {user.hallAffiliation}
              </p>
            </div>
          </div>

          {/* Tab 1: Role-Tailored Overview, Action Launcher, Targeted Alerts & Saved Bookmarks */}
          {resolvedTab === 'overview' && (
            <div
              key="tab-overview"
              className="space-y-6 animate__animated animate__fadeIn"
              style={{ animationDuration: '200ms' }}
            >
              {/* Role-Specific 4-Card KPI Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 text-white p-5 space-y-1 shadow-xs">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-emerald-200">
                    Active Role Criteria
                  </p>
                  <p className="font-serif text-xl font-medium text-white">
                    {ROLE_LABELS[user.role]}
                  </p>
                  <p className="font-mono text-xs text-emerald-100/90 tabular-nums">
                    {user.departmentCode} · ID {user.academicId}
                  </p>
                </div>

                {user.role === 'student' ? (
                  <>
                    <div className="bg-white border border-stone-200 p-5 space-y-1 shadow-xs">
                      <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
                        Academic Standing
                      </p>
                      <p className="font-serif text-2xl font-medium text-slate-900 tabular-nums">
                        {studentSelf ? `CGPA ${studentSelf.cgpa.toFixed(2)}` : 'Loading...'}
                      </p>
                      <p className="text-xs text-slate-600 tabular-nums">
                        {studentSelf
                          ? `Sem ${studentSelf.currentSemester} · ${studentSelf.completedSemesters}/8 Completed`
                          : 'Fetching academic record'}
                      </p>
                    </div>
                    <div className="bg-white border border-stone-200 p-5 space-y-1 shadow-xs">
                      <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
                        Residential Hall &amp; Seat
                      </p>
                      <p className="font-serif text-xl font-medium text-slate-900 truncate">
                        {studentSelf?.hallName || user.hallAffiliation}
                      </p>
                      <p className="font-mono text-xs text-slate-600 tabular-nums truncate">
                        {studentSelf?.seatNumber || 'Seat pending verification'}
                      </p>
                    </div>
                  </>
                ) : user.role === 'teacher' ? (
                  <>
                    <div className="bg-white border border-stone-200 p-5 space-y-1 shadow-xs">
                      <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
                        Assigned Courses
                      </p>
                      <p className="font-serif text-2xl font-medium text-slate-900 tabular-nums">
                        {(user.assignedCourses || []).length}
                      </p>
                      <p className="font-mono text-xs text-slate-600 truncate">
                        {(user.assignedCourses || []).join(', ') || 'Pending assignment'}
                      </p>
                    </div>
                    <div className="bg-white border border-stone-200 p-5 space-y-1 shadow-xs">
                      <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
                        Department Students
                      </p>
                      <p className="font-serif text-2xl font-medium text-slate-900 tabular-nums">
                        {loadingStudents ? '...' : students.length}
                      </p>
                      <p className="text-xs text-slate-600">Scoped to {user.departmentCode}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-white border border-stone-200 p-5 space-y-1 shadow-xs">
                      <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
                        Scoped Student Records
                      </p>
                      <p className="font-serif text-2xl font-medium text-slate-900 tabular-nums">
                        {loadingStudents ? '...' : students.length}
                      </p>
                      <p className="text-xs text-slate-600">
                        {user.role === 'chairman'
                          ? `${user.departmentCode} Department`
                          : user.role === 'hall'
                          ? user.hallAffiliation
                          : 'University-wide scope'}
                      </p>
                    </div>
                    <div className="bg-white border border-stone-200 p-5 space-y-1 shadow-xs">
                      <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
                        Targeted Bulletins
                      </p>
                      <p className="font-serif text-2xl font-medium text-slate-900 tabular-nums">
                        {targetedNotifications.length}
                      </p>
                      <p className="text-xs text-slate-600">Scoped to {user.departmentCode}</p>
                    </div>
                  </>
                )}

                <div className="bg-white border border-stone-200 p-5 space-y-1 shadow-xs">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
                    {user.role === 'student' ? 'Targeted Bulletins' : 'Workspace Modules'}
                  </p>
                  <p className="font-serif text-2xl font-medium text-slate-900 tabular-nums">
                    {user.role === 'student' ? targetedNotifications.length : portalTabs.length - 1}
                  </p>
                  <p className="text-xs text-slate-600">
                    {user.role === 'student'
                      ? `${bookmarks.length} saved bookmarks`
                      : `Active workflows for ${user.role}`}
                  </p>
                </div>
              </div>

              {/* Role Criteria Scope & Direct Module Shortcuts */}
              <div className="bg-white border border-stone-200 shadow-xs overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-emerald-900 to-emerald-700" />
                <div className="p-6 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-widest text-emerald-800">
                        Personalized Role Workspace
                      </p>
                      <h2 className="font-serif text-xl font-medium text-slate-900 mt-0.5">
                        {ROLE_LABELS[user.role]} Responsibilities &amp; Direct Actions
                      </h2>
                    </div>
                    <span className="font-mono text-xs text-slate-500">
                      {portalTabs.length - 1} authorized modules
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
                    {ROLE_SCOPE_SUMMARY[user.role]}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                    {portalTabs
                      .filter((t) => t.id !== 'overview')
                      .map((tab) => {
                        const Icon = tab.icon;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className="text-left p-4 border border-stone-200 bg-[#FAF8F4] hover:bg-white hover:border-emerald-800 transition-all flex items-start justify-between gap-3 group cursor-pointer"
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="p-2 bg-white border border-stone-200 text-emerald-800 group-hover:bg-emerald-800 group-hover:text-white transition-colors shrink-0">
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-serif text-base font-medium text-slate-900 group-hover:text-emerald-900 truncate">
                                  {tab.label}
                                </p>
                                <p className="text-xs text-slate-600 mt-0.5 truncate">{tab.desc}</p>
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-800 shrink-0 mt-1 transition-colors" />
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                {/* Targeted In-App Notifications */}
                <div className="xl:col-span-7 bg-white border border-stone-200 shadow-xs overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-emerald-900 to-emerald-700" />
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between gap-3 border-b border-stone-200 pb-3">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-emerald-800" />
                        <h2 className="font-serif text-xl font-medium text-slate-900">
                          Targeted Circulars &amp; Notices
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
                          <div key={n.id} className="p-3.5 space-y-1 text-sm hover:bg-[#FAF8F4] transition-colors">
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
                </div>

                {/* Saved Bookmarks + Role Assignment Card */}
                <div className="xl:col-span-5 bg-white border border-stone-200 shadow-xs overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-emerald-900 to-emerald-700" />
                  <div className="p-6 space-y-4">
                    <h2 className="font-serif text-xl font-medium text-slate-900 border-b border-stone-200 pb-3">
                      Saved Bookmarks ({bookmarks.length})
                    </h2>
                    {bookmarks.length === 0 ? (
                      <p className="text-sm text-slate-600">
                        No saved bookmarks yet. Bookmark departments or circulars while browsing the
                        public website.
                      </p>
                    ) : (
                      <div className="divide-y divide-stone-200 border border-stone-200">
                        {bookmarks.map((b) => (
                          <div
                            key={b.id}
                            className="p-3.5 flex items-center justify-between gap-3 text-sm"
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900 truncate">{b.title}</p>
                              <p className="text-xs text-slate-500 truncate">{b.subtitle}</p>
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
                      <div className="p-4 border border-emerald-200 bg-[#FAF8F4] text-xs space-y-1.5 font-mono">
                        <p className="font-semibold text-emerald-900 uppercase tracking-wider">
                          Chairman Course Assignment
                        </p>
                        <p className="text-slate-700">
                          Courses:{' '}
                          {(user.assignedCourses || []).join(', ') || 'Pending Chairman assignment'}
                        </p>
                        <p className="text-slate-700">
                          Sessions:{' '}
                          {(user.assignedSessions || []).join(', ') || 'Pending Chairman assignment'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Student Personal Profile Dossier OR Role-Scoped Student Database */}
          {resolvedTab === 'students' && (
            <div
              key="tab-students"
              className="bg-white border border-stone-200 shadow-xs overflow-hidden animate__animated animate__fadeIn"
              style={{ animationDuration: '200ms' }}
            >
              <div className="h-1 bg-gradient-to-r from-emerald-900 to-emerald-700" />
              <div className="p-6 space-y-5">
                {user.role === 'student' ? (
                  <>
                    <div className="border-b border-stone-200 pb-4 flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <p className="font-mono text-xs uppercase tracking-widest text-emerald-800">
                          Verified Institutional Record
                        </p>
                        <h2 className="font-serif text-2xl font-medium text-slate-900 mt-1">
                          My Academic &amp; Residential Dossier
                        </h2>
                      </div>
                      {studentSelf && (
                        <span className="font-mono text-xs text-emerald-800 font-semibold tabular-nums">
                          Status: {studentSelf.approvalStatus.toUpperCase()} · {studentSelf.disciplinaryStatus}
                        </span>
                      )}
                    </div>

                    {loadingStudents ? (
                      <PortalRecordsSkeleton rows={3} />
                    ) : !studentSelf ? (
                      <p className="text-sm text-slate-600">
                        Your institutional student record is still syncing. Contact your Department Chairman if this persists.
                      </p>
                    ) : (
                      <div className="space-y-6">
                        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="p-4 border border-stone-200 bg-[#FAF8F4]">
                            <dt className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
                              Academic ID &amp; Session
                            </dt>
                            <dd className="font-mono text-base font-semibold text-slate-900 mt-1 tabular-nums">
                              {studentSelf.academicId} · {studentSelf.session}
                            </dd>
                            <dd className="text-xs text-slate-600 mt-0.5">
                              Department of {studentSelf.departmentCode}
                            </dd>
                          </div>

                          <div className="p-4 border border-stone-200 bg-[#FAF8F4]">
                            <dt className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
                              Cumulative Standing
                            </dt>
                            <dd className="font-mono text-base font-semibold text-emerald-800 mt-1 tabular-nums">
                              CGPA {studentSelf.cgpa.toFixed(2)} / 4.00
                            </dd>
                            <dd className="text-xs text-slate-600 mt-0.5 tabular-nums">
                              Semester {studentSelf.currentSemester} ({studentSelf.completedSemesters}/8 completed)
                            </dd>
                          </div>

                          <div className="p-4 border border-stone-200 bg-[#FAF8F4]">
                            <dt className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
                              Residential Hall &amp; Seat
                            </dt>
                            <dd className="font-serif text-base font-medium text-slate-900 mt-1">
                              {studentSelf.hallName}
                            </dd>
                            <dd className="font-mono text-xs text-slate-600 mt-0.5 tabular-nums">
                              {studentSelf.seatNumber}
                            </dd>
                          </div>

                          <div className="p-4 border border-stone-200 bg-[#FAF8F4]">
                            <dt className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
                              Disciplinary &amp; Results
                            </dt>
                            <dd className="font-mono text-base font-semibold text-slate-900 mt-1">
                              {studentSelf.disciplinaryStatus}
                            </dd>
                            <dd className="text-xs text-slate-600 mt-0.5">
                              {studentSelf.allResultsPublished ? 'All 8 results published' : 'Degree in progress'}
                            </dd>
                          </div>
                        </dl>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 border border-stone-200 bg-white space-y-1.5">
                            <p className="font-mono text-[11px] uppercase tracking-wider text-emerald-800">
                              Chairman &amp; Admin Remarks
                            </p>
                            <p className="text-sm text-slate-700">
                              <span className="font-medium text-slate-900">Chairman:</span>{' '}
                              {studentSelf.chairmanNotes || 'No remarks recorded.'}
                            </p>
                            <p className="text-sm text-slate-700">
                              <span className="font-medium text-slate-900">Admin Office:</span>{' '}
                              {studentSelf.adminNotes || 'No remarks recorded.'}
                            </p>
                            <p className="text-sm text-slate-700">
                              <span className="font-medium text-slate-900">Proctor Note:</span>{' '}
                              {studentSelf.disciplinaryNotes || 'Clear standing.'}
                            </p>
                          </div>

                          <div className="p-4 border border-stone-200 bg-white space-y-1.5">
                            <p className="font-mono text-[11px] uppercase tracking-wider text-emerald-800">
                              Verified Admission Documents
                            </p>
                            <p className="text-sm text-slate-700 leading-relaxed">
                              {studentSelf.admissionDocuments.length > 0
                                ? studentSelf.admissionDocuments.join(' · ')
                                : 'Admission packet verified on file.'}
                            </p>
                            <p className="font-mono text-xs text-slate-500 pt-1 tabular-nums">
                              Contact: {studentSelf.email} · {studentSelf.phone}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-stone-200 pb-4">
                      <div>
                        <p className="font-mono text-xs uppercase tracking-widest text-emerald-800">
                          {user.role === 'chairman' || user.role === 'teacher'
                            ? `Department of ${user.departmentCode} Scope`
                            : user.role === 'hall'
                            ? `${user.hallAffiliation} Resident Scope`
                            : user.role === 'proctor'
                            ? 'Proctorial Conduct Directory'
                            : 'University Student Directory'}
                        </p>
                        <h2 className="font-serif text-2xl font-medium text-slate-900 mt-1">
                          {user.role === 'proctor'
                            ? 'Student Conduct & Disciplinary Ledger'
                            : user.role === 'hall'
                            ? 'Hall Residents Academic Standing'
                            : user.role === 'teacher'
                            ? `${user.departmentCode} Class Roster & Student Standing`
                            : 'Student Database (Combinable Dept + Session Filters)'}
                        </h2>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <select
                          value={
                            user.role === 'chairman' || user.role === 'teacher'
                              ? user.departmentCode
                              : stuDeptFilter
                          }
                          disabled={user.role === 'chairman' || user.role === 'teacher'}
                          onChange={(e) => setStuDeptFilter(e.target.value)}
                          className="px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4] disabled:opacity-70"
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
                          className="px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4]"
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
                            className="pl-8 pr-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4] focus:bg-white focus:border-emerald-800 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {stuSavedMsg && (
                      <div className="p-3 border border-emerald-200 bg-emerald-50 text-xs text-emerald-900">
                        {stuSavedMsg}
                      </div>
                    )}

                    {loadingStudents ? (
                      <PortalRecordsSkeleton rows={4} />
                    ) : students.length === 0 ? (
                      <div className="py-8 text-center space-y-2 text-sm text-slate-600">
                        <p>No student records match the current Department/Session filter.</p>
                        {(stuSessionFilter !== 'ALL' || stuSearch || stuDeptFilter !== 'ALL') && (
                          <button
                            type="button"
                            onClick={() => {
                              if (user.role !== 'chairman' && user.role !== 'teacher') {
                                setStuDeptFilter('ALL');
                              }
                              setStuSessionFilter('ALL');
                              setStuSearch('');
                            }}
                            className="px-3.5 py-1.5 text-xs font-medium border border-stone-300 bg-[#FAF8F4] text-emerald-900 hover:border-emerald-800 cursor-pointer"
                          >
                            Reset Filters
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="divide-y divide-stone-200 border border-stone-200">
                        {students.map((stu) => {
                          const edit = studentEditNotes[stu.id] || {};
                          return (
                            <div key={stu.id} className="p-4 space-y-2 text-sm hover:bg-[#FAF8F4]/50 transition-colors">
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
                                      className="flex-1 min-w-[200px] px-3 py-1.5 text-xs border border-stone-300 bg-[#FAF8F4] focus:bg-white focus:border-emerald-800 focus:outline-none"
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
                                      className="flex-1 min-w-[200px] px-3 py-1.5 text-xs border border-stone-300 bg-[#FAF8F4] focus:bg-white focus:border-emerald-800 focus:outline-none"
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
                                        className="px-2.5 py-1.5 text-xs border border-stone-300 bg-[#FAF8F4]"
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
                                        className="flex-1 min-w-[200px] px-3 py-1.5 text-xs border border-stone-300 bg-[#FAF8F4] focus:bg-white focus:border-emerald-800 focus:outline-none"
                                      />
                                    </>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleSaveStudentRecord(stu)}
                                    className="px-3.5 py-1.5 text-xs font-medium bg-gradient-to-r from-emerald-900 to-emerald-800 text-white hover:from-emerald-950 hover:to-emerald-900 cursor-pointer whitespace-nowrap"
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
                  </>
                )}
              </div>
            </div>
          )}

          {resolvedTab === 'library' && (
            <div key="tab-library" className="animate__animated animate__fadeIn" style={{ animationDuration: '200ms' }}>
              <LibraryPanel user={user} />
            </div>
          )}
          {resolvedTab === 'halls' && (
            <div key="tab-halls" className="animate__animated animate__fadeIn" style={{ animationDuration: '200ms' }}>
              <HallPanel user={user} />
            </div>
          )}
          {resolvedTab === 'exams' && (
            <div key="tab-exams" className="animate__animated animate__fadeIn" style={{ animationDuration: '200ms' }}>
              <ExamPanel user={user} departments={departments} />
            </div>
          )}
          {resolvedTab === 'certificates' && (
            <div key="tab-certificates" className="animate__animated animate__fadeIn" style={{ animationDuration: '200ms' }}>
              <CertificatePanel user={user} />
            </div>
          )}
          {resolvedTab === 'governance' && user.role !== 'student' && (
            <div key="tab-governance" className="animate__animated animate__fadeIn" style={{ animationDuration: '200ms' }}>
              <AdminCmsPanel
                user={user}
                departments={departments}
                aboutSections={aboutSections}
                vcProfiles={vcProfiles}
                galleryItems={galleryItems}
                onNoticesChange={onNoticesChange}
                onCmsChange={onCmsChange}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
