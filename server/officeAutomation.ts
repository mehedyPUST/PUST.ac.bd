import crypto from 'node:crypto';
import type { JwtClaims } from './auth';
import { pustRepo } from './db';
import type {
  AutomationOverviewResponse,
  AutomationSweepAction,
  AutomationSweepReport,
  CertificateApplicationRecord,
  ClearanceOfficeKey,
  ExamApplicationRecord,
  HallDueRecord,
  LibraryCardRecord,
  OfficeClearanceState,
  OfficeFlowItem,
  OfficeFlowType,
  StudentReadinessSummary,
} from '../src/types/pust';

export function isHallOfficerAllowed(authUser: JwtClaims, hallName: string): boolean {
  if (authUser.role !== 'hall') return true;
  const aff = authUser.hallAffiliation?.trim();
  if (!aff || aff === 'All Halls' || aff === 'Academic Block' || aff === 'Administrative Building') {
    return true;
  }
  return aff === hallName;
}

export async function evaluateStudentCrossOfficeStanding(
  academicId: string
): Promise<StudentReadinessSummary | null> {
  const stu = await pustRepo.findStudentByAcademicId(academicId);
  if (!stu) return null;

  const [hallDues, libBorrows, libCards] = await Promise.all([
    pustRepo.listHallDues(),
    pustRepo.listLibraryBorrows(),
    pustRepo.listLibraryCards(),
  ]);

  const unpaidDues = hallDues.filter(
    (d) => d.academicId === academicId && d.status !== 'Cleared'
  );
  const activeBorrows = libBorrows.filter(
    (b) => b.academicId === academicId && b.status === 'Borrowed'
  );
  const activeCards = libCards.filter(
    (c) => c.academicId === academicId && c.status === 'Active'
  );

  const hallCleared = unpaidDues.length === 0;
  const libraryCleared = activeBorrows.length === 0;
  const proctorCleared = stu.disciplinaryStatus === 'Clear';
  const academicComplete = stu.completedSemesters >= 8 && stu.allResultsPublished;

  return {
    academicId: stu.academicId,
    approvalStatus: stu.approvalStatus,
    hallCleared,
    unpaidHallDuesCount: unpaidDues.length,
    hallSeatAssigned: stu.seatNumber || 'Unassigned',
    libraryCleared,
    activeBorrowsCount: activeBorrows.length,
    hasActiveLibraryCard: activeCards.length > 0,
    proctorCleared,
    disciplinaryStatus: stu.disciplinaryStatus,
    completedSemesters: stu.completedSemesters,
    allResultsPublished: stu.allResultsPublished,
    graduationReady: hallCleared && libraryCleared && proctorCleared && academicComplete,
  };
}

export async function autoClearHallDueIfEnabled(
  due: HallDueRecord,
  gatewayCode: string,
  transactionId: string,
  receiptNo: string
): Promise<{ due: HallDueRecord; autoCleared: boolean }> {
  const rules = await pustRepo.getAutomationConfig();
  const nowDate = new Date().toISOString().slice(0, 10);

  if (!rules.autoClearPaidHallDues) {
    const submitted = await pustRepo.updateHallDue(due.id, {
      paymentMethod: gatewayCode,
      paymentRef: transactionId,
      receiptNo,
      paidAt: nowDate,
      status: 'Payment Submitted',
    });
    return { due: submitted || due, autoCleared: false };
  }

  const clearanceRef = `PUST-HALL-CLR-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const cleared = await pustRepo.updateHallDue(due.id, {
    paymentMethod: gatewayCode,
    paymentRef: transactionId,
    receiptNo,
    paidAt: nowDate,
    status: 'Cleared',
    clearanceRef,
    clearedAt: nowDate,
    clearedBy: 'Automated Hall Clearance Engine',
  });

  await pustRepo.logAudit(
    'Automated Office Flow',
    'hall',
    'Auto-cleared Hall Due on verified gateway payment',
    `${due.academicId} · ${clearanceRef}`
  );

  return { due: cleared || due, autoCleared: true };
}

export async function autoIssueLibraryCardAfterChairmanSeal(
  applicationId: string
): Promise<{ card: LibraryCardRecord | null; autoIssued: boolean }> {
  const rules = await pustRepo.getAutomationConfig();
  if (!rules.autoIssueSealedLibraryCards) {
    return { card: null, autoIssued: false };
  }

  const apps = await pustRepo.listLibraryApplications();
  const target = apps.find((a) => a.id === applicationId);
  if (!target || target.status !== 'forwarded_to_library' || !target.chairmanSeal) {
    return { card: null, autoIssued: false };
  }

  const existingCard = (await pustRepo.listLibraryCards()).find(
    (c) => c.academicId === target.academicId && c.status === 'Active'
  );
  if (existingCard) {
    return { card: existingCard, autoIssued: false };
  }

  await pustRepo.updateLibraryApplication(target.id, {
    status: 'approved',
    libraryNote: 'Auto-verified Chairman SHA-256 JSON seal & activated Digital Library Card.',
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
    verificationHash: cardHash,
    issuedAt: new Date().toISOString().slice(0, 10),
    validUntil: '2028-12-31',
    status: 'Active',
  });

  await pustRepo.logAudit(
    'Automated Office Flow',
    'library',
    'Auto-issued Digital Library Card from Chairman seal',
    card.digitalCardNo
  );

  return { card, autoIssued: true };
}

export async function autoIssueAdmitCardIfEligible(
  application: ExamApplicationRecord
): Promise<{ application: ExamApplicationRecord; autoIssued: boolean; holdReason?: string }> {
  const rules = await pustRepo.getAutomationConfig();
  if (!rules.autoIssueAdmitCardsOnPay) {
    return { application, autoIssued: false };
  }
  if (application.paymentStatus !== 'Paid' || application.verificationStatus === 'Approved') {
    return { application, autoIssued: false };
  }

  const standing = await evaluateStudentCrossOfficeStanding(application.academicId);
  if (standing && !standing.hallCleared) {
    return {
      application,
      autoIssued: false,
      holdReason: `${standing.unpaidHallDuesCount} uncleared hall due(s) remaining.`,
    };
  }
  if (standing && !standing.proctorCleared) {
    return {
      application,
      autoIssued: false,
      holdReason: `Proctorial standing is "${standing.disciplinaryStatus}" — Chairman review required.`,
    };
  }

  const admitCardNo =
    application.admitCardNo ||
    `ADMIT-${application.departmentCode}-${application.academicId}-${application.semester}`;
  const updated = await pustRepo.updateExamApplication(application.id, {
    verificationStatus: 'Approved',
    admitCardNo,
    admitCardIssuedAt: new Date().toISOString().slice(0, 10),
  });

  await pustRepo.logAudit(
    'Automated Office Flow',
    'chairman',
    'Auto-issued Examination Admit Card on payment & clearance check',
    admitCardNo
  );

  return { application: updated || application, autoIssued: true };
}

export async function autoFinalizeCertificateIfReady(
  app: CertificateApplicationRecord,
  actorLabel = 'Automated Office Flow'
): Promise<{ application: CertificateApplicationRecord; issued: boolean }> {
  const rules = await pustRepo.getAutomationConfig();
  const keys: ClearanceOfficeKey[] = ['chairman', 'hall', 'library', 'proctor'];
  const allFourApproved = keys.every((k) => app.clearances[k].status === 'approved');

  if (!allFourApproved) {
    return { application: app, issued: false };
  }

  if (!rules.autoIssueReadyCertificates) {
    if (app.finalAdminStatus !== 'pending_admin' && app.finalAdminStatus !== 'approved') {
      const updated = await pustRepo.updateCertificateApplication(app.id, {
        finalAdminStatus: 'pending_admin',
      });
      return { application: updated || app, issued: false };
    }
    return { application: app, issued: false };
  }

  if (app.finalAdminStatus === 'approved' && app.certificateSerial) {
    return { application: app, issued: false };
  }

  const serial =
    app.certificateSerial ||
    `PUST-CERT-${app.departmentCode}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const certHash =
    app.verificationHash ||
    `SHA256-CERT-${crypto
      .createHash('sha256')
      .update(`${serial}:${app.academicId}`)
      .digest('hex')
      .slice(0, 10)
      .toUpperCase()}`;

  const updated = await pustRepo.updateCertificateApplication(app.id, {
    finalAdminStatus: 'approved',
    adminNote: 'All 4 office clearances verified. Digital credential auto-issued.',
    certificateSerial: serial,
    verificationHash: certHash,
    issuedAt: new Date().toISOString().slice(0, 10),
    physicalCollected: app.physicalCollected ?? false,
  });

  await pustRepo.logAudit(
    actorLabel,
    'admin',
    'Auto-issued Digital Certificate after 4-office clearance',
    serial
  );

  return { application: updated || app, issued: true };
}

export async function autoEvaluateCertificateApplication(
  appId: string
): Promise<{ application: CertificateApplicationRecord | null; clearedOffices: ClearanceOfficeKey[]; autoIssued: boolean }> {
  const rules = await pustRepo.getAutomationConfig();
  const apps = await pustRepo.listCertificateApplications();
  const app = apps.find((a) => a.id === appId);
  if (!app) return { application: null, clearedOffices: [], autoIssued: false };
  if (!rules.autoVerifyCleanCertOffices) {
    return { application: app, clearedOffices: [], autoIssued: false };
  }

  const standing = await evaluateStudentCrossOfficeStanding(app.academicId);
  if (!standing) return { application: app, clearedOffices: [], autoIssued: false };

  const now = new Date().toISOString();
  const nextClearances: Record<ClearanceOfficeKey, OfficeClearanceState> = {
    chairman: { ...app.clearances.chairman, history: [...app.clearances.chairman.history] },
    hall: { ...app.clearances.hall, history: [...app.clearances.hall.history] },
    library: { ...app.clearances.library, history: [...app.clearances.library.history] },
    proctor: { ...app.clearances.proctor, history: [...app.clearances.proctor.history] },
  };
  const clearedOffices: ClearanceOfficeKey[] = [];

  const applyAutoOffice = (
    key: ClearanceOfficeKey,
    eligible: boolean,
    passNote: string,
    holdNote: string
  ) => {
    const state = nextClearances[key];
    if (state.status !== 'pending') return;
    if (eligible) {
      state.status = 'approved';
      state.note = passNote;
      state.updatedBy = 'Automated Office Flow';
      state.updatedAt = now;
      state.history.push({
        action: 'approved',
        note: passNote,
        actor: 'Automated Office Flow',
        timestamp: now,
      });
      clearedOffices.push(key);
    } else {
      state.note = holdNote;
    }
  };

  applyAutoOffice(
    'chairman',
    standing.completedSemesters >= 8 && standing.allResultsPublished && standing.approvalStatus === 'approved',
    'Auto-verified: 8/8 academic semesters completed and departmental standing clear.',
    'Awaiting manual Department Chairman review.'
  );
  applyAutoOffice(
    'hall',
    standing.hallCleared,
    'Auto-cleared: Zero outstanding residential hall dues verified.',
    `Held: ${standing.unpaidHallDuesCount} unpaid residential hall due(s) detected.`
  );
  applyAutoOffice(
    'library',
    standing.libraryCleared,
    'Auto-cleared: Zero unreturned or overdue Central Library books verified.',
    `Held: ${standing.activeBorrowsCount} unreturned library book loan(s) on record.`
  );
  applyAutoOffice(
    'proctor',
    standing.proctorCleared,
    'Auto-cleared: Clean proctorial and disciplinary record verified.',
    `Held: Proctorial standing is "${standing.disciplinaryStatus}".`
  );

  const allFourApproved = (['chairman', 'hall', 'library', 'proctor'] as ClearanceOfficeKey[]).every(
    (k) => nextClearances[k].status === 'approved'
  );

  let updated = await pustRepo.updateCertificateApplication(app.id, {
    clearances: nextClearances,
    finalAdminStatus: allFourApproved ? 'pending_admin' : 'waiting_offices',
  });

  if (clearedOffices.length > 0) {
    await pustRepo.logAudit(
      'Automated Office Flow',
      'admin',
      `Auto-cleared ${clearedOffices.join(', ')} office(s) for certificate`,
      app.academicId
    );
  }

  let autoIssued = false;
  if (updated && allFourApproved) {
    const fin = await autoFinalizeCertificateIfReady(updated);
    updated = fin.application;
    autoIssued = fin.issued;
  }

  return { application: updated, clearedOffices, autoIssued };
}

export async function buildOfficeFlowOverview(
  authUser: JwtClaims
): Promise<AutomationOverviewResponse> {
  const [
    rules,
    users,
    libApps,
    libCards,
    libBorrows,
    hallCirculars,
    hallApps,
    hallDues,
    examApps,
    examResults,
    certApps,
    inquiries,
    students,
    auditLogs,
  ] = await Promise.all([
    pustRepo.getAutomationConfig(),
    pustRepo.listUsers(),
    pustRepo.listLibraryApplications(),
    pustRepo.listLibraryCards(),
    pustRepo.listLibraryBorrows(),
    pustRepo.listHallCirculars(),
    pustRepo.listHallApplications(),
    pustRepo.listHallDues(),
    pustRepo.listExamApplications(),
    pustRepo.listExamResults(),
    pustRepo.listCertificateApplications(),
    pustRepo.listInquiries(),
    pustRepo.listStudents(),
    pustRepo.listAuditLogs(),
  ]);

  const role = authUser.role;
  const dept = authUser.departmentCode;
  const studentByAcademicId = new Map(students.map((s) => [s.academicId, s]));
  const queueItems: OfficeFlowItem[] = [];

  // 1. Account approvals (Admin & Chairman)
  if (role === 'admin' || role === 'chairman') {
    for (const u of users) {
      if (u.approvalStatus !== 'pending') continue;
      if (role === 'chairman' && ((u.role !== 'student' && u.role !== 'teacher') || u.departmentCode !== dept)) {
        continue;
      }
      queueItems.push({
        id: `flow-user-${u.id}`,
        targetId: u.id,
        flowType: 'user_approval',
        officeLabel: u.role === 'student' || u.role === 'teacher' ? `${u.departmentCode} Chairman` : 'Admin Office',
        title: `Approve ${u.role.toUpperCase()} Account — ${u.name}`,
        subtitle: `${u.email} · ID ${u.academicId} · ${u.departmentCode}`,
        targetRef: u.academicId,
        departmentCode: u.departmentCode,
        stage: 'Pending Account Verification',
        eligibility: 'ready',
        eligibilityReason: 'Registration details & institutional credentials ready for approval.',
        actionLabel: 'Approve Account',
        portalTab: 'governance',
        createdAt: u.createdAt,
      });
    }
  }

  // 2. Library Chairman Seals
  if (role === 'chairman' || role === 'admin') {
    for (const app of libApps) {
      if (app.status !== 'pending_chairman') continue;
      if (role === 'chairman' && app.departmentCode !== dept) continue;
      const stu = studentByAcademicId.get(app.academicId);
      const blocked = stu && stu.disciplinaryStatus !== 'Clear';
      queueItems.push({
        id: `flow-libseal-${app.id}`,
        targetId: app.id,
        flowType: 'library_seal',
        officeLabel: `${app.departmentCode} Chairman`,
        title: `Library JSON Seal — ${app.studentName}`,
        subtitle: `ID ${app.academicId} · Session ${app.session}`,
        targetRef: app.academicId,
        departmentCode: app.departmentCode,
        stage: 'Awaiting Chairman Seal',
        eligibility: blocked ? 'held' : 'ready',
        eligibilityReason: blocked
          ? `Held: Student disciplinary standing is "${stu.disciplinaryStatus}".`
          : rules.autoIssueSealedLibraryCards
          ? 'Ready: Applying seal will auto-verify & issue Digital Library Card.'
          : 'Ready: Department enrollment verified.',
        actionLabel: rules.autoIssueSealedLibraryCards ? 'Seal & Auto-Issue Card' : 'Apply Seal & Forward',
        portalTab: 'library',
        createdAt: app.createdAt,
      });
    }
  }

  // 3. Library Verification -> Digital Card
  if (role === 'library' || role === 'admin') {
    for (const app of libApps) {
      if (app.status !== 'forwarded_to_library') continue;
      const hasCard = libCards.some((c) => c.academicId === app.academicId && c.status === 'Active');
      queueItems.push({
        id: `flow-libverify-${app.id}`,
        targetId: app.id,
        flowType: 'library_verify',
        officeLabel: 'Central Library',
        title: `Issue Library Card — ${app.studentName}`,
        subtitle: `ID ${app.academicId} · ${app.departmentCode} · Chairman Seal Signed`,
        targetRef: app.academicId,
        departmentCode: app.departmentCode,
        stage: 'Forwarded with Seal',
        eligibility: hasCard || !app.chairmanSeal ? 'held' : 'ready',
        eligibilityReason: hasCard
          ? 'Held: Active Digital Library Card already issued for this student.'
          : !app.chairmanSeal
          ? 'Held: Missing Department Chairman seal.'
          : 'Ready: SHA-256 Chairman Seal verified.',
        actionLabel: 'Verify & Issue Card',
        portalTab: 'library',
        createdAt: app.createdAt,
      });
    }
  }

  // 4. Hall Seat Allotments & Paid Hall Dues Clearance
  if (role === 'hall' || role === 'admin') {
    for (const app of hallApps) {
      if (app.status !== 'pending') continue;
      if (!isHallOfficerAllowed(authUser, app.hallName)) continue;
      const circ = hallCirculars.find((c) => c.id === app.circularId);
      const hasVacancy = Boolean(circ && circ.vacantSeats > 0);
      queueItems.push({
        id: `flow-hallseat-${app.id}`,
        targetId: app.id,
        flowType: 'hall_seat',
        officeLabel: app.hallName,
        title: `Hall Seat Allotment — ${app.studentName}`,
        subtitle: `ID ${app.academicId} (${app.departmentCode}) · ${circ?.vacantSeats ?? 0} vacant seat(s)`,
        targetRef: app.academicId,
        departmentCode: app.departmentCode,
        stage: 'Pending Seat Allotment',
        eligibility: hasVacancy ? 'ready' : 'held',
        eligibilityReason: hasVacancy
          ? 'Ready: Circular has vacant seats available for automated allotment.'
          : 'Held: Zero vacant seats remain in this circular.',
        actionLabel: 'Auto-Allot Seat',
        portalTab: 'halls',
        createdAt: app.createdAt,
      });
    }

    for (const due of hallDues) {
      if (due.status !== 'Payment Submitted') continue;
      if (!isHallOfficerAllowed(authUser, due.hallName)) continue;
      queueItems.push({
        id: `flow-halldue-${due.id}`,
        targetId: due.id,
        flowType: 'hall_due',
        officeLabel: due.hallName,
        title: `Issue Hall Clearance — ${due.studentName}`,
        subtitle: `${due.feeTitle} · BDT ${due.amountBdt.toLocaleString()} · Ref ${due.paymentRef || 'Verified'}`,
        targetRef: due.academicId,
        stage: 'Payment Submitted',
        eligibility: 'ready',
        eligibilityReason: 'Ready: Fee payment submitted and awaiting Hall clearance certificate.',
        actionLabel: 'Issue Clearance',
        portalTab: 'halls',
        createdAt: due.paidAt || new Date().toISOString(),
      });
    }
  }

  // 5. Examination Admit Cards & Draft Results
  if (role === 'chairman' || role === 'admin') {
    for (const app of examApps) {
      if (app.verificationStatus !== 'Pending Chairman Verification') continue;
      if (role === 'chairman' && app.departmentCode !== dept) continue;
      const unpaid = hallDues.filter(
        (d) => d.academicId === app.academicId && d.status !== 'Cleared'
      );
      const stu = studentByAcademicId.get(app.academicId);
      const isPaid = app.paymentStatus === 'Paid';
      const proctorHold = stu && stu.disciplinaryStatus !== 'Clear';
      const heldReason = !isPaid
        ? 'Waiting for student examination fee payment.'
        : unpaid.length > 0
        ? `Held: ${unpaid.length} unpaid residential hall due(s).`
        : proctorHold
        ? `Held: Disciplinary status "${stu.disciplinaryStatus}".`
        : 'Ready: Fee paid, hall dues cleared, and conduct clean.';

      queueItems.push({
        id: `flow-examadmit-${app.id}`,
        targetId: app.id,
        flowType: 'exam_admit',
        officeLabel: `${app.departmentCode} Exam Desk`,
        title: `Admit Card Approval — ${app.studentName}`,
        subtitle: `${app.examTitle} · ${app.formReference} · Payment ${app.paymentStatus}`,
        targetRef: app.formReference,
        departmentCode: app.departmentCode,
        stage: isPaid ? 'Paid · Pending Admit Card' : 'Awaiting Student Payment',
        eligibility: isPaid && unpaid.length === 0 && !proctorHold ? 'ready' : 'held',
        eligibilityReason: heldReason,
        actionLabel: 'Approve & Issue Admit',
        portalTab: 'exams',
        createdAt: app.createdAt,
      });
    }

    for (const res of examResults) {
      if (res.published) continue;
      if (role === 'chairman') {
        if (res.departmentCode !== dept) continue;
        if (res.status === 'pending_admin') continue;
      }
      const isForwardedAdmin = res.status === 'pending_admin';
      queueItems.push({
        id: `flow-examres-${res.id}`,
        targetId: res.id,
        flowType: 'exam_result',
        officeLabel: isForwardedAdmin ? 'Admin Office · Exam Cell' : `${res.departmentCode} Chairman`,
        title: `Publish Result — ${res.studentName} (Sem ${res.semester})`,
        subtitle: `ID ${res.academicId} · SGPA ${res.sgpa.toFixed(2)} · Entered by ${res.enteredBy}${
          res.committeeTitle ? ` (${res.committeeTitle})` : ''
        }`,
        targetRef: res.academicId,
        departmentCode: res.departmentCode,
        stage: isForwardedAdmin ? 'Forwarded to Admin Office' : 'Awaiting Chairman Verification',
        eligibility: 'ready',
        eligibilityReason: 'Ready: Publishing syncs cumulative CGPA, semester promotion & notice.',
        actionLabel: 'Publish & Notify',
        portalTab: 'exams',
        createdAt: res.forwardedAt || res.publishedAt,
      });
    }
  }

  // 6. Certificate 4-Office Clearances & Final Issuance
  const myOfficeRole: ClearanceOfficeKey | null = ['chairman', 'hall', 'library', 'proctor'].includes(role)
    ? (role as ClearanceOfficeKey)
    : null;

  for (const cert of certApps) {
    if (cert.finalAdminStatus === 'approved' || cert.finalAdminStatus === 'rejected') continue;

    if (myOfficeRole) {
      if (myOfficeRole === 'chairman' && cert.departmentCode !== dept) continue;
      const stu = studentByAcademicId.get(cert.academicId);
      if (myOfficeRole === 'hall' && stu && !isHallOfficerAllowed(authUser, stu.hallName)) continue;

      const state = cert.clearances[myOfficeRole];
      if (state.status !== 'approved') {
        let heldMsg = '';
        if (myOfficeRole === 'hall') {
          const unpaid = hallDues.filter(
            (d) => d.academicId === cert.academicId && d.status !== 'Cleared'
          );
          if (unpaid.length > 0) heldMsg = `${unpaid.length} unpaid hall due(s) pending.`;
        } else if (myOfficeRole === 'library') {
          const loans = libBorrows.filter(
            (b) => b.academicId === cert.academicId && b.status === 'Borrowed'
          );
          if (loans.length > 0) heldMsg = `${loans.length} unreturned library book(s) on loan.`;
        } else if (myOfficeRole === 'proctor') {
          if (stu && stu.disciplinaryStatus !== 'Clear') {
            heldMsg = `Disciplinary standing is "${stu.disciplinaryStatus}".`;
          }
        }

        queueItems.push({
          id: `flow-certoff-${cert.id}`,
          targetId: cert.id,
          flowType: 'cert_office',
          officeLabel: state.officeLabel,
          title: `${myOfficeRole.toUpperCase()} Certificate Clearance — ${cert.studentName}`,
          subtitle: `${cert.certificateType} · ID ${cert.academicId} (${cert.departmentCode})`,
          targetRef: cert.academicId,
          departmentCode: cert.departmentCode,
          stage: `Office Checkpoint (${state.status.toUpperCase()})`,
          eligibility: heldMsg ? 'held' : 'ready',
          eligibilityReason: heldMsg
            ? `Held: ${heldMsg}`
            : 'Ready: Automated prerequisite check passed.',
          actionLabel: `Clear (${myOfficeRole.toUpperCase()})`,
          portalTab: 'certificates',
          createdAt: cert.createdAt,
        });
      }
    }

    if (role === 'admin') {
      const allCleared = (['chairman', 'hall', 'library', 'proctor'] as ClearanceOfficeKey[]).every(
        (k) => cert.clearances[k].status === 'approved'
      );
      const pendingOffices = (['chairman', 'hall', 'library', 'proctor'] as ClearanceOfficeKey[]).filter(
        (k) => cert.clearances[k].status !== 'approved'
      );
      queueItems.push({
        id: `flow-certfinal-${cert.id}`,
        targetId: cert.id,
        flowType: 'cert_final',
        officeLabel: 'Admin Final Desk',
        title: `Final Credential Issuance — ${cert.studentName}`,
        subtitle: `${cert.certificateType} · ID ${cert.academicId} (${cert.departmentCode})`,
        targetRef: cert.academicId,
        departmentCode: cert.departmentCode,
        stage: allCleared
          ? '4/4 Offices Cleared · Ready'
          : `Waiting (${pendingOffices.join(', ')})`,
        eligibility: 'ready',
        eligibilityReason: allCleared
          ? 'Ready: All 4 offices approved — ready to issue serial & cryptographic hash.'
          : `Auto-evaluates & clears eligible offices (${pendingOffices.join(', ')}), then issues if clean.`,
        actionLabel: allCleared ? 'Issue Certificate' : 'Run Auto-Clearance',
        portalTab: 'certificates',
        createdAt: cert.createdAt,
      });
    }
  }

  // 7. Inquiries (Admin & Registrar)
  if (role === 'admin' || role === 'registrar') {
    for (const inq of inquiries) {
      if (inq.status !== 'Received') continue;
      queueItems.push({
        id: `flow-inq-${inq.id}`,
        targetId: inq.id,
        flowType: 'inquiry',
        officeLabel: 'Registrar Admissions Desk',
        title: `Admission Inquiry — ${inq.fullName}`,
        subtitle: `${inq.programLevel} (${inq.departmentCode}) · ${inq.referenceCode}`,
        targetRef: inq.referenceCode,
        departmentCode: inq.departmentCode,
        stage: 'Received · Unreviewed',
        eligibility: 'manual',
        eligibilityReason: 'Ready for acknowledgement response or manual follow-up.',
        actionLabel: 'Acknowledge & Mark Reviewed',
        portalTab: 'governance',
        createdAt: inq.createdAt,
      });
    }
  }

  const counts = {
    total: queueItems.length,
    ready: queueItems.filter((i) => i.eligibility === 'ready').length,
    held: queueItems.filter((i) => i.eligibility === 'held').length,
    manual: queueItems.filter((i) => i.eligibility === 'manual').length,
  };

  const studentReadiness =
    role === 'student' ? await evaluateStudentCrossOfficeStanding(authUser.academicId) : null;

  return {
    rules,
    queueItems,
    counts,
    studentReadiness,
    recentAuditLogs: auditLogs.slice(0, 15),
  };
}

export async function processSingleFlowItem(
  authUser: JwtClaims,
  flowType: OfficeFlowType,
  targetId: string
): Promise<{ processed: boolean; outcome: 'processed' | 'held'; detail: string }> {
  const role = authUser.role;
  const dept = authUser.departmentCode;

  if (flowType === 'user_approval') {
    if (role !== 'admin' && role !== 'chairman') {
      throw new Error('FORBIDDEN: Only Admin or Chairman may approve accounts.');
    }
    const target = await pustRepo.findUserById(targetId);
    if (!target || target.approvalStatus !== 'pending') {
      return { processed: false, outcome: 'held', detail: 'Pending user account not found.' };
    }
    if (
      role === 'chairman' &&
      ((target.role !== 'student' && target.role !== 'teacher') || target.departmentCode !== dept)
    ) {
      throw new Error('FORBIDDEN: Chairmen may only approve Teachers and Students in their department.');
    }
    await pustRepo.updateUserApproval(target.id, 'approved');
    if (target.role === 'student') {
      const stu = await pustRepo.findStudentByAcademicId(target.academicId);
      if (stu) await pustRepo.updateStudentById(stu.id, { approvalStatus: 'approved' });
    }
    await pustRepo.logAudit(
      authUser.name,
      role,
      'Automated Flow: Approved portal account',
      `${target.name} (${target.role})`
    );
    return { processed: true, outcome: 'processed', detail: `Approved ${target.name} (${target.academicId}).` };
  }

  if (flowType === 'library_seal') {
    if (role !== 'chairman' && role !== 'admin') {
      throw new Error('FORBIDDEN: Only Department Chairman or Admin may apply library seal.');
    }
    const apps = await pustRepo.listLibraryApplications();
    const target = apps.find((a) => a.id === targetId);
    if (!target || target.status !== 'pending_chairman') {
      return { processed: false, outcome: 'held', detail: 'Library application not awaiting seal.' };
    }
    if (role === 'chairman' && target.departmentCode !== dept) {
      throw new Error('FORBIDDEN: Outside department scope.');
    }
    const stu = await pustRepo.findStudentByAcademicId(target.academicId);
    if (stu && stu.disciplinaryStatus !== 'Clear') {
      return {
        processed: false,
        outcome: 'held',
        detail: `Held due to disciplinary status "${stu.disciplinaryStatus}".`,
      };
    }

    const signedAt = new Date().toISOString();
    const verificationHash = crypto
      .createHash('sha256')
      .update(`${target.academicId}:${authUser.name}:${signedAt}`)
      .digest('hex')
      .slice(0, 16)
      .toUpperCase();

    await pustRepo.updateLibraryApplication(target.id, {
      status: 'forwarded_to_library',
      chairmanNote: 'Automated Flow: Forwarded with verified Chairman seal & signature.',
      chairmanSeal: {
        chairmanName: authUser.name,
        departmentCode: target.departmentCode,
        officialSeal: `OFFICIAL SEAL — Dept. of ${target.departmentCode}, PUST`,
        digitalSignature: authUser.name,
        signedAt,
        verificationHash,
      },
    });
    const autoCard = await autoIssueLibraryCardAfterChairmanSeal(target.id);
    return {
      processed: true,
      outcome: 'processed',
      detail: autoCard.card
        ? `Sealed & auto-issued Library Card ${autoCard.card.digitalCardNo}.`
        : `Applied Chairman seal & forwarded ${target.academicId} to Central Library.`,
    };
  }

  if (flowType === 'library_verify') {
    if (role !== 'library' && role !== 'admin') {
      throw new Error('FORBIDDEN: Only Library Office or Admin may issue cards.');
    }
    const apps = await pustRepo.listLibraryApplications();
    const target = apps.find((a) => a.id === targetId);
    if (!target || target.status !== 'forwarded_to_library' || !target.chairmanSeal) {
      return { processed: false, outcome: 'held', detail: 'Missing Chairman seal or already processed.' };
    }
    const existingCard = (await pustRepo.listLibraryCards()).find(
      (c) => c.academicId === target.academicId && c.status === 'Active'
    );
    if (existingCard) {
      return { processed: false, outcome: 'held', detail: `Active card ${existingCard.digitalCardNo} already exists.` };
    }
    await pustRepo.updateLibraryApplication(target.id, {
      status: 'approved',
      libraryNote: 'Automated Flow: Verified Chairman seal & issued Digital Library Card.',
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
      verificationHash: cardHash,
      issuedAt: new Date().toISOString().slice(0, 10),
      validUntil: '2028-12-31',
      status: 'Active',
    });
    await pustRepo.logAudit(authUser.name, role, 'Automated Flow: Issued Digital Library Card', card.digitalCardNo);
    return { processed: true, outcome: 'processed', detail: `Issued Digital Library Card ${card.digitalCardNo}.` };
  }

  if (flowType === 'hall_seat') {
    if (role !== 'hall' && role !== 'admin') {
      throw new Error('FORBIDDEN: Only Hall Provost or Admin may allot seats.');
    }
    const apps = await pustRepo.listHallApplications();
    const target = apps.find((a) => a.id === targetId);
    if (!target || target.status !== 'pending') {
      return { processed: false, outcome: 'held', detail: 'Hall application is not pending.' };
    }
    if (!isHallOfficerAllowed(authUser, target.hallName)) {
      throw new Error('FORBIDDEN: Outside hall affiliation scope.');
    }
    const circular = (await pustRepo.listHallCirculars()).find((c) => c.id === target.circularId);
    if (!circular || circular.vacantSeats <= 0) {
      return { processed: false, outcome: 'held', detail: 'Zero vacant seats remain in circular.' };
    }
    const roomNo = 100 + ((circular.vacantSeats % 40) + 1);
    const bedCode = ['Bed A', 'Bed B', 'Bed C', 'Bed D'][circular.vacantSeats % 4];
    const assignedSeat = `Room ${roomNo} · ${bedCode}`;
    await pustRepo.updateHallCircular(circular.id, { vacantSeats: circular.vacantSeats - 1 });
    await pustRepo.updateHallApplication(target.id, {
      status: 'accepted',
      reviewNote: 'Automated Flow: Seat allotted based on verified hall vacancy.',
      assignedSeat,
      seatHistory: [
        ...target.seatHistory,
        {
          seatNumber: assignedSeat,
          assignedAt: new Date().toISOString(),
          assignedBy: authUser.name,
          note: 'Automated hall vacancy allotment',
        },
      ],
    });
    const stu = await pustRepo.findStudentByAcademicId(target.academicId);
    if (stu) {
      await pustRepo.updateStudentById(stu.id, { hallName: target.hallName, seatNumber: assignedSeat });
    }
    await pustRepo.logAudit(authUser.name, role, 'Automated Flow: Allotted hall seat', `${target.academicId} · ${assignedSeat}`);
    return { processed: true, outcome: 'processed', detail: `Allotted ${assignedSeat} in ${target.hallName}.` };
  }

  if (flowType === 'hall_due') {
    if (role !== 'hall' && role !== 'admin') {
      throw new Error('FORBIDDEN: Only Hall Provost or Admin may clear dues.');
    }
    const target = (await pustRepo.listHallDues()).find((d) => d.id === targetId);
    if (!target || target.status !== 'Payment Submitted') {
      return { processed: false, outcome: 'held', detail: 'Hall due is not awaiting clearance.' };
    }
    if (!isHallOfficerAllowed(authUser, target.hallName)) {
      throw new Error('FORBIDDEN: Outside hall affiliation scope.');
    }
    const clearanceRef = `PUST-HALL-CLR-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    await pustRepo.updateHallDue(target.id, {
      status: 'Cleared',
      clearanceRef,
      clearedAt: new Date().toISOString().slice(0, 10),
      clearedBy: authUser.name,
    });
    await pustRepo.logAudit(authUser.name, role, 'Automated Flow: Cleared hall due', `${target.academicId} · ${clearanceRef}`);
    return { processed: true, outcome: 'processed', detail: `Issued clearance ${clearanceRef}.` };
  }

  if (flowType === 'exam_admit') {
    if (role !== 'chairman' && role !== 'admin') {
      throw new Error('FORBIDDEN: Only Chairman or Admin may approve exam admit cards.');
    }
    const target = (await pustRepo.listExamApplications()).find((a) => a.id === targetId);
    if (!target || target.verificationStatus !== 'Pending Chairman Verification') {
      return { processed: false, outcome: 'held', detail: 'Exam application is not pending verification.' };
    }
    if (role === 'chairman' && target.departmentCode !== dept) {
      throw new Error('FORBIDDEN: Outside department scope.');
    }
    if (target.paymentStatus !== 'Paid') {
      return { processed: false, outcome: 'held', detail: 'Examination fee payment still Pending.' };
    }
    const standing = await evaluateStudentCrossOfficeStanding(target.academicId);
    if (standing && !standing.hallCleared) {
      return { processed: false, outcome: 'held', detail: `${standing.unpaidHallDuesCount} unpaid hall due(s).` };
    }
    if (standing && !standing.proctorCleared) {
      return { processed: false, outcome: 'held', detail: `Proctor standing "${standing.disciplinaryStatus}".` };
    }
    const admitCardNo = target.admitCardNo || `ADMIT-${target.departmentCode}-${target.academicId}-${target.semester}`;
    await pustRepo.updateExamApplication(target.id, {
      verificationStatus: 'Approved',
      admitCardNo,
      admitCardIssuedAt: new Date().toISOString().slice(0, 10),
    });
    await pustRepo.logAudit(authUser.name, role, 'Automated Flow: Approved Admit Card', admitCardNo);
    return { processed: true, outcome: 'processed', detail: `Issued Admit Card ${admitCardNo}.` };
  }

  if (flowType === 'exam_result') {
    if (role !== 'chairman' && role !== 'admin') {
      throw new Error('FORBIDDEN: Only Chairman or Admin may publish results.');
    }
    const target = (await pustRepo.listExamResults()).find((r) => r.id === targetId);
    if (!target || target.published) {
      return { processed: false, outcome: 'held', detail: 'Grade sheet already published or missing.' };
    }
    if (role === 'chairman') {
      if (target.departmentCode !== dept) {
        throw new Error('FORBIDDEN: Outside department scope.');
      }
      if (target.status === 'pending_admin') {
        return {
          processed: false,
          outcome: 'held',
          detail: 'Result has been forwarded to the Admin Office for publishing.',
        };
      }
    }
    await pustRepo.updateExamResult(target.id, {
      published: true,
      status: 'published',
      reviewedBy: authUser.name,
      publishedAt: new Date().toISOString().slice(0, 10),
    });
    const stu = await pustRepo.findStudentByAcademicId(target.academicId);
    if (stu) {
      const allResults = (await pustRepo.listExamResults()).filter(
        (r) => r.academicId === stu.academicId && (r.published || r.id === target.id)
      );
      let weighted = 0;
      let credits = 0;
      for (const r of allResults) {
        for (const c of r.courses) {
          weighted += c.gradePoint * c.credits;
          credits += c.credits;
        }
      }
      const cgpa = credits > 0 ? Number((weighted / credits).toFixed(2)) : target.sgpa;
      const promoted = target.promotionStatus.startsWith('Promoted');
      const nextCompleted = promoted
        ? Math.max(stu.completedSemesters, target.semester)
        : stu.completedSemesters;
      await pustRepo.updateStudentById(stu.id, {
        ...(promoted
          ? {
              currentSemester: Math.max(stu.currentSemester, target.semester + 1),
              completedSemesters: nextCompleted,
              ...(nextCompleted >= 8 ? { allResultsPublished: true } : {}),
            }
          : {}),
        cgpa,
      });
    }
    await pustRepo.logAudit(authUser.name, role, 'Automated Flow: Published exam result', `${target.academicId} · Sem ${target.semester}`);
    return { processed: true, outcome: 'processed', detail: `Published Sem ${target.semester} result for ${target.academicId}.` };
  }

  if (flowType === 'cert_office') {
    if (!['chairman', 'hall', 'library', 'proctor'].includes(role)) {
      throw new Error('FORBIDDEN: Restricted to clearance office roles.');
    }
    const key = role as ClearanceOfficeKey;
    const cert = (await pustRepo.listCertificateApplications()).find((c) => c.id === targetId);
    if (!cert || cert.finalAdminStatus === 'approved' || cert.finalAdminStatus === 'rejected') {
      return { processed: false, outcome: 'held', detail: 'Certificate application already finalized.' };
    }
    if (key === 'chairman' && cert.departmentCode !== dept) {
      throw new Error('FORBIDDEN: Outside department scope.');
    }
    const standing = await evaluateStudentCrossOfficeStanding(cert.academicId);
    if (key === 'hall' && standing && !standing.hallCleared) {
      return { processed: false, outcome: 'held', detail: `${standing.unpaidHallDuesCount} unpaid hall due(s).` };
    }
    if (key === 'library' && standing && !standing.libraryCleared) {
      return { processed: false, outcome: 'held', detail: `${standing.activeBorrowsCount} unreturned book(s).` };
    }
    if (key === 'proctor' && standing && !standing.proctorCleared) {
      return { processed: false, outcome: 'held', detail: `Proctor standing "${standing.disciplinaryStatus}".` };
    }

    const now = new Date().toISOString();
    const note = `Automated Flow: Verified and cleared by ${authUser.name}.`;
    const cur = cert.clearances[key];
    const nextClearances = {
      ...cert.clearances,
      [key]: {
        ...cur,
        status: 'approved' as const,
        note,
        updatedBy: authUser.name,
        updatedAt: now,
        history: [...cur.history, { action: 'approved' as const, note, actor: authUser.name, timestamp: now }],
      },
    };
    const allFour = (['chairman', 'hall', 'library', 'proctor'] as ClearanceOfficeKey[]).every(
      (k) => nextClearances[k].status === 'approved'
    );
    const updated = await pustRepo.updateCertificateApplication(cert.id, {
      clearances: nextClearances,
      finalAdminStatus: allFour ? 'pending_admin' : 'waiting_offices',
    });
    await pustRepo.logAudit(authUser.name, role, `Automated Flow: Cleared ${key} checkpoint`, cert.academicId);
    if (updated && allFour) {
      const fin = await autoFinalizeCertificateIfReady(updated, authUser.name);
      if (fin.issued) {
        return {
          processed: true,
          outcome: 'processed',
          detail: `Cleared ${key.toUpperCase()} & auto-issued ${fin.application.certificateSerial}.`,
        };
      }
    }
    return { processed: true, outcome: 'processed', detail: `Cleared ${key.toUpperCase()} for ${cert.academicId}.` };
  }

  if (flowType === 'cert_final') {
    if (role !== 'admin') {
      throw new Error('FORBIDDEN: Only Admin Office may execute final certificate issuance.');
    }
    const evaluated = await autoEvaluateCertificateApplication(targetId);
    if (!evaluated.application) {
      return { processed: false, outcome: 'held', detail: 'Certificate application not found.' };
    }
    const app = evaluated.application;
    if (app.finalAdminStatus === 'approved' && app.certificateSerial) {
      return {
        processed: true,
        outcome: 'processed',
        detail: `Issued Digital Certificate ${app.certificateSerial}.`,
      };
    }
    const pendingOffices = (['chairman', 'hall', 'library', 'proctor'] as ClearanceOfficeKey[]).filter(
      (k) => app.clearances[k].status !== 'approved'
    );
    if (pendingOffices.length === 0) {
      const serial = `PUST-CERT-${app.departmentCode}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const certHash = `SHA256-CERT-${crypto
        .createHash('sha256')
        .update(`${serial}:${app.academicId}`)
        .digest('hex')
        .slice(0, 10)
        .toUpperCase()}`;
      await pustRepo.updateCertificateApplication(app.id, {
        finalAdminStatus: 'approved',
        adminNote: 'All 4 offices cleared via Automated Office Flow.',
        certificateSerial: serial,
        verificationHash: certHash,
        issuedAt: new Date().toISOString().slice(0, 10),
      });
      await pustRepo.logAudit(authUser.name, 'admin', 'Automated Flow: Issued Digital Certificate', serial);
      return { processed: true, outcome: 'processed', detail: `Issued Digital Certificate ${serial}.` };
    }
    return {
      processed: false,
      outcome: 'held',
      detail: `Held by ${pendingOffices.join(', ')} office prerequisite check(s).`,
    };
  }

  if (flowType === 'inquiry') {
    if (role !== 'admin' && role !== 'registrar') {
      throw new Error('FORBIDDEN: Only Admin or Registrar may acknowledge inquiries.');
    }
    const updated = await pustRepo.markInquiryReviewed(targetId, {
      responseNote: 'Acknowledged by Registrar Admissions Desk via Automated Office Flow.',
      respondedBy: authUser.name,
    });
    if (!updated) return { processed: false, outcome: 'held', detail: 'Inquiry not found.' };
    await pustRepo.logAudit(authUser.name, role, 'Automated Flow: Reviewed Inquiry', updated.referenceCode);
    return { processed: true, outcome: 'processed', detail: `Reviewed inquiry ${updated.referenceCode}.` };
  }

  return { processed: false, outcome: 'held', detail: 'Unsupported office flow type.' };
}

export async function runAutomatedOfficeSweep(
  authUser: JwtClaims
): Promise<AutomationSweepReport> {
  const overview = await buildOfficeFlowOverview(authUser);
  const actions: AutomationSweepAction[] = [];
  let processedCount = 0;
  let heldCount = 0;

  for (const item of overview.queueItems) {
    if (item.eligibility === 'manual') continue;
    try {
      const result = await processSingleFlowItem(authUser, item.flowType, item.targetId);
      actions.push({
        flowType: item.flowType,
        target: `${item.title} (${item.targetRef})`,
        outcome: result.outcome,
        detail: result.detail,
      });
      if (result.outcome === 'processed') processedCount += 1;
      else heldCount += 1;
    } catch (err) {
      heldCount += 1;
      actions.push({
        flowType: item.flowType,
        target: `${item.title} (${item.targetRef})`,
        outcome: 'held',
        detail: err instanceof Error ? err.message : 'Unable to process item.',
      });
    }
  }

  await pustRepo.logAudit(
    authUser.name,
    authUser.role,
    'Executed Automated Office Flow Sweep',
    `${processedCount} processed · ${heldCount} held`
  );

  return {
    ranAt: new Date().toISOString(),
    actorName: authUser.name,
    actorRole: authUser.role,
    processedCount,
    heldCount,
    actions,
  };
}
