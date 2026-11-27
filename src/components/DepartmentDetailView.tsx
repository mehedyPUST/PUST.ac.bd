'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Bookmark,
  Building2,
  Calculator,
  Calendar,
  Check,
  Clock,
  Compass,
  Copy,
  FileText,
  FlaskConical,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  QrCode,
  Search,
  Sparkles,
  Target,
  UserCheck,
  UserRound,
  Users,
} from 'lucide-react';
import { pustApi } from '../lib/api';
import { resolveDepartmentImage } from '../lib/departmentMedia';
import { getDepartmentNotices } from '../lib/departmentNotices';
import {
  findDepartmentPerson,
  getDepartmentPersonHref,
  type PersonRoleCategory,
  resolveDepartmentChairman,
  sanitizeTelHref,
} from '../lib/departmentPeople';
import type {
  DepartmentPersonGroup,
  DepartmentPersonRecord,
  DepartmentRecord,
} from '../types/pust';
import { EditTriggerButton } from './EditTriggerButton';
import { MotionCard, MotionReveal, SubPagePanel } from './MotionPrimitives';
import { PersonProfileModal } from './PersonProfileModal';
import { PersonThumbnail } from './PersonProfileView';
import { usePust } from './PustContext';
import { ResilientImage } from './ResilientImage';
import { ShareProfileModal } from './ShareProfileModal';

type DepartmentTab =
  | 'overview'
  | 'faculty'
  | 'officers'
  | 'research'
  | 'notices'
  | 'contact';

function buildDepartmentVision(dept: DepartmentRecord): string {
  const focusLead =
    dept.researchFocus[0] || `pure and applied scholarship in ${dept.name}`;
  return `To advance as a nationally recognized center of academic distinction and discovery in ${dept.name}, preparing analytical graduates and researchers to lead scientific, technological, and societal progress across Bangladesh and beyond—anchored by ${focusLead.toLowerCase()}.`;
}

function buildDepartmentMission(dept: DepartmentRecord): string[] {
  const focusSummary =
    dept.researchFocus.slice(0, 2).join(' and ') ||
    `fundamental and applied investigations in ${dept.name}`;
  return [
    `Deliver outcome-based undergraduate and postgraduate instruction across ${dept.degrees.join(', ')} under the PUST Academic Ordinance.`,
    `Strengthen laboratory experimentation and computational inquiry in ${focusSummary.toLowerCase()}.`,
    `Foster collaborative research publications, industry engagement, and ethical scholarly mentorship within the ${dept.faculty}.`,
  ];
}

function buildChairmanMessage(
  dept: DepartmentRecord,
  chairmanName: string
): string[] {
  const focusHighlights = dept.researchFocus.slice(0, 3).join(', ');
  return [
    `Welcome to the Department of ${dept.name} at Pabna University of Science and Technology. Since its establishment in ${dept.established} under the ${dept.faculty}, the department has remained committed to rigorous academic instruction, experimental inquiry, and student mentorship.`,
    `Operating from the ${dept.building} at our Rajapur campus, our faculty and technical staff guide students through structured degree pathways (${dept.degrees.join(', ')}) supported by ${dept.laboratories.length} dedicated academic laboratories${focusHighlights ? ` and active research in ${focusHighlights}` : ''}. We warmly invite prospective students, visiting scholars, and research collaborators to explore our academic programs, publications, and departmental initiatives.`,
    `— ${chairmanName}, Chairman, Department of ${dept.name}`,
  ];
}

function PersonProfileCard({
  person,
  departmentCode,
  roleCategory,
  accentClass,
  delay = 0,
  canEdit = false,
  onViewPerson,
  onEditPerson,
  onSharePerson,
}: {
  person: DepartmentPersonRecord;
  departmentCode: string;
  roleCategory: PersonRoleCategory;
  accentClass: string;
  delay?: number;
  canEdit?: boolean;
  onViewPerson?: (person: DepartmentPersonRecord, roleCategory: PersonRoleCategory) => void;
  onEditPerson?: (person: DepartmentPersonRecord, roleCategory: PersonRoleCategory) => void;
  onSharePerson?: (person: DepartmentPersonRecord, roleCategory: PersonRoleCategory) => void;
}) {
  const hasPersonalInfo =
    Boolean(person.qualification) ||
    Boolean(person.researchArea) ||
    person.totalPublications !== undefined;

  const profileHref = getDepartmentPersonHref(departmentCode, person.id);

  return (
    <MotionCard
      delay={delay}
      className={`rounded-2xl border ${accentClass} p-5 sm:p-6 flex flex-col justify-between gap-5`}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <PersonThumbnail person={person} roleCategory={roleCategory} size="sm" />
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-lg sm:text-xl font-medium text-slate-900 leading-snug">
              {onViewPerson ? (
                <button
                  type="button"
                  onClick={() => onViewPerson(person, roleCategory)}
                  className="text-left hover:text-pust-900 hover:underline underline-offset-4 cursor-pointer"
                >
                  {person.name}
                </button>
              ) : (
                <Link
                  href={profileHref}
                  className="hover:text-pust-900 hover:underline underline-offset-4"
                >
                  {person.name}
                </Link>
              )}
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

        {hasPersonalInfo && (
          <div className="pt-3 border-t border-slate-200/80 space-y-2">
            <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
              Academic &amp; Research Snapshot
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
          {onSharePerson && (
            <button
              type="button"
              onClick={() => onSharePerson(person, roleCategory)}
              aria-label={`Share ${person.name} profile QR code`}
              title="Share Profile & Save Contact QR"
              className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium bg-[#FAF8F4] border border-stone-300 text-slate-800 hover:border-pust-800 hover:text-pust-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Share</span>
            </button>
          )}
          {onViewPerson ? (
            <button
              type="button"
              onClick={() => onViewPerson(person, roleCategory)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-pust-800/30 text-pust-900 hover:bg-pust-900 hover:text-white hover:border-pust-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <UserRound className="w-3.5 h-3.5 shrink-0" />
              View Profile
              <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          ) : (
            <Link
              href={profileHref}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-pust-800/30 text-pust-900 hover:bg-pust-900 hover:text-white hover:border-pust-900 transition-colors whitespace-nowrap shrink-0"
            >
              <UserRound className="w-3.5 h-3.5 shrink-0" />
              View Profile
              <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
            </Link>
          )}
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

  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedProfileId = searchParams.get('profile');
  const requestedTab = searchParams.get('tab') as DepartmentTab | null;

  const [activeTab, setActiveTab] = useState<DepartmentTab>('overview');
  const [designationFilter, setDesignationFilter] = useState<string>('All');
  const [memberQuery, setMemberQuery] = useState('');
  const [noticeQuery, setNoticeQuery] = useState('');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);
  const [profileModalTarget, setProfileModalTarget] = useState<{
    person: DepartmentPersonRecord;
    roleCategory: PersonRoleCategory;
  } | null>(null);
  const [shareTarget, setShareTarget] = useState<{
    person: DepartmentPersonRecord;
    roleCategory: PersonRoleCategory;
  } | null>(null);

  useEffect(() => {
    if (
      requestedTab &&
      (['overview', 'faculty', 'officers', 'research', 'notices', 'contact'] as const).includes(
        requestedTab
      )
    ) {
      setActiveTab(requestedTab);
    }
  }, [requestedTab]);

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
      const desig = member.designation.toLowerCase();
      if (desig.includes('associate professor')) {
        base.add('Associate Professor');
      } else if (desig.includes('assistant professor')) {
        base.add('Assistant Professor');
      } else if (desig.includes('professor')) {
        base.add('Professor');
      } else if (desig.includes('lecturer')) {
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

  const filteredNotices = useMemo(() => {
    const q = noticeQuery.trim().toLowerCase();
    if (!q) return deptNotices;
    return deptNotices.filter((n) =>
      `${n.title} ${n.summary} ${n.referenceNo} ${n.category}`.toLowerCase().includes(q)
    );
  }, [deptNotices, noticeQuery]);

  useEffect(() => {
    if (!department || !requestedProfileId) return;
    const found = findDepartmentPerson(department, requestedProfileId);
    if (found) {
      router.replace(getDepartmentPersonHref(department.code, found.person.id));
    }
  }, [department, requestedProfileId, router]);

  if (!department) {
    return (
      <main className="flex-1 bg-[#F9F8F5]">
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
  const coverPhoto = resolveDepartmentImage(department);
  const isAdmin = user?.role === 'admin';
  const canAdminEdit = editMode && isAdmin;

  const visionStatement = buildDepartmentVision(department);
  const missionPoints = buildDepartmentMission(department);
  const chairmanMessageParagraphs = buildChairmanMessage(department, chairman.name);
  const teacherTotal = department.facultyCount ?? facultyMembers.length;
  const totalRosterCount = facultyMembers.length + contractualFaculty.length;

  const departmentTabs: Array<{ id: DepartmentTab; label: string; count?: number }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'faculty', label: 'Faculty Members', count: totalRosterCount },
    { id: 'officers', label: 'Officers & Staff', count: officers.length },
    { id: 'research', label: 'Programs & Research' },
    { id: 'notices', label: 'Notice Board', count: deptNotices.length },
    { id: 'contact', label: 'Contact & Location' },
  ];

  function switchDepartmentTab(nextTab: DepartmentTab) {
    setActiveTab(nextTab);
    if (typeof document !== 'undefined') {
      document
        .getElementById('dept-subnav')
        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

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

  async function handleCopyDeptEmail(email: string) {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(true);
      window.setTimeout(() => setCopiedEmail(false), 1800);
    } catch {
      // Clipboard blocked in restricted context
    }
  }

  async function handleToggleBookmark() {
    if (!department || bookmarkBusy) return;
    if (!user) {
      navigateTo('/portal');
      return;
    }
    setBookmarkBusy(true);
    try {
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
    <main className="flex-1 bg-[#F9F8F5]">
      {/* 1. Architectural Departmental Hero Cover Banner */}
      <header className="relative bg-pust-950 text-white overflow-hidden border-b border-gold-500/35">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <ResilientImage
            src={coverPhoto}
            alt={`Department of ${department.name}, Pabna University of Science and Technology`}
            containerClassName="w-full h-full m-0"
            frameClassName="w-full h-full bg-pust-950"
            fallbackMinHeightClassName="min-h-0"
            className="w-full h-full object-cover opacity-45"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#190203]/95 via-[#2B0406]/82 to-[#190203]/68" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-14 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/academics/departments"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold-200 hover:text-white hover:underline underline-offset-4 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              All Academic Departments
            </Link>

            <div className="flex flex-wrap items-center gap-2.5">
              {canAdminEdit && (
                <EditTriggerButton
                  onClick={() => openEditModal({ kind: 'department', department })}
                  label="Edit Department"
                  variant="dark"
                />
              )}
              <button
                type="button"
                disabled={bookmarkBusy}
                onClick={handleToggleBookmark}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-white/25 bg-white/10 text-white hover:bg-white hover:text-pust-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
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

          <div className="max-w-4xl space-y-3">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-gold-300 font-semibold">
              {department.faculty}
              <span aria-hidden="true"> · </span>
              {department.officialCode ? `Dept Code ${department.officialCode}` : department.code}
              <span aria-hidden="true"> · </span>
              Established {department.established}
            </p>
            <h1 className="font-serif text-fluid-h1 font-semibold text-white tracking-tight leading-tight text-balance">
              Department of {department.name}
            </h1>
            <p className="text-sm sm:text-base text-stone-100/95 leading-relaxed max-w-3xl">
              {department.summary}
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-stone-200 font-mono tabular-nums">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gold-300 shrink-0" />
              {department.building}, Rajapur Campus
            </span>
            {department.contactPhone && (
              <a
                href={`tel:${sanitizeTelHref(department.contactPhone)}`}
                className="inline-flex items-center gap-1.5 hover:text-gold-300 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-gold-300 shrink-0" />
                {department.contactPhone}
              </a>
            )}
            {department.contactEmail && (
              <a
                href={`mailto:${department.contactEmail}`}
                className="inline-flex items-center gap-1.5 hover:text-gold-300 transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-gold-300 shrink-0" />
                {department.contactEmail}
              </a>
            )}
          </div>
        </div>
      </header>

      {/* 2. Full-Width 4-Column Departmental Key Fact Ribbon */}
      <div className="bg-white border-b border-stone-200">
        <dl className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-200">
          <div className="py-4 pr-4 sm:px-5 first:sm:pl-0">
            <dt className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
              Established
            </dt>
            <dd className="font-serif text-xl sm:text-2xl font-semibold text-slate-950 tabular-nums mt-0.5">
              {department.established}
            </dd>
            <p className="font-mono text-[11px] text-pust-800 mt-0.5 tabular-nums">
              {department.officialCode ? `Code ${department.officialCode} · ` : ''}
              {department.code}
            </p>
          </div>

          <div className="py-4 pl-4 sm:px-5">
            <dt className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
              Academic Personnel
            </dt>
            <dd className="font-serif text-xl sm:text-2xl font-semibold text-slate-950 tabular-nums mt-0.5">
              {teacherTotal} Teachers
            </dd>
            <p className="font-mono text-[11px] text-lapis-800 mt-0.5 tabular-nums">
              {officers.length} Departmental {officers.length === 1 ? 'Officer' : 'Officers'}
            </p>
          </div>

          <div className="py-4 pr-4 sm:px-5">
            <dt className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
              Undergraduate Intake
            </dt>
            <dd className="font-serif text-xl sm:text-2xl font-semibold text-slate-950 tabular-nums mt-0.5">
              {department.intakeSeats} Seats
            </dd>
            <p className="font-mono text-[11px] text-slate-600 mt-0.5 truncate">
              {department.degrees.join(' · ')}
            </p>
          </div>

          <div className="py-4 pl-4 sm:px-5">
            <dt className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
              Research &amp; Laboratories
            </dt>
            <dd className="font-serif text-xl sm:text-2xl font-semibold text-slate-950 tabular-nums mt-0.5">
              {department.researchTotal !== undefined
                ? `${department.researchTotal.toLocaleString('en-US')} Works`
                : `${deptPublications.length} Indexed`}
            </dd>
            <p className="font-mono text-[11px] text-sage-800 mt-0.5 tabular-nums">
              {department.laboratories.length} Academic Laboratories
            </p>
          </div>
        </dl>
      </div>

      {/* 3. Departmental Sub-Navigation Menu (DUET Microsite Style) */}
      <div id="dept-subnav" className="bg-[#FAF8F4] border-b border-stone-200 scroll-mt-20">
        <nav
          aria-label={`${department.name} departmental sections`}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center overflow-x-auto no-scrollbar gap-1.5 py-3"
        >
          {departmentTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => switchDepartmentTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-pust-900 text-white shadow-2xs'
                    : 'bg-white border border-stone-200 text-slate-800 hover:border-pust-700/50 hover:text-pust-900'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`font-mono text-[11px] tabular-nums ${
                      isActive ? 'text-gold-200' : 'text-slate-500'
                    }`}
                  >
                    ({tab.count})
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 4. Active Departmental Sub-Page Stage */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
        <SubPagePanel subKey={activeTab} className="space-y-12">
          {activeTab === 'overview' && (
            <>
              {/* DUET-Style 8/4 Split: Chairman Message + Vision/Mission (Left) & Notice Board + Glance (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-8 space-y-8">
                  {/* Message from the Chairman */}
                  <MotionReveal className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
                    <div className="px-6 py-4 bg-[#FAF9F6] border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <UserRound className="w-4 h-4 text-pust-800 shrink-0" />
                        <p className="font-mono text-xs uppercase tracking-widest font-semibold text-pust-800">
                          From the Chairman&apos;s Desk
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {canAdminEdit && (
                          <EditTriggerButton
                            label="Edit Chairman"
                            variant="compact"
                            onClick={() => handleEditPerson(chairman, 'Chairman')}
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => setShareTarget({ person: chairman, roleCategory: 'Chairman' })}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white border border-stone-300 text-slate-800 hover:border-pust-800 hover:text-pust-900 transition-colors cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          Share QR
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setProfileModalTarget({ person: chairman, roleCategory: 'Chairman' })
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-pust-900 text-white hover:bg-pust-950 transition-colors cursor-pointer"
                        >
                          Chairman Profile
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-6 sm:p-7 space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-5 pb-5 border-b border-stone-200">
                        <PersonThumbnail person={chairman} roleCategory="Chairman" size="lg" />
                        <div className="min-w-0 space-y-1">
                          <h2 className="font-serif text-xl sm:text-2xl font-semibold text-slate-950 leading-snug">
                            <button
                              type="button"
                              onClick={() =>
                                setProfileModalTarget({ person: chairman, roleCategory: 'Chairman' })
                              }
                              className="text-left hover:text-pust-900 hover:underline underline-offset-4 cursor-pointer"
                            >
                              {chairman.name}
                            </button>
                          </h2>
                          <p className="text-sm font-medium text-pust-900">{chairman.designation}</p>
                          {chairman.qualification && (
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {chairman.qualification}
                            </p>
                          )}
                          <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-slate-700 tabular-nums">
                            {chairman.emails[0] && (
                              <a
                                href={`mailto:${chairman.emails[0].value}`}
                                className="inline-flex items-center gap-1.5 text-lapis-900 hover:text-pust-900 hover:underline"
                              >
                                <Mail className="w-3.5 h-3.5 shrink-0" />
                                {chairman.emails[0].value}
                              </a>
                            )}
                            {chairman.phones[0] && (
                              <a
                                href={`tel:${sanitizeTelHref(chairman.phones[0].value)}`}
                                className="inline-flex items-center gap-1.5 hover:text-pust-900 hover:underline"
                              >
                                <Phone className="w-3.5 h-3.5 text-pust-700 shrink-0" />
                                {chairman.phones[0].value}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3.5">
                        <h3 className="font-serif text-lg font-medium text-slate-950">
                          Message from the Chairman
                        </h3>
                        {chairmanMessageParagraphs.map((para, idx) => (
                          <p
                            key={idx}
                            className={`text-sm sm:text-[15px] leading-[1.76] prose-justify ${
                              idx === chairmanMessageParagraphs.length - 1
                                ? 'font-serif italic font-medium text-pust-900 pt-1'
                                : 'text-slate-700'
                            }`}
                          >
                            {para}
                          </p>
                        ))}
                      </div>
                    </div>
                  </MotionReveal>

                  {/* About & Vision / Mission */}
                  <MotionReveal className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-7 space-y-6">
                    <div className="pb-3 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-mono text-xs uppercase tracking-widest font-semibold text-lapis-800">
                          Departmental Mandate &amp; Academic Scope
                        </p>
                        <h2 className="font-serif text-2xl font-semibold text-slate-950 mt-0.5">
                          About Department of {department.name}
                        </h2>
                      </div>
                      <span className="font-mono text-xs text-slate-500 tabular-nums">
                        Est. {department.established}
                      </span>
                    </div>

                    <p className="flow-root prose-justify text-[15px] leading-[1.78] text-slate-800 first-letter:font-serif first-letter:text-5xl first-letter:font-semibold first-letter:float-left first-letter:mr-3 first-letter:leading-[0.86] first-letter:text-pust-800">
                      {department.summary} Operating within the {department.faculty} at Pabna
                      University of Science and Technology, the department integrates structured
                      classroom instruction, laboratory experimentation, and supervised thesis
                      research across {department.degrees.join(', ')}.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 items-stretch">
                      <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] p-5 space-y-2.5 flex flex-col">
                        <div className="flex items-center gap-2 text-pust-800">
                          <Compass className="w-4 h-4 shrink-0" />
                          <h3 className="font-mono text-xs uppercase tracking-widest font-semibold">
                            Vision
                          </h3>
                        </div>
                        <p className="text-xs sm:text-[13.5px] text-slate-700 leading-relaxed prose-justify">
                          {visionStatement}
                        </p>
                      </div>

                      <div className="rounded-xl border border-lapis-200/80 bg-[#F3F6FA] p-5 space-y-2.5 flex flex-col">
                        <div className="flex items-center gap-2 text-lapis-800">
                          <Target className="w-4 h-4 shrink-0" />
                          <h3 className="font-mono text-xs uppercase tracking-widest font-semibold">
                            Mission
                          </h3>
                        </div>
                        <ul className="space-y-2 text-xs sm:text-[13.5px] text-slate-700 leading-relaxed list-disc pl-4 prose-justify">
                          {missionPoints.map((point, idx) => (
                            <li key={idx}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </MotionReveal>
                </div>

                {/* Right Sidebar: Departmental Notice Board + Department at a Glance + Quick Portal Links */}
                <aside className="lg:col-span-4 space-y-6">
                  {/* Signature Right-Rail Notice Board */}
                  <MotionReveal className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
                    <div className="px-5 py-3.5 bg-pust-950 text-white flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gold-300 shrink-0" />
                        <h2 className="font-serif text-base font-medium">Notice Board</h2>
                      </div>
                      <span className="font-mono text-[11px] text-gold-200 tabular-nums">
                        {deptNotices.length} {deptNotices.length === 1 ? 'Circular' : 'Circulars'}
                      </span>
                    </div>

                    {canAdminEdit && (
                      <div className="px-5 py-2.5 bg-[#FAF9F6] border-b border-stone-200 flex justify-end">
                        <EditTriggerButton
                          icon="add"
                          label="Post Department Notice"
                          variant="compact"
                          onClick={() =>
                            openEditModal({
                              kind: 'notice',
                              notice: null,
                              defaultDepartmentCode: department.code,
                            })
                          }
                        />
                      </div>
                    )}

                    {deptNotices.length === 0 ? (
                      <div className="p-5 text-xs text-slate-600 leading-relaxed">
                        No active notices are currently published under {department.code}.
                      </div>
                    ) : (
                      <div className="divide-y divide-stone-200">
                        {deptNotices.slice(0, 5).map((notice) => (
                          <button
                            key={notice.id}
                            type="button"
                            onClick={() => setActiveNotice(notice)}
                            className="w-full text-left px-5 py-3.5 hover:bg-[#FAF8F4] transition-colors space-y-1 cursor-pointer group"
                          >
                            <p className="font-mono text-[11px] text-pust-800 tabular-nums">
                              {notice.publishedAt} · {notice.category}
                            </p>
                            <h3 className="font-serif text-sm font-medium text-slate-900 group-hover:text-pust-900 leading-snug line-clamp-2">
                              {notice.title}
                            </h3>
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="px-5 py-3 bg-[#FAF9F6] border-t border-stone-200 flex items-center justify-between gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => switchDepartmentTab('notices')}
                        className="font-semibold text-pust-900 hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        All Dept Notices
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <Link
                        href="/notices"
                        className="font-medium text-slate-600 hover:text-pust-900 hover:underline"
                      >
                        Central Board
                      </Link>
                    </div>
                  </MotionReveal>

                  {/* Department Contact & Quick Directory */}
                  <MotionReveal
                    delay={0.05}
                    className="rounded-2xl border border-stone-200 bg-white p-5 space-y-4"
                  >
                    <div className="flex items-center gap-2 pb-2.5 border-b border-stone-200">
                      <Building2 className="w-4 h-4 text-pust-800 shrink-0" />
                      <h2 className="font-mono text-xs uppercase tracking-widest font-semibold text-pust-800">
                        Department Office
                      </h2>
                    </div>

                    <dl className="divide-y divide-stone-200 text-xs">
                      <div className="py-2.5 flex justify-between gap-3">
                        <dt className="text-slate-600">Location</dt>
                        <dd className="font-medium text-slate-900 text-right">
                          {department.building}, Rajapur
                        </dd>
                      </div>
                      {department.contactPhone && (
                        <div className="py-2.5 flex justify-between gap-3">
                          <dt className="text-slate-600">Office Phone</dt>
                          <dd className="font-mono font-semibold text-slate-900 tabular-nums text-right">
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
                        <div className="py-2.5 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <dt className="text-slate-600">Office Email</dt>
                            <button
                              type="button"
                              onClick={() => handleCopyDeptEmail(department.contactEmail!)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-stone-200 bg-[#FAF9F6] text-[10px] font-medium text-slate-700 hover:border-pust-800 cursor-pointer"
                            >
                              {copiedEmail ? (
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
                          </div>
                          <dd className="font-mono font-semibold text-lapis-900 break-all">
                            <a
                              href={`mailto:${department.contactEmail}`}
                              className="hover:text-pust-900 hover:underline"
                            >
                              {department.contactEmail}
                            </a>
                          </dd>
                        </div>
                      )}
                      <div className="py-2.5 flex justify-between gap-3">
                        <dt className="text-slate-600">Degrees Offered</dt>
                        <dd className="font-medium text-slate-900 text-right">
                          {department.degrees.join(' · ')}
                        </dd>
                      </div>
                    </dl>

                    <div className="pt-2 space-y-2">
                      <button
                        type="button"
                        onClick={() => switchDepartmentTab('faculty')}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAF8F4] border border-stone-200 hover:border-pust-700/50 text-xs font-semibold text-slate-900 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <span>Faculty Directory ({totalRosterCount})</span>
                        <ArrowRight className="w-3.5 h-3.5 text-pust-800" />
                      </button>
                      <button
                        type="button"
                        onClick={() => switchDepartmentTab('officers')}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAF8F4] border border-stone-200 hover:border-pust-700/50 text-xs font-semibold text-slate-900 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <span>Officers &amp; Technical Staff ({officers.length})</span>
                        <ArrowRight className="w-3.5 h-3.5 text-pust-800" />
                      </button>
                      <button
                        type="button"
                        onClick={() => switchDepartmentTab('research')}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-[#FAF8F4] border border-stone-200 hover:border-pust-700/50 text-xs font-semibold text-slate-900 flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <span>Laboratories &amp; Research ({department.laboratories.length})</span>
                        <ArrowRight className="w-3.5 h-3.5 text-pust-800" />
                      </button>
                    </div>
                  </MotionReveal>
                </aside>
              </div>

              {/* Faculty Spotlight Preview on Overview */}
              <div className="space-y-5 pt-4 border-t border-stone-200">
                <MotionReveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-widest font-semibold text-lapis-800">
                      Academic Faculty Spotlight
                    </p>
                    <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-950 mt-0.5">
                      Teachers of Department of {department.name}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => switchDepartmentTab('faculty')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-pust-900 text-white hover:bg-pust-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-auto"
                  >
                    Browse All {totalRosterCount} Faculty Members
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </MotionReveal>

                {facultyMembers.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-stone-200 bg-white text-sm text-slate-600">
                    Individual faculty profiles for the Department of {department.name} will appear
                    here once published. Departmental strength: {teacherTotal} teachers.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {facultyMembers.slice(0, 4).map((member, idx) => (
                      <PersonProfileCard
                        key={member.id}
                        person={member}
                        departmentCode={department.code}
                        roleCategory="Faculty Member"
                        delay={idx * 0.04}
                        accentClass={
                          idx % 2 === 0
                            ? 'bg-white border-stone-200 hover:border-pust-700/45'
                            : 'bg-[#FAF9F6] border-stone-200 hover:border-pust-700/45'
                        }
                        canEdit={canAdminEdit}
                        onViewPerson={(person, roleCategory) =>
                          setProfileModalTarget({ person, roleCategory })
                        }
                        onEditPerson={handleEditPerson}
                        onSharePerson={(person, roleCategory) =>
                          setShareTarget({ person, roleCategory })
                        }
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Research Focus & Laboratories Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-stone-200 items-stretch">
                <MotionCard
                  delay={0}
                  className="rounded-2xl border border-stone-200 bg-white p-6 space-y-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-pust-800 shrink-0" />
                      <h2 className="font-mono text-xs uppercase tracking-widest font-semibold text-pust-900">
                        Research Priorities
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => switchDepartmentTab('research')}
                      className="text-xs font-semibold text-pust-800 hover:underline cursor-pointer"
                    >
                      Details →
                    </button>
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
                </MotionCard>

                <MotionCard
                  delay={0.05}
                  className="rounded-2xl border border-lapis-200/80 bg-[#F3F6FA] p-6 space-y-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FlaskConical className="w-4 h-4 text-lapis-800 shrink-0" />
                      <h2 className="font-mono text-xs uppercase tracking-widest font-semibold text-lapis-900">
                        Academic Laboratories
                      </h2>
                    </div>
                    <span className="font-mono text-[11px] text-lapis-800 tabular-nums">
                      {department.laboratories.length} Labs
                    </span>
                  </div>
                  <ul className="space-y-2.5 text-sm text-slate-800 prose-justify">
                    {department.laboratories.map((lab) => (
                      <li
                        key={lab}
                        className="pb-2.5 border-b border-lapis-200/60 last:border-b-0 last:pb-0 leading-relaxed"
                      >
                        {lab}
                      </li>
                    ))}
                  </ul>
                </MotionCard>
              </div>
            </>
          )}

          {activeTab === 'faculty' && (
            <div className="space-y-10">
              {/* Chairman Feature Row */}
              <div className="space-y-4">
                <MotionReveal className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-widest font-semibold text-pust-800">
                      Department Leadership
                    </p>
                    <h2 className="font-serif text-2xl font-semibold text-slate-950 mt-0.5">
                      Chairman of the Department
                    </h2>
                  </div>
                  {canAdminEdit && (
                    <EditTriggerButton
                      label="Edit Chairman"
                      variant="compact"
                      onClick={() => handleEditPerson(chairman, 'Chairman')}
                    />
                  )}
                </MotionReveal>

                <PersonProfileCard
                  person={chairman}
                  departmentCode={department.code}
                  roleCategory="Chairman"
                  accentClass="bg-white border-stone-200 hover:border-pust-700/45"
                  canEdit={canAdminEdit}
                  onViewPerson={(person, roleCategory) =>
                    setProfileModalTarget({ person, roleCategory })
                  }
                  onEditPerson={handleEditPerson}
                  onSharePerson={(person, roleCategory) => setShareTarget({ person, roleCategory })}
                />
              </div>

              {/* Regular Faculty Roster with Search & Designation Filters */}
              <div className="space-y-6 pt-4 border-t border-stone-200">
                <MotionReveal className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
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
                      <span className="font-mono text-xs text-slate-500 tabular-nums">
                        ({filteredFaculty.length} of {facultyMembers.length})
                      </span>
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
                                  : 'bg-white border-stone-200 text-slate-700 hover:border-pust-700/50 hover:text-pust-900'
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
                          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-300 bg-white focus:border-pust-700 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </MotionReveal>

                {facultyMembers.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-stone-200 bg-white text-sm text-slate-600 prose-justify">
                    Individual faculty profiles for the Department of {department.name} have not been
                    published yet.
                    {department.facultyCount
                      ? ` Departmental faculty strength: ${department.facultyCount} teachers.`
                      : ''}
                  </div>
                ) : filteredFaculty.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-stone-200 bg-white text-center space-y-3">
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
                        onViewPerson={(person, roleCategory) =>
                          setProfileModalTarget({ person, roleCategory })
                        }
                        onEditPerson={handleEditPerson}
                        onSharePerson={(person, roleCategory) =>
                          setShareTarget({ person, roleCategory })
                        }
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Contractual Faculty */}
              <div className="space-y-4 pt-4 border-t border-stone-200">
                <MotionReveal className="flex flex-wrap items-center justify-between gap-2">
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
                </MotionReveal>

                {contractualFaculty.length === 0 ? (
                  <div className="px-5 py-4 rounded-xl border border-stone-200 bg-white text-xs sm:text-sm text-slate-600 prose-justify">
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
                        onViewPerson={(person, roleCategory) =>
                          setProfileModalTarget({ person, roleCategory })
                        }
                        onEditPerson={handleEditPerson}
                        onSharePerson={(person, roleCategory) =>
                          setShareTarget({ person, roleCategory })
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'officers' && (
            <div className="space-y-6">
              <MotionReveal className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-200">
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest font-semibold text-pust-800">
                    Departmental Administration &amp; Laboratory Support
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-0.5">
                    <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-950">
                      Officers &amp; Technical Staff
                    </h2>
                    <span className="font-mono text-xs text-slate-500 tabular-nums">
                      ({officers.length})
                    </span>
                    {canAdminEdit && (
                      <EditTriggerButton
                        icon="add"
                        label="Add Officer"
                        variant="compact"
                        onClick={() => handleEditPerson(null, 'Department Officer')}
                      />
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => switchDepartmentTab('faculty')}
                  className="text-xs font-semibold text-pust-800 hover:underline cursor-pointer"
                >
                  View Faculty Members →
                </button>
              </MotionReveal>

              {officers.length === 0 ? (
                <div className="px-6 py-8 rounded-2xl border border-stone-200 bg-white text-sm text-slate-600 prose-justify">
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
                      delay={idx * 0.04}
                      accentClass={
                        idx % 2 === 0
                          ? 'bg-white border-stone-200 hover:border-pust-700/45'
                          : 'bg-[#FAF9F6] border-stone-200 hover:border-pust-700/45'
                      }
                      canEdit={canAdminEdit}
                      onViewPerson={(person, roleCategory) =>
                        setProfileModalTarget({ person, roleCategory })
                      }
                      onEditPerson={handleEditPerson}
                      onSharePerson={(person, roleCategory) =>
                        setShareTarget({ person, roleCategory })
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'research' && (
            <div className="space-y-10">
              {/* Academic Degree Programs & Academic Tools */}
              <MotionReveal className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-7 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-widest font-semibold text-pust-800">
                      Degree Pathways · {department.faculty}
                    </p>
                    <h2 className="font-serif text-2xl font-semibold text-slate-950 mt-0.5">
                      Academic Programs &amp; Curriculum
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href="/governance/academic-ordinance#cgpa-calculator"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-pust-800/30 bg-[#FAF8F4] text-pust-900 hover:bg-pust-900 hover:text-white transition-colors"
                    >
                      <Calculator className="w-3.5 h-3.5" />
                      SGPA / CGPA Calculator
                    </Link>
                    <Link
                      href="/academics/calendar"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-stone-300 bg-white text-slate-800 hover:border-pust-800 hover:text-pust-900 transition-colors"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Academic Calendar
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {department.degrees.map((degree, idx) => (
                    <div
                      key={degree}
                      className={`rounded-xl border p-4 space-y-1.5 ${
                        idx % 2 === 0
                          ? 'bg-[#FAF9F6] border-stone-200'
                          : 'bg-[#F3F6FA] border-lapis-200/80'
                      }`}
                    >
                      <p className="font-mono text-[11px] uppercase tracking-wider font-semibold text-pust-800">
                        Program Track {String(idx + 1).padStart(2, '0')}
                      </p>
                      <h3 className="font-serif text-lg font-semibold text-slate-950">{degree}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {idx === 0
                          ? `Undergraduate admission via GST Merit Cluster (${department.intakeSeats} annual intake seats).`
                          : 'Postgraduate research & coursework governed by PUST Academic Council regulations.'}
                      </p>
                    </div>
                  ))}
                </div>
              </MotionReveal>

              {/* Research Priorities & Academic Laboratories */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                <MotionCard
                  delay={0}
                  className="rounded-2xl border border-stone-200 bg-white p-6 space-y-4"
                >
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
                </MotionCard>

                <MotionCard
                  delay={0.05}
                  className="rounded-2xl border border-lapis-200/80 bg-[#F3F6FA] p-6 space-y-4"
                >
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-lapis-800 shrink-0" />
                    <h2 className="font-mono text-xs uppercase tracking-widest font-semibold text-lapis-900">
                      Academic Laboratories
                    </h2>
                  </div>
                  <ul className="space-y-2.5 text-sm text-slate-800 prose-justify">
                    {department.laboratories.map((lab) => (
                      <li
                        key={lab}
                        className="pb-2.5 border-b border-lapis-200/60 last:border-b-0 last:pb-0 leading-relaxed"
                      >
                        {lab}
                      </li>
                    ))}
                  </ul>
                </MotionCard>
              </div>

              {/* Departmental Publications */}
              <div className="space-y-4 pt-4 border-t border-stone-200">
                <MotionReveal className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-pust-800 shrink-0" />
                    <h2 className="font-serif text-2xl font-medium text-slate-900">
                      Featured Research Output ({deptPublications.length})
                    </h2>
                  </div>
                  <Link
                    href="/academics/publications"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-pust-900 hover:underline"
                  >
                    Central Publications Index
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </MotionReveal>

                {deptPublications.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-stone-200 bg-white text-sm text-slate-600">
                    Individual indexed publications can be browsed inside each faculty member&apos;s
                    dossier or in the central PUST research archive.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {deptPublications.map((pub, idx) => (
                      <MotionCard
                        key={pub.id}
                        delay={(idx % 4) * 0.04}
                        className={`p-4 sm:p-5 rounded-2xl border transition-colors space-y-2 ${
                          idx % 2 === 0
                            ? 'bg-white border-stone-200 hover:border-pust-700/45'
                            : 'bg-[#F3F6FA] border-lapis-200/80 hover:border-lapis-600/50'
                        }`}
                      >
                        <p
                          className={`font-mono text-[11px] font-semibold text-left ${
                            idx % 2 === 0 ? 'text-pust-800' : 'text-lapis-800'
                          }`}
                        >
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
                      </MotionCard>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'notices' && (
            <div className="space-y-5">
              <MotionReveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-stone-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-pust-800 shrink-0" />
                    <p className="font-mono text-xs uppercase tracking-widest text-pust-800 font-semibold">
                      Official Department Circulars · {department.code}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-serif text-2xl sm:text-3xl font-medium text-slate-900">
                      Departmental Notice Board
                    </h2>
                    <span className="font-mono text-xs text-slate-500 tabular-nums">
                      ({filteredNotices.length})
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

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="search"
                      value={noticeQuery}
                      onChange={(e) => setNoticeQuery(e.target.value)}
                      placeholder="Search circulars or memo..."
                      aria-label="Search departmental notices"
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-300 bg-white focus:border-pust-700 focus:outline-none"
                    />
                  </div>
                  <Link
                    href="/notices"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-pust-900 hover:underline underline-offset-4 whitespace-nowrap shrink-0"
                  >
                    All University Notices
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </MotionReveal>

              {filteredNotices.length === 0 ? (
                <div className="rounded-2xl border border-stone-200 bg-white px-6 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-sm text-slate-600">
                    {noticeQuery.trim()
                      ? 'No departmental circulars matched your search query.'
                      : `No department-specific circulars are currently posted for the Department of ${department.name}.`}
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
                <MotionReveal className="rounded-2xl border border-stone-200 bg-white divide-y divide-stone-200 overflow-hidden">
                  {filteredNotices.map((notice) => (
                    <div
                      key={notice.id}
                      className="flex flex-col sm:flex-row sm:items-stretch justify-between hover:bg-[#FAF9F6] transition-colors"
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
                </MotionReveal>
              )}
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <MotionReveal className="lg:col-span-7 rounded-2xl border border-stone-200 bg-white p-6 sm:p-7 space-y-5">
                <div className="pb-3 border-b border-stone-200">
                  <p className="font-mono text-xs uppercase tracking-widest font-semibold text-pust-800">
                    Official Address &amp; Correspondence
                  </p>
                  <h2 className="font-serif text-2xl font-semibold text-slate-950 mt-0.5">
                    Contact Department of {department.name}
                  </h2>
                </div>

                <dl className="divide-y divide-stone-200 text-sm">
                  <div className="py-3.5 flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                    <dt className="text-slate-600 font-medium inline-flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-pust-800 shrink-0" />
                      Department Office
                    </dt>
                    <dd className="text-slate-950 font-medium sm:text-right">
                      {department.building}, Pabna University of Science and Technology, Rajapur,
                      Pabna-6600
                    </dd>
                  </div>

                  <div className="py-3.5 flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                    <dt className="text-slate-600 font-medium inline-flex items-center gap-2">
                      <UserRound className="w-4 h-4 text-pust-800 shrink-0" />
                      Chairman
                    </dt>
                    <dd className="sm:text-right">
                      <button
                        type="button"
                        onClick={() =>
                          setProfileModalTarget({ person: chairman, roleCategory: 'Chairman' })
                        }
                        className="font-semibold text-pust-900 hover:underline cursor-pointer"
                      >
                        {chairman.name}
                      </button>
                    </dd>
                  </div>

                  {department.contactPhone && (
                    <div className="py-3.5 flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                      <dt className="text-slate-600 font-medium inline-flex items-center gap-2">
                        <Phone className="w-4 h-4 text-pust-800 shrink-0" />
                        Telephone / PABX
                      </dt>
                      <dd className="font-mono font-semibold text-slate-950 tabular-nums sm:text-right">
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
                    <div className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                      <dt className="text-slate-600 font-medium inline-flex items-center gap-2">
                        <Mail className="w-4 h-4 text-lapis-800 shrink-0" />
                        Official Email
                      </dt>
                      <dd className="flex flex-wrap items-center gap-2 font-mono font-semibold text-lapis-900">
                        <a
                          href={`mailto:${department.contactEmail}`}
                          className="hover:text-pust-900 hover:underline break-all"
                        >
                          {department.contactEmail}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopyDeptEmail(department.contactEmail!)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-stone-200 bg-[#FAF9F6] text-xs font-sans font-medium text-slate-700 hover:border-pust-800 cursor-pointer"
                        >
                          {copiedEmail ? (
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
                      </dd>
                    </div>
                  )}

                  <div className="py-3.5 flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                    <dt className="text-slate-600 font-medium inline-flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                      Office Hours
                    </dt>
                    <dd className="font-mono text-slate-800 tabular-nums sm:text-right">
                      Sunday – Thursday · 09:00 AM – 05:00 PM
                    </dd>
                  </div>
                </dl>
              </MotionReveal>

              <MotionReveal
                delay={0.08}
                className="lg:col-span-5 rounded-2xl border border-lapis-200/80 bg-[#F3F6FA] p-6 sm:p-7 space-y-4"
              >
                <p className="font-mono text-xs uppercase tracking-widest font-semibold text-lapis-800">
                  Student &amp; Academic Services
                </p>
                <h3 className="font-serif text-xl font-semibold text-slate-950">
                  Quick University Links
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  Submit an admission inquiry, download prescribed university forms, verify issued
                  academic documents, or access the PUST Digital Campus Portal.
                </p>

                <div className="space-y-2.5 pt-1">
                  <Link
                    href="/admissions/undergraduate#admission-inquiry-form"
                    className="w-full px-4 py-2.5 rounded-lg bg-white border border-lapis-200/80 hover:border-pust-700 text-xs font-semibold text-slate-900 flex items-center justify-between transition-colors"
                  >
                    <span>Admission Inquiry Desk</span>
                    <ArrowRight className="w-3.5 h-3.5 text-pust-800" />
                  </Link>
                  <Link
                    href="/academics/forms-download"
                    className="w-full px-4 py-2.5 rounded-lg bg-white border border-lapis-200/80 hover:border-pust-700 text-xs font-semibold text-slate-900 flex items-center justify-between transition-colors"
                  >
                    <span>Academic &amp; Exam Forms Download</span>
                    <ArrowRight className="w-3.5 h-3.5 text-pust-800" />
                  </Link>
                  <Link
                    href="/verify"
                    className="w-full px-4 py-2.5 rounded-lg bg-white border border-lapis-200/80 hover:border-pust-700 text-xs font-semibold text-slate-900 flex items-center justify-between transition-colors"
                  >
                    <span>Certificate &amp; Receipt Verification</span>
                    <ArrowRight className="w-3.5 h-3.5 text-pust-800" />
                  </Link>
                  <Link
                    href="/portal"
                    className="w-full px-4 py-2.5 rounded-lg bg-pust-900 text-white hover:bg-pust-950 text-xs font-semibold flex items-center justify-between transition-colors"
                  >
                    <span>Open Digital Campus Portal</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </MotionReveal>
            </div>
          )}
        </SubPagePanel>
      </section>

      {profileModalTarget && (
        <PersonProfileModal
          open={true}
          onClose={() => setProfileModalTarget(null)}
          person={profileModalTarget.person}
          department={department}
          roleCategory={profileModalTarget.roleCategory}
          publications={publications}
          canEdit={canAdminEdit}
          onEditPerson={handleEditPerson}
          onSharePerson={(person, roleCategory) => setShareTarget({ person, roleCategory })}
        />
      )}

      {shareTarget && (
        <ShareProfileModal
          open={true}
          onClose={() => setShareTarget(null)}
          person={shareTarget.person}
          department={department}
          roleCategory={shareTarget.roleCategory}
        />
      )}
    </main>
  );
}
