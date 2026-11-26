'use client';

import { useState, type FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { clampMapPercent, resolveUniversityContent } from '../../lib/cmsDefaults';
import type {
  AdminShowcaseConfig,
  CampusBuildingItem,
  CampusMapMeta,
  CampusZoneType,
  GovernanceContent,
  GovernanceTabKind,
} from '../../types/pust';
import {
  CmsImageField,
  INPUT_CLASS,
  LABEL_CLASS,
  SubEditorFooter,
  type SubEditorProps,
} from './shared';

const CAMPUS_ZONES: CampusZoneType[] = [
  'Administration',
  'Academic',
  'Library & Culture',
  'Residential & Wellness',
];

const GOVERNANCE_TABS: Array<{ id: GovernanceTabKind; label: string }> = [
  { id: 'pust-act', label: 'PUST Act' },
  { id: 'regent-board', label: 'Regent Board' },
  { id: 'academic-council', label: 'Academic Council' },
  { id: 'finance-committee', label: 'Finance Committee' },
  { id: 'academic-ordinance', label: 'Academic Ordinance' },
];

export function CampusAndGovernanceEditors({
  target,
  profile,
  saving,
  setSaving,
  setError,
  onSaveProfile,
  onClose,
}: SubEditorProps) {
  const resolved = resolveUniversityContent(profile);

  // Campus Map & Buildings
  const [mapMeta, setMapMeta] = useState<CampusMapMeta>(() =>
    structuredClone(resolved.campusMapMeta)
  );
  const [buildings, setBuildings] = useState<CampusBuildingItem[]>(() =>
    structuredClone(resolved.campusBuildings)
  );
  const initialBuildingIdx =
    target.kind === 'campus-building' && target.buildingId
      ? Math.max(
          0,
          resolved.campusBuildings.findIndex((b) => b.id === target.buildingId)
        )
      : 0;
  const [selectedBuildingIdx, setSelectedBuildingIdx] = useState(initialBuildingIdx);

  // Governance Content
  const [govTab, setGovTab] = useState<GovernanceTabKind>(
    target.kind === 'governance' ? target.tab : 'pust-act'
  );
  const [gov, setGov] = useState<GovernanceContent>(() =>
    structuredClone(resolved.governanceContent)
  );

  // Admin Showcase & APA
  const [showcase, setShowcase] = useState<AdminShowcaseConfig>(() =>
    structuredClone(resolved.adminShowcase)
  );

  async function submitCampusMap(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSaveProfile({
        campusMapMeta: {
          eyebrow: mapMeta.eyebrow.trim(),
          title: mapMeta.title.trim(),
          subtitle: mapMeta.subtitle.trim(),
          coordinates: mapMeta.coordinates.trim(),
        },
        campusBuildings: buildings.map((b) => ({
          ...b,
          code: b.code.trim(),
          name: b.name.trim(),
          shortName: b.shortName.trim(),
          gridRef: b.gridRef.trim(),
          xPercent: clampMapPercent(Number(b.xPercent)),
          yPercent: clampMapPercent(Number(b.yPercent)),
          photo: b.photo.trim(),
          caption: b.caption.trim(),
          summary: b.summary.trim(),
          offices: b.offices.trim(),
          hours: b.hours.trim(),
          facilities: b.facilities.trim(),
          route: b.route.trim(),
          routeLabel: b.routeLabel.trim(),
        })),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save campus map directory.');
    } finally {
      setSaving(false);
    }
  }

  async function submitGovernance(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSaveProfile({
        governanceContent: gov,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save governance content.');
    } finally {
      setSaving(false);
    }
  }

  async function submitApa(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSaveProfile({
        adminShowcase: {
          buildingImage: showcase.buildingImage.trim(),
          buildingCaption: showcase.buildingCaption.trim(),
          charterTag: showcase.charterTag.trim(),
          accountabilityCycle: showcase.accountabilityCycle.trim(),
          apaFyLabel: showcase.apaFyLabel.trim(),
          apaBenchmarks: showcase.apaBenchmarks.map((b) => ({
            code: b.code.trim(),
            title: b.title.trim(),
            detail: b.detail.trim(),
          })),
        },
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save Administration & APA settings.');
    } finally {
      setSaving(false);
    }
  }

  if (target.kind === 'campus-building') {
    const active = buildings[selectedBuildingIdx] || buildings[0];

    return (
      <form onSubmit={submitCampusMap} className="space-y-5">
        <div className="p-4 rounded-xl border border-slate-200 bg-[#F7F7F5] space-y-3">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-pust-800">
            Campus Map Header &amp; Coordinates
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Map Eyebrow</label>
              <input
                type="text"
                required
                value={mapMeta.eyebrow}
                onChange={(e) => setMapMeta({ ...mapMeta, eyebrow: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>GPS Coordinates Label</label>
              <input
                type="text"
                required
                value={mapMeta.coordinates}
                onChange={(e) => setMapMeta({ ...mapMeta, coordinates: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
          </div>
          <div>
            <label className={LABEL_CLASS}>Section Heading</label>
            <input
              type="text"
              required
              value={mapMeta.title}
              onChange={(e) => setMapMeta({ ...mapMeta, title: e.target.value })}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Section Subtitle</label>
            <input
              type="text"
              required
              value={mapMeta.subtitle}
              onChange={(e) => setMapMeta({ ...mapMeta, subtitle: e.target.value })}
              className={INPUT_CLASS}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
            {buildings.map((b, idx) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBuildingIdx(idx)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono cursor-pointer border ${
                  selectedBuildingIdx === idx
                    ? 'bg-pust-900 text-white border-pust-900'
                    : 'bg-[#F7F7F5] text-slate-700 border-slate-200'
                }`}
              >
                {b.code} · {b.shortName}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              const nextIdx = buildings.length;
              setBuildings((prev) => [
                ...prev,
                {
                  id: `bldg-${Date.now()}`,
                  code: `BL-${nextIdx + 1}`,
                  name: 'New Campus Building',
                  shortName: 'New Building',
                  zone: 'Academic',
                  gridRef: 'Campus Quad · Grid B2',
                  xPercent: 50,
                  yPercent: 50,
                  photo: 'https://i.ibb.co.com/chBZ45sr/pust-campus-hero-1795431408503.jpg',
                  caption: 'PUST Campus Building.',
                  summary: 'Academic and institutional campus building.',
                  offices: 'University Offices',
                  hours: 'Sun – Thu · 09:00 – 17:00',
                  facilities: 'Lecture Rooms & Seminar Space',
                  route: '/academics/departments',
                  routeLabel: 'Explore Academics',
                },
              ]);
              setSelectedBuildingIdx(nextIdx);
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Building
          </button>
        </div>

        {active && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={LABEL_CLASS}>Building Code</label>
                <input
                  type="text"
                  required
                  value={active.code}
                  onChange={(e) =>
                    setBuildings((prev) =>
                      prev.map((b, i) =>
                        i === selectedBuildingIdx ? { ...b, code: e.target.value } : b
                      )
                    )
                  }
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Short Pin Label</label>
                <input
                  type="text"
                  required
                  value={active.shortName}
                  onChange={(e) =>
                    setBuildings((prev) =>
                      prev.map((b, i) =>
                        i === selectedBuildingIdx ? { ...b, shortName: e.target.value } : b
                      )
                    )
                  }
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Campus Zone</label>
                <select
                  value={active.zone}
                  onChange={(e) =>
                    setBuildings((prev) =>
                      prev.map((b, i) =>
                        i === selectedBuildingIdx
                          ? { ...b, zone: e.target.value as CampusZoneType }
                          : b
                      )
                    )
                  }
                  className={INPUT_CLASS}
                >
                  {CAMPUS_ZONES.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLASS}>Full Building Name</label>
                <input
                  type="text"
                  required
                  value={active.name}
                  onChange={(e) =>
                    setBuildings((prev) =>
                      prev.map((b, i) =>
                        i === selectedBuildingIdx ? { ...b, name: e.target.value } : b
                      )
                    )
                  }
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Map Grid Reference</label>
                <input
                  type="text"
                  required
                  value={active.gridRef}
                  onChange={(e) =>
                    setBuildings((prev) =>
                      prev.map((b, i) =>
                        i === selectedBuildingIdx ? { ...b, gridRef: e.target.value } : b
                      )
                    )
                  }
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className={LABEL_CLASS}>Map X% (5–95)</label>
                <input
                  type="number"
                  min={5}
                  max={95}
                  required
                  value={active.xPercent}
                  onChange={(e) =>
                    setBuildings((prev) =>
                      prev.map((b, i) =>
                        i === selectedBuildingIdx
                          ? { ...b, xPercent: Number(e.target.value) }
                          : b
                      )
                    )
                  }
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Map Y% (5–95)</label>
                <input
                  type="number"
                  min={5}
                  max={95}
                  required
                  value={active.yPercent}
                  onChange={(e) =>
                    setBuildings((prev) =>
                      prev.map((b, i) =>
                        i === selectedBuildingIdx
                          ? { ...b, yPercent: Number(e.target.value) }
                          : b
                      )
                    )
                  }
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Target Route</label>
                <input
                  type="text"
                  required
                  value={active.route}
                  onChange={(e) =>
                    setBuildings((prev) =>
                      prev.map((b, i) =>
                        i === selectedBuildingIdx ? { ...b, route: e.target.value } : b
                      )
                    )
                  }
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>CTA Label</label>
                <input
                  type="text"
                  required
                  value={active.routeLabel}
                  onChange={(e) =>
                    setBuildings((prev) =>
                      prev.map((b, i) =>
                        i === selectedBuildingIdx ? { ...b, routeLabel: e.target.value } : b
                      )
                    )
                  }
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <CmsImageField
              label="Building Photograph URL"
              value={active.photo}
              required
              onError={setError}
              onChange={(nextUrl) =>
                setBuildings((prev) =>
                  prev.map((b, i) => (i === selectedBuildingIdx ? { ...b, photo: nextUrl } : b))
                )
              }
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLASS}>Figure Caption</label>
                <input
                  type="text"
                  required
                  value={active.caption}
                  onChange={(e) =>
                    setBuildings((prev) =>
                      prev.map((b, i) =>
                        i === selectedBuildingIdx ? { ...b, caption: e.target.value } : b
                      )
                    )
                  }
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Visiting Hours</label>
                <input
                  type="text"
                  required
                  value={active.hours}
                  onChange={(e) =>
                    setBuildings((prev) =>
                      prev.map((b, i) =>
                        i === selectedBuildingIdx ? { ...b, hours: e.target.value } : b
                      )
                    )
                  }
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div>
              <label className={LABEL_CLASS}>Building Summary</label>
              <textarea
                rows={2}
                required
                value={active.summary}
                onChange={(e) =>
                  setBuildings((prev) =>
                    prev.map((b, i) =>
                      i === selectedBuildingIdx ? { ...b, summary: e.target.value } : b
                    )
                  )
                }
                className={INPUT_CLASS}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLASS}>Offices &amp; Academic Units</label>
                <input
                  type="text"
                  required
                  value={active.offices}
                  onChange={(e) =>
                    setBuildings((prev) =>
                      prev.map((b, i) =>
                        i === selectedBuildingIdx ? { ...b, offices: e.target.value } : b
                      )
                    )
                  }
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Key Facilities</label>
                <input
                  type="text"
                  required
                  value={active.facilities}
                  onChange={(e) =>
                    setBuildings((prev) =>
                      prev.map((b, i) =>
                        i === selectedBuildingIdx ? { ...b, facilities: e.target.value } : b
                      )
                    )
                  }
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            {buildings.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  setBuildings((prev) => prev.filter((_, i) => i !== selectedBuildingIdx));
                  setSelectedBuildingIdx(0);
                }}
                className="inline-flex items-center gap-1 text-xs font-medium text-red-700 hover:underline cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove This Building Pin
              </button>
            )}
          </div>
        )}

        <SubEditorFooter saving={saving} onClose={onClose} />
      </form>
    );
  }

  if (target.kind === 'governance') {
    return (
      <form onSubmit={submitGovernance} className="space-y-4">
        <div className="flex flex-wrap gap-1.5 pb-3 border-b border-slate-200">
          {GOVERNANCE_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setGovTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer border ${
                govTab === t.id
                  ? 'bg-pust-900 text-white border-pust-900'
                  : 'bg-[#F7F7F5] text-slate-700 border-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {govTab === 'pust-act' && (
          <div className="space-y-4">
            <div>
              <label className={LABEL_CLASS}>Official Bangladesh Laws URL</label>
              <input
                type="text"
                required
                value={gov.officialActUrl}
                onChange={(e) => setGov({ ...gov, officialActUrl: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Statutory Mandate Narrative</label>
              <textarea
                rows={4}
                required
                value={gov.actIntro}
                onChange={(e) => setGov({ ...gov, actIntro: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={LABEL_CLASS}>Act Clauses</label>
                <button
                  type="button"
                  onClick={() =>
                    setGov((prev) => ({
                      ...prev,
                      actClauses: [
                        ...prev.actClauses,
                        { clause: 'New Statutory Section', detail: 'Summary of clause.' },
                      ],
                    }))
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add Clause
                </button>
              </div>
              {gov.actClauses.map((c, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-[#F7F7F5] space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      required
                      value={c.clause}
                      onChange={(e) =>
                        setGov((prev) => ({
                          ...prev,
                          actClauses: prev.actClauses.map((row, i) =>
                            i === idx ? { ...row, clause: e.target.value } : row
                          ),
                        }))
                      }
                      className={INPUT_CLASS}
                    />
                    {gov.actClauses.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setGov((prev) => ({
                            ...prev,
                            actClauses: prev.actClauses.filter((_, i) => i !== idx),
                          }))
                        }
                        className="text-xs text-red-700 hover:underline cursor-pointer shrink-0"
                      >
                        Del
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={2}
                    required
                    value={c.detail}
                    onChange={(e) =>
                      setGov((prev) => ({
                        ...prev,
                        actClauses: prev.actClauses.map((row, i) =>
                          i === idx ? { ...row, detail: e.target.value } : row
                        ),
                      }))
                    }
                    className={INPUT_CLASS}
                  />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={LABEL_CLASS}>Citation Key-Value Rows</label>
                <button
                  type="button"
                  onClick={() =>
                    setGov((prev) => ({
                      ...prev,
                      actCitations: [...prev.actCitations, { label: 'Reference', value: 'Value' }],
                    }))
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add Row
                </button>
              </div>
              {gov.actCitations.map((row, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  <input
                    type="text"
                    required
                    value={row.label}
                    onChange={(e) =>
                      setGov((prev) => ({
                        ...prev,
                        actCitations: prev.actCitations.map((r, i) =>
                          i === idx ? { ...r, label: e.target.value } : r
                        ),
                      }))
                    }
                    className={`${INPUT_CLASS} sm:col-span-5`}
                  />
                  <input
                    type="text"
                    required
                    value={row.value}
                    onChange={(e) =>
                      setGov((prev) => ({
                        ...prev,
                        actCitations: prev.actCitations.map((r, i) =>
                          i === idx ? { ...r, value: e.target.value } : r
                        ),
                      }))
                    }
                    className={`${INPUT_CLASS} sm:col-span-6`}
                  />
                  {gov.actCitations.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setGov((prev) => ({
                          ...prev,
                          actCitations: prev.actCitations.filter((_, i) => i !== idx),
                        }))
                      }
                      className="text-xs text-red-700 hover:underline sm:col-span-1 cursor-pointer"
                    >
                      Del
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {govTab === 'regent-board' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={LABEL_CLASS}>Regent Board Composition</label>
                <button
                  type="button"
                  onClick={() =>
                    setGov((prev) => ({
                      ...prev,
                      regentBoardMembers: [
                        ...prev.regentBoardMembers,
                        { seat: 'Member', designation: 'Member Designation', term: '2 Years' },
                      ],
                    }))
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add Member
                </button>
              </div>
              {gov.regentBoardMembers.map((m, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  <input
                    type="text"
                    required
                    value={m.seat}
                    onChange={(e) =>
                      setGov((prev) => ({
                        ...prev,
                        regentBoardMembers: prev.regentBoardMembers.map((r, i) =>
                          i === idx ? { ...r, seat: e.target.value } : r
                        ),
                      }))
                    }
                    placeholder="Seat"
                    className={`${INPUT_CLASS} sm:col-span-4`}
                  />
                  <input
                    type="text"
                    required
                    value={m.designation}
                    onChange={(e) =>
                      setGov((prev) => ({
                        ...prev,
                        regentBoardMembers: prev.regentBoardMembers.map((r, i) =>
                          i === idx ? { ...r, designation: e.target.value } : r
                        ),
                      }))
                    }
                    placeholder="Designation"
                    className={`${INPUT_CLASS} sm:col-span-5`}
                  />
                  <input
                    type="text"
                    required
                    value={m.term}
                    onChange={(e) =>
                      setGov((prev) => ({
                        ...prev,
                        regentBoardMembers: prev.regentBoardMembers.map((r, i) =>
                          i === idx ? { ...r, term: e.target.value } : r
                        ),
                      }))
                    }
                    placeholder="Term"
                    className={`${INPUT_CLASS} sm:col-span-2`}
                  />
                  {gov.regentBoardMembers.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setGov((prev) => ({
                          ...prev,
                          regentBoardMembers: prev.regentBoardMembers.filter((_, i) => i !== idx),
                        }))
                      }
                      className="text-xs text-red-700 hover:underline sm:col-span-1 cursor-pointer"
                    >
                      Del
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div>
              <label className={LABEL_CLASS}>Core Executive Functions (one per line)</label>
              <textarea
                rows={4}
                required
                value={gov.regentFunctions.join('\n')}
                onChange={(e) =>
                  setGov({ ...gov, regentFunctions: e.target.value.split('\n') })
                }
                className={INPUT_CLASS}
              />
            </div>
          </div>
        )}

        {govTab === 'academic-council' && (
          <div className="space-y-4">
            <div>
              <label className={LABEL_CLASS}>Council Mandate Narrative</label>
              <textarea
                rows={3}
                required
                value={gov.academicCouncilIntro}
                onChange={(e) => setGov({ ...gov, academicCouncilIntro: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={LABEL_CLASS}>Jurisdiction Cards</label>
                <button
                  type="button"
                  onClick={() =>
                    setGov((prev) => ({
                      ...prev,
                      academicCouncilCards: [
                        ...prev.academicCouncilCards,
                        { title: 'Council Authority', detail: 'Jurisdiction summary.' },
                      ],
                    }))
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add Card
                </button>
              </div>
              {gov.academicCouncilCards.map((c, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-[#F7F7F5] space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      required
                      value={c.title}
                      onChange={(e) =>
                        setGov((prev) => ({
                          ...prev,
                          academicCouncilCards: prev.academicCouncilCards.map((r, i) =>
                            i === idx ? { ...r, title: e.target.value } : r
                          ),
                        }))
                      }
                      className={INPUT_CLASS}
                    />
                    {gov.academicCouncilCards.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setGov((prev) => ({
                            ...prev,
                            academicCouncilCards: prev.academicCouncilCards.filter((_, i) => i !== idx),
                          }))
                        }
                        className="text-xs text-red-700 hover:underline cursor-pointer"
                      >
                        Del
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={2}
                    required
                    value={c.detail}
                    onChange={(e) =>
                      setGov((prev) => ({
                        ...prev,
                        academicCouncilCards: prev.academicCouncilCards.map((r, i) =>
                          i === idx ? { ...r, detail: e.target.value } : r
                        ),
                      }))
                    }
                    className={INPUT_CLASS}
                  />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <label className={LABEL_CLASS}>Council Structure Rows</label>
              {gov.academicCouncilStructure.map((row, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={row.label}
                    onChange={(e) =>
                      setGov((prev) => ({
                        ...prev,
                        academicCouncilStructure: prev.academicCouncilStructure.map((r, i) =>
                          i === idx ? { ...r, label: e.target.value } : r
                        ),
                      }))
                    }
                    className={INPUT_CLASS}
                  />
                  <input
                    type="text"
                    required
                    value={row.value}
                    onChange={(e) =>
                      setGov((prev) => ({
                        ...prev,
                        academicCouncilStructure: prev.academicCouncilStructure.map((r, i) =>
                          i === idx ? { ...r, value: e.target.value } : r
                        ),
                      }))
                    }
                    className={INPUT_CLASS}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {govTab === 'finance-committee' && (
          <div className="space-y-4">
            <div>
              <label className={LABEL_CLASS}>Financial Stewardship Intro</label>
              <textarea
                rows={3}
                required
                value={gov.financeCommitteeIntro}
                onChange={(e) => setGov({ ...gov, financeCommitteeIntro: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={LABEL_CLASS}>Oversight Scopes</label>
                <button
                  type="button"
                  onClick={() =>
                    setGov((prev) => ({
                      ...prev,
                      financeCommitteeScopes: [
                        ...prev.financeCommitteeScopes,
                        { scope: 'New Fiscal Scope', desc: 'Oversight detail.' },
                      ],
                    }))
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add Scope
                </button>
              </div>
              {gov.financeCommitteeScopes.map((s, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-[#F7F7F5] space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      required
                      value={s.scope}
                      onChange={(e) =>
                        setGov((prev) => ({
                          ...prev,
                          financeCommitteeScopes: prev.financeCommitteeScopes.map((r, i) =>
                            i === idx ? { ...r, scope: e.target.value } : r
                          ),
                        }))
                      }
                      className={INPUT_CLASS}
                    />
                    {gov.financeCommitteeScopes.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setGov((prev) => ({
                            ...prev,
                            financeCommitteeScopes: prev.financeCommitteeScopes.filter(
                              (_, i) => i !== idx
                            ),
                          }))
                        }
                        className="text-xs text-red-700 hover:underline cursor-pointer"
                      >
                        Del
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={2}
                    required
                    value={s.desc}
                    onChange={(e) =>
                      setGov((prev) => ({
                        ...prev,
                        financeCommitteeScopes: prev.financeCommitteeScopes.map((r, i) =>
                          i === idx ? { ...r, desc: e.target.value } : r
                        ),
                      }))
                    }
                    className={INPUT_CLASS}
                  />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <label className={LABEL_CLASS}>Committee Leadership Summary</label>
              {gov.financeCommitteeLeadership.map((row, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={row.label}
                    onChange={(e) =>
                      setGov((prev) => ({
                        ...prev,
                        financeCommitteeLeadership: prev.financeCommitteeLeadership.map((r, i) =>
                          i === idx ? { ...r, label: e.target.value } : r
                        ),
                      }))
                    }
                    className={INPUT_CLASS}
                  />
                  <input
                    type="text"
                    required
                    value={row.value}
                    onChange={(e) =>
                      setGov((prev) => ({
                        ...prev,
                        financeCommitteeLeadership: prev.financeCommitteeLeadership.map((r, i) =>
                          i === idx ? { ...r, value: e.target.value } : r
                        ),
                      }))
                    }
                    className={INPUT_CLASS}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {govTab === 'academic-ordinance' && (
          <div className="space-y-4">
            <div>
              <label className={LABEL_CLASS}>Grading &amp; Credit Overview</label>
              <textarea
                rows={3}
                required
                value={gov.ordinanceIntro}
                onChange={(e) => setGov({ ...gov, ordinanceIntro: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
            <div className="space-y-2">
              <label className={LABEL_CLASS}>Academic Rules</label>
              {gov.ordinanceRules.map((row, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={row.label}
                    onChange={(e) =>
                      setGov((prev) => ({
                        ...prev,
                        ordinanceRules: prev.ordinanceRules.map((r, i) =>
                          i === idx ? { ...r, label: e.target.value } : r
                        ),
                      }))
                    }
                    className={INPUT_CLASS}
                  />
                  <input
                    type="text"
                    required
                    value={row.value}
                    onChange={(e) =>
                      setGov((prev) => ({
                        ...prev,
                        ordinanceRules: prev.ordinanceRules.map((r, i) =>
                          i === idx ? { ...r, value: e.target.value } : r
                        ),
                      }))
                    }
                    className={INPUT_CLASS}
                  />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <label className={LABEL_CLASS}>Official 4.00 Grading Scale</label>
              {gov.gradingScale.map((row, idx) => (
                <div key={idx} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    required
                    value={row.range}
                    onChange={(e) =>
                      setGov((prev) => ({
                        ...prev,
                        gradingScale: prev.gradingScale.map((r, i) =>
                          i === idx ? { ...r, range: e.target.value } : r
                        ),
                      }))
                    }
                    className={INPUT_CLASS}
                  />
                  <input
                    type="text"
                    required
                    value={row.letter}
                    onChange={(e) =>
                      setGov((prev) => ({
                        ...prev,
                        gradingScale: prev.gradingScale.map((r, i) =>
                          i === idx ? { ...r, letter: e.target.value } : r
                        ),
                      }))
                    }
                    className={INPUT_CLASS}
                  />
                  <input
                    type="text"
                    required
                    value={row.gp}
                    onChange={(e) =>
                      setGov((prev) => ({
                        ...prev,
                        gradingScale: prev.gradingScale.map((r, i) =>
                          i === idx ? { ...r, gp: e.target.value } : r
                        ),
                      }))
                    }
                    className={INPUT_CLASS}
                  />
                  <input
                    type="text"
                    required
                    value={row.remarks}
                    onChange={(e) =>
                      setGov((prev) => ({
                        ...prev,
                        gradingScale: prev.gradingScale.map((r, i) =>
                          i === idx ? { ...r, remarks: e.target.value } : r
                        ),
                      }))
                    }
                    className={INPUT_CLASS}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <SubEditorFooter saving={saving} onClose={onClose} />
      </form>
    );
  }

  // Admin Showcase & APA Benchmarks
  return (
    <form onSubmit={submitApa} className="space-y-4">
      <CmsImageField
        label="Administrative Building Hero Photo URL"
        value={showcase.buildingImage}
        required
        onError={setError}
        onChange={(nextUrl) => setShowcase({ ...showcase, buildingImage: nextUrl })}
      />
      <div>
        <label className={LABEL_CLASS}>Building Figure Caption</label>
        <input
          type="text"
          required
          value={showcase.buildingCaption}
          onChange={(e) => setShowcase({ ...showcase, buildingCaption: e.target.value })}
          className={INPUT_CLASS}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className={LABEL_CLASS}>Statutory Charter Ribbon Value</label>
          <input
            type="text"
            required
            value={showcase.charterTag}
            onChange={(e) => setShowcase({ ...showcase, charterTag: e.target.value })}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>Accountability Cycle Ribbon Value</label>
          <input
            type="text"
            required
            value={showcase.accountabilityCycle}
            onChange={(e) => setShowcase({ ...showcase, accountabilityCycle: e.target.value })}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>APA Fiscal Year Label</label>
          <input
            type="text"
            required
            value={showcase.apaFyLabel}
            onChange={(e) => setShowcase({ ...showcase, apaFyLabel: e.target.value })}
            className={INPUT_CLASS}
          />
        </div>
      </div>

      <div className="space-y-3 pt-2 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <label className={LABEL_CLASS}>Annual Performance Agreement (APA) Benchmarks</label>
          <button
            type="button"
            onClick={() =>
              setShowcase((prev) => ({
                ...prev,
                apaBenchmarks: [
                  ...prev.apaBenchmarks,
                  {
                    code: `0${prev.apaBenchmarks.length + 1}. Benchmark`,
                    title: 'New APA Milestone',
                    detail: 'Accountability metric description.',
                  },
                ],
              }))
            }
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300 cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Add Benchmark
          </button>
        </div>
        {showcase.apaBenchmarks.map((item, idx) => (
          <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-[#F7F7F5] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                <input
                  type="text"
                  required
                  value={item.code}
                  onChange={(e) =>
                    setShowcase((prev) => ({
                      ...prev,
                      apaBenchmarks: prev.apaBenchmarks.map((r, i) =>
                        i === idx ? { ...r, code: e.target.value } : r
                      ),
                    }))
                  }
                  className={INPUT_CLASS}
                />
                <input
                  type="text"
                  required
                  value={item.title}
                  onChange={(e) =>
                    setShowcase((prev) => ({
                      ...prev,
                      apaBenchmarks: prev.apaBenchmarks.map((r, i) =>
                        i === idx ? { ...r, title: e.target.value } : r
                      ),
                    }))
                  }
                  className={INPUT_CLASS}
                />
              </div>
              {showcase.apaBenchmarks.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setShowcase((prev) => ({
                      ...prev,
                      apaBenchmarks: prev.apaBenchmarks.filter((_, i) => i !== idx),
                    }))
                  }
                  className="text-xs text-red-700 hover:underline cursor-pointer shrink-0"
                >
                  Del
                </button>
              )}
            </div>
            <textarea
              rows={2}
              required
              value={item.detail}
              onChange={(e) =>
                setShowcase((prev) => ({
                  ...prev,
                  apaBenchmarks: prev.apaBenchmarks.map((r, i) =>
                    i === idx ? { ...r, detail: e.target.value } : r
                  ),
                }))
              }
              className={INPUT_CLASS}
            />
          </div>
        ))}
      </div>

      <SubEditorFooter saving={saving} onClose={onClose} />
    </form>
  );
}
