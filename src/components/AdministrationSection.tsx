'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Copy,
  Mail,
  Phone,
  Search,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { resolveUniversityContent } from '../lib/cmsDefaults';
import type { AppRoute } from '../lib/routes';
import { AdministrationOfficeDossier, AllOfficesDirectory } from './AdministrationOfficeDossier';
import { AdministrationSidebar } from './AdministrationSidebar';
import { EditTriggerButton } from './EditTriggerButton';
import { SubPagePanel } from './MotionPrimitives';
import { usePust } from './PustContext';
import { PageHeaderAndSectionSkeleton } from './PustSkeletons';
import { ResilientImage } from './ResilientImage';
import type {
  AdministrativeUnit,
  UniversityProfile,
  ViceChancellorRecord,
} from '../types/pust';

interface AdministrationSectionProps {
  route: AppRoute;
  profile: UniversityProfile | null;
  vcProfiles: ViceChancellorRecord[];
  onNavigate: (route: AppRoute | string) => void;
}

type UnitFilter =
  | 'All'
  | 'Statutory Governance'
  | 'Administrative Office'
  | 'Specialized Cell & Institute';

const UNIT_TABS: UnitFilter[] = [
  'All',
  'Statutory Governance',
  'Administrative Office',
  'Specialized Cell & Institute',
];

interface OfficeMeta {
  route: AppRoute;
  label: string;
  highlight: string;
  summary: string;
  matchLeadership?: (role: string) => boolean;
  matchUnit?: (code: string) => boolean;
}

const OFFICE_SUBROUTES: OfficeMeta[] = [
  {
    route: '/administration/vc-office',
    label: 'VC Office',
    highlight: 'Office of the Vice-Chancellor',
    summary:
      'Executive head of the university, Chair of the Regent Board and Academic Council, directing institutional strategy and research expansion.',
    matchLeadership: (role) => role === 'Vice-Chancellor',
  },
  {
    route: '/administration/pro-vc-office',
    label: 'Pro-VC Office',
    highlight: 'Office of the Pro Vice-Chancellor',
    summary:
      'Coordinates academic governance, faculty development, Outcome-Based Education (OBE) schedules, and inter-faculty coordination.',
    matchLeadership: (role) => role === 'Pro-Vice-Chancellor',
  },
  {
    route: '/administration/treasurer-office',
    label: 'Treasurer',
    highlight: 'Office of the Treasurer',
    summary:
      'Oversees annual UGC grants, university budgets, transparent procurement, financial disbursements, and digital revenue accounting.',
    matchLeadership: (role) => role === 'Treasurer',
    matchUnit: (code) => code === 'FINANCE',
  },
  {
    route: '/administration/registrar-office',
    label: 'Registrar',
    highlight: 'Office of the Registrar',
    summary:
      'Custodian of university statutes, official circulars, Regent Board records, faculty appointments, and institutional administration.',
    matchLeadership: (role) => role === 'Registrar',
  },
  {
    route: '/administration/proctor-office',
    label: 'Proctor',
    highlight: "Proctor's Office",
    summary:
      'Maintains campus discipline, student safety, residential conduct, and digital clearance verification across the 30-acre campus.',
    matchLeadership: (role) => role === 'Proctor',
    matchUnit: (code) => code === 'PROCTOR',
  },
  {
    route: '/administration/student-advisor-office',
    label: 'Student Advisor',
    highlight: 'Directorate of Student Welfare & Guidance',
    summary:
      'Supports scholarships, cultural and technical clubs, student counseling, and campus co-curricular life.',
    matchLeadership: (role) => role.includes('Student Advisor'),
    matchUnit: (code) => code === 'DSW',
  },
  {
    route: '/administration/ict-cell',
    label: 'ICT Cell',
    highlight: 'ICT Cell & Digital Services',
    summary:
      'Operates campus fiber connectivity, institutional @pust.ac.bd email systems, digital student portals, and ICT Sheba services.',
    matchLeadership: (role) => role.includes('ICT Cell'),
    matchUnit: (code) => code === 'ICT',
  },
  {
    route: '/administration/all-office',
    label: 'All 33 Offices',
    highlight: 'All University Offices & Units',
    summary:
      'Complete directory of PUST administrative offices, medical & transport wings, statutory bodies, and specialized cells.',
  },
  {
    route: '/administration/apa',
    label: 'APA',
    highlight: 'Annual Performance Agreement (APA)',
    summary:
      'Public accountability milestones under UGC Citizen’s Charter, National Integrity Strategy (NIS), and e-Governance compliance.',
    matchUnit: (code) => code === 'APA',
  },
];

function sanitizeTel(phone: string): string {
  const digits = phone.replace(/[^+\d]/g, '');
  return digits || phone;
}

function matchLeadershipToOfficeRoute(role: string): string | null {
  const normalized = role.toLowerCase();
  if (normalized === 'vice-chancellor') return '/administration/vc-office';
  if (normalized.includes('pro-vice') || normalized.includes('pro vice')) {
    return '/administration/pro-vc-office';
  }
  if (normalized.includes('treasurer')) return '/administration/treasurer-office';
  if (normalized.includes('registrar')) return '/administration/registrar-office';
  if (normalized.includes('proctor')) return '/administration/proctor-office';
  if (normalized.includes('student advisor')) return '/administration/student-advisor-office';
  if (normalized.includes('ict')) return '/administration/ict-cell';
  if (normalized.includes('controller')) return '/administration/controller-office';
  return null;
}

export function AdministrationSection({
  route,
  profile,
  vcProfiles,
}: AdministrationSectionProps) {
  const { loadingData, dataError, retryLoad } = usePust();
  const [unitFilter, setUnitFilter] = useState<UnitFilter>('All');
  const [directoryQuery, setDirectoryQuery] = useState('');
  const [showPreviousVcs, setShowPreviousVcs] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const activeOffice = OFFICE_SUBROUTES.find((o) => o.route === route);

  const filteredLeadership = useMemo(() => {
    if (!profile) return [];
    const q = directoryQuery.trim().toLowerCase();
    if (!q) return profile.leadership;
    return profile.leadership.filter(
      (officer) =>
        officer.role.toLowerCase().includes(q) ||
        officer.name.toLowerCase().includes(q) ||
        officer.office.toLowerCase().includes(q) ||
        officer.email.toLowerCase().includes(q)
    );
  }, [profile, directoryQuery]);

  if (loadingData && !profile) {
    return <PageHeaderAndSectionSkeleton />;
  }

  if (!profile) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 space-y-3">
          <h1 className="font-serif text-xl font-medium text-red-950">
            Administration Data Unavailable
          </h1>
          <p className="text-sm text-red-800">
            {dataError ||
              'Unable to load administration profile and leadership directory from the university server.'}
          </p>
          <button
            type="button"
            onClick={() => retryLoad()}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-pust-900 text-white hover:bg-pust-950 cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      </section>
    );
  }

  const { adminShowcase, adminOffices } = resolveUniversityContent(profile);
  const activeOfficeRecord = adminOffices.find((o) => o.route === route);
  const showAllDirectory = route === '/administration' || route === '/administration/all-office';
  const showVcBand = route === '/administration' || route === '/administration/vc-office';

  const currentVc = vcProfiles.find((v) => v.isCurrent) || vcProfiles[0];
  const previousVcs = vcProfiles
    .filter((v) => !v.isCurrent)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const highlightedOfficer = activeOffice?.matchLeadership
    ? profile.leadership.find((o) => activeOffice.matchLeadership?.(o.role))
    : undefined;

  const filteredUnits: AdministrativeUnit[] =
    unitFilter === 'All'
      ? profile.units
      : profile.units.filter((u) => u.category === unitFilter);

  const vcParagraphs = (currentVc?.message || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const closingLine =
    vcParagraphs.length > 1 && vcParagraphs[vcParagraphs.length - 1].startsWith('Long Live')
      ? vcParagraphs[vcParagraphs.length - 1]
      : null;
  const bodyParagraphs = closingLine ? vcParagraphs.slice(0, -1) : vcParagraphs;

  async function handleCopyEmail(email: string) {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(email);
      window.setTimeout(() => {
        setCopiedEmail((prev) => (prev === email ? null : prev));
      }, 1800);
    } catch {
      // Clipboard unavailable in restricted context
    }
  }

  return (
    <div className="bg-[#FBF9F5] text-stone-900">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Persistent Sticky Administration Sidebar */}
          <div className="lg:col-span-3 lg:sticky lg:top-28">
            <AdministrationSidebar offices={adminOffices} activeRoute={route} />
          </div>

          {/* Right Column: Main Editorial & Office Dossier Workspace */}
          <div className="lg:col-span-9 min-w-0 space-y-10">
            {/* Band 1: Institutional Masthead, Architectural Frame & Operational Ribbon */}
            <section className="editable-region rounded-xl border border-stone-200 bg-white p-6 sm:p-8 space-y-8">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-stretch">
                <div className="xl:col-span-7 flex flex-col justify-between gap-6">
                  <SubPagePanel subKey={route} className="space-y-5">
                    <div className="space-y-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-medium text-pust-800">
                          Pabna University of Science and Technology · Act No. 43 of 2001
                        </p>
                        <EditTriggerButton
                          target={{ kind: 'apa-benchmarks' }}
                          label="Edit Showcase & APA"
                          variant="compact"
                        />
                      </div>
                      <h1 className="font-serif text-3xl sm:text-4xl leading-[1.1] font-semibold tracking-tight text-stone-950 max-w-2xl">
                        {activeOfficeRecord
                          ? activeOfficeRecord.name
                          : activeOffice
                          ? activeOffice.highlight
                          : 'University Administration & Executive Governance'}
                      </h1>
                      <p className="text-[15px] sm:text-base leading-[1.72] text-stone-700 max-w-2xl">
                        {activeOfficeRecord
                          ? activeOfficeRecord.summary
                          : activeOffice
                          ? activeOffice.summary
                          : 'Statutory leadership, administrative offices, residential halls, and specialized cells stewarding academic governance, campus services, and transparent public administration.'}
                      </p>
                    </div>

                    {/* Focused Accession-Style Desk Summary on Office Sub-Routes */}
                    {activeOfficeRecord &&
                    (activeOfficeRecord.head ||
                      activeOfficeRecord.officeEmail ||
                      activeOfficeRecord.officePhone) ? (
                      <dl className="border-y border-stone-200 bg-[#FBF9F5] px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        {activeOfficeRecord.head && (
                          <div className="space-y-0.5">
                            <dt className="text-stone-500">
                              {activeOfficeRecord.head.designation}
                            </dt>
                            <dd className="font-serif text-lg font-medium text-stone-950">
                              {activeOfficeRecord.head.name}
                            </dd>
                          </div>
                        )}
                        <div className="space-y-1.5 sm:text-right font-mono tabular-nums">
                          {(activeOfficeRecord.officeEmail ||
                            activeOfficeRecord.head?.emails?.[0]?.value) && (
                            <div>
                              <a
                                href={`mailto:${
                                  activeOfficeRecord.officeEmail ||
                                  activeOfficeRecord.head?.emails?.[0]?.value
                                }`}
                                className="inline-flex items-center gap-1.5 text-pust-900 hover:underline break-all"
                              >
                                <Mail className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                                {activeOfficeRecord.officeEmail ||
                                  activeOfficeRecord.head?.emails?.[0]?.value}
                              </a>
                            </div>
                          )}
                          {(activeOfficeRecord.officePhone ||
                            activeOfficeRecord.head?.phones?.[0]?.value) && (
                            <div>
                              <a
                                href={`tel:${sanitizeTel(
                                  activeOfficeRecord.officePhone ||
                                    activeOfficeRecord.head?.phones?.[0]?.value ||
                                    ''
                                )}`}
                                className="inline-flex items-center gap-1.5 text-stone-700 hover:text-stone-950"
                              >
                                <Phone className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                                {activeOfficeRecord.officePhone ||
                                  activeOfficeRecord.head?.phones?.[0]?.value}
                              </a>
                            </div>
                          )}
                        </div>
                      </dl>
                    ) : (
                      highlightedOfficer && (
                        <dl className="border-y border-stone-200 bg-[#FBF9F5] px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-0.5">
                            <dt className="text-stone-500">{highlightedOfficer.role}</dt>
                            <dd className="font-serif text-lg font-medium text-stone-950">
                              {highlightedOfficer.name}
                            </dd>
                          </div>
                          <div className="space-y-1.5 sm:text-right font-mono tabular-nums">
                            <div>
                              <a
                                href={`mailto:${highlightedOfficer.email}`}
                                className="inline-flex items-center gap-1.5 text-pust-900 hover:underline break-all"
                              >
                                <Mail className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                                {highlightedOfficer.email}
                              </a>
                            </div>
                            <div>
                              <a
                                href={`tel:${sanitizeTel(highlightedOfficer.phone)}`}
                                className="inline-flex items-center gap-1.5 text-stone-700 hover:text-stone-950"
                              >
                                <Phone className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                                {highlightedOfficer.phone}
                              </a>
                            </div>
                          </div>
                        </dl>
                      )
                    )}
                  </SubPagePanel>
                </div>

                <div className="xl:col-span-5">
                  <ResilientImage
                    src={adminShowcase.buildingImage}
                    alt="Administrative Building at Pabna University of Science and Technology"
                    caption={adminShowcase.buildingCaption}
                    containerClassName="h-full flex flex-col"
                    className="w-full h-full min-h-[220px] xl:min-h-[280px] aspect-[4/3] object-cover"
                    priority
                  />
                </div>
              </div>

              {/* Operational Utility Ribbon */}
              <dl className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 rounded-xl border border-stone-200 bg-[#FBF9F5] divide-y sm:divide-y-0 sm:divide-x divide-stone-200">
                <div className="px-4 py-3.5">
                  <dt className="text-xs font-medium text-stone-500">Statutory Charter</dt>
                  <dd className="font-mono tabular-nums text-xs sm:text-sm font-semibold text-stone-950 mt-1">
                    {adminShowcase.charterTag} · Est. {profile.establishedYear}
                  </dd>
                </div>
                <div className="px-4 py-3.5">
                  <dt className="text-xs font-medium text-stone-500">Executive Desks</dt>
                  <dd className="font-mono tabular-nums text-xs sm:text-sm font-semibold text-stone-950 mt-1">
                    {profile.leadership.length} Principal Officers
                  </dd>
                </div>
                <div className="px-4 py-3.5">
                  <dt className="text-xs font-medium text-stone-500">Administrative Registry</dt>
                  <dd className="font-mono tabular-nums text-xs sm:text-sm font-semibold text-stone-950 mt-1">
                    {adminOffices.length} Offices, Halls &amp; Cells
                  </dd>
                </div>
                <div className="px-4 py-3.5 bg-[#FAF6EE]">
                  <dt className="text-xs font-medium text-pust-800">Accountability Cycle</dt>
                  <dd className="font-mono tabular-nums text-xs sm:text-sm font-semibold text-pust-900 mt-1">
                    {adminShowcase.accountabilityCycle}
                  </dd>
                </div>
              </dl>
            </section>

            {/* Dedicated Office Dossier & Personnel Roster (on all 33 office routes) */}
            {activeOfficeRecord && (
              <AdministrationOfficeDossier
                office={activeOfficeRecord}
                copiedEmail={copiedEmail}
                onCopyEmail={handleCopyEmail}
              />
            )}

            {/* Band 2: Vice-Chancellor's Welcome Address & Leadership Archive (Overview & VC Office) */}
            {showVcBand && (
              <section className="space-y-6">
                {currentVc ? (
                  <article className="editable-region rounded-xl border border-stone-200 bg-white overflow-hidden">
                    <div className="grid grid-cols-1 xl:grid-cols-12 items-stretch">
                      {/* VC Portrait & Desk Accession Column */}
                      <div className="xl:col-span-4 bg-[#F4EFE6] border-b xl:border-b-0 xl:border-r border-stone-200 p-6 flex flex-col justify-between gap-6">
                        <div className="max-w-[240px] mx-auto xl:max-w-none w-full">
                          <ResilientImage
                            src={currentVc.photoUrl || ''}
                            alt={currentVc.name}
                            caption={`Fig. 2 — ${currentVc.name}, Honorable Vice-Chancellor.`}
                            className="w-full aspect-[3/4] object-cover object-top"
                          />
                        </div>

                        <dl className="divide-y divide-stone-200 border-y border-stone-200 text-xs">
                          <div className="py-2.5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-3">
                            <dt className="font-medium text-stone-500 shrink-0">Designation</dt>
                            <dd className="font-medium text-stone-950 sm:text-right">
                              {currentVc.title || 'Honorable Vice-Chancellor'}
                            </dd>
                          </div>
                          {currentVc.tenure && (
                            <div className="py-2.5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-3">
                              <dt className="font-medium text-stone-500 shrink-0">Tenure</dt>
                              <dd className="font-mono tabular-nums font-medium text-stone-900 sm:text-right">
                                {currentVc.tenure}
                              </dd>
                            </div>
                          )}
                          {currentVc.email && (
                            <div className="py-2.5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-3">
                              <dt className="font-medium text-stone-500 shrink-0">Direct Email</dt>
                              <dd className="font-mono sm:text-right min-w-0">
                                <a
                                  href={`mailto:${currentVc.email}`}
                                  className="text-pust-900 font-medium hover:underline break-all"
                                >
                                  {currentVc.email}
                                </a>
                              </dd>
                            </div>
                          )}
                          {currentVc.phone && (
                            <div className="py-2.5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-3">
                              <dt className="font-medium text-stone-500 shrink-0">Telephone</dt>
                              <dd className="font-mono tabular-nums font-medium text-stone-900 sm:text-right">
                                <a
                                  href={`tel:${sanitizeTel(currentVc.phone)}`}
                                  className="hover:text-pust-900"
                                >
                                  {currentVc.phone}
                                </a>
                              </dd>
                            </div>
                          )}
                        </dl>
                      </div>

                      {/* Long-Form Editorial Welcome Address */}
                      <div className="xl:col-span-8 p-6 sm:p-8 space-y-6 flex flex-col justify-between bg-white">
                        <div className="space-y-6">
                          <header className="space-y-2 border-b border-stone-200 pb-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <p className="text-xs font-medium text-pust-800">
                                Message from the Vice-Chancellor
                                {currentVc.tenure ? ` · ${currentVc.tenure}` : ''}
                              </p>
                              <EditTriggerButton
                                target={{ kind: 'vc' }}
                                label="Edit VC Profile & Message"
                                variant="compact"
                              />
                            </div>
                            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-stone-950 leading-tight">
                              {currentVc.name}
                            </h2>
                            <p className="text-sm text-stone-600">
                              Honorable Vice-Chancellor, Pabna University of Science and Technology
                            </p>
                          </header>

                          <div className="space-y-5 flow-root prose-justify max-w-[65ch] text-[15px] sm:text-base leading-[1.78] text-stone-800">
                            {bodyParagraphs.map((paragraph, index) => (
                              <p
                                key={index}
                                className={
                                  index === 0
                                    ? 'first-letter:font-serif first-letter:text-5xl first-letter:font-semibold first-letter:float-left first-letter:mr-3.5 first-letter:mt-1 first-letter:leading-[0.84] first-letter:text-pust-900'
                                    : ''
                                }
                              >
                                {paragraph}
                              </p>
                            ))}
                          </div>
                        </div>

                        {closingLine && (
                          <footer className="pt-5 border-t border-stone-200 space-y-1.5">
                            <p className="font-serif italic text-lg text-stone-900">{closingLine}</p>
                            <p className="text-sm font-medium text-stone-700">
                              {currentVc.name} — Honorable Vice-Chancellor
                            </p>
                          </footer>
                        )}
                      </div>
                    </div>
                  </article>
                ) : (
                  <div className="rounded-xl border border-stone-200 bg-white p-8 flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h2 className="font-serif text-xl font-medium text-stone-900">
                        Vice-Chancellor Profile Not Configured
                      </h2>
                      <p className="text-sm text-stone-600">
                        No current Vice-Chancellor dossier is published in the university directory yet.
                      </p>
                    </div>
                    <EditTriggerButton
                      target={{ kind: 'vc' }}
                      label="Add VC Profile"
                      icon="add"
                      variant="compact"
                    />
                  </div>
                )}

                {/* Vice-Chancellor Chronological Archive */}
                <div className="editable-region rounded-xl border border-stone-200 bg-white overflow-hidden">
                  <div className="px-6 py-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs text-pust-800 tabular-nums">
                        Institutional Leadership Archive · {profile.establishedYear} – Present
                      </p>
                      <h3 className="font-serif text-xl font-medium text-stone-950 mt-0.5">
                        Vice-Chancellor History ({previousVcs.length} Former Vice-Chancellors)
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <EditTriggerButton
                        target={{ kind: 'vc', vcId: 'new-former' }}
                        label="Add Former VC"
                        icon="add"
                        variant="compact"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPreviousVcs((prev) => !prev)}
                        aria-expanded={showPreviousVcs}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-stone-300 bg-[#FBF9F5] text-stone-900 hover:border-pust-800 hover:text-pust-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {showPreviousVcs ? 'Hide History' : 'Show History'}
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            showPreviousVcs ? 'rotate-180' : ''
                          }`}
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {showPreviousVcs && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="p-6 bg-[#FBF9F5] grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch"
                      >
                        {previousVcs.map((vc, idx) => (
                          <article
                            key={vc.id}
                            className="h-full bg-white rounded-xl border border-stone-200 hover:border-stone-400 p-5 space-y-2 flex flex-col justify-between transition-colors"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-mono text-xs font-semibold text-pust-900 tabular-nums">
                                  {String(idx + 1).padStart(2, '0')} · {vc.tenure}
                                </span>
                                <EditTriggerButton
                                  target={{ kind: 'vc', vcId: vc.id }}
                                  label="Edit"
                                  variant="compact"
                                />
                              </div>
                              <h4 className="font-serif text-base font-medium text-stone-950 leading-snug text-left">
                                {vc.name}
                              </h4>
                              <p className="text-xs text-stone-500 text-left">{vc.title}</p>
                              <p className="text-xs text-stone-600 leading-relaxed pt-1 text-left">
                                {vc.message}
                              </p>
                            </div>
                          </article>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </section>
            )}

            {/* Band 3: Complete 33-Office Administrative Registry (Overview & All Office View) */}
            {showAllDirectory && (
              <AllOfficesDirectory offices={adminOffices} activeRoute={route} />
            )}

            {/* Band 4: Executive Administration Ledger (Principal Officers & Desks) */}
            <section className="rounded-xl border border-stone-200 bg-white p-6 sm:p-8 space-y-6">
              <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 border-b border-stone-200 pb-6">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-pust-800">Principal Leadership &amp; Desks</p>
                  <h2 className="font-serif text-2xl sm:text-3xl font-medium text-stone-950">
                    Executive Administration Ledger
                  </h2>
                  <p className="text-sm text-stone-600">
                    Direct office desks, email addresses, and telephone contacts across the
                    Administrative Complex.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                  <EditTriggerButton
                    target={{ kind: 'leadership' }}
                    label="Edit Leadership"
                    variant="compact"
                  />
                  <div className="w-full sm:w-72 relative">
                    <Search
                      className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      type="search"
                      value={directoryQuery}
                      onChange={(e) => setDirectoryQuery(e.target.value)}
                      placeholder="Filter principal office or officer..."
                      aria-label="Filter executive administration ledger"
                      className="w-full pl-10 pr-9 py-2 text-sm bg-[#FBF9F5] border border-stone-300 rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-pust-800 focus:bg-white"
                    />
                    {directoryQuery && (
                      <button
                        type="button"
                        onClick={() => setDirectoryQuery('')}
                        aria-label="Clear search"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
                {filteredLeadership.length === 0 ? (
                  <div className="p-10 text-center space-y-3">
                    <p className="text-sm text-stone-600">
                      No administrative officer matched{' '}
                      <span className="font-medium text-stone-900">“{directoryQuery}”</span>.
                    </p>
                    <button
                      type="button"
                      onClick={() => setDirectoryQuery('')}
                      className="px-4 py-2 text-xs font-medium rounded-lg border border-stone-300 bg-[#FBF9F5] text-pust-900 hover:border-pust-800 transition-colors cursor-pointer"
                    >
                      Reset Directory Filter
                    </button>
                  </div>
                ) : (
                  <dl className="divide-y divide-stone-200">
                    {filteredLeadership.map((officer) => {
                      const isHighlighted = activeOffice?.matchLeadership?.(officer.role) ?? false;
                      const isCopied = copiedEmail === officer.email;
                      const originalIdx = profile.leadership.indexOf(officer);
                      const linkedRoute = matchLeadershipToOfficeRoute(officer.role);

                      return (
                        <div
                          key={officer.role}
                          className={`px-5 py-4 grid grid-cols-1 xl:grid-cols-12 gap-3 xl:gap-5 items-center transition-colors ${
                            isHighlighted ? 'bg-pust-50/50' : 'hover:bg-[#FBF9F5]'
                          }`}
                        >
                          <dt className="xl:col-span-3 text-xs font-semibold text-pust-900">
                            {officer.role}
                          </dt>
                          <dd className="xl:col-span-4 space-y-0.5">
                            <p className="font-serif text-base font-medium text-stone-950 text-left">
                              {officer.name}
                            </p>
                            <p className="text-xs text-stone-600 text-left">{officer.office}</p>
                          </dd>
                          <dd className="xl:col-span-5 flex flex-wrap items-center xl:justify-end gap-2.5 text-xs font-mono tabular-nums text-stone-600">
                            <a
                              href={`mailto:${officer.email}`}
                              className="inline-flex items-center gap-1.5 text-pust-900 hover:underline break-all"
                            >
                              <Mail className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                              {officer.email}
                            </a>
                            <button
                              type="button"
                              onClick={() => handleCopyEmail(officer.email)}
                              aria-label={`Copy ${officer.email}`}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded border border-stone-200 bg-[#FBF9F5] text-[11px] font-sans font-medium text-stone-700 hover:border-pust-800 hover:text-pust-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-700" aria-hidden="true" />
                                  Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" aria-hidden="true" />
                                  Copy
                                </>
                              )}
                            </button>
                            <a
                              href={`tel:${sanitizeTel(officer.phone)}`}
                              className="inline-flex items-center gap-1 text-stone-700 hover:text-stone-950 whitespace-nowrap"
                            >
                              <Phone className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                              {officer.phone}
                            </a>
                            {linkedRoute && (
                              <Link
                                href={linkedRoute}
                                className="inline-flex items-center gap-1 font-sans text-xs font-semibold text-pust-900 hover:underline whitespace-nowrap"
                              >
                                Dossier
                                <ArrowRight className="w-3 h-3" aria-hidden="true" />
                              </Link>
                            )}
                            <EditTriggerButton
                              target={{
                                kind: 'leadership',
                                officerIndex: originalIdx >= 0 ? originalIdx : 0,
                              }}
                              label="Edit"
                              variant="compact"
                            />
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                )}
              </div>
            </section>

            {/* Band 5: Public Accountability (APA) & Statutory Governance Architecture */}
            <section className="space-y-8">
              {(route === '/administration/apa' || route === '/administration') && (
                <div className="editable-region rounded-xl border border-stone-200 bg-white p-6 sm:p-8 space-y-8">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-stone-200 pb-5">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-pust-800">
                        Public Accountability &amp; Citizen’s Charter
                      </p>
                      <h2 className="font-serif text-2xl sm:text-3xl font-medium text-stone-950">
                        Annual Performance Agreement (APA) Benchmarks
                      </h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-mono text-xs text-stone-600 tabular-nums">
                        {adminShowcase.apaFyLabel}
                      </span>
                      <EditTriggerButton
                        target={{ kind: 'apa-benchmarks' }}
                        label="Edit APA & Benchmarks"
                        variant="compact"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-stone-200">
                    {adminShowcase.apaBenchmarks.map((item, idx) => (
                      <div
                        key={`${item.code}-${idx}`}
                        className={`py-4 md:py-0 space-y-2 ${
                          idx === 0 ? 'md:pr-6' : idx === 1 ? 'md:px-6' : 'md:pl-6'
                        }`}
                      >
                        <p className="font-mono text-xs font-semibold text-pust-800 tabular-nums">
                          {item.code}
                        </p>
                        <h3 className="font-serif text-xl font-medium text-stone-950 text-left">
                          {item.title}
                        </h3>
                        <p className="text-sm text-stone-600 leading-relaxed text-left">
                          {item.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-stone-200 bg-white p-6 sm:p-8 space-y-8">
                <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-5 border-b border-stone-200 pb-6">
                  <div className="space-y-1 max-w-2xl">
                    <p className="text-xs font-medium text-pust-800">
                      Institutional Architecture · {filteredUnits.length} Units Displayed
                    </p>
                    <h2 className="font-serif text-2xl sm:text-3xl font-medium text-stone-950">
                      Statutory Bodies &amp; Governance Units
                    </h2>
                    <p className="text-sm text-stone-600">
                      Statutory boards and governance councils operating under PUST Act No. 43 of 2001.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <EditTriggerButton target={{ kind: 'unit' }} label="Edit Units" variant="compact" />
                    <div
                      className="flex overflow-x-auto no-scrollbar sm:flex-wrap gap-1 p-1 bg-stone-200/60 border border-stone-200 rounded-lg max-w-full"
                      role="group"
                      aria-label="Filter administrative units by category"
                    >
                      {UNIT_TABS.map((tab) => {
                        const active = unitFilter === tab;
                        return (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => setUnitFilter(tab)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                              active
                                ? 'bg-white text-stone-950 shadow-xs'
                                : 'text-stone-600 hover:text-stone-950'
                            }`}
                          >
                            {tab}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-stretch">
                  {filteredUnits.map((unit) => {
                    const matchesRoute = activeOffice?.matchUnit?.(unit.code) ?? false;
                    return (
                      <article
                        key={unit.code}
                        className={`h-full flex flex-col justify-between p-5 rounded-xl border transition-colors ${
                          matchesRoute
                            ? 'bg-pust-50/50 border-pust-800'
                            : 'bg-[#FBF9F5] border-stone-200 hover:bg-white hover:border-stone-400'
                        }`}
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-mono text-xs text-stone-500 text-left tabular-nums">
                              <span className="font-semibold text-pust-900">{unit.code}</span> ·{' '}
                              <span className="font-sans">{unit.category}</span>
                            </p>
                            <EditTriggerButton
                              target={{ kind: 'unit', unitCode: unit.code }}
                              label="Edit"
                              variant="compact"
                            />
                          </div>
                          <h3 className="font-serif text-lg font-medium text-stone-950 text-left">
                            {unit.name}
                          </h3>
                          <p className="text-sm text-stone-600 leading-relaxed text-left">
                            {unit.description}
                          </p>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {/* Related Institutional Links Footer */}
                <div className="pt-6 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm">
                  <p className="text-stone-600">
                    Looking for statutory acts, Regent Board membership, or official university orders?
                  </p>
                  <div className="flex flex-wrap items-center gap-5 font-medium">
                    <Link href="/governance" className="text-pust-900 hover:underline whitespace-nowrap">
                      Statutory Governance →
                    </Link>
                    <Link href="/notices" className="text-pust-900 hover:underline whitespace-nowrap">
                      Official Circulars &amp; NOCs →
                    </Link>
                    <Link href="/portal" className="text-pust-900 hover:underline whitespace-nowrap">
                      Digital Campus Portal →
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
