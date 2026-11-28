'use client';

import { useState, type FormEvent } from 'react';
import { ArrowLeft, KeyRound, Lock, ShieldCheck, UserCheck, UserPlus } from 'lucide-react';
import { pustApi } from '../../lib/api';
import type {
  AuthUser,
  BootstrapStatus,
  DepartmentRecord,
  UserRole,
} from '../../types/pust';
import { PustCrest } from '../PustCrest';

interface PortalAuthGatewayProps {
  departments: DepartmentRecord[];
  bootstrapStatus: BootstrapStatus;
  initialAuthError?: string | null;
  requestedTab?: string | null;
  onAuthenticated: (user: AuthUser) => Promise<void> | void;
  onNavigateVerify: () => void;
  onBackToSite: () => void;
}

type AuthMode = 'login' | 'register-student' | 'register-officer' | 'admin-bootstrap';

const HALL_OPTIONS = [
  'July 06 Hall',
  'Male Hall-1',
  'Male Hall-2',
  'Female Hall-1',
  'Female Hall-2',
  'Administrative Building',
  'Academic Block',
];

export function PortalAuthGateway({
  departments,
  bootstrapStatus,
  initialAuthError = null,
  requestedTab = null,
  onAuthenticated,
  onNavigateVerify,
  onBackToSite,
}: PortalAuthGatewayProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [error, setError] = useState<string | null>(initialAuthError);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Sign In
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Student Registration (Token)
  const [signupToken, setSignupToken] = useState('');
  const [stuName, setStuName] = useState('');
  const [stuEmail, setStuEmail] = useState('');
  const [stuPassword, setStuPassword] = useState('');
  const [stuDocs, setStuDocs] = useState('SSC & HSC Marksheets, GST Admit Card');

  // Officer / Teacher Registration
  const [offName, setOffName] = useState('');
  const [offEmail, setOffEmail] = useState('');
  const [offPassword, setOffPassword] = useState('');
  const [offRole, setOffRole] = useState<Exclude<UserRole, 'admin' | 'student'>>('teacher');
  const [offDept, setOffDept] = useState(departments[0]?.code || 'CSE');
  const [offId, setOffId] = useState('');
  const [offHall, setOffHall] = useState('Academic Block');

  // Admin Claim / Passcode Login
  const [admName, setAdmName] = useState('');
  const [admEmail, setAdmEmail] = useState('');
  const [admSecret, setAdmSecret] = useState('');

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      const res = await pustApi.login(email.trim(), password);
      await onAuthenticated(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStudentSignup(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      const docs = stuDocs
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await pustApi.registerStudent({
        signupToken: signupToken.trim(),
        name: stuName.trim(),
        email: stuEmail.trim(),
        password: stuPassword,
        admissionDocuments: docs.length > 0 ? docs : ['Admission Verification Dossier'],
      });
      setMessage(res.pendingMessage);
      setSignupToken('');
      setStuPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit student registration.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOfficerSignup(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      const res = await pustApi.registerOfficer({
        name: offName.trim(),
        email: offEmail.trim(),
        password: offPassword,
        role: offRole,
        departmentCode: offDept,
        academicId: offId.trim(),
        hallAffiliation: offHall,
      });
      setMessage(res.pendingMessage);
      setOffPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit officer registration.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAdminBootstrap(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      const res = bootstrapStatus.envAdminActive
        ? await pustApi.adminPasscodeLogin({
            name: admName.trim() || undefined,
            email: admEmail.trim(),
            passcode: admSecret,
          })
        : await pustApi.bootstrapAdmin({
            name: admName.trim(),
            email: admEmail.trim(),
            password: admSecret,
          });
      await onAuthenticated(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to authenticate administrator.');
    } finally {
      setSubmitting(false);
    }
  }

  const showAdminTab = !bootstrapStatus.adminConfigured || bootstrapStatus.envAdminActive;

  const requestedTabLabel =
    requestedTab === 'profile'
      ? 'Member Profile'
      : requestedTab
      ? requestedTab.charAt(0).toUpperCase() + requestedTab.slice(1)
      : null;

  return (
    <section className="portal-shell max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Institutional Context Column */}
        <div className="lg:col-span-5 rounded-2xl bg-gradient-to-br from-pust-950 via-pust-900 to-pust-800 text-white p-7 sm:p-8 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <PustCrest variant="light" size={38} />
              <div>
                <p className="text-[11px] font-mono uppercase tracking-widest text-gold-300">
                  Digital Campus Portal
                </p>
                <h1 className="font-serif text-2xl font-medium text-white leading-tight">
                  Pabna University of Science &amp; Technology
                </h1>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-stone-200/95 leading-relaxed">
              Unified role-based portal for Students, Faculty Members, Department Chairmen, Hall Provosts, Library Officers, Proctor Office, Registrar, Vice-Chancellor, and University Administration.
            </p>
          </div>

          <div className="space-y-3 pt-4 border-t border-white/15 text-xs text-stone-200">
            <button
              type="button"
              onClick={onNavigateVerify}
              className="w-full px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-left flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Public Document &amp; Receipt Verification</span>
              <ShieldCheck className="w-4 h-4 text-gold-300" />
            </button>
            <button
              type="button"
              onClick={onBackToSite}
              className="w-full px-4 py-2.5 rounded-lg border border-white/20 hover:bg-white/10 text-white font-medium flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to University Website</span>
            </button>
          </div>
        </div>

        {/* Right Interactive Auth Forms */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 space-y-5">
          <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-stone-100 border border-stone-200">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 min-w-[100px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                mode === 'login' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register-student');
                setError(null);
              }}
              className={`flex-1 min-w-[120px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                mode === 'register-student'
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Student Signup</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register-officer');
                setError(null);
              }}
              className={`flex-1 min-w-[120px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                mode === 'register-officer'
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Officer / Faculty</span>
            </button>
            {showAdminTab && (
              <button
                type="button"
                onClick={() => {
                  setMode('admin-bootstrap');
                  setError(null);
                }}
                className={`flex-1 min-w-[120px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  mode === 'admin-bootstrap'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{bootstrapStatus.envAdminActive ? 'Admin Passcode' : 'Setup Admin'}</span>
              </button>
            )}
          </div>

          {requestedTabLabel && (
            <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-700">
                Sign in with your institutional account to open{' '}
                <span className="font-semibold text-pust-900">{requestedTabLabel}</span>.
              </span>
              <span className="font-mono text-[11px] text-slate-500 shrink-0">
                ?tab={requestedTab}
              </span>
            </div>
          )}

          {error && (
            <div role="alert" className="p-3 rounded-xl border border-red-200 bg-red-50 text-xs text-red-900">
              {error}
            </div>
          )}
          {message && (
            <div role="status" className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-xs text-emerald-900">
              {message}
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <h2 className="font-serif text-xl font-medium text-slate-950">Portal Sign In</h2>
                <p className="text-slate-600 mt-0.5 text-left">
                  Sign in with your approved university credentials.
                </p>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Institutional Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@pust.ac.bd"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-lg bg-pust-900 text-white font-semibold hover:bg-pust-950 disabled:opacity-60 cursor-pointer"
              >
                {submitting ? 'Signing In...' : 'Sign In to Portal'}
              </button>
            </form>
          )}

          {mode === 'register-student' && (
            <form onSubmit={handleStudentSignup} className="space-y-3.5 text-xs">
              <div>
                <h2 className="font-serif text-xl font-medium text-slate-950">
                  Student Token Activation
                </h2>
                <p className="text-slate-600 mt-0.5">
                  Use the one-time signup token issued by Admin or your Department Chairman.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={signupToken}
                  onChange={(e) => setSignupToken(e.target.value.toUpperCase())}
                  placeholder="Signup Token (PUST-CSE-...)"
                  className="px-3 py-2 font-mono rounded-lg border border-stone-300 bg-[#F7F7F5] focus:bg-white focus:outline-none focus:border-pust-800"
                />
                <input
                  type="text"
                  required
                  value={stuName}
                  onChange={(e) => setStuName(e.target.value)}
                  placeholder="Full Student Name"
                  className="px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] focus:bg-white focus:outline-none focus:border-pust-800"
                />
                <input
                  type="email"
                  required
                  value={stuEmail}
                  onChange={(e) => setStuEmail(e.target.value)}
                  placeholder="Student Email"
                  className="px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] focus:bg-white focus:outline-none focus:border-pust-800"
                />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={stuPassword}
                  onChange={(e) => setStuPassword(e.target.value)}
                  placeholder="Password (8+ chars)"
                  className="px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] focus:bg-white focus:outline-none focus:border-pust-800"
                />
              </div>
              <input
                type="text"
                required
                value={stuDocs}
                onChange={(e) => setStuDocs(e.target.value)}
                placeholder="Admission documents (comma-separated)"
                className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] focus:bg-white focus:outline-none focus:border-pust-800"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-lg bg-pust-900 text-white font-semibold hover:bg-pust-950 disabled:opacity-60 cursor-pointer"
              >
                {submitting ? 'Submitting...' : 'Submit Student Activation'}
              </button>
            </form>
          )}

          {mode === 'register-officer' && (
            <form onSubmit={handleOfficerSignup} className="space-y-3.5 text-xs">
              <div>
                <h2 className="font-serif text-xl font-medium text-slate-950">
                  Officer &amp; Faculty Account Request
                </h2>
                <p className="text-slate-600 mt-0.5">
                  Submitted accounts await verification from the approving authority.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={offName}
                  onChange={(e) => setOffName(e.target.value)}
                  placeholder="Full Name"
                  className="px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] focus:bg-white focus:outline-none focus:border-pust-800"
                />
                <input
                  type="email"
                  required
                  value={offEmail}
                  onChange={(e) => setOffEmail(e.target.value)}
                  placeholder="Institutional Email"
                  className="px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] focus:bg-white focus:outline-none focus:border-pust-800"
                />
                <select
                  value={offRole}
                  onChange={(e) =>
                    setOffRole(e.target.value as Exclude<UserRole, 'admin' | 'student'>)
                  }
                  className="px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] focus:outline-none focus:border-pust-800"
                >
                  <option value="teacher">Faculty / Teacher</option>
                  <option value="chairman">Department Chairman</option>
                  <option value="registrar">Registrar / Admin Officer</option>
                  <option value="vc">Vice-Chancellor Office</option>
                  <option value="proctor">Proctor Office</option>
                  <option value="library">Central Library Officer</option>
                  <option value="hall">Hall Provost</option>
                </select>
                <select
                  value={offDept}
                  onChange={(e) => setOffDept(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] focus:outline-none focus:border-pust-800"
                >
                  <option value="REG">REG — Registrar / Central Office</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.code}>
                      {d.code} — {d.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  required
                  value={offId}
                  onChange={(e) => setOffId(e.target.value)}
                  placeholder="Employee / Academic ID"
                  className="px-3 py-2 font-mono rounded-lg border border-stone-300 bg-[#F7F7F5] focus:bg-white focus:outline-none focus:border-pust-800"
                />
                <select
                  value={offHall}
                  onChange={(e) => setOffHall(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] focus:outline-none focus:border-pust-800"
                >
                  {HALL_OPTIONS.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={offPassword}
                  onChange={(e) => setOffPassword(e.target.value)}
                  placeholder="Password (8+ chars)"
                  className="sm:col-span-2 px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] focus:bg-white focus:outline-none focus:border-pust-800"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-lg bg-pust-900 text-white font-semibold hover:bg-pust-950 disabled:opacity-60 cursor-pointer"
              >
                {submitting ? 'Submitting...' : 'Submit Account Request'}
              </button>
            </form>
          )}

          {mode === 'admin-bootstrap' && showAdminTab && (
            <form onSubmit={handleAdminBootstrap} className="space-y-3.5 text-xs">
              <div>
                <h2 className="font-serif text-xl font-medium text-slate-950">
                  {bootstrapStatus.envAdminActive
                    ? 'Administrator Passcode Sign In'
                    : 'Claim Initial University Admin Account'}
                </h2>
                <p className="text-slate-600 mt-0.5">
                  {bootstrapStatus.envAdminActive
                    ? 'Enter your email and server administrator passcode.'
                    : 'Create the first Administrator account to manage the portal and User Directory.'}
                </p>
              </div>
              <input
                type="text"
                required={!bootstrapStatus.envAdminActive}
                value={admName}
                onChange={(e) => setAdmName(e.target.value)}
                placeholder="Administrator Full Name"
                className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] focus:bg-white focus:outline-none focus:border-pust-800"
              />
              <input
                type="email"
                required
                value={admEmail}
                onChange={(e) => setAdmEmail(e.target.value)}
                placeholder="admin@pust.ac.bd"
                className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] focus:bg-white focus:outline-none focus:border-pust-800"
              />
              <input
                type="password"
                required
                minLength={bootstrapStatus.envAdminActive ? 1 : 8}
                value={admSecret}
                onChange={(e) => setAdmSecret(e.target.value)}
                placeholder={
                  bootstrapStatus.envAdminActive ? 'Server Admin Passcode' : 'Password (8+ chars)'
                }
                className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] focus:bg-white focus:outline-none focus:border-pust-800"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-lg bg-pust-900 text-white font-semibold hover:bg-pust-950 disabled:opacity-60 cursor-pointer"
              >
                {submitting
                  ? 'Authenticating...'
                  : bootstrapStatus.envAdminActive
                  ? 'Sign In with Admin Passcode'
                  : 'Create Admin Office Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
