'use client';

import { useState, type ChangeEvent } from 'react';
import { Save, Upload } from 'lucide-react';
import { pustApi } from '../../lib/api';
import type { EditModalTarget, UniversityProfile } from '../../types/pust';

export const INPUT_CLASS =
  'w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900 focus:outline-none focus:border-pust-800 focus:bg-white';
export const LABEL_CLASS = 'block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5';

export interface SubEditorProps {
  target: EditModalTarget;
  profile: UniversityProfile | null;
  saving: boolean;
  setSaving: (v: boolean) => void;
  setError: (msg: string | null) => void;
  onSaveProfile: (patch: Partial<UniversityProfile>) => Promise<void>;
  onClose: () => void;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Unable to read selected file.'));
    reader.readAsDataURL(file);
  });
}

export function CmsImageField({
  label,
  value,
  onChange,
  onError,
  placeholder = '/src/assets/images/... or https://...',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (nextUrl: string) => void;
  onError?: (msg: string | null) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onError?.(null);
    setUploading(true);
    try {
      const dataBase64 = await readFileAsDataUrl(file);
      const res = await pustApi.uploadMediaToImageKit({
        purpose: 'cms',
        fileName: file.name,
        mimeType: file.type || 'image/jpeg',
        dataBase64,
      });
      onChange(res.url);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Unable to upload image.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
          {label}
        </label>
        <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer">
          <Upload className="w-3.5 h-3.5" />
          {uploading ? 'Uploading...' : 'Upload Image'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={handleFileChange}
          />
        </label>
      </div>
      <input
        type="text"
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={INPUT_CLASS}
      />
    </div>
  );
}

export function SubEditorFooter({
  saving,
  onClose,
}: {
  saving: boolean;
  onClose: () => void;
}) {
  return (
    <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
      <button
        type="button"
        onClick={onClose}
        disabled={saving}
        className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold bg-pust-900 text-white hover:bg-pust-950 disabled:opacity-60 cursor-pointer"
      >
        <Save className="w-4 h-4" />
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}
