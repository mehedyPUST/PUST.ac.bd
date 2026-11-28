'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  Sliders,
  Workflow,
} from 'lucide-react';
import { pustApi } from '../../lib/api';
import { PortalRecordsSkeleton } from '../PustSkeletons';
import type {
  AuthUser,
  AutomationOverviewResponse,
  AutomationRulesConfig,
  AutomationSweepReport,
  OfficeFlowItem,
} from '../../types/pust';

interface OfficeFlowPanelProps {
  user: AuthUser;
  onOpenTab: (tabId: string) => void;
}

const RULE_DEFINITIONS: Array<{
  key: keyof AutomationRulesConfig;
  label: string;
  description: string;
}> = [
  {
    key: 'autoClearPaidHallDues',
    label: 'Auto-Clear Paid Hall Dues',
    description:
      'Automatically issues PUST-HALL-CLR references and unlocks exam form fill-up immediately on verified digital payment.',
  },
  {
    key: 'autoIssueSealedLibraryCards',
    label: 'Auto-Issue Sealed Library Cards',
    description:
      'Automatically verifies Chairman SHA-256 JSON seals and activates Digital Library Cards without manual Library desk delay.',
  },
  {
    key: 'autoIssueAdmitCardsOnPay',
    label: 'Auto-Issue Exam Admit Cards on Payment',
    description:
      'Runs live Hall Dues + Proctorial Conduct checks upon exam fee payment and auto-issues Admit Cards when standing is clean.',
  },
  {
    key: 'autoVerifyCleanCertOffices',
    label: 'Auto-Verify 4-Office Certificate Checkpoints',
    description:
      'Evaluates Chairman, Hall, Library, and Proctor databases on certificate submission—auto-clearing passing offices and flagging blockers.',
  },
  {
    key: 'autoIssueReadyCertificates',
    label: 'Auto-Issue 4/4 Cleared Certificates',
    description:
      'Generates PUST-CERT serials and SHA-256 verification hashes automatically as soon as all 4 offices reach Approved.',
  },
  {
    key: 'autoPromoteGraduatingResults',
    label: 'Auto-Mark 8/8 Graduating Results Published',
    description:
      'Marks student final degree results as published automatically once Semester 8 grade sheets are approved and promoted.',
  },
];

const CAN_RUN_AUTOMATION = new Set([
  'admin',
  'registrar',
  'chairman',
  'hall',
  'library',
  'proctor',
]);

export function OfficeFlowPanel({ user, onOpenTab }: OfficeFlowPanelProps) {
  const [overview, setOverview] = useState<AutomationOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sweeping, setSweeping] = useState(false);
  const [savingRuleKey, setSavingRuleKey] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'ready' | 'held' | 'manual'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sweepReport, setSweepReport] = useState<AutomationSweepReport | null>(null);

  const canOperateFlow = CAN_RUN_AUTOMATION.has(user.role);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await pustApi.getAutomationOverview();
      setOverview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load automated office flow.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filteredQueue = useMemo(() => {
    if (!overview) return [];
    const q = searchQuery.trim().toLowerCase();
    return overview.queueItems.filter((item) => {
      if (filterMode !== 'all' && item.eligibility !== filterMode) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.targetRef.toLowerCase().includes(q) ||
        item.officeLabel.toLowerCase().includes(q)
      );
    });
  }, [overview, filterMode, searchQuery]);

  async function handleAdvanceSingle(item: OfficeFlowItem) {
    setBusyId(item.id);
    setError(null);
    setFeedback(null);
    try {
      const res = await pustApi.advanceOfficeFlowItem({
        flowType: item.flowType,
        targetId: item.targetId,
      });
      if (res.processed) {
        setFeedback(`${item.officeLabel}: ${res.detail}`);
      } else {
        setError(`${item.officeLabel}: ${res.detail}`);
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to advance office flow item.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleRunSweep() {
    setSweeping(true);
    setError(null);
    setFeedback(null);
    try {
      const res = await pustApi.runOfficeAutomationSweep();
      setSweepReport(res.report);
      setFeedback(
        `Automated office sweep finished: ${res.report.processedCount} processed, ${res.report.heldCount} held by prerequisites.`
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to run automated office sweep.');
    } finally {
      setSweeping(false);
    }
  }

  async function handleToggleRule(key: keyof AutomationRulesConfig, nextValue: boolean) {
    if (user.role !== 'admin') return;
    setSavingRuleKey(key);
    setError(null);
    setFeedback(null);
    try {
      const res = await pustApi.updateAutomationRules({ [key]: nextValue });
      setOverview((prev) => (prev ? { ...prev, rules: res.rules } : prev));
      setFeedback(`Updated automation policy: ${key} set to ${nextValue ? 'Enabled' : 'Disabled'}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update automation policy.');
    } finally {
      setSavingRuleKey(null);
    }
  }

  if (loading && !overview) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs">
        <PortalRecordsSkeleton rows={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-lg border border-stone-200 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="font-mono text-xs uppercase tracking-widest text-pust-800 flex items-center gap-1.5 text-left">
            <Workflow className="w-3.5 h-3.5 shrink-0" />
            Automated Cross-Office Orchestration
          </p>
          <h2 className="font-serif text-2xl font-medium text-slate-900">
            {user.role === 'student'
              ? 'Automated Campus Clearance & Service Readiness'
              : 'Automated Office Flow & Batch Queue Center'}
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl text-left">
            {user.role === 'student'
              ? 'Live prerequisite checks across Residential Hall, Central Library, Proctorial Standing, Examinations, and 4-Office Graduation Clearances.'
              : 'Evaluate live inter-office prerequisites, advance eligible approvals in one click, or run an automated sweep across your authorized queues.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-stone-300 bg-white text-slate-700 hover:border-pust-800 hover:text-pust-900 disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh State
          </button>

          {canOperateFlow && (
            <button
              type="button"
              onClick={handleRunSweep}
              disabled={sweeping || (overview?.counts.ready ?? 0) === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-pust-900 text-white hover:bg-pust-950 disabled:opacity-45 cursor-pointer whitespace-nowrap"
            >
              <Play className="w-3.5 h-3.5" />
              {sweeping
                ? 'Running Office Sweep...'
                : `Run Automated Office Sweep (${overview?.counts.ready ?? 0})`}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-sm text-red-900 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {feedback && (
        <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 text-sm text-emerald-900 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Student Readiness Scorecard View */}
      {user.role === 'student' && overview?.studentReadiness && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[
              {
                title: '1. Portal Account Standing',
                passed: overview.studentReadiness.approvalStatus === 'approved',
                detail: `Account status: ${overview.studentReadiness.approvalStatus.toUpperCase()}`,
                tab: 'students',
                cta: 'Open Academic Profile',
              },
              {
                title: '2. Residential Hall Clearance',
                passed: overview.studentReadiness.hallCleared,
                detail: overview.studentReadiness.hallCleared
                  ? `Zero unpaid dues · Seat: ${overview.studentReadiness.hallSeatAssigned}`
                  : `${overview.studentReadiness.unpaidHallDuesCount} unpaid hall due(s) blocking exams & graduation`,
                tab: 'halls',
                cta: 'Open Hall & Dues',
              },
              {
                title: '3. Central Library Standing',
                passed:
                  overview.studentReadiness.libraryCleared &&
                  overview.studentReadiness.hasActiveLibraryCard,
                detail: `${
                  overview.studentReadiness.hasActiveLibraryCard
                    ? 'Active Digital Library Card issued'
                    : 'Library card not yet active'
                } · ${overview.studentReadiness.activeBorrowsCount} unreturned loan(s)`,
                tab: 'library',
                cta: 'Open Library Desk',
              },
              {
                title: '4. Proctorial Conduct',
                passed: overview.studentReadiness.proctorCleared,
                detail: `Disciplinary status: ${overview.studentReadiness.disciplinaryStatus}`,
                tab: 'students',
                cta: 'Inspect Dossier',
              },
              {
                title: '5. Semester Progression',
                passed:
                  overview.studentReadiness.completedSemesters >= 8 &&
                  overview.studentReadiness.allResultsPublished,
                detail: `${overview.studentReadiness.completedSemesters}/8 semesters completed · ${
                  overview.studentReadiness.allResultsPublished
                    ? 'Final results published'
                    : 'Degree coursework in progress'
                }`,
                tab: 'exams',
                cta: 'Open Exams & Results',
              },
              {
                title: '6. Graduation Certificate Gate',
                passed: overview.studentReadiness.graduationReady,
                detail: overview.studentReadiness.graduationReady
                  ? 'Eligible for auto-verified 4-office Temporary Certificate issuance'
                  : 'Complete prerequisites 1–5 to unlock 1-step automated graduation clearance',
                tab: 'certificates',
                cta: 'Open Certificate Desk',
              },
            ].map((card) => (
              <div
                key={card.title}
                className={`rounded-lg border p-5 flex flex-col justify-between gap-4 ${
                  card.passed
                    ? 'bg-white border-stone-200'
                    : 'bg-[#FAF9F6] border-amber-300/80'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-serif text-base font-medium text-slate-900">
                      {card.title}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 font-mono text-[11px] font-semibold whitespace-nowrap shrink-0 ${
                        card.passed ? 'text-emerald-800' : 'text-amber-800'
                      }`}
                    >
                      {card.passed ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                      {card.passed ? 'CLEARED' : 'ACTION NEEDED'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed text-left">{card.detail}</p>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenTab(card.tab)}
                  className="inline-flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-stone-300 bg-[#FAF9F6] text-slate-800 hover:border-pust-800 hover:text-pust-900 cursor-pointer"
                >
                  <span>{card.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Officer / Admin Queue & Sweep Section */}
      {user.role !== 'student' && overview && (
        <>
          {/* KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white rounded-lg border border-stone-200 p-4">
              <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500 text-left">
                Total Active Items
              </p>
              <p className="font-serif text-2xl font-medium text-slate-900 mt-1 tabular-nums text-left">
                {overview.counts.total}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-stone-200 p-4">
              <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500 text-left">
                Auto-Ready
              </p>
              <p className="font-serif text-2xl font-medium text-emerald-800 mt-1 tabular-nums text-left">
                {overview.counts.ready}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-stone-200 p-4">
              <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500 text-left">
                Held by Checks
              </p>
              <p className="font-serif text-2xl font-medium text-amber-800 mt-1 tabular-nums text-left">
                {overview.counts.held}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-stone-200 p-4">
              <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500 text-left">
                Manual Desk Review
              </p>
              <p className="font-serif text-2xl font-medium text-slate-900 mt-1 tabular-nums text-left">
                {overview.counts.manual}
              </p>
            </div>
          </div>

          {/* Sweep Execution Report */}
          {sweepReport && (
            <div className="bg-white rounded-lg border border-pust-700/35 p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-3">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-pust-800 text-left">
                    Sweep Execution Report · {new Date(sweepReport.ranAt).toLocaleTimeString('en-US')}
                  </p>
                  <h3 className="font-serif text-lg font-medium text-slate-900">
                    {sweepReport.processedCount} Advanced · {sweepReport.heldCount} Held
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSweepReport(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Dismiss Report
                </button>
              </div>
              {sweepReport.actions.length === 0 ? (
                <p className="text-xs text-slate-600 text-left">
                  No automated items required processing during this sweep.
                </p>
              ) : (
                <div className="divide-y divide-stone-200 rounded-xl border border-stone-200 overflow-hidden text-xs">
                  {sweepReport.actions.map((act, idx) => (
                    <div
                      key={`${act.flowType}-${idx}`}
                      className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 bg-white"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate text-left">{act.target}</p>
                        <p className="text-slate-600 text-left">{act.detail}</p>
                      </div>
                      <span
                        className={`font-mono text-[11px] font-semibold uppercase whitespace-nowrap shrink-0 ${
                          act.outcome === 'processed' ? 'text-emerald-800' : 'text-amber-800'
                        }`}
                      >
                        {act.outcome}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Unified Cross-Office Queue */}
          <div className="bg-white rounded-lg border border-stone-200 p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-200 pb-4">
              <div className="inline-flex flex-wrap gap-1 p-1 rounded-lg bg-stone-100 border border-stone-200/80">
                {(
                  [
                    { id: 'all', label: `All (${overview.counts.total})` },
                    { id: 'ready', label: `Auto-Ready (${overview.counts.ready})` },
                    { id: 'held', label: `Held (${overview.counts.held})` },
                    { id: 'manual', label: `Manual (${overview.counts.manual})` },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterMode(tab.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
                      filterMode === tab.id
                        ? 'bg-white text-slate-950 shadow-xs'
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by student, ID, or office..."
                  className="w-full md:w-64 pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-300 bg-[#FAF9F6] focus:bg-white focus:border-pust-800 focus:outline-none"
                />
              </div>
            </div>

            {filteredQueue.length === 0 ? (
              <div className="py-10 text-center space-y-1.5">
                <CheckCircle2 className="w-7 h-7 text-emerald-700 mx-auto" />
                <p className="font-serif text-lg text-slate-900">Office Flow Queue Clear</p>
                <p className="text-xs text-slate-500">
                  No pending cross-office items match the selected filter for your role scope.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-stone-200 rounded-xl border border-stone-200 overflow-hidden">
                {filteredQueue.map((item) => {
                  const isBusy = busyId === item.id;
                  return (
                    <div
                      key={item.id}
                      className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white hover:bg-[#FAF9F6] transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-pust-800">
                            {item.officeLabel}
                          </span>
                          <span className="text-stone-300">·</span>
                          <span className="font-mono text-[11px] text-slate-500">{item.stage}</span>
                          <span className="text-stone-300">·</span>
                          <span
                            className={`inline-flex items-center gap-1 font-mono text-[11px] font-semibold uppercase ${
                              item.eligibility === 'ready'
                                ? 'text-emerald-800'
                                : item.eligibility === 'held'
                                ? 'text-amber-800'
                                : 'text-slate-600'
                            }`}
                          >
                            {item.eligibility === 'ready'
                              ? 'Auto-Ready'
                              : item.eligibility === 'held'
                              ? 'Prerequisite Hold'
                              : 'Manual Review'}
                          </span>
                        </div>
                        <p className="font-medium text-sm text-slate-900 text-left">{item.title}</p>
                        <p className="text-xs text-slate-600 text-left">{item.subtitle}</p>
                        <p
                          className={`text-xs text-left ${
                            item.eligibility === 'held' ? 'text-amber-800' : 'text-emerald-800'
                          }`}
                        >
                          {item.eligibilityReason}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onOpenTab(item.portalTab)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-300 bg-white text-slate-700 hover:border-pust-800 hover:text-pust-900 cursor-pointer whitespace-nowrap"
                        >
                          Open Module
                        </button>
                        {canOperateFlow && (
                          <button
                            type="button"
                            disabled={isBusy || item.eligibility === 'held'}
                            onClick={() => handleAdvanceSingle(item)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-pust-900 text-white hover:bg-pust-950 disabled:opacity-45 cursor-pointer whitespace-nowrap"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {isBusy ? 'Processing...' : item.actionLabel}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Automation Policy Rules Grid */}
      {overview && (
        <div className="bg-white rounded-lg border border-stone-200 p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-pust-800" />
              <h3 className="font-serif text-lg font-medium text-slate-900">
                Institutional Automation Policy Rules
              </h3>
            </div>
            <span className="font-mono text-[11px] text-slate-500">
              {user.role === 'admin'
                ? 'Admin Office may toggle live triggers below'
                : 'Managed by Central Admin Office'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {RULE_DEFINITIONS.map((rule) => {
              const enabled = overview.rules[rule.key];
              const isSaving = savingRuleKey === rule.key;
              return (
                <div
                  key={rule.key}
                  className="p-4 rounded-xl border border-stone-200 bg-[#FAF9F6] flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-900 text-left">{rule.label}</p>
                    <p className="text-xs text-slate-600 leading-relaxed text-left">
                      {rule.description}
                    </p>
                  </div>

                  {user.role === 'admin' ? (
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleToggleRule(rule.key, !enabled)}
                      aria-pressed={enabled}
                      className={`px-3 py-1 rounded-lg font-mono text-[11px] font-semibold shrink-0 cursor-pointer transition-colors ${
                        enabled
                          ? 'bg-emerald-800 text-white hover:bg-emerald-900'
                          : 'bg-stone-200 text-slate-700 hover:bg-stone-300'
                      }`}
                    >
                      {isSaving ? '...' : enabled ? 'ENABLED' : 'PAUSED'}
                    </button>
                  ) : (
                    <span
                      className={`font-mono text-[11px] font-semibold shrink-0 ${
                        enabled ? 'text-emerald-800' : 'text-slate-500'
                      }`}
                    >
                      {enabled ? 'ACTIVE' : 'MANUAL'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Automated & Office Activity Feed */}
      {overview && overview.recentAuditLogs.length > 0 && (
        <div className="bg-white rounded-lg border border-stone-200 p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
            <Activity className="w-4 h-4 text-pust-800" />
            <h3 className="font-serif text-lg font-medium text-slate-900">
              Recent Campus Office Activity Feed
            </h3>
          </div>
          <div className="divide-y divide-stone-200 rounded-xl border border-stone-200 overflow-hidden text-xs">
            {overview.recentAuditLogs.slice(0, 8).map((log) => (
              <div
                key={log.id}
                className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 bg-white"
              >
                <div className="min-w-0">
                  <span className="font-medium text-slate-900">{log.action}</span>
                  <span className="text-slate-500"> — {log.target}</span>
                </div>
                <span className="font-mono text-slate-500 tabular-nums shrink-0">
                  {log.actorName} ({log.actorRole})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
