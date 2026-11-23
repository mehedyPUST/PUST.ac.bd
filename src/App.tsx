import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { CheckCircle2, Menu, Search, X } from 'lucide-react';
import { AdministrationSection } from './components/AdministrationSection';
import { DepartmentModal } from './components/DepartmentModal';
import { HomePage, type AppRoute } from './components/HomePage';
import { NoticeModal } from './components/NoticeModal';
import { PortalView } from './components/PortalView';
import { ResearchSection } from './components/ResearchSection';
import { pustApi } from './lib/api';
import type {
  AuthUser,
  BookmarkRecord,
  BootstrapStatus,
  DepartmentRecord,
  FacultyName,
  InquiryRecord,
  NoticeCategory,
  NoticeRecord,
  PublicationRecord,
  UniversityProfile,
} from './types/pust';

const HERO_IMAGE = '/src/assets/images/pust_campus_hero_1795431408503.jpg';
const LAB_IMAGE = '/src/assets/images/pust_engineering_lab_1795431408924.jpg';
const LIBRARY_IMAGE = '/src/assets/images/pust_central_library_1795431408614.jpg';
const GROUNDS_IMAGE = '/src/assets/images/pust_campus_grounds_1795431408500.jpg';

const FACULTY_FILTERS: Array<{ label: string; value: 'All' | FacultyName }> = [
  { label: 'All Faculties', value: 'All' },
  { label: 'Engineering & Technology', value: 'Faculty of Engineering and Technology' },
  { label: 'Science', value: 'Faculty of Science' },
  { label: 'Business Studies', value: 'Faculty of Business Studies' },
  { label: 'Humanities & Social Science', value: 'Faculty of Humanities and Social Science' },
  { label: 'Life & Earth Science', value: 'Faculty of Life and Earth Science' },
];

const NOTICE_FILTERS: Array<'All' | NoticeCategory> = [
  'All',
  'General',
  'Admission',
  'Academic',
  'Examination',
  'Job & Tender',
  'NOC & Orders',
];

const NAV_ITEMS: Array<{ label: string; route: AppRoute }> = [
  { label: 'Administration', route: '/administration' },
  { label: 'Academics', route: '/academics' },
  { label: 'Notices', route: '/notices' },
  { label: 'Research', route: '/research' },
  { label: 'Admissions', route: '/admissions' },
];

function parseRouteFromPath(pathname: string): AppRoute {
  const clean = pathname.replace(/\/+$/, '') || '/';
  const valid: AppRoute[] = [
    '/',
    '/administration',
    '/academics',
    '/notices',
    '/research',
    '/admissions',
    '/portal',
  ];
  return valid.includes(clean as AppRoute) ? (clean as AppRoute) : '/';
}

export default function App() {
  const [route, setRoute] = useState<AppRoute>(() =>
    parseRouteFromPath(typeof window !== 'undefined' ? window.location.pathname : '/')
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [profile, setProfile] = useState<UniversityProfile | null>(null);
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [publications, setPublications] = useState<PublicationRecord[]>([]);
  const [notices, setNotices] = useState<NoticeRecord[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const [user, setUser] = useState<AuthUser | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkRecord[]>([]);
  const [bootstrapStatus, setBootstrapStatus] = useState<BootstrapStatus>({
    adminConfigured: false,
    envAdminActive: false,
    storageBackend: 'memory',
  });

  const [selectedFaculty, setSelectedFaculty] = useState<'All' | FacultyName>('All');
  const [deptQuery, setDeptQuery] = useState('');
  const [selectedNoticeCat, setSelectedNoticeCat] = useState<'All' | NoticeCategory>('All');
  const [noticeQuery, setNoticeQuery] = useState('');
  const [activeDepartment, setActiveDepartment] = useState<DepartmentRecord | null>(null);
  const [activeNotice, setActiveNotice] = useState<NoticeRecord | null>(null);

  const [inqName, setInqName] = useState('');
  const [inqEmail, setInqEmail] = useState('');
  const [inqPhone, setInqPhone] = useState('');
  const [inqProgram, setInqProgram] =
    useState<InquiryRecord['programLevel']>('Undergraduate (GST)');
  const [inqDept, setInqDept] = useState('CSE');
  const [inqMessage, setInqMessage] = useState('');
  const [inqSubmitting, setInqSubmitting] = useState(false);
  const [inqSuccess, setInqSuccess] = useState<string | null>(null);
  const [inqError, setInqError] = useState<string | null>(null);

  useEffect(() => {
    function handlePopState() {
      setRoute(parseRouteFromPath(window.location.pathname));
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = useCallback((target: AppRoute) => {
    setRoute(target);
    setMobileMenuOpen(false);
    if (window.location.pathname !== target) {
      window.history.pushState({}, '', target);
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const loadNotices = useCallback(async () => {
    const res = await pustApi.getNotices();
    setNotices(res.notices);
  }, []);

  const loadBookmarks = useCallback(async () => {
    try {
      const res = await pustApi.getBookmarks();
      setBookmarks(res.bookmarks);
    } catch {
      setBookmarks([]);
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function bootstrap() {
      setLoadingData(true);
      setDataError(null);
      try {
        const [profileRes, deptRes, pubRes, noticeRes, meRes, statusRes] = await Promise.all([
          pustApi.getUniversityProfile(),
          pustApi.getDepartments(),
          pustApi.getPublications(),
          pustApi.getNotices(),
          pustApi.getMe(),
          pustApi.getBootstrapStatus(),
        ]);
        if (!active) return;
        setProfile(profileRes.profile);
        setDepartments(deptRes.departments);
        setPublications(pubRes.publications);
        setNotices(noticeRes.notices);
        setUser(meRes.user);
        setBootstrapStatus(statusRes);
        if (meRes.user) {
          const bmRes = await pustApi.getBookmarks().catch(() => ({ bookmarks: [] }));
          if (active) setBookmarks(bmRes.bookmarks);
        }
      } catch (err) {
        if (active) {
          setDataError(err instanceof Error ? err.message : 'Unable to load university records.');
        }
      } finally {
        if (active) setLoadingData(false);
      }
    }
    bootstrap();
    return () => {
      active = false;
    };
  }, []);

  const filteredDepartments = useMemo(() => {
    return departments.filter((d) => {
      const matchesFaculty = selectedFaculty === 'All' || d.faculty === selectedFaculty;
      const q = deptQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        d.faculty.toLowerCase().includes(q);
      return matchesFaculty && matchesQuery;
    });
  }, [departments, selectedFaculty, deptQuery]);

  const filteredNotices = useMemo(() => {
    return notices.filter((n) => {
      const matchesCat = selectedNoticeCat === 'All' || n.category === selectedNoticeCat;
      const q = noticeQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        n.title.toLowerCase().includes(q) ||
        n.referenceNo.toLowerCase().includes(q) ||
        n.summary.toLowerCase().includes(q) ||
        n.departmentCode.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [notices, selectedNoticeCat, noticeQuery]);

  const bookmarkedIds = useMemo(() => new Set(bookmarks.map((b) => b.itemId)), [bookmarks]);

  async function handleToggleBookmarkDepartment(dept: DepartmentRecord) {
    if (!user) return;
    if (bookmarkedIds.has(dept.id)) {
      await pustApi.removeBookmark(dept.id);
    } else {
      await pustApi.addBookmark({
        itemType: 'department',
        itemId: dept.id,
        title: `Department of ${dept.name} (${dept.code})`,
        subtitle: dept.faculty,
      });
    }
    await loadBookmarks();
  }

  async function handleToggleBookmarkNotice(notice: NoticeRecord) {
    if (!user) return;
    if (bookmarkedIds.has(notice.id)) {
      await pustApi.removeBookmark(notice.id);
    } else {
      await pustApi.addBookmark({
        itemType: 'notice',
        itemId: notice.id,
        title: notice.title,
        subtitle: `${notice.referenceNo} · ${notice.publishedAt}`,
      });
    }
    await loadBookmarks();
  }

  async function handleDeleteNotice(id: string) {
    await pustApi.deleteNotice(id);
    setActiveNotice(null);
    await loadNotices();
  }

  async function handleSubmitInquiry(e: FormEvent) {
    e.preventDefault();
    setInqError(null);
    setInqSuccess(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inqEmail.trim())) {
      setInqError('Please enter a valid email address.');
      return;
    }
    if (inqPhone.trim().length < 6) {
      setInqError('Please enter a valid contact phone number.');
      return;
    }

    setInqSubmitting(true);
    try {
      const res = await pustApi.submitInquiry({
        fullName: inqName,
        email: inqEmail,
        phone: inqPhone,
        programLevel: inqProgram,
        departmentCode: inqDept,
        message: inqMessage,
      });
      setInqSuccess(
        `Inquiry recorded under reference ${res.inquiry.id.slice(0, 12)}. Our Admissions Office will respond to ${res.inquiry.email}.`
      );
      setInqName('');
      setInqEmail('');
      setInqPhone('');
      setInqMessage('');
    } catch (err) {
      setInqError(err instanceof Error ? err.message : 'Unable to submit inquiry.');
    } finally {
      setInqSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('/');
            }}
            className="font-serif text-base sm:text-lg font-semibold tracking-tight text-slate-900 hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0"
          >
            Pabna University of Science &amp; Technology
          </a>

          {/* Zone 2: 5 concise single-line text nav links (separate pages) */}
          <nav
            aria-label="Primary navigation"
            className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-700"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = route === item.route;
              return (
                <a
                  key={item.route}
                  href={item.route}
                  onClick={(e) => {
                    e.preventDefault();
                    navigateTo(item.route);
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  className={`transition-colors whitespace-nowrap shrink-0 underline-offset-4 ${
                    isActive
                      ? 'text-emerald-700 underline font-semibold'
                      : 'hover:text-emerald-700 hover:underline'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action + Mobile Drawer Toggle */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigateTo(route === '/portal' ? '/' : '/portal')}
              className="px-4 py-2 text-xs sm:text-sm font-medium bg-emerald-700 text-white hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
            >
              {route === '/portal'
                ? 'Home Page'
                : user
                ? `${user.name.split(' ')[0]} · Portal`
                : 'Campus Portal'}
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              className="lg:hidden p-2 text-slate-700 hover:text-emerald-700 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 flex flex-col gap-1 text-sm font-medium text-slate-700">
            <button
              type="button"
              onClick={() => navigateTo('/')}
              className={`text-left py-2 border-b border-slate-100 ${
                route === '/' ? 'text-emerald-700 font-semibold' : 'hover:text-emerald-700'
              }`}
            >
              Home
            </button>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.route}
                type="button"
                onClick={() => navigateTo(item.route)}
                className={`text-left py-2 border-b border-slate-100 last:border-b-0 ${
                  route === item.route
                    ? 'text-emerald-700 font-semibold'
                    : 'hover:text-emerald-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Dedicated Route Rendering */}
      {route === '/' && (
        <HomePage
          heroImage={HERO_IMAGE}
          profile={profile}
          notices={notices}
          onNavigate={navigateTo}
          onSelectNotice={setActiveNotice}
        />
      )}

      {route === '/administration' && (
        <main className="flex-1">
          <AdministrationSection profile={profile} />
        </main>
      )}

      {route === '/academics' && (
        <main className="flex-1 bg-white">
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-slate-200">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
                  Academic Directory
                </p>
                <h1 className="font-serif text-3xl sm:text-4xl font-medium text-slate-900 mt-2">
                  Five Faculties, Twenty-One Departments
                </h1>
                <p className="text-[15px] text-slate-600 mt-2 leading-relaxed">
                  Select any faculty or search by discipline to inspect degree pathways, annual
                  seat intake, laboratories, and faculty research priorities.
                </p>
              </div>

              <div className="relative w-full lg:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={deptQuery}
                  onChange={(e) => setDeptQuery(e.target.value)}
                  placeholder="Filter departments (e.g. CSE, Pharmacy)"
                  aria-label="Filter academic departments"
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 bg-slate-50 focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 py-5 border-b border-slate-200">
              {FACULTY_FILTERS.map((tab) => {
                const active = selectedFaculty === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setSelectedFaculty(tab.value)}
                    className={`px-3.5 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:text-emerald-800 hover:bg-emerald-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {loadingData ? (
              <div className="py-12 text-sm text-slate-600">Loading academic directory...</div>
            ) : dataError ? (
              <div className="py-10 text-sm text-red-700">{dataError}</div>
            ) : filteredDepartments.length === 0 ? (
              <div className="py-12 text-sm text-slate-600">
                No departments match “{deptQuery}”. Clear the search field to view all 21
                departments.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-l border-slate-200 mt-8">
                {filteredDepartments.map((dept) => (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => setActiveDepartment(dept)}
                    className="text-left p-6 border-r border-b border-t border-slate-200 bg-slate-50/40 hover:bg-emerald-50/30 transition-colors flex flex-col justify-between gap-4 group cursor-pointer"
                  >
                    <div>
                      <p className="font-mono text-xs text-emerald-700 tracking-wide">
                        {dept.code} · Est. {dept.established} · {dept.intakeSeats} Seats
                      </p>
                      <h2 className="font-serif text-xl font-medium text-slate-900 mt-2 group-hover:text-emerald-800 transition-colors">
                        {dept.name}
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">{dept.faculty}</p>
                      <p className="text-sm text-slate-700 mt-3 leading-relaxed line-clamp-2">
                        {dept.summary}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
                      <span>{dept.degrees.join(' / ')}</span>
                      <span className="font-semibold text-emerald-700 group-hover:underline">
                        Prospectus
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </main>
      )}

      {route === '/notices' && (
        <main className="flex-1">
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-slate-200">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
                  Official Circulars, Tenders &amp; Bulletins
                </p>
                <h1 className="font-serif text-3xl sm:text-4xl font-medium text-slate-900 mt-2">
                  University Notice Board
                </h1>
              </div>

              <div className="relative w-full lg:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={noticeQuery}
                  onChange={(e) => setNoticeQuery(e.target.value)}
                  placeholder="Search circulars or memo no."
                  aria-label="Search university notices"
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 bg-white focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 py-5 border-b border-slate-200">
              {NOTICE_FILTERS.map((cat) => {
                const active = selectedNoticeCat === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedNoticeCat(cat)}
                    className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-emerald-700 text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-300 hover:text-emerald-800'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {filteredNotices.length === 0 ? (
              <div className="py-10 text-sm text-slate-600">
                No notices match the selected filter.
              </div>
            ) : (
              <div className="divide-y divide-slate-200 border border-slate-200 bg-white mt-6">
                {filteredNotices.map((notice) => (
                  <button
                    key={notice.id}
                    type="button"
                    onClick={() => setActiveNotice(notice)}
                    className="w-full text-left px-5 sm:px-6 py-5 hover:bg-emerald-50/35 transition-colors grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-6 items-baseline group cursor-pointer"
                  >
                    <div className="lg:col-span-3 font-mono text-xs text-slate-500 tabular-nums">
                      <span>{notice.publishedAt}</span>
                      <span className="mx-2" aria-hidden="true">
                        ·
                      </span>
                      <span className="font-semibold text-emerald-700">{notice.category}</span>
                    </div>

                    <div className="lg:col-span-7">
                      <h2 className="font-serif text-lg font-medium text-slate-900 group-hover:text-emerald-800 transition-colors">
                        {notice.title}
                      </h2>
                      <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                        {notice.summary}
                      </p>
                    </div>

                    <div className="lg:col-span-2 lg:text-right font-mono text-xs text-slate-500">
                      {notice.referenceNo}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </main>
      )}

      {route === '/research' && (
        <main className="flex-1">
          <ResearchSection
            publications={publications}
            journals={profile?.journals ?? []}
            labImage={LAB_IMAGE}
            libraryImage={LIBRARY_IMAGE}
            groundsImage={GROUNDS_IMAGE}
          />
        </main>
      )}

      {route === '/admissions' && (
        <main className="flex-1">
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
              <div className="lg:col-span-5 space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
                    Admissions 2026–2027
                  </p>
                  <h1 className="font-serif text-3xl sm:text-4xl font-medium text-slate-900 mt-2">
                    Undergraduate, Graduate &amp; Evening Programs
                  </h1>
                </div>

                <p className="text-[15px] text-slate-700 leading-relaxed">
                  Undergraduate admissions into all 21 departments follow the Bangladesh GST
                  (General, Science &amp; Technology) Integrated Admission Test across Units A, B,
                  and C, with a dedicated studio aptitude assessment for Architecture. Graduate,
                  Evening, and M.Phil programs open on a departmental cycle.
                </p>

                <dl className="divide-y divide-slate-200 border-y border-slate-200 text-sm">
                  <div className="py-3.5 flex justify-between gap-4">
                    <dt className="text-slate-600">Total Undergraduate Intake</dt>
                    <dd className="font-mono tabular-nums font-medium text-slate-900">
                      920 Seats / Session
                    </dd>
                  </div>
                  <div className="py-3.5 flex justify-between gap-4">
                    <dt className="text-slate-600">Graduate &amp; Evening</dt>
                    <dd className="text-right font-medium text-slate-900">
                      M.Sc., M.Pharm, M.B.A., EMBA, M.A., M.S.S.
                    </dd>
                  </div>
                  <div className="py-3.5 flex justify-between gap-4">
                    <dt className="text-slate-600">Registrar Admissions Desk</dt>
                    <dd className="font-mono text-emerald-700">registrar@pust.ac.bd</dd>
                  </div>
                </dl>
              </div>

              <div className="lg:col-span-7 bg-white border border-slate-200 shadow-sm p-6 sm:p-8">
                <h2 className="font-serif text-2xl font-medium text-slate-900">
                  Submit an Admission Inquiry
                </h2>
                <p className="text-sm text-slate-600 mt-1 mb-6">
                  Prospective applicants and guardians may send questions directly to the PUST
                  Admissions Desk.
                </p>

                {inqError && (
                  <div className="mb-5 p-3.5 border border-red-200 bg-red-50 text-sm text-red-900">
                    {inqError}
                  </div>
                )}
                {inqSuccess && (
                  <div className="mb-5 p-4 border border-emerald-200 bg-emerald-50 text-sm text-emerald-900 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{inqSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleSubmitInquiry} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={inqName}
                        onChange={(e) => setInqName(e.target.value)}
                        placeholder="Applicant full name"
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 bg-slate-50 focus:outline-none focus:border-emerald-600 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={inqEmail}
                        onChange={(e) => setInqEmail(e.target.value)}
                        placeholder="applicant@example.com"
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 bg-slate-50 focus:outline-none focus:border-emerald-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1.5">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        required
                        value={inqPhone}
                        onChange={(e) => setInqPhone(e.target.value)}
                        placeholder="+880 1XXX-XXXXXX"
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 bg-slate-50 focus:outline-none focus:border-emerald-600 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1.5">
                        Program Track
                      </label>
                      <select
                        value={inqProgram}
                        onChange={(e) =>
                          setInqProgram(e.target.value as InquiryRecord['programLevel'])
                        }
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 bg-slate-50 focus:outline-none focus:border-emerald-600 focus:bg-white"
                      >
                        <option value="Undergraduate (GST)">Undergraduate (GST)</option>
                        <option value="Graduate (M.Sc. / MBA)">Graduate (M.Sc. / MBA)</option>
                        <option value="Evening Programs">Evening Programs</option>
                        <option value="M.Phil / Ph.D.">M.Phil / Ph.D.</option>
                        <option value="International">International</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1.5">
                        Department of Interest
                      </label>
                      <select
                        value={inqDept}
                        onChange={(e) => setInqDept(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 bg-slate-50 focus:outline-none focus:border-emerald-600 focus:bg-white"
                      >
                        {departments.map((d) => (
                          <option key={d.id} value={d.code}>
                            {d.code} — {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-slate-600 mb-1.5">
                      Question or Request
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={inqMessage}
                      onChange={(e) => setInqMessage(e.target.value)}
                      placeholder="Ask about eligibility, GST merit cutoffs, July 06 Hall allotment, or syllabus requirements..."
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 bg-slate-50 focus:outline-none focus:border-emerald-600 focus:bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={inqSubmitting}
                    className="px-6 py-2.5 text-sm font-medium bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-60 transition-colors cursor-pointer"
                  >
                    {inqSubmitting ? 'Submitting Inquiry...' : 'Send Admission Inquiry'}
                  </button>
                </form>
              </div>
            </div>
          </section>
        </main>
      )}

      {route === '/portal' && (
        <div className="flex-1">
          <PortalView
            user={user}
            departments={departments}
            bookmarks={bookmarks}
            bootstrapStatus={bootstrapStatus}
            onUserChange={setUser}
            onBookmarksChange={loadBookmarks}
            onNoticesChange={loadNotices}
            onBackToSite={() => navigateTo('/')}
          />
        </div>
      )}

      {/* Quiet Institutional Footer */}
      <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5 space-y-2">
            <p className="font-serif text-lg font-medium text-white">
              Pabna University of Science and Technology
            </p>
            <p className="text-sm text-slate-400 leading-relaxed">
              Rajapur, Pabna-6600, Bangladesh · Situated alongside the Dhaka–Pabna Highway, 3 km
              east of Pabna town.
            </p>
          </div>

          <div className="md:col-span-4 space-y-1.5 text-sm">
            <p className="text-xs uppercase tracking-wider text-emerald-400 mb-2">
              University Pages
            </p>
            <div className="flex flex-wrap gap-x-5 gap-y-1.5">
              <button
                type="button"
                onClick={() => navigateTo('/')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => navigateTo('/administration')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Administration
              </button>
              <button
                type="button"
                onClick={() => navigateTo('/academics')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Academics
              </button>
              <button
                type="button"
                onClick={() => navigateTo('/notices')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Notice Board
              </button>
              <button
                type="button"
                onClick={() => navigateTo('/research')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Research &amp; Campus
              </button>
              <button
                type="button"
                onClick={() => navigateTo('/admissions')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Admissions
              </button>
              <button
                type="button"
                onClick={() => navigateTo('/portal')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Campus Portal
              </button>
            </div>
          </div>

          <div className="md:col-span-3 md:text-right text-xs text-slate-400 space-y-1">
            <p className="font-mono">registrar@pust.ac.bd · +8802588845193</p>
            <p className="font-mono">vc@pust.ac.bd · +8802588842379</p>
            <p>© 2026 Pabna University of Science and Technology</p>
          </div>
        </div>
      </footer>

      <DepartmentModal
        department={activeDepartment}
        onClose={() => setActiveDepartment(null)}
        user={user}
        isBookmarked={activeDepartment ? bookmarkedIds.has(activeDepartment.id) : false}
        onToggleBookmark={handleToggleBookmarkDepartment}
        onOpenPortal={() => navigateTo('/portal')}
      />

      <NoticeModal
        notice={activeNotice}
        onClose={() => setActiveNotice(null)}
        user={user}
        isBookmarked={activeNotice ? bookmarkedIds.has(activeNotice.id) : false}
        onToggleBookmark={handleToggleBookmarkNotice}
        onDeleteNotice={handleDeleteNotice}
        onOpenPortal={() => navigateTo('/portal')}
      />
    </div>
  );
}
