import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRoles, wrapRouterAsync, type AuthenticatedRequest, type JwtClaims } from '../auth';
import { pustRepo } from '../db';
import { isSafeMediaUrl } from '../../src/lib/media';
import type { ClearanceOfficeKey, OfficeClearanceState, UserRole } from '../../src/types/pust';
import {
  autoClearHallDueIfEnabled,
  autoEvaluateCertificateApplication,
  autoFinalizeCertificateIfReady,
  autoIssueAdmitCardIfEligible,
  autoIssueLibraryCardAfterChairmanSeal,
  buildOfficeFlowOverview,
  processSingleFlowItem,
  runAutomatedOfficeSweep,
} from '../officeAutomation';

export const portalRouter = wrapRouterAsync(Router());

function isHallOfficerScopedTo(authUser: JwtClaims, hallName: string): boolean {
  if (authUser.role !== 'hall') return true;
  const aff = authUser.hallAffiliation?.trim();
  if (!aff || aff === 'All Halls' || aff === 'Academic Block' || aff === 'Administrative Building') {
    return true;
  }
  return aff === hallName;
}

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
  body: z.string().trim().min(20).max(8000),
});

const vcUpdateSchema = z.object({
  name: z.string().trim().min(3).max(100),
  email: z.string().trim().email().max(120),
  phone: z.string().trim().min(4).max(40),
  tenure: z.string().trim().min(4).max(60),
  message: z.string().trim().min(20).max(8000),
  photoUrl: z
    .string()
    .trim()
    .max(2000)
    .refine((v) => !v || isSafeMediaUrl(v), 'Photo URL must be a valid https://, http://, or local asset path.')
    .optional(),
  promoteNewVc: z.boolean().default(false),
});

const galleryCreateSchema = z.object({
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().min(5).max(400),
  category: z.enum(['Festival', 'Academic Event', 'Convocation', 'Campus Life']),
  mediaType: z.enum(['photo', 'video']),
  mediaUrl: z
    .string()
    .trim()
    .min(5)
    .max(2000)
    .refine(isSafeMediaUrl, 'Media URL must be a valid https://, http://, or local asset path.'),
  eventDate: z.string().trim().min(8).max(20),
  visibility: z.enum(['public', 'registered']).default('public'),
});

const galleryUpdateSchema = z.object({
  title: z.string().trim().min(3).max(140).optional(),
  description: z.string().trim().min(5).max(400).optional(),
  category: z.enum(['Festival', 'Academic Event', 'Convocation', 'Campus Life']).optional(),
  mediaType: z.enum(['photo', 'video']).optional(),
  mediaUrl: z
    .string()
    .trim()
    .min(5)
    .max(2000)
    .refine(isSafeMediaUrl, 'Media URL must be a valid https://, http://, or local asset path.')
    .optional(),
  eventDate: z.string().trim().min(8).max(20).optional(),
  visibility: z.enum(['public', 'registered']).optional(),
});

const safeMediaField = z
  .string()
  .trim()
  .min(1)
  .max(2000)
  .refine(isSafeMediaUrl, 'Media or link URL must be a valid https://, http://, or relative / path.');

const safeLinkField = z
  .string()
  .trim()
  .min(1)
  .max(2000)
  .refine(isSafeMediaUrl, 'URL must be a valid https://, http://, or relative / path.');

const formerVcCreateSchema = z.object({
  name: z.string().trim().min(3).max(100),
  tenure: z.string().trim().min(3).max(60),
  email: z.string().trim().email().max(120).or(z.literal('—')),
  phone: z.string().trim().min(1).max(40),
  message: z.string().trim().min(5).max(8000),
  photoUrl: z
    .string()
    .trim()
    .max(2000)
    .refine((v) => !v || isSafeMediaUrl(v), 'Photo URL must be a valid https://, http://, or local asset path.')
    .optional(),
});

const vcByIdUpdateSchema = z.object({
  name: z.string().trim().min(3).max(100).optional(),
  title: z.string().trim().min(2).max(100).optional(),
  tenure: z.string().trim().min(3).max(60).optional(),
  email: z.string().trim().max(120).optional(),
  phone: z.string().trim().min(1).max(40).optional(),
  message: z.string().trim().min(5).max(8000).optional(),
  photoUrl: z
    .string()
    .trim()
    .max(2000)
    .refine((v) => !v || isSafeMediaUrl(v), 'Photo URL must be a valid https://, http://, or local asset path.')
    .optional(),
});

const FACULTIES_ENUM = z.enum([
  'Faculty of Engineering and Technology',
  'Faculty of Science',
  'Faculty of Business Studies',
  'Faculty of Humanities and Social Science',
  'Faculty of Life and Earth Science',
]);

const profileUpdateSchema = z.object({
  establishedYear: z.number().int().min(1900).max(2100).optional(),
  campusAcres: z.number().min(1).max(10000).optional(),
  facultiesCount: z.number().int().min(1).max(100).optional(),
  departmentsCount: z.number().int().min(1).max(200).optional(),
  facultyMembersCount: z.number().int().min(1).max(10000).optional(),
  studentsCount: z.number().int().min(1).max(500000).optional(),
  convocationDate: z.string().trim().min(3).max(80).optional(),
  navbarTagline: z.string().trim().min(2).max(120).optional(),
  heroEyebrow: z.string().trim().max(240).optional(),
  heroTitle: z.string().trim().min(5).max(240).optional(),
  heroSubtitle: z.string().trim().min(10).max(1000).optional(),
  leadership: z
    .array(
      z.object({
        role: z.string().trim().min(2).max(120),
        name: z.string().trim().min(2).max(120),
        email: z.string().trim().email().max(120),
        phone: z.string().trim().min(3).max(40),
        office: z.string().trim().min(2).max(160),
      })
    )
    .max(40)
    .optional(),
  units: z
    .array(
      z.object({
        code: z.string().trim().min(2).max(30),
        name: z.string().trim().min(2).max(160),
        category: z.enum([
          'Statutory Governance',
          'Administrative Office',
          'Specialized Cell & Institute',
        ]),
        description: z.string().trim().min(5).max(800),
      })
    )
    .max(60)
    .optional(),
  journals: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(60),
        title: z.string().trim().min(3).max(200),
        issn: z.string().trim().min(3).max(60),
        scope: z.string().trim().min(5).max(600),
        currentIssue: z.string().trim().min(2).max(140),
      })
    )
    .max(30)
    .optional(),
  institutionalLinksEyebrow: z.string().trim().min(2).max(120).optional(),
  institutionalLinksHeading: z.string().trim().min(2).max(120).optional(),
  institutionalLinks: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(60),
        route: safeLinkField,
        title: z.string().trim().min(2).max(160),
        desc: z.string().trim().min(4).max(400),
      })
    )
    .max(20)
    .optional(),
  upcomingSeminars: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(60),
        date: z.string().trim().min(3).max(40),
        organizer: z.string().trim().min(2).max(160),
        title: z.string().trim().min(3).max(240),
      })
    )
    .max(30)
    .optional(),
  campusMapMeta: z
    .object({
      eyebrow: z.string().trim().min(2).max(160),
      title: z.string().trim().min(2).max(160),
      subtitle: z.string().trim().min(5).max(500),
      coordinates: z.string().trim().min(2).max(100),
    })
    .optional(),
  campusBuildings: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(60),
        code: z.string().trim().min(1).max(20),
        name: z.string().trim().min(2).max(160),
        shortName: z.string().trim().min(2).max(80),
        zone: z.enum(['Administration', 'Academic', 'Library & Culture', 'Residential & Wellness']),
        gridRef: z.string().trim().min(2).max(100),
        xPercent: z.number().min(0).max(100),
        yPercent: z.number().min(0).max(100),
        photo: safeMediaField,
        caption: z.string().trim().min(2).max(240),
        summary: z.string().trim().min(5).max(1000),
        offices: z.string().trim().min(2).max(500),
        hours: z.string().trim().min(2).max(120),
        facilities: z.string().trim().min(2).max(500),
        route: safeLinkField,
        routeLabel: z.string().trim().min(2).max(80),
      })
    )
    .max(25)
    .optional(),
  governanceContent: z
    .object({
      officialActUrl: safeLinkField,
      actIntro: z.string().trim().min(10).max(3000),
      actClauses: z
        .array(z.object({ clause: z.string().trim().min(2).max(200), detail: z.string().trim().min(5).max(1000) }))
        .max(20),
      actCitations: z
        .array(z.object({ label: z.string().trim().min(2).max(120), value: z.string().trim().min(1).max(160) }))
        .max(15),
      regentBoardMembers: z
        .array(
          z.object({
            seat: z.string().trim().min(2).max(160),
            designation: z.string().trim().min(2).max(300),
            term: z.string().trim().min(1).max(60),
          })
        )
        .max(30),
      regentFunctions: z.array(z.string().trim().min(5).max(500)).max(20),
      academicCouncilIntro: z.string().trim().min(10).max(3000),
      academicCouncilCards: z
        .array(z.object({ title: z.string().trim().min(2).max(160), detail: z.string().trim().min(5).max(800) }))
        .max(20),
      academicCouncilStructure: z
        .array(z.object({ label: z.string().trim().min(2).max(120), value: z.string().trim().min(1).max(160) }))
        .max(15),
      financeCommitteeIntro: z.string().trim().min(10).max(3000),
      financeCommitteeScopes: z
        .array(z.object({ scope: z.string().trim().min(2).max(160), desc: z.string().trim().min(5).max(800) }))
        .max(20),
      financeCommitteeLeadership: z
        .array(z.object({ label: z.string().trim().min(2).max(120), value: z.string().trim().min(1).max(160) }))
        .max(15),
      ordinanceIntro: z.string().trim().min(10).max(3000),
      ordinanceRules: z
        .array(z.object({ label: z.string().trim().min(2).max(160), value: z.string().trim().min(1).max(240) }))
        .max(20),
      gradingScale: z
        .array(
          z.object({
            range: z.string().trim().min(2).max(80),
            letter: z.string().trim().min(1).max(10),
            gp: z.string().trim().min(1).max(10),
            remarks: z.string().trim().min(1).max(60),
          })
        )
        .max(20),
    })
    .optional(),
  adminShowcase: z
    .object({
      buildingImage: safeMediaField,
      buildingCaption: z.string().trim().min(2).max(240),
      charterTag: z.string().trim().min(2).max(100),
      accountabilityCycle: z.string().trim().min(2).max(100),
      apaFyLabel: z.string().trim().min(2).max(160),
      apaBenchmarks: z
        .array(
          z.object({
            code: z.string().trim().min(2).max(120),
            title: z.string().trim().min(2).max(160),
            detail: z.string().trim().min(5).max(800),
          })
        )
        .max(15),
    })
    .optional(),
  aboutExtras: z
    .object({
      campusImage: safeMediaField,
      campusCaption: z.string().trim().min(2).max(240),
      milestones: z
        .array(
          z.object({
            year: z.string().trim().min(2).max(40),
            title: z.string().trim().min(2).max(160),
            detail: z.string().trim().min(5).max(500),
          })
        )
        .max(25),
    })
    .optional(),
  academicExtras: z
    .object({
      degreePrograms: z
        .array(
          z.object({
            level: z.string().trim().min(2).max(160),
            degrees: z.string().trim().min(2).max(300),
            duration: z.string().trim().min(2).max(160),
            credits: z.string().trim().min(2).max(160),
            entry: z.string().trim().min(2).max(240),
          })
        )
        .max(15),
      facultyDeans: z
        .array(
          z.object({
            faculty: FACULTIES_ENUM,
            dean: z.string().trim().min(2).max(140),
            email: z.string().trim().email().max(120),
            code: z.string().trim().min(2).max(80),
            depts: z.string().trim().min(2).max(400),
          })
        )
        .max(15),
      academicCalendar: z
        .array(
          z.object({
            term: z.string().trim().min(2).max(140),
            event: z.string().trim().min(2).max(240),
            date: z.string().trim().min(2).max(60),
            endDate: z.string().trim().max(60).optional(),
            category: z.enum(['exam', 'holiday', 'deadline', 'academic']).optional(),
            venue: z.string().trim().max(160).optional(),
            details: z.string().trim().max(500).optional(),
          })
        )
        .max(80),
      scholarships: z
        .array(z.object({ title: z.string().trim().min(2).max(180), detail: z.string().trim().min(5).max(600) }))
        .max(20),
      downloadForms: z
        .array(
          z.object({
            code: z.string().trim().min(2).max(40),
            title: z.string().trim().min(2).max(200),
            office: z.string().trim().min(2).max(200),
            note: z.string().trim().min(2).max(400),
            portalTarget: safeLinkField,
            portalLabel: z.string().trim().min(2).max(100),
            fields: z.array(z.string().trim().min(2).max(200)).max(15),
          })
        )
        .max(20),
      researchIntro: z.string().trim().min(5).max(1000),
      researchInfraCards: z
        .array(
          z.object({
            id: z.string().trim().min(1).max(60),
            tag: z.string().trim().min(2).max(140),
            title: z.string().trim().min(2).max(160),
            description: z.string().trim().min(5).max(800),
            imageUrl: safeMediaField,
            caption: z.string().trim().min(2).max(240),
          })
        )
        .max(12),
    })
    .optional(),
  admissionsConfig: z
    .object({
      kicker: z.string().trim().min(2).max(120),
      gstUnits: z
        .array(
          z.object({
            unitLabel: z.string().trim().min(2).max(120),
            deptCountLabel: z.string().trim().min(2).max(80),
            departmentsText: z.string().trim().min(4).max(600),
          })
        )
        .max(10),
      undergradText: z.string().trim().min(10).max(1000),
      gradText: z.string().trim().min(10).max(1000),
      eveningText: z.string().trim().min(10).max(1000),
      totalIntakeLabel: z.string().trim().min(2).max(120),
      signupMethodLabel: z.string().trim().min(2).max(120),
      deskEmail: z.string().trim().email().max(120),
    })
    .optional(),
  facilitiesConfig: z
    .array(
      z.object({
        label: z.string().trim().min(2).max(80),
        route: safeLinkField,
        title: z.string().trim().min(2).max(200),
        body: z.string().trim().min(10).max(2500),
        img: safeMediaField,
        hours: z.string().trim().min(2).max(120),
        location: z.string().trim().min(2).max(200),
        portalRoute: safeLinkField,
        highlights: z.array(z.string().trim().min(2).max(240)).max(10),
      })
    )
    .max(15)
    .optional(),
  verifyPageConfig: z
    .object({
      kicker: z.string().trim().min(2).max(120),
      title: z.string().trim().min(2).max(180),
      subtitle: z.string().trim().min(10).max(800),
      sampleSerials: z
        .array(z.object({ label: z.string().trim().min(2).max(100), code: z.string().trim().min(2).max(80) }))
        .max(12),
      employerCardTitle: z.string().trim().min(2).max(160),
      employerCardBody: z.string().trim().min(5).max(600),
      portalCardTitle: z.string().trim().min(2).max(160),
      portalCardBody: z.string().trim().min(5).max(600),
    })
    .optional(),
  footerConfig: z
    .object({
      tagline: z.string().trim().min(2).max(140),
      description: z.string().trim().min(10).max(800),
      socialLinks: z.array(z.object({ label: z.string().trim().min(1).max(60), url: safeLinkField })).max(10),
      quickLinks: z.array(z.object({ label: z.string().trim().min(1).max(80), route: safeLinkField })).max(12),
      governanceLinks: z.array(z.object({ label: z.string().trim().min(1).max(80), route: safeLinkField })).max(12),
      serviceLinks: z.array(z.object({ label: z.string().trim().min(1).max(80), route: safeLinkField })).max(12),
      addressLines: z.array(z.string().trim().min(2).max(200)).max(6),
      contacts: z
        .array(
          z.object({
            label: z.string().trim().min(1).max(60),
            phone: z.string().trim().min(3).max(40),
            email: z.string().trim().email().max(120),
          })
        )
        .max(8),
      copyrightText: z.string().trim().min(4).max(240),
    })
    .optional(),
});

const contactDetailSchema = z.object({
  value: z.string().trim().min(2).max(160),
  type: z.enum(['Personal', 'Office', 'IP Phone']),
});

const departmentPersonSchema = z.object({
  id: z.string().trim().min(1).max(80),
  name: z.string().trim().min(2).max(140),
  designation: z.string().trim().min(2).max(140),
  onStudyLeave: z.boolean().optional(),
  photoUrl: z
    .string()
    .trim()
    .max(2000)
    .refine((v) => !v || isSafeMediaUrl(v), 'Photo URL must be a valid https://, http://, or local asset path.')
    .optional(),
  officeLocation: z.string().trim().max(240).optional(),
  bio: z.string().trim().max(2000).optional(),
  phones: z.array(contactDetailSchema).max(6),
  emails: z.array(contactDetailSchema).max(6),
  qualification: z.string().trim().max(400).optional(),
  researchArea: z.string().trim().max(400).optional(),
  totalPublications: z.number().int().min(0).max(5000).optional(),
});

const departmentCreateSchema = z.object({
  code: z.string().trim().min(2).max(16),
  officialCode: z.string().trim().max(16).optional(),
  name: z.string().trim().min(2).max(160),
  faculty: FACULTIES_ENUM,
  established: z.number().int().min(1950).max(2100),
  degrees: z.array(z.string().trim().min(2).max(60)).min(1).max(12),
  intakeSeats: z.number().int().min(5).max(1000),
  facultyCount: z.number().int().min(0).max(500).optional(),
  building: z.string().trim().min(2).max(140),
  chairmanName: z.string().trim().min(2).max(120),
  contactPhone: z.string().trim().max(60).optional(),
  contactEmail: z.string().trim().max(120).optional(),
  summary: z.string().trim().min(10).max(2000),
  researchFocus: z.array(z.string().trim().min(2).max(160)).min(1).max(20),
  laboratories: z.array(z.string().trim().min(2).max(160)).min(1).max(20),
  chairmanProfile: departmentPersonSchema.optional(),
  facultyMembers: z.array(departmentPersonSchema).max(100).optional(),
  contractualFacultyMembers: z.array(departmentPersonSchema).max(50).optional(),
  officers: z.array(departmentPersonSchema).max(50).optional(),
});

const departmentUpdateSchema = z.object({
  officialCode: z.string().trim().max(16).optional(),
  name: z.string().trim().min(2).max(160).optional(),
  faculty: FACULTIES_ENUM.optional(),
  established: z.number().int().min(1950).max(2100).optional(),
  degrees: z.array(z.string().trim().min(2).max(60)).min(1).max(12).optional(),
  intakeSeats: z.number().int().min(5).max(1000).optional(),
  facultyCount: z.number().int().min(0).max(500).optional(),
  building: z.string().trim().min(2).max(140).optional(),
  chairmanName: z.string().trim().min(2).max(120).optional(),
  contactPhone: z.string().trim().max(60).optional(),
  contactEmail: z.string().trim().max(120).optional(),
  summary: z.string().trim().min(10).max(2000).optional(),
  researchFocus: z.array(z.string().trim().min(2).max(160)).min(1).max(20).optional(),
  laboratories: z.array(z.string().trim().min(2).max(160)).min(1).max(20).optional(),
  chairmanProfile: departmentPersonSchema.optional(),
  facultyMembers: z.array(departmentPersonSchema).max(100).optional(),
  contractualFacultyMembers: z.array(departmentPersonSchema).max(50).optional(),
  officers: z.array(departmentPersonSchema).max(50).optional(),
});

const publicationSchema = z.object({
  title: z.string().trim().min(4).max(300),
  authors: z.string().trim().min(2).max(240),
  departmentCode: z.string().trim().min(2).max(24),
  domain: z.string().trim().min(2).max(120),
  year: z.number().int().min(1990).max(2100),
  venue: z.string().trim().min(2).max(240),
});

const bannerCreateSchema = z.object({
  imageUrl: z
    .string()
    .trim()
    .min(5)
    .max(2000)
    .refine(isSafeMediaUrl, 'Banner image URL must be a valid https://, http://, or local asset path.'),
  caption: z.string().trim().min(3).max(240),
  alt: z.string().trim().max(180).optional(),
});

const bannerUpdateSchema = z.object({
  imageUrl: z
    .string()
    .trim()
    .min(5)
    .max(2000)
    .refine(isSafeMediaUrl, 'Banner image URL must be a valid https://, http://, or local asset path.')
    .optional(),
  caption: z.string().trim().min(3).max(240).optional(),
  alt: z.string().trim().max(180).optional(),
});

const bannerReorderSchema = z.object({
  orderedIds: z.array(z.string().trim().min(1).max(80)).min(1).max(20),
});

const mediaUploadSchema = z.object({
  purpose: z.enum(['banner', 'notice', 'gallery', 'cms']),
  fileName: z.string().trim().min(1).max(160),
  mimeType: z.string().trim().min(3).max(100),
  dataBase64: z.string().min(8).max(14_000_000),
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

const paymentCheckoutSchema = z.object({
  targetType: z.enum(['hall_due', 'exam_application', 'certificate']),
  targetId: z.string().trim().max(80).optional(),
  certificateType: z.enum(['Temporary Certificate', 'Provisional Transcript']).optional(),
  gatewayCode: z.string().trim().min(2).max(30),
  accountMask: z.string().trim().max(40).optional(),
  manualRef: z.string().trim().max(60).optional(),
});

const resultPublishSchema = z.object({
  promotionMode: z.enum(['auto', 'manual_promoted', 'manual_repeat']).optional(),
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

async function computeCumulativeCgpa(academicId: string, fallbackSgpa: number): Promise<number> {
  const allResults = (await pustRepo.listExamResults()).filter(
    (r) => r.academicId === academicId && r.published
  );
  if (allResults.length === 0) return fallbackSgpa;
  let weighted = 0;
  let credits = 0;
  for (const res of allResults) {
    for (const c of res.courses) {
      weighted += c.gradePoint * c.credits;
      credits += c.credits;
    }
  }
  return credits > 0 ? Number((weighted / credits).toFixed(2)) : fallbackSgpa;
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
    const target = await pustRepo.findUserById(String(req.params.id));
    if (!target || target.role !== 'teacher') {
      res.status(404).json({ error: 'Teacher account not found.' });
      return;
    }
    if (
      req.authUser!.role === 'chairman' &&
      target.departmentCode !== req.authUser!.departmentCode
    ) {
      res.status(403).json({
        error: 'Department Chairmen may only assign courses to teachers in their own department.',
      });
      return;
    }
    const updated = await pustRepo.updateTeacherAssignments(
      target.id,
      parsed.data.assignedCourses,
      parsed.data.assignedSessions
    );
    if (!updated) {
      res.status(404).json({ error: 'Teacher account not found.' });
      return;
    }
    await pustRepo.logAudit(
      req.authUser!.name,
      req.authUser!.role,
      'Assigned courses/sessions to teacher',
      `${target.name} (${target.departmentCode})`
    );
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
    const allStudents = await pustRepo.listStudents();
    const target = allStudents.find((s) => s.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: 'Student not found.' });
      return;
    }
    if (
      req.authUser!.role === 'chairman' &&
      target.departmentCode !== req.authUser!.departmentCode
    ) {
      res.status(403).json({ error: 'Chairmen may only update student notes in their own department.' });
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
    if (Object.keys(patch).length === 0) {
      res.status(400).json({ error: 'Provide at least one permitted field to update.' });
      return;
    }

    const updated = await pustRepo.updateStudentById(target.id, patch);
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
    const autoResult = await autoIssueLibraryCardAfterChairmanSeal(target.id);
    const refreshedApp =
      (await pustRepo.listLibraryApplications()).find((a) => a.id === target.id) || updated;
    res.json({
      application: refreshedApp,
      card: autoResult.card,
      autoIssued: autoResult.autoIssued,
    });
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

    if (target.status === 'approved') {
      res.status(409).json({ error: 'This library membership application has already been approved.' });
      return;
    }

    if (!target.chairmanSeal) {
      res.status(409).json({
        error: 'Chairman seal and signature JSON record is required before Library approval.',
      });
      return;
    }

    const existingCard = (await pustRepo.listLibraryCards()).find(
      (c) => c.academicId === target.academicId && c.status === 'Active'
    );
    if (existingCard) {
      res.status(409).json({
        error: `An active Digital Library Card (${existingCard.digitalCardNo}) already exists for this student.`,
      });
      return;
    }

    const updated = await pustRepo.updateLibraryApplication(target.id, {
      status: 'approved',
      libraryNote: parsed.data.note || 'Verified and Digital Library Card issued.',
    });

    const cardNo = `PUST-LIB-${target.departmentCode}-${target.academicId}`;
    const cardHash = `SHA256-LIB-${crypto
      .createHash('sha256')
      .update(`${cardNo}:${target.chairmanSeal.verificationHash}`)
      .digest('hex')
      .slice(0, 10)
      .toUpperCase()}`;

    const card = await pustRepo.createLibraryCard({
      studentId: target.studentId,
      academicId: target.academicId,
      studentName: target.studentName,
      departmentCode: target.departmentCode,
      session: target.session,
      digitalCardNo: cardNo,
      physicalCardRef: parsed.data.physicalCardRef || undefined,
      verificationHash: cardHash,
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
  const gateways = (await pustRepo.listPaymentGateways()).filter((g) => g.enabled);

  if (req.authUser!.role === 'student') {
    apps = apps.filter((a) => a.academicId === req.authUser!.academicId);
    dues = dues.filter((d) => d.academicId === req.authUser!.academicId);
  } else if (req.authUser!.role === 'hall') {
    apps = apps.filter((a) => isHallOfficerScopedTo(req.authUser!, a.hallName));
    dues = dues.filter((d) => isHallOfficerScopedTo(req.authUser!, d.hallName));
  }
  res.json({ circulars, applications: apps, dues, gateways });
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
    if (!isHallOfficerScopedTo(req.authUser!, parsed.data.hallName)) {
      res.status(403).json({
        error: `Hall officer access is scoped to ${req.authUser!.hallAffiliation}.`,
      });
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
    if (circular.vacantSeats <= 0) {
      res.status(409).json({ error: 'No vacant seats remain for this circular.' });
      return;
    }
    const existingApp = (await pustRepo.listHallApplications()).find(
      (a) =>
        a.academicId === req.authUser!.academicId &&
        a.circularId === circular.id &&
        a.status !== 'rejected'
    );
    if (existingApp) {
      res.status(409).json({
        error: 'You already have an active or approved application for this hall circular.',
      });
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
    if (!isHallOfficerScopedTo(req.authUser!, target.hallName)) {
      res.status(403).json({
        error: `Hall officer access is scoped to ${req.authUser!.hallAffiliation}.`,
      });
      return;
    }

    if (parsed.data.status === 'accepted' && target.status !== 'accepted') {
      const circular = (await pustRepo.listHallCirculars()).find((c) => c.id === target.circularId);
      if (circular) {
        if (circular.vacantSeats <= 0) {
          res.status(409).json({ error: 'No vacant seats remain in this circular.' });
          return;
        }
        await pustRepo.updateHallCircular(circular.id, {
          vacantSeats: circular.vacantSeats - 1,
        });
      }
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
    if (!isHallOfficerScopedTo(req.authUser!, target.hallName)) {
      res.status(403).json({
        error: `Hall officer access is scoped to ${req.authUser!.hallAffiliation}.`,
      });
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
    if (!isHallOfficerScopedTo(req.authUser!, parsed.data.hallName)) {
      res.status(403).json({
        error: `Hall officer access is scoped to ${req.authUser!.hallAffiliation}.`,
      });
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
    if (target.status === 'Cleared' || target.status === 'Payment Submitted') {
      res.status(409).json({ error: 'Payment has already been submitted or cleared for this hall due.' });
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
    if (!isHallOfficerScopedTo(req.authUser!, target.hallName)) {
      res.status(403).json({
        error: `Hall officer access is scoped to ${req.authUser!.hallAffiliation}.`,
      });
      return;
    }
    if (target.status === 'Cleared') {
      res.status(409).json({ error: 'This hall due has already been cleared.' });
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

portalRouter.get(
  '/exams/student-context/:academicId',
  requireRoles('teacher', 'chairman', 'admin'),
  async (req: AuthenticatedRequest, res) => {
    const academicId = String(req.params.academicId || '').trim();
    if (!academicId) {
      res.status(400).json({ error: 'Student academic ID is required.' });
      return;
    }

    const student = await pustRepo.findStudentByAcademicId(academicId);
    if (!student) {
      res.status(404).json({ error: `No student found with Academic ID "${academicId}".` });
      return;
    }

    if (
      (req.authUser!.role === 'teacher' || req.authUser!.role === 'chairman') &&
      student.departmentCode !== req.authUser!.departmentCode
    ) {
      res.status(403).json({
        error: `Access restricted: Student ${student.academicId} belongs to ${student.departmentCode}, outside your department (${req.authUser!.departmentCode}).`,
      });
      return;
    }

    const previousResults = (await pustRepo.listExamResults())
      .filter((r) => r.academicId === student.academicId && r.published)
      .sort((a, b) => a.semester - b.semester);

    res.json({ student, previousResults });
  }
);

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
    if (circular.departmentCode !== req.authUser!.departmentCode) {
      res.status(403).json({
        error: 'You may only apply for examination circulars issued by your own department.',
      });
      return;
    }

    const existingExamApp = (await pustRepo.listExamApplications()).find(
      (a) =>
        a.academicId === req.authUser!.academicId &&
        a.circularId === circular.id &&
        a.verificationStatus !== 'Rejected'
    );
    if (existingExamApp) {
      res.status(409).json({
        error: 'You have already submitted an examination application for this circular.',
      });
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
    if (target.paymentStatus === 'Paid') {
      res.status(409).json({ error: 'Examination fee is already marked Paid.' });
      return;
    }
    const updated = await pustRepo.updateExamApplication(target.id, {
      paymentMethod: parsed.data.paymentMethod,
      transactionId: parsed.data.transactionId,
      paymentStatus: 'Paid',
    });
    const admitRes = await autoIssueAdmitCardIfEligible(updated || target);
    res.json({
      application: admitRes.application,
      autoIssued: admitRes.autoIssued,
      holdReason: admitRes.holdReason,
    });
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
  requireRoles('teacher', 'chairman', 'admin'),
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

    if (
      (req.authUser!.role === 'teacher' || req.authUser!.role === 'chairman') &&
      stu.departmentCode !== req.authUser!.departmentCode
    ) {
      res.status(403).json({
        error: 'You may only submit marksheets for students in your own department.',
      });
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

    const publishImmediately = req.authUser!.role === 'chairman' || req.authUser!.role === 'admin';

    const result = await pustRepo.createExamResult({
      academicId: stu.academicId,
      studentName: stu.name,
      departmentCode: stu.departmentCode,
      session: stu.session,
      semester: parsed.data.semester,
      courses: evaluatedCourses,
      sgpa,
      promotionStatus,
      status: publishImmediately ? 'published' : 'pending_chairman',
      published: publishImmediately,
      enteredBy: req.authUser!.name,
      ...(publishImmediately ? { reviewedBy: req.authUser!.name } : {}),
      publishedAt: new Date().toISOString().slice(0, 10),
    });

    let cumulativeCgpa: number | undefined;
    if (publishImmediately) {
      cumulativeCgpa = await computeCumulativeCgpa(stu.academicId, sgpa);
      const promoted = promotionStatus.startsWith('Promoted');
      const nextCompleted = promoted
        ? Math.max(stu.completedSemesters, parsed.data.semester)
        : stu.completedSemesters;
      const rules = await pustRepo.getAutomationConfig();
      await pustRepo.updateStudentById(stu.id, {
        ...(promoted
          ? {
              currentSemester: Math.max(stu.currentSemester, parsed.data.semester + 1),
              completedSemesters: nextCompleted,
              ...(nextCompleted >= 8 && rules.autoPromoteGraduatingResults
                ? { allResultsPublished: true }
                : {}),
            }
          : {}),
        cgpa: cumulativeCgpa,
      });

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
    } else {
      await pustRepo.logAudit(
        req.authUser!.name,
        req.authUser!.role,
        'Submitted draft marksheet for Chairman review',
        `${stu.academicId} · Sem ${parsed.data.semester}`
      );
    }

    res.status(201).json({
      result,
      pendingChairmanReview: !publishImmediately,
      ...(cumulativeCgpa !== undefined ? { cumulativeCgpa } : {}),
    });
  }
);

portalRouter.patch(
  '/exams/results/:id/publish',
  requireRoles('chairman', 'admin'),
  async (req: AuthenticatedRequest, res) => {
    const parsed = resultPublishSchema.safeParse(req.body || {});
    const results = await pustRepo.listExamResults();
    const target = results.find((r) => r.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: 'Submitted grade sheet not found.' });
      return;
    }
    if (
      req.authUser!.role === 'chairman' &&
      target.departmentCode !== req.authUser!.departmentCode
    ) {
      res.status(403).json({ error: 'Cannot publish results outside your department.' });
      return;
    }

    let promotionStatus = target.promotionStatus;
    if (parsed.success && parsed.data.promotionMode === 'manual_promoted') {
      promotionStatus = 'Promoted (Manual)';
    } else if (parsed.success && parsed.data.promotionMode === 'manual_repeat') {
      promotionStatus = 'Probation / Repeat';
    }

    const updated = await pustRepo.updateExamResult(target.id, {
      published: true,
      status: 'published',
      promotionStatus,
      reviewedBy: req.authUser!.name,
      publishedAt: new Date().toISOString().slice(0, 10),
    });

    const stu = await pustRepo.findStudentByAcademicId(target.academicId);
    if (stu) {
      const cumulativeCgpa = await computeCumulativeCgpa(stu.academicId, target.sgpa);
      const promoted = promotionStatus.startsWith('Promoted');
      const nextCompleted = promoted
        ? Math.max(stu.completedSemesters, target.semester)
        : stu.completedSemesters;
      const rules = await pustRepo.getAutomationConfig();
      await pustRepo.updateStudentById(stu.id, {
        ...(promoted
          ? {
              currentSemester: Math.max(stu.currentSemester, target.semester + 1),
              completedSemesters: nextCompleted,
              ...(nextCompleted >= 8 && rules.autoPromoteGraduatingResults
                ? { allResultsPublished: true }
                : {}),
            }
          : {}),
        cgpa: cumulativeCgpa,
      });
    }

    await pustRepo.createNotice({
      referenceNo: `PUST/${target.departmentCode}/RES/${new Date().getFullYear()}-${target.semester}`,
      title: `Semester ${target.semester} Examination Result Published — ${target.departmentCode} (${target.session})`,
      category: 'Result',
      publishedAt: new Date().toISOString().slice(0, 10),
      departmentCode: target.departmentCode,
      boardScope: 'department',
      visibility: 'registered',
      targetSession: target.session,
      summary: `Semester ${target.semester} result published for ${target.academicId} (SGPA ${target.sgpa.toFixed(
        2
      )} · ${promotionStatus}).`,
      body: `Registered departmental students in session ${target.session} may inspect their verified Semester ${target.semester} grade sheet and promotion status under Portal -> Exams & Results.`,
      authorName: req.authUser!.name,
      authorRole: req.authUser!.role,
    });

    await pustRepo.logAudit(
      req.authUser!.name,
      req.authUser!.role,
      'Verified and published exam result',
      `${target.academicId} · Sem ${target.semester}`
    );

    res.json({ result: updated });
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

    const evalRes = await autoEvaluateCertificateApplication(app.id);
    res.status(201).json({
      application: evalRes.application || app,
      clearedOffices: evalRes.clearedOffices,
      autoIssued: evalRes.autoIssued,
    });
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
    let finalApp = updated;
    let autoIssued = false;
    if (allFourApproved && updated) {
      const fin = await autoFinalizeCertificateIfReady(updated, req.authUser!.name);
      finalApp = fin.application;
      autoIssued = fin.issued;
    }
    res.json({ application: finalApp, autoIssued });
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
    const certHash = serial
      ? target.verificationHash ||
        `SHA256-CERT-${crypto.createHash('sha256').update(`${serial}:${target.academicId}`).digest('hex').slice(0, 10).toUpperCase()}`
      : undefined;

    const updated = await pustRepo.updateCertificateApplication(target.id, {
      finalAdminStatus: parsed.data.decision,
      adminNote: parsed.data.adminNote,
      certificateSerial: serial,
      verificationHash: certHash,
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

portalRouter.post(
  '/cms/vice-chancellor',
  requireRoles('admin'),
  async (req: AuthenticatedRequest, res) => {
    const parsed = formerVcCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Complete all Former VC fields.' });
      return;
    }
    const profiles = await pustRepo.createFormerViceChancellor({
      name: parsed.data.name,
      tenure: parsed.data.tenure,
      email: parsed.data.email || '—',
      phone: parsed.data.phone,
      message: parsed.data.message,
      photoUrl: parsed.data.photoUrl,
    });
    await pustRepo.logAudit(req.authUser!.name, 'admin', 'Added Former Vice-Chancellor to Archive', parsed.data.name);
    res.status(201).json({ profiles });
  }
);

portalRouter.patch(
  '/cms/vice-chancellor/:id',
  requireRoles('admin'),
  async (req: AuthenticatedRequest, res) => {
    const parsed = vcByIdUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid Vice-Chancellor update.' });
      return;
    }
    const profiles = await pustRepo.updateViceChancellorById(String(req.params.id), parsed.data);
    if (!profiles) {
      res.status(404).json({ error: 'Vice-Chancellor record not found.' });
      return;
    }
    await pustRepo.logAudit(req.authUser!.name, 'admin', 'Updated Vice-Chancellor Archive Entry', String(req.params.id));
    res.json({ profiles });
  }
);

portalRouter.delete(
  '/cms/vice-chancellor/:id',
  requireRoles('admin'),
  async (req: AuthenticatedRequest, res) => {
    const result = await pustRepo.deleteViceChancellorById(String(req.params.id));
    if (result === null) {
      res.status(404).json({ error: 'Vice-Chancellor record not found.' });
      return;
    }
    if (result === 'IS_CURRENT') {
      res.status(409).json({ error: 'Cannot delete the active Vice-Chancellor record.' });
      return;
    }
    await pustRepo.logAudit(req.authUser!.name, 'admin', 'Removed Former Vice-Chancellor Entry', String(req.params.id));
    res.json({ profiles: result });
  }
);

const ALLOWED_IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_NOTICE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);
const NOTICE_PUBLISHER_ROLES = new Set<UserRole>([
  'admin',
  'registrar',
  'vc',
  'chairman',
  'teacher',
  'proctor',
  'library',
  'hall',
]);

portalRouter.post('/media/upload', requireAuth, async (req: AuthenticatedRequest, res) => {
  const parsed = mediaUploadSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Provide a valid file payload, MIME type, and upload purpose.' });
    return;
  }

  const { purpose, fileName, mimeType, dataBase64 } = parsed.data;
  const actor = req.authUser!;

  if ((purpose === 'banner' || purpose === 'gallery' || purpose === 'cms') && actor.role !== 'admin') {
    res.status(403).json({ error: 'Only Admin Office may upload homepage banner, gallery, or CMS media.' });
    return;
  }
  if (purpose === 'notice' && !NOTICE_PUBLISHER_ROLES.has(actor.role)) {
    res.status(403).json({ error: 'Your role is not authorized to upload notice attachments.' });
    return;
  }

  const normalizedMime = mimeType.toLowerCase();
  const allowedMimes = purpose === 'notice' ? ALLOWED_NOTICE_MIMES : ALLOWED_IMAGE_MIMES;
  if (!allowedMimes.has(normalizedMime)) {
    res.status(400).json({
      error:
        purpose === 'notice'
          ? 'Unsupported attachment format. Upload a JPG, PNG, WebP, GIF image or PDF file.'
          : 'Unsupported image format. Upload a JPG, PNG, WebP, or GIF image.',
    });
    return;
  }

  const rawBase64 = dataBase64.includes(',') ? dataBase64.split(',').pop() || '' : dataBase64;
  const fileBuffer = Buffer.from(rawBase64, 'base64');
  if (fileBuffer.byteLength === 0 || fileBuffer.byteLength > 8 * 1024 * 1024) {
    res.status(400).json({ error: 'Uploaded file must be between 1 byte and 8 MB.' });
    return;
  }

  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY?.trim();
  if (!privateKey) {
    res.status(503).json({
      error:
        'ImageKit.io is not configured yet. Add IMAGEKIT_PRIVATE_KEY in environment secrets, or paste an existing ImageKit URL.',
    });
    return;
  }

  const safeFileName =
    fileName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 120) || `pust-${purpose}-${Date.now()}`;

  try {
    const form = new FormData();
    form.append('file', new Blob([fileBuffer], { type: normalizedMime }), safeFileName);
    form.append('fileName', safeFileName);
    form.append('folder', `/pust/${purpose}`);
    form.append('useUniqueFileName', 'true');

    const ikRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${privateKey}:`).toString('base64')}`,
      },
      body: form,
    });

    const ikData = (await ikRes.json().catch(() => ({}))) as {
      url?: string;
      fileId?: string;
      name?: string;
      message?: string;
    };

    if (!ikRes.ok || !ikData.url) {
      res.status(502).json({
        error: ikData.message || `ImageKit.io upload failed (HTTP ${ikRes.status}).`,
      });
      return;
    }

    await pustRepo.logAudit(
      actor.name,
      actor.role,
      `Uploaded ${purpose} asset to ImageKit.io`,
      ikData.name || safeFileName
    );

    res.status(201).json({
      url: ikData.url,
      fileId: ikData.fileId || '',
      name: ikData.name || safeFileName,
      mimeType: normalizedMime,
      attachmentType: normalizedMime === 'application/pdf' ? 'pdf' : 'image',
    });
  } catch (err) {
    res.status(502).json({
      error: err instanceof Error ? err.message : 'Unable to reach ImageKit.io upload API.',
    });
  }
});

portalRouter.post('/cms/banners', requireRoles('admin'), async (req: AuthenticatedRequest, res) => {
  const parsed = bannerCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Provide a valid banner image URL and caption.' });
    return;
  }
  const slide = await pustRepo.createBannerSlide(parsed.data);
  const bannerSlides = await pustRepo.listBannerSlides();
  await pustRepo.logAudit(req.authUser!.name, 'admin', 'Added homepage banner slide', slide.caption.slice(0, 60));
  res.status(201).json({ slide, bannerSlides });
});

portalRouter.patch('/cms/banners/reorder', requireRoles('admin'), async (req: AuthenticatedRequest, res) => {
  const parsed = bannerReorderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Provide a valid ordered list of banner slide IDs.' });
    return;
  }
  const bannerSlides = await pustRepo.reorderBannerSlides(parsed.data.orderedIds);
  await pustRepo.logAudit(req.authUser!.name, 'admin', 'Reordered homepage banner slides', `${bannerSlides.length} slides`);
  res.json({ bannerSlides });
});

portalRouter.patch('/cms/banners/:id', requireRoles('admin'), async (req: AuthenticatedRequest, res) => {
  const parsed = bannerUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid banner slide update payload.' });
    return;
  }
  const slide = await pustRepo.updateBannerSlide(String(req.params.id), parsed.data);
  if (!slide) {
    res.status(404).json({ error: 'Banner slide not found.' });
    return;
  }
  const bannerSlides = await pustRepo.listBannerSlides();
  await pustRepo.logAudit(req.authUser!.name, 'admin', 'Updated homepage banner slide', slide.caption.slice(0, 60));
  res.json({ slide, bannerSlides });
});

portalRouter.delete('/cms/banners/:id', requireRoles('admin'), async (req: AuthenticatedRequest, res) => {
  const deleted = await pustRepo.deleteBannerSlide(String(req.params.id));
  if (!deleted) {
    res.status(404).json({ error: 'Banner slide not found.' });
    return;
  }
  const bannerSlides = await pustRepo.listBannerSlides();
  await pustRepo.logAudit(req.authUser!.name, 'admin', 'Removed homepage banner slide', String(req.params.id));
  res.json({ deleted: true, bannerSlides });
});

portalRouter.post('/cms/gallery', requireRoles('admin'), async (req: AuthenticatedRequest, res) => {
  const parsed = galleryCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: parsed.error.issues[0]?.message || 'Complete all News & Events media fields.',
    });
    return;
  }
  const item = await pustRepo.createGalleryItem(parsed.data);
  await pustRepo.logAudit(
    req.authUser!.name,
    'admin',
    `Added ${parsed.data.visibility} News & Events ${parsed.data.mediaType}`,
    parsed.data.title
  );
  res.status(201).json({ item });
});

portalRouter.patch('/cms/gallery/:id', requireRoles('admin'), async (req: AuthenticatedRequest, res) => {
  const parsed = galleryUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid News & Events update payload.' });
    return;
  }
  const item = await pustRepo.updateGalleryItem(String(req.params.id), parsed.data);
  if (!item) {
    res.status(404).json({ error: 'Gallery item not found.' });
    return;
  }
  await pustRepo.logAudit(
    req.authUser!.name,
    'admin',
    `Updated News & Events item (${item.visibility || 'public'})`,
    item.title
  );
  res.json({ item });
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

portalRouter.put('/cms/profile', requireRoles('admin'), async (req: AuthenticatedRequest, res) => {
  const parsed = profileUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: parsed.error.issues[0]?.message || 'Invalid university profile payload.',
    });
    return;
  }
  const profile = await pustRepo.updateUniversityProfile(parsed.data);
  await pustRepo.logAudit(
    req.authUser!.name,
    'admin',
    'Updated University Profile CMS',
    'Hero, Stats, Leadership, Units or Journals'
  );
  res.json({ profile });
});

portalRouter.post(
  '/cms/departments',
  requireRoles('admin'),
  async (req: AuthenticatedRequest, res) => {
    const parsed = departmentCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Complete all required department fields.',
      });
      return;
    }
    try {
      const department = await pustRepo.createDepartment(parsed.data);
      await pustRepo.logAudit(
        req.authUser!.name,
        'admin',
        'Created Department Directory Entry',
        `${department.code} — ${department.name}`
      );
      res.status(201).json({ department });
    } catch (err) {
      if (err instanceof Error && err.message === 'DUPLICATE_DEPT_CODE') {
        res.status(409).json({ error: 'A department with this short code already exists.' });
        return;
      }
      throw err;
    }
  }
);

portalRouter.patch(
  '/cms/departments/:id',
  requireRoles('admin'),
  async (req: AuthenticatedRequest, res) => {
    const parsed = departmentUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Invalid department update payload.',
      });
      return;
    }
    const department = await pustRepo.updateDepartment(String(req.params.id), parsed.data);
    if (!department) {
      res.status(404).json({ error: 'Department not found.' });
      return;
    }
    await pustRepo.logAudit(
      req.authUser!.name,
      'admin',
      'Updated Department Directory',
      `${department.code} — ${department.name}`
    );
    res.json({ department });
  }
);

portalRouter.delete(
  '/cms/departments/:id',
  requireRoles('admin'),
  async (req: AuthenticatedRequest, res) => {
    const ok = await pustRepo.deleteDepartment(String(req.params.id));
    if (!ok) {
      res.status(404).json({ error: 'Department not found.' });
      return;
    }
    await pustRepo.logAudit(
      req.authUser!.name,
      'admin',
      'Deleted Department Directory Entry',
      String(req.params.id)
    );
    res.json({ deleted: true });
  }
);

portalRouter.post(
  '/cms/publications',
  requireRoles('admin'),
  async (req: AuthenticatedRequest, res) => {
    const parsed = publicationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Complete all publication fields.',
      });
      return;
    }
    const publication = await pustRepo.createPublication(parsed.data);
    await pustRepo.logAudit(
      req.authUser!.name,
      'admin',
      'Added Faculty Publication',
      publication.title.slice(0, 60)
    );
    res.status(201).json({ publication });
  }
);

portalRouter.patch(
  '/cms/publications/:id',
  requireRoles('admin'),
  async (req: AuthenticatedRequest, res) => {
    const parsed = publicationSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Invalid publication update payload.',
      });
      return;
    }
    const publication = await pustRepo.updatePublication(String(req.params.id), parsed.data);
    if (!publication) {
      res.status(404).json({ error: 'Publication not found.' });
      return;
    }
    await pustRepo.logAudit(
      req.authUser!.name,
      'admin',
      'Updated Faculty Publication',
      publication.title.slice(0, 60)
    );
    res.json({ publication });
  }
);

portalRouter.delete(
  '/cms/publications/:id',
  requireRoles('admin'),
  async (req: AuthenticatedRequest, res) => {
    const ok = await pustRepo.deletePublication(String(req.params.id));
    if (!ok) {
      res.status(404).json({ error: 'Publication not found.' });
      return;
    }
    await pustRepo.logAudit(
      req.authUser!.name,
      'admin',
      'Deleted Faculty Publication',
      String(req.params.id)
    );
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

// 9. Unified Digital Payment Checkout & Institutional Receipts Ledger
portalRouter.get('/payments/receipts', requireAuth, async (req: AuthenticatedRequest, res) => {
  let receipts = await pustRepo.listPaymentReceipts();
  if (req.authUser!.role === 'student') {
    receipts = receipts.filter((r) => r.academicId === req.authUser!.academicId);
  } else if (req.authUser!.role === 'chairman') {
    receipts = receipts.filter((r) => r.departmentCode === req.authUser!.departmentCode);
  }
  res.json({ receipts });
});

portalRouter.post(
  '/payments/checkout',
  requireRoles('student'),
  async (req: AuthenticatedRequest, res) => {
    const parsed = paymentCheckoutSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Provide valid checkout details and gateway selection.' });
      return;
    }

    const gateways = await pustRepo.listPaymentGateways();
    const gw = gateways.find((g) => g.code === parsed.data.gatewayCode && g.enabled);
    if (!gw) {
      res.status(400).json({ error: 'Selected payment gateway is disabled or unavailable.' });
      return;
    }

    const nowDate = new Date().toISOString().slice(0, 10);
    const txRand = crypto.randomBytes(3).toString('hex').toUpperCase();
    const transactionId = parsed.data.manualRef?.trim() || `${gw.code}-${new Date().getFullYear()}-${txRand}`;
    const receiptNo = `PUST-RCPT-${new Date().getFullYear()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}${txRand.slice(0, 2)}`;

    if (parsed.data.targetType === 'hall_due') {
      const dues = await pustRepo.listHallDues();
      const due = dues.find((d) => d.id === parsed.data.targetId);
      if (!due || due.academicId !== req.authUser!.academicId) {
        res.status(404).json({ error: 'Hall fee record not found.' });
        return;
      }
      if (due.status === 'Cleared') {
        res.status(409).json({ error: 'This hall fee has already been cleared.' });
        return;
      }

      const receipt = await pustRepo.createPaymentReceipt({
        receiptNo,
        transactionId,
        academicId: req.authUser!.academicId,
        studentName: req.authUser!.name,
        departmentCode: req.authUser!.departmentCode,
        targetType: 'hall_due',
        targetId: due.id,
        title: due.feeTitle,
        amountBdt: due.amountBdt,
        gatewayCode: gw.code,
        gatewayName: gw.name,
        accountMask: parsed.data.accountMask || 'Digital Checkout',
        status: 'Verified',
        paidAt: nowDate,
      });

      const clearedRes = await autoClearHallDueIfEnabled(due, gw.code, transactionId, receiptNo);

      await pustRepo.logAudit(
        req.authUser!.name,
        'student',
        'Completed Hall Fee Digital Payment',
        receiptNo
      );
      res.status(201).json({
        receipt,
        updatedTarget: clearedRes.due,
        autoCleared: clearedRes.autoCleared,
      });
      return;
    }

    if (parsed.data.targetType === 'exam_application') {
      const apps = await pustRepo.listExamApplications();
      const app = apps.find((a) => a.id === parsed.data.targetId);
      if (!app || app.academicId !== req.authUser!.academicId) {
        res.status(404).json({ error: 'Examination application not found.' });
        return;
      }
      if (app.paymentStatus === 'Paid') {
        res.status(409).json({ error: 'Examination fee is already marked Paid.' });
        return;
      }

      const receipt = await pustRepo.createPaymentReceipt({
        receiptNo,
        transactionId,
        academicId: req.authUser!.academicId,
        studentName: req.authUser!.name,
        departmentCode: req.authUser!.departmentCode,
        targetType: 'exam_application',
        targetId: app.id,
        title: `${app.examTitle} (${app.formReference})`,
        amountBdt: app.feeBdt,
        gatewayCode: gw.code,
        gatewayName: gw.name,
        accountMask: parsed.data.accountMask || 'Digital Checkout',
        status: 'Verified',
        paidAt: nowDate,
      });

      const updatedTarget = await pustRepo.updateExamApplication(app.id, {
        paymentMethod: gw.code,
        transactionId,
        receiptNo,
        paymentStatus: 'Paid',
      });

      const admitRes = await autoIssueAdmitCardIfEligible(updatedTarget || app);

      await pustRepo.logAudit(
        req.authUser!.name,
        'student',
        'Completed Examination Fee Digital Payment',
        receiptNo
      );
      res.status(201).json({
        receipt,
        updatedTarget: admitRes.application,
        autoIssued: admitRes.autoIssued,
        holdReason: admitRes.holdReason,
      });
      return;
    }

    // Certificate application + digital fee checkout
    const stu = await pustRepo.findStudentByAcademicId(req.authUser!.academicId);
    if (!stu || stu.completedSemesters < 8 || !stu.allResultsPublished) {
      res.status(409).json({
        error:
          'Eligibility requirement not met: All 8 semesters must be completed with published final results before applying for a certificate.',
      });
      return;
    }

    const certType = parsed.data.certificateType || 'Temporary Certificate';
    const feeConfig = await pustRepo.getFeeConfig();
    const makeOffice = (office: ClearanceOfficeKey, officeLabel: string): OfficeClearanceState => ({
      office,
      officeLabel,
      status: 'pending',
      note: 'Awaiting independent office clearance review.',
      history: [],
    });

    const createdCert = await pustRepo.createCertificateApplication({
      studentId: req.authUser!.sub,
      academicId: stu.academicId,
      studentName: stu.name,
      departmentCode: stu.departmentCode,
      session: stu.session,
      certificateType: certType,
      feeBdt: feeConfig.certificateFeeBdt,
      paymentMethod: gw.code,
      transactionId,
      receiptNo,
      clearances: {
        chairman: makeOffice('chairman', "Department Chairman's Office"),
        hall: makeOffice('hall', 'Hall Office'),
        library: makeOffice('library', 'Library Office'),
        proctor: makeOffice('proctor', "Proctor's Office"),
      },
      finalAdminStatus: 'waiting_offices',
    });

    const receipt = await pustRepo.createPaymentReceipt({
      receiptNo,
      transactionId,
      academicId: stu.academicId,
      studentName: stu.name,
      departmentCode: stu.departmentCode,
      targetType: 'certificate',
      targetId: createdCert.id,
      title: `${certType} Clearance & Issuance Fee`,
      amountBdt: feeConfig.certificateFeeBdt,
      gatewayCode: gw.code,
      gatewayName: gw.name,
      accountMask: parsed.data.accountMask || 'Digital Checkout',
      status: 'Verified',
      paidAt: nowDate,
    });

    const evalRes = await autoEvaluateCertificateApplication(createdCert.id);

    await pustRepo.logAudit(
      req.authUser!.name,
      'student',
      'Submitted Certificate Application & Digital Payment',
      receiptNo
    );
    res.status(201).json({
      receipt,
      updatedTarget: evalRes.application || createdCert,
      clearedOffices: evalRes.clearedOffices,
      autoIssued: evalRes.autoIssued,
    });
  }
);

// 10. Automated Office Flow Engine (Overview, Policy Rules, Single Advance & Batch Sweep)
const automationConfigSchema = z.object({
  autoClearPaidHallDues: z.boolean().optional(),
  autoIssueSealedLibraryCards: z.boolean().optional(),
  autoIssueAdmitCardsOnPay: z.boolean().optional(),
  autoVerifyCleanCertOffices: z.boolean().optional(),
  autoIssueReadyCertificates: z.boolean().optional(),
  autoPromoteGraduatingResults: z.boolean().optional(),
});

const automationAdvanceSchema = z.object({
  flowType: z.enum([
    'user_approval',
    'library_seal',
    'library_verify',
    'hall_seat',
    'hall_due',
    'exam_admit',
    'exam_result',
    'cert_office',
    'cert_final',
    'inquiry',
  ]),
  targetId: z.string().trim().min(1).max(120),
});

portalRouter.get('/automation/overview', requireAuth, async (req: AuthenticatedRequest, res) => {
  const overview = await buildOfficeFlowOverview(req.authUser!);
  res.json(overview);
});

portalRouter.put(
  '/automation/config',
  requireRoles('admin'),
  async (req: AuthenticatedRequest, res) => {
    const parsed = automationConfigSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid automation rules configuration.' });
      return;
    }
    const rules = await pustRepo.updateAutomationConfig(parsed.data);
    await pustRepo.logAudit(
      req.authUser!.name,
      'admin',
      'Updated Automated Office Flow Rules',
      Object.entries(parsed.data)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ')
    );
    res.json({ rules });
  }
);

portalRouter.post(
  '/automation/advance',
  requireRoles('admin', 'registrar', 'chairman', 'hall', 'library', 'proctor'),
  async (req: AuthenticatedRequest, res) => {
    const parsed = automationAdvanceSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid office flow item payload.' });
      return;
    }
    try {
      const result = await processSingleFlowItem(
        req.authUser!,
        parsed.data.flowType,
        parsed.data.targetId
      );
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to advance office flow item.';
      if (message.startsWith('FORBIDDEN:')) {
        res.status(403).json({ error: message.replace(/^FORBIDDEN:\s*/, '') });
        return;
      }
      res.status(400).json({ error: message });
    }
  }
);

portalRouter.post(
  '/automation/sweep',
  requireRoles('admin', 'registrar', 'chairman', 'hall', 'library', 'proctor'),
  async (req: AuthenticatedRequest, res) => {
    const report = await runAutomatedOfficeSweep(req.authUser!);
    res.json({ report });
  }
);
