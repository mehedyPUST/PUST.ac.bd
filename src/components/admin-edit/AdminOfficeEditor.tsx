'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { ArrowDown, ArrowUp, Plus, Search, Trash2, UserCheck, Users } from 'lucide-react';
import { moveArrayItem, resolveUniversityContent } from '../../lib/cmsDefaults';
import type {
  AdministrationOfficeRecord,
  AdminOfficeCategory,
  AdminOfficePersonnel,
} from '../../types/pust';
import { INPUT_CLASS, LABEL_CLASS, SubEditorFooter, type SubEditorProps } from './shared';

const OFFICE_CATEGORIES: AdminOfficeCategory[] = [
  'Executive Leadership',
  'Administrative Sections & Offices',
  'Student Welfare & Campus Services',
  'Residential Halls & Accommodation',
  'Research, ICT & Quality Cells',
];

function createEmptyPersonnel(prefix: string): AdminOfficePersonnel {
  return {
    id: `${prefix}-${Date.now()}`,
    name: '',
    designation: 'Section Officer',
    qualification: '',
    phones: [],
    emails: [],
  };
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
  const resolved = resolveUniversityContent(profile);
  const [offices, setOffices] = useState<AdministrationOfficeRecord[]>(() =>
    structuredClone(resolved.adminOffices)
  );
  const [officeQuery, setOfficeQuery] = useState('');

  const initialIdx = useMemo(() => {
    if (target.kind === 'admin-office' && target.officeSlug) {
      const idx = resolved.adminOffices.findIndex((o) => o.slug === target.officeSlug);
      if (idx >= 0) return idx;
    }
    return 0;
  }, [target, resolved.adminOffices]);

  const [selectedIdx, setSelectedIdx] = useState(initialIdx);

  const filteredOffices = useMemo(() => {
    const q = officeQuery.trim().toLowerCase();
    return offices
      .map((office, index) => ({ office, index }))
      .filter(({ office }) => {
        if (!q) return true;
        return (
          office.name.toLowerCase().includes(q) ||
          office.code.toLowerCase().includes(q) ||
          office.slug.toLowerCase().includes(q) ||
          office.category.toLowerCase().includes(q)
        );
      });
  }, [offices, officeQuery]);

  const activeOffice = offices[selectedIdx] || offices[0];

  function updateActiveOffice(patch: Partial<AdministrationOfficeRecord>) {
    setOffices((prev) =>
      prev.map((o, idx) => (idx === selectedIdx ? { ...o, ...patch } : o))
    );
  }

  function updateHeadField(patch: Partial<AdminOfficePersonnel>) {
    if (!activeOffice) return;
    const baseHead: AdminOfficePersonnel = activeOffice.head || {
      id: `${activeOffice.slug}-head`,
      name: '',
      designation: 'Head of Office',
      phones: [],
      emails: [],
    };
    updateActiveOffice({ head: { ...baseHead, ...patch } });
  }

  function setPrimaryContact(
    person: AdminOfficePersonnel,
    kind: 'email' | 'phone',
    nextValue: string
  ): AdminOfficePersonnel {
    const clean = nextValue.trim();
    if (kind === 'email') {
      const rest = (person.emails || []).slice(1);
      return {
        ...person,
        emails: clean ? [{ value: clean, type: 'Office' }, ...rest] : rest,
      };
    }
    const rest = (person.phones || []).slice(1);
    return {
      ...person,
      phones: clean ? [{ value: clean, type: 'Office' }, ...rest] : rest,
    };
  }

  function handleAddOffice() {
    const num = offices.length + 1;
    const slug = `office-${Date.now().toString(36)}`;
    const nextOffice: AdministrationOfficeRecord = {
      slug,
      route: `/administration/${slug}`,
      code: `OFF${num}`,
      name: `New Administrative Office ${num}`,
      category: 'Administrative Sections & Offices',
      summary: 'Administrative unit responsibilities and official service desk at Rajapur Campus.',
      officeEmail: '',
      officePhone: '',
      location: 'Administrative Building, Rajapur Campus',
      officersLabel: 'Officers',
      officers: [],
    };
    const nextList = [...offices, nextOffice];
    setOffices(nextList);
    setOfficeQuery('');
    setSelectedIdx(nextList.length - 1);
  }

  function cleanPerson(p: AdminOfficePersonnel): AdminOfficePersonnel {
    const phones = (p.phones || [])
      .map((item) => ({ ...item, value: item.value.trim() }))
      .filter((item) => item.value.length >= 2);
    const emails = (p.emails || [])
      .map((item) => ({ ...item, value: item.value.trim() }))
      .filter((item) => item.value.length >= 3);
    return {
      id: p.id.trim() || `staff-${Date.now()}`,
      name: p.name.trim(),
      designation: p.designation.trim() || 'Officer',
      ...(p.qualification?.trim() ? { qualification: p.qualification.trim() } : {}),
      ...(p.researchArea?.trim() ? { researchArea: p.researchArea.trim() } : {}),
      ...(p.officeLocation?.trim() ? { officeLocation: p.officeLocation.trim() } : {}),
      ...(phones.length > 0 ? { phones } : {}),
      ...(emails.length > 0 ? { emails } : {}),
    };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const cleanedOffices: AdministrationOfficeRecord[] = offices.map((o) => ({
        slug: o.slug.trim(),
        route: o.route.trim() || `/administration/${o.slug.trim()}`,
        code: o.code.trim(),
        name: o.name.trim(),
        category: o.category,
        summary: o.summary.trim(),
        ...(o.officeEmail?.trim() ? { officeEmail: o.officeEmail.trim() } : { officeEmail: '' }),
        ...(o.officePhone?.trim() ? { officePhone: o.officePhone.trim() } : {}),
        ...(o.deskEmail?.trim() ? { deskEmail: o.deskEmail.trim() } : { deskEmail: '' }),
        ...(o.deskPhone?.trim() ? { deskPhone: o.deskPhone.trim() } : {}),
        ...(o.location?.trim() ? { location: o.location.trim() } : {}),
        ...(o.officersLabel?.trim() ? { officersLabel: o.officersLabel.trim() } : {}),
        ...(o.head && o.head.name.trim() ? { head: cleanPerson(o.head) } : {}),
        officers: o.officers.filter((off) => off.name.trim().length > 0).map(cleanPerson),
      }));

      await onSaveProfile({ adminOffices: cleanedOffices });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save administration offices.');
    } finally {
      setSaving(false);
    }
  }

  if (!activeOffice) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Selector & Quick Office Filter */}
      <div className="p-3.5 rounded-xl border border-slate-200 bg-[#FAF8F4] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={officeQuery}
              onChange={(e) => setOfficeQuery(e.target.value)}
              placeholder={`Search across ${offices.length} administration offices...`}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-pust-800"
            />
          </div>
          <button
            type="button"
            onClick={handleAddOffice}
            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Office
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
          {filteredOffices.map(({ office, index }) => (
            <button
              key={office.slug}
              type="button"
              onClick={() => setSelectedIdx(index)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border text-left ${
                index === selectedIdx
                  ? 'bg-pust-900 text-white border-pust-900'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-pust-700'
              }`}
            >
              <span className="font-mono font-semibold">{office.code}</span> · {office.name}
            </button>
          ))}
        </div>
      </div>

      {/* Office Desk Details */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-serif text-lg font-semibold text-slate-950">
            {activeOffice.name} ({activeOffice.code})
          </h3>
          {offices.length > 1 && (
            <button
              type="button"
              onClick={() => {
                setOffices((prev) => prev.filter((_, i) => i !== selectedIdx));
                setSelectedIdx(0);
              }}
              className="inline-flex items-center gap-1 text-xs font-medium text-red-700 hover:underline cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove Office
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={LABEL_CLASS}>Office Code</label>
            <input
              type="text"
              required
              value={activeOffice.code}
              onChange={(e) => updateActiveOffice({ code: e.target.value })}
              className={`${INPUT_CLASS} font-mono`}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={LABEL_CLASS}>Office Name</label>
            <input
              type="text"
              required
              value={activeOffice.name}
              onChange={(e) => updateActiveOffice({ name: e.target.value })}
              className={INPUT_CLASS}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={LABEL_CLASS}>Wing / Category</label>
            <select
              value={activeOffice.category}
              onChange={(e) =>
                updateActiveOffice({ category: e.target.value as AdminOfficeCategory })
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
            <label className={LABEL_CLASS}>Route Path</label>
            <input
              type="text"
              required
              value={activeOffice.route}
              onChange={(e) => updateActiveOffice({ route: e.target.value })}
              className={`${INPUT_CLASS} font-mono`}
            />
          </div>
        </div>

        <div>
          <label className={LABEL_CLASS}>Office Mandate / Summary</label>
          <textarea
            rows={2}
            required
            value={activeOffice.summary}
            onChange={(e) => updateActiveOffice({ summary: e.target.value })}
            className={INPUT_CLASS}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={LABEL_CLASS}>Official Email</label>
            <input
              type="email"
              value={activeOffice.officeEmail || ''}
              onChange={(e) => updateActiveOffice({ officeEmail: e.target.value })}
              placeholder="office@pust.ac.bd"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Office Telephone</label>
            <input
              type="text"
              value={activeOffice.officePhone || ''}
              onChange={(e) => updateActiveOffice({ officePhone: e.target.value })}
              placeholder="+880..."
              className={`${INPUT_CLASS} font-mono`}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Campus Location</label>
            <input
              type="text"
              value={activeOffice.location || ''}
              onChange={(e) => updateActiveOffice({ location: e.target.value })}
              placeholder="Administrative Building"
              className={INPUT_CLASS}
            />
          </div>
        </div>
      </div>

      {/* Head of Office */}
      <div className="p-4 rounded-xl border border-slate-200 bg-[#FAF9F6] space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-pust-800" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-800">
              Head of Office / Executive Lead
            </span>
          </div>
          {activeOffice.head ? (
            <button
              type="button"
              onClick={() => updateActiveOffice({ head: undefined })}
              className="text-xs text-red-700 hover:underline cursor-pointer"
            >
              Clear Head Entry
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                updateActiveOffice({
                  head: {
                    id: `${activeOffice.slug}-head`,
                    name: 'Head of Office',
                    designation: 'Director / Office Head',
                    phones: [],
                    emails: [],
                  },
                })
              }
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-white border border-slate-300 text-slate-800 cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Add Head
            </button>
          )}
        </div>

        {activeOffice.head && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Name</label>
              <input
                type="text"
                required
                value={activeOffice.head.name}
                onChange={(e) => updateHeadField({ name: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Designation</label>
              <input
                type="text"
                required
                value={activeOffice.head.designation}
                onChange={(e) => updateHeadField({ designation: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Head Email (Optional)</label>
              <input
                type="email"
                value={activeOffice.head.emails?.[0]?.value || ''}
                onChange={(e) =>
                  updateActiveOffice({
                    head: setPrimaryContact(activeOffice.head!, 'email', e.target.value),
                  })
                }
                placeholder="head@pust.ac.bd"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Head Phone (Optional)</label>
              <input
                type="text"
                value={activeOffice.head.phones?.[0]?.value || ''}
                onChange={(e) =>
                  updateActiveOffice({
                    head: setPrimaryContact(activeOffice.head!, 'phone', e.target.value),
                  })
                }
                placeholder="+880..."
                className={`${INPUT_CLASS} font-mono`}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL_CLASS}>Qualification (Optional)</label>
              <input
                type="text"
                value={activeOffice.head.qualification || ''}
                onChange={(e) => updateHeadField({ qualification: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
          </div>
        )}
      </div>

      {/* Officers Roster */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-lapis-700" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-800">
              Officers &amp; Staff Roster ({activeOffice.officers.length})
            </span>
          </div>
          <button
            type="button"
            onClick={() =>
              updateActiveOffice({
                officers: [
                  ...activeOffice.officers,
                  createEmptyPersonnel(activeOffice.slug),
                ],
              })
            }
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300 cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Add Officer
          </button>
        </div>

        {activeOffice.officers.length === 0 ? (
          <p className="text-xs text-slate-600 p-4 rounded-xl border border-slate-200 bg-[#F7F7F5]">
            No individual officers are currently listed under {activeOffice.name}. Click &ldquo;Add Officer&rdquo; to publish staff entries.
          </p>
        ) : (
          <div className="space-y-2.5">
            {activeOffice.officers.map((officer, offIdx) => (
              <div
                key={officer.id || offIdx}
                className="p-3.5 rounded-xl border border-slate-200 bg-[#F7F7F5] space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-slate-600">
                    Officer #{offIdx + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={offIdx === 0}
                      onClick={() =>
                        updateActiveOffice({
                          officers: moveArrayItem(activeOffice.officers, offIdx, -1),
                        })
                      }
                      aria-label="Move officer up"
                      className="p-1 rounded border border-slate-200 bg-white text-slate-600 disabled:opacity-40 cursor-pointer"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={offIdx === activeOffice.officers.length - 1}
                      onClick={() =>
                        updateActiveOffice({
                          officers: moveArrayItem(activeOffice.officers, offIdx, 1),
                        })
                      }
                      aria-label="Move officer down"
                      className="p-1 rounded border border-slate-200 bg-white text-slate-600 disabled:opacity-40 cursor-pointer"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateActiveOffice({
                          officers: activeOffice.officers.filter((_, i) => i !== offIdx),
                        })
                      }
                      className="text-xs text-red-700 hover:underline px-1.5 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    required
                    value={officer.name}
                    onChange={(e) =>
                      updateActiveOffice({
                        officers: activeOffice.officers.map((item, i) =>
                          i === offIdx ? { ...item, name: e.target.value } : item
                        ),
                      })
                    }
                    placeholder="Officer Full Name"
                    className={INPUT_CLASS}
                  />
                  <input
                    type="text"
                    required
                    value={officer.designation}
                    onChange={(e) =>
                      updateActiveOffice({
                        officers: activeOffice.officers.map((item, i) =>
                          i === offIdx ? { ...item, designation: e.target.value } : item
                        ),
                      })
                    }
                    placeholder="Designation"
                    className={INPUT_CLASS}
                  />
                  <input
                    type="email"
                    value={officer.emails?.[0]?.value || ''}
                    onChange={(e) =>
                      updateActiveOffice({
                        officers: activeOffice.officers.map((item, i) =>
                          i === offIdx ? setPrimaryContact(item, 'email', e.target.value) : item
                        ),
                      })
                    }
                    placeholder="Official Email (optional)"
                    className={INPUT_CLASS}
                  />
                  <input
                    type="text"
                    value={officer.phones?.[0]?.value || ''}
                    onChange={(e) =>
                      updateActiveOffice({
                        officers: activeOffice.officers.map((item, i) =>
                          i === offIdx ? setPrimaryContact(item, 'phone', e.target.value) : item
                        ),
                      })
                    }
                    placeholder="Phone Number (optional)"
                    className={`${INPUT_CLASS} font-mono`}
                  />
                </div>
                <input
                  type="text"
                  value={officer.qualification || ''}
                  onChange={(e) =>
                    updateActiveOffice({
                      officers: activeOffice.officers.map((item, i) =>
                        i === offIdx ? { ...item, qualification: e.target.value } : item
                      ),
                    })
                  }
                  placeholder="Academic Qualification (optional)"
                  className={INPUT_CLASS}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <SubEditorFooter saving={saving} onClose={onClose} />
    </form>
  );
}
