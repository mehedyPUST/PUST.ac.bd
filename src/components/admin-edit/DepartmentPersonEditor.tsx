'use client';

import { useState, type FormEvent } from 'react';
import { ChevronDown, Plus, Save, Trash2 } from 'lucide-react';
import { pustApi } from '../../lib/api';
import type {
  ContactDetailItem,
  DepartmentPersonGroup,
  DepartmentPersonRecord,
  DepartmentRecord,
} from '../../types/pust';
import { CmsImageField, INPUT_CLASS, LABEL_CLASS } from './shared';

interface DepartmentPersonEditorProps {
  department: DepartmentRecord;
  group: DepartmentPersonGroup;
  person: DepartmentPersonRecord | null;
  saving: boolean;
  setSaving: (v: boolean) => void;
  setError: (msg: string | null) => void;
  onRefreshDepartments: () => Promise<void>;
  onClose: () => void;
}

const PHONE_TYPES: ContactDetailItem['type'][] = ['Personal', 'Office', 'IP Phone', 'PABX'];
const EMAIL_TYPES: Array<'Personal' | 'Office'> = ['Office', 'Personal'];

function splitLines(text: string): string[] | undefined {
  const items = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  return items.length > 0 ? items : undefined;
}

function joinLines(items?: string[]): string {
  return items && items.length > 0 ? items.join('\n') : '';
}

function createSlugId(prefix: string, name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 32);
  return `${prefix}-${slug || 'member'}-${Date.now().toString(36)}`;
}

export function DepartmentPersonEditor({
  department,
  group,
  person,
  saving,
  setSaving,
  setError,
  onRefreshDepartments,
  onClose,
}: DepartmentPersonEditorProps) {
  const isNew = !person;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showAdvancedCv, setShowAdvancedCv] = useState(false);

  const [name, setName] = useState(person?.name || '');
  const [designation, setDesignation] = useState(
    person?.designation ||
      (group === 'chairman'
        ? 'Chairman'
        : group === 'officer'
        ? 'Section Officer'
        : 'Assistant Professor')
  );
  const [onStudyLeave, setOnStudyLeave] = useState(Boolean(person?.onStudyLeave));
  const [photoUrl, setPhotoUrl] = useState(person?.photoUrl || '');
  const [officeLocation, setOfficeLocation] = useState(person?.officeLocation || '');
  const [qualification, setQualification] = useState(person?.qualification || '');
  const [researchArea, setResearchArea] = useState(person?.researchArea || '');
  const [totalPublications, setTotalPublications] = useState(
    person?.totalPublications !== undefined ? String(person.totalPublications) : ''
  );
  const [bio, setBio] = useState(person?.bio || '');

  const [phones, setPhones] = useState<ContactDetailItem[]>(() =>
    structuredClone(person?.phones || [])
  );
  const [emails, setEmails] = useState<ContactDetailItem[]>(() =>
    structuredClone(person?.emails || [])
  );

  // Advanced CV lists (1 entry per line)
  const [educationText, setEducationText] = useState(() => joinLines(person?.education));
  const [teachingText, setTeachingText] = useState(() => joinLines(person?.teachingExperience));
  const [adminExpText, setAdminExpText] = useState(() =>
    joinLines(person?.administrativeExperience)
  );
  const [researchInterestsText, setResearchInterestsText] = useState(() =>
    joinLines(person?.researchInterests)
  );
  const [activeProjectsText, setActiveProjectsText] = useState(() =>
    joinLines(person?.activeResearchProjects)
  );
  const [prevProjectsText, setPrevProjectsText] = useState(() =>
    joinLines(person?.previousResearchProjects)
  );
  const [affiliationsText, setAffiliationsText] = useState(() =>
    joinLines(person?.externalAffiliations)
  );
  const [awardsText, setAwardsText] = useState(() => joinLines(person?.awards));
  const [coursesText, setCoursesText] = useState(() => joinLines(person?.conductedCourses));
  const [supervisionText, setSupervisionText] = useState(() =>
    joinLines(person?.graduateSupervision)
  );
  const [articlesText, setArticlesText] = useState(() => joinLines(person?.journalArticles));
  const [proceedingsText, setProceedingsText] = useState(() =>
    joinLines(person?.conferenceProceedings)
  );
  const [chaptersText, setChaptersText] = useState(() => joinLines(person?.bookChapters));
  const [conferencesText, setConferencesText] = useState(() =>
    joinLines(person?.conferencesAttended)
  );

  const groupLabel =
    group === 'chairman'
      ? 'Chairman Profile'
      : group === 'faculty'
      ? 'Faculty Member'
      : group === 'contractual'
      ? 'Faculty Member (Contractual)'
      : 'Department Officer';

  function buildPersonRecord(): DepartmentPersonRecord {
    const trimmedName = name.trim();
    const trimmedDesignation = designation.trim();

    const cleanPhones = phones
      .map((p) => ({ value: p.value.trim(), type: p.type }))
      .filter((p) => p.value.length >= 2);
    const cleanEmails = emails
      .map((e) => ({ value: e.value.trim(), type: e.type }))
      .filter((e) => e.value.length >= 2);

    const parsedTotalPubs =
      totalPublications.trim() !== '' && Number.isFinite(Number(totalPublications))
        ? Math.max(0, Math.round(Number(totalPublications)))
        : undefined;

    const record: DepartmentPersonRecord = {
      id: person?.id || createSlugId(`${department.code.toLowerCase()}-${group}`, trimmedName),
      name: trimmedName,
      designation: trimmedDesignation,
      ...(onStudyLeave ? { onStudyLeave: true } : {}),
      ...(photoUrl.trim() ? { photoUrl: photoUrl.trim() } : {}),
      ...(officeLocation.trim() ? { officeLocation: officeLocation.trim() } : {}),
      ...(bio.trim() ? { bio: bio.trim() } : {}),
      phones: cleanPhones,
      emails: cleanEmails,
      ...(qualification.trim() ? { qualification: qualification.trim() } : {}),
      ...(researchArea.trim() ? { researchArea: researchArea.trim() } : {}),
      ...(parsedTotalPubs !== undefined ? { totalPublications: parsedTotalPubs } : {}),
    };

    const edu = splitLines(educationText);
    const teach = splitLines(teachingText);
    const adminExp = splitLines(adminExpText);
    const interests = splitLines(researchInterestsText);
    const activeProj = splitLines(activeProjectsText);
    const prevProj = splitLines(prevProjectsText);
    const affiliations = splitLines(affiliationsText);
    const awards = splitLines(awardsText);
    const courses = splitLines(coursesText);
    const supervision = splitLines(supervisionText);
    const articles = splitLines(articlesText);
    const proceedings = splitLines(proceedingsText);
    const chapters = splitLines(chaptersText);
    const conferences = splitLines(conferencesText);

    if (edu) record.education = edu;
    if (teach) record.teachingExperience = teach;
    if (adminExp) record.administrativeExperience = adminExp;
    if (interests) record.researchInterests = interests;
    if (activeProj) record.activeResearchProjects = activeProj;
    if (prevProj) record.previousResearchProjects = prevProj;
    if (affiliations) record.externalAffiliations = affiliations;
    if (awards) record.awards = awards;
    if (courses) record.conductedCourses = courses;
    if (supervision) record.graduateSupervision = supervision;
    if (articles) record.journalArticles = articles;
    if (proceedings) record.conferenceProceedings = proceedings;
    if (chapters) record.bookChapters = chapters;
    if (conferences) record.conferencesAttended = conferences;

    return record;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2 || designation.trim().length < 2) {
      setError('Full name and designation are required.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updatedPerson = buildPersonRecord();

      if (group === 'chairman') {
        await pustApi.updateDepartment(department.id, {
          chairmanName: updatedPerson.name,
          chairmanProfile: updatedPerson,
        });
      } else if (group === 'faculty') {
        const list = structuredClone(department.facultyMembers || []);
        const idx = person ? list.findIndex((m) => m.id === person.id) : -1;
        if (idx >= 0) {
          list[idx] = updatedPerson;
        } else {
          list.push(updatedPerson);
        }
        await pustApi.updateDepartment(department.id, {
          facultyMembers: list,
        });
      } else if (group === 'contractual') {
        const list = structuredClone(department.contractualFacultyMembers || []);
        const idx = person ? list.findIndex((m) => m.id === person.id) : -1;
        if (idx >= 0) {
          list[idx] = updatedPerson;
        } else {
          list.push(updatedPerson);
        }
        await pustApi.updateDepartment(department.id, {
          contractualFacultyMembers: list,
        });
      } else {
        const list = structuredClone(department.officers || []);
        const idx = person ? list.findIndex((m) => m.id === person.id) : -1;
        if (idx >= 0) {
          list[idx] = updatedPerson;
        } else {
          list.push(updatedPerson);
        }
        await pustApi.updateDepartment(department.id, {
          officers: list,
        });
      }

      await onRefreshDepartments();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save member profile.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!person || group === 'chairman') return;
    setSaving(true);
    setError(null);
    try {
      if (group === 'faculty') {
        const nextList = (department.facultyMembers || []).filter((m) => m.id !== person.id);
        await pustApi.updateDepartment(department.id, { facultyMembers: nextList });
      } else if (group === 'contractual') {
        const nextList = (department.contractualFacultyMembers || []).filter(
          (m) => m.id !== person.id
        );
        await pustApi.updateDepartment(department.id, {
          contractualFacultyMembers: nextList,
        });
      } else {
        const nextList = (department.officers || []).filter((o) => o.id !== person.id);
        await pustApi.updateDepartment(department.id, { officers: nextList });
      }
      await onRefreshDepartments();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove member record.');
    } finally {
      setSaving(false);
    }
  }

  const canDelete = Boolean(person) && group !== 'chairman';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-[#FAF8F4] px-4 py-3 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-2">
        <span>
          <strong className="text-slate-900">Department of {department.name}</strong> ({department.code})
        </span>
        <span className="font-mono text-[11px] uppercase tracking-wider text-pust-800 font-semibold">
          {isNew ? `New ${groupLabel}` : groupLabel}
        </span>
      </div>

      {/* Core Identity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLASS}>Full Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Dr. Md. Khairul Alam"
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>Designation</label>
          <input
            type="text"
            required
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            placeholder="e.g. Professor, Assistant Professor, Lecturer"
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>Office / Room Location</label>
          <input
            type="text"
            value={officeLocation}
            onChange={(e) => setOfficeLocation(e.target.value)}
            placeholder={`${department.building}, Rajapur Campus`}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>Total Publications</label>
          <input
            type="number"
            min={0}
            max={5000}
            value={totalPublications}
            onChange={(e) => setTotalPublications(e.target.value)}
            placeholder="e.g. 24"
            className={`${INPUT_CLASS} font-mono`}
          />
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <input
          id="person-study-leave"
          type="checkbox"
          checked={onStudyLeave}
          onChange={(e) => setOnStudyLeave(e.target.checked)}
          className="w-4 h-4 rounded border-slate-300 text-pust-900 focus:ring-pust-800 cursor-pointer"
        />
        <label htmlFor="person-study-leave" className="text-xs sm:text-sm font-medium text-slate-800 cursor-pointer">
          Currently on approved study leave
        </label>
      </div>

      <CmsImageField
        label="Portrait Photo URL (Optional)"
        value={photoUrl}
        onChange={setPhotoUrl}
        onError={setError}
        placeholder="https://... image URL"
      />

      {/* Qualification & Research */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLASS}>Academic Qualification</label>
          <input
            type="text"
            value={qualification}
            onChange={(e) => setQualification(e.target.value)}
            placeholder="e.g. Ph.D., M.Sc., B.Sc. (Hons.)"
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>Research Area</label>
          <input
            type="text"
            value={researchArea}
            onChange={(e) => setResearchArea(e.target.value)}
            placeholder="e.g. Condensed Matter Physics, AI"
            className={INPUT_CLASS}
          />
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS}>Biography / Profile Overview</label>
        <textarea
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Concise academic biography, research focus, and service highlights..."
          className={INPUT_CLASS}
        />
      </div>

      {/* Contact Phones & Emails */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
        {/* Phones */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Phone Numbers ({phones.length})
            </span>
            {phones.length < 6 && (
              <button
                type="button"
                onClick={() => setPhones((prev) => [...prev, { value: '', type: 'Personal' }])}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Phone
              </button>
            )}
          </div>
          {phones.length === 0 ? (
            <p className="text-xs text-slate-500">No phone numbers listed.</p>
          ) : (
            <div className="space-y-2">
              {phones.map((phone, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={phone.value}
                    onChange={(e) =>
                      setPhones((prev) =>
                        prev.map((p, i) => (i === idx ? { ...p, value: e.target.value } : p))
                      )
                    }
                    placeholder="+88017..."
                    className={`${INPUT_CLASS} font-mono text-xs flex-1`}
                  />
                  <select
                    value={phone.type}
                    onChange={(e) =>
                      setPhones((prev) =>
                        prev.map((p, i) =>
                          i === idx
                            ? { ...p, type: e.target.value as ContactDetailItem['type'] }
                            : p
                        )
                      )
                    }
                    className="px-2 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-800"
                  >
                    {PHONE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    aria-label="Remove phone"
                    onClick={() => setPhones((prev) => prev.filter((_, i) => i !== idx))}
                    className="p-2 rounded-lg text-red-700 hover:bg-red-50 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Emails */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Email Addresses ({emails.length})
            </span>
            {emails.length < 6 && (
              <button
                type="button"
                onClick={() => setEmails((prev) => [...prev, { value: '', type: 'Office' }])}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Email
              </button>
            )}
          </div>
          {emails.length === 0 ? (
            <p className="text-xs text-slate-500">No email addresses listed.</p>
          ) : (
            <div className="space-y-2">
              {emails.map((email, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="email"
                    value={email.value}
                    onChange={(e) =>
                      setEmails((prev) =>
                        prev.map((em, i) => (i === idx ? { ...em, value: e.target.value } : em))
                      )
                    }
                    placeholder="name@pust.ac.bd"
                    className={`${INPUT_CLASS} font-mono text-xs flex-1`}
                  />
                  <select
                    value={email.type === 'Personal' ? 'Personal' : 'Office'}
                    onChange={(e) =>
                      setEmails((prev) =>
                        prev.map((em, i) =>
                          i === idx
                            ? { ...em, type: e.target.value as 'Personal' | 'Office' }
                            : em
                        )
                      )
                    }
                    className="px-2 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-800"
                  >
                    {EMAIL_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    aria-label="Remove email"
                    onClick={() => setEmails((prev) => prev.filter((_, i) => i !== idx))}
                    className="p-2 rounded-lg text-red-700 hover:bg-red-50 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Collapsible Full Academic CV & Publications Lists */}
      <div className="rounded-xl border border-slate-200 bg-[#FAF8F4] overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAdvancedCv((prev) => !prev)}
          aria-expanded={showAdvancedCv}
          className="w-full px-4 py-3 flex items-center justify-between gap-2 text-left text-xs font-semibold uppercase tracking-wider text-pust-900 hover:bg-pust-50/70 transition-colors cursor-pointer"
        >
          <span>Detailed Academic CV &amp; Publications Lists (One Entry Per Line)</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${showAdvancedCv ? 'rotate-180' : ''}`}
          />
        </button>

        {showAdvancedCv && (
          <div className="p-4 border-t border-slate-200 bg-white space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASS}>Education</label>
                <textarea
                  rows={3}
                  value={educationText}
                  onChange={(e) => setEducationText(e.target.value)}
                  placeholder="Ph.D. in ... (Year), University..."
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Teaching Experience</label>
                <textarea
                  rows={3}
                  value={teachingText}
                  onChange={(e) => setTeachingText(e.target.value)}
                  placeholder="Professor (2022–Present)..."
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Administrative Experience</label>
                <textarea
                  rows={3}
                  value={adminExpText}
                  onChange={(e) => setAdminExpText(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Research Interests</label>
                <textarea
                  rows={3}
                  value={researchInterestsText}
                  onChange={(e) => setResearchInterestsText(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Active Research Projects</label>
                <textarea
                  rows={3}
                  value={activeProjectsText}
                  onChange={(e) => setActiveProjectsText(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Previous Research Projects</label>
                <textarea
                  rows={3}
                  value={prevProjectsText}
                  onChange={(e) => setPrevProjectsText(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>External Affiliations</label>
                <textarea
                  rows={3}
                  value={affiliationsText}
                  onChange={(e) => setAffiliationsText(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Awards &amp; Recognition</label>
                <textarea
                  rows={3}
                  value={awardsText}
                  onChange={(e) => setAwardsText(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Conducted Courses</label>
                <textarea
                  rows={3}
                  value={coursesText}
                  onChange={(e) => setCoursesText(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Graduate Supervision</label>
                <textarea
                  rows={3}
                  value={supervisionText}
                  onChange={(e) => setSupervisionText(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div>
                <label className={LABEL_CLASS}>Journal Articles (one citation per line)</label>
                <textarea
                  rows={4}
                  value={articlesText}
                  onChange={(e) => setArticlesText(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>
                  Conference Proceedings (one citation per line)
                </label>
                <textarea
                  rows={3}
                  value={proceedingsText}
                  onChange={(e) => setProceedingsText(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLASS}>Published Book Chapters</label>
                  <textarea
                    rows={3}
                    value={chaptersText}
                    onChange={(e) => setChaptersText(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Conferences &amp; Seminars Attended</label>
                  <textarea
                    rows={3}
                    value={conferencesText}
                    onChange={(e) => setConferencesText(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          {canDelete && !confirmDelete && (
            <button
              type="button"
              disabled={saving}
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-red-300 text-red-700 hover:bg-red-50 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove Member
            </button>
          )}
          {canDelete && confirmDelete && (
            <div className="inline-flex items-center gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={handleDelete}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-red-700 text-white hover:bg-red-800 cursor-pointer"
              >
                Confirm Remove
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => setConfirmDelete(false)}
                className="px-2.5 py-2 rounded-lg text-xs text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5">
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
            {saving ? 'Saving...' : isNew ? 'Add Member' : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
  );
}
