'use client';

import type { RefObject } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  Building2,
  GraduationCap,
  Loader2,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react';
import type { ResolvedUniversityContent } from '../lib/cmsDefaults';
import { resolveDepartmentImage } from '../lib/departmentMedia';
import type {
  DepartmentRecord,
  FacultyName,
  UniversityProfile,
} from '../types/pust';
import { EditTriggerButton } from './EditTriggerButton';
import { MotionCard, MotionReveal } from './MotionPrimitives';

const FACULTY_ORDER: FacultyName[] = [
  'Faculty of Engineering and Technology',
  'Faculty of Science',
  'Faculty of Business Studies',
  'Faculty of Humanities and Social Science',
  'Faculty of Life and Earth Science',
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
  loadingData?: boolean;
  dataError?: string | null;
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
  profile,
  resolved,
  selectedFaculty,
  onSelectFaculty,
  deptQuery,
  onDeptQueryChange,
  openingDeptCode,
  loadingData = false,
  dataError = null,
  onRetry,
  getDepartmentHref,
  prefetchDepartment,
  onOpenDepartmentLink,
  deptGroupsRef,
}: AcademicsShowcaseProps) {
  const facultiesPresent = FACULTY_ORDER.filter((f) =>
    departments.some((d) => d.faculty === f)
  );
  const displayFaculties = facultiesPresent.length > 0 ? facultiesPresent : FACULTY_ORDER;

  const groupedByFaculty = displayFaculties
    .map((faculty) => ({
      faculty,
      items: filteredDepartments.filter((d) => d.faculty === faculty),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="space-y-8">
      {isLanding && (
        <MotionReveal className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-stone-200 bg-white">
            <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
              Faculties
            </p>
            <p className="font-serif text-2xl font-medium text-pust-900 mt-1 tabular-nums">
              {profile?.facultiesCount ?? displayFaculties.length}
            </p>
          </div>
          <div className="p-4 rounded-xl border border-stone-200 bg-[#FAF9F6]">
            <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
              Departments
            </p>
            <p className="font-serif text-2xl font-medium text-pust-900 mt-1 tabular-nums">
              {departments.length || profile?.departmentsCount || 21}
            </p>
          </div>
          <div className="p-4 rounded-xl border border-stone-200 bg-white">
            <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
              Degree Levels
            </p>
            <p className="font-serif text-2xl font-medium text-pust-900 mt-1 tabular-nums">
              {resolved.academicExtras.degreePrograms.length}
            </p>
          </div>
          <div className="p-4 rounded-xl border border-stone-200 bg-[#FAF9F6]">
            <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
              Faculty Members
            </p>
            <p className="font-serif text-2xl font-medium text-pust-900 mt-1 tabular-nums">
              {profile?.facultyMembersCount ?? 185}+
            </p>
          </div>
        </MotionReveal>
      )}

      {/* Search & Faculty Filter Toolbar */}
      <div className="editable-region bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={deptQuery}
              onChange={(e) => onDeptQueryChange(e.target.value)}
              placeholder="Search department code, name, or chairman..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 bg-[#FAF9F6] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-700"
            />
          </div>
          <EditTriggerButton
            target={{ kind: 'department', department: null }}
            label="Add Department"
            variant="compact"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onSelectFaculty('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
              selectedFaculty === 'All'
                ? 'bg-pust-700 text-white border-pust-700'
                : 'bg-[#FAF9F6] text-slate-700 border-stone-200 hover:border-pust-700'
            }`}
          >
            All Faculties ({departments.length})
          </button>
          {displayFaculties.map((faculty) => {
            const shortLabel = faculty.replace(/^Faculty of\s+/i, '');
            const active = selectedFaculty === faculty;
            return (
              <button
                key={faculty}
                type="button"
                onClick={() => onSelectFaculty(faculty)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-pust-700 text-white border-pust-700'
                    : 'bg-[#FAF9F6] text-slate-700 border-stone-200 hover:border-pust-700'
                }`}
              >
                {shortLabel}
              </button>
            );
          })}
        </div>
      </div>

      {dataError && (
        <div className="p-5 rounded-2xl border border-red-200 bg-red-50 flex flex-wrap items-center justify-between gap-3 text-sm text-red-900">
          <span>{dataError}</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-red-300 text-red-900 hover:bg-red-100 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          )}
        </div>
      )}

      {loadingData && departments.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-56 rounded-2xl border border-stone-200 bg-white animate-pulse"
            />
          ))}
        </div>
      ) : groupedByFaculty.length === 0 ? (
        <div className="p-8 rounded-2xl border border-stone-200 bg-[#FAF9F6] text-center text-sm text-slate-600">
          No departments matched your filter criteria.
        </div>
      ) : (
        <div ref={deptGroupsRef} className="space-y-8">
          {groupedByFaculty.map((group) => (
            <section key={group.faculty} className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-2">
                <h2 className="font-serif text-xl sm:text-2xl font-medium text-slate-950">
                  {group.faculty}
                </h2>
                <span className="font-mono text-xs text-slate-500 tabular-nums">
                  {group.items.length} Department{group.items.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.items.map((dept, idx) => {
                  const href = getDepartmentHref(dept);
                  const cover = resolveDepartmentImage(dept);
                  const isOpening = openingDeptCode === dept.code;
                  const isEven = idx % 2 === 0;
                  return (
                    <MotionCard
                      key={dept.id}
                      delay={idx * 0.03}
                      className={`rounded-2xl border border-stone-200 hover:border-pust-700/50 transition-colors overflow-hidden flex flex-col justify-between ${
                        isEven ? 'bg-white' : 'bg-[#FAF9F6]'
                      }`}
                    >
                      <div>
                        <div className="h-32 w-full bg-stone-100 relative overflow-hidden">
                          <img
                            src={cover}
                            alt={`Department of ${dept.name}`}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent" />
                          <div className="absolute bottom-2.5 left-3.5 right-3.5 flex items-center justify-between gap-2">
                            <span className="font-mono text-xs font-semibold text-white tracking-wider">
                              {dept.code}
                            </span>
                            <span className="font-mono text-[11px] text-white/90 tabular-nums">
                              Est. {dept.established}
                            </span>
                          </div>
                        </div>

                        <div className="p-4 sm:p-5 space-y-2.5">
                          <h3 className="font-serif text-lg font-medium text-slate-950 leading-snug">
                            <Link
                              href={href}
                              onMouseEnter={() => prefetchDepartment(dept)}
                              onClick={() => onOpenDepartmentLink(dept)}
                              className="hover:text-pust-900 hover:underline underline-offset-4"
                            >
                              {dept.name}
                            </Link>
                          </h3>
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {dept.summary}
                          </p>
                          <div className="pt-2 border-t border-stone-200/80 space-y-1 text-xs text-slate-700">
                            <p className="flex items-center gap-1.5 truncate">
                              <Users className="w-3.5 h-3.5 text-pust-700 shrink-0" />
                              <span className="truncate">Chair: {dept.chairmanName}</span>
                            </p>
                            <p className="flex items-center gap-1.5 truncate">
                              <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span className="truncate">{dept.building}</span>
                            </p>
                            <p className="flex items-center gap-1.5 font-mono text-[11px] text-slate-600 tabular-nums">
                              <GraduationCap className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>
                                Intake {dept.intakeSeats} · {dept.degrees.join(', ')}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="px-4 sm:px-5 pb-4 flex items-center justify-between gap-2">
                        <EditTriggerButton
                          target={{ kind: 'department', department: dept }}
                          label="Edit"
                          variant="compact"
                        />
                        <Link
                          href={href}
                          onMouseEnter={() => prefetchDepartment(dept)}
                          onClick={() => onOpenDepartmentLink(dept)}
                          className="ml-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-pust-700/35 text-pust-800 hover:bg-pust-700 hover:text-white hover:border-pust-700 transition-colors whitespace-nowrap"
                        >
                          {isOpening ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Opening...
                            </>
                          ) : (
                            <>
                              Department Portal
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </Link>
                      </div>
                    </MotionCard>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
