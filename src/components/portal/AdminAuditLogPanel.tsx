'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Download,
  Eye,
  Info,
  RefreshCw,
  ScrollText,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react';
import { pustApi } from '../../lib/api';
import type {
  AuditLogCategory,
  AuditLogRecord,
  AuditLogSeverity,
  UserRole,
} from '../../types/pust';

const AUDIT_CATEGORIES: AuditLogCategory[] = [
  'Privilege & Security',
  'Account & Access',
  'Governance & CMS',
  'Finance & Config',
  'Academic & Workflow',
];

const SEVERITY_LABEL: Record<AuditLogSeverity, string> = {
  critical: 'Critical',
  elevated: 'Elevated',
  standard: 'Standard',
};

function sanitizeCsvCell(value: string): string {
  const str = String(value ?? '');
  const escaped = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  return `"${escaped.replace(/"/g, '""')}"`;
}

function formatAuditTimestamp(iso: string): { date: string; time: string } {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return { date: iso.slice(0, 10), time: iso.slice(11, 19) || '00:00:00' };
  }
  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, '0');
  const dd = String(parsed.getDate()).padStart(2, '0');
  const hh = String(parsed.getHours()).padStart(2, '0');
  const min = String(parsed.getMinutes()).padStart(2, '0');
  const sec = String(parsed.getSeconds()).padStart(2, '0');
  return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${min}:${sec}` };
}

function SeverityMarker({ severity }: { severity: AuditLogSeverity }) {
  if (severity === 'critical') {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-red-700 whitespace-nowrap">
        <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
        <span>Critical</span>
      </span>
    );
  }
  if (severity === 'elevated') {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-amber-800 whitespace-nowrap">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        <span>Elevated</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-medium text-slate-600 whitespace-nowrap">
      <Info className="w-3.5 h-3.5 shrink-0 text-slate-400" />
      <span>Standard</span>
    </span>
  );
}

export function AdminAuditLogPanel() {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | AuditLogCategory>('ALL');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | AuditLogSeverity>('ALL');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);

  const loadLogs = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await pustApi.getAuditLogs({ limit: 300 });
      setLogs(res.logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load system audit logs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadLogs(false);
  }, [loadLogs]);

  useEffect(() => {
    if (!selectedLog) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setSelectedLog(null);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selectedLog]);

  const metrics = useMemo(() => {
    const total = logs.length;
    const criticalPrivilege = logs.filter(
      (l) => l.severity === 'critical' || l.category === 'Privilege & Security'
    ).length;
    const accountEvents = logs.filter((l) => l.category === 'Account & Access').length;
    const configGovernance = logs.filter(
      (l) => l.category === 'Governance & CMS' || l.category === 'Finance & Config'
    ).length;
    return { total, criticalPrivilege, accountEvents, configGovernance };
  }, [logs]);

  const availableRoles = useMemo(() => {
    const set = new Set<UserRole>();
    logs.forEach((l) => set.add(l.actorRole));
    return Array.from(set).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return logs.filter((entry) => {
      const category = entry.category || 'Academic & Workflow';
      const severity = entry.severity || 'standard';
      if (categoryFilter !== 'ALL' && category !== categoryFilter) return false;
      if (severityFilter !== 'ALL' && severity !== severityFilter) return false;
      if (roleFilter !== 'ALL' && entry.actorRole !== roleFilter) return false;
      if (!q) return true;
      const hay = [
        entry.actorName,
        entry.actorEmail || '',
        entry.actorRole,
        entry.action,
        entry.target,
        entry.details || '',
        category,
        severity,
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [logs, searchQuery, categoryFilter, severityFilter, roleFilter]);

  function handleExportCsv() {
    const headers = [
      'S.N',
      'Timestamp',
      'Severity',
      'Category',
      'Actor Name',
      'Actor Role',
      'Actor Email',
      'Action',
      'Target',
      'Details',
    ];
    const rows = filteredLogs.map((log, idx) => [
      sanitizeCsvCell(String(idx + 1)),
      sanitizeCsvCell(log.timestamp),
      sanitizeCsvCell(SEVERITY_LABEL[log.severity || 'standard']),
      sanitizeCsvCell(log.category || 'Academic & Workflow'),
      sanitizeCsvCell(log.actorName),
      sanitizeCsvCell(log.actorRole),
      sanitizeCsvCell(log.actorEmail || ''),
      sanitizeCsvCell(log.action),
      sanitizeCsvCell(log.target),
      sanitizeCsvCell(log.details || ''),
    ]);

    const csvContent = [headers.map(sanitizeCsvCell).join(','), ...rows.map((r) => r.join(','))].join(
      '\n'
    );
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `pust-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  function resetFilters() {
    setSearchQuery('');
    setCategoryFilter('ALL');
    setSeverityFilter('ALL');
    setRoleFilter('ALL');
  }

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    categoryFilter !== 'ALL' ||
    severityFilter !== 'ALL' ||
    roleFilter !== 'ALL';

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white rounded-lg border border-stone-200 p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-200 pb-4">
          <div className="space-y-1">
            <p className="font-mono text-[11px] uppercase tracking-wider text-pust-800 font-semibold">
              Security &amp; Accountability Ledger
            </p>
            <h2 className="font-serif text-xl sm:text-2xl font-medium text-slate-950">
              Administrator Audit Log
            </h2>
            <p className="text-xs text-slate-600">
              Immutable record of account provisioning, role and privilege changes, password resets,
              and system configuration actions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => loadLogs(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-stone-300 bg-[#FAF9F6] text-xs font-semibold text-slate-800 hover:border-pust-800 hover:text-pust-900 disabled:opacity-60 cursor-pointer whitespace-nowrap shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh Log'}</span>
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={filteredLogs.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-pust-900 text-white text-xs font-semibold hover:bg-pust-950 disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV ({filteredLogs.length})</span>
            </button>
          </div>
        </div>

        {/* 4-Column KPI Summary Strip */}
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] px-4 py-3">
            <dt className="text-[11px] text-slate-600">Total Recorded Events</dt>
            <dd className="font-mono text-2xl font-semibold text-slate-950 tabular-nums mt-0.5">
              {loading ? '...' : metrics.total}
            </dd>
          </div>
          <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] px-4 py-3">
            <dt className="text-[11px] text-slate-600">Privilege &amp; Security</dt>
            <dd className="font-mono text-2xl font-semibold text-red-700 tabular-nums mt-0.5">
              {loading ? '...' : metrics.criticalPrivilege}
            </dd>
          </div>
          <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] px-4 py-3">
            <dt className="text-[11px] text-slate-600">Account &amp; Access</dt>
            <dd className="font-mono text-2xl font-semibold text-pust-900 tabular-nums mt-0.5">
              {loading ? '...' : metrics.accountEvents}
            </dd>
          </div>
          <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] px-4 py-3">
            <dt className="text-[11px] text-slate-600">Governance &amp; Finance</dt>
            <dd className="font-mono text-2xl font-semibold text-slate-950 tabular-nums mt-0.5">
              {loading ? '...' : metrics.configGovernance}
            </dd>
          </div>
        </dl>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-1">
          <div className="lg:col-span-5 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search audit logs"
              placeholder="Search actor, email, action, target, or change details..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-stone-300 bg-[#FAF9F6] focus:bg-white focus:outline-none focus:border-pust-800"
            />
          </div>

          <div className="lg:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as 'ALL' | AuditLogCategory)}
              aria-label="Filter by audit category"
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 bg-[#FAF9F6] focus:bg-white focus:outline-none focus:border-pust-800"
            >
              <option value="ALL">All Event Categories</option>
              {AUDIT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as 'ALL' | AuditLogSeverity)}
              aria-label="Filter by severity"
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 bg-[#FAF9F6] focus:bg-white focus:outline-none focus:border-pust-800"
            >
              <option value="ALL">All Severities</option>
              <option value="critical">Critical Only</option>
              <option value="elevated">Elevated</option>
              <option value="standard">Standard</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'ALL' | UserRole)}
              aria-label="Filter by actor role"
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 bg-[#FAF9F6] focus:bg-white focus:outline-none focus:border-pust-800"
            >
              <option value="ALL">All Actor Roles</option>
              {availableRoles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-red-900"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => loadLogs(false)}
            className="px-3 py-1.5 rounded-lg bg-red-800 text-white font-semibold hover:bg-red-900 cursor-pointer whitespace-nowrap"
          >
            Retry
          </button>
        </div>
      )}

      {/* Structured Event Ledger */}
      <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-stone-200 bg-[#FAF9F6] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-pust-800" />
            <h3 className="font-serif text-base font-medium text-slate-950">
              Recorded Audit Events ({filteredLogs.length})
            </h3>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-semibold text-pust-800 hover:underline cursor-pointer whitespace-nowrap"
            >
              Reset Filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-6 space-y-3" aria-busy="true">
            {[1, 2, 3, 4, 5].map((row) => (
              <div
                key={row}
                className="h-10 rounded-lg bg-stone-100 animate-pulse"
              />
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm font-medium text-slate-900">
              No audit records match your current filters.
            </p>
            <p className="text-xs text-slate-600">
              Critical admin events such as account creation, role escalation, password resets, and
              system rule updates appear here automatically.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-pust-900 text-white hover:bg-pust-950 cursor-pointer whitespace-nowrap"
              >
                Show All Audit Events
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 bg-[#FAF9F6] font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                  <th className="py-2.5 pl-5 pr-3 w-14">S.N</th>
                  <th className="py-2.5 px-3 w-36">Timestamp</th>
                  <th className="py-2.5 px-3 w-44">Severity &amp; Category</th>
                  <th className="py-2.5 px-3 w-52">Actor</th>
                  <th className="py-2.5 px-3">Action &amp; Target</th>
                  <th className="py-2.5 pl-3 pr-5 text-right w-24">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredLogs.map((log, idx) => {
                  const { date, time } = formatAuditTimestamp(log.timestamp);
                  const severity = log.severity || 'standard';
                  const category = log.category || 'Academic & Workflow';
                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className={`transition-colors hover:bg-pust-50/45 cursor-pointer ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-[#FAF9F6]/75'
                      }`}
                    >
                      <td className="py-3 pl-5 pr-3 font-mono text-slate-500 tabular-nums align-top">
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums align-top">
                        <span className="block font-medium text-slate-900">{date}</span>
                        <span className="block text-[11px] text-slate-500">{time}</span>
                      </td>
                      <td className="py-3 px-3 align-top">
                        <SeverityMarker severity={severity} />
                        <span className="block text-[11px] text-slate-600 mt-0.5">{category}</span>
                      </td>
                      <td className="py-3 px-3 align-top">
                        <span className="block font-semibold text-slate-900 truncate max-w-[200px]">
                          {log.actorName}
                        </span>
                        <span className="block font-mono text-[11px] text-slate-600 truncate max-w-[200px]">
                          {log.actorRole}
                          {log.actorEmail ? ` · ${log.actorEmail}` : ''}
                        </span>
                      </td>
                      <td className="py-3 px-3 align-top min-w-[240px]">
                        <span className="block font-semibold text-pust-900">{log.action}</span>
                        <span className="block text-slate-700 mt-0.5 break-words">{log.target}</span>
                        {log.details && (
                          <span className="block font-mono text-[11px] text-slate-500 mt-1 line-clamp-1">
                            {log.details}
                          </span>
                        )}
                      </td>
                      <td className="py-3 pl-3 pr-5 text-right align-top">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-stone-300 bg-white text-[11px] font-semibold text-slate-700 hover:border-pust-800 hover:text-pust-900 cursor-pointer whitespace-nowrap"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit Event Inspector Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-[2px] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="audit-detail-title"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="w-full max-w-xl bg-white rounded-lg border border-stone-200 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-gradient-to-r from-pust-950 via-pust-900 to-pust-800 text-white flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-pust-200">
                  Audit Event Inspector
                </p>
                <h3 id="audit-detail-title" className="font-serif text-lg font-medium text-white">
                  {selectedLog.action}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                aria-label="Close audit detail modal"
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] p-3">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                    Severity &amp; Category
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <SeverityMarker severity={selectedLog.severity || 'standard'} />
                    <span className="text-slate-400">·</span>
                    <span className="font-medium text-slate-800">
                      {selectedLog.category || 'Academic & Workflow'}
                    </span>
                  </div>
                </div>
                <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] p-3">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                    Recorded Timestamp
                  </p>
                  <p className="font-mono font-semibold text-slate-900 tabular-nums mt-1">
                    {selectedLog.timestamp}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-stone-200 bg-white p-4 space-y-2.5">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                    Performed By
                  </p>
                  <p className="text-sm font-semibold text-slate-950 mt-0.5">
                    {selectedLog.actorName}{' '}
                    <span className="font-mono text-xs font-medium text-pust-800">
                      ({selectedLog.actorRole})
                    </span>
                  </p>
                  {selectedLog.actorEmail && (
                    <p className="font-mono text-xs text-slate-600 mt-0.5">
                      {selectedLog.actorEmail}
                    </p>
                  )}
                </div>

                <div className="border-t border-stone-200 pt-2.5">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                    Target Subject
                  </p>
                  <p className="text-sm font-medium text-slate-900 mt-0.5 break-words">
                    {selectedLog.target}
                  </p>
                </div>

                {selectedLog.details && (
                  <div className="border-t border-stone-200 pt-2.5">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                      Change &amp; Context Details
                    </p>
                    <p className="font-mono text-xs text-slate-800 bg-[#FAF9F6] border border-stone-200 rounded-lg p-3 mt-1.5 leading-relaxed break-words">
                      {selectedLog.details}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <span className="font-mono text-[11px] text-slate-500 truncate">
                  ID: {selectedLog.id}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 rounded-lg bg-pust-900 text-white font-semibold hover:bg-pust-950 cursor-pointer whitespace-nowrap"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
