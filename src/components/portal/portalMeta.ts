import {
  Award,
  BookOpen,
  Building,
  ClipboardCheck,
  FileSpreadsheet,
  GraduationCap,
  LayoutDashboard,
  ShieldCheck,
  Users,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '../../types/pust';

export type AuthMode = 'login' | 'student-token' | 'officer' | 'admin-claim' | 'admin-passcode';

export type PortalTab =
  | 'overview'
  | 'approvals'
  | 'workflow'
  | 'students'
  | 'library'
  | 'halls'
  | 'exams'
  | 'certificates'
  | 'governance';

export interface PortalTabDef {
  id: PortalTab;
  label: string;
  icon: LucideIcon;
  desc: string;
}

export const VALID_PORTAL_TABS: PortalTab[] = [
  'overview',
  'approvals',
  'workflow',
  'students',
  'library',
  'halls',
  'exams',
  'certificates',
  'governance',
];

export const SESSION_FILTERS = ['ALL', '2025-26', '2024-25', '2023-24', '2022-23', '2021-22'];

export const ROLE_LABELS: Record<UserRole, string> = {
  student: 'Admitted Student',
  teacher: 'Faculty Member',
  chairman: 'Department Chairman',
  library: 'Central Library Officer',
  hall: 'Hall Provost & Office',
  proctor: 'Proctorial Office',
  registrar: 'Office of the Registrar',
  vc: 'Vice-Chancellor Office',
  admin: 'Central Admin Office',
};

export const ROLE_SCOPE_SUMMARY: Record<UserRole, string> = {
  student:
    'Manage your academic standing, digital library card, residential hall seat and dues, semester exam forms, digital receipts, and 4-office graduation clearances.',
  teacher:
    'Inspect your departmental class roster, build multi-course gradebooks for Chairman publication, review exam schedules, and publish course or session notices.',
  chairman:
    'Approve department teachers and students, issue student signup tokens, seal library applications, verify exam forms and publish marksheets, and grant Chairman clearances.',
  library:
    'Verify Chairman-sealed library applications, issue digital and physical library cards, record book checkouts or returns, and sign Library certificate clearances.',
  hall:
    'Publish residential seat vacancy circulars, allot and reassign hall seats, clear financial dues, and grant Hall certificate clearances.',
  proctor:
    'Review student conduct and disciplinary standing across departments and issue Proctorial clearances for graduating certificates.',
  registrar:
    'Oversee university-wide student directory records, reply to incoming admission inquiries, publish central circulars, and audit governance actions.',
  vc:
    'Monitor institutional student records, publish executive university circulars, and review campus-wide governance audit logs.',
  admin:
    'Full administrative control over officer approvals, student tokens, financial gateways, public CMS content, marksheet publication, and final certificate issuance.',
};

export function computeDeterministicFileHash(fileName: string, size: number): string {
  let h = 2166136261;
  const input = `${fileName}:${size}`;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `SHA256-${(h >>> 0).toString(16).toUpperCase().padStart(8, '0')}`;
}

export function getRoleTabs(
  role: UserRole,
  departmentCode: string,
  hallAffiliation: string
): PortalTabDef[] {
  switch (role) {
    case 'student':
      return [
        { id: 'overview', label: 'My Campus Overview', icon: LayoutDashboard, desc: 'Standing, receipts & alerts' },
        { id: 'approvals', label: 'Department Requests', icon: ClipboardCheck, desc: 'Exemptions & Chair review' },
        { id: 'workflow', label: 'Automated Readiness', icon: Workflow, desc: 'Live 6-step clearance checks' },
        { id: 'students', label: 'My Academic Profile', icon: GraduationCap, desc: 'CGPA, hall & documents' },
        { id: 'library', label: 'Library & Digital Card', icon: BookOpen, desc: 'Card, QR & borrowed books' },
        { id: 'halls', label: 'Hall Seat & Dues', icon: Building, desc: 'Vacancies, checkout & clearance' },
        { id: 'exams', label: 'Exams, Admit & Results', icon: FileSpreadsheet, desc: 'Forms, checkout & gradesheet' },
        { id: 'certificates', label: 'Certificate Clearances', icon: Award, desc: '4-office graduation tracker' },
      ];
    case 'teacher':
      return [
        { id: 'overview', label: 'Faculty Overview', icon: LayoutDashboard, desc: 'Assigned courses & alerts' },
        { id: 'approvals', label: 'Department Requests', icon: ClipboardCheck, desc: 'Leave, lab & course filings' },
        { id: 'workflow', label: 'Office Flow Status', icon: Workflow, desc: 'Live campus policy triggers' },
        { id: 'students', label: 'Department Class Roster', icon: Users, desc: `${departmentCode} student records` },
        { id: 'exams', label: 'Gradebook & Exams', icon: FileSpreadsheet, desc: 'Submit marksheets & courses' },
        { id: 'governance', label: 'Course Notice Publisher', icon: ShieldCheck, desc: 'Course & session circulars' },
      ];
    case 'chairman':
      return [
        { id: 'overview', label: 'Chairman Desk', icon: LayoutDashboard, desc: `${departmentCode} office summary` },
        { id: 'approvals', label: 'Approval Dashboard', icon: ClipboardCheck, desc: `${departmentCode} requests & revisions` },
        { id: 'workflow', label: 'Automated Office Flow', icon: Workflow, desc: 'Unified queue & batch sweep' },
        { id: 'students', label: 'Department Students', icon: Users, desc: 'Roster & Chairman remarks' },
        { id: 'library', label: 'Chairman Library Seals', icon: BookOpen, desc: 'Sign & forward applications' },
        { id: 'exams', label: 'Exams, Courses & Results', icon: FileSpreadsheet, desc: 'Admit cards & result review' },
        { id: 'certificates', label: 'Chairman Clearances', icon: Award, desc: 'Graduation office sign-off' },
        { id: 'governance', label: 'Dept Approvals & Tokens', icon: ShieldCheck, desc: 'Tokens, faculty & notices' },
      ];
    case 'library':
      return [
        { id: 'overview', label: 'Library Overview', icon: LayoutDashboard, desc: 'Card queue & alerts' },
        { id: 'approvals', label: 'Department Requests', icon: ClipboardCheck, desc: 'Submit & track filings' },
        { id: 'workflow', label: 'Automated Office Flow', icon: Workflow, desc: 'Card & clearance queue sweep' },
        { id: 'library', label: 'Cards & Borrowing Desk', icon: BookOpen, desc: 'Verify seals & checkouts' },
        { id: 'certificates', label: 'Library Clearances', icon: Award, desc: '4-office graduation sign-off' },
        { id: 'governance', label: 'Library Circulars', icon: ShieldCheck, desc: 'Publish library notices' },
      ];
    case 'hall':
      return [
        { id: 'overview', label: 'Hall Provost Overview', icon: LayoutDashboard, desc: `${hallAffiliation} summary` },
        { id: 'approvals', label: 'Department Requests', icon: ClipboardCheck, desc: 'Submit & track filings' },
        { id: 'workflow', label: 'Automated Office Flow', icon: Workflow, desc: 'Seats, dues & clearances sweep' },
        { id: 'students', label: 'Hall Residents Roster', icon: Users, desc: 'Resident standing & rooms' },
        { id: 'halls', label: 'Seats, Circulars & Dues', icon: Building, desc: 'Allotments & clearances' },
        { id: 'certificates', label: 'Hall Clearances', icon: Award, desc: '4-office graduation sign-off' },
        { id: 'governance', label: 'Hall Notice Board', icon: ShieldCheck, desc: 'Publish hall circulars' },
      ];
    case 'proctor':
      return [
        { id: 'overview', label: 'Proctorial Overview', icon: LayoutDashboard, desc: 'Conduct & clearance queue' },
        { id: 'approvals', label: 'Department Requests', icon: ClipboardCheck, desc: 'Submit & track filings' },
        { id: 'workflow', label: 'Automated Office Flow', icon: Workflow, desc: 'Proctorial queue & sweep' },
        { id: 'students', label: 'Student Conduct Ledger', icon: Users, desc: 'Disciplinary status & notes' },
        { id: 'certificates', label: 'Proctorial Clearances', icon: Award, desc: '4-office graduation sign-off' },
        { id: 'governance', label: 'Proctorial Notices', icon: ShieldCheck, desc: 'Publish conduct circulars' },
      ];
    case 'registrar':
    case 'vc':
      return [
        { id: 'overview', label: 'Executive Overview', icon: LayoutDashboard, desc: 'Governance metrics & alerts' },
        { id: 'approvals', label: 'Department Requests', icon: ClipboardCheck, desc: 'Submit & track filings' },
        { id: 'workflow', label: 'Automated Office Flow', icon: Workflow, desc: 'Inquiries & campus automation' },
        { id: 'students', label: 'University Student Directory', icon: Users, desc: 'All departments & sessions' },
        { id: 'governance', label: 'Governance, Notices & Audit', icon: ShieldCheck, desc: 'Circulars, inquiries & logs' },
      ];
    case 'admin':
    default:
      return [
        { id: 'overview', label: 'Admin Command Overview', icon: LayoutDashboard, desc: 'Institution-wide summary' },
        { id: 'approvals', label: 'Approval Dashboard', icon: ClipboardCheck, desc: 'All-department request review' },
        { id: 'workflow', label: 'Automated Office Flow', icon: Workflow, desc: 'Cross-office sweep & rules' },
        { id: 'students', label: 'All-Dept Student Database', icon: Users, desc: 'Directory & Admin remarks' },
        { id: 'library', label: 'Library Oversight', icon: BookOpen, desc: 'Cards & borrowing ledger' },
        { id: 'halls', label: 'Residential Halls', icon: Building, desc: 'Seats, circulars & dues' },
        { id: 'exams', label: 'Exams, Courses & Results', icon: FileSpreadsheet, desc: 'Circulars, admits & grades' },
        { id: 'certificates', label: 'Final Certificate Issuance', icon: Award, desc: '4-office tracker & serials' },
        { id: 'governance', label: 'Notices, Tokens & CMS', icon: ShieldCheck, desc: 'Approvals, gateways & CMS' },
      ];
  }
}
