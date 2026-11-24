import 'dotenv/config';
import cookieParser from 'cookie-parser';
import express, { type Express } from 'express';
import { z } from 'zod';
import {
  AUTH_COOKIE_NAME,
  clearAuthCookie,
  hashPassword,
  optionalAuth,
  requireAuth,
  requireRoles,
  setAuthCookie,
  signAuthToken,
  timingSafeStringMatch,
  verifyAuthToken,
  verifyPassword,
  verifySameOriginMutation,
  type AuthenticatedRequest,
} from './auth';
import { pustRepo } from './db';
import { portalRouter } from './routes/portalRoutes';
import { isSafeMediaUrl } from '../src/lib/media';

const studentTokenRegisterSchema = z.object({
  signupToken: z.string().trim().min(5).max(40),
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  password: z.string().min(8).max(128),
  admissionDocuments: z.array(z.string().trim().min(2).max(120)).min(1).max(8),
  digitalDocuments: z
    .array(
      z.object({
        label: z.string().trim().min(2).max(120),
        fileName: z.string().trim().min(1).max(180),
        sizeLabel: z.string().trim().min(1).max(40),
        uploadedAt: z.string().trim().min(4).max(40),
        verifiedHash: z.string().trim().min(4).max(80),
      })
    )
    .max(8)
    .optional(),
});

const officerRegisterSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  password: z.string().min(8).max(128),
  role: z.enum(['registrar', 'vc', 'chairman', 'teacher', 'proctor', 'library', 'hall']),
  departmentCode: z.string().trim().min(2).max(16),
  academicId: z.string().trim().min(3).max(32),
  hallAffiliation: z.string().trim().min(2).max(60),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(120),
  password: z.string().min(1).max(128),
});

const bootstrapAdminSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  password: z.string().min(8).max(128),
});

const adminPasscodeSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  email: z.string().trim().email().max(120),
  passcode: z.string().min(1).max(128),
});

const createNoticeSchema = z.object({
  referenceNo: z.string().trim().min(2, 'Memo reference must be at least 2 characters.').max(60),
  title: z.string().trim().min(3, 'Circular title must be at least 3 characters.').max(200),
  category: z.enum([
    'General',
    'Admission',
    'Academic',
    'Examination',
    'Result',
    'Course',
    'Job & Tender',
    'NOC & Orders',
    'Press Release',
  ]),
  departmentCode: z.string().trim().min(2, 'Unit / Department code must be at least 2 characters.').max(24),
  boardScope: z.enum(['central', 'department', 'course']).default('central'),
  visibility: z.enum(['public', 'registered']).default('public'),
  targetSession: z.string().trim().max(20).optional(),
  targetCourseCode: z.string().trim().max(20).optional(),
  attachmentName: z.string().trim().max(160).optional(),
  attachmentUrl: z
    .string()
    .trim()
    .max(800)
    .refine((val) => !val || isSafeMediaUrl(val), 'Attachment URL must be a valid https://, http://, or local path.')
    .optional(),
  attachmentType: z.enum(['image', 'pdf', 'other']).optional(),
  summary: z.string().trim().min(3, 'Executive summary must be at least 3 characters.').max(320),
  body: z.string().trim().min(5, 'Circular details must be at least 5 characters.').max(5000),
  pinned: z.boolean().optional(),
});

const createInquirySchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  phone: z.string().trim().min(6).max(24),
  programLevel: z.enum([
    'Undergraduate (GST)',
    'Graduate (M.Sc. / MBA)',
    'Evening Programs',
    'M.Phil / Ph.D.',
    'International',
  ]),
  departmentCode: z.string().trim().min(2).max(16),
  message: z.string().trim().min(10).max(1000),
});

const bookmarkSchema = z.object({
  itemType: z.enum(['department', 'notice']),
  itemId: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(180),
  subtitle: z.string().trim().min(1).max(180),
});

export function mountApiRoutes(app: Express): void {
  // Scope JSON body parsing, cookies, no-cache headers, and same-origin protection strictly to /api
  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });
  app.use('/api', express.json({ limit: '15mb' }));
  app.use('/api', cookieParser());
  app.use('/api', verifySameOriginMutation);

  // Public institutional endpoints
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, storageBackend: pustRepo.getStorageBackend() });
  });

  app.get('/api/university-profile', async (req: AuthenticatedRequest, res) => {
    const claims = optionalAuth(req);
    const [aboutSections, vcProfiles, rawGalleryItems, bannerSlides] = await Promise.all([
      pustRepo.listAboutSections(),
      pustRepo.listViceChancellors(),
      pustRepo.listGalleryItems(),
      pustRepo.listBannerSlides(),
    ]);
    const galleryItems = claims
      ? rawGalleryItems
      : rawGalleryItems.filter((item) => (item.visibility || 'public') === 'public');
    res.json({
      profile: pustRepo.getUniversityProfile(),
      aboutSections,
      vcProfiles,
      galleryItems,
      bannerSlides,
    });
  });

  app.get('/api/departments', async (_req, res) => {
    const departments = await pustRepo.listDepartments();
    res.json({ departments });
  });

  app.get('/api/publications', async (_req, res) => {
    const publications = await pustRepo.listPublications();
    res.json({ publications });
  });

  // Backend-enforced notice visibility (Public vs Registered Users)
  app.get('/api/notices', async (req: AuthenticatedRequest, res) => {
    const claims = optionalAuth(req);
    const notices = await pustRepo.listNotices({
      isAuthenticated: Boolean(claims),
      userRole: claims?.role,
      userDept: claims?.departmentCode,
      userSession: claims?.session,
      category: typeof req.query.category === 'string' ? req.query.category : undefined,
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
      boardScope: typeof req.query.boardScope === 'string' ? req.query.boardScope : undefined,
      departmentCode:
        typeof req.query.departmentCode === 'string' ? req.query.departmentCode : undefined,
    });
    res.json({ notices });
  });

  app.post('/api/inquiries', async (req, res) => {
    const parsed = createInquirySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Please provide valid inquiry details.' });
      return;
    }
    const inquiry = await pustRepo.createInquiry(parsed.data);
    res.status(201).json({ inquiry });
  });

  // Public Document Verification & Authenticity Endpoint
  app.get('/api/verify/:code', async (req, res) => {
    const code = String(req.params.code || '').trim();
    if (code.length < 4 || code.length > 80) {
      res.status(400).json({ error: 'Provide a valid document serial or verification hash.' });
      return;
    }
    const verification = await pustRepo.findVerificationByCode(code);
    if (!verification) {
      res.status(404).json({
        error: 'No matching verified certificate, admit card, clearance, library card, or receipt found.',
      });
      return;
    }
    res.json({ verification });
  });

  // Sanitized Pre-Login Status Tracker (Account Approval or Admission Inquiry)
  app.get('/api/status', async (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (q.length < 3 || q.length > 120) {
      res.status(400).json({ error: 'Enter your email, academic ID, or PUST-INQ reference code.' });
      return;
    }
    const result = await pustRepo.lookupPublicStatus(q);
    if (!result) {
      res.status(404).json({ error: 'No matching account application or inquiry found.' });
      return;
    }
    res.json({ result });
  });

  // Auth status & JWT session
  app.get('/api/auth/bootstrap-status', async (_req, res) => {
    const envPasscode = process.env.ADMIN_PASSCODE?.trim();
    const hasAdmin = await pustRepo.hasAdminUser();
    res.json({
      adminConfigured: Boolean(envPasscode) || hasAdmin,
      envAdminActive: Boolean(envPasscode),
      storageBackend: pustRepo.getStorageBackend(),
    });
  });

  app.get('/api/auth/me', async (req, res) => {
    const token = req.cookies?.[AUTH_COOKIE_NAME];
    if (typeof token !== 'string' || !token) {
      res.json({ user: null });
      return;
    }
    const claims = verifyAuthToken(token);
    if (!claims || claims.approvalStatus !== 'approved') {
      clearAuthCookie(req, res);
      res.json({ user: null });
      return;
    }
    res.json({
      user: {
        id: claims.sub,
        name: claims.name,
        email: claims.email,
        role: claims.role,
        approvalStatus: claims.approvalStatus,
        departmentCode: claims.departmentCode,
        academicId: claims.academicId,
        session: claims.session,
        hallAffiliation: claims.hallAffiliation,
        createdAt: '',
      },
    });
  });

  // Student Signup via Unique Portal Token -> Pending Department Chairman Approval
  app.post('/api/auth/register-student', async (req, res) => {
    const parsed = studentTokenRegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Provide a valid signup token, personal details, password (8+ chars), and admission documents.',
      });
      return;
    }

    const tokenRecord = await pustRepo.findValidToken(parsed.data.signupToken);
    if (!tokenRecord) {
      res.status(400).json({ error: 'Invalid or already used student portal signup token.' });
      return;
    }

    try {
      const created = await pustRepo.createUser({
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash: hashPassword(parsed.data.password),
        role: 'student',
        approvalStatus: 'pending',
        departmentCode: tokenRecord.departmentCode,
        academicId: tokenRecord.academicId,
        session: tokenRecord.session,
        hallAffiliation: tokenRecord.hallAffiliation,
      });
      await pustRepo.markTokenUsed(tokenRecord.id);

      await pustRepo.upsertStudent({
        id: `stu-${tokenRecord.academicId}`,
        userId: created.id,
        academicId: tokenRecord.academicId,
        name: parsed.data.name,
        email: created.email,
        phone: tokenRecord.studentPhone,
        departmentCode: tokenRecord.departmentCode,
        session: tokenRecord.session,
        currentSemester: 1,
        cgpa: 0,
        completedSemesters: 0,
        allResultsPublished: false,
        hallName: tokenRecord.hallAffiliation,
        seatNumber: 'Unassigned',
        admissionDocuments: parsed.data.admissionDocuments,
        ...(parsed.data.digitalDocuments ? { digitalDocuments: parsed.data.digitalDocuments } : {}),
        chairmanNotes: 'Awaiting Department Chairman verification of submitted documents.',
        adminNotes: '',
        disciplinaryStatus: 'Clear',
        disciplinaryNotes: 'Clean record.',
        approvalStatus: 'pending',
      });

      const { passwordHash: _p, ...safeUser } = created;
      res.status(201).json({
        user: safeUser,
        pendingMessage: `Signup submitted for ${tokenRecord.departmentCode} Chairman verification. You may log in once approved.`,
      });
    } catch (err) {
      if (err instanceof Error && err.message === 'DUPLICATE_EMAIL') {
        res.status(409).json({ error: 'An account with this email already exists.' });
        return;
      }
      res.status(500).json({ error: 'Unable to submit student registration.' });
    }
  });

  // Officer / Teacher Registration -> Pending Admin or Chairman Approval per hierarchy
  app.post('/api/auth/register-officer', async (req, res) => {
    const parsed = officerRegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Complete all officer/faculty registration fields.' });
      return;
    }
    try {
      const created = await pustRepo.createUser({
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash: hashPassword(parsed.data.password),
        role: parsed.data.role,
        approvalStatus: 'pending',
        departmentCode: parsed.data.departmentCode,
        academicId: parsed.data.academicId,
        hallAffiliation: parsed.data.hallAffiliation,
        assignedCourses: [],
        assignedSessions: [],
      });
      const { passwordHash: _p, ...safeUser } = created;
      const authority =
        parsed.data.role === 'teacher'
          ? `${parsed.data.departmentCode} Department Chairman's Office`
          : 'Admin Office';
      res.status(201).json({
        user: safeUser,
        pendingMessage: `Account submitted and awaiting approval from ${authority}.`,
      });
    } catch (err) {
      if (err instanceof Error && err.message === 'DUPLICATE_EMAIL') {
        res.status(409).json({ error: 'An account with this email already exists.' });
        return;
      }
      res.status(500).json({ error: 'Unable to register officer account.' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Valid email and password are required.' });
      return;
    }

    const user = await pustRepo.findUserByEmail(parsed.data.email);
    if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    if (user.approvalStatus === 'pending') {
      const authority =
        user.role === 'student' || user.role === 'teacher'
          ? `${user.departmentCode} Department Chairman's Office`
          : 'Admin Office';
      res.status(403).json({
        error: `Account awaiting approval from ${authority}.`,
      });
      return;
    }
    if (user.approvalStatus === 'rejected') {
      res.status(403).json({ error: 'This account application was declined by the approving authority.' });
      return;
    }

    const { passwordHash: _ignored, ...safeUser } = user;
    const token = signAuthToken(safeUser);
    setAuthCookie(req, res, token);
    res.json({ user: safeUser });
  });

  app.post('/api/auth/bootstrap-admin', async (req, res) => {
    const envPasscode = process.env.ADMIN_PASSCODE?.trim();
    if (envPasscode) {
      res.status(409).json({
        error: 'Admin access is managed by server environment configuration.',
      });
      return;
    }

    const alreadyHasAdmin = await pustRepo.hasAdminUser();
    if (alreadyHasAdmin) {
      res.status(409).json({ error: 'Admin Office account has already been claimed.' });
      return;
    }

    const parsed = bootstrapAdminSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Provide a valid name, institutional email, and password (8+ characters).',
      });
      return;
    }

    try {
      const created = await pustRepo.createUser({
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash: hashPassword(parsed.data.password),
        role: 'admin',
        approvalStatus: 'approved',
        departmentCode: 'ADMIN',
        academicId: 'PUST-ADMIN-01',
        hallAffiliation: 'Administrative Building',
      });

      const { passwordHash: _ignored, ...safeUser } = created;
      const token = signAuthToken(safeUser);
      setAuthCookie(req, res, token);
      await pustRepo.logAudit(safeUser.name, 'admin', 'Claimed initial Admin Office account', safeUser.email);
      res.status(201).json({ user: safeUser });
    } catch {
      res.status(409).json({ error: 'Could not claim Admin account with this email.' });
    }
  });

  app.post('/api/auth/admin-passcode-login', async (req, res) => {
    const envPasscode = process.env.ADMIN_PASSCODE?.trim();
    if (!envPasscode) {
      res.status(400).json({ error: 'Server admin passcode is not configured.' });
      return;
    }
    const parsed = adminPasscodeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Valid email and passcode required.' });
      return;
    }
    if (!timingSafeStringMatch(parsed.data.passcode, envPasscode)) {
      res.status(401).json({ error: 'Invalid Admin passcode.' });
      return;
    }

    const safeUser = {
      id: 'env-admin-office',
      name: parsed.data.name || 'PUST Admin Office',
      email: parsed.data.email.toLowerCase(),
      role: 'admin' as const,
      approvalStatus: 'approved' as const,
      departmentCode: 'ADMIN',
      academicId: 'PUST-ADMIN-ENV',
      hallAffiliation: 'Administrative Building',
      createdAt: new Date().toISOString(),
    };
    const token = signAuthToken(safeUser);
    setAuthCookie(req, res, token);
    res.json({ user: safeUser });
  });

  app.post('/api/auth/logout', (req, res) => {
    clearAuthCookie(req, res);
    res.json({ ok: true });
  });

  // Role-restricted Notice Board publishing (Central, Department, Teacher Course/Session)
  app.post(
    '/api/notices',
    requireRoles('admin', 'registrar', 'vc', 'chairman', 'teacher', 'proctor', 'library', 'hall'),
    async (req: AuthenticatedRequest, res) => {
      const parsed = createNoticeSchema.safeParse(req.body);
      if (!parsed.success) {
        const firstIssue = parsed.error.issues[0];
        res.status(400).json({
          error: firstIssue?.message || 'Please complete all notice fields.',
        });
        return;
      }

      const actor = req.authUser!;
      const isExecutiveCentral = ['admin', 'registrar', 'vc'].includes(actor.role);
      const isCentralUnit = ['admin', 'registrar', 'vc', 'proctor', 'library', 'hall'].includes(actor.role);

      if (parsed.data.boardScope === 'central') {
        if (!isCentralUnit) {
          res.status(403).json({
            error: 'Only Admin or authorized central offices can publish to the Central Notice Board.',
          });
          return;
        }
      } else if (parsed.data.boardScope === 'department') {
        if (
          !isExecutiveCentral &&
          ((actor.role !== 'chairman' && actor.role !== 'teacher') ||
            parsed.data.departmentCode !== actor.departmentCode)
        ) {
          res.status(403).json({
            error: 'You may only publish departmental notices for your assigned department.',
          });
          return;
        }
      } else if (parsed.data.boardScope === 'course') {
        if ((!isExecutiveCentral && actor.role !== 'teacher') || !parsed.data.targetCourseCode) {
          res.status(403).json({
            error: 'Course-targeted notices require a target course code and authorized role.',
          });
          return;
        }
      }

      const notice = await pustRepo.createNotice({
        ...parsed.data,
        publishedAt: new Date().toISOString().slice(0, 10),
        authorName: actor.name,
        authorRole: actor.role,
      });
      await pustRepo.logAudit(
        actor.name,
        actor.role,
        `Published ${parsed.data.visibility} ${parsed.data.boardScope} notice`,
        notice.referenceNo
      );
      res.status(201).json({ notice });
    }
  );

  app.patch(
    '/api/notices/:id',
    requireRoles('admin', 'registrar', 'vc', 'chairman'),
    async (req: AuthenticatedRequest, res) => {
      const parsed = z.object({ pinned: z.boolean() }).safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid notice update payload.' });
        return;
      }
      const existing = await pustRepo.findNoticeById(String(req.params.id));
      if (!existing) {
        res.status(404).json({ error: 'Notice not found.' });
        return;
      }
      if (
        req.authUser!.role === 'chairman' &&
        existing.departmentCode !== req.authUser!.departmentCode
      ) {
        res.status(403).json({ error: 'Chairmen may only manage notices in their department.' });
        return;
      }
      const updated = await pustRepo.updateNotice(existing.id, { pinned: parsed.data.pinned });
      await pustRepo.logAudit(
        req.authUser!.name,
        req.authUser!.role,
        parsed.data.pinned ? 'Pinned notice' : 'Unpinned notice',
        existing.referenceNo
      );
      res.json({ notice: updated });
    }
  );

  app.delete(
    '/api/notices/:id',
    requireRoles('admin', 'registrar', 'chairman'),
    async (req: AuthenticatedRequest, res) => {
      const existing = await pustRepo.findNoticeById(String(req.params.id));
      if (!existing) {
        res.status(404).json({ error: 'Notice not found.' });
        return;
      }
      if (
        req.authUser!.role === 'chairman' &&
        existing.departmentCode !== req.authUser!.departmentCode
      ) {
        res.status(403).json({ error: 'Chairmen may only delete notices in their department.' });
        return;
      }
      const deleted = await pustRepo.deleteNotice(existing.id);
      if (!deleted) {
        res.status(404).json({ error: 'Notice not found.' });
        return;
      }
      await pustRepo.logAudit(
        req.authUser!.name,
        req.authUser!.role,
        'Deleted notice',
        existing.referenceNo
      );
      res.json({ deleted: true });
    }
  );

  app.get('/api/inquiries', requireRoles('admin', 'registrar'), async (_req, res) => {
    const inquiries = await pustRepo.listInquiries();
    res.json({ inquiries });
  });

  app.patch(
    '/api/inquiries/:id/review',
    requireRoles('admin', 'registrar'),
    async (req: AuthenticatedRequest, res) => {
      const parsed = z
        .object({ responseNote: z.string().trim().max(800).optional() })
        .safeParse(req.body || {});
      const responseNote = parsed.success ? parsed.data.responseNote : undefined;
      const updated = await pustRepo.markInquiryReviewed(String(req.params.id), {
        responseNote,
        respondedBy: req.authUser!.name,
      });
      if (!updated) {
        res.status(404).json({ error: 'Inquiry not found.' });
        return;
      }
      await pustRepo.logAudit(
        req.authUser!.name,
        req.authUser!.role,
        'Reviewed Admission Inquiry',
        updated.referenceCode
      );
      res.json({ updated: true, inquiry: updated });
    }
  );

  // Protected user bookmarks
  app.get('/api/bookmarks', requireAuth, async (req: AuthenticatedRequest, res) => {
    const bookmarks = await pustRepo.listBookmarks(req.authUser!.sub);
    res.json({ bookmarks });
  });

  app.post('/api/bookmarks', requireAuth, async (req: AuthenticatedRequest, res) => {
    const parsed = bookmarkSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid bookmark payload.' });
      return;
    }
    const bookmark = await pustRepo.upsertBookmark({
      userId: req.authUser!.sub,
      ...parsed.data,
    });
    res.status(201).json({ bookmark });
  });

  app.delete('/api/bookmarks/:itemId', requireAuth, async (req: AuthenticatedRequest, res) => {
    const itemId = String(req.params.itemId);
    const removed = await pustRepo.deleteBookmark(req.authUser!.sub, itemId);
    res.json({ removed });
  });

  // Mount all university digital platform workflow routes
  app.use('/api/portal', portalRouter);
}

let cachedApp: Express | null = null;
let initPromise: Promise<Express> | null = null;

export async function getApiApp(): Promise<Express> {
  if (cachedApp) return cachedApp;
  if (!initPromise) {
    initPromise = (async () => {
      await pustRepo.init();
      const app = express();
      app.set('trust proxy', 1);
      app.disable('x-powered-by');
      mountApiRoutes(app);
      cachedApp = app;
      return app;
    })();
  }
  return initPromise;
}
