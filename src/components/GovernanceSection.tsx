'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Eye, Maximize2, Minimize2 } from 'lucide-react';
import { resolveUniversityContent } from '../lib/cmsDefaults';
import type { AppRoute } from '../lib/routes';
import type { GovernanceTabKind } from '../types/pust';
import { CgpaCalculator } from './CgpaCalculator';
import { EditTriggerButton } from './EditTriggerButton';
import { MotionCard, MotionReveal } from './MotionPrimitives';
import { usePust } from './PustContext';
import { PageHeaderAndSectionSkeleton } from './PustSkeletons';

interface GovernanceSectionProps {
  route: AppRoute;
  onNavigate?: (route: AppRoute | string) => void;
}

const GOVERNANCE_TABS: Array<{
  route: AppRoute;
  tabKey: GovernanceTabKind;
  label: string;
  code: string;
  heading: string;
  subtitle: string;
}> = [
  {
    route: '/governance/pust-act',
    tabKey: 'pust-act',
    label: 'PUST Act',
    code: 'ACT NO. 43 OF 2001 · PASSED 15 JULY 2001 · EFFECTIVE 12 OCT 2008',
    heading: 'PUST Act — Pabna University of Science and Technology Act, 2001',
    subtitle:
      'Statutory charter enacted by the Parliament of Bangladesh (Act No. 43 of 2001, passed 15 July 2001 and operationalized via Gazette notification on 12 October 2008) establishing PUST as a public university for science and technology.',
  },
  {
    route: '/governance/regent-board',
    tabKey: 'regent-board',
    label: 'Regent Board',
    code: 'STATUTORY BODY · SECTION 18',
    heading: 'The Regent Board',
    subtitle:
      'Highest executive and policy-making governing authority responsible for statutes, university administration, property stewardship, and senior appointments.',
  },
  {
    route: '/governance/academic-council',
    tabKey: 'academic-council',
    label: 'Academic Council',
    code: 'STATUTORY BODY · SECTION 21',
    heading: 'The Academic Council',
    subtitle:
      'Principal academic body governing curricula, degree standards, faculties, examinations, research supervision, and departmental ordinances across all university departments.',
  },
  {
    route: '/governance/finance-committee',
    tabKey: 'finance-committee',
    label: 'Finance Committee',
    code: 'STATUTORY BODY · SECTION 24',
    heading: 'The Finance Committee',
    subtitle:
      'Statutory financial oversight body reviewing annual revenue and development budgets, UGC allocations, audit compliance, and capital infrastructure grants.',
  },
  {
    route: '/governance/academic-ordinance',
    tabKey: 'academic-ordinance',
    label: 'Academic Ordinance',
    code: 'REGULATIONS · SEMESTER & GRADING',
    heading: 'Academic Ordinance & Examination Regulations',
    subtitle:
      'Uniform rules governing undergraduate and postgraduate credit systems, 4.00 grading scale, attendance eligibility, semester promotion, and degree conferral.',
  },
];

export function GovernanceSection({ route }: GovernanceSectionProps) {
  const { profile, loadingData, dataError, retryLoad } = usePust();
  const [showActPreview, setShowActPreview] = useState(true);
  const [expandedPreview, setExpandedPreview] = useState(false);

  if (loadingData && !profile) {
    return <PageHeaderAndSectionSkeleton />;
  }

  if (!profile) {
    return (
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 space-y-3">
          <h1 className="font-serif text-xl font-medium text-red-950">
            Statutory Governance Data Unavailable
          </h1>
          <p className="text-sm text-red-800">
            {dataError || 'Unable to load governance records from the university server.'}
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

  const { governanceContent } = resolveUniversityContent(profile);

  const activeRoute =
    route === '/governance' || route === '/governance/university-act'
      ? '/governance/pust-act'
      : route;
  const activeTab =
    GOVERNANCE_TABS.find((t) => t.route === activeRoute) || GOVERNANCE_TABS[0];

  return (
    <section className="editable-region max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-10">
      {/* Header + Sub-Navigation Bar */}
      <div className="border-b border-slate-200 pb-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-pust-700">
              Statutory Governance · {activeTab.code}
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-slate-950 mt-1.5 tracking-tight">
              {route === '/governance'
                ? 'University Governance & Statutory Framework'
                : activeTab.heading}
            </h1>
            <p className="text-[15px] text-slate-700 mt-2.5 max-w-3xl leading-[1.72]">
              {activeTab.subtitle}
            </p>
          </div>
          <EditTriggerButton
            target={{ kind: 'governance', tab: activeTab.tabKey }}
            label={`Edit ${activeTab.label}`}
            variant="compact"
          />
        </div>

        <nav
          aria-label="Governance sub-navigation"
          className="flex overflow-x-auto no-scrollbar sm:flex-wrap gap-2 -mx-4 px-4 sm:mx-0 sm:px-0 pb-1"
        >
          {GOVERNANCE_TABS.map((tab) => {
            const isActive = activeRoute === tab.route;
            return (
              <Link
                key={tab.route}
                href={tab.route}
                className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-pust-800 text-white shadow-xs'
                    : 'bg-[#F8F5EE] border border-slate-300/80 text-slate-800 hover:border-pust-700 hover:text-pust-900'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Content by Governance Sub-Page */}
      <div>
        {activeRoute === '/governance/pust-act' && (
          <div className="space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              <div className="lg:col-span-7 space-y-5">
                <h2 className="font-serif text-2xl font-semibold text-slate-950">
                  Statutory Mandate Under the PUST Act (Act No. 43 of 2001)
                </h2>
                <p className="text-[15.5px] leading-[1.78] text-slate-800 max-w-[66ch]">
                  {governanceContent.actIntro}
                </p>
                <div className="rounded-2xl divide-y divide-amber-900/10 border border-amber-900/15 card-gradient-parchment overflow-hidden shadow-xs">
                  {governanceContent.actClauses.map((item, idx) => (
                    <div key={`${item.clause}-${idx}`} className="p-5 space-y-1.5 hover:bg-white/75 transition-colors">
                      <p className="font-mono text-xs font-semibold text-pust-700">{item.clause}</p>
                      <p className="text-sm text-slate-800 leading-relaxed">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="lg:col-span-5 card-gradient-crimson rounded-2xl border border-pust-200 shadow-xs overflow-hidden hover:border-pust-600/50 transition-colors">
                <div className="p-6 space-y-5">
                  <p className="font-mono text-xs font-semibold uppercase tracking-widest text-pust-700">
                    Official Bangladesh Laws Citation
                  </p>
                  <dl className="divide-y divide-slate-200 border-y border-slate-200 text-sm">
                    {governanceContent.actCitations.map((item, idx) => (
                      <div
                        key={`${item.label}-${idx}`}
                        className="py-3 flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4"
                      >
                        <dt className="text-slate-700 font-medium">{item.label}</dt>
                        <dd className="font-mono font-semibold text-slate-950 sm:text-right break-words">
                          {item.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  {governanceContent.officialActUrl && (
                    <div className="flex flex-wrap gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowActPreview((prev) => !prev)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-pust-900 text-white hover:bg-pust-950 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {showActPreview ? 'Hide Official Page Preview' : 'Preview Official Act Page'}
                      </button>
                      <a
                        href={governanceContent.officialActUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-800 hover:border-pust-800 hover:text-pust-900 transition-colors"
                      >
                        Open Source Page
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              </aside>
            </div>

            {/* Live Embedded Preview of Official Bangladesh Laws Page */}
            {showActPreview && governanceContent.officialActUrl && (
              <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                <div className="px-5 py-3.5 border-b border-slate-200 bg-[#F7F7F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-wider text-pust-800">
                      Official Document Preview · Legislative &amp; Parliamentary Affairs Division
                    </p>
                    <a
                      href={governanceContent.officialActUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-xs text-slate-700 hover:text-pust-800 underline break-all"
                    >
                      {governanceContent.officialActUrl}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setExpandedPreview((prev) => !prev)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:border-pust-800 hover:text-pust-900 cursor-pointer"
                    >
                      {expandedPreview ? (
                        <>
                          <Minimize2 className="w-3.5 h-3.5" />
                          Standard Height
                        </>
                      ) : (
                        <>
                          <Maximize2 className="w-3.5 h-3.5" />
                          Expand View
                        </>
                      )}
                    </button>
                    <a
                      href={governanceContent.officialActUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-pust-900 text-white hover:bg-pust-950"
                    >
                      Open in New Tab
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <iframe
                  src={governanceContent.officialActUrl}
                  title="Pabna University of Science and Technology Act, 2001 — Laws of Bangladesh"
                  referrerPolicy="no-referrer"
                  className={`w-full bg-white border-0 transition-all ${
                    expandedPreview ? 'h-[520px] sm:h-[780px]' : 'h-[380px] sm:h-[520px]'
                  }`}
                />
              </div>
            )}
          </div>
        )}

        {activeRoute === '/governance/regent-board' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                <div className="px-5 py-4 border-b border-slate-200 bg-[#F7F7F5]">
                  <h2 className="font-serif text-xl font-medium text-slate-900">
                    Composition of the Regent Board
                  </h2>
                </div>
                <div className="divide-y divide-slate-200">
                  {governanceContent.regentBoardMembers.map((m, idx) => (
                    <div
                      key={`${m.designation}-${idx}`}
                      className="px-5 py-4 grid grid-cols-1 sm:grid-cols-12 gap-2 items-baseline text-sm"
                    >
                      <p className="sm:col-span-4 font-mono text-xs font-semibold text-pust-700">
                        {m.seat}
                      </p>
                      <p className="sm:col-span-6 text-slate-900 font-medium">{m.designation}</p>
                      <p className="sm:col-span-2 sm:text-right font-mono text-xs font-medium text-slate-600">
                        {m.term}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <MotionReveal className="lg:col-span-5 space-y-4 card-gradient-gold rounded-2xl border border-gold-200 p-6 shadow-xs">
                <h2 className="font-serif text-xl font-semibold text-slate-950">
                  Core Executive Functions
                </h2>
                <ul className="space-y-3 text-sm text-slate-800 leading-relaxed list-disc pl-5 prose-justify">
                  {governanceContent.regentFunctions.map((fn, idx) => (
                    <li key={idx}>{fn}</li>
                  ))}
                </ul>
              </MotionReveal>
            </div>
          </div>
        )}

        {activeRoute === '/governance/academic-council' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-5">
              <h2 className="font-serif text-2xl font-semibold text-slate-950">
                Mandate &amp; Jurisdiction of the Academic Council
              </h2>
              <p className="text-[15.5px] leading-[1.78] text-slate-800 max-w-[66ch]">
                {governanceContent.academicCouncilIntro}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {governanceContent.academicCouncilCards.map((card, idx) => (
                  <MotionCard
                    key={`${card.title}-${idx}`}
                    delay={idx * 0.04}
                    className="p-5 rounded-2xl border border-lapis-200 card-gradient-lapis hover:border-lapis-600/60 hover:shadow-md space-y-1.5 transition-all"
                  >
                    <h3 className="font-serif text-lg font-semibold text-slate-950">{card.title}</h3>
                    <p className="text-xs text-slate-700 leading-relaxed">{card.detail}</p>
                  </MotionCard>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 rounded-2xl border border-gold-200 card-gradient-gold p-6 space-y-4 shadow-xs">
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-gold-700">
                Council Structure
              </p>
              <dl className="divide-y divide-gold-200/70 text-sm">
                {governanceContent.academicCouncilStructure.map((row, idx) => (
                  <div
                    key={`${row.label}-${idx}`}
                    className="py-3 flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4"
                  >
                    <dt className="text-slate-700">{row.label}</dt>
                    <dd className="font-semibold text-slate-950 sm:text-right">{row.value}</dd>
                  </div>
                ))}
              </dl>
              <Link
                href="/academics/faculty"
                className="inline-block text-xs font-semibold text-pust-800 hover:underline"
              >
                View All Faculty Deans &amp; Departments →
              </Link>
            </div>
          </div>
        )}

        {activeRoute === '/governance/finance-committee' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-5">
              <h2 className="font-serif text-2xl font-semibold text-slate-950">
                Financial Stewardship &amp; Audit Oversight
              </h2>
              <p className="text-[15.5px] leading-[1.78] text-slate-800 max-w-[66ch]">
                {governanceContent.financeCommitteeIntro}
              </p>
              <div className="rounded-2xl divide-y divide-sage-200/80 border border-sage-200 card-gradient-sage overflow-hidden shadow-xs">
                {governanceContent.financeCommitteeScopes.map((item, idx) => (
                  <div key={`${item.scope}-${idx}`} className="p-5 space-y-1 hover:bg-white/75 transition-colors">
                    <p className="font-serif text-lg font-semibold text-slate-950">{item.scope}</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 card-gradient-parchment rounded-2xl border border-amber-900/15 p-6 space-y-4 shadow-xs">
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-pust-700">
                Committee Leadership
              </p>
              <dl className="divide-y divide-slate-200 text-sm">
                {governanceContent.financeCommitteeLeadership.map((row, idx) => (
                  <div
                    key={`${row.label}-${idx}`}
                    className="py-3 flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4"
                  >
                    <dt className="text-slate-700">{row.label}</dt>
                    <dd className="font-semibold text-slate-950 sm:text-right">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        )}

        {activeRoute === '/governance/academic-ordinance' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-6 space-y-4">
                <h2 className="font-serif text-2xl font-semibold text-slate-950">
                  Unified 4.00 Grading Scale &amp; Credit Rules
                </h2>
                <p className="text-[15px] text-slate-700 leading-relaxed">
                  {governanceContent.ordinanceIntro}
                </p>

                <div className="rounded-xl divide-y divide-slate-200 border border-slate-200 bg-[#FAF7F0] text-sm overflow-hidden">
                  {governanceContent.ordinanceRules.map((rule, idx) => (
                    <div
                      key={`${rule.label}-${idx}`}
                      className="p-4 flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4"
                    >
                      <span className="text-slate-700">{rule.label}</span>
                      <span className="font-mono font-semibold text-slate-950 sm:text-right">
                        {rule.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                <div className="px-5 py-3.5 border-b border-slate-200 bg-[#F8F5EE]">
                  <h3 className="font-serif text-lg font-semibold text-slate-950">
                    PUST Official Letter Grade &amp; Grade Point Table
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] text-left text-xs sm:text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 font-mono text-xs font-semibold text-slate-700">
                      <tr>
                        <th className="px-4 py-2.5">Numerical Marks</th>
                        <th className="px-4 py-2.5">Letter Grade</th>
                        <th className="px-4 py-2.5">Grade Point</th>
                        <th className="px-4 py-2.5">Assessment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {governanceContent.gradingScale.map((row, idx) => (
                        <tr key={`${row.letter}-${idx}`} className="hover:bg-slate-50/70">
                          <td className="px-4 py-2 font-mono tabular-nums text-slate-800">
                            {row.range}
                          </td>
                          <td className="px-4 py-2 font-mono font-semibold text-pust-700">
                            {row.letter}
                          </td>
                          <td className="px-4 py-2 font-mono font-semibold tabular-nums text-slate-950">
                            {row.gp}
                          </td>
                          <td className="px-4 py-2 text-slate-700">{row.remarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <CgpaCalculator />
          </div>
        )}
      </div>
    </section>
  );
}
