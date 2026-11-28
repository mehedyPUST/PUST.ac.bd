'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  RefreshCw,
  Search,
  UserCheck,
  X,
  XCircle,
} from 'lucide-react';
import { pustApi } from '../../lib/api';
import { isSafeMediaUrl } from '../../lib/media';
import type {
  DepartmentPersonRecord,
  FacultyProfileRequestRecord,
  FacultyProfileRequestStatus,
} from '../../types/pust';

export type EnrichedFacultyProfileRequest = FacultyProfileRequestRecord & {
  currentMember: DepartmentPersonRecord | null;
};

interface AdminFacultyRequestsPanelProps {
  onPendingCountChange?: (count: number) => void;
  onCmsChange?: () => Promise<void>;
}

function formatDateTime(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatContactList(items?: Array<{ value: string; type: string }>): string {
  if (!items || items.length === 0) return '—';
  return items.map((i) => `${i.value} (${i.type})`).join(', ');
}

function formatLineList(items?: string[]): string {
  if (!items || items.length === 0) return '—';
  return items.join(' · ');
}

export function AdminFacultyRequestsPanel({
  onPendingCountChange,
  onCmsChange,
}: AdminFacultyRequestsPanelProps) {
  const [requests, setRequests] = useState<EnrichedFacultyProfileRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<'all' | FacultyProfileRequestStatus>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [inspecting, setInspecting] = useState<EnrichedFacultyProfileRequest | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState<'approve' | 'reject' | null>(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await pustApi.getAdminFacultyProfileRequests();
      setRequests(res.requests);
      const pendingCount = res.requests.filter((r) => r.status === 'pending').length;
      onPendingCountChange?.(pendingCount);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load faculty profile approval requests.'
      );
    } finally {
      setLoading(false);
    }
  }, [onPendingCountChange]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  // Close review modal on Escape key
  useEffect(() => {
    if (!inspecting) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submittingDecision) {
        setInspecting(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [inspecting, submittingDecision]);

  const counts = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    for (const r of requests) {
      if (r.status === 'pending') pending += 1;
      else if (r.status === 'approved') approved += 1;
      else rejected += 1;
    }
    return { total: requests.length, pending, approved, rejected };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return requests.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (!q) return true;
      const hay = [
        r.teacherName,
        r.teacherEmail,
        r.teacherAcademicId,
        r.departmentCode,
        r.proposedProfile.name,
        r.proposedProfile.designation,
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [requests, statusFilter, searchQuery]);

  function openInspectModal(reqItem: EnrichedFacultyProfileRequest) {
    setInspecting(reqItem);
    setAdminNote(reqItem.adminNote || '');
    setError(null);
  }

  async function handleDecision(decision: 'approve' | 'reject') {
    if (!inspecting) return;
    setError(null);
    setFeedback(null);

    if (decision === 'reject' && adminNote.trim().length < 4) {
      setError('Provide a reason (at least 4 characters) when declining a teacher profile edit.');
      return;
    }

    setSubmittingDecision(decision);
    try {
      const res = await pustApi.reviewAdminFacultyProfileRequest(inspecting.id, {
        decision,
        adminNote: adminNote.trim() || undefined,
      });
      setInspecting(null);
      setAdminNote('');
      setFeedback(
        decision === 'approve'
          ? `Approved & published "${res.request.proposedProfile.name}" to the ${res.request.departmentCode} Department directory.`
          : `Declined profile submission from ${res.request.teacherName}.`
      );
      await loadRequests();
      if (decision === 'approve') {
        await onCmsChange?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to finalize faculty profile review.');
    } finally {
      setSubmittingDecision(null);
    }
  }

  const comparisonRows = useMemo(() => {
    if (!inspecting) return [];
    const cur = inspecting.currentMember;
    const prop = inspecting.proposedProfile;
    const rows: Array<{
      label: string;
      currentVal: string;
      proposedVal: string;
    }> = [
      { label: 'Full Name', currentVal: cur?.name || '— (New Entry)', proposedVal: prop.name },
      {
        label: 'Designation',
        currentVal: cur?.designation || '—',
        proposedVal: prop.designation,
      },
      {
        label: 'Office Location',
        currentVal: cur?.officeLocation || '—',
        proposedVal: prop.officeLocation || '—',
      },
      {
        label: 'Study Leave',
        currentVal: cur?.onStudyLeave ? 'On Study Leave' : 'Active on Campus',
        proposedVal: prop.onStudyLeave ? 'On Study Leave' : 'Active on Campus',
      },
      {
        label: 'Qualification',
        currentVal: cur?.qualification || '—',
        proposedVal: prop.qualification || '—',
      },
      {
        label: 'Research Area',
        currentVal: cur?.researchArea || '—',
        proposedVal: prop.researchArea || '—',
      },
      {
        label: 'Biography',
        currentVal: cur?.bio || '—',
        proposedVal: prop.bio || '—',
      },
      {
        label: 'Phones',
        currentVal: formatContactList(cur?.phones),
        proposedVal: formatContactList(prop.phones),
      },
      {
        label: 'Emails',
        currentVal: formatContactList(cur?.emails),
        proposedVal: formatContactList(prop.emails),
      },
      {
        label: 'Education',
        currentVal: formatLineList(cur?.education),
        proposedVal: formatLineList(prop.education),
      },
      {
        label: 'Teaching Experience',
        currentVal: formatLineList(cur?.teachingExperience),
        proposedVal: formatLineList(prop.teachingExperience),
      },
      {
        label: 'Research Interests',
        currentVal: formatLineList(cur?.researchInterests),
        proposedVal: formatLineList(prop.researchInterests),
      },
      {
        label: 'Conducted Courses',
        currentVal: formatLineList(cur?.conductedCourses),
        proposedVal: formatLineList(prop.conductedCourses),
      },
      {
        label: 'Active Research Projects',
        currentVal: formatLineList(cur?.activeResearchProjects),
        proposedVal: formatLineList(prop.activeResearchProjects),
      },
      {
        label: 'Awards',
        currentVal: formatLineList(cur?.awards),
        proposedVal: formatLineList(prop.awards),
      },
      {
        label: 'Journal Articles',
        currentVal: formatLineList(cur?.journalArticles),
        proposedVal: formatLineList(prop.journalArticles),
      },
      {
        label: 'Conference Proceedings',
        currentVal: formatLineList(cur?.conferenceProceedings),
        proposedVal: formatLineList(prop.conferenceProceedings),
      },
    ];
    return rows.map((r) => ({ ...r, changed: r.currentVal !== r.proposedVal }));
  }, [inspecting]);

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          role="status"
          className="px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-medium text-emerald-900 flex items-center justify-between gap-3"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{feedback}</span>
          </span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-emerald-700 hover:text-emerald-950 cursor-pointer"
            aria-label="Dismiss feedback"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-xs font-medium text-red-900 flex items-center justify-between gap-3"
        >
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
            <span>{error}</span>
          </span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-700 hover:text-red-950 cursor-pointer"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-200 pb-4">
          <div className="space-y-1">
            <h2 className="font-serif text-xl font-medium text-slate-950">
              Faculty Directory Profile Approvals
            </h2>
            <p className="text-xs text-slate-600">
              Inspect teacher-submitted edits and new directory profile requests before publishing changes to live public department pages.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadRequests()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-stone-300 bg-[#F7F7F5] text-slate-700 hover:border-pust-800 hover:text-slate-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 self-start lg:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </button>
        </div>

        {/* 4-Column KPI Strip */}
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border border-stone-200 bg-[#FBF6EE] px-4 py-3">
            <dt className="text-[11px] font-medium text-slate-600">Pending Admin Review</dt>
            <dd className="font-mono text-2xl font-semibold text-amber-800 tabular-nums mt-0.5">
              {counts.pending}
            </dd>
          </div>
          <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] px-4 py-3">
            <dt className="text-[11px] font-medium text-slate-600">Approved &amp; Published</dt>
            <dd className="font-mono text-2xl font-semibold text-emerald-700 tabular-nums mt-0.5">
              {counts.approved}
            </dd>
          </div>
          <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] px-4 py-3">
            <dt className="text-[11px] font-medium text-slate-600">Declined Requests</dt>
            <dd className="font-mono text-2xl font-semibold text-red-700 tabular-nums mt-0.5">
              {counts.rejected}
            </dd>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white px-4 py-3">
            <dt className="text-[11px] font-medium text-slate-600">Total Submissions</dt>
            <dd className="font-mono text-2xl font-semibold text-slate-950 tabular-nums mt-0.5">
              {counts.total}
            </dd>
          </div>
        </dl>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-stone-100 border border-stone-200">
            {(
              [
                { id: 'pending', label: `Pending (${counts.pending})` },
                { id: 'all', label: `All (${counts.total})` },
                { id: 'approved', label: `Approved (${counts.approved})` },
                { id: 'rejected', label: `Declined (${counts.rejected})` },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setStatusFilter(item.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  statusFilter === item.id
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search teacher, department, or designation..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
            />
          </div>
        </div>

        {/* Requests Table */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((row) => (
              <div
                key={row}
                className="h-12 rounded-lg bg-stone-100 animate-pulse border border-stone-200"
              />
            ))}
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] p-8 text-center space-y-1.5">
            <UserCheck className="w-6 h-6 text-slate-400 mx-auto" />
            <p className="text-sm font-medium text-slate-900">
              No faculty profile requests match the active filter
            </p>
            <p className="text-xs text-slate-600">
              Teacher submissions to update claimed directory profiles or create new entries will appear here for verification.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-stone-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F7F7F5] border-b border-stone-200 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3 w-12 font-mono">S.N</th>
                  <th className="py-2.5 px-3">Teacher Account</th>
                  <th className="py-2.5 px-3">Department &amp; Group</th>
                  <th className="py-2.5 px-3">Request Type</th>
                  <th className="py-2.5 px-3">Proposed Profile</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredRequests.map((reqItem, idx) => (
                  <tr
                    key={reqItem.id}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-[#FAF9F6]'}
                  >
                    <td className="py-2.5 px-3 font-mono text-slate-500 tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3">
                      <p className="font-medium text-slate-950">{reqItem.teacherName}</p>
                      <p className="font-mono text-[11px] text-slate-500 tabular-nums">
                        ID {reqItem.teacherAcademicId} · {reqItem.teacherEmail}
                      </p>
                    </td>
                    <td className="py-2.5 px-3">
                      <p className="font-mono font-semibold text-pust-900">
                        {reqItem.departmentCode}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {reqItem.facultyGroup === 'contractual'
                          ? 'Contractual Faculty'
                          : 'Regular Faculty'}
                      </p>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      {reqItem.requestType === 'create_new'
                        ? 'New Directory Profile'
                        : 'Edit Claimed Profile'}
                    </td>
                    <td className="py-2.5 px-3">
                      <p className="font-medium text-slate-950">{reqItem.proposedProfile.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {reqItem.proposedProfile.designation}
                      </p>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {reqItem.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-800">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Pending Review</span>
                        </span>
                      ) : reqItem.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approved</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-red-700">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Declined</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openInspectModal(reqItem)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          reqItem.status === 'pending'
                            ? 'bg-pust-900 text-white hover:bg-pust-950'
                            : 'border border-stone-300 bg-white text-slate-700 hover:border-pust-800'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>
                          {reqItem.status === 'pending' ? 'Review & Compare' : 'Inspect Details'}
                        </span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review & Diff Modal */}
      {inspecting && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Review Faculty Profile Request"
          onClick={() => {
            if (!submittingDecision) setInspecting(null);
          }}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-stone-200 bg-[#FAF9F6] flex items-start justify-between gap-4 shrink-0">
              <div className="space-y-0.5 min-w-0">
                <p className="font-mono text-[11px] font-semibold text-pust-800">
                  {inspecting.departmentCode} ·{' '}
                  {inspecting.requestType === 'create_new'
                    ? 'New Directory Entry'
                    : 'Claimed Profile Update'}{' '}
                  · Submitted {formatDateTime(inspecting.updatedAt)}
                </p>
                <h3 className="font-serif text-lg sm:text-xl font-medium text-slate-950 truncate">
                  {inspecting.proposedProfile.name} ({inspecting.proposedProfile.designation})
                </h3>
                <p className="text-xs text-slate-600">
                  Requested by {inspecting.teacherName} ({inspecting.teacherEmail} · ID{' '}
                  {inspecting.teacherAcademicId})
                </p>
              </div>
              <button
                type="button"
                disabled={Boolean(submittingDecision)}
                onClick={() => setInspecting(null)}
                aria-label="Close review modal"
                className="p-2 rounded-lg border border-stone-200 bg-white text-slate-600 hover:text-slate-950 hover:border-stone-300 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Portrait Comparison */}
              {(inspecting.currentMember?.photoUrl || inspecting.proposedProfile.photoUrl) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-stone-200 bg-[#FAF9F6] p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-xl border border-stone-200 bg-white overflow-hidden shrink-0 flex items-center justify-center">
                      {inspecting.currentMember?.photoUrl &&
                      isSafeMediaUrl(inspecting.currentMember.photoUrl) ? (
                        <img
                          src={inspecting.currentMember.photoUrl}
                          alt="Current live portrait"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-slate-400">None</span>
                      )}
                    </div>
                    <div className="text-xs">
                      <p className="font-semibold text-slate-700">Current Live Portrait</p>
                      <p className="text-slate-500 font-mono text-[11px] break-all line-clamp-2">
                        {inspecting.currentMember?.photoUrl || 'Not set'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-xl border border-stone-200 bg-white overflow-hidden shrink-0 flex items-center justify-center">
                      {inspecting.proposedProfile.photoUrl &&
                      isSafeMediaUrl(inspecting.proposedProfile.photoUrl) ? (
                        <img
                          src={inspecting.proposedProfile.photoUrl}
                          alt="Proposed portrait"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-slate-400">None</span>
                      )}
                    </div>
                    <div className="text-xs">
                      <p className="font-semibold text-pust-900">Proposed Portrait</p>
                      <p className="text-slate-600 font-mono text-[11px] break-all line-clamp-2">
                        {inspecting.proposedProfile.photoUrl || 'Not set'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Field-by-Field Diff Table */}
              <div className="overflow-x-auto rounded-xl border border-stone-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F7F7F5] border-b border-stone-200 text-slate-600 font-semibold">
                      <th className="py-2.5 px-3 w-44">Profile Field</th>
                      <th className="py-2.5 px-3">Current Live Directory</th>
                      <th className="py-2.5 px-3">Proposed Submission</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {comparisonRows.map((row, idx) => (
                      <tr
                        key={row.label}
                        className={
                          row.changed
                            ? 'bg-[#FBF6EE]'
                            : idx % 2 === 0
                            ? 'bg-white'
                            : 'bg-[#FAF9F6]'
                        }
                      >
                        <td className="py-2.5 px-3 font-semibold text-slate-800 align-top">
                          <span>{row.label}</span>
                          {row.changed && (
                            <span className="block text-[10px] font-mono text-amber-800 mt-0.5">
                              Modified
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 align-top whitespace-pre-wrap break-words">
                          {row.currentVal}
                        </td>
                        <td className="py-2.5 px-3 text-slate-950 font-medium align-top whitespace-pre-wrap break-words">
                          {row.proposedVal}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Admin Note */}
              {inspecting.status === 'pending' ? (
                <label className="block space-y-1.5 text-xs">
                  <span className="font-semibold text-slate-800">
                    Administrator Decision Note (optional on approval, required when declining)
                  </span>
                  <textarea
                    rows={2}
                    maxLength={600}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Verified against departmental records, or explain requested corrections..."
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                  />
                </label>
              ) : (
                <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] px-4 py-3 text-xs space-y-1">
                  <p className="font-semibold text-slate-900">
                    Finalized Status: {inspecting.status === 'approved' ? 'Approved' : 'Declined'}{' '}
                    {inspecting.reviewedBy ? `by ${inspecting.reviewedBy}` : ''} (
                    {formatDateTime(inspecting.reviewedAt)})
                  </p>
                  <p className="text-slate-600">{inspecting.adminNote || 'No note recorded.'}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-stone-200 bg-[#FAF9F6] flex flex-wrap items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                disabled={Boolean(submittingDecision)}
                onClick={() => setInspecting(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium border border-stone-300 bg-white text-slate-700 hover:border-pust-800 cursor-pointer whitespace-nowrap"
              >
                Close
              </button>

              {inspecting.status === 'pending' && (
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    disabled={Boolean(submittingDecision)}
                    onClick={() => void handleDecision('reject')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border border-red-300 bg-white text-red-700 hover:bg-red-50 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>
                      {submittingDecision === 'reject' ? 'Declining...' : 'Decline Request'}
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(submittingDecision)}
                    onClick={() => void handleDecision('approve')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-pust-900 text-white hover:bg-pust-950 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {submittingDecision === 'approve'
                        ? 'Publishing...'
                        : 'Approve & Publish to Directory'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
