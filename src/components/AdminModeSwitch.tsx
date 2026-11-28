'use client';

import { Pencil, Lock } from 'lucide-react';

interface AdminModeSwitchProps {
  checked: boolean;
  onToggle: () => void;
  variant?: 'desktop' | 'mobile';
}

export function AdminModeSwitch({
  checked,
  onToggle,
  variant = 'desktop',
}: AdminModeSwitchProps) {
  if (variant === 'mobile') {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onToggle}
        title={checked ? 'Edit Mode Active (Alt+E to exit)' : 'Enable Edit Mode (Alt+E)'}
        className={`lg:hidden inline-flex items-center gap-1 min-h-[30px] px-2 py-1 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
          checked
            ? 'bg-gold-400 text-slate-950'
            : 'bg-white/15 text-white hover:bg-white/25'
        }`}
      >
        {checked ? <Pencil className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
        <span>{checked ? 'Edit On' : 'Edit'}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onToggle}
      title="Toggle inline CMS edit mode (Alt+E)"
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
        checked
          ? 'border-gold-500 bg-gold-50 text-pust-950'
          : 'border-stone-300 bg-white text-slate-700 hover:border-pust-800 hover:text-pust-900'
      }`}
    >
      {checked ? <Pencil className="w-3.5 h-3.5 text-pust-800" /> : <Lock className="w-3.5 h-3.5" />}
      <span>{checked ? 'Edit Mode: On' : 'Edit Mode'}</span>
    </button>
  );
}
