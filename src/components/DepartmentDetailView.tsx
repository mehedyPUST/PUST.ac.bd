'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Bookmark,
  Building2,
  Check,
  FileText,
  FlaskConical,
  GraduationCap,
  Mail,
  Phone,
  Search,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react';
import type {
  DepartmentPersonRecord,
  DepartmentRecord,
} from '../types/pust';
import { EditTriggerButton } from './EditTriggerButton';
import { MotionCard } from './MotionPrimitives';
import { usePust } from './PustContext';

function getInitials(name: string): string {
  const cleaned = name
    .replace(/\b(Prof\.?|Dr\.?|Md\.?|Mst\.?|Engr\.?)\b/gi, '')
    .trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'PU';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function PersonProfileCard({
  person,
  accentClass,
  delay = 0,
}: {
  person: DepartmentPersonRecord;
  accentClass: string;
  delay?: number;
}) {
  const hasPersonalInfo =
    Boolean(person.qualification) ||
    Boolean(person.researchArea) ||
    person.totalPublications !== undefined;

  return (
    <MotionCard
      delay={delay}
      className={`rounded-2xl border ${accentClass} p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-5`}
    >
      <div className="space-y-4">
        {/* Identity Header */}
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-pust-900 text-white font-serif text-base font-semibold flex items-center justify-center shrink-0 shadow-xs">
            {getInitials(person.name)}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-lg sm:text-xl font-medium text-slate-900 leading-snug">
              {person.name}
            </h3>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-0.5">
              <p className="text-xs sm:text-sm font-medium text-pust-900">
                {person.designation}
              </p>
              {person.onStudyLeave && (
                <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                  Study Leave
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Contact Details */}
        {(person.phones.length > 0 || person.emails.length > 0) && (
          <div className="pt-3 border-t border-slate-200/80 space-y-2">
            <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
              Contact Details
            </p>
            <div className="space-y-1.5 text-xs sm:text-[13px]">
              {person.phones.map((phone, idx) => (
                <div key={`${phone.value}-${idx}`} className="flex items-center justify-between gap-3">
                  <a
                    href={`tel:${phone.value.replace(/\s+/g, '')}`}
                    className="inline-flex items-center gap-2 font-mono text-slate-800 hover:text-pust-900 hover:underline tabular-nums min-w-0 truncate"
                  >
                    <Phone className="w-3.5 h-3.5 text-pust-700 shrink-0" />
                    <span className="truncate">{phone.value}</span>
                  </a>
                  <span className="font-mono text-[11px] text-slate-500 shrink-0">
                    ({phone.type})
                  </span>
                </div>
              ))}
              {person.emails.map((email, idx) => (
                <div key={`${email.value}-${idx}`} className="flex items-center justify-between gap-3">
                  <a
                    href={`mailto:${email.value}`}
                    className="inline-flex items-center gap-2 font-mono text-slate-800 hover:text-pust-900 hover:underline min-w-0 truncate"
                  >
                    <Mail className="w-3.5 h-3.5 text-lapis-700 shrink-0" />
                    <span className="truncate">{email.value}</span>
                  </a>
                  <span className="font-mono text-[11px] text-slate-500 shrink-0">
                    ({email.type})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Personal Information */}
        {hasPersonalInfo && (
          <div className="pt-3 border-t border-slate-200/80 space-y-2">
            <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
              Personal Information
            </p>
            <dl className="space-y-1.5 text-xs sm:text-[13px]">
              {person.qualification && (
                <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-4">
                  <dt className="text-slate-500 shrink-0">Qualification</dt>
                  <dd className="text-slate-800 sm:text-right leading-relaxed">
                    {person.qualification}
                  </dd>
                </div>
              )}
              {person.researchArea && (
                <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-4">
                  <dt className="text-slate-500 shrink-0">Research Area</dt>
                  <dd className="text-slate-800 sm:text-right leading-relaxed">
                    {person.researchArea}
                  </dd>
                </div>
              )}
              {person.totalPublications !== undefined && (
                <div className="flex items-center justify-between gap-4 pt-1">
                  <dt className="text-slate-500">Total Publications</dt>
                  <dd className="font-mono font-semibold text-pust-900 tabular-nums">
                    {person.totalPublications}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>
    </MotionCard>
  );
}

export function DepartmentDetailView({
  code,
  initialDepartment,
}: {
  code: string;
  initialDepartment?: DepartmentRecord;
}) {
  const {
    departments,
    publications,
    notices,
    user,
    bookmarkedIds,
    editMode,
    openEditModal,
    navigateTo,
    setActiveNotice,
    loadBookmarks,
  } = usePust();

  const [designationFilter, setDesignationFilter] = useState<string>('All');
  const [memberQuery, setMemberQuery] = useState('');
  const [bookmarkBusy, setBookmarkBusy] = useState(false);

  const normalizedCode = code.trim().toUpperCase();
  const department =
    departments.find((d) => d.code.toUpperCase() === normalizedCode) ??
    initialDepartment ??
    null;

  const facultyMembers = useMemo(
    () => department?.facultyMembers ?? [],
    [department?.facultyMembers]
  );
  const contractualFaculty = useMemo(
    () => department?.contractualFacultyMembers ?? [],
    [department?.contractualFacultyMembers]
  );
  const officers = useMemo(
    () => department?.officers ?? [],
    [department?.officers]
  );

  const designationOptions = useMemo(() => {
    const base = new Set<string>(['All']);
    for (const member of facultyMembers) {
      if (member.designation.toLowerCase().includes('associate professor')) {
        base.add('Associate Professor');
      } else if (member.designation.toLowerCase().includes('assistant professor')) {
        base.add('Assistant Professor');
      } else if (member.designation.toLowerCase().includes('professor')) {
        base.add('Professor');
      } else if (member.designation.toLowerCase().includes('lecturer')) {
        base.add('Lecturer');
      }
    }
    return Array.from(base);
  }, [facultyMembers]);

  const filteredFaculty = useMemo(() => {
    const q = memberQuery.trim().toLowerCase();
    return facultyMembers.filter((member) => {
      const desig = member.designation.toLowerCase();
      const matchesRole =
        designationFilter === 'All' ||
        (designationFilter === 'Professor' &&
          desig.includes('professor') &&
          !desig.includes('associate') &&
          !desig.includes('assistant')) ||
        (designationFilter === 'Associate Professor' && desig.includes('associate professor')) ||
        (designationFilter === 'Assistant Professor' && desig.includes('assistant professor')) ||
        (designationFilter === 'Lecturer' && desig.includes('lecturer'));

      const matchesQ =
        !q ||
        member.name.toLowerCase().includes(q) ||
        member.designation.toLowerCase().includes(q) ||
        (member.researchArea || '').toLowerCase().includes(q) ||
        (member.qualification || '').toLowerCase().includes(q) ||
        member.emails.some((e) => e.value.toLowerCase().includes(q));

      return matchesRole && matchesQ;
    });
  }, [facultyMembers, designationFilter, memberQuery]);

  const deptPublications = useMemo(
    () =>
      department
        ? publications.filter((p) => p.departmentCode.toUpperCase() === department.code.toUpperCase())
        : [],
    [publications, department]
  );

  const deptNotices = useMemo(
    () =>
      department
        ? notices.filter((n) => n.departmentCode.toUpperCase() === department.code.toUpperCase())
        : [],
    [notices, department]
  );

  if (!department) {
    return (
      <main className="flex-1 bg-white">
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
          <h1 className="font-serif text-3xl font-medium text-slate-900">
            Department Not Found
          </h1>
          <p className="text-sm text-slate-600">
            The requested department record ({normalizedCode}) is unavailable.
          </p>
          <Link
            href="/academics/departments"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-pust-900 text-white hover:bg-pust-950"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Departments
          </Link>
        </section>
      </main>
    );
  }

  const isBookmarked = bookmarkedIds.has(department.id);
  const chairman: DepartmentPersonRecord = department.chairmanProfile ?? {
    id: `${department.id}-chair`,
    name: department.chairmanName,
    designation: 'Chairman',
    phones: department.contactPhone
      ? [{ value: department.contactPhone, type: 'Office' }]
      : [],
    emails: department.contactEmail
      ? [{ value: department.contactEmail, type: 'Office' }]
      : [],
  };

  async function handleToggleBookmark() {
    if (!department || bookmarkBusy) return;
    if (!user) {
      navigateTo('/portal');
      return;
    }
    setBookmarkBusy(true);
    try {
      const { pustApi } = await import('../lib/api');
      if (isBookmarked) {
        await pustApi.removeBookmark(department.id);
      } else {
        await pustApi.addBookmark({
          itemType: 'department',
          itemId: department.id,
          title: `Department of ${department.name} (${department.code})`,
          subtitle: department.faculty,
        });
      }
      await loadBookmarks();
    } finally {
      setBookmarkBusy(false);
    }
  }

  return (
    <main className="flex-1 bg-white">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 space-y-12">
        {/* Top Action & Header Band */}
        <div className="border-b border-slate-200 pb-8 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/academics/departments"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-pust-900 hover:underline underline-offset-4"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              All Academic Departments
            </Link>

            <div className="flex flex-wrap items-center gap-2.5">
              {editMode && user?.role === 'admin' && (
                <EditTriggerButton
                  onClick={() => openEditModal({ kind: 'department', department })}
                  label="Edit Department"
                  variant="compact"
                />
              )}
              <button
                type="button"
                disabled={bookmarkBusy}
                onClick={handleToggleBookmark}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-pust-800/35 bg-[#F7F7F5] text-pust-900 hover:bg-pust-900 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
              >
                {isBookmarked ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                {user
                  ? isBookmarked
                    ? 'Saved in Portal'
                    : 'Bookmark Department'
                  : 'Sign in to Bookmark'}
              </button>
            </div>
          </div>

          <div className="space-y-2.5 max-w-4xl">
            <p className="font-mono text-xs uppercase tracking-widest text-pust-800">
              {department.officialCode ? `Dept Code ${department.officialCode} · ` : ''}
              {department.code} · {department.faculty}
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-medium text-slate-900 tracking-tight leading-tight">
              Department of {department.name}
            </h1>
            <p className="text-base text-slate-600 leading-relaxed">
              {department.summary}
            </p>
          </div>
        </div>

        {/* Chairman & Department at a Glance */}
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <h2 className="font-serif text-2xl sm:text-3xl font-medium text-slate-900">
              Teachers of Department of {department.name}
            </h2>
            <p className="font-mono text-xs text-slate-600 tabular-nums">
              {department.facultyCount
                ? `Total Teacher: ${department.facultyCount}`
                : facultyMembers.length > 0
                ? `Total Teacher: ${facultyMembers.length}`
                : department.building}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Chairman Card */}
            <div className="lg:col-span-7 flex flex-col">
              <PersonProfileCard
                person={chairman}
                accentClass="card-gradient-crimson border-pust-200/90 h-full"
              />
            </div>

            {/* Department at a Glance */}
            <div className="lg:col-span-5">
              <MotionCard
                delay={0.04}
                className="rounded-2xl border border-slate-200 card-gradient-parchment p-5 sm:p-6 shadow-xs h-full flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-pust-800 shrink-0" />
                    <h3 className="font-mono text-xs uppercase tracking-widest font-semibold text-pust-800">
                      Department at a Glance
                    </h3>
                  </div>

                  <dl className="divide-y divide-slate-200/80 text-xs sm:text-[13px]">
                    {department.contactPhone && (
                      <div className="py-2.5 flex items-center justify-between gap-4">
                        <dt className="text-slate-600">Contact</dt>
                        <dd className="font-mono font-semibold text-slate-900 tabular-nums text-right">
                          <a
                            href={`tel:${department.contactPhone.replace(/\s+/g, '')}`}
                            className="hover:text-pust-900 hover:underline"
                          >
                            {department.contactPhone}
                          </a>
                        </dd>
                      </div>
                    )}
                    {department.contactEmail && (
                      <div className="py-2.5 flex items-center justify-between gap-4">
                        <dt className="text-slate-600">Email</dt>
                        <dd className="font-mono font-semibold text-lapis-900 text-right truncate">
                          <a
                            href={`mailto:${department.contactEmail}`}
                            className="hover:text-pust-900 hover:underline"
                          >
                            {department.contactEmail}
                          </a>
                        </dd>
                      </div>
                    )}
                    {(department.facultyCount !== undefined || facultyMembers.length > 0) && (
                      <div className="py-2.5 flex items-center justify-between gap-4">
                        <dt className="text-slate-600">Total Teacher</dt>
                        <dd className="font-mono font-semibold text-pust-900 tabular-nums text-right">
                          {department.facultyCount ?? facultyMembers.length}
                        </dd>
                      </div>
                    )}
                    <div className="py-2.5 flex items-center justify-between gap-4">
                      <dt className="text-slate-600">Established &amp; Code</dt>
                      <dd className="font-mono font-medium text-slate-900 tabular-nums text-right">
                        {department.established}
                        {department.officialCode ? ` · Code ${department.officialCode}` : ''}
                      </dd>
                    </div>
                    <div className="py-2.5 flex items-center justify-between gap-4">
                      <dt className="text-slate-600">Annual Intake</dt>
                      <dd className="font-mono font-medium text-slate-900 tabular-nums text-right">
                        {department.intakeSeats} Undergraduate Seats
                      </dd>
                    </div>
                    <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                      <dt className="text-slate-600 shrink-0">Degree Programs</dt>
                      <dd className="font-medium text-slate-900 sm:text-right">
                        {department.degrees.join(' · ')}
                      </dd>
                    </div>
                    <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                      <dt className="text-slate-600 shrink-0">Location</dt>
                      <dd className="font-medium text-slate-900 sm:text-right">
                        {department.building}, Rajapur Campus
                      </dd>
                    </div>
                    {department.researchTotal !== undefined && (
                      <div className="py-2.5 flex items-center justify-between gap-4">
                        <dt className="text-slate-600">Research Index</dt>
                        <dd className="font-mono font-semibold text-sage-800 tabular-nums text-right">
                          {department.researchTotal.toLocaleString()} Indexed Works
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </MotionCard>
            </div>
          </div>
        </div>

        {/* Faculty Members */}
        <div id="faculty-members" className="space-y-6 pt-2 border-t border-slate-200">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-lapis-800 shrink-0" />
                <p className="font-mono text-xs uppercase tracking-widest text-lapis-800 font-semibold">
                  Academic Roster
                </p>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-medium text-slate-900">
                Faculty Members
              </h2>
            </div>

            {facultyMembers.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {designationOptions.length > 2 && (
                  <div className="flex flex-wrap gap-1.5">
                    {designationOptions.map((roleOpt) => (
                      <button
                        key={roleOpt}
                        type="button"
                        onClick={() => setDesignationFilter(roleOpt)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          designationFilter === roleOpt
                            ? 'bg-pust-900 text-white'
                            : 'bg-[#F7F7F5] border border-slate-200 text-slate-700 hover:border-pust-700/50 hover:text-pust-900'
                        }`}
                      >
                        {roleOpt}
                      </button>
                    ))}
                  </div>
                )}

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={memberQuery}
                    onChange={(e) => setMemberQuery(e.target.value)}
                    placeholder="Filter by name or research..."
                    aria-label="Filter faculty members"
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-700 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {facultyMembers.length === 0 ? (
            <div className="p-8 rounded-2xl border border-slate-200 bg-[#F7F7F5] text-sm text-slate-600">
              Individual faculty profiles for the Department of {department.name} have not been
              published yet.
              {department.facultyCount ? ` Departmental faculty strength: ${department.facultyCount} teachers.` : ''}
            </div>
          ) : filteredFaculty.length === 0 ? (
            <div className="p-8 rounded-2xl border border-slate-200 bg-[#F7F7F5] text-center space-y-3">
              <p className="text-sm text-slate-700">
                No faculty members matched your current designation filter or search query.
              </p>
              <button
                type="button"
                onClick={() => {
                  setDesignationFilter('All');
                  setMemberQuery('');
                }}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-pust-900 text-white cursor-pointer"
              >
                Reset Faculty Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredFaculty.map((member, idx) => (
                <PersonProfileCard
                  key={member.id}
                  person={member}
                  delay={(idx % 6) * 0.03}
                  accentClass={
                    idx % 2 === 0
                      ? 'card-gradient-lapis border-lapis-200/80 hover:border-lapis-600/45'
                      : 'card-gradient-sage border-sage-200/80 hover:border-sage-600/45'
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Faculty Members (Contractual) */}
        <div className="space-y-4 pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-gold-700 shrink-0" />
              <h2 className="font-serif text-xl sm:text-2xl font-medium text-slate-900">
                Faculty Members (Contractual)
              </h2>
            </div>
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              {contractualFaculty.length} Listed
            </span>
          </div>

          {contractualFaculty.length === 0 ? (
            <div className="px-5 py-4 rounded-xl border border-slate-200 bg-[#F7F7F5] text-xs sm:text-sm text-slate-600">
              No contractual faculty members are currently listed for the Department of{' '}
              {department.name}.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {contractualFaculty.map((member, idx) => (
                <PersonProfileCard
                  key={member.id}
                  person={member}
                  delay={idx * 0.03}
                  accentClass="card-gradient-gold border-gold-200/80"
                />
              ))}
            </div>
          )}
        </div>

        {/* Officers */}
        <div className="space-y-4 pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-pust-800 shrink-0" />
              <h2 className="font-serif text-xl sm:text-2xl font-medium text-slate-900">
                Officers
              </h2>
            </div>
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              {officers.length} {officers.length === 1 ? 'Officer' : 'Officers'}
            </span>
          </div>

          {officers.length === 0 ? (
            <div className="px-5 py-4 rounded-xl border border-slate-200 bg-[#F7F7F5] text-xs sm:text-sm text-slate-600">
              No departmental administrative or technical officers have been published for the
              Department of {department.name} yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {officers.map((officer, idx) => (
                <PersonProfileCard
                  key={officer.id}
                  person={officer}
                  delay={idx * 0.03}
                  accentClass="card-gradient-parchment border-slate-200 hover:border-pust-600/40"
                />
              ))}
            </div>
          )}
        </div>

        {/* Research Priorities & Academic Laboratories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
          <div className="rounded-2xl border border-lapis-200/80 card-gradient-lapis p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-lapis-800 shrink-0" />
              <h2 className="font-mono text-xs uppercase tracking-widest font-semibold text-lapis-900">
                Research Priorities
              </h2>
            </div>
            <ul className="space-y-2.5 text-sm text-slate-800">
              {department.researchFocus.map((topic) => (
                <li
                  key={topic}
                  className="pb-2.5 border-b border-slate-200/70 last:border-b-0 last:pb-0 leading-relaxed"
                >
                  {topic}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-sage-200/80 card-gradient-sage p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-sage-800 shrink-0" />
              <h2 className="font-mono text-xs uppercase tracking-widest font-semibold text-sage-900">
                Academic Laboratories
              </h2>
            </div>
            <ul className="space-y-2.5 text-sm text-slate-800">
              {department.laboratories.map((lab) => (
                <li
                  key={lab}
                  className="pb-2.5 border-b border-slate-200/70 last:border-b-0 last:pb-0 leading-relaxed"
                >
                  {lab}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Departmental Publications & Notices */}
        {(deptPublications.length > 0 || deptNotices.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
            {deptPublications.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-pust-800 shrink-0" />
                  <h2 className="font-serif text-xl sm:text-2xl font-medium text-slate-900">
                    Featured Research Output
                  </h2>
                </div>
                <div className="space-y-3">
                  {deptPublications.map((pub) => (
                    <div
                      key={pub.id}
                      className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-[#F7F7F5] space-y-2"
                    >
                      <p className="font-mono text-[11px] text-pust-800">
                        {pub.year} · {pub.domain}
                      </p>
                      <h3 className="font-serif text-base font-medium text-slate-900 leading-snug">
                        {pub.title}
                      </h3>
                      <p className="text-xs text-slate-600">{pub.authors}</p>
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                        <span className="text-slate-500">{pub.venue}</span>
                        {pub.url && (
                          <a
                            href={pub.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-mono font-semibold text-pust-900 hover:underline"
                          >
                            DOI
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {deptNotices.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-pust-800 shrink-0" />
                  <h2 className="font-serif text-xl sm:text-2xl font-medium text-slate-900">
                    Departmental Notices
                  </h2>
                </div>
                <div className="space-y-3">
                  {deptNotices.map((notice) => (
                    <button
                      key={notice.id}
                      type="button"
                      onClick={() => setActiveNotice(notice)}
                      className="w-full text-left p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white hover:border-pust-700/60 hover:shadow-sm transition-all space-y-1.5 cursor-pointer"
                    >
                      <p className="font-mono text-[11px] text-slate-500 tabular-nums">
                        {notice.publishedAt} · {notice.referenceNo}
                      </p>
                      <h3 className="font-serif text-base font-medium text-slate-900 leading-snug">
                        {notice.title}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2">{notice.summary}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
