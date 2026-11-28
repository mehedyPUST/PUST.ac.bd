'use client';

import { useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { pustApi } from '../../lib/api';
import type { AuthUser, DepartmentRecord, StudentRecord } from '../../types/pust';

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [chairmanNotes, setChairmanNotes] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [disciplinaryStatus, setDisciplinaryStatus] =
    useState<StudentRecord['disciplinaryStatus']>('Clear');
  const [disciplinaryNotes, setDisciplinaryNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canEditRecords = ['admin', 'chairman', 'proctor'].includes(user.role);

  function startEdit(stu: StudentRecord) {
    setEditingId(stu.id);
    setChairmanNotes(stu.chairmanNotes || '');
    setAdminNotes(stu.adminNotes || '');
    setDisciplinaryStatus(stu.disciplinaryStatus || 'Clear');
    setDisciplinaryNotes(stu.disciplinaryNotes || '');
    setFeedback(null);
    setError(null);
  }

  async function saveEdit(stu: StudentRecord) {
    setSaving(true);
    setError(null);
    setFeedback(null);
    try {
      await pustApi.updateStudentRecords(stu.id, {
        ...(user.role === 'chairman' || user.role === 'admin' ? { chairmanNotes } : {}),
        ...(user.role === 'admin' ? { adminNotes } : {}),
        ...(user.role === 'proctor' || user.role === 'admin'
          ? { disciplinaryStatus, disciplinaryNotes }
          : {}),
      });
      setEditingId(null);
      setFeedback(`Updated record for ${stu.name} (${stu.academicId}).`);
      await onReloadStudents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save student record.');
    } finally {
      setSaving(false);
    }
  }

  if (user.role === 'student' && studentSelf) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-5">
        <div className="border-b border-stone-200 pb-3">
          <h2 className="font-serif text-xl font-medium text-slate-950">
            Student Academic Dossier
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Official academic, residential, and clearance standing recorded on PUST servers.
          </p>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[#FAF9F6] border border-stone-200">
            <dt className="text-slate-500">Full Name</dt>
            <dd className="font-semibold text-sm text-slate-950 mt-0.5">{studentSelf.name}</dd>
          </div>
          <div className="p-4 rounded-xl bg-[#FAF9F6] border border-stone-200">
            <dt className="text-slate-500">Academic ID &amp; Session</dt>
            <dd className="font-mono font-semibold text-sm text-slate-950 tabular-nums mt-0.5">
              {studentSelf.academicId} · {studentSelf.session}
            </dd>
          </div>
          <div className="p-4 rounded-xl bg-[#FAF9F6] border border-stone-200">
            <dt className="text-slate-500">Department</dt>
            <dd className="font-semibold text-sm text-slate-950 mt-0.5">
              {studentSelf.departmentCode}
            </dd>
          </div>
          <div className="p-4 rounded-xl bg-[#FAF9F6] border border-stone-200">
            <dt className="text-slate-500">Completed Semesters &amp; CGPA</dt>
            <dd className="font-mono font-semibold text-sm text-pust-900 tabular-nums mt-0.5">
              {studentSelf.completedSemesters} Semesters · CGPA {studentSelf.cgpa.toFixed(2)}
            </dd>
          </div>
          <div className="p-4 rounded-xl bg-[#FAF9F6] border border-stone-200">
            <dt className="text-slate-500">Hall &amp; Seat Allotment</dt>
            <dd className="font-semibold text-sm text-slate-950 mt-0.5">
              {studentSelf.hallName} · {studentSelf.seatNumber}
            </dd>
          </div>
          <div className="p-4 rounded-xl bg-[#FAF9F6] border border-stone-200">
            <dt className="text-slate-500">Proctorial Conduct</dt>
            <dd className="font-semibold text-sm text-emerald-700 mt-0.5">
              {studentSelf.disciplinaryStatus}
            </dd>
          </div>
        </dl>

        {studentSelf.admissionDocuments.length > 0 && (
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Verified Admission Documents
            </h3>
            <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
              {studentSelf.admissionDocuments.map((doc, i) => (
                <li key={`${doc}-${i}`}>{doc}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-3">
        <div>
          <h2 className="font-serif text-xl font-medium text-slate-950">
            University Student Database ({students.length})
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Search combined student academic profiles, residential allocations, and conduct status.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void onReloadStudents()}
          disabled={loadingStudents}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 bg-[#F7F7F5] text-xs font-medium text-slate-700 hover:border-pust-800 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingStudents ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-xs text-emerald-900">
          {feedback}
        </div>
      )}
      {error && (
        <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-xs text-red-900">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={stuSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search name, ID, or email..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] focus:bg-white focus:outline-none focus:border-pust-800"
          />
        </div>
        <select
          value={stuDeptFilter}
          disabled={user.role === 'chairman' || user.role === 'teacher'}
          onChange={(e) => onDeptFilterChange(e.target.value)}
          className="px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] disabled:opacity-70 focus:outline-none focus:border-pust-800"
        >
          <option value="ALL">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.code}>
              {d.code} — {d.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={stuSessionFilter === 'ALL' ? '' : stuSessionFilter}
          onChange={(e) => onSessionFilterChange(e.target.value.trim() || 'ALL')}
          placeholder="Filter session (e.g. 2022-23)"
          className="px-3 py-2 font-mono rounded-lg border border-stone-300 bg-[#F7F7F5] focus:bg-white focus:outline-none focus:border-pust-800"
        />
      </div>

      {students.length === 0 ? (
        <p className="text-xs text-slate-600 p-4 rounded-xl border border-stone-200 bg-[#FAF9F6]">
          No student records match your current filter.
        </p>
      ) : (
        <div className="divide-y divide-stone-200 rounded-xl border border-stone-200 overflow-hidden text-xs">
          {students.map((stu, idx) => (
            <div
              key={stu.id}
              className={`p-4 space-y-3 ${idx % 2 === 0 ? 'bg-white' : 'bg-[#FAF9F6]'}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="font-semibold text-sm text-slate-950">
                    {stu.name} ·{' '}
                    <span className="font-mono text-pust-800 tabular-nums">{stu.academicId}</span>
                  </p>
                  <p className="font-mono text-slate-600 tabular-nums">
                    {stu.departmentCode} · Session {stu.session} · Sem {stu.currentSemester} · CGPA{' '}
                    {stu.cgpa.toFixed(2)} · {stu.hallName} ({stu.seatNumber})
                  </p>
                  <p className="text-slate-600">
                    Conduct: <strong className="text-slate-900">{stu.disciplinaryStatus}</strong> ·{' '}
                    {stu.disciplinaryNotes}
                  </p>
                </div>
                {canEditRecords && (
                  <button
                    type="button"
                    onClick={() => (editingId === stu.id ? setEditingId(null) : startEdit(stu))}
                    className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-slate-800 hover:border-pust-800 cursor-pointer whitespace-nowrap"
                  >
                    {editingId === stu.id ? 'Close' : 'Update Notes / Conduct'}
                  </button>
                )}
              </div>

              {editingId === stu.id && (
                <div className="pt-3 border-t border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(user.role === 'chairman' || user.role === 'admin') && (
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        Chairman Notes
                      </label>
                      <input
                        type="text"
                        value={chairmanNotes}
                        onChange={(e) => setChairmanNotes(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white"
                      />
                    </div>
                  )}
                  {user.role === 'admin' && (
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Admin Notes</label>
                      <input
                        type="text"
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white"
                      />
                    </div>
                  )}
                  {(user.role === 'proctor' || user.role === 'admin') && (
                    <>
                      <div>
                        <label className="block font-medium text-slate-700 mb-1">
                          Disciplinary Status
                        </label>
                        <select
                          value={disciplinaryStatus}
                          onChange={(e) =>
                            setDisciplinaryStatus(
                              e.target.value as StudentRecord['disciplinaryStatus']
                            )
                          }
                          className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white"
                        >
                          <option value="Clear">Clear</option>
                          <option value="Warning">Warning</option>
                          <option value="Under Review">Under Review</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-medium text-slate-700 mb-1">
                          Disciplinary Notes
                        </label>
                        <input
                          type="text"
                          value={disciplinaryNotes}
                          onChange={(e) => setDisciplinaryNotes(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white"
                        />
                      </div>
                    </>
                  )}
                  <div className="sm:col-span-2 flex justify-end">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void saveEdit(stu)}
                      className="px-4 py-2 rounded-lg bg-pust-900 text-white font-semibold hover:bg-pust-950 disabled:opacity-60 cursor-pointer"
                    >
                      {saving ? 'Saving...' : 'Save Student Record'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
