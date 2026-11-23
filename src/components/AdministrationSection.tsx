import { useState } from 'react';
import type { AdministrativeUnit, UniversityProfile } from '../types/pust';

interface AdministrationSectionProps {
  profile: UniversityProfile | null;
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

export function AdministrationSection({ profile }: AdministrationSectionProps) {
  const [unitFilter, setUnitFilter] = useState<UnitFilter>('All');

  if (!profile) return null;

  const filteredUnits: AdministrativeUnit[] =
    unitFilter === 'All'
      ? profile.units
      : profile.units.filter((u) => u.category === unitFilter);

  return (
    <section id="administration" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
      {/* Vice-Chancellor's Address & Executive Leadership */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start pb-14 border-b border-slate-200">
        <div className="lg:col-span-6 space-y-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
            01. Leadership &amp; Governance
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-medium text-slate-900">
            Welcome from the Office of the Vice-Chancellor
          </h2>
          <p className="text-[15px] leading-[1.75] text-slate-700 first-letter:text-5xl first-letter:font-serif first-letter:font-medium first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:text-emerald-700">
            Founded in 2008 with 140 students across four founding departments—Computer Science and
            Engineering, Electrical and Electronic Engineering, Mathematics, and Business
            Administration—Pabna University of Science and Technology now anchors 5 faculties, 21
            departments, 172 teaching staff, and nearly 5,000 students on its 30-acre Rajapur
            campus.
          </p>
          <p className="text-[15px] leading-[1.75] text-slate-700">
            Our institutional mission centers on advancing applied scientific research,
            outcome-based engineering education, and regional civic leadership as we prepare for the
            university’s historic First Convocation on 15 March 2027.
          </p>
          <div className="pt-2 text-sm text-slate-900">
            <p className="font-serif font-medium text-base">Prof. Dr. Abul Hasnat Md. Shamim</p>
            <p className="text-slate-600">
              Vice-Chancellor, Pabna University of Science and Technology
            </p>
          </div>
        </div>

        <div className="lg:col-span-6 bg-white border border-slate-200 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200 bg-emerald-50/50">
            <h3 className="font-serif text-lg font-medium text-slate-900">
              Executive Administration Directory
            </h3>
          </div>
          <dl className="divide-y divide-slate-200">
            {profile.leadership.map((officer) => (
              <div
                key={officer.role}
                className="px-6 py-4 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-baseline"
              >
                <dt className="sm:col-span-4 text-xs uppercase tracking-wider font-semibold text-emerald-700">
                  {officer.role}
                </dt>
                <dd className="sm:col-span-8 space-y-0.5">
                  <p className="font-medium text-sm text-slate-900">{officer.name}</p>
                  <p className="font-mono text-xs text-slate-500">
                    {officer.email} · {officer.phone}
                  </p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Statutory Bodies, Offices & Specialized Cells */}
      <div className="pt-12 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div>
            <h3 className="font-serif text-2xl font-medium text-slate-900">
              Statutory Bodies, Administrative Offices &amp; Specialized Cells
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              University governance under the PUST Act (2008), Annual Performance Agreement (APA),
              IQAC, and ICT Cell.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {UNIT_TABS.map((tab) => {
              const active = unitFilter === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setUnitFilter(tab)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-300 hover:text-emerald-800'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-l border-slate-200 bg-white">
          {filteredUnits.map((unit) => (
            <div
              key={unit.code}
              className="p-5 border-r border-b border-t border-slate-200 space-y-2 hover:bg-emerald-50/25 transition-colors"
            >
              <p className="font-mono text-xs text-emerald-700">
                {unit.code} · {unit.category}
              </p>
              <h4 className="font-serif text-lg font-medium text-slate-900">{unit.name}</h4>
              <p className="text-sm text-slate-600 leading-relaxed">{unit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
