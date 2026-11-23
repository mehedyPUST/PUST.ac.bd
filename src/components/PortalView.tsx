import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, Bookmark, CheckCircle2, LogOut, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { pustApi } from '../lib/api';
import type {
  AuthUser,
  BookmarkRecord,
  BootstrapStatus,
  DepartmentRecord,
  InquiryRecord,
  NoticeCategory,
  NoticeRecord,
} from '../types/pust';

interface PortalViewProps {
  user: AuthUser | null;
  departments: DepartmentRecord[];
  bookmarks: BookmarkRecord[];
  bootstrapStatus: BootstrapStatus;
  onUserChange: (user: AuthUser | null) => void;
  onBookmarksChange: () => Promise<void>;
  onNoticesChange: () => Promise<void>;
  onBackToSite: () => void;
}

type AuthTab = 'login' | 'register' | 'registrar';

export function PortalView({
  user,
  departments,
  bookmarks,
  bootstrapStatus,
  onUserChange,
  onBookmarksChange,
  onNoticesChange,
  onBackToSite,
}: PortalViewProps) {
  const [authTab, setAuthTab] = useState<AuthTab>('login');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<'student' | 'faculty'>('student');
  const [regDept, setRegDept] = useState('CSE');
  const [regAcademicId, setRegAcademicId] = useState('');
  const [regHall, setRegHall] = useState('July 06 Hall');

  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminSecret, setAdminSecret] = useState('');

  const [inquiries, setInquiries] = useState<InquiryRecord[]>([]);
  const [noticeRef, setNoticeRef] = useState('PUST/REG/2026/');
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeCategory, setNoticeCategory] = useState<NoticeCategory>('General');
  const [noticeDept, setNoticeDept] = useState('REGISTRAR');
  const [noticeSummary, setNoticeSummary] = useState('');
  const [noticeBody, setNoticeBody] = useState('');
  const [noticePinned, setNoticePinned] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      pustApi
        .getInquiries()
        .then((res) => setInquiries(res.inquiries))
        .catch(() => {});
    }
  }, [user]);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);
    try {
      const res = await pustApi.login(loginEmail, loginPassword);
      onUserChange(res.user);
      await onBookmarksChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);
    try {
      const res = await pustApi.register({
        name: regName,
        email: regEmail,
        password: regPassword,
        role: regRole,
        departmentCode: regDept,
        academicId: regAcademicId,
        hallAffiliation: regHall,
      });
      onUserChange(res.user);
      await onBookmarksChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to register account');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegistrarSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);
    try {
      if (bootstrapStatus.envAdminActive) {
        const res = await pustApi.adminPasscodeLogin({
          name: adminName || undefined,
          email: adminEmail,
          passcode: adminSecret,
        });
        onUserChange(res.user);
      } else {
        const res = await pustApi.bootstrapAdmin({
          name: adminName,
          email: adminEmail,
          password: adminSecret,
        });
        onUserChange(res.user);
      }
      await onBookmarksChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registrar authentication failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    await pustApi.logout();
    onUserChange(null);
    setInquiries([]);
  }

  async function handlePublishNotice(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);
    try {
      const created: { notice: NoticeRecord } = await pustApi.createNotice({
        referenceNo: noticeRef,
        title: noticeTitle,
        category: noticeCategory,
        departmentCode: noticeDept,
        summary: noticeSummary,
        body: noticeBody,
        pinned: noticePinned,
      });
      setNoticeTitle('');
      setNoticeSummary('');
      setNoticeBody('');
      setNoticePinned(false);
      setSuccessMsg(`Published notice ${created.notice.referenceNo}.`);
      await onNoticesChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not publish notice');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReviewInquiry(id: string) {
    try {
      await pustApi.markInquiryReviewed(id);
      setInquiries((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: 'Reviewed' } : item))
      );
    } catch {
      // Ignore transient error
    }
  }

  async function handleRemoveBookmark(itemId: string) {
    await pustApi.removeBookmark(itemId);
    await onBookmarksChange();
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <button
            type="button"
            onClick={onBackToSite}
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800 transition-colors mb-3 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Public Website
          </button>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-slate-900">
            PUST Campus Portal
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Authenticated via HTTP-only JWT session cookies · Persistence:{' '}
            {bootstrapStatus.storageBackend === 'mongodb'
              ? 'MongoDB Native Driver'
              : 'Preview Store (set MONGODB_URI to connect MongoDB)'}
          </p>
        </div>

        {user && (
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-slate-300 bg-white text-slate-900 hover:border-red-300 hover:text-red-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        )}
      </div>

      {!user ? (
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5 space-y-6">
            <h2 className="font-serif text-2xl font-medium text-slate-900">
              Student, Faculty &amp; Registrar Access
            </h2>
            <p className="text-[15px] leading-relaxed text-slate-700">
              Sign in to bookmark PUST departments and official circulars, or access the Registrar
              office tools to publish university notices and review prospective student inquiries.
            </p>
            <dl className="border-t border-slate-200 pt-5 space-y-4 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-500">Session Security</dt>
                <dd className="text-slate-800 mt-0.5">
                  Signed HS256 JWT stored exclusively in an HttpOnly cookie with scrypt password
                  hashing.
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-slate-500">Data Layer</dt>
                <dd className="text-slate-800 mt-0.5">
                  Official Node.js MongoDB Native driver with schema-validated Express endpoints.
                </dd>
              </div>
            </dl>
          </div>

          <div className="lg:col-span-7 bg-white border border-slate-200 shadow-sm p-6 sm:p-8">
            <div className="flex flex-wrap gap-1 p-1 bg-slate-100 mb-6">
              <button
                type="button"
                onClick={() => {
                  setAuthTab('login');
                  setError(null);
                }}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  authTab === 'login'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Member Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab('register');
                  setError(null);
                }}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  authTab === 'register'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Create Account
              </button>
              {(!bootstrapStatus.adminConfigured || bootstrapStatus.envAdminActive) && (
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('registrar');
                    setError(null);
                  }}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    authTab === 'registrar'
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {bootstrapStatus.envAdminActive ? 'Registrar Passcode' : 'Claim Registrar Admin'}
                </button>
              )}
            </div>

            {error && (
              <div className="mb-5 p-3.5 border border-red-200 bg-red-50 text-sm text-red-900">
                {error}
              </div>
            )}

            {authTab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1.5">
                    Institutional or Personal Email
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="student@pust.ac.bd"
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
                    placeholder="Enter your password"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 bg-slate-50 focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-5 text-sm font-medium bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {submitting ? 'Signing In...' : 'Sign In to Portal'}
                </button>
              </form>
            )}

            {authTab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Mehedy Hasan"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 bg-slate-50 focus:outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1.5">
                      Role
                    </label>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value as 'student' | 'faculty')}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 bg-slate-50 focus:outline-none focus:border-emerald-600 focus:bg-white"
                    >
                      <option value="student">Student</option>
                      <option value="faculty">Faculty Member</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="name@pust.ac.bd"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 bg-slate-50 focus:outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1.5">
                      Password (8+ characters)
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Create a strong password"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 bg-slate-50 focus:outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1.5">
                      Department
                    </label>
                    <select
                      value={regDept}
                      onChange={(e) => setRegDept(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 bg-slate-50 focus:outline-none focus:border-emerald-600 focus:bg-white"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.code}>
                          {d.code} — {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1.5">
                      Roll / Employee ID
                    </label>
                    <input
                      type="text"
                      required
                      value={regAcademicId}
                      onChange={(e) => setRegAcademicId(e.target.value)}
                      placeholder="210114"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 bg-slate-50 focus:outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1.5">
                      Hall / Office
                    </label>
                    <select
                      value={regHall}
                      onChange={(e) => setRegHall(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 bg-slate-50 focus:outline-none focus:border-emerald-600 focus:bg-white"
                    >
                      <option value="July 06 Hall">July 06 Hall</option>
                      <option value="Male Hall-1">Male Hall-1</option>
                      <option value="Male Hall-2">Male Hall-2</option>
                      <option value="Female Hall-1">Female Hall-1</option>
                      <option value="Female Hall-2">Female Hall-2</option>
                      <option value="Non-Resident / Faculty">Non-Resident / Faculty</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-5 text-sm font-medium bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {submitting ? 'Creating Account...' : 'Register & Issue Session Cookie'}
                </button>
              </form>
            )}

            {authTab === 'registrar' && (
              <form onSubmit={handleRegistrarSubmit} className="space-y-4">
                <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 text-xs text-slate-700 leading-relaxed">
                  {bootstrapStatus.envAdminActive
                    ? 'Server ADMIN_PASSCODE is active. Enter your Registrar email and configured server passcode to sign in.'
                    : 'First-run Registrar setup: claim the initial administrator account for this portal. Once claimed, this setup route locks permanently.'}
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1.5">
                    Registrar / Officer Name
                  </label>
                  <input
                    type="text"
                    required={!bootstrapStatus.envAdminActive}
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="Office of the Registrar"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 bg-slate-50 focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1.5">
                    Registrar Email
                  </label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="registrar@pust.ac.bd"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 bg-slate-50 focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1.5">
                    {bootstrapStatus.envAdminActive
                      ? 'Configured Admin Passcode'
                      : 'Choose Admin Password (8+ characters)'}
                  </label>
                  <input
                    type="password"
                    required
                    minLength={bootstrapStatus.envAdminActive ? 1 : 8}
                    value={adminSecret}
                    onChange={(e) => setAdminSecret(e.target.value)}
                    placeholder="Enter password or passcode"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 bg-slate-50 focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-5 text-sm font-medium bg-emerald-800 text-white hover:bg-emerald-900 disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {submitting
                    ? 'Verifying...'
                    : bootstrapStatus.envAdminActive
                    ? 'Sign In as Registrar'
                    : 'Claim Registrar Admin Account'}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {/* Authenticated Identity Summary */}
          <section className="bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-emerald-700">
                  {user.role === 'admin' ? 'Registrar Administration' : user.role} ·{' '}
                  {user.departmentCode}
                </p>
                <h2 className="font-serif text-2xl font-medium text-slate-900 mt-1">{user.name}</h2>
                <p className="text-sm text-slate-600 mt-1">{user.email}</p>
              </div>
              <dl className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wider text-slate-500">Academic ID</dt>
                  <dd className="font-mono tabular-nums text-slate-900 mt-0.5">
                    {user.academicId}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-slate-500">Affiliation</dt>
                  <dd className="text-slate-900 mt-0.5">{user.hallAffiliation}</dd>
                </div>
              </dl>
            </div>
          </section>

          {/* Bookmarks Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="font-serif text-xl font-medium text-slate-900">
                Saved Departments &amp; Circulars ({bookmarks.length})
              </h2>
            </div>

            {bookmarks.length === 0 ? (
              <div className="bg-white border border-slate-200 p-6 text-sm text-slate-600 flex items-center gap-3">
                <Bookmark className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  No saved items yet. Open any department prospectus or official circular on the
                  public website to bookmark it here.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookmarks.map((bm) => (
                  <div
                    key={bm.id}
                    className="bg-white border border-slate-200 p-4 flex items-start justify-between gap-4"
                  >
                    <div>
                      <p className="font-mono text-xs uppercase text-emerald-700">
                        {bm.itemType} · {bm.subtitle}
                      </p>
                      <p className="font-medium text-sm text-slate-900 mt-1">{bm.title}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveBookmark(bm.itemId)}
                      aria-label={`Remove ${bm.title}`}
                      className="p-1.5 text-slate-400 hover:text-red-700 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Registrar Admin Tools */}
          {user.role === 'admin' && (
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4 border-t border-slate-200">
              <div className="lg:col-span-6 bg-white border border-slate-200 p-6 space-y-5">
                <div className="flex items-center gap-2 text-emerald-700">
                  <ShieldCheck className="w-5 h-5" />
                  <h2 className="font-serif text-xl font-medium text-slate-900">
                    Publish Official Notice
                  </h2>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-sm text-red-900">
                    {error}
                  </div>
                )}
                {successMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-sm text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <form onSubmit={handlePublishNotice} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1">
                        Memo / Reference No.
                      </label>
                      <input
                        type="text"
                        required
                        value={noticeRef}
                        onChange={(e) => setNoticeRef(e.target.value)}
                        className="w-full px-3 py-2 text-sm font-mono border border-slate-300 bg-slate-50 focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1">
                        Category
                      </label>
                      <select
                        value={noticeCategory}
                        onChange={(e) => setNoticeCategory(e.target.value as NoticeCategory)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 bg-slate-50 focus:outline-none focus:border-emerald-600"
                      >
                        <option value="General">General</option>
                        <option value="Admission">Admission</option>
                        <option value="Academic">Academic</option>
                        <option value="Examination">Examination</option>
                        <option value="Job & Tender">Job &amp; Tender</option>
                        <option value="NOC & Orders">NOC &amp; Orders</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1">
                        Circular Headline
                      </label>
                      <input
                        type="text"
                        required
                        value={noticeTitle}
                        onChange={(e) => setNoticeTitle(e.target.value)}
                        placeholder="e.g., Spring Semester Course Registration Window"
                        className="w-full px-3 py-2 text-sm border border-slate-300 bg-slate-50 focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1">
                        Unit Code
                      </label>
                      <input
                        type="text"
                        required
                        value={noticeDept}
                        onChange={(e) => setNoticeDept(e.target.value)}
                        placeholder="REGISTRAR"
                        className="w-full px-3 py-2 text-sm font-mono border border-slate-300 bg-slate-50 focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1">
                      Summary Line
                    </label>
                    <input
                      type="text"
                      required
                      value={noticeSummary}
                      onChange={(e) => setNoticeSummary(e.target.value)}
                      placeholder="Concise one-sentence summary for the notice board list."
                      className="w-full px-3 py-2 text-sm border border-slate-300 bg-slate-50 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1">
                      Full Circular Text
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={noticeBody}
                      onChange={(e) => setNoticeBody(e.target.value)}
                      placeholder="Enter complete official instructions, dates, and requirements..."
                      className="w-full px-3 py-2 text-sm border border-slate-300 bg-slate-50 focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={noticePinned}
                      onChange={(e) => setNoticePinned(e.target.checked)}
                      className="accent-emerald-700"
                    />
                    Pin notice to top of university notice board
                  </label>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-5 text-sm font-medium bg-emerald-700 text-white hover:bg-emerald-800 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    {submitting ? 'Publishing...' : 'Publish Official Notice'}
                  </button>
                </form>
              </div>

              <div className="lg:col-span-6 bg-white border border-slate-200 p-6 space-y-4">
                <h2 className="font-serif text-xl font-medium text-slate-900">
                  Admission Inquiries Queue ({inquiries.length})
                </h2>

                {inquiries.length === 0 ? (
                  <p className="text-sm text-slate-600 py-6 border-t border-slate-200">
                    No prospective student inquiries submitted yet. Inquiries submitted on the
                    Admissions section appear here.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-200 border-t border-slate-200">
                    {inquiries.map((inq) => (
                      <div key={inq.id} className="py-4 space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium text-sm text-slate-900">
                              {inq.fullName} ·{' '}
                              <span className="font-mono text-xs text-slate-600">
                                {inq.departmentCode}
                              </span>
                            </p>
                            <p className="text-xs text-slate-500">
                              {inq.programLevel} · {inq.email} · {inq.phone}
                            </p>
                          </div>
                          {inq.status === 'Received' ? (
                            <button
                              type="button"
                              onClick={() => handleReviewInquiry(inq.id)}
                              className="px-3 py-1 text-xs font-medium border border-emerald-700 text-emerald-700 hover:bg-emerald-700 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              Mark Reviewed
                            </button>
                          ) : (
                            <span className="text-xs font-medium text-emerald-700">Reviewed</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">{inq.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
