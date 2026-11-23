'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
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

const FACULTY_DEANS: Array<{ faculty: FacultyName; dean: string; code: string }> = [
  {
    faculty: 'Faculty of Engineering and Technology',
    dean: 'Prof. Dr. Md. Anwar Hossain',
    code: 'FET · 7 Departments',
  },
  {
    faculty: 'Faculty of Science',
    dean: 'Prof. Dr. Md. Harun-Or-Rashid',
    code: 'FS · 4 Departments',
  },
  {
    faculty: 'Faculty of Business Studies',
    dean: 'Prof. Dr. Md. Kamruzzaman',
    code: 'FBS · 2 Departments',
  },
  {
    faculty: 'Faculty of Humanities and Social Science',
    dean: 'Prof. Dr. Md. Habibullah',
    code: 'FHSS · 6 Departments',
  },
  {
    faculty: 'Faculty of Life and Earth Science',
    dean: 'Prof. Dr. Md. Rashedul Islam',
    code: 'FLES · 2 Departments',
  },
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

const UNIVERSITY_MILESTONES = [
  {
    year: '15 July 2001',
    title: 'University Act Enacted',
    detail: 'Parliament passes Pabna University of Science and Technology Act, 2001 (Act No. 43 of 2001).',
  },
  {
    year: '12 Oct 2008',
    title: 'Operational Gazette',
    detail: 'Government SRO brings PUST into active operation on the 30-acre Rajapur site.',
  },
  {
    year: '2009',
    title: 'Inaugural 140 Students',
    detail: 'First academic batch admitted across CSE, EEE, Mathematics, and Business Administration.',
  },
  {
    year: '2026',
    title: '5 Faculties · 21 Departments',
    detail: 'Nearly 5,000 scholars and 172 faculty members operating on an integrated digital campus.',
  },
  {
    year: '15 Mar 2027',
    title: 'First Convocation',
    detail: 'Historic First Convocation scheduled on the Rajapur Ceremonial Pavilion.',
  },
];

const DEGREE_PROGRAMS = [
  {
    level: 'Undergraduate Honors & Engineering',
    degrees: 'B.Sc. (Engg.), B.Arch., B.Pharm. (Hons.), B.Sc. (Hons.), B.B.A., B.A. (Hons.), B.S.S.',
    duration: '4 Years / 8 Semesters (B.Arch.: 5 Years / 10 Semesters)',
    credits: '140 – 195 Credit Hours',
    entry: 'Bangladesh GST Integrated Admission Test (Units A, B, C)',
  },
  {
    level: 'Graduate & Master Programs',
    degrees: 'M.Sc. (Engg.), M.Sc., M.Pharm., M.B.A., M.A., M.S.S.',
    duration: '1 – 1.5 Years (2 – 3 Semesters)',
    credits: '36 – 45 Credit Hours (Thesis & Non-Thesis Tracks)',
    entry: 'Departmental Postgraduate Selection & Merit Verification',
  },
  {
    level: 'Doctoral & Research Fellowships',
    degrees: 'M.Phil. & Ph.D.',
    duration: '2 – 5 Years Full-Time / Part-Time Research',
    credits: 'Coursework + Original Dissertation Defense',
    entry: 'Academic Council & Advanced Research Committee Approval',
  },
  {
    level: 'Evening & Executive Cohorts',
    degrees: 'EMBA & Evening M.Sc. in Applied Engineering',
    duration: '2 Years (Weekend / Evening Schedule)',
    credits: '48 – 60 Credit Hours',
    entry: 'Working Professionals & Industry Sponsored Track',
  },
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
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-12"
        >
          <div className="border-b border-stone-200 pb-6 space-y-4">
            <p className="font-mono text-xs uppercase tracking-widest text-emerald-800">
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
                      ? 'bg-emerald-800 text-white'
                      : 'bg-[#FAF8F4] border border-stone-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-7 space-y-6">
              <p className="text-base leading-[1.8] text-slate-700 whitespace-pre-line first-letter:font-serif first-letter:text-5xl first-letter:font-medium first-letter:float-left first-letter:mr-3 first-letter:leading-[0.86] first-letter:text-emerald-800">
                {activeSection?.body}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-stone-200">
                {aboutSections.map((sec) => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => onNavigate(`/about/${sec.slug}` as AppRoute)}
                    className={`text-left p-4 border transition-colors cursor-pointer ${
                      sec.slug === activeSlug
                        ? 'border-emerald-800 bg-emerald-50/40'
                        : 'border-stone-200 bg-[#FAF8F4] hover:border-emerald-400'
                    }`}
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
              <dl className="border border-stone-200 bg-[#FAF8F4] divide-y divide-stone-200 text-sm">
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
                <div className="px-4 py-3 flex justify-between">
                  <dt className="text-slate-600">First Convocation</dt>
                  <dd className="font-mono font-semibold text-emerald-800">
                    {profile?.convocationDate ?? '15 March 2027'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Institutional Chronological Milestones */}
          <div className="pt-8 border-t border-stone-200 space-y-4">
            <p className="font-mono text-xs uppercase tracking-widest text-emerald-800">
              Institutional Chronology
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 border border-stone-200 bg-[#FAF8F4] divide-y sm:divide-y-0 sm:divide-x divide-stone-200">
              {UNIVERSITY_MILESTONES.map((m) => (
                <div key={m.year} className="p-4 space-y-1.5">
                  <p className="font-mono text-xs font-semibold text-emerald-800 tabular-nums">
                    {m.year}
                  </p>
                  <h2 className="font-serif text-base font-medium text-slate-900">{m.title}</h2>
                  <p className="text-xs text-slate-600 leading-relaxed">{m.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>
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
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-8"
        >
          <div className="border-b border-stone-200 pb-6 space-y-4">
            <p className="font-mono text-xs uppercase tracking-widest text-emerald-800">
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
                      ? 'bg-emerald-800 text-white'
                      : 'bg-[#FAF8F4] border border-stone-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {route === '/academics/programs' ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {DEGREE_PROGRAMS.map((prog) => (
                  <div
                    key={prog.level}
                    className="p-6 border border-stone-200 bg-[#FAF8F4] space-y-3"
                  >
                    <p className="font-mono text-xs uppercase tracking-wider text-emerald-800">
                      {prog.duration}
                    </p>
                    <h2 className="font-serif text-2xl font-medium text-slate-900">{prog.level}</h2>
                    <p className="text-sm font-medium text-slate-800">{prog.degrees}</p>
                    <dl className="pt-3 border-t border-stone-200 space-y-1.5 text-xs">
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Credit Structure</dt>
                        <dd className="font-mono text-slate-900">{prog.credits}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Admission Pathway</dt>
                        <dd className="text-right text-slate-800">{prog.entry}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4 p-5 border border-stone-200 bg-white">
                <p className="text-sm text-slate-700">
                  All degree programs operate under the Outcome-Based Education (OBE) framework and
                  4.00 grading ordinance.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => onNavigate('/governance/academic-ordinance')}
                    className="px-4 py-2 text-xs font-medium border border-stone-300 text-slate-800 hover:border-emerald-800 hover:text-emerald-800 cursor-pointer"
                  >
                    Academic Ordinance
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('/academics/departments')}
                    className="px-4 py-2 text-xs font-medium bg-emerald-800 text-white hover:bg-emerald-900 cursor-pointer"
                  >
                    Browse 21 Departments
                  </button>
                </div>
              </div>
            </div>
          ) : route === '/academics/faculty' ? (
            <div className="space-y-8">
              {FACULTY_DEANS.map((fac) => {
                const facDepts = departments.filter((d) => d.faculty === fac.faculty);
                return (
                  <div key={fac.faculty} className="border border-stone-200 bg-white">
                    <div className="px-6 py-4 bg-[#FAF8F4] border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <p className="font-mono text-xs text-emerald-800">{fac.code}</p>
                        <h2 className="font-serif text-2xl font-medium text-slate-900">
                          {fac.faculty}
                        </h2>
                      </div>
                      <p className="text-xs text-slate-600">
                        Dean: <span className="font-medium text-slate-900">{fac.dean}</span>
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-stone-200">
                      {facDepts.map((dept) => (
                        <button
                          key={dept.id}
                          type="button"
                          onClick={() => onSelectDepartment(dept)}
                          className="text-left p-5 hover:bg-emerald-50/40 transition-colors space-y-1.5 border-b border-stone-200 cursor-pointer"
                        >
                          <p className="font-mono text-xs text-emerald-800 tabular-nums">
                            {dept.code} · {dept.intakeSeats} Seats
                          </p>
                          <h3 className="font-serif text-lg font-medium text-slate-900">
                            {dept.name}
                          </h3>
                          <p className="text-xs text-slate-500">Chair: {dept.chairmanName}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : route === '/academics/forms-download' ? (
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
            <div className="divide-y divide-stone-200 border border-stone-200 bg-white">
              {ACADEMIC_CALENDAR_2026.map((row) => (
                <div
                  key={row.event}
                  className="p-5 grid grid-cols-1 sm:grid-cols-12 gap-3 items-baseline"
                >
                  <p className="sm:col-span-3 font-mono text-xs text-emerald-800 tabular-nums">
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
                <div key={s.title} className="p-6 border border-stone-200 bg-[#FAF8F4] space-y-2">
                  <h2 className="font-serif text-xl font-medium text-slate-900">{s.title}</h2>
                  <p className="text-sm text-slate-600 leading-relaxed">{s.detail}</p>
                </div>
              ))}
            </div>
          ) : route === '/academics/seminars' ? (
            <div className="divide-y divide-stone-200 border border-stone-200">
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
                  <p className="font-mono text-xs text-emerald-800 tabular-nums">
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
                <div key={d.faculty} className="p-6 border border-stone-200 bg-[#FAF8F4] space-y-1.5">
                  <p className="font-mono text-xs uppercase tracking-wider text-emerald-800">
                    {d.faculty}
                  </p>
                  <h2 className="font-serif text-xl font-medium text-slate-900">{d.dean}</h2>
                  <p className="text-xs text-slate-600">Departments: {d.depts}</p>
                </div>
              ))}
            </div>
          ) : route === '/academics/chairmen' ? (
            <div className="divide-y divide-stone-200 border border-stone-200">
              {departments.map((d) => (
                <div
                  key={d.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <p className="font-mono text-xs text-emerald-800">
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
            // Default /academics & /academics/departments
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
                          ? 'bg-emerald-800 text-white'
                          : 'bg-[#FAF8F4] border border-stone-200 text-slate-700 hover:text-emerald-800 hover:bg-emerald-50'
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
                    className="w-full pl-10 pr-4 py-2 text-sm border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-700 focus:bg-white"
                  />
                </div>
              </div>

              {loadingData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div
                      key={n}
                      className="h-44 border border-stone-200 bg-[#FAF8F4] animate-pulse p-6"
                    />
                  ))}
                </div>
              ) : dataError ? (
                <div className="p-6 border border-red-200 bg-red-50 text-sm text-red-800">
                  {dataError}
                </div>
              ) : filteredDepartments.length === 0 ? (
                <div className="p-10 border border-stone-200 bg-[#FAF8F4] text-center space-y-3">
                  <p className="text-sm text-slate-700">
                    No academic departments match your current search or faculty filter.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFaculty('All');
                      setDeptQuery('');
                    }}
                    className="px-4 py-2 text-xs font-medium bg-emerald-800 text-white cursor-pointer"
                  >
                    Reset Department Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-l border-stone-200">
                  {filteredDepartments.map((dept) => (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => onSelectDepartment(dept)}
                      className="text-left p-6 border-r border-b border-t border-stone-200 bg-[#FAF8F4]/50 hover:bg-emerald-50/40 transition-colors flex flex-col justify-between gap-4 group cursor-pointer"
                    >
                      <div>
                        <p className="font-mono text-xs text-emerald-800 tabular-nums">
                          {dept.code} · Est. {dept.established} · {dept.intakeSeats} Seats
                        </p>
                        <h2 className="font-serif text-xl font-medium text-slate-900 mt-2 group-hover:text-emerald-900">
                          {dept.name}
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">Chair: {dept.chairmanName}</p>
                        <p className="text-sm text-slate-700 mt-3 leading-relaxed line-clamp-2">
                          {dept.summary}
                        </p>
                      </div>
                      <div className="pt-3 border-t border-stone-200/80 flex items-center justify-between text-xs text-slate-600">
                        <span>{dept.degrees.join(' / ')}</span>
                        <span className="font-semibold text-emerald-800 group-hover:underline">
                          Prospectus
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.section>
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
      <main className="flex-1 bg-[#FAF8F4]">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-10"
        >
          <div className="border-b border-stone-200 pb-6 space-y-4">
            <p className="font-mono text-xs uppercase tracking-widest text-emerald-800">
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
                      ? 'bg-emerald-800 text-white'
                      : 'bg-white border border-stone-200 text-slate-700 hover:border-emerald-400 hover:text-emerald-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {route === '/admissions/notice' ? (
            <div className="divide-y divide-stone-200 border border-stone-200 bg-white">
              {admissionNotices.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => onSelectNotice(n)}
                  className="w-full text-left p-5 hover:bg-emerald-50/35 cursor-pointer space-y-1"
                >
                  <p className="font-mono text-xs text-emerald-800 tabular-nums">
                    {n.publishedAt} · {n.referenceNo}
                  </p>
                  <h2 className="font-serif text-lg font-medium text-slate-900">{n.title}</h2>
                  <p className="text-sm text-slate-600">{n.summary}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-3 border border-stone-200 bg-white divide-y md:divide-y-0 md:divide-x divide-stone-200">
                <div className="p-5 space-y-1.5">
                  <p className="font-mono text-xs text-emerald-800">GST UNIT A · SCIENCE &amp; ENGG.</p>
                  <p className="font-serif text-lg font-medium text-slate-900">13 Departments</p>
                  <p className="text-xs text-slate-600">
                    CSE, EEE, ETE, ICE, Architecture, Civil, URP, Mathematics, Physics, Chemistry,
                    Statistics, Pharmacy &amp; Geography.
                  </p>
                </div>
                <div className="p-5 space-y-1.5">
                  <p className="font-mono text-xs text-emerald-800">GST UNIT B · HUMANITIES</p>
                  <p className="font-serif text-lg font-medium text-slate-900">6 Departments</p>
                  <p className="text-xs text-slate-600">
                    Economics, Bangla, English, Public Administration, History &amp; Social Work.
                  </p>
                </div>
                <div className="p-5 space-y-1.5">
                  <p className="font-mono text-xs text-emerald-800">GST UNIT C · BUSINESS</p>
                  <p className="font-serif text-lg font-medium text-slate-900">2 Departments</p>
                  <p className="text-xs text-slate-600">
                    Business Administration &amp; Tourism and Hospitality Management.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
                <div className="lg:col-span-5 space-y-6">
                  <p className="text-[15px] text-slate-700 leading-relaxed">
                    {route === '/admissions/graduate'
                      ? 'Graduate programs (M.Sc., M.Engg., M.Pharm, M.B.A., M.A., M.S.S.) and M.Phil./Ph.D. admissions are coordinated departmentally in coordination with the PUST Academic Council.'
                      : route === '/admissions/evening-programs'
                      ? 'Evening professional tracks including Executive MBA (EMBA) and M.Sc. in Engineering offer weekend and evening cohorts for working professionals.'
                      : 'Undergraduate admissions into all 21 departments follow the Bangladesh GST (General, Science & Technology) Integrated Admission Test across Units A, B, and C, with an architecture studio aptitude assessment.'}
                  </p>

                  <dl className="divide-y divide-stone-200 border-y border-stone-200 text-sm bg-white px-5">
                    <div className="py-3.5 flex justify-between gap-4">
                      <dt className="text-slate-600">Total Undergraduate Intake</dt>
                      <dd className="font-mono tabular-nums font-medium text-slate-900">
                        920 Seats / Session
                      </dd>
                    </div>
                    <div className="py-3.5 flex justify-between gap-4">
                      <dt className="text-slate-600">Admitted Student Signup</dt>
                      <dd className="text-right font-medium text-emerald-800">
                        Via Dept. Portal Token
                      </dd>
                    </div>
                    <div className="py-3.5 flex justify-between gap-4">
                      <dt className="text-slate-600">Registrar Admissions Desk</dt>
                      <dd className="font-mono text-emerald-800">registrar@pust.ac.bd</dd>
                    </div>
                  </dl>

                  <button
                    type="button"
                    onClick={() => onNavigate('/portal')}
                    className="px-5 py-2.5 text-sm font-medium border border-emerald-800 text-emerald-800 bg-white hover:bg-emerald-800 hover:text-white transition-colors cursor-pointer"
                  >
                    Have a Student Signup Token? Register in Portal
                  </button>
                </div>

                <div className="lg:col-span-7 bg-white border border-stone-200 p-6 sm:p-8">
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
                          className="w-full px-3.5 py-2.5 text-sm border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-700 focus:bg-white"
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
                          className="w-full px-3.5 py-2.5 text-sm border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-700 focus:bg-white"
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
                          className="w-full px-3.5 py-2.5 text-sm border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-700 focus:bg-white"
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
                          className="w-full px-3.5 py-2.5 text-sm border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-700 focus:bg-white"
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
                          className="w-full px-3.5 py-2.5 text-sm border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-700 focus:bg-white"
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
                        className="w-full px-3.5 py-2.5 text-sm border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-700 focus:bg-white"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={inqSubmitting}
                      className="px-6 py-2.5 text-sm font-medium bg-emerald-800 text-white hover:bg-emerald-900 disabled:opacity-60 transition-colors cursor-pointer"
                    >
                      {inqSubmitting ? 'Submitting Inquiry...' : 'Send Admission Inquiry'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </motion.section>
      </main>
    );
  }

  // 4. FACILITIES PAGES (/facilities/*)
  if (route.startsWith('/facilities')) {
    const facTabs: Array<{
      label: string;
      route: AppRoute;
      title: string;
      body: string;
      img: string;
      hours: string;
      location: string;
      highlights: string[];
    }> = [
      {
        label: 'Library',
        route: '/facilities/library',
        title: 'Central Library & Information Center',
        body: 'Digital and print monographs with IEEE Xplore, SpringerLink, and ACM access. Students apply for Library Membership in the Campus Portal with Department Chairman digital seal & signature JSON to receive Digital and linked Physical Library Cards.',
        img: LIBRARY_IMAGE,
        hours: 'Sun–Thu · 08:30–21:00 BST',
        location: 'Central Library Complex, Rajapur',
        highlights: [
          'Chairman-sealed digital membership approval workflow',
          'Linked Digital & Physical Library Card ID issuance',
          'Automated borrow, return & overdue tracking',
        ],
      },
      {
        label: 'Residence',
        route: '/facilities/residence',
        title: 'Residential Halls (July 06 Hall & Dormitories)',
        body: 'Student residential halls including July 06 Hall, Male Hall-1, Male Hall-2, Female Hall-1, and Female Hall-2. Vacancy circulars, seat allotments with retained seat history, and Hall Financial Clearances are managed online.',
        img: GROUNDS_IMAGE,
        hours: '24/7 Provost & House Tutor Duty',
        location: 'Residential Precinct, Rajapur',
        highlights: [
          'Live seat vacancy circulars by Hall & block',
          'Full retained seat change history per student ID',
          'Mandatory Hall dues clearance synced with Exam Portal',
        ],
      },
      {
        label: 'Transport',
        route: '/facilities/transport',
        title: 'University Transport Pool',
        body: 'Scheduled daily bus routes connecting Rajapur Campus with Pabna town centers, Terminal, Edward College, and Ataikula corridor for students, faculty, and officers.',
        img: GROUNDS_IMAGE,
        hours: 'Sun–Thu · 07:15–18:30 BST',
        location: 'Transport Pool Depot, Main Gate',
        highlights: [
          'Dedicated student & faculty shuttle schedules',
          'Pabna Town, Terminal, Edward College & Highway corridors',
          'Convocation & examination special shuttle dispatch',
        ],
      },
      {
        label: 'Medical',
        route: '/facilities/medical',
        title: 'PUST Medical Center',
        body: 'On-campus primary healthcare, outpatient consultations, emergency ambulance dispatch, and wellness support for residential and non-residential students.',
        img: LAB_IMAGE,
        hours: 'Outpatient 09:00–17:00 · 24/7 Ambulance',
        location: 'Medical Center Building, Rajapur',
        highlights: [
          'Resident medical officers & nursing care',
          'Essential first-aid and primary prescriptions',
          'Direct emergency referral to Pabna General Hospital',
        ],
      },
      {
        label: 'ICT Sheba',
        route: '/facilities/ict-sheba',
        title: 'ICT Cell & ICT Sheba Portal',
        body: 'Campus fiber-optic Wi-Fi network, institutional @pust.ac.bd email provisioning, digital examination clearance workflows, and smart classroom maintenance.',
        img: LAB_IMAGE,
        hours: 'Sun–Thu · 09:00–17:00 BST',
        location: 'Academic & Administrative ICT Wing',
        highlights: [
          'University-wide fiber backbone & eduroam-ready Wi-Fi',
          'Institutional email & portal token provisioning',
          'Digital admit card & 4-office certificate workflow support',
        ],
      },
    ];

    const currentFac = facTabs.find((f) => f.route === route) || facTabs[0];

    return (
      <main className="flex-1 bg-white">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-10"
        >
          <div className="border-b border-stone-200 pb-6 space-y-4">
            <p className="font-mono text-xs uppercase tracking-widest text-emerald-800">
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
                      ? 'bg-emerald-800 text-white'
                      : 'bg-[#FAF8F4] border border-stone-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-6 space-y-6">
              <p className="text-base leading-relaxed text-slate-700">{currentFac.body}</p>

              <dl className="border border-stone-200 bg-[#FAF8F4] divide-y divide-stone-200 text-sm">
                <div className="px-4 py-3 flex justify-between gap-4">
                  <dt className="text-slate-600">Service Hours</dt>
                  <dd className="font-mono font-medium text-slate-900">{currentFac.hours}</dd>
                </div>
                <div className="px-4 py-3 flex justify-between gap-4">
                  <dt className="text-slate-600">Location</dt>
                  <dd className="font-medium text-slate-900 text-right">{currentFac.location}</dd>
                </div>
              </dl>

              <div className="space-y-2">
                <p className="font-mono text-xs uppercase tracking-wider text-emerald-800">
                  Key Capabilities
                </p>
                <ul className="space-y-2 text-sm text-slate-700 list-disc pl-5">
                  {currentFac.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('/portal')}
                className="px-5 py-2.5 text-sm font-medium bg-emerald-800 text-white hover:bg-emerald-900 transition-colors cursor-pointer"
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
        </motion.section>
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
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-stone-200">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-emerald-800">
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
                      ? 'bg-emerald-800 text-white'
                      : 'bg-[#FAF8F4] border border-stone-200 text-slate-700 hover:bg-emerald-50'
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
                className="text-left border border-stone-200 bg-[#FAF8F4] hover:border-emerald-400 transition-colors group cursor-pointer flex flex-col"
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
                  <p className="font-mono text-xs text-emerald-800 tabular-nums">
                    {item.category} · {item.mediaType.toUpperCase()} · {item.eventDate}
                  </p>
                  <h2 className="font-serif text-lg font-medium text-slate-900 group-hover:text-emerald-900">
                    {item.title}
                  </h2>
                  <p className="text-xs text-slate-600">{item.description}</p>
                </div>
              </button>
            ))}
          </div>
        </motion.section>

        {activeMedia && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
            onClick={() => setActiveMedia(null)}
          >
            <div
              className="w-full max-w-2xl bg-white border border-stone-200 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between px-5 py-4 border-b border-stone-200 bg-[#FAF8F4]">
                <div>
                  <p className="font-mono text-xs text-emerald-800">
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
    <main className="flex-1 bg-[#FAF8F4]">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16"
      >
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-stone-200">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-emerald-800">
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
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-stone-300 bg-white focus:outline-none focus:border-emerald-700"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 py-5 border-b border-stone-200">
          <div className="flex flex-wrap gap-1.5">
            {NOTICE_FILTERS.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedNoticeCat(cat)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedNoticeCat === cat
                    ? 'bg-emerald-800 text-white'
                    : 'bg-white border border-stone-200 text-slate-700 hover:border-emerald-400 hover:text-emerald-800'
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
                    : 'bg-white border border-stone-200 text-slate-700'
                }`}
              >
                {scope.label}
              </button>
            ))}
          </div>
        </div>

        {filteredNotices.length === 0 ? (
          <div className="py-10 text-sm text-slate-600 bg-white border border-stone-200 mt-6 p-6 text-center space-y-3">
            <p>No notices match the selected filter criteria.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedNoticeCat('All');
                setNoticeBoardScope('all');
                setNoticeQuery('');
              }}
              className="px-4 py-2 text-xs font-medium bg-emerald-800 text-white cursor-pointer"
            >
              Reset Notice Filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-stone-200 border border-stone-200 bg-white mt-6">
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
                  <span className="font-semibold text-emerald-800">{notice.category}</span>
                </div>

                <div className="lg:col-span-7">
                  <h2 className="font-serif text-lg font-medium text-slate-900 group-hover:text-emerald-900 transition-colors">
                    {notice.title}
                  </h2>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">{notice.summary}</p>
                </div>

                <div className="lg:col-span-2 lg:text-right font-mono text-xs text-slate-500 tabular-nums">
                  {notice.referenceNo}
                  {notice.visibility === 'registered' && (
                    <span className="block text-emerald-800 font-semibold mt-0.5">
                      Registered Only
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </motion.section>
    </main>
  );
}
