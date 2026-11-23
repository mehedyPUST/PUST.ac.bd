export type FacultyName =
  | 'Faculty of Engineering and Technology'
  | 'Faculty of Science'
  | 'Faculty of Business Studies'
  | 'Faculty of Humanities and Social Science'
  | 'Faculty of Life and Earth Science';

export type UserRole =
  | 'admin'
  | 'registrar'
  | 'vc'
  | 'chairman'
  | 'teacher'
  | 'student'
  | 'proctor'
  | 'library'
  | 'hall';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  approvalStatus: ApprovalStatus;
  departmentCode: string;
  academicId: string;
  session?: string;
  hallAffiliation: string;
  assignedCourses?: string[];
  assignedSessions?: string[];
  createdAt: string;
}

export interface SignupTokenRecord {
  id: string;
  token: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  departmentCode: string;
  session: string;
  academicId: string;
  hallAffiliation: string;
  used: boolean;
  createdBy: string;
  createdAt: string;
}

export interface StudentRecord {
  id: string;
  userId?: string;
  academicId: string;
  name: string;
  email: string;
  phone: string;
  departmentCode: string;
  session: string;
  currentSemester: number;
  cgpa: number;
  completedSemesters: number;
  allResultsPublished: boolean;
  hallName: string;
  seatNumber: string;
  admissionDocuments: string[];
  chairmanNotes: string;
  adminNotes: string;
  disciplinaryStatus: 'Clear' | 'Warning' | 'Under Review';
  disciplinaryNotes: string;
  approvalStatus: ApprovalStatus;
}

export interface CourseRecord {
  id: string;
  code: string;
  title: string;
  credits: number;
  departmentCode: string;
  semester: number;
  session: string;
  teacherEmail?: string;
}

export interface DepartmentRecord {
  id: string;
  code: string;
  name: string;
  faculty: FacultyName;
  established: number;
  degrees: string[];
  intakeSeats: number;
  building: string;
  chairmanName: string;
  summary: string;
  researchFocus: string[];
  laboratories: string[];
}

export type NoticeCategory =
  | 'General'
  | 'Admission'
  | 'Academic'
  | 'Examination'
  | 'Result'
  | 'Course'
  | 'Job & Tender'
  | 'NOC & Orders';

export type NoticeVisibility = 'public' | 'registered';
export type NoticeBoardScope = 'central' | 'department' | 'course';

export interface NoticeRecord {
  id: string;
  referenceNo: string;
  title: string;
  category: NoticeCategory;
  publishedAt: string;
  departmentCode: string;
  boardScope: NoticeBoardScope;
  visibility: NoticeVisibility;
  targetSession?: string;
  targetCourseCode?: string;
  summary: string;
  body: string;
  attachmentName?: string;
  pinned?: boolean;
  authorName: string;
  authorRole: UserRole;
}

export interface ChairmanSealJson {
  chairmanName: string;
  departmentCode: string;
  officialSeal: string;
  digitalSignature: string;
  signedAt: string;
  verificationHash: string;
}

export interface LibraryApplicationRecord {
  id: string;
  studentId: string;
  studentName: string;
  academicId: string;
  departmentCode: string;
  session: string;
  status:
    | 'pending_chairman'
    | 'forwarded_to_library'
    | 'approved'
    | 'rejected';
  chairmanSeal?: ChairmanSealJson;
  chairmanNote?: string;
  libraryNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LibraryCardRecord {
  id: string;
  studentId: string;
  academicId: string;
  studentName: string;
  departmentCode: string;
  session: string;
  digitalCardNo: string;
  physicalCardRef?: string;
  issuedAt: string;
  validUntil: string;
  status: 'Active' | 'Suspended';
}

export interface LibraryBorrowRecord {
  id: string;
  academicId: string;
  studentName: string;
  bookTitle: string;
  isbn: string;
  borrowedAt: string;
  dueAt: string;
  returnedAt?: string;
  fineBdt: number;
  status: 'Borrowed' | 'Returned' | 'Overdue';
}

export interface HallCircularRecord {
  id: string;
  hallName: string;
  title: string;
  vacantSeats: number;
  deadline: string;
  description: string;
  publishedBy: string;
  publishedAt: string;
}

export interface SeatHistoryEntry {
  seatNumber: string;
  assignedAt: string;
  assignedBy: string;
  note: string;
}

export interface HallApplicationRecord {
  id: string;
  circularId: string;
  hallName: string;
  studentId: string;
  academicId: string;
  studentName: string;
  departmentCode: string;
  session: string;
  statement: string;
  status: 'pending' | 'accepted' | 'rejected';
  reviewNote?: string;
  assignedSeat?: string;
  seatHistory: SeatHistoryEntry[];
  createdAt: string;
}

export interface HallDueRecord {
  id: string;
  academicId: string;
  studentName: string;
  hallName: string;
  feeTitle: string;
  amountBdt: number;
  paymentMethod?: string;
  paymentRef?: string;
  paidAt?: string;
  status: 'Unpaid' | 'Payment Submitted' | 'Cleared';
  clearanceRef?: string;
  clearedAt?: string;
  clearedBy?: string;
}

export interface ExamCircularRecord {
  id: string;
  title: string;
  departmentCode: string;
  semester: number;
  session: string;
  deadline: string;
  feeBdt: number;
  eligibleCourseCodes: string[];
  publishedBy: string;
  publishedAt: string;
}

export interface ExamApplicationRecord {
  id: string;
  circularId: string;
  examTitle: string;
  studentId: string;
  academicId: string;
  studentName: string;
  departmentCode: string;
  session: string;
  semester: number;
  selectedCourseCodes: string[];
  totalCredits: number;
  formReference: string;
  feeBdt: number;
  paymentMethod?: string;
  transactionId?: string;
  paymentStatus: 'Pending' | 'Paid';
  verificationStatus: 'Pending Chairman Verification' | 'Approved' | 'Rejected';
  admitCardNo?: string;
  admitCardIssuedAt?: string;
  physicalCollected?: boolean;
  hallClearanceChecked: boolean;
  createdAt: string;
}

export interface ExamResultRecord {
  id: string;
  academicId: string;
  studentName: string;
  departmentCode: string;
  session: string;
  semester: number;
  courses: Array<{
    code: string;
    title: string;
    credits: number;
    marks: number;
    gradePoint: number;
    letterGrade: string;
  }>;
  sgpa: number;
  promotionStatus: 'Promoted (Auto)' | 'Promoted (Manual)' | 'Probation / Repeat';
  published: boolean;
  enteredBy: string;
  publishedAt: string;
}

export type ClearanceOfficeKey = 'chairman' | 'hall' | 'library' | 'proctor';

export interface OfficeClearanceState {
  office: ClearanceOfficeKey;
  officeLabel: string;
  status: 'pending' | 'approved' | 'declined';
  note: string;
  updatedBy?: string;
  updatedAt?: string;
  history: Array<{
    action: 'approved' | 'declined' | 'resubmitted';
    note: string;
    actor: string;
    timestamp: string;
  }>;
}

export interface CertificateApplicationRecord {
  id: string;
  studentId: string;
  academicId: string;
  studentName: string;
  departmentCode: string;
  session: string;
  certificateType: 'Temporary Certificate' | 'Provisional Transcript';
  feeBdt: number;
  paymentMethod: string;
  transactionId: string;
  clearances: Record<ClearanceOfficeKey, OfficeClearanceState>;
  finalAdminStatus: 'waiting_offices' | 'pending_admin' | 'approved' | 'rejected';
  adminNote?: string;
  certificateSerial?: string;
  issuedAt?: string;
  physicalCollected?: boolean;
  createdAt: string;
}

export interface PaymentGatewayConfig {
  id: string;
  name: string;
  code: string;
  instructions: string;
  enabled: boolean;
}

export interface FeeConfig {
  certificateFeeBdt: number;
  defaultExamFeeBdt: number;
}

export interface GalleryItemRecord {
  id: string;
  title: string;
  description: string;
  category: 'Festival' | 'Academic Event' | 'Convocation' | 'Campus Life';
  mediaType: 'photo' | 'video';
  mediaUrl: string;
  eventDate: string;
}

export interface AboutContentRecord {
  id: string;
  slug: 'our-university' | 'history' | 'mission-vision' | 'plans';
  title: string;
  body: string;
  updatedAt: string;
}

export interface ViceChancellorRecord {
  id: string;
  name: string;
  title: string;
  tenure: string;
  email: string;
  phone: string;
  message: string;
  isCurrent: boolean;
  orderIndex: number;
}

export interface AuditLogRecord {
  id: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  target: string;
  timestamp: string;
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
