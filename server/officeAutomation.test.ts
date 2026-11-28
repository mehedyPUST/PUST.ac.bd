import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { deduplicateDepartments, pustRepo } from './db';
import { getApiApp } from './apiApp';
import {
  autoClearHallDueIfEnabled,
  autoEvaluateCertificateApplication,
  autoIssueAdmitCardIfEligible,
  autoIssueLibraryCardAfterChairmanSeal,
  buildOfficeFlowOverview,
  runAutomatedOfficeSweep,
} from './officeAutomation';
import { hashPassword, signAuthToken, verifyPassword, type JwtClaims } from './auth';
import type { ClearanceOfficeKey, DepartmentRecord, OfficeClearanceState } from '../src/types/pust';

const ADMIN_CLAIMS: JwtClaims = {
  sub: 'usr-admin-test',
  email: 'admin@pust.ac.bd',
  name: 'Central Admin Office',
  role: 'admin',
  departmentCode: 'ADMIN',
  academicId: 'ADM-001',
  hallAffiliation: 'All Halls',
  approvalStatus: 'approved',
};

const CSE_CHAIRMAN_CLAIMS: JwtClaims = {
  sub: 'usr-chair-cse',
  email: 'chairman.cse@pust.ac.bd',
  name: 'Dr. CSE Chairman',
  role: 'chairman',
  departmentCode: 'CSE',
  academicId: 'FAC-CSE-01',
  hallAffiliation: 'Academic Block',
  approvalStatus: 'approved',
};

function makePendingOffice(office: ClearanceOfficeKey, officeLabel: string): OfficeClearanceState {
  return {
    office,
    officeLabel,
    status: 'pending',
    note: 'Awaiting review',
    history: [],
  };
}

test('Automated Office Flow clears paid hall due and auto-issues exam admit card when standing is clean', async () => {
  await pustRepo.init();
  await pustRepo.updateAutomationConfig({
    autoClearPaidHallDues: true,
    autoIssueAdmitCardsOnPay: true,
  });

  await pustRepo.upsertStudent({
    id: 'stu-auto-clean',
    academicId: '229901',
    name: 'Tariqul Islam',
    email: 'tariqul.cse@pust.ac.bd',
    phone: '+8801711990001',
    departmentCode: 'CSE',
    session: '2022-23',
    currentSemester: 5,
    cgpa: 3.74,
    completedSemesters: 4,
    allResultsPublished: false,
    hallName: 'July 06 Hall',
    seatNumber: 'Room 201, Bed A',
    admissionDocuments: ['SSC.pdf', 'HSC.pdf'],
    chairmanNotes: 'Verified',
    adminNotes: 'Active',
    disciplinaryStatus: 'Clear',
    disciplinaryNotes: 'Clean',
    approvalStatus: 'approved',
  });

  const due = await pustRepo.createHallDue({
    academicId: '229901',
    studentName: 'Tariqul Islam',
    hallName: 'July 06 Hall',
    feeTitle: 'Semester 5 Hall Mess & Seat Rent',
    amountBdt: 1200,
    status: 'Unpaid',
  });

  const examApp = await pustRepo.createExamApplication({
    circularId: 'ecirc-test',
    examTitle: 'B.Sc. CSE Semester 5 Final',
    studentId: 'usr-stu-229901',
    academicId: '229901',
    studentName: 'Tariqul Islam',
    departmentCode: 'CSE',
    session: '2022-23',
    semester: 5,
    selectedCourseCodes: ['CSE-3101'],
    totalCredits: 3,
    formReference: 'PUST-EX-CSE-TEST01',
    feeBdt: 1450,
    paymentStatus: 'Paid',
    verificationStatus: 'Pending Chairman Verification',
    hallClearanceChecked: true,
  });

  // Before hall due is cleared, automated admit card issuance holds with an explicit reason
  const heldResult = await autoIssueAdmitCardIfEligible(examApp);
  assert.equal(heldResult.autoIssued, false);
  assert.match(heldResult.holdReason || '', /uncleared hall due/i);

  // Paying hall due triggers automated clearance
  const clearedDue = await autoClearHallDueIfEnabled(due, 'SSLCOMMERZ', 'TXN-HALL-01', 'PUST-RCPT-01');
  assert.equal(clearedDue.autoCleared, true);
  assert.equal(clearedDue.due.status, 'Cleared');
  assert.ok(clearedDue.due.clearanceRef?.startsWith('PUST-HALL-CLR-'));

  // Re-running automated admit issuance now passes and issues ADMIT-...
  const issuedResult = await autoIssueAdmitCardIfEligible(examApp);
  assert.equal(issuedResult.autoIssued, true);
  assert.equal(issuedResult.application.verificationStatus, 'Approved');
  assert.equal(issuedResult.application.admitCardNo, 'ADMIT-CSE-229901-5');
});

test('Chairman SHA-256 library seal automatically activates Digital Library Card when enabled', async () => {
  await pustRepo.init();
  await pustRepo.updateAutomationConfig({ autoIssueSealedLibraryCards: true });

  const app = await pustRepo.createLibraryApplication({
    studentId: 'usr-stu-229902',
    studentName: 'Farhana Yasmin',
    academicId: '229902',
    departmentCode: 'EEE',
    session: '2022-23',
    status: 'forwarded_to_library',
    chairmanSeal: {
      chairmanName: 'Dr. EEE Chairman',
      departmentCode: 'EEE',
      officialSeal: 'OFFICIAL SEAL — Dept. of EEE, PUST',
      digitalSignature: 'Dr. EEE Chairman',
      signedAt: new Date().toISOString(),
      verificationHash: 'ABCDEF1234567890',
    },
  });

  const res = await autoIssueLibraryCardAfterChairmanSeal(app.id);
  assert.equal(res.autoIssued, true);
  assert.ok(res.card);
  assert.equal(res.card?.digitalCardNo, 'PUST-LIB-EEE-229902');
  assert.equal(res.card?.status, 'Active');
});

test('Certificate 4-office evaluation blocks unreturned books and auto-issues once resolved', async () => {
  await pustRepo.init();
  await pustRepo.updateAutomationConfig({
    autoVerifyCleanCertOffices: true,
    autoIssueReadyCertificates: true,
  });

  await pustRepo.upsertStudent({
    id: 'stu-auto-grad',
    academicId: '209901',
    name: 'Nabila Rahman',
    email: 'nabila.cse@pust.ac.bd',
    phone: '+8801711209901',
    departmentCode: 'CSE',
    session: '2020-21',
    currentSemester: 8,
    cgpa: 3.91,
    completedSemesters: 8,
    allResultsPublished: true,
    hallName: 'July 06 Hall',
    seatNumber: 'Room 402, Bed B',
    admissionDocuments: ['SSC.pdf', 'HSC.pdf'],
    chairmanNotes: '8/8 completed',
    adminNotes: 'Graduating',
    disciplinaryStatus: 'Clear',
    disciplinaryNotes: 'Clean',
    approvalStatus: 'approved',
  });

  const borrow = await pustRepo.createLibraryBorrow({
    academicId: '209901',
    studentName: 'Nabila Rahman',
    bookTitle: 'Operating System Concepts',
    isbn: '978-1119800361',
    borrowedAt: '2026-01-10',
    dueAt: '2026-02-10',
    fineBdt: 0,
    status: 'Borrowed',
  });

  const cert = await pustRepo.createCertificateApplication({
    studentId: 'usr-stu-209901',
    academicId: '209901',
    studentName: 'Nabila Rahman',
    departmentCode: 'CSE',
    session: '2020-21',
    certificateType: 'Temporary Certificate',
    feeBdt: 1500,
    paymentMethod: 'MFS',
    transactionId: 'MFS-CERT-209901',
    clearances: {
      chairman: makePendingOffice('chairman', "Department Chairman's Office"),
      hall: makePendingOffice('hall', 'Hall Office'),
      library: makePendingOffice('library', 'Library Office'),
      proctor: makePendingOffice('proctor', "Proctor's Office"),
    },
    finalAdminStatus: 'waiting_offices',
  });

  // First automated check clears Chairman, Hall, and Proctor, while holding Library due to loan
  const firstEval = await autoEvaluateCertificateApplication(cert.id);
  assert.equal(firstEval.autoIssued, false);
  assert.deepEqual(firstEval.clearedOffices.sort(), ['chairman', 'hall', 'proctor']);
  assert.equal(firstEval.application?.clearances.library.status, 'pending');
  assert.match(firstEval.application?.clearances.library.note || '', /unreturned library book/i);

  // Return book and trigger admin sweep -> completes Library clearance and auto-issues certificate
  await pustRepo.updateLibraryBorrow(borrow.id, {
    status: 'Returned',
    returnedAt: '2026-03-01',
  });

  const sweep = await runAutomatedOfficeSweep(ADMIN_CLAIMS);
  assert.ok(sweep.processedCount >= 1);

  const updatedCert = (await pustRepo.listCertificateApplications()).find((c) => c.id === cert.id);
  assert.equal(updatedCert?.clearances.library.status, 'approved');
  assert.equal(updatedCert?.finalAdminStatus, 'approved');
  assert.ok(updatedCert?.certificateSerial?.startsWith('PUST-CERT-CSE-'));

  // Department-scoped overview excludes other departments for Chairman
  const overview = await buildOfficeFlowOverview(CSE_CHAIRMAN_CLAIMS);
  assert.ok(overview.queueItems.every((i) => !i.departmentCode || i.departmentCode === 'CSE'));
});

test('updateItem strips undefined keys without corrupting fields or leaving empty updates', async () => {
  await pustRepo.init();
  const created = await pustRepo.createHallCircular({
    hallName: 'July 06 Hall',
    title: 'Test Vacancy Circular',
    vacantSeats: 5,
    deadline: '2026-12-30',
    description: 'Testing partial update handling.',
    publishedBy: 'Hall Provost',
    publishedAt: '2026-11-25',
  });

  const updated = await pustRepo.updateHallCircular(created.id, {
    vacantSeats: 4,
  });
  assert.equal(updated?.vacantSeats, 4);
  assert.equal(updated?.title, 'Test Vacancy Circular');
});

test('deduplicateDepartments collapses stale duplicate records and keeps canonical official entries sorted', () => {
  const dupes: DepartmentRecord[] = [
    {
      id: 'legacy-sds-1',
      code: 'SDS',
      name: 'Statistics and Data Science',
      faculty: 'Faculty of Science',
      established: 2015,
      degrees: [],
      intakeSeats: 40,
      building: 'Academic Building I',
      chairmanName: 'Dr. Md. Sohel Rana',
      summary: 'Legacy duplicate',
      researchFocus: [],
      laboratories: [],
    },
    {
      id: 'dept-chem',
      code: 'CHEM',
      officialCode: '14',
      name: 'Chemistry',
      faculty: 'Faculty of Science',
      established: 2012,
      degrees: ['B.Sc. (Hons.)'],
      intakeSeats: 40,
      facultyCount: 11,
      researchTotal: 133,
      building: 'Academic Building I',
      chairmanName: 'Ratan Kumar Paul',
      summary: 'Canonical',
      researchFocus: [],
      laboratories: [],
    },
    {
      id: 'legacy-chem-2',
      code: 'chem',
      name: 'Chemistry',
      faculty: 'Faculty of Science',
      established: 2012,
      degrees: [],
      intakeSeats: 40,
      building: 'Academic Building I',
      chairmanName: 'Dr. Md. Faruak Ahmad',
      summary: 'Legacy duplicate',
      researchFocus: [],
      laboratories: [],
    },
    {
      id: 'dept-math',
      code: 'MATH',
      officialCode: '03',
      name: 'Mathematics',
      faculty: 'Faculty of Science',
      established: 2008,
      degrees: ['B.Sc. (Hons.)'],
      intakeSeats: 50,
      facultyCount: 14,
      researchTotal: 458,
      building: 'Academic Building I',
      chairmanName: 'Dr. Md. Fazlul Hoque',
      summary: 'Canonical',
      researchFocus: [],
      laboratories: [],
    },
  ];

  const clean = deduplicateDepartments(dupes);
  assert.equal(clean.length, 3);
  assert.deepEqual(
    clean.map((d) => d.code),
    ['MATH', 'CHEM', 'SDS']
  );
  assert.equal(clean.find((d) => d.code === 'CHEM')?.chairmanName, 'Ratan Kumar Paul');
});

test('Temporary first-login password blocks portal mutations until updated via /api/auth/change-password', async () => {
  const app = await getApiApp();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const tempSecret = 'PUST-TMP-9K4M2P';
  const newPersonalSecret = 'MyPersonalPass#2026';
  const uniqueEmail = `temp.verify.${Date.now()}@pust.ac.bd`;

  const created = await pustRepo.createUser({
    name: 'Temp Verify Teacher',
    email: uniqueEmail,
    passwordHash: hashPassword(tempSecret),
    role: 'teacher',
    approvalStatus: 'approved',
    departmentCode: 'PHY',
    academicId: 'PUST-PHY-TMP-01',
    hallAffiliation: 'Academic Building I',
    assignedCourses: [],
    assignedSessions: [],
    mustChangePassword: true,
  });

  try {
    // 1. Sign in with temporary token
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({ email: uniqueEmail, password: tempSecret }),
    });
    assert.equal(loginRes.status, 200);
    const loginJson = (await loginRes.json()) as { user: { mustChangePassword?: boolean; id: string } };
    assert.equal(loginJson.user.mustChangePassword, true);
    assert.equal('passwordHash' in loginJson.user, false);

    const setCookie = loginRes.headers.get('set-cookie');
    assert.ok(setCookie);
    const cookieHeader = setCookie.split(';')[0];

    // 2. Portal mutation is blocked while mustChangePassword is true
    const blockedRes = await fetch(`${baseUrl}/api/portal/teacher/profile/unclaim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({}),
    });
    assert.equal(blockedRes.status, 403);
    const blockedJson = (await blockedRes.json()) as { code?: string };
    assert.equal(blockedJson.code, 'PASSWORD_CHANGE_REQUIRED');

    // 3. Reject wrong current token on change-password
    const wrongCurrentRes = await fetch(`${baseUrl}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        currentPassword: 'WRONG-TOKEN-VALUE',
        newPassword: newPersonalSecret,
      }),
    });
    assert.equal(wrongCurrentRes.status, 401);

    // 4. Update password with valid temporary token
    const changeRes = await fetch(`${baseUrl}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({
        currentPassword: tempSecret,
        newPassword: newPersonalSecret,
      }),
    });
    assert.equal(changeRes.status, 200);
    const changeJson = (await changeRes.json()) as { user: { mustChangePassword?: boolean } };
    assert.equal(changeJson.user.mustChangePassword, false);
    assert.equal('passwordHash' in changeJson.user, false);

    // 5. Old temporary token no longer works; new personal password works
    const storedAfter = await pustRepo.findUserById(created.id);
    assert.ok(storedAfter);
    assert.equal(storedAfter.mustChangePassword, false);
    assert.equal(verifyPassword(tempSecret, storedAfter.passwordHash), false);
    assert.equal(verifyPassword(newPersonalSecret, storedAfter.passwordHash), true);

    // Confirm signed token also remains valid cleanly
    assert.ok(signAuthToken({ ...storedAfter, mustChangePassword: false }).length > 20);
  } finally {
    await pustRepo.deleteUser(created.id);
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('Admin can add existing officer profile with temp token and appoint department chairman archiving tenure history', async () => {
  const app = await getApiApp();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const dept = await pustRepo.getDepartmentByCode('PHY');
  assert.ok(dept);
  const originalDeptSnapshot = {
    chairmanName: dept.chairmanName,
    chairmanSince: dept.chairmanSince,
    chairmanProfile: dept.chairmanProfile,
    chairmanHistory: dept.chairmanHistory || [],
  };

  const officerMember = dept.officers?.[0];
  assert.ok(officerMember, 'Expected at least one seeded officer in PHY department');

  const adminUser = await pustRepo.createUser({
    name: 'Test Central Admin',
    email: `admin.chair.test.${Date.now()}@pust.ac.bd`,
    passwordHash: hashPassword('AdminPass#2026'),
    role: 'admin',
    approvalStatus: 'approved',
    departmentCode: 'ADMIN',
    academicId: `PUST-ADMIN-TEST-${Date.now()}`,
    hallAffiliation: 'Administrative Building',
  });

  const teacherA = await pustRepo.createUser({
    name: 'Dr. Appointee One',
    email: `teacher.a.${Date.now()}@pust.ac.bd`,
    passwordHash: hashPassword('TeacherPass#1'),
    role: 'teacher',
    approvalStatus: 'approved',
    departmentCode: 'PHY',
    academicId: `PUST-PHY-TEST-A-${Date.now()}`,
    hallAffiliation: 'Academic Building I',
    designation: 'Professor',
    assignedCourses: [],
    assignedSessions: [],
  });

  const teacherB = await pustRepo.createUser({
    name: 'Dr. Appointee Two',
    email: `teacher.b.${Date.now()}@pust.ac.bd`,
    passwordHash: hashPassword('TeacherPass#2'),
    role: 'teacher',
    approvalStatus: 'approved',
    departmentCode: 'PHY',
    academicId: `PUST-PHY-TEST-B-${Date.now()}`,
    hallAffiliation: 'Academic Building I',
    designation: 'Associate Professor',
    assignedCourses: [],
    assignedSessions: [],
  });

  let createdOfficerId: string | null = null;
  const adminCookie = `pust_token=${encodeURIComponent(signAuthToken(adminUser))}`;
  const teacherCookie = `pust_token=${encodeURIComponent(signAuthToken(teacherB))}`;

  try {
    // 1. Admin adds an existing officer profile with temporary first-login token
    const officerEmail = `phy.officer.${Date.now()}@pust.ac.bd`;
    const addOfficerRes = await fetch(`${baseUrl}/api/portal/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        name: officerMember.name,
        email: officerEmail,
        password: 'PUST-TMP-OFF889',
        role: 'registrar',
        departmentCode: 'PHY',
        academicId: `PUST-PHY-OFF-${Date.now()}`,
        hallAffiliation: 'Academic Building I',
        officeCode: 'PHY',
        officeName: `Department of ${dept.name}`,
        designation: officerMember.designation,
        approvalStatus: 'approved',
        claimedFacultyMemberId: officerMember.id,
        claimedDepartmentCode: 'PHY',
        claimedFacultyGroup: 'officer',
        mustChangePassword: true,
      }),
    });
    assert.equal(addOfficerRes.status, 201);
    const addedOfficerJson = (await addOfficerRes.json()) as {
      user: { id: string; role: string; mustChangePassword?: boolean; claimedFacultyGroup?: string };
    };
    createdOfficerId = addedOfficerJson.user.id;
    assert.equal(addedOfficerJson.user.role, 'registrar');
    assert.equal(addedOfficerJson.user.mustChangePassword, true);
    assert.equal(addedOfficerJson.user.claimedFacultyGroup, 'officer');

    // 2. Non-admin teacher cannot appoint chairman (403)
    const forbiddenRes = await fetch(`${baseUrl}/api/portal/departments/PHY/appoint-chairman`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Cookie: teacherCookie,
      },
      body: JSON.stringify({
        teacherUserId: teacherA.id,
        effectiveDate: '2026-03-01',
      }),
    });
    assert.equal(forbiddenRes.status, 403);

    // 3. Admin appoints Teacher A as Chairman effective 2026-03-01
    const appointARes = await fetch(`${baseUrl}/api/portal/departments/PHY/appoint-chairman`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        teacherUserId: teacherA.id,
        effectiveDate: '2026-03-01',
        previousStartedAt: '2024-01-15',
        demotePreviousChairman: true,
        note: 'Order #101',
      }),
    });
    assert.equal(appointARes.status, 200);
    const appointAJson = (await appointARes.json()) as {
      department: {
        chairmanName: string;
        chairmanSince?: string;
        chairmanHistory?: Array<{ name: string; startedAt?: string; endedAt: string }>;
      };
      appointedUser: { role: string };
    };
    assert.equal(appointAJson.appointedUser.role, 'chairman');
    assert.equal(appointAJson.department.chairmanName, teacherA.name);
    assert.equal(appointAJson.department.chairmanSince, '2026-03-01');
    assert.equal(appointAJson.department.chairmanHistory?.[0]?.name, originalDeptSnapshot.chairmanName);
    assert.equal(appointAJson.department.chairmanHistory?.[0]?.startedAt, '2024-01-15');
    assert.equal(appointAJson.department.chairmanHistory?.[0]?.endedAt, '2026-03-01');

    // 4. Admin appoints Teacher B effective 2026-11-27 -> Teacher A is demoted & archived with dates
    const appointBRes = await fetch(`${baseUrl}/api/portal/departments/PHY/appoint-chairman`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        teacherUserId: teacherB.id,
        effectiveDate: '2026-11-27',
        demotePreviousChairman: true,
        note: 'Order #202',
      }),
    });
    assert.equal(appointBRes.status, 200);
    const appointBJson = (await appointBRes.json()) as {
      department: {
        chairmanName: string;
        chairmanSince?: string;
        chairmanHistory?: Array<{ name: string; startedAt?: string; endedAt: string }>;
      };
      appointedUser: { role: string };
      demotedChairmen: Array<{ id: string; role: string }>;
    };
    assert.equal(appointBJson.appointedUser.role, 'chairman');
    assert.equal(appointBJson.department.chairmanName, teacherB.name);
    assert.equal(appointBJson.department.chairmanSince, '2026-11-27');
    assert.equal(appointBJson.demotedChairmen[0]?.id, teacherA.id);
    assert.equal(appointBJson.demotedChairmen[0]?.role, 'teacher');
    assert.equal(appointBJson.department.chairmanHistory?.[0]?.name, teacherA.name);
    assert.equal(appointBJson.department.chairmanHistory?.[0]?.startedAt, '2026-03-01');
    assert.equal(appointBJson.department.chairmanHistory?.[0]?.endedAt, '2026-11-27');
  } finally {
    await pustRepo.updateDepartment(dept.id, {
      chairmanName: originalDeptSnapshot.chairmanName,
      chairmanSince: originalDeptSnapshot.chairmanSince,
      chairmanProfile: originalDeptSnapshot.chairmanProfile,
      chairmanHistory: originalDeptSnapshot.chairmanHistory,
    });
    if (createdOfficerId) await pustRepo.deleteUser(createdOfficerId);
    await pustRepo.deleteUser(teacherA.id);
    await pustRepo.deleteUser(teacherB.id);
    await pustRepo.deleteUser(adminUser.id);
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('admin action fixes: deleted-user JWT rejection, VC notice deletion, and PATCH user role/student sync', async () => {
  const app = await getApiApp();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const suffix = Date.now();
  const adminUser = await pustRepo.createUser({
    name: 'Admin Action Tester',
    email: `admin.actions.${suffix}@pust.ac.bd`,
    passwordHash: hashPassword('AdminPass#1'),
    role: 'admin',
    approvalStatus: 'approved',
    departmentCode: 'ADMIN',
    academicId: `PUST-ADMIN-ACT-${suffix}`,
    hallAffiliation: 'Administrative Building',
  });

  const vcUser = await pustRepo.createUser({
    name: 'VC Notice Tester',
    email: `vc.actions.${suffix}@pust.ac.bd`,
    passwordHash: hashPassword('VcPass#123'),
    role: 'vc',
    approvalStatus: 'approved',
    departmentCode: 'VC',
    academicId: `PUST-VC-ACT-${suffix}`,
    hallAffiliation: 'Administrative Building',
  });

  const reusedEmail = `reused.acct.${suffix}@pust.ac.bd`;
  const deletedUser = await pustRepo.createUser({
    name: 'Soon Deleted Teacher',
    email: reusedEmail,
    passwordHash: hashPassword('TempPass#1'),
    role: 'teacher',
    approvalStatus: 'approved',
    departmentCode: 'CSE',
    academicId: `PUST-DEL-${suffix}`,
    hallAffiliation: 'Academic Building',
    assignedCourses: ['CSE-1101'],
    assignedSessions: ['2024-25'],
  });
  const deletedUserCookie = `pust_token=${encodeURIComponent(signAuthToken(deletedUser))}`;
  const adminCookie = `pust_token=${encodeURIComponent(signAuthToken(adminUser))}`;
  const vcCookie = `pust_token=${encodeURIComponent(signAuthToken(vcUser))}`;

  let replacementUserId: string | null = null;
  let promotedUserId: string | null = null;

  try {
    // 1. Delete user via admin endpoint, recreate another account with same email, and ensure old JWT is rejected
    const delRes = await fetch(`${baseUrl}/api/portal/users/${encodeURIComponent(deletedUser.id)}`, {
      method: 'DELETE',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        Cookie: adminCookie,
      },
    });
    assert.equal(delRes.status, 200);

    const replacementUser = await pustRepo.createUser({
      name: 'New User Same Email',
      email: reusedEmail,
      passwordHash: hashPassword('Replacement#1'),
      role: 'admin',
      approvalStatus: 'approved',
      departmentCode: 'ADMIN',
      academicId: `PUST-REP-${suffix}`,
      hallAffiliation: 'Administrative Building',
    });
    replacementUserId = replacementUser.id;

    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: deletedUserCookie },
    });
    assert.equal(meRes.status, 200);
    const meJson = (await meRes.json()) as { user: unknown };
    assert.equal(meJson.user, null);

    const protectedRes = await fetch(`${baseUrl}/api/portal/users`, {
      headers: { Cookie: deletedUserCookie },
    });
    assert.equal(protectedRes.status, 401);

    // 2. VC can create and delete a notice
    const createNoticeRes = await fetch(`${baseUrl}/api/notices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Cookie: vcCookie,
      },
      body: JSON.stringify({
        referenceNo: `PUST/VC/${suffix}`,
        title: 'VC Office Regression Notice',
        category: 'NOC & Orders',
        departmentCode: 'ALL',
        boardScope: 'central',
        visibility: 'public',
        summary: 'Summary for VC notice deletion regression check.',
        body: 'Full body text for VC notice deletion regression check.',
      }),
    });
    assert.equal(createNoticeRes.status, 201);
    const createdNoticeJson = (await createNoticeRes.json()) as { notice: { id: string } };

    const deleteNoticeRes = await fetch(
      `${baseUrl}/api/notices/${encodeURIComponent(createdNoticeJson.notice.id)}`,
      {
        method: 'DELETE',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          Cookie: vcCookie,
        },
      }
    );
    assert.equal(deleteNoticeRes.status, 200);

    // 3. PATCH /users/:id clears teacher assignments on role change and upserts/syncs StudentRecord
    const targetTeacher = await pustRepo.createUser({
      name: 'Role Transition User',
      email: `transition.${suffix}@pust.ac.bd`,
      passwordHash: hashPassword('Transition#1'),
      role: 'teacher',
      approvalStatus: 'approved',
      departmentCode: 'CSE',
      academicId: `PUST-TRN-${suffix}`,
      hallAffiliation: 'Academic Building',
      assignedCourses: ['CSE-3101'],
      assignedSessions: ['2022-23'],
    });
    promotedUserId = targetTeacher.id;

    const updatedAcademicId = `2501${String(suffix).slice(-4)}`;
    const patchToStudentRes = await fetch(
      `${baseUrl}/api/portal/users/${encodeURIComponent(targetTeacher.id)}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          Cookie: adminCookie,
        },
        body: JSON.stringify({
          role: 'student',
          academicId: updatedAcademicId,
          session: '2025-26',
          hallAffiliation: 'July 06 Hall (Male Hall 1)',
        }),
      }
    );
    assert.equal(patchToStudentRes.status, 200);
    const patchedJson = (await patchToStudentRes.json()) as {
      user: {
        role: string;
        academicId: string;
        assignedCourses?: string[];
        assignedSessions?: string[];
      };
    };
    assert.equal(patchedJson.user.role, 'student');
    assert.deepEqual(patchedJson.user.assignedCourses, []);
    assert.deepEqual(patchedJson.user.assignedSessions, []);

    const syncedStudent = await pustRepo.findStudentByAcademicId(updatedAcademicId);
    assert.ok(syncedStudent);
    assert.equal(syncedStudent.userId, targetTeacher.id);
    assert.equal(syncedStudent.academicId, updatedAcademicId);
    assert.equal(syncedStudent.session, '2025-26');
  } finally {
    if (replacementUserId) await pustRepo.deleteUser(replacementUserId);
    if (promotedUserId) await pustRepo.deleteUser(promotedUserId);
    await pustRepo.deleteUser(vcUser.id);
    await pustRepo.deleteUser(adminUser.id);
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

