import { MongoClient, ObjectId, type Collection, type Db } from 'mongodb';
import crypto from 'node:crypto';
import type {
  AboutContentRecord,
  AuditLogRecord,
  AuthUser,
  BookmarkRecord,
  CertificateApplicationRecord,
  CourseRecord,
  DepartmentRecord,
  ExamApplicationRecord,
  ExamCircularRecord,
  ExamResultRecord,
  FeeConfig,
  GalleryItemRecord,
  HallApplicationRecord,
  HallCircularRecord,
  HallDueRecord,
  InquiryRecord,
  LibraryApplicationRecord,
  LibraryBorrowRecord,
  LibraryCardRecord,
  NoticeRecord,
  PaymentGatewayConfig,
  PaymentReceiptRecord,
  PublicationRecord,
  PublicStatusLookupResult,
  SignupTokenRecord,
  StudentRecord,
  UniversityProfile,
  VerificationLookupResult,
  ViceChancellorRecord,
} from '../src/types/pust';
import {
  SEED_ABOUT_SECTIONS,
  SEED_CERTIFICATE_APPLICATIONS,
  SEED_COURSES,
  SEED_DEPARTMENTS,
  SEED_EXAM_APPLICATIONS,
  SEED_EXAM_CIRCULARS,
  SEED_EXAM_RESULTS,
  SEED_FEE_CONFIG,
  SEED_GALLERY_ITEMS,
  SEED_HALL_CIRCULARS,
  SEED_HALL_DUES,
  SEED_INQUIRIES,
  SEED_LIBRARY_CARDS,
  SEED_NOTICES,
  SEED_PAYMENT_GATEWAYS,
  SEED_PAYMENT_RECEIPTS,
  SEED_PUBLICATIONS,
  SEED_STUDENTS,
  SEED_UNIVERSITY_PROFILE,
  SEED_VC_PROFILES,
} from './seedData';

export interface StoredUser extends AuthUser {
  passwordHash: string;
}

class PustRepository {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private storageBackend: 'mongodb' | 'memory' = 'memory';

  // Persistent collections in memory when MONGODB_URI is unset; backed by MongoDB Native when MONGODB_URI is set
  private users: StoredUser[] = [];
  private signupTokens: SignupTokenRecord[] = [];
  private students: StudentRecord[] = [...SEED_STUDENTS];
  private courses: CourseRecord[] = [...SEED_COURSES];
  private departments: DepartmentRecord[] = [...SEED_DEPARTMENTS];
  private publications: PublicationRecord[] = [...SEED_PUBLICATIONS];
  private notices: NoticeRecord[] = [...SEED_NOTICES];
  private libraryApps: LibraryApplicationRecord[] = [];
  private libraryCards: LibraryCardRecord[] = [...SEED_LIBRARY_CARDS];
  private libraryBorrows: LibraryBorrowRecord[] = [];
  private hallCirculars: HallCircularRecord[] = [...SEED_HALL_CIRCULARS];
  private hallApps: HallApplicationRecord[] = [];
  private hallDues: HallDueRecord[] = [...SEED_HALL_DUES];
  private examCirculars: ExamCircularRecord[] = [...SEED_EXAM_CIRCULARS];
  private examApps: ExamApplicationRecord[] = [...SEED_EXAM_APPLICATIONS];
  private examResults: ExamResultRecord[] = [...SEED_EXAM_RESULTS];
  private certificateApps: CertificateApplicationRecord[] = [...SEED_CERTIFICATE_APPLICATIONS];
  private paymentGateways: PaymentGatewayConfig[] = [...SEED_PAYMENT_GATEWAYS];
  private paymentReceipts: PaymentReceiptRecord[] = [...SEED_PAYMENT_RECEIPTS];
  private feeConfig: FeeConfig = { ...SEED_FEE_CONFIG };
  private galleryItems: GalleryItemRecord[] = [...SEED_GALLERY_ITEMS];
  private aboutSections: AboutContentRecord[] = [...SEED_ABOUT_SECTIONS];
  private vcProfiles: ViceChancellorRecord[] = [...SEED_VC_PROFILES];
  private auditLogs: AuditLogRecord[] = [];
  private inquiries: InquiryRecord[] = [...SEED_INQUIRIES];
  private bookmarks: BookmarkRecord[] = [];

  async init(): Promise<void> {
    const uri = process.env.MONGODB_URI?.trim();
    const dbName = process.env.MONGODB_DB_NAME?.trim() || 'pust_portal';

    if (!uri) {
      this.storageBackend = 'memory';
      return;
    }

    try {
      const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
      await client.connect();
      const db = client.db(dbName);
      await db.command({ ping: 1 });
      this.client = client;
      this.db = db;
      this.storageBackend = 'mongodb';
      await this.syncMongoBootstrap(db);
    } catch (err) {
      console.warn(
        '[PUST DB] Could not connect to MONGODB_URI; falling back to preview memory store:',
        err instanceof Error ? err.message : String(err)
      );
      this.client = null;
      this.db = null;
      this.storageBackend = 'memory';
    }
  }

  private col<T extends { id: string }>(name: string): Collection<T> {
    if (!this.db) throw new Error('MongoDB is not active');
    return this.db.collection<T>(name);
  }

  private async syncMongoBootstrap(db: Db): Promise<void> {
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('signup_tokens').createIndex({ token: 1 }, { unique: true });
    await db.collection('students').createIndex({ academicId: 1 }, { unique: true });
    await db.collection('notices').createIndex({ publishedAt: -1 });
    await db.collection('bookmarks').createIndex({ userId: 1, itemId: 1 }, { unique: true });

    const seedIfEmpty = async <T extends object>(name: string, docs: T[]) => {
      const c = db.collection<T>(name);
      if ((await c.countDocuments()) === 0 && docs.length > 0) {
        await c.insertMany(docs as never[]);
      }
    };

    await seedIfEmpty('departments', SEED_DEPARTMENTS);
    await seedIfEmpty('publications', SEED_PUBLICATIONS);
    await seedIfEmpty('notices', SEED_NOTICES);
    await seedIfEmpty('students', SEED_STUDENTS);
    await seedIfEmpty('courses', SEED_COURSES);
    await seedIfEmpty('exam_circulars', SEED_EXAM_CIRCULARS);
    await seedIfEmpty('exam_applications', SEED_EXAM_APPLICATIONS);
    await seedIfEmpty('exam_results', SEED_EXAM_RESULTS);
    await seedIfEmpty('hall_circulars', SEED_HALL_CIRCULARS);
    await seedIfEmpty('hall_dues', SEED_HALL_DUES);
    await seedIfEmpty('library_cards', SEED_LIBRARY_CARDS);
    await seedIfEmpty('certificate_applications', SEED_CERTIFICATE_APPLICATIONS);
    await seedIfEmpty('payment_gateways', SEED_PAYMENT_GATEWAYS);
    await seedIfEmpty('payment_receipts', SEED_PAYMENT_RECEIPTS);
    await seedIfEmpty('inquiries', SEED_INQUIRIES);
    await seedIfEmpty('gallery_items', SEED_GALLERY_ITEMS);
    await seedIfEmpty('about_sections', SEED_ABOUT_SECTIONS);
    await seedIfEmpty('vc_profiles', SEED_VC_PROFILES);

    const feeCol = db.collection<FeeConfig & { id: string }>('fee_config');
    if ((await feeCol.countDocuments()) === 0) {
      await feeCol.insertOne({ id: 'global-fee-config', ...SEED_FEE_CONFIG });
    }
  }

  private async getAll<T extends { id: string }>(name: string, mem: T[]): Promise<T[]> {
    if (this.storageBackend === 'mongodb') {
      return this.col<T>(name).find({}, { projection: { _id: 0 } }).toArray() as Promise<T[]>;
    }
    return [...mem];
  }

  private async insertItem<T extends { id: string }>(name: string, mem: T[], item: T): Promise<T> {
    if (this.storageBackend === 'mongodb') {
      await this.col<T>(name).insertOne({ ...item } as never);
      return item;
    }
    mem.unshift(item);
    return item;
  }

  private async updateItem<T extends { id: string }>(
    name: string,
    mem: T[],
    id: string,
    patch: Partial<T>
  ): Promise<T | null> {
    if (this.storageBackend === 'mongodb') {
      await this.col<T>(name).updateOne({ id } as never, { $set: patch } as never);
      const updated = await this.col<T>(name).findOne({ id } as never, {
        projection: { _id: 0 },
      });
      return (updated as T | null) ?? null;
    }
    const idx = mem.findIndex((x) => x.id === id);
    if (idx === -1) return null;
    mem[idx] = { ...mem[idx], ...patch };
    return mem[idx];
  }

  private async removeItem<T extends { id: string }>(
    name: string,
    mem: T[],
    id: string
  ): Promise<boolean> {
    if (this.storageBackend === 'mongodb') {
      const res = await this.col<T>(name).deleteOne({ id } as never);
      return res.deletedCount === 1;
    }
    const idx = mem.findIndex((x) => x.id === id);
    if (idx === -1) return false;
    mem.splice(idx, 1);
    return true;
  }

  getStorageBackend(): 'mongodb' | 'memory' {
    return this.storageBackend;
  }

  getUniversityProfile(): UniversityProfile {
    return SEED_UNIVERSITY_PROFILE;
  }

  async logAudit(actorName: string, actorRole: AuthUser['role'], action: string, target: string) {
    const entry: AuditLogRecord = {
      id: `audit-${crypto.randomUUID()}`,
      actorName,
      actorRole,
      action,
      target,
      timestamp: new Date().toISOString(),
    };
    await this.insertItem('audit_logs', this.auditLogs, entry);
  }

  async listAuditLogs(): Promise<AuditLogRecord[]> {
    const items = await this.getAll('audit_logs', this.auditLogs);
    return items.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 60);
  }

  // Departments & Publications
  listDepartments = () => this.getAll('departments', this.departments);
  listPublications = () => this.getAll('publications', this.publications);

  // About CMS
  listAboutSections = () => this.getAll('about_sections', this.aboutSections);
  async upsertAboutSection(
    slug: AboutContentRecord['slug'],
    title: string,
    body: string
  ): Promise<AboutContentRecord> {
    const all = await this.listAboutSections();
    const existing = all.find((s) => s.slug === slug);
    const updatedAt = new Date().toISOString().slice(0, 10);
    if (existing) {
      const res = await this.updateItem('about_sections', this.aboutSections, existing.id, {
        title,
        body,
        updatedAt,
      });
      return res!;
    }
    return this.insertItem('about_sections', this.aboutSections, {
      id: `about-${slug}`,
      slug,
      title,
      body,
      updatedAt,
    });
  }

  // Vice-Chancellor Profile & Archive
  async listViceChancellors(): Promise<ViceChancellorRecord[]> {
    const list = await this.getAll('vc_profiles', this.vcProfiles);
    return list.sort((a, b) => b.orderIndex - a.orderIndex);
  }

  async updateCurrentViceChancellor(input: {
    name: string;
    email: string;
    phone: string;
    tenure: string;
    message: string;
    promoteNewVc: boolean;
  }): Promise<ViceChancellorRecord[]> {
    const list = await this.listViceChancellors();
    const current = list.find((v) => v.isCurrent);
    if (input.promoteNewVc && current) {
      await this.updateItem('vc_profiles', this.vcProfiles, current.id, {
        isCurrent: false,
        title: 'Former Vice-Chancellor',
      });
      const maxOrder = Math.max(...list.map((v) => v.orderIndex), 0);
      await this.insertItem('vc_profiles', this.vcProfiles, {
        id: `vc-${crypto.randomUUID()}`,
        name: input.name,
        title: 'Vice-Chancellor',
        tenure: input.tenure,
        email: input.email,
        phone: input.phone,
        message: input.message,
        isCurrent: true,
        orderIndex: maxOrder + 1,
      });
    } else if (current) {
      await this.updateItem('vc_profiles', this.vcProfiles, current.id, {
        name: input.name,
        tenure: input.tenure,
        email: input.email,
        phone: input.phone,
        message: input.message,
      });
    }
    return this.listViceChancellors();
  }

  // Gallery
  listGalleryItems = async () => {
    const items = await this.getAll('gallery_items', this.galleryItems);
    return items.sort((a, b) => b.eventDate.localeCompare(a.eventDate));
  };
  createGalleryItem = (item: Omit<GalleryItemRecord, 'id'>) =>
    this.insertItem('gallery_items', this.galleryItems, {
      id: `gal-${crypto.randomUUID()}`,
      ...item,
    });
  deleteGalleryItem = (id: string) => this.removeItem('gallery_items', this.galleryItems, id);

  // Notices (enforces backend visibility + scope + session/course filters)
  async listNotices(opts: {
    isAuthenticated: boolean;
    userRole?: AuthUser['role'];
    userDept?: string;
    userSession?: string;
    category?: string;
    search?: string;
    boardScope?: string;
    departmentCode?: string;
  }): Promise<NoticeRecord[]> {
    let items = await this.getAll('notices', this.notices);
    items.sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
      return b.publishedAt.localeCompare(a.publishedAt);
    });

    if (!opts.isAuthenticated) {
      items = items.filter((n) => n.visibility === 'public');
    } else if (opts.userRole === 'student') {
      items = items.filter((n) => {
        if (n.boardScope === 'central') return true;
        if (n.departmentCode !== opts.userDept) return false;
        if (n.targetSession && n.targetSession !== 'ALL' && n.targetSession !== opts.userSession) {
          return false;
        }
        return true;
      });
    }

    if (opts.boardScope && opts.boardScope !== 'all') {
      items = items.filter((n) => n.boardScope === opts.boardScope);
    }
    if (opts.departmentCode && opts.departmentCode !== 'ALL') {
      items = items.filter((n) => n.departmentCode === opts.departmentCode);
    }
    if (opts.category && opts.category !== 'All') {
      items = items.filter((n) => n.category === opts.category);
    }
    if (opts.search?.trim()) {
      const q = opts.search.trim().toLowerCase();
      items = items.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.referenceNo.toLowerCase().includes(q) ||
          n.summary.toLowerCase().includes(q) ||
          n.departmentCode.toLowerCase().includes(q)
      );
    }
    return items;
  }

  createNotice = (input: Omit<NoticeRecord, 'id'>) =>
    this.insertItem('notices', this.notices, {
      id: `notice-${crypto.randomUUID()}`,
      ...input,
    });

  deleteNotice = (id: string) => this.removeItem('notices', this.notices, id);

  // Users & Approvals
  async hasAdminUser(): Promise<boolean> {
    const list = await this.getAll('users', this.users);
    return list.some((u) => u.role === 'admin' && u.approvalStatus === 'approved');
  }

  async findUserByEmail(email: string): Promise<StoredUser | null> {
    const normalized = email.trim().toLowerCase();
    const list = await this.getAll('users', this.users);
    return list.find((u) => u.email === normalized) ?? null;
  }

  async listUsers(): Promise<AuthUser[]> {
    const list = await this.getAll('users', this.users);
    return list.map(({ passwordHash: _p, ...safe }) => safe);
  }

  async createUser(input: Omit<StoredUser, 'id' | 'createdAt'>): Promise<StoredUser> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const existing = await this.findUserByEmail(normalizedEmail);
    if (existing) throw new Error('DUPLICATE_EMAIL');

    const created: StoredUser = {
      id: `user-${crypto.randomUUID()}`,
      ...input,
      email: normalizedEmail,
      createdAt: new Date().toISOString(),
    };
    return this.insertItem('users', this.users, created);
  }

  updateUserApproval = (id: string, approvalStatus: AuthUser['approvalStatus']) =>
    this.updateItem('users', this.users, id, { approvalStatus });

  updateTeacherAssignments = (
    id: string,
    assignedCourses: string[],
    assignedSessions: string[]
  ) => this.updateItem('users', this.users, id, { assignedCourses, assignedSessions });

  // Student Signup Tokens
  listSignupTokens = () => this.getAll('signup_tokens', this.signupTokens);

  async createSignupToken(
    input: Omit<SignupTokenRecord, 'id' | 'token' | 'used' | 'createdAt'>
  ): Promise<SignupTokenRecord> {
    const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
    const token = `PUST-${input.departmentCode}-${rand}`;
    return this.insertItem('signup_tokens', this.signupTokens, {
      id: `tok-${crypto.randomUUID()}`,
      token,
      ...input,
      used: false,
      createdAt: new Date().toISOString(),
    });
  }

  async findValidToken(tokenStr: string): Promise<SignupTokenRecord | null> {
    const list = await this.listSignupTokens();
    return list.find((t) => t.token === tokenStr.trim().toUpperCase() && !t.used) ?? null;
  }

  markTokenUsed = (id: string) => this.updateItem('signup_tokens', this.signupTokens, id, { used: true });

  // Students Database
  async listStudents(filters?: {
    department?: string;
    session?: string;
    search?: string;
  }): Promise<StudentRecord[]> {
    let list = await this.getAll('students', this.students);
    if (filters?.department && filters.department !== 'ALL') {
      list = list.filter((s) => s.departmentCode === filters.department);
    }
    if (filters?.session && filters.session !== 'ALL') {
      list = list.filter((s) => s.session === filters.session);
    }
    if (filters?.search?.trim()) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.academicId.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q)
      );
    }
    return list;
  }

  async findStudentByAcademicId(academicId: string): Promise<StudentRecord | null> {
    const list = await this.getAll('students', this.students);
    return list.find((s) => s.academicId === academicId) ?? null;
  }

  upsertStudent = async (record: StudentRecord): Promise<StudentRecord> => {
    const existing = await this.findStudentByAcademicId(record.academicId);
    if (existing) {
      return (await this.updateItem('students', this.students, existing.id, record))!;
    }
    return this.insertItem('students', this.students, record);
  };

  updateStudentById = (id: string, patch: Partial<StudentRecord>) =>
    this.updateItem('students', this.students, id, patch);

  // Courses
  listCourses = () => this.getAll('courses', this.courses);
  createCourse = (input: Omit<CourseRecord, 'id'>) =>
    this.insertItem('courses', this.courses, {
      id: `crs-${crypto.randomUUID()}`,
      ...input,
    });

  // Library Workflow
  listLibraryApplications = () => this.getAll('library_applications', this.libraryApps);
  createLibraryApplication = (input: Omit<LibraryApplicationRecord, 'id' | 'createdAt' | 'updatedAt'>) =>
    this.insertItem('library_applications', this.libraryApps, {
      id: `libapp-${crypto.randomUUID()}`,
      ...input,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  updateLibraryApplication = (id: string, patch: Partial<LibraryApplicationRecord>) =>
    this.updateItem('library_applications', this.libraryApps, id, {
      ...patch,
      updatedAt: new Date().toISOString(),
    });

  listLibraryCards = () => this.getAll('library_cards', this.libraryCards);
  createLibraryCard = (input: Omit<LibraryCardRecord, 'id'>) =>
    this.insertItem('library_cards', this.libraryCards, {
      id: `libcard-${crypto.randomUUID()}`,
      ...input,
    });
  updateLibraryCard = (id: string, patch: Partial<LibraryCardRecord>) =>
    this.updateItem('library_cards', this.libraryCards, id, patch);

  listLibraryBorrows = () => this.getAll('library_borrows', this.libraryBorrows);
  createLibraryBorrow = (input: Omit<LibraryBorrowRecord, 'id'>) =>
    this.insertItem('library_borrows', this.libraryBorrows, {
      id: `borrow-${crypto.randomUUID()}`,
      ...input,
    });
  updateLibraryBorrow = (id: string, patch: Partial<LibraryBorrowRecord>) =>
    this.updateItem('library_borrows', this.libraryBorrows, id, patch);

  // Residential Hall Workflow
  listHallCirculars = () => this.getAll('hall_circulars', this.hallCirculars);
  createHallCircular = (input: Omit<HallCircularRecord, 'id'>) =>
    this.insertItem('hall_circulars', this.hallCirculars, {
      id: `hcirc-${crypto.randomUUID()}`,
      ...input,
    });

  listHallApplications = () => this.getAll('hall_applications', this.hallApps);
  createHallApplication = (input: Omit<HallApplicationRecord, 'id' | 'createdAt'>) =>
    this.insertItem('hall_applications', this.hallApps, {
      id: `happ-${crypto.randomUUID()}`,
      ...input,
      createdAt: new Date().toISOString(),
    });
  updateHallApplication = (id: string, patch: Partial<HallApplicationRecord>) =>
    this.updateItem('hall_applications', this.hallApps, id, patch);

  listHallDues = () => this.getAll('hall_dues', this.hallDues);
  createHallDue = (input: Omit<HallDueRecord, 'id'>) =>
    this.insertItem('hall_dues', this.hallDues, {
      id: `hdue-${crypto.randomUUID()}`,
      ...input,
    });
  updateHallDue = (id: string, patch: Partial<HallDueRecord>) =>
    this.updateItem('hall_dues', this.hallDues, id, patch);

  // Examination Workflow
  listExamCirculars = () => this.getAll('exam_circulars', this.examCirculars);
  createExamCircular = (input: Omit<ExamCircularRecord, 'id'>) =>
    this.insertItem('exam_circulars', this.examCirculars, {
      id: `ecirc-${crypto.randomUUID()}`,
      ...input,
    });

  listExamApplications = () => this.getAll('exam_applications', this.examApps);
  createExamApplication = (input: Omit<ExamApplicationRecord, 'id' | 'createdAt'>) =>
    this.insertItem('exam_applications', this.examApps, {
      id: `eapp-${crypto.randomUUID()}`,
      ...input,
      createdAt: new Date().toISOString(),
    });
  updateExamApplication = (id: string, patch: Partial<ExamApplicationRecord>) =>
    this.updateItem('exam_applications', this.examApps, id, patch);

  listExamResults = () => this.getAll('exam_results', this.examResults);
  createExamResult = (input: Omit<ExamResultRecord, 'id'>) =>
    this.insertItem('exam_results', this.examResults, {
      id: `res-${crypto.randomUUID()}`,
      ...input,
    });
  updateExamResult = (id: string, patch: Partial<ExamResultRecord>) =>
    this.updateItem('exam_results', this.examResults, id, patch);

  // Certificate Application & 4-Office Clearance
  listCertificateApplications = () =>
    this.getAll('certificate_applications', this.certificateApps);
  createCertificateApplication = (
    input: Omit<CertificateApplicationRecord, 'id' | 'createdAt'>
  ) =>
    this.insertItem('certificate_applications', this.certificateApps, {
      id: `cert-${crypto.randomUUID()}`,
      ...input,
      createdAt: new Date().toISOString(),
    });
  updateCertificateApplication = (id: string, patch: Partial<CertificateApplicationRecord>) =>
    this.updateItem('certificate_applications', this.certificateApps, id, patch);

  // Payment Gateways & Fees
  listPaymentGateways = () => this.getAll('payment_gateways', this.paymentGateways);
  upsertPaymentGateway = async (gw: PaymentGatewayConfig): Promise<PaymentGatewayConfig> => {
    const existing = (await this.listPaymentGateways()).find((g) => g.id === gw.id);
    if (existing) {
      return (await this.updateItem('payment_gateways', this.paymentGateways, gw.id, gw))!;
    }
    return this.insertItem('payment_gateways', this.paymentGateways, gw);
  };

  async getFeeConfig(): Promise<FeeConfig> {
    if (this.storageBackend === 'mongodb' && this.db) {
      const doc = await this.db
        .collection<FeeConfig & { id: string }>('fee_config')
        .findOne({ id: 'global-fee-config' }, { projection: { _id: 0, id: 0 } });
      if (doc) return doc;
    }
    return { ...this.feeConfig };
  }

  async updateFeeConfig(cfg: FeeConfig): Promise<FeeConfig> {
    this.feeConfig = { ...cfg };
    if (this.storageBackend === 'mongodb' && this.db) {
      await this.db
        .collection<FeeConfig & { id: string }>('fee_config')
        .updateOne({ id: 'global-fee-config' }, { $set: cfg }, { upsert: true });
    }
    return { ...this.feeConfig };
  }

  // Payment Receipts Ledger
  listPaymentReceipts = async () => {
    const items = await this.getAll('payment_receipts', this.paymentReceipts);
    return items.sort((a, b) => b.paidAt.localeCompare(a.paidAt));
  };
  createPaymentReceipt = (input: Omit<PaymentReceiptRecord, 'id'>) =>
    this.insertItem('payment_receipts', this.paymentReceipts, {
      id: `rcpt-${crypto.randomUUID()}`,
      ...input,
    });

  // Inquiries & Bookmarks
  createInquiry = (input: Omit<InquiryRecord, 'id' | 'referenceCode' | 'status' | 'createdAt'>) => {
    const refSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
    return this.insertItem('inquiries', this.inquiries, {
      id: `inq-${crypto.randomUUID()}`,
      referenceCode: `PUST-INQ-${new Date().getFullYear()}-${refSuffix}`,
      ...input,
      status: 'Received',
      createdAt: new Date().toISOString(),
    });
  };
  listInquiries = async () => {
    const items = await this.getAll('inquiries', this.inquiries);
    return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  };
  markInquiryReviewed = async (
    id: string,
    opts?: { responseNote?: string; respondedBy?: string }
  ): Promise<InquiryRecord | null> => {
    return this.updateItem('inquiries', this.inquiries, id, {
      status: 'Reviewed',
      ...(opts?.responseNote ? { responseNote: opts.responseNote } : {}),
      ...(opts?.respondedBy ? { respondedBy: opts.respondedBy } : {}),
      respondedAt: new Date().toISOString(),
    });
  };

  // Public Document Verification Lookup
  async findVerificationByCode(rawCode: string): Promise<VerificationLookupResult | null> {
    const code = rawCode.trim().toUpperCase();
    if (!code) return null;

    const certs = await this.listCertificateApplications();
    const matchedCert = certs.find(
      (c) =>
        c.certificateSerial?.toUpperCase() === code ||
        c.verificationHash?.toUpperCase() === code
    );
    if (matchedCert && matchedCert.finalAdminStatus === 'approved' && matchedCert.certificateSerial) {
      return {
        valid: true,
        documentType: 'Certificate',
        serialCode: matchedCert.certificateSerial,
        title: `${matchedCert.certificateType} — ${matchedCert.departmentCode}`,
        holderName: matchedCert.studentName,
        academicId: matchedCert.academicId,
        departmentCode: matchedCert.departmentCode,
        session: matchedCert.session,
        issuedAt: matchedCert.issuedAt || matchedCert.createdAt.slice(0, 10),
        issuedBy: 'Controller of Examinations & Admin Office, PUST',
        status: 'Verified & Active',
        verificationHash:
          matchedCert.verificationHash ||
          `SHA256-${crypto.createHash('sha256').update(matchedCert.certificateSerial).digest('hex').slice(0, 12).toUpperCase()}`,
        details: [
          { label: 'Document Type', value: matchedCert.certificateType },
          { label: 'Clearance Sign-offs', value: '4 / 4 Offices Approved' },
          { label: 'Payment Reference', value: matchedCert.transactionId },
          { label: 'Physical Status', value: matchedCert.physicalCollected ? 'Collected' : 'Digital Verified' },
        ],
      };
    }

    const examApps = await this.listExamApplications();
    const matchedAdmit = examApps.find((e) => e.admitCardNo?.toUpperCase() === code);
    if (matchedAdmit && matchedAdmit.verificationStatus === 'Approved' && matchedAdmit.admitCardNo) {
      return {
        valid: true,
        documentType: 'Admit Card',
        serialCode: matchedAdmit.admitCardNo,
        title: matchedAdmit.examTitle,
        holderName: matchedAdmit.studentName,
        academicId: matchedAdmit.academicId,
        departmentCode: matchedAdmit.departmentCode,
        session: matchedAdmit.session,
        issuedAt: matchedAdmit.admitCardIssuedAt || matchedAdmit.createdAt.slice(0, 10),
        issuedBy: `Department Chairman (${matchedAdmit.departmentCode}) & Examination Office`,
        status: 'Approved for Examination Entry',
        verificationHash: `SHA256-${crypto.createHash('sha256').update(matchedAdmit.admitCardNo).digest('hex').slice(0, 12).toUpperCase()}`,
        details: [
          { label: 'Semester', value: `Semester ${matchedAdmit.semester}` },
          { label: 'Courses Registered', value: matchedAdmit.selectedCourseCodes.join(', ') },
          { label: 'Total Credits', value: matchedAdmit.totalCredits.toFixed(1) },
          { label: 'Form Reference', value: matchedAdmit.formReference },
        ],
      };
    }

    const hallDues = await this.listHallDues();
    const matchedClearance = hallDues.find((d) => d.clearanceRef?.toUpperCase() === code);
    if (matchedClearance && matchedClearance.status === 'Cleared' && matchedClearance.clearanceRef) {
      return {
        valid: true,
        documentType: 'Hall Clearance',
        serialCode: matchedClearance.clearanceRef,
        title: `${matchedClearance.hallName} — Financial Clearance`,
        holderName: matchedClearance.studentName,
        academicId: matchedClearance.academicId,
        departmentCode: 'HALL',
        issuedAt: matchedClearance.clearedAt || matchedClearance.paidAt || new Date().toISOString().slice(0, 10),
        issuedBy: matchedClearance.clearedBy || matchedClearance.hallName,
        status: 'Financial Dues Cleared',
        verificationHash: `SHA256-${crypto.createHash('sha256').update(matchedClearance.clearanceRef).digest('hex').slice(0, 12).toUpperCase()}`,
        details: [
          { label: 'Hall Name', value: matchedClearance.hallName },
          { label: 'Fee Head', value: matchedClearance.feeTitle },
          { label: 'Amount Paid', value: `BDT ${matchedClearance.amountBdt.toLocaleString()}` },
          { label: 'Payment Ref', value: matchedClearance.paymentRef || 'Verified' },
        ],
      };
    }

    const libCards = await this.listLibraryCards();
    const matchedLibCard = libCards.find(
      (c) =>
        c.digitalCardNo.toUpperCase() === code ||
        c.verificationHash?.toUpperCase() === code
    );
    if (matchedLibCard) {
      return {
        valid: matchedLibCard.status === 'Active',
        documentType: 'Digital Library Card',
        serialCode: matchedLibCard.digitalCardNo,
        title: 'PUST Central Library Digital Membership Card',
        holderName: matchedLibCard.studentName,
        academicId: matchedLibCard.academicId,
        departmentCode: matchedLibCard.departmentCode,
        session: matchedLibCard.session,
        issuedAt: matchedLibCard.issuedAt,
        issuedBy: 'Central Library Office, PUST',
        status: matchedLibCard.status,
        verificationHash:
          matchedLibCard.verificationHash ||
          `SHA256-${crypto.createHash('sha256').update(matchedLibCard.digitalCardNo).digest('hex').slice(0, 12).toUpperCase()}`,
        details: [
          { label: 'Valid Until', value: matchedLibCard.validUntil },
          { label: 'Physical Reference', value: matchedLibCard.physicalCardRef || 'Digital Card Only' },
        ],
      };
    }

    const libApps = await this.listLibraryApplications();
    const matchedSeal = libApps.find(
      (a) => a.chairmanSeal?.verificationHash.toUpperCase() === code
    );
    if (matchedSeal?.chairmanSeal) {
      return {
        valid: true,
        documentType: 'Chairman Library Seal',
        serialCode: matchedSeal.chairmanSeal.verificationHash,
        title: `Department Chairman Library Attestation (${matchedSeal.departmentCode})`,
        holderName: matchedSeal.studentName,
        academicId: matchedSeal.academicId,
        departmentCode: matchedSeal.departmentCode,
        session: matchedSeal.session,
        issuedAt: matchedSeal.chairmanSeal.signedAt.slice(0, 10),
        issuedBy: matchedSeal.chairmanSeal.chairmanName,
        status: matchedSeal.status === 'approved' ? 'Verified & Library Approved' : 'Chairman Forwarded',
        verificationHash: matchedSeal.chairmanSeal.verificationHash,
        details: [
          { label: 'Official Seal', value: matchedSeal.chairmanSeal.officialSeal },
          { label: 'Digital Signature', value: matchedSeal.chairmanSeal.digitalSignature },
        ],
      };
    }

    const receipts = await this.listPaymentReceipts();
    const matchedReceipt = receipts.find(
      (r) => r.receiptNo.toUpperCase() === code || r.transactionId.toUpperCase() === code
    );
    if (matchedReceipt) {
      return {
        valid: true,
        documentType: 'Payment Receipt',
        serialCode: matchedReceipt.receiptNo,
        title: matchedReceipt.title,
        holderName: matchedReceipt.studentName,
        academicId: matchedReceipt.academicId,
        departmentCode: matchedReceipt.departmentCode,
        issuedAt: matchedReceipt.paidAt.slice(0, 10),
        issuedBy: `${matchedReceipt.gatewayName} via PUST Finance`,
        status: 'Verified Payment Settlement',
        verificationHash: `SHA256-${crypto.createHash('sha256').update(matchedReceipt.receiptNo + matchedReceipt.transactionId).digest('hex').slice(0, 12).toUpperCase()}`,
        details: [
          { label: 'Transaction ID', value: matchedReceipt.transactionId },
          { label: 'Amount Settled', value: `BDT ${matchedReceipt.amountBdt.toLocaleString()}` },
          { label: 'Gateway', value: matchedReceipt.gatewayName },
          { label: 'Category', value: matchedReceipt.targetType.replace('_', ' ').toUpperCase() },
        ],
      };
    }

    return null;
  }

  // Sanitized Pre-Login Status Lookup (Account Approval or Admission Inquiry)
  async lookupPublicStatus(rawQuery: string): Promise<PublicStatusLookupResult | null> {
    const q = rawQuery.trim();
    if (q.length < 3) return null;
    const upper = q.toUpperCase();
    const lower = q.toLowerCase();

    const inquiries = await this.listInquiries();
    const matchedInq = inquiries.find(
      (i) => i.referenceCode.toUpperCase() === upper || i.email.toLowerCase() === lower
    );
    if (matchedInq) {
      return {
        found: true,
        lookupType: 'inquiry',
        reference: matchedInq.referenceCode,
        title: `${matchedInq.programLevel} Inquiry — ${matchedInq.departmentCode}`,
        statusLabel:
          matchedInq.status === 'Reviewed' ? 'Reviewed by Registrar Office' : 'Received · In Queue',
        statusState: matchedInq.status === 'Reviewed' ? 'reviewed' : 'received',
        departmentCode: matchedInq.departmentCode,
        updatedAt: (matchedInq.respondedAt || matchedInq.createdAt).slice(0, 10),
        note: matchedInq.responseNote,
        meta: [
          { label: 'Applicant', value: matchedInq.fullName },
          { label: 'Program Level', value: matchedInq.programLevel },
          { label: 'Department', value: matchedInq.departmentCode },
          ...(matchedInq.respondedBy ? [{ label: 'Responded By', value: matchedInq.respondedBy }] : []),
        ],
      };
    }

    const users = await this.getAll('users', this.users);
    const matchedUser = users.find(
      (u) => u.email.toLowerCase() === lower || u.academicId.toUpperCase() === upper
    );
    if (matchedUser) {
      const authority =
        matchedUser.role === 'student' || matchedUser.role === 'teacher'
          ? `${matchedUser.departmentCode} Department Chairman's Office`
          : 'University Admin Office';
      return {
        found: true,
        lookupType: 'account',
        reference: matchedUser.academicId,
        title: `Portal Account Application (${matchedUser.role.toUpperCase()})`,
        statusLabel:
          matchedUser.approvalStatus === 'approved'
            ? 'Approved · Ready to Sign In'
            : matchedUser.approvalStatus === 'rejected'
            ? 'Application Declined'
            : `Pending Approval (${authority})`,
        statusState: matchedUser.approvalStatus,
        departmentCode: matchedUser.departmentCode,
        updatedAt: matchedUser.createdAt.slice(0, 10),
        meta: [
          { label: 'Department / Office', value: matchedUser.departmentCode },
          { label: 'Approving Authority', value: authority },
          { label: 'Role', value: matchedUser.role },
        ],
      };
    }

    return null;
  }

  async listBookmarks(userId: string): Promise<BookmarkRecord[]> {
    const all = await this.getAll('bookmarks', this.bookmarks);
    return all.filter((b) => b.userId === userId);
  }
  async upsertBookmark(input: Omit<BookmarkRecord, 'id' | 'createdAt'>): Promise<BookmarkRecord> {
    const existing = (await this.listBookmarks(input.userId)).find(
      (b) => b.itemId === input.itemId
    );
    if (existing) return existing;
    return this.insertItem('bookmarks', this.bookmarks, {
      id: `bm-${crypto.randomUUID()}`,
      ...input,
      createdAt: new Date().toISOString(),
    });
  }
  async deleteBookmark(userId: string, itemId: string): Promise<boolean> {
    const existing = (await this.listBookmarks(userId)).find((b) => b.itemId === itemId);
    if (!existing) return false;
    return this.removeItem('bookmarks', this.bookmarks, existing.id);
  }
}

export const pustRepo = new PustRepository();
