'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Award,
  CheckCircle2,
  Clock,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import { pustApi } from '../../lib/api';
import { usePust } from '../PustContext';
import { PortalRecordsSkeleton } from '../PustSkeletons';
import { DigitalCheckoutModal, type CheckoutTarget } from './DigitalCheckoutModal';
import { DigitalDocumentModal, type DigitalDocumentData } from './DigitalDocumentModal';
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
  const { navigateTo } = usePust();
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'issued'>('all');

  // Digital Checkout & Verified Document Modals
  const [checkoutTarget, setCheckoutTarget] = useState<CheckoutTarget | null>(null);
  const [activeDoc, setActiveDoc] = useState<DigitalDocumentData | null>(null);

  // Student Certificate Type
  const [certType, setCertType] =
    useState<CertificateApplicationRecord['certificateType']>('Temporary Certificate');

  // Office Review Notes & Resubmission Notes
  const [officeNotes, setOfficeNotes] = useState<Record<string, string>>({});
  const [resubmitNotes, setResubmitNotes] = useState<Record<string, string>>({});

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await pustApi.getCertificatesOverview();
      setApplications(data.applications);
      setFeeConfig(data.feeConfig);
      setGateways(data.gateways);
      setStudent(data.student);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load certificate workflow.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function handleOpenCertificateCheckout() {
    setError(null);
    setFeedback(null);
    setCheckoutTarget({
      targetType: 'certificate',
      certificateType: certType,
      title: certType,
      subtitle: 'Initiates 4-Office Independent Graduation Clearances (Chairman · Hall · Library · Proctor)',
      amountBdt: feeConfig.certificateFeeBdt,
    });
  }

  async function handleOfficeDecision(appId: string, decision: 'approved' | 'declined') {
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
          ? `Issued Digital ${res.application.certificateType} ${
              res.application.certificateSerial ?? ''
            }.`
          : 'Declined certificate final issuance.'
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete final verification.');
    }
  }

  function openCertificateDocument(app: CertificateApplicationRecord) {
    if (!app.certificateSerial) return;
    setActiveDoc({
      kind: 'certificate',
      serialCode: app.certificateSerial,
      verificationHash: app.verificationHash,
      title: `Official ${app.certificateType}`,
      subtitle: 'Academic Credential · 4-Office Clearances & Registrar Verification Complete',
      holderName: app.studentName,
      academicId: app.academicId,
      departmentCode: app.departmentCode,
      session: app.session,
      issuedAt: app.issuedAt || app.createdAt.slice(0, 10),
      issuedBy: 'Central Academic Administration & Controller of Examinations',
      statusLabel: 'Verified & Authentic',
      rows: [
        { label: 'Credential Type', value: app.certificateType },
        {
          label: 'Fee & Receipt',
          value: `BDT ${app.feeBdt.toLocaleString()} via ${app.paymentMethod} (${
            app.receiptNo || app.transactionId
          })`,
        },
        ...OFFICE_KEYS.map((k) => ({
          label: app.clearances[k].officeLabel,
          value: `${app.clearances[k].status.toUpperCase()} — ${app.clearances[k].note}`,
        })),
      ],
      footerNote:
        'Employers and institutions can authenticate this serial and cryptographic hash on the PUST Public Registry (/verify).',
    });
  }

  const studentEligible = Boolean(
    student && student.completedSemesters >= 8 && student.allResultsPublished
  );

  const myOfficeRole: ClearanceOfficeKey | null = ['chairman', 'hall', 'library', 'proctor'].includes(
    user.role
  )
    ? (user.role as ClearanceOfficeKey)
    : null;

  const waitingOfficesCount = applications.filter(
    (a) => a.finalAdminStatus === 'waiting_offices'
  ).length;
  const readyForAdminCount = applications.filter(
    (a) =>
      a.finalAdminStatus !== 'approved' &&
      OFFICE_KEYS.every((k) => a.clearances[k].status === 'approved')
  ).length;
  const issuedCount = applications.filter((a) => a.finalAdminStatus === 'approved').length;
  const pendingMyOfficeCount = myOfficeRole
    ? applications.filter(
        (a) => a.finalAdminStatus !== 'approved' && a.clearances[myOfficeRole].status !== 'approved'
      ).length
    : user.role === 'admin'
    ? readyForAdminCount
    : applications.filter((a) => a.finalAdminStatus !== 'approved').length;

  const filteredApplications = applications.filter((app) => {
    if (statusFilter === 'issued') return app.finalAdminStatus === 'approved';
    if (statusFilter === 'pending') {
      if (myOfficeRole) {
        return (
          app.finalAdminStatus !== 'approved' && app.clearances[myOfficeRole].status !== 'approved'
        );
      }
      if (user.role === 'admin') {
        return (
          app.finalAdminStatus !== 'approved' &&
          OFFICE_KEYS.every((k) => app.clearances[k].status === 'approved')
        );
      }
      return app.finalAdminStatus !== 'approved';
    }
    return true;
  });

  const headerTitle =
    user.role === 'student'
      ? 'Graduation Clearance & Temporary Certificate'
      : myOfficeRole
      ? `${myOfficeRole.charAt(0).toUpperCase() + myOfficeRole.slice(1)} Office Clearance Desk`
      : 'Central Certificate Verification & Issuance Desk';

  const headerSubtitle =
    user.role === 'student'
      ? 'Verify 8-semester eligibility, pay fees digitally, track 4-office clearances, and download your QR-verified certificate.'
      : myOfficeRole
      ? `Review, approve, or decline ${myOfficeRole.toUpperCase()} clearance checkpoints for graduating students.`
      : 'Audit 4-office clearance completion and issue official Provisional / Temporary Certificates.';

  return (
    <div className="space-y-6">
      {/* Role-Specific Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-pust-800">
            {user.role === 'student'
              ? 'Student Graduation Workflow'
              : myOfficeRole
              ? `Clearance Authority · ${myOfficeRole.toUpperCase()} Office`
              : 'Central Admin Final Issuance'}
          </p>
          <h2 className="font-serif text-2xl font-medium text-slate-900">{headerTitle}</h2>
          <p className="text-xs text-slate-600 max-w-2xl">{headerSubtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums">
          <div className="px-3.5 py-2 rounded-xl bg-[#F7F7F5] border border-slate-200">
            <span className="block text-[10px] uppercase tracking-wider text-slate-500">
              {myOfficeRole
                ? 'Pending My Office'
                : user.role === 'admin'
                ? 'Ready to Issue'
                : 'In Progress'}
            </span>
            <span className="text-base font-semibold text-amber-800">{pendingMyOfficeCount}</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-[#F7F7F5] border border-slate-200">
            <span className="block text-[10px] uppercase tracking-wider text-slate-500">
              Waiting 4-Office
            </span>
            <span className="text-base font-semibold text-slate-900">{waitingOfficesCount}</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-[#F7F7F5] border border-slate-200">
            <span className="block text-[10px] uppercase tracking-wider text-slate-500">
              Issued
            </span>
            <span className="text-base font-semibold text-pust-800">{issuedCount}</span>
          </div>
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

      {/* Student Eligibility & Digital Checkout */}
      {user.role === 'student' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3.5">
            <div>
              <h3 className="font-serif text-lg font-medium text-slate-900">
                Graduation Eligibility &amp; Digital Fee Submission
              </h3>
              <p className="font-mono text-xs text-slate-600 mt-1 tabular-nums">
                Completed Semesters: {student?.completedSemesters ?? 0}/8 · All Results Published:{' '}
                <span
                  className={
                    student?.allResultsPublished
                      ? 'text-pust-800 font-semibold'
                      : 'text-amber-800 font-semibold'
                  }
                >
                  {student?.allResultsPublished ? 'YES' : 'NO'}
                </span>{' '}
                · Official Fee: ৳{feeConfig.certificateFeeBdt.toLocaleString()}
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 font-mono text-xs font-semibold ${
                studentEligible ? 'text-emerald-800' : 'text-amber-800'
              }`}
            >
              {studentEligible ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Eligible to Apply
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4" />
                  Awaiting 8/8 Semesters
                </>
              )}
            </span>
          </div>

          {!studentEligible ? (
            <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/70 text-sm text-amber-950">
              Eligibility check: You must complete all 8 academic semesters with published final
              results before applying for a Temporary Certificate or Provisional Transcript.
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <label className="block font-mono text-[11px] uppercase tracking-wider text-slate-500 mb-1">
                  Select Credential Type
                </label>
                <select
                  value={certType}
                  onChange={(e) =>
                    setCertType(e.target.value as CertificateApplicationRecord['certificateType'])
                  }
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:outline-none focus:border-pust-800"
                >
                  <option value="Temporary Certificate">Temporary Certificate</option>
                  <option value="Provisional Transcript">Provisional Transcript</option>
                </select>
              </div>
              <div className="sm:pt-5">
                <button
                  type="button"
                  onClick={handleOpenCertificateCheckout}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-pust-900 text-white hover:bg-pust-950 cursor-pointer whitespace-nowrap shrink-0 tabular-nums"
                >
                  <CreditCard className="w-4 h-4" />
                  Pay Fee &amp; Submit Application (৳{feeConfig.certificateFeeBdt.toLocaleString()})
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Certificate Applications & 4-Office Independent Clearance Tracker */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h3 className="font-serif text-lg font-medium text-slate-900">
              Live 4-Office Clearance Status &amp; Resubmission History
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Each application requires independent clearance from Chairman, Hall, Library, and
              Proctor offices.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'all', label: `All (${applications.length})` },
                {
                  id: 'pending',
                  label: myOfficeRole
                    ? `Pending My Office (${pendingMyOfficeCount})`
                    : user.role === 'admin'
                    ? `Ready for Issuance (${readyForAdminCount})`
                    : `Pending (${applications.length - issuedCount})`,
                },
                { id: 'issued', label: `Issued (${issuedCount})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                  statusFilter === tab.id
                    ? 'border-pust-900 bg-pust-900 text-white'
                    : 'border-slate-300 bg-[#F7F7F5] text-slate-700 hover:border-pust-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <PortalRecordsSkeleton rows={2} />
        ) : filteredApplications.length === 0 ? (
          <div className="p-6 rounded-xl border border-slate-200 bg-[#F7F7F5] text-center text-sm text-slate-600">
            No certificate applications match the selected filter.
          </div>
        ) : (
          <div className="space-y-6">
            {filteredApplications.map((app) => {
              const allCleared = OFFICE_KEYS.every((k) => app.clearances[k].status === 'approved');

              return (
                <div
                  key={app.id}
                  className="rounded-xl border border-slate-200 bg-[#F7F7F5]/60 p-5 space-y-4"
                >
                  <div className="flex flex-wrap justify-between items-start gap-3 border-b border-slate-200 pb-3">
                    <div className="space-y-1">
                      <p className="font-medium text-slate-900">
                        {app.studentName} ·{' '}
                        <span className="font-mono tabular-nums">{app.academicId}</span> (
                        {app.departmentCode} · {app.session})
                      </p>
                      <p className="font-mono text-xs text-slate-500 tabular-nums">
                        {app.certificateType} · Paid ৳{app.feeBdt.toLocaleString()} via{' '}
                        {app.paymentMethod} ({app.receiptNo || app.transactionId}) · Status:{' '}
                        <span
                          className={`font-semibold ${
                            app.finalAdminStatus === 'approved'
                              ? 'text-pust-800'
                              : 'text-amber-800'
                          }`}
                        >
                          {app.finalAdminStatus.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </p>
                    </div>

                    {app.certificateSerial && (
                      <button
                        type="button"
                        onClick={() => openCertificateDocument(app)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-pust-900 text-white hover:bg-pust-950 cursor-pointer whitespace-nowrap shrink-0 tabular-nums"
                      >
                        <Award className="w-3.5 h-3.5" />
                        View Official Certificate ({app.certificateSerial})
                      </button>
                    )}
                  </div>

                  {/* 4 Independent Office Panels */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {OFFICE_KEYS.map((key) => {
                      const state = app.clearances[key];
                      const resKey = `${app.id}-${key}`;
                      const isMyOffice = myOfficeRole === key;
                      return (
                        <div
                          key={key}
                          className={`p-3.5 rounded-xl border text-xs space-y-2 transition-colors ${
                            isMyOffice
                              ? 'border-pust-800 bg-white ring-1 ring-pust-800/15 shadow-xs'
                              : state.status === 'approved'
                              ? 'border-emerald-300 bg-emerald-50/50'
                              : state.status === 'declined'
                              ? 'border-red-300 bg-red-50/60'
                              : 'border-slate-200 bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-slate-900">{state.officeLabel}</p>
                            {isMyOffice && (
                              <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-pust-800 font-semibold shrink-0">
                                <ShieldCheck className="w-3 h-3" />
                                Your Office
                              </span>
                            )}
                          </div>
                          <p
                            className={`inline-flex items-center gap-1 font-mono uppercase font-semibold ${
                              state.status === 'approved'
                                ? 'text-pust-800'
                                : state.status === 'declined'
                                ? 'text-red-700'
                                : 'text-amber-800'
                            }`}
                          >
                            {state.status === 'approved' ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : state.status === 'declined' ? (
                              <AlertCircle className="w-3.5 h-3.5" />
                            ) : (
                              <Clock className="w-3.5 h-3.5" />
                            )}
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
                                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:outline-none focus:border-pust-800"
                              />
                              <button
                                type="button"
                                onClick={() => handleResubmit(app.id, key)}
                                className="w-full py-1.5 text-xs font-medium rounded-lg bg-pust-900 text-white hover:bg-pust-950 cursor-pointer"
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
                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-200">
                      <input
                        type="text"
                        value={officeNotes[app.id] ?? ''}
                        onChange={(e) =>
                          setOfficeNotes((prev) => ({ ...prev, [app.id]: e.target.value }))
                        }
                        placeholder={`Written ${myOfficeRole.toUpperCase()} note (required for decline)...`}
                        className="flex-1 min-w-[220px] px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-pust-800"
                      />
                      <button
                        type="button"
                        onClick={() => handleOfficeDecision(app.id, 'approved')}
                        className="px-4 py-1.5 text-xs font-medium rounded-lg bg-pust-900 text-white hover:bg-pust-950 cursor-pointer whitespace-nowrap shrink-0"
                      >
                        Approve ({myOfficeRole.toUpperCase()})
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOfficeDecision(app.id, 'declined')}
                        className="px-4 py-1.5 text-xs font-medium rounded-lg border border-red-300 bg-white text-red-700 hover:bg-red-50 cursor-pointer whitespace-nowrap shrink-0"
                      >
                        Decline with Note
                      </button>
                    </div>
                  )}

                  {/* Admin Office Final Verification */}
                  {user.role === 'admin' && app.finalAdminStatus !== 'approved' && (
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
                      <p className="text-xs text-slate-600">
                        {allCleared
                          ? 'All 4 offices cleared. Ready for Final Verification & Digital Certificate issuance.'
                          : 'Waiting for all 4 independent offices to clear before issuance.'}
                      </p>
                      <button
                        type="button"
                        disabled={!allCleared}
                        onClick={() => handleAdminFinal(app.id, 'approved')}
                        className="px-4 py-2 text-xs font-semibold rounded-lg bg-pust-900 text-white hover:bg-pust-950 disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0"
                      >
                        Final Approve &amp; Issue Digital Certificate
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Unified Digital Payment Checkout Modal */}
      <DigitalCheckoutModal
        target={checkoutTarget}
        gateways={gateways}
        onClose={() => setCheckoutTarget(null)}
        onSuccess={async (receipt) => {
          setFeedback(
            `Certificate fee paid (${receipt.receiptNo} via ${receipt.gatewayName}). Initiated 4-office clearances across Chairman, Hall, Library, and Proctor.`
          );
          await refresh();
        }}
      />

      {/* Unified Verified Digital Document Viewer */}
      <DigitalDocumentModal
        doc={activeDoc}
        onClose={() => setActiveDoc(null)}
        onOpenVerify={(code) => navigateTo(`/verify?code=${encodeURIComponent(code)}`)}
      />
    </div>
  );
}
