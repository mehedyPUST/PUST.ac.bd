import type {
  CertificateApplicationRecord,
  ClassScheduleDay,
  ClassScheduleSlot,
  CourseRecord,
  DepartmentRecord,
  ExamApplicationRecord,
  ExamResultRecord,
  HallDueRecord,
  PaymentReceiptRecord,
  StudentFeeItem,
  StudentRecord,
} from '../types/pust';

export const PUST_WEEK_DAYS: Array<{ key: ClassScheduleDay; label: string }> = [
  { key: 'Sun', label: 'Sunday' },
  { key: 'Mon', label: 'Monday' },
  { key: 'Tue', label: 'Tuesday' },
  { key: 'Wed', label: 'Wednesday' },
  { key: 'Thu', label: 'Thursday' },
];

interface TimeSlotPreset {
  day: ClassScheduleDay;
  startTime: string;
  endTime: string;
  roomSuffix: string;
}

const LECTURE_SLOT_PRESETS: TimeSlotPreset[] = [
  { day: 'Sun', startTime: '09:00', endTime: '10:30', roomSuffix: 'Room 301' },
  { day: 'Tue', startTime: '09:00', endTime: '10:30', roomSuffix: 'Room 301' },
  { day: 'Sun', startTime: '11:00', endTime: '12:30', roomSuffix: 'Room 302' },
  { day: 'Wed', startTime: '10:30', endTime: '12:00', roomSuffix: 'Room 302' },
  { day: 'Mon', startTime: '09:00', endTime: '10:30', roomSuffix: 'Room 304' },
  { day: 'Wed', startTime: '14:00', endTime: '15:30', roomSuffix: 'Room 304' },
  { day: 'Mon', startTime: '11:00', endTime: '12:30', roomSuffix: 'Room 305' },
  { day: 'Thu', startTime: '09:00', endTime: '10:30', roomSuffix: 'Room 305' },
];

const LAB_SLOT_PRESETS: TimeSlotPreset[] = [
  { day: 'Mon', startTime: '14:00', endTime: '17:00', roomSuffix: 'Lab 1' },
  { day: 'Tue', startTime: '14:00', endTime: '17:00', roomSuffix: 'Lab 2' },
  { day: 'Thu', startTime: '11:00', endTime: '14:00', roomSuffix: 'Lab 1' },
];

function dayLabelFor(day: ClassScheduleDay): string {
  return PUST_WEEK_DAYS.find((d) => d.key === day)?.label || day;
}

function isLabCourse(course: Pick<CourseRecord, 'code' | 'title' | 'credits'>): boolean {
  const titleLower = course.title.toLowerCase();
  return (
    titleLower.includes('lab') ||
    titleLower.includes('sessional') ||
    titleLower.includes('workshop') ||
    course.credits <= 1.5
  );
}

function getInstructorForCourse(
  course: CourseRecord,
  dept?: DepartmentRecord
): string {
  if (course.teacherName) return course.teacherName;
  if (dept?.facultyMembers?.length) {
    if (course.teacherEmail) {
      const matched = dept.facultyMembers.find((m) =>
        m.emails.some((e) => e.value.toLowerCase() === course.teacherEmail?.toLowerCase())
      );
      if (matched) return matched.name;
    }
    const idx = Math.abs(
      course.code.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    ) % dept.facultyMembers.length;
    return dept.facultyMembers[idx]?.name || dept.chairmanName || `${course.departmentCode} Faculty`;
  }
  return dept?.chairmanName || `${course.departmentCode} Faculty`;
}

/**
 * Derive a structured Sunday–Thursday weekly class timetable from live PUST
 * courses and department records. When courses are already scoped to the signed-in
 * student's department/semester, generates two lecture meetings per theory course
 * and one 3-hour session per lab/sessional course.
 */
export function buildStudentClassSchedules(params: {
  courses: CourseRecord[];
  departments: DepartmentRecord[];
  departmentCode?: string;
  currentSemester?: number;
  session?: string;
}): ClassScheduleSlot[] {
  const { courses, departments, departmentCode, currentSemester, session } = params;
  const targetDeptCode = departmentCode?.toUpperCase() || '';

  const deptMatched = targetDeptCode
    ? courses.filter((c) => c.departmentCode.toUpperCase() === targetDeptCode)
    : courses;

  const semesterMatched =
    currentSemester && deptMatched.some((c) => c.semester === currentSemester)
      ? deptMatched.filter((c) => c.semester === currentSemester)
      : deptMatched;

  const sessionMatched =
    session && semesterMatched.some((c) => c.session === session)
      ? semesterMatched.filter((c) => c.session === session)
      : semesterMatched;

  const activeCourses = sessionMatched.length > 0 ? sessionMatched : deptMatched;
  const slots: ClassScheduleSlot[] = [];

  if (activeCourses.length > 0) {
    let lectureIdx = 0;
    let labIdx = 0;

    for (const course of activeCourses) {
      const dept = departments.find(
        (d) => d.code.toUpperCase() === course.departmentCode.toUpperCase()
      );
      const building = dept?.building || `${course.departmentCode} Academic Block`;
      const instructor = getInstructorForCourse(course, dept);
      const lab = isLabCourse(course);

      if (lab) {
        const preset = LAB_SLOT_PRESETS[labIdx % LAB_SLOT_PRESETS.length];
        labIdx += 1;
        const labName = dept?.laboratories?.[labIdx % Math.max(1, dept.laboratories.length)];
        slots.push({
          id: `${course.id}-${preset.day}-${preset.startTime}`,
          day: preset.day,
          dayLabel: dayLabelFor(preset.day),
          startTime: preset.startTime,
          endTime: preset.endTime,
          courseCode: course.code,
          courseTitle: course.title,
          credits: course.credits,
          sessionType: 'Laboratory',
          room: labName ? `${labName}` : `${course.departmentCode} ${preset.roomSuffix}`,
          building,
          instructor,
          departmentCode: course.departmentCode,
          semester: course.semester,
          session: course.session,
        });
      } else {
        const pairBase = (lectureIdx * 2) % LECTURE_SLOT_PRESETS.length;
        const first = LECTURE_SLOT_PRESETS[pairBase];
        const second = LECTURE_SLOT_PRESETS[(pairBase + 1) % LECTURE_SLOT_PRESETS.length];
        lectureIdx += 1;

        for (const preset of [first, second]) {
          slots.push({
            id: `${course.id}-${preset.day}-${preset.startTime}`,
            day: preset.day,
            dayLabel: dayLabelFor(preset.day),
            startTime: preset.startTime,
            endTime: preset.endTime,
            courseCode: course.code,
            courseTitle: course.title,
            credits: course.credits,
            sessionType: 'Lecture',
            room: `${course.departmentCode} ${preset.roomSuffix}`,
            building,
            instructor,
            departmentCode: course.departmentCode,
            semester: course.semester,
            session: course.session,
          });
        }
      }
    }
  } else if (departments.length > 0) {
    // Public / fallback departmental reference schedule from PustContext departments
    const fallbackDept =
      (targetDeptCode
        ? departments.find((d) => d.code.toUpperCase() === targetDeptCode)
        : undefined) || departments[0];

    if (fallbackDept) {
      const code = fallbackDept.code.toUpperCase();
      const facultyList = fallbackDept.facultyMembers || [];
      const labName = fallbackDept.laboratories?.[0] || `${code} Central Lab`;
      const leadInstructor = facultyList[0]?.name || fallbackDept.chairmanName;
      const secondInstructor = facultyList[1]?.name || fallbackDept.chairmanName;
      const thirdInstructor = facultyList[2]?.name || leadInstructor;

      const referenceCourses: Array<{
        code: string;
        title: string;
        credits: number;
        sessionType: 'Lecture' | 'Laboratory';
        day: ClassScheduleDay;
        startTime: string;
        endTime: string;
        room: string;
        instructor: string;
      }> = [
        {
          code: `${code}-3101`,
          title: fallbackDept.researchFocus?.[0]
            ? `Core Theory: ${fallbackDept.researchFocus[0]}`
            : `${fallbackDept.name} Core Theory I`,
          credits: 3.0,
          sessionType: 'Lecture',
          day: 'Sun',
          startTime: '09:00',
          endTime: '10:30',
          room: `${code} Room 301`,
          instructor: leadInstructor,
        },
        {
          code: `${code}-3103`,
          title: fallbackDept.researchFocus?.[1]
            ? `Applied Methods: ${fallbackDept.researchFocus[1]}`
            : `${fallbackDept.name} Core Theory II`,
          credits: 3.0,
          sessionType: 'Lecture',
          day: 'Mon',
          startTime: '11:00',
          endTime: '12:30',
          room: `${code} Room 302`,
          instructor: secondInstructor,
        },
        {
          code: `${code}-3101`,
          title: fallbackDept.researchFocus?.[0]
            ? `Core Theory: ${fallbackDept.researchFocus[0]}`
            : `${fallbackDept.name} Core Theory I`,
          credits: 3.0,
          sessionType: 'Lecture',
          day: 'Tue',
          startTime: '09:00',
          endTime: '10:30',
          room: `${code} Room 301`,
          instructor: leadInstructor,
        },
        {
          code: `${code}-3105`,
          title: `${code} Quantitative Analysis & Design`,
          credits: 3.0,
          sessionType: 'Lecture',
          day: 'Wed',
          startTime: '10:30',
          endTime: '12:00',
          room: `${code} Room 304`,
          instructor: thirdInstructor,
        },
        {
          code: `${code}-3106`,
          title: `${labName} Sessional`,
          credits: 1.5,
          sessionType: 'Laboratory',
          day: 'Thu',
          startTime: '11:00',
          endTime: '14:00',
          room: labName,
          instructor: secondInstructor,
        },
      ];

      for (const item of referenceCourses) {
        slots.push({
          id: `ref-${code}-${item.code}-${item.day}-${item.startTime}`,
          day: item.day,
          dayLabel: dayLabelFor(item.day),
          startTime: item.startTime,
          endTime: item.endTime,
          courseCode: item.code,
          courseTitle: item.title,
          credits: item.credits,
          sessionType: item.sessionType,
          room: item.room,
          building: fallbackDept.building,
          instructor: item.instructor,
          departmentCode: code,
          semester: currentSemester || 5,
          session: session || '2022-23',
          isReferenceSlot: true,
        });
      }
    }
  }

  const dayOrder = new Map<ClassScheduleDay, number>(
    PUST_WEEK_DAYS.map((d, idx) => [d.key, idx])
  );

  return slots.sort((a, b) => {
    const dayDiff = (dayOrder.get(a.day) ?? 0) - (dayOrder.get(b.day) ?? 0);
    if (dayDiff !== 0) return dayDiff;
    return a.startTime.localeCompare(b.startTime);
  });
}

export interface StudentResultsSummary {
  sortedResults: ExamResultRecord[];
  latestResult: ExamResultRecord | null;
  cumulativeCgpa: number;
  completedSemesters: number;
  totalEarnedCredits: number;
  totalCoursesCount: number;
}

export function summarizeStudentResults(
  results: ExamResultRecord[],
  studentProfile: StudentRecord | null
): StudentResultsSummary {
  const sortedResults = [...results].sort((a, b) => b.semester - a.semester);
  const latestResult = sortedResults[0] ?? null;

  let weightedPoints = 0;
  let totalCredits = 0;
  let totalCoursesCount = 0;

  for (const res of sortedResults) {
    for (const c of res.courses) {
      totalCredits += c.credits;
      weightedPoints += c.credits * c.gradePoint;
      totalCoursesCount += 1;
    }
  }

  const computedCgpa =
    totalCredits > 0 ? Number((weightedPoints / totalCredits).toFixed(2)) : 0;

  const cumulativeCgpa =
    studentProfile && studentProfile.cgpa > 0 ? studentProfile.cgpa : computedCgpa;

  const completedSemesters = Math.max(
    studentProfile?.completedSemesters ?? 0,
    sortedResults.length
  );

  return {
    sortedResults,
    latestResult,
    cumulativeCgpa,
    completedSemesters,
    totalEarnedCredits: Number(totalCredits.toFixed(1)),
    totalCoursesCount,
  };
}

export interface GpaChartPoint {
  semester: number;
  label: string;
  sgpa: number;
  runningCgpa: number;
  credits: number;
  coursesCount: number;
  session: string;
  promotionStatus: string;
  publishedAt: string;
  isSample?: boolean;
}

export const REFERENCE_GPA_PROGRESSION: GpaChartPoint[] = [
  {
    semester: 1,
    label: 'Sem 1',
    sgpa: 3.62,
    runningCgpa: 3.62,
    credits: 18.0,
    coursesCount: 6,
    session: 'Sample',
    promotionStatus: 'Promoted',
    publishedAt: 'Sample',
    isSample: true,
  },
  {
    semester: 2,
    label: 'Sem 2',
    sgpa: 3.75,
    runningCgpa: 3.69,
    credits: 19.5,
    coursesCount: 6,
    session: 'Sample',
    promotionStatus: 'Promoted',
    publishedAt: 'Sample',
    isSample: true,
  },
  {
    semester: 3,
    label: 'Sem 3',
    sgpa: 3.84,
    runningCgpa: 3.74,
    credits: 20.0,
    coursesCount: 7,
    session: 'Sample',
    promotionStatus: 'Promoted',
    publishedAt: 'Sample',
    isSample: true,
  },
  {
    semester: 4,
    label: 'Sem 4',
    sgpa: 3.79,
    runningCgpa: 3.75,
    credits: 19.5,
    coursesCount: 6,
    session: 'Sample',
    promotionStatus: 'Promoted',
    publishedAt: 'Sample',
    isSample: true,
  },
];

export function buildHistoricalGpaSeries(results: ExamResultRecord[]): GpaChartPoint[] {
  if (!results.length) return [];

  const chronological = [...results].sort((a, b) => a.semester - b.semester);
  let cumulativeWeightedPoints = 0;
  let cumulativeCredits = 0;

  return chronological.map((res) => {
    const termCredits = res.courses.reduce((sum, c) => sum + c.credits, 0);
    const termWeightedPoints = res.courses.reduce(
      (sum, c) => sum + c.credits * c.gradePoint,
      0
    );

    if (termCredits > 0) {
      cumulativeWeightedPoints += termWeightedPoints;
      cumulativeCredits += termCredits;
    } else {
      cumulativeWeightedPoints += res.sgpa;
      cumulativeCredits += 1;
    }

    const runningCgpa =
      cumulativeCredits > 0
        ? Number((cumulativeWeightedPoints / cumulativeCredits).toFixed(2))
        : Number(res.sgpa.toFixed(2));

    return {
      semester: res.semester,
      label: `Sem ${res.semester}`,
      sgpa: Number(res.sgpa.toFixed(2)),
      runningCgpa,
      credits: Number(termCredits.toFixed(1)),
      coursesCount: res.courses.length,
      session: res.session,
      promotionStatus: res.promotionStatus,
      publishedAt: res.publishedAt,
    };
  });
}

export interface StudentFeeSummary {
  items: StudentFeeItem[];
  totalSettledBdt: number;
  totalOutstandingBdt: number;
  pendingCount: number;
  settledCount: number;
  hallClearanceBlocked: boolean;
}

export function buildStudentFeeSummary(params: {
  hallDues: HallDueRecord[];
  examApplications: ExamApplicationRecord[];
  certificateApps: CertificateApplicationRecord[];
  paymentReceipts: PaymentReceiptRecord[];
  hallClearanceBlocked?: boolean;
}): StudentFeeSummary {
  const {
    hallDues,
    examApplications,
    certificateApps,
    paymentReceipts,
    hallClearanceBlocked = false,
  } = params;

  const receiptByTarget = new Map<string, PaymentReceiptRecord>();
  const receiptByNo = new Map<string, PaymentReceiptRecord>();

  for (const r of paymentReceipts) {
    receiptByTarget.set(`${r.targetType}:${r.targetId}`, r);
    receiptByNo.set(r.receiptNo, r);
  }

  const consumedReceiptIds = new Set<string>();
  const items: StudentFeeItem[] = [];

  for (const due of hallDues) {
    const matchedReceipt =
      receiptByTarget.get(`hall_due:${due.id}`) ||
      (due.receiptNo ? receiptByNo.get(due.receiptNo) : undefined);
    if (matchedReceipt) consumedReceiptIds.add(matchedReceipt.id);

    const status =
      due.status === 'Cleared'
        ? 'settled'
        : due.status === 'Payment Submitted'
          ? 'submitted'
          : 'due';

    items.push({
      id: `hall-${due.id}`,
      category: 'Hall Fee',
      title: due.feeTitle,
      subtitle: `${due.hallName}${due.clearanceRef ? ` · Clearance ${due.clearanceRef}` : ''}`,
      amountBdt: due.amountBdt,
      status,
      statusLabel:
        status === 'settled'
          ? 'Cleared'
          : status === 'submitted'
            ? 'Awaiting Provost Clearance'
            : 'Payment Due',
      referenceNo: due.receiptNo || due.clearanceRef || due.paymentRef,
      dateLabel: due.clearedAt || due.paidAt,
      actionTab: 'halls',
      actionLabel: status === 'due' ? 'Pay Hall Fee' : 'Open Hall Desk',
      receipt: matchedReceipt,
    });
  }

  for (const app of examApplications) {
    const matchedReceipt =
      receiptByTarget.get(`exam_application:${app.id}`) ||
      (app.receiptNo ? receiptByNo.get(app.receiptNo) : undefined);
    if (matchedReceipt) consumedReceiptIds.add(matchedReceipt.id);

    const isPaid = app.paymentStatus === 'Paid';
    items.push({
      id: `exam-${app.id}`,
      category: 'Exam Fee',
      title: app.examTitle,
      subtitle: `Sem ${app.semester} · ${app.selectedCourseCodes.length} courses (${app.totalCredits} cr) · ${app.verificationStatus}`,
      amountBdt: app.feeBdt,
      status: isPaid ? 'settled' : 'due',
      statusLabel: isPaid ? 'Paid' : 'Pending Payment',
      referenceNo: app.receiptNo || app.formReference,
      dateLabel: app.admitCardIssuedAt || app.createdAt,
      actionTab: 'exams',
      actionLabel: isPaid ? 'View Exam Form' : 'Pay Exam Fee',
      receipt: matchedReceipt,
    });
  }

  for (const cert of certificateApps) {
    const matchedReceipt =
      receiptByTarget.get(`certificate:${cert.id}`) ||
      (cert.receiptNo ? receiptByNo.get(cert.receiptNo) : undefined);
    if (matchedReceipt) consumedReceiptIds.add(matchedReceipt.id);

    items.push({
      id: `cert-${cert.id}`,
      category: 'Certificate Fee',
      title: cert.certificateType,
      subtitle: `4-Office Clearance · ${cert.finalAdminStatus.replace(/_/g, ' ')}`,
      amountBdt: cert.feeBdt,
      status: 'settled',
      statusLabel: 'Paid',
      referenceNo: cert.receiptNo || cert.transactionId,
      dateLabel: cert.issuedAt || cert.createdAt,
      actionTab: 'certificates',
      actionLabel: 'Track Clearance',
      receipt: matchedReceipt,
    });
  }

  for (const r of paymentReceipts) {
    if (consumedReceiptIds.has(r.id)) continue;
    items.push({
      id: `rcpt-${r.id}`,
      category: 'University Receipt',
      title: r.title,
      subtitle: `${r.gatewayName}${r.accountMask ? ` (${r.accountMask})` : ''}`,
      amountBdt: r.amountBdt,
      status: 'settled',
      statusLabel: 'Verified Paid',
      referenceNo: r.receiptNo,
      dateLabel: r.paidAt,
      actionTab:
        r.targetType === 'hall_due'
          ? 'halls'
          : r.targetType === 'exam_application'
            ? 'exams'
            : 'certificates',
      actionLabel: 'View Receipt',
      receipt: r,
    });
  }

  const statusOrder: Record<StudentFeeItem['status'], number> = {
    due: 0,
    submitted: 1,
    settled: 2,
  };

  items.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

  let totalSettledBdt = 0;
  let totalOutstandingBdt = 0;
  let pendingCount = 0;
  let settledCount = 0;

  for (const item of items) {
    if (item.status === 'due') {
      totalOutstandingBdt += item.amountBdt;
      pendingCount += 1;
    } else if (item.status === 'submitted') {
      // Payment submitted by student, awaiting hall provost clearance seal
      totalSettledBdt += item.amountBdt;
      pendingCount += 1;
    } else {
      totalSettledBdt += item.amountBdt;
      settledCount += 1;
    }
  }

  return {
    items,
    totalSettledBdt,
    totalOutstandingBdt,
    pendingCount,
    settledCount,
    hallClearanceBlocked:
      hallClearanceBlocked || hallDues.some((d) => d.status === 'Unpaid'),
  };
}

export interface CompletedCourseHistoryItem {
  id: string;
  code: string;
  title: string;
  credits: number;
  semester: number;
  session: string;
  departmentCode: string;
  marks: number;
  letterGrade: string;
  gradePoint: number;
  publishedAt: string;
  promotionStatus: string;
}

export interface EnrolledCourseHistoryItem {
  id: string;
  code: string;
  title: string;
  credits: number;
  semester: number;
  session: string;
  departmentCode: string;
  instructor: string;
  sessionType: 'Lecture' | 'Laboratory';
  enrollmentStatus: string;
  isExamRegistered: boolean;
}

export interface StudentCourseHistorySummary {
  enrolledCourses: EnrolledCourseHistoryItem[];
  completedCourses: CompletedCourseHistoryItem[];
  enrolledCredits: number;
  completedCredits: number;
  totalCredits: number;
}

export function buildStudentCourseHistory(params: {
  results: ExamResultRecord[];
  courses: CourseRecord[];
  examApplications: ExamApplicationRecord[];
  departments: DepartmentRecord[];
  studentProfile: StudentRecord | null;
  departmentCode?: string;
}): StudentCourseHistorySummary {
  const {
    results,
    courses,
    examApplications,
    departments,
    studentProfile,
    departmentCode,
  } = params;

  const targetDept = (
    studentProfile?.departmentCode ||
    departmentCode ||
    ''
  ).toUpperCase();
  const targetSemester = studentProfile?.currentSemester;
  const targetSession = studentProfile?.session;

  const sortedResults = [...results].sort((a, b) => b.semester - a.semester);
  const completedKeys = new Set<string>();
  const completedCourses: CompletedCourseHistoryItem[] = [];

  for (const res of sortedResults) {
    const orderedCourses = [...res.courses].sort((a, b) =>
      a.code.localeCompare(b.code)
    );
    for (const c of orderedCourses) {
      const normalizedCode = c.code.toUpperCase();
      completedKeys.add(`${res.semester}:${normalizedCode}`);
      completedKeys.add(normalizedCode);
      completedCourses.push({
        id: `${res.id}-${normalizedCode}`,
        code: normalizedCode,
        title: c.title,
        credits: c.credits,
        semester: res.semester,
        session: res.session,
        departmentCode: res.departmentCode,
        marks: c.marks,
        letterGrade: c.letterGrade,
        gradePoint: c.gradePoint,
        publishedAt: res.publishedAt,
        promotionStatus: res.promotionStatus,
      });
    }
  }

  const deptCourses = targetDept
    ? courses.filter((c) => c.departmentCode.toUpperCase() === targetDept)
    : courses;

  const semesterScopedCourses =
    targetSemester && deptCourses.some((c) => c.semester === targetSemester)
      ? deptCourses.filter((c) => c.semester === targetSemester)
      : deptCourses;

  const sessionScopedCourses =
    targetSession && semesterScopedCourses.some((c) => c.session === targetSession)
      ? semesterScopedCourses.filter((c) => c.session === targetSession)
      : semesterScopedCourses;

  const enrolledCourses: EnrolledCourseHistoryItem[] = [];
  const seenEnrolled = new Set<string>();

  for (const course of [...sessionScopedCourses].sort((a, b) =>
    a.code.localeCompare(b.code)
  )) {
    const normalizedCode = course.code.toUpperCase();
    if (
      completedKeys.has(`${course.semester}:${normalizedCode}`) ||
      completedKeys.has(normalizedCode) ||
      seenEnrolled.has(normalizedCode)
    ) {
      continue;
    }
    seenEnrolled.add(normalizedCode);

    const dept = departments.find(
      (d) => d.code.toUpperCase() === course.departmentCode.toUpperCase()
    );
    const matchedApp = examApplications.find(
      (app) =>
        app.semester === course.semester &&
        app.selectedCourseCodes.some((code) => code.toUpperCase() === normalizedCode)
    );

    const enrollmentStatus = matchedApp
      ? matchedApp.paymentStatus === 'Paid'
        ? 'Exam Form Paid'
        : 'Exam Form Pending'
      : 'Enrolled (Ongoing)';

    enrolledCourses.push({
      id: course.id,
      code: normalizedCode,
      title: course.title,
      credits: course.credits,
      semester: course.semester,
      session: course.session,
      departmentCode: course.departmentCode,
      instructor: getInstructorForCourse(course, dept),
      sessionType: isLabCourse(course) ? 'Laboratory' : 'Lecture',
      enrollmentStatus,
      isExamRegistered: Boolean(matchedApp),
    });
  }

  const enrolledCredits = Number(
    enrolledCourses.reduce((sum, c) => sum + c.credits, 0).toFixed(1)
  );
  const completedCredits = Number(
    completedCourses.reduce((sum, c) => sum + c.credits, 0).toFixed(1)
  );

  return {
    enrolledCourses,
    completedCourses,
    enrolledCredits,
    completedCredits,
    totalCredits: Number((enrolledCredits + completedCredits).toFixed(1)),
  };
}
