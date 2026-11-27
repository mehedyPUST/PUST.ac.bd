'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
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
  UserRound,
  Users,
} from 'lucide-react';
import { pustApi } from '../lib/api';
import {
  findDepartmentPerson,
  getDepartmentPersonHref,
  type PersonRoleCategory,
  resolveDepartmentChairman,
  sanitizeTelHref,
} from '../lib/departmentPeople';
import { getDepartmentNotices } from '../lib/departmentNotices';
import type {
  DepartmentPersonGroup,
  DepartmentPersonRecord,
  DepartmentRecord,
} from '../types/pust';
import { EditTriggerButton } from './EditTriggerButton';
import { MotionCard } from './MotionPrimitives';
import { PersonThumbnail } from './PersonProfileView';
import { usePust } from './PustContext';

function PersonProfileCard({
  person,
  departmentCode,
  roleCategory,
  accentClass,
  delay = 0,
  canEdit = false,
  onEditPerson,
}: {
  person: DepartmentPersonRecord;
  departmentCode: string;
  roleCategory: PersonRoleCategory;
  accentClass: string;
  delay?: number;
  canEdit?: boolean;
  onEditPerson?: (person: DepartmentPersonRecord, roleCategory: PersonRoleCategory) => void;
}) {
  const hasPersonalInfo =
    Boolean(person.qualification) ||
    Boolean(person.researchArea) ||
    person.totalPublications !== undefined;

  const profileHref = getDepartmentPersonHref(departmentCode, person.id);

  return (
    <MotionCard
      delay={delay}
      className={`rounded-2xl border ${accentClass} p-5 sm:p-6 shadow-xs flex flex-col justify-between gap-5`}
    >
      <div className="space-y-4">
        {/* Identity Header with Small Framed Photo */}
        <div className="flex items-start gap-4">
          <PersonThumbnail person={person} roleCategory={roleCategory} size="sm" />
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-lg sm:text-xl font-medium text-slate-900 leading-snug">
              <Link href={profileHref} className="hover:text-pust-900 hover:underline underline-offset-4">
                {person.name}
              </Link>
            </h3>
            <p className="text-xs sm:text-sm font-medium text-pust-900 mt-0.5 leading-snug">
              {person.designation}
            </p>
            {person.onStudyLeave && (
              <p className="font-mono text-[11px] text-amber-800 mt-1">
                Status · On Study Leave
              </p>
            )}
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
                    href={`tel:${sanitizeTelHref(phone.value)}`}
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
                  <dd className="text-slate-800 sm:text-right leading-relaxed line-clamp-2">
                    {person.qualification}
                  </dd>
                </div>
              )}
              {person.researchArea && (
                <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-4">
                  <dt className="text-slate-500 shrink-0">Research Area</dt>
                  <dd className="text-slate-800 sm:text-right leading-relaxed line-clamp-2">
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

      {/* Card Footer Action: View Profile & Admin Edit */}
      <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2.5">
        <span className="font-mono text-[11px] text-slate-500 truncate">{roleCategory}</span>
        <div className="flex items-center gap-2 shrink-0">
          {canEdit && onEditPerson && (
            <EditTriggerButton
              label="Edit"
              variant="compact"
              onClick={() => onEditPerson(person, roleCategory)}
            />
          )}
          <Link
            href={profileHref}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-pust-800/30 text-pust-900 hover:bg-pust-900 hover:text-white hover:border-pust-900 transition-colors whitespace-nowrap shrink-0 shadow-xs"
          >
            <UserRound className="w-3.5 h-3.5 shrink-0" />
            View Profile
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
          </Link>
        </div>
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

  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedProfileId = searchParams.get('profile');
  const normalizedCode = code.trim().toUpperCase();
  const { data: queriedDepartment } = useQuery({
    queryKey: ['department', normalizedCode],
    queryFn: async () => {
      const res = await pustApi.getDepartmentByCode(normalizedCode);
      return res.department;
    },
    initialData: initialDepartment,
    staleTime: 5 * 60 * 1000,
  });

  const contextDept = departments.find((d) => d.code.toUpperCase() === normalizedCode);
  const department =
    contextDept && contextDept.facultyMembers !== undefined
      ? contextDept
      : queriedDepartment ?? initialDepartment ?? contextDept ?? null;

  const facultyMembers = useMemo(
    () => department?.facultyMembers ?? [],
    [department?.facultyMembers]
  );
  const contractualFaculty = useMemo(
    () => department?.contractualFacultyMembers ?? [],
    [department?.contractualFacultyMembers]
  );
  const officers = useMemo(() => department?.officers ?? [], [department?.officers]);

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
    () => (department ? getDepartmentNotices(notices, department.code) : []),
    [notices, department]
  );

  useEffect(() => {
    if (!department || !requestedProfileId) return;
    const found = findDepartmentPerson(department, requestedProfileId);
    if (found) {
      router.replace(getDepartmentPersonHref(department.code, found.person.id));
    }
  }, [department, requestedProfileId, router]);

  if (!department) {
    return (
      <main className="flex-1 bg-white">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 text-center space-y-4">
          <h1 className="font-serif text-3xl font-medium text-slate-900">Department Not Found</h1>
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
  const chairman = resolveDepartmentChairman(department);

  const isAdmin = user?.role === 'admin';
  const canAdminEdit = editMode && isAdmin;

  function roleCategoryToGroup(roleCategory: PersonRoleCategory): DepartmentPersonGroup {
    if (roleCategory === 'Chairman') return 'chairman';
    if (roleCategory === 'Faculty Member') return 'faculty';
    if (roleCategory === 'Faculty Member (Contractual)') return 'contractual';
    return 'officer';
  }

  function handleEditPerson(
    person: DepartmentPersonRecord | null,
    roleCategory: PersonRoleCategory
  ) {
    if (!department || !canAdminEdit) return;
    openEditModal({
      kind: 'department-person',
      department,
      group: roleCategoryToGroup(roleCategory),
      person,
    });
  }

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
              {canAdminEdit && (
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
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-pust-600">
              {department.officialCode ? `Dept Code ${department.officialCode} · ` : ''}
              {department.code} · {department.faculty}
            </p>
            <h1 className="font-serif text-fluid-h1 font-semibold text-slate-950 tracking-tight leading-tight">
              Department of {department.name}
            </h1>
            <p className="text-fluid-lead text-slate-700 leading-[1.72]">{department.summary}</p>
          </div>

          <nav
            aria-label="Department sections"
            className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-xs font-medium text-slate-600"
          >
            <a
              href="#departmental-notices"
              className="inline-flex items-center gap-1.5 font-semibold text-pust-900 hover:underline underline-offset-4"
            >
              Departmental Notices
              <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                ({deptNotices.length})
              </span>
            </a>
            <a
              href="#faculty-members"
              className="inline-flex items-center gap-1.5 hover:text-pust-900 hover:underline underline-offset-4"
            >
              Faculty Members
              <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                ({facultyMembers.length})
              </span>
            </a>
            <a
              href="#department-officers"
              className="inline-flex items-center gap-1.5 hover:text-pust-900 hover:underline underline-offset-4"
            >
              Officers
              <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                ({officers.length})
              </span>
            </a>
            <a
              href="#department-research"
              className="inline-flex items-center gap-1.5 hover:text-pust-900 hover:underline underline-offset-4"
            >
              Labs &amp; Research
            </a>
            {deptPublications.length > 0 && (
              <a
                href="#department-publications"
                className="inline-flex items-center gap-1.5 hover:text-pust-900 hover:underline underline-offset-4"
              >
                Publications
                <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                  ({deptPublications.length})
                </span>
              </a>
            )}
          </nav>
        </div>

        {/* Chairman & Department at a Glance */}
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-950">
              Teachers of Department of {department.name}
            </h2>
            <p className="font-mono text-xs font-medium text-slate-600 tabular-nums">
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
                departmentCode={department.code}
                roleCategory="Chairman"
                accentClass="bg-white border-stone-200 hover:border-pust-700/45 h-full"
                canEdit={canAdminEdit}
                onEditPerson={handleEditPerson}
              />
            </div>

            {/* Department at a Glance */}
            <div className="lg:col-span-5">
              <MotionCard
                delay={0.04}
                className="rounded-2xl border border-stone-200 bg-[#FAF9F6] p-5 sm:p-6 h-full flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-pust-800 shrink-0" />
                    <h3 className="font-mono text-xs uppercase tracking-widest font-semibold text-pust-800">
                      Department at a Glance
                    </h3>
                  </div>

                  <dl className="divide-y divide-stone-200 text-xs sm:text-[13px]">
                    {department.contactPhone && (
                      <div className="py-2.5 flex items-center justify-between gap-4">
                        <dt className="text-slate-700 font-medium">Contact</dt>
                        <dd className="font-mono font-semibold text-slate-950 tabular-nums text-right">
                          <a
                            href={`tel:${sanitizeTelHref(department.contactPhone)}`}
                            className="hover:text-pust-800 hover:underline"
                          >
                            {department.contactPhone}
                          </a>
                        </dd>
                      </div>
                    )}
                    {department.contactEmail && (
                      <div className="py-2.5 flex items-center justify-between gap-4">
                        <dt className="text-slate-700 font-medium">Email</dt>
                        <dd className="font-mono font-semibold text-lapis-800 text-right truncate">
                          <a
                            href={`mailto:${department.contactEmail}`}
                            className="hover:text-pust-800 hover:underline"
                          >
                            {department.contactEmail}
                          </a>
                        </dd>
                      </div>
                    )}
                    {(department.facultyCount !== undefined || facultyMembers.length > 0) && (
                      <div className="py-2.5 flex items-center justify-between gap-4">
                        <dt className="text-slate-700 font-medium">Total Teacher</dt>
                        <dd className="font-mono font-semibold text-pust-800 tabular-nums text-right">
                          {department.facultyCount ?? facultyMembers.length}
                        </dd>
                      </div>
                    )}
                    <div className="py-2.5 flex items-center justify-between gap-4">
                      <dt className="text-slate-700 font-medium">Established &amp; Code</dt>
                      <dd className="font-mono font-semibold text-slate-950 tabular-nums text-right">
                        {department.established}
                        {department.officialCode ? ` · Code ${department.officialCode}` : ''}
                      </dd>
                    </div>
                    <div className="py-2.5 flex items-center justify-between gap-4">
                      <dt className="text-slate-700 font-medium">Annual Intake</dt>
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
                          {department.researchTotal.toLocaleString('en-US')} Indexed Works
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </MotionCard>
            </div>
          </div>
        </div>

        {/* Departmental Notices */}
        <div
          id="departmental-notices"
          className="space-y-4 pt-4 border-t border-slate-200 scroll-mt-24"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-pust-800 shrink-0" />
                <p className="font-mono text-xs uppercase tracking-widest text-pust-800 font-semibold">
                  Official Department Circulars · {department.code}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-serif text-2xl sm:text-3xl font-medium text-slate-900">
                  Departmental Notices
                </h2>
                <span className="font-mono text-xs text-slate-500 tabular-nums">
                  ({deptNotices.length})
                </span>
                {canAdminEdit && (
                  <EditTriggerButton
                    icon="add"
                    label="Post Notice"
                    variant="compact"
                    onClick={() =>
                      openEditModal({
                        kind: 'notice',
                        notice: null,
                        defaultDepartmentCode: department.code,
                      })
                    }
                  />
                )}
              </div>
            </div>

            <Link
              href="/notices"
              className="inline-flex items-center gap-1 text-xs font-semibold text-pust-900 hover:underline underline-offset-4 whitespace-nowrap shrink-0"
            >
              All University Notices
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {deptNotices.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-[#F7F7F5] px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs sm:text-sm text-slate-600">
                No department-specific circulars are currently posted for the Department of{' '}
                {department.name}.
              </p>
              <Link
                href="/notices"
                className="inline-flex items-center gap-1 text-xs font-semibold text-pust-900 hover:underline underline-offset-4 whitespace-nowrap shrink-0"
              >
                Browse Central Notice Board
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-200 overflow-hidden shadow-xs">
              {deptNotices.map((notice) => (
                <div
                  key={notice.id}
                  className="flex flex-col sm:flex-row sm:items-stretch justify-between hover:bg-[#F9F9F7] transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setActiveNotice(notice)}
                    className="flex-1 min-w-0 text-left px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <p className="font-mono text-[11px] text-slate-500 tabular-nums flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="font-semibold text-slate-700">{notice.publishedAt}</span>
                        <span>·</span>
                        <span className="font-semibold text-pust-800">{notice.category}</span>
                        {notice.pinned && (
                          <>
                            <span>·</span>
                            <span className="uppercase tracking-wider font-semibold text-pust-900">
                              Pinned
                            </span>
                          </>
                        )}
                        {notice.visibility === 'registered' && (
                          <>
                            <span>·</span>
                            <span className="uppercase tracking-wider font-semibold text-amber-800">
                              Registered Portal
                            </span>
                          </>
                        )}
                        {notice.targetSession && (
                          <>
                            <span>·</span>
                            <span>Session {notice.targetSession}</span>
                          </>
                        )}
                        {notice.targetCourseCode && (
                          <>
                            <span>·</span>
                            <span>{notice.targetCourseCode}</span>
                          </>
                        )}
                      </p>
                      <h3 className="font-serif text-base sm:text-[17px] font-medium text-slate-950 group-hover:text-pust-900 transition-colors leading-snug">
                        {notice.title}
                      </h3>
                      <p className="text-xs sm:text-[13px] text-slate-600 line-clamp-2 leading-relaxed">
                        {notice.summary}
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 shrink-0">
                      <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                        {notice.referenceNo}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-pust-900 group-hover:translate-x-0.5 transition-transform">
                        Read Circular
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </button>

                  {canAdminEdit && (
                    <div className="flex items-center px-5 pb-4 sm:py-4 sm:pl-0 sm:pr-4 shrink-0">
                      <EditTriggerButton
                        variant="compact"
                        label="Edit"
                        onClick={() => openEditModal({ kind: 'notice', notice })}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Faculty Members */}
        <div id="faculty-members" className="space-y-6 pt-2 border-t border-slate-200 scroll-mt-24">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-lapis-800 shrink-0" />
                <p className="font-mono text-xs uppercase tracking-widest text-lapis-800 font-semibold">
                  Academic Roster
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-serif text-2xl sm:text-3xl font-medium text-slate-900">
                  Faculty Members
                </h2>
                {canAdminEdit && (
                  <EditTriggerButton
                    icon="add"
                    label="Add Teacher"
                    variant="compact"
                    onClick={() => handleEditPerson(null, 'Faculty Member')}
                  />
                )}
              </div>
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
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          designationFilter === roleOpt
                            ? 'bg-pust-900 border-pust-900 text-white'
                            : 'bg-[#F7F7F5] border-slate-200 text-slate-700 hover:border-pust-700/50 hover:text-pust-900'
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
            <div className="p-8 rounded-2xl border border-slate-200 bg-[#F7F7F5] text-sm text-slate-600 prose-justify">
              Individual faculty profiles for the Department of {department.name} have not been
              published yet.
              {department.facultyCount
                ? ` Departmental faculty strength: ${department.facultyCount} teachers.`
                : ''}
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
                  departmentCode={department.code}
                  roleCategory="Faculty Member"
                  delay={(idx % 6) * 0.03}
                  accentClass={
                    idx % 2 === 0
                      ? 'bg-white border-stone-200 hover:border-pust-700/45'
                      : 'bg-[#FAF9F6] border-stone-200 hover:border-pust-700/45'
                  }
                  canEdit={canAdminEdit}
                  onEditPerson={handleEditPerson}
                />
              ))}
            </div>
          )}
        </div>

        {/* Faculty Members (Contractual) */}
        <div className="space-y-4 pt-2 border-t border-stone-200">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <GraduationCap className="w-4 h-4 text-gold-700 shrink-0" />
              <h2 className="font-serif text-xl sm:text-2xl font-medium text-slate-900">
                Faculty Members (Contractual)
              </h2>
              {canAdminEdit && (
                <EditTriggerButton
                  icon="add"
                  label="Add Contractual"
                  variant="compact"
                  onClick={() => handleEditPerson(null, 'Faculty Member (Contractual)')}
                />
              )}
            </div>
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              {contractualFaculty.length} Listed
            </span>
          </div>

          {contractualFaculty.length === 0 ? (
            <div className="px-5 py-4 rounded-xl border border-stone-200 bg-[#FAF9F6] text-xs sm:text-sm text-slate-600 prose-justify">
              No contractual faculty members are currently listed for the Department of{' '}
              {department.name}.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {contractualFaculty.map((member, idx) => (
                <PersonProfileCard
                  key={member.id}
                  person={member}
                  departmentCode={department.code}
                  roleCategory="Faculty Member (Contractual)"
                  delay={idx * 0.03}
                  accentClass={
                    idx % 2 === 0
                      ? 'bg-white border-stone-200 hover:border-pust-700/45'
                      : 'bg-[#FAF9F6] border-stone-200 hover:border-pust-700/45'
                  }
                  canEdit={canAdminEdit}
                  onEditPerson={handleEditPerson}
                />
              ))}
            </div>
          )}
        </div>

        {/* Officers */}
        <div id="department-officers" className="space-y-4 pt-2 border-t border-stone-200 scroll-mt-24">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <UserCheck className="w-4 h-4 text-pust-800 shrink-0" />
              <h2 className="font-serif text-xl sm:text-2xl font-medium text-slate-900">
                Officers
              </h2>
              {canAdminEdit && (
                <EditTriggerButton
                  icon="add"
                  label="Add Officer"
                  variant="compact"
                  onClick={() => handleEditPerson(null, 'Department Officer')}
                />
              )}
            </div>
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              {officers.length} {officers.length === 1 ? 'Officer' : 'Officers'}
            </span>
          </div>

          {officers.length === 0 ? (
            <div className="px-5 py-4 rounded-xl border border-stone-200 bg-[#FAF9F6] text-xs sm:text-sm text-slate-600 prose-justify">
              No departmental administrative or technical officers have been published for the
              Department of {department.name} yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {officers.map((officer, idx) => (
                <PersonProfileCard
                  key={officer.id}
                  person={officer}
                  departmentCode={department.code}
                  roleCategory="Department Officer"
                  delay={idx * 0.03}
                  accentClass={
                    idx % 2 === 0
                      ? 'bg-white border-stone-200 hover:border-pust-700/45'
                      : 'bg-[#FAF9F6] border-stone-200 hover:border-pust-700/45'
                  }
                  canEdit={canAdminEdit}
                  onEditPerson={handleEditPerson}
                />
              ))}
            </div>
          )}
        </div>

        {/* Research Priorities & Academic Laboratories */}
        <div
          id="department-research"
          className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-stone-200 scroll-mt-24"
        >
          <div className="rounded-2xl border border-stone-200 bg-white p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pust-800 shrink-0" />
              <h2 className="font-mono text-xs uppercase tracking-widest font-semibold text-pust-900">
                Research Priorities
              </h2>
            </div>
            <ul className="space-y-2.5 text-sm text-slate-800 prose-justify">
              {department.researchFocus.map((topic) => (
                <li
                  key={topic}
                  className="pb-2.5 border-b border-stone-200 last:border-b-0 last:pb-0 leading-relaxed"
                >
                  {topic}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-[#FAF9F6] p-6 space-y-4">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-pust-800 shrink-0" />
              <h2 className="font-mono text-xs uppercase tracking-widest font-semibold text-pust-900">
                Academic Laboratories
              </h2>
            </div>
            <ul className="space-y-2.5 text-sm text-slate-800 prose-justify">
              {department.laboratories.map((lab) => (
                <li
                  key={lab}
                  className="pb-2.5 border-b border-stone-200 last:border-b-0 last:pb-0 leading-relaxed"
                >
                  {lab}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Departmental Publications */}
        {deptPublications.length > 0 && (
          <div
            id="department-publications"
            className="space-y-4 pt-4 border-t border-stone-200 scroll-mt-24"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-pust-800 shrink-0" />
              <h2 className="font-serif text-xl sm:text-2xl font-medium text-slate-900">
                Featured Research Output
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deptPublications.map((pub, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <div
                    key={pub.id}
                    className={`p-4 sm:p-5 rounded-2xl border border-stone-200 hover:border-pust-700/45 space-y-2 transition-colors ${
                      isEven ? 'bg-white' : 'bg-[#FAF9F6]'
                    }`}
                  >
                    <p className="font-mono text-[11px] font-semibold text-pust-800 text-left">
                      {pub.year} · {pub.domain}
                    </p>
                    <h3 className="font-serif text-base font-medium text-slate-900 leading-snug">
                      {pub.title}
                    </h3>
                    <p className="text-xs text-slate-600 text-left">{pub.authors}</p>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                      <span className="text-slate-600">{pub.venue}</span>
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
                );
              })}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
