import 'dotenv/config';
import cookieParser from 'cookie-parser';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import {
  AUTH_COOKIE_NAME,
  clearAuthCookie,
  hashPassword,
  requireAdmin,
  requireAuth,
  setAuthCookie,
  signAuthToken,
  timingSafeStringMatch,
  verifyAuthToken,
  verifyPassword,
  verifySameOriginMutation,
  type AuthenticatedRequest,
} from './server/auth';
import { pustRepo } from './server/db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  password: z.string().min(8).max(128),
  role: z.enum(['student', 'faculty']),
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
  referenceNo: z.string().trim().min(4).max(40),
  title: z.string().trim().min(5).max(180),
  category: z.enum([
    'General',
    'Admission',
    'Academic',
    'Examination',
    'Job & Tender',
    'NOC & Orders',
  ]),
  departmentCode: z.string().trim().min(2).max(24),
  summary: z.string().trim().min(10).max(320),
  body: z.string().trim().min(20).max(3000),
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

async function startServer() {
  await pustRepo.init();

  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(express.json({ limit: '64kb' }));
  app.use(cookieParser());

  // Enforce Origin / CSRF check on all cookie-authenticated or state-changing API routes
  app.use('/api', verifySameOriginMutation);

  // Public university catalog, leadership profile, publications & notices
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, storageBackend: pustRepo.getStorageBackend() });
  });

  app.get('/api/university-profile', (_req, res) => {
    res.json({ profile: pustRepo.getUniversityProfile() });
  });

  app.get('/api/departments', async (_req, res) => {
    const departments = await pustRepo.listDepartments();
    res.json({ departments });
  });

  app.get('/api/publications', async (_req, res) => {
    const publications = await pustRepo.listPublications();
    res.json({ publications });
  });

  app.get('/api/notices', async (req, res) => {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const notices = await pustRepo.listNotices(category, search);
    res.json({ notices });
  });

  // Public admission inquiry submission
  app.post('/api/inquiries', async (req, res) => {
    const parsed = createInquirySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Please provide valid inquiry details.' });
      return;
    }
    const inquiry = await pustRepo.createInquiry(parsed.data);
    res.status(201).json({ inquiry });
  });

  // Auth status & session inspection
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
    if (!claims) {
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
        departmentCode: claims.departmentCode,
        academicId: claims.academicId,
        hallAffiliation: claims.hallAffiliation,
        createdAt: '',
      },
    });
  });

  app.post('/api/auth/register', async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Please complete all fields (password must be at least 8 characters).',
      });
      return;
    }

    try {
      const existing = await pustRepo.findUserByEmail(parsed.data.email);
      if (existing) {
        res.status(409).json({ error: 'An account with this email already exists.' });
        return;
      }

      const created = await pustRepo.createUser({
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash: hashPassword(parsed.data.password),
        role: parsed.data.role,
        departmentCode: parsed.data.departmentCode,
        academicId: parsed.data.academicId,
        hallAffiliation: parsed.data.hallAffiliation,
      });

      const { passwordHash: _ignored, ...safeUser } = created;
      const token = signAuthToken(safeUser);
      setAuthCookie(req, res, token);
      res.status(201).json({ user: safeUser });
    } catch (err) {
      if (err instanceof Error && err.message === 'DUPLICATE_EMAIL') {
        res.status(409).json({ error: 'An account with this email already exists.' });
        return;
      }
      res.status(500).json({ error: 'Unable to create account.' });
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

    const { passwordHash: _ignored, ...safeUser } = user;
    const token = signAuthToken(safeUser);
    setAuthCookie(req, res, token);
    res.json({ user: safeUser });
  });

  // One-time first-run Registrar/Admin setup when ADMIN_PASSCODE is unset and no admin exists
  app.post('/api/auth/bootstrap-admin', async (req, res) => {
    const envPasscode = process.env.ADMIN_PASSCODE?.trim();
    if (envPasscode) {
      res.status(409).json({
        error: 'Registrar admin access is managed by server environment configuration.',
      });
      return;
    }

    const alreadyHasAdmin = await pustRepo.hasAdminUser();
    if (alreadyHasAdmin) {
      res.status(409).json({ error: 'Registrar admin account has already been claimed.' });
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
        departmentCode: 'REGISTRAR',
        academicId: 'PUST-REG-01',
        hallAffiliation: 'Administrative Building',
      });

      const { passwordHash: _ignored, ...safeUser } = created;
      const token = signAuthToken(safeUser);
      setAuthCookie(req, res, token);
      res.status(201).json({ user: safeUser });
    } catch {
      res.status(409).json({ error: 'Could not claim admin account with this email.' });
    }
  });

  // Override login when ADMIN_PASSCODE env secret is configured
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
      res.status(401).json({ error: 'Invalid Registrar passcode.' });
      return;
    }

    const safeUser = {
      id: 'env-registrar-admin',
      name: parsed.data.name || 'University Registrar',
      email: parsed.data.email.toLowerCase(),
      role: 'admin' as const,
      departmentCode: 'REGISTRAR',
      academicId: 'PUST-REG-ENV',
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

  // Protected Registrar / Admin endpoints
  app.post('/api/notices', requireAdmin, async (req: AuthenticatedRequest, res) => {
    const parsed = createNoticeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Please complete all notice fields.' });
      return;
    }
    const notice = await pustRepo.createNotice({
      ...parsed.data,
      publishedAt: new Date().toISOString().slice(0, 10),
      authorName: req.authUser!.name,
    });
    res.status(201).json({ notice });
  });

  app.delete('/api/notices/:id', requireAdmin, async (req: AuthenticatedRequest, res) => {
    const deleted = await pustRepo.deleteNotice(String(req.params.id));
    if (!deleted) {
      res.status(404).json({ error: 'Notice not found.' });
      return;
    }
    res.json({ deleted: true });
  });

  app.get('/api/inquiries', requireAdmin, async (_req, res) => {
    const inquiries = await pustRepo.listInquiries();
    res.json({ inquiries });
  });

  app.patch('/api/inquiries/:id/review', requireAdmin, async (req, res) => {
    const updated = await pustRepo.markInquiryReviewed(String(req.params.id));
    if (!updated) {
      res.status(404).json({ error: 'Inquiry not found.' });
      return;
    }
    res.json({ updated: true });
  });

  // Mount Vite middleware in dev or serve built assets in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `PUST server listening on http://0.0.0.0:${PORT} (storage: ${pustRepo.getStorageBackend()})`
    );
  });
}

startServer().catch((err) => {
  console.error('Failed to start PUST server:', err);
  process.exit(1);
});
