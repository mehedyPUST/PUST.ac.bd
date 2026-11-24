'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronDown, Copy, Mail, Phone, Search, X } from 'lucide-react';
import { resolveUniversityContent } from '../lib/cmsDefaults';
import type { AppRoute } from '../lib/routes';
import { EditTriggerButton } from './EditTriggerButton';
import { PageHeaderAndSectionSkeleton } from './PustSkeletons';
import { ResilientImage } from './ResilientImage';
import type {
  AdministrativeUnit,
  UniversityProfile,
  ViceChancellorRecord,
} from '../types/pust';

const VC_PORTRAIT_IMAGE = '/src/assets/images/VC_Sir_PUST_2026.JPG';
const VC_PORTRAIT_FALLBACK = 'https://pust.ac.bd/includes/images/messages_pic/VC_Sir_PUST_2026.JPG';

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
    label: 'Vice-Chancellor Office',
    highlight: 'Office of the Vice-Chancellor',
    summary:
      'Executive head of the university, Chair of the Regent Board and Academic Council, directing institutional strategy and research expansion.',
    matchLeadership: (role) => role === 'Vice-Chancellor',
  },
  {
    route: '/administration/pro-vc-office',
    label: 'Pro Vice-Chancellor Office',
    highlight: 'Office of the Pro Vice-Chancellor',
    summary:
      'Coordinates academic governance, faculty development, Outcome-Based Education (OBE) schedules, and inter-faculty coordination.',
    matchLeadership: (role) => role === 'Pro-Vice-Chancellor',
  },
  {
    route: '/administration/treasurer-office',
    label: 'Treasurer Office',
    highlight: 'Office of the Treasurer',
    summary:
      'Oversees annual UGC grants, university budgets, transparent procurement, financial disbursements, and digital revenue accounting.',
    matchLeadership: (role) => role === 'Treasurer',
    matchUnit: (code) => code === 'FINANCE',
  },
  {
    route: '/administration/registrar-office',
    label: 'Registrar Office',
    highlight: 'Office of the Registrar',
    summary:
      'Custodian of university statutes, official circulars, Regent Board records, faculty appointments, and institutional administration.',
    matchLeadership: (role) => role === 'Registrar',
  },
  {
    route: '/administration/proctor-office',
    label: 'Proctor Office',
    highlight: "Proctor's Office",
    summary:
      'Maintains campus discipline, student safety, residential conduct, and digital clearance verification across the 30-acre campus.',
    matchLeadership: (role) => role === 'Proctor',
    matchUnit: (code) => code === 'PROCTOR',
  },
  {
    route: '/administration/student-advisor-office',
    label: 'Student Advisor Office',
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
    label: 'All Office',
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

export function AdministrationSection({
  route,
  profile,
  vcProfiles,
}: AdministrationSectionProps) {
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

  if (!profile) {
    return <PageHeaderAndSectionSkeleton />;
  }

  const { adminShowcase } = resolveUniversityContent(profile);

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
    <div className="bg-[#FAF8F4]">
      {/* Band 1: Institutional Masthead, Architectural Anchor & Sub-Navigation */}
      <section className="editable-region border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-10 lg:pt-14 lg:pb-12 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            <div className="lg:col-span-7 flex flex-col justify-between gap-6">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-medium text-pust-800">
                    Administration &amp; Executive Governance · PUST Act No. 43 of 2001
                  </p>
                  <EditTriggerButton
                    target={{ kind: 'apa-benchmarks' }}
                    label="Edit Showcase & APA"
                    variant="compact"
                  />
                </div>
                <h1 className="font-serif text-3xl sm:text-4xl lg:text-[2.75rem] leading-[1.1] font-medium tracking-tight text-slate-900 max-w-2xl">
                  {activeOffice
                    ? activeOffice.highlight
                    : 'University Administration & Executive Offices'}
                </h1>
                <p className="text-[15px] sm:text-base leading-relaxed text-slate-600 max-w-2xl">
                  {activeOffice
                    ? activeOffice.summary
                    : 'Statutory leadership, executive offices, and accountability units guiding academic governance, faculty administration, and digital public service at Pabna University of Science and Technology.'}
                </p>
              </div>

              {/* Focused Office Dossier Strip on Sub-Routes */}
              {highlightedOfficer && (
                <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-xs font-medium text-pust-800">{highlightedOfficer.role}</p>
                    <p className="text-xs text-slate-500">{highlightedOfficer.office}</p>
                  </div>
                  <p className="font-serif text-xl font-medium text-slate-900">
                    {highlightedOfficer.name}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 pt-1 text-xs font-mono tabular-nums text-slate-600">
                    <a
                      href={`mailto:${highlightedOfficer.email}`}
                      className="inline-flex items-center gap-1.5 text-pust-900 hover:underline"
                    >
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      {highlightedOfficer.email}
                    </a>
                    <a
                      href={`tel:${highlightedOfficer.phone}`}
                      className="inline-flex items-center gap-1.5 hover:text-slate-900"
                    >
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      {highlightedOfficer.phone}
                    </a>
                  </div>
                </div>
              )}

              {/* Sub-Navigation Rail across Administration Pages */}
              <nav
                aria-label="Administration offices"
                className="flex overflow-x-auto no-scrollbar sm:flex-wrap gap-2 pt-2 -mx-4 px-4 sm:mx-0 sm:px-0 pb-1"
              >
                <Link
                  href="/administration"
                  className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    route === '/administration'
                      ? 'bg-pust-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-pust-800 hover:text-pust-900'
                  }`}
                >
                  Overview
                </Link>
                {OFFICE_SUBROUTES.map((item) => (
                  <Link
                    key={item.route}
                    href={item.route}
                    className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                      route === item.route
                        ? 'bg-pust-900 text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:border-pust-800 hover:text-pust-900'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="lg:col-span-5">
              <ResilientImage
                src={adminShowcase.buildingImage}
                fallbackSrc="/src/assets/images/pust_campus_hero_1795431408503.jpg"
                alt="Administrative Building at Pabna University of Science and Technology"
                caption={adminShowcase.buildingCaption}
                containerClassName="h-full flex flex-col"
                className="w-full h-full min-h-[240px] lg:min-h-[300px] aspect-[4/3] object-cover"
                priority
              />
            </div>
          </div>

          {/* Operational Leadership Utility Ribbon */}
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 rounded-xl border border-slate-200 bg-white divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
            <div className="px-5 py-4">
              <dt className="text-xs text-slate-500">Statutory Charter</dt>
              <dd className="font-mono tabular-nums text-sm font-medium text-slate-900 mt-1">
                {adminShowcase.charterTag} · Est. {profile.establishedYear}
              </dd>
            </div>
            <div className="px-5 py-4">
              <dt className="text-xs text-slate-500">Principal Officers</dt>
              <dd className="font-mono tabular-nums text-sm font-medium text-slate-900 mt-1">
                {profile.leadership.length} Executive Offices
              </dd>
            </div>
            <div className="px-5 py-4">
              <dt className="text-xs text-slate-500">Governance &amp; Units</dt>
              <dd className="font-mono tabular-nums text-sm font-medium text-slate-900 mt-1">
                {profile.units.length} Statutory &amp; Cell Bodies
              </dd>
            </div>
            <div className="px-5 py-4">
              <dt className="text-xs text-slate-500">Accountability Cycle</dt>
              <dd className="font-mono tabular-nums text-sm font-medium text-pust-900 mt-1">
                {adminShowcase.accountabilityCycle}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Band 2: Vice-Chancellor's Welcome Address (Editorial Two-Column Reading Canvas) */}
      <section className="bg-white border-b border-slate-200 py-14 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            {/* Sticky Portrait & Desk Dossier Column */}
            <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
              <ResilientImage
                src={currentVc?.photoUrl || VC_PORTRAIT_IMAGE}
                fallbackSrc={VC_PORTRAIT_FALLBACK}
                alt={currentVc?.name || 'Honorable Vice-Chancellor of PUST'}
                caption={`Fig. 2 — ${currentVc?.name || 'Prof. Dr. Abul Hasnat Md. Shamim'}, Honorable Vice-Chancellor.`}
                className="w-full aspect-[3/4] object-cover object-top"
              />

              <dl className="divide-y divide-slate-200 border-y border-slate-200 text-sm">
                <div className="py-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-4">
                  <dt className="text-xs text-slate-500 shrink-0">Designation</dt>
                  <dd className="font-medium text-slate-900 sm:text-right">Honorable Vice-Chancellor</dd>
                </div>
                <div className="py-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-4">
                  <dt className="text-xs text-slate-500 shrink-0">Tenure</dt>
                  <dd className="font-mono tabular-nums text-xs text-slate-800 sm:text-right">
                    {currentVc?.tenure}
                  </dd>
                </div>
                <div className="py-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-4">
                  <dt className="text-xs text-slate-500 shrink-0">Direct Email</dt>
                  <dd className="font-mono text-xs sm:text-right min-w-0">
                    <a
                      href={`mailto:${currentVc?.email || 'vc@pust.ac.bd'}`}
                      className="text-pust-900 hover:underline break-all"
                    >
                      {currentVc?.email}
                    </a>
                  </dd>
                </div>
                <div className="py-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-4">
                  <dt className="text-xs text-slate-500 shrink-0">Telephone</dt>
                  <dd className="font-mono tabular-nums text-xs text-slate-800 sm:text-right">
                    <a
                      href={`tel:${currentVc?.phone || '+8802588842379'}`}
                      className="hover:text-pust-900"
                    >
                      {currentVc?.phone}
                    </a>
                  </dd>
                </div>
              </dl>

              <button
                type="button"
                onClick={() => setShowPreviousVcs((prev) => !prev)}
                aria-expanded={showPreviousVcs}
                className="w-full inline-flex items-center justify-between gap-2 px-4 py-2.5 text-xs font-medium rounded-lg border border-slate-300 bg-[#FAF8F4] text-slate-800 hover:border-pust-800 hover:text-pust-900 transition-colors whitespace-nowrap cursor-pointer"
              >
                <span>Previous Vice-Chancellors ({previousVcs.length})</span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    showPreviousVcs ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </aside>

            {/* Long-Form Editorial Welcome Message */}
            <article className="lg:col-span-8 max-w-prose space-y-6">
              <header className="space-y-2 border-b border-slate-200 pb-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-medium text-pust-800">
                    Welcome Message from the Vice-Chancellor · {currentVc?.tenure}
                  </p>
                  <EditTriggerButton
                    target={{ kind: 'vc' }}
                    label="Edit VC Profile & Message"
                    variant="compact"
                  />
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-medium text-slate-900">
                  {currentVc?.name || 'Prof. Dr. Abul Hasnat Md. Shamim'}
                </h2>
                <p className="text-sm text-slate-600">
                  Honorable Vice-Chancellor, Pabna University of Science and Technology
                </p>
              </header>

              <div className="space-y-5 text-[15px] sm:text-base leading-[1.8] text-slate-700">
                {bodyParagraphs.map((paragraph, index) => (
                  <p
                    key={index}
                    className={
                      index === 0
                        ? 'first-letter:font-serif first-letter:text-5xl first-letter:font-medium first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:leading-[0.84] first-letter:text-pust-800'
                        : ''
                    }
                  >
                    {paragraph}
                  </p>
                ))}
              </div>

              {closingLine && (
                <div className="pt-4 border-t border-slate-200 space-y-2">
                  <p className="font-serif italic text-lg text-slate-900">{closingLine}</p>
                  <p className="text-sm font-medium text-slate-700">
                    {currentVc?.name} — Honorable Vice-Chancellor
                  </p>
                </div>
              )}

              {showPreviousVcs && (
                <div className="editable-region pt-8 border-t border-slate-200 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-serif text-xl font-medium text-slate-900">
                      Former Vice-Chancellors Chronological Archive
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-slate-500 tabular-nums">
                        2008 – Present
                      </span>
                      <EditTriggerButton
                        target={{ kind: 'vc', vcId: 'new-former' }}
                        label="Add Former VC"
                        icon="add"
                        variant="compact"
                      />
                    </div>
                  </div>
                  <div className="divide-y divide-slate-200 border-y border-slate-200">
                    {previousVcs.map((vc) => (
                      <div
                        key={vc.id}
                        className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="space-y-1">
                          <p className="font-serif text-base font-medium text-slate-900">{vc.name}</p>
                          <p className="text-xs text-slate-600 leading-relaxed">{vc.message}</p>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="font-mono tabular-nums text-xs text-pust-800 whitespace-nowrap">
                            {vc.tenure}
                          </span>
                          <EditTriggerButton
                            target={{ kind: 'vc', vcId: vc.id }}
                            label="Edit"
                            variant="compact"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </article>
          </div>
        </div>
      </section>

      {/* Band 3: Executive Administration Directory (Searchable Institutional Ledger) */}
      <section className="bg-[#FAF8F4] border-b border-slate-200 py-14 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-pust-800">Principal Leadership &amp; Desks</p>
              <h2 className="font-serif text-2xl sm:text-3xl font-medium text-slate-900">
                Executive Administration Directory
              </h2>
              <p className="text-sm text-slate-600">
                Direct office desks, email addresses, and institutional telephone contacts across the
                Administrative Complex.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <EditTriggerButton
                target={{ kind: 'leadership' }}
                label="Edit Leadership"
                variant="compact"
              />
              <div className="w-full md:w-80 relative">
                <Search
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={directoryQuery}
                  onChange={(e) => setDirectoryQuery(e.target.value)}
                  placeholder="Search office, role, or officer..."
                  aria-label="Filter executive administration directory"
                  className="w-full pl-10 pr-9 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-pust-800"
                />
                {directoryQuery && (
                  <button
                    type="button"
                    onClick={() => setDirectoryQuery('')}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {filteredLeadership.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <p className="text-sm text-slate-600">
                  No administrative officer matched{' '}
                  <span className="font-medium text-slate-900">“{directoryQuery}”</span>.
                </p>
                <button
                  type="button"
                  onClick={() => setDirectoryQuery('')}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-[#FAF8F4] text-pust-900 hover:border-pust-800 transition-colors cursor-pointer"
                >
                  Reset Directory Filter
                </button>
              </div>
            ) : (
              <dl className="divide-y divide-slate-200">
                {filteredLeadership.map((officer) => {
                  const isHighlighted = activeOffice?.matchLeadership?.(officer.role) ?? false;
                  const isCopied = copiedEmail === officer.email;
                  const originalIdx = profile.leadership.indexOf(officer);

                  return (
                    <div
                      key={officer.role}
                      className={`px-6 py-4 grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-6 items-center transition-colors ${
                        isHighlighted ? 'bg-pust-50/70' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <dt className="lg:col-span-3 text-xs font-semibold text-pust-800">
                        {officer.role}
                      </dt>
                      <dd className="lg:col-span-4 space-y-0.5">
                        <p className="font-serif text-base font-medium text-slate-900">
                          {officer.name}
                        </p>
                        <p className="text-xs text-slate-600">{officer.office}</p>
                      </dd>
                      <dd className="lg:col-span-5 flex flex-wrap items-center lg:justify-end gap-3 text-xs font-mono tabular-nums text-slate-600">
                        <a
                          href={`mailto:${officer.email}`}
                          className="inline-flex items-center gap-1.5 text-pust-900 hover:underline break-all"
                        >
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                          {officer.email}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopyEmail(officer.email)}
                          aria-label={`Copy ${officer.email}`}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-200 bg-[#FAF8F4] text-[11px] font-sans font-medium text-slate-700 hover:border-pust-800 hover:text-pust-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
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
                        <a
                          href={`tel:${officer.phone}`}
                          className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 whitespace-nowrap"
                        >
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          {officer.phone}
                        </a>
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
        </div>
      </section>

      {/* Band 4: Annual Performance Agreement (APA) & Integrity Benchmarks */}
      {(route === '/administration/apa' || route === '/administration') && (
        <section className="editable-region bg-white border-b border-slate-200 py-14 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200 pb-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-pust-800">
                  Public Accountability &amp; Citizen’s Charter
                </p>
                <h2 className="font-serif text-2xl sm:text-3xl font-medium text-slate-900">
                  Annual Performance Agreement (APA) Benchmarks
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-xs text-slate-600 tabular-nums">
                  {adminShowcase.apaFyLabel}
                </span>
                <EditTriggerButton
                  target={{ kind: 'apa-benchmarks' }}
                  label="Edit APA & Benchmarks"
                  variant="compact"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200">
              {adminShowcase.apaBenchmarks.map((item, idx) => (
                <div
                  key={`${item.code}-${idx}`}
                  className={`py-4 md:py-0 space-y-2 ${
                    idx === 0 ? 'md:pr-8' : idx === 1 ? 'md:px-8' : 'md:pl-8'
                  }`}
                >
                  <p className="font-mono text-xs font-medium text-pust-800">{item.code}</p>
                  <h3 className="font-serif text-xl font-medium text-slate-900">{item.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Band 5: Statutory Bodies, Administrative Offices & Specialized Cells */}
      <section className="bg-[#FAF8F4] py-14 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
            <div className="space-y-1 max-w-2xl">
              <p className="text-xs font-medium text-pust-800">
                Institutional Architecture · {filteredUnits.length} Units Displayed
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-medium text-slate-900">
                Statutory Bodies, Administrative Offices &amp; Specialized Cells
              </h2>
              <p className="text-sm text-slate-600">
                University governance under Act No. 43 of 2001, covering the Regent Board, Academic
                Council, Controller of Examinations, IQAC, RTTC, and ICT Cell.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <EditTriggerButton
                target={{ kind: 'unit' }}
                label="Edit Units"
                variant="compact"
              />
              <div
                className="flex overflow-x-auto no-scrollbar sm:flex-wrap gap-1.5 p-1 bg-white border border-slate-200 rounded-lg max-w-full"
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
                      className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'bg-pust-900 text-white'
                          : 'text-slate-700 hover:bg-[#FAF8F4] hover:text-pust-900'
                      }`}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredUnits.map((unit) => {
              const matchesRoute = activeOffice?.matchUnit?.(unit.code) ?? false;

              return (
                <div
                  key={unit.code}
                  className={`p-6 rounded-xl border space-y-2.5 transition-colors ${
                    matchesRoute
                      ? 'border-pust-800 bg-pust-50/70'
                      : 'border-slate-200 bg-white hover:border-pust-700/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-mono text-xs text-pust-800">
                      {unit.code} · {unit.category}
                    </p>
                    <EditTriggerButton
                      target={{ kind: 'unit', unitCode: unit.code }}
                      label="Edit"
                      variant="compact"
                    />
                  </div>
                  <h3 className="font-serif text-lg font-medium text-slate-900">{unit.name}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{unit.description}</p>
                </div>
              );
            })}
          </div>

          {/* Related Institutional Links Footer */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm">
            <p className="text-slate-600">
              Looking for statutory acts, Regent Board membership, or official university orders?
            </p>
            <div className="flex flex-wrap items-center gap-4 font-medium">
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
  );
}
