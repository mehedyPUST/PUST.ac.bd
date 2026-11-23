'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { CheckCircle2, FileDown, PlayCircle, Search, X } from 'lucide-react';
import type { AppRoute } from '../lib/routes';
import { ResearchSection } from './ResearchSection';
import { ResilientImage } from './ResilientImage';
import type {
  AboutContentRecord,
  DepartmentRecord,
  FacultyName,
  GalleryItemRecord,
  InquiryRecord,
  NoticeCategory,
  NoticeRecord,
  PublicationRecord,
  UniversityProfile,
} from '../types/pust';

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
  'Result',
  'Course',
  'Job & Tender',
  'NOC & Orders',
];

const DOWNLOAD_FORMS = [
  {
    code: 'PUST-REG-01',
    title: 'Admission Verification & Token Request Form',
    office: 'Office of the Registrar / Department Chairman',
    note: 'Digital token issuance and document verification handled inside Campus Portal.',
  },
  {
    code: 'PUST-LIB-02',
    title: 'Central Library Membership & Card Requisition Form',
    office: 'Department Chairman Seal + Central Library',
    note: 'Forwarded digitally with Chairman official seal and signature JSON.',
  },
  {
    code: 'PUST-HALL-03',
    title: 'Residential Hall Seat Application & Clearance Form',
    office: 'Provost Office (July 06 Hall & Dormitories)',
    note: 'Check vacancy circulars, hall dues, and clearance references in Campus Portal.',
  },
  {
    code: 'PUST-EX-04',
    title: 'Semester Examination Form Fill-up & Admit Card Application',
    office: 'Department Chairman & Controller of Examinations',
    note: 'Enforces automatic Hall clearance check and online payment receipt.',
  },
  {
    code: 'PUST-CERT-05',
    title: 'Provisional / Temporary Certificate & 4-Office Clearance Form',
    office: 'Chairman, Hall, Library, Proctor & Admin Office',
    note: 'Track real-time 4-office clearances and download verified Temporary Certificate.',
  },
];

const ACADEMIC_CALENDAR_2026 = [
  { term: 'Spring / Odd Semester 2026', event: 'Class Commencement (All Sessions)', date: '2026-07-12' },
  { term: 'Spring / Odd Semester 2026', event: 'Mid-Term Assessments & Course Drop Window', date: '2026-09-20' },
  { term: 'Spring / Odd Semester 2026', event: 'Exam Form Fill-up & Hall Clearance Window', date: '2026-11-15' },
  { term: 'Spring / Odd Semester 2026', event: 'Semester Final Examinations', date: '2026-12-06' },
  { term: 'Convocation Milestone', event: 'First University Convocation at Rajapur Campus', date: '2027-03-15' },
];

interface PublicSubPagesProps {
  route: AppRoute;
  profile: UniversityProfile | null;
  aboutSections: AboutContentRecord[];
  galleryItems: GalleryItemRecord[];
  departments: DepartmentRecord[];
  publications: PublicationRecord[];
  notices: NoticeRecord[];
  loadingData: boolean;
  dataError: string | null;
  onNavigate: (route: AppRoute) => void;
  onSelectDepartment: (dept: DepartmentRecord) => void;
  onSelectNotice: (notice: NoticeRecord) => void;
  onSubmitInquiry: (payload: {
    fullName: string;
    email: string;
    phone: string;
    programLevel: InquiryRecord['programLevel'];
    departmentCode: string;
    message: string;
  }) => Promise<InquiryRecord>;
}

export function PublicSubPages({
  route,
  profile,
  aboutSections,
  galleryItems,
  departments,
  publications,
  notices,
  loadingData,
  dataError,
  onNavigate,
  onSelectDepartment,
  onSelectNotice,
  onSubmitInquiry,
}: PublicSubPagesProps) {
  const [selectedFaculty, setSelectedFaculty] = useState<'All' | FacultyName>('All');
  const [deptQuery, setDeptQuery] = useState('');
  const [selectedNoticeCat, setSelectedNoticeCat] = useState<'All' | NoticeCategory>('All');
  const [noticeBoardScope, setNoticeBoardScope] = useState<'all' | 'central' | 'department'>('all');
  const [noticeQuery, setNoticeQuery] = useState('');
  const [galleryCategory, setGalleryCategory] =
    useState<'All' | GalleryItemRecord['category']>('All');
  const [activeMedia, setActiveMedia] = useState<GalleryItemRecord | null>(null);

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

  const filteredDepartments = useMemo(() => {
    return departments.filter((d) => {
      const matchesFaculty = selectedFaculty === 'All' || d.faculty === selectedFaculty;
      const q = deptQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        d.faculty.toLowerCase().includes(q) ||
        d.chairmanName.toLowerCase().includes(q);
      return matchesFaculty && matchesQuery;
    });
  }, [departments, selectedFaculty, deptQuery]);

  const filteredNotices = useMemo(() => {
    return notices.filter((n) => {
      const matchesCat = selectedNoticeCat === 'All' || n.category === selectedNoticeCat;
      const matchesScope =
        noticeBoardScope === 'all' ||
        (noticeBoardScope === 'central' && n.boardScope === 'central') ||
        (noticeBoardScope === 'department' && n.boardScope !== 'central');
      const q = noticeQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        n.title.toLowerCase().includes(q) ||
        n.referenceNo.toLowerCase().includes(q) ||
        n.summary.toLowerCase().includes(q) ||
        n.departmentCode.toLowerCase().includes(q);
      return matchesCat && matchesScope && matchesQuery;
    });
  }, [notices, selectedNoticeCat, noticeBoardScope, noticeQuery]);

  async function handleInquirySubmit(e: FormEvent) {
    e.preventDefault();
    setInqError(null);
    setInqSuccess(null);
    setInqSubmitting(true);
    try {
      const inquiry = await onSubmitInquiry({
        fullName: inqName,
        email: inqEmail,
        phone: inqPhone,
        programLevel: inqProgram,
        departmentCode: inqDept,
        message: inqMessage,
      });
      setInqSuccess(
        `Inquiry recorded under reference ${inquiry.id.slice(0, 12)}. Our Admissions Desk will respond to ${inquiry.email}.`
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

  // 1. ABOUT PAGES (/about/*)
  if (route.startsWith('/about')) {
    const activeSlug =
      route === '/about/history'
        ? 'history'
        : route === '/about/mission-vision'
        ? 'mission-vision'
        : route === '/about/plans'
        ? 'plans'
        : 'our-university';

    const activeSection =
      aboutSections.find((s) => s.slug === activeSlug) || aboutSections[0];

    return (
      <main className="flex-1 bg-white">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-10">
          <div className="border-b border-slate-200 pb-6 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
              About Pabna University of Science &amp; Technology
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-medium text-slate-900">
              {activeSection?.title || 'Our University'}
            </h1>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'Our University', route: '/about/our-university' as AppRoute },
                { label: 'History', route: '/about/history' as AppRoute },
                { label: 'Mission and Vision', route: '/about/mission-vision' as AppRoute },
                { label: 'Strategic Plans', route: '/about/plans' as AppRoute },
              ].map((tab) => (
                <button
                  key={tab.route}
                  type="button"
                  onClick={() => onNavigate(tab.route)}
                  className={`px-3.5 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    route === tab.route || (route === '/about' && tab.route === '/about/our-university')
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-7 space-y-6">
              <p className="text-base leading-[1.8] text-slate-700 whitespace-pre-line">
                {activeSection?.body}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                {aboutSections.map((sec) => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => onNavigate(`/about/${sec.slug}` as AppRoute)}
                    className="text-left p-4 border border-slate-200 bg-slate-50 hover:border-emerald-300 transition-colors cursor-pointer"
                  >
                    <p className="font-serif text-base font-medium text-slate-900">{sec.title}</p>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{sec.body}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 space-y-5">
              <ResilientImage
                src={GROUNDS_IMAGE}
                alt="PUST Rajapur Campus"
                caption="Rajapur Campus Quadrangle along the Dhaka–Pabna Highway."
                className="w-full aspect-[4/3] object-cover"
              />
              <dl className="border border-slate-200 bg-slate-50 divide-y divide-slate-200 text-sm">
                <div className="px-4 py-3 flex justify-between">
                  <dt className="text-slate-600">Established</dt>
                  <dd className="font-mono font-medium">2008 (Act No. 43 of 2001)</dd>
                </div>
                <div className="px-4 py-3 flex justify-between">
                  <dt className="text-slate-600">Campus Area</dt>
                  <dd className="font-mono font-medium">30 Acres · Rajapur, Pabna</dd>
                </div>
                <div className="px-4 py-3 flex justify-between">
                  <dt className="text-slate-600">Faculties &amp; Departments</dt>
                  <dd className="font-mono font-medium">5 Faculties · 21 Departments</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>
      </main>
    );
  }

  // 2. ACADEMIC PAGES (/academics/*)
  if (route.startsWith('/academics')) {
    const academicSubTabs: Array<{ label: string; route: AppRoute }> = [
      { label: 'Departments (21)', route: '/academics/departments' },
      { label: 'Programs', route: '/academics/programs' },
      { label: 'Faculties', route: '/academics/faculty' },
      { label: 'Forms Download', route: '/academics/forms-download' },
      { label: 'Academic Calendar', route: '/academics/calendar' },
      { label: 'Scholarship', route: '/academics/scholarship' },
      { label: 'Seminars & Workshops', route: '/academics/seminars' },
      { label: 'All Dean', route: '/academics/deans' },
      { label: 'All Chairman', route: '/academics/chairmen' },
      { label: 'PUST Journals', route: '/academics/journals' },
      { label: 'Publications', route: '/academics/publications' },
    ];

    return (
      <main className="flex-1 bg-white">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-8">
          <div className="border-b border-slate-200 pb-6 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
              Academic Affairs &amp; Research
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-medium text-slate-900">
              {academicSubTabs.find((t) => t.route === route)?.label || 'Academic Directory'}
            </h1>
            <div className="flex flex-wrap gap-1.5">
              {academicSubTabs.map((tab) => (
                <button
                  key={tab.route}
                  type="button"
                  onClick={() => onNavigate(tab.route)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    route === tab.route ||
                    (route === '/academics' && tab.route === '/academics/departments')
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {route === '/academics/forms-download' ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Official student and departmental forms. Download printable form templates or submit
                and track clearances directly in the Campus Portal.
              </p>
              <div className="divide-y divide-stone-200 border border-stone-200">
                {DOWNLOAD_FORMS.map((form) => (
                  <div
                    key={form.code}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white"
                  >
                    <div className="space-y-1">
                      <p className="font-mono text-xs text-emerald-800">{form.code}</p>
                      <h2 className="font-serif text-lg font-medium text-slate-900">{form.title}</h2>
                      <p className="text-xs text-slate-600">
                        {form.office} — {form.note}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const content = [
                            'PABNA UNIVERSITY OF SCIENCE AND TECHNOLOGY (PUST)',
                            'Rajapur, Pabna-6600, Bangladesh',
                            '============================================================',
                            `FORM CODE : ${form.code}`,
                            `TITLE     : ${form.title}`,
                            `OFFICE    : ${form.office}`,
                            '------------------------------------------------------------',
                            'Student Name        : ______________________________________',
                            'Academic ID / Roll  : ______________________________________',
                            'Department & Session: ______________________________________',
                            'Hall Affiliation    : ______________________________________',
                            'Signature & Date    : ______________________________________',
                            '------------------------------------------------------------',
                            `Notes: ${form.note}`,
                          ].join('\n');
                          const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${form.code}.txt`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-stone-300 bg-white text-slate-800 hover:border-emerald-800 hover:text-emerald-800 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        Download Template
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigate('/portal')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-emerald-800 text-white hover:bg-emerald-900 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Open Digital Form in Portal
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : route === '/academics/calendar' ? (
            <div className="divide-y divide-slate-200 border border-slate-200">
              {ACADEMIC_CALENDAR_2026.map((row) => (
                <div
                  key={row.event}
                  className="p-5 grid grid-cols-1 sm:grid-cols-12 gap-3 items-baseline"
                >
                  <p className="sm:col-span-3 font-mono text-xs text-emerald-700 tabular-nums">
                    {row.date}
                  </p>
                  <p className="sm:col-span-5 font-medium text-slate-900">{row.event}</p>
                  <p className="sm:col-span-4 text-xs text-slate-600 sm:text-right">{row.term}</p>
                </div>
              ))}
            </div>
          ) : route === '/academics/scholarship' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: 'PUST Merit & Dean’s List Scholarship',
                  detail:
                    'Awarded per semester to top CGPA achievers in each of the 21 academic departments based on published examination results.',
                },
                {
                  title: 'UGC & Government Stipend Programs',
                  detail:
                    'Need-based and research stipends administered via the Student Advisor Office and Registrar desk.',
                },
                {
                  title: 'Prime Minister / ICT Innovation Fellowships',
                  detail:
                    'Research grants supporting M.Sc., M.Phil., and thesis undergraduates in Engineering and Applied Sciences.',
                },
                {
                  title: 'Residential Fee Waiver Assistance',
                  detail:
                    'Financial waivers coordinated between July 06 Hall / dormitories and the Student Welfare Directorate.',
                },
              ].map((s) => (
                <div key={s.title} className="p-6 border border-slate-200 bg-slate-50 space-y-2">
                  <h2 className="font-serif text-xl font-medium text-slate-900">{s.title}</h2>
                  <p className="text-sm text-slate-600 leading-relaxed">{s.detail}</p>
                </div>
              ))}
            </div>
          ) : route === '/academics/seminars' ? (
            <div className="divide-y divide-slate-200 border border-slate-200">
              {[
                {
                  date: '2026-12-03',
                  host: 'IQAC & ICT Cell',
                  title: 'Outcome-Based Education (OBE) & Digital Assessment Symposium',
                },
                {
                  date: '2026-12-18',
                  host: 'Faculty of Engineering & Technology',
                  title: '2nd Regional Workshop on Smart Grid, VLSI & River Basin Geotechnics',
                },
                {
                  date: '2027-01-14',
                  host: 'Department of Pharmacy & Chemistry',
                  title: 'Phytochemistry & Sustainable Nanomaterials Research Colloquium',
                },
              ].map((sem) => (
                <div key={sem.title} className="p-5 space-y-1">
                  <p className="font-mono text-xs text-emerald-700 tabular-nums">
                    {sem.date} · {sem.host}
                  </p>
                  <h2 className="font-serif text-lg font-medium text-slate-900">{sem.title}</h2>
                </div>
              ))}
            </div>
          ) : route === '/academics/deans' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  faculty: 'Faculty of Engineering and Technology',
                  dean: 'Prof. Dr. Md. Anwar Hossain',
                  depts: 'CSE, EEE, ETE, ICE, Architecture, Civil, URP',
                },
                {
                  faculty: 'Faculty of Science',
                  dean: 'Prof. Dr. Md. Harun-Or-Rashid',
                  depts: 'Mathematics, Physics, Chemistry, Statistics',
                },
                {
                  faculty: 'Faculty of Business Studies',
                  dean: 'Prof. Dr. Md. Kamruzzaman',
                  depts: 'Business Administration, Tourism & Hospitality Management',
                },
                {
                  faculty: 'Faculty of Humanities and Social Science',
                  dean: 'Prof. Dr. Md. Habibullah',
                  depts: 'Economics, Bangla, English, Public Admin, History, Social Work',
                },
                {
                  faculty: 'Faculty of Life and Earth Science',
                  dean: 'Prof. Dr. Md. Rashedul Islam',
                  depts: 'Geography & Environment, Pharmacy',
                },
              ].map((d) => (
                <div key={d.faculty} className="p-6 border border-slate-200 bg-slate-50 space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                    {d.faculty}
                  </p>
                  <h2 className="font-serif text-xl font-medium text-slate-900">{d.dean}</h2>
                  <p className="text-xs text-slate-600">Departments: {d.depts}</p>
                </div>
              ))}
            </div>
          ) : route === '/academics/chairmen' ? (
            <div className="divide-y divide-slate-200 border border-slate-200">
              {departments.map((d) => (
                <div
                  key={d.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <p className="font-mono text-xs text-emerald-700">
                      {d.code} · {d.faculty}
                    </p>
                    <p className="font-serif text-lg font-medium text-slate-900">
                      Department of {d.name}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-slate-800">{d.chairmanName}</p>
                </div>
              ))}
            </div>
          ) : route === '/academics/journals' || route === '/academics/publications' ? (
            <ResearchSection
              publications={publications}
              journals={profile?.journals ?? []}
              labImage={LAB_IMAGE}
              libraryImage={LIBRARY_IMAGE}
              groundsImage={GROUNDS_IMAGE}
            />
          ) : (
            // Default /academics, /academics/departments, /academics/programs, /academics/faculty
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex flex-wrap gap-1.5">
                  {FACULTY_FILTERS.map((tab) => (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => setSelectedFaculty(tab.value)}
                      className={`px-3.5 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        selectedFaculty === tab.value
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:text-emerald-800 hover:bg-emerald-50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full lg:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={deptQuery}
                    onChange={(e) => setDeptQuery(e.target.value)}
                    placeholder="Filter 21 departments..."
                    className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 bg-slate-50 focus:outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              {loadingData ? (
                <div className="py-10 text-sm text-slate-600">Loading academic directory...</div>
              ) : dataError ? (
                <div className="py-10 text-sm text-red-700">{dataError}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-l border-slate-200">
                  {filteredDepartments.map((dept) => (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => onSelectDepartment(dept)}
                      className="text-left p-6 border-r border-b border-t border-slate-200 bg-slate-50/40 hover:bg-emerald-50/30 transition-colors flex flex-col justify-between gap-4 group cursor-pointer"
                    >
                      <div>
                        <p className="font-mono text-xs text-emerald-700">
                          {dept.code} · Est. {dept.established} · {dept.intakeSeats} Seats
                        </p>
                        <h2 className="font-serif text-xl font-medium text-slate-900 mt-2 group-hover:text-emerald-800">
                          {dept.name}
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                          Chair: {dept.chairmanName}
                        </p>
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
            </div>
          )}
        </section>
      </main>
    );
  }

  // 3. ADMISSIONS PAGES (/admissions/*)
  if (route.startsWith('/admissions')) {
    const admissionTabs: Array<{ label: string; route: AppRoute }> = [
      { label: 'Admissions Overview', route: '/admissions' },
      { label: 'Undergraduate (GST)', route: '/admissions/undergraduate' },
      { label: 'Graduate', route: '/admissions/graduate' },
      { label: 'Evening Programs', route: '/admissions/evening-programs' },
      { label: 'Admission Notice', route: '/admissions/notice' },
    ];
    const admissionNotices = notices.filter((n) => n.category === 'Admission');

    return (
      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-10">
          <div className="border-b border-slate-200 pb-6 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
              Admissions 2026–2027
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-medium text-slate-900">
              {admissionTabs.find((t) => t.route === route)?.label || 'Admissions Desk'}
            </h1>
            <div className="flex flex-wrap gap-1.5">
              {admissionTabs.map((t) => (
                <button
                  key={t.route}
                  type="button"
                  onClick={() => onNavigate(t.route)}
                  className={`px-3.5 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    route === t.route
                      ? 'bg-emerald-700 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-300 hover:text-emerald-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {route === '/admissions/notice' ? (
            <div className="divide-y divide-slate-200 border border-slate-200 bg-white">
              {admissionNotices.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => onSelectNotice(n)}
                  className="w-full text-left p-5 hover:bg-emerald-50/35 cursor-pointer space-y-1"
                >
                  <p className="font-mono text-xs text-emerald-700">
                    {n.publishedAt} · {n.referenceNo}
                  </p>
                  <h2 className="font-serif text-lg font-medium text-slate-900">{n.title}</h2>
                  <p className="text-sm text-slate-600">{n.summary}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
              <div className="lg:col-span-5 space-y-6">
                <p className="text-[15px] text-slate-700 leading-relaxed">
                  {route === '/admissions/graduate'
                    ? 'Graduate programs (M.Sc., M.Engg., M.Pharm, M.B.A., M.A., M.S.S.) and M.Phil./Ph.D. admissions are coordinated departmentally in coordination with the PUST Academic Council.'
                    : route === '/admissions/evening-programs'
                    ? 'Evening professional tracks including Executive MBA (EMBA) and M.Sc. in Engineering offer weekend and evening cohorts for working professionals.'
                    : 'Undergraduate admissions into all 21 departments follow the Bangladesh GST (General, Science & Technology) Integrated Admission Test across Units A, B, and C, with an architecture studio aptitude assessment.'}
                </p>

                <dl className="divide-y divide-slate-200 border-y border-slate-200 text-sm">
                  <div className="py-3.5 flex justify-between gap-4">
                    <dt className="text-slate-600">Total Undergraduate Intake</dt>
                    <dd className="font-mono tabular-nums font-medium text-slate-900">
                      920 Seats / Session
                    </dd>
                  </div>
                  <div className="py-3.5 flex justify-between gap-4">
                    <dt className="text-slate-600">Admitted Student Signup</dt>
                    <dd className="text-right font-medium text-emerald-700">
                      Via Dept. Portal Token
                    </dd>
                  </div>
                  <div className="py-3.5 flex justify-between gap-4">
                    <dt className="text-slate-600">Registrar Admissions Desk</dt>
                    <dd className="font-mono text-emerald-700">registrar@pust.ac.bd</dd>
                  </div>
                </dl>

                <button
                  type="button"
                  onClick={() => onNavigate('/portal')}
                  className="px-5 py-2.5 text-sm font-medium border border-emerald-700 text-emerald-700 hover:bg-emerald-700 hover:text-white transition-colors cursor-pointer"
                >
                  Have a Student Signup Token? Register in Portal
                </button>
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

                <form onSubmit={handleInquirySubmit} className="space-y-4">
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
                        Department
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
                      placeholder="Ask about eligibility, GST merit cutoffs, July 06 Hall allotment, or syllabus..."
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
          )}
        </section>
      </main>
    );
  }

  // 4. FACILITIES PAGES (/facilities/*)
  if (route.startsWith('/facilities')) {
    const facTabs: Array<{ label: string; route: AppRoute; title: string; body: string; img: string }> =
      [
        {
          label: 'Library',
          route: '/facilities/library',
          title: 'Central Library & Information Center',
          body: 'Digital and print monographs with IEEE Xplore, SpringerLink, and ACM access. Students apply for Library Membership in the Campus Portal with Department Chairman digital seal & signature JSON to receive Digital and linked Physical Library Cards.',
          img: LIBRARY_IMAGE,
        },
        {
          label: 'Residence',
          route: '/facilities/residence',
          title: 'Residential Halls (July 06 Hall & Dormitories)',
          body: 'Student residential halls including July 06 Hall, Male Hall-1, Male Hall-2, Female Hall-1, and Female Hall-2. Vacancy circulars, seat allotments with retained seat history, and Hall Financial Clearances are managed online.',
          img: GROUNDS_IMAGE,
        },
        {
          label: 'Transport',
          route: '/facilities/transport',
          title: 'University Transport Pool',
          body: 'Scheduled daily bus routes connecting Rajapur Campus with Pabna town centers, Terminal, Edward College, and Ataikula corridor for students, faculty, and officers.',
          img: GROUNDS_IMAGE,
        },
        {
          label: 'Medical',
          route: '/facilities/medical',
          title: 'PUST Medical Center',
          body: 'On-campus primary healthcare, outpatient consultations, emergency ambulance dispatch, and wellness support for residential and non-residential students.',
          img: LAB_IMAGE,
        },
        {
          label: 'ICT Sheba',
          route: '/facilities/ict-sheba',
          title: 'ICT Cell & ICT Sheba Portal',
          body: 'Campus fiber-optic Wi-Fi network, institutional @pust.ac.bd email provisioning, digital examination clearance workflows, and smart classroom maintenance.',
          img: LAB_IMAGE,
        },
      ];

    const currentFac = facTabs.find((f) => f.route === route) || facTabs[0];

    return (
      <main className="flex-1 bg-white">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-10">
          <div className="border-b border-slate-200 pb-6 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
              Campus Facilities &amp; Student Services
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-medium text-slate-900">
              {currentFac.title}
            </h1>
            <div className="flex flex-wrap gap-1.5">
              {facTabs.map((f) => (
                <button
                  key={f.route}
                  type="button"
                  onClick={() => onNavigate(f.route)}
                  className={`px-3.5 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    currentFac.route === f.route
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-6 space-y-5">
              <p className="text-base leading-relaxed text-slate-700">{currentFac.body}</p>
              <button
                type="button"
                onClick={() => onNavigate('/portal')}
                className="px-5 py-2.5 text-sm font-medium bg-emerald-700 text-white hover:bg-emerald-800 transition-colors cursor-pointer"
              >
                Access Service in Campus Portal
              </button>
            </div>
            <div className="lg:col-span-6">
              <ResilientImage
                src={currentFac.img}
                alt={currentFac.title}
                caption={currentFac.title}
                className="w-full aspect-[4/3] object-cover"
              />
            </div>
          </div>
        </section>
      </main>
    );
  }

  // 5. GALLERY PAGE (/gallery)
  if (route === '/gallery') {
    const cats: Array<'All' | GalleryItemRecord['category']> = [
      'All',
      'Convocation',
      'Festival',
      'Academic Event',
      'Campus Life',
    ];
    const items =
      galleryCategory === 'All'
        ? galleryItems
        : galleryItems.filter((g) => g.category === galleryCategory);

    return (
      <main className="flex-1 bg-white">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
                University Media Archive
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl font-medium text-slate-900 mt-1">
                Campus Photos &amp; Videos Gallery
              </h1>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {cats.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setGalleryCategory(c)}
                  className={`px-3.5 py-2 text-xs font-medium cursor-pointer ${
                    galleryCategory === c
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-emerald-50'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveMedia(item)}
                className="text-left border border-slate-200 bg-slate-50 hover:border-emerald-300 transition-colors group cursor-pointer flex flex-col"
              >
                <div className="relative aspect-[4/3] bg-slate-900 overflow-hidden">
                  <ResilientImage
                    src={item.mediaUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  {item.mediaType === 'video' && (
                    <span className="absolute inset-0 flex items-center justify-center bg-slate-950/35 text-white">
                      <PlayCircle className="w-10 h-10" />
                    </span>
                  )}
                </div>
                <div className="p-4 space-y-1">
                  <p className="font-mono text-xs text-emerald-700">
                    {item.category} · {item.mediaType.toUpperCase()} · {item.eventDate}
                  </p>
                  <h2 className="font-serif text-lg font-medium text-slate-900 group-hover:text-emerald-800">
                    {item.title}
                  </h2>
                  <p className="text-xs text-slate-600">{item.description}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {activeMedia && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
            onClick={() => setActiveMedia(null)}
          >
            <div
              className="w-full max-w-2xl bg-white border border-slate-200 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
                <div>
                  <p className="font-mono text-xs text-emerald-700">
                    {activeMedia.category} · {activeMedia.mediaType.toUpperCase()}
                  </p>
                  <h3 className="font-serif text-xl font-medium text-slate-900">
                    {activeMedia.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMedia(null)}
                  className="p-1.5 text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <ResilientImage
                  src={activeMedia.mediaUrl}
                  alt={activeMedia.title}
                  className="w-full aspect-video object-cover"
                />
                <p className="text-sm text-slate-700">{activeMedia.description}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  // 6. NOTICES PAGE (/notices)
  return (
    <main className="flex-1">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-slate-200">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
              Central &amp; Department Circulars
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
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 bg-white focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 py-5 border-b border-slate-200">
          <div className="flex flex-wrap gap-1.5">
            {NOTICE_FILTERS.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedNoticeCat(cat)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedNoticeCat === cat
                    ? 'bg-emerald-700 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-300 hover:text-emerald-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex gap-1.5">
            {(
              [
                { id: 'all', label: 'All Boards' },
                { id: 'central', label: 'Central Board' },
                { id: 'department', label: 'Department & Course' },
              ] as const
            ).map((scope) => (
              <button
                key={scope.id}
                type="button"
                onClick={() => setNoticeBoardScope(scope.id)}
                className={`px-3 py-1.5 text-xs font-medium cursor-pointer ${
                  noticeBoardScope === scope.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-700'
                }`}
              >
                {scope.label}
              </button>
            ))}
          </div>
        </div>

        {filteredNotices.length === 0 ? (
          <div className="py-10 text-sm text-slate-600">No notices match the selected filter.</div>
        ) : (
          <div className="divide-y divide-slate-200 border border-slate-200 bg-white mt-6">
            {filteredNotices.map((notice) => (
              <button
                key={notice.id}
                type="button"
                onClick={() => onSelectNotice(notice)}
                className="w-full text-left px-5 sm:px-6 py-5 hover:bg-emerald-50/35 transition-colors grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-6 items-baseline group cursor-pointer"
              >
                <div className="lg:col-span-3 font-mono text-xs text-slate-500 tabular-nums">
                  <span>{notice.publishedAt}</span>
                  <span className="mx-2">·</span>
                  <span className="font-semibold text-emerald-700">{notice.category}</span>
                </div>

                <div className="lg:col-span-7">
                  <h2 className="font-serif text-lg font-medium text-slate-900 group-hover:text-emerald-800 transition-colors">
                    {notice.title}
                  </h2>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">{notice.summary}</p>
                </div>

                <div className="lg:col-span-2 lg:text-right font-mono text-xs text-slate-500">
                  {notice.referenceNo}
                  {notice.visibility === 'registered' && (
                    <span className="block text-emerald-700 font-semibold mt-0.5">
                      Registered Only
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
