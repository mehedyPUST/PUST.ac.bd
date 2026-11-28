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
      <div
        ref={containerRef}
        className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5"
      >
        <button
          type="button"
          disabled={disabled || switching}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-md bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-left transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className="flex items-center gap-2 min-w-0">
            {switching ? (
              <RefreshCw className="w-3.5 h-3.5 text-pust-700 dark:text-pust-300 animate-spin shrink-0" />
            ) : (
              <ArrowLeftRight className="w-3.5 h-3.5 text-pust-700 dark:text-pust-300 shrink-0" />
            )}
            <span className="min-w-0">
              <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 text-left">
                Switch Role ({contexts.length})
              </span>
              <span className="block text-xs font-semibold text-slate-900 dark:text-white truncate text-left">
                {active.title}
              </span>
            </span>
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0 transition-transform ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>

        {open && (
          <div
            role="listbox"
            aria-label="Available portal roles"
            className="rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1 space-y-1 shadow-sm"
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
                      ? 'bg-[#EAF8F0] dark:bg-emerald-950/60 text-[#0F7D42] dark:text-emerald-300 font-semibold'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs truncate text-left">{ctx.title}</span>
                    <span
                      className={`block text-[10px] font-mono truncate text-left ${
                        isSelected
                          ? 'text-emerald-700/80 dark:text-emerald-400/80'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {ctx.isPrimary ? `Primary · ${ctx.scopeLabel}` : ctx.scopeLabel}
                    </span>
                  </span>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                  )}
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
        className="h-9 inline-flex items-center gap-1.5 px-3 rounded-md text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {switching ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-pust-700 dark:text-pust-300" />
        ) : (
          <ArrowLeftRight className="w-3.5 h-3.5 text-pust-700 dark:text-pust-300" />
        )}
        <span>Switch Role</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-500 dark:text-slate-400 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Switch active portal role"
          className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg z-40 p-1.5 space-y-1"
        >
          <p className="px-2.5 pt-1 pb-1 font-mono text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 text-left">
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
                className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-md text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#EAF8F0] dark:bg-emerald-950/60 text-[#0F7D42] dark:text-emerald-300 border border-[#BCE5CE] dark:border-emerald-800'
                    : 'text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold truncate text-left">
                    {ctx.title}
                  </span>
                  <span className="block text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate text-left">
                    {ctx.isPrimary ? `Primary · ${ctx.scopeLabel}` : ctx.scopeLabel}
                  </span>
                </span>
                {isSelected && (
                  <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
