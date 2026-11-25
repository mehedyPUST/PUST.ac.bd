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

export interface DigitalDocumentMeta {
  label: string;
  fileName: string;
  sizeLabel: string;
  uploadedAt: string;
  verifiedHash: string;
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
  digitalDocuments?: DigitalDocumentMeta[];
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
  | 'NOC & Orders'
  | 'Press Release';

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
  attachmentUrl?: string;
  attachmentType?: 'image' | 'pdf' | 'other';
  pinned?: boolean;
  authorName: string;
  authorRole: UserRole;
  createdAt?: string;
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
  verificationHash?: string;
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
  receiptNo?: string;
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
  receiptNo?: string;
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
  status?: 'pending_chairman' | 'published';
  published: boolean;
  enteredBy: string;
  reviewedBy?: string;
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
  receiptNo?: string;
  clearances: Record<ClearanceOfficeKey, OfficeClearanceState>;
  finalAdminStatus: 'waiting_offices' | 'pending_admin' | 'approved' | 'rejected';
  adminNote?: string;
  certificateSerial?: string;
  verificationHash?: string;
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
  visibility?: 'public' | 'registered';
}

export interface BannerSlideRecord {
  id: string;
  imageUrl: string;
  caption: string;
  alt?: string;
  orderIndex: number;
  updatedAt?: string;
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
  photoUrl?: string;
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

export interface InstitutionalLinkItem {
  id: string;
  route: string;
  title: string;
  desc: string;
}

export interface SeminarItem {
  id: string;
  date: string;
  organizer: string;
  title: string;
}

export type CampusZoneType =
  | 'Administration'
  | 'Academic'
  | 'Library & Culture'
  | 'Residential & Wellness';

export interface CampusBuildingItem {
  id: string;
  code: string;
  name: string;
  shortName: string;
  zone: CampusZoneType;
  gridRef: string;
  xPercent: number;
  yPercent: number;
  photo: string;
  caption: string;
  summary: string;
  offices: string;
  hours: string;
  facilities: string;
  route: string;
  routeLabel: string;
}

export interface CampusMapMeta {
  eyebrow: string;
  title: string;
  subtitle: string;
  coordinates: string;
}

export interface GovernanceContent {
  officialActUrl: string;
  actIntro: string;
  actClauses: Array<{ clause: string; detail: string }>;
  actCitations: Array<{ label: string; value: string }>;
  regentBoardMembers: Array<{ seat: string; designation: string; term: string }>;
  regentFunctions: string[];
  academicCouncilIntro: string;
  academicCouncilCards: Array<{ title: string; detail: string }>;
  academicCouncilStructure: Array<{ label: string; value: string }>;
  financeCommitteeIntro: string;
  financeCommitteeScopes: Array<{ scope: string; desc: string }>;
  financeCommitteeLeadership: Array<{ label: string; value: string }>;
  ordinanceIntro: string;
  ordinanceRules: Array<{ label: string; value: string }>;
  gradingScale: Array<{ range: string; letter: string; gp: string; remarks: string }>;
}

export interface AdminShowcaseConfig {
  buildingImage: string;
  buildingCaption: string;
  charterTag: string;
  accountabilityCycle: string;
  apaFyLabel: string;
  apaBenchmarks: Array<{ code: string; title: string; detail: string }>;
}

export interface MilestoneItem {
  year: string;
  title: string;
  detail: string;
}

export interface AboutExtrasConfig {
  campusImage: string;
  campusCaption: string;
  milestones: MilestoneItem[];
}

export interface DegreeProgramItem {
  level: string;
  degrees: string;
  duration: string;
  credits: string;
  entry: string;
}

export interface FacultyDeanItem {
  faculty: FacultyName;
  dean: string;
  email: string;
  code: string;
  depts: string;
}

export type AcademicCalendarCategory = 'exam' | 'holiday' | 'deadline' | 'academic';

export interface AcademicCalendarItem {
  term: string;
  event: string;
  date: string;
  endDate?: string;
  category?: AcademicCalendarCategory;
  venue?: string;
  details?: string;
}

export interface ScholarshipItem {
  title: string;
  detail: string;
}

export interface DigitalFormItem {
  code: string;
  title: string;
  office: string;
  note: string;
  portalTarget: string;
  portalLabel: string;
  fields: string[];
}

export interface ResearchInfraCard {
  id: string;
  tag: string;
  title: string;
  description: string;
  imageUrl: string;
  caption: string;
}

export interface AcademicExtrasConfig {
  degreePrograms: DegreeProgramItem[];
  facultyDeans: FacultyDeanItem[];
  academicCalendar: AcademicCalendarItem[];
  scholarships: ScholarshipItem[];
  downloadForms: DigitalFormItem[];
  researchIntro: string;
  researchInfraCards: ResearchInfraCard[];
}

export interface AdmissionsUnitCard {
  unitLabel: string;
  deptCountLabel: string;
  departmentsText: string;
}

export interface AdmissionsConfig {
  kicker: string;
  gstUnits: AdmissionsUnitCard[];
  undergradText: string;
  gradText: string;
  eveningText: string;
  totalIntakeLabel: string;
  signupMethodLabel: string;
  deskEmail: string;
}

export interface FacilityItemConfig {
  label: string;
  route: string;
  title: string;
  body: string;
  img: string;
  hours: string;
  location: string;
  portalRoute: string;
  highlights: string[];
}

export interface VerifyPageConfig {
  kicker: string;
  title: string;
  subtitle: string;
  sampleSerials: Array<{ label: string; code: string }>;
  employerCardTitle: string;
  employerCardBody: string;
  portalCardTitle: string;
  portalCardBody: string;
}

export interface FooterLinkItem {
  label: string;
  route: string;
}

export interface FooterContactItem {
  label: string;
  phone: string;
  email: string;
}

export interface FooterConfig {
  tagline: string;
  description: string;
  socialLinks: Array<{ label: string; url: string }>;
  quickLinks: FooterLinkItem[];
  governanceLinks: FooterLinkItem[];
  serviceLinks: FooterLinkItem[];
  addressLines: string[];
  contacts: FooterContactItem[];
  copyrightText: string;
}

export interface UniversityProfile {
  establishedYear: number;
  campusAcres: number;
  facultiesCount: number;
  departmentsCount: number;
  facultyMembersCount: number;
  studentsCount: number;
  convocationDate: string;
  navbarTagline?: string;
  heroEyebrow?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  leadership: LeadershipOfficer[];
  units: AdministrativeUnit[];
  journals: JournalRecord[];
  institutionalLinksHeading?: string;
  institutionalLinksEyebrow?: string;
  institutionalLinks?: InstitutionalLinkItem[];
  upcomingSeminars?: SeminarItem[];
  campusMapMeta?: CampusMapMeta;
  campusBuildings?: CampusBuildingItem[];
  governanceContent?: GovernanceContent;
  adminShowcase?: AdminShowcaseConfig;
  aboutExtras?: AboutExtrasConfig;
  academicExtras?: AcademicExtrasConfig;
  admissionsConfig?: AdmissionsConfig;
  facilitiesConfig?: FacilityItemConfig[];
  verifyPageConfig?: VerifyPageConfig;
  footerConfig?: FooterConfig;
}

export type GovernanceTabKind =
  | 'pust-act'
  | 'regent-board'
  | 'academic-council'
  | 'finance-committee'
  | 'academic-ordinance';

export type EditModalTarget =
  | { kind: 'hero-profile' }
  | { kind: 'banner'; slideId?: string }
  | { kind: 'vc'; vcId?: string }
  | { kind: 'about'; slug: AboutContentRecord['slug'] }
  | { kind: 'notice'; notice?: NoticeRecord | null }
  | { kind: 'gallery'; item?: GalleryItemRecord | null }
  | { kind: 'publication'; publication?: PublicationRecord | null }
  | { kind: 'journals' }
  | { kind: 'department'; department: DepartmentRecord | null }
  | { kind: 'leadership'; officerIndex?: number }
  | { kind: 'unit'; unitCode?: string }
  | { kind: 'institutional-links' }
  | { kind: 'seminars' }
  | { kind: 'campus-building'; buildingId?: string }
  | { kind: 'governance'; tab: GovernanceTabKind }
  | { kind: 'apa-benchmarks' }
  | { kind: 'milestones' }
  | { kind: 'degree-programs' }
  | { kind: 'faculty-deans' }
  | { kind: 'academic-calendar' }
  | { kind: 'scholarships' }
  | { kind: 'download-forms' }
  | { kind: 'research-infra' }
  | { kind: 'admissions-info' }
  | { kind: 'facility'; route?: string }
  | { kind: 'verify-page' }
  | { kind: 'footer-config' };

export interface InquiryRecord {
  id: string;
  referenceCode: string;
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
  responseNote?: string;
  respondedBy?: string;
  respondedAt?: string;
  createdAt: string;
}

export interface PaymentReceiptRecord {
  id: string;
  receiptNo: string;
  transactionId: string;
  academicId: string;
  studentName: string;
  departmentCode: string;
  targetType: 'hall_due' | 'exam_application' | 'certificate';
  targetId: string;
  title: string;
  amountBdt: number;
  gatewayCode: string;
  gatewayName: string;
  accountMask?: string;
  status: 'Verified';
  paidAt: string;
}

export interface VerificationLookupResult {
  valid: boolean;
  documentType:
    | 'Certificate'
    | 'Admit Card'
    | 'Hall Clearance'
    | 'Digital Library Card'
    | 'Chairman Library Seal'
    | 'Payment Receipt';
  serialCode: string;
  title: string;
  holderName: string;
  academicId: string;
  departmentCode: string;
  session?: string;
  issuedAt: string;
  issuedBy: string;
  status: string;
  verificationHash: string;
  details: Array<{ label: string; value: string }>;
}

export interface PublicStatusLookupResult {
  found: boolean;
  lookupType: 'account' | 'inquiry';
  reference: string;
  title: string;
  statusLabel: string;
  statusState: 'pending' | 'approved' | 'rejected' | 'reviewed' | 'received';
  departmentCode?: string;
  updatedAt: string;
  note?: string;
  meta: Array<{ label: string; value: string }>;
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

export interface AutomationRulesConfig {
  autoClearPaidHallDues: boolean;
  autoIssueSealedLibraryCards: boolean;
  autoIssueAdmitCardsOnPay: boolean;
  autoVerifyCleanCertOffices: boolean;
  autoIssueReadyCertificates: boolean;
  autoPromoteGraduatingResults: boolean;
}

export type OfficeFlowType =
  | 'user_approval'
  | 'library_seal'
  | 'library_verify'
  | 'hall_seat'
  | 'hall_due'
  | 'exam_admit'
  | 'exam_result'
  | 'cert_office'
  | 'cert_final'
  | 'inquiry';

export interface OfficeFlowItem {
  id: string;
  targetId: string;
  flowType: OfficeFlowType;
  officeLabel: string;
  title: string;
  subtitle: string;
  targetRef: string;
  departmentCode?: string;
  stage: string;
  eligibility: 'ready' | 'held' | 'manual';
  eligibilityReason: string;
  actionLabel: string;
  portalTab: string;
  createdAt: string;
}

export interface AutomationSweepAction {
  flowType: OfficeFlowType;
  target: string;
  outcome: 'processed' | 'held';
  detail: string;
}

export interface AutomationSweepReport {
  ranAt: string;
  actorName: string;
  actorRole: UserRole;
  processedCount: number;
  heldCount: number;
  actions: AutomationSweepAction[];
}

export interface StudentReadinessSummary {
  academicId: string;
  approvalStatus: ApprovalStatus;
  hallCleared: boolean;
  unpaidHallDuesCount: number;
  hallSeatAssigned: string;
  libraryCleared: boolean;
  activeBorrowsCount: number;
  hasActiveLibraryCard: boolean;
  proctorCleared: boolean;
  disciplinaryStatus: StudentRecord['disciplinaryStatus'];
  completedSemesters: number;
  allResultsPublished: boolean;
  graduationReady: boolean;
}

export interface AutomationOverviewResponse {
  rules: AutomationRulesConfig;
  queueItems: OfficeFlowItem[];
  counts: {
    total: number;
    ready: number;
    held: number;
    manual: number;
  };
  studentReadiness: StudentReadinessSummary | null;
  recentAuditLogs: AuditLogRecord[];
}
