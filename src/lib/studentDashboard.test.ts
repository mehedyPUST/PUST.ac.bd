import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildHistoricalGpaSeries,
  buildStudentClassSchedules,
  buildStudentCourseHistory,
  buildStudentFeeSummary,
  summarizeStudentResults,
} from './studentDashboard';
import type {
  CourseRecord,
  DepartmentRecord,
  ExamApplicationRecord,
  ExamResultRecord,
  HallDueRecord,
  PaymentReceiptRecord,
  StudentRecord,
} from '../types/pust';

const mockDepartment: DepartmentRecord = {
  id: 'dept-cse',
  code: 'CSE',
  name: 'Computer Science and Engineering',
  faculty: 'Faculty of Engineering and Technology',
  established: 2008,
  degrees: ['B.Sc. Engg.', 'M.Sc. Engg.'],
  intakeSeats: 40,
  building: 'Dr. M. A. Wazed Miah Science Building',
  chairmanName: 'Prof. Dr. Md. Khairul Islam',
  summary: 'CSE Department',
  researchFocus: ['Distributed Systems', 'Machine Learning'],
  laboratories: ['Systems & Networking Lab', 'Database & AI Lab'],
  facultyMembers: [
    {
      id: 'fac-1',
      name: 'Dr. Md. Mahmudul Hasan',
      designation: 'Associate Professor',
      phones: [],
      emails: [{ value: 'faculty.cse@pust.ac.bd', type: 'Office' }],
    },
  ],
};

test('buildStudentClassSchedules derives Sunday-Thursday lecture and lab sessions from courses', () => {
  const courses: CourseRecord[] = [
    {
      id: 'c1',
      code: 'CSE-3101',
      title: 'Operating Systems',
      credits: 3,
      departmentCode: 'CSE',
      semester: 5,
      session: '2022-23',
      teacherEmail: 'faculty.cse@pust.ac.bd',
    },
    {
      id: 'c2',
      code: 'CSE-3106',
      title: 'Database & Networking Lab',
      credits: 1.5,
      departmentCode: 'CSE',
      semester: 5,
      session: '2022-23',
    },
  ];

  const slots = buildStudentClassSchedules({
    courses,
    departments: [mockDepartment],
    departmentCode: 'CSE',
    currentSemester: 5,
    session: '2022-23',
  });

  // 2 lectures for theory + 1 lab session
  assert.equal(slots.length, 3);
  assert.equal(slots.filter((s) => s.sessionType === 'Lecture').length, 2);
  assert.equal(slots.filter((s) => s.sessionType === 'Laboratory').length, 1);
  assert.equal(slots[0].building, 'Dr. M. A. Wazed Miah Science Building');
  assert.equal(slots[0].instructor, 'Dr. Md. Mahmudul Hasan');
  assert.ok(slots.every((s) => !s.isReferenceSlot));
});

test('buildStudentClassSchedules builds reference schedule from department when courses are empty', () => {
  const slots = buildStudentClassSchedules({
    courses: [],
    departments: [mockDepartment],
    departmentCode: 'CSE',
  });

  assert.equal(slots.length, 5);
  assert.ok(slots.every((s) => s.isReferenceSlot));
  assert.ok(slots.every((s) => s.departmentCode === 'CSE'));
  assert.ok(slots.some((s) => s.sessionType === 'Laboratory'));
});

test('summarizeStudentResults calculates credits, latest SGPA, and honors student CGPA', () => {
  const results: ExamResultRecord[] = [
    {
      id: 'r1',
      academicId: '220101',
      studentName: 'Mehedy Hasan',
      departmentCode: 'CSE',
      session: '2022-23',
      semester: 4,
      courses: [
        {
          code: 'CSE-2201',
          title: 'Algorithms',
          credits: 3,
          marks: 82,
          gradePoint: 4.0,
          letterGrade: 'A+',
        },
        {
          code: 'CSE-2203',
          title: 'Computer Architecture',
          credits: 3,
          marks: 74,
          gradePoint: 3.5,
          letterGrade: 'A-',
        },
      ],
      sgpa: 3.75,
      promotionStatus: 'Promoted (Auto)',
      published: true,
      enteredBy: 'Exam Committee',
      publishedAt: '2026-06-01',
    },
  ];

  const student: StudentRecord = {
    id: 'stu-1',
    academicId: '220101',
    name: 'Mehedy Hasan',
    email: 'mehedy.cse@pust.ac.bd',
    phone: '017',
    departmentCode: 'CSE',
    session: '2022-23',
    currentSemester: 5,
    cgpa: 3.82,
    completedSemesters: 4,
    allResultsPublished: true,
    hallName: 'July 06 Hall',
    seatNumber: '304',
    admissionDocuments: [],
    chairmanNotes: '',
    adminNotes: '',
    disciplinaryStatus: 'Clear',
    disciplinaryNotes: '',
    approvalStatus: 'approved',
  };

  const summary = summarizeStudentResults(results, student);
  assert.equal(summary.cumulativeCgpa, 3.82);
  assert.equal(summary.totalEarnedCredits, 6);
  assert.equal(summary.totalCoursesCount, 2);
  assert.equal(summary.latestResult?.sgpa, 3.75);
});

test('buildStudentFeeSummary aggregates dues and receipts without double-counting matched receipts', () => {
  const hallDues: HallDueRecord[] = [
    {
      id: 'due-1',
      academicId: '220101',
      studentName: 'Mehedy Hasan',
      hallName: 'July 06 Hall',
      feeTitle: 'Annual Seat Rent',
      amountBdt: 1800,
      receiptNo: 'PUST-RCPT-1',
      status: 'Cleared',
    },
    {
      id: 'due-2',
      academicId: '220101',
      studentName: 'Mehedy Hasan',
      hallName: 'July 06 Hall',
      feeTitle: 'Dining & Utility Fee',
      amountBdt: 1200,
      status: 'Unpaid',
    },
  ];

  const examApps: ExamApplicationRecord[] = [
    {
      id: 'ex-1',
      circularId: 'circ-1',
      examTitle: '5th Semester Final Exam',
      studentId: 'u1',
      academicId: '220101',
      studentName: 'Mehedy Hasan',
      departmentCode: 'CSE',
      session: '2022-23',
      semester: 5,
      selectedCourseCodes: ['CSE-3101'],
      totalCredits: 3,
      formReference: 'FORM-1',
      feeBdt: 650,
      paymentStatus: 'Paid',
      receiptNo: 'PUST-RCPT-2',
      verificationStatus: 'Approved',
      hallClearanceChecked: true,
      createdAt: '2026-10-01',
    },
  ];

  const receipts: PaymentReceiptRecord[] = [
    {
      id: 'r-1',
      receiptNo: 'PUST-RCPT-1',
      transactionId: 'TXN1',
      academicId: '220101',
      studentName: 'Mehedy Hasan',
      departmentCode: 'CSE',
      targetType: 'hall_due',
      targetId: 'due-1',
      title: 'Annual Seat Rent',
      amountBdt: 1800,
      gatewayCode: 'sonali',
      gatewayName: 'Sonali eSheba',
      status: 'Verified',
      paidAt: '2026-09-01',
    },
  ];

  const feeSummary = buildStudentFeeSummary({
    hallDues,
    examApplications: examApps,
    certificateApps: [],
    paymentReceipts: receipts,
  });

  assert.equal(feeSummary.items.length, 3);
  // Due item must sort first
  assert.equal(feeSummary.items[0].status, 'due');
  assert.equal(feeSummary.totalOutstandingBdt, 1200);
  // 1800 + 650 = 2450 (receipt r-1 matched due-1 so it is not double-counted)
  assert.equal(feeSummary.totalSettledBdt, 2450);
  assert.equal(feeSummary.hallClearanceBlocked, true);
});

test('buildHistoricalGpaSeries sorts semesters chronologically and tracks running weighted CGPA', () => {
  const unsortedResults: ExamResultRecord[] = [
    {
      id: 'res-3',
      academicId: '220101',
      studentName: 'Mehedy Hasan',
      departmentCode: 'CSE',
      session: '2022-23',
      semester: 3,
      courses: [
        { code: 'CSE-2101', title: 'OOP', credits: 3, marks: 85, gradePoint: 4.0, letterGrade: 'A+' },
      ],
      sgpa: 4.0,
      promotionStatus: 'Promoted (Auto)',
      published: true,
      enteredBy: 'Committee',
      publishedAt: '2025-09-01',
    },
    {
      id: 'res-1',
      academicId: '220101',
      studentName: 'Mehedy Hasan',
      departmentCode: 'CSE',
      session: '2022-23',
      semester: 1,
      courses: [
        { code: 'CSE-1101', title: 'C Programming', credits: 3, marks: 73, gradePoint: 3.5, letterGrade: 'A-' },
      ],
      sgpa: 3.5,
      promotionStatus: 'Promoted (Auto)',
      published: true,
      enteredBy: 'Committee',
      publishedAt: '2024-06-01',
    },
    {
      id: 'res-2',
      academicId: '220101',
      studentName: 'Mehedy Hasan',
      departmentCode: 'CSE',
      session: '2022-23',
      semester: 2,
      courses: [
        { code: 'CSE-1201', title: 'Data Structures', credits: 3, marks: 77, gradePoint: 3.75, letterGrade: 'A' },
      ],
      sgpa: 3.75,
      promotionStatus: 'Promoted (Auto)',
      published: true,
      enteredBy: 'Committee',
      publishedAt: '2025-01-01',
    },
  ];

  const series = buildHistoricalGpaSeries(unsortedResults);
  assert.deepEqual(
    series.map((p) => p.label),
    ['Sem 1', 'Sem 2', 'Sem 3']
  );
  assert.equal(series[0].sgpa, 3.5);
  assert.equal(series[0].runningCgpa, 3.5);
  assert.equal(series[1].runningCgpa, 3.63);
  assert.equal(series[2].runningCgpa, 3.75);
  assert.deepEqual(buildHistoricalGpaSeries([]), []);
});

test('buildStudentCourseHistory separates completed courses from current enrollments and reconciles credits', () => {
  const results: ExamResultRecord[] = [
    {
      id: 'res-4',
      academicId: '220101',
      studentName: 'Mehedy Hasan',
      departmentCode: 'CSE',
      session: '2022-23',
      semester: 4,
      courses: [
        { code: 'CSE-2201', title: 'Algorithms', credits: 3.0, marks: 82, gradePoint: 4.0, letterGrade: 'A+' },
        { code: 'CSE-2203', title: 'Architecture', credits: 3.0, marks: 76, gradePoint: 3.75, letterGrade: 'A' },
      ],
      sgpa: 3.88,
      promotionStatus: 'Promoted (Auto)',
      published: true,
      enteredBy: 'Committee',
      publishedAt: '2026-10-30',
    },
  ];

  const courses: CourseRecord[] = [
    {
      id: 'c-3101',
      code: 'CSE-3101',
      title: 'Operating Systems',
      credits: 3.0,
      departmentCode: 'CSE',
      semester: 5,
      session: '2022-23',
      teacherEmail: 'faculty.cse@pust.ac.bd',
    },
    {
      id: 'c-3106',
      code: 'CSE-3106',
      title: 'Database & Networking Lab',
      credits: 1.5,
      departmentCode: 'CSE',
      semester: 5,
      session: '2022-23',
    },
    // Completed course present in catalog should not duplicate into current enrollments
    {
      id: 'c-2201',
      code: 'CSE-2201',
      title: 'Algorithms',
      credits: 3.0,
      departmentCode: 'CSE',
      semester: 4,
      session: '2022-23',
    },
  ];

  const examApps: ExamApplicationRecord[] = [
    {
      id: 'app-5',
      circularId: 'circ-5',
      examTitle: '5th Sem Exam',
      studentId: 'stu-1',
      academicId: '220101',
      studentName: 'Mehedy Hasan',
      departmentCode: 'CSE',
      session: '2022-23',
      semester: 5,
      selectedCourseCodes: ['CSE-3101'],
      totalCredits: 3,
      formReference: 'FORM-5',
      feeBdt: 1200,
      paymentStatus: 'Paid',
      verificationStatus: 'Approved',
      hallClearanceChecked: true,
      createdAt: '2026-11-20',
    },
  ];

  const student: StudentRecord = {
    id: 'stu-1',
    academicId: '220101',
    name: 'Mehedy Hasan',
    email: 'mehedy.cse@pust.ac.bd',
    phone: '017',
    departmentCode: 'CSE',
    session: '2022-23',
    currentSemester: 5,
    cgpa: 3.82,
    completedSemesters: 4,
    allResultsPublished: true,
    hallName: 'July 06 Hall',
    seatNumber: '304',
    admissionDocuments: [],
    chairmanNotes: '',
    adminNotes: '',
    disciplinaryStatus: 'Clear',
    disciplinaryNotes: '',
    approvalStatus: 'approved',
  };

  const history = buildStudentCourseHistory({
    results,
    courses,
    examApplications: examApps,
    departments: [mockDepartment],
    studentProfile: student,
  });

  assert.equal(history.completedCourses.length, 2);
  assert.equal(history.completedCredits, 6);
  assert.equal(history.enrolledCourses.length, 2);
  assert.equal(history.enrolledCredits, 4.5);
  assert.equal(history.totalCredits, 10.5);
  assert.equal(history.enrolledCourses[0].code, 'CSE-3101');
  assert.equal(history.enrolledCourses[0].instructor, 'Dr. Md. Mahmudul Hasan');
  assert.equal(history.enrolledCourses[0].enrollmentStatus, 'Exam Form Paid');
  assert.equal(history.enrolledCourses[1].code, 'CSE-3106');
  assert.equal(history.enrolledCourses[1].sessionType, 'Laboratory');
  assert.equal(history.enrolledCourses[1].enrollmentStatus, 'Enrolled (Ongoing)');
});
