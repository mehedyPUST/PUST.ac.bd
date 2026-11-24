'use client';

import { useState, type FormEvent } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { moveArrayItem, resolveUniversityContent } from '../../lib/cmsDefaults';
import type {
  FooterConfig,
  InstitutionalLinkItem,
  SeminarItem,
  VerifyPageConfig,
} from '../../types/pust';
import { INPUT_CLASS, LABEL_CLASS, SubEditorFooter, type SubEditorProps } from './shared';

export function HomeAndFooterEditors({
  target,
  profile,
  saving,
  setSaving,
  setError,
  onSaveProfile,
  onClose,
}: SubEditorProps) {
  const resolved = resolveUniversityContent(profile);

  // Institutional Links
  const [linksEyebrow, setLinksEyebrow] = useState(resolved.institutionalLinksEyebrow);
  const [linksHeading, setLinksHeading] = useState(resolved.institutionalLinksHeading);
  const [linksList, setLinksList] = useState<InstitutionalLinkItem[]>(() =>
    structuredClone(resolved.institutionalLinks)
  );

  // Seminars
  const [seminarsList, setSeminarsList] = useState<SeminarItem[]>(() =>
    structuredClone(resolved.upcomingSeminars)
  );

  // Verify Page
  const [verifyCfg, setVerifyCfg] = useState<VerifyPageConfig>(() =>
    structuredClone(resolved.verifyPageConfig)
  );

  // Footer Config
  const [footerCfg, setFooterCfg] = useState<FooterConfig>(() =>
    structuredClone(resolved.footerConfig)
  );

  async function submitLinks(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSaveProfile({
        institutionalLinksEyebrow: linksEyebrow.trim(),
        institutionalLinksHeading: linksHeading.trim(),
        institutionalLinks: linksList.map((item) => ({
          id: item.id || `link-${Date.now()}`,
          route: item.route.trim(),
          title: item.title.trim(),
          desc: item.desc.trim(),
        })),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save institutional links.');
    } finally {
      setSaving(false);
    }
  }

  async function submitSeminars(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSaveProfile({
        upcomingSeminars: seminarsList.map((item) => ({
          id: item.id || `sem-${Date.now()}`,
          date: item.date.trim(),
          organizer: item.organizer.trim(),
          title: item.title.trim(),
        })),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save upcoming seminars.');
    } finally {
      setSaving(false);
    }
  }

  async function submitVerify(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSaveProfile({
        verifyPageConfig: {
          kicker: verifyCfg.kicker.trim(),
          title: verifyCfg.title.trim(),
          subtitle: verifyCfg.subtitle.trim(),
          sampleSerials: verifyCfg.sampleSerials.map((s) => ({
            label: s.label.trim(),
            code: s.code.trim(),
          })),
          employerCardTitle: verifyCfg.employerCardTitle.trim(),
          employerCardBody: verifyCfg.employerCardBody.trim(),
          portalCardTitle: verifyCfg.portalCardTitle.trim(),
          portalCardBody: verifyCfg.portalCardBody.trim(),
        },
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save Verify page settings.');
    } finally {
      setSaving(false);
    }
  }

  async function submitFooter(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSaveProfile({
        footerConfig: {
          tagline: footerCfg.tagline.trim(),
          description: footerCfg.description.trim(),
          socialLinks: footerCfg.socialLinks.map((s) => ({
            label: s.label.trim(),
            url: s.url.trim(),
          })),
          quickLinks: footerCfg.quickLinks.map((l) => ({
            label: l.label.trim(),
            route: l.route.trim(),
          })),
          governanceLinks: footerCfg.governanceLinks.map((l) => ({
            label: l.label.trim(),
            route: l.route.trim(),
          })),
          serviceLinks: footerCfg.serviceLinks.map((l) => ({
            label: l.label.trim(),
            route: l.route.trim(),
          })),
          addressLines: footerCfg.addressLines.map((a) => a.trim()).filter(Boolean),
          contacts: footerCfg.contacts.map((c) => ({
            label: c.label.trim(),
            phone: c.phone.trim(),
            email: c.email.trim(),
          })),
          copyrightText: footerCfg.copyrightText.trim(),
        },
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save footer configuration.');
    } finally {
      setSaving(false);
    }
  }

  if (target.kind === 'institutional-links') {
    return (
      <form onSubmit={submitLinks} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={LABEL_CLASS}>Section Eyebrow</label>
            <input
              type="text"
              required
              value={linksEyebrow}
              onChange={(e) => setLinksEyebrow(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Section Heading</label>
            <input
              type="text"
              required
              value={linksHeading}
              onChange={(e) => setLinksHeading(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <p className="text-xs text-slate-600">
            Quick-access directory rows shown beside the Homepage Notice Board.
          </p>
          <button
            type="button"
            onClick={() =>
              setLinksList((prev) => [
                ...prev,
                {
                  id: `link-${Date.now()}`,
                  route: '/portal',
                  title: 'New Institutional Section',
                  desc: 'Direct pathway to university services and official records.',
                },
              ])
            }
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Link
          </button>
        </div>

        <div className="space-y-3">
          {linksList.map((item, idx) => (
            <div
              key={item.id || idx}
              className="p-4 rounded-xl border border-slate-200 bg-[#F7F7F5] space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-semibold text-pust-800">
                  Link #{idx + 1}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => setLinksList((prev) => moveArrayItem(prev, idx, -1))}
                    className="p-1 rounded border border-slate-300 bg-white disabled:opacity-40 cursor-pointer"
                    title="Move up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === linksList.length - 1}
                    onClick={() => setLinksList((prev) => moveArrayItem(prev, idx, 1))}
                    className="p-1 rounded border border-slate-300 bg-white disabled:opacity-40 cursor-pointer"
                    title="Move down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  {linksList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setLinksList((prev) => prev.filter((_, i) => i !== idx))}
                      className="inline-flex items-center gap-1 text-xs text-red-700 hover:underline cursor-pointer ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={LABEL_CLASS}>Title</label>
                  <input
                    type="text"
                    required
                    value={item.title}
                    onChange={(e) =>
                      setLinksList((prev) =>
                        prev.map((row, i) => (i === idx ? { ...row, title: e.target.value } : row))
                      )
                    }
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Target Route or URL</label>
                  <input
                    type="text"
                    required
                    value={item.route}
                    onChange={(e) =>
                      setLinksList((prev) =>
                        prev.map((row, i) => (i === idx ? { ...row, route: e.target.value } : row))
                      )
                    }
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
              <div>
                <label className={LABEL_CLASS}>Short Description</label>
                <input
                  type="text"
                  required
                  value={item.desc}
                  onChange={(e) =>
                    setLinksList((prev) =>
                      prev.map((row, i) => (i === idx ? { ...row, desc: e.target.value } : row))
                    )
                  }
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          ))}
        </div>

        <SubEditorFooter saving={saving} onClose={onClose} />
      </form>
    );
  }

  if (target.kind === 'seminars') {
    return (
      <form onSubmit={submitSeminars} className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-600">
            Displayed on the Homepage News &amp; Events strip and under Academics → Seminars &amp; Workshops.
          </p>
          <button
            type="button"
            onClick={() =>
              setSeminarsList((prev) => [
                ...prev,
                {
                  id: `sem-${Date.now()}`,
                  date: new Date().toISOString().slice(0, 10),
                  organizer: 'Academic Council & IQAC',
                  title: 'Upcoming University Seminar / Workshop',
                },
              ])
            }
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Seminar
          </button>
        </div>

        <div className="space-y-3">
          {seminarsList.map((sem, idx) => (
            <div
              key={sem.id || idx}
              className="p-4 rounded-xl border border-slate-200 bg-[#F7F7F5] space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-semibold text-pust-800">
                  Seminar #{idx + 1}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => setSeminarsList((prev) => moveArrayItem(prev, idx, -1))}
                    className="p-1 rounded border border-slate-300 bg-white disabled:opacity-40 cursor-pointer"
                    title="Move up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === seminarsList.length - 1}
                    onClick={() => setSeminarsList((prev) => moveArrayItem(prev, idx, 1))}
                    className="p-1 rounded border border-slate-300 bg-white disabled:opacity-40 cursor-pointer"
                    title="Move down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  {seminarsList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setSeminarsList((prev) => prev.filter((_, i) => i !== idx))}
                      className="inline-flex items-center gap-1 text-xs text-red-700 hover:underline cursor-pointer ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={LABEL_CLASS}>Event Date</label>
                  <input
                    type="text"
                    required
                    value={sem.date}
                    onChange={(e) =>
                      setSeminarsList((prev) =>
                        prev.map((row, i) => (i === idx ? { ...row, date: e.target.value } : row))
                      )
                    }
                    placeholder="YYYY-MM-DD"
                    className={INPUT_CLASS}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={LABEL_CLASS}>Organizer / Host Unit</label>
                  <input
                    type="text"
                    required
                    value={sem.organizer}
                    onChange={(e) =>
                      setSeminarsList((prev) =>
                        prev.map((row, i) =>
                          i === idx ? { ...row, organizer: e.target.value } : row
                        )
                      )
                    }
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
              <div>
                <label className={LABEL_CLASS}>Seminar / Milestone Title</label>
                <input
                  type="text"
                  required
                  value={sem.title}
                  onChange={(e) =>
                    setSeminarsList((prev) =>
                      prev.map((row, i) => (i === idx ? { ...row, title: e.target.value } : row))
                    )
                  }
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          ))}
        </div>

        <SubEditorFooter saving={saving} onClose={onClose} />
      </form>
    );
  }

  if (target.kind === 'verify-page') {
    return (
      <form onSubmit={submitVerify} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={LABEL_CLASS}>Header Kicker</label>
            <input
              type="text"
              required
              value={verifyCfg.kicker}
              onChange={(e) => setVerifyCfg({ ...verifyCfg, kicker: e.target.value })}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Page Title</label>
            <input
              type="text"
              required
              value={verifyCfg.title}
              onChange={(e) => setVerifyCfg({ ...verifyCfg, title: e.target.value })}
              className={INPUT_CLASS}
            />
          </div>
        </div>
        <div>
          <label className={LABEL_CLASS}>Subtitle</label>
          <textarea
            rows={2}
            required
            value={verifyCfg.subtitle}
            onChange={(e) => setVerifyCfg({ ...verifyCfg, subtitle: e.target.value })}
            className={INPUT_CLASS}
          />
        </div>

        <div className="pt-2 border-t border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className={LABEL_CLASS}>Quick Sample Registry Serials</label>
            <button
              type="button"
              onClick={() =>
                setVerifyCfg((prev) => ({
                  ...prev,
                  sampleSerials: [
                    ...prev.sampleSerials,
                    { label: 'Issued Record', code: 'PUST-DOC-2026-001' },
                  ],
                }))
              }
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300 cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Add Sample
            </button>
          </div>
          {verifyCfg.sampleSerials.map((s, idx) => (
            <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
              <input
                type="text"
                required
                value={s.label}
                onChange={(e) =>
                  setVerifyCfg((prev) => ({
                    ...prev,
                    sampleSerials: prev.sampleSerials.map((row, i) =>
                      i === idx ? { ...row, label: e.target.value } : row
                    ),
                  }))
                }
                placeholder="Document label"
                className={`${INPUT_CLASS} sm:col-span-5`}
              />
              <input
                type="text"
                required
                value={s.code}
                onChange={(e) =>
                  setVerifyCfg((prev) => ({
                    ...prev,
                    sampleSerials: prev.sampleSerials.map((row, i) =>
                      i === idx ? { ...row, code: e.target.value } : row
                    ),
                  }))
                }
                placeholder="Serial code"
                className={`${INPUT_CLASS} sm:col-span-6 font-mono`}
              />
              {verifyCfg.sampleSerials.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setVerifyCfg((prev) => ({
                      ...prev,
                      sampleSerials: prev.sampleSerials.filter((_, i) => i !== idx),
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
          <div className="space-y-2">
            <label className={LABEL_CLASS}>Employer Info Card Title</label>
            <input
              type="text"
              required
              value={verifyCfg.employerCardTitle}
              onChange={(e) =>
                setVerifyCfg({ ...verifyCfg, employerCardTitle: e.target.value })
              }
              className={INPUT_CLASS}
            />
            <label className={LABEL_CLASS}>Employer Info Card Body</label>
            <textarea
              rows={3}
              required
              value={verifyCfg.employerCardBody}
              onChange={(e) =>
                setVerifyCfg({ ...verifyCfg, employerCardBody: e.target.value })
              }
              className={INPUT_CLASS}
            />
          </div>
          <div className="space-y-2">
            <label className={LABEL_CLASS}>Portal Bridge Card Title</label>
            <input
              type="text"
              required
              value={verifyCfg.portalCardTitle}
              onChange={(e) =>
                setVerifyCfg({ ...verifyCfg, portalCardTitle: e.target.value })
              }
              className={INPUT_CLASS}
            />
            <label className={LABEL_CLASS}>Portal Bridge Card Body</label>
            <textarea
              rows={3}
              required
              value={verifyCfg.portalCardBody}
              onChange={(e) =>
                setVerifyCfg({ ...verifyCfg, portalCardBody: e.target.value })
              }
              className={INPUT_CLASS}
            />
          </div>
        </div>

        <SubEditorFooter saving={saving} onClose={onClose} />
      </form>
    );
  }

  // Footer Config Editor
  const linkColumns: Array<{
    key: 'quickLinks' | 'governanceLinks' | 'serviceLinks';
    title: string;
  }> = [
    { key: 'quickLinks', title: 'Quick Links Column' },
    { key: 'governanceLinks', title: 'Governance & Admin Column' },
    { key: 'serviceLinks', title: 'Digital Services Column' },
  ];

  return (
    <form onSubmit={submitFooter} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={LABEL_CLASS}>Footer Tagline</label>
          <input
            type="text"
            required
            value={footerCfg.tagline}
            onChange={(e) => setFooterCfg({ ...footerCfg, tagline: e.target.value })}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>Copyright Notice</label>
          <input
            type="text"
            required
            value={footerCfg.copyrightText}
            onChange={(e) => setFooterCfg({ ...footerCfg, copyrightText: e.target.value })}
            className={INPUT_CLASS}
          />
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS}>
          University Summary (supports {'{facultiesCount}'} &amp; {'{departmentsCount}'})
        </label>
        <textarea
          rows={2}
          required
          value={footerCfg.description}
          onChange={(e) => setFooterCfg({ ...footerCfg, description: e.target.value })}
          className={INPUT_CLASS}
        />
      </div>

      <div>
        <label className={LABEL_CLASS}>Campus Address Lines (one per line)</label>
        <textarea
          rows={2}
          required
          value={footerCfg.addressLines.join('\n')}
          onChange={(e) =>
            setFooterCfg({
              ...footerCfg,
              addressLines: e.target.value.split('\n'),
            })
          }
          className={INPUT_CLASS}
        />
      </div>

      {/* Contacts */}
      <div className="space-y-2 pt-2 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <label className={LABEL_CLASS}>Official Footer Contacts</label>
          <button
            type="button"
            onClick={() =>
              setFooterCfg((prev) => ({
                ...prev,
                contacts: [
                  ...prev.contacts,
                  { label: 'Office', phone: '+8802588800000', email: 'info@pust.ac.bd' },
                ],
              }))
            }
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300 cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Add Contact
          </button>
        </div>
        {footerCfg.contacts.map((c, idx) => (
          <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
            <input
              type="text"
              required
              value={c.label}
              onChange={(e) =>
                setFooterCfg((prev) => ({
                  ...prev,
                  contacts: prev.contacts.map((row, i) =>
                    i === idx ? { ...row, label: e.target.value } : row
                  ),
                }))
              }
              placeholder="Desk Label"
              className={`${INPUT_CLASS} sm:col-span-3`}
            />
            <input
              type="text"
              required
              value={c.phone}
              onChange={(e) =>
                setFooterCfg((prev) => ({
                  ...prev,
                  contacts: prev.contacts.map((row, i) =>
                    i === idx ? { ...row, phone: e.target.value } : row
                  ),
                }))
              }
              placeholder="Phone"
              className={`${INPUT_CLASS} sm:col-span-4 font-mono`}
            />
            <input
              type="text"
              required
              value={c.email}
              onChange={(e) =>
                setFooterCfg((prev) => ({
                  ...prev,
                  contacts: prev.contacts.map((row, i) =>
                    i === idx ? { ...row, email: e.target.value } : row
                  ),
                }))
              }
              placeholder="Email"
              className={`${INPUT_CLASS} sm:col-span-4 font-mono`}
            />
            {footerCfg.contacts.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setFooterCfg((prev) => ({
                    ...prev,
                    contacts: prev.contacts.filter((_, i) => i !== idx),
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

      {/* Social Links */}
      <div className="space-y-2 pt-2 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <label className={LABEL_CLASS}>External &amp; Social Links</label>
          <button
            type="button"
            onClick={() =>
              setFooterCfg((prev) => ({
                ...prev,
                socialLinks: [...prev.socialLinks, { label: 'Portal', url: 'https://pust.ac.bd/' }],
              }))
            }
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300 cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Add Social Link
          </button>
        </div>
        {footerCfg.socialLinks.map((s, idx) => (
          <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
            <input
              type="text"
              required
              value={s.label}
              onChange={(e) =>
                setFooterCfg((prev) => ({
                  ...prev,
                  socialLinks: prev.socialLinks.map((row, i) =>
                    i === idx ? { ...row, label: e.target.value } : row
                  ),
                }))
              }
              className={`${INPUT_CLASS} sm:col-span-4`}
            />
            <input
              type="text"
              required
              value={s.url}
              onChange={(e) =>
                setFooterCfg((prev) => ({
                  ...prev,
                  socialLinks: prev.socialLinks.map((row, i) =>
                    i === idx ? { ...row, url: e.target.value } : row
                  ),
                }))
              }
              className={`${INPUT_CLASS} sm:col-span-7`}
            />
            {footerCfg.socialLinks.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setFooterCfg((prev) => ({
                    ...prev,
                    socialLinks: prev.socialLinks.filter((_, i) => i !== idx),
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

      {/* 3 Footer Link Columns */}
      {linkColumns.map((col) => (
        <div key={col.key} className="space-y-2 pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <label className={LABEL_CLASS}>{col.title}</label>
            <button
              type="button"
              onClick={() =>
                setFooterCfg((prev) => ({
                  ...prev,
                  [col.key]: [...prev[col.key], { label: 'New Link', route: '/' }],
                }))
              }
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300 cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Add Link
            </button>
          </div>
          {footerCfg[col.key].map((lnk, idx) => (
            <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
              <input
                type="text"
                required
                value={lnk.label}
                onChange={(e) =>
                  setFooterCfg((prev) => ({
                    ...prev,
                    [col.key]: prev[col.key].map((row, i) =>
                      i === idx ? { ...row, label: e.target.value } : row
                    ),
                  }))
                }
                className={`${INPUT_CLASS} sm:col-span-5`}
              />
              <input
                type="text"
                required
                value={lnk.route}
                onChange={(e) =>
                  setFooterCfg((prev) => ({
                    ...prev,
                    [col.key]: prev[col.key].map((row, i) =>
                      i === idx ? { ...row, route: e.target.value } : row
                    ),
                  }))
                }
                className={`${INPUT_CLASS} sm:col-span-6 font-mono`}
              />
              {footerCfg[col.key].length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setFooterCfg((prev) => ({
                      ...prev,
                      [col.key]: prev[col.key].filter((_, i) => i !== idx),
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
      ))}

      <SubEditorFooter saving={saving} onClose={onClose} />
    </form>
  );
}
