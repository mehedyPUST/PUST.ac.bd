'use client';

import { useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { pustApi } from '../../lib/api';
import type { AuthUser } from '../../types/pust';

interface AccountSecurityPasswordCardProps {
  user: AuthUser;
  onUserChange?: (user: AuthUser) => void;
}

export function AccountSecurityPasswordCard({
  user,
  onUserChange,
}: AccountSecurityPasswordCardProps) {
  const mustChange = Boolean(user.mustChangePassword);
  const [expanded, setExpanded] = useState(mustChange);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isEnvAdmin = user.id === 'env-admin-office';
  const showForm = mustChange || expanded;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword) {
      setError(
        mustChange
          ? 'Enter the temporary password or login token provided for your first login.'
          : 'Enter your current password.'
      );
      return;
    }
    if (newPassword.length < 8) {
      setError('New personal password must be at least 8 characters long.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('New password must be different from your temporary password or token.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await pustApi.changePassword({
        currentPassword,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrent(false);
      setShowNew(false);
      setExpanded(false);
      setSuccess(
        mustChange
          ? 'Personal password saved. Full campus portal access is now unlocked.'
          : 'Account password updated successfully.'
      );
      onUserChange?.(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update password.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className={`rounded-lg border overflow-hidden ${
        mustChange
          ? 'border-amber-300 dark:border-amber-800 bg-[#FBF6EE] dark:bg-amber-950/30'
          : 'border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900'
      }`}
    >
      <div
        className={`px-5 sm:px-6 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 ${
          mustChange
            ? 'border-amber-200 dark:border-amber-900/60 bg-amber-100/70 dark:bg-amber-950/50'
            : 'border-stone-200 dark:border-slate-800 bg-[#FAF9F6] dark:bg-slate-800/80'
        }`}
      >
        <div className="flex items-start gap-2.5 min-w-0">
          {mustChange ? (
            <Lock className="w-4 h-4 text-amber-800 dark:text-amber-300 shrink-0 mt-0.5" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-pust-800 dark:text-gold-300 shrink-0 mt-0.5" />
          )}
          <div className="min-w-0">
            <h3
              className={`font-serif text-base sm:text-lg font-medium leading-tight ${
                mustChange ? 'text-amber-950 dark:text-amber-100' : 'text-slate-950 dark:text-slate-100'
              }`}
            >
              {mustChange
                ? 'First-Login Password Update Required'
                : 'Account Security & Password'}
            </h3>
            <p
              className={`text-xs mt-0.5 ${
                mustChange ? 'text-amber-900 dark:text-amber-200' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {mustChange
                ? 'Replace your chairman-issued temporary password or login token with a personal password to unlock all portal modules.'
                : `Manage sign-in credentials for ${user.email}.`}
            </p>
          </div>
        </div>

        {!mustChange && !isEnvAdmin && (
          <button
            type="button"
            onClick={() => {
              setExpanded((prev) => !prev);
              setError(null);
              setSuccess(null);
            }}
            className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 hover:border-pust-700 dark:hover:border-gold-400 hover:text-pust-800 dark:hover:text-gold-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-pust-800 dark:text-gold-300" />
            <span>{expanded ? 'Hide Password Form' : 'Change Password'}</span>
          </button>
        )}
      </div>

      {success && (
        <div
          role="status"
          className="mx-5 sm:mx-6 mt-4 px-4 py-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-xs font-medium text-emerald-900 dark:text-emerald-200 flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mx-5 sm:mx-6 mt-4 px-4 py-3 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-xs font-medium text-red-900 dark:text-red-200 flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4 text-red-700 dark:text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isEnvAdmin ? (
        <div className="p-5 sm:p-6 text-xs text-slate-600 dark:text-slate-300">
          This session uses the server environment administrator passcode and cannot be rotated here.
        </div>
      ) : showForm ? (
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs bg-white dark:bg-slate-900">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                {mustChange ? 'Temporary Password / Token' : 'Current Password'}
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={mustChange ? 'Enter temporary password or token' : 'Current password'}
                  className="w-full pr-9 pl-3 py-2 font-mono rounded-lg border border-stone-300 dark:border-slate-700 bg-[#FAF9F6] dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-pust-700 dark:focus:border-gold-400"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  aria-label="Toggle current password visibility"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
                >
                  {showCurrent ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                New Personal Password
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full pr-9 pl-3 py-2 font-mono rounded-lg border border-stone-300 dark:border-slate-700 bg-[#FAF9F6] dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-pust-700 dark:focus:border-gold-400"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  aria-label="Toggle new password visibility"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
                >
                  {showNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Confirm New Password
              </label>
              <input
                type={showNew ? 'text' : 'password'}
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-3 py-2 font-mono rounded-lg border border-stone-300 dark:border-slate-700 bg-[#FAF9F6] dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-pust-700 dark:focus:border-gold-400"
              />
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 dark:border-slate-800">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Passwords are stored salted and hashed server-side; your temporary token stops working once updated.
            </p>
            <div className="flex items-center gap-2">
              {!mustChange && (
                <button
                  type="button"
                  onClick={() => {
                    setExpanded(false);
                    setError(null);
                  }}
                  className="px-3.5 py-2 rounded-lg border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium hover:text-slate-950 dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-pust-700 text-white font-semibold hover:bg-pust-800 disabled:opacity-60 cursor-pointer whitespace-nowrap"
              >
                {submitting
                  ? 'Updating Password...'
                  : mustChange
                  ? 'Save Password & Unlock Portal'
                  : 'Update Password'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="px-5 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
          <span>Your personal sign-in password is active.</span>
          <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
            Use &ldquo;Change Password&rdquo; anytime to rotate credentials
          </span>
        </div>
      )}
    </div>
  );
}
