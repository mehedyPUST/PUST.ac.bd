import {
  Award,
  BookOpen,
  Building2,
  ClipboardCheck,
  FileCheck2,
  GraduationCap,
  LayoutDashboard,
  ScrollText,
  Settings2,
  UserCheck,
  UserCog,
  Users,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import type { RoleAssignment, UserRole } from '../../types/pust';

export type PortalTab =
  | 'overview'
  | 'profile'
  | 'users'
  | 'audit'
  | 'students'
  | 'approvals'
  | 'workflow'
  | 'library'
  | 'halls'
  | 'exams'
  | 'certificates'
  | 'governance';

export const VALID_PORTAL_TABS: PortalTab[] = [
  'overview',
  'profile',
  'users',
  'audit',
  'students',
  'approvals',
  'workflow',
  'library',
  'halls',
  'exams',
  'certificates',
  'governance',
];

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'University Admin Office',
  registrar: 'Office of the Registrar',
  vc: 'Vice-Chancellor Office',
  chairman: 'Department Chairman',
  teacher: 'Faculty / Teacher',
  student: 'Student Portal',
  proctor: 'Proctor Office',
  library: 'Central Library Office',
  hall: 'Residential Hall Provost',
  dean: 'Dean of Faculty',
  advisor: 'Student Advisor',
};

export interface PortalTabItem {
  id: PortalTab;
  label: string;
  desc: string;
  icon: LucideIcon;
  /** Short label when the tab comes from an additional appointment (not primary role). */
  sourceBadge?: string;
}

function isAppointmentInForce(a: RoleAssignment, now = Date.now()): boolean {
  if (a.status === 'ended') return false;
  const from = a.effectiveFrom ? new Date(a.effectiveFrom).getTime() : 0;
  if (!Number.isNaN(from) && from > now) return false;
  if (a.effectiveUntil) {
    const until = new Date(a.effectiveUntil).getTime();
    if (!Number.isNaN(until) && until < now) return false;
  }
  return true;
}

/** Active additional appointment roles for portal navigation. */
export function getEffectiveAdditionalRoles(
  additionalRoles?: RoleAssignment[] | null
): UserRole[] {
  if (!additionalRoles?.length) return [];
  const roles = new Set<UserRole>();
  for (const a of additionalRoles) {
    if (isAppointmentInForce(a)) roles.add(a.role);
  }
  return Array.from(roles);
}

export function userHasPortalRole(
  user: { role: UserRole; additionalRoles?: RoleAssignment[] | null },
  ...roles: UserRole[]
): boolean {
  if (roles.includes(user.role)) return true;
  return getEffectiveAdditionalRoles(user.additionalRoles).some((r) => roles.includes(r));
}

/** Compact badge text for an appointment role in the sidebar. */
export function appointmentBadgeLabel(
  role: UserRole,
  appt?: RoleAssignment | null
): string {
  const scope =
    appt?.scopeCode ||
    (appt?.scopeName ? appt.scopeName.replace(/\s+/g, ' ').slice(0, 18) : '') ||
    '';
  switch (role) {
    case 'chairman':
      return scope ? `Chair · ${scope}` : 'Chairman';
    case 'hall':
      return scope ? `Provost · ${scope}` : 'Hall Provost';
    case 'proctor':
      return 'Proctor';
    case 'dean':
      return scope ? `Dean · ${scope}` : 'Dean';
    case 'advisor':
      return 'Advisor';
    case 'library':
      return 'Library';
    case 'registrar':
      return 'Registrar';
    case 'vc':
      return 'VC Office';
    case 'admin':
      return 'Admin';
    case 'teacher':
      return 'Faculty';
    default:
      return ROLE_LABELS[role] || role;
  }
}

function mergePortalTabs(base: PortalTabItem[], extra: PortalTabItem[]): PortalTabItem[] {
  const byId = new Map<PortalTab, PortalTabItem>();
  for (const tab of base) byId.set(tab.id, tab);
  for (const tab of extra) {
    if (!byId.has(tab.id)) byId.set(tab.id, tab);
  }
  const order: PortalTab[] = [
    'overview',
    'profile',
    'users',
    'students',
    'approvals',
    'exams',
    'library',
    'halls',
    'certificates',
    'workflow',
    'governance',
    'audit',
  ];
  const merged: PortalTabItem[] = [];
  for (const id of order) {
    const t = byId.get(id);
    if (t) merged.push(t);
  }
  for (const [id, t] of byId) {
    if (!order.includes(id)) merged.push(t);
  }
  return merged;
}

/**
 * Sidebar tabs for the primary role, plus any in-force additional appointments
 * (e.g. teacher who is also hall provost / department chairman / proctor).
 * Tabs unlocked only by an appointment get a sourceBadge for the sidebar.
 */
export function getRoleTabs(
  role: UserRole,
  departmentCode: string,
  hallAffiliation: string,
  additionalRoles?: RoleAssignment[] | null
): PortalTabItem[] {
  const primary = getPrimaryRoleTabs(role, departmentCode, hallAffiliation);
  const extraRoles = getEffectiveAdditionalRoles(additionalRoles).filter((r) => r !== role);
  if (extraRoles.length === 0) return primary;

  const primaryIds = new Set(primary.map((t) => t.id));
  let merged = primary;
  for (const extraRole of extraRoles) {
    const appt =
      additionalRoles?.find(
        (a) => a.role === extraRole && isAppointmentInForce(a)
      ) || null;
    const scopeDept =
      appt?.scopeType === 'department' && appt.scopeCode
        ? appt.scopeCode
        : departmentCode;
    const scopeHall =
      appt?.scopeType === 'hall'
        ? appt.scopeName || appt.scopeCode || hallAffiliation
        : hallAffiliation;
    const badge = appointmentBadgeLabel(extraRole, appt);
    const extraTabs = getPrimaryRoleTabs(extraRole, scopeDept, scopeHall)
      .filter((t) => t.id !== 'overview' && t.id !== 'profile')
      .map((t) =>
        primaryIds.has(t.id)
          ? t
          : {
              ...t,
              sourceBadge: badge,
            }
      );
    // Track ids already in merged so subsequent appointments don't overwrite badge
    for (const t of extraTabs) {
      if (!primaryIds.has(t.id)) primaryIds.add(t.id);
    }
    merged = mergePortalTabs(merged, extraTabs);
  }
  return merged;
}

function getPrimaryRoleTabs(
  role: UserRole,
  departmentCode: string,
  hallAffiliation: string
): PortalTabItem[] {
  const overview: PortalTabItem = {
    id: 'overview',
    label: 'Dashboard Overview',
    desc: 'Status, notices & quick actions',
    icon: LayoutDashboard,
  };

  const memberProfile: PortalTabItem = {
    id: 'profile',
    label: role === 'student' ? 'My Profile & Dossier' : 'My Profile',
    desc:
      role === 'student'
        ? 'Identity, CGPA, hall & bookmarks'
        : 'Account credentials, scope & bookmarks',
    icon: UserCheck,
  };

  switch (role) {
    case 'admin':
      return [
        overview,
        memberProfile,
        {
          id: 'users',
          label: 'User Directory',
          desc: 'Accounts, existing profiles & claim status',
          icon: UserCog,
        },
        {
          id: 'audit',
          label: 'Audit Log',
          desc: 'Privilege, account & security events',
          icon: ScrollText,
        },
        {
          id: 'governance',
          label: 'CMS, Notices & Config',
          desc: 'Notices, tokens, CMS & gateways',
          icon: Settings2,
        },
        {
          id: 'workflow',
          label: 'Office Automation',
          desc: 'Clearance queues & rules',
          icon: Workflow,
        },
        {
          id: 'students',
          label: 'Student Database',
          desc: 'Combined university student records',
          icon: Users,
        },
        {
          id: 'certificates',
          label: 'Certificates & Clearances',
          desc: 'Final issuance & 4-office track',
          icon: Award,
        },
        {
          id: 'exams',
          label: 'Exams & Results',
          desc: 'Circulars, admit cards & results',
          icon: FileCheck2,
        },
        {
          id: 'library',
          label: 'Central Library',
          desc: 'Cards, seals & book borrows',
          icon: BookOpen,
        },
        {
          id: 'halls',
          label: 'Residential Halls',
          desc: 'Allotment, seats & hall dues',
          icon: Building2,
        },
      ];
    case 'chairman':
      return [
        overview,
        memberProfile,
        {
          id: 'users',
          label: `${departmentCode} People`,
          desc: 'Teachers, students, tokens & profile approvals',
          icon: UserCog,
        },
        {
          id: 'approvals',
          label: `${departmentCode} Approvals`,
          desc: 'Account reviews & dept requests',
          icon: ClipboardCheck,
        },
        {
          id: 'students',
          label: `${departmentCode} Students`,
          desc: 'Departmental student ledger',
          icon: Users,
        },
        {
          id: 'exams',
          label: 'Exams & Results',
          desc: 'Circulars, verify forms & publish',
          icon: FileCheck2,
        },
        {
          id: 'library',
          label: 'Library Seal Desk',
          desc: 'Departmental chairman library seal',
          icon: BookOpen,
        },
        {
          id: 'certificates',
          label: 'Dept Clearances',
          desc: 'Chairman clearance review',
          icon: Award,
        },
        {
          id: 'governance',
          label: 'Dept Notices & Tokens',
          desc: 'Publish circulars & signup tokens',
          icon: Settings2,
        },
        {
          id: 'workflow',
          label: 'Office Flow',
          desc: 'Automated department queues',
          icon: Workflow,
        },
      ];
    case 'teacher':
      return [
        overview,
        {
          id: 'profile',
          label: 'My Faculty Profile',
          desc: 'Claim or edit directory profile',
          icon: UserCheck,
        },
        {
          id: 'exams',
          label: 'Courses & Results Entry',
          desc: 'Enter marks & submit grades',
          icon: FileCheck2,
        },
        {
          id: 'students',
          label: `${departmentCode} Students`,
          desc: 'View departmental roster',
          icon: Users,
        },
        {
          id: 'governance',
          label: 'Course Notices',
          desc: 'Post course-scoped announcements',
          icon: Settings2,
        },
        {
          id: 'approvals',
          label: 'Dept Requests',
          desc: 'Submit leave or lab requisitions',
          icon: ClipboardCheck,
        },
      ];
    case 'student':
      return [
        overview,
        memberProfile,
        {
          id: 'exams',
          label: 'Exams & Results',
          desc: 'Apply for exams, admit cards & CGPA',
          icon: GraduationCap,
        },
        {
          id: 'library',
          label: 'Library Card & Books',
          desc: 'Apply for digital card & loans',
          icon: BookOpen,
        },
        {
          id: 'halls',
          label: `Hall Services (${hallAffiliation})`,
          desc: 'Seat applications & hall dues',
          icon: Building2,
        },
        {
          id: 'certificates',
          label: 'Certificates & Clearance',
          desc: '4-office clearance & digital docs',
          icon: Award,
        },
        {
          id: 'students',
          label: 'My Academic Dossier',
          desc: 'Profile & admission documents',
          icon: Users,
        },
      ];
    case 'library':
      return [
        overview,
        memberProfile,
        {
          id: 'library',
          label: 'Library Desk',
          desc: 'Verify cards & record borrows',
          icon: BookOpen,
        },
        {
          id: 'certificates',
          label: 'Library Clearance',
          desc: 'Clear graduating students',
          icon: Award,
        },
        {
          id: 'workflow',
          label: 'Office Flow',
          desc: 'Library automation queue',
          icon: Workflow,
        },
        {
          id: 'governance',
          label: 'Library Notices',
          desc: 'Publish library circulars',
          icon: Settings2,
        },
      ];
    case 'hall':
      return [
        overview,
        memberProfile,
        {
          id: 'halls',
          label: `Hall Desk (${hallAffiliation})`,
          desc: 'Circulars, seats & hall dues',
          icon: Building2,
        },
        {
          id: 'certificates',
          label: 'Hall Clearance',
          desc: 'Clear graduating residents',
          icon: Award,
        },
        {
          id: 'workflow',
          label: 'Office Flow',
          desc: 'Hall clearance queue',
          icon: Workflow,
        },
        {
          id: 'governance',
          label: 'Hall Notices',
          desc: 'Publish hall circulars',
          icon: Settings2,
        },
      ];
    case 'proctor':
      return [
        overview,
        memberProfile,
        {
          id: 'students',
          label: 'Student Conduct',
          desc: 'Disciplinary clearance notes',
          icon: Users,
        },
        {
          id: 'certificates',
          label: 'Proctor Clearance',
          desc: 'Clear graduating candidates',
          icon: Award,
        },
        {
          id: 'workflow',
          label: 'Office Flow',
          desc: 'Proctor clearance queue',
          icon: Workflow,
        },
        {
          id: 'governance',
          label: 'Proctor Notices',
          desc: 'Publish campus safety circulars',
          icon: Settings2,
        },
      ];
    case 'registrar':
    case 'vc':
      return [
        overview,
        memberProfile,
        {
          id: 'governance',
          label: role === 'vc' ? 'Notices & Audit Trail' : 'Notices, Inquiries & Audit',
          desc: 'Circulars, inquiries & audit logs',
          icon: Settings2,
        },
        {
          id: 'students',
          label: 'Student Directory',
          desc: 'University-wide student records',
          icon: Users,
        },
        {
          id: 'certificates',
          label: 'Certificates Registry',
          desc: 'Track issuance & clearances',
          icon: Award,
        },
        {
          id: 'exams',
          label: 'Examinations Overview',
          desc: 'Academic examination status',
          icon: FileCheck2,
        },
      ];
    case 'dean':
      return [
        overview,
        memberProfile,
        {
          id: 'students',
          label: 'Faculty Student Overview',
          desc: 'Cross-department student view',
          icon: Users,
        },
        {
          id: 'exams',
          label: 'Faculty Exams Overview',
          desc: 'Examination status across departments',
          icon: FileCheck2,
        },
        {
          id: 'governance',
          label: 'Faculty Notices',
          desc: 'Publish faculty-level circulars',
          icon: Settings2,
        },
        {
          id: 'approvals',
          label: 'Faculty Requests',
          desc: 'Review escalated departmental requests',
          icon: ClipboardCheck,
        },
      ];
    case 'advisor':
      return [
        overview,
        memberProfile,
        {
          id: 'students',
          label: 'Advisee Students',
          desc: 'Student welfare & counselling roster',
          icon: Users,
        },
        {
          id: 'approvals',
          label: 'Student Support Requests',
          desc: 'Advise on leave and welfare requests',
          icon: ClipboardCheck,
        },
        {
          id: 'governance',
          label: 'Advisor Notices',
          desc: 'Guidance & counselling circulars',
          icon: Settings2,
        },
      ];
    default:
      return [overview, memberProfile];
  }
}
