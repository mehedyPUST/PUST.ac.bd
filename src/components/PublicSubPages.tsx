'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileDown,
  FileText,
  PlayCircle,
  Printer,
  Search,
  X,
} from 'lucide-react';
import { pustApi } from '../lib/api';
import type { AppRoute } from '../lib/routes';
import { CardsGridSkeleton } from './PustSkeletons';
import { PustCrest } from './PustCrest';
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
  PublicStatusLookupResult,
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

const FACULTY_DEANS: Array<{
  faculty: FacultyName;
  dean: string;
  email: string;
  code: string;
}> = [
  {
    faculty: 'Faculty of Engineering and Technology',
    dean: 'Prof. Dr. Md. Anwar Hossain',
    email: 'dean.et@pust.ac.bd',
    code: 'FET · 7 Departments',
  },
  {
    faculty: 'Faculty of Science',
    dean: 'Prof. Dr. Md. Shamim Reza',
    email: 'dean.s@pust.ac.bd',
    code: 'FS · 5 Departments',
  },
  {
    faculty: 'Faculty of Business Studies',
    dean: 'Prof. Dr. Md. Hasebur Rahman',
    email: 'dean.bs@pust.ac.bd',
    code: 'FBS · 2 Departments',
  },
  {
    faculty: 'Faculty of Humanities and Social Science',
    dean: 'Prof. Dr. Mir Humayun Kabir',
    email: 'dean.hss@pust.ac.bd',
    code: 'FHSS · 6 Departments',
  },
  {
    faculty: 'Faculty of Life and Earth Science',
    dean: 'Prof. Dr. Mohammad Najmul Islam',
    email: 'dean.les@pust.ac.bd',
    code: 'FLES · 1 Department',
  },
];

const NOTICE_FILTERS: Array<'All' | NoticeCategory> = [
  'All',
  'General',
  'Job & Tender',
  'Press Release',
  'NOC & Orders',
  'Result',
  'Admission',
  'Academic',
  'Examination',
  'Course',
];

interface DigitalFormDef {
  code: string;
  title: string;
  office: string;
  note: string;
  portalTarget: string;
  portalLabel: string;
  fields: string[];
}

const DOWNLOAD_FORMS: DigitalFormDef[] = [
  {
    code: 'PUST-REG-01',
    title: 'Admission Verification & Token Request Form',
    office: 'Office of the Registrar / Department Chairman',
    note: 'Digital token issuance and document verification handled inside Campus Portal.',
    portalTarget: '/portal',
    portalLabel: 'Activate via Portal Token',
    fields: [
      'Applicant Full Name (as per SSC/HSC)',
      'GST Unit & Admission Roll Number',
      'Department Allocated & Session',
      'Academic ID / Temporary Reference',
      'Digital Document Verification Packet Hash',
    ],
  },
  {
    code: 'PUST-LIB-02',
    title: 'Central Library Membership & Card Requisition Form',
    office: 'Department Chairman Seal + Central Library',
    note: 'Forwarded digitally with Chairman official seal and signature JSON.',
    portalTarget: '/portal?tab=library',
    portalLabel: 'Start Library Application',
    fields: [
      'Student Name & Academic ID',
      'Department Code & Academic Session',
      'Chairman Digital Seal JSON Endorsement',
      'Central Library Verification Officer',
      'Linked Digital / Physical Library Card Ref',
    ],
  },
  {
    code: 'PUST-HALL-03',
    title: 'Residential Hall Seat Application & Clearance Form',
    office: 'Provost Office (July 06 Hall & Dormitories)',
    note: 'Check vacancy circulars, hall dues, and clearance references in Campus Portal.',
    portalTarget: '/portal?tab=halls',
    portalLabel: 'Apply / Clear Hall Dues',
    fields: [
      'Student Name, Academic ID & Department',
      'Preferred Residential Hall (July 06 Hall / Dormitories)',
      'Permanent District & Residential Statement',
      'Hall Financial Receipt & Clearance Reference',
      'Provost / House Tutor Seat Allotment Endorsement',
    ],
  },
  {
    code: 'PUST-EX-04',
    title: 'Semester Examination Form Fill-up & Admit Card Application',
    office: 'Department Chairman & Controller of Examinations',
    note: 'Enforces automatic Hall clearance check and online payment receipt.',
    portalTarget: '/portal?tab=exams',
    portalLabel: 'Open Exam Form Fill-up',
    fields: [
      'Student Name, Academic ID & Semester',
      'Registered Course Codes & Credit Total',
      'Verified Hall Financial Clearance Status',
      'Digital Checkout Receipt (SSLCommerz / Bangla QR / MFS)',
      'Chairman Digital Admit Card Verification',
    ],
  },
  {
    code: 'PUST-CERT-05',
    title: 'Provisional / Temporary Certificate & 4-Office Clearance Form',
    office: 'Chairman, Hall, Library, Proctor & Admin Office',
    note: 'Track real-time 4-office clearances and download verified Temporary Certificate.',
    portalTarget: '/portal?tab=certificates',
    portalLabel: 'Start Certificate Clearance',
    fields: [
      'Graduating Student Name & Academic ID',
      '8-Semester Completion & Final CGPA Verification',
      'Certificate Fee Payment Receipt Reference',
      '4-Office Clearances (Chairman, Hall, Library, Proctor)',
      'Central Admin Certificate Serial & Public Verify Hash',
    ],
  },
];

const ACADEMIC_CALENDAR_2026 = [
  { term: 'Academic Session 2025–2026 (UG)', event: 'Orientation & Formal Class Commencement', date: '2026-07-15' },
  { term: 'Bi-Semester Teaching Period', event: 'Mid-Term Assessments & Course Add/Drop Window', date: '2026-09-20' },
  { term: 'Postgraduate & Exam Cycle', event: 'M.Sc. / M.Engg. Admissions (CSE/ICE) & Exam Form Fill-up', date: '2026-11-16' },
  { term: 'Semester-I Final Examinations', event: 'Term-End Final Examinations Across 21 Departments', date: '2026-12-06' },
  { term: 'Convocation Milestone', event: 'First University Convocation at Rajapur Campus', date: '2027-03-15' },
];

const UNIVERSITY_MILESTONES = [
  {
    year: '15 July 2001',
    title: 'University Act Enacted',
    detail: 'Parliament passes Pabna University of Science and Technology Act, 2001 (Act No. 43 of 2001).',
  },
  {
    year: '5 June 2008',
    title: 'Curriculum Inaugurated',
    detail: 'Academic program formally inaugurated alongside Government Gazette operationalization on 12 October 2008.',
  },
  {
    year: '2009',
    title: 'Inaugural 140 Students',
    detail: 'First academic batch enrolled across CSE, EEE, Mathematics, and Business Administration.',
  },
  {
    year: '2026',
    title: '5 Faculties · 21 Departments',
    detail: 'Nearly 5,000 scholars and 185 faculty members on the 30-acre Rajapur digital campus.',
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function downloadPrintableFormHtml(form: DigitalFormDef) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const rows = form.fields
    .map(
      (f) =>
        `<tr><th style="text-align:left;padding:10px 12px;border:1px solid #cbd5e1;background:#f8fafc;width:38%;font-size:12px;color:#334155;">${escapeHtml(
          f
        )}</th><td style="padding:14px 12px;border:1px solid #cbd5e1;font-size:13px;color:#64748b;">________________________________________________</td></tr>`
    )
    .join('');

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(form.code)} — ${escapeHtml(form.title)}</title>
</head>
<body style="font-family:sans-serif;background:#f7f7f5;padding:32px;color:#0f172a;">
  <div style="max-width:760px;margin:0 auto;background:#ffffff;border:2px solid #6A0000;padding:32px;">
    <div style="border-bottom:2px solid #e2e8f0;padding-bottom:14px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:flex-start;gap:16px;">
      <div style="display:flex;align-items:flex-start;gap:14px;">
        <img src="${origin}/assets/pust-logo.png" alt="PUST Official Logo" style="height:54px;width:auto;object-fit:contain;" />
        <div>
          <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#6A0000;font-weight:700;">Pabna University of Science and Technology</div>
          <h1 style="margin:6px 0 4px;font-size:21px;font-family:Georgia,serif;">${escapeHtml(form.title)}</h1>
          <p style="margin:0;font-size:12px;color:#475569;">Receiving Authority: ${escapeHtml(form.office)}</p>
        </div>
      </div>
      <div style="font-family:monospace;font-size:13px;font-weight:700;color:#6A0000;">${escapeHtml(form.code)}</div>
    </div>
    <table style="width:100%;border-collapse:collapse;">
      ${rows}
    </table>
    <div style="margin-top:28px;display:flex;justify-content:space-between;font-size:12px;color:#334155;">
      <div>Applicant Signature &amp; Date: _______________________</div>
      <div>Endorsing Authority Seal: _______________________</div>
    </div>
    <p style="margin-top:20px;font-size:11px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:12px;text-align:justify;">Note: ${escapeHtml(
      form.note
    )} Digital submission is recommended via the PUST Campus Portal.</p>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${form.code}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

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
  onNavigate: (route: AppRoute | string) => void;
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

function getCategoryForNoticeRoute(route: AppRoute): 'All' | NoticeCategory {
  if (route === '/notices/general') return 'General';
  if (route === '/notices/job') return 'Job & Tender';
  if (route === '/notices/press-release') return 'Press Release';
  if (route === '/notices/noc') return 'NOC & Orders';
  if (route === '/notices/result') return 'Result';
  return 'All';
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
  const [selectedNoticeCat, setSelectedNoticeCat] = useState<'All' | NoticeCategory>(() =>
    getCategoryForNoticeRoute(route)
  );
  const [noticeBoardScope, setNoticeBoardScope] = useState<'all' | 'central' | 'department'>('all');
  const [noticeQuery, setNoticeQuery] = useState('');
  const [galleryCategory, setGalleryCategory] =
    useState<'All' | GalleryItemRecord['category']>('All');
  const [activeMedia, setActiveMedia] = useState<GalleryItemRecord | null>(null);
  const [previewForm, setPreviewForm] = useState<DigitalFormDef | null>(null);

  useEffect(() => {
    setSelectedNoticeCat(getCategoryForNoticeRoute(route));
  }, [route]);

  useEffect(() => {
    if (!activeMedia && !previewForm) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setActiveMedia(null);
        setPreviewForm(null);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [activeMedia, previewForm]);

  const [inqName, setInqName] = useState('');
  const [inqEmail, setInqEmail] = useState('');
  const [inqPhone, setInqPhone] = useState('');
  const [inqProgram, setInqProgram] =
    useState<InquiryRecord['programLevel']>('Undergraduate (GST)');
  const [inqDept, setInqDept] = useState('CSE');
  const [inqMessage, setInqMessage] = useState('');
  const [inqSubmitting, setInqSubmitting] = useState(false);
  const [inqSuccess, setInqSuccess] = useState<{ referenceCode: string; email: string } | null>(null);
  const [inqError, setInqError] = useState<string | null>(null);

  // Public Status Tracker on Admissions
  const [statusQuery, setStatusQuery] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusResult, setStatusResult] = useState<PublicStatusLookupResult | null>(null);

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
      setInqSuccess({
        referenceCode: inquiry.referenceCode || inquiry.id,
        email: inquiry.email,
      });
      setStatusQuery(inquiry.referenceCode || inquiry.id);
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

  async function handleCheckStatus(e: FormEvent, overrideQuery?: string) {
    e.preventDefault();
    const q = (overrideQuery ?? statusQuery).trim();
    if (!q) return;
    setStatusLoading(true);
    setStatusError(null);
    try {
      const res = await pustApi.checkPublicStatus(q);
      setStatusResult(res.result);
    } catch (err) {
      setStatusResult(null);
      setStatusError(
        err instanceof Error ? err.message : 'No inquiry or pending portal account found.'
      );
    } finally {
      setStatusLoading(false);
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
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-12">
          <div className="border-b border-slate-200 pb-6 space-y-4">
            <p className="font-mono text-xs uppercase tracking-widest text-pust-800">
              About Pabna University of Science &amp; Technology
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-medium text-slate-900">
              {activeSection?.title || 'Our University'}
            </h1>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Our University', route: '/about/our-university' as AppRoute },
                { label: 'Mission & Vision', route: '/about/mission-vision' as AppRoute },
                { label: 'History and Plans', route: '/about/history' as AppRoute },
              ].map((tab) => (
                <Link
                  key={tab.route}
                  href={tab.route}
                  className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    route === tab.route || (route === '/about' && tab.route === '/about/our-university')
                      ? 'bg-pust-900 text-white'
                      : 'bg-[#F7F7F5] border border-slate-200 text-slate-700 hover:border-pust-700/50 hover:text-pust-900'
                  }`}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-7 space-y-6">
              {activeSlug === 'mission-vision' && activeSection?.body ? (
                <div className="space-y-6">
                  {(() => {
                    const parts = activeSection.body.split(/\n\s*Our Vision\s*\n/i);
                    const missionPart = (parts[0] || '').replace(/^Our Mission\s*\n/i, '').trim();
                    const visionPart = (parts[1] || '').trim();
                    const missionLines = missionPart
                      .split('\n')
                      .map((l) => l.trim())
                      .filter(Boolean);
                    const introLines = missionLines.filter((l) => !l.startsWith('•'));
                    const bulletLines = missionLines
                      .filter((l) => l.startsWith('•'))
                      .map((l) => l.replace(/^•\s*/, ''));

                    return (
                      <>
                        <div className="space-y-3">
                          <h2 className="font-serif text-2xl font-medium text-slate-900">
                            Our Mission
                          </h2>
                          {introLines.map((line, i) => (
                            <p key={i} className="text-base leading-[1.8] text-slate-700">
                              {line}
                            </p>
                          ))}
                          {bulletLines.length > 0 && (
                            <ul className="list-disc pl-5 space-y-2.5 text-base leading-[1.75] text-slate-700 pt-1">
                              {bulletLines.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          )}
                        </div>

                        {visionPart && (
                          <div className="pt-5 border-t border-slate-200 space-y-3">
                            <h2 className="font-serif text-2xl font-medium text-slate-900">
                              Our Vision
                            </h2>
                            <blockquote className="rounded-xl border border-pust-200 bg-pust-50/50 p-5 font-serif text-lg italic leading-relaxed text-slate-900">
                              {visionPart}
                            </blockquote>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              ) : (
                <p className="text-base leading-[1.8] text-slate-700 whitespace-pre-line first-letter:font-serif first-letter:text-5xl first-letter:font-medium first-letter:float-left first-letter:mr-3 first-letter:leading-[0.86] first-letter:text-pust-800">
                  {activeSection?.body}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                {aboutSections.map((sec) => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => onNavigate(`/about/${sec.slug}` as AppRoute)}
                    className={`text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                      sec.slug === activeSlug
                        ? 'border-pust-800 bg-pust-50/50'
                        : 'border-slate-200 bg-[#F7F7F5] hover:border-pust-700/50'
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
              <dl className="rounded-xl border border-slate-200 bg-[#F7F7F5] divide-y divide-slate-200 text-sm overflow-hidden">
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
                  <dd className="font-mono font-semibold text-pust-800">
                    {profile?.convocationDate ?? '15 March 2027'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Institutional Chronological Milestones */}
          <div className="pt-8 border-t border-slate-200 space-y-4">
            <p className="font-mono text-xs uppercase tracking-widest text-pust-800">
              Institutional Chronology
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-px rounded-2xl border border-slate-200 bg-slate-200 overflow-hidden">
              {UNIVERSITY_MILESTONES.map((m) => (
                <div key={m.year} className="p-5 space-y-1.5 bg-[#F7F7F5]">
                  <p className="font-mono text-xs font-semibold text-pust-800 tabular-nums">
                    {m.year}
                  </p>
                  <h2 className="font-serif text-base font-medium text-slate-900">{m.title}</h2>
                  <p className="text-xs text-slate-600 leading-relaxed">{m.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    );
  }

  // 2. ACADEMIC PAGES (/academics/*)
  if (route.startsWith('/academics')) {
    const academicSubTabs: Array<{ label: string; route: AppRoute }> = [
      { label: 'Academic Programs', route: '/academics/programs' },
      { label: 'Faculty', route: '/academics/faculty' },
      { label: 'Departments', route: '/academics/departments' },
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
            <p className="font-mono text-xs uppercase tracking-widest text-pust-800">
              Academic Affairs &amp; Research
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-medium text-slate-900">
              {academicSubTabs.find((t) => t.route === route)?.label || 'Academic Directory'}
            </h1>
            <div className="flex flex-wrap gap-2">
              {academicSubTabs.map((tab) => (
                <Link
                  key={tab.route}
                  href={tab.route}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    route === tab.route ||
                    (route === '/academics' && tab.route === '/academics/departments')
                      ? 'bg-pust-900 text-white'
                      : 'bg-[#F7F7F5] border border-slate-200 text-slate-700 hover:border-pust-700/50 hover:text-pust-900'
                  }`}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
          </div>

          {route === '/academics/programs' ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {DEGREE_PROGRAMS.map((prog) => (
                  <div
                    key={prog.level}
                    className="p-6 rounded-2xl border border-slate-200 bg-[#F7F7F5] space-y-3"
                  >
                    <p className="font-mono text-xs uppercase tracking-wider text-pust-800">
                      {prog.duration}
                    </p>
                    <h2 className="font-serif text-2xl font-medium text-slate-900">{prog.level}</h2>
                    <p className="text-sm font-medium text-slate-800">{prog.degrees}</p>
                    <dl className="pt-3 border-t border-slate-200 space-y-1.5 text-xs">
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
              <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-xl border border-slate-200 bg-white">
                <p className="text-sm text-slate-700">
                  All degree programs operate under the Outcome-Based Education (OBE) framework and
                  4.00 grading ordinance.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => onNavigate('/governance/academic-ordinance')}
                    className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 text-slate-800 hover:border-pust-800 hover:text-pust-900 cursor-pointer"
                  >
                    Academic Ordinance
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('/academics/departments')}
                    className="px-4 py-2 text-xs font-medium rounded-lg bg-pust-900 text-white hover:bg-pust-950 cursor-pointer"
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
                  <div
                    key={fac.faculty}
                    className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs"
                  >
                    <div className="px-6 py-4 bg-[#F7F7F5] border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <p className="font-mono text-xs text-pust-800">{fac.code}</p>
                        <h2 className="font-serif text-2xl font-medium text-slate-900">
                          {fac.faculty}
                        </h2>
                      </div>
                      <p className="text-xs text-slate-600">
                        Dean: <span className="font-medium text-slate-900">{fac.dean}</span> ·{' '}
                        <span className="font-mono text-pust-800">{fac.email}</span>
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-200">
                      {facDepts.map((dept) => (
                        <button
                          key={dept.id}
                          type="button"
                          onClick={() => onSelectDepartment(dept)}
                          className="text-left p-5 bg-white hover:bg-pust-50/40 transition-colors space-y-1.5 cursor-pointer"
                        >
                          <p className="font-mono text-xs text-pust-800 tabular-nums">
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
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-[#F7F7F5] border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-wider text-pust-800">
                    100% Paperless &amp; Printable Forms Hub
                  </p>
                  <p className="text-sm text-slate-700 mt-1">
                    Preview official HTML printable copies or launch the live digital submission
                    workflow directly inside the PUST Campus Portal.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('/verify')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-800 hover:border-pust-800 hover:text-pust-900 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Verify Issued Documents
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="rounded-2xl divide-y divide-slate-200 border border-slate-200 overflow-hidden bg-white shadow-xs">
                {DOWNLOAD_FORMS.map((form) => (
                  <div
                    key={form.code}
                    className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-[#F7F7F5]/60 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="font-mono text-xs text-pust-800 font-semibold">{form.code}</p>
                      <h2 className="font-serif text-lg font-medium text-slate-900">{form.title}</h2>
                      <p className="text-xs text-slate-600">
                        {form.office} — {form.note}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewForm(form)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-800 hover:border-pust-800 hover:text-pust-900 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Preview &amp; Print
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadPrintableFormHtml(form)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-800 hover:border-pust-800 hover:text-pust-900 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        HTML Copy
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigate(form.portalTarget)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-pust-900 text-white hover:bg-pust-950 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {form.portalLabel}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : route === '/academics/calendar' ? (
            <div className="rounded-2xl divide-y divide-slate-200 border border-slate-200 bg-white overflow-hidden shadow-xs">
              {ACADEMIC_CALENDAR_2026.map((row) => (
                <div
                  key={row.event}
                  className="p-5 grid grid-cols-1 sm:grid-cols-12 gap-3 items-baseline"
                >
                  <p className="sm:col-span-3 font-mono text-xs text-pust-800 tabular-nums">
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
                <div key={s.title} className="p-6 rounded-2xl border border-slate-200 bg-[#F7F7F5] space-y-2">
                  <h2 className="font-serif text-xl font-medium text-slate-900">{s.title}</h2>
                  <p className="text-sm text-slate-600 leading-relaxed">{s.detail}</p>
                </div>
              ))}
            </div>
          ) : route === '/academics/seminars' ? (
            <div className="rounded-2xl divide-y divide-slate-200 border border-slate-200 bg-white overflow-hidden">
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
                  <p className="font-mono text-xs text-pust-800 tabular-nums">
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
                  email: 'dean.et@pust.ac.bd',
                  depts: 'CSE, EEE, EECE, ICE, Civil Engineering, Architecture, URP',
                },
                {
                  faculty: 'Faculty of Science',
                  dean: 'Prof. Dr. Md. Shamim Reza',
                  email: 'dean.s@pust.ac.bd',
                  depts: 'Mathematics, Physics, Pharmacy, Chemistry, Statistics and Data Science',
                },
                {
                  faculty: 'Faculty of Business Studies',
                  dean: 'Prof. Dr. Md. Hasebur Rahman',
                  email: 'dean.bs@pust.ac.bd',
                  depts: 'Business Administration, Tourism & Hospitality Management',
                },
                {
                  faculty: 'Faculty of Humanities and Social Science',
                  dean: 'Prof. Dr. Mir Humayun Kabir',
                  email: 'dean.hss@pust.ac.bd',
                  depts: 'Economics, Bangla, Social Work, English, Public Administration, History',
                },
                {
                  faculty: 'Faculty of Life and Earth Science',
                  dean: 'Prof. Dr. Mohammad Najmul Islam',
                  email: 'dean.les@pust.ac.bd',
                  depts: 'Geography and Environment',
                },
              ].map((d) => (
                <div key={d.faculty} className="p-6 rounded-2xl border border-slate-200 bg-[#F7F7F5] space-y-1.5">
                  <p className="font-mono text-xs uppercase tracking-wider text-pust-800">
                    {d.faculty}
                  </p>
                  <h2 className="font-serif text-xl font-medium text-slate-900">{d.dean}</h2>
                  <p className="font-mono text-xs text-pust-800">{d.email}</p>
                  <p className="text-xs text-slate-600 pt-1">Departments: {d.depts}</p>
                </div>
              ))}
            </div>
          ) : route === '/academics/chairmen' ? (
            <div className="rounded-2xl divide-y divide-slate-200 border border-slate-200 bg-white overflow-hidden">
              {departments.map((d) => (
                <div
                  key={d.id}
                  className="p-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <p className="font-mono text-xs text-pust-800">
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
              focus={route === '/academics/journals' ? 'journals' : 'publications'}
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
                      className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        selectedFaculty === tab.value
                          ? 'bg-pust-900 text-white'
                          : 'bg-[#F7F7F5] border border-slate-200 text-slate-700 hover:text-pust-900 hover:border-pust-700/50'
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
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-300 bg-[#F7F7F5] focus:outline-none focus:border-pust-700 focus:bg-white"
                  />
                </div>
              </div>

              {loadingData ? (
                <CardsGridSkeleton count={6} />
              ) : dataError ? (
                <div className="p-6 rounded-xl border border-red-200 bg-red-50 text-sm text-red-800">
                  {dataError}
                </div>
              ) : filteredDepartments.length === 0 ? (
                <div className="p-10 rounded-2xl border border-slate-200 bg-[#F7F7F5] text-center space-y-3">
                  <p className="text-sm text-slate-700">
                    No academic departments match your current search or faculty filter.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFaculty('All');
                      setDeptQuery('');
                    }}
                    className="px-4 py-2 text-xs font-medium rounded-lg bg-pust-900 text-white cursor-pointer"
                  >
                    Reset Department Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredDepartments.map((dept) => (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => onSelectDepartment(dept)}
                      className="text-left rounded-2xl border border-slate-200 bg-white shadow-xs hover:shadow-md hover:border-pust-700/60 transition-all flex flex-col justify-between overflow-hidden group cursor-pointer"
                    >
                      <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                        <div>
                          <p className="font-mono text-xs text-pust-800 tabular-nums">
                            {dept.code} · Est. {dept.established} · {dept.intakeSeats} Seats
                          </p>
                          <h2 className="font-serif text-xl font-medium text-slate-900 mt-2 group-hover:text-pust-900">
                            {dept.name}
                          </h2>
                          <p className="text-xs text-slate-500 mt-1">Chair: {dept.chairmanName}</p>
                          <p className="text-sm text-slate-700 mt-3 leading-relaxed line-clamp-2">
                            {dept.summary}
                          </p>
                        </div>
                        <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
                          <span>{dept.degrees.join(' / ')}</span>
                          <span className="font-semibold text-pust-800 group-hover:underline">
                            Prospectus
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Interactive Printable Form Preview Modal */}
        {previewForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-[2px] p-4 overflow-y-auto print:static print:bg-white print:p-0"
            onClick={() => setPreviewForm(null)}
          >
            <div
              className="print-only-document w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden my-auto print:rounded-none print:shadow-none print:border-2 print:border-pust-900"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="print:hidden px-6 py-3.5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs font-semibold text-pust-900">
                  Template Preview · {previewForm.code}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Template
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadPrintableFormHtml(previewForm)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-pust-900 text-white hover:bg-pust-950 cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    Download HTML
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewForm(null)}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-900 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-5">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                  <div className="flex items-start gap-3">
                    <PustCrest size={42} className="shrink-0" />
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-wider text-pust-800">
                        Pabna University of Science and Technology
                      </p>
                      <h3 className="font-serif text-xl font-medium text-slate-900 mt-0.5">
                        {previewForm.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Receiving Authority: {previewForm.office}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-semibold text-pust-900 shrink-0">
                    {previewForm.code}
                  </span>
                </div>

                <div className="rounded-xl border border-slate-200 divide-y divide-slate-200 text-xs">
                  {previewForm.fields.map((field) => (
                    <div key={field} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="font-medium text-slate-700">{field}</span>
                      <span className="font-mono text-slate-400">
                        [ Submitted via Portal or Handwritten ]
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                  <span>{previewForm.note}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const target = previewForm.portalTarget;
                      setPreviewForm(null);
                      onNavigate(target);
                    }}
                    className="print:hidden inline-flex items-center gap-1.5 px-4 py-2 font-semibold rounded-lg bg-pust-900 text-white hover:bg-pust-950 cursor-pointer"
                  >
                    {previewForm.portalLabel}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  // 3. ADMISSIONS PAGES (/admissions/*)
  if (route.startsWith('/admissions')) {
    const admissionTabs: Array<{ label: string; route: AppRoute }> = [
      { label: 'Undergraduate', route: '/admissions/undergraduate' },
      { label: 'Graduate', route: '/admissions/graduate' },
      { label: 'Evening Programs', route: '/admissions/evening-programs' },
      { label: 'Admission Notice', route: '/admissions/notice' },
    ];
    const admissionNotices = notices.filter((n) => n.category === 'Admission');

    return (
      <main className="flex-1 bg-[#F7F7F5]">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-10">
          <div className="border-b border-slate-200 pb-6 space-y-4">
            <p className="font-mono text-xs uppercase tracking-widest text-pust-800">
              Admissions 2026–2027
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-medium text-slate-900">
              {admissionTabs.find((t) => t.route === route)?.label || 'Admissions'}
            </h1>
            <div className="flex flex-wrap gap-2">
              {admissionTabs.map((t) => (
                <Link
                  key={t.route}
                  href={t.route}
                  className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    route === t.route ||
                    (route === '/admissions' && t.route === '/admissions/undergraduate')
                      ? 'bg-pust-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-pust-700/50 hover:text-pust-900'
                  }`}
                >
                  {t.label}
                </Link>
              ))}
            </div>
          </div>

          {route === '/admissions/notice' ? (
            <div className="rounded-2xl divide-y divide-slate-200 border border-slate-200 bg-white overflow-hidden shadow-xs">
              {admissionNotices.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => onSelectNotice(n)}
                  className="w-full text-left p-5 hover:bg-pust-50/35 cursor-pointer space-y-1"
                >
                  <p className="font-mono text-xs text-pust-800 tabular-nums">
                    {n.publishedAt} · {n.referenceNo}
                  </p>
                  <h2 className="font-serif text-lg font-medium text-slate-900">{n.title}</h2>
                  <p className="text-sm text-slate-600">{n.summary}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-3 rounded-2xl border border-slate-200 bg-white divide-y md:divide-y-0 md:divide-x divide-slate-200 overflow-hidden shadow-xs">
                <div className="p-6 space-y-1.5">
                  <p className="font-mono text-xs text-pust-800">GST UNIT A · SCIENCE &amp; ENGG.</p>
                  <p className="font-serif text-lg font-medium text-slate-900">13 Departments</p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    CSE, EEE, EECE, ICE, CE, Architecture (with drawing test), URP, Mathematics,
                    Physics, Pharmacy, Chemistry, Statistics &amp; Data Science, Geography &amp;
                    Environment.
                  </p>
                </div>
                <div className="p-6 space-y-1.5">
                  <p className="font-mono text-xs text-pust-800">GST UNIT B · HUMANITIES</p>
                  <p className="font-serif text-lg font-medium text-slate-900">6 Departments</p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Economics (Math eligibility), Bangla, Social Work, English (min. 20% English
                    score), Public Administration (min. 20% English score), and History.
                  </p>
                </div>
                <div className="p-6 space-y-1.5">
                  <p className="font-mono text-xs text-pust-800">GST UNIT C · BUSINESS</p>
                  <p className="font-serif text-lg font-medium text-slate-900">2 Departments</p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Business Administration (BBA) &amp; Tourism and Hospitality Management (THM).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-5 space-y-6">
                  <p className="text-[15px] text-slate-700 leading-relaxed">
                    {route === '/admissions/graduate'
                      ? 'Graduate programs (M.Sc. Engg., M.Engg., M.Sc., M.Pharm., M.B.A., M.A., M.S.S.) and M.Phil./Ph.D. admissions are coordinated departmentally (e.g., CSE & ICE postgraduate cohorts) under Academic Council rules.'
                      : route === '/admissions/evening-programs'
                      ? 'Evening professional tracks including Executive MBA (EMBA) and Applied Engineering postgraduate cohorts offer weekend and evening schedules for working professionals.'
                      : 'Undergraduate admissions into all 21 departments follow the centralized Bangladesh GST Integrated Admission Test (Units A, B, and C)—PUST holds no separate university test, aside from Architecture aptitude drawing evaluation.'}
                  </p>

                  <dl className="rounded-xl divide-y divide-slate-200 border border-slate-200 text-sm bg-white px-5 overflow-hidden">
                    <div className="py-3.5 flex justify-between gap-4">
                      <dt className="text-slate-600">Total Undergraduate Intake</dt>
                      <dd className="font-mono tabular-nums font-medium text-slate-900">
                        830+ – 920 Seats / Session
                      </dd>
                    </div>
                    <div className="py-3.5 flex justify-between gap-4">
                      <dt className="text-slate-600">Admitted Student Signup</dt>
                      <dd className="text-right font-medium text-pust-800">
                        Via Dept. Portal Token
                      </dd>
                    </div>
                    <div className="py-3.5 flex justify-between gap-4">
                      <dt className="text-slate-600">Registrar Admissions Desk</dt>
                      <dd className="font-mono text-pust-800">registrar@pust.ac.bd</dd>
                    </div>
                  </dl>

                  <button
                    type="button"
                    onClick={() => onNavigate('/portal')}
                    className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium rounded-lg border border-pust-800 text-pust-800 bg-white hover:bg-pust-900 hover:text-white transition-colors cursor-pointer"
                  >
                    Have a Student Signup Token? Register in Portal
                  </button>

                  {/* Pre-Login Public Inquiry & Account Application Status Tracker */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-xs">
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-wider text-pust-800">
                        Live Status Tracker
                      </p>
                      <h2 className="font-serif text-lg font-medium text-slate-900 mt-0.5">
                        Track Inquiry or Pending Portal Account
                      </h2>
                      <p className="text-xs text-slate-600 mt-1">
                        Enter your inquiry reference (e.g. PUST-INQ-2026-101) or registered institutional email.
                      </p>
                    </div>

                    <form onSubmit={(e) => handleCheckStatus(e)} className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={statusQuery}
                        onChange={(e) => setStatusQuery(e.target.value)}
                        placeholder="PUST-INQ-2026-101 or email"
                        className="flex-1 min-w-0 px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-700 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={statusLoading}
                        className="px-3.5 py-2 text-xs font-medium rounded-lg bg-pust-900 text-white hover:bg-pust-950 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
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
                      <div className="p-4 rounded-xl border border-slate-200 bg-[#F7F7F5] space-y-2 text-xs">
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
                        <p className="font-medium text-slate-900">{statusResult.title}</p>
                        {statusResult.note && (
                          <p className="text-slate-700 bg-white border border-slate-200 rounded-lg p-2.5">
                            {statusResult.note}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
                  <h2 className="font-serif text-2xl font-medium text-slate-900">
                    Submit an Admission Inquiry
                  </h2>
                  <p className="text-sm text-slate-600 mt-1 mb-6">
                    Prospective applicants and guardians may send questions directly to the PUST
                    Admissions Desk and receive a tracked reference number.
                  </p>

                  {inqError && (
                    <div className="mb-5 p-3.5 rounded-lg border border-red-200 bg-red-50 text-sm text-red-900">
                      {inqError}
                    </div>
                  )}
                  {inqSuccess && (
                    <div className="mb-5 p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-sm text-emerald-950 space-y-1">
                      <div className="flex items-center gap-2 font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>
                          Inquiry recorded under tracking ID{' '}
                          <span className="font-mono">{inqSuccess.referenceCode}</span>
                        </span>
                      </div>
                      <p className="text-xs text-pust-800 pl-6">
                        Confirmation queued for {inqSuccess.email}. Use the tracker on the left any
                        time to read the Registrar’s official reply.
                      </p>
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
                          className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-[#F7F7F5] focus:outline-none focus:border-pust-700 focus:bg-white"
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
                          className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-[#F7F7F5] focus:outline-none focus:border-pust-700 focus:bg-white"
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
                          className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-[#F7F7F5] focus:outline-none focus:border-pust-700 focus:bg-white"
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
                          className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-[#F7F7F5] focus:outline-none focus:border-pust-700 focus:bg-white"
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
                          className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-[#F7F7F5] focus:outline-none focus:border-pust-700 focus:bg-white"
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
                        className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-[#F7F7F5] focus:outline-none focus:border-pust-700 focus:bg-white"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={inqSubmitting}
                      className="px-6 py-2.5 text-sm font-medium rounded-lg bg-pust-900 text-white hover:bg-pust-950 disabled:opacity-60 transition-colors cursor-pointer"
                    >
                      {inqSubmitting ? 'Submitting Inquiry...' : 'Send Admission Inquiry'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </section>
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
      portalRoute: string;
      highlights: string[];
    }> = [
      {
        label: 'Library',
        route: '/facilities/library',
        title: 'Central Library & Information Center (CLIC)',
        body: 'Managed by Additional Librarian Md. Hafizur Rahaman Mollah (clic@pust.ac.bd), the Central Library houses academic and reference books across all 5 faculties plus registered campus-IP access to IEEE Xplore, SpringerLink, and ACM Digital Library. Students apply in the Campus Portal with Department Chairman digital seal JSON for Digital and Physical Library Cards.',
        img: LIBRARY_IMAGE,
        hours: 'Sun–Thu · 08:30–21:00 BST',
        location: 'Central Library Complex · clic@pust.ac.bd',
        portalRoute: '/portal?tab=library',
        highlights: [
          'Chairman-sealed digital membership approval workflow',
          'Linked Digital & Physical Library Card ID issuance',
          'Faculty-wise textbook stacks, thesis archive & e-journals',
        ],
      },
      {
        label: 'Transport',
        route: '/facilities/transport',
        title: 'University Transportation Pool',
        body: 'Administered by Dr. Mir Humayun Kabir (transport@pust.ac.bd, +8802588845650), the Transportation Pool operates university-owned and contracted buses connecting Rajapur Campus with Pabna Town, Central Terminal, Edward College, and highway corridors for students, faculty, and officers.',
        img: GROUNDS_IMAGE,
        hours: 'Sun–Thu · 07:15–18:30 BST',
        location: 'Transport Pool · +8802588845650 · transport@pust.ac.bd',
        portalRoute: '/portal',
        highlights: [
          'Dedicated student, teacher & officer shuttle schedules',
          'Pabna Town, Terminal, Edward College & Highway corridors',
          'Convocation & semester examination special bus dispatch',
        ],
      },
      {
        label: 'Residence',
        route: '/facilities/residence',
        title: 'Residential Halls (July 06, Swadhinota, Matribhasha & Ganatantra)',
        body: 'PUST provides campus residential accommodation including July 06 Hall / Male Hall-1 (Provost: Md. Al-Fahad Bhuiyan), Swadhinota Hall / Male Hall-2 (Provost: Dr. Md. Kamruzzaman), Matribhasha Hall / Female Hall-1 (Provost: Dr. Rebeka Sultana Rekha), and Ganatantra Hall / Female Hall-2 (Provost: Laila Arzumand Banu). Vacancy circulars, seat history, and Hall Financial Clearances are fully online.',
        img: GROUNDS_IMAGE,
        hours: '24/7 Provost & House Tutor Duty',
        location: 'North Residential Precinct, Rajapur',
        portalRoute: '/portal?tab=halls',
        highlights: [
          'July 06 Hall, Swadhinota Hall, Matribhasha Hall & Ganatantra Hall',
          'Full retained seat allotment & change history per student ID',
          'Mandatory Hall dues clearance synced directly with Exam Portal',
        ],
      },
      {
        label: 'Medical',
        route: '/facilities/medical',
        title: 'PUST Medical Section & Health Center',
        body: 'Staffed by Deputy Chief Medical Officers Dr. Md. Rafiqul Islam and Dr. Nasrin Sultana (medicalsection@pust.ac.bd, +8802588844975), the PUST Medical Center provides primary healthcare, outpatient consultations, essential medications, and 24/7 ambulance referral for residential students, faculty, and staff.',
        img: LAB_IMAGE,
        hours: 'Outpatient Sun–Thu · 24/7 Ambulance',
        location: 'Medical Center · +8802588844975 · medicalsection@pust.ac.bd',
        portalRoute: '/portal',
        highlights: [
          'Deputy Chief Medical Officers & campus nursing unit',
          'Free primary consultation, first aid & dispensary services',
          '24/7 emergency ambulance referral to Pabna General Hospital',
        ],
      },
      {
        label: 'ICT Sheba',
        route: '/facilities/ict-sheba',
        title: 'ICT Cell & ICT Sheba Portal',
        body: 'Directed by Dr. Md. Abdur Rahim (ictdirector@pust.ac.bd), the ICT Cell maintains PUST’s campus fiber-optic backbone, high-speed Wi-Fi across academic & residential wings, institutional @pust.ac.bd accounts, and automated portal clearance infrastructure.',
        img: LAB_IMAGE,
        hours: 'Sun–Thu · 09:00–17:00 BST',
        location: 'ICT Cell Wing · ictdirector@pust.ac.bd',
        portalRoute: '/portal',
        highlights: [
          'University-wide fiber backbone & campus Wi-Fi network',
          'Institutional @pust.ac.bd account & signup token provisioning',
          'Digital admit card & 4-office certificate workflow support',
        ],
      },
    ];

    const currentFac = facTabs.find((f) => f.route === route) || facTabs[0];

    return (
      <main className="flex-1 bg-white">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-10">
          <div className="border-b border-slate-200 pb-6 space-y-4">
            <p className="font-mono text-xs uppercase tracking-widest text-pust-800">
              Campus Facilities &amp; Student Services
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-medium text-slate-900">
              {currentFac.title}
            </h1>
            <div className="flex flex-wrap gap-2">
              {facTabs.map((f) => (
                <Link
                  key={f.route}
                  href={f.route}
                  className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    currentFac.route === f.route
                      ? 'bg-pust-900 text-white'
                      : 'bg-[#F7F7F5] border border-slate-200 text-slate-700 hover:border-pust-700/50 hover:text-pust-900'
                  }`}
                >
                  {f.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-6 space-y-6">
              <p className="text-base leading-relaxed text-slate-700">{currentFac.body}</p>

              <dl className="rounded-xl border border-slate-200 bg-[#F7F7F5] divide-y divide-slate-200 text-sm overflow-hidden">
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
                <p className="font-mono text-xs uppercase tracking-wider text-pust-800">
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
                onClick={() => onNavigate(currentFac.portalRoute)}
                className="px-5 py-2.5 text-sm font-medium rounded-lg bg-pust-900 text-white hover:bg-pust-950 transition-colors cursor-pointer"
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
              <p className="font-mono text-xs uppercase tracking-widest text-pust-800">
                University Media Archive
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl font-medium text-slate-900 mt-1">
                Campus Photos &amp; Videos Gallery
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              {cats.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setGalleryCategory(c)}
                  className={`px-3.5 py-2 text-xs font-medium rounded-lg cursor-pointer transition-colors ${
                    galleryCategory === c
                      ? 'bg-pust-900 text-white'
                      : 'bg-[#F7F7F5] border border-slate-200 text-slate-700 hover:border-pust-700/50 hover:text-pust-900'
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
                className="text-left rounded-2xl border border-slate-200 bg-[#F7F7F5] hover:border-pust-700/60 transition-colors group cursor-pointer flex flex-col overflow-hidden shadow-xs"
              >
                <div className="relative aspect-[4/3] bg-slate-900 overflow-hidden w-full">
                  <ResilientImage
                    src={item.mediaUrl}
                    alt={item.title}
                    containerClassName="w-full h-full"
                    className="w-full h-full object-cover"
                  />
                  {item.mediaType === 'video' && (
                    <span className="absolute inset-0 flex items-center justify-center bg-slate-950/35 text-white">
                      <PlayCircle className="w-10 h-10" />
                    </span>
                  )}
                </div>
                <div className="p-5 space-y-1">
                  <p className="font-mono text-xs text-pust-800 tabular-nums">
                    {item.category} · {item.mediaType.toUpperCase()} · {item.eventDate}
                  </p>
                  <h2 className="font-serif text-lg font-medium text-slate-900 group-hover:text-pust-900">
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-[2px] p-4"
            onClick={() => setActiveMedia(null)}
          >
            <div
              className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200 bg-[#F7F7F5]">
                <div>
                  <p className="font-mono text-xs text-pust-800">
                    {activeMedia.category} · {activeMedia.mediaType.toUpperCase()}
                  </p>
                  <h3 className="font-serif text-xl font-medium text-slate-900">
                    {activeMedia.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMedia(null)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-900 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
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

  // 6. NOTICES PAGES (/notices & /notices/*)
  const noticeSubTabs: Array<{ label: string; route: AppRoute }> = [
    { label: 'All Notices', route: '/notices' },
    { label: 'General Notice', route: '/notices/general' },
    { label: 'Job Notice', route: '/notices/job' },
    { label: 'Press Release', route: '/notices/press-release' },
    { label: 'NOC', route: '/notices/noc' },
    { label: 'Result Notice', route: '/notices/result' },
  ];
  const activeNoticeHeading =
    noticeSubTabs.find((t) => t.route === route && route !== '/notices')?.label ||
    'University Notice Board';

  return (
    <main className="flex-1 bg-[#F7F7F5]">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="space-y-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-pust-800">
                Central &amp; Department Circulars
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl font-medium text-slate-900 mt-2">
                {activeNoticeHeading}
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              {noticeSubTabs.map((tab) => (
                <Link
                  key={tab.route}
                  href={tab.route}
                  className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    route === tab.route
                      ? 'bg-pust-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-pust-700/50 hover:text-pust-900'
                  }`}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="relative w-full lg:w-72 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={noticeQuery}
              onChange={(e) => setNoticeQuery(e.target.value)}
              placeholder="Search circulars or memo no."
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-pust-700"
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
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedNoticeCat === cat
                    ? 'bg-pust-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:border-pust-700/50 hover:text-pust-900'
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
                className={`px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer ${
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
          <div className="py-10 px-6 text-sm text-slate-600 bg-white rounded-2xl border border-slate-200 mt-6 text-center space-y-3">
            <p>No notices match the selected filter criteria.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedNoticeCat('All');
                setNoticeBoardScope('all');
                setNoticeQuery('');
              }}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-pust-900 text-white cursor-pointer"
            >
              Reset Notice Filters
            </button>
          </div>
        ) : (
          <div className="rounded-2xl divide-y divide-slate-200 border border-slate-200 bg-white mt-6 overflow-hidden shadow-xs">
            {filteredNotices.map((notice) => (
              <button
                key={notice.id}
                type="button"
                onClick={() => onSelectNotice(notice)}
                className="w-full text-left px-5 sm:px-6 py-5 hover:bg-pust-50/35 transition-colors grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-6 items-baseline group cursor-pointer"
              >
                <div className="lg:col-span-3 font-mono text-xs text-slate-500 tabular-nums">
                  <span>{notice.publishedAt}</span>
                  <span className="mx-2">·</span>
                  <span className="font-semibold text-pust-800">{notice.category}</span>
                </div>

                <div className="lg:col-span-7">
                  <h2 className="font-serif text-lg font-medium text-slate-900 group-hover:text-pust-900 transition-colors">
                    {notice.title}
                  </h2>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">{notice.summary}</p>
                </div>

                <div className="lg:col-span-2 lg:text-right font-mono text-xs text-slate-500 tabular-nums">
                  {notice.referenceNo}
                  {notice.visibility === 'registered' && (
                    <span className="block text-pust-800 font-semibold mt-0.5">
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
