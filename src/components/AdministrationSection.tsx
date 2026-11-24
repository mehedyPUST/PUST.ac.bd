'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import type { AppRoute } from '../lib/routes';
import { PageHeaderAndSectionSkeleton } from './PustSkeletons';
import { ResilientImage } from './ResilientImage';
import type {
  AdministrativeUnit,
  UniversityProfile,
  ViceChancellorRecord,
} from '../types/pust';

const VC_PORTRAIT_IMAGE = '/src/assets/images/pust_vc_portrait_1795438823012.jpg';

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

const OFFICE_SUBROUTES: Array<{ route: AppRoute; label: string; highlight: string }> = [
  { route: '/administration/vc-office', label: 'VC Office', highlight: 'Office of the Vice-Chancellor' },
  { route: '/administration/pro-vc-office', label: 'Pro-VC Office', highlight: 'Office of the Pro-Vice-Chancellor' },
  { route: '/administration/treasurer-office', label: 'Treasurer Office', highlight: 'Office of the Treasurer' },
  { route: '/administration/registrar-office', label: 'Registrar Office', highlight: 'Office of the Registrar' },
  { route: '/administration/proctor-office', label: 'Proctor Office', highlight: "Proctor's Office" },
  {
    route: '/administration/student-advisor-office',
    label: 'Student Advisor',
    highlight: 'Directorate of Student Welfare & Guidance',
  },
  { route: '/administration/ict-cell', label: 'ICT Cell', highlight: 'ICT Cell & Digital Services' },
  { route: '/administration/all-office', label: 'All Office', highlight: 'All University Offices & Units' },
  { route: '/administration/apa', label: 'APA', highlight: 'Annual Performance Agreement (APA)' },
];

export function AdministrationSection({
  route,
  profile,
  vcProfiles,
  onNavigate,
}: AdministrationSectionProps) {
  const [unitFilter, setUnitFilter] = useState<UnitFilter>('All');
  const [showPreviousVcs, setShowPreviousVcs] = useState(false);

  if (!profile) {
    return <PageHeaderAndSectionSkeleton />;
  }

  const currentVc = vcProfiles.find((v) => v.isCurrent) || vcProfiles[0];
  const previousVcs = vcProfiles
    .filter((v) => !v.isCurrent)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const activeOffice = OFFICE_SUBROUTES.find((o) => o.route === route);

  const filteredUnits: AdministrativeUnit[] =
    unitFilter === 'All'
      ? profile.units
      : profile.units.filter((u) => u.category === unitFilter);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-12">
      {/* Sub-navigation bar across all Administration office pages */}
      <div className="border-b border-slate-200 pb-6 space-y-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-pust-800">
            Administration &amp; Executive Governance
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-slate-900 mt-1">
            {activeOffice ? activeOffice.highlight : 'University Administration & Executive Offices'}
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/administration"
            className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              route === '/administration'
                ? 'bg-pust-900 text-white'
                : 'bg-[#F7F7F5] border border-slate-200 text-slate-700 hover:border-pust-700/50 hover:text-pust-900'
            }`}
          >
            Overview
          </Link>
          {OFFICE_SUBROUTES.map((item) => (
            <Link
              key={item.route}
              href={item.route}
              className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                route === item.route
                  ? 'bg-pust-900 text-white'
                  : 'bg-[#F7F7F5] border border-slate-200 text-slate-700 hover:border-pust-700/50 hover:text-pust-900'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Vice-Chancellor Address + Portrait + Executive Leadership + Expandable Former VCs Archive */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start pb-12 border-b border-slate-200">
        <div className="lg:col-span-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-xs uppercase tracking-widest text-pust-800">
              Current Vice-Chancellor · {currentVc?.tenure}
            </p>
            <button
              type="button"
              onClick={() => setShowPreviousVcs((prev) => !prev)}
              aria-expanded={showPreviousVcs}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-800 hover:border-pust-800 hover:text-pust-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Previous Vice-Chancellors ({previousVcs.length})
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${
                  showPreviousVcs ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
            <div className="sm:col-span-4">
              <ResilientImage
                src={VC_PORTRAIT_IMAGE}
                alt={currentVc?.name || 'Vice-Chancellor of PUST'}
                className="w-full aspect-[3/4] object-cover"
              />
            </div>
            <div className="sm:col-span-8 space-y-3">
              <h2 className="font-serif text-2xl sm:text-3xl font-medium text-slate-900">
                {currentVc?.name}
              </h2>
              <p className="text-[15px] leading-[1.75] text-slate-700">{currentVc?.message}</p>
              <p className="font-mono text-xs text-slate-500 tabular-nums">
                Direct Desk: {currentVc?.email} · {currentVc?.phone}
              </p>
            </div>
          </div>

          {showPreviousVcs && (
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <p className="font-mono text-xs uppercase tracking-widest text-slate-600">
                Former Vice-Chancellors of PUST
              </p>
              <div className="rounded-xl divide-y divide-slate-200 border border-slate-200 bg-[#F7F7F5] overflow-hidden">
                {previousVcs.map((vc) => (
                  <div
                    key={vc.id}
                    className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
                  >
                    <div>
                      <p className="font-serif font-medium text-slate-900">{vc.name}</p>
                      <p className="text-xs text-slate-500">{vc.message}</p>
                    </div>
                    <span className="font-mono tabular-nums text-xs text-pust-800 whitespace-nowrap shrink-0">
                      {vc.tenure}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-[#F7F7F5]">
            <h3 className="font-serif text-lg font-medium text-slate-900">
              Executive Administration Directory
            </h3>
          </div>
          <dl className="divide-y divide-slate-200">
            {profile.leadership.map((officer) => {
              const isHighlighted =
                (route === '/administration/vc-office' && officer.role === 'Vice-Chancellor') ||
                (route === '/administration/pro-vc-office' &&
                  officer.role === 'Pro-Vice-Chancellor') ||
                (route === '/administration/treasurer-office' && officer.role === 'Treasurer') ||
                (route === '/administration/registrar-office' && officer.role === 'Registrar') ||
                (route === '/administration/proctor-office' && officer.role === 'Proctor') ||
                (route === '/administration/student-advisor-office' &&
                  officer.role.includes('Student Advisor')) ||
                (route === '/administration/ict-cell' && officer.role.includes('ICT Cell'));

              return (
                <div
                  key={officer.role}
                  className={`px-6 py-4 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-baseline ${
                    isHighlighted ? 'bg-pust-50/70' : ''
                  }`}
                >
                  <dt className="sm:col-span-4 font-mono text-xs uppercase tracking-wider font-semibold text-pust-800">
                    {officer.role}
                  </dt>
                  <dd className="sm:col-span-8 space-y-0.5">
                    <p className="font-medium text-sm text-slate-900">{officer.name}</p>
                    <p className="text-xs text-slate-600">{officer.office}</p>
                    <p className="font-mono text-xs text-slate-500 tabular-nums">
                      {officer.email} · {officer.phone}
                    </p>
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      </div>

      {/* APA Highlight Strip when viewing APA or Overview */}
      {(route === '/administration/apa' || route === '/administration') && (
        <div className="bg-[#F7F7F5] rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <h2 className="font-serif text-xl font-medium text-slate-900">
              Annual Performance Agreement (APA) &amp; Integrity Benchmarks
            </h2>
            <span className="font-mono text-xs text-pust-800 tabular-nums">
              FY 2026–2027 · UGC Public Accountability
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-1.5">
              <p className="font-mono text-xs text-pust-800">E-Governance &amp; Service</p>
              <p className="font-serif font-medium text-slate-900">100% Digital Clearance</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                4-office certificate, hall dues, and library card issuance tracked with timestamps.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-1.5">
              <p className="font-mono text-xs text-pust-800">Academic Quality (IQAC)</p>
              <p className="font-serif font-medium text-slate-900">21 OBE Curricula Active</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Continuous academic auditing and faculty pedagogy workshops across all 5 faculties.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-1.5">
              <p className="font-mono text-xs text-pust-800">National Integrity Strategy</p>
              <p className="font-serif font-medium text-slate-900">Transparent Procurement</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                e-GP compliance, citizen charter disclosures, and audit committee reporting.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Statutory Bodies, Administrative Offices, ICT Cell & APA */}
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div>
            <h2 className="font-serif text-2xl font-medium text-slate-900">
              Statutory Bodies, Administrative Offices &amp; Specialized Cells
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              University governance under the University Act (Act No. 43 of 2001), Annual
              Performance Agreement (APA), Proctorial Desk, Student Advisor Office, IQAC, and ICT
              Cell.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {UNIT_TABS.map((tab) => {
              const active = unitFilter === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setUnitFilter(tab)}
                  className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-pust-900 text-white'
                      : 'bg-[#F7F7F5] border border-slate-200 text-slate-700 hover:border-pust-700/50 hover:text-pust-900'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUnits.map((unit) => {
            const matchesRoute =
              (route === '/administration/ict-cell' && unit.code === 'ICT') ||
              (route === '/administration/apa' && unit.code === 'APA') ||
              (route === '/administration/proctor-office' && unit.code === 'PROCTOR') ||
              (route === '/administration/student-advisor-office' && unit.code === 'DSW');

            return (
              <div
                key={unit.code}
                className={`p-5 rounded-xl border space-y-2 transition-colors ${
                  matchesRoute
                    ? 'border-pust-700 bg-pust-50/70'
                    : 'border-slate-200 bg-white hover:border-pust-700/40'
                }`}
              >
                <p className="font-mono text-xs text-pust-800">
                  {unit.code} · {unit.category}
                </p>
                <h3 className="font-serif text-lg font-medium text-slate-900">{unit.name}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{unit.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
