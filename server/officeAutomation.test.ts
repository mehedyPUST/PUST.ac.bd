import test from 'node:test';
import assert from 'node:assert/strict';
import { pustRepo } from './db';
import {
  autoClearHallDueIfEnabled,
  autoEvaluateCertificateApplication,
  autoIssueAdmitCardIfEligible,
  autoIssueLibraryCardAfterChairmanSeal,
  buildOfficeFlowOverview,
  runAutomatedOfficeSweep,
} from './officeAutomation';
import type { JwtClaims } from './auth';
import type { ClearanceOfficeKey, OfficeClearanceState } from '../src/types/pust';

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
