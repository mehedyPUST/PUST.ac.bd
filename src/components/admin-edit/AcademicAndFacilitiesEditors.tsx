'use client';

import { useState, type FormEvent } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { moveArrayItem, resolveUniversityContent } from '../../lib/cmsDefaults';
import type {
  AboutExtrasConfig,
  AcademicCalendarItem,
  AdmissionsConfig,
  DegreeProgramItem,
  DigitalFormItem,
  FacilityItemConfig,
  FacultyDeanItem,
  FacultyName,
  OfficialFormItem,
  ResearchInfraCard,
  ScholarshipItem,
} from '../../types/pust';
import {
  CmsImageField,
  INPUT_CLASS,
  LABEL_CLASS,
  SubEditorFooter,
  type SubEditorProps,
} from './shared';

const FACULTIES: FacultyName[] = [
  'Faculty of Engineering and Technology',
  'Faculty of Science',
  'Faculty of Business Studies',
  'Faculty of Humanities and Social Science',
  'Faculty of Life and Earth Science',
];

export function AcademicAndFacilitiesEditors({
  target,
  profile,
  saving,
  setSaving,
  setError,
  onSaveProfile,
  onClose,
}: SubEditorProps) {
  const resolved = resolveUniversityContent(profile);

  // About Milestones
  const [aboutExtras, setAboutExtras] = useState<AboutExtrasConfig>(() =>
    structuredClone(resolved.aboutExtras)
  );

  // Academic sub-sections
  const [programs, setPrograms] = useState<DegreeProgramItem[]>(() =>
    structuredClone(resolved.academicExtras.degreePrograms)
  );
  const [deans, setDeans] = useState<FacultyDeanItem[]>(() =>
    structuredClone(resolved.academicExtras.facultyDeans)
  );
  const [calendar, setCalendar] = useState<AcademicCalendarItem[]>(() =>
    structuredClone(resolved.academicExtras.academicCalendar)
  );
  const [scholarships, setScholarships] = useState<ScholarshipItem[]>(() =>
    structuredClone(resolved.academicExtras.scholarships)
  );
  const [forms, setForms] = useState<DigitalFormItem[]>(() =>
    structuredClone(resolved.academicExtras.downloadForms)
  );
  const [officialForms, setOfficialForms] = useState<OfficialFormItem[]>(() =>
    structuredClone(resolved.academicExtras.officialForms || [])
  );
  const [formsTab, setFormsTab] = useState<'digital' | 'official'>('digital');
  const [researchIntro, setResearchIntro] = useState(resolved.academicExtras.researchIntro);
  const [infraCards, setInfraCards] = useState<ResearchInfraCard[]>(() =>
    structuredClone(resolved.academicExtras.researchInfraCards)
  );

  // Admissions
  const [admissions, setAdmissions] = useState<AdmissionsConfig>(() =>
    structuredClone(resolved.admissionsConfig)
  );

  // Facilities
  const [facilities, setFacilities] = useState<FacilityItemConfig[]>(() =>
    structuredClone(resolved.facilitiesConfig)
  );
  const initialFacIdx =
    target.kind === 'facility' && target.route
      ? Math.max(
          0,
          resolved.facilitiesConfig.findIndex((f) => f.route === target.route)
        )
      : 0;
  const [selectedFacIdx, setSelectedFacIdx] = useState(initialFacIdx);

  async function saveAcademicExtras(patch: Partial<typeof resolved.academicExtras>) {
    setSaving(true);
    setError(null);
    try {
      await onSaveProfile({
        academicExtras: {
          ...resolved.academicExtras,
          ...patch,
        },
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save academic directory data.');
    } finally {
      setSaving(false);
    }
  }

  async function submitMilestones(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSaveProfile({
        aboutExtras: {
          campusImage: aboutExtras.campusImage.trim(),
          campusCaption: aboutExtras.campusCaption.trim(),
          milestones: aboutExtras.milestones.map((m) => ({
            year: m.year.trim(),
            title: m.title.trim(),
            detail: m.detail.trim(),
          })),
        },
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save milestones.');
    } finally {
      setSaving(false);
    }
  }

  async function submitAdmissions(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSaveProfile({
        admissionsConfig: {
          ...admissions,
          kicker: admissions.kicker.trim(),
          gstUnits: admissions.gstUnits.map((u) => ({
            unitLabel: u.unitLabel.trim(),
            deptCountLabel: u.deptCountLabel.trim(),
            departmentsText: u.departmentsText.trim(),
          })),
          undergradText: admissions.undergradText.trim(),
          gradText: admissions.gradText.trim(),
          eveningText: admissions.eveningText.trim(),
          totalIntakeLabel: admissions.totalIntakeLabel.trim(),
          signupMethodLabel: admissions.signupMethodLabel.trim(),
          deskEmail: admissions.deskEmail.trim(),
        },
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save admissions information.');
    } finally {
      setSaving(false);
    }
  }

  async function submitFacilities(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSaveProfile({
        facilitiesConfig: facilities.map((f) => ({
          ...f,
          label: f.label.trim(),
          route: f.route.trim(),
          title: f.title.trim(),
          body: f.body.trim(),
          img: f.img.trim(),
          hours: f.hours.trim(),
          location: f.location.trim(),
          portalRoute: f.portalRoute.trim(),
          highlights: f.highlights.map((h) => h.trim()).filter(Boolean),
        })),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save facility configuration.');
    } finally {
      setSaving(false);
    }
  }

  if (target.kind === 'milestones') {
    return (
      <form onSubmit={submitMilestones} className="space-y-4">
        <CmsImageField
          label="About Campus Photograph URL"
          value={aboutExtras.campusImage}
          required
          onError={setError}
          onChange={(nextUrl) => setAboutExtras({ ...aboutExtras, campusImage: nextUrl })}
        />
        <div>
          <label className={LABEL_CLASS}>Photograph Caption</label>
          <input
            type="text"
            required
            value={aboutExtras.campusCaption}
            onChange={(e) => setAboutExtras({ ...aboutExtras, campusCaption: e.target.value })}
            className={INPUT_CLASS}
          />
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <label className={LABEL_CLASS}>Institutional Chronology Milestones</label>
          <button
            type="button"
            onClick={() =>
              setAboutExtras((prev) => ({
                ...prev,
                milestones: [
                  ...prev.milestones,
                  { year: '2027', title: 'New Milestone', detail: 'Key institutional achievement.' },
                ],
              }))
            }
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300 cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Add Milestone
          </button>
        </div>
        {aboutExtras.milestones.map((m, idx) => (
          <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-[#F7F7F5] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-semibold text-pust-800">
                Milestone #{idx + 1}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() =>
                    setAboutExtras((prev) => ({
                      ...prev,
                      milestones: moveArrayItem(prev.milestones, idx, -1),
                    }))
                  }
                  className="p-1 rounded border border-slate-300 bg-white disabled:opacity-40 cursor-pointer"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  disabled={idx === aboutExtras.milestones.length - 1}
                  onClick={() =>
                    setAboutExtras((prev) => ({
                      ...prev,
                      milestones: moveArrayItem(prev.milestones, idx, 1),
                    }))
                  }
                  className="p-1 rounded border border-slate-300 bg-white disabled:opacity-40 cursor-pointer"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
                {aboutExtras.milestones.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setAboutExtras((prev) => ({
                        ...prev,
                        milestones: prev.milestones.filter((_, i) => i !== idx),
                      }))
                    }
                    className="text-xs text-red-700 hover:underline cursor-pointer ml-1"
                  >
                    Del
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                required
                value={m.year}
                onChange={(e) =>
                  setAboutExtras((prev) => ({
                    ...prev,
                    milestones: prev.milestones.map((r, i) =>
                      i === idx ? { ...r, year: e.target.value } : r
                    ),
                  }))
                }
                placeholder="Date / Year"
                className={INPUT_CLASS}
              />
              <input
                type="text"
                required
                value={m.title}
                onChange={(e) =>
                  setAboutExtras((prev) => ({
                    ...prev,
                    milestones: prev.milestones.map((r, i) =>
                      i === idx ? { ...r, title: e.target.value } : r
                    ),
                  }))
                }
                placeholder="Milestone Title"
                className={`${INPUT_CLASS} sm:col-span-2`}
              />
            </div>
            <textarea
              rows={2}
              required
              value={m.detail}
              onChange={(e) =>
                setAboutExtras((prev) => ({
                  ...prev,
                  milestones: prev.milestones.map((r, i) =>
                    i === idx ? { ...r, detail: e.target.value } : r
                  ),
                }))
              }
              className={INPUT_CLASS}
            />
          </div>
        ))}
        <SubEditorFooter saving={saving} onClose={onClose} />
      </form>
    );
  }

  if (target.kind === 'degree-programs') {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveAcademicExtras({ degreePrograms: programs });
        }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-600">
            Configure academic tracks displayed under Academics → Academic Programs.
          </p>
          <button
            type="button"
            onClick={() =>
              setPrograms((prev) => [
                ...prev,
                {
                  level: 'New Degree Track',
                  degrees: 'M.Sc. / Diploma',
                  duration: '1 – 2 Years',
                  credits: '36 Credit Hours',
                  entry: 'Departmental Selection',
                },
              ])
            }
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300 cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Add Program
          </button>
        </div>
        {programs.map((p, idx) => (
          <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-[#F7F7F5] space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-semibold text-pust-800">Track #{idx + 1}</span>
              {programs.length > 1 && (
                <button
                  type="button"
                  onClick={() => setPrograms((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-xs text-red-700 hover:underline cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                required
                value={p.level}
                onChange={(e) =>
                  setPrograms((prev) =>
                    prev.map((r, i) => (i === idx ? { ...r, level: e.target.value } : r))
                  )
                }
                placeholder="Level Title"
                className={INPUT_CLASS}
              />
              <input
                type="text"
                required
                value={p.duration}
                onChange={(e) =>
                  setPrograms((prev) =>
                    prev.map((r, i) => (i === idx ? { ...r, duration: e.target.value } : r))
                  )
                }
                placeholder="Duration"
                className={INPUT_CLASS}
              />
            </div>
            <input
              type="text"
              required
              value={p.degrees}
              onChange={(e) =>
                setPrograms((prev) =>
                  prev.map((r, i) => (i === idx ? { ...r, degrees: e.target.value } : r))
                )
              }
              placeholder="Degrees Offered"
              className={INPUT_CLASS}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                required
                value={p.credits}
                onChange={(e) =>
                  setPrograms((prev) =>
                    prev.map((r, i) => (i === idx ? { ...r, credits: e.target.value } : r))
                  )
                }
                placeholder="Credit Structure"
                className={INPUT_CLASS}
              />
              <input
                type="text"
                required
                value={p.entry}
                onChange={(e) =>
                  setPrograms((prev) =>
                    prev.map((r, i) => (i === idx ? { ...r, entry: e.target.value } : r))
                  )
                }
                placeholder="Admission Pathway"
                className={INPUT_CLASS}
              />
            </div>
          </div>
        ))}
        <SubEditorFooter saving={saving} onClose={onClose} />
      </form>
    );
  }

  if (target.kind === 'faculty-deans') {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveAcademicExtras({ facultyDeans: deans });
        }}
        className="space-y-4"
      >
        <p className="text-xs text-slate-600">
          Update the 5 Faculty Deans, office emails, and department summaries shown on Academics → Faculty &amp; All Dean.
        </p>
        {deans.map((d, idx) => (
          <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-[#F7F7F5] space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className={LABEL_CLASS}>Faculty</label>
                <select
                  value={d.faculty}
                  onChange={(e) =>
                    setDeans((prev) =>
                      prev.map((r, i) =>
                        i === idx ? { ...r, faculty: e.target.value as FacultyName } : r
                      )
                    )
                  }
                  className={INPUT_CLASS}
                >
                  {FACULTIES.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL_CLASS}>Code &amp; Scope Label</label>
                <input
                  type="text"
                  required
                  value={d.code}
                  onChange={(e) =>
                    setDeans((prev) =>
                      prev.map((r, i) => (i === idx ? { ...r, code: e.target.value } : r))
                    )
                  }
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Dean Name</label>
                <input
                  type="text"
                  required
                  value={d.dean}
                  onChange={(e) =>
                    setDeans((prev) =>
                      prev.map((r, i) => (i === idx ? { ...r, dean: e.target.value } : r))
                    )
                  }
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Dean Email</label>
                <input
                  type="email"
                  required
                  value={d.email}
                  onChange={(e) =>
                    setDeans((prev) =>
                      prev.map((r, i) => (i === idx ? { ...r, email: e.target.value } : r))
                    )
                  }
                  className={INPUT_CLASS}
                />
              </div>
            </div>
            <div>
              <label className={LABEL_CLASS}>Departments Summary</label>
              <input
                type="text"
                required
                value={d.depts}
                onChange={(e) =>
                  setDeans((prev) =>
                    prev.map((r, i) => (i === idx ? { ...r, depts: e.target.value } : r))
                  )
                }
                className={INPUT_CLASS}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className={LABEL_CLASS}>Office Phone (Optional)</label>
                <input
                  type="text"
                  value={d.phone || ''}
                  onChange={(e) =>
                    setDeans((prev) =>
                      prev.map((r, i) =>
                        i === idx ? { ...r, phone: e.target.value || undefined } : r
                      )
                    )
                  }
                  placeholder="+880..."
                  className={`${INPUT_CLASS} font-mono`}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Qualification (Optional)</label>
                <input
                  type="text"
                  value={d.qualification || ''}
                  onChange={(e) =>
                    setDeans((prev) =>
                      prev.map((r, i) =>
                        i === idx ? { ...r, qualification: e.target.value || undefined } : r
                      )
                    )
                  }
                  placeholder="Ph.D. (University)"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Publications Count</label>
                <input
                  type="number"
                  min={0}
                  max={5000}
                  value={d.publicationCount ?? ''}
                  onChange={(e) =>
                    setDeans((prev) =>
                      prev.map((r, i) =>
                        i === idx
                          ? {
                              ...r,
                              publicationCount:
                                e.target.value === '' ? undefined : Number(e.target.value),
                            }
                          : r
                      )
                    )
                  }
                  className={INPUT_CLASS}
                />
              </div>
            </div>
            <div>
              <label className={LABEL_CLASS}>Research Focus (Optional)</label>
              <input
                type="text"
                value={d.researchArea || ''}
                onChange={(e) =>
                  setDeans((prev) =>
                    prev.map((r, i) =>
                      i === idx ? { ...r, researchArea: e.target.value || undefined } : r
                    )
                  )
                }
                placeholder="Primary research domain"
                className={INPUT_CLASS}
              />
            </div>
          </div>
        ))}
        <SubEditorFooter saving={saving} onClose={onClose} />
      </form>
    );
  }

  if (target.kind === 'academic-calendar') {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveAcademicExtras({ academicCalendar: calendar });
        }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-slate-600">
            Manage key exams, holidays, semester deadlines &amp; milestones under Academics → Academic Calendar.
          </p>
          <button
            type="button"
            onClick={() =>
              setCalendar((prev) => [
                ...prev,
                {
                  term: 'Academic Cycle',
                  event: 'New Calendar Event',
                  date: '2027-01-20',
                  category: 'deadline',
                  venue: 'Academic Building I',
                  details: '',
                },
              ])
            }
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Add Date
          </button>
        </div>
        {calendar.map((row, idx) => (
          <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-[#F7F7F5] space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                <input
                  type="text"
                  required
                  value={row.date}
                  onChange={(e) =>
                    setCalendar((prev) =>
                      prev.map((r, i) => (i === idx ? { ...r, date: e.target.value } : r))
                    )
                  }
                  placeholder="Start Date (YYYY-MM-DD)"
                  className={`${INPUT_CLASS} font-mono`}
                />
                <input
                  type="text"
                  value={row.endDate || ''}
                  onChange={(e) =>
                    setCalendar((prev) =>
                      prev.map((r, i) =>
                        i === idx ? { ...r, endDate: e.target.value || undefined } : r
                      )
                    )
                  }
                  placeholder="End Date (optional)"
                  className={`${INPUT_CLASS} font-mono`}
                />
                <select
                  value={row.category || 'academic'}
                  onChange={(e) =>
                    setCalendar((prev) =>
                      prev.map((r, i) =>
                        i === idx
                          ? {
                              ...r,
                              category: e.target.value as 'exam' | 'holiday' | 'deadline' | 'academic',
                            }
                          : r
                      )
                    )
                  }
                  className={INPUT_CLASS}
                >
                  <option value="exam">Exam</option>
                  <option value="holiday">Holiday</option>
                  <option value="deadline">Semester Deadline</option>
                  <option value="academic">Academic Milestone</option>
                </select>
              </div>
              {calendar.length > 1 && (
                <button
                  type="button"
                  onClick={() => setCalendar((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-xs text-red-700 hover:underline cursor-pointer shrink-0"
                >
                  Del
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                required
                value={row.event}
                onChange={(e) =>
                  setCalendar((prev) =>
                    prev.map((r, i) => (i === idx ? { ...r, event: e.target.value } : r))
                  )
                }
                placeholder="Event Title"
                className={INPUT_CLASS}
              />
              <input
                type="text"
                required
                value={row.term}
                onChange={(e) =>
                  setCalendar((prev) =>
                    prev.map((r, i) => (i === idx ? { ...r, term: e.target.value } : r))
                  )
                }
                placeholder="Term / Cycle"
                className={INPUT_CLASS}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={row.venue || ''}
                onChange={(e) =>
                  setCalendar((prev) =>
                    prev.map((r, i) =>
                      i === idx ? { ...r, venue: e.target.value || undefined } : r
                    )
                  )
                }
                placeholder="Venue / Office (optional)"
                className={INPUT_CLASS}
              />
              <input
                type="text"
                value={row.details || ''}
                onChange={(e) =>
                  setCalendar((prev) =>
                    prev.map((r, i) =>
                      i === idx ? { ...r, details: e.target.value || undefined } : r
                    )
                  )
                }
                placeholder="Details / Student Guidance (optional)"
                className={INPUT_CLASS}
              />
            </div>
          </div>
        ))}
        <SubEditorFooter saving={saving} onClose={onClose} />
      </form>
    );
  }

  if (target.kind === 'scholarships') {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveAcademicExtras({ scholarships });
        }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-600">
            Configure scholarships and stipends under Academics → Scholarship.
          </p>
          <button
            type="button"
            onClick={() =>
              setScholarships((prev) => [
                ...prev,
                { title: 'New Fellowship / Stipend', detail: 'Eligibility and award details.' },
              ])
            }
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300 cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Add Program
          </button>
        </div>
        {scholarships.map((s, idx) => (
          <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-[#F7F7F5] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                required
                value={s.title}
                onChange={(e) =>
                  setScholarships((prev) =>
                    prev.map((r, i) => (i === idx ? { ...r, title: e.target.value } : r))
                  )
                }
                className={INPUT_CLASS}
              />
              {scholarships.length > 1 && (
                <button
                  type="button"
                  onClick={() => setScholarships((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-xs text-red-700 hover:underline cursor-pointer shrink-0"
                >
                  Del
                </button>
              )}
            </div>
            <textarea
              rows={2}
              required
              value={s.detail}
              onChange={(e) =>
                setScholarships((prev) =>
                  prev.map((r, i) => (i === idx ? { ...r, detail: e.target.value } : r))
                )
              }
              className={INPUT_CLASS}
            />
          </div>
        ))}
        <SubEditorFooter saving={saving} onClose={onClose} />
      </form>
    );
  }

  if (target.kind === 'download-forms') {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveAcademicExtras({
            downloadForms: forms.map((f) => ({
              ...f,
              fields: f.fields.map((x) => x.trim()).filter(Boolean),
            })),
            officialForms: officialForms.map((ofItem, idx) => ({
              serial: Number(ofItem.serial) || idx + 1,
              title: ofItem.title.trim(),
              category: ofItem.category,
              ...(ofItem.pdfUrl?.trim() ? { pdfUrl: ofItem.pdfUrl.trim() } : {}),
              ...(ofItem.docUrl?.trim() ? { docUrl: ofItem.docUrl.trim() } : {}),
            })),
          });
        }}
        className="space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
          <div className="inline-flex p-1 rounded-lg bg-[#F7F7F5] border border-slate-200 gap-1">
            <button
              type="button"
              onClick={() => setFormsTab('digital')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                formsTab === 'digital' ? 'bg-pust-900 text-white' : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              Interactive Portal Forms ({forms.length})
            </button>
            <button
              type="button"
              onClick={() => setFormsTab('official')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                formsTab === 'official' ? 'bg-pust-900 text-white' : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              Official PDF / DOCX Archive ({officialForms.length})
            </button>
          </div>

          {formsTab === 'digital' ? (
            <button
              type="button"
              onClick={() =>
                setForms((prev) => [
                  ...prev,
                  {
                    code: `PUST-FORM-0${prev.length + 1}`,
                    title: 'New Institutional Application Form',
                    office: 'Office of the Registrar',
                    note: 'Submit online via the PUST Digital Campus Portal.',
                    portalTarget: '/portal',
                    portalLabel: 'Open Campus Portal',
                    fields: ['Applicant Full Name', 'Academic ID', 'Department Code'],
                  },
                ])
              }
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300 cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Add Interactive Form
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                setOfficialForms((prev) => [
                  ...prev,
                  {
                    serial: prev.length + 1,
                    title: 'New Official Form (PDF / DOCX)',
                    category: 'Faculty, Officer & Leave',
                    pdfUrl: '',
                    docUrl: '',
                  },
                ])
              }
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300 cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Add Official Form
            </button>
          )}
        </div>

        {formsTab === 'digital' ? (
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Manage interactive printable &amp; digital portal forms on Academics → Forms Download.
            </p>
            {forms.map((f, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-[#F7F7F5] space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-pust-800">{f.code}</span>
                  {forms.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setForms((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-xs text-red-700 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    value={f.code}
                    onChange={(e) =>
                      setForms((prev) =>
                        prev.map((r, i) => (i === idx ? { ...r, code: e.target.value } : r))
                      )
                    }
                    placeholder="Form Code"
                    className={`${INPUT_CLASS} font-mono`}
                  />
                  <input
                    type="text"
                    required
                    value={f.title}
                    onChange={(e) =>
                      setForms((prev) =>
                        prev.map((r, i) => (i === idx ? { ...r, title: e.target.value } : r))
                      )
                    }
                    placeholder="Form Title"
                    className={`${INPUT_CLASS} sm:col-span-2`}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={f.office}
                    onChange={(e) =>
                      setForms((prev) =>
                        prev.map((r, i) => (i === idx ? { ...r, office: e.target.value } : r))
                      )
                    }
                    placeholder="Receiving Authority"
                    className={INPUT_CLASS}
                  />
                  <input
                    type="text"
                    required
                    value={f.note}
                    onChange={(e) =>
                      setForms((prev) =>
                        prev.map((r, i) => (i === idx ? { ...r, note: e.target.value } : r))
                      )
                    }
                    placeholder="Guidance Note"
                    className={INPUT_CLASS}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={f.portalTarget}
                    onChange={(e) =>
                      setForms((prev) =>
                        prev.map((r, i) => (i === idx ? { ...r, portalTarget: e.target.value } : r))
                      )
                    }
                    placeholder="Portal Route (e.g. /portal?tab=exams)"
                    className={`${INPUT_CLASS} font-mono`}
                  />
                  <input
                    type="text"
                    required
                    value={f.portalLabel}
                    onChange={(e) =>
                      setForms((prev) =>
                        prev.map((r, i) => (i === idx ? { ...r, portalLabel: e.target.value } : r))
                      )
                    }
                    placeholder="Portal CTA Label"
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Template Fields (one per line)</label>
                  <textarea
                    rows={3}
                    required
                    value={f.fields.join('\n')}
                    onChange={(e) =>
                      setForms((prev) =>
                        prev.map((r, i) =>
                          i === idx ? { ...r, fields: e.target.value.split('\n') } : r
                        )
                      )
                    }
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-600">
              Manage downloadable PDF/DOCX forms shown on Academics → Forms Download and the Career Recruitment Portal.
            </p>
            {officialForms.map((ofItem, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-[#F7F7F5] space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-lapis-800">
                    Form #{ofItem.serial}
                  </span>
                  <button
                    type="button"
                    onClick={() => setOfficialForms((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-xs text-red-700 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="number"
                    min={1}
                    max={999}
                    required
                    value={ofItem.serial}
                    onChange={(e) =>
                      setOfficialForms((prev) =>
                        prev.map((r, i) =>
                          i === idx ? { ...r, serial: Number(e.target.value) || 1 } : r
                        )
                      )
                    }
                    placeholder="Serial"
                    className={`${INPUT_CLASS} font-mono`}
                  />
                  <select
                    value={ofItem.category}
                    onChange={(e) =>
                      setOfficialForms((prev) =>
                        prev.map((r, i) =>
                          i === idx
                            ? {
                                ...r,
                                category: e.target.value as OfficialFormItem['category'],
                              }
                            : r
                        )
                      )
                    }
                    className={INPUT_CLASS}
                  >
                    <option value="Student & Academic">Student &amp; Academic</option>
                    <option value="Faculty, Officer & Leave">Faculty, Officer &amp; Leave</option>
                    <option value="Accounts & Transport">Accounts &amp; Transport</option>
                  </select>
                  <input
                    type="text"
                    required
                    value={ofItem.title}
                    onChange={(e) =>
                      setOfficialForms((prev) =>
                        prev.map((r, i) => (i === idx ? { ...r, title: e.target.value } : r))
                      )
                    }
                    placeholder="Official Form Title"
                    className={`${INPUT_CLASS} sm:col-span-2`}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={ofItem.pdfUrl || ''}
                    onChange={(e) =>
                      setOfficialForms((prev) =>
                        prev.map((r, i) => (i === idx ? { ...r, pdfUrl: e.target.value } : r))
                      )
                    }
                    placeholder="PDF URL (https://... or /assets/...)"
                    className={`${INPUT_CLASS} font-mono`}
                  />
                  <input
                    type="text"
                    value={ofItem.docUrl || ''}
                    onChange={(e) =>
                      setOfficialForms((prev) =>
                        prev.map((r, i) => (i === idx ? { ...r, docUrl: e.target.value } : r))
                      )
                    }
                    placeholder="DOCX URL (optional)"
                    className={`${INPUT_CLASS} font-mono`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        <SubEditorFooter saving={saving} onClose={onClose} />
      </form>
    );
  }

  if (target.kind === 'research-infra') {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveAcademicExtras({
            researchIntro: researchIntro.trim(),
            researchInfraCards: infraCards.map((c) => ({
              ...c,
              tag: c.tag.trim(),
              title: c.title.trim(),
              description: c.description.trim(),
              imageUrl: c.imageUrl.trim(),
              caption: c.caption.trim(),
            })),
          });
        }}
        className="space-y-4"
      >
        <div>
          <label className={LABEL_CLASS}>Research Infrastructure Summary</label>
          <textarea
            rows={2}
            required
            value={researchIntro}
            onChange={(e) => setResearchIntro(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <label className={LABEL_CLASS}>Infrastructure Showcase Cards</label>
          <button
            type="button"
            onClick={() =>
              setInfraCards((prev) => [
                ...prev,
                {
                  id: `infra-${Date.now()}`,
                  tag: 'PUST Research Facility',
                  title: 'New Research Wing',
                  description: 'Laboratory and student support overview.',
                  imageUrl: 'https://i.ibb.co.com/FLNWQqzY/pust-engineering-lab-1795431408924.jpg',
                  caption: 'PUST Research Facility.',
                },
              ])
            }
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300 cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Add Card
          </button>
        </div>
        {infraCards.map((c, idx) => (
          <div key={c.id || idx} className="p-4 rounded-xl border border-slate-200 bg-[#F7F7F5] space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-semibold text-pust-800">Card #{idx + 1}</span>
              {infraCards.length > 1 && (
                <button
                  type="button"
                  onClick={() => setInfraCards((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-xs text-red-700 hover:underline cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                required
                value={c.tag}
                onChange={(e) =>
                  setInfraCards((prev) =>
                    prev.map((r, i) => (i === idx ? { ...r, tag: e.target.value } : r))
                  )
                }
                placeholder="Tag Line"
                className={INPUT_CLASS}
              />
              <input
                type="text"
                required
                value={c.title}
                onChange={(e) =>
                  setInfraCards((prev) =>
                    prev.map((r, i) => (i === idx ? { ...r, title: e.target.value } : r))
                  )
                }
                placeholder="Card Title"
                className={INPUT_CLASS}
              />
            </div>
            <CmsImageField
              label="Photo URL"
              value={c.imageUrl}
              required
              onError={setError}
              onChange={(nextUrl) =>
                setInfraCards((prev) =>
                  prev.map((r, i) => (i === idx ? { ...r, imageUrl: nextUrl } : r))
                )
              }
            />
            <input
              type="text"
              required
              value={c.caption}
              onChange={(e) =>
                setInfraCards((prev) =>
                  prev.map((r, i) => (i === idx ? { ...r, caption: e.target.value } : r))
                )
              }
              placeholder="Figure Caption"
              className={INPUT_CLASS}
            />
            <textarea
              rows={2}
              required
              value={c.description}
              onChange={(e) =>
                setInfraCards((prev) =>
                  prev.map((r, i) => (i === idx ? { ...r, description: e.target.value } : r))
                )
              }
              className={INPUT_CLASS}
            />
          </div>
        ))}
        <SubEditorFooter saving={saving} onClose={onClose} />
      </form>
    );
  }

  if (target.kind === 'admissions-info') {
    return (
      <form onSubmit={submitAdmissions} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={LABEL_CLASS}>Admissions Cycle Kicker</label>
            <input
              type="text"
              required
              value={admissions.kicker}
              onChange={(e) => setAdmissions({ ...admissions, kicker: e.target.value })}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Registrar Admissions Desk Email</label>
            <input
              type="text"
              required
              value={admissions.deskEmail}
              onChange={(e) => setAdmissions({ ...admissions, deskEmail: e.target.value })}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Total Undergraduate Intake</label>
            <input
              type="text"
              required
              value={admissions.totalIntakeLabel}
              onChange={(e) =>
                setAdmissions({ ...admissions, totalIntakeLabel: e.target.value })
              }
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Student Signup Method</label>
            <input
              type="text"
              required
              value={admissions.signupMethodLabel}
              onChange={(e) =>
                setAdmissions({ ...admissions, signupMethodLabel: e.target.value })
              }
              className={INPUT_CLASS}
            />
          </div>
        </div>

        <div className="space-y-2.5 pt-2 border-t border-slate-200">
          <label className={LABEL_CLASS}>GST Admission Unit Cards</label>
          {admissions.gstUnits.map((u, idx) => (
            <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-[#F7F7F5] space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={u.unitLabel}
                  onChange={(e) =>
                    setAdmissions((prev) => ({
                      ...prev,
                      gstUnits: prev.gstUnits.map((r, i) =>
                        i === idx ? { ...r, unitLabel: e.target.value } : r
                      ),
                    }))
                  }
                  className={INPUT_CLASS}
                />
                <input
                  type="text"
                  required
                  value={u.deptCountLabel}
                  onChange={(e) =>
                    setAdmissions((prev) => ({
                      ...prev,
                      gstUnits: prev.gstUnits.map((r, i) =>
                        i === idx ? { ...r, deptCountLabel: e.target.value } : r
                      ),
                    }))
                  }
                  className={INPUT_CLASS}
                />
              </div>
              <textarea
                rows={2}
                required
                value={u.departmentsText}
                onChange={(e) =>
                  setAdmissions((prev) => ({
                    ...prev,
                    gstUnits: prev.gstUnits.map((r, i) =>
                      i === idx ? { ...r, departmentsText: e.target.value } : r
                    ),
                  }))
                }
                className={INPUT_CLASS}
              />
            </div>
          ))}
        </div>

        <div className="space-y-3 pt-2 border-t border-slate-200">
          <div>
            <label className={LABEL_CLASS}>Undergraduate Track Narrative</label>
            <textarea
              rows={2}
              required
              value={admissions.undergradText}
              onChange={(e) => setAdmissions({ ...admissions, undergradText: e.target.value })}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Graduate Track Narrative</label>
            <textarea
              rows={2}
              required
              value={admissions.gradText}
              onChange={(e) => setAdmissions({ ...admissions, gradText: e.target.value })}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Evening Programs Narrative</label>
            <textarea
              rows={2}
              required
              value={admissions.eveningText}
              onChange={(e) => setAdmissions({ ...admissions, eveningText: e.target.value })}
              className={INPUT_CLASS}
            />
          </div>
        </div>
        <SubEditorFooter saving={saving} onClose={onClose} />
      </form>
    );
  }

  // Facility Pages Editor
  const activeFac = facilities[selectedFacIdx] || facilities[0];

  return (
    <form onSubmit={submitFacilities} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
        <div className="flex flex-wrap gap-1.5">
          {facilities.map((f, idx) => (
            <button
              key={`${f.route}-${idx}`}
              type="button"
              onClick={() => setSelectedFacIdx(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer border ${
                selectedFacIdx === idx
                  ? 'bg-pust-900 text-white border-pust-900'
                  : 'bg-[#F7F7F5] text-slate-700 border-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            const nextIdx = facilities.length;
            setFacilities((prev) => [
              ...prev,
              {
                label: `Facility ${nextIdx + 1}`,
                route: `/facilities/unit-${nextIdx + 1}`,
                title: 'New Campus Service Wing',
                body: 'Overview of campus student services and operating protocol.',
                img: 'https://i.ibb.co.com/qLZmQK8S/pust-campus-grounds-1795431408500.jpg',
                hours: 'Sun–Thu · 09:00–17:00 BST',
                location: 'Rajapur Campus, Pabna',
                portalRoute: '/portal',
                highlights: ['Campus service capability'],
              },
            ]);
            setSelectedFacIdx(nextIdx);
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300 cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Add Facility
        </button>
      </div>

      {activeFac && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Tab Label</label>
              <input
                type="text"
                required
                value={activeFac.label}
                onChange={(e) =>
                  setFacilities((prev) =>
                    prev.map((f, i) => (i === selectedFacIdx ? { ...f, label: e.target.value } : f))
                  )
                }
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Facility Route</label>
              <input
                type="text"
                required
                value={activeFac.route}
                onChange={(e) =>
                  setFacilities((prev) =>
                    prev.map((f, i) => (i === selectedFacIdx ? { ...f, route: e.target.value } : f))
                  )
                }
                className={`${INPUT_CLASS} font-mono`}
              />
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Page Heading</label>
            <input
              type="text"
              required
              value={activeFac.title}
              onChange={(e) =>
                setFacilities((prev) =>
                  prev.map((f, i) => (i === selectedFacIdx ? { ...f, title: e.target.value } : f))
                )
              }
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Description</label>
            <textarea
              rows={4}
              required
              value={activeFac.body}
              onChange={(e) =>
                setFacilities((prev) =>
                  prev.map((f, i) => (i === selectedFacIdx ? { ...f, body: e.target.value } : f))
                )
              }
              className={INPUT_CLASS}
            />
          </div>

          <CmsImageField
            label="Facility Photograph URL"
            value={activeFac.img}
            required
            onError={setError}
            onChange={(nextUrl) =>
              setFacilities((prev) =>
                prev.map((f, i) => (i === selectedFacIdx ? { ...f, img: nextUrl } : f))
              )
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={LABEL_CLASS}>Service Hours</label>
              <input
                type="text"
                required
                value={activeFac.hours}
                onChange={(e) =>
                  setFacilities((prev) =>
                    prev.map((f, i) => (i === selectedFacIdx ? { ...f, hours: e.target.value } : f))
                  )
                }
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Location &amp; Contact</label>
              <input
                type="text"
                required
                value={activeFac.location}
                onChange={(e) =>
                  setFacilities((prev) =>
                    prev.map((f, i) =>
                      i === selectedFacIdx ? { ...f, location: e.target.value } : f
                    )
                  )
                }
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Portal Deep Route</label>
              <input
                type="text"
                required
                value={activeFac.portalRoute}
                onChange={(e) =>
                  setFacilities((prev) =>
                    prev.map((f, i) =>
                      i === selectedFacIdx ? { ...f, portalRoute: e.target.value } : f
                    )
                  )
                }
                className={`${INPUT_CLASS} font-mono`}
              />
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Key Capabilities (one per line)</label>
            <textarea
              rows={3}
              required
              value={activeFac.highlights.join('\n')}
              onChange={(e) =>
                setFacilities((prev) =>
                  prev.map((f, i) =>
                    i === selectedFacIdx ? { ...f, highlights: e.target.value.split('\n') } : f
                  )
                )
              }
              className={INPUT_CLASS}
            />
          </div>

          {facilities.length > 1 && (
            <button
              type="button"
              onClick={() => {
                setFacilities((prev) => prev.filter((_, i) => i !== selectedFacIdx));
                setSelectedFacIdx(0);
              }}
              className="inline-flex items-center gap-1 text-xs font-medium text-red-700 hover:underline cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove This Facility
            </button>
          )}
        </div>
      )}

      <SubEditorFooter saving={saving} onClose={onClose} />
    </form>
  );
}
