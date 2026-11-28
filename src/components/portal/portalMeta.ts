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
  UserCog,
  Users,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '../../types/pust';

export type PortalTab =
  | 'overview'
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
};

export interface PortalTabItem {
  id: PortalTab;
  label: string;
  desc: string;
  icon: LucideIcon;
}

export function getRoleTabs(
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

  switch (role) {
    case 'admin':
      return [
        overview,
        {
          id: 'users',
          label: 'User Directory',
          desc: 'Officers, teachers & admin accounts',
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
    default:
      return [overview];
  }
}
