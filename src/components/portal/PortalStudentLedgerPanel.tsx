'use client';

import { useState } from 'react';
import { CheckCircle2, Search } from 'lucide-react';
import { pustApi } from '../../lib/api';
import { PortalRecordsSkeleton } from '../PustSkeletons';
import type { AuthUser, DepartmentRecord, StudentRecord } from '../../types/pust';
import { SESSION_FILTERS } from './portalMeta';

interface PortalStudentLedgerPanelProps {
  user: AuthUser;
  departments: DepartmentRecord[];
  students: StudentRecord[];
  studentSelf: StudentRecord | null;
  loadingStudents: boolean;
  stuDeptFilter: string;
  stuSessionFilter: string;
  stuSearch: string;
  onDeptFilterChange: (dept: string) => void;
  onSessionFilterChange: (session: string) => void;
  onSearchChange: (q: string) => void;
  onReloadStudents: () => Promise<void>;
}

export function PortalStudentLedgerPanel({
  user,
  departments,
  students,
  studentSelf,
  loadingStudents,
  stuDeptFilter,
  stuSessionFilter,
  stuSearch,
  onDeptFilterChange,
  onSessionFilterChange,
  onSearchChange,
  onReloadStudents,
}: PortalStudentLedgerPanelProps) {
  const [studentEditNotes, setStudentEditNotes] = useState<
    Record<
      string,
      {
        chairmanNotes?: string;
        adminNotes?: string;
        disciplinaryStatus?: StudentRecord['disciplinaryStatus'];
        disciplinaryNotes?: string;
      }
    >
  >({});
  const [stuSavedMsg, setStuSavedMsg] = useState<string | null>(null);
  const [stuErrorMsg, setStuErrorMsg] = useState<string | null>(null);

  async function handleSaveStudentRecord(stu: StudentRecord) {
    const patch = studentEditNotes[stu.id];
    if (!patch) return;
    setStuErrorMsg(null);
    setStuSavedMsg(null);
    try {
      await pustApi.updateStudentRecords(stu.id, patch);
      setStuSavedMsg(`Updated record for ${stu.name} (${stu.academicId}).`);
      await onReloadStudents();
    } catch (err) {
      setStuErrorMsg(err instanceof Error ? err.message : 'Unable to save student record note.');
    }
  }

  // Student Self-Dossier View
  if (user.role === 'student') {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-stone-200 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-pust-800 text-left">
              Verified Institutional Record
            </p>
            <h2 className="font-serif text-2xl font-medium text-slate-900 mt-0.5">
              My Academic &amp; Residential Dossier
            </h2>
          </div>
          {studentSelf && (
            <span className="font-mono text-xs text-pust-800 font-semibold tabular-nums">
              Status: {studentSelf.approvalStatus.toUpperCase()} · {studentSelf.disciplinaryStatus}
            </span>
          )}
        </div>

        <div className="p-6">
          {loadingStudents ? (
            <PortalRecordsSkeleton rows={3} />
          ) : !studentSelf ? (
            <p className="text-sm text-slate-600 text-left">
              Your institutional student record is still syncing. Contact your Department Chairman
              if this persists.
            </p>
          ) : (
            <div className="space-y-6">
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-200 border border-stone-200 rounded-xl overflow-hidden bg-[#FAF9F6]">
                <div className="p-4">
                  <dt className="text-xs font-medium text-slate-500">Academic ID &amp; Session</dt>
                  <dd className="font-mono text-base font-semibold text-slate-900 mt-1 tabular-nums">
                    {studentSelf.academicId} · {studentSelf.session}
                  </dd>
                  <dd className="text-xs text-slate-600 mt-0.5">
                    Department of {studentSelf.departmentCode}
                  </dd>
                </div>

                <div className="p-4">
                  <dt className="text-xs font-medium text-slate-500">Cumulative Standing</dt>
                  <dd className="font-mono text-base font-semibold text-pust-800 mt-1 tabular-nums">
                    CGPA {studentSelf.cgpa.toFixed(2)} / 4.00
                  </dd>
                  <dd className="text-xs text-slate-600 mt-0.5 tabular-nums">
                    Semester {studentSelf.currentSemester} ({studentSelf.completedSemesters}/8
                    completed)
                  </dd>
                </div>

                <div className="p-4">
                  <dt className="text-xs font-medium text-slate-500">Residential Hall &amp; Seat</dt>
                  <dd className="font-serif text-base font-medium text-slate-900 mt-1">
                    {studentSelf.hallName}
                  </dd>
                  <dd className="font-mono text-xs text-slate-600 mt-0.5 tabular-nums">
                    {studentSelf.seatNumber}
                  </dd>
                </div>

                <div className="p-4">
                  <dt className="text-xs font-medium text-slate-500">Disciplinary &amp; Results</dt>
                  <dd className="font-mono text-base font-semibold text-slate-900 mt-1">
                    {studentSelf.disciplinaryStatus}
                  </dd>
                  <dd className="text-xs text-slate-600 mt-0.5">
                    {studentSelf.allResultsPublished
                      ? 'All 8 results published'
                      : 'Degree in progress'}
                  </dd>
                </div>
              </dl>

              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-stone-200 border border-stone-200 rounded-xl bg-white">
                <div className="p-5 space-y-2.5">
                  <p className="text-xs font-semibold text-pust-800 text-left">
                    Chairman &amp; Admin Remarks
                  </p>
                  <p className="text-sm text-slate-700 text-left">
                    <span className="font-semibold text-slate-900">Chairman:</span>{' '}
                    {studentSelf.chairmanNotes || 'No remarks recorded.'}
                  </p>
                  <p className="text-sm text-slate-700 text-left">
                    <span className="font-semibold text-slate-900">Admin Office:</span>{' '}
                    {studentSelf.adminNotes || 'No remarks recorded.'}
                  </p>
                  <p className="text-sm text-slate-700 text-left">
                    <span className="font-semibold text-slate-900">Proctor Note:</span>{' '}
                    {studentSelf.disciplinaryNotes || 'Clear standing.'}
                  </p>
                </div>

                <div className="p-5 space-y-2.5">
                  <p className="text-xs font-semibold text-pust-800 text-left">
                    Verified Admission Documents
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed text-left">
                    {studentSelf.admissionDocuments.length > 0
                      ? studentSelf.admissionDocuments.join(' · ')
                      : 'Admission packet verified on file.'}
                  </p>
                  {studentSelf.digitalDocuments && studentSelf.digitalDocuments.length > 0 && (
                    <div className="border-t border-stone-200 divide-y divide-stone-200 pt-1">
                      {studentSelf.digitalDocuments.map((dd, i) => (
                        <div
                          key={`${dd.fileName}-${i}`}
                          className="py-1.5 text-[11px] font-mono text-slate-700 flex flex-wrap items-center justify-between gap-2"
                        >
                          <span className="truncate min-w-0">{dd.fileName}</span>
                          <span className="text-pust-800 shrink-0 tabular-nums">
                            {dd.sizeLabel} · {dd.verifiedHash}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="font-mono text-xs text-slate-500 pt-1 tabular-nums text-left">
                    Contact: {studentSelf.email} · {studentSelf.phone}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Staff / Officer Combinable Student Directory
  const isDeptLocked = user.role === 'chairman' || user.role === 'teacher';
  const canEditRecords = ['chairman', 'admin', 'proctor'].includes(user.role);

  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-stone-200 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-pust-800 text-left">
            {isDeptLocked
              ? `Department of ${user.departmentCode} Scope`
              : user.role === 'hall'
              ? `${user.hallAffiliation} Resident Scope`
              : user.role === 'proctor'
              ? 'Proctorial Conduct Directory'
              : 'University Student Directory'}
          </p>
          <h2 className="font-serif text-2xl font-medium text-slate-900 mt-0.5">
            {user.role === 'proctor'
              ? 'Student Conduct & Disciplinary Ledger'
              : user.role === 'hall'
              ? 'Hall Residents Academic Standing'
              : user.role === 'teacher'
              ? `${user.departmentCode} Class Roster & Student Standing`
              : 'Student Database (Combinable Dept + Session Filters)'}
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={isDeptLocked ? user.departmentCode : stuDeptFilter}
            disabled={isDeptLocked}
            onChange={(e) => onDeptFilterChange(e.target.value)}
            aria-label="Filter by department"
            className="min-h-[38px] px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-300 bg-[#FAF9F6] disabled:opacity-70"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.code}>
                {d.code}
              </option>
            ))}
          </select>

          <select
            value={stuSessionFilter}
            onChange={(e) => onSessionFilterChange(e.target.value)}
            aria-label="Filter by session"
            className="min-h-[38px] px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-300 bg-[#FAF9F6]"
          >
            {SESSION_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s === 'ALL' ? 'All Sessions' : `Session ${s}`}
              </option>
            ))}
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={stuSearch}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search name or ID..."
              className="min-h-[38px] pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-300 bg-[#FAF9F6] focus:bg-white focus:border-pust-800 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {stuErrorMsg && (
        <div className="mx-6 mt-4 p-3 rounded-lg border border-red-200 bg-red-50 text-xs text-red-900">
          {stuErrorMsg}
        </div>
      )}
      {stuSavedMsg && (
        <div className="mx-6 mt-4 p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{stuSavedMsg}</span>
        </div>
      )}

      {loadingStudents ? (
        <div className="p-6">
          <PortalRecordsSkeleton rows={4} />
        </div>
      ) : students.length === 0 ? (
        <div className="py-12 px-6 text-center space-y-3 text-sm text-slate-600">
          <p className="text-center">No student records match the current Department/Session filter.</p>
          {(stuSessionFilter !== 'ALL' || stuSearch || (!isDeptLocked && stuDeptFilter !== 'ALL')) && (
            <button
              type="button"
              onClick={() => {
                if (!isDeptLocked) {
                  onDeptFilterChange('ALL');
                }
                onSessionFilterChange('ALL');
                onSearchChange('');
              }}
              className="min-h-[36px] px-4 py-1.5 text-xs font-semibold rounded-lg border border-stone-300 bg-[#FAF9F6] text-pust-900 hover:border-pust-800 cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-stone-200">
          {students.map((stu) => {
            const edit = studentEditNotes[stu.id] || {};
            return (
              <div
                key={stu.id}
                className="px-6 py-4 space-y-2.5 text-sm hover:bg-[#FAF9F6]/80 transition-colors"
              >
                <div className="space-y-1">
                  <p className="font-semibold text-slate-900 text-left">
                    {stu.name} · <span className="font-mono text-pust-900">{stu.academicId}</span>
                  </p>
                  <p className="font-mono text-xs text-pust-800 tabular-nums text-left">
                    {stu.departmentCode} · Session {stu.session} · Sem {stu.currentSemester}{' '}
                    (Completed {stu.completedSemesters}/8) · CGPA {stu.cgpa.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-600 text-left">
                    Hall: {stu.hallName} ({stu.seatNumber}) · Disciplinary:{' '}
                    <span className="font-semibold text-slate-900">{stu.disciplinaryStatus}</span> —{' '}
                    {stu.disciplinaryNotes}
                  </p>
                  <p className="text-xs text-slate-500 text-left">
                    Chairman Note: {stu.chairmanNotes} · Admin Note: {stu.adminNotes || '—'}
                  </p>
                  {stu.digitalDocuments && stu.digitalDocuments.length > 0 && (
                    <p className="font-mono text-[11px] text-pust-800 pt-0.5 text-left">
                      Uploaded Files: {stu.digitalDocuments.map((d) => d.fileName).join(', ')}
                    </p>
                  )}
                </div>

                {canEditRecords && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {user.role === 'chairman' && (
                      <input
                        type="text"
                        value={edit.chairmanNotes ?? stu.chairmanNotes}
                        onChange={(e) =>
                          setStudentEditNotes((prev) => ({
                            ...prev,
                            [stu.id]: { ...edit, chairmanNotes: e.target.value },
                          }))
                        }
                        placeholder="Update Chairman note..."
                        className="w-full sm:w-auto sm:flex-1 sm:min-w-[200px] min-h-[36px] px-3 py-1.5 text-xs rounded-lg border border-stone-300 bg-[#FAF9F6] focus:bg-white focus:border-pust-800 focus:outline-none"
                      />
                    )}
                    {user.role === 'admin' && (
                      <input
                        type="text"
                        value={edit.adminNotes ?? stu.adminNotes}
                        onChange={(e) =>
                          setStudentEditNotes((prev) => ({
                            ...prev,
                            [stu.id]: { ...edit, adminNotes: e.target.value },
                          }))
                        }
                        placeholder="Update Admin note..."
                        className="w-full sm:w-auto sm:flex-1 sm:min-w-[200px] min-h-[36px] px-3 py-1.5 text-xs rounded-lg border border-stone-300 bg-[#FAF9F6] focus:bg-white focus:border-pust-800 focus:outline-none"
                      />
                    )}
                    {user.role === 'proctor' && (
                      <>
                        <select
                          value={edit.disciplinaryStatus ?? stu.disciplinaryStatus}
                          onChange={(e) =>
                            setStudentEditNotes((prev) => ({
                              ...prev,
                              [stu.id]: {
                                ...edit,
                                disciplinaryStatus: e.target
                                  .value as StudentRecord['disciplinaryStatus'],
                              },
                            }))
                          }
                          className="min-h-[36px] px-2.5 py-1.5 text-xs rounded-lg border border-stone-300 bg-[#FAF9F6]"
                        >
                          <option value="Clear">Clear</option>
                          <option value="Warning">Warning</option>
                          <option value="Under Review">Under Review</option>
                        </select>
                        <input
                          type="text"
                          value={edit.disciplinaryNotes ?? stu.disciplinaryNotes}
                          onChange={(e) =>
                            setStudentEditNotes((prev) => ({
                              ...prev,
                              [stu.id]: { ...edit, disciplinaryNotes: e.target.value },
                            }))
                          }
                          placeholder="Disciplinary remarks..."
                          className="w-full sm:w-auto sm:flex-1 sm:min-w-[200px] min-h-[36px] px-3 py-1.5 text-xs rounded-lg border border-stone-300 bg-[#FAF9F6] focus:bg-white focus:border-pust-800 focus:outline-none"
                        />
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSaveStudentRecord(stu)}
                      className="min-h-[36px] px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-pust-900 text-white hover:bg-pust-950 cursor-pointer whitespace-nowrap"
                    >
                      Save Record Note
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
