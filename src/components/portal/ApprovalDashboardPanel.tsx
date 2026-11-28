'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Check, RefreshCw, X } from 'lucide-react';
import { pustApi } from '../../lib/api';
import type {
  AuthUser,
  DepartmentApprovalOverviewResponse,
  DepartmentRecord,
  DepartmentRequestCategory,
  DepartmentRequestPriority,
} from '../../types/pust';

interface ApprovalDashboardPanelProps {
  user: AuthUser;
  departments: DepartmentRecord[];
  onOpenTab: (tab: string) => void;
}

export function ApprovalDashboardPanel({
  user,
  onOpenTab,
}: ApprovalDashboardPanelProps) {
  const [overview, setOverview] = useState<DepartmentApprovalOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DepartmentRequestCategory>('Leave & NOC');
  const [priority, setPriority] = useState<DepartmentRequestPriority>('Standard');
  const [summary, setSummary] = useState('');
  const [justification, setJustification] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await pustApi.getDepartmentApprovals(
        user.role === 'chairman' ? user.departmentCode : undefined
      );
      setOverview(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load departmental approvals.');
    } finally {
      setLoading(false);
    }
  }, [user.role, user.departmentCode]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  async function handleSubmitRequest(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setFeedback(null);
    try {
      await pustApi.submitDepartmentRequest({
        title: title.trim(),
        category,
        priority,
        summary: summary.trim(),
        justification: justification.trim(),
      });
      setTitle('');
      setSummary('');
      setJustification('');
      setFeedback('Departmental requisition submitted for Chairman review.');
      await loadOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit request.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReview(id: string, decision: 'approve' | 'decline') {
    setError(null);
    setFeedback(null);
    const reviewerLabel = user.role === 'admin' ? 'Admin' : 'Chairman';
    try {
      await pustApi.reviewDepartmentRequest(id, {
        decision,
        note: decision === 'approve' ? `Approved by ${reviewerLabel}.` : `Declined by ${reviewerLabel}.`,
      });
      setFeedback(decision === 'approve' ? 'Request approved.' : 'Request declined.');
      await loadOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to review request.');
    }
  }

  return (
    <div className="space-y-6">
      {feedback && (
        <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-xs text-emerald-900 dark:text-emerald-200">
          {feedback}
        </div>
      )}
      {error && (
        <div className="p-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-xs text-red-900 dark:text-red-200">
          {error}
        </div>
      )}

      {overview && (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-stone-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 dark:border-slate-800 pb-3">
            <div>
              <h2 className="font-serif text-xl font-medium text-slate-950 dark:text-slate-100">
                {user.departmentCode} Approval &amp; Cross-Check Summary
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Live departmental queue across accounts, library seals, exam forms, results, and clearances.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadOverview()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 dark:border-slate-700 bg-[#FAF9F6] dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-pust-700 dark:hover:border-gold-400 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <button
              type="button"
              onClick={() =>
                onOpenTab(user.role === 'chairman' || user.role === 'admin' ? 'users' : 'governance')
              }
              className="text-left p-3 rounded-lg border border-stone-200 dark:border-slate-700 bg-[#FAF9F6] dark:bg-slate-800/80 hover:border-pust-700 dark:hover:border-gold-400 cursor-pointer"
            >
              <p className="text-slate-600 dark:text-slate-400">Pending Accounts</p>
              <p className="font-mono text-xl font-semibold text-slate-950 dark:text-slate-100 tabular-nums">
                {overview.crossChecks.pendingAccounts}
              </p>
            </button>
            <button
              type="button"
              onClick={() => onOpenTab('library')}
              className="text-left p-3 rounded-lg border border-stone-200 dark:border-slate-700 bg-[#FAF9F6] dark:bg-slate-800/80 hover:border-pust-700 dark:hover:border-gold-400 cursor-pointer"
            >
              <p className="text-slate-600 dark:text-slate-400">Library Seals</p>
              <p className="font-mono text-xl font-semibold text-slate-950 dark:text-slate-100 tabular-nums">
                {overview.crossChecks.pendingLibrarySeals}
              </p>
            </button>
            <button
              type="button"
              onClick={() => onOpenTab('exams')}
              className="text-left p-3 rounded-lg border border-stone-200 dark:border-slate-700 bg-[#FAF9F6] dark:bg-slate-800/80 hover:border-pust-700 dark:hover:border-gold-400 cursor-pointer"
            >
              <p className="text-slate-600 dark:text-slate-400">Exam Forms</p>
              <p className="font-mono text-xl font-semibold text-slate-950 dark:text-slate-100 tabular-nums">
                {overview.crossChecks.pendingExamAdmits}
              </p>
            </button>
            <button
              type="button"
              onClick={() => onOpenTab('exams')}
              className="text-left p-3 rounded-lg border border-stone-200 dark:border-slate-700 bg-[#FAF9F6] dark:bg-slate-800/80 hover:border-pust-700 dark:hover:border-gold-400 cursor-pointer"
            >
              <p className="text-slate-600 dark:text-slate-400">Draft Results</p>
              <p className="font-mono text-xl font-semibold text-slate-950 dark:text-slate-100 tabular-nums">
                {overview.crossChecks.pendingDraftResults}
              </p>
            </button>
            <button
              type="button"
              onClick={() => onOpenTab('certificates')}
              className="text-left p-3 rounded-lg border border-stone-200 dark:border-slate-700 bg-[#FAF9F6] dark:bg-slate-800/80 hover:border-pust-700 dark:hover:border-gold-400 cursor-pointer"
            >
              <p className="text-slate-600 dark:text-slate-400">Cert Clearances</p>
              <p className="font-mono text-xl font-semibold text-slate-950 dark:text-slate-100 tabular-nums">
                {overview.crossChecks.pendingCertClearances}
              </p>
            </button>
          </div>
        </div>
      )}

      {user.role === 'teacher' && (
        <form
          onSubmit={handleSubmitRequest}
          className="bg-white dark:bg-slate-900 rounded-lg border border-stone-200 dark:border-slate-800 p-6 space-y-3 text-xs"
        >
          <h3 className="font-serif text-lg font-medium text-slate-950 dark:text-slate-100">
            Submit Departmental Request to Chairman
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              minLength={4}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Request Title"
              className="px-3 py-2 rounded-lg border border-stone-300 dark:border-slate-700 bg-[#FAF9F6] dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-pust-700 dark:focus:border-gold-400 focus:outline-none"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DepartmentRequestCategory)}
              className="px-3 py-2 rounded-lg border border-stone-300 dark:border-slate-700 bg-[#FAF9F6] dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-pust-700 dark:focus:border-gold-400 focus:outline-none"
            >
              <option value="Leave & NOC">Leave &amp; NOC</option>
              <option value="Procurement & Lab">Procurement &amp; Lab</option>
              <option value="Curriculum & Course">Curriculum &amp; Course</option>
              <option value="Event & Seminar">Event &amp; Seminar</option>
              <option value="Student Exemption">Student Exemption</option>
              <option value="Grade & Exam">Grade &amp; Exam</option>
            </select>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as DepartmentRequestPriority)}
              className="px-3 py-2 rounded-lg border border-stone-300 dark:border-slate-700 bg-[#FAF9F6] dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-pust-700 dark:focus:border-gold-400 focus:outline-none"
            >
              <option value="Standard">Standard</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
          <input
            type="text"
            required
            minLength={5}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Concise summary"
            className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-slate-700 bg-[#FAF9F6] dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-pust-700 dark:focus:border-gold-400 focus:outline-none"
          />
          <textarea
            rows={3}
            required
            minLength={8}
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Supporting justification..."
            className="w-full px-3 py-2 rounded-lg border border-stone-300 dark:border-slate-700 bg-[#FAF9F6] dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-pust-700 dark:focus:border-gold-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-pust-700 text-white font-semibold hover:bg-pust-800 disabled:opacity-60 cursor-pointer"
          >
            {submitting ? 'Submitting...' : 'Submit Departmental Request'}
          </button>
        </form>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-lg border border-stone-200 dark:border-slate-800 p-6 space-y-3 text-xs">
        <h3 className="font-serif text-lg font-medium text-slate-950 dark:text-slate-100">
          Departmental Requisitions ({overview?.requests.length ?? 0})
        </h3>
        {!overview || overview.requests.length === 0 ? (
          <p className="text-slate-600 dark:text-slate-400">No departmental requisitions recorded.</p>
        ) : (
          <div className="divide-y divide-stone-200 dark:divide-slate-800 rounded-lg border border-stone-200 dark:border-slate-800 overflow-hidden">
            {overview.requests.map((req) => (
              <div
                key={req.id}
                className="p-4 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900"
              >
                <div className="space-y-0.5">
                  <p className="font-mono text-[11px] text-pust-800 dark:text-gold-300">
                    {req.referenceCode} · {req.category} · {req.priority} · {req.status.toUpperCase()}
                  </p>
                  <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{req.title}</p>
                  <p className="text-slate-600 dark:text-slate-300">
                    {req.requesterName} ({req.requesterAcademicId}) — {req.summary}
                  </p>
                </div>
                {(user.role === 'chairman' || user.role === 'admin') &&
                  (req.status === 'pending' || req.status === 'revision_requested') && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => void handleReview(req.id, 'approve')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-pust-700 hover:bg-pust-800 text-white font-medium cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleReview(req.id, 'decline')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-slate-900 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 font-medium cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      Decline
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
