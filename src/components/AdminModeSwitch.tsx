'use client';

import { ShieldCheck } from 'lucide-react';

interface AdminModeSwitchProps {
  checked: boolean;
  onToggle: () => void;
  variant?: 'desktop' | 'mobile';
  className?: string;
}

export function AdminModeSwitch({
  checked,
  onToggle,
  variant = 'desktop',
  className = '',
}: AdminModeSwitchProps) {
  if (variant === 'mobile') {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={checked ? 'Disable Admin Mode' : 'Enable Admin Mode'}
        title={checked ? 'Admin Mode Active (Alt+E)' : 'Enable Admin Mode (Alt+E)'}
        onClick={onToggle}
        className={`lg:hidden min-h-[32px] inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-1 focus-visible:ring-offset-pust-900 active:scale-[0.98] ${
          checked
            ? 'bg-amber-400 text-slate-950 border border-amber-300 shadow-xs'
            : 'bg-pust-800 text-amber-100 border border-amber-300/40 hover:bg-pust-700'
        } ${className}`}
      >
        <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span className="hidden sm:inline">Admin Mode</span>
        <span
          aria-hidden="true"
          className={`relative inline-flex h-3.5 w-6 shrink-0 items-center rounded-full p-0.5 transition-colors duration-150 ${
            checked ? 'bg-slate-950' : 'bg-pust-950/75 border border-amber-200/40'
          }`}
        >
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full transition-transform duration-150 ease-out ${
              checked ? 'translate-x-2.5 bg-amber-300' : 'translate-x-0 bg-amber-100'
            }`}
          />
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={checked ? 'Disable Admin Mode' : 'Enable Admin Mode'}
      title={checked ? 'Admin Mode Active (Alt+E)' : 'Enable Admin Mode (Alt+E)'}
      onClick={onToggle}
      className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 active:scale-[0.98] ${
        checked
          ? 'bg-amber-400 text-slate-950 border-amber-500 hover:bg-amber-300 shadow-xs'
          : 'bg-amber-50 text-amber-950 border-amber-300 hover:bg-amber-100'
      } ${className}`}
    >
      <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>Admin Mode</span>
      <span
        aria-hidden="true"
        className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full p-0.5 transition-colors duration-150 ${
          checked ? 'bg-slate-950' : 'bg-amber-200/90 border border-amber-400/70'
        }`}
      >
        <span
          className={`inline-block h-3 w-3 rounded-full transition-transform duration-150 ease-out ${
            checked ? 'translate-x-3 bg-amber-300' : 'translate-x-0 bg-white shadow-2xs'
          }`}
        />
      </span>
    </button>
  );
}
