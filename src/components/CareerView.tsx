'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  FileDown,
  FileText,
  Mail,
  Phone,
  Search,
} from 'lucide-react';
import { resolveUniversityContent } from '../lib/cmsDefaults';
import type { NoticeRecord } from '../types/pust';
import { EditTriggerButton } from './EditTriggerButton';
import { usePust } from './PustContext';
import { NoticeListSkeleton } from './PustSkeletons';

type CareerFilter = 'all' | 'recruitment' | 'tender';

const RECRUITMENT_TRACKS = [
  {
    code: 'Track 01 · Teaching & Research',
    title: 'Faculty Positions',
    body: 'Appointments for Lecturer, Assistant Professor, Associate Professor, and Professor across all 5 faculties and 21 departments in Engineering, Science, Business Studies, Humanities & Social Science, and Life & Earth Science, governed by PUST Act (2001) and UGC benchmarks.',
    qualification: 'Minimum 4-year Honours/Engineering degree & Master’s/Ph.D. per UGC schedule',
  },
  {
    code: 'Track 02 · Executive & Technical Cadre',
    title: 'Administrative & Technical Officers',
    body: 'Statutory and operational officer appointments covering Assistant Registrar, Section Officer, Accounts Officer, Assistant Engineer, ICT Network Programmer, Deputy Medical Officer, and Central Library specialists supporting digital governance.',
    qualification: 'Relevant Master’s / B.Sc. Engineering degree with prescribed experience',
  },
  {
    code: 'Track 03 · Laboratory & Campus Operations',
    title: 'Laboratory & Support Staff',
    body: 'Technical Assistants, Laboratory Attendants, Office Assistants, Computer Operators, Library Assistants, and Campus Maintenance personnel supporting academic laboratories, residential halls, and utility infrastructure across the 30-acre Rajapur campus.',
    qualification: 'Diploma / HSC / SSC technical trade certification per post circular',
  },
  {
    code: 'Track 04 · Sponsored Research',
    title: 'Research & Project Fellowships',
    body: 'Fixed-term Research Assistants, Project Associates, and Postdoctoral or Visiting Fellows engaged under RTTC, IQAC, and national science & technology grants across campus laboratories and interdisciplinary centers.',
    qualification: 'Postgraduate research credentials aligned with funded project scope',
  },
];

const RECRUITMENT_STEPS = [
  {
    step: '01',
    title: 'Review Circular & Prepare Application',
    detail:
      'Consult the official Registrar recruitment circular for post eligibility, pay grade, age limit, and required pay order / bank draft. Complete the prescribed Teacher or Officer & Staff application form.',
  },
  {
    step: '02',
    title: 'Scrutiny & Eligibility Verification',
    detail:
      'All submissions received by the Office of the Registrar are verified by departmental and administrative scrutiny committees against PUST statutes, academic transcripts, and publication records.',
  },
  {
    step: '03',
    title: 'Written Assessment, Lecture & Selection Board',
    detail:
      'Shortlisted applicants appear before the statutory Selection Board comprising the Vice-Chancellor, statutory members, and external subject specialists; faculty candidates also present a teaching demonstration.',
  },
  {
    step: '04',
    title: 'Regent Board Ratification & Joining',
    detail:
      'Selection Board recommendations are placed before the Regent Board for formal approval, followed by issuance of the official appointment letter and joining formalities at the Administrative Building.',
  },
];

function isTenderNotice(notice: NoticeRecord): boolean {
  const haystack = `${notice.title} ${notice.summary} ${notice.referenceNo}`.toLowerCase();
  return (
    haystack.includes('tender') ||
    haystack.includes('e-gp') ||
    haystack.includes('procurement') ||
    haystack.includes('eprocure')
  );
}

export function CareerView() {
  const { profile, notices, loadingData, dataError, retryLoad, setActiveNotice } = usePust();
  const [filter, setFilter] = useState<CareerFilter>('all');
  const [query, setQuery] = useState('');

  const resolved = resolveUniversityContent(profile);

  const careerNotices = useMemo(() => {
    const jobAndTender = notices.filter((n) => n.category === 'Job & Tender');
    const q = query.trim().toLowerCase();

    return jobAndTender.filter((notice) => {
      const tender = isTenderNotice(notice);
      if (filter === 'recruitment' && tender) return false;
      if (filter === 'tender' && !tender) return false;
      if (!q) return true;
      return `${notice.title} ${notice.summary} ${notice.referenceNo} ${notice.departmentCode}`
        .toLowerCase()
        .includes(q);
    });
  }, [notices, filter, query]);

  const recruitmentForms = useMemo(() => {
    const allForms = resolved.academicExtras.officialForms || [];
    const matched = allForms.filter((f) => {
      const lower = f.title.toLowerCase();
      return (
        lower.includes('job') ||
        lower.includes('recruitment') ||
        lower.includes('upgradation')
      );
    });
    return matched.length > 0 ? matched : allForms.slice(0, 3);
  }, [resolved.academicExtras.officialForms]);

  const registrarContact =
    resolved.footerConfig.contacts.find((c) => c.label.toLowerCase().includes('registrar')) ||
    resolved.footerConfig.contacts[0] || {
      label: 'Registrar',
      phone: '+8802588845193',
      email: 'registrar@pust.ac.bd',
    };

  return (
    <main className="flex-1 bg-[#F7F7F5]">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-12">
        {/* Page Header */}
        <div className="space-y-6 pb-8 border-b border-slate-200">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-3xl space-y-3">
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-pust-700">
                Human Resources &amp; Recruitment · Office of the Registrar
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-semibold text-slate-950 tracking-tight leading-tight">
                Career Opportunities at PUST
              </h1>
              <p className="prose-justify text-base text-slate-700 leading-relaxed">
                Pabna University of Science and Technology welcomes accomplished scholars,
                researchers, administrative officers, and technical specialists committed to
                advancing higher education and applied discovery across its{' '}
                {profile?.facultiesCount ?? 5} faculties and{' '}
                {profile?.departmentsCount ?? 21} academic departments in Rajapur, Pabna.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <span className="font-mono text-xs font-medium text-slate-600 tabular-nums">
                {careerNotices.length} active{' '}
                {careerNotices.length === 1 ? 'circular' : 'circulars'}
              </span>
              <EditTriggerButton
                target={{ kind: 'notice', notice: null }}
                label="Post Job Notice"
                icon="add"
                variant="compact"
              />
              <a
                href="#application-forms"
                className="h-10 inline-flex items-center justify-center gap-2 px-4 text-xs sm:text-sm font-semibold rounded-lg bg-pust-800 text-white hover:bg-pust-900 transition-colors whitespace-nowrap shrink-0"
              >
                <FileDown className="w-4 h-4" />
                Application Forms
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
              <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
                Appointing Authority
              </p>
              <p className="font-serif text-base font-semibold text-slate-950 mt-1">
                Office of the Registrar
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                Administrative Building, Rajapur Campus
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
              <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
                Compensation Framework
              </p>
              <p className="font-serif text-base font-semibold text-slate-950 mt-1">
                National Pay Scale &amp; UGC Statutes
              </p>
              <p className="text-xs text-slate-600 mt-0.5 tabular-nums">
                {profile?.facultyMembersCount ?? 212} faculty &amp; institutional staff
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
              <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
                Recruitment Inquiry Desk
              </p>
              <p className="font-mono text-sm font-semibold text-pust-800 mt-1">
                {registrarContact.email}
              </p>
              <p className="font-mono text-xs text-slate-600 mt-0.5 tabular-nums">
                {registrarContact.phone} · Sun–Thu 09:00–17:00
              </p>
            </div>
          </div>
        </div>

        {/* Active Job & Tender Circulars */}
        <section aria-labelledby="career-circulars-heading" className="space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-pust-700">
                Current Openings &amp; Announcements
              </p>
              <h2
                id="career-circulars-heading"
                className="font-serif text-2xl sm:text-3xl font-semibold text-slate-950 mt-1"
              >
                Active Recruitment &amp; Tender Circulars
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
              <div
                role="group"
                aria-label="Filter career circulars"
                className="inline-flex items-center p-1 rounded-xl bg-white border border-slate-200/90 shadow-2xs shrink-0"
              >
                {(
                  [
                    { id: 'all', label: 'All Notices' },
                    { id: 'recruitment', label: 'Faculty & Staff Jobs' },
                    { id: 'tender', label: 'Tenders & Works' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFilter(item.id)}
                    className={`h-8 inline-flex items-center justify-center px-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      filter === item.id
                        ? 'bg-pust-800 text-white shadow-xs'
                        : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64 shrink-0">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search post or memo no."
                  aria-label="Search career circulars"
                  className="w-full h-10 pl-10 pr-4 text-sm rounded-lg border border-slate-300 bg-white text-slate-950 focus:outline-none focus:border-pust-700"
                />
              </div>
            </div>
          </div>

          {loadingData && notices.length === 0 ? (
            <NoticeListSkeleton rows={3} />
          ) : dataError && notices.length === 0 ? (
            <div className="p-6 rounded-2xl border border-red-200 bg-red-50 space-y-3">
              <p className="text-sm text-red-800">{dataError}</p>
              <button
                type="button"
                onClick={() => void retryLoad()}
                className="h-9 inline-flex items-center justify-center px-4 text-xs font-semibold rounded-lg bg-pust-900 text-white hover:bg-pust-950 cursor-pointer"
              >
                Retry Loading
              </button>
            </div>
          ) : careerNotices.length === 0 ? (
            <div className="py-10 px-6 rounded-2xl border border-slate-200 bg-white text-center space-y-3">
              <p className="text-center text-sm text-slate-700">
                No recruitment or tender circulars match your current filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFilter('all');
                  setQuery('');
                }}
                className="h-9 inline-flex items-center justify-center px-4 text-xs font-semibold rounded-lg bg-pust-800 text-white hover:bg-pust-900 transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
              <div className="hidden lg:grid lg:grid-cols-12 lg:gap-6 px-6 py-3 bg-[#FAF8F4] border-b border-slate-200 font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-600 items-center">
                <div className="lg:col-span-2">Date &amp; Track</div>
                <div className="lg:col-span-7">Position / Circular Summary</div>
                <div className="lg:col-span-3 text-right">Memo Reference</div>
              </div>

              <div className="divide-y divide-slate-200">
                {careerNotices.map((notice) => {
                  const tender = isTenderNotice(notice);
                  return (
                    <div
                      key={notice.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setActiveNotice(notice)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setActiveNotice(notice);
                        }
                      }}
                      className="w-full text-left px-5 sm:px-6 py-5 hover:bg-pust-50/55 transition-colors grid grid-cols-1 lg:grid-cols-12 gap-y-3 lg:gap-x-6 items-start group cursor-pointer"
                    >
                      <div className="lg:col-span-2 flex flex-row lg:flex-col items-center lg:items-start justify-between lg:justify-start gap-2 lg:gap-1 pt-0.5 font-mono text-xs tabular-nums">
                        <span className="text-slate-600 font-medium whitespace-nowrap">
                          {notice.publishedAt}
                        </span>
                        <span className="font-semibold text-pust-700 uppercase tracking-wide text-[11px] leading-tight">
                          {tender ? 'Procurement / Tender' : 'Recruitment'}
                        </span>
                      </div>

                      <div className="lg:col-span-7 min-w-0">
                        <h3 className="font-serif text-lg font-semibold text-slate-950 group-hover:text-pust-800 transition-colors leading-snug">
                          {notice.title}
                        </h3>
                        <p className="prose-justify text-sm text-slate-700 mt-1.5 leading-relaxed">
                          {notice.summary}
                        </p>
                      </div>

                      <div className="lg:col-span-3 min-w-0 pt-3 border-t border-slate-100 lg:border-0 lg:pt-0.5 flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-2 font-mono text-xs tabular-nums">
                        <span className="font-medium text-slate-700 lg:text-right break-words">
                          {notice.referenceNo}
                        </span>
                        <div className="flex items-center gap-2.5 shrink-0">
                          <EditTriggerButton
                            target={{ kind: 'notice', notice }}
                            label="Edit"
                            variant="compact"
                          />
                          <span className="inline-flex items-center gap-1 font-sans text-xs font-semibold text-pust-800 group-hover:text-pust-950">
                            View Circular
                            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Link
              href="/notices/job"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-pust-800 hover:text-pust-950 hover:underline underline-offset-4"
            >
              Browse Job Notice Archive
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Appointment Tracks */}
        <section aria-labelledby="career-tracks-heading" className="space-y-6">
          <div className="pb-4 border-b border-slate-200">
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-lapis-700">
              University Appointment Categories
            </p>
            <h2
              id="career-tracks-heading"
              className="font-serif text-2xl sm:text-3xl font-semibold text-slate-950 mt-1"
            >
              Academic, Administrative &amp; Research Tracks
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {RECRUITMENT_TRACKS.map((track) => (
              <div
                key={track.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between gap-4 shadow-xs"
              >
                <div className="space-y-2.5">
                  <p className="font-mono text-xs font-semibold uppercase tracking-wider text-pust-700">
                    {track.code}
                  </p>
                  <h3 className="font-serif text-xl font-semibold text-slate-950">
                    {track.title}
                  </h3>
                  <p className="prose-justify text-sm text-slate-700 leading-relaxed">
                    {track.body}
                  </p>
                </div>
                <p className="pt-3 border-t border-slate-100 font-mono text-xs text-slate-600">
                  Baseline Criteria: {track.qualification}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Recruitment Process + Prescribed Application Forms */}
        <section
          id="application-forms"
          aria-labelledby="application-forms-heading"
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start scroll-mt-28"
        >
          <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 space-y-5 shadow-xs">
            <div className="pb-3 border-b border-slate-200">
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-pust-700">
                Statutory Procedure
              </p>
              <h2 className="font-serif text-2xl font-semibold text-slate-950 mt-1">
                Selection &amp; Appointment Workflow
              </h2>
            </div>

            <ol className="divide-y divide-slate-200">
              {RECRUITMENT_STEPS.map((item) => (
                <li key={item.step} className="py-4 first:pt-1 last:pb-1 flex items-start gap-4">
                  <span className="font-mono text-xs font-semibold text-pust-800 bg-pust-50 border border-pust-200 rounded-lg px-2.5 py-1.5 tabular-nums shrink-0 mt-0.5">
                    {item.step}
                  </span>
                  <div className="space-y-1 min-w-0">
                    <h3 className="font-serif text-base font-semibold text-slate-950">
                      {item.title}
                    </h3>
                    <p className="prose-justify text-sm text-slate-700 leading-relaxed">
                      {item.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 space-y-5 shadow-xs">
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-200">
              <div>
                <p className="font-mono text-xs font-semibold uppercase tracking-widest text-lapis-700">
                  Prescribed Formats
                </p>
                <h2
                  id="application-forms-heading"
                  className="font-serif text-2xl font-semibold text-slate-950 mt-1"
                >
                  Official Job Application Forms
                </h2>
              </div>
              <Link
                href="/academics/forms-download"
                className="text-xs font-semibold text-pust-800 hover:underline whitespace-nowrap shrink-0 mt-1"
              >
                All Forms
              </Link>
            </div>

            <p className="prose-justify text-sm text-slate-700 leading-relaxed">
              Applicants must use the prescribed PUST application dossier for faculty,
              upgradation, or officer/staff positions and submit required copies with attested
              certificates to the Office of the Registrar prior to the circular deadline.
            </p>

            <div className="divide-y divide-slate-200 border-y border-slate-200">
              {recruitmentForms.map((form) => (
                <div
                  key={`${form.serial}-${form.title}`}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
                      Form #{form.serial} · {form.category}
                    </p>
                    <h3 className="font-serif text-base font-semibold text-slate-950">
                      {form.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {form.pdfUrl && (
                      <a
                        href={form.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-9 inline-flex items-center gap-1.5 px-3 text-xs font-semibold rounded-lg bg-pust-800 text-white hover:bg-pust-900 transition-colors whitespace-nowrap"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        PDF
                      </a>
                    )}
                    {form.docUrl && (
                      <a
                        href={form.docUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-9 inline-flex items-center gap-1.5 px-3 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-800 hover:border-pust-700 hover:text-pust-900 transition-colors whitespace-nowrap"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        DOCX
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-[#FAF8F4] border border-slate-200 p-4 space-y-2">
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-700">
                Registrar Recruitment Contact
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700">
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-pust-800 shrink-0" />
                  Administrative Building, Rajapur, Pabna-6600
                </span>
                <a
                  href={`mailto:${registrarContact.email}`}
                  className="inline-flex items-center gap-1.5 font-mono text-pust-800 hover:underline"
                >
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  {registrarContact.email}
                </a>
                <a
                  href={`tel:${registrarContact.phone.replace(/\s+/g, '')}`}
                  className="inline-flex items-center gap-1.5 font-mono text-slate-800 hover:text-pust-800 tabular-nums"
                >
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  {registrarContact.phone}
                </a>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
