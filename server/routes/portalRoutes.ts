import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRoles, type AuthenticatedRequest } from '../auth';
import { pustRepo } from '../db';
import type { ClearanceOfficeKey, OfficeClearanceState, UserRole } from '../../src/types/pust';

export const portalRouter = Router();

const tokenCreateSchema = z.object({
  studentName: z.string().trim().min(2).max(80),
  studentEmail: z.string().trim().email().max(120),
  studentPhone: z.string().trim().min(6).max(24),
  departmentCode: z.string().trim().min(2).max(16),
  session: z.string().trim().min(4).max(20),
  academicId: z.string().trim().min(3).max(32),
  hallAffiliation: z.string().trim().min(2).max(60),
});

const approvalSchema = z.object({
  approvalStatus: z.enum(['approved', 'rejected']),
});

const teacherAssignSchema = z.object({
  assignedCourses: z.array(z.string().trim().min(2).max(24)).max(20),
  assignedSessions: z.array(z.string().trim().min(4).max(20)).max(12),
});

const studentNoteSchema = z.object({
  chairmanNotes: z.string().trim().max(500).optional(),
  adminNotes: z.string().trim().max(500).optional(),
  disciplinaryStatus: z.enum(['Clear', 'Warning', 'Under Review']).optional(),
  disciplinaryNotes: z.string().trim().max(500).optional(),
});

const chairmanSealSchema = z.object({
  decision: z.enum(['forward', 'reject']),
  officialSeal: z.string().trim().min(3).max(120),
  digitalSignature: z.string().trim().min(2).max(80),
  note: z.string().trim().max(300).optional(),
});

const libraryDecisionSchema = z.object({
  decision: z.enum(['approve', 'reject']),
  physicalCardRef: z.string().trim().max(40).optional(),
  note: z.string().trim().max(300).optional(),
});

const libraryBorrowSchema = z.object({
  academicId: z.string().trim().min(3).max(32),
  bookTitle: z.string().trim().min(2).max(160),
  isbn: z.string().trim().min(4).max(32),
  dueAt: z.string().trim().min(8).max(20),
});

const hallCircularSchema = z.object({
  hallName: z.string().trim().min(3).max(60),
  title: z.string().trim().min(5).max(160),
  vacantSeats: z.number().int().min(1).max(500),
  deadline: z.string().trim().min(8).max(20),
  description: z.string().trim().min(10).max(800),
});

const hallApplySchema = z.object({
  circularId: z.string().trim().min(3).max(80),
  statement: z.string().trim().min(10).max(600),
});

const hallReviewSchema = z.object({
  status: z.enum(['accepted', 'rejected']),
  reviewNote: z.string().trim().min(2).max(300),
  assignedSeat: z.string().trim().max(40).optional(),
});

const hallSeatReassignSchema = z.object({
  assignedSeat: z.string().trim().min(2).max(40),
  note: z.string().trim().min(2).max(200),
});

const hallDueCreateSchema = z.object({
  academicId: z.string().trim().min(3).max(32),
  hallName: z.string().trim().min(3).max(60),
  feeTitle: z.string().trim().min(4).max(120),
  amountBdt: z.number().int().min(50).max(50000),
});

const hallDuePaySchema = z.object({
  paymentMethod: z.string().trim().min(2).max(40),
  paymentRef: z.string().trim().min(4).max(60),
});

const courseCreateSchema = z.object({
  code: z.string().trim().min(3).max(20),
  title: z.string().trim().min(3).max(120),
  credits: z.number().min(0.5).max(6),
  departmentCode: z.string().trim().min(2).max(16),
  semester: z.number().int().min(1).max(10),
  session: z.string().trim().min(4).max(20),
  teacherEmail: z.string().trim().email().optional(),
});

const examCircularSchema = z.object({
  title: z.string().trim().min(5).max(180),
  departmentCode: z.string().trim().min(2).max(16),
  semester: z.number().int().min(1).max(10),
  session: z.string().trim().min(4).max(20),
  deadline: z.string().trim().min(8).max(20),
  feeBdt: z.number().int().min(100).max(25000),
  eligibleCourseCodes: z.array(z.string().trim().min(2).max(20)).min(1).max(15),
});

const examApplySchema = z.object({
  circularId: z.string().trim().min(3).max(80),
  selectedCourseCodes: z.array(z.string().trim().min(2).max(20)).min(1).max(15),
});

const examPaySchema = z.object({
  paymentMethod: z.string().trim().min(2).max(40),
  transactionId: z.string().trim().min(4).max(60),
});

const examVerifySchema = z.object({
  decision: z.enum(['Approved', 'Rejected']),
  physicalCollected: z.boolean().optional(),
});

const resultCreateSchema = z.object({
  academicId: z.string().trim().min(3).max(32),
  semester: z.number().int().min(1).max(10),
  promotionMode: z.enum(['auto', 'manual_promoted', 'manual_repeat']).default('auto'),
  courses: z
    .array(
      z.object({
        code: z.string().trim().min(2).max(20),
        title: z.string().trim().min(2).max(120),
        credits: z.number().min(0.5).max(6),
        marks: z.number().min(0).max(100),
      })
    )
    .min(1)
    .max(12),
});

const certApplySchema = z.object({
  certificateType: z.enum(['Temporary Certificate', 'Provisional Transcript']),
  paymentMethod: z.string().trim().min(2).max(40),
  transactionId: z.string().trim().min(4).max(60),
});

const certOfficeReviewSchema = z.object({
  decision: z.enum(['approved', 'declined']),
  note: z.string().trim().min(2).max(400),
});

const certResubmitSchema = z.object({
  office: z.enum(['chairman', 'hall', 'library', 'proctor']),
  note: z.string().trim().min(3).max(400),
});

const certAdminFinalSchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  adminNote: z.string().trim().max(400).optional(),
  physicalCollected: z.boolean().optional(),
});

const aboutUpsertSchema = z.object({
  slug: z.enum(['our-university', 'history', 'mission-vision', 'plans']),
  title: z.string().trim().min(3).max(120),
  body: z.string().trim().min(20).max(2500),
});

const vcUpdateSchema = z.object({
  name: z.string().trim().min(3).max(100),
  email: z.string().trim().email().max(120),
  phone: z.string().trim().min(4).max(40),
  tenure: z.string().trim().min(4).max(60),
  message: z.string().trim().min(20).max(2000),
  promoteNewVc: z.boolean().default(false),
});

const galleryCreateSchema = z.object({
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().min(5).max(400),
  category: z.enum(['Festival', 'Academic Event', 'Convocation', 'Campus Life']),
  mediaType: z.enum(['photo', 'video']),
  mediaUrl: z.string().trim().min(5).max(500),
  eventDate: z.string().trim().min(8).max(20),
});

const paymentGatewaySchema = z.object({
  id: z.string().trim().min(2).max(40),
  name: z.string().trim().min(2).max(80),
  code: z.string().trim().min(2).max(30),
  instructions: z.string().trim().min(4).max(240),
  enabled: z.boolean(),
});

const feeConfigSchema = z.object({
  certificateFeeBdt: z.number().int().min(50).max(20000),
  defaultExamFeeBdt: z.number().int().min(50).max(20000),
});

function marksToGrade(marks: number): { gradePoint: number; letterGrade: string } {
  if (marks >= 80) return { gradePoint: 4.0, letterGrade: 'A+' };
  if (marks >= 75) return { gradePoint: 3.75, letterGrade: 'A' };
  if (marks >= 70) return { gradePoint: 3.5, letterGrade: 'A-' };
  if (marks >= 65) return { gradePoint: 3.25, letterGrade: 'B+' };
  if (marks >= 60) return { gradePoint: 3.0, letterGrade: 'B' };
  if (marks >= 55) return { gradePoint: 2.75, letterGrade: 'B-' };
  if (marks >= 50) return { gradePoint: 2.5, letterGrade: 'C+' };
  if (marks >= 45) return { gradePoint: 2.25, letterGrade: 'C' };
  if (marks >= 40) return { gradePoint: 2.0, letterGrade: 'D' };
  return { gradePoint: 0.0, letterGrade: 'F' };
}

// 1. Account Approvals & Authority Management
portalRouter.get(
  '/users',
  requireRoles('admin', 'registrar', 'vc', 'chairman'),
  async (req: AuthenticatedRequest, res) => {
    let users = await pustRepo.listUsers();
    if (req.authUser!.role === 'chairman') {
      users = users.filter(
        (u) =>
          u.departmentCode === req.authUser!.departmentCode &&
          (u.role === 'student' || u.role === 'teacher')
      );
    }
    res.json({ users });
  }
);

portalRouter.patch(
  '/users/:id/approval',
  requireRoles('admin', 'chairman'),
  async (req: AuthenticatedRequest, res) => {
    const parsed = approvalSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid approval status.' });
      return;
    }

    const users = await pustRepo.listUsers();
    const target = users.find((u) => u.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: 'Account not found.' });
      return;
    }

    // Strict Approval Hierarchy Check
    const actorRole = req.authUser!.role;
    const adminApprovedRoles: UserRole[] = [
      'registrar',
      'vc',
      'chairman',
      'proctor',
      'library',
      'hall',
    ];
    if (actorRole === 'chairman') {
      if (
        (target.role !== 'student' && target.role !== 'teacher') ||
        target.departmentCode !== req.authUser!.departmentCode
      ) {
        res.status(403).json({
          error: 'Department Chairmen may only approve Teachers and Students in their own department.',
        });
        return;
      }
    } else if (actorRole === 'admin' && !adminApprovedRoles.includes(target.role) && target.role !== 'student' && target.role !== 'teacher') {
      res.status(403).json({ error: 'Unsupported role approval.' });
      return;
    }

    const updated = await pustRepo.updateUserApproval(target.id, parsed.data.approvalStatus);
    if (target.role === 'student') {
      const stu = await pustRepo.findStudentByAcademicId(target.academicId);
      if (stu) {
        await pustRepo.updateStudentById(stu.id, { approvalStatus: parsed.data.approvalStatus });
      }
    }

    await pustRepo.logAudit(
      req.authUser!.name,
      req.authUser!.role,
      `Account ${parsed.data.approvalStatus}`,
      `${target.name} (${target.role})`
    );
    res.json({ user: updated });
  }
);

portalRouter.patch(
  '/users/:id/assignments',
  requireRoles('admin', 'chairman'),
  async (req: AuthenticatedRequest, res) => {
    const parsed = teacherAssignSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid teacher course/session assignment.' });
      return;
    }
    const updated = await pustRepo.updateTeacherAssignments(
      String(req.params.id),
      parsed.data.assignedCourses,
      parsed.data.assignedSessions
    );
    if (!updated) {
      res.status(404).json({ error: 'Teacher account not found.' });
      return;
    }
    res.json({ user: updated });
  }
);

// 2. Student Portal Signup Tokens
portalRouter.get(
  '/signup-tokens',
  requireRoles('admin', 'chairman'),
  async (req: AuthenticatedRequest, res) => {
    let tokens = await pustRepo.listSignupTokens();
    if (req.authUser!.role === 'chairman') {
      tokens = tokens.filter((t) => t.departmentCode === req.authUser!.departmentCode);
    }
    res.json({ tokens });
  }
);

portalRouter.post(
  '/signup-tokens',
  requireRoles('admin', 'chairman'),
  async (req: AuthenticatedRequest, res) => {
    const parsed = tokenCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Complete all student admission token fields.' });
      return;
    }
    if (
      req.authUser!.role === 'chairman' &&
      parsed.data.departmentCode !== req.authUser!.departmentCode
    ) {
      res.status(403).json({ error: 'Chairmen can only generate tokens for their own department.' });
      return;
    }
    const created = await pustRepo.createSignupToken({
      ...parsed.data,
      createdBy: req.authUser!.name,
    });
    await pustRepo.logAudit(
      req.authUser!.name,
      req.authUser!.role,
      'Generated student signup token',
      `${created.academicId} (${created.departmentCode})`
    );
    res.status(201).json({ token: created });
  }
);

// 3. Combinable Student Database (Specialized Offices, Central Admin, Chairman)
portalRouter.get('/students', requireAuth, async (req: AuthenticatedRequest, res) => {
  const role = req.authUser!.role;
  const department = typeof req.query.department === 'string' ? req.query.department : 'ALL';
  const session = typeof req.query.session === 'string' ? req.query.session : 'ALL';
  const search = typeof req.query.search === 'string' ? req.query.search : '';

  if (role === 'student') {
    const self = await pustRepo.findStudentByAcademicId(req.authUser!.academicId);
    res.json({ students: self ? [self] : [] });
    return;
  }

  let students = await pustRepo.listStudents({ department, session, search });
  if (role === 'chairman' || role === 'teacher') {
    students = students.filter((s) => s.departmentCode === req.authUser!.departmentCode);
  } else if (role === 'hall') {
    students = students.filter(
      (s) => !req.authUser!.hallAffiliation || s.hallName === req.authUser!.hallAffiliation || req.authUser!.hallAffiliation === 'All Halls'
    );
  }
  res.json({ students });
});

portalRouter.patch(
  '/students/:id/records',
  requireRoles('admin', 'chairman', 'proctor'),
  async (req: AuthenticatedRequest, res) => {
    const parsed = studentNoteSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid student record update.' });
      return;
    }
    const patch: Record<string, unknown> = {};
    if (req.authUser!.role === 'chairman' && parsed.data.chairmanNotes !== undefined) {
      patch.chairmanNotes = parsed.data.chairmanNotes;
    }
    if (req.authUser!.role === 'admin' && parsed.data.adminNotes !== undefined) {
      patch.adminNotes = parsed.data.adminNotes;
    }
    if (req.authUser!.role === 'proctor') {
      if (parsed.data.disciplinaryStatus !== undefined) {
        patch.disciplinaryStatus = parsed.data.disciplinaryStatus;
      }
      if (parsed.data.disciplinaryNotes !== undefined) {
        patch.disciplinaryNotes = parsed.data.disciplinaryNotes;
      }
    }
    const updated = await pustRepo.updateStudentById(String(req.params.id), patch);
    if (!updated) {
      res.status(404).json({ error: 'Student not found.' });
      return;
    }
    await pustRepo.logAudit(
      req.authUser!.name,
      req.authUser!.role,
      'Updated student record',
      updated.academicId
    );
    res.json({ student: updated });
  }
);

// 4. Library Membership, Chairman Seal JSON, Digital/Physical Cards & Borrowing
portalRouter.get('/library/overview', requireAuth, async (req: AuthenticatedRequest, res) => {
  const role = req.authUser!.role;
  let apps = await pustRepo.listLibraryApplications();
  let cards = await pustRepo.listLibraryCards();
  let borrows = await pustRepo.listLibraryBorrows();

  if (role === 'student') {
    apps = apps.filter((a) => a.academicId === req.authUser!.academicId);
    cards = cards.filter((c) => c.academicId === req.authUser!.academicId);
    borrows = borrows.filter((b) => b.academicId === req.authUser!.academicId);
  } else if (role === 'chairman') {
    apps = apps.filter((a) => a.departmentCode === req.authUser!.departmentCode);
    cards = cards.filter((c) => c.departmentCode === req.authUser!.departmentCode);
  }

  res.json({ applications: apps, cards, borrows });
});

portalRouter.post(
  '/library/apply',
  requireRoles('student'),
  async (req: AuthenticatedRequest, res) => {
    const existing = (await pustRepo.listLibraryApplications()).find(
      (a) => a.academicId === req.authUser!.academicId && a.status !== 'rejected'
    );
    if (existing) {
      res.status(409).json({ error: 'You already have an active or pending library application.' });
      return;
    }
    const app = await pustRepo.createLibraryApplication({
      studentId: req.authUser!.sub,
      studentName: req.authUser!.name,
      academicId: req.authUser!.academicId,
      departmentCode: req.authUser!.departmentCode,
      session: req.authUser!.session || '2022-23',
      status: 'pending_chairman',
    });
    res.status(201).json({ application: app });
  }
);

portalRouter.patch(
  '/library/applications/:id/chairman',
  requireRoles('chairman'),
  async (req: AuthenticatedRequest, res) => {
    const parsed = chairmanSealSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Official Chairman seal and signature are required.' });
      return;
    }
    const apps = await pustRepo.listLibraryApplications();
    const target = apps.find((a) => a.id === req.params.id);
    if (!target || target.departmentCode !== req.authUser!.departmentCode) {
      res.status(404).json({ error: 'Library application not found in your department.' });
      return;
    }

    if (parsed.data.decision === 'reject') {
      const updated = await pustRepo.updateLibraryApplication(target.id, {
        status: 'rejected',
        chairmanNote: parsed.data.note || 'Declined by Department Chairman.',
      });
      res.json({ application: updated });
      return;
    }

    const signedAt = new Date().toISOString();
    const verificationHash = crypto
      .createHash('sha256')
      .update(`${target.academicId}:${req.authUser!.name}:${signedAt}`)
      .digest('hex')
      .slice(0, 16)
      .toUpperCase();

    const updated = await pustRepo.updateLibraryApplication(target.id, {
      status: 'forwarded_to_library',
      chairmanNote: parsed.data.note || 'Forwarded with official Chairman seal and signature.',
      chairmanSeal: {
        chairmanName: req.authUser!.name,
        departmentCode: req.authUser!.departmentCode,
        officialSeal: parsed.data.officialSeal,
        digitalSignature: parsed.data.digitalSignature,
        signedAt,
        verificationHash,
      },
    });
    await pustRepo.logAudit(
      req.authUser!.name,
      'chairman',
      'Forwarded library membership with JSON seal',
      target.academicId
    );
    res.json({ application: updated });
  }
);

portalRouter.patch(
  '/library/applications/:id/verify',
  requireRoles('library', 'admin'),
  async (req: AuthenticatedRequest, res) => {
    const parsed = libraryDecisionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid library decision.' });
      return;
    }
    const apps = await pustRepo.listLibraryApplications();
    const target = apps.find((a) => a.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: 'Application not found.' });
      return;
    }

    if (parsed.data.decision === 'reject') {
      const updated = await pustRepo.updateLibraryApplication(target.id, {
        status: 'rejected',
        libraryNote: parsed.data.note || 'Declined by Central Library.',
      });
      res.json({ application: updated });
      return;
    }

    if (!target.chairmanSeal) {
      res.status(409).json({
        error: 'Chairman seal and signature JSON record is required before Library approval.',
      });
      return;
    }

    const updated = await pustRepo.updateLibraryApplication(target.id, {
      status: 'approved',
      libraryNote: parsed.data.note || 'Verified and Digital Library Card issued.',
    });

    const card = await pustRepo.createLibraryCard({
      studentId: target.studentId,
      academicId: target.academicId,
      studentName: target.studentName,
      departmentCode: target.departmentCode,
      session: target.session,
      digitalCardNo: `PUST-LIB-${target.departmentCode}-${target.academicId}`,
      physicalCardRef: parsed.data.physicalCardRef || undefined,
      issuedAt: new Date().toISOString().slice(0, 10),
      validUntil: '2028-12-31',
      status: 'Active',
    });

    await pustRepo.logAudit(
      req.authUser!.name,
      req.authUser!.role,
      'Issued Digital Library Card',
      card.digitalCardNo
    );
    res.json({ application: updated, card });
  }
);

portalRouter.post(
  '/library/borrows',
  requireRoles('library', 'admin'),
  async (req: AuthenticatedRequest, res) => {
    const parsed = libraryBorrowSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid book borrowing payload.' });
      return;
    }
    const stu = await pustRepo.findStudentByAcademicId(parsed.data.academicId);
    const borrow = await pustRepo.createLibraryBorrow({
      academicId: parsed.data.academicId,
      studentName: stu?.name || parsed.data.academicId,
      bookTitle: parsed.data.bookTitle,
      isbn: parsed.data.isbn,
      borrowedAt: new Date().toISOString().slice(0, 10),
      dueAt: parsed.data.dueAt,
      fineBdt: 0,
      status: 'Borrowed',
    });
    res.status(201).json({ borrow });
  }
);

portalRouter.patch(
  '/library/borrows/:id/return',
  requireRoles('library', 'admin'),
  async (req, res) => {
    const updated = await pustRepo.updateLibraryBorrow(String(req.params.id), {
      status: 'Returned',
      returnedAt: new Date().toISOString().slice(0, 10),
    });
    if (!updated) {
      res.status(404).json({ error: 'Borrow record not found.' });
      return;
    }
    res.json({ borrow: updated });
  }
);

// 5. Residential Hall Management, Seat Allotment History, Dues & Clearances
portalRouter.get('/halls/overview', requireAuth, async (req: AuthenticatedRequest, res) => {
  const circulars = await pustRepo.listHallCirculars();
  let apps = await pustRepo.listHallApplications();
  let dues = await pustRepo.listHallDues();

  if (req.authUser!.role === 'student') {
    apps = apps.filter((a) => a.academicId === req.authUser!.academicId);
    dues = dues.filter((d) => d.academicId === req.authUser!.academicId);
  }
  res.json({ circulars, applications: apps, dues });
});

portalRouter.post(
  '/halls/circulars',
  requireRoles('hall', 'admin'),
  async (req: AuthenticatedRequest, res) => {
    const parsed = hallCircularSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Complete all hall vacancy circular fields.' });
      return;
    }
    const circular = await pustRepo.createHallCircular({
      ...parsed.data,
      publishedBy: req.authUser!.name,
      publishedAt: new Date().toISOString().slice(0, 10),
    });
    res.status(201).json({ circular });
  }
);

portalRouter.post(
  '/halls/apply',
  requireRoles('student'),
  async (req: AuthenticatedRequest, res) => {
    const parsed = hallApplySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Select a circular and provide an application statement.' });
      return;
    }
    const circular = (await pustRepo.listHallCirculars()).find((c) => c.id === parsed.data.circularId);
    if (!circular) {
      res.status(404).json({ error: 'Hall vacancy circular not found.' });
      return;
    }
    const app = await pustRepo.createHallApplication({
      circularId: circular.id,
      hallName: circular.hallName,
      studentId: req.authUser!.sub,
      academicId: req.authUser!.academicId,
      studentName: req.authUser!.name,
      departmentCode: req.authUser!.departmentCode,
      session: req.authUser!.session || '2022-23',
      statement: parsed.data.statement,
      status: 'pending',
      seatHistory: [],
    });
    res.status(201).json({ application: app });
  }
);

portalRouter.patch(
  '/halls/applications/:id/review',
  requireRoles('hall', 'admin'),
  async (req: AuthenticatedRequest, res) => {
    const parsed = hallReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid hall application review.' });
      return;
    }
    const apps = await pustRepo.listHallApplications();
    const target = apps.find((a) => a.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: 'Hall application not found.' });
      return;
    }

    const seatHistory = [...target.seatHistory];
    if (parsed.data.status === 'accepted' && parsed.data.assignedSeat) {
      seatHistory.push({
        seatNumber: parsed.data.assignedSeat,
        assignedAt: new Date().toISOString(),
        assignedBy: req.authUser!.name,
        note: parsed.data.reviewNote,
      });
      const stu = await pustRepo.findStudentByAcademicId(target.academicId);
      if (stu) {
        await pustRepo.updateStudentById(stu.id, {
          hallName: target.hallName,
          seatNumber: parsed.data.assignedSeat,
        });
      }
    }

    const updated = await pustRepo.updateHallApplication(target.id, {
      status: parsed.data.status,
      reviewNote: parsed.data.reviewNote,
      assignedSeat: parsed.data.assignedSeat || target.assignedSeat,
      seatHistory,
    });
    await pustRepo.logAudit(
      req.authUser!.name,
      req.authUser!.role,
      `Hall seat application ${parsed.data.status}`,
      `${target.academicId} (${target.hallName})`
    );
    res.json({ application: updated });
  }
);

portalRouter.patch(
  '/halls/applications/:id/seat',
  requireRoles('hall', 'admin'),
  async (req: AuthenticatedRequest, res) => {
    const parsed = hallSeatReassignSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Provide a valid seat number and reason.' });
      return;
    }
    const apps = await pustRepo.listHallApplications();
    const target = apps.find((a) => a.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: 'Application not found.' });
      return;
    }

    const seatHistory = [
      ...target.seatHistory,
      {
        seatNumber: parsed.data.assignedSeat,
        assignedAt: new Date().toISOString(),
        assignedBy: req.authUser!.name,
        note: parsed.data.note,
      },
    ];
    const updated = await pustRepo.updateHallApplication(target.id, {
      assignedSeat: parsed.data.assignedSeat,
      seatHistory,
    });

    const stu = await pustRepo.findStudentByAcademicId(target.academicId);
    if (stu) {
      await pustRepo.updateStudentById(stu.id, { seatNumber: parsed.data.assignedSeat });
    }
    res.json({ application: updated });
  }
);

portalRouter.post(
  '/halls/dues',
  requireRoles('hall', 'admin'),
  async (req: AuthenticatedRequest, res) => {
    const parsed = hallDueCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid hall due record.' });
      return;
    }
    const stu = await pustRepo.findStudentByAcademicId(parsed.data.academicId);
    const due = await pustRepo.createHallDue({
      academicId: parsed.data.academicId,
      studentName: stu?.name || parsed.data.academicId,
      hallName: parsed.data.hallName,
      feeTitle: parsed.data.feeTitle,
      amountBdt: parsed.data.amountBdt,
      status: 'Unpaid',
    });
    res.status(201).json({ due });
  }
);

portalRouter.post(
  '/halls/dues/:id/pay',
  requireRoles('student'),
  async (req: AuthenticatedRequest, res) => {
    const parsed = hallDuePaySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Provide payment method and transaction reference.' });
      return;
    }
    const dues = await pustRepo.listHallDues();
    const target = dues.find((d) => d.id === req.params.id);
    if (!target || target.academicId !== req.authUser!.academicId) {
      res.status(404).json({ error: 'Hall fee record not found.' });
      return;
    }
    const updated = await pustRepo.updateHallDue(target.id, {
      paymentMethod: parsed.data.paymentMethod,
      paymentRef: parsed.data.paymentRef,
      paidAt: new Date().toISOString().slice(0, 10),
      status: 'Payment Submitted',
    });
    res.json({ due: updated });
  }
);

portalRouter.patch(
  '/halls/dues/:id/clear',
  requireRoles('hall', 'admin'),
  async (req: AuthenticatedRequest, res) => {
    const dues = await pustRepo.listHallDues();
    const target = dues.find((d) => d.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: 'Hall due record not found.' });
      return;
    }
    const clearanceRef = `PUST-HALL-CLR-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const updated = await pustRepo.updateHallDue(target.id, {
      status: 'Cleared',
      clearanceRef,
      clearedAt: new Date().toISOString().slice(0, 10),
      clearedBy: req.authUser!.name,
    });
    await pustRepo.logAudit(
      req.authUser!.name,
      req.authUser!.role,
      'Generated Hall Clearance',
      `${target.academicId} · ${clearanceRef}`
    );
    res.json({ due: updated });
  }
);

// 6. Courses, Examination Circulars, Hall Dues Gate, Payments, Admit Cards & Results
portalRouter.get('/exams/overview', requireAuth, async (req: AuthenticatedRequest, res) => {
  const courses = await pustRepo.listCourses();
  const circulars = await pustRepo.listExamCirculars();
  let apps = await pustRepo.listExamApplications();
  let results = await pustRepo.listExamResults();
  const gateways = (await pustRepo.listPaymentGateways()).filter((g) => g.enabled);

  if (req.authUser!.role === 'student') {
    apps = apps.filter((a) => a.academicId === req.authUser!.academicId);
    results = results.filter((r) => r.academicId === req.authUser!.academicId && r.published);
  } else if (req.authUser!.role === 'chairman' || req.authUser!.role === 'teacher') {
    apps = apps.filter((a) => a.departmentCode === req.authUser!.departmentCode);
    results = results.filter((r) => r.departmentCode === req.authUser!.departmentCode);
  }

  // Check student Hall dues status automatically
  const unpaidHallDues = (await pustRepo.listHallDues()).filter(
    (d) => d.academicId === req.authUser!.academicId && d.status !== 'Cleared'
  );

  res.json({
    courses,
    circulars,
    applications: apps,
    results,
    gateways,
    hallClearanceBlocked: unpaidHallDues.length > 0,
    unpaidHallDues,
  });
});

portalRouter.post(
  '/exams/courses',
  requireRoles('admin', 'chairman'),
  async (req: AuthenticatedRequest, res) => {
    const parsed = courseCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid course definition.' });
      return;
    }
    if (
      req.authUser!.role === 'chairman' &&
      parsed.data.departmentCode !== req.authUser!.departmentCode
    ) {
      res.status(403).json({ error: 'Chairmen can only assign courses for their own department.' });
      return;
    }
    const course = await pustRepo.createCourse(parsed.data);
    res.status(201).json({ course });
  }
);

portalRouter.post(
  '/exams/circulars',
  requireRoles('admin', 'chairman'),
  async (req: AuthenticatedRequest, res) => {
    const parsed = examCircularSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Complete all examination circular fields.' });
      return;
    }
    if (
      req.authUser!.role === 'chairman' &&
      parsed.data.departmentCode !== req.authUser!.departmentCode
    ) {
      res.status(403).json({ error: 'Chairmen can only publish exam circulars for their department.' });
      return;
    }
    const circular = await pustRepo.createExamCircular({
      ...parsed.data,
      publishedBy: req.authUser!.name,
      publishedAt: new Date().toISOString().slice(0, 10),
    });
    res.status(201).json({ circular });
  }
);

portalRouter.post(
  '/exams/apply',
  requireRoles('student'),
  async (req: AuthenticatedRequest, res) => {
    const parsed = examApplySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Select an exam circular and at least one eligible course.' });
      return;
    }

    // Automatic Hall Financial Clearance Check
    const unpaidDues = (await pustRepo.listHallDues()).filter(
      (d) => d.academicId === req.authUser!.academicId && d.status !== 'Cleared'
    );
    if (unpaidDues.length > 0) {
      res.status(403).json({
        error:
          'Examination form fill-up blocked: You have outstanding residential Hall dues. Obtain Hall clearance first.',
      });
      return;
    }

    const circular = (await pustRepo.listExamCirculars()).find(
      (c) => c.id === parsed.data.circularId
    );
    if (!circular) {
      res.status(404).json({ error: 'Examination circular not found.' });
      return;
    }

    // Enforce eligible course restriction
    const eligibleSet = new Set(circular.eligibleCourseCodes);
    const invalidCourses = parsed.data.selectedCourseCodes.filter((c) => !eligibleSet.has(c));
    if (invalidCourses.length > 0) {
      res.status(400).json({
        error: `Unauthorized course selection blocked: ${invalidCourses.join(', ')}`,
      });
      return;
    }

    const allCourses = await pustRepo.listCourses();
    const totalCredits = parsed.data.selectedCourseCodes.reduce((sum, code) => {
      const found = allCourses.find((c) => c.code === code);
      return sum + (found?.credits ?? 3);
    }, 0);

    const formReference = `PUST-EX-${circular.departmentCode}-${crypto
      .randomBytes(3)
      .toString('hex')
      .toUpperCase()}`;

    const application = await pustRepo.createExamApplication({
      circularId: circular.id,
      examTitle: circular.title,
      studentId: req.authUser!.sub,
      academicId: req.authUser!.academicId,
      studentName: req.authUser!.name,
      departmentCode: req.authUser!.departmentCode,
      session: req.authUser!.session || circular.session,
      semester: circular.semester,
      selectedCourseCodes: parsed.data.selectedCourseCodes,
      totalCredits,
      formReference,
      feeBdt: circular.feeBdt,
      paymentStatus: 'Pending',
      verificationStatus: 'Pending Chairman Verification',
      hallClearanceChecked: true,
    });

    res.status(201).json({ application });
  }
);

portalRouter.post(
  '/exams/applications/:id/pay',
  requireRoles('student'),
  async (req: AuthenticatedRequest, res) => {
    const parsed = examPaySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Provide a valid payment method and transaction ID.' });
      return;
    }
    const apps = await pustRepo.listExamApplications();
    const target = apps.find((a) => a.id === req.params.id);
    if (!target || target.academicId !== req.authUser!.academicId) {
      res.status(404).json({ error: 'Examination form not found.' });
      return;
    }
    const updated = await pustRepo.updateExamApplication(target.id, {
      paymentMethod: parsed.data.paymentMethod,
      transactionId: parsed.data.transactionId,
      paymentStatus: 'Paid',
    });
    res.json({ application: updated });
  }
);

portalRouter.patch(
  '/exams/applications/:id/verify',
  requireRoles('chairman', 'admin'),
  async (req: AuthenticatedRequest, res) => {
    const parsed = examVerifySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid verification decision.' });
      return;
    }
    const apps = await pustRepo.listExamApplications();
    const target = apps.find((a) => a.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: 'Examination application not found.' });
      return;
    }
    if (
      req.authUser!.role === 'chairman' &&
      target.departmentCode !== req.authUser!.departmentCode
    ) {
      res.status(403).json({ error: 'Cannot verify applications outside your department.' });
      return;
    }
    if (parsed.data.decision === 'Approved' && target.paymentStatus !== 'Paid') {
      res.status(409).json({
        error: 'Examination fee payment must be completed before Admit Card issuance.',
      });
      return;
    }

    const admitCardNo =
      parsed.data.decision === 'Approved'
        ? target.admitCardNo || `ADMIT-${target.departmentCode}-${target.academicId}-${target.semester}`
        : undefined;

    const updated = await pustRepo.updateExamApplication(target.id, {
      verificationStatus: parsed.data.decision,
      admitCardNo,
      admitCardIssuedAt:
        parsed.data.decision === 'Approved' ? new Date().toISOString().slice(0, 10) : undefined,
      physicalCollected: parsed.data.physicalCollected ?? target.physicalCollected,
    });
    await pustRepo.logAudit(
      req.authUser!.name,
      req.authUser!.role,
      `Exam application ${parsed.data.decision}`,
      target.formReference
    );
    res.json({ application: updated });
  }
);

portalRouter.post(
  '/exams/results',
  requireRoles('chairman', 'admin'),
  async (req: AuthenticatedRequest, res) => {
    const parsed = resultCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Provide valid student marks and course entries.' });
      return;
    }
    const stu = await pustRepo.findStudentByAcademicId(parsed.data.academicId);
    if (!stu) {
      res.status(404).json({ error: 'Student academic ID not found.' });
      return;
    }

    let totalWeighted = 0;
    let totalCredits = 0;
    let hasFail = false;

    const evaluatedCourses = parsed.data.courses.map((c) => {
      const g = marksToGrade(c.marks);
      if (g.gradePoint === 0) hasFail = true;
      totalWeighted += g.gradePoint * c.credits;
      totalCredits += c.credits;
      return { ...c, ...g };
    });

    const sgpa = totalCredits > 0 ? Number((totalWeighted / totalCredits).toFixed(2)) : 0;
    let promotionStatus: 'Promoted (Auto)' | 'Promoted (Manual)' | 'Probation / Repeat' =
      !hasFail && sgpa >= 2.0 ? 'Promoted (Auto)' : 'Probation / Repeat';
    if (parsed.data.promotionMode === 'manual_promoted') promotionStatus = 'Promoted (Manual)';
    if (parsed.data.promotionMode === 'manual_repeat') promotionStatus = 'Probation / Repeat';

    const result = await pustRepo.createExamResult({
      academicId: stu.academicId,
      studentName: stu.name,
      departmentCode: stu.departmentCode,
      session: stu.session,
      semester: parsed.data.semester,
      courses: evaluatedCourses,
      sgpa,
      promotionStatus,
      published: true,
      enteredBy: req.authUser!.name,
      publishedAt: new Date().toISOString().slice(0, 10),
    });

    if (promotionStatus.startsWith('Promoted')) {
      await pustRepo.updateStudentById(stu.id, {
        currentSemester: Math.max(stu.currentSemester, parsed.data.semester + 1),
        completedSemesters: Math.max(stu.completedSemesters, parsed.data.semester),
        cgpa: Number(((stu.cgpa + sgpa) / 2).toFixed(2)),
      });
    }

    await pustRepo.createNotice({
      referenceNo: `PUST/${stu.departmentCode}/RES/${new Date().getFullYear()}-${parsed.data.semester}`,
      title: `Semester ${parsed.data.semester} Examination Result Published — ${stu.departmentCode} (${stu.session})`,
      category: 'Result',
      publishedAt: new Date().toISOString().slice(0, 10),
      departmentCode: stu.departmentCode,
      boardScope: 'department',
      visibility: 'registered',
      targetSession: stu.session,
      summary: `Semester ${parsed.data.semester} result published for ${stu.academicId} (SGPA ${sgpa.toFixed(
        2
      )} · ${promotionStatus}).`,
      body: `Registered departmental students in session ${stu.session} may inspect their verified Semester ${parsed.data.semester} grade sheet and promotion status under Portal -> Exams & Results.`,
      authorName: req.authUser!.name,
      authorRole: req.authUser!.role,
    });

    res.status(201).json({ result });
  }
);

// 7. Certificate Application, 4-Office Independent Clearance & Temporary Certificate
portalRouter.get('/certificates/overview', requireAuth, async (req: AuthenticatedRequest, res) => {
  let apps = await pustRepo.listCertificateApplications();
  const feeConfig = await pustRepo.getFeeConfig();
  const gateways = (await pustRepo.listPaymentGateways()).filter((g) => g.enabled);

  if (req.authUser!.role === 'student') {
    apps = apps.filter((a) => a.academicId === req.authUser!.academicId);
  } else if (req.authUser!.role === 'chairman') {
    apps = apps.filter((a) => a.departmentCode === req.authUser!.departmentCode);
  }

  const student =
    req.authUser!.role === 'student'
      ? await pustRepo.findStudentByAcademicId(req.authUser!.academicId)
      : null;

  res.json({ applications: apps, feeConfig, gateways, student });
});

portalRouter.post(
  '/certificates/apply',
  requireRoles('student'),
  async (req: AuthenticatedRequest, res) => {
    const parsed = certApplySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Complete certificate type and fee payment details.' });
      return;
    }

    const stu = await pustRepo.findStudentByAcademicId(req.authUser!.academicId);
    if (!stu || stu.completedSemesters < 8 || !stu.allResultsPublished) {
      res.status(409).json({
        error:
          'Eligibility requirement not met: All 8 semesters must be completed with published final results before applying for a certificate.',
      });
      return;
    }

    const feeConfig = await pustRepo.getFeeConfig();
    const makeOffice = (office: ClearanceOfficeKey, officeLabel: string): OfficeClearanceState => ({
      office,
      officeLabel,
      status: 'pending',
      note: 'Awaiting independent office clearance review.',
      history: [],
    });

    const app = await pustRepo.createCertificateApplication({
      studentId: req.authUser!.sub,
      academicId: stu.academicId,
      studentName: stu.name,
      departmentCode: stu.departmentCode,
      session: stu.session,
      certificateType: parsed.data.certificateType,
      feeBdt: feeConfig.certificateFeeBdt,
      paymentMethod: parsed.data.paymentMethod,
      transactionId: parsed.data.transactionId,
      clearances: {
        chairman: makeOffice('chairman', "Department Chairman's Office"),
        hall: makeOffice('hall', 'Hall Office'),
        library: makeOffice('library', 'Library Office'),
        proctor: makeOffice('proctor', "Proctor's Office"),
      },
      finalAdminStatus: 'waiting_offices',
    });

    res.status(201).json({ application: app });
  }
);

portalRouter.patch(
  '/certificates/:id/office-review',
  requireRoles('chairman', 'hall', 'library', 'proctor'),
  async (req: AuthenticatedRequest, res) => {
    const parsed = certOfficeReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Provide approval/decline decision and written note.' });
      return;
    }
    const apps = await pustRepo.listCertificateApplications();
    const target = apps.find((a) => a.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: 'Certificate application not found.' });
      return;
    }

    const officeKey = req.authUser!.role as ClearanceOfficeKey;
    if (officeKey === 'chairman' && target.departmentCode !== req.authUser!.departmentCode) {
      res.status(403).json({ error: 'Chairman can only clear students in their own department.' });
      return;
    }

    const now = new Date().toISOString();
    const currentOffice = target.clearances[officeKey];
    const updatedOffice: OfficeClearanceState = {
      ...currentOffice,
      status: parsed.data.decision,
      note: parsed.data.note,
      updatedBy: req.authUser!.name,
      updatedAt: now,
      history: [
        ...currentOffice.history,
        {
          action: parsed.data.decision,
          note: parsed.data.note,
          actor: req.authUser!.name,
          timestamp: now,
        },
      ],
    };

    const nextClearances = {
      ...target.clearances,
      [officeKey]: updatedOffice,
    };

    const allFourApproved = (['chairman', 'hall', 'library', 'proctor'] as ClearanceOfficeKey[]).every(
      (k) => nextClearances[k].status === 'approved'
    );

    const updated = await pustRepo.updateCertificateApplication(target.id, {
      clearances: nextClearances,
      finalAdminStatus: allFourApproved ? 'pending_admin' : 'waiting_offices',
    });

    await pustRepo.logAudit(
      req.authUser!.name,
      req.authUser!.role,
      `Certificate ${officeKey} clearance ${parsed.data.decision}`,
      target.academicId
    );
    res.json({ application: updated });
  }
);

portalRouter.post(
  '/certificates/:id/resubmit',
  requireRoles('student'),
  async (req: AuthenticatedRequest, res) => {
    const parsed = certResubmitSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Specify office and resolution note.' });
      return;
    }
    const apps = await pustRepo.listCertificateApplications();
    const target = apps.find((a) => a.id === req.params.id);
    if (!target || target.academicId !== req.authUser!.academicId) {
      res.status(404).json({ error: 'Certificate application not found.' });
      return;
    }

    const officeState = target.clearances[parsed.data.office];
    if (officeState.status !== 'declined') {
      res.status(409).json({ error: 'Only declined office clearances can be resubmitted.' });
      return;
    }

    const now = new Date().toISOString();
    const nextOffice: OfficeClearanceState = {
      ...officeState,
      status: 'pending',
      note: `Student resubmitted: ${parsed.data.note}`,
      updatedAt: now,
      history: [
        ...officeState.history,
        {
          action: 'resubmitted',
          note: parsed.data.note,
          actor: req.authUser!.name,
          timestamp: now,
        },
      ],
    };

    const updated = await pustRepo.updateCertificateApplication(target.id, {
      clearances: {
        ...target.clearances,
        [parsed.data.office]: nextOffice,
      },
      finalAdminStatus: 'waiting_offices',
    });
    res.json({ application: updated });
  }
);

portalRouter.patch(
  '/certificates/:id/admin-final',
  requireRoles('admin'),
  async (req: AuthenticatedRequest, res) => {
    const parsed = certAdminFinalSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid final verification decision.' });
      return;
    }
    const apps = await pustRepo.listCertificateApplications();
    const target = apps.find((a) => a.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: 'Certificate application not found.' });
      return;
    }

    const allFourApproved = (['chairman', 'hall', 'library', 'proctor'] as ClearanceOfficeKey[]).every(
      (k) => target.clearances[k].status === 'approved'
    );
    if (parsed.data.decision === 'approved' && !allFourApproved) {
      res.status(409).json({
        error: 'Blocked: Final Temporary Certificate requires approval from all 4 offices first.',
      });
      return;
    }

    const serial =
      parsed.data.decision === 'approved'
        ? target.certificateSerial ||
          `PUST-CERT-${target.departmentCode}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
        : undefined;

    const updated = await pustRepo.updateCertificateApplication(target.id, {
      finalAdminStatus: parsed.data.decision,
      adminNote: parsed.data.adminNote,
      certificateSerial: serial,
      issuedAt: parsed.data.decision === 'approved' ? new Date().toISOString().slice(0, 10) : undefined,
      physicalCollected: parsed.data.physicalCollected ?? target.physicalCollected,
    });

    await pustRepo.logAudit(
      req.authUser!.name,
      'admin',
      `Temporary Certificate ${parsed.data.decision}`,
      serial || target.academicId
    );
    res.json({ application: updated });
  }
);

// 8. Admin CMS & Configuration (About, Vice-Chancellor Archive, Gallery, Payment Gateways, Audit Logs)
portalRouter.put('/cms/about', requireRoles('admin'), async (req: AuthenticatedRequest, res) => {
  const parsed = aboutUpsertSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid About content payload.' });
    return;
  }
  const section = await pustRepo.upsertAboutSection(
    parsed.data.slug,
    parsed.data.title,
    parsed.data.body
  );
  await pustRepo.logAudit(req.authUser!.name, 'admin', 'Updated About CMS', parsed.data.slug);
  res.json({ section });
});

portalRouter.put(
  '/cms/vice-chancellor',
  requireRoles('admin'),
  async (req: AuthenticatedRequest, res) => {
    const parsed = vcUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Complete all Vice-Chancellor profile fields.' });
      return;
    }
    const profiles = await pustRepo.updateCurrentViceChancellor(parsed.data);
    await pustRepo.logAudit(
      req.authUser!.name,
      'admin',
      parsed.data.promoteNewVc ? 'Appointed new VC & archived predecessor' : 'Updated current VC',
      parsed.data.name
    );
    res.json({ profiles });
  }
);

portalRouter.post('/cms/gallery', requireRoles('admin'), async (req: AuthenticatedRequest, res) => {
  const parsed = galleryCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Complete all gallery media fields.' });
    return;
  }
  const item = await pustRepo.createGalleryItem(parsed.data);
  res.status(201).json({ item });
});

portalRouter.delete(
  '/cms/gallery/:id',
  requireRoles('admin'),
  async (req: AuthenticatedRequest, res) => {
    const ok = await pustRepo.deleteGalleryItem(String(req.params.id));
    if (!ok) {
      res.status(404).json({ error: 'Gallery item not found.' });
      return;
    }
    res.json({ deleted: true });
  }
);

portalRouter.get('/config/payments', requireRoles('admin'), async (_req, res) => {
  const gateways = await pustRepo.listPaymentGateways();
  const feeConfig = await pustRepo.getFeeConfig();
  res.json({ gateways, feeConfig });
});

portalRouter.put('/config/payments', requireRoles('admin'), async (req: AuthenticatedRequest, res) => {
  const parsed = paymentGatewaySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payment gateway configuration.' });
    return;
  }
  const gateway = await pustRepo.upsertPaymentGateway(parsed.data);
  await pustRepo.logAudit(
    req.authUser!.name,
    'admin',
    `Configured payment gateway (${gateway.enabled ? 'Enabled' : 'Disabled'})`,
    gateway.name
  );
  res.json({ gateway });
});

portalRouter.put('/config/fees', requireRoles('admin'), async (req: AuthenticatedRequest, res) => {
  const parsed = feeConfigSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid fee configuration.' });
    return;
  }
  const feeConfig = await pustRepo.updateFeeConfig(parsed.data);
  res.json({ feeConfig });
});

portalRouter.get('/audit-logs', requireRoles('admin', 'vc', 'registrar'), async (_req, res) => {
  const logs = await pustRepo.listAuditLogs();
  res.json({ logs });
});
