'use client';

import type { RefObject } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Award,
  BookOpen,
  Calculator,
  CalendarDays,
  FlaskConical,
  GraduationCap,
  Loader2,
  Search,
  Users,
} from 'lucide-react';
import type { ResolvedUniversityContent } from '../lib/cmsDefaults';
import { resolveDepartmentImage } from '../lib/departmentMedia';
import { getAlternatingDepartmentCardClass } from '../lib/cardTheme';
import type {
  DepartmentRecord,
  FacultyName,
  UniversityProfile,
} from '../types/pust';
import { EditTriggerButton } from './EditTriggerButton';
import { MotionCard, MotionReveal } from './MotionPrimitives';
import { CardsGridSkeleton } from './PustSkeletons';
import { ResilientImage } from './ResilientImage';

export const ACADEMIC_FACULTY_FILTERS: Array<{
  label: string;
  shortCode: string;
  value: 'All' | FacultyName;
}> = [
  { label: 'All Faculties', shortCode: 'ALL', value: 'All' },
  {
    label: 'Engineering & Technology',
    shortCode: 'FET',
    value: 'Faculty of Engineering and Technology',
  },
  { label: 'Science', shortCode: 'FS', value: 'Faculty of Science' },
  { label: 'Business Studies', shortCode: 'FBS', value: 'Faculty of Business Studies' },
  {
    label: 'Humanities & Social Science',
    shortCode: 'FHSS',
    value: 'Faculty of Humanities and Social Science',
  },
  {
    label: 'Life & Earth Science',
    shortCode: 'FLES',
    value: 'Faculty of Life and Earth Science',
  },
];

interface AcademicsShowcaseProps {
  isLanding: boolean;
  departments: DepartmentRecord[];
  filteredDepartments: DepartmentRecord[];
  profile: UniversityProfile | null;
  resolved: ResolvedUniversityContent;
  selectedFaculty: 'All' | FacultyName;
  onSelectFaculty: (faculty: 'All' | FacultyName) => void;
  deptQuery: string;
  onDeptQueryChange: (q: string) => void;
  openingDeptCode: string | null;
  loadingData: boolean;
  dataError: string | null;
  onRetry?: () => void;
  getDepartmentHref: (dept: DepartmentRecord) => string;
  prefetchDepartment: (dept: DepartmentRecord) => void;
  onOpenDepartmentLink: (dept: DepartmentRecord) => void;
  deptGroupsRef: RefObject<HTMLDivElement | null>;
}

export function AcademicsShowcase({
  isLanding,
  departments,
  filteredDepartments,
  resolved,
  selectedFaculty,
  onSelectFaculty,
  deptQuery,
  onDeptQueryChange,
  openingDeptCode,
  loadingData,
  dataError,
  onRetry,
  getDepartmentHref,
  prefetchDepartment,
  onOpenDepartmentLink,
  deptGroupsRef,
}: AcademicsShowcaseProps) {
  const facultyDeansMap = new Map(
    resolved.academicExtras.facultyDeans.map((item) => [item.faculty, item])
  );

  const knownFacultyOrder = ACADEMIC_FACULTY_FILTERS.filter((f) => f.value !== 'All').map(
    (f) => f.value as FacultyName
  );
  const allFacultyNames = Array.from(
    new Set([...knownFacultyOrder, ...filteredDepartments.map((d) => d.faculty)])
  );
  const groupedFaculties = allFacultyNames
    .map((facultyName) => ({
      facultyName,
      depts: filteredDepartments.filter((d) => d.faculty === facultyName),
    }))
    .filter((g) => g.depts.length > 0);

  const totalSeats = departments.reduce((sum, d) => sum + (d.intakeSeats || 0), 0);
  const totalTeachers = departments.reduce((sum, d) => sum + (d.facultyCount || 0), 0);

  function handleFacultyJump(faculty: FacultyName) {
    const next = selectedFaculty === faculty ? 'All' : faculty;
    onSelectFaculty(next);
    if (typeof document !== 'undefined') {
      const target = document.getElementById('academics-directory');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  return (
    <div className="space-y-12 lg:space-y-14">
      {isLanding && (
        <>
          {/* 1. Institutional Academic Architecture Ribbon */}
          <MotionReveal>
            <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-200">
                <div className="p-6 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-pust-800">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-wider">
                      01 · Undergraduate Intake
                    </span>
                    <GraduationCap className="w-4 h-4 shrink-0" />
                  </div>
                  <p className="font-serif text-2xl font-semibold text-slate-950 tabular-nums text-left">
                    {totalSeats > 0 ? `${totalSeats.toLocaleString('en-US')}+ Seats` : '920 Seats'}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed text-left">
                    B.Sc. Engg., B.Arch. (5-Yr), B.Pharm., B.Sc. (Hons.), BBA, B.A. &amp; B.S.S. via GST Units A, B &amp; C.
                  </p>
                </div>

                <div className="p-6 space-y-2 bg-[#FAF9F6]/70">
                  <div className="flex items-center justify-between gap-2 text-pust-800">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-wider">
                      02 · Faculty &amp; Supervision
                    </span>
                    <Users className="w-4 h-4 shrink-0" />
                  </div>
                  <p className="font-serif text-2xl font-semibold text-slate-950 tabular-nums text-left">
                    {totalTeachers > 0 ? `${totalTeachers} Faculty` : '228+ Faculty'}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed text-left">
                    Professors, researchers &amp; departmental supervisors mentoring undergraduate and M.Sc./Ph.D. cohorts.
                  </p>
                </div>

                <div className="p-6 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-pust-800">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-wider">
                      03 · Curriculum Ordinance
                    </span>
                    <BookOpen className="w-4 h-4 shrink-0" />
                  </div>
                  <p className="font-serif text-2xl font-semibold text-slate-950 tabular-nums text-left">
                    4.00 OBE Scale
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed text-left">
                    Outcome-Based Education (OBE) semester evaluation governed by the PUST Academic Council.
                  </p>
                  <Link
                    href="/governance/academic-ordinance#cgpa-calculator"
                    className="inline-flex items-center gap-1 pt-0.5 text-xs font-semibold text-pust-900 hover:underline"
                  >
                    SGPA / CGPA Calculator
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="p-6 space-y-2 bg-[#FAF9F6]/70">
                  <div className="flex items-center justify-between gap-2 text-pust-800">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-wider">
                      04 · Research &amp; Labs
                    </span>
                    <FlaskConical className="w-4 h-4 shrink-0" />
                  </div>
                  <p className="font-serif text-2xl font-semibold text-slate-950 tabular-nums text-left">
                    IIED &amp; 30+ Labs
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed text-left">
                    VLSI, THz photonics, nanotechnology, HPLC pharmacology &amp; Innovation Institute initiatives.
                  </p>
                  <Link
                    href="/academics/publications"
                    className="inline-flex items-center gap-1 pt-0.5 text-xs font-semibold text-pust-900 hover:underline"
                  >
                    Publications &amp; Journals
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </MotionReveal>

          {/* 2. Five Constituent Faculties Interactive Matrix */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-stone-200 pb-3">
              <div className="space-y-1">
                <p className="font-mono text-[11px] uppercase tracking-widest text-pust-800 font-semibold text-left">
                  Academic Structure · Click a faculty to filter departments
                </p>
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-950 text-left">
                  Five Constituent Faculties
                </h2>
              </div>
              <Link
                href="/academics/faculty"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-pust-900 hover:underline whitespace-nowrap shrink-0 self-start sm:self-end"
              >
                Full Faculty Deans &amp; Contacts
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-stretch">
              {ACADEMIC_FACULTY_FILTERS.filter((f) => f.value !== 'All').map((facItem, idx) => {
                const facultyName = facItem.value as FacultyName;
                const facDepts = departments.filter((d) => d.faculty === facultyName);
                const facTeachers = facDepts.reduce((s, d) => s + (d.facultyCount ?? 0), 0);
                const deanRecord = facultyDeansMap.get(facultyName);
                const isSelected = selectedFaculty === facultyName;

                return (
                  <div
                    key={facultyName}
                    className={`rounded-2xl border transition-colors flex flex-col justify-between p-4 ${
                      isSelected
                        ? 'border-pust-900 bg-pust-950 text-white shadow-sm'
                        : 'border-stone-200 bg-white hover:border-pust-700/50 text-slate-950'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleFacultyJump(facultyName)}
                      className="text-left space-y-2.5 cursor-pointer flex-1 flex flex-col justify-between focus:outline-none"
                    >
                      <div className="space-y-2 w-full">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`font-mono text-[11px] font-semibold tabular-nums ${
                              isSelected ? 'text-gold-300' : 'text-pust-800'
                            }`}
                          >
                            0{idx + 1} · {facItem.shortCode}
                          </span>
                          <span
                            className={`font-mono text-[11px] tabular-nums ${
                              isSelected ? 'text-stone-300' : 'text-slate-500'
                            }`}
                          >
                            {facDepts.length} Depts
                          </span>
                        </div>
                        <h3
                          className={`font-serif text-base font-semibold leading-snug text-left ${
                            isSelected ? 'text-white' : 'text-slate-950'
                          }`}
                        >
                          {facItem.label}
                        </h3>
                      </div>

                      <div
                        className={`pt-3 mt-2 border-t w-full space-y-1 ${
                          isSelected ? 'border-white/15' : 'border-stone-200/80'
                        }`}
                      >
                        {deanRecord?.dean && (
                          <p
                            className={`text-[11px] leading-snug truncate text-left ${
                              isSelected ? 'text-stone-200' : 'text-slate-600'
                            }`}
                            title={deanRecord.dean}
                          >
                            Dean: <span className="font-medium">{deanRecord.dean}</span>
                          </p>
                        )}
                        <p
                          className={`font-mono text-[11px] tabular-nums text-left ${
                            isSelected ? 'text-gold-300' : 'text-pust-800'
                          }`}
                        >
                          {facTeachers > 0 ? `${facTeachers} Teachers · ` : ''}
                          {isSelected ? 'Filtered Below ✓' : 'Filter Directory →'}
                        </p>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* 3. Curated Faculty-Grouped Departments & Chairmen Directory */}
      <section id="academics-directory" className="editable-region space-y-8 scroll-mt-24">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex overflow-x-auto no-scrollbar sm:flex-wrap gap-1.5 -mx-1 px-1 pb-1 sm:pb-0">
              {ACADEMIC_FACULTY_FILTERS.map((tab) => {
                const count =
                  tab.value === 'All'
                    ? departments.length
                    : departments.filter((d) => d.faculty === tab.value).length;
                const active = selectedFaculty === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => onSelectFaculty(tab.value)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-pust-900 text-white border border-pust-900'
                        : 'bg-[#FAF9F6] border border-stone-200 text-slate-800 hover:text-pust-900 hover:border-pust-700/50'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`font-mono text-[11px] tabular-nums ${
                        active ? 'text-gold-200' : 'text-slate-500'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2.5 w-full lg:w-auto shrink-0">
              <EditTriggerButton
                target={{ kind: 'department', department: null }}
                label="Add Department"
                icon="add"
                variant="compact"
              />

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={deptQuery}
                  onChange={(e) => onDeptQueryChange(e.target.value)}
                  placeholder="Search department, code, or chair..."
                  aria-label="Search departments"
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-stone-300 bg-[#FAF9F6] text-slate-950 focus:outline-none focus:border-pust-700 focus:bg-white"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-200/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <span className="font-mono tabular-nums">
              Showing <strong className="text-slate-950">{filteredDepartments.length}</strong> of{' '}
              <strong className="text-slate-950">{departments.length}</strong> academic departments
              {selectedFaculty !== 'All' ? ` in ${selectedFaculty}` : ''}
            </span>
            {(selectedFaculty !== 'All' || deptQuery.trim() !== '') && (
              <button
                type="button"
                onClick={() => {
                  onSelectFaculty('All');
                  onDeptQueryChange('');
                }}
                className="font-semibold text-pust-800 hover:underline cursor-pointer"
              >
                Show all departments
              </button>
            )}
          </div>
        </div>

        {loadingData ? (
          <CardsGridSkeleton count={6} />
        ) : dataError ? (
          <div className="p-6 rounded-2xl border border-red-200 bg-red-50 flex flex-wrap items-center justify-between gap-4 text-sm text-red-800">
            <span>{dataError}</span>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-pust-900 text-white hover:bg-pust-950 cursor-pointer"
              >
                Retry Loading
              </button>
            )}
          </div>
        ) : groupedFaculties.length === 0 ? (
          <div className="p-10 rounded-2xl border border-stone-200 bg-white text-center space-y-3">
            <p className="text-sm text-slate-700 text-center">
              No academic departments match your current search or faculty filter.
            </p>
            <button
              type="button"
              onClick={() => {
                onSelectFaculty('All');
                onDeptQueryChange('');
              }}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-pust-900 text-white hover:bg-pust-950 cursor-pointer"
            >
              Reset Department Filters
            </button>
          </div>
        ) : (
          <div ref={deptGroupsRef} className="space-y-12">
            {groupedFaculties.map(({ facultyName, depts }, facultyIdx) => {
              const groupTeachers = depts.reduce((sum, d) => sum + (d.facultyCount ?? 0), 0);
              const groupWorks = depts.reduce((sum, d) => sum + (d.researchTotal ?? 0), 0);
              const deanInfo = facultyDeansMap.get(facultyName as FacultyName);
              const facultyNumber = String(facultyIdx + 1).padStart(2, '0');

              return (
                <div key={facultyName} data-gsap-dept-group className="space-y-5">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 pb-3 border-b border-stone-300/80">
                    <div className="space-y-1">
                      <p className="font-mono text-xs font-semibold text-pust-800 tabular-nums text-left">
                        Faculty {facultyNumber}
                        {deanInfo?.dean ? ` · Dean: ${deanInfo.dean}` : ''}
                      </p>
                      <h2 className="font-serif text-2xl sm:text-[28px] font-semibold text-slate-950 tracking-tight text-left">
                        {facultyName}
                      </h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 shrink-0">
                      <p className="font-mono text-xs font-medium text-slate-600 tabular-nums">
                        {depts.length} {depts.length === 1 ? 'Department' : 'Departments'}
                        {groupTeachers > 0 ? ` · ${groupTeachers} Teachers` : ''}
                        {groupWorks > 0 ? ` · ${groupWorks.toLocaleString('en-US')} Research Works` : ''}
                      </p>
                      <Link
                        href="/academics/faculty"
                        className="text-xs font-semibold text-pust-900 hover:underline whitespace-nowrap"
                      >
                        Dean Profile →
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                    {depts.map((dept, idx) => {
                      const isOpening = openingDeptCode === dept.code;
                      const coverPhoto = resolveDepartmentImage(dept);
                      const deptSurface = getAlternatingDepartmentCardClass(facultyName, idx);
                      const degreePreview =
                        dept.degrees.length > 0 ? dept.degrees.slice(0, 3).join(' · ') : 'B.Sc.';

                      return (
                        <MotionCard
                          key={dept.id}
                          delay={(idx % 6) * 0.03}
                          className={`relative h-full text-left rounded-2xl border ${deptSurface} transition-colors flex flex-col justify-between overflow-hidden group ${
                            isOpening ? 'ring-2 ring-pust-800/45 border-pust-800' : ''
                          }`}
                        >
                          {isOpening && (
                            <div className="absolute inset-0 z-20 bg-white/85 flex items-center justify-center p-4 pointer-events-none">
                              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white border border-pust-800/30 shadow-md text-xs font-semibold text-pust-900">
                                <Loader2 className="w-4 h-4 animate-spin text-pust-800 shrink-0" />
                                <span>Loading {dept.code}...</span>
                              </div>
                            </div>
                          )}

                          <div className="absolute top-3 right-3 z-10">
                            <EditTriggerButton
                              target={{ kind: 'department', department: dept }}
                              label="Edit"
                              variant="overlay"
                            />
                          </div>

                          <Link
                            href={getDepartmentHref(dept)}
                            prefetch={true}
                            aria-busy={isOpening}
                            onMouseEnter={() => prefetchDepartment(dept)}
                            onFocus={() => prefetchDepartment(dept)}
                            onClick={() => onOpenDepartmentLink(dept)}
                            className="flex-1 flex flex-col justify-between rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-pust-800"
                          >
                            <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-stone-200/80 bg-[#F5F2EB]">
                              <ResilientImage
                                src={coverPhoto}
                                alt={`Department of ${dept.name}, PUST`}
                                containerClassName="w-full h-full m-0"
                                frameClassName="w-full h-full bg-[#F5F2EB]"
                                fallbackMinHeightClassName="min-h-0"
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                priority={facultyIdx === 0 && idx < 6}
                              />
                              <div
                                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/15 to-transparent"
                                aria-hidden="true"
                              />
                              <div className="pointer-events-none absolute inset-x-0 bottom-0 px-4 py-2.5 flex items-center justify-between gap-2 text-white">
                                <span className="font-mono text-[11px] font-semibold tracking-wider uppercase tabular-nums">
                                  {dept.officialCode ? `${dept.officialCode} · ` : ''}
                                  {dept.code}
                                </span>
                                {dept.established ? (
                                  <span className="font-mono text-[11px] text-gold-200/95 tabular-nums">
                                    Est. {dept.established}
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                              <div className="space-y-2">
                                <h3 className="font-serif text-lg sm:text-xl font-semibold text-slate-950 group-hover:text-pust-900 transition-colors leading-snug text-left">
                                  {dept.name}
                                </h3>
                                {dept.summary && (
                                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed text-left">
                                    {dept.summary}
                                  </p>
                                )}
                              </div>

                              <div className="pt-3 border-t border-stone-200/80 space-y-2 text-xs">
                                <div className="flex items-center justify-between gap-3 font-mono text-[11px] text-slate-600 tabular-nums">
                                  <span className="truncate">{degreePreview}</span>
                                  {dept.intakeSeats ? (
                                    <span className="shrink-0 text-slate-700">
                                      {dept.intakeSeats} Seats
                                    </span>
                                  ) : null}
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-slate-700 truncate">
                                    Chair:{' '}
                                    <span className="font-semibold text-slate-950">
                                      {dept.chairmanName}
                                    </span>
                                  </span>
                                  <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-pust-900 tabular-nums shrink-0">
                                    {isOpening
                                      ? 'Opening...'
                                      : dept.facultyCount
                                      ? `${dept.facultyCount} Teachers`
                                      : 'Explore'}
                                    {isOpening ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin text-pust-800" />
                                    ) : (
                                      <ArrowRight className="w-3.5 h-3.5 text-pust-800 transition-transform duration-200 group-hover:translate-x-0.5" />
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        </MotionCard>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Bottom Academic Services & Governance Gateway (Landing) */}
      {isLanding && (
        <MotionReveal>
          <section className="pt-4 space-y-4">
            <div className="border-b border-stone-200 pb-3">
              <p className="font-mono text-[11px] uppercase tracking-widest text-pust-800 font-semibold text-left">
                Academic Services &amp; Student Resources
              </p>
              <h2 className="font-serif text-2xl font-semibold text-slate-950 text-left">
                Essential Academic Pathways
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
              <div className="p-6 rounded-2xl border border-stone-200 bg-white flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-pust-800">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-wider">
                      Programs &amp; Ordinance
                    </span>
                    <Calculator className="w-4 h-4 shrink-0" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-slate-950 text-left">
                    Degrees, Credits &amp; CGPA Rules
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed text-left">
                    Review 4-year undergraduate, 5-year B.Arch., M.Sc./MBA credit requirements and compute semester SGPA/CGPA.
                  </p>
                </div>
                <div className="pt-3 border-t border-stone-200/80 flex flex-wrap gap-4 text-xs font-semibold">
                  <Link href="/academics/programs" className="text-pust-900 hover:underline">
                    Degree Programs →
                  </Link>
                  <Link
                    href="/governance/academic-ordinance#cgpa-calculator"
                    className="text-slate-700 hover:text-pust-900 hover:underline"
                  >
                    CGPA Calculator →
                  </Link>
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-stone-200 bg-[#FAF9F6] flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-pust-800">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-wider">
                      Schedules &amp; Aid
                    </span>
                    <CalendarDays className="w-4 h-4 shrink-0" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-slate-950 text-left">
                    Calendar, Forms &amp; Scholarships
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed text-left">
                    Inspect semester exam timelines, download official fillable forms, and review merit and UGC scholarship schemes.
                  </p>
                </div>
                <div className="pt-3 border-t border-stone-200/80 flex flex-wrap gap-4 text-xs font-semibold">
                  <Link href="/academics/calendar" className="text-pust-900 hover:underline">
                    Academic Calendar →
                  </Link>
                  <Link
                    href="/academics/forms-download"
                    className="text-slate-700 hover:text-pust-900 hover:underline"
                  >
                    Official Forms →
                  </Link>
                  <Link
                    href="/academics/scholarship"
                    className="text-slate-700 hover:text-pust-900 hover:underline"
                  >
                    Scholarships →
                  </Link>
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-stone-200 bg-white flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-pust-800">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-wider">
                      Research &amp; Intake
                    </span>
                    <Award className="w-4 h-4 shrink-0" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-slate-950 text-left">
                    Publications, Library &amp; Admissions
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed text-left">
                    Explore peer-reviewed journals, Central Library archives, upcoming seminars, and GST admission unit eligibility.
                  </p>
                </div>
                <div className="pt-3 border-t border-stone-200/80 flex flex-wrap gap-4 text-xs font-semibold">
                  <Link href="/academics/publications" className="text-pust-900 hover:underline">
                    Publications →
                  </Link>
                  <Link
                    href="/facilities/library"
                    className="text-slate-700 hover:text-pust-900 hover:underline"
                  >
                    Central Library →
                  </Link>
                  <Link
                    href="/admissions"
                    className="text-slate-700 hover:text-pust-900 hover:underline"
                  >
                    Admissions →
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </MotionReveal>
      )}
    </div>
  );
}
