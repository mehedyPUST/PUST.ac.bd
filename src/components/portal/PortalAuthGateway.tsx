'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Trash2,
  Upload,
  UserCheck,
} from 'lucide-react';
import { pustApi } from '../../lib/api';
import { MotionReveal } from '../MotionPrimitives';
import { PustCrest } from '../PustCrest';
import type {
  AuthUser,
  BootstrapStatus,
  DepartmentRecord,
  DigitalDocumentMeta,
  PublicStatusLookupResult,
  UserRole,
} from '../../types/pust';
import { computeDeterministicFileHash, type AuthMode } from './portalMeta';

interface PortalAuthGatewayProps {
  departments: DepartmentRecord[];
  bootstrapStatus: BootstrapStatus;
  initialAuthError?: string | null;
  onAuthenticated: (user: AuthUser) => Promise<void>;
  onNavigateVerify: () => void;
  onBackToSite: () => void;
}

const AUTH_MODE_META: Record<
  AuthMode,
  { tabLabel: string; eyebrow: string; title: string; summary: string }
> = {
  login: {
    tabLabel: 'Member Sign In',
    eyebrow: 'Institutional Sign In',
    title: 'Access Your Digital Campus Workspace',
    summary:
      'Sign in with your approved PUST email and password to manage library cards, residential hall seats, semester exam forms, digital payments, and 4-office certificate clearances.',
  },
  'student-token': {
    tabLabel: 'Student Token Signup',
    eyebrow: 'Token-Verified Admission Onboarding',
    title: 'Activate Your Admitted Student Portal',
    summary:
      'Use the unique token issued by your Department Chairman or Admin Office to bind your Academic ID, upload verification documents, and unlock portal services.',
  },
  officer: {
    tabLabel: 'Officer / Teacher Signup',
    eyebrow: 'Faculty & Officer Registration',
    title: 'Apply for Institutional Office Access',
    summary:
      'Department Teachers are routed to their Chairman for approval; Chairmen, Registrar, VC, Proctor, Library, and Hall officers are verified by the Admin Office.',
  },
  'admin-claim': {
    tabLabel: 'Claim Admin Office',
    eyebrow: 'First-Time Governance Bootstrap',
    title: 'Claim Central Admin Office Credentials',
    summary:
      'Initialize the central Admin Office account to approve officers, issue departmental student tokens, publish circulars, and manage university CMS data.',
  },
  'admin-passcode': {
    tabLabel: 'Admin Passcode',
    eyebrow: 'Environment Passcode Verification',
    title: 'Sign In via Server Admin Passcode',
    summary:
      'Authenticate as the central Admin Office using your institutional email and server-configured ADMIN_PASSCODE.',
  },
};

const QUICK_DOC_LABELS = [
  'SSC Marksheet',
  'HSC Marksheet',
  'GST Admit Slip',
  'NID / Birth Certificate',
];

export function PortalAuthGateway({
  departments,
  bootstrapStatus,
  initialAuthError = null,
  onAuthenticated,
  onNavigateVerify,
  onBackToSite,
}: PortalAuthGatewayProps) {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authError, setAuthError] = useState<string | null>(initialAuthError);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Student Token Signup fields + Digital Document Upload
  const [stuToken, setStuToken] = useState('');
  const [stuName, setStuName] = useState('');
  const [stuEmail, setStuEmail] = useState('');
  const [stuPassword, setStuPassword] = useState('');
  const [stuDocs, setStuDocs] = useState('SSC Marksheet, HSC Marksheet, GST Admit Slip');
  const [stuDigitalDocs, setStuDigitalDocs] = useState<DigitalDocumentMeta[]>([]);

  // Officer / Teacher Registration fields
  const [offName, setOffName] = useState('');
  const [offEmail, setOffEmail] = useState('');
  const [offPassword, setOffPassword] = useState('');
  const [offRole, setOffRole] = useState<Exclude<UserRole, 'admin' | 'student'>>('teacher');
  const [offDept, setOffDept] = useState('CSE');
  const [offAcademicId, setOffAcademicId] = useState('');
  const [offHall, setOffHall] = useState('July 06 Hall');

  // Admin Claim / Passcode
  const [adminName, setAdminName] = useState('PUST Admin Office');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPasscode, setAdminPasscode] = useState('');

  // Pre-Login Public Status Lookup
  const [statusQuery, setStatusQuery] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusResult, setStatusResult] = useState<PublicStatusLookupResult | null>(null);

  function switchMode(nextMode: AuthMode) {
    setAuthMode(nextMode);
    setAuthError(null);
    setShowPassword(false);
  }

  function handleDigitalFileAttach(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const nowIso = new Date().toISOString().slice(0, 10);
    const added: DigitalDocumentMeta[] = Array.from(files).map((f) => {
      const kb = Math.max(1, Math.round(f.size / 1024));
      return {
        label: f.name.replace(/\.[^.]+$/, ''),
        fileName: f.name,
        sizeLabel: `${kb} KB`,
        uploadedAt: nowIso,
        verifiedHash: computeDeterministicFileHash(f.name, f.size),
      };
    });
    setStuDigitalDocs((prev) => [...prev, ...added]);
    const existingLabels = stuDocs
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const mergedLabels = Array.from(
      new Set([...existingLabels, ...added.map((a) => `${a.label} (${a.fileName})`)])
    );
    setStuDocs(mergedLabels.join(', '));
    e.target.value = '';
  }

  function toggleAdmissionDoc(docLabel: string) {
    const existing = stuDocs
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (existing.includes(docLabel)) {
      setStuDocs(existing.filter((d) => d !== docLabel).join(', '));
    } else {
      setStuDocs([...existing, docLabel].join(', '));
    }
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setAuthMessage(null);
    setSubmitting(true);
    try {
      const res = await pustApi.login(loginEmail, loginPassword);
      await onAuthenticated(res.user);
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
        digitalDocuments: stuDigitalDocs.length > 0 ? stuDigitalDocs : undefined,
      });
      setAuthMessage(res.pendingMessage);
      setStatusQuery(stuEmail);
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
        hallAffiliation: offRole === 'hall' ? offHall : 'Academic Block',
      });
      setAuthMessage(res.pendingMessage);
      setStatusQuery(offEmail);
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
      await onAuthenticated(res.user);
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
      await onAuthenticated(res.user);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Admin passcode sign-in failed.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCheckStatus(e: FormEvent) {
    e.preventDefault();
    if (!statusQuery.trim()) return;
    setStatusLoading(true);
    setStatusError(null);
    try {
      const res = await pustApi.checkPublicStatus(statusQuery.trim());
      setStatusResult(res.result);
    } catch (err) {
      setStatusResult(null);
      setStatusError(
        err instanceof Error ? err.message : 'No pending account or inquiry found.'
      );
    } finally {
      setStatusLoading(false);
    }
  }

  const availableModes: AuthMode[] = ['login', 'student-token', 'officer'];
  if (!bootstrapStatus.adminConfigured && !bootstrapStatus.envAdminActive) {
    availableModes.push('admin-claim');
  }
  if (bootstrapStatus.envAdminActive) {
    availableModes.push('admin-passcode');
  }

  const currentMeta = AUTH_MODE_META[authMode];
  const selectedDocsList = stuDocs
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-6">
      {/* Compact Editorial Gateway Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <p className="text-xs font-semibold tracking-wide text-pust-800 text-left">
            PUST Integrated Digital University Platform
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-medium text-slate-900 mt-1">
            Campus Portal Sign In &amp; Account Registration
          </h1>
        </div>
        <div className="flex items-center gap-5 shrink-0">
          <button
            type="button"
            onClick={onNavigateVerify}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-pust-900 whitespace-nowrap cursor-pointer"
          >
            <span>Verify Documents</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onBackToSite}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-pust-800 hover:text-pust-950 whitespace-nowrap cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Public Website</span>
          </button>
        </div>
      </div>

      {/* Single-Elevation Split Auth Surface */}
      <MotionReveal
        distance={14}
        className="grid grid-cols-1 lg:grid-cols-12 bg-white rounded-2xl border border-stone-200 overflow-hidden"
      >
        {/* Left Institutional Context Rail */}
        <div className="lg:col-span-5 bg-gradient-to-br from-pust-950 via-pust-900 to-pust-800 text-white p-7 sm:p-9 flex flex-col justify-between gap-8">
          <div className="space-y-6">
            <div className="flex items-center gap-3.5">
              <PustCrest variant="light" size={42} className="shrink-0" />
              <div>
                <p className="text-xs font-medium text-pust-200 text-left">
                  Rajapur Campus · Pabna
                </p>
                <p className="font-serif text-base font-medium text-white text-left">
                  Digital Campus Gateway
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              <p className="text-xs font-semibold tracking-wide text-pust-200 text-left">
                {currentMeta.eyebrow}
              </p>
              <h2 className="font-serif text-2xl font-medium text-white leading-snug">
                {currentMeta.title}
              </h2>
              <p className="text-sm text-pust-100/90 leading-relaxed text-left">
                {currentMeta.summary}
              </p>
            </div>

            <div className="border-t border-white/15 divide-y divide-white/15">
              <div className="py-4 space-y-1">
                <p className="text-xs font-semibold text-pust-100 flex items-center gap-2 text-left">
                  <ShieldCheck className="w-4 h-4 text-pust-200 shrink-0" />
                  <span>Role-Verified Governance</span>
                </p>
                <p className="text-xs text-pust-100/80 leading-relaxed text-left">
                  Strict separation across Student, Teacher, Chairman, Library, Hall, Proctor,
                  Registrar, VC, and Admin Office permissions.
                </p>
              </div>

              <div className="py-4 space-y-1">
                <p className="text-xs font-semibold text-pust-100 flex items-center gap-2 text-left">
                  <KeyRound className="w-4 h-4 text-pust-200 shrink-0" />
                  <span>Paperless Checkout &amp; Verification</span>
                </p>
                <p className="text-xs text-pust-100/80 leading-relaxed text-left">
                  SSLCommerz, Bangla QR &amp; MFS checkouts, QR-sealed Admit Cards, Library Cards,
                  Hall Clearances, and 4-Office Certificates.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/15 flex items-center justify-between gap-2 font-mono text-[11px] text-pust-200">
            <span>
              {bootstrapStatus.storageBackend === 'mongodb'
                ? 'MongoDB Native Cluster'
                : 'Seeded Portal Database'}
            </span>
            <span>HttpOnly JWT</span>
          </div>
        </div>

        {/* Right Interactive Auth Workspace */}
        <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 space-y-6 bg-white">
          {/* Clean Horizontal Tab Strip */}
          <div
            role="tablist"
            aria-label="Portal authentication methods"
            className="flex flex-wrap gap-1.5 border-b border-stone-200 pb-4"
          >
            {availableModes.map((mode) => {
              const active = authMode === mode;
              return (
                <button
                  key={mode}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() => switchMode(mode)}
                  className={`min-h-[38px] px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    active
                      ? 'bg-pust-900 text-white'
                      : 'bg-[#FAF9F6] border border-stone-200 text-slate-700 hover:border-pust-700/50 hover:text-pust-900'
                  }`}
                >
                  {AUTH_MODE_META[mode].tabLabel}
                </button>
              );
            })}
          </div>

          {authError && (
            <div
              role="alert"
              className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-sm text-red-900 flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}
          {authMessage && (
            <div
              role="status"
              className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 text-sm text-emerald-900 flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span>{authMessage}</span>
            </div>
          )}

          {/* 1. Member Sign In */}
          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="portal-login-email"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Institutional Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="portal-login-email"
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="member@pust.ac.bd"
                      className="w-full min-h-[42px] pl-10 pr-3.5 py-2.5 text-sm rounded-lg border border-stone-300 bg-[#FAF9F6] focus:outline-none focus:border-pust-700 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="portal-login-password"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="portal-login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full min-h-[42px] pl-10 pr-10 py-2.5 text-sm rounded-lg border border-stone-300 bg-[#FAF9F6] focus:outline-none focus:border-pust-700 focus:bg-white transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-pust-800 cursor-pointer"
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
                  className="min-h-[42px] px-6 py-2.5 text-sm font-semibold rounded-lg bg-pust-900 hover:bg-pust-950 text-white disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {submitting ? 'Signing In...' : 'Sign In to Campus Portal'}
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('student-token')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-pust-800 hover:underline cursor-pointer"
                >
                  <span>Have an admission token? Activate account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* 2. Student Token Signup + Digital File Dropzone */}
          {authMode === 'student-token' && (
            <form onSubmit={handleStudentSignup} className="space-y-4">
              <div className="border-b border-stone-200 pb-3 text-xs text-slate-600 leading-relaxed text-left">
                Step 1: Enter your departmental signup token · Step 2: Upload admission files and
                credentials · Step 3: Your Department Chairman approves access.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Portal Signup Token
                  </label>
                  <input
                    type="text"
                    required
                    value={stuToken}
                    onChange={(e) => setStuToken(e.target.value)}
                    placeholder="PUST-CSE-..."
                    className="w-full min-h-[42px] px-3.5 py-2 text-sm rounded-lg border border-stone-300 bg-[#FAF9F6] font-mono focus:outline-none focus:border-pust-700 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Student Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={stuName}
                    onChange={(e) => setStuName(e.target.value)}
                    placeholder="Full name as on SSC/HSC"
                    className="w-full min-h-[42px] px-3.5 py-2 text-sm rounded-lg border border-stone-300 bg-[#FAF9F6] focus:outline-none focus:border-pust-700 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={stuEmail}
                    onChange={(e) => setStuEmail(e.target.value)}
                    placeholder="student@pust.ac.bd"
                    className="w-full min-h-[42px] px-3.5 py-2 text-sm rounded-lg border border-stone-300 bg-[#FAF9F6] focus:outline-none focus:border-pust-700 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Password (8+ characters)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      minLength={8}
                      required
                      value={stuPassword}
                      onChange={(e) => setStuPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full min-h-[42px] pr-10 px-3.5 py-2 text-sm rounded-lg border border-stone-300 bg-[#FAF9F6] focus:outline-none focus:border-pust-700 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-pust-800 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Digital Admission Documents Upload
                </label>
                <label className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border border-dashed border-stone-300 bg-[#FAF9F6] hover:border-pust-700 hover:bg-pust-50/30 transition-colors cursor-pointer text-center">
                  <Upload className="w-5 h-5 text-pust-800" />
                  <span className="text-xs font-semibold text-slate-800">
                    Attach Digital Copies (PDF, JPG, PNG — hashed automatically)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Choose multiple admission marksheets, GST slip, or NID scans
                  </span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    onChange={handleDigitalFileAttach}
                    className="sr-only"
                  />
                </label>

                {stuDigitalDocs.length > 0 && (
                  <div className="rounded-xl border border-stone-200 divide-y divide-stone-200 bg-white overflow-hidden">
                    {stuDigitalDocs.map((doc, idx) => (
                      <div
                        key={`${doc.fileName}-${idx}`}
                        className="px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-3.5 h-3.5 text-pust-800 shrink-0" />
                          <span className="font-medium text-slate-800 truncate">{doc.fileName}</span>
                          <span className="font-mono text-[11px] text-slate-500 shrink-0 tabular-nums">
                            {doc.sizeLabel} · {doc.verifiedHash}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setStuDigitalDocs((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="p-1 text-slate-400 hover:text-red-700 cursor-pointer"
                          aria-label={`Remove ${doc.fileName}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {QUICK_DOC_LABELS.map((docLabel) => {
                    const active = selectedDocsList.includes(docLabel);
                    return (
                      <button
                        key={docLabel}
                        type="button"
                        onClick={() => toggleAdmissionDoc(docLabel)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                          active
                            ? 'bg-pust-900 text-white border-pust-900'
                            : 'bg-[#FAF9F6] text-slate-700 border-stone-200 hover:border-pust-700'
                        }`}
                      >
                        {active && <Check className="w-3 h-3" />}
                        <span>{docLabel}</span>
                      </button>
                    );
                  })}
                </div>

                <input
                  type="text"
                  required
                  value={stuDocs}
                  onChange={(e) => setStuDocs(e.target.value)}
                  aria-label="Submitted admission documents list"
                  className="w-full min-h-[40px] px-3.5 py-2 text-xs rounded-lg border border-stone-300 bg-[#FAF9F6] font-mono focus:outline-none focus:border-pust-700 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="min-h-[42px] px-6 py-2.5 text-sm font-semibold rounded-lg bg-pust-900 hover:bg-pust-950 text-white disabled:opacity-60 transition-colors cursor-pointer"
              >
                {submitting ? 'Submitting Registration...' : 'Submit for Chairman Approval'}
              </button>
            </form>
          )}

          {/* 3. Officer / Teacher Registration */}
          {authMode === 'officer' && (
            <form onSubmit={handleOfficerSignup} className="space-y-4">
              <div className="border-b border-stone-200 pb-3 flex items-start gap-2.5 text-xs text-slate-700">
                <UserCheck className="w-4 h-4 text-pust-800 shrink-0 mt-0.5" />
                <span>
                  {offRole === 'teacher'
                    ? `Teachers in ${offDept} are approved directly by the ${offDept} Department Chairman.`
                    : 'Registrar, VC, Chairman, Proctor, Library, and Hall officer accounts require Admin Office verification.'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={offName}
                    onChange={(e) => setOffName(e.target.value)}
                    placeholder="Dr. / Mr. / Ms. Full Name"
                    className="w-full min-h-[42px] px-3.5 py-2 text-sm rounded-lg border border-stone-300 bg-[#FAF9F6] focus:outline-none focus:border-pust-700 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Official Role
                  </label>
                  <select
                    value={offRole}
                    onChange={(e) =>
                      setOffRole(e.target.value as Exclude<UserRole, 'admin' | 'student'>)
                    }
                    className="w-full min-h-[42px] px-3.5 py-2 text-sm rounded-lg border border-stone-300 bg-[#FAF9F6] focus:outline-none focus:border-pust-700 focus:bg-white"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Institutional Email
                  </label>
                  <input
                    type="email"
                    required
                    value={offEmail}
                    onChange={(e) => setOffEmail(e.target.value)}
                    placeholder="name@pust.ac.bd"
                    className="w-full min-h-[42px] px-3.5 py-2 text-sm rounded-lg border border-stone-300 bg-[#FAF9F6] focus:outline-none focus:border-pust-700 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Password (8+ characters)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      minLength={8}
                      required
                      value={offPassword}
                      onChange={(e) => setOffPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full min-h-[42px] pr-10 px-3.5 py-2 text-sm rounded-lg border border-stone-300 bg-[#FAF9F6] focus:outline-none focus:border-pust-700 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-pust-800 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Department / Office Unit
                  </label>
                  <select
                    value={offDept}
                    onChange={(e) => setOffDept(e.target.value)}
                    className="w-full min-h-[42px] px-3.5 py-2 text-sm rounded-lg border border-stone-300 bg-[#FAF9F6] focus:outline-none focus:border-pust-700 focus:bg-white"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Officer / Faculty ID
                  </label>
                  <input
                    type="text"
                    required
                    value={offAcademicId}
                    onChange={(e) => setOffAcademicId(e.target.value)}
                    placeholder="PUST-FAC-104"
                    className="w-full min-h-[42px] px-3.5 py-2 text-sm rounded-lg border border-stone-300 bg-[#FAF9F6] font-mono focus:outline-none focus:border-pust-700 focus:bg-white"
                  />
                </div>
                {offRole === 'hall' && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Assigned Residential Hall
                    </label>
                    <select
                      value={offHall}
                      onChange={(e) => setOffHall(e.target.value)}
                      className="w-full min-h-[42px] px-3.5 py-2 text-sm rounded-lg border border-stone-300 bg-[#FAF9F6] focus:outline-none focus:border-pust-700 focus:bg-white"
                    >
                      <option value="July 06 Hall">July 06 Hall</option>
                      <option value="Male Hall-1">Male Hall-1</option>
                      <option value="Male Hall-2">Male Hall-2</option>
                      <option value="Female Hall-1">Female Hall-1</option>
                      <option value="Female Hall-2">Female Hall-2</option>
                      <option value="All Halls">Central Hall Administration (All Halls)</option>
                    </select>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="min-h-[42px] px-6 py-2.5 text-sm font-semibold rounded-lg bg-pust-900 hover:bg-pust-950 text-white disabled:opacity-60 transition-colors cursor-pointer"
              >
                {submitting ? 'Submitting Application...' : 'Submit Officer / Teacher Application'}
              </button>
            </form>
          )}

          {/* 4. First-Time Claim Admin */}
          {authMode === 'admin-claim' && (
            <form onSubmit={handleAdminClaim} className="space-y-4 max-w-md">
              <p className="text-xs text-slate-600 leading-relaxed text-left border-b border-stone-200 pb-3">
                First-time setup: claim the central Admin Office account to approve officers,
                issue tokens, configure payments, and manage CMS content.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Admin Officer Name
                </label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="Admin Officer Name"
                  className="w-full min-h-[42px] px-3.5 py-2 text-sm rounded-lg border border-stone-300 bg-[#FAF9F6] focus:outline-none focus:border-pust-700 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Admin Email
                </label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@pust.ac.bd"
                  className="w-full min-h-[42px] px-3.5 py-2 text-sm rounded-lg border border-stone-300 bg-[#FAF9F6] focus:outline-none focus:border-pust-700 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Strong Password (8+ characters)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    minLength={8}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Strong Password (8+ chars)"
                    className="w-full min-h-[42px] pr-10 px-3.5 py-2 text-sm rounded-lg border border-stone-300 bg-[#FAF9F6] focus:outline-none focus:border-pust-700 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-pust-800 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="min-h-[42px] px-6 py-2.5 text-sm font-semibold rounded-lg bg-pust-900 hover:bg-pust-950 text-white disabled:opacity-60 transition-colors cursor-pointer"
              >
                {submitting ? 'Claiming Admin Account...' : 'Claim Admin Office Account'}
              </button>
            </form>
          )}

          {/* 5. Server ADMIN_PASSCODE Login */}
          {authMode === 'admin-passcode' && (
            <form onSubmit={handleAdminPasscode} className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Admin Email
                </label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@pust.ac.bd"
                  className="w-full min-h-[42px] px-3.5 py-2 text-sm rounded-lg border border-stone-300 bg-[#FAF9F6] focus:outline-none focus:border-pust-700 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Server ADMIN_PASSCODE
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={adminPasscode}
                    onChange={(e) => setAdminPasscode(e.target.value)}
                    placeholder="Enter ADMIN_PASSCODE"
                    className="w-full min-h-[42px] pr-10 px-3.5 py-2 text-sm rounded-lg border border-stone-300 bg-[#FAF9F6] focus:outline-none focus:border-pust-700 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? 'Hide passcode' : 'Show passcode'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-pust-800 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="min-h-[42px] px-6 py-2.5 text-sm font-semibold rounded-lg bg-pust-900 hover:bg-pust-950 text-white disabled:opacity-60 transition-colors cursor-pointer"
              >
                {submitting ? 'Verifying Passcode...' : 'Sign In as Admin'}
              </button>
            </form>
          )}

          {/* Pre-Login Account Approval & Inquiry Status Lookup */}
          <div className="pt-5 border-t border-stone-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-700 text-left">
                Check Pending Account Approval or Inquiry Status
              </p>
              <span className="font-mono text-[11px] text-slate-500">Pre-login lookup</span>
            </div>
            <form onSubmit={handleCheckStatus} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={statusQuery}
                onChange={(e) => setStatusQuery(e.target.value)}
                placeholder="Registered email or PUST-INQ-2026-101"
                className="flex-1 min-w-0 min-h-[40px] px-3.5 py-2 text-xs font-mono rounded-lg border border-stone-300 bg-[#FAF9F6] focus:bg-white focus:border-pust-700 focus:outline-none"
              />
              <button
                type="submit"
                disabled={statusLoading}
                className="min-h-[40px] px-4 py-2 text-xs font-semibold rounded-lg border border-stone-300 bg-white text-slate-800 hover:border-pust-800 hover:text-pust-900 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {statusLoading ? 'Checking...' : 'Check Status'}
              </button>
            </form>

            {statusError && (
              <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-xs text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{statusError}</span>
              </div>
            )}

            {statusResult && (
              <div className="pt-2 border-t border-stone-200 space-y-1 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-semibold text-pust-900">
                    {statusResult.reference}
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono font-semibold text-slate-800">
                    {statusResult.statusState === 'approved' ||
                    statusResult.statusState === 'reviewed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-amber-700" />
                    )}
                    {statusResult.statusLabel}
                  </span>
                </div>
                <p className="font-semibold text-slate-900 text-left">{statusResult.title}</p>
                {statusResult.note && (
                  <p className="text-slate-600 leading-relaxed text-left">{statusResult.note}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </MotionReveal>
    </section>
  );
}
