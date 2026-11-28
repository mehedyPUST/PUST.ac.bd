'use client';

import Link from 'next/link';
import { Bell, Building2, Home, RefreshCw, ShieldCheck, WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <main className="flex-1 bg-[#F8F7F4] px-4 py-12 sm:py-20 flex items-center justify-center">
      <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-pust-50 border border-pust-200 flex items-center justify-center shrink-0 text-pust-700">
            <WifiOff className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-pust-700">
              Offline Connectivity Notice
            </p>
            <h1 className="font-serif text-2xl sm:text-3xl font-medium text-slate-900">
              You are currently offline
            </h1>
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">
          Pabna University of Science and Technology cannot reach the university servers right now.
          Previously visited university pages remain available from your device cache, or you can
          retry once your mobile or Wi-Fi connection resumes.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 text-sm font-semibold rounded-lg bg-pust-700 hover:bg-pust-800 text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Try Reconnecting
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 text-sm font-medium rounded-lg border border-stone-300 bg-[#FAF9F6] hover:border-pust-700 hover:text-pust-800 text-slate-800 transition-colors"
          >
            <Home className="w-4 h-4" />
            Return to Homepage
          </Link>
        </div>

        <div className="pt-4 border-t border-stone-200 space-y-2.5">
          <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
            Quick Links (Cached Pages)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Link
              href="/notices"
              className="flex items-center gap-2 min-h-[44px] px-3 py-2 rounded-lg border border-stone-200 bg-[#FAF9F6] text-xs font-medium text-slate-800 hover:border-pust-700 hover:text-pust-800"
            >
              <Bell className="w-4 h-4 text-pust-700 shrink-0" />
              Notice Board
            </Link>
            <Link
              href="/academics/departments"
              className="flex items-center gap-2 min-h-[44px] px-3 py-2 rounded-lg border border-stone-200 bg-[#FAF9F6] text-xs font-medium text-slate-800 hover:border-pust-700 hover:text-pust-800"
            >
              <Building2 className="w-4 h-4 text-pust-700 shrink-0" />
              Departments
            </Link>
            <Link
              href="/verify"
              className="flex items-center gap-2 min-h-[44px] px-3 py-2 rounded-lg border border-stone-200 bg-[#FAF9F6] text-xs font-medium text-slate-800 hover:border-pust-700 hover:text-pust-800"
            >
              <ShieldCheck className="w-4 h-4 text-pust-700 shrink-0" />
              Verify Registry
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
