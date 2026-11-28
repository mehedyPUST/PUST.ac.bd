import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { getApiApp } from './apiApp';
import { AUTH_COOKIE_NAME, signAuthToken } from './auth';
import { pustRepo } from './db';
import type {
  AuthUser,
  CourseRecord,
  ExamCommitteeRecord,
  ExamResultRecord,
  RawCourseGradeRecord,
} from '../src/types/pust';

async function withServer(run: (baseUrl: string) => Promise<void>): Promise<void> {
  const app = await getApiApp();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

function authHeaders(user: AuthUser | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };
  if (user) {
    const token = signAuthToken(user);
    headers.Cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}`;
  }
  return headers;
}

async function ensureTestUser(seed: {
  name: string;
  email: string;
  role: AuthUser['role'];
  departmentCode: string;
  academicId: string;
  hallAffiliation: string;
  designation?: string;
}): Promise<AuthUser> {
  const existing = await pustRepo.findUserByEmail(seed.email);
  if (existing) return existing;
  return pustRepo.createUser({
    name: seed.name,
    email: seed.email,
    passwordHash: 'test-hash-not-used-directly',
    role: seed.role,
    approvalStatus: 'approved',
    departmentCode: seed.departmentCode,
    academicId: seed.academicId,
    hallAffiliation: seed.hallAffiliation,
    designation: seed.designation,
  });
}

test('Department Chairman course management, teacher assignment, Exam Committee creation, exam arrangement & result forwarding workflow', async () => {
  await pustRepo.init();

  const [cseChair, eeeChair, committeeTeacher, otherTeacher, adminUser, cseStudentUser] =
    await Promise.all([
      ensureTestUser({
        name: 'Dr. Mahmudul Hasan (CSE Chair)',
        email: 'chair.cse.examwf@pust.ac.bd',
        role: 'chairman',
        departmentCode: 'CSE',
        academicId: 'FAC-CSE-EW-01',
        hallAffiliation: 'Academic Block',
        designation: 'Professor & Chairman',
      }),
      ensureTestUser({
        name: 'Prof. Tanvir Ahmed (EEE Chair)',
        email: 'chair.eee.examwf@pust.ac.bd',
        role: 'chairman',
        departmentCode: 'EEE',
        academicId: 'FAC-EEE-EW-01',
        hallAffiliation: 'Academic Block',
        designation: 'Professor & Chairman',
      }),
      ensureTestUser({
        name: 'Dr. Farhana Yasmin',
        email: 'farhana.cse.examwf@pust.ac.bd',
        role: 'teacher',
        departmentCode: 'CSE',
        academicId: 'FAC-CSE-EW-02',
        hallAffiliation: 'Academic Block',
        designation: 'Associate Professor',
      }),
      ensureTestUser({
        name: 'Md. Rakibul Islam',
        email: 'rakibul.cse.examwf@pust.ac.bd',
        role: 'teacher',
        departmentCode: 'CSE',
        academicId: 'FAC-CSE-EW-03',
        hallAffiliation: 'Academic Block',
        designation: 'Assistant Professor',
      }),
      ensureTestUser({
        name: 'Controller & Central Admin',
        email: 'admin.examwf@pust.ac.bd',
        role: 'admin',
        departmentCode: 'ADMIN',
        academicId: 'ADM-EW-01',
        hallAffiliation: 'Admin Building',
      }),
      ensureTestUser({
        name: 'Nusrat Jahan',
        email: 'student.cse.examwf@pust.ac.bd',
        role: 'student',
        departmentCode: 'CSE',
        academicId: '220199',
        hallAffiliation: 'Matribhasha Hall (Female Hall 1)',
      }),
    ]);

  // Ensure a matching student record exists for Academic ID 220199 in CSE 2022-23
  const existingStu = await pustRepo.findStudentByAcademicId('220199');
  if (!existingStu) {
    await pustRepo.upsertStudent({
      id: 'stu-220199-ew',
      academicId: '220199',
      name: 'Nusrat Jahan',
      email: cseStudentUser.email,
      phone: '+880-1700-000199',
      departmentCode: 'CSE',
      session: '2022-23',
      currentSemester: 5,
      completedSemesters: 4,
      cgpa: 3.65,
      hallName: 'Matribhasha Hall (Female Hall 1)',
      seatNumber: '302-B',
      admissionDocuments: [],
      chairmanNotes: '',
      adminNotes: '',
      disciplinaryStatus: 'Clear',
      disciplinaryNotes: '',
      allResultsPublished: false,
      approvalStatus: 'approved',
    });
  }

  const testSession = '2022-23';
  const testSemester = 5;
  const testCourseCode = `CSE-T${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

  // Ensure no leftover active committee exists from an interrupted run on this test term
  for (const c of await pustRepo.listExamCommittees()) {
    if (c.departmentCode === 'CSE' && c.session === testSession && c.semester === testSemester) {
      await pustRepo.deleteExamCommittee(c.id);
    }
  }

  await withServer(async (baseUrl) => {
    // 1. Chairman adds course for own department students; cross-department blocked (403)
    const crossDeptCourseRes = await fetch(`${baseUrl}/api/portal/exams/courses`, {
      method: 'POST',
      headers: authHeaders(cseChair),
      body: JSON.stringify({
        code: 'EEE-3101',
        title: 'Power Systems I',
        credits: 3,
        departmentCode: 'EEE',
        semester: testSemester,
        session: testSession,
      }),
    });
    assert.equal(crossDeptCourseRes.status, 403);

    const addCourseRes = await fetch(`${baseUrl}/api/portal/exams/courses`, {
      method: 'POST',
      headers: authHeaders(cseChair),
      body: JSON.stringify({
        code: testCourseCode,
        title: 'Database Management & Security',
        credits: 3,
        departmentCode: 'CSE',
        semester: testSemester,
        session: testSession,
      }),
    });
    assert.equal(addCourseRes.status, 201);
    const { course: createdCourse } = (await addCourseRes.json()) as { course: CourseRecord };
    assert.equal(createdCourse.code, testCourseCode.toUpperCase());
    assert.equal(createdCourse.departmentCode, 'CSE');

    // Duplicate same dept + code + session + semester returns 409
    const dupCourseRes = await fetch(`${baseUrl}/api/portal/exams/courses`, {
      method: 'POST',
      headers: authHeaders(cseChair),
      body: JSON.stringify({
        code: testCourseCode,
        title: 'Duplicate Course',
        credits: 3,
        departmentCode: 'CSE',
        semester: testSemester,
        session: testSession,
      }),
    });
    assert.equal(dupCourseRes.status, 409);

    // 2. Chairman assigns course to a department faculty member (syncs CourseRecord + User)
    const crossDeptAssignRes = await fetch(
      `${baseUrl}/api/portal/users/${encodeURIComponent(committeeTeacher.id)}/assignments`,
      {
        method: 'PATCH',
        headers: authHeaders(eeeChair),
        body: JSON.stringify({
          assignedCourses: [testCourseCode],
          assignedSessions: [testSession],
        }),
      }
    );
    assert.equal(crossDeptAssignRes.status, 403);

    const assignRes = await fetch(
      `${baseUrl}/api/portal/users/${encodeURIComponent(committeeTeacher.id)}/assignments`,
      {
        method: 'PATCH',
        headers: authHeaders(cseChair),
        body: JSON.stringify({
          assignedCourses: [testCourseCode],
          assignedSessions: [testSession],
        }),
      }
    );
    assert.equal(assignRes.status, 200);
    const assignJson = (await assignRes.json()) as { user: AuthUser };
    assert.ok(assignJson.user.assignedCourses?.includes(testCourseCode.toUpperCase()));

    // Verify course catalog shows course & teacher assignment to students and teachers
    const studentOverviewRes = await fetch(`${baseUrl}/api/portal/exams/overview`, {
      headers: authHeaders(cseStudentUser),
    });
    assert.equal(studentOverviewRes.status, 200);
    const studentOverviewJson = (await studentOverviewRes.json()) as {
      courses: CourseRecord[];
    };
    const syncedCourse = studentOverviewJson.courses.find((c) => c.id === createdCourse.id);
    assert.ok(syncedCourse);
    assert.equal(syncedCourse.teacherEmail, committeeTeacher.email);
    assert.equal(syncedCourse.teacherName, committeeTeacher.name);

    // 3. Chairman creates Exam Committee for (CSE, 2022-23, Semester 5)
    const crossDeptCommitteeRes = await fetch(`${baseUrl}/api/portal/exams/committees`, {
      method: 'POST',
      headers: authHeaders(eeeChair),
      body: JSON.stringify({
        departmentCode: 'CSE',
        session: testSession,
        semester: testSemester,
        members: [{ userId: committeeTeacher.id, committeeRole: 'chair' }],
      }),
    });
    assert.equal(crossDeptCommitteeRes.status, 403);

    const createCommitteeRes = await fetch(`${baseUrl}/api/portal/exams/committees`, {
      method: 'POST',
      headers: authHeaders(cseChair),
      body: JSON.stringify({
        departmentCode: 'CSE',
        session: testSession,
        semester: testSemester,
        title: `CSE Exam Committee ${testSession} Sem ${testSemester}`,
        members: [{ userId: committeeTeacher.id, committeeRole: 'chair' }],
      }),
    });
    assert.equal(createCommitteeRes.status, 201);
    const { committee } = (await createCommitteeRes.json()) as {
      committee: ExamCommitteeRecord;
    };
    assert.equal(committee.status, 'active');
    assert.equal(committee.session, testSession);
    assert.equal(committee.semester, testSemester);

    // Duplicate active committee for same (dept, session, semester) blocked with 409
    const dupCommitteeRes = await fetch(`${baseUrl}/api/portal/exams/committees`, {
      method: 'POST',
      headers: authHeaders(cseChair),
      body: JSON.stringify({
        departmentCode: 'CSE',
        session: testSession,
        semester: testSemester,
        members: [{ userId: otherTeacher.id, committeeRole: 'chair' }],
      }),
    });
    assert.equal(dupCommitteeRes.status, 409);

    // 4. Exam Committee teacher arranges exam for appointed term; unauthorized terms/teachers blocked (403)
    const nonCommitteeArrangeRes = await fetch(`${baseUrl}/api/portal/exams/circulars`, {
      method: 'POST',
      headers: authHeaders(otherTeacher),
      body: JSON.stringify({
        title: 'Unauthorized Exam Circular',
        departmentCode: 'CSE',
        semester: testSemester,
        session: testSession,
        deadline: '2026-12-10',
        feeBdt: 1400,
        eligibleCourseCodes: [testCourseCode],
      }),
    });
    assert.equal(nonCommitteeArrangeRes.status, 403);

    const wrongTermArrangeRes = await fetch(`${baseUrl}/api/portal/exams/circulars`, {
      method: 'POST',
      headers: authHeaders(committeeTeacher),
      body: JSON.stringify({
        title: 'Wrong Semester Circular',
        departmentCode: 'CSE',
        semester: 6,
        session: testSession,
        deadline: '2026-12-10',
        feeBdt: 1400,
        eligibleCourseCodes: [testCourseCode],
      }),
    });
    assert.equal(wrongTermArrangeRes.status, 403);

    const arrangeRes = await fetch(`${baseUrl}/api/portal/exams/circulars`, {
      method: 'POST',
      headers: authHeaders(committeeTeacher),
      body: JSON.stringify({
        title: `B.Sc. CSE 3rd Year 1st Sem Final Exam (${testSession})`,
        departmentCode: 'CSE',
        semester: testSemester,
        session: testSession,
        deadline: '2026-12-10',
        examStartDate: '2026-12-22',
        examVenue: 'Academic Building Room 302',
        scheduleNote: 'Morning shift 10:00 AM - 1:00 PM',
        feeBdt: 1450,
        eligibleCourseCodes: [testCourseCode],
        committeeId: committee.id,
      }),
    });
    assert.equal(arrangeRes.status, 201);
    const arrangeJson = (await arrangeRes.json()) as {
      circular: { committeeId?: string; examVenue?: string; examStartDate?: string };
    };
    assert.equal(arrangeJson.circular.committeeId, committee.id);
    assert.equal(arrangeJson.circular.examVenue, 'Academic Building Room 302');
    assert.equal(arrangeJson.circular.examStartDate, '2026-12-22');

    // 5A. Exam Committee member calculates result & forwards to Chairman -> Chairman publishes
    const calcToChairmanRes = await fetch(`${baseUrl}/api/portal/exams/results`, {
      method: 'POST',
      headers: authHeaders(committeeTeacher),
      body: JSON.stringify({
        academicId: '220199',
        semester: testSemester,
        promotionMode: 'auto',
        submissionTarget: 'chairman',
        committeeId: committee.id,
        courses: [{ code: testCourseCode, title: 'Database Management & Security', credits: 3, marks: 84 }],
      }),
    });
    assert.equal(calcToChairmanRes.status, 201);
    const calcToChairmanJson = (await calcToChairmanRes.json()) as {
      result: ExamResultRecord;
      pendingChairmanReview: boolean;
      pendingAdminReview: boolean;
    };
    assert.equal(calcToChairmanJson.pendingChairmanReview, true);
    assert.equal(calcToChairmanJson.pendingAdminReview, false);
    assert.equal(calcToChairmanJson.result.status, 'pending_chairman');
    assert.equal(calcToChairmanJson.result.published, false);
    assert.equal(calcToChairmanJson.result.sgpa, 4);

    // Chairman publishes the pending_chairman result
    const chairPublishRes = await fetch(
      `${baseUrl}/api/portal/exams/results/${encodeURIComponent(calcToChairmanJson.result.id)}/publish`,
      {
        method: 'PATCH',
        headers: authHeaders(cseChair),
        body: JSON.stringify({ promotionMode: 'auto' }),
      }
    );
    assert.equal(chairPublishRes.status, 200);
    const chairPublishJson = (await chairPublishRes.json()) as { result: ExamResultRecord };
    assert.equal(chairPublishJson.result.published, true);
    assert.equal(chairPublishJson.result.status, 'published');

    // 5B. Committee calculates result -> forwards to Chairman -> Chairman forwards to Admin Office -> Admin publishes
    const calcSecondRes = await fetch(`${baseUrl}/api/portal/exams/results`, {
      method: 'POST',
      headers: authHeaders(committeeTeacher),
      body: JSON.stringify({
        academicId: '220199',
        semester: testSemester,
        promotionMode: 'auto',
        submissionTarget: 'chairman',
        committeeId: committee.id,
        courses: [{ code: testCourseCode, title: 'Database Management & Security', credits: 3, marks: 76 }],
      }),
    });
    assert.equal(calcSecondRes.status, 201);
    const { result: secondResult } = (await calcSecondRes.json()) as { result: ExamResultRecord };

    const chairForwardAdminRes = await fetch(
      `${baseUrl}/api/portal/exams/results/${encodeURIComponent(secondResult.id)}/forward`,
      {
        method: 'PATCH',
        headers: authHeaders(cseChair),
        body: JSON.stringify({ target: 'admin' }),
      }
    );
    assert.equal(chairForwardAdminRes.status, 200);
    const chairForwardAdminJson = (await chairForwardAdminRes.json()) as {
      result: ExamResultRecord;
    };
    assert.equal(chairForwardAdminJson.result.status, 'pending_admin');
    assert.equal(chairForwardAdminJson.result.forwardedTo, 'admin');

    // Chairman cannot publish once forwarded to Admin Office (409)
    const blockedChairPublishRes = await fetch(
      `${baseUrl}/api/portal/exams/results/${encodeURIComponent(secondResult.id)}/publish`,
      {
        method: 'PATCH',
        headers: authHeaders(cseChair),
        body: JSON.stringify({ promotionMode: 'auto' }),
      }
    );
    assert.equal(blockedChairPublishRes.status, 409);

    // Admin publishes forwarded result
    const adminPublishRes = await fetch(
      `${baseUrl}/api/portal/exams/results/${encodeURIComponent(secondResult.id)}/publish`,
      {
        method: 'PATCH',
        headers: authHeaders(adminUser),
        body: JSON.stringify({ promotionMode: 'auto' }),
      }
    );
    assert.equal(adminPublishRes.status, 200);
    const adminPublishJson = (await adminPublishRes.json()) as { result: ExamResultRecord };
    assert.equal(adminPublishJson.result.published, true);
    assert.equal(adminPublishJson.result.status, 'published');

    // 5C. Committee member forwards directly to Admin Office; non-committee teacher blocked (403)
    const nonCommitteeForwardAdminRes = await fetch(`${baseUrl}/api/portal/exams/results`, {
      method: 'POST',
      headers: authHeaders(otherTeacher),
      body: JSON.stringify({
        academicId: '220199',
        semester: testSemester,
        promotionMode: 'auto',
        submissionTarget: 'admin',
        courses: [{ code: testCourseCode, title: 'Database Management & Security', credits: 3, marks: 70 }],
      }),
    });
    assert.equal(nonCommitteeForwardAdminRes.status, 403);

    const directAdminRes = await fetch(`${baseUrl}/api/portal/exams/results`, {
      method: 'POST',
      headers: authHeaders(committeeTeacher),
      body: JSON.stringify({
        academicId: '220199',
        semester: testSemester,
        promotionMode: 'auto',
        submissionTarget: 'admin',
        committeeId: committee.id,
        courses: [{ code: testCourseCode, title: 'Database Management & Security', credits: 3, marks: 80 }],
      }),
    });
    assert.equal(directAdminRes.status, 201);
    const directAdminJson = (await directAdminRes.json()) as {
      result: ExamResultRecord;
      pendingAdminReview: boolean;
    };
    assert.equal(directAdminJson.pendingAdminReview, true);
    assert.equal(directAdminJson.result.status, 'pending_admin');

    // Clean up created committee & course so repeated runs stay idempotent
    const delCommitteeRes = await fetch(
      `${baseUrl}/api/portal/exams/committees/${encodeURIComponent(committee.id)}`,
      {
        method: 'DELETE',
        headers: authHeaders(cseChair),
      }
    );
    assert.equal(delCommitteeRes.status, 200);

    const delCourseRes = await fetch(
      `${baseUrl}/api/portal/exams/courses/${encodeURIComponent(createdCourse.id)}`,
      {
        method: 'DELETE',
        headers: authHeaders(cseChair),
      }
    );
    assert.equal(delCourseRes.status, 200);
  });
});

test('Exam Committee Dashboard raw course grades viewing, filtering, moderation, and consolidation before finalizing', async () => {
  await pustRepo.init();

  const [cseChair, committeeTeacher, otherTeacher, eeeTeacher, cseStudentUser] =
    await Promise.all([
      ensureTestUser({
        name: 'Dr. Mahmudul Hasan (CSE Chair)',
        email: 'chair.cse.examwf@pust.ac.bd',
        role: 'chairman',
        departmentCode: 'CSE',
        academicId: 'FAC-CSE-EW-01',
        hallAffiliation: 'Academic Block',
        designation: 'Professor & Chairman',
      }),
      ensureTestUser({
        name: 'Dr. Farhana Yasmin',
        email: 'farhana.cse.examwf@pust.ac.bd',
        role: 'teacher',
        departmentCode: 'CSE',
        academicId: 'FAC-CSE-EW-02',
        hallAffiliation: 'Academic Block',
        designation: 'Associate Professor',
      }),
      ensureTestUser({
        name: 'Md. Rakibul Islam',
        email: 'rakibul.cse.examwf@pust.ac.bd',
        role: 'teacher',
        departmentCode: 'CSE',
        academicId: 'FAC-CSE-EW-03',
        hallAffiliation: 'Academic Block',
        designation: 'Assistant Professor',
      }),
      ensureTestUser({
        name: 'Engr. Kamrul Hasan (EEE Teacher)',
        email: 'teacher.eee.examwf@pust.ac.bd',
        role: 'teacher',
        departmentCode: 'EEE',
        academicId: 'FAC-EEE-EW-02',
        hallAffiliation: 'Academic Block',
        designation: 'Lecturer',
      }),
      ensureTestUser({
        name: 'Nusrat Jahan',
        email: 'student.cse.examwf@pust.ac.bd',
        role: 'student',
        departmentCode: 'CSE',
        academicId: '220199',
        hallAffiliation: 'Matribhasha Hall (Female Hall 1)',
      }),
    ]);

  const testSession = '2022-23';
  const testSemester = 5;
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  const courseOne = `CSE-R1${suffix}`;
  const courseTwo = `CSE-R2${suffix}`;

  for (const c of await pustRepo.listExamCommittees()) {
    if (c.departmentCode === 'CSE' && c.session === testSession && c.semester === testSemester) {
      await pustRepo.deleteExamCommittee(c.id);
    }
  }

  const createdRawIds: string[] = [];

  await withServer(async (baseUrl) => {
    // 1. Auth & role checks on GET /api/portal/exams/raw-grades
    const unauthRes = await fetch(`${baseUrl}/api/portal/exams/raw-grades`);
    assert.equal(unauthRes.status, 401);

    const studentRes = await fetch(`${baseUrl}/api/portal/exams/raw-grades`, {
      headers: authHeaders(cseStudentUser),
    });
    assert.equal(studentRes.status, 403);

    // 2. Chairman creates an active Exam Committee for (CSE, 2022-23, Sem 5) with committeeTeacher
    const createCommitteeRes = await fetch(`${baseUrl}/api/portal/exams/committees`, {
      method: 'POST',
      headers: authHeaders(cseChair),
      body: JSON.stringify({
        departmentCode: 'CSE',
        session: testSession,
        semester: testSemester,
        title: `CSE Scrutiny Committee ${testSession} Sem ${testSemester}`,
        members: [{ userId: committeeTeacher.id, committeeRole: 'chair' }],
      }),
    });
    assert.equal(createCommitteeRes.status, 201);
    const { committee } = (await createCommitteeRes.json()) as {
      committee: ExamCommitteeRecord;
    };

    // 3. Teachers submit raw course marks (continuous 0-40 + final 0-60)
    // Cross-department teacher blocked (403)
    const crossSubmitRes = await fetch(`${baseUrl}/api/portal/exams/raw-grades`, {
      method: 'POST',
      headers: authHeaders(eeeTeacher),
      body: JSON.stringify({
        academicId: '220199',
        departmentCode: 'CSE',
        session: testSession,
        semester: testSemester,
        courseCode: courseOne,
        courseTitle: 'Distributed Systems',
        credits: 3,
        continuousMarks: 30,
        finalExamMarks: 45,
      }),
    });
    assert.equal(crossSubmitRes.status, 403);

    const subOneRes = await fetch(`${baseUrl}/api/portal/exams/raw-grades`, {
      method: 'POST',
      headers: authHeaders(otherTeacher),
      body: JSON.stringify({
        academicId: '220199',
        departmentCode: 'CSE',
        session: testSession,
        semester: testSemester,
        courseCode: courseOne,
        courseTitle: 'Distributed Systems',
        credits: 3,
        continuousMarks: 32,
        finalExamMarks: 46,
      }),
    });
    assert.equal(subOneRes.status, 201);
    const { rawGrade: rawOne } = (await subOneRes.json()) as { rawGrade: RawCourseGradeRecord };
    createdRawIds.push(rawOne.id);
    assert.equal(rawOne.totalMarks, 78);
    assert.equal(rawOne.letterGrade, 'A');
    assert.equal(rawOne.gradePoint, 3.75);
    assert.equal(rawOne.status, 'submitted');

    const subTwoRes = await fetch(`${baseUrl}/api/portal/exams/raw-grades`, {
      method: 'POST',
      headers: authHeaders(committeeTeacher),
      body: JSON.stringify({
        academicId: '220199',
        departmentCode: 'CSE',
        session: testSession,
        semester: testSemester,
        courseCode: courseTwo,
        courseTitle: 'Compiler Design',
        credits: 3,
        continuousMarks: 28,
        finalExamMarks: 42,
      }),
    });
    assert.equal(subTwoRes.status, 201);
    const { rawGrade: rawTwo } = (await subTwoRes.json()) as { rawGrade: RawCourseGradeRecord };
    createdRawIds.push(rawTwo.id);
    assert.equal(rawTwo.totalMarks, 70);
    assert.equal(rawTwo.letterGrade, 'A-');
    assert.equal(rawTwo.gradePoint, 3.5);

    // 4. Scope isolation: non-committee teacher sees ONLY own submission & cannot review or finalize
    const nonCommitteeListRes = await fetch(`${baseUrl}/api/portal/exams/raw-grades`, {
      headers: authHeaders(otherTeacher),
    });
    assert.equal(nonCommitteeListRes.status, 200);
    const nonCommitteeList = (await nonCommitteeListRes.json()) as {
      rawGrades: RawCourseGradeRecord[];
    };
    assert.ok(nonCommitteeList.rawGrades.some((g) => g.id === rawOne.id));
    assert.ok(!nonCommitteeList.rawGrades.some((g) => g.id === rawTwo.id));

    const blockedReviewRes = await fetch(
      `${baseUrl}/api/portal/exams/raw-grades/${encodeURIComponent(rawOne.id)}/review`,
      {
        method: 'PATCH',
        headers: authHeaders(otherTeacher),
        body: JSON.stringify({ status: 'reviewed' }),
      }
    );
    assert.equal(blockedReviewRes.status, 403);

    const blockedFinalizeRes = await fetch(`${baseUrl}/api/portal/exams/raw-grades/finalize`, {
      method: 'POST',
      headers: authHeaders(otherTeacher),
      body: JSON.stringify({
        academicId: '220199',
        session: testSession,
        semester: testSemester,
        rawGradeIds: [rawOne.id],
        submissionTarget: 'chairman',
      }),
    });
    assert.equal(blockedFinalizeRes.status, 403);

    // 5. Active Exam Committee member views ALL submissions for the committee term & filters via query params
    const committeeFilteredRes = await fetch(
      `${baseUrl}/api/portal/exams/raw-grades?departmentCode=CSE&session=${encodeURIComponent(
        testSession
      )}&semester=${testSemester}&status=submitted&courseCode=${encodeURIComponent(courseOne)}`,
      {
        headers: authHeaders(committeeTeacher),
      }
    );
    assert.equal(committeeFilteredRes.status, 200);
    const filteredJson = (await committeeFilteredRes.json()) as {
      rawGrades: RawCourseGradeRecord[];
    };
    assert.equal(filteredJson.rawGrades.length, 1);
    assert.equal(filteredJson.rawGrades[0].id, rawOne.id);

    // 6. Committee member moderates marks & verifies rawOne before finalization
    const reviewRes = await fetch(
      `${baseUrl}/api/portal/exams/raw-grades/${encodeURIComponent(rawOne.id)}/review`,
      {
        method: 'PATCH',
        headers: authHeaders(committeeTeacher),
        body: JSON.stringify({
          status: 'reviewed',
          continuousMarks: 34,
          finalExamMarks: 47,
          committeeNote: 'Script re-totaled; 1 grace mark verified.',
        }),
      }
    );
    assert.equal(reviewRes.status, 200);
    const { rawGrade: moderated } = (await reviewRes.json()) as {
      rawGrade: RawCourseGradeRecord;
    };
    assert.equal(moderated.status, 'reviewed');
    assert.equal(moderated.totalMarks, 81);
    assert.equal(moderated.letterGrade, 'A+');
    assert.equal(moderated.gradePoint, 4);
    assert.equal(moderated.committeeNote, 'Script re-totaled; 1 grace mark verified.');

    // 7. Committee member consolidates & forwards rawOne to Chairman (locks rawOne as finalized)
    const finalizeChairRes = await fetch(`${baseUrl}/api/portal/exams/raw-grades/finalize`, {
      method: 'POST',
      headers: authHeaders(committeeTeacher),
      body: JSON.stringify({
        academicId: '220199',
        session: testSession,
        semester: testSemester,
        rawGradeIds: [rawOne.id],
        submissionTarget: 'chairman',
        promotionMode: 'auto',
        committeeId: committee.id,
      }),
    });
    assert.equal(finalizeChairRes.status, 201);
    const finalizeChairJson = (await finalizeChairRes.json()) as {
      result: ExamResultRecord;
      finalizedCount: number;
    };
    assert.equal(finalizeChairJson.finalizedCount, 1);
    assert.equal(finalizeChairJson.result.status, 'pending_chairman');
    assert.equal(finalizeChairJson.result.sgpa, 4);

    // Finalized raw grade is locked against re-edit, re-review, and re-finalization (409)
    const editLockedRes = await fetch(`${baseUrl}/api/portal/exams/raw-grades`, {
      method: 'POST',
      headers: authHeaders(otherTeacher),
      body: JSON.stringify({
        academicId: '220199',
        departmentCode: 'CSE',
        session: testSession,
        semester: testSemester,
        courseCode: courseOne,
        continuousMarks: 20,
        finalExamMarks: 20,
      }),
    });
    assert.equal(editLockedRes.status, 409);

    const reviewLockedRes = await fetch(
      `${baseUrl}/api/portal/exams/raw-grades/${encodeURIComponent(rawOne.id)}/review`,
      {
        method: 'PATCH',
        headers: authHeaders(committeeTeacher),
        body: JSON.stringify({ status: 'submitted' }),
      }
    );
    assert.equal(reviewLockedRes.status, 409);

    const refinalizeLockedRes = await fetch(`${baseUrl}/api/portal/exams/raw-grades/finalize`, {
      method: 'POST',
      headers: authHeaders(committeeTeacher),
      body: JSON.stringify({
        academicId: '220199',
        session: testSession,
        semester: testSemester,
        rawGradeIds: [rawOne.id],
        submissionTarget: 'chairman',
      }),
    });
    assert.equal(refinalizeLockedRes.status, 409);

    // 8. Committee member consolidates rawTwo directly to Admin Office
    const finalizeAdminRes = await fetch(`${baseUrl}/api/portal/exams/raw-grades/finalize`, {
      method: 'POST',
      headers: authHeaders(committeeTeacher),
      body: JSON.stringify({
        academicId: '220199',
        session: testSession,
        semester: testSemester,
        rawGradeIds: [rawTwo.id],
        submissionTarget: 'admin',
        promotionMode: 'auto',
        committeeId: committee.id,
      }),
    });
    assert.equal(finalizeAdminRes.status, 201);
    const finalizeAdminJson = (await finalizeAdminRes.json()) as {
      result: ExamResultRecord;
    };
    assert.equal(finalizeAdminJson.result.status, 'pending_admin');
    assert.equal(finalizeAdminJson.result.forwardedTo, 'admin');
    assert.equal(finalizeAdminJson.result.sgpa, 3.5);

    // Cleanup test raw grades & committee
    for (const rawId of createdRawIds) {
      await pustRepo.deleteRawCourseGrade(rawId);
    }
    const delCommitteeRes = await fetch(
      `${baseUrl}/api/portal/exams/committees/${encodeURIComponent(committee.id)}`,
      {
        method: 'DELETE',
        headers: authHeaders(cseChair),
      }
    );
    assert.equal(delCommitteeRes.status, 200);
  });
});

