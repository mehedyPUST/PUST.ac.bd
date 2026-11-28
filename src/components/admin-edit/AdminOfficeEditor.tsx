'use client';

import { useState, type FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { DEFAULT_ADMIN_OFFICES } from '../../lib/adminOffices';
import type {
  AdminOfficeCategory,
  AdminOfficePersonnel,
  AdministrationOfficeRecord,
} from '../../types/pust';
import { INPUT_CLASS, LABEL_CLASS, SubEditorFooter, type SubEditorProps } from './shared';

const OFFICE_CATEGORIES: AdminOfficeCategory[] = [
  'Executive Leadership',
  'Administrative Sections & Offices',
  'Student Welfare & Campus Services',
  'Residential Halls & Accommodation',
  'Research, ICT & Quality Cells',
];

function cloneOffices(
  source: AdministrationOfficeRecord[] | undefined
): AdministrationOfficeRecord[] {
  const base =
    Array.isArray(source) && source.length > 0 ? source : DEFAULT_ADMIN_OFFICES;
  return base.map((o) => ({
    ...o,
    head: o.head
      ? {
          ...o.head,
          phones: [...(o.head.phones || [])],
          emails: [...(o.head.emails || [])],
        }
      : undefined,
    officers: (o.officers || []).map((off) => ({
      ...off,
      phones: [...(off.phones || [])],
      emails: [...(off.emails || [])],
    })),
  }));
}

export function AdminOfficeEditor({
  target,
  profile,
  saving,
  setSaving,
  setError,
  onSaveProfile,
  onClose,
}: SubEditorProps) {
  const [offices, setOffices] = useState<AdministrationOfficeRecord[]>(() =>
    cloneOffices(profile?.adminOffices)
  );

  const initialSlug =
    target.kind === 'admin-office' && target.officeSlug
      ? target.officeSlug
      : offices[0]?.slug || '';

  const [selectedSlug, setSelectedSlug] = useState(initialSlug);

  const currentIndex = Math.max(
    0,
    offices.findIndex((o) => o.slug === selectedSlug)
  );
  const currentOffice = offices[currentIndex] || offices[0];

  function updateCurrentOffice(patch: Partial<AdministrationOfficeRecord>) {
    if (!currentOffice) return;
    setOffices((prev) =>
      prev.map((o, idx) => (idx === currentIndex ? { ...o, ...patch } : o))
    );
  }

  function updateHead(patch: Partial<AdminOfficePersonnel>) {
    if (!currentOffice) return;
    const baseHead: AdminOfficePersonnel = currentOffice.head || {
      id: `${currentOffice.code.toLowerCase()}-head`,
      name: '',
      designation: 'Office Head',
      phones: [],
      emails: [],
    };
    updateCurrentOffice({ head: { ...baseHead, ...patch } });
  }

  function updateOfficer(idx: number, patch: Partial<AdminOfficePersonnel>) {
    if (!currentOffice) return;
    const next = currentOffice.officers.map((off, i) =>
      i === idx ? { ...off, ...patch } : off
    );
    updateCurrentOffice({ officers: next });
  }

  function handleAddOfficer() {
    if (!currentOffice) return;
    const newOfficer: AdminOfficePersonnel = {
      id: `${currentOffice.code.toLowerCase()}-off-${Date.now()}`,
      name: 'New Officer',
      designation: 'Section Officer',
      phones: [],
      emails: [],
    };
    updateCurrentOffice({ officers: [...currentOffice.officers, newOfficer] });
  }

  function handleRemoveOfficer(idx: number) {
    if (!currentOffice) return;
    updateCurrentOffice({
      officers: currentOffice.officers.filter((_, i) => i !== idx),
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSaveProfile({ adminOffices: offices });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to save administration office profile.'
      );
    } finally {
      setSaving(false);
    }
  }

  if (!currentOffice) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className={LABEL_CLASS}>Select Administration Office (33 Units)</label>
        <select
          value={currentOffice.slug}
          onChange={(e) => setSelectedSlug(e.target.value)}
          className={INPUT_CLASS}
        >
          {offices.map((office) => (
            <option key={office.slug} value={office.slug}>
              {office.code} — {office.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLASS}>Office Name</label>
          <input
            type="text"
            required
            value={currentOffice.name}
            onChange={(e) => updateCurrentOffice({ name: e.target.value })}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>Category</label>
          <select
            value={currentOffice.category}
            onChange={(e) =>
              updateCurrentOffice({ category: e.target.value as AdminOfficeCategory })
            }
            className={INPUT_CLASS}
          >
            {OFFICE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL_CLASS}>Official Email</label>
          <input
            type="text"
            value={currentOffice.officeEmail || ''}
            onChange={(e) => updateCurrentOffice({ officeEmail: e.target.value })}
            className={`${INPUT_CLASS} font-mono`}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>Official Telephone</label>
          <input
            type="text"
            value={currentOffice.officePhone || ''}
            onChange={(e) => updateCurrentOffice({ officePhone: e.target.value })}
            className={`${INPUT_CLASS} font-mono`}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>Desk Email (Optional)</label>
          <input
            type="text"
            value={currentOffice.deskEmail || ''}
            onChange={(e) => updateCurrentOffice({ deskEmail: e.target.value })}
            className={`${INPUT_CLASS} font-mono`}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>Location</label>
          <input
            type="text"
            value={currentOffice.location || ''}
            onChange={(e) => updateCurrentOffice({ location: e.target.value })}
            className={INPUT_CLASS}
          />
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS}>Mandate &amp; Summary</label>
        <textarea
          rows={3}
          required
          value={currentOffice.summary}
          onChange={(e) => updateCurrentOffice({ summary: e.target.value })}
          className={INPUT_CLASS}
        />
      </div>

      {/* Office Head */}
      <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] p-4 space-y-3">
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-pust-800">
          Office Head / Director / Provost
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={LABEL_CLASS}>Full Name</label>
            <input
              type="text"
              value={currentOffice.head?.name || ''}
              onChange={(e) => updateHead({ name: e.target.value })}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Designation</label>
            <input
              type="text"
              value={currentOffice.head?.designation || ''}
              onChange={(e) => updateHead({ designation: e.target.value })}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Primary Phone</label>
            <input
              type="text"
              value={currentOffice.head?.phones?.[0]?.value || ''}
              onChange={(e) =>
                updateHead({
                  phones: e.target.value ? [{ value: e.target.value, type: 'Office' }] : [],
                })
              }
              className={`${INPUT_CLASS} font-mono`}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Primary Email</label>
            <input
              type="text"
              value={currentOffice.head?.emails?.[0]?.value || ''}
              onChange={(e) =>
                updateHead({
                  emails: e.target.value ? [{ value: e.target.value, type: 'Office' }] : [],
                })
              }
              className={`${INPUT_CLASS} font-mono`}
            />
          </div>
        </div>
      </div>

      {/* Officers List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-700">
            Office Personnel ({currentOffice.officers.length})
          </p>
          <button
            type="button"
            onClick={handleAddOfficer}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Officer
          </button>
        </div>

        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {currentOffice.officers.map((off, idx) => (
            <div
              key={off.id || idx}
              className={`p-3.5 rounded-xl border border-stone-200 space-y-2.5 ${
                idx % 2 === 0 ? 'bg-white' : 'bg-[#FAF9F6]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-semibold text-slate-500">
                  Officer #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveOfficer(idx)}
                  className="inline-flex items-center gap-1 text-xs text-red-700 hover:underline cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  required
                  value={off.name}
                  onChange={(e) => updateOfficer(idx, { name: e.target.value })}
                  placeholder="Officer Name"
                  className={INPUT_CLASS}
                />
                <input
                  type="text"
                  required
                  value={off.designation}
                  onChange={(e) => updateOfficer(idx, { designation: e.target.value })}
                  placeholder="Designation"
                  className={INPUT_CLASS}
                />
                <input
                  type="text"
                  value={off.phones?.[0]?.value || ''}
                  onChange={(e) =>
                    updateOfficer(idx, {
                      phones: e.target.value
                        ? [{ value: e.target.value, type: 'Office' }]
                        : [],
                    })
                  }
                  placeholder="Phone"
                  className={`${INPUT_CLASS} font-mono`}
                />
                <input
                  type="text"
                  value={off.emails?.[0]?.value || ''}
                  onChange={(e) =>
                    updateOfficer(idx, {
                      emails: e.target.value
                        ? [{ value: e.target.value, type: 'Office' }]
                        : [],
                    })
                  }
                  placeholder="Email"
                  className={`${INPUT_CLASS} font-mono`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <SubEditorFooter saving={saving} onClose={onClose} />
    </form>
  );
}
