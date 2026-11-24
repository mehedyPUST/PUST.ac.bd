'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  Calculator,
  CalendarPlus,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  FileDown,
  FileText,
  Mail,
  Phone,
  PlayCircle,
  Printer,
  Search,
  X,
} from 'lucide-react';
import { pustApi } from '../lib/api';
import { downloadIcsCalendar } from '../lib/calendarExport';
import { resolveUniversityContent } from '../lib/cmsDefaults';
import {
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
  parseYouTubeVideoId,
} from '../lib/media';
import type { AppRoute } from '../lib/routes';
import { AcademicCalendarHighlights, AcademicCalendarView } from './AcademicCalendarView';
import { EditTriggerButton } from './EditTriggerButton';
import { GstEligibilityChecker } from './GstEligibilityChecker';
import { CardsGridSkeleton } from './PustSkeletons';
import { PustCrest } from './PustCrest';
import { ResearchSection } from './ResearchSection';
import { ResilientImage } from './ResilientImage';
import type {
  AboutContentRecord,
  DepartmentRecord,
  DigitalFormItem,
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function downloadPrintableFormHtml(
  form: DigitalFormItem,
  fieldValues: Record<string, string> = {}
) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const rows = form.fields
    .map((f) => {
      const entered = (fieldValues[f] || '').trim();
      const valueHtml = entered
        ? `<span style="color:#0f172a;font-weight:600;">${escapeHtml(entered)}</span>`
        : `<span style="color:#64748b;">________________________________________________</span>`;
      return `<tr><th style="text-align:left;padding:10px 12px;border:1px solid #cbd5e1;background:#f8fafc;width:38%;font-size:12px;color:#334155;">${escapeHtml(
        f
      )}</th><td style="padding:14px 12px;border:1px solid #cbd5e1;font-size:13px;">${valueHtml}</td></tr>`;
    })
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
  const resolved = resolveUniversityContent(profile);
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
  const [previewForm, setPreviewForm] = useState<DigitalFormItem | null>(null);
  const [formFieldValues, setFormFieldValues] = useState<Record<string, string>>({});
  const [chairmanFacultyFilter, setChairmanFacultyFilter] = useState<'All' | FacultyName>('All');
  const [chairmanQuery, setChairmanQuery] = useState<string>('');
  const [copiedContact, setCopiedContact] = useState<string | null>(null);

  async function handleCopyContact(val: string) {
    try {
      await navigator.clipboard.writeText(val);
      setCopiedContact(val);
      window.setTimeout(() => {
        setCopiedContact((prev) => (prev === val ? null : prev));
      }, 1800);
    } catch {
      // Clipboard unavailable
    }
  }

  function openFillableForm(form: DigitalFormItem) {
    setFormFieldValues({});
    setPreviewForm(form);
  }

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
            <div className="flex flex-wrap items-start justify-between gap-4">
              <h1 className="font-serif text-3xl sm:text-4xl font-medium text-slate-900">
                {activeSection?.title || 'Our University'}
              </h1>
              <EditTriggerButton
                target={{ kind: 'about', slug: activeSlug }}
                label="Edit Section"
              />
            </div>
            <div className="flex overflow-x-auto no-scrollbar sm:flex-wrap gap-2 -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
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
                src={resolved.aboutExtras.campusImage || GROUNDS_IMAGE}
                fallbackSrc={GROUNDS_IMAGE}
                alt="PUST Rajapur Campus"
                caption={resolved.aboutExtras.campusCaption}
                className="w-full aspect-[4/3] object-cover"
              />
              <dl className="rounded-xl border border-slate-200 bg-[#F7F7F5] divide-y divide-slate-200 text-sm overflow-hidden">
                <div className="px-4 py-3 flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                  <dt className="text-slate-600">Established</dt>
                  <dd className="font-mono font-medium sm:text-right">
                    {profile?.establishedYear ?? 2008} (Act No. 43 of 2001)
                  </dd>
                </div>
                <div className="px-4 py-3 flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                  <dt className="text-slate-600">Campus Area</dt>
                  <dd className="font-mono font-medium sm:text-right">
                    {profile?.campusAcres ?? 30} Acres · Rajapur, Pabna
                  </dd>
                </div>
                <div className="px-4 py-3 flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                  <dt className="text-slate-600">Faculties &amp; Departments</dt>
                  <dd className="font-mono font-medium sm:text-right">
                    {profile?.facultiesCount ?? 5} Faculties · {profile?.departmentsCount ?? 21}{' '}
                    Departments
                  </dd>
                </div>
                <div className="px-4 py-3 flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                  <dt className="text-slate-600">First Convocation</dt>
                  <dd className="font-mono font-semibold text-pust-800 sm:text-right">
                    {profile?.convocationDate ?? '15 March 2027'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Institutional Chronological Milestones */}
          <div className="editable-region pt-8 border-t border-slate-200 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-xs uppercase tracking-widest text-pust-800">
                Institutional Chronology
              </p>
              <EditTriggerButton
                target={{ kind: 'milestones' }}
                label="Edit Milestones & Photo"
                variant="compact"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-px rounded-2xl border border-slate-200 bg-slate-200 overflow-hidden">
              {resolved.aboutExtras.milestones.map((m, idx) => (
                <div key={`${m.year}-${idx}`} className="p-5 space-y-1.5 bg-[#F7F7F5]">
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
            <div className="flex overflow-x-auto no-scrollbar sm:flex-wrap gap-2 -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
              {academicSubTabs.map((tab) => (
                <Link
                  key={tab.route}
                  href={tab.route}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
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
            <div className="editable-region space-y-8">
              <div className="flex justify-end empty:hidden">
                <EditTriggerButton
                  target={{ kind: 'degree-programs' }}
                  label="Edit Programs"
                  variant="compact"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {resolved.academicExtras.degreePrograms.map((prog, idx) => (
                  <div
                    key={`${prog.level}-${idx}`}
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
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/governance/academic-ordinance#cgpa-calculator"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg border border-pust-800 text-pust-900 hover:bg-pust-50 transition-colors cursor-pointer"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    SGPA / CGPA Calculator
                  </Link>
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
            <div className="editable-region space-y-8">
              <div className="flex justify-end empty:hidden">
                <EditTriggerButton
                  target={{ kind: 'faculty-deans' }}
                  label="Edit Faculty Deans"
                  variant="compact"
                />
              </div>
              {resolved.academicExtras.facultyDeans.map((fac) => {
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
                        <a
                          href={`mailto:${fac.email}`}
                          className="font-mono text-pust-800 hover:underline"
                        >
                          {fac.email}
                        </a>
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-200">
                      {facDepts.map((dept) => (
                        <div
                          key={dept.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => onSelectDepartment(dept)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onSelectDepartment(dept);
                            }
                          }}
                          className="text-left p-5 bg-white hover:bg-pust-50/40 transition-colors space-y-1.5 cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-mono text-xs text-pust-800 tabular-nums">
                              {dept.code} · {dept.intakeSeats} Seats
                            </p>
                            <EditTriggerButton
                              target={{ kind: 'department', department: dept }}
                              label="Edit"
                              variant="compact"
                            />
                          </div>
                          <h3 className="font-serif text-lg font-medium text-slate-900">
                            {dept.name}
                          </h3>
                          <p className="text-xs text-slate-500">Chair: {dept.chairmanName}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : route === '/academics/forms-download' ? (
            <div className="editable-region space-y-5">
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
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <EditTriggerButton
                    target={{ kind: 'download-forms' }}
                    label="Edit Forms"
                    variant="compact"
                  />
                  <button
                    type="button"
                    onClick={() => onNavigate('/verify')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-800 hover:border-pust-800 hover:text-pust-900 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Verify Issued Documents
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="rounded-2xl divide-y divide-slate-200 border border-slate-200 overflow-hidden bg-white shadow-xs">
                {resolved.academicExtras.downloadForms.map((form) => (
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
                        onClick={() => openFillableForm(form)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-800 hover:border-pust-800 hover:text-pust-900 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Fill &amp; Print Form
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadPrintableFormHtml(form)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-800 hover:border-pust-800 hover:text-pust-900 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        Blank HTML
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
            <AcademicCalendarView items={resolved.academicExtras.academicCalendar} />
          ) : route === '/academics/scholarship' ? (
            <div className="editable-region space-y-4">
              <div className="flex justify-end empty:hidden">
                <EditTriggerButton
                  target={{ kind: 'scholarships' }}
                  label="Edit Scholarships"
                  variant="compact"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {resolved.academicExtras.scholarships.map((s, idx) => (
                  <div
                    key={`${s.title}-${idx}`}
                    className="p-6 rounded-2xl border border-slate-200 bg-[#F7F7F5] space-y-2"
                  >
                    <h2 className="font-serif text-xl font-medium text-slate-900">{s.title}</h2>
                    <p className="text-sm text-slate-600 leading-relaxed">{s.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : route === '/academics/seminars' ? (
            <div className="editable-region space-y-4">
              <div className="flex flex-wrap items-center justify-end gap-2">
                <EditTriggerButton
                  target={{ kind: 'seminars' }}
                  label="Edit Seminars"
                  variant="compact"
                />
                <button
                  type="button"
                  onClick={() =>
                    downloadIcsCalendar(
                      resolved.upcomingSeminars.map((sem) => ({
                        uid: `pust-sem-${sem.id}`,
                        title: sem.title,
                        date: sem.date,
                        description: `Organized by ${sem.organizer}`,
                      })),
                      'PUST-Seminars-Workshops.ics'
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-pust-900 text-white hover:bg-pust-950 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  Export Seminars (.ics)
                </button>
              </div>
              <div className="rounded-2xl divide-y divide-slate-200 border border-slate-200 bg-white overflow-hidden">
                {resolved.upcomingSeminars.map((sem) => (
                  <div
                    key={sem.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <p className="font-mono text-xs text-pust-800 tabular-nums">
                        {sem.date} · {sem.organizer}
                      </p>
                      <h2 className="font-serif text-lg font-medium text-slate-900">{sem.title}</h2>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        downloadIcsCalendar(
                          [
                            {
                              uid: `pust-sem-${sem.id}`,
                              title: sem.title,
                              date: sem.date,
                              description: `Organized by ${sem.organizer}`,
                            },
                          ],
                          `PUST-Seminar-${sem.date}.ics`
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-[#F7F7F5] text-slate-700 hover:border-pust-800 hover:text-pust-900 whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-center"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                      Add (.ics)
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : route === '/academics/deans' ? (
            <div className="editable-region space-y-4">
              <div className="flex justify-end empty:hidden">
                <EditTriggerButton
                  target={{ kind: 'faculty-deans' }}
                  label="Edit Deans"
                  variant="compact"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {resolved.academicExtras.facultyDeans.map((d) => {
                  const isCopied = copiedContact === d.email;
                  return (
                    <div
                      key={d.faculty}
                      className="p-6 rounded-2xl border border-slate-200 bg-[#F7F7F5] space-y-2"
                    >
                      <p className="font-mono text-xs uppercase tracking-wider text-pust-800">
                        {d.faculty}
                      </p>
                      <h2 className="font-serif text-xl font-medium text-slate-900">{d.dean}</h2>
                      <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
                        <a
                          href={`mailto:${d.email}`}
                          className="inline-flex items-center gap-1.5 font-mono text-xs text-pust-800 hover:underline"
                        >
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                          {d.email}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopyContact(d.email)}
                          aria-label={`Copy ${d.email}`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-slate-200 bg-white text-[11px] font-medium text-slate-700 hover:border-pust-800 hover:text-pust-900 cursor-pointer"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-700" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-slate-600 pt-1">Departments: {d.depts}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : route === '/academics/chairmen' ? (
            (() => {
              const qChair = chairmanQuery.trim().toLowerCase();
              const visibleChairmen = departments.filter((d) => {
                const matchesFac =
                  chairmanFacultyFilter === 'All' || d.faculty === chairmanFacultyFilter;
                const matchesQ =
                  !qChair ||
                  d.name.toLowerCase().includes(qChair) ||
                  d.code.toLowerCase().includes(qChair) ||
                  d.chairmanName.toLowerCase().includes(qChair) ||
                  d.faculty.toLowerCase().includes(qChair);
                return matchesFac && matchesQ;
              });

              return (
                <div className="editable-region space-y-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-1.5">
                      {FACULTY_FILTERS.map((tab) => (
                        <button
                          key={tab.value}
                          type="button"
                          onClick={() => setChairmanFacultyFilter(tab.value)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            chairmanFacultyFilter === tab.value
                              ? 'bg-pust-900 text-white'
                              : 'bg-[#F7F7F5] border border-slate-200 text-slate-700 hover:text-pust-900 hover:border-pust-700/50'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                      <EditTriggerButton
                        target={{ kind: 'department', department: null }}
                        label="Add Department"
                        icon="add"
                        variant="compact"
                      />
                      <div className="relative w-full sm:w-64">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="search"
                          value={chairmanQuery}
                          onChange={(e) => setChairmanQuery(e.target.value)}
                          placeholder="Search chairman or dept..."
                          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-700 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {visibleChairmen.length === 0 ? (
                    <div className="p-8 rounded-2xl border border-slate-200 bg-[#F7F7F5] text-center space-y-2">
                      <p className="text-sm text-slate-600">
                        No department chairman matched your filter.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setChairmanFacultyFilter('All');
                          setChairmanQuery('');
                        }}
                        className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-pust-900 text-white cursor-pointer"
                      >
                        Reset Filter
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-2xl divide-y divide-slate-200 border border-slate-200 bg-white overflow-hidden">
                      {visibleChairmen.map((d) => (
                        <div
                          key={d.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => onSelectDepartment(d)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onSelectDepartment(d);
                            }
                          }}
                          className="p-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-pust-50/40 transition-colors cursor-pointer group"
                        >
                          <div>
                            <p className="font-mono text-xs text-pust-800">
                              {d.code} · {d.faculty}
                            </p>
                            <p className="font-serif text-lg font-medium text-slate-900 group-hover:text-pust-900">
                              Department of {d.name}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <p className="text-sm font-medium text-slate-800">{d.chairmanName}</p>
                            <span className="text-xs font-semibold text-pust-800 group-hover:underline whitespace-nowrap">
                              Prospectus →
                            </span>
                            <EditTriggerButton
                              target={{ kind: 'department', department: d }}
                              label="Edit"
                              variant="compact"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()
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
            <div className="editable-region space-y-6">
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

                <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                  <EditTriggerButton
                    target={{ kind: 'department', department: null }}
                    label="Add Department"
                    icon="add"
                    variant="compact"
                  />
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
                    <div
                      key={dept.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => onSelectDepartment(dept)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectDepartment(dept);
                        }
                      }}
                      className="text-left rounded-2xl border border-slate-200 bg-white shadow-xs hover:shadow-md hover:border-pust-700/60 transition-all flex flex-col justify-between overflow-hidden group cursor-pointer"
                    >
                      <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-mono text-xs text-pust-800 tabular-nums">
                              {dept.code} · Est. {dept.established} · {dept.intakeSeats} Seats
                            </p>
                            <EditTriggerButton
                              target={{ kind: 'department', department: dept }}
                              label="Edit"
                              variant="compact"
                            />
                          </div>
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
                    </div>
                  ))}
                </div>
              )}

              <AcademicCalendarHighlights items={resolved.academicExtras.academicCalendar} />
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
                  Fillable Form Studio · {previewForm.code}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {Object.values(formFieldValues).some((v) => v.trim() !== '') && (
                    <button
                      type="button"
                      onClick={() => setFormFieldValues({})}
                      className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Clear Fields
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Filled Form
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadPrintableFormHtml(previewForm, formFieldValues)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-pust-900 text-white hover:bg-pust-950 cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    Download Filled HTML
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
                  {previewForm.fields.map((field) => {
                    const val = formFieldValues[field] || '';
                    return (
                      <div
                        key={field}
                        className="px-4 py-3 grid grid-cols-1 sm:grid-cols-12 sm:items-center gap-2"
                      >
                        <label
                          htmlFor={`form-field-${field}`}
                          className="sm:col-span-5 font-medium text-slate-700"
                        >
                          {field}
                        </label>
                        <div className="sm:col-span-7">
                          <input
                            id={`form-field-${field}`}
                            type="text"
                            value={val}
                            onChange={(e) =>
                              setFormFieldValues((prev) => ({
                                ...prev,
                                [field]: e.target.value,
                              }))
                            }
                            placeholder="Type value to populate print/HTML..."
                            className="print:hidden w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:border-pust-700 focus:outline-none"
                          />
                          <span className="hidden print:inline font-mono text-slate-900">
                            {val.trim() || '________________________________________'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-xs uppercase tracking-widest text-pust-800">
                {resolved.admissionsConfig.kicker}
              </p>
              <EditTriggerButton
                target={{ kind: 'admissions-info' }}
                label="Edit Admissions Info"
                variant="compact"
              />
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-medium text-slate-900">
              {admissionTabs.find((t) => t.route === route)?.label || 'Admissions'}
            </h1>
            <div className="flex overflow-x-auto no-scrollbar sm:flex-wrap gap-2 -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
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
            <div className="space-y-4">
              <div className="flex justify-end empty:hidden">
                <EditTriggerButton
                  target={{ kind: 'notice', notice: null }}
                  label="Add Admission Notice"
                  icon="add"
                  variant="compact"
                />
              </div>
              <div className="rounded-2xl divide-y divide-slate-200 border border-slate-200 bg-white overflow-hidden shadow-xs">
                {admissionNotices.map((n) => (
                  <div
                    key={n.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectNotice(n)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectNotice(n);
                      }
                    }}
                    className="w-full text-left p-5 hover:bg-pust-50/35 cursor-pointer space-y-1"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-mono text-xs text-pust-800 tabular-nums">
                        {n.publishedAt} · {n.referenceNo}
                      </p>
                      <EditTriggerButton
                        target={{ kind: 'notice', notice: n }}
                        label="Edit"
                        variant="compact"
                      />
                    </div>
                    <h2 className="font-serif text-lg font-medium text-slate-900">{n.title}</h2>
                    <p className="text-sm text-slate-600">{n.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="editable-region space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-3 rounded-2xl border border-slate-200 bg-white divide-y md:divide-y-0 md:divide-x divide-slate-200 overflow-hidden shadow-xs">
                {resolved.admissionsConfig.gstUnits.map((unit, idx) => (
                  <div key={`${unit.unitLabel}-${idx}`} className="p-6 space-y-1.5">
                    <p className="font-mono text-xs text-pust-800">{unit.unitLabel}</p>
                    <p className="font-serif text-lg font-medium text-slate-900">
                      {unit.deptCountLabel}
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {unit.departmentsText}
                    </p>
                  </div>
                ))}
              </div>

              <GstEligibilityChecker
                departments={departments}
                onSelectDepartment={onSelectDepartment}
                onPrefillInquiry={(deptCode, message) => {
                  setInqProgram('Undergraduate (GST)');
                  setInqDept(deptCode);
                  setInqMessage(message);
                  if (typeof document !== 'undefined') {
                    document
                      .getElementById('admission-inquiry-form')
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
              />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-5 space-y-6">
                  <p className="text-[15px] text-slate-700 leading-relaxed">
                    {route === '/admissions/graduate'
                      ? resolved.admissionsConfig.gradText
                      : route === '/admissions/evening-programs'
                      ? resolved.admissionsConfig.eveningText
                      : resolved.admissionsConfig.undergradText}
                  </p>

                  <dl className="rounded-xl divide-y divide-slate-200 border border-slate-200 text-sm bg-white px-5 overflow-hidden">
                    <div className="py-3.5 flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                      <dt className="text-slate-600">Total Undergraduate Intake</dt>
                      <dd className="font-mono tabular-nums font-medium text-slate-900 sm:text-right">
                        {resolved.admissionsConfig.totalIntakeLabel}
                      </dd>
                    </div>
                    <div className="py-3.5 flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                      <dt className="text-slate-600">Admitted Student Signup</dt>
                      <dd className="sm:text-right font-medium text-pust-800">
                        {resolved.admissionsConfig.signupMethodLabel}
                      </dd>
                    </div>
                    <div className="py-3.5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4">
                      <dt className="text-slate-600">Registrar Admissions Desk</dt>
                      <dd className="flex flex-wrap items-center gap-2 font-mono text-pust-800 min-w-0">
                        <a
                          href={`mailto:${resolved.admissionsConfig.deskEmail}`}
                          className="hover:underline break-all"
                        >
                          {resolved.admissionsConfig.deskEmail}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopyContact(resolved.admissionsConfig.deskEmail)}
                          aria-label={`Copy ${resolved.admissionsConfig.deskEmail}`}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-200 bg-[#F7F7F5] text-[10px] font-sans font-medium text-slate-700 hover:border-pust-800 cursor-pointer shrink-0"
                        >
                          {copiedContact === resolved.admissionsConfig.deskEmail ? (
                            <Check className="w-3 h-3 text-emerald-700" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </dd>
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

                    <form onSubmit={(e) => handleCheckStatus(e)} className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        required
                        value={statusQuery}
                        onChange={(e) => setStatusQuery(e.target.value)}
                        placeholder="PUST-INQ-2026-101 or email"
                        className="flex-1 min-w-0 px-3 py-2.5 text-xs font-mono rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-700 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={statusLoading}
                        className="min-h-[40px] px-4 py-2 text-xs font-medium rounded-lg bg-pust-900 text-white hover:bg-pust-950 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
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

                <div
                  id="admission-inquiry-form"
                  className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs scroll-mt-28"
                >
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
    const facTabs = resolved.facilitiesConfig;
    const currentFac = facTabs.find((f) => f.route === route) || facTabs[0];

    return (
      <main className="flex-1 bg-white">
        <section className="editable-region max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-10">
          <div className="border-b border-slate-200 pb-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-xs uppercase tracking-widest text-pust-800">
                Campus Facilities &amp; Student Services
              </p>
              <EditTriggerButton
                target={{ kind: 'facility', route: currentFac.route }}
                label="Edit Facility Page"
                variant="compact"
              />
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-medium text-slate-900">
              {currentFac.title}
            </h1>
            <div className="flex overflow-x-auto no-scrollbar sm:flex-wrap gap-2 -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
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
                <div className="px-4 py-3 flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                  <dt className="text-slate-600">Service Hours</dt>
                  <dd className="font-mono font-medium text-slate-900 sm:text-right">{currentFac.hours}</dd>
                </div>
                <div className="px-4 py-3 flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                  <dt className="text-slate-600">Location</dt>
                  <dd className="font-medium text-slate-900 sm:text-right">{currentFac.location}</dd>
                </div>
              </dl>

              <div className="space-y-2">
                <p className="font-mono text-xs uppercase tracking-wider text-pust-800">
                  Key Capabilities
                </p>
                <ul className="space-y-2 text-sm text-slate-700 list-disc pl-5">
                  {currentFac.highlights.map((h, idx) => (
                    <li key={`${h}-${idx}`}>{h}</li>
                  ))}
                </ul>
              </div>

              {(() => {
                const emailMatch = `${currentFac.location} ${currentFac.body}`.match(
                  /[a-zA-Z0-9._%+-]+@pust\.ac\.bd/
                );
                const phoneMatch = `${currentFac.location} ${currentFac.body}`.match(
                  /\+880\d{7,11}/
                );
                return (
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onNavigate(currentFac.portalRoute)}
                      className="px-5 py-2.5 text-sm font-medium rounded-lg bg-pust-900 text-white hover:bg-pust-950 transition-colors cursor-pointer"
                    >
                      Access Service in Campus Portal
                    </button>
                    {emailMatch && (
                      <a
                        href={`mailto:${emailMatch[0]}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-mono font-medium rounded-lg border border-slate-300 bg-[#F7F7F5] text-pust-900 hover:border-pust-800"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        {emailMatch[0]}
                      </a>
                    )}
                    {phoneMatch && (
                      <a
                        href={`tel:${phoneMatch[0]}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-mono font-medium rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-800 hover:border-pust-800"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {phoneMatch[0]}
                      </a>
                    )}
                  </div>
                );
              })()}
            </div>
            <div className="lg:col-span-6">
              <ResilientImage
                src={currentFac.img}
                fallbackSrc={GROUNDS_IMAGE}
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
            <div className="flex flex-wrap items-center gap-2">
              <EditTriggerButton
                target={{ kind: 'gallery', item: null }}
                label="Add Media"
                icon="add"
                variant="compact"
              />
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
            {items.map((item) => {
              const ytId = item.mediaType === 'video' ? parseYouTubeVideoId(item.mediaUrl) : null;
              const thumbUrl = ytId ? getYouTubeThumbnailUrl(ytId) : item.mediaUrl;
              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveMedia(item)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveMedia(item);
                    }
                  }}
                  className="text-left rounded-2xl border border-slate-200 bg-[#F7F7F5] hover:border-pust-700/60 transition-colors group cursor-pointer flex flex-col overflow-hidden shadow-xs"
                >
                  <div className="relative aspect-[4/3] bg-slate-900 overflow-hidden w-full">
                    <ResilientImage
                      src={thumbUrl}
                      fallbackSrc="/src/assets/images/pust_campus_hero_1795431408503.jpg"
                      alt={item.title}
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover"
                    />
                    {item.mediaType === 'video' && (
                      <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/35 text-white">
                        <PlayCircle className="w-10 h-10" />
                      </span>
                    )}
                    <EditTriggerButton
                      target={{ kind: 'gallery', item }}
                      label="Edit"
                      variant="overlay"
                      className="absolute top-2.5 right-2.5 z-10"
                    />
                  </div>
                  <div className="p-5 space-y-1">
                    <p className="font-mono text-xs text-pust-800 tabular-nums">
                      {item.category} · {ytId ? 'YOUTUBE' : item.mediaType.toUpperCase()} ·{' '}
                      {item.eventDate}
                      {item.visibility === 'registered' && (
                        <span className="text-amber-800 font-semibold"> · MEMBERS ONLY</span>
                      )}
                    </p>
                    <h2 className="font-serif text-lg font-medium text-slate-900 group-hover:text-pust-900">
                      {item.title}
                    </h2>
                    <p className="text-xs text-slate-600">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {activeMedia && (() => {
          const activeYtId =
            activeMedia.mediaType === 'video' ? parseYouTubeVideoId(activeMedia.mediaUrl) : null;
          return (
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
                      {activeMedia.category} ·{' '}
                      {activeYtId ? 'YOUTUBE' : activeMedia.mediaType.toUpperCase()} ·{' '}
                      {activeMedia.eventDate}
                      {activeMedia.visibility === 'registered' ? ' · REGISTERED MEMBERS ONLY' : ''}
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
                  {activeYtId ? (
                    <iframe
                      src={getYouTubeEmbedUrl(activeYtId)}
                      title={activeMedia.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full aspect-video rounded-xl border border-slate-200 bg-black"
                    />
                  ) : activeMedia.mediaUrl.endsWith('.mp4') ||
                    activeMedia.mediaUrl.endsWith('.webm') ? (
                    <video
                      src={activeMedia.mediaUrl}
                      controls
                      className="w-full aspect-video rounded-xl bg-black"
                    />
                  ) : (
                    <ResilientImage
                      src={activeMedia.mediaUrl}
                      alt={activeMedia.title}
                      className="w-full aspect-video object-cover"
                    />
                  )}
                  <p className="text-sm text-slate-700">{activeMedia.description}</p>
                </div>
              </div>
            </div>
          );
        })()}
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
            <div className="flex overflow-x-auto no-scrollbar sm:flex-wrap gap-2 -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
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

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto shrink-0">
            <EditTriggerButton
              target={{ kind: 'notice', notice: null }}
              label="New Notice"
              icon="add"
              variant="compact"
            />
            <div className="relative w-full sm:w-72 shrink-0">
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
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-3 py-5 border-b border-slate-200">
          <div className="flex overflow-x-auto no-scrollbar sm:flex-wrap gap-1.5 pb-1 sm:pb-0">
            {NOTICE_FILTERS.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedNoticeCat(cat)}
                className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
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
              <div
                key={notice.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectNotice(notice)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectNotice(notice);
                  }
                }}
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

                <div className="lg:col-span-2 lg:text-right font-mono text-xs text-slate-500 tabular-nums flex lg:flex-col items-center lg:items-end justify-between gap-2">
                  <div>
                    {notice.referenceNo}
                    {notice.visibility === 'registered' && (
                      <span className="block text-pust-800 font-semibold mt-0.5">
                        Registered Only
                      </span>
                    )}
                  </div>
                  <EditTriggerButton
                    target={{ kind: 'notice', notice }}
                    label="Edit"
                    variant="compact"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
