'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  Download,
  Filter,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  SlidersHorizontal,
} from 'lucide-react';
import { pustApi } from '../../lib/api';
import { PortalRecordsSkeleton } from '../PustSkeletons';
import type {
  AuthUser,
  CourseRecord,
  DepartmentRecord,
  ExamCommitteeRecord,
  RawCourseGradeRecord,
} from '../../types/pust';

interface ExamCommitteeGradesDashboardProps {
  user: AuthUser;
  departments: DepartmentRecord[];
  courses: CourseRecord[];
  activeCommittees: ExamCommitteeRecord[];
  preselectedTermKey?: string | null;
  onRefreshExamOverview?: () => Promise<void>;
  onLoadStudentGradesToGradebook?: (payload: {
    academicId: string;
    semester: number;
    rows: Array<{ code: string; title: string; credits: number; marks: number }>;
  }) => void;
}

type StatusFilter = 'all' | 'submitted' | 'reviewed' | 'finalized' | 'failing';
type SortKey = 'academicId' | 'courseCode' | 'marks_desc' | 'marks_asc' | 'newest';

const ACADEMIC_SESSIONS = ['2025-26', '2024-25', '2023-24', '2022-23', '2021-22', '2020-21'];

function previewGrade(totalMarks: number): { letter: string; gp: number } {
  const m = Math.max(0, Math.min(100, Math.round(Number(totalMarks) || 0)));
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

function makeTermKey(dept: string, session: string, semester: number): string {
  return `${dept.toUpperCase()}::${session}::${semester}`;
}

export function ExamCommitteeGradesDashboard({
  user,
  departments,
  courses,
  activeCommittees,
  preselectedTermKey,
  onRefreshExamOverview,
  onLoadStudentGradesToGradebook,
}: ExamCommitteeGradesDashboardProps) {
  const [rawGrades, setRawGrades] = useState<RawCourseGradeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Multi-facet filter controls
  const [searchQuery, setSearchQuery] = useState('');
  const [termFilter, setTermFilter] = useState('ALL');
  const [courseFilter, setCourseFilter] = useState('ALL');
  const [teacherFilter, setTeacherFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortKey>('academicId');

  // Selection & moderation state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busyRowId, setBusyRowId] = useState<string | null>(null);
  const [batchBusy, setBatchBusy] = useState(false);

  // Inline moderation/note editor
  const [editingRow, setEditingRow] = useState<RawCourseGradeRecord | null>(null);
  const [editCa, setEditCa] = useState(0);
  const [editFinal, setEditFinal] = useState(0);
  const [editNote, setEditNote] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Teacher raw course grade submission drawer
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [subDept, setSubDept] = useState(
    user.departmentCode === 'ADMIN' ? departments[0]?.code || 'CSE' : user.departmentCode
  );
  const [subSession, setSubSession] = useState(activeCommittees[0]?.session || '2022-23');
  const [subSemester, setSubSemester] = useState(activeCommittees[0]?.semester || 5);
  const [subCourseCode, setSubCourseCode] = useState('');
  const [subAcademicId, setSubAcademicId] = useState('');
  const [subContinuous, setSubContinuous] = useState(32);
  const [subFinal, setSubFinal] = useState(45);
  const [submittingRaw, setSubmittingRaw] = useState(false);

  const loadRawGrades = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await pustApi.getRawCourseGrades();
      setRawGrades(res.rawGrades || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load raw course grade submissions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRawGrades();
  }, [loadRawGrades]);

  useEffect(() => {
    if (preselectedTermKey) {
      setTermFilter(preselectedTermKey);
    }
  }, [preselectedTermKey]);

  const activeCommitteeKeys = useMemo(
    () =>
      new Set(
        activeCommittees.map((c) => makeTermKey(c.departmentCode, c.session, c.semester))
      ),
    [activeCommittees]
  );

  const canReviewAny =
    user.role === 'admin' || user.role === 'chairman' || activeCommittees.length > 0;

  const canReviewRow = useCallback(
    (g: RawCourseGradeRecord) => {
      if (g.status === 'finalized') return false;
      if (user.role === 'admin') return true;
      if (
        user.role === 'chairman' &&
        g.departmentCode.toUpperCase() === user.departmentCode.toUpperCase()
      ) {
        return true;
      }
      return activeCommitteeKeys.has(makeTermKey(g.departmentCode, g.session, g.semester));
    },
    [user.role, user.departmentCode, activeCommitteeKeys]
  );

  // Available course options for raw grade submission
  const submissionCourseOptions = useMemo(() => {
    const deptMatches = courses.filter(
      (c) => c.departmentCode.toUpperCase() === subDept.toUpperCase()
    );
    const termMatches = deptMatches.filter(
      (c) => c.session === subSession && c.semester === subSemester
    );
    return termMatches.length > 0 ? termMatches : deptMatches;
  }, [courses, subDept, subSession, subSemester]);

  useEffect(() => {
    if (submissionCourseOptions.length > 0 && !subCourseCode) {
      setSubCourseCode(submissionCourseOptions[0].code);
    }
  }, [submissionCourseOptions, subCourseCode]);

  // Distinct dropdown filter facets derived from loaded records + active committees
  const termOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of activeCommittees) {
      const key = makeTermKey(c.departmentCode, c.session, c.semester);
      map.set(key, `${c.departmentCode} · ${c.session} · Sem ${c.semester}`);
    }
    for (const g of rawGrades) {
      const key = makeTermKey(g.departmentCode, g.session, g.semester);
      if (!map.has(key)) {
        map.set(key, `${g.departmentCode} · ${g.session} · Sem ${g.semester}`);
      }
    }
    return Array.from(map.entries()).map(([key, label]) => ({ key, label }));
  }, [activeCommittees, rawGrades]);

  const courseOptions = useMemo(() => {
    const byCode = new Map<string, string>();
    for (const g of rawGrades) {
      if (termFilter !== 'ALL' && makeTermKey(g.departmentCode, g.session, g.semester) !== termFilter) {
        continue;
      }
      if (!byCode.has(g.courseCode)) {
        byCode.set(g.courseCode, g.courseTitle);
      }
    }
    return Array.from(byCode.entries())
      .map(([code, title]) => ({ code, title }))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [rawGrades, termFilter]);

  const teacherOptions = useMemo(() => {
    const byEmail = new Map<string, string>();
    for (const g of rawGrades) {
      if (termFilter !== 'ALL' && makeTermKey(g.departmentCode, g.session, g.semester) !== termFilter) {
        continue;
      }
      if (!byEmail.has(g.submittedByEmail)) {
        byEmail.set(g.submittedByEmail, g.submittedByName);
      }
    }
    return Array.from(byEmail.entries())
      .map(([email, name]) => ({ email, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rawGrades, termFilter]);

  // Term-scoped base set (before status/course/teacher/search filter) for KPI counts
  const termScopedGrades = useMemo(() => {
    if (termFilter === 'ALL') return rawGrades;
    return rawGrades.filter(
      (g) => makeTermKey(g.departmentCode, g.session, g.semester) === termFilter
    );
  }, [rawGrades, termFilter]);

  const kpiStats = useMemo(() => {
    const total = termScopedGrades.length;
    let submitted = 0;
    let reviewed = 0;
    let finalized = 0;
    let failing = 0;
    let sumMarks = 0;
    for (const g of termScopedGrades) {
      if (g.status === 'submitted') submitted += 1;
      if (g.status === 'reviewed') reviewed += 1;
      if (g.status === 'finalized') finalized += 1;
      if (g.totalMarks < 40 || g.gradePoint === 0) failing += 1;
      sumMarks += g.totalMarks;
    }
    return {
      total,
      submitted,
      reviewed,
      finalized,
      failing,
      avgMarks: total > 0 ? Math.round((sumMarks / total) * 10) / 10 : 0,
    };
  }, [termScopedGrades]);

  // Filtered and sorted records
  const filteredGrades = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = termScopedGrades.filter((g) => {
      if (courseFilter !== 'ALL' && g.courseCode !== courseFilter) return false;
      if (teacherFilter !== 'ALL' && g.submittedByEmail !== teacherFilter) return false;
      if (statusFilter === 'submitted' && g.status !== 'submitted') return false;
      if (statusFilter === 'reviewed' && g.status !== 'reviewed') return false;
      if (statusFilter === 'finalized' && g.status !== 'finalized') return false;
      if (statusFilter === 'failing' && g.totalMarks >= 40 && g.gradePoint > 0) return false;
      if (q) {
        const hay = [
          g.academicId,
          g.studentName,
          g.courseCode,
          g.courseTitle,
          g.submittedByName,
          g.submittedByEmail,
          g.committeeNote || '',
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'courseCode':
          return a.courseCode.localeCompare(b.courseCode) || a.academicId.localeCompare(b.academicId);
        case 'marks_desc':
          return b.totalMarks - a.totalMarks || a.academicId.localeCompare(b.academicId);
        case 'marks_asc':
          return a.totalMarks - b.totalMarks || a.academicId.localeCompare(b.academicId);
        case 'newest':
          return b.submittedAt.localeCompare(a.submittedAt);
        case 'academicId':
        default:
          return a.academicId.localeCompare(b.academicId) || a.courseCode.localeCompare(b.courseCode);
      }
    });
    return sorted;
  }, [termScopedGrades, courseFilter, teacherFilter, statusFilter, searchQuery, sortBy]);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    termFilter !== 'ALL' ||
    courseFilter !== 'ALL' ||
    teacherFilter !== 'ALL' ||
    statusFilter !== 'all';

  function resetFilters() {
    setSearchQuery('');
    setTermFilter('ALL');
    setCourseFilter('ALL');
    setTeacherFilter('ALL');
    setStatusFilter('all');
    setSortBy('academicId');
  }

  const selectableFiltered = useMemo(
    () => filteredGrades.filter((g) => canReviewRow(g)),
    [filteredGrades, canReviewRow]
  );

  const selectedRecords = useMemo(() => {
    const idSet = new Set(selectedIds);
    return rawGrades.filter((g) => idSet.has(g.id) && g.status !== 'finalized');
  }, [rawGrades, selectedIds]);

  const consolidationTarget = useMemo(() => {
    if (selectedRecords.length === 0) return null;
    const first = selectedRecords[0];
    const sameTerm = selectedRecords.every(
      (g) =>
        g.academicId === first.academicId &&
        g.departmentCode === first.departmentCode &&
        g.session === first.session &&
        g.semester === first.semester
    );
    if (!sameTerm) return null;

    // Deduplicate course codes in case of anything unexpected
    let totalWeighted = 0;
    let totalCredits = 0;
    for (const g of selectedRecords) {
      totalWeighted += g.gradePoint * g.credits;
      totalCredits += g.credits;
    }
    const projectedSgpa = totalCredits > 0 ? totalWeighted / totalCredits : 0;
    const matchingCommittee = activeCommittees.find(
      (c) =>
        c.departmentCode.toUpperCase() === first.departmentCode.toUpperCase() &&
        c.session === first.session &&
        c.semester === first.semester
    );
    return {
      academicId: first.academicId,
      studentName: first.studentName,
      departmentCode: first.departmentCode,
      session: first.session,
      semester: first.semester,
      count: selectedRecords.length,
      totalCredits,
      projectedSgpa,
      committeeId: matchingCommittee?.id,
      records: selectedRecords,
    };
  }, [selectedRecords, activeCommittees]);

  function toggleRowSelection(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function toggleSelectAllVisible() {
    const visibleIds = selectableFiltered.map((g) => g.id);
    if (visibleIds.length === 0) return;
    const allSelected = visibleIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      const removeSet = new Set(visibleIds);
      setSelectedIds((prev) => prev.filter((id) => !removeSet.has(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  }

  async function handleQuickReview(g: RawCourseGradeRecord, nextStatus: 'submitted' | 'reviewed') {
    setError(null);
    setFeedback(null);
    setBusyRowId(g.id);
    try {
      await pustApi.reviewRawCourseGrade(g.id, { status: nextStatus });
      setFeedback(
        nextStatus === 'reviewed'
          ? `Verified ${g.courseCode} raw grade for ${g.studentName} (${g.academicId}).`
          : `Flagged ${g.courseCode} raw grade for ${g.academicId} back to Pending Review.`
      );
      await loadRawGrades();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update raw grade review status.');
    } finally {
      setBusyRowId(null);
    }
  }

  function openModerationEditor(g: RawCourseGradeRecord) {
    setEditingRow(g);
    setEditCa(g.continuousMarks);
    setEditFinal(g.finalExamMarks);
    setEditNote(g.committeeNote || '');
    setError(null);
  }

  async function handleSaveModeration(e: FormEvent, nextStatus: 'submitted' | 'reviewed') {
    e.preventDefault();
    if (!editingRow) return;
    setError(null);
    setFeedback(null);
    setSavingEdit(true);
    try {
      await pustApi.reviewRawCourseGrade(editingRow.id, {
        status: nextStatus,
        continuousMarks: Number(editCa),
        finalExamMarks: Number(editFinal),
        committeeNote: editNote.trim(),
      });
      setFeedback(
        `Updated & marked ${editingRow.courseCode} (${editingRow.academicId}) as ${
          nextStatus === 'reviewed' ? 'Reviewed' : 'Submitted (Needs Recheck)'
        }.`
      );
      setEditingRow(null);
      await loadRawGrades();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save moderation update.');
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleBatchMarkReviewed() {
    if (selectedRecords.length === 0) return;
    setError(null);
    setFeedback(null);
    setBatchBusy(true);
    try {
      for (const rec of selectedRecords) {
        if (rec.status !== 'reviewed') {
          await pustApi.reviewRawCourseGrade(rec.id, { status: 'reviewed' });
        }
      }
      setFeedback(`Marked ${selectedRecords.length} selected course grade(s) as Reviewed.`);
      setSelectedIds([]);
      await loadRawGrades();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to batch verify selected grades.');
    } finally {
      setBatchBusy(false);
    }
  }

  async function handleConsolidateSelected(target: 'chairman' | 'admin' | 'publish') {
    if (!consolidationTarget) return;
    setError(null);
    setFeedback(null);
    setBatchBusy(true);
    try {
      const res = await pustApi.finalizeRawCourseGrades({
        academicId: consolidationTarget.academicId,
        session: consolidationTarget.session,
        semester: consolidationTarget.semester,
        rawGradeIds: consolidationTarget.records.map((r) => r.id),
        submissionTarget: target,
        promotionMode: 'auto',
        ...(consolidationTarget.committeeId ? { committeeId: consolidationTarget.committeeId } : {}),
      });
      setFeedback(
        target === 'publish'
          ? `Finalized ${res.finalizedCount} course grade(s) and published Semester ${consolidationTarget.semester} result for ${consolidationTarget.academicId} (SGPA ${res.result.sgpa.toFixed(2)}).`
          : target === 'admin'
          ? `Finalized ${res.finalizedCount} course grade(s) and forwarded Semester ${consolidationTarget.semester} result for ${consolidationTarget.academicId} to Admin Office (SGPA ${res.result.sgpa.toFixed(2)}).`
          : `Finalized ${res.finalizedCount} course grade(s) and forwarded Semester ${consolidationTarget.semester} result for ${consolidationTarget.academicId} to Department Chairman (SGPA ${res.result.sgpa.toFixed(2)}).`
      );
      setSelectedIds([]);
      await loadRawGrades();
      await onRefreshExamOverview?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to consolidate and finalize grades.');
    } finally {
      setBatchBusy(false);
    }
  }

  async function handleSubmitRawGrade(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    const chosenCourse = submissionCourseOptions.find(
      (c) => c.code.toUpperCase() === subCourseCode.trim().toUpperCase()
    );
    setSubmittingRaw(true);
    try {
      const res = await pustApi.submitRawCourseGrade({
        academicId: subAcademicId.trim(),
        courseCode: subCourseCode.trim().toUpperCase(),
        courseTitle: chosenCourse?.title,
        credits: chosenCourse?.credits,
        departmentCode: subDept,
        session: subSession,
        semester: Number(subSemester),
        continuousMarks: Number(subContinuous),
        finalExamMarks: Number(subFinal),
      });
      setFeedback(
        `Submitted raw course marks for ${res.rawGrade.courseCode} · ${res.rawGrade.studentName} (${res.rawGrade.academicId}): ${res.rawGrade.totalMarks}/100 (${res.rawGrade.letterGrade}).`
      );
      setSubAcademicId('');
      await loadRawGrades();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit raw course grade.');
    } finally {
      setSubmittingRaw(false);
    }
  }

  function handleExportCsv() {
    const header = [
      'Department',
      'Session',
      'Semester',
      'Course Code',
      'Course Title',
      'Credits',
      'Academic ID',
      'Student Name',
      'Continuous (40)',
      'Final (60)',
      'Total (100)',
      'Letter Grade',
      'Grade Point',
      'Submitted By',
      'Status',
      'Committee Note',
    ];
    const escapeCsv = (val: unknown) => {
      const s = String(val ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [
      header.join(','),
      ...filteredGrades.map((g) =>
        [
          g.departmentCode,
          g.session,
          g.semester,
          g.courseCode,
          g.courseTitle,
          g.credits,
          g.academicId,
          g.studentName,
          g.continuousMarks,
          g.finalExamMarks,
          g.totalMarks,
          g.letterGrade,
          g.gradePoint.toFixed(2),
          g.submittedByName,
          g.status,
          g.committeeNote || '',
        ]
          .map(escapeCsv)
          .join(',')
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pust-raw-course-grades-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const subPreview = previewGrade(Number(subContinuous) + Number(subFinal));
  const editPreview = previewGrade(Number(editCa) + Number(editFinal));

  return (
    <section
      id="exam-committee-raw-grades-dashboard"
      className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs"
    >
      {/* Top Workspace Bar */}
      <div className="px-6 py-5 border-b border-slate-200 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-pust-800 flex items-center gap-1.5">
            <ClipboardCheck className="w-3.5 h-3.5" />
            {activeCommittees.length > 0
              ? `Exam Committee Scrutiny Desk · ${activeCommittees.length} active term(s)`
              : user.role === 'chairman'
              ? `${user.departmentCode} Department Raw Marks Oversight`
              : user.role === 'admin'
              ? 'University-Wide Raw Marks Scrutiny'
              : 'Course Teacher Raw Grade Submissions'}
          </p>
          <h3 className="font-serif text-lg font-medium text-slate-900 mt-0.5">
            Raw Course Grades Scrutiny &amp; Pre-Finalization Filter
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Inspect raw continuous and final exam marks submitted by course teachers, filter anomalies or pending entries, and consolidate verified grades before forwarding results.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowSubmitForm((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-[#FAF9F6] text-slate-800 hover:border-pust-800 hover:text-pust-900 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            {showSubmitForm ? 'Hide Grade Entry' : 'Submit Raw Course Marks'}
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredGrades.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:border-slate-400 disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={loadRawGrades}
            disabled={loading}
            aria-label="Refresh raw course grades"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:border-slate-400 disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Inline Teacher Raw Marks Submission Panel */}
      {showSubmitForm && (
        <form
          onSubmit={handleSubmitRawGrade}
          className="px-6 py-5 bg-[#FAF9F6] border-b border-slate-200 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">
                Submit Raw Course Grade (Course Teacher Entry)
              </h4>
              <p className="text-xs text-slate-600">
                Record continuous assessment (0–40) and final script marks (0–60) for Exam Committee review.
              </p>
            </div>
            <span className="font-mono text-xs font-semibold text-pust-900 tabular-nums">
              Computed Total: {Math.min(100, Number(subContinuous) + Number(subFinal))}/100 ·{' '}
              {subPreview.letter} ({subPreview.gp.toFixed(2)})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 text-xs">
            <div>
              <label htmlFor="raw-sub-dept" className="block font-medium text-slate-700 mb-1">
                Department
              </label>
              <select
                id="raw-sub-dept"
                value={subDept}
                disabled={user.role !== 'admin'}
                onChange={(e) => setSubDept(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 disabled:opacity-75"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.code}>
                    {d.code}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="raw-sub-session" className="block font-medium text-slate-700 mb-1">
                Session
              </label>
              <select
                id="raw-sub-session"
                value={subSession}
                onChange={(e) => setSubSession(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 tabular-nums"
              >
                {ACADEMIC_SESSIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="raw-sub-sem" className="block font-medium text-slate-700 mb-1">
                Semester
              </label>
              <select
                id="raw-sub-sem"
                value={subSemester}
                onChange={(e) => setSubSemester(Number(e.target.value))}
                className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 tabular-nums"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="raw-sub-course" className="block font-medium text-slate-700 mb-1">
                Course Code
              </label>
              {submissionCourseOptions.length > 0 ? (
                <select
                  id="raw-sub-course"
                  value={subCourseCode}
                  onChange={(e) => setSubCourseCode(e.target.value)}
                  className="w-full px-2.5 py-2 font-mono rounded-lg border border-slate-300 bg-white text-slate-900"
                >
                  {submissionCourseOptions.map((c) => (
                    <option key={c.id} value={c.code}>
                      {c.code} — {c.title.slice(0, 22)}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="raw-sub-course"
                  type="text"
                  required
                  value={subCourseCode}
                  onChange={(e) => setSubCourseCode(e.target.value.toUpperCase())}
                  placeholder="CSE-3101"
                  className="w-full px-2.5 py-2 font-mono rounded-lg border border-slate-300 bg-white text-slate-900"
                />
              )}
            </div>

            <div>
              <label htmlFor="raw-sub-id" className="block font-medium text-slate-700 mb-1">
                Student ID
              </label>
              <input
                id="raw-sub-id"
                type="text"
                required
                value={subAcademicId}
                onChange={(e) => setSubAcademicId(e.target.value)}
                placeholder="e.g. 220101"
                className="w-full px-2.5 py-2 font-mono rounded-lg border border-slate-300 bg-white text-slate-900 tabular-nums"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="raw-sub-ca" className="block font-medium text-slate-700 mb-1">
                  CA (40)
                </label>
                <input
                  id="raw-sub-ca"
                  type="number"
                  min={0}
                  max={40}
                  required
                  value={subContinuous}
                  onChange={(e) => setSubContinuous(Number(e.target.value))}
                  className="w-full px-2 py-2 font-mono rounded-lg border border-slate-300 bg-white text-slate-900 tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="raw-sub-final" className="block font-medium text-slate-700 mb-1">
                  Final (60)
                </label>
                <input
                  id="raw-sub-final"
                  type="number"
                  min={0}
                  max={60}
                  required
                  value={subFinal}
                  onChange={(e) => setSubFinal(Number(e.target.value))}
                  className="w-full px-2 py-2 font-mono rounded-lg border border-slate-300 bg-white text-slate-900 tabular-nums"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowSubmitForm(false)}
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 cursor-pointer whitespace-nowrap shrink-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingRaw}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-pust-900 text-white hover:bg-pust-950 disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
            >
              {submittingRaw ? 'Submitting Marks...' : 'Submit to Exam Committee'}
            </button>
          </div>
        </form>
      )}

      {/* Flat Hairline KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 border-b border-slate-200 bg-[#FAF9F6]/60">
        <div className="px-5 py-3.5">
          <span className="block text-[11px] font-medium text-slate-500">
            Submitted Entries
          </span>
          <span className="mt-0.5 block font-mono text-xl font-semibold text-slate-900 tabular-nums">
            {kpiStats.total}
          </span>
        </div>
        <div className="px-5 py-3.5">
          <span className="block text-[11px] font-medium text-slate-500">
            Pending Committee Review
          </span>
          <span className="mt-0.5 block font-mono text-xl font-semibold text-amber-700 tabular-nums">
            {kpiStats.submitted}
          </span>
        </div>
        <div className="px-5 py-3.5">
          <span className="block text-[11px] font-medium text-slate-500">
            Reviewed &amp; Ready
          </span>
          <span className="mt-0.5 block font-mono text-xl font-semibold text-emerald-700 tabular-nums">
            {kpiStats.reviewed}
          </span>
        </div>
        <div className="px-5 py-3.5">
          <span className="block text-[11px] font-medium text-slate-500">
            Flagged Failing (&lt; 40)
          </span>
          <span className="mt-0.5 block font-mono text-xl font-semibold text-red-700 tabular-nums">
            {kpiStats.failing}
          </span>
        </div>
        <div className="px-5 py-3.5 col-span-2 lg:col-span-1">
          <span className="block text-[11px] font-medium text-slate-500">
            Finalized / Mean Marks
          </span>
          <span className="mt-0.5 block font-mono text-xl font-semibold text-pust-900 tabular-nums">
            {kpiStats.finalized}{' '}
            <span className="text-xs font-normal text-slate-500">· Avg {kpiStats.avgMarks}</span>
          </span>
        </div>
      </div>

      {/* Multi-Facet Filter & Segmented Status Toolbar */}
      <div className="px-6 py-4 border-b border-slate-200 space-y-3 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 text-xs">
          <div className="lg:col-span-4 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student ID, name, course, or teacher..."
              aria-label="Search raw course grades"
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 bg-[#FAF9F6] text-slate-900 focus:bg-white focus:border-pust-800 focus:outline-none"
            />
          </div>

          <div className="lg:col-span-3">
            <select
              value={termFilter}
              onChange={(e) => {
                setTermFilter(e.target.value);
                setCourseFilter('ALL');
                setTeacherFilter('ALL');
              }}
              aria-label="Filter by session and semester"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-[#FAF9F6] text-slate-900 focus:bg-white focus:border-pust-800 focus:outline-none tabular-nums"
            >
              <option value="ALL">All Terms ({rawGrades.length})</option>
              {termOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              aria-label="Filter by course"
              className="w-full px-3 py-2 font-mono rounded-lg border border-slate-300 bg-[#FAF9F6] text-slate-900 focus:bg-white focus:border-pust-800 focus:outline-none"
            >
              <option value="ALL">All Courses ({courseOptions.length})</option>
              {courseOptions.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={teacherFilter}
              onChange={(e) => setTeacherFilter(e.target.value)}
              aria-label="Filter by submitting teacher"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-[#FAF9F6] text-slate-900 focus:bg-white focus:border-pust-800 focus:outline-none"
            >
              <option value="ALL">All Teachers ({teacherOptions.length})</option>
              {teacherOptions.map((t) => (
                <option key={t.email} value={t.email}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              aria-label="Sort raw course grades"
              className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-[#FAF9F6] text-slate-900 focus:bg-white focus:border-pust-800 focus:outline-none"
            >
              <option value="academicId">ID ↑</option>
              <option value="courseCode">Course</option>
              <option value="marks_desc">Marks ↓</option>
              <option value="marks_asc">Marks ↑</option>
              <option value="newest">Latest</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="group"
            aria-label="Filter raw grades by status"
            className="inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100"
          >
            {(
              [
                { id: 'all', label: `All (${kpiStats.total})` },
                { id: 'submitted', label: `Pending Review (${kpiStats.submitted})` },
                { id: 'reviewed', label: `Reviewed (${kpiStats.reviewed})` },
                { id: 'finalized', label: `Finalized (${kpiStats.finalized})` },
                { id: 'failing', label: `Failing < 40 (${kpiStats.failing})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                  statusFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 tabular-nums">
            <span className="inline-flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" />
              Showing {filteredGrades.length} of {rawGrades.length}
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-pust-800 font-medium hover:underline cursor-pointer whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feedback / Error Banners */}
      {(error || feedback) && (
        <div className="px-6 pt-4">
          {error && (
            <div
              role="alert"
              className="p-3 rounded-xl border border-red-200 bg-red-50 text-xs text-red-900"
            >
              {error}
            </div>
          )}
          {feedback && (
            <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-xs text-emerald-900">
              {feedback}
            </div>
          )}
        </div>
      )}

      {/* Inline Committee Moderation Drawer */}
      {editingRow && (
        <form
          onSubmit={(e) => handleSaveModeration(e, 'reviewed')}
          className="mx-6 mt-4 p-4 rounded-xl border border-slate-300 bg-[#FAF9F6] space-y-3 text-xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-slate-900">
                Scrutiny &amp; Moderation · {editingRow.courseCode} ({editingRow.studentName} ·{' '}
                {editingRow.academicId})
              </p>
              <p className="text-slate-600">
                Submitted by {editingRow.submittedByName}. Update moderated marks or record an exam committee remark before finalizing.
              </p>
            </div>
            <span className="font-mono font-semibold text-pust-900 tabular-nums">
              New Total: {Math.min(100, Number(editCa) + Number(editFinal))}/100 · {editPreview.letter}{' '}
              ({editPreview.gp.toFixed(2)})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">Continuous (40)</label>
              <input
                type="number"
                min={0}
                max={40}
                required
                value={editCa}
                onChange={(e) => setEditCa(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 font-mono rounded-lg border border-slate-300 bg-white tabular-nums"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">Final Exam (60)</label>
              <input
                type="number"
                min={0}
                max={60}
                required
                value={editFinal}
                onChange={(e) => setEditFinal(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 font-mono rounded-lg border border-slate-300 bg-white tabular-nums"
              />
            </div>
            <div className="sm:col-span-8">
              <label className="block font-medium text-slate-700 mb-1">
                Committee Scrutiny Note
              </label>
              <input
                type="text"
                maxLength={300}
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="e.g. Script re-totaled; approved for final SGPA sheet"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditingRow(null)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 cursor-pointer whitespace-nowrap shrink-0"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={savingEdit}
              onClick={(e) => handleSaveModeration(e, 'submitted')}
              className="px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 font-medium cursor-pointer whitespace-nowrap shrink-0"
            >
              Flag Needs Recheck
            </button>
            <button
              type="submit"
              disabled={savingEdit}
              className="px-4 py-1.5 rounded-lg bg-pust-900 text-white font-semibold hover:bg-pust-950 disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
            >
              {savingEdit ? 'Saving...' : 'Approve & Mark Reviewed'}
            </button>
          </div>
        </form>
      )}

      {/* Selection / Consolidation Action Bar */}
      {selectedRecords.length > 0 && canReviewAny && (
        <div className="mx-6 mt-4 p-4 rounded-xl border border-pust-800/30 bg-pust-50/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <p className="font-semibold text-slate-900 tabular-nums">
              {selectedRecords.length} raw course grade(s) selected
              {consolidationTarget
                ? ` · ${consolidationTarget.studentName} (${consolidationTarget.academicId}) · ${consolidationTarget.session} Sem ${consolidationTarget.semester}`
                : ' · Select courses from a single student & semester to consolidate'}
            </p>
            {consolidationTarget && (
              <p className="font-mono text-[11px] text-pust-900 tabular-nums">
                Projected Semester GPA: {consolidationTarget.projectedSgpa.toFixed(2)} (
                {consolidationTarget.totalCredits} Credits)
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={batchBusy}
              onClick={handleBatchMarkReviewed}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg border border-slate-300 bg-white text-slate-800 hover:border-pust-800 disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              Mark Selected Reviewed
            </button>

            {consolidationTarget && onLoadStudentGradesToGradebook && (
              <button
                type="button"
                onClick={() =>
                  onLoadStudentGradesToGradebook({
                    academicId: consolidationTarget.academicId,
                    semester: consolidationTarget.semester,
                    rows: consolidationTarget.records.map((r) => ({
                      code: r.courseCode,
                      title: r.courseTitle,
                      credits: r.credits,
                      marks: r.totalMarks,
                    })),
                  })
                }
                className="px-3 py-1.5 font-medium rounded-lg border border-slate-300 bg-white text-slate-800 hover:border-pust-800 cursor-pointer whitespace-nowrap shrink-0"
              >
                Load into Gradebook
              </button>
            )}

            {consolidationTarget && (
              <>
                <button
                  type="button"
                  disabled={batchBusy}
                  onClick={() => handleConsolidateSelected('chairman')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 font-semibold rounded-lg bg-pust-900 text-white hover:bg-pust-950 disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  Finalize &amp; Forward to Chairman
                </button>
                <button
                  type="button"
                  disabled={batchBusy}
                  onClick={() => handleConsolidateSelected('admin')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 font-semibold rounded-lg border border-pust-900 bg-white text-pust-900 hover:bg-pust-50 disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  Forward to Admin Office
                </button>
                {(user.role === 'chairman' || user.role === 'admin') && (
                  <button
                    type="button"
                    disabled={batchBusy}
                    onClick={() => handleConsolidateSelected('publish')}
                    className="px-3.5 py-1.5 font-semibold rounded-lg bg-emerald-800 text-white hover:bg-emerald-900 disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Finalize &amp; Publish
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* High-Density Tabular Grade Ledger */}
      <div className="p-6">
        {loading ? (
          <PortalRecordsSkeleton rows={4} />
        ) : filteredGrades.length === 0 ? (
          <div className="py-10 px-4 text-center border border-dashed border-slate-200 rounded-xl bg-[#FAF9F6]/60 space-y-2.5">
            <p className="text-sm font-medium text-slate-900">
              {rawGrades.length === 0
                ? 'No raw course grades have been submitted by teachers yet.'
                : 'No raw course grades match the active filter criteria.'}
            </p>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              {rawGrades.length === 0
                ? 'Course teachers can record continuous and final exam marks via the "Submit Raw Course Marks" button above.'
                : 'Try clearing the search box or switching term, course, or status filters.'}
            </p>
            <div className="pt-1 flex justify-center gap-2">
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-pust-900 text-white hover:bg-pust-950 cursor-pointer whitespace-nowrap shrink-0"
                >
                  Reset All Filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowSubmitForm(true)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-pust-900 text-white hover:bg-pust-950 cursor-pointer whitespace-nowrap shrink-0"
                >
                  Submit First Course Grade
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 overflow-x-auto">
            <table className="w-full min-w-[920px] text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAF9F6] border-b border-slate-200 text-[11px] font-medium text-slate-600">
                  {canReviewAny && (
                    <th className="px-3 py-2.5 w-9">
                      <input
                        type="checkbox"
                        aria-label="Select all reviewable raw grades"
                        checked={
                          selectableFiltered.length > 0 &&
                          selectableFiltered.every((g) => selectedIds.includes(g.id))
                        }
                        onChange={toggleSelectAllVisible}
                        className="accent-pust-800 cursor-pointer"
                      />
                    </th>
                  )}
                  <th className="px-3 py-2.5">Student</th>
                  <th className="px-3 py-2.5">Course &amp; Term</th>
                  <th className="px-3 py-2.5 text-right">CA / Final</th>
                  <th className="px-3 py-2.5 text-right">Total · Grade</th>
                  <th className="px-3 py-2.5">Submitted By</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredGrades.map((g) => {
                  const isFailing = g.totalMarks < 40 || g.gradePoint === 0;
                  const reviewable = canReviewRow(g);
                  const checked = selectedIds.includes(g.id);
                  return (
                    <tr
                      key={g.id}
                      className={`transition-colors ${
                        checked
                          ? 'bg-pust-50/40'
                          : isFailing
                          ? 'bg-red-50/30 hover:bg-red-50/50'
                          : 'bg-white hover:bg-[#FAF9F6]'
                      }`}
                    >
                      {canReviewAny && (
                        <td className="px-3 py-2.5 align-top">
                          <input
                            type="checkbox"
                            disabled={!reviewable}
                            checked={checked}
                            onChange={() => toggleRowSelection(g.id)}
                            aria-label={`Select ${g.courseCode} for ${g.academicId}`}
                            className="mt-0.5 accent-pust-800 cursor-pointer disabled:opacity-30"
                          />
                        </td>
                      )}
                      <td className="px-3 py-2.5 align-top">
                        <p className="font-mono font-semibold text-slate-900 tabular-nums">
                          {g.academicId}
                        </p>
                        <p className="text-slate-700">{g.studentName}</p>
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        <p className="font-mono font-semibold text-pust-900 tabular-nums">
                          {g.courseCode} · {g.departmentCode} · {g.session} · Sem {g.semester}
                        </p>
                        <p className="text-slate-700 truncate max-w-[260px]" title={g.courseTitle}>
                          {g.courseTitle} ({g.credits} Cr)
                        </p>
                        {g.committeeNote && (
                          <p className="text-[11px] text-slate-500 mt-0.5">Note: {g.committeeNote}</p>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right align-top font-mono text-slate-700 tabular-nums whitespace-nowrap">
                        {g.continuousMarks}/40 + {g.finalExamMarks}/60
                      </td>
                      <td className="px-3 py-2.5 text-right align-top font-mono tabular-nums whitespace-nowrap">
                        <span
                          className={`font-semibold ${
                            isFailing ? 'text-red-700' : 'text-slate-900'
                          }`}
                        >
                          {g.totalMarks}/100 · {g.letterGrade} ({g.gradePoint.toFixed(2)})
                        </span>
                        {isFailing && (
                          <span className="block text-[11px] font-semibold text-red-700">
                            Below Pass Threshold
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        <p className="text-slate-800 font-medium">{g.submittedByName}</p>
                        <p className="font-mono text-[11px] text-slate-500 tabular-nums">
                          {g.submittedAt.slice(0, 10)}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 align-top whitespace-nowrap">
                        <span
                          className={`font-medium ${
                            g.status === 'finalized'
                              ? 'text-pust-900'
                              : g.status === 'reviewed'
                              ? 'text-emerald-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {g.status === 'finalized'
                            ? 'Finalized'
                            : g.status === 'reviewed'
                            ? 'Reviewed'
                            : 'Pending Review'}
                        </span>
                        {g.reviewedBy && g.status !== 'submitted' && (
                          <span className="block text-[11px] text-slate-500 truncate max-w-[140px]">
                            by {g.reviewedBy}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right align-top whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {reviewable && (
                            <>
                              <button
                                type="button"
                                disabled={busyRowId === g.id}
                                onClick={() =>
                                  handleQuickReview(
                                    g,
                                    g.status === 'reviewed' ? 'submitted' : 'reviewed'
                                  )
                                }
                                className="px-2.5 py-1 rounded-md border border-slate-300 bg-white text-slate-800 hover:border-pust-800 hover:text-pust-900 disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
                              >
                                {g.status === 'reviewed' ? 'Unverify' : 'Verify'}
                              </button>
                              <button
                                type="button"
                                onClick={() => openModerationEditor(g)}
                                title="Moderate marks or add note"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-300 bg-[#FAF9F6] text-slate-700 hover:border-slate-400 cursor-pointer whitespace-nowrap shrink-0"
                              >
                                <SlidersHorizontal className="w-3 h-3" />
                                Adjust
                              </button>
                            </>
                          )}
                          {!reviewable && g.status === 'finalized' && (
                            <span className="text-[11px] text-slate-500">Locked</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
