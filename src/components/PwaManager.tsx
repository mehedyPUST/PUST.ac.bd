'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircle2,
  Download,
  MonitorSmartphone,
  PlusSquare,
  Share,
  Smartphone,
  WifiOff,
  X,
} from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

export function PwaRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .catch(() => {});
      if ('caches' in window) {
        caches
          .keys()
          .then((keys) =>
            Promise.all(
              keys.filter((key) => key.startsWith('pust-')).map((key) => caches.delete(key))
            )
          )
          .catch(() => {});
      }
      return;
    }

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        registration.addEventListener('updatefound', () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              installing.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      })
      .catch(() => {
        // Silent fail if browser blocks service workers in restricted preview contexts
      });
  }, []);

  return null;
}

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 rounded-xl border border-amber-300 bg-amber-950 text-amber-50 px-4 py-3 shadow-lg flex items-center gap-3 text-xs"
    >
      <WifiOff className="w-4 h-4 text-amber-300 shrink-0" />
      <div className="min-w-0">
        <p className="font-semibold">Offline Mode</p>
        <p className="text-amber-200/90 text-[11px]">
          Viewing cached university content. Reconnect to sync portal requests.
        </p>
      </div>
    </div>
  );
}

interface PwaInstallButtonProps {
  variant?: 'drawer' | 'footer' | 'portal' | 'compact';
  allowGuideFallback?: boolean;
  className?: string;
}

export function PwaInstallButton({
  variant = 'footer',
  allowGuideFallback = false,
  className = '',
}: PwaInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  if (isInstalled) return null;

  const canRender = isInstallable || isIOS || allowGuideFallback;
  if (!canRender) return null;

  async function handleClick() {
    if (isInstallable) {
      const outcome = await promptInstall();
      if (outcome === 'accepted') {
        setJustInstalled(true);
      } else if (outcome === 'unavailable') {
        setShowGuideModal(true);
      }
      return;
    }
    setShowGuideModal(true);
  }

  const label = justInstalled
    ? 'PUST App Installed'
    : isInstallable
    ? 'Install PUST App'
    : isIOS
    ? 'Add to Home Screen'
    : 'Install Web App (PWA)';

  const buttonClasses =
    variant === 'drawer'
      ? 'w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg border border-pust-300 bg-pust-50 text-pust-900 hover:bg-pust-900 hover:text-white hover:border-pust-900 transition-colors cursor-pointer'
      : variant === 'portal'
      ? 'w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border border-pust-300 bg-pust-50 text-pust-900 hover:bg-pust-900 hover:text-white hover:border-pust-900 transition-colors cursor-pointer'
      : variant === 'compact'
      ? 'min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-white/25 bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer whitespace-nowrap'
      : 'min-h-[44px] inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border border-white/25 bg-white/10 text-white hover:bg-white hover:text-pust-950 transition-colors cursor-pointer';

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`${buttonClasses} ${className}`}
      >
        {justInstalled ? (
          <CheckCircle2 className="w-4 h-4 shrink-0" />
        ) : (
          <Download className="w-4 h-4 shrink-0" />
        )}
        <span>{label}</span>
      </button>

      {showGuideModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-slate-950/65 backdrop-blur-[2px] p-0 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-guide-title"
            onClick={() => setShowGuideModal(false)}
          >
          <div
            className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-white border border-stone-200 shadow-2xl overflow-hidden text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-stone-200 bg-[#FAF9F6] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-pust-700 text-white flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-pust-700">
                    Progressive Web App
                  </p>
                  <h3 id="pwa-guide-title" className="font-serif text-lg font-medium text-slate-900">
                    Install PUST on Your Device
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                aria-label="Close install instructions"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-stone-200/70 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-sm text-slate-700">
              {isIOS ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Install the PUST Campus App directly to your iPhone or iPad Home Screen for
                    instant launch and offline notice access:
                  </p>
                  <ol className="space-y-3">
                    <li className="flex items-start gap-3 p-3 rounded-xl border border-stone-200 bg-[#FAF9F6]">
                      <span className="w-7 h-7 rounded-lg bg-pust-700 text-white font-mono text-xs font-semibold flex items-center justify-center shrink-0">
                        1
                      </span>
                      <div className="text-xs space-y-1">
                        <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <Share className="w-3.5 h-3.5 text-pust-800" />
                          Tap the Share button in Safari
                        </p>
                        <p className="text-slate-600">
                          Located at the bottom toolbar on iPhone or top-right on iPad.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3 p-3 rounded-xl border border-stone-200 bg-[#FAF9F6]">
                      <span className="w-7 h-7 rounded-lg bg-pust-700 text-white font-mono text-xs font-semibold flex items-center justify-center shrink-0">
                        2
                      </span>
                      <div className="text-xs space-y-1">
                        <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <PlusSquare className="w-3.5 h-3.5 text-pust-800" />
                          Select &ldquo;Add to Home Screen&rdquo;
                        </p>
                        <p className="text-slate-600">
                          Scroll down the share sheet, tap Add to Home Screen, then confirm Add.
                        </p>
                      </div>
                    </li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Add PUST to your device for full-screen standalone access, quick shortcuts to
                    Notices &amp; Portal, and offline support:
                  </p>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-start gap-3 p-3 rounded-xl border border-stone-200 bg-[#FAF9F6]">
                      <MonitorSmartphone className="w-4 h-4 text-pust-800 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-slate-900">Android (Chrome / Edge)</p>
                        <p className="text-slate-600 mt-0.5">
                          Open your browser menu (⋮) and choose &ldquo;Install app&rdquo; or
                          &ldquo;Add to Home screen&rdquo;.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-xl border border-stone-200 bg-[#FAF9F6]">
                      <Share className="w-4 h-4 text-pust-800 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-slate-900">iOS / iPadOS Safari</p>
                        <p className="text-slate-600 mt-0.5">
                          Tap Share → &ldquo;Add to Home Screen&rdquo;.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-xl border border-stone-200 bg-[#FAF9F6]">
                      <Download className="w-4 h-4 text-pust-800 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-slate-900">Desktop (Chrome / Edge)</p>
                        <p className="text-slate-600 mt-0.5">
                          Click the Install App icon in the right side of the browser address bar.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-full min-h-[44px] py-2.5 text-xs font-semibold rounded-lg bg-pust-700 hover:bg-pust-800 text-white cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>,
          document.body
        )}
    </>
  );
}
