import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Award } from 'lucide-react';
import { pustApi } from '../../lib/api';
import type {
  AuthUser,
  CertificateApplicationRecord,
  ClearanceOfficeKey,
  FeeConfig,
  PaymentGatewayConfig,
  StudentRecord,
} from '../../types/pust';

const OFFICE_KEYS: ClearanceOfficeKey[] = ['chairman', 'hall', 'library', 'proctor'];

interface CertificatePanelProps {
  user: AuthUser;
}

export function CertificatePanel({ user }: CertificatePanelProps) {
  const [applications, setApplications] = useState<CertificateApplicationRecord[]>([]);
  const [feeConfig, setFeeConfig] = useState<FeeConfig>({
    certificateFeeBdt: 1500,
    defaultExamFeeBdt: 1450,
  });
  const [gateways, setGateways] = useState<PaymentGatewayConfig[]>([]);
  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Student Apply
  const [certType, setCertType] =
    useState<CertificateApplicationRecord['certificateType']>('Temporary Certificate');
  const [payMethod, setPayMethod] = useState('SSLCommerz');
  const [txnId, setTxnId] = useState('');

  // Office Review Notes & Resubmission Notes
  const [officeNotes, setOfficeNotes] = useState<Record<string, string>>({});
  const [resubmitNotes, setResubmitNotes] = useState<Record<string, string>>({});
  const [certPreview, setCertPreview] = useState<CertificateApplicationRecord | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await pustApi.getCertificatesOverview();
      setApplications(data.applications);
      setFeeConfig(data.feeConfig);
      setGateways(data.gateways);
      setStudent(data.student);
      if (data.gateways.length > 0) setPayMethod(data.gateways[0].name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load certificate workflow.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleApplyCertificate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      const res = await pustApi.applyCertificate({
        certificateType: certType,
        paymentMethod: payMethod,
        transactionId: txnId,
      });
      setFeedback(
        `Certificate application submitted (${res.application.id}). Initiated independent clearance checks across Chairman, Hall, Library, and Proctor offices.`
      );
      setTxnId('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to apply for certificate.');
    }
  }

  async function handleOfficeDecision(
    appId: string,
    decision: 'approved' | 'declined'
  ) {
    setError(null);
    setFeedback(null);
    const note =
      officeNotes[appId]?.trim() ||
      (decision === 'approved'
        ? 'All office records and dues cleared.'
        : 'Pending departmental or office clearance verification.');
    try {
      await pustApi.reviewCertificateOffice(appId, { decision, note });
      setFeedback(`Recorded ${decision} office clearance for application.`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update office clearance.');
    }
  }

  async function handleResubmit(appId: string, office: ClearanceOfficeKey) {
    setError(null);
    setFeedback(null);
    const key = `${appId}-${office}`;
    const note = resubmitNotes[key]?.trim();
    if (!note) {
      setError('Provide your resolution note before resubmitting to the declined office.');
      return;
    }
    try {
      await pustApi.resubmitCertificateOffice(appId, { office, note });
      setFeedback(`Resubmitted resolution to ${office.toUpperCase()} Office.`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to resubmit clearance.');
    }
  }

  async function handleAdminFinal(appId: string, decision: 'approved' | 'rejected') {
    setError(null);
    setFeedback(null);
    try {
      const res = await pustApi.finalAdminCertificate(appId, {
        decision,
        adminNote: officeNotes[appId] || 'All 4 clearances verified by Admin Office.',
        physicalCollected: decision === 'approved',
      });
      setFeedback(
        decision === 'approved'
          ? `Issued Temporary Certificate ${res.application.certificateSerial ?? ''}.`
          : 'Declined certificate final issuance.'
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete final verification.');
    }
  }

  const studentEligible = Boolean(
    student && student.completedSemesters >= 8 && student.allResultsPublished
  );

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
          Certificate Application &amp; 4-Office Independent Clearances
        </p>
        <h2 className="font-serif text-2xl font-medium text-slate-900 mt-1">
          Chairman, Hall, Library &amp; Proctor Clearances and Temporary Certificate Issuance
        </h2>
      </div>

      {error && (
        <div className="p-3.5 border border-red-200 bg-red-50 text-sm text-red-900">{error}</div>
      )}
      {feedback && (
        <div className="p-3.5 border border-emerald-200 bg-emerald-50 text-sm text-emerald-900">
          {feedback}
        </div>
      )}

      {/* Student Eligibility & Certificate Application */}
      {user.role === 'student' && (
        <div className="bg-white border border-slate-200 p-6 space-y-4">
          <div className="flex flex-wrap justify-between gap-4 border-b border-slate-200 pb-3">
            <div>
              <h3 className="font-serif text-lg font-medium text-slate-900">
                Graduation Eligibility &amp; Fee Submission
              </h3>
              <p className="font-mono text-xs text-slate-600 mt-1">
                Completed Semesters: {student?.completedSemesters ?? 0}/8 · All Results Published:{' '}
                {student?.allResultsPublished ? 'YES' : 'NO'} · Fee: ৳{feeConfig.certificateFeeBdt}
              </p>
            </div>
          </div>

          {!studentEligible ? (
            <div className="p-4 border border-amber-300 bg-amber-50 text-sm text-amber-900">
              Eligibility check: You must complete all 8 academic semesters with published final
              results before applying for a Temporary Certificate.
            </div>
          ) : (
            <form onSubmit={handleApplyCertificate} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <select
                value={certType}
                onChange={(e) =>
                  setCertType(e.target.value as CertificateApplicationRecord['certificateType'])
                }
                className="px-3 py-2 text-sm border border-slate-300 bg-slate-50"
              >
                <option value="Temporary Certificate">Temporary Certificate</option>
                <option value="Provisional Transcript">Provisional Transcript</option>
              </select>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-300 bg-slate-50"
              >
                {gateways.map((g) => (
                  <option key={g.id} value={g.name}>
                    {g.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                required
                value={txnId}
                onChange={(e) => setTxnId(e.target.value)}
                placeholder="Fee Transaction Ref"
                className="px-3 py-2 text-sm border border-slate-300 bg-slate-50"
              />
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer"
              >
                Apply (৳{feeConfig.certificateFeeBdt})
              </button>
            </form>
          )}
        </div>
      )}

      {/* Certificate Applications & 4-Office Independent Clearance Tracker */}
      <div className="bg-white border border-slate-200 p-6 space-y-5">
        <h3 className="font-serif text-lg font-medium text-slate-900">
          Live 4-Office Clearance Status &amp; Resubmission History
        </h3>
        {loading ? (
          <p className="text-sm text-slate-600">Loading certificate clearance records...</p>
        ) : applications.length === 0 ? (
          <p className="text-sm text-slate-600">No certificate applications found.</p>
        ) : (
          <div className="space-y-6">
            {applications.map((app) => {
              const allCleared = OFFICE_KEYS.every(
                (k) => app.clearances[k].status === 'approved'
              );
              const myOfficeRole = ['chairman', 'hall', 'library', 'proctor'].includes(user.role)
                ? (user.role as ClearanceOfficeKey)
                : null;

              return (
                <div key={app.id} className="border border-slate-200 p-5 space-y-4">
                  <div className="flex flex-wrap justify-between gap-3 border-b border-slate-200 pb-3">
                    <div>
                      <p className="font-medium text-slate-900">
                        {app.studentName} · <span className="font-mono">{app.academicId}</span> (
                        {app.departmentCode} · {app.session})
                      </p>
                      <p className="font-mono text-xs text-slate-500">
                        {app.certificateType} · Paid ৳{app.feeBdt} via {app.paymentMethod} (
                        {app.transactionId}) · Admin Status:{' '}
                        <span className="text-emerald-700 font-semibold">
                          {app.finalAdminStatus.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </p>
                    </div>

                    {app.certificateSerial && (
                      <button
                        type="button"
                        onClick={() => setCertPreview(app)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer h-fit"
                      >
                        <Award className="w-3.5 h-3.5" />
                        Certificate ({app.certificateSerial})
                      </button>
                    )}
                  </div>

                  {/* 4 Independent Office Panels */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {OFFICE_KEYS.map((key) => {
                      const state = app.clearances[key];
                      const resKey = `${app.id}-${key}`;
                      return (
                        <div
                          key={key}
                          className={`p-3.5 border text-xs space-y-2 ${
                            state.status === 'approved'
                              ? 'border-emerald-300 bg-emerald-50/40'
                              : state.status === 'declined'
                              ? 'border-red-300 bg-red-50/50'
                              : 'border-slate-200 bg-slate-50'
                          }`}
                        >
                          <p className="font-semibold text-slate-900">{state.officeLabel}</p>
                          <p className="font-mono uppercase text-emerald-700">
                            {state.status}
                          </p>
                          <p className="text-slate-700 leading-relaxed">{state.note}</p>

                          {state.history.length > 0 && (
                            <div className="border-t border-slate-200 pt-1.5 space-y-0.5 text-[11px] text-slate-500 font-mono">
                              {state.history.map((h, idx) => (
                                <p key={`${h.timestamp}-${idx}`}>
                                  [{h.action}] {h.actor}: {h.note}
                                </p>
                              ))}
                            </div>
                          )}

                          {user.role === 'student' && state.status === 'declined' && (
                            <div className="pt-2 space-y-1.5">
                              <input
                                type="text"
                                value={resubmitNotes[resKey] ?? ''}
                                onChange={(e) =>
                                  setResubmitNotes((prev) => ({
                                    ...prev,
                                    [resKey]: e.target.value,
                                  }))
                                }
                                placeholder="Resolution note..."
                                className="w-full px-2 py-1.5 text-xs border border-slate-300 bg-white"
                              />
                              <button
                                type="button"
                                onClick={() => handleResubmit(app.id, key)}
                                className="w-full py-1.5 text-xs font-medium bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer"
                              >
                                Resubmit Clearance
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Independent Office Action Bar */}
                  {myOfficeRole && app.finalAdminStatus !== 'approved' && (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
                      <input
                        type="text"
                        value={officeNotes[app.id] ?? ''}
                        onChange={(e) =>
                          setOfficeNotes((prev) => ({ ...prev, [app.id]: e.target.value }))
                        }
                        placeholder={`Written ${myOfficeRole.toUpperCase()} note (required for decline)...`}
                        className="flex-1 min-w-[220px] px-3 py-1.5 text-xs border border-slate-300 bg-slate-50"
                      />
                      <button
                        type="button"
                        onClick={() => handleOfficeDecision(app.id, 'approved')}
                        className="px-4 py-1.5 text-xs font-medium bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer"
                      >
                        Approve ({myOfficeRole})
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOfficeDecision(app.id, 'declined')}
                        className="px-4 py-1.5 text-xs font-medium border border-red-300 text-red-700 hover:bg-red-50 cursor-pointer"
                      >
                        Decline with Note
                      </button>
                    </div>
                  )}

                  {/* Admin Office Final Verification */}
                  {user.role === 'admin' && app.finalAdminStatus !== 'approved' && (
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
                      <p className="text-xs text-slate-600">
                        {allCleared
                          ? 'All 4 offices cleared. Ready for Final Verification & Temporary Certificate issuance.'
                          : 'Waiting for all 4 independent offices to clear before issuance.'}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={!allCleared}
                          onClick={() => handleAdminFinal(app.id, 'approved')}
                          className="px-4 py-1.5 text-xs font-medium bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-40 cursor-pointer"
                        >
                          Final Approve &amp; Issue Temporary Certificate
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Temporary Certificate Modal */}
      {certPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          onClick={() => setCertPreview(null)}
        >
          <div
            className="w-full max-w-xl bg-white border-2 border-emerald-700 shadow-2xl p-8 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-slate-200 pb-4 flex justify-between items-start">
              <div>
                <p className="font-mono text-xs uppercase text-emerald-700">
                  Official Provisional / Temporary Certificate
                </p>
                <h3 className="font-serif text-2xl font-semibold text-slate-900">
                  Pabna University of Science and Technology
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCertPreview(null)}
                className="text-xs text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                Close
              </button>
            </div>
            <p className="text-sm leading-relaxed text-slate-800">
              This is to certify that <span className="font-semibold">{certPreview.studentName}</span>{' '}
              (Academic ID <span className="font-mono">{certPreview.academicId}</span>, Department
              of <span className="font-mono">{certPreview.departmentCode}</span>, Session{' '}
              <span className="font-mono">{certPreview.session}</span>) has fulfilled all
              academic requirements across 8 semesters and obtained complete clearances from the
              Chairman, Hall, Library, and Proctor offices.
            </p>
            <dl className="grid grid-cols-2 gap-3 text-xs border-t border-slate-200 pt-4 font-mono">
              <div>
                <dt className="text-slate-500">Certificate Serial</dt>
                <dd className="font-semibold text-emerald-700">{certPreview.certificateSerial}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Issued Date</dt>
                <dd>{certPreview.issuedAt}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
