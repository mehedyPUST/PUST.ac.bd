'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileText,
  Paperclip,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  X,
  XCircle,
} from 'lucide-react';
import { pustApi } from '../../lib/api';
import { PortalRecordsSkeleton } from '../PustSkeletons';
import type {
  AuthUser,
  DepartmentApprovalOverviewResponse,
  DepartmentRecord,
  DepartmentRequestCategory,
  DepartmentRequestPriority,
  DepartmentRequestRecord,
  DepartmentRequestStatus,
} from '../../types/pust';

interface ApprovalDashboardPanelProps {
  user: AuthUser;
  departments: DepartmentRecord[];
  onOpenTab: (tabId: string) => void;
}

const REQUEST_CATEGORIES: DepartmentRequestCategory[] = [
  'Leave & NOC',
  'Procurement & Lab',
  'Curriculum & Course',
  'Event & Seminar',
  'Student Exemption',
  'Grade & Exam',
];

type StatusFilter = 'all' | DepartmentRequestStatus;

function formatShortDate(iso: string): string {
  if (!iso) return '—';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso.slice(0, 10);
  return parsed.toISOString().slice(0, 10);
}

function StatusLabel({ status }: { status: DepartmentRequestStatus }) {
  switch (status) {
    case 'approved':
      return (
        <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-emerald-800 whitespace-nowrap shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Approved
        </span>
      );
    case 'revision_requested':
      return (
        <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-amber-800 whitespace-nowrap shrink-0">
          <RotateCcw className="w-3.5 h-3.5" />
          Revision Requested
        </span>
      );
    case 'declined':
      return (
        <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-red-800 whitespace-nowrap shrink-0">
          <XCircle className="w-3.5 h-3.5" />
          Declined
        </span>
      );
    case 'pending':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-700 whitespace-nowrap shrink-0">
          <Clock className="w-3.5 h-3.5 text-amber-700" />
          Pending Review
        </span>
      );
  }
}

export function ApprovalDashboardPanel({
  user,
  departments,
  onOpenTab,
}: ApprovalDashboardPanelProps) {
  const isReviewer = user.role === 'chairman' || user.role === 'admin';
  const [overview, setOverview] = useState<DepartmentApprovalOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Filters & selection
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    isReviewer ? 'pending' : 'all'
  );
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | DepartmentRequestCategory>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>(
    user.role === 'admin' ? 'ALL' : user.departmentCode
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Reviewer decision state
  const [decisionNote, setDecisionNote] = useState('');
  const [busyDecision, setBusyDecision] = useState(false);

  // Requester revision resubmission state
  const [resubmitSummary, setResubmitSummary] = useState('');
  const [resubmitJustification, setResubmitJustification] = useState('');
  const [resubmitNote, setResubmitNote] = useState('');
  const [busyResubmit, setBusyResubmit] = useState(false);

  // New request submission drawer state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<DepartmentRequestCategory>('Procurement & Lab');
  const [newPriority, setNewPriority] = useState<DepartmentRequestPriority>('Standard');
  const [newDept, setNewDept] = useState(
    user.departmentCode && user.departmentCode !== 'ADMIN'
      ? user.departmentCode
      : departments[0]?.code || 'CSE'
  );
  const [newAmount, setNewAmount] = useState('');
  const [newTargetDate, setNewTargetDate] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newJustification, setNewJustification] = useState('');
  const [newAttachments, setNewAttachments] = useState('');
  const [busyCreate, setBusyCreate] = useState(false);

  const loadApprovals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await pustApi.getDepartmentApprovals(
        user.role === 'admin' ? deptFilter : undefined
      );
      setOverview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load departmental requests.');
    } finally {
      setLoading(false);
    }
  }, [user.role, deptFilter]);

  useEffect(() => {
    loadApprovals();
  }, [loadApprovals]);

  const counts = useMemo(() => {
    const list = overview?.requests || [];
    return {
      all: list.length,
      pending: list.filter((r) => r.status === 'pending').length,
      revision_requested: list.filter((r) => r.status === 'revision_requested').length,
      approved: list.filter((r) => r.status === 'approved').length,
      declined: list.filter((r) => r.status === 'declined').length,
    };
  }, [overview]);

  const filteredRequests = useMemo(() => {
    const list = overview?.requests || [];
    const q = searchQuery.trim().toLowerCase();
    return list.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.referenceCode.toLowerCase().includes(q) ||
        item.requesterName.toLowerCase().includes(q) ||
        item.requesterAcademicId.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q)
      );
    });
  }, [overview, statusFilter, categoryFilter, searchQuery]);

  const selectedRequest: DepartmentRequestRecord | null = useMemo(() => {
    if (filteredRequests.length === 0) return null;
    if (selectedId) {
      const match = filteredRequests.find((r) => r.id === selectedId);
      if (match) return match;
    }
    return filteredRequests[0];
  }, [filteredRequests, selectedId]);

  useEffect(() => {
    if (!selectedRequest) return;
    setDecisionNote('');
    setResubmitSummary(selectedRequest.summary);
    setResubmitJustification(selectedRequest.justification);
    setResubmitNote('');
  }, [selectedRequest?.id, selectedRequest?.updatedAt]);

  async function handleReviewDecision(decision: 'approve' | 'request_revision' | 'decline') {
    if (!selectedRequest || !isReviewer) return;
    const trimmed = decisionNote.trim();
    if ((decision === 'request_revision' || decision === 'decline') && trimmed.length < 5) {
      setError(
        'Enter written revision instructions or decline reason (at least 5 characters) before submitting.'
      );
      return;
    }

    setBusyDecision(true);
    setError(null);
    setFeedback(null);
    try {
      const res = await pustApi.reviewDepartmentRequest(selectedRequest.id, {
        decision,
        note: trimmed || undefined,
      });
      const verb =
        decision === 'approve'
          ? 'approved'
          : decision === 'request_revision'
          ? 'returned for revision'
          : 'declined';
      setFeedback(`${res.request.referenceCode} has been ${verb}.`);
      setDecisionNote('');
      await loadApprovals();
      setSelectedId(res.request.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to record approval decision.');
    } finally {
      setBusyDecision(false);
    }
  }

  async function handleResubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedRequest) return;
    setBusyResubmit(true);
    setError(null);
    setFeedback(null);
    try {
      const res = await pustApi.resubmitDepartmentRequest(selectedRequest.id, {
        summary: resubmitSummary.trim(),
        justification: resubmitJustification.trim(),
        responseNote: resubmitNote.trim(),
      });
      setFeedback(
        `${res.request.referenceCode} resubmitted to ${res.request.departmentCode} Head for review.`
      );
      setResubmitNote('');
      await loadApprovals();
      setSelectedId(res.request.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to resubmit revised request.');
    } finally {
      setBusyResubmit(false);
    }
  }

  async function handleCreateRequest(e: FormEvent) {
    e.preventDefault();
    setBusyCreate(true);
    setError(null);
    setFeedback(null);
    try {
      const parsedAmount = newAmount.trim() ? Number.parseInt(newAmount.trim(), 10) : undefined;
      const attachments = newAttachments
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await pustApi.submitDepartmentRequest({
        title: newTitle.trim(),
        category: newCategory,
        priority: newPriority,
        departmentCode: user.role === 'admin' ? newDept : user.departmentCode,
        summary: newSummary.trim(),
        justification: newJustification.trim(),
        requestedAmountBdt:
          parsedAmount && Number.isFinite(parsedAmount) && parsedAmount > 0
            ? parsedAmount
            : undefined,
        targetDate: newTargetDate.trim() || undefined,
        attachments,
      });

      setFeedback(
        `Request ${res.request.referenceCode} assigned to ${res.request.departmentCode} Department Head.`
      );
      setShowCreateForm(false);
      setNewTitle('');
      setNewSummary('');
      setNewJustification('');
      setNewAmount('');
      setNewTargetDate('');
      setNewAttachments('');
      setStatusFilter('pending');
      await loadApprovals();
      setSelectedId(res.request.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit departmental request.');
    } finally {
      setBusyCreate(false);
    }
  }

  const crossChecks = overview?.crossChecks;
  const hasCrossChecks =
    Boolean(crossChecks) &&
    ((crossChecks?.pendingAccounts || 0) > 0 ||
      (crossChecks?.pendingLibrarySeals || 0) > 0 ||
      (crossChecks?.pendingExamAdmits || 0) > 0 ||
      (crossChecks?.pendingDraftResults || 0) > 0 ||
      (crossChecks?.pendingCertClearances || 0) > 0);

  const canResubmitSelected =
    Boolean(selectedRequest) &&
    selectedRequest?.status === 'revision_requested' &&
    (user.role === 'admin' ||
      selectedRequest?.requesterId === user.id ||
      selectedRequest?.requesterEmail.toLowerCase() === user.email.toLowerCase());

  if (loading && !overview) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <PortalRecordsSkeleton rows={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Surface */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="font-mono text-xs uppercase tracking-widest text-pust-800 flex items-center gap-1.5 text-left">
            <ClipboardCheck className="w-3.5 h-3.5 shrink-0" />
            {user.role === 'chairman'
              ? `${user.departmentCode} Department Head Review`
              : user.role === 'admin'
              ? 'Cross-Department Executive Oversight'
              : `${user.departmentCode} Departmental Request Desk`}
          </p>
          <h2 className="font-serif text-2xl font-medium text-slate-900">
            {isReviewer
              ? 'Departmental Approval Dashboard'
              : 'My Departmental Approval Requests'}
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl text-left">
            {user.role === 'chairman'
              ? `Inspect pending administrative requisitions, faculty leaves, lab procurement, and student exemptions assigned to ${user.departmentCode}.`
              : user.role === 'admin'
              ? 'Review pending administrative requests across academic departments or audit Chairman approval decisions.'
              : `Submit administrative requests to the ${user.departmentCode} Department Head and respond if revisions are requested.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={loadApprovals}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:border-pust-800 hover:text-pust-900 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowCreateForm((v) => !v)}
            className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-4 py-2 text-xs font-medium rounded-lg bg-pust-900 text-white hover:bg-pust-950 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {showCreateForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showCreateForm ? 'Close Form' : 'New Request'}
          </button>
        </div>
      </div>

      {/* Inline Feedback / Error Banners */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-900 flex items-start justify-between gap-3"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-xs font-mono text-red-800 hover:underline shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {feedback && (
        <div
          role="status"
          className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-sm text-emerald-900 flex items-start justify-between gap-3"
        >
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <span>{feedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-mono text-emerald-800 hover:underline shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* New Request Submission Form */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateRequest}
          className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5"
        >
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-pust-800">
                Administrative Request Submission
              </p>
              <h3 className="font-serif text-xl font-medium text-slate-900">
                Assign New Request to Department Head
              </h3>
            </div>
            <span className="font-mono text-xs text-slate-500">
              Target Dept: {user.role === 'admin' ? newDept : user.departmentCode}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-600 mb-1.5">
                Request Title
              </label>
              <input
                type="text"
                required
                minLength={5}
                maxLength={180}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Oscilloscope Probes & Logic Analyzer Procurement"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-600 mb-1.5">
                Category
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as DepartmentRequestCategory)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-700 focus:outline-none"
              >
                {REQUEST_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-600 mb-1.5">
                Priority
              </label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as DepartmentRequestPriority)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-700 focus:outline-none"
              >
                <option value="Standard">Standard</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            {user.role === 'admin' && (
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-600 mb-1.5">
                  Target Department
                </label>
                <select
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-700 focus:outline-none"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.code}>
                      {d.code} — {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-600 mb-1.5">
                Estimated Budget (BDT, optional)
              </label>
              <input
                type="number"
                min={0}
                max={50000000}
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="0"
                className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-600 mb-1.5">
                Target Date (optional)
              </label>
              <input
                type="date"
                value={newTargetDate}
                onChange={(e) => setNewTargetDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-mono rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-700 focus:outline-none"
              />
            </div>

            <div className={user.role === 'admin' ? 'lg:col-span-1' : 'lg:col-span-2'}>
              <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-600 mb-1.5">
                Supporting Attachments (comma-separated)
              </label>
              <input
                type="text"
                value={newAttachments}
                onChange={(e) => setNewAttachments(e.target.value)}
                placeholder="Quotation.pdf, Syllabus_Draft.pdf"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-700 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-600 mb-1.5">
              Executive Summary (min 10 chars)
            </label>
            <input
              type="text"
              required
              minLength={10}
              maxLength={400}
              value={newSummary}
              onChange={(e) => setNewSummary(e.target.value)}
              placeholder="Concise summary for the Chairman review queue..."
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-700 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-600 mb-1.5">
              Detailed Justification &amp; Action Scope (min 15 chars)
            </label>
            <textarea
              required
              minLength={15}
              maxLength={2500}
              rows={3}
              value={newJustification}
              onChange={(e) => setNewJustification(e.target.value)}
              placeholder="Explain academic necessity, impacted semester/lab courses, cost breakdown, or exemption grounds..."
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-700 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="min-h-[42px] px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:border-slate-400 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busyCreate}
              className="inline-flex items-center gap-1.5 min-h-[42px] px-5 py-2 text-xs font-medium rounded-lg bg-pust-900 text-white hover:bg-pust-950 disabled:opacity-60 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              {busyCreate ? 'Submitting...' : 'Submit to Department Head'}
            </button>
          </div>
        </form>
      )}

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-1">
          <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500 text-left">
            Pending Review
          </p>
          <p className="font-serif text-2xl font-medium text-amber-800 tabular-nums text-left">
            {counts.pending}
          </p>
          <p className="text-xs text-slate-600 text-left">Awaiting department head decision</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-1">
          <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500 text-left">
            Revisions Requested
          </p>
          <p className="font-serif text-2xl font-medium text-slate-900 tabular-nums text-left">
            {counts.revision_requested}
          </p>
          <p className="text-xs text-slate-600 text-left">Returned for requester updates</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-1">
          <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500 text-left">
            Approved
          </p>
          <p className="font-serif text-2xl font-medium text-emerald-800 tabular-nums text-left">
            {counts.approved}
          </p>
          <p className="text-xs text-slate-600 text-left">Signed off &amp; logged</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-1">
          <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500 text-left">
            Total Requests
          </p>
          <p className="font-serif text-2xl font-medium text-slate-900 tabular-nums text-left">
            {counts.all}
          </p>
          <p className="text-xs text-slate-600 tabular-nums text-left">
            {counts.declined > 0 ? `${counts.declined} declined` : 'Scoped dossier ledger'}
          </p>
        </div>
      </div>

      {/* Other Departmental Sign-Offs Cross-Check Strip (Chairman & Admin) */}
      {isReviewer && hasCrossChecks && crossChecks && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-stone-200 bg-[#FAF9F6] flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-[11px] uppercase tracking-wider text-pust-900 font-semibold text-left">
              Pending Departmental Sign-Off Queues
            </p>
            <span className="font-mono text-[11px] text-slate-500">
              Jump directly to operational clearance desks
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-stone-200">
            {[
              {
                label: 'Account Approvals',
                count: crossChecks.pendingAccounts,
                tab: 'governance',
              },
              {
                label: 'Library Seals',
                count: crossChecks.pendingLibrarySeals,
                tab: 'library',
              },
              {
                label: 'Exam Admits',
                count: crossChecks.pendingExamAdmits,
                tab: 'exams',
              },
              {
                label: 'Draft Results',
                count: crossChecks.pendingDraftResults,
                tab: 'exams',
              },
              {
                label: 'Cert Clearances',
                count: crossChecks.pendingCertClearances,
                tab: 'certificates',
              },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => onOpenTab(item.tab)}
                className="p-4 text-left hover:bg-[#FAF9F6] transition-colors flex items-center justify-between gap-2 cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="text-xs text-slate-600 truncate text-left">{item.label}</p>
                  <p className="font-mono text-lg font-semibold text-slate-900 tabular-nums mt-0.5 text-left">
                    {item.count}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Filter departmental requests by status"
          className="inline-flex flex-wrap gap-1 bg-stone-100 border border-stone-200/80 rounded-lg p-1"
        >
          {(
            [
              { id: 'pending', label: 'Pending', count: counts.pending },
              { id: 'revision_requested', label: 'Revisions', count: counts.revision_requested },
              { id: 'approved', label: 'Approved', count: counts.approved },
              { id: 'declined', label: 'Declined', count: counts.declined },
              { id: 'all', label: 'All', count: counts.all },
            ] as Array<{ id: StatusFilter; label: string; count: number }>
          ).map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer tabular-nums ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {user.role === 'admin' && (
            <select
              aria-label="Filter by department"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-700 focus:outline-none"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.code}>
                  {d.code}
                </option>
              ))}
            </select>
          )}

          <select
            aria-label="Filter by category"
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value as 'ALL' | DepartmentRequestCategory)
            }
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-700 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            {REQUEST_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <div className="relative flex-1 sm:flex-initial min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Reference, requester, title..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-700 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Master-Detail Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Master Queue */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-stone-200 flex items-center justify-between gap-2">
            <h3 className="font-serif text-lg font-medium text-slate-900">
              Assigned Request Queue
            </h3>
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              Showing {filteredRequests.length} of {counts.all}
            </span>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <p className="text-sm text-slate-600 text-center">
                No administrative requests match the current filters.
              </p>
              {(statusFilter !== 'all' || categoryFilter !== 'ALL' || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('all');
                    setCategoryFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-stone-300 bg-[#FAF9F6] text-pust-900 hover:border-pust-800 cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-stone-200">
              {filteredRequests.map((item) => {
                const isSelected = selectedRequest?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full text-left p-5 space-y-2 transition-colors cursor-pointer ${
                      isSelected ? 'bg-[#FAF9F6]' : 'bg-white hover:bg-[#FAF9F6]/70'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-serif text-base font-medium text-slate-900 leading-snug text-left">
                        {item.title}
                      </p>
                      <StatusLabel status={item.status} />
                    </div>

                    <p className="font-mono text-[11px] text-slate-600 tabular-nums text-left">
                      <span className="text-pust-900 font-semibold">{item.referenceCode}</span>
                      {' · '}
                      {item.category}
                      {' · '}
                      {item.requesterName} ({item.requesterRole})
                      {' · '}
                      {item.departmentCode}
                      {' · '}
                      {formatShortDate(item.updatedAt)}
                      {item.priority === 'Urgent' && (
                        <>
                          {' · '}
                          <span className="text-red-700 font-semibold uppercase">Urgent</span>
                        </>
                      )}
                    </p>

                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <p className="text-xs text-slate-600 line-clamp-2 flex-1 min-w-[200px] text-left">
                        {item.summary}
                      </p>
                      {typeof item.requestedAmountBdt === 'number' && item.requestedAmountBdt > 0 && (
                        <span className="font-mono text-xs font-semibold text-slate-900 tabular-nums shrink-0">
                          BDT {item.requestedAmountBdt.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Detail & Decision Dossier */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto overscroll-contain bg-white rounded-2xl border border-stone-200 p-6 space-y-5">
          {!selectedRequest ? (
            <div className="py-10 text-center space-y-2">
              <ClipboardCheck className="w-7 h-7 text-slate-400 mx-auto" />
              <p className="text-sm text-slate-600 text-center">
                Select a request from the queue to inspect its dossier and review history.
              </p>
            </div>
          ) : (
            <>
              {/* Dossier Title & Status */}
              <div className="border-b border-slate-200 pb-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-pust-800 tabular-nums">
                    {selectedRequest.referenceCode} · {selectedRequest.departmentCode}
                  </span>
                  <StatusLabel status={selectedRequest.status} />
                </div>
                <h3 className="font-serif text-xl font-medium text-slate-900 leading-snug">
                  {selectedRequest.title}
                </h3>
                {selectedRequest.priority === 'Urgent' && (
                  <p className="font-mono text-xs font-semibold text-red-700">
                    Priority: Urgent Action Requested
                  </p>
                )}
              </div>

              {/* Metadata Grid */}
              <dl className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-[#F7F7F5] border border-slate-200 text-xs">
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                    Requester
                  </dt>
                  <dd className="font-medium text-slate-900 mt-0.5">
                    {selectedRequest.requesterName}
                  </dd>
                  <dd className="font-mono text-[11px] text-slate-600 tabular-nums">
                    {selectedRequest.requesterAcademicId} · {selectedRequest.requesterRole}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                    Category
                  </dt>
                  <dd className="font-medium text-slate-900 mt-0.5">
                    {selectedRequest.category}
                  </dd>
                  <dd className="font-mono text-[11px] text-slate-600">
                    {selectedRequest.requesterEmail}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                    Budget Request
                  </dt>
                  <dd className="font-mono font-semibold text-slate-900 mt-0.5 tabular-nums">
                    {typeof selectedRequest.requestedAmountBdt === 'number' &&
                    selectedRequest.requestedAmountBdt > 0
                      ? `BDT ${selectedRequest.requestedAmountBdt.toLocaleString()}`
                      : 'No financial outlay'}
                  </dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                    Target Date
                  </dt>
                  <dd className="font-mono text-slate-900 mt-0.5 tabular-nums flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    {selectedRequest.targetDate || 'Flexible'}
                  </dd>
                </div>
              </dl>

              {/* Narrative Summary & Justification */}
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500 mb-1">
                    Executive Summary
                  </p>
                  <p className="text-slate-800 leading-relaxed">{selectedRequest.summary}</p>
                </div>
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500 mb-1">
                    Justification &amp; Supporting Context
                  </p>
                  <p className="text-slate-700 leading-relaxed">{selectedRequest.justification}</p>
                </div>
              </div>

              {/* Attachments */}
              {selectedRequest.attachments.length > 0 && (
                <div className="space-y-1.5">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Paperclip className="w-3 h-3" />
                    Attached Documents ({selectedRequest.attachments.length})
                  </p>
                  <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-[#F7F7F5]">
                    {selectedRequest.attachments.map((file, idx) => (
                      <div
                        key={`${file}-${idx}`}
                        className="px-3 py-2 flex items-center gap-2 text-xs font-mono text-slate-700"
                      >
                        <FileText className="w-3.5 h-3.5 text-pust-800 shrink-0" />
                        <span className="truncate">{file}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Revision Notice */}
              {selectedRequest.revisionInstructions && (
                <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/70 space-y-1 text-xs">
                  <p className="font-mono text-[11px] uppercase tracking-wider font-semibold text-amber-900">
                    Department Head Revision Instructions
                  </p>
                  <p className="text-amber-950 leading-relaxed">
                    {selectedRequest.revisionInstructions}
                  </p>
                </div>
              )}

              {/* Department Head / Admin Review Action Panel */}
              {isReviewer &&
                (selectedRequest.status === 'pending' ||
                  selectedRequest.status === 'revision_requested') && (
                  <div className="pt-4 border-t border-slate-200 space-y-3">
                    <label className="block font-mono text-[11px] uppercase tracking-wider text-pust-900 font-semibold">
                      Department Head Review Decision &amp; Instructions
                    </label>
                    <textarea
                      rows={3}
                      maxLength={1000}
                      value={decisionNote}
                      onChange={(e) => setDecisionNote(e.target.value)}
                      placeholder="Optional approval remarks, OR required instructions when requesting revisions or declining (min 5 characters)..."
                      className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-700 focus:outline-none"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        disabled={busyDecision}
                        onClick={() => handleReviewDecision('approve')}
                        className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-3 py-2 text-xs font-medium rounded-lg bg-pust-900 text-white hover:bg-pust-950 disabled:opacity-60 whitespace-nowrap cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busyDecision}
                        onClick={() => handleReviewDecision('request_revision')}
                        className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-3 py-2 text-xs font-medium rounded-lg border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 disabled:opacity-60 whitespace-nowrap cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Request Revision
                      </button>
                      <button
                        type="button"
                        disabled={busyDecision}
                        onClick={() => handleReviewDecision('decline')}
                        className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-3 py-2 text-xs font-medium rounded-lg border border-red-300 bg-white text-red-800 hover:bg-red-50 disabled:opacity-60 whitespace-nowrap cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Decline
                      </button>
                    </div>
                  </div>
                )}

              {/* Requester Resubmission Form */}
              {canResubmitSelected && (
                <form
                  onSubmit={handleResubmit}
                  className="pt-4 border-t border-slate-200 space-y-3"
                >
                  <p className="font-mono text-[11px] uppercase tracking-wider text-pust-900 font-semibold">
                    Address Revision &amp; Resubmit
                  </p>
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-slate-600 mb-1">
                      Updated Summary
                    </label>
                    <input
                      type="text"
                      required
                      minLength={10}
                      maxLength={400}
                      value={resubmitSummary}
                      onChange={(e) => setResubmitSummary(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-700 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-slate-600 mb-1">
                      Updated Justification
                    </label>
                    <textarea
                      required
                      minLength={15}
                      maxLength={2500}
                      rows={3}
                      value={resubmitJustification}
                      onChange={(e) => setResubmitJustification(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-700 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-slate-600 mb-1">
                      Response Note to Department Head (min 5 chars)
                    </label>
                    <input
                      type="text"
                      required
                      minLength={5}
                      maxLength={800}
                      value={resubmitNote}
                      onChange={(e) => setResubmitNote(e.target.value)}
                      placeholder="Describe changes made or clarification provided..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-700 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={busyResubmit}
                    className="w-full inline-flex items-center justify-center gap-1.5 min-h-[42px] px-4 py-2 text-xs font-medium rounded-lg bg-pust-900 text-white hover:bg-pust-950 disabled:opacity-60 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {busyResubmit ? 'Resubmitting...' : 'Resubmit Revised Request'}
                  </button>
                </form>
              )}

              {/* Chronological Review Audit Trail */}
              <div className="pt-4 border-t border-slate-200 space-y-2.5">
                <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
                  Review &amp; Revision Audit Trail ({selectedRequest.history.length})
                </p>
                <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-[#F7F7F5]">
                  {selectedRequest.history.map((entry, idx) => (
                    <div key={`${entry.timestamp}-${idx}`} className="p-3 space-y-1 text-xs">
                      <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
                        <span className="font-semibold text-slate-900 uppercase">
                          {entry.action.replace('_', ' ')} · {entry.actor}
                        </span>
                        <span className="text-slate-500 tabular-nums shrink-0">
                          {formatShortDate(entry.timestamp)}
                        </span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{entry.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
