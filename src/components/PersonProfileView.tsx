'use client';

import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowUpRight,
  Award,
  BookOpen,
  Bookmark,
  Building2,
  Check,
  Copy,
  FileText,
  FlaskConical,
  Globe,
  GraduationCap,
  Link2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  QrCode,
  Save,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { pustApi } from '../lib/api';
import {
  findDepartmentPerson,
  getDepartmentPersonHref,
  getInitials,
  matchPersonPublications,
  type PersonRoleCategory,
  sanitizeTelHref,
} from '../lib/departmentPeople';
import { downloadPersonVCard } from '../lib/vcard';
import type {
  ContactDetailItem,
  DepartmentPersonGroup,
  DepartmentPersonRecord,
  DepartmentRecord,
} from '../types/pust';
import { CmsImageField, INPUT_CLASS, LABEL_CLASS } from './admin-edit/shared';
import { EditTriggerButton } from './EditTriggerButton';
import { MotionReveal } from './MotionPrimitives';
import { usePust } from './PustContext';
import { ShareProfileModal } from './ShareProfileModal';

export function PersonThumbnail({
  person,
  size = 'sm',
}: {
  person: DepartmentPersonRecord;
  roleCategory?: PersonRoleCategory;
  size?: 'sm' | 'lg';
}) {
  const portraitSrc = person.photoUrl?.trim() || '';
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const hasError = Boolean(portraitSrc) && failedSrc === portraitSrc;

  useEffect(() => {
    const img = imgRef.current;
    if (portraitSrc && img && img.complete && img.naturalWidth === 0) {
      setFailedSrc(portraitSrc);
    }
  }, [portraitSrc]);

  const sizeClass =
    size === 'lg'
      ? 'w-28 h-28 sm:w-32 sm:h-32 rounded-2xl text-2xl'
      : 'w-14 h-14 sm:w-16 sm:h-16 rounded-xl text-base';

  if (hasError || !portraitSrc) {
    return (
      <div
        className={`${sizeClass} bg-pust-900 text-white font-serif font-semibold flex items-center justify-center shrink-0 shadow-xs border border-pust-800`}
        aria-hidden="true"
      >
        {getInitials(person.name)}
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} overflow-hidden border border-slate-200/90 bg-slate-100 shrink-0 shadow-xs`}
    >
      <img
        ref={imgRef}
        src={portraitSrc}
        alt={`Portrait of ${person.name}`}
        referrerPolicy="no-referrer"
        onError={() => setFailedSrc(portraitSrc)}
        className="w-full h-full object-cover object-top"
      />
    </div>
  );
}

interface DossierTopicSection {
  key: string;
  title: string;
  editableKey?: InlineSectionKey;
  rightSlot?: ReactNode;
  content: ReactNode;
}

type InlineSectionKey =
  | 'identity'
  | 'bio'
  | 'academic-profile'
  | 'education'
  | 'teaching-experience'
  | 'admin-experience'
  | 'research-interests'
  | 'active-projects'
  | 'previous-projects'
  | 'external-affiliations'
  | 'awards'
  | 'conducted-courses'
  | 'graduate-supervision'
  | 'contacts'
  | 'journal-articles'
  | 'conference-proceedings'
  | 'book-chapters'
  | 'conferences-attended';

const PHONE_TYPES: ContactDetailItem['type'][] = ['Personal', 'Office', 'IP Phone', 'PABX'];
const EMAIL_TYPES: Array<'Personal' | 'Office'> = ['Office', 'Personal'];

function splitEntryLines(text: string): string[] | undefined {
  const items = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  return items.length > 0 ? items : undefined;
}

const LIST_SECTION_META: Array<{
  key: Exclude<InlineSectionKey, 'identity' | 'bio' | 'academic-profile' | 'contacts'>;
  field: keyof Pick<
    DepartmentPersonRecord,
    | 'education'
    | 'teachingExperience'
    | 'administrativeExperience'
    | 'researchInterests'
    | 'activeResearchProjects'
    | 'previousResearchProjects'
    | 'externalAffiliations'
    | 'awards'
    | 'conductedCourses'
    | 'graduateSupervision'
    | 'journalArticles'
    | 'conferenceProceedings'
    | 'bookChapters'
    | 'conferencesAttended'
  >;
  label: string;
  placeholder: string;
}> = [
  {
    key: 'education',
    field: 'education',
    label: 'Education',
    placeholder: 'One degree per line, e.g. Ph.D. in Physics (2018), University of Rajshahi',
  },
  {
    key: 'teaching-experience',
    field: 'teachingExperience',
    label: 'Teaching Experience',
    placeholder: 'One appointment per line, e.g. Professor (2023–Present), Dept. of Physics, PUST',
  },
  {
    key: 'admin-experience',
    field: 'administrativeExperience',
    label: 'Administrative & Other Experience',
    placeholder: 'One role per line...',
  },
  {
    key: 'research-interests',
    field: 'researchInterests',
    label: 'Research Interests',
    placeholder: 'One research topic per line...',
  },
  {
    key: 'active-projects',
    field: 'activeResearchProjects',
    label: 'Active Research Projects',
    placeholder: 'One project title/grant per line...',
  },
  {
    key: 'previous-projects',
    field: 'previousResearchProjects',
    label: 'Previous Research Projects',
    placeholder: 'One completed project per line...',
  },
  {
    key: 'external-affiliations',
    field: 'externalAffiliations',
    label: 'External Affiliations',
    placeholder: 'One society, editorial board, or fellowship per line...',
  },
  {
    key: 'awards',
    field: 'awards',
    label: 'Awards & Recognition',
    placeholder: 'One award or scholarship per line...',
  },
  {
    key: 'conducted-courses',
    field: 'conductedCourses',
    label: 'Conducted Courses',
    placeholder: 'One course code/title per line...',
  },
  {
    key: 'graduate-supervision',
    field: 'graduateSupervision',
    label: 'Graduate Supervision',
    placeholder: 'One M.Sc. / M.Phil. / Ph.D. supervision record per line...',
  },
  {
    key: 'journal-articles',
    field: 'journalArticles',
    label: 'Journal Articles',
    placeholder: 'One journal citation per line...',
  },
  {
    key: 'conference-proceedings',
    field: 'conferenceProceedings',
    label: 'Conference Proceedings',
    placeholder: 'One conference paper citation per line...',
  },
  {
    key: 'book-chapters',
    field: 'bookChapters',
    label: 'Published Book Chapters',
    placeholder: 'One book chapter citation per line...',
  },
  {
    key: 'conferences-attended',
    field: 'conferencesAttended',
    label: 'Conferences & Seminars Attended',
    placeholder: 'One conference or seminar per line...',
  },
];

function roleCategoryToGroup(roleCategory: PersonRoleCategory): DepartmentPersonGroup {
  if (roleCategory === 'Chairman') return 'chairman';
  if (roleCategory === 'Faculty Member') return 'faculty';
  if (roleCategory === 'Faculty Member (Contractual)') return 'contractual';
  return 'officer';
}

export function PersonProfileView({
  code,
  personId,
  initialDepartment,
  initialRoleCategory,
}: {
  code: string;
  personId: string;
  initialDepartment: DepartmentRecord;
  initialRoleCategory: PersonRoleCategory;
}) {
  const {
    departments,
    publications,
    user,
    editMode,
    toggleEditMode,
    openEditModal,
    loadDepartments,
  } = usePust();

  const queryClient = useQueryClient();
  const normalizedCode = code.trim().toUpperCase();
  const { data: queriedDepartment } = useQuery({
    queryKey: ['department', normalizedCode],
    queryFn: async () => {
      const res = await pustApi.getDepartmentByCode(normalizedCode);
      return res.department;
    },
    initialData: initialDepartment,
    staleTime: 5 * 60 * 1000,
  });

  const contextDept = departments.find((d) => d.code.toUpperCase() === normalizedCode);
  const department =
    contextDept && contextDept.facultyMembers !== undefined
      ? contextDept
      : queriedDepartment ?? initialDepartment ?? contextDept;

  const resolvedPersonEntry = useMemo(
    () => findDepartmentPerson(department, personId),
    [department, personId]
  );

  const person = resolvedPersonEntry?.person ?? null;
  const roleCategory = resolvedPersonEntry?.roleCategory ?? initialRoleCategory;

  const deptPublications = useMemo(
    () =>
      publications.filter(
        (p) => p.departmentCode.toUpperCase() === department.code.toUpperCase()
      ),
    [publications, department.code]
  );

  const matchedPublications = useMemo(
    () => (person ? matchPersonPublications(person.name, deptPublications) : []),
    [person, deptPublications]
  );

  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [savedQuickContact, setSavedQuickContact] = useState(false);
  const [showAllArticles, setShowAllArticles] = useState(false);
  const [showAllProceedings, setShowAllProceedings] = useState(false);
  const [showAllConferences, setShowAllConferences] = useState(false);
  const [editingSection, setEditingSection] = useState<InlineSectionKey | null>(null);
  const [inlineSaving, setInlineSaving] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const [draftName, setDraftName] = useState('');
  const [draftDesignation, setDraftDesignation] = useState('');
  const [draftOffice, setDraftOffice] = useState('');
  const [draftPhotoUrl, setDraftPhotoUrl] = useState('');
  const [draftTotalPubs, setDraftTotalPubs] = useState('');
  const [draftStudyLeave, setDraftStudyLeave] = useState(false);

  const [draftBio, setDraftBio] = useState('');
  const [draftQualification, setDraftQualification] = useState('');
  const [draftResearchArea, setDraftResearchArea] = useState('');
  const [draftListText, setDraftListText] = useState('');
  const [draftPhones, setDraftPhones] = useState<ContactDetailItem[]>([]);
  const [draftEmails, setDraftEmails] = useState<ContactDetailItem[]>([]);

  const isAdmin = user?.role === 'admin';
  const canEdit = editMode && isAdmin;

  useEffect(() => {
    if (!canEdit) {
      setEditingSection(null);
      setInlineError(null);
    }
  }, [canEdit]);

  const deptHref = `/academics/departments/${encodeURIComponent(department.code.toLowerCase())}`;

  if (!person) {
    return (
      <main className="flex-1 bg-white">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 text-center space-y-4">
          <h1 className="font-serif text-3xl font-medium text-slate-900">Profile Not Found</h1>
          <p className="text-sm text-slate-600">
            The requested faculty or officer profile could not be found in the Department of{' '}
            {department.name}.
          </p>
          <Link
            href={deptHref}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-pust-900 text-white hover:bg-pust-950"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Department of {department.name}
          </Link>
        </section>
      </main>
    );
  }

  const isOfficer = roleCategory === 'Department Officer';
  const officeLocation = person.officeLocation || `${department.building}, Rajapur Campus`;
  const journalArticles = person.journalArticles ?? [];
  const visibleArticles = showAllArticles ? journalArticles : journalArticles.slice(0, 6);
  const conferenceProceedings = person.conferenceProceedings ?? [];
  const visibleProceedings = showAllProceedings
    ? conferenceProceedings
    : conferenceProceedings.slice(0, 6);
  const bookChapters = person.bookChapters ?? [];
  const conferencesAttended = person.conferencesAttended ?? [];
  const visibleConferences = showAllConferences
    ? conferencesAttended
    : conferencesAttended.slice(0, 6);

  async function handleSavePersonInline(updatedPerson: DepartmentPersonRecord) {
    if (!canEdit) return;
    if (roleCategory === 'Chairman') {
      await pustApi.updateDepartment(department.id, {
        chairmanName: updatedPerson.name,
        chairmanProfile: updatedPerson,
      });
    } else if (roleCategory === 'Faculty Member') {
      const list = structuredClone(department.facultyMembers || []);
      const idx = list.findIndex((m) => m.id === updatedPerson.id);
      if (idx >= 0) list[idx] = updatedPerson;
      else list.push(updatedPerson);
      await pustApi.updateDepartment(department.id, { facultyMembers: list });
    } else if (roleCategory === 'Faculty Member (Contractual)') {
      const list = structuredClone(department.contractualFacultyMembers || []);
      const idx = list.findIndex((m) => m.id === updatedPerson.id);
      if (idx >= 0) list[idx] = updatedPerson;
      else list.push(updatedPerson);
      await pustApi.updateDepartment(department.id, { contractualFacultyMembers: list });
    } else {
      const list = structuredClone(department.officers || []);
      const idx = list.findIndex((o) => o.id === updatedPerson.id);
      if (idx >= 0) list[idx] = updatedPerson;
      else list.push(updatedPerson);
      await pustApi.updateDepartment(department.id, { officers: list });
    }
    await Promise.all([
      loadDepartments(),
      queryClient.invalidateQueries({ queryKey: ['department', normalizedCode] }),
    ]);
  }

  async function copyToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Fall through
    }
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(textarea);
      return copied;
    } catch {
      return false;
    }
  }

  async function handleCopyEmail(email: string) {
    const ok = await copyToClipboard(email);
    if (!ok) return;
    setCopiedEmail(email);
    window.setTimeout(() => {
      setCopiedEmail((prev) => (prev === email ? null : prev));
    }, 1800);
  }

  async function handleCopyProfileLink() {
    const url = `${window.location.origin}${getDepartmentPersonHref(department.code, person!.id)}`;
    const ok = await copyToClipboard(url);
    if (!ok) return;
    setCopiedLink(true);
    window.setTimeout(() => {
      setCopiedLink(false);
    }, 2000);
  }

  function handleQuickSaveContact() {
    if (!person) return;
    const url = `${window.location.origin}${getDepartmentPersonHref(department.code, person.id)}`;
    downloadPersonVCard({
      person,
      department,
      profileUrl: url,
    });
    setSavedQuickContact(true);
    window.setTimeout(() => {
      setSavedQuickContact(false);
    }, 2200);
  }

  function startInlineEdit(sectionKey: InlineSectionKey) {
    if (!person) return;
    setInlineError(null);
    if (sectionKey === 'identity') {
      setDraftName(person.name);
      setDraftDesignation(person.designation);
      setDraftOffice(person.officeLocation || '');
      setDraftPhotoUrl(person.photoUrl || '');
      setDraftTotalPubs(
        person.totalPublications !== undefined ? String(person.totalPublications) : ''
      );
      setDraftStudyLeave(Boolean(person.onStudyLeave));
    } else if (sectionKey === 'bio') {
      setDraftBio(person.bio || '');
    } else if (sectionKey === 'academic-profile') {
      setDraftQualification(person.qualification || '');
      setDraftResearchArea(person.researchArea || '');
    } else if (sectionKey === 'contacts') {
      setDraftPhones(structuredClone(person.phones || []));
      setDraftEmails(structuredClone(person.emails || []));
    } else {
      const meta = LIST_SECTION_META.find((item) => item.key === sectionKey);
      const currentList = meta ? person[meta.field] : undefined;
      setDraftListText(currentList && currentList.length > 0 ? currentList.join('\n') : '');
    }
    setEditingSection(sectionKey);
  }

  async function saveInlineSection(sectionKey: InlineSectionKey) {
    if (!person) return;
    setInlineError(null);
    const nextPerson: DepartmentPersonRecord = structuredClone(person);

    if (sectionKey === 'identity') {
      if (draftName.trim().length < 2 || draftDesignation.trim().length < 2) {
        setInlineError('Name and designation are required.');
        return;
      }
      nextPerson.name = draftName.trim();
      nextPerson.designation = draftDesignation.trim();
      if (draftOffice.trim()) nextPerson.officeLocation = draftOffice.trim();
      else delete nextPerson.officeLocation;

      if (draftPhotoUrl.trim()) nextPerson.photoUrl = draftPhotoUrl.trim();
      else delete nextPerson.photoUrl;

      if (draftTotalPubs.trim() !== '' && Number.isFinite(Number(draftTotalPubs))) {
        nextPerson.totalPublications = Math.max(0, Math.round(Number(draftTotalPubs)));
      } else {
        delete nextPerson.totalPublications;
      }

      if (draftStudyLeave) nextPerson.onStudyLeave = true;
      else delete nextPerson.onStudyLeave;
    } else if (sectionKey === 'bio') {
      if (draftBio.trim()) nextPerson.bio = draftBio.trim();
      else delete nextPerson.bio;
    } else if (sectionKey === 'academic-profile') {
      if (draftQualification.trim()) nextPerson.qualification = draftQualification.trim();
      else delete nextPerson.qualification;
      if (draftResearchArea.trim()) nextPerson.researchArea = draftResearchArea.trim();
      else delete nextPerson.researchArea;
    } else if (sectionKey === 'contacts') {
      nextPerson.phones = draftPhones
        .map((p) => ({ value: p.value.trim(), type: p.type }))
        .filter((p) => p.value.length >= 2);
      nextPerson.emails = draftEmails
        .map((e) => ({ value: e.value.trim(), type: e.type }))
        .filter((e) => e.value.length >= 2);
    } else {
      const meta = LIST_SECTION_META.find((item) => item.key === sectionKey);
      if (meta) {
        const parsed = splitEntryLines(draftListText);
        if (parsed) nextPerson[meta.field] = parsed;
        else delete nextPerson[meta.field];
      }
    }

    setInlineSaving(true);
    try {
      await handleSavePersonInline(nextPerson);
      setEditingSection(null);
    } catch (err) {
      setInlineError(err instanceof Error ? err.message : 'Unable to save changes.');
    } finally {
      setInlineSaving(false);
    }
  }

  function renderInlineSaveFooter() {
    return (
      <div className="pt-3 flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          disabled={inlineSaving}
          onClick={() => {
            setEditingSection(null);
            setInlineError(null);
          }}
          className="px-3.5 py-1.5 rounded-lg text-xs font-medium border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={inlineSaving}
          onClick={() => editingSection && saveInlineSection(editingSection)}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-pust-900 text-white hover:bg-pust-950 disabled:opacity-60 cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          {inlineSaving ? 'Saving...' : 'Save Section'}
        </button>
      </div>
    );
  }

  function renderListInlineEditor(metaKey: InlineSectionKey) {
    const meta = LIST_SECTION_META.find((item) => item.key === metaKey);
    return (
      <div className="rounded-xl border border-amber-300 bg-white p-4 space-y-2">
        <label className={LABEL_CLASS}>
          {meta?.label || 'Entries'} (One Entry Per Line)
        </label>
        <textarea
          rows={5}
          value={draftListText}
          onChange={(e) => setDraftListText(e.target.value)}
          placeholder={meta?.placeholder}
          className={INPUT_CLASS}
        />
        {renderInlineSaveFooter()}
      </div>
    );
  }

  const topicSections: DossierTopicSection[] = [];

  if (person.bio || editingSection === 'bio') {
    topicSections.push({
      key: 'bio',
      editableKey: 'bio',
      title: 'Biography',
      content:
        editingSection === 'bio' ? (
          <div className="rounded-xl border border-amber-300 bg-white p-4 space-y-2">
            <label className={LABEL_CLASS}>Biography / Academic Summary</label>
            <textarea
              rows={4}
              value={draftBio}
              onChange={(e) => setDraftBio(e.target.value)}
              placeholder="Academic background, research focus, and departmental service..."
              className={INPUT_CLASS}
            />
            {renderInlineSaveFooter()}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200/85 bg-white px-4 py-3.5">
            <p className="text-sm text-slate-700 leading-relaxed">{person.bio}</p>
          </div>
        ),
    });
  }

  if (person.qualification || person.researchArea || editingSection === 'academic-profile') {
    topicSections.push({
      key: 'academic-profile',
      editableKey: 'academic-profile',
      title: isOfficer ? 'Academic & Service Qualifications' : 'Academic & Research Profile',
      content:
        editingSection === 'academic-profile' ? (
          <div className="rounded-xl border border-amber-300 bg-white p-4 space-y-3">
            <div>
              <label className={LABEL_CLASS}>Qualification</label>
              <input
                type="text"
                value={draftQualification}
                onChange={(e) => setDraftQualification(e.target.value)}
                placeholder="e.g. Ph.D., M.Sc., B.Sc. (Hons.)"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Research Area</label>
              <input
                type="text"
                value={draftResearchArea}
                onChange={(e) => setDraftResearchArea(e.target.value)}
                placeholder="e.g. Condensed Matter Physics, Signal Processing"
                className={INPUT_CLASS}
              />
            </div>
            {renderInlineSaveFooter()}
          </div>
        ) : (
          <dl className="divide-y divide-slate-200 border border-slate-200/85 rounded-xl bg-white text-sm">
            {person.qualification && (
              <div className="px-4 py-3 flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-6">
                <dt className="text-xs font-medium text-slate-500 shrink-0">Qualification</dt>
                <dd className="text-slate-900 sm:text-right leading-relaxed">
                  {person.qualification}
                </dd>
              </div>
            )}
            {person.researchArea && (
              <div className="px-4 py-3 flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-6">
                <dt className="text-xs font-medium text-slate-500 shrink-0">Research Area</dt>
                <dd className="text-slate-900 sm:text-right leading-relaxed">
                  {person.researchArea}
                </dd>
              </div>
            )}
          </dl>
        ),
    });
  }

  if ((person.education && person.education.length > 0) || editingSection === 'education') {
    const count = person.education?.length ?? 0;
    topicSections.push({
      key: 'education',
      editableKey: 'education',
      title: count > 0 ? `Education (${count})` : 'Education',
      content:
        editingSection === 'education' ? (
          renderListInlineEditor('education')
        ) : (
          <ul className="divide-y divide-slate-200 border border-slate-200/85 rounded-xl bg-white text-xs sm:text-sm">
            {(person.education ?? []).map((item, idx) => (
              <li
                key={`${item}-${idx}`}
                className="px-4 py-3 flex items-start gap-3 text-slate-800 leading-relaxed"
              >
                <GraduationCap className="w-4 h-4 text-pust-800 shrink-0 mt-0.5" />
                <span className="flex-1 prose-justify">{item}</span>
              </li>
            ))}
          </ul>
        ),
    });
  }

  if (
    (person.teachingExperience && person.teachingExperience.length > 0) ||
    editingSection === 'teaching-experience'
  ) {
    const count = person.teachingExperience?.length ?? 0;
    topicSections.push({
      key: 'teaching-experience',
      editableKey: 'teaching-experience',
      title: count > 0 ? `Teaching Experience (${count})` : 'Teaching Experience',
      content:
        editingSection === 'teaching-experience' ? (
          renderListInlineEditor('teaching-experience')
        ) : (
          <ul className="divide-y divide-slate-200 border border-slate-200/85 rounded-xl bg-white text-xs sm:text-sm">
            {(person.teachingExperience ?? []).map((item, idx) => (
              <li
                key={`${item}-${idx}`}
                className="px-4 py-3 flex items-start gap-3 text-slate-800 leading-relaxed"
              >
                <BookOpen className="w-4 h-4 text-lapis-700 shrink-0 mt-0.5" />
                <span className="flex-1 prose-justify">{item}</span>
              </li>
            ))}
          </ul>
        ),
    });
  }

  if (
    (person.administrativeExperience && person.administrativeExperience.length > 0) ||
    editingSection === 'admin-experience'
  ) {
    const count = person.administrativeExperience?.length ?? 0;
    topicSections.push({
      key: 'admin-experience',
      editableKey: 'admin-experience',
      title:
        count > 0
          ? `Administrative & Other Experience (${count})`
          : 'Administrative & Other Experience',
      content:
        editingSection === 'admin-experience' ? (
          renderListInlineEditor('admin-experience')
        ) : (
          <ul className="divide-y divide-slate-200 border border-slate-200/85 rounded-xl bg-white text-xs sm:text-sm">
            {(person.administrativeExperience ?? []).map((item, idx) => (
              <li
                key={`${item}-${idx}`}
                className="px-4 py-3 flex items-start gap-3 text-slate-800 leading-relaxed"
              >
                <Building2 className="w-4 h-4 text-pust-700 shrink-0 mt-0.5" />
                <span className="flex-1 prose-justify">{item}</span>
              </li>
            ))}
          </ul>
        ),
    });
  }

  if (
    (person.researchInterests && person.researchInterests.length > 0) ||
    editingSection === 'research-interests'
  ) {
    const count = person.researchInterests?.length ?? 0;
    topicSections.push({
      key: 'research-interests',
      editableKey: 'research-interests',
      title: count > 0 ? `Research Interests (${count})` : 'Research Interests',
      content:
        editingSection === 'research-interests' ? (
          renderListInlineEditor('research-interests')
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {(person.researchInterests ?? []).map((interest, idx) => (
              <div
                key={`${interest}-${idx}`}
                className="px-3.5 py-2.5 rounded-lg border border-slate-200/85 bg-white text-xs sm:text-[13px] text-slate-800 flex items-center gap-2"
              >
                <FlaskConical className="w-3.5 h-3.5 text-pust-800 shrink-0" />
                <span>{interest}</span>
              </div>
            ))}
          </div>
        ),
    });
  }

  if (
    (person.activeResearchProjects && person.activeResearchProjects.length > 0) ||
    editingSection === 'active-projects'
  ) {
    const count = person.activeResearchProjects?.length ?? 0;
    topicSections.push({
      key: 'active-projects',
      editableKey: 'active-projects',
      title: count > 0 ? `Active Research Projects (${count})` : 'Active Research Projects',
      content:
        editingSection === 'active-projects' ? (
          renderListInlineEditor('active-projects')
        ) : (
          <ul className="divide-y divide-slate-200 border border-slate-200/85 rounded-xl bg-white text-xs sm:text-sm">
            {(person.activeResearchProjects ?? []).map((proj, idx) => (
              <li
                key={`${proj}-${idx}`}
                className="px-4 py-3 flex items-start gap-3 text-slate-800 leading-relaxed"
              >
                <FlaskConical className="w-4 h-4 text-pust-800 shrink-0 mt-0.5" />
                <span className="flex-1 prose-justify">{proj}</span>
              </li>
            ))}
          </ul>
        ),
    });
  }

  if (
    (person.previousResearchProjects && person.previousResearchProjects.length > 0) ||
    editingSection === 'previous-projects'
  ) {
    const count = person.previousResearchProjects?.length ?? 0;
    topicSections.push({
      key: 'previous-projects',
      editableKey: 'previous-projects',
      title: count > 0 ? `Previous Research Projects (${count})` : 'Previous Research Projects',
      content:
        editingSection === 'previous-projects' ? (
          renderListInlineEditor('previous-projects')
        ) : (
          <ul className="divide-y divide-slate-200 border border-slate-200/85 rounded-xl bg-white text-xs sm:text-sm">
            {(person.previousResearchProjects ?? []).map((proj, idx) => (
              <li
                key={`${proj}-${idx}`}
                className="px-4 py-3 flex items-start gap-3 text-slate-800 leading-relaxed"
              >
                <FileText className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span className="flex-1 prose-justify">{proj}</span>
              </li>
            ))}
          </ul>
        ),
    });
  }

  if (
    (person.externalAffiliations && person.externalAffiliations.length > 0) ||
    editingSection === 'external-affiliations'
  ) {
    const count = person.externalAffiliations?.length ?? 0;
    topicSections.push({
      key: 'external-affiliations',
      editableKey: 'external-affiliations',
      title: count > 0 ? `External Affiliations (${count})` : 'External Affiliations',
      content:
        editingSection === 'external-affiliations' ? (
          renderListInlineEditor('external-affiliations')
        ) : (
          <ul className="divide-y divide-slate-200 border border-slate-200/85 rounded-xl bg-white text-xs sm:text-sm">
            {(person.externalAffiliations ?? []).map((item, idx) => (
              <li
                key={`${item}-${idx}`}
                className="px-4 py-3 flex items-start gap-3 text-slate-800 leading-relaxed"
              >
                <Globe className="w-4 h-4 text-lapis-700 shrink-0 mt-0.5" />
                <span className="flex-1 prose-justify">{item}</span>
              </li>
            ))}
          </ul>
        ),
    });
  }

  if ((person.awards && person.awards.length > 0) || editingSection === 'awards') {
    const count = person.awards?.length ?? 0;
    topicSections.push({
      key: 'awards',
      editableKey: 'awards',
      title: count > 0 ? `Awards & Recognition (${count})` : 'Awards & Recognition',
      content:
        editingSection === 'awards' ? (
          renderListInlineEditor('awards')
        ) : (
          <ul className="divide-y divide-slate-200 border border-slate-200/85 rounded-xl bg-white text-xs sm:text-sm">
            {(person.awards ?? []).map((item, idx) => (
              <li
                key={`${item}-${idx}`}
                className="px-4 py-3 flex items-start gap-3 text-slate-800 leading-relaxed"
              >
                <Award className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span className="flex-1 prose-justify">{item}</span>
              </li>
            ))}
          </ul>
        ),
    });
  }

  if (
    (person.conductedCourses && person.conductedCourses.length > 0) ||
    editingSection === 'conducted-courses'
  ) {
    const count = person.conductedCourses?.length ?? 0;
    topicSections.push({
      key: 'conducted-courses',
      editableKey: 'conducted-courses',
      title: count > 0 ? `Conducted Courses (${count})` : 'Conducted Courses',
      content:
        editingSection === 'conducted-courses' ? (
          renderListInlineEditor('conducted-courses')
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {(person.conductedCourses ?? []).map((course, idx) => (
              <div
                key={`${course}-${idx}`}
                className="px-3.5 py-2.5 rounded-lg border border-slate-200/85 bg-white text-xs sm:text-[13px] text-slate-800 flex items-center gap-2"
              >
                <Bookmark className="w-3.5 h-3.5 text-lapis-700 shrink-0" />
                <span>{course}</span>
              </div>
            ))}
          </div>
        ),
    });
  }

  if (
    (person.graduateSupervision && person.graduateSupervision.length > 0) ||
    editingSection === 'graduate-supervision'
  ) {
    const count = person.graduateSupervision?.length ?? 0;
    topicSections.push({
      key: 'graduate-supervision',
      editableKey: 'graduate-supervision',
      title: count > 0 ? `Graduate Supervision (${count})` : 'Graduate Supervision',
      content:
        editingSection === 'graduate-supervision' ? (
          renderListInlineEditor('graduate-supervision')
        ) : (
          <ol className="divide-y divide-slate-200 border border-slate-200/85 rounded-xl bg-white text-xs sm:text-[13px]">
            {(person.graduateSupervision ?? []).map((thesis, idx) => (
              <li key={`${thesis}-${idx}`} className="px-4 py-3 flex items-start gap-3">
                <span className="font-mono text-[11px] font-semibold text-pust-800 tabular-nums shrink-0 mt-0.5">
                  {String(idx + 1).padStart(2, '0')}.
                </span>
                <span className="flex-1 text-slate-800 leading-relaxed prose-justify">
                  {thesis}
                </span>
              </li>
            ))}
          </ol>
        ),
    });
  }

  topicSections.push({
    key: 'contacts',
    editableKey: 'contacts',
    title: 'Official & Personal Contacts',
    content:
      editingSection === 'contacts' ? (
        <div className="rounded-xl border border-amber-300 bg-white p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Phones ({draftPhones.length})
                </span>
                {draftPhones.length < 6 && (
                  <button
                    type="button"
                    onClick={() =>
                      setDraftPhones((prev) => [...prev, { value: '', type: 'Personal' }])
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Phone
                  </button>
                )}
              </div>
              {draftPhones.map((phone, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={phone.value}
                    onChange={(e) =>
                      setDraftPhones((prev) =>
                        prev.map((p, i) => (i === idx ? { ...p, value: e.target.value } : p))
                      )
                    }
                    placeholder="+88017..."
                    className={`${INPUT_CLASS} font-mono text-xs flex-1`}
                  />
                  <select
                    value={phone.type}
                    onChange={(e) =>
                      setDraftPhones((prev) =>
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
                    onClick={() => setDraftPhones((prev) => prev.filter((_, i) => i !== idx))}
                    className="p-2 rounded-lg text-red-700 hover:bg-red-50 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Emails ({draftEmails.length})
                </span>
                {draftEmails.length < 6 && (
                  <button
                    type="button"
                    onClick={() =>
                      setDraftEmails((prev) => [...prev, { value: '', type: 'Office' }])
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Email
                  </button>
                )}
              </div>
              {draftEmails.map((email, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="email"
                    value={email.value}
                    onChange={(e) =>
                      setDraftEmails((prev) =>
                        prev.map((em, i) => (i === idx ? { ...em, value: e.target.value } : em))
                      )
                    }
                    placeholder="name@pust.ac.bd"
                    className={`${INPUT_CLASS} font-mono text-xs flex-1`}
                  />
                  <select
                    value={email.type === 'Personal' ? 'Personal' : 'Office'}
                    onChange={(e) =>
                      setDraftEmails((prev) =>
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
                    onClick={() => setDraftEmails((prev) => prev.filter((_, i) => i !== idx))}
                    className="p-2 rounded-lg text-red-700 hover:bg-red-50 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          {renderInlineSaveFooter()}
        </div>
      ) : person.phones.length === 0 && person.emails.length === 0 ? (
        <p className="text-xs text-slate-600 rounded-xl border border-slate-200/85 bg-white px-4 py-3">
          Direct personal contacts have not been listed. Use the departmental office contact
          {department.contactEmail ? ` (${department.contactEmail})` : ''} for inquiries.
        </p>
      ) : (
        <div className="divide-y divide-slate-200 border border-slate-200/85 rounded-xl bg-white text-xs sm:text-sm">
          {person.phones.map((phone, idx) => (
            <div
              key={`${phone.value}-${idx}`}
              className="px-4 py-3 flex flex-wrap items-center justify-between gap-3"
            >
              <a
                href={`tel:${sanitizeTelHref(phone.value)}`}
                className="inline-flex items-center gap-2 font-mono text-slate-900 hover:text-pust-900 hover:underline tabular-nums"
              >
                <Phone className="w-4 h-4 text-pust-700 shrink-0" />
                <span>{phone.value}</span>
              </a>
              <span className="font-mono text-xs text-slate-500">{phone.type}</span>
            </div>
          ))}
          {person.emails.map((email, idx) => {
            const isCopied = copiedEmail === email.value;
            return (
              <div
                key={`${email.value}-${idx}`}
                className="px-4 py-3 flex flex-wrap items-center justify-between gap-3"
              >
                <a
                  href={`mailto:${email.value}`}
                  className="inline-flex items-center gap-2 font-mono text-lapis-900 hover:text-pust-900 hover:underline break-all min-w-0"
                >
                  <Mail className="w-4 h-4 text-lapis-700 shrink-0" />
                  <span>{email.value}</span>
                </a>
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="font-mono text-xs text-slate-500">{email.type}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyEmail(email.value)}
                    aria-label={`Copy ${email.value}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 bg-[#FAF8F4] text-[11px] font-sans font-medium text-slate-700 hover:border-pust-800 hover:text-pust-900 transition-colors cursor-pointer"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-700" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ),
  });

  if (journalArticles.length > 0 || editingSection === 'journal-articles') {
    topicSections.push({
      key: 'journal-articles',
      editableKey: 'journal-articles',
      title:
        journalArticles.length > 0
          ? `Journal Articles (${journalArticles.length})`
          : 'Journal Articles',
      rightSlot:
        editingSection !== 'journal-articles' && journalArticles.length > 6 ? (
          <button
            type="button"
            onClick={() => setShowAllArticles((prev) => !prev)}
            className="text-xs font-semibold text-pust-900 hover:underline cursor-pointer"
          >
            {showAllArticles
              ? 'Show fewer articles'
              : `Show all ${journalArticles.length} articles`}
          </button>
        ) : undefined,
      content:
        editingSection === 'journal-articles' ? (
          renderListInlineEditor('journal-articles')
        ) : (
          <ol className="divide-y divide-slate-200 border border-slate-200/85 rounded-xl bg-white text-xs sm:text-[13px]">
            {visibleArticles.map((article, idx) => (
              <li
                key={`${idx}-${article.slice(0, 32)}`}
                className="px-4 py-3 flex items-start gap-3"
              >
                <span className="font-mono text-[11px] font-semibold text-pust-800 tabular-nums shrink-0 mt-0.5">
                  {String(idx + 1).padStart(2, '0')}.
                </span>
                <span className="flex-1 text-slate-800 leading-relaxed break-words prose-justify">
                  {article}
                </span>
              </li>
            ))}
          </ol>
        ),
    });
  }

  if (conferenceProceedings.length > 0 || editingSection === 'conference-proceedings') {
    topicSections.push({
      key: 'conference-proceedings',
      editableKey: 'conference-proceedings',
      title:
        conferenceProceedings.length > 0
          ? `Conference Proceedings (${conferenceProceedings.length})`
          : 'Conference Proceedings',
      rightSlot:
        editingSection !== 'conference-proceedings' && conferenceProceedings.length > 6 ? (
          <button
            type="button"
            onClick={() => setShowAllProceedings((prev) => !prev)}
            className="text-xs font-semibold text-lapis-900 hover:underline cursor-pointer"
          >
            {showAllProceedings
              ? 'Show fewer proceedings'
              : `Show all ${conferenceProceedings.length} proceedings`}
          </button>
        ) : undefined,
      content:
        editingSection === 'conference-proceedings' ? (
          renderListInlineEditor('conference-proceedings')
        ) : (
          <ol className="divide-y divide-slate-200 border border-slate-200/85 rounded-xl bg-white text-xs sm:text-[13px]">
            {visibleProceedings.map((item, idx) => (
              <li
                key={`${idx}-${item.slice(0, 32)}`}
                className="px-4 py-3 flex items-start gap-3"
              >
                <span className="font-mono text-[11px] font-semibold text-lapis-800 tabular-nums shrink-0 mt-0.5">
                  {String(idx + 1).padStart(2, '0')}.
                </span>
                <span className="flex-1 text-slate-800 leading-relaxed break-words prose-justify">
                  {item}
                </span>
              </li>
            ))}
          </ol>
        ),
    });
  }

  if (bookChapters.length > 0 || editingSection === 'book-chapters') {
    topicSections.push({
      key: 'book-chapters',
      editableKey: 'book-chapters',
      title:
        bookChapters.length > 0
          ? `Published Book Chapters (${bookChapters.length})`
          : 'Published Book Chapters',
      content:
        editingSection === 'book-chapters' ? (
          renderListInlineEditor('book-chapters')
        ) : (
          <ol className="divide-y divide-slate-200 border border-slate-200/85 rounded-xl bg-white text-xs sm:text-[13px]">
            {bookChapters.map((item, idx) => (
              <li
                key={`${idx}-${item.slice(0, 32)}`}
                className="px-4 py-3 flex items-start gap-3"
              >
                <span className="font-mono text-[11px] font-semibold text-pust-800 tabular-nums shrink-0 mt-0.5">
                  {String(idx + 1).padStart(2, '0')}.
                </span>
                <span className="flex-1 text-slate-800 leading-relaxed break-words prose-justify">
                  {item}
                </span>
              </li>
            ))}
          </ol>
        ),
    });
  }

  if (conferencesAttended.length > 0 || editingSection === 'conferences-attended') {
    topicSections.push({
      key: 'conferences-attended',
      editableKey: 'conferences-attended',
      title:
        conferencesAttended.length > 0
          ? `Conferences & Seminars Attended (${conferencesAttended.length})`
          : 'Conferences & Seminars Attended',
      rightSlot:
        editingSection !== 'conferences-attended' && conferencesAttended.length > 6 ? (
          <button
            type="button"
            onClick={() => setShowAllConferences((prev) => !prev)}
            className="text-xs font-semibold text-pust-900 hover:underline cursor-pointer"
          >
            {showAllConferences
              ? 'Show fewer conferences'
              : `Show all ${conferencesAttended.length} entries`}
          </button>
        ) : undefined,
      content:
        editingSection === 'conferences-attended' ? (
          renderListInlineEditor('conferences-attended')
        ) : (
          <ol className="divide-y divide-slate-200 border border-slate-200/85 rounded-xl bg-white text-xs sm:text-[13px]">
            {visibleConferences.map((item, idx) => (
              <li
                key={`${idx}-${item.slice(0, 32)}`}
                className="px-4 py-3 flex items-start gap-3"
              >
                <span className="font-mono text-[11px] font-semibold text-slate-600 tabular-nums shrink-0 mt-0.5">
                  {String(idx + 1).padStart(2, '0')}.
                </span>
                <span className="flex-1 text-slate-800 leading-relaxed break-words prose-justify">
                  {item}
                </span>
              </li>
            ))}
          </ol>
        ),
    });
  }

  if (matchedPublications.length > 0) {
    topicSections.push({
      key: 'dept-publications',
      title: `Indexed Departmental Publications (${matchedPublications.length})`,
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {matchedPublications.map((pub) => (
            <div
              key={pub.id}
              className="p-4 rounded-xl border border-slate-200/85 bg-white space-y-1.5"
            >
              <p className="font-mono text-[11px] text-pust-800">
                {pub.year} · {pub.domain}
              </p>
              <h4 className="font-serif text-base font-medium text-slate-900 leading-snug">
                {pub.title}
              </h4>
              <p className="text-xs text-slate-600">{pub.authors}</p>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-0.5">
                <span className="text-slate-500">{pub.venue}</span>
                {pub.url && (
                  <a
                    href={pub.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono font-semibold text-pust-900 hover:underline"
                  >
                    DOI
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ),
    });
  }

  const missingEditableTopics: Array<{ key: InlineSectionKey; label: string }> = [];
  if (canEdit) {
    if (!person.bio && editingSection !== 'bio') {
      missingEditableTopics.push({ key: 'bio', label: 'Biography' });
    }
    if (!person.qualification && !person.researchArea && editingSection !== 'academic-profile') {
      missingEditableTopics.push({
        key: 'academic-profile',
        label: 'Qualification & Research Area',
      });
    }
    for (const meta of LIST_SECTION_META) {
      const existing = person[meta.field];
      if ((!existing || existing.length === 0) && editingSection !== meta.key) {
        missingEditableTopics.push({ key: meta.key, label: meta.label });
      }
    }
  }

  const primaryPhone = person.phones[0]?.value;
  const primaryEmail = person.emails[0]?.value;

  return (
    <main className="flex-1 bg-white">
      {/* Sticky Sub-Header Action Bar */}
      <div className="border-b border-slate-200 bg-[#FAF9F6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={deptHref}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-pust-900 hover:underline underline-offset-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Department of {department.name}
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && !canEdit && (
              <button
                type="button"
                onClick={toggleEditMode}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 border border-amber-400 text-amber-950 hover:bg-amber-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5 shrink-0" />
                Enable Edit Mode
              </button>
            )}
            {canEdit && (
              <EditTriggerButton
                label="Edit Full Profile"
                variant="compact"
                onClick={() =>
                  openEditModal({
                    kind: 'department-person',
                    department,
                    group: roleCategoryToGroup(roleCategory),
                    person,
                  })
                }
              />
            )}
            <button
              type="button"
              onClick={() => setShareModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-pust-900 text-white hover:bg-pust-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 shrink-0" />
              <span>Share Profile</span>
            </button>
            <button
              type="button"
              onClick={handleCopyProfileLink}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                copiedLink
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-white border-pust-800/25 text-pust-900 hover:bg-pust-900 hover:text-white hover:border-pust-900'
              }`}
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>Link Copied</span>
                </>
              ) : (
                <>
                  <Link2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Copy Profile Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-8">
        {inlineError && (
          <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-xs sm:text-sm text-red-900">
            {inlineError}
          </div>
        )}

        {/* Executive Hero Profile Card */}
        <div className="rounded-2xl border border-stone-200 bg-gradient-to-br from-[#FAF8F4] via-white to-[#F4F7FF] p-6 sm:p-8 space-y-6 shadow-xs">
          {editingSection === 'identity' ? (
            <div className="rounded-xl border border-amber-300 bg-white p-4 sm:p-5 space-y-4">
              <p className="font-mono text-xs uppercase tracking-wider font-semibold text-amber-900">
                Edit Profile Identity &amp; Status
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLASS}>Full Name</label>
                  <input
                    type="text"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Designation</label>
                  <input
                    type="text"
                    value={draftDesignation}
                    onChange={(e) => setDraftDesignation(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Office / Room Location</label>
                  <input
                    type="text"
                    value={draftOffice}
                    onChange={(e) => setDraftOffice(e.target.value)}
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
                    value={draftTotalPubs}
                    onChange={(e) => setDraftTotalPubs(e.target.value)}
                    className={`${INPUT_CLASS} font-mono`}
                  />
                </div>
              </div>
              <CmsImageField
                label="Portrait Photo URL"
                value={draftPhotoUrl}
                onChange={setDraftPhotoUrl}
                onError={setInlineError}
                placeholder="https://... image URL"
              />
              <div className="flex items-center gap-2.5">
                <input
                  id="page-study-leave"
                  type="checkbox"
                  checked={draftStudyLeave}
                  onChange={(e) => setDraftStudyLeave(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-pust-900 cursor-pointer"
                />
                <label
                  htmlFor="page-study-leave"
                  className="text-xs sm:text-sm text-slate-800 cursor-pointer"
                >
                  Currently on approved study leave
                </label>
              </div>
              {renderInlineSaveFooter()}
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-7 min-w-0">
                <PersonThumbnail person={person} roleCategory={roleCategory} size="lg" />
                <div className="min-w-0 space-y-2">
                  <p className="font-mono text-xs uppercase tracking-widest text-pust-800 font-semibold">
                    {department.code} · {roleCategory}
                  </p>
                  <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-slate-950 leading-tight">
                    {person.name}
                  </h1>
                  <p className="text-base sm:text-lg font-medium text-pust-900">
                    {person.designation}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600">
                    <Link href={deptHref} className="font-medium text-slate-800 hover:text-pust-900 hover:underline">
                      Department of {department.name}
                    </Link>
                    {' · '}
                    {department.faculty}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                {primaryEmail && (
                  <a
                    href={`mailto:${primaryEmail}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold bg-pust-900 text-white hover:bg-pust-950 transition-colors whitespace-nowrap"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Send Email
                  </a>
                )}
                {primaryPhone && (
                  <a
                    href={`tel:${sanitizeTelHref(primaryPhone)}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold bg-white border border-stone-300 text-slate-900 hover:border-pust-700 hover:text-pust-900 transition-colors whitespace-nowrap"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Call Office
                  </a>
                )}
                <button
                  type="button"
                  onClick={handleQuickSaveContact}
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap cursor-pointer ${
                    savedQuickContact
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-white border-stone-300 text-slate-900 hover:border-pust-700 hover:text-pust-900'
                  }`}
                >
                  {savedQuickContact ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Saved Contact
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      Save Contact
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShareModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#FAF8F4] border border-pust-800/30 text-pust-900 hover:bg-pust-900 hover:text-white hover:border-pust-900 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  Share QR
                </button>
                {canEdit && (
                  <EditTriggerButton
                    label="Edit Identity"
                    variant="compact"
                    onClick={() => startInlineEdit('identity')}
                  />
                )}
              </div>
            </div>
          )}

          {/* Quick Fact Ribbon */}
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-xl bg-white/95 border border-slate-200/90 p-4 text-sm shadow-2xs">
            <div>
              <dt className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
                Department &amp; Wing
              </dt>
              <dd className="text-slate-900 mt-1 font-medium inline-flex items-start gap-1.5 text-xs sm:text-[13px]">
                <MapPin className="w-3.5 h-3.5 text-pust-800 shrink-0 mt-0.5" />
                <span>{officeLocation}</span>
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
                Duty Status
              </dt>
              <dd className="text-slate-900 mt-1 font-medium text-xs sm:text-[13px]">
                {person.onStudyLeave
                  ? 'On Approved Study Leave'
                  : person.designation.includes('(PRL)')
                  ? 'Post-Retirement Leave (PRL)'
                  : 'Active Departmental Service'}
              </dd>
            </div>
            {!isOfficer && person.totalPublications !== undefined && (
              <div>
                <dt className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
                  Total Publications
                </dt>
                <dd className="font-mono text-lg font-semibold text-pust-900 tabular-nums mt-0.5">
                  {person.totalPublications}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Topic Dossier Sections */}
        <div className="space-y-5">
          {topicSections.map((section, idx) => {
            const isLapisBand = idx % 2 === 1;
            const isEditingThis =
              section.editableKey !== undefined && editingSection === section.editableKey;
            return (
              <MotionReveal key={section.key} distance={20} delay={Math.min(idx * 0.03, 0.15)}>
                <section
                  className={`rounded-2xl border p-5 sm:p-6 space-y-3.5 ${
                    isLapisBand
                      ? 'bg-[#F3F6FA] border-lapis-200/80'
                      : 'bg-white border-stone-200'
                  }`}
                >
                  <div
                    className={`flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b ${
                      isLapisBand ? 'border-lapis-200/80' : 'border-stone-200'
                    }`}
                  >
                    <h2
                      className={`font-mono text-xs uppercase tracking-widest font-semibold ${
                        isLapisBand ? 'text-lapis-800' : 'text-pust-800'
                      }`}
                    >
                      {section.title}
                    </h2>
                    <div className="flex items-center gap-2.5">
                      {section.rightSlot}
                      {canEdit && section.editableKey && !isEditingThis && (
                        <EditTriggerButton
                          label="Edit"
                          variant="compact"
                          onClick={() => startInlineEdit(section.editableKey!)}
                        />
                      )}
                    </div>
                  </div>
                  {section.content}
                </section>
              </MotionReveal>
            );
          })}

          {canEdit && missingEditableTopics.length > 0 && (
            <MotionReveal distance={18}>
              <div className="rounded-2xl border border-dashed border-amber-400/80 bg-amber-50/45 p-4 sm:p-5 space-y-3">
                <p className="font-mono text-[11px] uppercase tracking-wider font-semibold text-amber-900">
                  Add Missing Profile Sections
                </p>
                <div className="flex flex-wrap gap-2">
                  {missingEditableTopics.map((topic) => (
                    <button
                      key={topic.key}
                      type="button"
                      onClick={() => startInlineEdit(topic.key)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-amber-300 text-amber-950 hover:bg-amber-100 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {topic.label}
                    </button>
                  ))}
                </div>
              </div>
            </MotionReveal>
          )}
        </div>

        {/* Footer Return Row */}
        <MotionReveal distance={16}>
          <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-xs text-slate-500">
              PUST {department.code} Directory Record
            </p>
            <Link
              href={deptHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold bg-pust-900 text-white hover:bg-pust-950 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              All Teachers &amp; Officers of {department.code}
            </Link>
          </div>
        </MotionReveal>
      </section>

      <ShareProfileModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        person={person}
        department={department}
        roleCategory={roleCategory}
      />
    </main>
  );
}
