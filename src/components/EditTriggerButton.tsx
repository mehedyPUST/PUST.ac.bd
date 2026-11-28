'use client';

import type { MouseEvent } from 'react';
import { Pencil, Plus } from 'lucide-react';
import type { EditModalTarget } from '../types/pust';
import { usePust } from './PustContext';

interface EditTriggerButtonProps {
  target?: EditModalTarget;
  onClick?: () => void;
  label?: string;
  icon?: 'edit' | 'add';
  variant?: 'default' | 'compact' | 'overlay' | 'dark';
  className?: string;
}

export function EditTriggerButton({
  target,
  onClick,
  label = 'Edit',
  icon = 'edit',
  variant = 'default',
  className = '',
}: EditTriggerButtonProps) {
  const { editMode, openEditModal } = usePust();

  if (!editMode) return null;

  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (onClick) {
      onClick();
    } else if (target) {
      openEditModal(target);
    }
  }

  const Icon = icon === 'add' ? Plus : Pencil;

  const variantClasses =
    variant === 'overlay'
      ? 'px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-400 text-slate-950 border border-amber-300 shadow-md hover:bg-amber-300'
      : variant === 'dark'
      ? 'px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-400/95 text-slate-950 border border-amber-300 hover:bg-amber-300'
      : variant === 'compact'
      ? 'px-2 py-1 text-[11px] font-semibold rounded-md bg-amber-50 text-amber-950 border border-amber-400 hover:bg-amber-100'
      : 'px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 text-amber-950 border border-amber-400 hover:bg-amber-100 shadow-xs';

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pust-800 focus-visible:ring-offset-1 active:scale-[0.98] print:hidden ${variantClasses} ${className}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{label}</span>
    </button>
  );
}
