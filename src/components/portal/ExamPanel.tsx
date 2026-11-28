'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  FileCheck2,
  Plus,
  Printer,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import { pustApi } from '../../lib/api';
import { usePust } from '../PustContext';
import { PortalRecordsSkeleton } from '../PustSkeletons';
import { DigitalCheckoutModal, type CheckoutTarget } from './DigitalCheckoutModal';
import { DigitalDocumentModal, type DigitalDocumentData } from './DigitalDocumentModal';
import type {
  AuthUser,
  CourseRecord,
  DepartmentFacultySummary,
  DepartmentRecord,
  ExamApplicationRecord,
  ExamCircularRecord,
  ExamCommitteeRecord,
  ExamResultRecord,
  HallDueRecord,
  PaymentGatewayConfig,
  StudentRecord,
} from '../../types/pust';

interface ExamPanelProps {
  user: AuthUser;
  departments: DepartmentRecord[];
}

interface GradeRowInput {
  key: string;
  code: string;
  title: string;
  credits: number;
  marks: number;
}

function computePustGrade(marks: number): { letter: string; gp: number } {
  const m = Math.max(0, Math.min(100, Number(marks) || 0));
  if (m >= 80) return { letter: 'A+', gp: 4.0 };
  if (m >= 75) return { letter: 'A', gp: 3.75 };
  if (m >= 70) return { letter: 'A-', gp: 3.5 };
  if (m >= 65) return { letter: 'B+', gp: 3.25 };
  if (m >= 60) return { letter: 'B', gp: 3.0 };
  if (m >= 55) return { letter: 'B-', gp: 2.75 };
  if (m >= 50) return { letter: 'C+', gp: 2.5 };
  if (m >= 45) return { letter: 'C', gp: 2.25 };
  if (m >= 40) return { letter: 'D', gp: 2.0 };
  return { letter: 'F', gp: 0.0 };
}

const ACADEMIC_SESSIONS = ['2025-26', '2024-25', '2023-24', '2022-23', '2021-22', '2020-21'];

const ACADEMIC_YEARS = [
  { value: 1, label: '1st' },
  { value: 2, label: '2nd' },
  { value: 3, label: '3rd' },
  { value: 4, label: '4th' },
  { value: 5, label: '5th' },
] as const;

const YEAR_SEMESTERS = [
  { value: 1, label: '1st' },
  { value: 2, label: '2nd' },
] as const;

export function ExamPanel({ user, departments }: ExamPanelProps) {
  const { navigateTo } = usePust();
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [circulars, setCirculars] = useState<ExamCircularRecord[]>([]);
  const [applications, setApplications] = useState<ExamApplicationRecord[]>([]);
  const [results, setResults] = useState<ExamResultRecord[]>([]);
  const [gateways, setGateways] = useState<PaymentGatewayConfig[]>([]);
  const [committees, setCommittees] = useState<ExamCommitteeRecord[]>([]);
  const [departmentFaculty, setDepartmentFaculty] = useState<DepartmentFacultySummary[]>([]);
  const [hallBlocked, setHallBlocked] = useState(false);
  const [unpaidHallDues, setUnpaidHallDues] = useState<HallDueRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Digital Checkout & Document Modals
  const [checkoutTarget, setCheckoutTarget] = useState<CheckoutTarget | null>(null);
  const [activeDoc, setActiveDoc] = useState<DigitalDocumentData | null>(null);

  // Student Exam Apply
  const [selectedCircularId, setSelectedCircularId] = useState('');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  // Chairman/Admin Create Course
  const [courseCodeSuffix, setCourseCodeSuffix] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseCredits, setCourseCredits] = useState(3);
  const [courseDept, setCourseDept] = useState(
    user.departmentCode === 'ADMIN' ? 'CSE' : user.departmentCode
  );
  const [courseYear, setCourseYear] = useState(3);
  const [courseTermSem, setCourseTermSem] = useState(2);
  const [courseSession, setCourseSession] = useState('2022-23');
  const [courseTeacherId, setCourseTeacherId] = useState('');
  const [savingCourse, setSavingCourse] = useState(false);
  const [catalogSessionFilter, setCatalogSessionFilter] = useState('ALL');
  const [busyCourseId, setBusyCourseId] = useState<string | null>(null);

  // Chairman/Admin Assign Courses to Faculty Member
  const [assignTeacherId, setAssignTeacherId] = useState('');
  const [assignCourseCodes, setAssignCourseCodes] = useState<string[]>([]);
  const [assignSessions, setAssignSessions] = useState<string[]>([]);
  const [savingTeacherAssign, setSavingTeacherAssign] = useState(false);

  // Chairman/Admin Create Exam Committee (Session + Semester)
  const [ecSession, setEcSession] = useState('2022-23');
  const [ecYear, setEcYear] = useState(3);
  const [ecTermSem, setEcTermSem] = useState(1);
  const [ecTitle, setEcTitle] = useState('');
  const [ecChairId, setEcChairId] = useState('');
  const [ecMemberIds, setEcMemberIds] = useState<string[]>([]);
  const [savingCommittee, setSavingCommittee] = useState(false);
  const [busyCommitteeId, setBusyCommitteeId] = useState<string | null>(null);

  // Chairman / Admin / Exam Committee Create Exam Circular
  const [circTitle, setCircTitle] = useState('');
  const [circDept, setCircDept] = useState(
    user.departmentCode === 'ADMIN' ? 'CSE' : user.departmentCode
  );
  const [circYear, setCircYear] = useState(3);
  const [circTermSem, setCircTermSem] = useState(1);
  const [circSession, setCircSession] = useState('2022-23');
  const [circDeadline, setCircDeadline] = useState('2026-12-10');
  const [circExamStartDate, setCircExamStartDate] = useState('2026-12-20');
  const [circExamVenue, setCircExamVenue] = useState('Department Academic Building');
  const [circScheduleNote, setCircScheduleNote] = useState('');
  const [circFee, setCircFee] = useState(1450);
  const [circCourseCodes, setCircCourseCodes] = useState<string[]>([]);
  const [showAllDeptCourses, setShowAllDeptCourses] = useState(false);
  const [publishingCircular, setPublishingCircular] = useState(false);
  const [activeCommitteeIdForArrange, setActiveCommitteeIdForArrange] = useState('');

  // Teacher / Exam Committee / Chairman / Admin Multi-Course Gradebook Entry
  const [resAcademicId, setResAcademicId] = useState('');
  const [resYear, setResYear] = useState(3);
  const [resTermSem, setResTermSem] = useState(1);
  const [resPromoMode, setResPromoMode] = useState<'auto' | 'manual_promoted' | 'manual_repeat'>(
    'auto'
  );
  const [resSubmissionTarget, setResSubmissionTarget] = useState<'publish' | 'chairman' | 'admin'>(
    user.role === 'teacher' ? 'chairman' : 'publish'
  );
  const [retrievedStudent, setRetrievedStudent] = useState<StudentRecord | null>(null);
  const [previousStudentResults, setPreviousStudentResults] = useState<ExamResultRecord[]>([]);
  const [studentLookupLoading, setStudentLookupLoading] = useState(false);
  const [studentLookupError, setStudentLookupError] = useState<string | null>(null);
  const [publishingResult, setPublishingResult] = useState(false);
  const [courseRows, setCourseRows] = useState<GradeRowInput[]>([
    { key: 'row-1', code: 'CSE-3201', title: 'Operating Systems', credits: 3, marks: 82 },
    { key: 'row-2', code: 'CSE-3203', title: 'Computer Networks', credits: 3, marks: 76 },
  ]);
  const [pendingPromoModes, setPendingPromoModes] = useState<
    Record<string, 'auto' | 'manual_promoted' | 'manual_repeat'>
  >({});

  const initializedCircularRef = useRef(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await pustApi.getExamsOverview();
      setCourses(data.courses);
      setCirculars(data.circulars);
      setApplications(data.applications);
      // Deduplicate by id — Mongo/seed can occasionally surface the same result twice
      const seenResultIds = new Set<string>();
      setResults(
        (data.results || []).filter((r) => {
          if (!r?.id || seenResultIds.has(r.id)) return false;
          seenResultIds.add(r.id);
          return true;
        })
      );
      setGateways(data.gateways);
      setCommittees(data.committees || []);
      setDepartmentFaculty(data.departmentFaculty || []);
      setHallBlocked(data.hallClearanceBlocked);
      setUnpaidHallDues(data.unpaidHallDues);
      if (data.circulars.length > 0 && !initializedCircularRef.current) {
        initializedCircularRef.current = true;
        setSelectedCircularId(data.circulars[0].id);
        setSelectedCourses(data.circulars[0].eligibleCourseCodes);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load examination records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    setResSubmissionTarget(user.role === 'teacher' ? 'chairman' : 'publish');
  }, [user.role]);

  useEffect(() => {
    if (user.role === 'chairman' && user.departmentCode && user.departmentCode !== 'ADMIN') {
      setCourseDept(user.departmentCode);
      setCircDept(user.departmentCode);
    } else if (departments.length > 0) {
      if (!courseDept) setCourseDept(departments[0].code);
      if (!circDept) setCircDept(departments[0].code);
    }
  }, [user.role, user.departmentCode, departments, courseDept, circDept]);

  const courseDeptPrefix = (courseDept || 'CSE')
    .replace(/[^A-Za-z]/g, '')
    .slice(0, 3)
    .toUpperCase();
  const computedCourseSemester = (courseYear - 1) * 2 + courseTermSem;
  const computedCircSemester = (circYear - 1) * 2 + circTermSem;
  const computedEcSemester = (ecYear - 1) * 2 + ecTermSem;

  const myActiveCommittees = useMemo(() => {
    const emailLower = user.email.toLowerCase();
    return committees.filter(
      (c) =>
        c.status === 'active' &&
        c.members.some((m) => m.userId === user.id || m.email.toLowerCase() === emailLower)
    );
  }, [committees, user.id, user.email]);

  const selectedArrangeCommittee = useMemo(
    () =>
      myActiveCommittees.find((c) => c.id === activeCommitteeIdForArrange) ||
      myActiveCommittees[0] ||
      null,
    [myActiveCommittees, activeCommitteeIdForArrange]
  );

  const isCommitteeOperator =
    myActiveCommittees.length > 0 && user.role !== 'chairman' && user.role !== 'admin';

  useEffect(() => {
    if (isCommitteeOperator && selectedArrangeCommittee) {
      setCircDept(selectedArrangeCommittee.departmentCode);
      setCircSession(selectedArrangeCommittee.session);
      setCircYear(Math.ceil(selectedArrangeCommittee.semester / 2));
      setCircTermSem(selectedArrangeCommittee.semester % 2 === 1 ? 1 : 2);
    }
  }, [isCommitteeOperator, selectedArrangeCommittee]);

  const scopedDeptFaculty = useMemo(() => {
    if (user.role === 'chairman') {
      return departmentFaculty.filter(
        (f) => f.departmentCode.toUpperCase() === user.departmentCode.toUpperCase()
      );
    }
    return departmentFaculty.filter(
      (f) => f.departmentCode.toUpperCase() === courseDept.toUpperCase()
    );
  }, [departmentFaculty, user.role, user.departmentCode, courseDept]);

  useEffect(() => {
    if (scopedDeptFaculty.length === 0) return;
    const activeTeacher = scopedDeptFaculty.find((f) => f.id === assignTeacherId);
    if (!activeTeacher) {
      const first = scopedDeptFaculty[0];
      setAssignTeacherId(first.id);
      setAssignCourseCodes(first.assignedCourses || []);
      setAssignSessions(first.assignedSessions || []);
    }
    if (!ecChairId || !scopedDeptFaculty.some((f) => f.id === ecChairId)) {
      setEcChairId(scopedDeptFaculty[0].id);
    }
  }, [scopedDeptFaculty, assignTeacherId, ecChairId]);

  function handleSelectTeacherForAssign(teacherId: string) {
    setAssignTeacherId(teacherId);
    const found = scopedDeptFaculty.find((f) => f.id === teacherId);
    setAssignCourseCodes(found?.assignedCourses || []);
    setAssignSessions(found?.assignedSessions || []);
  }

  const filteredCircularCourses = useMemo(
    () =>
      courses.filter(
        (c) =>
          c.departmentCode === circDept &&
          c.session === circSession &&
          c.semester === computedCircSemester
      ),
    [courses, circDept, circSession, computedCircSemester]
  );

  const deptAllCircularCourses = useMemo(
    () => courses.filter((c) => c.departmentCode === circDept),
    [courses, circDept]
  );

  const circularVisibleCourses = showAllDeptCourses
    ? deptAllCircularCourses
    : filteredCircularCourses;

  useEffect(() => {
    setCircCourseCodes(filteredCircularCourses.slice(0, 15).map((c) => c.code));
  }, [filteredCircularCourses]);

  const selectedCircularCredits = useMemo(
    () =>
      circCourseCodes.reduce((sum, code) => {
        const match = courses.find((c) => c.code === code);
        return sum + (match?.credits ?? 0);
      }, 0),
    [circCourseCodes, courses]
  );

  const activeCircular = circulars.find((c) => c.id === selectedCircularId) || circulars[0];

  const computedResSemester = (resYear - 1) * 2 + resTermSem;

  const fetchStudentContext = useCallback(
    async (academicIdInput: string, syncTermAndCourses: boolean) => {
      const trimmed = academicIdInput.trim();
      if (trimmed.length < 3) {
        setRetrievedStudent(null);
        setPreviousStudentResults([]);
        setStudentLookupError(null);
        setStudentLookupLoading(false);
        return;
      }

      setStudentLookupLoading(true);
      setStudentLookupError(null);
      try {
        const data = await pustApi.getExamStudentContext(trimmed);
        setRetrievedStudent(data.student);
        setPreviousStudentResults(data.previousResults);
        setStudentLookupError(null);

        if (syncTermAndCourses) {
          const targetSem = Math.max(1, Math.min(10, data.student.currentSemester || 1));
          setResYear(Math.ceil(targetSem / 2));
          setResTermSem(targetSem % 2 === 1 ? 1 : 2);
        }
      } catch (err) {
        setRetrievedStudent(null);
        setPreviousStudentResults([]);
        setStudentLookupError(err instanceof Error ? err.message : 'Student lookup failed.');
      } finally {
        setStudentLookupLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const canLookup =
      ['teacher', 'chairman', 'admin'].includes(user.role) || myActiveCommittees.length > 0;
    if (!canLookup) return;
    const trimmed = resAcademicId.trim();
    if (trimmed.length < 3) {
      setRetrievedStudent(null);
      setPreviousStudentResults([]);
      setStudentLookupError(null);
      setStudentLookupLoading(false);
      return;
    }

    let cancelled = false;
    setStudentLookupLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await pustApi.getExamStudentContext(trimmed);
        if (cancelled) return;
        setRetrievedStudent(data.student);
        setPreviousStudentResults(data.previousResults);
        setStudentLookupError(null);

        const targetSem = Math.max(1, Math.min(10, data.student.currentSemester || 1));
        setResYear(Math.ceil(targetSem / 2));
        setResTermSem(targetSem % 2 === 1 ? 1 : 2);
      } catch (err) {
        if (cancelled) return;
        setRetrievedStudent(null);
        setPreviousStudentResults([]);
        setStudentLookupError(err instanceof Error ? err.message : 'Student lookup failed.');
      } finally {
        if (!cancelled) setStudentLookupLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [resAcademicId, user.role]);

  const deptCourses = useMemo(() => {
    if (retrievedStudent) {
      return courses.filter((c) => c.departmentCode === retrievedStudent.departmentCode);
    }
    if (user.role === 'teacher' || user.role === 'chairman' || user.role === 'student') {
      return courses.filter(
        (c) => c.departmentCode.toUpperCase() === user.departmentCode.toUpperCase()
      );
    }
    return courses.filter(
      (c) => c.departmentCode.toUpperCase() === courseDept.toUpperCase()
    );
  }, [courses, retrievedStudent, user.role, user.departmentCode, courseDept]);

  const filteredCatalogCourses = useMemo(() => {
    return deptCourses
      .filter((c) => {
        if (catalogSessionFilter !== 'ALL' && c.session !== catalogSessionFilter) return false;
        return true;
      })
      .sort((a, b) => a.semester - b.semester || a.code.localeCompare(b.code));
  }, [deptCourses, catalogSessionFilter]);

  const matchingGradebookCommittee = useMemo(() => {
    if (!retrievedStudent) return null;
    return (
      myActiveCommittees.find(
        (c) =>
          c.departmentCode.toUpperCase() === retrievedStudent.departmentCode.toUpperCase() &&
          c.session === retrievedStudent.session &&
          c.semester === computedResSemester
      ) ?? null
    );
  }, [retrievedStudent, myActiveCommittees, computedResSemester]);

  const matchingGradebookTermCourses = useMemo(() => {
    const deptCode = retrievedStudent?.departmentCode || (user.departmentCode !== 'ADMIN' ? user.departmentCode : '');
    if (!deptCode) return [];
    const exactSessionAndSem = courses.filter(
      (c) =>
        c.departmentCode === deptCode &&
        c.semester === computedResSemester &&
        (!retrievedStudent || c.session === retrievedStudent.session)
    );
    if (exactSessionAndSem.length > 0) return exactSessionAndSem;
    return courses.filter((c) => c.departmentCode === deptCode && c.semester === computedResSemester);
  }, [courses, retrievedStudent, user.departmentCode, computedResSemester]);

  const lastGradebookKeyRef = useRef<string>('');

  useEffect(() => {
    if (!retrievedStudent) {
      lastGradebookKeyRef.current = '';
      return;
    }
    const key = `${retrievedStudent.id}:${computedResSemester}`;
    if (lastGradebookKeyRef.current === key) return;
    if (matchingGradebookTermCourses.length > 0) {
      lastGradebookKeyRef.current = key;
      setCourseRows(
        matchingGradebookTermCourses.map((c, idx) => ({
          key: `row-${c.id}-${idx}`,
          code: c.code,
          title: c.title,
          credits: c.credits,
          marks: 75,
        }))
      );
    }
  }, [retrievedStudent, computedResSemester, matchingGradebookTermCourses]);

  const totalGradebookCredits = useMemo(
    () => courseRows.reduce((sum, r) => sum + (Number(r.credits) || 0), 0),
    [courseRows]
  );

  const currentWeightedPoints = useMemo(() => {
    let totalPts = 0;
    for (const row of courseRows) {
      const cr = Number(row.credits) || 0;
      const { gp } = computePustGrade(row.marks);
      totalPts += cr * gp;
    }
    return totalPts;
  }, [courseRows]);

  const estimatedSgpa = useMemo(
    () => (totalGradebookCredits > 0 ? currentWeightedPoints / totalGradebookCredits : 0),
    [currentWeightedPoints, totalGradebookCredits]
  );

  const priorResultsForCgpa = useMemo(
    () => previousStudentResults.filter((r) => r.semester !== computedResSemester),
    [previousStudentResults, computedResSemester]
  );

  const existingSameSemesterResult = useMemo(
    () => previousStudentResults.find((r) => r.semester === computedResSemester) ?? null,
    [previousStudentResults, computedResSemester]
  );

  const previousStandingStats = useMemo(() => {
    let credits = 0;
    let weighted = 0;
    for (const r of priorResultsForCgpa) {
      for (const c of r.courses) {
        credits += Number(c.credits) || 0;
        weighted += (Number(c.gradePoint) || 0) * (Number(c.credits) || 0);
      }
    }
    return {
      credits,
      weighted,
      cgpa: credits > 0 ? weighted / credits : null,
    };
  }, [priorResultsForCgpa]);

  const projectedCombinedCredits = previousStandingStats.credits + totalGradebookCredits;
  const projectedCumulativeCgpa = useMemo(() => {
    if (projectedCombinedCredits <= 0) return 0;
    return (previousStandingStats.weighted + currentWeightedPoints) / projectedCombinedCredits;
  }, [previousStandingStats.weighted, currentWeightedPoints, projectedCombinedCredits]);

  function handleSelectCircular(id: string) {
    setSelectedCircularId(id);
    const found = circulars.find((c) => c.id === id);
    if (found) setSelectedCourses(found.eligibleCourseCodes);
  }

  function toggleStudentCourse(code: string) {
    setSelectedCourses((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }

  function toggleCircularCourse(code: string) {
    setCircCourseCodes((prev) => {
      if (prev.includes(code)) return prev.filter((c) => c !== code);
      if (prev.length >= 15) return prev;
      return [...prev, code];
    });
  }

  function handleSelectAllVisibleCircularCourses() {
    setCircCourseCodes(circularVisibleCourses.slice(0, 15).map((c) => c.code));
  }

  function addCatalogCourseRow(course: CourseRecord) {
    setCourseRows((prev) => {
      if (prev.some((r) => r.code.toUpperCase() === course.code.toUpperCase())) return prev;
      return [
        ...prev,
        {
          key: `row-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          code: course.code,
          title: course.title,
          credits: course.credits,
          marks: 75,
        },
      ];
    });
  }

  function addBlankCourseRow() {
    setCourseRows((prev) => [
      ...prev,
      {
        key: `row-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        code: '',
        title: '',
        credits: 3,
        marks: 75,
      },
    ]);
  }

  function updateCourseRow(key: string, patch: Partial<GradeRowInput>) {
    setCourseRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function removeCourseRow(key: string) {
    setCourseRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev));
  }

  async function handleCreateCourse(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFeedback(null);

    const sanitizedSuffix = courseCodeSuffix
      .trim()
      .toUpperCase()
      .replace(new RegExp(`^${courseDeptPrefix}[-\\s]*`, 'i'), '')
      .replace(/^-+/, '');

    if (!sanitizedSuffix) {
      setError(`Enter the course code suffix after ${courseDeptPrefix}- (e.g. 4101).`);
      return;
    }

    const fullCourseCode = `${courseDeptPrefix}-${sanitizedSuffix}`;
    if (fullCourseCode.length < 3 || fullCourseCode.length > 20) {
      setError('Course code must be between 3 and 20 characters.');
      return;
    }

    setSavingCourse(true);
    try {
      const res = await pustApi.createCourse({
        code: fullCourseCode,
        title: courseTitle.trim(),
        credits: Number(courseCredits),
        departmentCode: courseDept,
        semester: computedCourseSemester,
        session: courseSession,
        ...(courseTeacherId ? { teacherUserId: courseTeacherId } : {}),
      });
      const yearLabel = ACADEMIC_YEARS.find((y) => y.value === courseYear)?.label ?? `${courseYear}`;
      const semLabel = YEAR_SEMESTERS.find((s) => s.value === courseTermSem)?.label ?? `${courseTermSem}`;
      setFeedback(
        `Added course ${res.course.code} — ${res.course.title} (${yearLabel} Year, ${semLabel} Semester · ${res.course.session})${
          res.course.teacherName ? ` · Assigned to ${res.course.teacherName}` : ''
        }.`
      );
      setCourseCodeSuffix('');
      setCourseTitle('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add course.');
    } finally {
      setSavingCourse(false);
    }
  }

  async function handleQuickAssignCourseTeacher(course: CourseRecord, teacherUserId: string) {
    setError(null);
    setFeedback(null);
    setBusyCourseId(course.id);
    try {
      const res = await pustApi.updateCourse(course.id, {
        teacherUserId: teacherUserId || null,
      });
      setFeedback(
        res.course.teacherName
          ? `Assigned ${res.course.code} (${res.course.session}) to ${res.course.teacherName}.`
          : `Cleared faculty assignment for ${res.course.code}.`
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to assign faculty to course.');
    } finally {
      setBusyCourseId(null);
    }
  }

  async function handleDeleteCourse(course: CourseRecord) {
    setError(null);
    setFeedback(null);
    setBusyCourseId(course.id);
    try {
      await pustApi.deleteCourse(course.id);
      setFeedback(`Removed course ${course.code} (${course.session} · Sem ${course.semester}).`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete course.');
    } finally {
      setBusyCourseId(null);
    }
  }

  function toggleAssignCourseCode(code: string) {
    const upper = code.toUpperCase();
    setAssignCourseCodes((prev) =>
      prev.includes(upper) ? prev.filter((c) => c !== upper) : [...prev, upper]
    );
  }

  function toggleAssignSession(sess: string) {
    setAssignSessions((prev) =>
      prev.includes(sess) ? prev.filter((s) => s !== sess) : [...prev, sess]
    );
  }

  async function handleSaveTeacherAssignments(e: FormEvent) {
    e.preventDefault();
    if (!assignTeacherId) return;
    setError(null);
    setFeedback(null);
    setSavingTeacherAssign(true);
    try {
      const res = await pustApi.assignTeacher(assignTeacherId, assignCourseCodes, assignSessions);
      setFeedback(
        `Assigned ${assignCourseCodes.length} course(s) to ${res.user.name}.`
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save faculty course assignments.');
    } finally {
      setSavingTeacherAssign(false);
    }
  }

  function toggleCommitteeMemberId(userId: string) {
    setEcMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  async function handleCreateExamCommittee(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    const targetDept = user.role === 'chairman' ? user.departmentCode : courseDept;
    const memberPayload: Array<{ userId: string; committeeRole: 'chair' | 'member' }> = [];
    if (ecChairId) {
      memberPayload.push({ userId: ecChairId, committeeRole: 'chair' });
    }
    for (const mid of ecMemberIds) {
      if (mid !== ecChairId) {
        memberPayload.push({ userId: mid, committeeRole: 'member' });
      }
    }
    if (memberPayload.length === 0) {
      setError('Select at least one faculty member for the Exam Committee.');
      return;
    }

    setSavingCommittee(true);
    try {
      const res = await pustApi.createExamCommittee({
        departmentCode: targetDept,
        session: ecSession,
        semester: computedEcSemester,
        ...(ecTitle.trim() ? { title: ecTitle.trim() } : {}),
        members: memberPayload,
      });
      setFeedback(
        `Created ${res.committee.title} with ${res.committee.members.length} faculty member(s).`
      );
      setEcTitle('');
      setEcMemberIds([]);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create Exam Committee.');
    } finally {
      setSavingCommittee(false);
    }
  }

  async function handleToggleCommitteeStatus(c: ExamCommitteeRecord) {
    setError(null);
    setFeedback(null);
    setBusyCommitteeId(c.id);
    try {
      const nextStatus = c.status === 'active' ? 'dissolved' : 'active';
      await pustApi.updateExamCommittee(c.id, { status: nextStatus });
      setFeedback(`Updated committee "${c.title}" status to ${nextStatus}.`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update Exam Committee.');
    } finally {
      setBusyCommitteeId(null);
    }
  }

  async function handleDeleteCommittee(c: ExamCommitteeRecord) {
    setError(null);
    setFeedback(null);
    setBusyCommitteeId(c.id);
    try {
      await pustApi.deleteExamCommittee(c.id);
      setFeedback(`Removed Exam Committee "${c.title}".`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove Exam Committee.');
    } finally {
      setBusyCommitteeId(null);
    }
  }

  async function handleCreateExamCircular(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFeedback(null);

    if (circCourseCodes.length === 0) {
      setError('Select at least one eligible course for this examination circular.');
      return;
    }

    setPublishingCircular(true);
    try {
      const res = await pustApi.createExamCircular({
        title: circTitle.trim(),
        departmentCode: circDept,
        semester: computedCircSemester,
        session: circSession,
        deadline: circDeadline,
        feeBdt: Math.round(Number(circFee)),
        eligibleCourseCodes: circCourseCodes,
        ...(circExamStartDate ? { examStartDate: circExamStartDate } : {}),
        ...(circExamVenue.trim() ? { examVenue: circExamVenue.trim() } : {}),
        ...(circScheduleNote.trim() ? { scheduleNote: circScheduleNote.trim() } : {}),
        ...(isCommitteeOperator && selectedArrangeCommittee
          ? { committeeId: selectedArrangeCommittee.id }
          : {}),
      });
      const yearLabel = ACADEMIC_YEARS.find((y) => y.value === circYear)?.label ?? `${circYear}`;
      const semLabel = YEAR_SEMESTERS.find((s) => s.value === circTermSem)?.label ?? `${circTermSem}`;
      setFeedback(
        `Arranged Examination & Published Circular "${res.circular.title}" (${yearLabel} Year, ${semLabel} Semester · ${res.circular.session}).`
      );
      setCircTitle('');
      setCircScheduleNote('');
      setCircCourseCodes([]);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to publish exam circular.');
    } finally {
      setPublishingCircular(false);
    }
  }

  async function handleApplyExam(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    if (!activeCircular) return;
    try {
      const res = await pustApi.applyExam({
        circularId: activeCircular.id,
        selectedCourseCodes: selectedCourses,
      });
      setFeedback(
        `Exam form submitted (${res.application.formReference}). Complete digital fee checkout below to unlock Chairman Admit Card approval.`
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit exam form.');
    }
  }

  async function handleVerifyExam(
    app: ExamApplicationRecord,
    decision: 'Approved' | 'Rejected',
    physicalCollected?: boolean
  ) {
    setError(null);
    setFeedback(null);
    try {
      const res = await pustApi.verifyExam(app.id, { decision, physicalCollected });
      setFeedback(
        decision === 'Approved'
          ? `Issued Admit Card ${res.application.admitCardNo ?? ''} for ${app.academicId}.`
          : `Rejected exam form ${app.formReference}.`
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to verify exam form.');
    }
  }

  async function handlePublishResult(
    e: FormEvent,
    explicitTarget?: 'publish' | 'chairman' | 'admin'
  ) {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    const sanitized = courseRows
      .map((r) => ({
        code: r.code.trim().toUpperCase(),
        title: r.title.trim(),
        credits: Number(r.credits),
        marks: Number(r.marks),
      }))
      .filter((r) => r.code && r.title && r.credits > 0);

    if (sanitized.length === 0) {
      setError('Add at least one valid course row with code, title, and credits.');
      return;
    }

    const effectiveTarget = explicitTarget || resSubmissionTarget;
    setPublishingResult(true);
    try {
      const res = await pustApi.publishExamResult({
        academicId: resAcademicId.trim(),
        semester: computedResSemester,
        promotionMode: resPromoMode,
        submissionTarget: effectiveTarget,
        ...(matchingGradebookCommittee ? { committeeId: matchingGradebookCommittee.id } : {}),
        courses: sanitized,
      });

      const yearLabel = ACADEMIC_YEARS.find((y) => y.value === resYear)?.label ?? `${resYear}`;
      const semLabel = YEAR_SEMESTERS.find((s) => s.value === resTermSem)?.label ?? `${resTermSem}`;

      if (res.pendingAdminReview) {
        setFeedback(
          `Calculated & forwarded ${yearLabel} Year, ${semLabel} Semester result for ${res.result.studentName} (${res.result.academicId}) to the Admin Office (SGPA ${res.result.sgpa.toFixed(
            2
          )}).`
        );
      } else if (res.pendingChairmanReview) {
        setFeedback(
          `Calculated & forwarded ${yearLabel} Year, ${semLabel} Semester result for ${res.result.studentName} (${res.result.academicId}) to the Department Chairman (SGPA ${res.result.sgpa.toFixed(
            2
          )}).`
        );
      } else {
        const cgpaText =
          typeof res.cumulativeCgpa === 'number'
            ? ` · Updated CGPA ${res.cumulativeCgpa.toFixed(2)}`
            : '';
        setFeedback(
          `Published ${yearLabel} Year, ${semLabel} Semester result for ${res.result.studentName} (${res.result.academicId}): SGPA ${res.result.sgpa.toFixed(
            2
          )}${cgpaText} (${res.result.promotionStatus}).`
        );
      }
      setResAcademicId('');
      setRetrievedStudent(null);
      setPreviousStudentResults([]);
      setStudentLookupError(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit exam result.');
    } finally {
      setPublishingResult(false);
    }
  }

  async function handleForwardResult(r: ExamResultRecord, target: 'chairman' | 'admin') {
    setError(null);
    setFeedback(null);
    try {
      await pustApi.forwardExamResult(r.id, target);
      setFeedback(
        target === 'admin'
          ? `Forwarded Semester ${r.semester} result for ${r.academicId} to the Admin Office.`
          : `Forwarded Semester ${r.semester} result for ${r.academicId} to the Department Chairman.`
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to forward exam result.');
    }
  }

  async function handleApprovePendingResult(r: ExamResultRecord) {
    setError(null);
    setFeedback(null);
    const promoMode = pendingPromoModes[r.id] || 'auto';
    try {
      const res = await pustApi.approvePendingExamResult(r.id, promoMode);
      setFeedback(
        `Verified & published Semester ${res.result.semester} marksheet for ${res.result.academicId} (SGPA ${res.result.sgpa.toFixed(
          2
        )} · ${res.result.promotionStatus}). Cumulative CGPA updated.`
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to publish pending marksheet.');
    }
  }

  function openAdmitCardDocument(app: ExamApplicationRecord) {
    if (!app.admitCardNo) return;
    setActiveDoc({
      kind: 'admit_card',
      serialCode: app.admitCardNo,
      title: 'Official Examination Admit Card',
      subtitle: app.examTitle,
      holderName: app.studentName,
      academicId: app.academicId,
      departmentCode: app.departmentCode,
      session: app.session,
      issuedAt: app.admitCardIssuedAt || app.createdAt.slice(0, 10),
      issuedBy: 'Controller of Examinations & Department Chairman',
      statusLabel: 'Verified & Active',
      rows: [
        { label: 'Form Reference', value: app.formReference },
        { label: 'Semester', value: `Semester ${app.semester}` },
        { label: 'Total Registered Credits', value: `${app.totalCredits} Credits` },
        {
          label: 'Fee Settlement',
          value: `BDT ${app.feeBdt.toLocaleString('en-US')} · ${app.paymentMethod || 'Digital'} (${
            app.receiptNo || app.transactionId || 'Verified'
          })`,
        },
        { label: 'Hall Financial Check', value: 'Cleared' },
      ],
      tableHeaders: ['Course Code', 'Course Title', 'Credits'],
      tableRows: app.selectedCourseCodes.map((code) => {
        const info = courses.find((c) => c.code === code);
        return [code, info?.title || 'Departmental Registered Course', `${info?.credits ?? 3}`];
      }),
      footerNote:
        'Verify authenticity anytime on the Public Registry using the Admit Card number above.',
    });
  }

  function openGradeSheetDocument(r: ExamResultRecord) {
    const serial = `PUST-GRD-${r.departmentCode}-${r.academicId}-S${r.semester}`;
    setActiveDoc({
      kind: 'transcript',
      serialCode: serial,
      title: `Official Semester ${r.semester} Grade Sheet`,
      subtitle: 'Controller of Examinations · PUST 4.00 Grading Scale',
      holderName: r.studentName,
      academicId: r.academicId,
      departmentCode: r.departmentCode,
      session: r.session,
      issuedAt: r.publishedAt.slice(0, 10),
      issuedBy: r.reviewedBy ? `${r.reviewedBy} (Verified)` : r.enteredBy,
      statusLabel: r.promotionStatus,
      rows: [
        { label: 'Semester SGPA', value: `${r.sgpa.toFixed(2)} / 4.00` },
        { label: 'Academic Standing', value: r.promotionStatus },
        { label: 'Prepared By', value: r.enteredBy },
        { label: 'Verified & Published By', value: r.reviewedBy || 'Department Chairman' },
      ],
      tableHeaders: ['Code', 'Course Title', 'Cr', 'Marks', 'Grade', 'GP'],
      tableRows: r.courses.map((c) => [
        c.code,
        c.title,
        String(c.credits),
        String(c.marks),
        c.letterGrade,
        c.gradePoint.toFixed(2),
      ]),
      footerNote:
        'Grades computed automatically under the PUST Ordinance (80+ A+ 4.00 down to 40 D 2.00).',
    });
  }

  const pendingVerifyCount = applications.filter(
    (a) => a.paymentStatus === 'Paid' && a.verificationStatus === 'Pending Chairman Verification'
  ).length;

  const pendingResults = results.filter(
    (r) => !r.published || r.status === 'pending_chairman' || r.status === 'pending_admin'
  );
  const publishedResults = results.filter(
    (r) => r.published && r.status !== 'pending_chairman' && r.status !== 'pending_admin'
  );
  // Stable unique keys for React lists (guards against any residual duplicate ids)
  const publishedResultKeys = publishedResults.map((r, idx) => `${r.id}::${r.academicId}::${r.semester}::${idx}`);
  const pendingResultKeys = pendingResults.map((r, idx) => `${r.id}::${r.academicId}::${r.semester}::${idx}`);

  const canEnterMarks =
    ['teacher', 'chairman', 'admin'].includes(user.role) || myActiveCommittees.length > 0;
  const canArrangeExams =
    user.role === 'chairman' || user.role === 'admin' || myActiveCommittees.length > 0;
  const myAssignedCourseSet = useMemo(
    () => new Set((user.assignedCourses || []).map((c) => c.toUpperCase())),
    [user.assignedCourses]
  );

  return (
    <div className="space-y-6">
      {/* Role-Specific Module Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-pust-800">
            {user.role === 'student'
              ? 'Controller of Examinations · Student Desk'
              : user.role === 'teacher'
              ? `Department of ${user.departmentCode} · Gradebook & Exam Desk`
              : 'Examinations, Hall Dues Clearance & Results'}
          </p>
          <h2 className="font-serif text-2xl font-medium text-slate-900 mt-1">
            {user.role === 'student'
              ? 'Exam Form Fill-up, Admit Cards & My SGPA Results'
              : user.role === 'teacher'
              ? `${user.departmentCode} Courses, Circulars & Marksheet Submission`
              : 'Exam Form Fill-up, Admit Cards & SGPA Publishing'}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums">
          {(user.role === 'chairman' || user.role === 'admin') && (
            <>
              <div className="px-3.5 py-2 rounded-xl bg-[#F7F7F5] border border-slate-200">
                <span className="block text-[10px] uppercase tracking-wider text-slate-500">
                  Admit Queue
                </span>
                <span className="text-base font-semibold text-amber-800">{pendingVerifyCount}</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-[#F7F7F5] border border-slate-200">
                <span className="block text-[10px] uppercase tracking-wider text-slate-500">
                  Pending Results
                </span>
                <span className="text-base font-semibold text-pust-900">
                  {pendingResults.length}
                </span>
              </div>
            </>
          )}
          {user.role === 'teacher' && (
            <div className="px-3.5 py-2 rounded-xl bg-[#F7F7F5] border border-slate-200">
              <span className="block text-[10px] uppercase tracking-wider text-slate-500">
                Dept Courses
              </span>
              <span className="text-base font-semibold text-pust-900">{deptCourses.length}</span>
            </div>
          )}
          {user.role === 'student' && (
            <div className="px-3.5 py-2 rounded-xl bg-[#F7F7F5] border border-slate-200">
              <span className="block text-[10px] uppercase tracking-wider text-slate-500">
                Forms · Results
              </span>
              <span className="text-base font-semibold text-pust-900">
                {applications.length} · {publishedResults.length}
              </span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-sm text-red-900">
          {error}
        </div>
      )}
      {feedback && (
        <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 text-sm text-emerald-900">
          {feedback}
        </div>
      )}

      {/* Active Exam Committee Appointments (Visible for appointed faculty operators & teachers) */}
      {(user.role === 'teacher' || isCommitteeOperator) && (
        <div className="space-y-6">
          {myActiveCommittees.length > 0 && (
            <div className="bg-white rounded-2xl border border-pust-800/30 p-6 space-y-4 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-pust-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    Examination Committee Appointment ({myActiveCommittees.length})
                  </p>
                  <h3 className="font-serif text-lg font-medium text-slate-900 mt-0.5">
                    Your Active Session &amp; Semester Exam Committees
                  </h3>
                </div>
                <span className="font-mono text-xs text-slate-600">
                  Arrange exam schedules below &amp; calculate/forward results to Chairman or Admin Office
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {myActiveCommittees.map((cm) => {
                  const me = cm.members.find(
                    (m) => m.userId === user.id || m.email.toLowerCase() === user.email.toLowerCase()
                  );
                  const isSelected = selectedArrangeCommittee?.id === cm.id;
                  return (
                    <div
                      key={cm.id}
                      className={`p-4 rounded-xl border transition-colors ${
                        isSelected
                          ? 'border-pust-900 bg-pust-50/40'
                          : 'border-slate-200 bg-[#F7F7F5]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-mono text-[11px] font-semibold text-pust-900 uppercase">
                            {cm.departmentCode} · {cm.session} · Semester {cm.semester}
                          </p>
                          <p className="font-medium text-slate-900 text-sm mt-0.5">{cm.title}</p>
                        </div>
                        <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-800 capitalize shrink-0">
                          {me?.committeeRole === 'chair' ? 'Committee Chair' : 'Member'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-2">
                        Members: {cm.members.map((m) => `${m.name} (${m.committeeRole === 'chair' ? 'Chair' : 'Member'})`).join(', ')}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveCommitteeIdForArrange(cm.id)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer ${
                            isSelected
                              ? 'bg-pust-900 text-white'
                              : 'bg-white border border-slate-300 text-slate-800 hover:border-pust-800'
                          }`}
                        >
                          {isSelected ? 'Active for Exam Arrangement' : 'Select Term to Arrange'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-serif text-lg font-medium text-slate-900">
                  Department Course Catalog ({deptCourses.length})
                </h3>
                {(user.assignedCourses || []).length > 0 && (
                  <span className="font-mono text-[11px] font-semibold text-pust-900">
                    Assigned to you: {(user.assignedCourses || []).join(', ')}
                  </span>
                )}
              </div>
              {deptCourses.length === 0 ? (
                <p className="text-sm text-slate-600">No departmental courses registered yet.</p>
              ) : (
                <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 overflow-hidden text-sm max-h-80 overflow-y-auto">
                  {deptCourses.map((c) => {
                    const isMine =
                      myAssignedCourseSet.has(c.code.toUpperCase()) ||
                      c.teacherUserId === user.id ||
                      (c.teacherEmail && c.teacherEmail.toLowerCase() === user.email.toLowerCase());
                    return (
                      <div
                        key={c.id}
                        className={`p-3.5 flex items-center justify-between gap-2 transition-colors ${
                          isMine ? 'bg-pust-50/40' : 'bg-white hover:bg-[#F7F7F5]'
                        }`}
                      >
                        <div>
                          <p className="font-mono text-xs font-semibold text-pust-800">
                            {c.code} · Sem {c.semester} ({c.session})
                            {isMine ? ' · Assigned to You' : ''}
                          </p>
                          <p className="font-medium text-slate-900">{c.title}</p>
                          {c.teacherName && (
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Faculty: {c.teacherName}
                            </p>
                          )}
                        </div>
                        <span className="font-mono text-xs text-slate-600 tabular-nums shrink-0">
                          {c.credits} Cr
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <h3 className="font-serif text-lg font-medium text-slate-900">
                Active Examination Circulars &amp; Schedules
              </h3>
              {circulars.length === 0 ? (
                <p className="text-sm text-slate-600">No active examination circulars.</p>
              ) : (
                <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 overflow-hidden text-sm max-h-80 overflow-y-auto">
                  {circulars.map((c) => (
                    <div key={c.id} className="p-3.5 space-y-1 bg-white">
                      <p className="font-mono text-xs text-pust-800 tabular-nums">
                        {c.departmentCode} · Sem {c.semester} ({c.session}) · Deadline {c.deadline}
                      </p>
                      <p className="font-medium text-slate-900">{c.title}</p>
                      {(c.examStartDate || c.examVenue) && (
                        <p className="text-xs text-slate-600">
                          {c.examStartDate ? `Starts ${c.examStartDate}` : ''}
                          {c.examStartDate && c.examVenue ? ' · ' : ''}
                          {c.examVenue || ''}
                        </p>
                      )}
                      <p className="font-mono text-xs text-slate-500">
                        Courses: {c.eligibleCourseCodes.join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Student: Department Courses for Your Session & Semester + Exam Form Fill-up */}
      {user.role === 'student' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-serif text-lg font-medium text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-pust-800" />
                  Department Courses ({user.departmentCode} · {deptCourses.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Curriculum courses added by your Department Chairman, with assigned faculty.
                </p>
              </div>
              <select
                value={catalogSessionFilter}
                onChange={(e) => setCatalogSessionFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5]"
              >
                <option value="ALL">All Sessions</option>
                {ACADEMIC_SESSIONS.map((sess) => (
                  <option key={sess} value={sess}>
                    Session {sess}
                  </option>
                ))}
              </select>
            </div>
            {filteredCatalogCourses.length === 0 ? (
              <p className="text-sm text-slate-600">No departmental courses listed for this filter.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {filteredCatalogCourses.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-[#F7F7F5] flex items-start justify-between gap-3"
                  >
                    <div>
                      <p className="font-mono text-xs font-semibold text-pust-800">
                        {c.code} · Sem {c.semester} ({c.session})
                      </p>
                      <p className="text-sm font-medium text-slate-900 mt-0.5">{c.title}</p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {c.teacherName ? `Instructor: ${c.teacherName}` : 'Instructor: Departmental Faculty'}
                      </p>
                    </div>
                    <span className="font-mono text-xs font-semibold text-slate-700 shrink-0 tabular-nums">
                      {c.credits} Cr
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs">
            <h3 className="font-serif text-lg font-medium text-slate-900">
              Semester Examination Form Fill-up
            </h3>

            {hallBlocked ? (
              <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-sm text-amber-900 space-y-1">
                <p className="font-semibold">
                  Hall Financial Clearance Required Before Exam Form Fill-up
                </p>
                <p>
                  Our system detected {unpaidHallDues.length} uncleared Hall due(s). Pay and clear
                  your Hall dues in the Hall Seat &amp; Dues module before filling out examination
                  forms.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 text-xs text-emerald-900 font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-800 shrink-0" />
                <span>
                  Hall Clearance Verified: No outstanding Hall dues blocking examination registration.
                </span>
              </div>
            )}

            {circulars.length > 0 && activeCircular && (
              <form onSubmit={handleApplyExam} className="space-y-4">
                <div>
                  <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-600 mb-1.5">
                    Select Examination Circular
                  </label>
                  <select
                    value={activeCircular.id}
                    onChange={(e) => handleSelectCircular(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-800 focus:outline-none"
                  >
                    {circulars.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.departmentCode} · Sem {c.semester} ({c.session}) — {c.title} · Fee ৳
                        {c.feeBdt}
                      </option>
                    ))}
                  </select>
                  {(activeCircular.examStartDate || activeCircular.examVenue || activeCircular.scheduleNote) && (
                    <p className="mt-2 text-xs text-slate-600 bg-[#F7F7F5] border border-slate-200 rounded-lg px-3 py-2">
                      {activeCircular.examStartDate ? `Exam Starts: ${activeCircular.examStartDate}` : ''}
                      {activeCircular.examStartDate && activeCircular.examVenue ? ' · ' : ''}
                      {activeCircular.examVenue ? `Venue: ${activeCircular.examVenue}` : ''}
                      {activeCircular.scheduleNote ? ` · ${activeCircular.scheduleNote}` : ''}
                    </p>
                  )}
                </div>

                <div>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-slate-600 mb-2">
                    Pre-Assigned Eligible Courses (Select Courses to Register)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {activeCircular.eligibleCourseCodes.map((code) => {
                      const courseInfo = courses.find((c) => c.code === code);
                      const checked = selectedCourses.includes(code);
                      return (
                        <label
                          key={code}
                          className={`flex items-start gap-2.5 p-3 rounded-xl border text-sm cursor-pointer transition-colors ${
                            checked
                              ? 'border-pust-800 bg-pust-50/50'
                              : 'border-slate-200 bg-[#F7F7F5]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleStudentCourse(code)}
                            className="mt-1 accent-pust-800"
                          />
                          <div>
                            <p className="font-mono text-xs font-semibold text-pust-800">
                              {code} · {courseInfo?.credits ?? 3} Credits
                            </p>
                            <p className="text-slate-900">
                              {courseInfo?.title ?? 'Departmental Core Course'}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={hallBlocked || selectedCourses.length === 0}
                  className="px-5 py-2.5 text-sm font-medium rounded-lg bg-pust-900 hover:bg-pust-950 text-white disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
                >
                  Submit Exam Registration Form
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Chairman / Admin: 1) Add Course & Assign Courses to Faculty Members */}
      {(user.role === 'chairman' || user.role === 'admin') && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <form
              onSubmit={handleCreateCourse}
              className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs"
            >
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-serif text-lg font-medium text-slate-900">
                  Add Course for Department Students
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Register a curriculum course by session, year, and semester, with optional instructor assignment.
                </p>
              </div>

              <div>
                <label
                  htmlFor="course-dept"
                  className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1"
                >
                  Department Name
                </label>
                <select
                  id="course-dept"
                  value={courseDept}
                  disabled={user.role === 'chairman'}
                  onChange={(e) => setCourseDept(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:border-pust-800 focus:outline-none disabled:opacity-75"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.code}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="course-session"
                    className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1"
                  >
                    Session
                  </label>
                  <select
                    id="course-session"
                    value={courseSession}
                    onChange={(e) => setCourseSession(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:border-pust-800 focus:outline-none tabular-nums"
                  >
                    {ACADEMIC_SESSIONS.map((sess) => (
                      <option key={sess} value={sess}>
                        {sess}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="course-year"
                    className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1"
                  >
                    Year
                  </label>
                  <select
                    id="course-year"
                    value={courseYear}
                    onChange={(e) => setCourseYear(Number(e.target.value))}
                    className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:border-pust-800 focus:outline-none"
                  >
                    {ACADEMIC_YEARS.map((yr) => (
                      <option key={yr.value} value={yr.value}>
                        {yr.label} Year
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="course-term-semester"
                    className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1"
                  >
                    Semester
                  </label>
                  <select
                    id="course-term-semester"
                    value={courseTermSem}
                    onChange={(e) => setCourseTermSem(Number(e.target.value))}
                    className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:border-pust-800 focus:outline-none"
                  >
                    {YEAR_SEMESTERS.map((sem) => (
                      <option key={sem.value} value={sem.value}>
                        {sem.label} Semester
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-8">
                  <label
                    htmlFor="course-code-suffix"
                    className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1"
                  >
                    Course Code
                  </label>
                  <div className="flex items-stretch rounded-lg border border-slate-300 bg-[#F7F7F5] focus-within:bg-white focus-within:border-pust-800 overflow-hidden">
                    <span
                      className="inline-flex items-center px-3 py-2 font-mono text-xs font-semibold text-pust-900 bg-pust-50 border-r border-slate-300 select-none shrink-0"
                      title="First 3 letters of selected department"
                    >
                      {courseDeptPrefix}-
                    </span>
                    <input
                      id="course-code-suffix"
                      type="text"
                      required
                      maxLength={14}
                      value={courseCodeSuffix}
                      onChange={(e) => setCourseCodeSuffix(e.target.value.toUpperCase())}
                      placeholder="4101"
                      className="w-full min-w-0 px-3 py-2 font-mono text-xs uppercase bg-transparent text-slate-900 focus:outline-none tabular-nums"
                    />
                  </div>
                </div>

                <div className="sm:col-span-4">
                  <label
                    htmlFor="course-credits"
                    className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1"
                  >
                    Credits
                  </label>
                  <input
                    id="course-credits"
                    type="number"
                    step="0.5"
                    min={0.5}
                    max={6}
                    required
                    value={courseCredits}
                    onChange={(e) => setCourseCredits(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:border-pust-800 focus:outline-none tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="course-title"
                  className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1"
                >
                  Course Title
                </label>
                <input
                  id="course-title"
                  type="text"
                  required
                  minLength={3}
                  maxLength={120}
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="e.g. Artificial Intelligence & Neural Networks"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:border-pust-800 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="course-teacher"
                  className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1"
                >
                  Assign Course Teacher (Optional)
                </label>
                <select
                  id="course-teacher"
                  value={courseTeacherId}
                  onChange={(e) => setCourseTeacherId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:border-pust-800 focus:outline-none"
                >
                  <option value="">Assign later from catalog or faculty desk</option>
                  {scopedDeptFaculty.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.designation || f.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                  {courseDeptPrefix}-
                  {courseCodeSuffix.trim().toUpperCase() || '____'} · Semester {computedCourseSemester}/10
                </span>
                <button
                  type="submit"
                  disabled={savingCourse}
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-pust-900 text-white hover:bg-pust-950 disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
                >
                  {savingCourse ? 'Adding Course...' : 'Add Course'}
                </button>
              </div>
            </form>

            {/* Assign Courses to Teacher / Faculty Member */}
            <form
              onSubmit={handleSaveTeacherAssignments}
              className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs"
            >
              <div className="border-b border-slate-100 pb-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-serif text-lg font-medium text-slate-900 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-pust-800" />
                    Assign Courses to Faculty Member
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select a department teacher/faculty member and assign courses and academic sessions.
                  </p>
                </div>
              </div>

              {scopedDeptFaculty.length === 0 ? (
                <p className="text-xs text-slate-600">
                  No approved faculty accounts found for {user.role === 'chairman' ? user.departmentCode : courseDept}. Approve or create teacher accounts in People management first.
                </p>
              ) : (
                <>
                  <div>
                    <label
                      htmlFor="assign-faculty-select"
                      className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1"
                    >
                      Faculty Member ({scopedDeptFaculty.length} available)
                    </label>
                    <select
                      id="assign-faculty-select"
                      value={assignTeacherId}
                      onChange={(e) => handleSelectTeacherForAssign(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:border-pust-800 focus:outline-none"
                    >
                      {scopedDeptFaculty.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} — {f.designation || f.role} ({f.academicId})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Select Courses ({assignCourseCodes.length} selected)
                      </span>
                      {assignCourseCodes.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setAssignCourseCodes([])}
                          className="text-[11px] text-slate-500 hover:text-red-700 hover:underline cursor-pointer"
                        >
                          Clear selection
                        </button>
                      )}
                    </div>
                    {deptCourses.length === 0 ? (
                      <p className="text-xs text-slate-500">Add departmental courses on the left first.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                        {deptCourses.map((c) => {
                          const checked = assignCourseCodes.includes(c.code.toUpperCase());
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => toggleAssignCourseCode(c.code)}
                              aria-pressed={checked}
                              className={`px-3 py-2 text-left rounded-lg border text-xs transition-colors cursor-pointer ${
                                checked
                                  ? 'bg-pust-900 text-white border-pust-900'
                                  : 'bg-[#F7F7F5] text-slate-800 border-slate-200 hover:border-pust-700'
                              }`}
                            >
                              <span className="block font-mono font-semibold">
                                {checked ? '✓ ' : ''}
                                {c.code} · Sem {c.semester} ({c.session})
                              </span>
                              <span
                                className={`block text-[11px] truncate ${
                                  checked ? 'text-white/80' : 'text-slate-500'
                                }`}
                              >
                                {c.title}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                      Assigned Academic Sessions
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {ACADEMIC_SESSIONS.map((sess) => {
                        const active = assignSessions.includes(sess);
                        return (
                          <button
                            key={sess}
                            type="button"
                            onClick={() => toggleAssignSession(sess)}
                            aria-pressed={active}
                            className={`px-2.5 py-1 text-xs font-mono rounded-lg border cursor-pointer transition-colors ${
                              active
                                ? 'bg-pust-900 text-white border-pust-900'
                                : 'bg-[#F7F7F5] text-slate-700 border-slate-200 hover:border-pust-700'
                            }`}
                          >
                            {sess}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
                    <span className="font-mono text-[11px] text-slate-500">
                      Syncs teacher profile &amp; department course catalog
                    </span>
                    <button
                      type="submit"
                      disabled={savingTeacherAssign || !assignTeacherId}
                      className="px-4 py-2 text-xs font-medium rounded-lg bg-pust-900 text-white hover:bg-pust-950 disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {savingTeacherAssign ? 'Saving Assignment...' : 'Assign Courses to Faculty'}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>

          {/* Department Course Catalog Management Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-serif text-lg font-medium text-slate-900">
                  Department Course Catalog ({filteredCatalogCourses.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visible to department students and teachers. Assign or reassign instructors inline.
                </p>
              </div>
              <select
                value={catalogSessionFilter}
                onChange={(e) => setCatalogSessionFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5]"
              >
                <option value="ALL">All Sessions</option>
                {ACADEMIC_SESSIONS.map((sess) => (
                  <option key={sess} value={sess}>
                    Session {sess}
                  </option>
                ))}
              </select>
            </div>

            {filteredCatalogCourses.length === 0 ? (
              <p className="text-xs text-slate-600">No courses match the selected filter.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F7F7F5] border-b border-slate-200 font-mono text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="px-3 py-2.5">Code</th>
                      <th className="px-3 py-2.5">Title</th>
                      <th className="px-3 py-2.5">Session · Sem</th>
                      <th className="px-3 py-2.5">Credits</th>
                      <th className="px-3 py-2.5">Assigned Faculty</th>
                      <th className="px-3 py-2.5 text-right">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredCatalogCourses.map((c) => (
                      <tr key={c.id} className="bg-white hover:bg-[#F7F7F5]/60">
                        <td className="px-3 py-2.5 font-mono font-semibold text-pust-900 whitespace-nowrap">
                          {c.code}
                        </td>
                        <td className="px-3 py-2.5 text-slate-900 font-medium">{c.title}</td>
                        <td className="px-3 py-2.5 font-mono text-slate-600 whitespace-nowrap tabular-nums">
                          {c.session} · Sem {c.semester}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-slate-700 tabular-nums">
                          {c.credits}
                        </td>
                        <td className="px-3 py-2.5">
                          <select
                            value={c.teacherUserId || ''}
                            disabled={busyCourseId === c.id}
                            onChange={(e) => handleQuickAssignCourseTeacher(c, e.target.value)}
                            className="w-full min-w-[180px] px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:border-pust-800 focus:outline-none"
                          >
                            <option value="">Unassigned</option>
                            {scopedDeptFaculty.map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <button
                            type="button"
                            disabled={busyCourseId === c.id}
                            onClick={() => handleDeleteCourse(c)}
                            aria-label={`Remove ${c.code}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 disabled:opacity-40 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 2) Chairman / Admin: Exam Committee Formation (Session + Semester) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <form
              onSubmit={handleCreateExamCommittee}
              className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs"
            >
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-serif text-lg font-medium text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-pust-800" />
                  Create Exam Committee
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Appoint department faculty for a specific session and semester to arrange exams, calculate results, and forward them for publication.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="ec-session"
                    className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1"
                  >
                    Session
                  </label>
                  <select
                    id="ec-session"
                    value={ecSession}
                    onChange={(e) => setEcSession(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900"
                  >
                    {ACADEMIC_SESSIONS.map((sess) => (
                      <option key={sess} value={sess}>
                        {sess}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="ec-year"
                    className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1"
                  >
                    Year
                  </label>
                  <select
                    id="ec-year"
                    value={ecYear}
                    onChange={(e) => setEcYear(Number(e.target.value))}
                    className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900"
                  >
                    {ACADEMIC_YEARS.map((yr) => (
                      <option key={yr.value} value={yr.value}>
                        {yr.label} Year
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="ec-term"
                    className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1"
                  >
                    Semester
                  </label>
                  <select
                    id="ec-term"
                    value={ecTermSem}
                    onChange={(e) => setEcTermSem(Number(e.target.value))}
                    className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900"
                  >
                    {YEAR_SEMESTERS.map((sem) => (
                      <option key={sem.value} value={sem.value}>
                        {sem.label} Semester
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="ec-title"
                  className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1"
                >
                  Committee Name (Optional)
                </label>
                <input
                  id="ec-title"
                  type="text"
                  maxLength={180}
                  value={ecTitle}
                  onChange={(e) => setEcTitle(e.target.value)}
                  placeholder={`${user.role === 'chairman' ? user.departmentCode : courseDept} Exam Committee · ${ecSession} · Sem ${computedEcSemester}`}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:border-pust-800 focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="ec-chair"
                  className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1"
                >
                  Committee Chair / Convener
                </label>
                <select
                  id="ec-chair"
                  value={ecChairId}
                  onChange={(e) => setEcChairId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900"
                >
                  {scopedDeptFaculty.length === 0 ? (
                    <option value="">No approved department faculty found</option>
                  ) : (
                    scopedDeptFaculty.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.designation || f.role})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <span className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Additional Committee Members
                </span>
                <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {scopedDeptFaculty
                    .filter((f) => f.id !== ecChairId)
                    .map((f) => {
                      const active = ecMemberIds.includes(f.id);
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => toggleCommitteeMemberId(f.id)}
                          aria-pressed={active}
                          className={`px-3 py-2 text-left rounded-lg border text-xs transition-colors cursor-pointer flex items-center justify-between ${
                            active
                              ? 'bg-pust-900 text-white border-pust-900'
                              : 'bg-[#F7F7F5] text-slate-800 border-slate-200 hover:border-pust-700'
                          }`}
                        >
                          <span>
                            {active ? '✓ ' : ''}
                            {f.name}
                          </span>
                          <span className={`text-[11px] ${active ? 'text-white/80' : 'text-slate-500'}`}>
                            {f.designation || f.role}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                  {ecSession} · Semester {computedEcSemester}/10
                </span>
                <button
                  type="submit"
                  disabled={savingCommittee || !ecChairId}
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-pust-900 text-white hover:bg-pust-950 disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
                >
                  {savingCommittee ? 'Creating Committee...' : 'Create Exam Committee'}
                </button>
              </div>
            </form>

            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg font-medium text-slate-900">
                    Examination Committees ({committees.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Appointed committees can arrange examinations and calculate/forward results for their term.
                  </p>
                </div>
              </div>

              {committees.length === 0 ? (
                <p className="text-sm text-slate-600">
                  No Exam Committees formed yet. Select a session, semester, and faculty members on the left.
                </p>
              ) : (
                <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 overflow-hidden">
                  {committees.map((c) => (
                    <div key={c.id} className="p-4 space-y-2 bg-white text-xs">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-mono text-[11px] font-semibold text-pust-800 tabular-nums">
                            {c.departmentCode} · {c.session} · Semester {c.semester} ·{' '}
                            <span
                              className={
                                c.status === 'active' ? 'text-emerald-800' : 'text-slate-500'
                              }
                            >
                              {c.status === 'active' ? 'Active' : 'Dissolved'}
                            </span>
                          </p>
                          <p className="font-medium text-sm text-slate-900 mt-0.5">{c.title}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={busyCommitteeId === c.id}
                            onClick={() => handleToggleCommitteeStatus(c)}
                            className="px-2.5 py-1 rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-700 hover:border-pust-800 cursor-pointer"
                          >
                            {c.status === 'active' ? 'Dissolve' : 'Reactivate'}
                          </button>
                          <button
                            type="button"
                            disabled={busyCommitteeId === c.id}
                            onClick={() => handleDeleteCommittee(c)}
                            aria-label={`Remove ${c.title}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {c.members.map((m) => (
                          <span
                            key={m.userId}
                            className="px-2 py-1 rounded-md bg-[#F7F7F5] border border-slate-200 text-slate-800"
                          >
                            {m.name} ·{' '}
                            <span className="font-mono text-[11px] text-pust-800">
                              {m.committeeRole === 'chair' ? 'Chair' : 'Member'}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chairman / Admin / Exam Committee: Arrange Examination & Publish Exam Circular */}
      {canArrangeExams && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <form onSubmit={handleCreateExamCircular} className="space-y-4">
            <div className="border-b border-slate-100 pb-3 flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-serif text-lg font-medium text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-pust-800" />
                  {user.role === 'teacher'
                    ? 'Exam Committee: Arrange Examination & Publish Circular'
                    : 'Arrange Examination & Publish Exam Circular'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure examination date, venue, registration fee, deadline, and eligible courses.
                </p>
              </div>
              {user.role === 'teacher' && selectedArrangeCommittee && (
                <span className="font-mono text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-pust-50 text-pust-900 border border-pust-800/20">
                  {selectedArrangeCommittee.title}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-7">
                <label
                  htmlFor="circ-title"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Examination / Circular Title
                </label>
                <input
                  id="circ-title"
                  type="text"
                  required
                  minLength={5}
                  maxLength={180}
                  value={circTitle}
                  onChange={(e) => setCircTitle(e.target.value)}
                  placeholder="e.g. B.Sc. Engineering 3rd Year 1st Semester Final Exam 2026"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:border-pust-800 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-5">
                <label
                  htmlFor="circ-dept"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Department Name
                </label>
                <select
                  id="circ-dept"
                  value={circDept}
                  disabled={user.role === 'chairman' || isCommitteeOperator}
                  onChange={(e) => {
                    setCircDept(e.target.value);
                    setShowAllDeptCourses(false);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:border-pust-800 focus:outline-none disabled:opacity-75"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.code}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor="circ-session"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Session
                </label>
                <select
                  id="circ-session"
                  value={circSession}
                  disabled={isCommitteeOperator}
                  onChange={(e) => setCircSession(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:border-pust-800 focus:outline-none tabular-nums disabled:opacity-75"
                >
                  {ACADEMIC_SESSIONS.map((sess) => (
                    <option key={sess} value={sess}>
                      {sess}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="circ-year"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Year
                </label>
                <select
                  id="circ-year"
                  value={circYear}
                  disabled={isCommitteeOperator}
                  onChange={(e) => setCircYear(Number(e.target.value))}
                  className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:border-pust-800 focus:outline-none disabled:opacity-75"
                >
                  {ACADEMIC_YEARS.map((yr) => (
                    <option key={yr.value} value={yr.value}>
                      {yr.label} Year
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="circ-term-semester"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Semester
                </label>
                <select
                  id="circ-term-semester"
                  value={circTermSem}
                  disabled={isCommitteeOperator}
                  onChange={(e) => setCircTermSem(Number(e.target.value))}
                  className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:border-pust-800 focus:outline-none disabled:opacity-75"
                >
                  {YEAR_SEMESTERS.map((sem) => (
                    <option key={sem.value} value={sem.value}>
                      {sem.label} Semester
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor="circ-fee"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Exam Registration Fee (BDT)
                </label>
                <div className="flex items-stretch rounded-lg border border-slate-300 bg-[#F7F7F5] focus-within:bg-white focus-within:border-pust-800 overflow-hidden">
                  <span className="inline-flex items-center px-3 py-2 font-mono text-xs font-semibold text-pust-900 bg-pust-50 border-r border-slate-300 select-none shrink-0">
                    ৳
                  </span>
                  <input
                    id="circ-fee"
                    type="number"
                    min={100}
                    max={25000}
                    step={50}
                    required
                    value={circFee}
                    onChange={(e) => setCircFee(Number(e.target.value))}
                    className="w-full min-w-0 px-3 py-2 font-mono text-xs bg-transparent text-slate-900 focus:outline-none tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="circ-deadline"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Form Submission Deadline
                </label>
                <input
                  id="circ-deadline"
                  type="date"
                  required
                  value={circDeadline}
                  onChange={(e) => setCircDeadline(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:border-pust-800 focus:outline-none tabular-nums"
                />
              </div>

              <div>
                <label
                  htmlFor="circ-start-date"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Exam Commencement Date
                </label>
                <input
                  id="circ-start-date"
                  type="date"
                  value={circExamStartDate}
                  onChange={(e) => setCircExamStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:border-pust-800 focus:outline-none tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="circ-venue"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Examination Venue / Hall Room
                </label>
                <input
                  id="circ-venue"
                  type="text"
                  maxLength={140}
                  value={circExamVenue}
                  onChange={(e) => setCircExamVenue(e.target.value)}
                  placeholder="e.g. Academic Building Room 302 & Lab 2"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:border-pust-800 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="circ-schedule-note"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Routine / Invigilation Schedule Note
                </label>
                <input
                  id="circ-schedule-note"
                  type="text"
                  maxLength={400}
                  value={circScheduleNote}
                  onChange={(e) => setCircScheduleNote(e.target.value)}
                  placeholder="e.g. Morning shift 10:00 AM - 1:00 PM; admit card mandatory"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:border-pust-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-1 border-t border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-xs font-medium text-slate-700">
                  Eligible Courses ({circCourseCodes.length}/{Math.min(15, circularVisibleCourses.length)} selected)
                </span>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  {circularVisibleCourses.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAllVisibleCircularCourses}
                      className="font-medium text-pust-800 hover:text-pust-950 hover:underline cursor-pointer whitespace-nowrap shrink-0"
                    >
                      Select all
                    </button>
                  )}
                  {circCourseCodes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCircCourseCodes([])}
                      className="text-slate-600 hover:text-red-700 hover:underline cursor-pointer whitespace-nowrap shrink-0"
                    >
                      Deselect all
                    </button>
                  )}
                  {deptAllCircularCourses.length > filteredCircularCourses.length && (
                    <button
                      type="button"
                      onClick={() => setShowAllDeptCourses((prev) => !prev)}
                      className="text-slate-500 hover:text-slate-900 hover:underline cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {showAllDeptCourses
                        ? 'Filter by term'
                        : `All ${circDept} (${deptAllCircularCourses.length})`}
                    </button>
                  )}
                </div>
              </div>

              {circularVisibleCourses.length === 0 ? (
                <p className="text-xs text-slate-500 py-2">
                  No courses matched {circDept} · {circSession} ·{' '}
                  {ACADEMIC_YEARS.find((y) => y.value === circYear)?.label} Year,{' '}
                  {YEAR_SEMESTERS.find((s) => s.value === circTermSem)?.label} Semester. Add courses
                  on the left or view all {circDept} courses.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto overscroll-contain pr-1">
                  {circularVisibleCourses.map((c) => {
                    const active = circCourseCodes.includes(c.code);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleCircularCourse(c.code)}
                        aria-pressed={active}
                        className={`flex items-center justify-between gap-2.5 px-3 py-2 text-left rounded-lg border transition-colors cursor-pointer ${
                          active
                            ? 'bg-pust-900 text-white border-pust-900'
                            : 'bg-[#F7F7F5] text-slate-800 border-slate-200 hover:border-pust-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            aria-hidden="true"
                            className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              active
                                ? 'bg-white text-pust-900 border-white'
                                : 'bg-white border-slate-300 text-transparent'
                            }`}
                          >
                            ✓
                          </span>
                          <div className="min-w-0">
                            <span className="block font-mono text-xs font-semibold truncate">
                              {c.code}
                            </span>
                            <span
                              className={`block text-[11px] truncate ${
                                active ? 'text-white/80' : 'text-slate-500'
                              }`}
                            >
                              {c.title}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`font-mono text-[11px] tabular-nums shrink-0 ${
                            active ? 'text-white/90' : 'text-slate-500'
                          }`}
                        >
                          {c.credits} Cr
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-slate-500 tabular-nums">
                <span>Semester {computedCircSemester}/10</span>
                <span aria-hidden="true">·</span>
                <span>{circCourseCodes.length} course(s)</span>
                <span aria-hidden="true">·</span>
                <span>{selectedCircularCredits} Cr</span>
              </div>
              <button
                type="submit"
                disabled={publishingCircular || circCourseCodes.length === 0}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-pust-900 text-white hover:bg-pust-950 disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
              >
                {publishingCircular
                  ? 'Arranging Exam...'
                  : user.role === 'teacher'
                  ? 'Arrange Exam & Publish Circular'
                  : 'Publish Exam Circular'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Exam Form Applications, Payment, Admit Card Issuance (Student, Chairman, Admin & Exam Committee) */}
      {(user.role === 'student' ||
        user.role === 'chairman' ||
        user.role === 'admin' ||
        myActiveCommittees.length > 0) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <h3 className="font-serif text-lg font-medium text-slate-900">
            Examination Registrations, Digital Payments &amp; Admit Cards
          </h3>
          {loading ? (
            <PortalRecordsSkeleton rows={3} />
          ) : applications.length === 0 ? (
            <p className="text-sm text-slate-600">No examination applications submitted yet.</p>
          ) : (
            <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 overflow-hidden">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="p-4 space-y-3 bg-white hover:bg-[#F7F7F5]/60 transition-colors"
                >
                  <div className="flex flex-wrap justify-between items-start gap-3 text-sm">
                    <div>
                      <p className="font-medium text-slate-900">
                        {app.examTitle} ·{' '}
                        <span className="font-mono text-xs text-slate-600">{app.formReference}</span>
                      </p>
                      <p className="font-mono text-xs text-slate-500 tabular-nums mt-0.5">
                        {app.studentName} ({app.academicId}) · {app.departmentCode} · Credits{' '}
                        {app.totalCredits} · Fee ৳{app.feeBdt.toLocaleString('en-US')} · Payment:{' '}
                        <span
                          className={`font-semibold ${
                            app.paymentStatus === 'Paid' ? 'text-emerald-800' : 'text-amber-800'
                          }`}
                        >
                          {app.paymentStatus}
                        </span>{' '}
                        {app.receiptNo ? `(${app.receiptNo})` : ''} · Verification:{' '}
                        <span className="font-semibold text-slate-800">
                          {app.verificationStatus}
                        </span>
                      </p>
                      <p className="font-mono text-xs text-slate-600 mt-1">
                        Courses: {app.selectedCourseCodes.join(', ')}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {user.role === 'student' && app.paymentStatus === 'Pending' && (
                        <button
                          type="button"
                          onClick={() =>
                            setCheckoutTarget({
                              targetType: 'exam_application',
                              targetId: app.id,
                              title: app.examTitle,
                              subtitle: `Form ${app.formReference} · ${app.selectedCourseCodes.length} Course(s) · ${app.totalCredits} Credits`,
                              amountBdt: app.feeBdt,
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-pust-900 text-white hover:bg-pust-950 cursor-pointer whitespace-nowrap shrink-0 tabular-nums"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          Pay Online (৳{app.feeBdt.toLocaleString('en-US')})
                        </button>
                      )}

                      {app.admitCardNo && (
                        <button
                          type="button"
                          onClick={() => openAdmitCardDocument(app)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-pust-900 text-white hover:bg-pust-950 cursor-pointer whitespace-nowrap shrink-0 tabular-nums"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          View Digital Admit Card ({app.admitCardNo})
                        </button>
                      )}
                    </div>
                  </div>

                  {(user.role === 'chairman' ||
                    user.role === 'admin' ||
                    myActiveCommittees.some(
                      (c) =>
                        c.departmentCode.toUpperCase() === app.departmentCode.toUpperCase() &&
                        c.session === app.session &&
                        c.semester === app.semester
                    )) &&
                    app.paymentStatus === 'Paid' &&
                    app.verificationStatus === 'Pending Chairman Verification' && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleVerifyExam(app, 'Approved', true)}
                          className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-pust-900 text-white hover:bg-pust-950 cursor-pointer whitespace-nowrap shrink-0"
                        >
                          Verify Payment &amp; Issue Digital Admit Card
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVerifyExam(app, 'Rejected', false)}
                          className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-red-300 text-red-700 hover:bg-red-50 cursor-pointer whitespace-nowrap shrink-0"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Teacher / Chairman / Admin Interactive Multi-Course Gradebook Builder */}
      {canEnterMarks && (
        <form
          onSubmit={handlePublishResult}
          className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <p className="text-xs font-semibold text-pust-800">
                {user.role === 'teacher'
                  ? 'Step 1 · Teacher Marksheet Preparation'
                  : 'Direct Result Entry & Publication'}
              </p>
              <h3 className="font-serif text-lg font-medium text-slate-900 mt-0.5">
                Interactive Multi-Course Gradebook &amp; SGPA Calculator
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {user.role === 'teacher'
                  ? 'Retrieve a student by Academic ID, choose Year & Semester, and submit marks for Chairman review.'
                  : 'Retrieve a student by Academic ID, enter semester marks, and calculate live SGPA & cumulative CGPA.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 font-mono tabular-nums">
              <div className="px-4 py-2 rounded-xl bg-[#F7F7F5] border border-slate-200 text-right">
                <span className="block text-[11px] text-slate-500">
                  This Semester GPA
                </span>
                <span className="text-lg font-semibold text-pust-900">
                  {estimatedSgpa.toFixed(2)}{' '}
                  <span className="text-xs font-normal text-slate-500">
                    ({totalGradebookCredits} Cr)
                  </span>
                </span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-[#F7F7F5] border border-slate-200 text-right">
                <span className="block text-[11px] text-slate-500">
                  CGPA (With Prev.)
                </span>
                <span className="text-lg font-semibold text-slate-900">
                  {projectedCumulativeCgpa.toFixed(2)}{' '}
                  <span className="text-xs font-normal text-slate-500">
                    ({projectedCombinedCredits} Cr)
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-4">
              <label
                htmlFor="gradebook-academic-id"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Student Academic ID
              </label>
              <div className="flex items-stretch rounded-lg border border-slate-300 bg-[#F7F7F5] focus-within:bg-white focus-within:border-pust-800 overflow-hidden">
                <input
                  id="gradebook-academic-id"
                  type="text"
                  required
                  value={resAcademicId}
                  onChange={(e) => setResAcademicId(e.target.value)}
                  placeholder="e.g. 220101"
                  className="w-full min-w-0 px-3 py-2 text-xs font-mono bg-transparent text-slate-900 focus:outline-none tabular-nums"
                />
                <button
                  type="button"
                  onClick={() => fetchStudentContext(resAcademicId, true)}
                  disabled={studentLookupLoading || resAcademicId.trim().length < 3}
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-pust-900 bg-pust-50 border-l border-slate-300 hover:bg-pust-100 disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                  {studentLookupLoading ? 'Loading' : 'Retrieve'}
                </button>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="gradebook-year"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Year
              </label>
              <select
                id="gradebook-year"
                value={resYear}
                onChange={(e) => setResYear(Number(e.target.value))}
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:border-pust-800 focus:outline-none"
              >
                {ACADEMIC_YEARS.map((yr) => (
                  <option key={yr.value} value={yr.value}>
                    {yr.label} Year
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="gradebook-term-semester"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Semester
              </label>
              <select
                id="gradebook-term-semester"
                value={resTermSem}
                onChange={(e) => setResTermSem(Number(e.target.value))}
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:border-pust-800 focus:outline-none"
              >
                {YEAR_SEMESTERS.map((sem) => (
                  <option key={sem.value} value={sem.value}>
                    {sem.label} Semester
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="gradebook-promo"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Promotion Policy
              </label>
              <select
                id="gradebook-promo"
                value={resPromoMode}
                onChange={(e) => setResPromoMode(e.target.value as typeof resPromoMode)}
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:border-pust-800 focus:outline-none"
              >
                <option value="auto">Auto Promotion Check (SGPA &gt;= 2.00)</option>
                <option value="manual_promoted">Manual Override — Promoted</option>
                <option value="manual_repeat">Manual Override — Repeat / Probation</option>
              </select>
            </div>
          </div>

          {/* Retrieved Student Basic Information & Previous Semester Record */}
          {studentLookupLoading && (
            <div className="px-4 py-3 rounded-xl border border-slate-200 bg-[#F7F7F5] text-xs font-mono text-slate-600">
              Retrieving student record for Academic ID {resAcademicId.trim()}...
            </div>
          )}

          {!studentLookupLoading && studentLookupError && (
            <div className="px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-xs text-red-800">
              {studentLookupError}
            </div>
          )}

          {!studentLookupLoading && retrievedStudent && (
            <div className="px-4 py-3.5 rounded-xl border border-slate-200 bg-[#F7F7F5] space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex flex-wrap items-baseline gap-2 text-sm">
                  <span className="font-semibold text-slate-900">{retrievedStudent.name}</span>
                  <span className="text-slate-400" aria-hidden="true">·</span>
                  <span className="font-mono text-xs font-semibold text-pust-900 tabular-nums">
                    ID {retrievedStudent.academicId}
                  </span>
                  <span className="text-slate-400" aria-hidden="true">·</span>
                  <span className="text-xs text-slate-700">
                    {departments.find((d) => d.code === retrievedStudent.departmentCode)?.name ??
                      retrievedStudent.departmentCode}{' '}
                    ({retrievedStudent.departmentCode})
                  </span>
                  <span className="text-slate-400" aria-hidden="true">·</span>
                  <span className="font-mono text-xs text-slate-600 tabular-nums">
                    Session {retrievedStudent.session}
                  </span>
                </div>
                <span className="font-mono text-xs font-semibold text-slate-800 tabular-nums">
                  Recorded CGPA: {retrievedStudent.cgpa.toFixed(2)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 tabular-nums">
                <span>Current Semester: {retrievedStudent.currentSemester}</span>
                <span aria-hidden="true">·</span>
                <span>Completed Semesters: {retrievedStudent.completedSemesters}</span>
                <span aria-hidden="true">·</span>
                <span>Hall: {retrievedStudent.hallName}</span>
                <span aria-hidden="true">·</span>
                <span>Disciplinary Standing: {retrievedStudent.disciplinaryStatus}</span>
                <span aria-hidden="true">·</span>
                <span>Email: {retrievedStudent.email}</span>
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                {priorResultsForCgpa.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] text-slate-700 tabular-nums">
                    <span className="font-semibold text-slate-800">Previous Semesters:</span>
                    {priorResultsForCgpa.map((r, i) => {
                      const cr = r.courses.reduce((s, c) => s + (Number(c.credits) || 0), 0);
                      return (
                        <span key={r.id}>
                          {i > 0 && <span className="mr-2 text-slate-400">·</span>}
                          Sem {r.semester}: {r.sgpa.toFixed(2)} ({cr} Cr)
                        </span>
                      );
                    })}
                    <span className="text-slate-400" aria-hidden="true">·</span>
                    <span className="font-semibold text-pust-900">
                      Prev CGPA {previousStandingStats.cgpa?.toFixed(2)} ({previousStandingStats.credits} Cr)
                    </span>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-500">
                    No prior published semester marksheets in gradebook yet (this semester establishes cumulative CGPA).
                  </span>
                )}

                {existingSameSemesterResult && (
                  <span className="text-[11px] font-medium text-amber-800 tabular-nums">
                    Note: Semester {computedResSemester} already has a published result (SGPA{' '}
                    {existingSameSemesterResult.sgpa.toFixed(2)}).
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Quick Pick Courses from Catalog */}
          {(deptCourses.length > 0 || matchingGradebookTermCourses.length > 0) && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium text-slate-700">
                  Quick-Add From Course Catalog
                  {retrievedStudent ? ` (${retrievedStudent.departmentCode})` : ''}
                </p>
                {matchingGradebookTermCourses.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setCourseRows(
                        matchingGradebookTermCourses.map((c, idx) => ({
                          key: `row-${c.id}-${Date.now()}-${idx}`,
                          code: c.code,
                          title: c.title,
                          credits: c.credits,
                          marks: 75,
                        }))
                      )
                    }
                    className="text-xs font-medium text-pust-800 hover:text-pust-950 hover:underline cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Load Semester {computedResSemester} Courses ({matchingGradebookTermCourses.length})
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {deptCourses.map((c) => {
                  const already = courseRows.some(
                    (r) => r.code.toUpperCase() === c.code.toUpperCase()
                  );
                  return (
                    <button
                      key={c.id}
                      type="button"
                      disabled={already}
                      onClick={() => addCatalogCourseRow(c)}
                      className={`px-2.5 py-1 text-xs font-mono rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        already
                          ? 'bg-pust-50 border-pust-300 text-pust-900 opacity-70 cursor-default'
                          : 'bg-[#F7F7F5] border-slate-200 text-slate-700 hover:border-pust-700'
                      }`}
                    >
                      {already ? '✓ ' : '+ '}
                      {c.code}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dynamic Multi-Course Table (This Semester Result) */}
          <div className="rounded-xl border border-slate-200 overflow-x-auto">
            <table className="w-full min-w-[680px] text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F7F7F5] border-b border-slate-200 font-mono text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-3 py-2.5">Course Code</th>
                  <th className="px-3 py-2.5">Course Title</th>
                  <th className="px-3 py-2.5 w-24">Credits</th>
                  <th className="px-3 py-2.5 w-24">Marks (0–100)</th>
                  <th className="px-3 py-2.5 w-28">Grade · GP</th>
                  <th className="px-3 py-2.5 w-12 text-right">Act</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {courseRows.map((row) => {
                  const { letter, gp } = computePustGrade(row.marks);
                  return (
                    <tr key={row.key} className="bg-white">
                      <td className="p-2">
                        <input
                          type="text"
                          required
                          value={row.code}
                          onChange={(e) => updateCourseRow(row.key, { code: e.target.value })}
                          placeholder="CSE-3201"
                          className="w-full px-2.5 py-1.5 font-mono rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-800 focus:outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          required
                          value={row.title}
                          onChange={(e) => updateCourseRow(row.key, { title: e.target.value })}
                          placeholder="Course Title"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-800 focus:outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.5"
                          min={0.5}
                          max={6}
                          required
                          value={row.credits}
                          onChange={(e) =>
                            updateCourseRow(row.key, { credits: Number(e.target.value) })
                          }
                          className="w-full px-2.5 py-1.5 font-mono rounded-lg border border-slate-300 bg-[#F7F7F5] tabular-nums"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          required
                          value={row.marks}
                          onChange={(e) =>
                            updateCourseRow(row.key, { marks: Number(e.target.value) })
                          }
                          className="w-full px-2.5 py-1.5 font-mono rounded-lg border border-slate-300 bg-[#F7F7F5] tabular-nums"
                        />
                      </td>
                      <td className="px-3 py-2 font-mono font-semibold tabular-nums whitespace-nowrap">
                        <span
                          className={
                            letter === 'F' ? 'text-red-700' : 'text-pust-800'
                          }
                        >
                          {letter} · {gp.toFixed(2)}
                        </span>
                      </td>
                      <td className="p-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeCourseRow(row.key)}
                          disabled={courseRows.length <= 1}
                          aria-label="Remove course row"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 disabled:opacity-30 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Live Term GPA & Combined CGPA Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-[#F7F7F5] font-mono tabular-nums">
            <div>
              <span className="block text-[11px] text-slate-500">
                {ACADEMIC_YEARS.find((y) => y.value === resYear)?.label} Year ·{' '}
                {YEAR_SEMESTERS.find((s) => s.value === resTermSem)?.label} Sem (Sem{' '}
                {computedResSemester})
              </span>
              <span className="text-sm font-semibold text-pust-900">
                This Semester GPA: {estimatedSgpa.toFixed(2)}{' '}
                <span className="text-xs font-normal text-slate-500">
                  ({totalGradebookCredits} Cr)
                </span>
              </span>
            </div>
            <div>
              <span className="block text-[11px] text-slate-500">
                Previous Semesters ({priorResultsForCgpa.length} sem)
              </span>
              <span className="text-sm font-semibold text-slate-800">
                {previousStandingStats.cgpa !== null
                  ? `${previousStandingStats.cgpa.toFixed(2)} (${previousStandingStats.credits} Cr)`
                  : 'No prior record'}
              </span>
            </div>
            <div>
              <span className="block text-[11px] text-slate-500">
                CGPA (With Previous Semesters)
              </span>
              <span className="text-sm font-semibold text-slate-900">
                {projectedCumulativeCgpa.toFixed(2)}{' '}
                <span className="text-xs font-normal text-slate-500">
                  ({projectedCombinedCredits} Total Cr)
                </span>
              </span>
            </div>
          </div>

          {matchingGradebookCommittee && (
            <div className="px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50/70 text-xs text-emerald-950 flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">
                Active Exam Committee Match: <strong>{matchingGradebookCommittee.title}</strong>
              </span>
              <span className="font-mono text-[11px]">
                Forward calculated results to Department Chairman or Admin Office below
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={addBlankCourseRow}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-700 hover:border-pust-700 hover:text-pust-900 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Custom Course Row
            </button>
            <div className="flex flex-wrap items-center gap-2">
              {(user.role === 'teacher' || myActiveCommittees.length > 0) && (
                <>
                  <button
                    type="button"
                    disabled={publishingResult}
                    onClick={(e) => handlePublishResult(e, 'chairman')}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-lg bg-pust-900 text-white hover:bg-pust-950 disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {publishingResult
                      ? 'Submitting...'
                      : 'Calculate & Forward to Chairman'}
                  </button>
                  {matchingGradebookCommittee && (
                    <button
                      type="button"
                      disabled={publishingResult}
                      onClick={(e) => handlePublishResult(e, 'admin')}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-lg border border-pust-900 bg-white text-pust-900 hover:bg-pust-50 disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Forward to Admin Office
                    </button>
                  )}
                </>
              )}
              {(user.role === 'chairman' || user.role === 'admin') && (
                <>
                  {user.role === 'chairman' && (
                    <button
                      type="button"
                      disabled={publishingResult}
                      onClick={(e) => handlePublishResult(e, 'admin')}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-800 hover:border-pust-800 hover:text-pust-900 disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Forward to Admin Office
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={publishingResult}
                    className="px-5 py-2.5 text-xs font-semibold rounded-lg bg-pust-900 text-white hover:bg-pust-950 disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {publishingResult ? 'Saving Result...' : 'Calculate SGPA & Publish Result'}
                  </button>
                </>
              )}
            </div>
          </div>
        </form>
      )}

      {/* Pending Verification & Forwarding Queue */}
      {pendingResults.length > 0 &&
        (user.role === 'teacher' ||
          user.role === 'chairman' ||
          user.role === 'admin' ||
          myActiveCommittees.length > 0) && (
          <div className="bg-white rounded-2xl border border-amber-300 p-6 space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Calculated Results Awaiting Publish / Forwarding ({pendingResults.length})
                </p>
                <h3 className="font-serif text-lg font-medium text-slate-900 mt-0.5">
                  Result Approval &amp; Forwarding Queue (Chairman &amp; Admin Office)
                </h3>
              </div>
            </div>

            <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 overflow-hidden">
              {pendingResults.map((r, idx) => {
                const isAdminPending = r.status === 'pending_admin';
                const isMemberForResult = myActiveCommittees.some(
                  (c) =>
                    c.departmentCode.toUpperCase() === r.departmentCode.toUpperCase() &&
                    c.session === r.session &&
                    c.semester === r.semester
                );
                const canChairmanPublish = user.role === 'chairman' && !isAdminPending;
                const canAdminPublish = user.role === 'admin';
                const canForwardToAdmin =
                  !isAdminPending &&
                  (user.role === 'chairman' || user.role === 'admin' || isMemberForResult);
                const canForwardToChairman =
                  isAdminPending && (user.role === 'admin' || isMemberForResult);

                return (
                  <div
                    key={pendingResultKeys[idx] || `${r.id}-${r.academicId}-${r.semester}-${idx}`}
                    className={`p-4 space-y-3 text-sm ${
                      isAdminPending ? 'bg-slate-50/70' : 'bg-amber-50/30'
                    }`}
                  >
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <div>
                        <p className="font-medium text-slate-900">
                          {r.studentName} ({r.academicId}) · Semester {r.semester} ({r.session})
                        </p>
                        <p className="font-mono text-xs text-slate-500 mt-0.5">
                          Prepared by {r.enteredBy} · Provisional SGPA{' '}
                          <span className="font-semibold text-amber-900 tabular-nums">
                            {r.sgpa.toFixed(2)}
                          </span>{' '}
                          ·{' '}
                          <span
                            className={`font-semibold ${
                              isAdminPending ? 'text-pust-900' : 'text-amber-800'
                            }`}
                          >
                            {isAdminPending
                              ? 'Forwarded to Admin Office'
                              : 'Pending Chairman Publish / Forward'}
                          </span>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {(canChairmanPublish || canAdminPublish) && (
                          <>
                            <select
                              value={pendingPromoModes[r.id] || 'auto'}
                              onChange={(e) =>
                                setPendingPromoModes((prev) => ({
                                  ...prev,
                                  [r.id]: e.target.value as 'auto' | 'manual_promoted' | 'manual_repeat',
                                }))
                              }
                              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                            >
                              <option value="auto">Auto Promotion</option>
                              <option value="manual_promoted">Override: Promoted</option>
                              <option value="manual_repeat">Override: Repeat</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => handleApprovePendingResult(r)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-pust-900 text-white hover:bg-pust-950 cursor-pointer whitespace-nowrap shrink-0"
                            >
                              <FileCheck2 className="w-3.5 h-3.5" />
                              Verify &amp; Publish Result
                            </button>
                          </>
                        )}

                        {canForwardToAdmin && (
                          <button
                            type="button"
                            onClick={() => handleForwardResult(r, 'admin')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-800 hover:border-pust-800 hover:text-pust-900 cursor-pointer whitespace-nowrap shrink-0"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Forward to Admin Office
                          </button>
                        )}

                        {canForwardToChairman && (
                          <button
                            type="button"
                            onClick={() => handleForwardResult(r, 'chairman')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-800 hover:border-pust-800 hover:text-pust-900 cursor-pointer whitespace-nowrap shrink-0"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Forward to Chairman
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 font-mono text-xs text-slate-700">
                      {r.courses.map((c) => (
                        <span
                          key={c.code}
                          className="px-2 py-1 rounded-md bg-white border border-slate-200 tabular-nums"
                        >
                          {c.code}: {c.marks} ({c.letterGrade}, {c.gradePoint.toFixed(2)})
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {/* Published Results Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <h3 className="font-serif text-lg font-medium text-slate-900">
          Published Semester Results &amp; Promotion Standing
        </h3>
        {loading ? (
          <PortalRecordsSkeleton rows={2} />
        ) : publishedResults.length === 0 ? (
          <p className="text-sm text-slate-600">No semester results published yet.</p>
        ) : (
          <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 overflow-hidden">
            {publishedResults.map((r, idx) => (
              <div
                key={publishedResultKeys[idx] || `${r.id}-${r.academicId}-${r.semester}-${idx}`}
                className="p-4 space-y-2.5 text-sm bg-white hover:bg-[#F7F7F5]/60 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">
                      {r.studentName} ({r.academicId}) · Semester {r.semester} ({r.session})
                    </p>
                    <p className="font-mono text-xs text-slate-500 mt-0.5 tabular-nums">
                      Prepared by {r.enteredBy}
                      {r.reviewedBy ? ` · Verified by ${r.reviewedBy}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <span className="font-mono text-xs font-semibold text-pust-800 tabular-nums">
                      SGPA {r.sgpa.toFixed(2)} · {r.promotionStatus}
                    </span>
                    <button
                      type="button"
                      onClick={() => openGradeSheetDocument(r)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-800 hover:border-pust-800 hover:text-pust-900 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      View Official Grade Sheet
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2.5 font-mono text-xs text-slate-600">
                  {r.courses.map((c) => (
                    <span
                      key={c.code}
                      className="px-2 py-1 rounded-md bg-[#F7F7F5] border border-slate-200 tabular-nums"
                    >
                      {c.code}: {c.marks} ({c.letterGrade}, {c.gradePoint.toFixed(2)})
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Unified Digital Payment Checkout Modal */}
      <DigitalCheckoutModal
        target={checkoutTarget}
        gateways={gateways}
        onClose={() => setCheckoutTarget(null)}
        onSuccess={async (receipt, updatedTarget, meta) => {
          const updatedApp = updatedTarget as ExamApplicationRecord | undefined;
          if (meta?.autoIssued || updatedApp?.verificationStatus === 'Approved') {
            setFeedback(
              `Exam fee settled (${receipt.receiptNo} via ${receipt.gatewayName}). Admit Card ${
                updatedApp?.admitCardNo || ''
              } auto-issued.`
            );
          } else if (meta?.holdReason) {
            setFeedback(
              `Exam fee settled (${receipt.receiptNo} via ${receipt.gatewayName}). Auto-admit held: ${meta.holdReason}`
            );
          } else {
            setFeedback(
              `Exam fee settled cleanly (${receipt.receiptNo} via ${receipt.gatewayName}). Awaiting Chairman Admit Card verification.`
            );
          }
          await refresh();
        }}
      />

      {/* Unified Verified Digital Document Viewer (Admit Card / Official Grade Sheet) */}
      <DigitalDocumentModal
        doc={activeDoc}
        onClose={() => setActiveDoc(null)}
        onOpenVerify={(code) => navigateTo(`/verify?code=${encodeURIComponent(code)}`)}
      />
    </div>
  );
}
