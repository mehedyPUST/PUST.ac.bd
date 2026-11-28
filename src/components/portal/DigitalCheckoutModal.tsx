'use client';

import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
  QrCode,
  Receipt,
  Smartphone,
  X,
} from 'lucide-react';
import { pustApi } from '../../lib/api';
import type {
  ClearanceOfficeKey,
  PaymentGatewayConfig,
  PaymentReceiptRecord,
} from '../../types/pust';
import { VerificationQrSvg } from './DigitalDocumentModal';

export interface CheckoutTarget {
  targetType: 'hall_due' | 'exam_application' | 'certificate';
  targetId?: string;
  certificateType?: 'Temporary Certificate' | 'Provisional Transcript';
  title: string;
  subtitle: string;
  amountBdt: number;
}

export interface CheckoutAutomationMeta {
  autoCleared?: boolean;
  autoIssued?: boolean;
  holdReason?: string;
  clearedOffices?: ClearanceOfficeKey[];
}

interface DigitalCheckoutModalProps {
  target: CheckoutTarget | null;
  gateways: PaymentGatewayConfig[];
  onClose: () => void;
  onSuccess: (
    receipt: PaymentReceiptRecord,
    updatedTarget: unknown,
    meta?: CheckoutAutomationMeta
  ) => Promise<void> | void;
}

export function DigitalCheckoutModal({
  target,
  gateways,
  onClose,
  onSuccess,
}: DigitalCheckoutModalProps) {
  const enabledGateways = gateways.filter((g) => g.enabled);
  const [selectedCode, setSelectedCode] = useState(enabledGateways[0]?.code || 'SSLCOMMERZ');
  const [accountMask, setAccountMask] = useState('');
  const [manualRef, setManualRef] = useState('');
  const [useManualRef, setUseManualRef] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<PaymentReceiptRecord | null>(null);
  const [autoMeta, setAutoMeta] = useState<CheckoutAutomationMeta | null>(null);

  useEffect(() => {
    if (target) {
      setSelectedCode(enabledGateways[0]?.code || 'SSLCOMMERZ');
      setAccountMask('');
      setManualRef('');
      setUseManualRef(false);
      setError(null);
      setReceipt(null);
      setAutoMeta(null);
    }
  }, [target, gateways]);

  useEffect(() => {
    if (!target) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !processing) onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [target, processing, onClose]);

  if (!target) return null;

  const activeGateway =
    enabledGateways.find((g) => g.code === selectedCode) || enabledGateways[0] || null;

  function gatewayIcon(code: string) {
    if (code === 'BANGLA_QR') return QrCode;
    if (code === 'MFS') return Smartphone;
    return CreditCard;
  }

  async function handleConfirmPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!target || !activeGateway) return;
    if (useManualRef && manualRef.trim().length < 4) {
      setError('Enter a valid pre-paid bank or MFS transaction ID (min 4 characters).');
      return;
    }

    setProcessing(true);
    setError(null);
    try {
      const res = await pustApi.checkoutPayment({
        targetType: target.targetType,
        targetId: target.targetId,
        certificateType: target.certificateType,
        gatewayCode: activeGateway.code,
        accountMask:
          accountMask.trim() ||
          (activeGateway.code === 'BANGLA_QR'
            ? 'Bangla QR Scan'
            : activeGateway.code === 'MFS'
            ? 'Mobile Wallet'
            : 'Online Card / NetBank'),
        manualRef: useManualRef ? manualRef.trim() : undefined,
      });
      const meta: CheckoutAutomationMeta = {
        autoCleared: res.autoCleared,
        autoIssued: res.autoIssued,
        holdReason: res.holdReason,
        clearedOffices: res.clearedOffices,
      };
      setReceipt(res.receipt);
      setAutoMeta(meta);
      await onSuccess(res.receipt, res.updatedTarget, meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to settle payment.');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center p-4 overflow-y-auto overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-modal-title"
      onClick={() => {
        if (!processing) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-lg border border-stone-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-[#FAF9F6] dark:bg-slate-800/80 border-b border-stone-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Lock className="w-4 h-4 text-pust-800 dark:text-gold-300 shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200 truncate">
              PUST Digital Payment Checkout
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close checkout"
            className="min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-stone-200 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-100 shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          {receipt ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sm text-emerald-950 dark:text-emerald-100">
                    Payment Verified &amp; Settled
                  </h3>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                    Your digital receipt has been recorded in the PUST Finance ledger.
                  </p>
                  {autoMeta?.autoCleared && (
                    <p className="text-xs font-medium text-emerald-900 dark:text-emerald-200 mt-1">
                      Automated Hall Clearance issued — examination registration unlocked.
                    </p>
                  )}
                  {autoMeta?.autoIssued && (
                    <p className="text-xs font-medium text-emerald-900 dark:text-emerald-200 mt-1">
                      Digital credential auto-issued immediately after automated clearance checks.
                    </p>
                  )}
                  {autoMeta?.clearedOffices && autoMeta.clearedOffices.length > 0 && !autoMeta.autoIssued && (
                    <p className="text-xs font-medium text-emerald-900 dark:text-emerald-200 mt-1">
                      Auto-cleared offices: {autoMeta.clearedOffices.map((o) => o.toUpperCase()).join(', ')}.
                    </p>
                  )}
                  {autoMeta?.holdReason && (
                    <p className="text-xs font-medium text-amber-900 dark:text-amber-300 mt-1">
                      Automated issuance held: {autoMeta.holdReason}
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-stone-200 dark:border-slate-800 divide-y divide-stone-200 dark:divide-slate-800 text-xs">
                <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Receipt No.</span>
                  <span className="font-mono font-semibold text-pust-800 dark:text-gold-300 break-all">
                    {receipt.receiptNo}
                  </span>
                </div>
                <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Transaction ID</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 break-all">
                    {receipt.transactionId}
                  </span>
                </div>
                <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Gateway</span>
                  <span className="text-slate-800 dark:text-slate-200">{receipt.gatewayName}</span>
                </div>
                <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Amount Paid</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                    BDT {receipt.amountBdt.toLocaleString('en-US')}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 min-h-[44px] rounded-lg bg-pust-700 text-white text-xs font-semibold hover:bg-pust-800 cursor-pointer"
              >
                Done &amp; Return to Portal
              </button>
            </div>
          ) : (
            <form onSubmit={handleConfirmPayment} className="space-y-5">
              <div className="p-4 rounded-lg bg-[#FAF9F6] dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Payment Item
                  </p>
                  <h2
                    id="checkout-modal-title"
                    className="font-serif text-lg font-medium text-slate-900 dark:text-slate-100 mt-0.5"
                  >
                    {target.title}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{target.subtitle}</p>
                </div>
                <div className="sm:text-right shrink-0">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Payable</p>
                  <p className="font-mono text-lg font-semibold text-pust-800 dark:text-gold-300 tabular-nums">
                    ৳{target.amountBdt.toLocaleString('en-US')}
                  </p>
                </div>
              </div>

              {enabledGateways.length === 0 ? (
                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/35 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
                  No digital payment gateways are currently enabled by the Admin Office.
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Select Payment Channel
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {enabledGateways.map((gw) => {
                        const Icon = gatewayIcon(gw.code);
                        const active = gw.code === activeGateway?.code;
                        return (
                          <button
                            key={gw.id}
                            type="button"
                            onClick={() => setSelectedCode(gw.code)}
                            className={`text-left p-3 rounded-lg border transition-colors flex items-start gap-3 cursor-pointer ${
                              active
                                ? 'border-pust-700 dark:border-gold-400 bg-pust-50/70 dark:bg-slate-800'
                                : 'border-stone-200 dark:border-slate-700 hover:border-stone-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900'
                            }`}
                          >
                            <Icon
                              className={`w-4 h-4 mt-0.5 shrink-0 ${
                                active ? 'text-pust-800 dark:text-gold-300' : 'text-slate-500 dark:text-slate-400'
                              }`}
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{gw.name}</p>
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{gw.instructions}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {activeGateway?.code === 'BANGLA_QR' && !useManualRef && (
                    <div className="p-4 rounded-lg border border-stone-200 dark:border-slate-700 bg-[#FAF9F6] dark:bg-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <VerificationQrSvg
                        seed={`PUST-BQR-${target.targetType}-${target.targetId || target.amountBdt}`}
                        size={76}
                      />
                      <div className="text-xs space-y-1 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          Scan Merchant QR via Bangla QR
                        </p>
                        <p className="text-slate-600 dark:text-slate-300 break-all">
                          Merchant ID: <span className="font-mono">PUST.GOV.BD.FIN</span>
                        </p>
                        <p className="text-[11px] text-pust-800 dark:text-gold-300">
                          Click &ldquo;Pay &amp; Generate Receipt&rdquo; after confirming in your app.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                        {useManualRef
                          ? 'Pre-Paid Bank / MFS Transaction ID'
                          : 'Account / Wallet Reference (optional)'}
                      </label>
                      <button
                        type="button"
                        onClick={() => setUseManualRef(!useManualRef)}
                        className="text-[11px] font-medium text-pust-800 dark:text-gold-300 hover:underline cursor-pointer"
                      >
                        {useManualRef ? 'Use Instant Checkout' : 'Have Existing TXN Ref?'}
                      </button>
                    </div>

                    {useManualRef ? (
                      <input
                        value={manualRef}
                        onChange={(e) => setManualRef(e.target.value)}
                        placeholder="e.g. TXN-902184 or Bank Scroll Ref"
                        required
                        className="w-full px-3.5 py-2.5 text-sm font-mono rounded-lg border border-stone-300 dark:border-slate-700 bg-[#FAF9F6] dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-pust-700/20 focus:border-pust-700 dark:focus:border-gold-400"
                      />
                    ) : (
                      <input
                        value={accountMask}
                        onChange={(e) => setAccountMask(e.target.value)}
                        placeholder={
                          activeGateway?.code === 'MFS'
                            ? 'Wallet e.g. 017••••1234'
                            : 'Card / Account last 4 digits (optional)'
                        }
                        className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-stone-300 dark:border-slate-700 bg-[#FAF9F6] dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-pust-700/20 focus:border-pust-700 dark:focus:border-gold-400"
                      />
                    )}
                  </div>
                </>
              )}

              {error && (
                <p className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-pust-700 dark:hover:border-gold-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing || enabledGateways.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg bg-pust-700 text-white hover:bg-pust-800 disabled:opacity-50 cursor-pointer"
                >
                  {processing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Receipt className="w-3.5 h-3.5" />
                  )}
                  {processing ? 'Processing...' : `Pay BDT ${target.amountBdt.toLocaleString('en-US')}`}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
