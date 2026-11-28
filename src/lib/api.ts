import type {
  AboutContentRecord,
  AdminCreateUserPayload,
  AdminUpdateUserPayload,
  AuditLogRecord,
  AuthUser,
  AutomationOverviewResponse,
  AutomationRulesConfig,
  AutomationSweepReport,
  BannerSlideRecord,
  BookmarkRecord,
  BootstrapStatus,
  CertificateApplicationRecord,
  ClearanceOfficeKey,
  CourseRecord,
  DepartmentApprovalOverviewResponse,
  DepartmentPersonRecord,
  DepartmentRecord,
  DepartmentRequestCategory,
  DepartmentRequestPriority,
  DepartmentRequestRecord,
  DigitalDocumentMeta,
  ExamApplicationRecord,
  ExamCircularRecord,
  ExamResultRecord,
  FacultyProfileRequestRecord,
  FeeConfig,
  GalleryItemRecord,
  HallApplicationRecord,
  HallCircularRecord,
  HallDueRecord,
  InquiryRecord,
  LibraryApplicationRecord,
  LibraryBorrowRecord,
  LibraryCardRecord,
  NoticeBoardScope,
  NoticeCategory,
  NoticeRecord,
  NoticeVisibility,
  OfficeFlowType,
  PaymentGatewayConfig,
  PaymentReceiptRecord,
  PublicationRecord,
  PublicStatusLookupResult,
  SignupTokenRecord,
  StudentRecord,
  UniversityProfile,
  UserRole,
  VerificationLookupResult,
  ViceChancellorRecord,
} from '../types/pust';

async function apiFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('X-Requested-With', 'XMLHttpRequest');
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, {
    cache: 'no-store',
    ...init,
    headers,
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof data?.error === 'string' ? data.error : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

export const pustApi = {
  // Public institutional & CMS data
  getUniversityProfile: () =>
    apiFetch<{
      profile: UniversityProfile;
      aboutSections: AboutContentRecord[];
      vcProfiles: ViceChancellorRecord[];
      galleryItems: GalleryItemRecord[];
      bannerSlides: BannerSlideRecord[];
    }>('/api/university-profile'),

  getDepartments: () => apiFetch<{ departments: DepartmentRecord[] }>('/api/departments'),

  getDepartmentByCode: (code: string) =>
    apiFetch<{ department: DepartmentRecord }>(
      `/api/departments/${encodeURIComponent(code.trim().toUpperCase())}`
    ),

  getPublications: () => apiFetch<{ publications: PublicationRecord[] }>('/api/publications'),

  getNotices: (params?: {
    category?: string;
    search?: string;
    boardScope?: string;
    departmentCode?: string;
  }) => {
    const qsParams = new URLSearchParams();
    if (params?.category && params.category !== 'All') qsParams.set('category', params.category);
    if (params?.search && params.search.trim()) qsParams.set('search', params.search.trim());
    if (params?.boardScope && params.boardScope !== 'all') qsParams.set('boardScope', params.boardScope);
    if (params?.departmentCode && params.departmentCode !== 'ALL') {
      qsParams.set('departmentCode', params.departmentCode);
    }
    const qs = qsParams.toString();
    return apiFetch<{ notices: NoticeRecord[] }>(`/api/notices${qs ? `?${qs}` : ''}`);
  },

  createNotice: (payload: {
    referenceNo: string;
    title: string;
    category: NoticeCategory;
    departmentCode: string;
    boardScope: NoticeBoardScope;
    visibility: NoticeVisibility;
    targetSession?: string;
    targetCourseCode?: string;
    attachmentName?: string;
    attachmentUrl?: string;
    attachmentType?: 'image' | 'pdf' | 'other';
    summary: string;
    body: string;
    pinned?: boolean;
  }) =>
    apiFetch<{ notice: NoticeRecord }>('/api/notices', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateNotice: (
    id: string,
    payload: Partial<{
      referenceNo: string;
      title: string;
      category: NoticeCategory;
      departmentCode: string;
      boardScope: NoticeBoardScope;
      visibility: NoticeVisibility;
      targetSession: string;
      targetCourseCode: string;
      attachmentName: string;
      attachmentUrl: string;
      attachmentType: 'image' | 'pdf' | 'other';
      summary: string;
      body: string;
      pinned: boolean;
    }>
  ) =>
    apiFetch<{ notice: NoticeRecord }>(`/api/notices/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteNotice: (id: string) =>
    apiFetch<{ deleted: boolean }>(`/api/notices/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  submitInquiry: (payload: {
    fullName: string;
    email: string;
    phone: string;
    programLevel: InquiryRecord['programLevel'];
    departmentCode: string;
    message: string;
  }) =>
    apiFetch<{ inquiry: InquiryRecord }>('/api/inquiries', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getInquiries: () => apiFetch<{ inquiries: InquiryRecord[] }>('/api/inquiries'),

  markInquiryReviewed: (id: string, responseNote?: string) =>
    apiFetch<{ updated: boolean; inquiry?: InquiryRecord }>(
      `/api/inquiries/${encodeURIComponent(id)}/review`,
      {
        method: 'PATCH',
        body: JSON.stringify({ responseNote }),
      }
    ),

  verifyDocument: (code: string) =>
    apiFetch<{ verification: VerificationLookupResult }>(
      `/api/verify/${encodeURIComponent(code.trim())}`
    ),

  checkPublicStatus: (query: string) =>
    apiFetch<{ result: PublicStatusLookupResult }>(
      `/api/status?q=${encodeURIComponent(query.trim())}`
    ),

  // Authentication & Registration
  getBootstrapStatus: () => apiFetch<BootstrapStatus>('/api/auth/bootstrap-status'),

  getMe: () => apiFetch<{ user: AuthUser | null }>('/api/auth/me'),

  login: (email: string, password: string) =>
    apiFetch<{ user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  registerStudent: (payload: {
    signupToken: string;
    name: string;
    email: string;
    password: string;
    admissionDocuments: string[];
    digitalDocuments?: DigitalDocumentMeta[];
  }) =>
    apiFetch<{ user: AuthUser; pendingMessage: string }>('/api/auth/register-student', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  registerOfficer: (payload: {
    name: string;
    email: string;
    password: string;
    role: Exclude<UserRole, 'admin' | 'student'>;
    departmentCode: string;
    academicId: string;
    hallAffiliation: string;
  }) =>
    apiFetch<{ user: AuthUser; pendingMessage: string }>('/api/auth/register-officer', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  bootstrapAdmin: (payload: { name: string; email: string; password: string }) =>
    apiFetch<{ user: AuthUser }>('/api/auth/bootstrap-admin', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  adminPasscodeLogin: (payload: { name?: string; email: string; passcode: string }) =>
    apiFetch<{ user: AuthUser }>('/api/auth/admin-passcode-login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  logout: () =>
    apiFetch<{ ok: boolean }>('/api/auth/logout', {
      method: 'POST',
    }),

  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    apiFetch<{ user: AuthUser }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Bookmarks
  getBookmarks: () => apiFetch<{ bookmarks: BookmarkRecord[] }>('/api/bookmarks'),

  addBookmark: (payload: {
    itemType: 'department' | 'notice';
    itemId: string;
    title: string;
    subtitle: string;
  }) =>
    apiFetch<{ bookmark: BookmarkRecord }>('/api/bookmarks', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  removeBookmark: (itemId: string) =>
    apiFetch<{ removed: boolean }>(`/api/bookmarks/${encodeURIComponent(itemId)}`, {
      method: 'DELETE',
    }),

  // Portal: Users, Approvals, Assignments & Signup Tokens
  getUsers: () => apiFetch<{ users: AuthUser[] }>('/api/portal/users'),

  createAdminUser: (payload: AdminCreateUserPayload) =>
    apiFetch<{ user: AuthUser }>('/api/portal/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateAdminUser: (id: string, payload: AdminUpdateUserPayload) =>
    apiFetch<{ user: AuthUser }>(`/api/portal/users/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  resetAdminUserPassword: (id: string, newPassword: string, mustChangePassword?: boolean) =>
    apiFetch<{ updated: boolean }>(`/api/portal/users/${encodeURIComponent(id)}/password`, {
      method: 'PATCH',
      body: JSON.stringify({
        newPassword,
        ...(mustChangePassword !== undefined ? { mustChangePassword } : {}),
      }),
    }),

  deleteAdminUser: (id: string) =>
    apiFetch<{ deleted: boolean }>(`/api/portal/users/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  approveUser: (id: string, approvalStatus: 'approved' | 'rejected') =>
    apiFetch<{ user: AuthUser }>(`/api/portal/users/${encodeURIComponent(id)}/approval`, {
      method: 'PATCH',
      body: JSON.stringify({ approvalStatus }),
    }),

  assignTeacher: (id: string, assignedCourses: string[], assignedSessions: string[]) =>
    apiFetch<{ user: AuthUser }>(`/api/portal/users/${encodeURIComponent(id)}/assignments`, {
      method: 'PATCH',
      body: JSON.stringify({ assignedCourses, assignedSessions }),
    }),

  getSignupTokens: () => apiFetch<{ tokens: SignupTokenRecord[] }>('/api/portal/signup-tokens'),

  createSignupToken: (payload: {
    studentName: string;
    studentEmail: string;
    studentPhone: string;
    departmentCode: string;
    session: string;
    academicId: string;
    hallAffiliation: string;
  }) =>
    apiFetch<{ token: SignupTokenRecord }>('/api/portal/signup-tokens', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Portal: Combinable Student Database
  getStudents: (filters?: { department?: string; session?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (filters?.department && filters.department !== 'ALL') qs.set('department', filters.department);
    if (filters?.session && filters.session !== 'ALL') qs.set('session', filters.session);
    if (filters?.search && filters.search.trim()) qs.set('search', filters.search.trim());
    const q = qs.toString();
    return apiFetch<{ students: StudentRecord[] }>(`/api/portal/students${q ? `?${q}` : ''}`);
  },

  updateStudentRecords: (
    id: string,
    payload: {
      chairmanNotes?: string;
      adminNotes?: string;
      disciplinaryStatus?: StudentRecord['disciplinaryStatus'];
      disciplinaryNotes?: string;
    }
  ) =>
    apiFetch<{ student: StudentRecord }>(`/api/portal/students/${encodeURIComponent(id)}/records`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // Portal: Library Membership & Cards
  getLibraryOverview: () =>
    apiFetch<{
      applications: LibraryApplicationRecord[];
      cards: LibraryCardRecord[];
      borrows: LibraryBorrowRecord[];
    }>('/api/portal/library/overview'),

  applyLibrary: () =>
    apiFetch<{ application: LibraryApplicationRecord }>('/api/portal/library/apply', {
      method: 'POST',
      body: JSON.stringify({}),
    }),

  chairmanSealLibrary: (
    id: string,
    payload: {
      decision: 'forward' | 'reject';
      officialSeal: string;
      digitalSignature: string;
      note?: string;
    }
  ) =>
    apiFetch<{
      application: LibraryApplicationRecord;
      card?: LibraryCardRecord | null;
      autoIssued?: boolean;
    }>(
      `/api/portal/library/applications/${encodeURIComponent(id)}/chairman`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    ),

  verifyLibrary: (
    id: string,
    payload: {
      decision: 'approve' | 'reject';
      physicalCardRef?: string;
      note?: string;
    }
  ) =>
    apiFetch<{ application: LibraryApplicationRecord; card?: LibraryCardRecord }>(
      `/api/portal/library/applications/${encodeURIComponent(id)}/verify`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    ),

  borrowBook: (payload: {
    academicId: string;
    bookTitle: string;
    isbn: string;
    dueAt: string;
  }) =>
    apiFetch<{ borrow: LibraryBorrowRecord }>('/api/portal/library/borrows', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  returnBook: (id: string) =>
    apiFetch<{ borrow: LibraryBorrowRecord }>(
      `/api/portal/library/borrows/${encodeURIComponent(id)}/return`,
      {
        method: 'PATCH',
        body: JSON.stringify({}),
      }
    ),

  // Portal: Residential Hall Management & Clearance
  getHallsOverview: () =>
    apiFetch<{
      circulars: HallCircularRecord[];
      applications: HallApplicationRecord[];
      dues: HallDueRecord[];
      gateways: PaymentGatewayConfig[];
    }>('/api/portal/halls/overview'),

  createHallCircular: (payload: {
    hallName: string;
    title: string;
    vacantSeats: number;
    deadline: string;
    description: string;
  }) =>
    apiFetch<{ circular: HallCircularRecord }>('/api/portal/halls/circulars', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  applyHall: (payload: { circularId: string; statement: string }) =>
    apiFetch<{ application: HallApplicationRecord }>('/api/portal/halls/apply', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  reviewHallApp: (
    id: string,
    payload: {
      status: 'accepted' | 'rejected';
      reviewNote: string;
      assignedSeat?: string;
    }
  ) =>
    apiFetch<{ application: HallApplicationRecord }>(
      `/api/portal/halls/applications/${encodeURIComponent(id)}/review`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    ),

  reassignHallSeat: (id: string, payload: { assignedSeat: string; note: string }) =>
    apiFetch<{ application: HallApplicationRecord }>(
      `/api/portal/halls/applications/${encodeURIComponent(id)}/seat`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    ),

  createHallDue: (payload: {
    academicId: string;
    hallName: string;
    feeTitle: string;
    amountBdt: number;
  }) =>
    apiFetch<{ due: HallDueRecord }>('/api/portal/halls/dues', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  payHallDue: (id: string, payload: { paymentMethod: string; paymentRef: string }) =>
    apiFetch<{ due: HallDueRecord }>(`/api/portal/halls/dues/${encodeURIComponent(id)}/pay`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  clearHallDue: (id: string) =>
    apiFetch<{ due: HallDueRecord }>(`/api/portal/halls/dues/${encodeURIComponent(id)}/clear`, {
      method: 'PATCH',
      body: JSON.stringify({}),
    }),

  // Portal: Exams, Courses, Payments, Admit Cards & Results
  getExamsOverview: () =>
    apiFetch<{
      courses: CourseRecord[];
      circulars: ExamCircularRecord[];
      applications: ExamApplicationRecord[];
      results: ExamResultRecord[];
      gateways: PaymentGatewayConfig[];
      hallClearanceBlocked: boolean;
      unpaidHallDues: HallDueRecord[];
    }>('/api/portal/exams/overview'),

  createCourse: (payload: {
    code: string;
    title: string;
    credits: number;
    departmentCode: string;
    semester: number;
    session: string;
    teacherEmail?: string;
  }) =>
    apiFetch<{ course: CourseRecord }>('/api/portal/exams/courses', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  createExamCircular: (payload: {
    title: string;
    departmentCode: string;
    semester: number;
    session: string;
    deadline: string;
    feeBdt: number;
    eligibleCourseCodes: string[];
  }) =>
    apiFetch<{ circular: ExamCircularRecord }>('/api/portal/exams/circulars', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  applyExam: (payload: { circularId: string; selectedCourseCodes: string[] }) =>
    apiFetch<{ application: ExamApplicationRecord }>('/api/portal/exams/apply', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  payExam: (id: string, payload: { paymentMethod: string; transactionId: string }) =>
    apiFetch<{
      application: ExamApplicationRecord;
      autoIssued?: boolean;
      holdReason?: string;
    }>(
      `/api/portal/exams/applications/${encodeURIComponent(id)}/pay`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  verifyExam: (id: string, payload: { decision: 'Approved' | 'Rejected'; physicalCollected?: boolean }) =>
    apiFetch<{ application: ExamApplicationRecord }>(
      `/api/portal/exams/applications/${encodeURIComponent(id)}/verify`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    ),

  getExamStudentContext: (academicId: string) =>
    apiFetch<{ student: StudentRecord; previousResults: ExamResultRecord[] }>(
      `/api/portal/exams/student-context/${encodeURIComponent(academicId.trim())}`
    ),

  publishExamResult: (payload: {
    academicId: string;
    semester: number;
    promotionMode: 'auto' | 'manual_promoted' | 'manual_repeat';
    courses: Array<{ code: string; title: string; credits: number; marks: number }>;
  }) =>
    apiFetch<{ result: ExamResultRecord; pendingChairmanReview?: boolean; cumulativeCgpa?: number }>(
      '/api/portal/exams/results',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  approvePendingExamResult: (
    id: string,
    promotionMode?: 'auto' | 'manual_promoted' | 'manual_repeat'
  ) =>
    apiFetch<{ result: ExamResultRecord }>(
      `/api/portal/exams/results/${encodeURIComponent(id)}/publish`,
      {
        method: 'PATCH',
        body: JSON.stringify({ promotionMode }),
      }
    ),

  // Portal: Certificate Application & 4-Office Independent Clearances
  getCertificatesOverview: () =>
    apiFetch<{
      applications: CertificateApplicationRecord[];
      feeConfig: FeeConfig;
      gateways: PaymentGatewayConfig[];
      student: StudentRecord | null;
    }>('/api/portal/certificates/overview'),

  applyCertificate: (payload: {
    certificateType: 'Temporary Certificate' | 'Provisional Transcript';
    paymentMethod: string;
    transactionId: string;
  }) =>
    apiFetch<{
      application: CertificateApplicationRecord;
      clearedOffices?: ClearanceOfficeKey[];
      autoIssued?: boolean;
    }>('/api/portal/certificates/apply', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  reviewCertificateOffice: (
    id: string,
    payload: { decision: 'approved' | 'declined'; note: string }
  ) =>
    apiFetch<{ application: CertificateApplicationRecord; autoIssued?: boolean }>(
      `/api/portal/certificates/${encodeURIComponent(id)}/office-review`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    ),

  resubmitCertificateOffice: (id: string, payload: { office: ClearanceOfficeKey; note: string }) =>
    apiFetch<{ application: CertificateApplicationRecord }>(
      `/api/portal/certificates/${encodeURIComponent(id)}/resubmit`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  finalAdminCertificate: (
    id: string,
    payload: { decision: 'approved' | 'rejected'; adminNote?: string; physicalCollected?: boolean }
  ) =>
    apiFetch<{ application: CertificateApplicationRecord }>(
      `/api/portal/certificates/${encodeURIComponent(id)}/admin-final`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    ),

  // Portal: CMS, Payment Configuration & Audit Logs
  upsertAboutSection: (payload: {
    slug: AboutContentRecord['slug'];
    title: string;
    body: string;
  }) =>
    apiFetch<{ section: AboutContentRecord }>('/api/portal/cms/about', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  updateViceChancellor: (payload: {
    name: string;
    email: string;
    phone: string;
    tenure: string;
    message: string;
    photoUrl?: string;
    promoteNewVc: boolean;
  }) =>
    apiFetch<{ profiles: ViceChancellorRecord[] }>('/api/portal/cms/vice-chancellor', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  createFormerViceChancellor: (payload: {
    name: string;
    tenure: string;
    email: string;
    phone: string;
    message: string;
    photoUrl?: string;
  }) =>
    apiFetch<{ profiles: ViceChancellorRecord[] }>('/api/portal/cms/vice-chancellor', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateViceChancellorById: (
    id: string,
    payload: Partial<Omit<ViceChancellorRecord, 'id' | 'isCurrent'>>
  ) =>
    apiFetch<{ profiles: ViceChancellorRecord[] }>(
      `/api/portal/cms/vice-chancellor/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    ),

  deleteViceChancellorById: (id: string) =>
    apiFetch<{ profiles: ViceChancellorRecord[] }>(
      `/api/portal/cms/vice-chancellor/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
      }
    ),

  uploadMediaToImageKit: (payload: {
    purpose: 'banner' | 'notice' | 'gallery' | 'cms' | 'faculty_photo';
    fileName: string;
    mimeType: string;
    dataBase64: string;
  }) =>
    apiFetch<{
      url: string;
      fileId: string;
      name: string;
      mimeType: string;
      attachmentType: 'image' | 'pdf';
    }>('/api/portal/media/upload', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  createBannerSlide: (payload: { imageUrl: string; caption: string; alt?: string }) =>
    apiFetch<{ slide: BannerSlideRecord; bannerSlides: BannerSlideRecord[] }>(
      '/api/portal/cms/banners',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  updateBannerSlide: (
    id: string,
    payload: { imageUrl?: string; caption?: string; alt?: string }
  ) =>
    apiFetch<{ slide: BannerSlideRecord; bannerSlides: BannerSlideRecord[] }>(
      `/api/portal/cms/banners/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    ),

  reorderBannerSlides: (orderedIds: string[]) =>
    apiFetch<{ bannerSlides: BannerSlideRecord[] }>('/api/portal/cms/banners/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ orderedIds }),
    }),

  deleteBannerSlide: (id: string) =>
    apiFetch<{ deleted: boolean; bannerSlides: BannerSlideRecord[] }>(
      `/api/portal/cms/banners/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
      }
    ),

  createGalleryItem: (payload: {
    title: string;
    description: string;
    category: GalleryItemRecord['category'];
    mediaType: GalleryItemRecord['mediaType'];
    mediaUrl: string;
    eventDate: string;
    visibility: 'public' | 'registered';
  }) =>
    apiFetch<{ item: GalleryItemRecord }>('/api/portal/cms/gallery', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateGalleryItem: (
    id: string,
    payload: Partial<{
      title: string;
      description: string;
      category: GalleryItemRecord['category'];
      mediaType: GalleryItemRecord['mediaType'];
      mediaUrl: string;
      eventDate: string;
      visibility: 'public' | 'registered';
    }>
  ) =>
    apiFetch<{ item: GalleryItemRecord }>(`/api/portal/cms/gallery/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteGalleryItem: (id: string) =>
    apiFetch<{ deleted: boolean }>(`/api/portal/cms/gallery/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  updateUniversityProfile: (payload: Partial<UniversityProfile>) =>
    apiFetch<{ profile: UniversityProfile }>('/api/portal/cms/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  createDepartment: (payload: Omit<DepartmentRecord, 'id'>) =>
    apiFetch<{ department: DepartmentRecord }>('/api/portal/cms/departments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateDepartment: (id: string, payload: Partial<Omit<DepartmentRecord, 'id' | 'code'>>) =>
    apiFetch<{ department: DepartmentRecord }>(`/api/portal/cms/departments/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteDepartment: (id: string) =>
    apiFetch<{ deleted: boolean }>(`/api/portal/cms/departments/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  createPublication: (payload: Omit<PublicationRecord, 'id'>) =>
    apiFetch<{ publication: PublicationRecord }>('/api/portal/cms/publications', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updatePublication: (id: string, payload: Partial<Omit<PublicationRecord, 'id'>>) =>
    apiFetch<{ publication: PublicationRecord }>(`/api/portal/cms/publications/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deletePublication: (id: string) =>
    apiFetch<{ deleted: boolean }>(`/api/portal/cms/publications/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  getPaymentConfig: () =>
    apiFetch<{ gateways: PaymentGatewayConfig[]; feeConfig: FeeConfig }>('/api/portal/config/payments'),

  savePaymentGateway: (payload: PaymentGatewayConfig) =>
    apiFetch<{ gateway: PaymentGatewayConfig }>('/api/portal/config/payments', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  saveFeeConfig: (payload: FeeConfig) =>
    apiFetch<{ feeConfig: FeeConfig }>('/api/portal/config/fees', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  getAuditLogs: (filters?: {
    category?: string;
    severity?: string;
    actorRole?: string;
    search?: string;
    limit?: number;
  }) => {
    const qs = new URLSearchParams();
    if (filters?.category && filters.category !== 'ALL') qs.set('category', filters.category);
    if (filters?.severity && filters.severity !== 'ALL') qs.set('severity', filters.severity);
    if (filters?.actorRole && filters.actorRole !== 'ALL') qs.set('actorRole', filters.actorRole);
    if (filters?.search && filters.search.trim()) qs.set('search', filters.search.trim());
    if (filters?.limit) qs.set('limit', String(filters.limit));
    const q = qs.toString();
    return apiFetch<{ logs: AuditLogRecord[] }>(`/api/portal/audit-logs${q ? `?${q}` : ''}`);
  },

  // Portal: Unified Digital Payment Checkout & Institutional Receipts Ledger
  getPaymentReceipts: () =>
    apiFetch<{ receipts: PaymentReceiptRecord[] }>('/api/portal/payments/receipts'),

  checkoutPayment: (payload: {
    targetType: 'hall_due' | 'exam_application' | 'certificate';
    targetId?: string;
    certificateType?: 'Temporary Certificate' | 'Provisional Transcript';
    gatewayCode: string;
    accountMask?: string;
    manualRef?: string;
  }) =>
    apiFetch<{
      receipt: PaymentReceiptRecord;
      updatedTarget: unknown;
      autoCleared?: boolean;
      autoIssued?: boolean;
      holdReason?: string;
      clearedOffices?: ClearanceOfficeKey[];
    }>('/api/portal/payments/checkout', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Portal: Automated Office Flow Engine
  getAutomationOverview: () =>
    apiFetch<AutomationOverviewResponse>('/api/portal/automation/overview'),

  updateAutomationRules: (payload: Partial<AutomationRulesConfig>) =>
    apiFetch<{ rules: AutomationRulesConfig }>('/api/portal/automation/config', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  advanceOfficeFlowItem: (payload: { flowType: OfficeFlowType; targetId: string }) =>
    apiFetch<{ processed: boolean; outcome: 'processed' | 'held'; detail: string }>(
      '/api/portal/automation/advance',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  runOfficeAutomationSweep: () =>
    apiFetch<{ report: AutomationSweepReport }>('/api/portal/automation/sweep', {
      method: 'POST',
      body: JSON.stringify({}),
    }),

  // Portal: Department Head Approval Dashboard
  getDepartmentApprovals: (department?: string) => {
    const qs = department && department !== 'ALL' ? `?department=${encodeURIComponent(department)}` : '';
    return apiFetch<DepartmentApprovalOverviewResponse>(`/api/portal/approvals${qs}`);
  },

  submitDepartmentRequest: (payload: {
    title: string;
    category: DepartmentRequestCategory;
    priority: DepartmentRequestPriority;
    departmentCode?: string;
    summary: string;
    justification: string;
    requestedAmountBdt?: number;
    targetDate?: string;
    attachments?: string[];
  }) =>
    apiFetch<{ request: DepartmentRequestRecord }>('/api/portal/approvals', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  reviewDepartmentRequest: (
    id: string,
    payload: { decision: 'approve' | 'request_revision' | 'decline'; note?: string }
  ) =>
    apiFetch<{ request: DepartmentRequestRecord }>(
      `/api/portal/approvals/${encodeURIComponent(id)}/decision`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    ),

  resubmitDepartmentRequest: (
    id: string,
    payload: {
      summary: string;
      justification: string;
      responseNote: string;
      attachments?: string[];
    }
  ) =>
    apiFetch<{ request: DepartmentRequestRecord }>(
      `/api/portal/approvals/${encodeURIComponent(id)}/resubmit`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    ),

  // Portal: Teacher Directory Profile Claim & Admin Approval
  getTeacherProfileStatus: () =>
    apiFetch<{
      user: AuthUser;
      department: DepartmentRecord | null;
      claimedMember: DepartmentPersonRecord | null;
      claimedMap: Record<string, { claimedByMe: boolean; claimedByName?: string }>;
      requests: FacultyProfileRequestRecord[];
    }>('/api/portal/teacher/profile-status'),

  claimTeacherProfile: (payload: { memberId: string; facultyGroup: 'faculty' | 'contractual' }) =>
    apiFetch<{
      user: AuthUser;
      claimedMember: DepartmentPersonRecord;
      facultyGroup: 'faculty' | 'contractual';
    }>('/api/portal/teacher/claim-profile', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  unclaimTeacherProfile: () =>
    apiFetch<{ user: AuthUser }>('/api/portal/teacher/claim-profile', {
      method: 'DELETE',
    }),

  submitTeacherProfileRequest: (payload: {
    requestType: 'edit_claimed' | 'create_new';
    facultyGroup: 'faculty' | 'contractual';
    targetMemberId?: string;
    proposedProfile: Omit<DepartmentPersonRecord, 'id'>;
  }) =>
    apiFetch<{ request: FacultyProfileRequestRecord }>('/api/portal/teacher/profile-requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getAdminFacultyProfileRequests: () =>
    apiFetch<{
      requests: Array<
        FacultyProfileRequestRecord & { currentMember: DepartmentPersonRecord | null }
      >;
    }>('/api/portal/admin/faculty-requests'),

  reviewAdminFacultyProfileRequest: (
    id: string,
    payload: { decision: 'approve' | 'reject'; adminNote?: string }
  ) =>
    apiFetch<{
      request: FacultyProfileRequestRecord;
      department?: DepartmentRecord | null;
      member?: DepartmentPersonRecord;
    }>(`/api/portal/admin/faculty-requests/${encodeURIComponent(id)}/decision`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
};
