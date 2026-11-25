import { MongoClient, type Collection, type Db } from 'mongodb';
import crypto from 'node:crypto';
import type {
  AboutContentRecord,
  AuditLogRecord,
  AuthUser,
  AutomationRulesConfig,
  BannerSlideRecord,
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
  SEED_BANNER_SLIDES,
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
  private bannerSlides: BannerSlideRecord[] = [...SEED_BANNER_SLIDES];
  private aboutSections: AboutContentRecord[] = [...SEED_ABOUT_SECTIONS];
  private vcProfiles: ViceChancellorRecord[] = [...SEED_VC_PROFILES];
  private auditLogs: AuditLogRecord[] = [];
  private inquiries: InquiryRecord[] = [...SEED_INQUIRIES];
  private bookmarks: BookmarkRecord[] = [];
  private automationConfig: AutomationRulesConfig = {
    autoClearPaidHallDues: true,
    autoIssueSealedLibraryCards: true,
    autoIssueAdmitCardsOnPay: true,
    autoVerifyCleanCertOffices: true,
    autoIssueReadyCertificates: true,
    autoPromoteGraduatingResults: true,
  };
  private universityProfile: UniversityProfile = structuredClone(SEED_UNIVERSITY_PROFILE);

  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

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
    await seedIfEmpty('banner_slides', SEED_BANNER_SLIDES);
    await seedIfEmpty('about_sections', SEED_ABOUT_SECTIONS);
    await seedIfEmpty('vc_profiles', SEED_VC_PROFILES);

    const INSTITUTIONAL_SEED_VERSION = 4;
    const seedMetaCol = db.collection<{ id: string; version: number; syncedAt: string }>('seed_meta');
    const seedMeta = await seedMetaCol.findOne({ id: 'institutional_content' });
    if (!seedMeta || seedMeta.version < INSTITUTIONAL_SEED_VERSION) {
      for (const section of SEED_ABOUT_SECTIONS) {
        await db.collection('about_sections').updateOne(
          { id: section.id },
          { $set: section },
          { upsert: true }
        );
      }

      for (const dept of SEED_DEPARTMENTS) {
        const {
          officialCode,
          facultyCount,
          researchTotal,
          intakeSeats,
          degrees,
          ...restDept
        } = dept;
        await db.collection('departments').updateOne(
          { id: dept.id },
          {
            $set: {
              officialCode,
              facultyCount,
              researchTotal,
              intakeSeats,
              degrees,
            },
            $setOnInsert: restDept,
          },
          { upsert: true }
        );
      }

      for (const pub of SEED_PUBLICATIONS) {
        const { doi, url, venue, ...restPub } = pub;
        const pubSet: Record<string, unknown> = {};
        if (doi !== undefined) pubSet.doi = doi;
        if (url !== undefined) pubSet.url = url;
        if (venue !== undefined) pubSet.venue = venue;
        await db.collection('publications').updateOne(
          { id: pub.id },
          {
            ...(Object.keys(pubSet).length > 0 ? { $set: pubSet } : {}),
            $setOnInsert: restPub,
          },
          { upsert: true }
        );
      }

      const existingVcs = (await db
        .collection<ViceChancellorRecord>('vc_profiles')
        .find({}, { projection: { _id: 0 } })
        .toArray()) as ViceChancellorRecord[];
      const hasAdminPromotedVc = existingVcs.some((v) => v.orderIndex > 7 && v.isCurrent);

      for (const vc of SEED_VC_PROFILES) {
        const docToSync = hasAdminPromotedVc && vc.id === 'vc-7' ? { ...vc, isCurrent: false } : vc;
        await db.collection('vc_profiles').updateOne(
          { id: vc.id },
          { $set: docToSync },
          { upsert: true }
        );
      }

      const newNoticeIds = new Set([
        'notice-press-release-convocation',
        'notice-result-fall-2026',
        'notice-job-faculty-2026',
      ]);
      for (const notice of SEED_NOTICES) {
        if (newNoticeIds.has(notice.id)) {
          await db.collection('notices').updateOne(
            { id: notice.id },
            { $setOnInsert: notice },
            { upsert: true }
          );
        }
      }

      await db.collection('university_profile').updateOne(
        { id: 'main', facultyMembersCount: 185 },
        { $set: { facultyMembersCount: SEED_UNIVERSITY_PROFILE.facultyMembersCount } }
      );

      await seedMetaCol.updateOne(
        { id: 'institutional_content' },
        {
          $set: {
            id: 'institutional_content',
            version: INSTITUTIONAL_SEED_VERSION,
            syncedAt: new Date().toISOString(),
          },
        },
        { upsert: true }
      );
    }

    const feeCol = db.collection<FeeConfig & { id: string }>('fee_config');
    if ((await feeCol.countDocuments()) === 0) {
      await feeCol.insertOne({ id: 'global-fee-config', ...SEED_FEE_CONFIG });
    }

    const profileCol = db.collection<UniversityProfile & { id: string }>('university_profile');
    const existingProfile = await profileCol.findOne({ id: 'main' });
    if (!existingProfile) {
      await profileCol.insertOne({ id: 'main', ...structuredClone(SEED_UNIVERSITY_PROFILE) });
    } else {
      const missingPatch: Partial<UniversityProfile> = {};
      const fullSeed = structuredClone(SEED_UNIVERSITY_PROFILE);
      for (const key of Object.keys(fullSeed) as Array<keyof UniversityProfile>) {
        if (existingProfile[key] === undefined) {
          (missingPatch as Record<string, unknown>)[key] = fullSeed[key];
        }
      }
      if (Object.keys(missingPatch).length > 0) {
        await profileCol.updateOne({ id: 'main' }, { $set: missingPatch });
      }
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
    const setFields: Record<string, unknown> = {};
    const unsetFields: Record<string, 1> = {};
    for (const [key, value] of Object.entries(patch as Record<string, unknown>)) {
      if (value === undefined) {
        unsetFields[key] = 1;
      } else {
        setFields[key] = value;
      }
    }

    if (this.storageBackend === 'mongodb') {
      const updateOps: Record<string, unknown> = {};
      if (Object.keys(setFields).length > 0) updateOps.$set = setFields;
      if (Object.keys(unsetFields).length > 0) updateOps.$unset = unsetFields;
      if (Object.keys(updateOps).length > 0) {
        await this.col<T>(name).updateOne({ id } as never, updateOps as never);
      }
      const updated = await this.col<T>(name).findOne({ id } as never, {
        projection: { _id: 0 },
      });
      return (updated as T | null) ?? null;
    }

    const idx = mem.findIndex((x) => x.id === id);
    if (idx === -1) return null;
    const next = { ...mem[idx], ...setFields } as Record<string, unknown>;
    for (const key of Object.keys(unsetFields)) {
      delete next[key];
    }
    mem[idx] = next as T;
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

  async getUniversityProfile(): Promise<UniversityProfile> {
    if (this.storageBackend === 'mongodb' && this.db) {
      const doc = await this.db
        .collection<UniversityProfile & { id: string }>('university_profile')
        .findOne({ id: 'main' }, { projection: { _id: 0, id: 0 } });
      if (doc) return doc;
    }
    return structuredClone(this.universityProfile);
  }

  async updateUniversityProfile(patch: Partial<UniversityProfile>): Promise<UniversityProfile> {
    const current = await this.getUniversityProfile();
    const updated: UniversityProfile = {
      ...current,
      ...patch,
    };
    this.universityProfile = structuredClone(updated);
    if (this.storageBackend === 'mongodb' && this.db) {
      await this.db
        .collection<UniversityProfile & { id: string }>('university_profile')
        .updateOne({ id: 'main' }, { $set: { id: 'main', ...updated } }, { upsert: true });
    }
    return structuredClone(updated);
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
  createDepartment = async (input: Omit<DepartmentRecord, 'id'>): Promise<DepartmentRecord> => {
    const existing = await this.listDepartments();
    const normalizedCode = input.code.trim().toUpperCase();
    if (existing.some((d) => d.code.toUpperCase() === normalizedCode)) {
      throw new Error('DUPLICATE_DEPT_CODE');
    }
    return this.insertItem('departments', this.departments, {
      id: `dept-${normalizedCode.toLowerCase().replace(/[^a-z0-9]/g, '')}-${crypto.randomUUID().slice(0, 6)}`,
      ...input,
      code: normalizedCode,
    });
  };
  updateDepartment = (id: string, patch: Partial<DepartmentRecord>) =>
    this.updateItem('departments', this.departments, id, patch);
  deleteDepartment = (id: string) => this.removeItem('departments', this.departments, id);

  listPublications = () => this.getAll('publications', this.publications);
  createPublication = (input: Omit<PublicationRecord, 'id'>) =>
    this.insertItem('publications', this.publications, {
      id: `pub-${crypto.randomUUID()}`,
      ...input,
    });
  updatePublication = (id: string, patch: Partial<PublicationRecord>) =>
    this.updateItem('publications', this.publications, id, patch);
  deletePublication = (id: string) => this.removeItem('publications', this.publications, id);

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
    const raw = await this.getAll('vc_profiles', this.vcProfiles);
    return [...raw].sort((a, b) => b.orderIndex - a.orderIndex);
  }

  async updateCurrentViceChancellor(input: {
    name: string;
    email: string;
    phone: string;
    tenure: string;
    message: string;
    photoUrl?: string;
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
        ...(input.photoUrl ? { photoUrl: input.photoUrl } : {}),
        isCurrent: true,
        orderIndex: maxOrder + 1,
      });
    } else if (current) {
      const patch: Partial<ViceChancellorRecord> = {
        name: input.name,
        tenure: input.tenure,
        email: input.email,
        phone: input.phone,
        message: input.message,
      };
      if (input.photoUrl !== undefined) {
        patch.photoUrl = input.photoUrl || undefined;
      }
      await this.updateItem('vc_profiles', this.vcProfiles, current.id, patch);
    }
    return this.listViceChancellors();
  }

  async createFormerViceChancellor(input: {
    name: string;
    tenure: string;
    email: string;
    phone: string;
    message: string;
    photoUrl?: string;
  }): Promise<ViceChancellorRecord[]> {
    const list = await this.listViceChancellors();
    const minOrder = list.reduce((min, v) => Math.min(min, v.orderIndex), 1);
    await this.insertItem('vc_profiles', this.vcProfiles, {
      id: `vc-${crypto.randomUUID()}`,
      name: input.name,
      title: 'Former Vice-Chancellor',
      tenure: input.tenure,
      email: input.email,
      phone: input.phone,
      message: input.message,
      ...(input.photoUrl ? { photoUrl: input.photoUrl } : {}),
      isCurrent: false,
      orderIndex: minOrder - 1,
    });
    return this.listViceChancellors();
  }

  async updateViceChancellorById(
    id: string,
    patch: Partial<Omit<ViceChancellorRecord, 'id' | 'isCurrent'>>
  ): Promise<ViceChancellorRecord[] | null> {
    const list = await this.listViceChancellors();
    const target = list.find((v) => v.id === id);
    if (!target) return null;
    await this.updateItem('vc_profiles', this.vcProfiles, id, {
      ...patch,
      ...(patch.photoUrl !== undefined ? { photoUrl: patch.photoUrl || undefined } : {}),
    });
    return this.listViceChancellors();
  }

  async deleteViceChancellorById(id: string): Promise<ViceChancellorRecord[] | 'IS_CURRENT' | null> {
    const list = await this.listViceChancellors();
    const target = list.find((v) => v.id === id);
    if (!target) return null;
    if (target.isCurrent) return 'IS_CURRENT';
    await this.removeItem('vc_profiles', this.vcProfiles, id);
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
      visibility: 'public',
      ...item,
    });
  updateGalleryItem = (id: string, patch: Partial<GalleryItemRecord>) =>
    this.updateItem('gallery_items', this.galleryItems, id, patch);
  deleteGalleryItem = (id: string) => this.removeItem('gallery_items', this.galleryItems, id);

  // Hero Banner Slides
  listBannerSlides = async (): Promise<BannerSlideRecord[]> => {
    const items = await this.getAll('banner_slides', this.bannerSlides);
    return items.sort((a, b) => a.orderIndex - b.orderIndex);
  };
  createBannerSlide = async (
    input: Omit<BannerSlideRecord, 'id' | 'orderIndex' | 'updatedAt'>
  ): Promise<BannerSlideRecord> => {
    const existing = await this.listBannerSlides();
    const maxOrder = existing.reduce((max, s) => Math.max(max, s.orderIndex), 0);
    return this.insertItem('banner_slides', this.bannerSlides, {
      id: `banner-${crypto.randomUUID()}`,
      ...input,
      orderIndex: maxOrder + 1,
      updatedAt: new Date().toISOString().slice(0, 10),
    });
  };
  updateBannerSlide = (id: string, patch: Partial<BannerSlideRecord>) =>
    this.updateItem('banner_slides', this.bannerSlides, id, {
      ...patch,
      updatedAt: new Date().toISOString().slice(0, 10),
    });
  reorderBannerSlides = async (orderedIds: string[]): Promise<BannerSlideRecord[]> => {
    const current = await this.listBannerSlides();
    const orderMap = new Map<string, number>();
    orderedIds.forEach((id, index) => orderMap.set(id, index + 1));
    let nextOrder = orderedIds.length + 1;
    for (const slide of current) {
      const assigned = orderMap.get(slide.id) ?? nextOrder++;
      await this.updateItem('banner_slides', this.bannerSlides, slide.id, {
        orderIndex: assigned,
      });
    }
    return this.listBannerSlides();
  };
  deleteBannerSlide = (id: string) => this.removeItem('banner_slides', this.bannerSlides, id);

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
      const dateCmp = b.publishedAt.localeCompare(a.publishedAt);
      if (dateCmp !== 0) return dateCmp;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
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

  async findNoticeById(id: string): Promise<NoticeRecord | null> {
    const items = await this.getAll('notices', this.notices);
    return items.find((n) => n.id === id) ?? null;
  }

  createNotice = (input: Omit<NoticeRecord, 'id'>) =>
    this.insertItem('notices', this.notices, {
      id: `notice-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      ...input,
    });

  updateNotice = (id: string, patch: Partial<NoticeRecord>) =>
    this.updateItem('notices', this.notices, id, patch);

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

  async findUserById(id: string): Promise<StoredUser | null> {
    const list = await this.getAll('users', this.users);
    return list.find((u) => u.id === id) ?? null;
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
  updateHallCircular = (id: string, patch: Partial<HallCircularRecord>) =>
    this.updateItem('hall_circulars', this.hallCirculars, id, patch);

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

  async getAutomationConfig(): Promise<AutomationRulesConfig> {
    if (this.storageBackend === 'mongodb' && this.db) {
      const doc = await this.db
        .collection<AutomationRulesConfig & { id: string }>('automation_config')
        .findOne({ id: 'global-automation-config' }, { projection: { _id: 0, id: 0 } });
      if (doc) {
        return {
          ...this.automationConfig,
          ...doc,
        };
      }
    }
    return { ...this.automationConfig };
  }

  async updateAutomationConfig(cfg: Partial<AutomationRulesConfig>): Promise<AutomationRulesConfig> {
    const current = await this.getAutomationConfig();
    const updated: AutomationRulesConfig = { ...current, ...cfg };
    this.automationConfig = { ...updated };
    if (this.storageBackend === 'mongodb' && this.db) {
      await this.db
        .collection<AutomationRulesConfig & { id: string }>('automation_config')
        .updateOne({ id: 'global-automation-config' }, { $set: updated }, { upsert: true });
    }
    return { ...this.automationConfig };
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

const globalForPust = globalThis as unknown as { __pustRepo?: PustRepository };
export const pustRepo =
  globalForPust.__pustRepo ?? (globalForPust.__pustRepo = new PustRepository());
