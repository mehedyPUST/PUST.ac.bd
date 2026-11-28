'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeftRight, Check, ChevronDown, RefreshCw } from 'lucide-react';
import type { RoleContextOption } from '../../lib/roleContext';

interface RoleSwitcherControlProps {
  contexts: RoleContextOption[];
  activeKey: string;
  switching?: boolean;
  disabled?: boolean;
  variant: 'sidebar' | 'header';
  onSwitch: (roleKey: string) => void;
}

export function RoleSwitcherControl({
  contexts,
  activeKey,
  switching = false,
  disabled = false,
  variant,
  onSwitch,
}: RoleSwitcherControlProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  if (contexts.length <= 1) return null;

  const active = contexts.find((c) => c.key === activeKey) || contexts[0];

  function handleSelect(key: string) {
    setOpen(false);
    if (key === active.key || switching || disabled) return;
    onSwitch(key);
  }

  if (variant === 'sidebar') {
    return (
      <div ref={containerRef} className="pt-2 border-t border-white/15 space-y-1.5">
        <button
          type="button"
          disabled={disabled || switching}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-left transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className="flex items-center gap-2 min-w-0">
            {switching ? (
              <RefreshCw className="w-3.5 h-3.5 text-pust-100 animate-spin shrink-0" />
            ) : (
              <ArrowLeftRight className="w-3.5 h-3.5 text-pust-100 shrink-0" />
            )}
            <span className="min-w-0">
              <span className="block text-[10px] font-mono uppercase tracking-wider text-pust-200/90 text-left">
                Switch Role ({contexts.length})
              </span>
              <span className="block text-xs font-semibold text-white truncate text-left">
                {active.title}
              </span>
            </span>
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-pust-100 shrink-0 transition-transform ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>

        {open && (
          <div
            role="listbox"
            aria-label="Available portal roles"
            className="rounded-xl bg-pust-950/90 border border-white/15 p-1 space-y-1"
          >
            {contexts.map((ctx) => {
              const isSelected = ctx.key === active.key;
              return (
                <button
                  key={ctx.key}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={switching || disabled}
                  onClick={() => handleSelect(ctx.key)}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-white text-pust-950 font-semibold'
                      : 'text-pust-50 hover:bg-white/10'
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs truncate text-left">{ctx.title}</span>
                    <span
                      className={`block text-[10px] font-mono truncate text-left ${
                        isSelected ? 'text-pust-800' : 'text-pust-200/80'
                      }`}
                    >
                      {ctx.isPrimary ? `Primary · ${ctx.scopeLabel}` : ctx.scopeLabel}
                    </span>
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-pust-900 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled || switching}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="h-9 inline-flex items-center gap-1.5 px-3 rounded-lg text-xs font-semibold border border-pust-300 bg-pust-50/70 text-pust-900 hover:bg-pust-100/80 hover:border-pust-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {switching ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-pust-800" />
        ) : (
          <ArrowLeftRight className="w-3.5 h-3.5 text-pust-800" />
        )}
        <span>Switch Role</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-pust-800 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Switch active portal role"
          className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-stone-200 bg-white shadow-xl z-40 p-1.5 space-y-1"
        >
          <p className="px-2.5 pt-1 pb-1 font-mono text-[10px] uppercase tracking-wider text-slate-500 text-left">
            Assigned Roles ({contexts.length})
          </p>
          {contexts.map((ctx) => {
            const isSelected = ctx.key === active.key;
            return (
              <button
                key={ctx.key}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={switching || disabled}
                onClick={() => handleSelect(ctx.key)}
                className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-pust-50 text-pust-950 border border-pust-200'
                    : 'text-slate-800 hover:bg-[#FAF9F6]'
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold truncate text-left">
                    {ctx.title}
                  </span>
                  <span className="block text-[11px] font-mono text-slate-500 truncate text-left">
                    {ctx.isPrimary ? `Primary · ${ctx.scopeLabel}` : ctx.scopeLabel}
                  </span>
                </span>
                {isSelected && <Check className="w-4 h-4 text-pust-800 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
