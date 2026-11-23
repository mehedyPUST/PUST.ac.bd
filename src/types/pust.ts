export type FacultyName =
  | 'Faculty of Engineering and Technology'
  | 'Faculty of Science'
  | 'Faculty of Business Studies'
  | 'Faculty of Humanities and Social Science'
  | 'Faculty of Life and Earth Science';

export interface DepartmentRecord {
  id: string;
  code: string;
  name: string;
  faculty: FacultyName;
  established: number;
  degrees: string[];
  intakeSeats: number;
  building: string;
  summary: string;
  researchFocus: string[];
  laboratories: string[];
}

export type NoticeCategory =
  | 'General'
  | 'Admission'
  | 'Academic'
  | 'Examination'
  | 'Job & Tender'
  | 'NOC & Orders';

export interface NoticeRecord {
  id: string;
  referenceNo: string;
  title: string;
  category: NoticeCategory;
  publishedAt: string;
  departmentCode: string;
  summary: string;
  body: string;
  pinned?: boolean;
  authorName?: string;
}

export interface PublicationRecord {
  id: string;
  title: string;
  authors: string;
  departmentCode: string;
  domain: string;
  year: number;
  venue: string;
}

export interface JournalRecord {
  id: string;
  title: string;
  issn: string;
  scope: string;
  currentIssue: string;
}

export interface LeadershipOfficer {
  role: string;
  name: string;
  email: string;
  phone: string;
  office: string;
}

export interface AdministrativeUnit {
  code: string;
  name: string;
  category: 'Statutory Governance' | 'Administrative Office' | 'Specialized Cell & Institute';
  description: string;
}

export interface UniversityProfile {
  establishedYear: number;
  campusAcres: number;
  facultiesCount: number;
  departmentsCount: number;
  facultyMembersCount: number;
  studentsCount: number;
  convocationDate: string;
  leadership: LeadershipOfficer[];
  units: AdministrativeUnit[];
  journals: JournalRecord[];
}

export interface InquiryRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  programLevel:
    | 'Undergraduate (GST)'
    | 'Graduate (M.Sc. / MBA)'
    | 'Evening Programs'
    | 'M.Phil / Ph.D.'
    | 'International';
  departmentCode: string;
  message: string;
  status: 'Received' | 'Reviewed';
  createdAt: string;
}

export type UserRole = 'student' | 'faculty' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentCode: string;
  academicId: string;
  hallAffiliation: string;
  createdAt: string;
}

export interface BookmarkRecord {
  id: string;
  userId: string;
  itemType: 'department' | 'notice';
  itemId: string;
  title: string;
  subtitle: string;
  createdAt: string;
}

export interface BootstrapStatus {
  adminConfigured: boolean;
  envAdminActive: boolean;
  storageBackend: 'mongodb' | 'memory';
}
