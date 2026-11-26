'use client';

import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
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
  Save,
  Search,
  Sparkles,
  Trash2,
  UserCheck,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { pustApi } from '../lib/api';
import type {
  ContactDetailItem,
  DepartmentPersonGroup,
  DepartmentPersonRecord,
  DepartmentRecord,
  PublicationRecord,
} from '../types/pust';
import { CmsImageField, INPUT_CLASS, LABEL_CLASS } from './admin-edit/shared';
import { EditTriggerButton } from './EditTriggerButton';
import { MotionCard } from './MotionPrimitives';
import { usePust } from './PustContext';

type PersonRoleCategory =
  | 'Chairman'
  | 'Faculty Member'
  | 'Faculty Member (Contractual)'
  | 'Department Officer';

interface ActiveProfileState {
  person: DepartmentPersonRecord;
  roleCategory: PersonRoleCategory;
}

const PORTRAIT_SENIOR_PROF =
  '/src/assets/images/faculty_portrait_senior_prof_1795622511157.jpg';
const PORTRAIT_MALE_SCHOLAR =
  '/src/assets/images/faculty_portrait_male_scholar_1795622511678.jpg';
const PORTRAIT_FEMALE_PROF =
  '/src/assets/images/faculty_portrait_female_prof_1795622512182.jpg';
const PORTRAIT_YOUNG_LECTURER =
  '/src/assets/images/faculty_portrait_young_lecturer_1795622512478.jpg';
const PORTRAIT_OFFICER =
  '/src/assets/images/officer_portrait_admin_1795622513333.jpg';

const FEMALE_NAME_HINTS = [
  'tahmina',
  'laila',
  'sabba',
  'maliha',
  'nadia',
  'rosni',
  'asma',
  'rebeka',
  'shahanaz',
  'naima',
  'tasnim',
  'nahar',
  'arzumand',
  'banu',
  'nishat',
  'afrin',
  'hoque',
  'ruhi',
  'fatema',
  'nusrat',
  'sultana',
  'farhana',
  'sharmeen',
  'khatun',
  'begum',
  'akter',
  'akhter',
  'kaniz',
  'mousumi',
  'kumary',
  'sumi',
  'marzia',
  'iffat',
  'taskin',
  'turna',
  'khaleda',
  'farjana',
  'humayra',
  'anjum',
  'jinnat',
  'rehana',
  'munni',
  'audity',
  'jannat',
  'ferdousi',
  'sarjana',
  'zannatuge',
  'nurunnahar',
  'reshma',
  'shakila',
  'tasmina',
  'soma',
  'khadezatul',
  'kobra',
  'nesrin',
  'pervin',
  'tabassum',
  'saimunnahar',
  'ritu',
  'tanzila',
  'aktar',
  'nurzahan',
  'mira',
  'sonia',
  'rubia',
  'yasmin',
  'sumaia',
  'mehnaz',
  'sanjida',
  'shayla',
  'jahan',
  'nova',
  'sabiha',
  'sangida',
  'shammy',
  'rahena',
  'parvin',
  'arjuna',
  'sraboni',
  'mahfuza',
  'fariha',
  'jannatul',
];

function getInitials(name: string): string {
  const cleaned = name
    .replace(/\b(Prof\.?|Dr\.?|Md\.?|Mst\.?|Engr\.?|A\.H\.M\.?|T\.H\.M\.?|S\.M\.?)\b/gi, '')
    .trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'PU';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function sanitizeTelHref(rawPhone: string): string {
  const withoutNotes = rawPhone.replace(/\([^)]*\)/g, '').trim();
  const digits = withoutNotes.replace(/[^+\d]/g, '');
  return digits || rawPhone.replace(/\s+/g, '');
}

function resolvePersonPortrait(
  person: DepartmentPersonRecord,
  roleCategory: PersonRoleCategory
): string {
  if (person.photoUrl && person.photoUrl.trim()) {
    return person.photoUrl.trim();
  }
  const lowerName = person.name.toLowerCase();
  if (FEMALE_NAME_HINTS.some((hint) => lowerName.includes(hint))) {
    return PORTRAIT_FEMALE_PROF;
  }
  if (roleCategory === 'Department Officer') {
    return PORTRAIT_OFFICER;
  }
  const lowerDesig = person.designation.toLowerCase();
  if (
    roleCategory === 'Chairman' ||
    (lowerDesig.includes('professor') &&
      !lowerDesig.includes('associate') &&
      !lowerDesig.includes('assistant'))
  ) {
    return PORTRAIT_SENIOR_PROF;
  }
  if (lowerDesig.includes('associate professor')) {
    return PORTRAIT_MALE_SCHOLAR;
  }
  return PORTRAIT_YOUNG_LECTURER;
}

function matchPersonPublications(
  personName: string,
  deptPublications: PublicationRecord[]
): PublicationRecord[] {
  const cleanedTokens = personName
    .replace(/\b(Prof\.?|Dr\.?|Md\.?|Mst\.?|Engr\.?)\b/gi, '')
    .replace(/[.,]/g, ' ')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length >= 3);

  if (cleanedTokens.length === 0) return [];
  const lastName = cleanedTokens[cleanedTokens.length - 1];
  const firstMeaningful = cleanedTokens[0];

  return deptPublications.filter((pub) => {
    const authorsLower = pub.authors.toLowerCase();
    if (authorsLower.includes(cleanedTokens.join(' '))) return true;
    if (lastName.length >= 4 && authorsLower.includes(lastName)) {
      if (cleanedTokens.length === 1) return true;
      return (
        authorsLower.includes(firstMeaningful) ||
        authorsLower.includes(`${firstMeaningful[0]}.`) ||
        authorsLower.includes(` ${firstMeaningful[0]} `)
      );
    }
    return false;
  });
}

function PersonThumbnail({
  person,
  roleCategory,
  size = 'sm',
}: {
  person: DepartmentPersonRecord;
  roleCategory: PersonRoleCategory;
  size?: 'sm' | 'lg';
}) {
  const portraitSrc = resolvePersonPortrait(person, roleCategory);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const hasError = failedSrc === portraitSrc;

  useEffect(() => {
    const img = imgRef.current;
    if (portraitSrc && img && img.complete && img.naturalWidth === 0) {
      setFailedSrc(portraitSrc);
    }
  }, [portraitSrc]);

  const sizeClass =
    size === 'lg'
      ? 'w-24 h-24 sm:w-28 sm:h-28 rounded-2xl text-2xl'
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

function PersonProfileCard({
  person,
  roleCategory,
  accentClass,
  delay = 0,
  canEdit = false,
  onViewProfile,
  onEditPerson,
}: {
  person: DepartmentPersonRecord;
  roleCategory: PersonRoleCategory;
  accentClass: string;
  delay?: number;
  canEdit?: boolean;
  onViewProfile: (person: DepartmentPersonRecord, roleCategory: PersonRoleCategory) => void;
  onEditPerson?: (person: DepartmentPersonRecord, roleCategory: PersonRoleCategory) => void;
}) {
  const hasPersonalInfo =
    Boolean(person.qualification) ||
    Boolean(person.researchArea) ||
    person.totalPublications !== undefined;

  return (
    <MotionCard
      delay={delay}
      className={`rounded-2xl border ${accentClass} p-5 sm:p-6 shadow-xs flex flex-col justify-between gap-5`}
    >
      <div className="space-y-4">
        {/* Identity Header with Small Framed Photo */}
        <div className="flex items-start gap-4">
          <PersonThumbnail person={person} roleCategory={roleCategory} size="sm" />
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-lg sm:text-xl font-medium text-slate-900 leading-snug">
              {person.name}
            </h3>
            <p className="text-xs sm:text-sm font-medium text-pust-900 mt-0.5 leading-snug">
              {person.designation}
            </p>
            {person.onStudyLeave && (
              <p className="font-mono text-[11px] text-amber-800 mt-1">
                Status · On Study Leave
              </p>
            )}
          </div>
        </div>

        {/* Contact Details */}
        {(person.phones.length > 0 || person.emails.length > 0) && (
          <div className="pt-3 border-t border-slate-200/80 space-y-2">
            <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
              Contact Details
            </p>
            <div className="space-y-1.5 text-xs sm:text-[13px]">
              {person.phones.map((phone, idx) => (
                <div key={`${phone.value}-${idx}`} className="flex items-center justify-between gap-3">
                  <a
                    href={`tel:${sanitizeTelHref(phone.value)}`}
                    className="inline-flex items-center gap-2 font-mono text-slate-800 hover:text-pust-900 hover:underline tabular-nums min-w-0 truncate"
                  >
                    <Phone className="w-3.5 h-3.5 text-pust-700 shrink-0" />
                    <span className="truncate">{phone.value}</span>
                  </a>
                  <span className="font-mono text-[11px] text-slate-500 shrink-0">
                    ({phone.type})
                  </span>
                </div>
              ))}
              {person.emails.map((email, idx) => (
                <div key={`${email.value}-${idx}`} className="flex items-center justify-between gap-3">
                  <a
                    href={`mailto:${email.value}`}
                    className="inline-flex items-center gap-2 font-mono text-slate-800 hover:text-pust-900 hover:underline min-w-0 truncate"
                  >
                    <Mail className="w-3.5 h-3.5 text-lapis-700 shrink-0" />
                    <span className="truncate">{email.value}</span>
                  </a>
                  <span className="font-mono text-[11px] text-slate-500 shrink-0">
                    ({email.type})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Personal Information */}
        {hasPersonalInfo && (
          <div className="pt-3 border-t border-slate-200/80 space-y-2">
            <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
              Personal Information
            </p>
            <dl className="space-y-1.5 text-xs sm:text-[13px]">
              {person.qualification && (
                <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-4">
                  <dt className="text-slate-500 shrink-0">Qualification</dt>
                  <dd className="text-slate-800 sm:text-right leading-relaxed line-clamp-2">
                    {person.qualification}
                  </dd>
                </div>
              )}
              {person.researchArea && (
                <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-4">
                  <dt className="text-slate-500 shrink-0">Research Area</dt>
                  <dd className="text-slate-800 sm:text-right leading-relaxed line-clamp-2">
                    {person.researchArea}
                  </dd>
                </div>
              )}
              {person.totalPublications !== undefined && (
                <div className="flex items-center justify-between gap-4 pt-1">
                  <dt className="text-slate-500">Total Publications</dt>
                  <dd className="font-mono font-semibold text-pust-900 tabular-nums">
                    {person.totalPublications}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>

      {/* Card Footer Action: View Profile & Admin Edit */}
      <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2.5">
        <span className="font-mono text-[11px] text-slate-500 truncate">
          {roleCategory}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {canEdit && onEditPerson && (
            <EditTriggerButton
              label="Edit"
              variant="compact"
              onClick={() => onEditPerson(person, roleCategory)}
            />
          )}
          <button
            type="button"
            onClick={() => onViewProfile(person, roleCategory)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-pust-800/30 text-pust-900 hover:bg-pust-900 hover:text-white hover:border-pust-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
          >
            <UserRound className="w-3.5 h-3.5 shrink-0" />
            View Profile
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>
      </div>
    </MotionCard>
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

function PersonProfileModal({
  activeProfile,
  department,
  deptPublications,
  isAdmin = false,
  canEdit = false,
  onToggleEditMode,
  onSavePerson,
  onEditPerson,
  onClose,
}: {
  activeProfile: ActiveProfileState | null;
  department: DepartmentRecord;
  deptPublications: PublicationRecord[];
  isAdmin?: boolean;
  canEdit?: boolean;
  onToggleEditMode?: () => void;
  onSavePerson?: (
    updatedPerson: DepartmentPersonRecord,
    roleCategory: PersonRoleCategory
  ) => Promise<void>;
  onEditPerson?: () => void;
  onClose: () => void;
}) {
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showAllArticles, setShowAllArticles] = useState(false);
  const [showAllProceedings, setShowAllProceedings] = useState(false);
  const [showAllConferences, setShowAllConferences] = useState(false);
  const [editingSection, setEditingSection] = useState<InlineSectionKey | null>(null);
  const [inlineSaving, setInlineSaving] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  // Inline Identity state
  const [draftName, setDraftName] = useState('');
  const [draftDesignation, setDraftDesignation] = useState('');
  const [draftOffice, setDraftOffice] = useState('');
  const [draftPhotoUrl, setDraftPhotoUrl] = useState('');
  const [draftTotalPubs, setDraftTotalPubs] = useState('');
  const [draftStudyLeave, setDraftStudyLeave] = useState(false);

  // Inline Bio / Academic / List / Contacts state
  const [draftBio, setDraftBio] = useState('');
  const [draftQualification, setDraftQualification] = useState('');
  const [draftResearchArea, setDraftResearchArea] = useState('');
  const [draftListText, setDraftListText] = useState('');
  const [draftPhones, setDraftPhones] = useState<ContactDetailItem[]>([]);
  const [draftEmails, setDraftEmails] = useState<ContactDetailItem[]>([]);

  const scrollBodyRef = useRef<HTMLDivElement | null>(null);
  const heroNameRef = useRef<HTMLHeadingElement | null>(null);
  const activePersonId = activeProfile?.person.id ?? null;

  useEffect(() => {
    setShowAllArticles(false);
    setShowAllProceedings(false);
    setShowAllConferences(false);
    setCopiedLink(false);
    setIsScrolled(false);
    setEditingSection(null);
    setInlineError(null);
    if (scrollBodyRef.current) {
      scrollBodyRef.current.scrollTop = 0;
    }
  }, [activePersonId]);

  useEffect(() => {
    if (!canEdit) {
      setEditingSection(null);
      setInlineError(null);
    }
  }, [canEdit]);

  useEffect(() => {
    if (!activeProfile) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (document.querySelector('[aria-labelledby="admin-edit-modal-title"]')) {
          return;
        }
        if (editingSection) {
          setEditingSection(null);
          setInlineError(null);
          return;
        }
        onClose();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [activeProfile, editingSection, onClose]);

  const matchedPublications = useMemo(() => {
    if (!activeProfile) return [];
    return matchPersonPublications(activeProfile.person.name, deptPublications);
  }, [activeProfile, deptPublications]);

  function handleBodyScroll() {
    const scroller = scrollBodyRef.current;
    const heroName = heroNameRef.current;
    if (!scroller || !heroName) return;
    const scrollerRect = scroller.getBoundingClientRect();
    const nameRect = heroName.getBoundingClientRect();
    setIsScrolled(nameRect.bottom <= scrollerRect.top + 8);
  }

  if (!activeProfile) return null;

  const { person, roleCategory } = activeProfile;
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
  const visibleConferences = showAllConferences ? conferencesAttended : conferencesAttended.slice(0, 6);

  async function copyToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Fall through to execCommand fallback
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
    const url = `${window.location.origin}/academics/departments/${encodeURIComponent(
      department.code
    )}?profile=${encodeURIComponent(person.id)}`;
    const ok = await copyToClipboard(url);
    if (!ok) return;
    setCopiedLink(true);
    window.setTimeout(() => {
      setCopiedLink(false);
    }, 2000);
  }

  function startInlineEdit(sectionKey: InlineSectionKey) {
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
    if (!onSavePerson) return;
    setInlineError(null);

    const nextPerson: DepartmentPersonRecord = structuredClone(person);

    if (sectionKey === 'identity') {
      if (draftName.trim().length < 2 || draftDesignation.trim().length < 2) {
        setInlineError('Name and designation are required.');
        return;
      }
      nextPerson.name = draftName.trim();
      nextPerson.designation = draftDesignation.trim();
      if (draftOffice.trim()) {
        nextPerson.officeLocation = draftOffice.trim();
      } else {
        delete nextPerson.officeLocation;
      }
      if (draftPhotoUrl.trim()) {
        nextPerson.photoUrl = draftPhotoUrl.trim();
      } else {
        delete nextPerson.photoUrl;
      }
      if (draftTotalPubs.trim() !== '' && Number.isFinite(Number(draftTotalPubs))) {
        nextPerson.totalPublications = Math.max(0, Math.round(Number(draftTotalPubs)));
      } else {
        delete nextPerson.totalPublications;
      }
      if (draftStudyLeave) {
        nextPerson.onStudyLeave = true;
      } else {
        delete nextPerson.onStudyLeave;
      }
    } else if (sectionKey === 'bio') {
      if (draftBio.trim()) {
        nextPerson.bio = draftBio.trim();
      } else {
        delete nextPerson.bio;
      }
    } else if (sectionKey === 'academic-profile') {
      if (draftQualification.trim()) {
        nextPerson.qualification = draftQualification.trim();
      } else {
        delete nextPerson.qualification;
      }
      if (draftResearchArea.trim()) {
        nextPerson.researchArea = draftResearchArea.trim();
      } else {
        delete nextPerson.researchArea;
      }
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
        if (parsed) {
          nextPerson[meta.field] = parsed;
        } else {
          delete nextPerson[meta.field];
        }
      }
    }

    setInlineSaving(true);
    try {
      await onSavePerson(nextPerson, roleCategory);
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
                <dd className="text-slate-900 sm:text-right leading-relaxed">{person.qualification}</dd>
              </div>
            )}
            {person.researchArea && (
              <div className="px-4 py-3 flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-6">
                <dt className="text-xs font-medium text-slate-500 shrink-0">Research Area</dt>
                <dd className="text-slate-900 sm:text-right leading-relaxed">{person.researchArea}</dd>
              </div>
            )}
          </dl>
        ),
    });
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
                <span className="flex-1 text-slate-800 leading-relaxed prose-justify">{thesis}</span>
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
              <li key={`${idx}-${article.slice(0, 32)}`} className="px-4 py-3 flex items-start gap-3">
                <span className="font-mono text-[11px] font-semibold text-pust-800 tabular-nums shrink-0 mt-0.5">
                  {String(idx + 1).padStart(2, '0')}.
                </span>
                <span className="flex-1 text-slate-800 leading-relaxed break-words prose-justify">{article}</span>
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
              <li key={`${idx}-${item.slice(0, 32)}`} className="px-4 py-3 flex items-start gap-3">
                <span className="font-mono text-[11px] font-semibold text-lapis-800 tabular-nums shrink-0 mt-0.5">
                  {String(idx + 1).padStart(2, '0')}.
                </span>
                <span className="flex-1 text-slate-800 leading-relaxed break-words prose-justify">{item}</span>
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
              <li key={`${idx}-${item.slice(0, 32)}`} className="px-4 py-3 flex items-start gap-3">
                <span className="font-mono text-[11px] font-semibold text-pust-800 tabular-nums shrink-0 mt-0.5">
                  {String(idx + 1).padStart(2, '0')}.
                </span>
                <span className="flex-1 text-slate-800 leading-relaxed break-words prose-justify">{item}</span>
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
              <li key={`${idx}-${item.slice(0, 32)}`} className="px-4 py-3 flex items-start gap-3">
                <span className="font-mono text-[11px] font-semibold text-slate-600 tabular-nums shrink-0 mt-0.5">
                  {String(idx + 1).padStart(2, '0')}.
                </span>
                <span className="flex-1 text-slate-800 leading-relaxed break-words prose-justify">{item}</span>
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="person-profile-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl rounded-2xl bg-white border border-slate-200 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pinned 1-Line Sticky Top Bar */}
        <div className="shrink-0 h-14 px-5 sm:px-8 border-b border-slate-200 bg-white flex items-center justify-between gap-3 z-20">
          <div className="min-w-0 flex-1 flex items-center gap-2.5">
            {isScrolled ? (
              <p
                title={`${person.name} · ${person.designation} · Dept. of ${department.name}`}
                className="min-w-0 truncate whitespace-nowrap leading-none"
              >
                <span className="font-serif text-base sm:text-lg font-semibold text-slate-900">
                  {person.name}
                </span>
                <span className="hidden sm:inline font-sans text-xs sm:text-[13px] font-medium text-pust-900">
                  {' · '}
                  {person.designation}
                </span>
                <span className="hidden md:inline font-sans text-xs sm:text-[13px] text-slate-600">
                  {' · Dept. of '}
                  {department.name}
                </span>
              </p>
            ) : (
              <p className="font-mono text-[11px] uppercase tracking-widest text-pust-800 font-semibold truncate whitespace-nowrap">
                {department.code} · {roleCategory} Dossier
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isAdmin && !canEdit && onToggleEditMode && (
              <button
                type="button"
                onClick={onToggleEditMode}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 border border-amber-400 text-amber-950 hover:bg-amber-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5 shrink-0" />
                <span>Enable Edit Mode</span>
              </button>
            )}
            {canEdit && onEditPerson && (
              <EditTriggerButton
                label="Edit Full Profile"
                variant="compact"
                onClick={onEditPerson}
              />
            )}
            <button
              type="button"
              onClick={handleCopyProfileLink}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                copiedLink
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-[#FAF8F4] border-pust-800/25 text-pust-900 hover:bg-pust-900 hover:text-white hover:border-pust-900'
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
                  <span className="hidden sm:inline">Copy Link to Profile</span>
                  <span className="sm:hidden">Copy Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close profile dossier"
              className="min-w-[36px] min-h-[36px] inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Dossier Body */}
        <div
          ref={scrollBodyRef}
          onScroll={handleBodyScroll}
          className="flex-1 overflow-y-auto overscroll-contain"
        >
          {inlineError && (
            <div className="mx-5 sm:mx-8 mt-4 p-3 rounded-lg border border-red-200 bg-red-50 text-xs sm:text-sm text-red-900">
              {inlineError}
            </div>
          )}

          {/* Executive Hero Profile Header */}
          <div className="px-5 sm:px-8 py-6 border-b border-slate-200 bg-gradient-to-br from-[#FAF8F4] via-white to-[#F4F7FF] space-y-5">
            {editingSection === 'identity' ? (
              <div className="rounded-xl border border-amber-300 bg-white p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-xs uppercase tracking-wider font-semibold text-amber-900">
                    Edit Profile Identity &amp; Status
                  </p>
                </div>
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
                  placeholder="/src/assets/images/... or https://..."
                />
                <div className="flex items-center gap-2.5">
                  <input
                    id="inline-study-leave"
                    type="checkbox"
                    checked={draftStudyLeave}
                    onChange={(e) => setDraftStudyLeave(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-pust-900 cursor-pointer"
                  />
                  <label htmlFor="inline-study-leave" className="text-xs sm:text-sm text-slate-800 cursor-pointer">
                    Currently on approved study leave
                  </label>
                </div>
                {renderInlineSaveFooter()}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 min-w-0">
                  <PersonThumbnail person={person} roleCategory={roleCategory} size="lg" />
                  <div className="min-w-0 space-y-1.5">
                    <p className="font-mono text-[11px] uppercase tracking-widest text-pust-800 font-semibold">
                      {department.code} · {roleCategory}
                    </p>
                    <h2
                      ref={heroNameRef}
                      id="person-profile-modal-title"
                      className="font-serif text-2xl sm:text-3xl font-medium text-slate-900 leading-tight"
                    >
                      {person.name}
                    </h2>
                    <p className="text-sm sm:text-base font-medium text-pust-900">
                      {person.designation}
                    </p>
                    <p className="text-xs sm:text-[13px] text-slate-600">
                      Department of {department.name} · {department.faculty}
                    </p>
                  </div>
                </div>

                {canEdit && (
                  <EditTriggerButton
                    label="Edit Identity"
                    variant="compact"
                    onClick={() => startInlineEdit('identity')}
                  />
                )}
              </div>
            )}

            {/* Quick Fact Ribbon */}
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-xl bg-white/90 border border-slate-200/90 p-4 text-sm shadow-2xs">
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

          {/* Alternating Topic Sections */}
          <div className="p-5 sm:p-8 space-y-5">
            {topicSections.map((section, idx) => {
              const isWarmCrimson = idx % 2 === 0;
              const isEditingThis =
                section.editableKey !== undefined && editingSection === section.editableKey;
              return (
                <section
                  key={section.key}
                  className={`rounded-2xl border p-5 sm:p-6 space-y-3.5 ${
                    isWarmCrimson
                      ? 'bg-[#FAF8F4] border-pust-200/80'
                      : 'bg-[#F4F7FF] border-lapis-200/80'
                  }`}
                >
                  <div
                    className={`flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b ${
                      isWarmCrimson ? 'border-pust-200/75' : 'border-lapis-200/80'
                    }`}
                  >
                    <h3
                      className={`inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest font-semibold ${
                        isWarmCrimson ? 'text-pust-900' : 'text-lapis-900'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`w-1.5 h-4 rounded-full shrink-0 ${
                          isWarmCrimson ? 'bg-pust-800' : 'bg-lapis-700'
                        }`}
                      />
                      {section.title}
                    </h3>
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
              );
            })}

            {canEdit && missingEditableTopics.length > 0 && (
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
            )}

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-[11px] text-slate-500">
                PUST {department.code} Directory Record
              </p>
              <div className="flex items-center gap-2.5">
                {canEdit && onEditPerson && (
                  <EditTriggerButton
                    label="Edit All Fields"
                    variant="default"
                    onClick={onEditPerson}
                  />
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-lg text-sm font-medium bg-pust-900 text-white hover:bg-pust-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DepartmentDetailView({
  code,
  initialDepartment,
}: {
  code: string;
  initialDepartment?: DepartmentRecord;
}) {
  const {
    departments,
    publications,
    notices,
    user,
    bookmarkedIds,
    editMode,
    toggleEditMode,
    openEditModal,
    navigateTo,
    setActiveNotice,
    loadDepartments,
    loadBookmarks,
  } = usePust();

  const [designationFilter, setDesignationFilter] = useState<string>('All');
  const [memberQuery, setMemberQuery] = useState('');
  const [bookmarkBusy, setBookmarkBusy] = useState(false);
  const [activeProfile, setActiveProfile] = useState<ActiveProfileState | null>(null);

  const searchParams = useSearchParams();
  const requestedProfileId = searchParams.get('profile');
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
      : queriedDepartment ?? initialDepartment ?? contextDept ?? null;

  const facultyMembers = useMemo(
    () => department?.facultyMembers ?? [],
    [department?.facultyMembers]
  );
  const contractualFaculty = useMemo(
    () => department?.contractualFacultyMembers ?? [],
    [department?.contractualFacultyMembers]
  );
  const officers = useMemo(
    () => department?.officers ?? [],
    [department?.officers]
  );

  const designationOptions = useMemo(() => {
    const base = new Set<string>(['All']);
    for (const member of facultyMembers) {
      if (member.designation.toLowerCase().includes('associate professor')) {
        base.add('Associate Professor');
      } else if (member.designation.toLowerCase().includes('assistant professor')) {
        base.add('Assistant Professor');
      } else if (member.designation.toLowerCase().includes('professor')) {
        base.add('Professor');
      } else if (member.designation.toLowerCase().includes('lecturer')) {
        base.add('Lecturer');
      }
    }
    return Array.from(base);
  }, [facultyMembers]);

  const filteredFaculty = useMemo(() => {
    const q = memberQuery.trim().toLowerCase();
    return facultyMembers.filter((member) => {
      const desig = member.designation.toLowerCase();
      const matchesRole =
        designationFilter === 'All' ||
        (designationFilter === 'Professor' &&
          desig.includes('professor') &&
          !desig.includes('associate') &&
          !desig.includes('assistant')) ||
        (designationFilter === 'Associate Professor' && desig.includes('associate professor')) ||
        (designationFilter === 'Assistant Professor' && desig.includes('assistant professor')) ||
        (designationFilter === 'Lecturer' && desig.includes('lecturer'));

      const matchesQ =
        !q ||
        member.name.toLowerCase().includes(q) ||
        member.designation.toLowerCase().includes(q) ||
        (member.researchArea || '').toLowerCase().includes(q) ||
        (member.qualification || '').toLowerCase().includes(q) ||
        member.emails.some((e) => e.value.toLowerCase().includes(q));

      return matchesRole && matchesQ;
    });
  }, [facultyMembers, designationFilter, memberQuery]);

  const deptPublications = useMemo(
    () =>
      department
        ? publications.filter((p) => p.departmentCode.toUpperCase() === department.code.toUpperCase())
        : [],
    [publications, department]
  );

  const deptNotices = useMemo(
    () =>
      department
        ? notices.filter((n) => n.departmentCode.toUpperCase() === department.code.toUpperCase())
        : [],
    [notices, department]
  );

  useEffect(() => {
    if (!department) return;
    if (!requestedProfileId) {
      setActiveProfile(null);
      return;
    }

    const chairRecord: DepartmentPersonRecord = department.chairmanProfile ?? {
      id: `${department.id}-chair`,
      name: department.chairmanName,
      designation: 'Chairman',
      phones: department.contactPhone ? [{ value: department.contactPhone, type: 'Office' }] : [],
      emails: department.contactEmail ? [{ value: department.contactEmail, type: 'Office' }] : [],
    };

    if (chairRecord.id === requestedProfileId) {
      setActiveProfile({ person: chairRecord, roleCategory: 'Chairman' });
      return;
    }
    const fac = (department.facultyMembers ?? []).find((m) => m.id === requestedProfileId);
    if (fac) {
      setActiveProfile({ person: fac, roleCategory: 'Faculty Member' });
      return;
    }
    const cfac = (department.contractualFacultyMembers ?? []).find(
      (m) => m.id === requestedProfileId
    );
    if (cfac) {
      setActiveProfile({ person: cfac, roleCategory: 'Faculty Member (Contractual)' });
      return;
    }
    const off = (department.officers ?? []).find((o) => o.id === requestedProfileId);
    if (off) {
      setActiveProfile({ person: off, roleCategory: 'Department Officer' });
    }
  }, [department, requestedProfileId]);

  const handleCloseProfile = useCallback(() => {
    setActiveProfile(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.has('profile')) {
        url.searchParams.delete('profile');
        window.history.replaceState(null, '', url.toString());
      }
    }
  }, []);

  const liveActiveProfile = useMemo<ActiveProfileState | null>(() => {
    if (!activeProfile || !department) return activeProfile;
    const { person, roleCategory } = activeProfile;
    if (roleCategory === 'Chairman') {
      const chair = department.chairmanProfile ?? person;
      return { person: chair, roleCategory };
    }
    if (roleCategory === 'Faculty Member') {
      const found = (department.facultyMembers ?? []).find((m) => m.id === person.id);
      return found ? { person: found, roleCategory } : null;
    }
    if (roleCategory === 'Faculty Member (Contractual)') {
      const found = (department.contractualFacultyMembers ?? []).find((m) => m.id === person.id);
      return found ? { person: found, roleCategory } : null;
    }
    const found = (department.officers ?? []).find((o) => o.id === person.id);
    return found ? { person: found, roleCategory } : null;
  }, [activeProfile, department]);

  if (!department) {
    return (
      <main className="flex-1 bg-white">
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
          <h1 className="font-serif text-3xl font-medium text-slate-900">
            Department Not Found
          </h1>
          <p className="text-sm text-slate-600">
            The requested department record ({normalizedCode}) is unavailable.
          </p>
          <Link
            href="/academics/departments"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-pust-900 text-white hover:bg-pust-950"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Departments
          </Link>
        </section>
      </main>
    );
  }

  const isBookmarked = bookmarkedIds.has(department.id);
  const chairman: DepartmentPersonRecord = department.chairmanProfile ?? {
    id: `${department.id}-chair`,
    name: department.chairmanName,
    designation: 'Chairman',
    phones: department.contactPhone
      ? [{ value: department.contactPhone, type: 'Office' }]
      : [],
    emails: department.contactEmail
      ? [{ value: department.contactEmail, type: 'Office' }]
      : [],
  };

  const isAdmin = user?.role === 'admin';
  const canAdminEdit = editMode && isAdmin;

  async function handleSavePersonInline(
    updatedPerson: DepartmentPersonRecord,
    roleCategory: PersonRoleCategory
  ) {
    if (!department || !canAdminEdit) return;
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
    setActiveProfile({ person: updatedPerson, roleCategory });
    await Promise.all([
      loadDepartments(),
      queryClient.invalidateQueries({ queryKey: ['department', normalizedCode] }),
    ]);
  }

  function roleCategoryToGroup(roleCategory: PersonRoleCategory): DepartmentPersonGroup {
    if (roleCategory === 'Chairman') return 'chairman';
    if (roleCategory === 'Faculty Member') return 'faculty';
    if (roleCategory === 'Faculty Member (Contractual)') return 'contractual';
    return 'officer';
  }

  function handleEditPerson(
    person: DepartmentPersonRecord | null,
    roleCategory: PersonRoleCategory
  ) {
    if (!department || !canAdminEdit) return;
    openEditModal({
      kind: 'department-person',
      department,
      group: roleCategoryToGroup(roleCategory),
      person,
    });
  }

  function handleOpenProfile(
    person: DepartmentPersonRecord,
    roleCategory: PersonRoleCategory
  ) {
    setActiveProfile({ person, roleCategory });
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('profile', person.id);
      window.history.replaceState(null, '', url.toString());
    }
  }

  async function handleToggleBookmark() {
    if (!department || bookmarkBusy) return;
    if (!user) {
      navigateTo('/portal');
      return;
    }
    setBookmarkBusy(true);
    try {
      const { pustApi } = await import('../lib/api');
      if (isBookmarked) {
        await pustApi.removeBookmark(department.id);
      } else {
        await pustApi.addBookmark({
          itemType: 'department',
          itemId: department.id,
          title: `Department of ${department.name} (${department.code})`,
          subtitle: department.faculty,
        });
      }
      await loadBookmarks();
    } finally {
      setBookmarkBusy(false);
    }
  }

  return (
    <main className="flex-1 bg-white">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 space-y-12">
        {/* Top Action & Header Band */}
        <div className="border-b border-slate-200 pb-8 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/academics/departments"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-pust-900 hover:underline underline-offset-4"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              All Academic Departments
            </Link>

            <div className="flex flex-wrap items-center gap-2.5">
              {editMode && user?.role === 'admin' && (
                <EditTriggerButton
                  onClick={() => openEditModal({ kind: 'department', department })}
                  label="Edit Department"
                  variant="compact"
                />
              )}
              <button
                type="button"
                disabled={bookmarkBusy}
                onClick={handleToggleBookmark}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-pust-800/35 bg-[#F7F7F5] text-pust-900 hover:bg-pust-900 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
              >
                {isBookmarked ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                {user
                  ? isBookmarked
                    ? 'Saved in Portal'
                    : 'Bookmark Department'
                  : 'Sign in to Bookmark'}
              </button>
            </div>
          </div>

          <div className="space-y-2.5 max-w-4xl">
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-pust-700">
              {department.officialCode ? `Dept Code ${department.officialCode} · ` : ''}
              {department.code} · {department.faculty}
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-semibold text-slate-950 tracking-tight leading-tight">
              Department of {department.name}
            </h1>
            <p className="text-[15.5px] sm:text-base text-slate-700 leading-[1.72]">
              {department.summary}
            </p>
          </div>
        </div>

        {/* Chairman & Department at a Glance */}
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-950">
              Teachers of Department of {department.name}
            </h2>
            <p className="font-mono text-xs font-medium text-slate-600 tabular-nums">
              {department.facultyCount
                ? `Total Teacher: ${department.facultyCount}`
                : facultyMembers.length > 0
                ? `Total Teacher: ${facultyMembers.length}`
                : department.building}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Chairman Card */}
            <div className="lg:col-span-7 flex flex-col">
              <PersonProfileCard
                person={chairman}
                roleCategory="Chairman"
                accentClass="card-gradient-crimson border-pust-200/90 h-full"
                canEdit={canAdminEdit}
                onViewProfile={handleOpenProfile}
                onEditPerson={handleEditPerson}
              />
            </div>

            {/* Department at a Glance */}
            <div className="lg:col-span-5">
              <MotionCard
                delay={0.04}
                className="rounded-2xl border border-amber-900/15 card-gradient-parchment p-5 sm:p-6 shadow-xs h-full flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-pust-700 shrink-0" />
                    <h3 className="font-mono text-xs uppercase tracking-widest font-semibold text-pust-700">
                      Department at a Glance
                    </h3>
                  </div>

                  <dl className="divide-y divide-slate-200/80 text-xs sm:text-[13px]">
                    {department.contactPhone && (
                      <div className="py-2.5 flex items-center justify-between gap-4">
                        <dt className="text-slate-700 font-medium">Contact</dt>
                        <dd className="font-mono font-semibold text-slate-950 tabular-nums text-right">
                          <a
                            href={`tel:${sanitizeTelHref(department.contactPhone)}`}
                            className="hover:text-pust-800 hover:underline"
                          >
                            {department.contactPhone}
                          </a>
                        </dd>
                      </div>
                    )}
                    {department.contactEmail && (
                      <div className="py-2.5 flex items-center justify-between gap-4">
                        <dt className="text-slate-700 font-medium">Email</dt>
                        <dd className="font-mono font-semibold text-lapis-800 text-right truncate">
                          <a
                            href={`mailto:${department.contactEmail}`}
                            className="hover:text-pust-800 hover:underline"
                          >
                            {department.contactEmail}
                          </a>
                        </dd>
                      </div>
                    )}
                    {(department.facultyCount !== undefined || facultyMembers.length > 0) && (
                      <div className="py-2.5 flex items-center justify-between gap-4">
                        <dt className="text-slate-700 font-medium">Total Teacher</dt>
                        <dd className="font-mono font-semibold text-pust-800 tabular-nums text-right">
                          {department.facultyCount ?? facultyMembers.length}
                        </dd>
                      </div>
                    )}
                    <div className="py-2.5 flex items-center justify-between gap-4">
                      <dt className="text-slate-700 font-medium">Established &amp; Code</dt>
                      <dd className="font-mono font-semibold text-slate-950 tabular-nums text-right">
                        {department.established}
                        {department.officialCode ? ` · Code ${department.officialCode}` : ''}
                      </dd>
                    </div>
                    <div className="py-2.5 flex items-center justify-between gap-4">
                      <dt className="text-slate-700 font-medium">Annual Intake</dt>
                      <dd className="font-mono font-medium text-slate-900 tabular-nums text-right">
                        {department.intakeSeats} Undergraduate Seats
                      </dd>
                    </div>
                    <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                      <dt className="text-slate-600 shrink-0">Degree Programs</dt>
                      <dd className="font-medium text-slate-900 sm:text-right">
                        {department.degrees.join(' · ')}
                      </dd>
                    </div>
                    <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                      <dt className="text-slate-600 shrink-0">Location</dt>
                      <dd className="font-medium text-slate-900 sm:text-right">
                        {department.building}, Rajapur Campus
                      </dd>
                    </div>
                    {department.researchTotal !== undefined && (
                      <div className="py-2.5 flex items-center justify-between gap-4">
                        <dt className="text-slate-600">Research Index</dt>
                        <dd className="font-mono font-semibold text-sage-800 tabular-nums text-right">
                          {department.researchTotal.toLocaleString('en-US')} Indexed Works
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </MotionCard>
            </div>
          </div>
        </div>

        {/* Faculty Members */}
        <div id="faculty-members" className="space-y-6 pt-2 border-t border-slate-200">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-lapis-800 shrink-0" />
                <p className="font-mono text-xs uppercase tracking-widest text-lapis-800 font-semibold">
                  Academic Roster
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-serif text-2xl sm:text-3xl font-medium text-slate-900">
                  Faculty Members
                </h2>
                {canAdminEdit && (
                  <EditTriggerButton
                    icon="add"
                    label="Add Teacher"
                    variant="compact"
                    onClick={() => handleEditPerson(null, 'Faculty Member')}
                  />
                )}
              </div>
            </div>

            {facultyMembers.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {designationOptions.length > 2 && (
                  <div className="flex flex-wrap gap-1.5">
                    {designationOptions.map((roleOpt) => (
                      <button
                        key={roleOpt}
                        type="button"
                        onClick={() => setDesignationFilter(roleOpt)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          designationFilter === roleOpt
                            ? 'bg-pust-900 text-white'
                            : 'bg-[#F7F7F5] border border-slate-200 text-slate-700 hover:border-pust-700/50 hover:text-pust-900'
                        }`}
                      >
                        {roleOpt}
                      </button>
                    ))}
                  </div>
                )}

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={memberQuery}
                    onChange={(e) => setMemberQuery(e.target.value)}
                    placeholder="Filter by name or research..."
                    aria-label="Filter faculty members"
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-700 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {facultyMembers.length === 0 ? (
            <div className="p-8 rounded-2xl border border-slate-200 bg-[#F7F7F5] text-sm text-slate-600 prose-justify">
              Individual faculty profiles for the Department of {department.name} have not been
              published yet.
              {department.facultyCount ? ` Departmental faculty strength: ${department.facultyCount} teachers.` : ''}
            </div>
          ) : filteredFaculty.length === 0 ? (
            <div className="p-8 rounded-2xl border border-slate-200 bg-[#F7F7F5] text-center space-y-3">
              <p className="text-sm text-slate-700">
                No faculty members matched your current designation filter or search query.
              </p>
              <button
                type="button"
                onClick={() => {
                  setDesignationFilter('All');
                  setMemberQuery('');
                }}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-pust-900 text-white cursor-pointer"
              >
                Reset Faculty Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredFaculty.map((member, idx) => (
                <PersonProfileCard
                  key={member.id}
                  person={member}
                  roleCategory="Faculty Member"
                  delay={(idx % 6) * 0.03}
                  accentClass={
                    idx % 2 === 0
                      ? 'card-gradient-lapis border-lapis-200/80 hover:border-lapis-600/45'
                      : 'card-gradient-sage border-sage-200/80 hover:border-sage-600/45'
                  }
                  canEdit={canAdminEdit}
                  onViewProfile={handleOpenProfile}
                  onEditPerson={handleEditPerson}
                />
              ))}
            </div>
          )}
        </div>

        {/* Faculty Members (Contractual) */}
        <div className="space-y-4 pt-2 border-t border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <GraduationCap className="w-4 h-4 text-gold-700 shrink-0" />
              <h2 className="font-serif text-xl sm:text-2xl font-medium text-slate-900">
                Faculty Members (Contractual)
              </h2>
              {canAdminEdit && (
                <EditTriggerButton
                  icon="add"
                  label="Add Contractual"
                  variant="compact"
                  onClick={() => handleEditPerson(null, 'Faculty Member (Contractual)')}
                />
              )}
            </div>
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              {contractualFaculty.length} Listed
            </span>
          </div>

          {contractualFaculty.length === 0 ? (
            <div className="px-5 py-4 rounded-xl border border-slate-200 bg-[#F7F7F5] text-xs sm:text-sm text-slate-600 prose-justify">
              No contractual faculty members are currently listed for the Department of{' '}
              {department.name}.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {contractualFaculty.map((member, idx) => (
                <PersonProfileCard
                  key={member.id}
                  person={member}
                  roleCategory="Faculty Member (Contractual)"
                  delay={idx * 0.03}
                  accentClass="card-gradient-gold border-gold-200/80"
                  canEdit={canAdminEdit}
                  onViewProfile={handleOpenProfile}
                  onEditPerson={handleEditPerson}
                />
              ))}
            </div>
          )}
        </div>

        {/* Officers */}
        <div className="space-y-4 pt-2 border-t border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <UserCheck className="w-4 h-4 text-pust-800 shrink-0" />
              <h2 className="font-serif text-xl sm:text-2xl font-medium text-slate-900">
                Officers
              </h2>
              {canAdminEdit && (
                <EditTriggerButton
                  icon="add"
                  label="Add Officer"
                  variant="compact"
                  onClick={() => handleEditPerson(null, 'Department Officer')}
                />
              )}
            </div>
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              {officers.length} {officers.length === 1 ? 'Officer' : 'Officers'}
            </span>
          </div>

          {officers.length === 0 ? (
            <div className="px-5 py-4 rounded-xl border border-slate-200 bg-[#F7F7F5] text-xs sm:text-sm text-slate-600 prose-justify">
              No departmental administrative or technical officers have been published for the
              Department of {department.name} yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {officers.map((officer, idx) => (
                <PersonProfileCard
                  key={officer.id}
                  person={officer}
                  roleCategory="Department Officer"
                  delay={idx * 0.03}
                  accentClass="card-gradient-parchment border-slate-200 hover:border-pust-600/40"
                  canEdit={canAdminEdit}
                  onViewProfile={handleOpenProfile}
                  onEditPerson={handleEditPerson}
                />
              ))}
            </div>
          )}
        </div>

        {/* Research Priorities & Academic Laboratories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
          <div className="rounded-2xl border border-lapis-200/80 card-gradient-lapis p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-lapis-800 shrink-0" />
              <h2 className="font-mono text-xs uppercase tracking-widest font-semibold text-lapis-900">
                Research Priorities
              </h2>
            </div>
            <ul className="space-y-2.5 text-sm text-slate-800 prose-justify">
              {department.researchFocus.map((topic) => (
                <li
                  key={topic}
                  className="pb-2.5 border-b border-slate-200/70 last:border-b-0 last:pb-0 leading-relaxed"
                >
                  {topic}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-sage-200/80 card-gradient-sage p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-sage-800 shrink-0" />
              <h2 className="font-mono text-xs uppercase tracking-widest font-semibold text-sage-900">
                Academic Laboratories
              </h2>
            </div>
            <ul className="space-y-2.5 text-sm text-slate-800 prose-justify">
              {department.laboratories.map((lab) => (
                <li
                  key={lab}
                  className="pb-2.5 border-b border-slate-200/70 last:border-b-0 last:pb-0 leading-relaxed"
                >
                  {lab}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Departmental Publications & Notices */}
        {(deptPublications.length > 0 || deptNotices.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
            {deptPublications.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-pust-800 shrink-0" />
                  <h2 className="font-serif text-xl sm:text-2xl font-medium text-slate-900">
                    Featured Research Output
                  </h2>
                </div>
                <div className="space-y-3">
                  {deptPublications.map((pub) => (
                    <div
                      key={pub.id}
                      className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-[#F7F7F5] space-y-2"
                    >
                      <p className="font-mono text-[11px] text-pust-800">
                        {pub.year} · {pub.domain}
                      </p>
                      <h3 className="font-serif text-base font-medium text-slate-900 leading-snug">
                        {pub.title}
                      </h3>
                      <p className="text-xs text-slate-600">{pub.authors}</p>
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
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
              </div>
            )}

            {deptNotices.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-pust-800 shrink-0" />
                  <h2 className="font-serif text-xl sm:text-2xl font-medium text-slate-900">
                    Departmental Notices
                  </h2>
                </div>
                <div className="space-y-3">
                  {deptNotices.map((notice) => (
                    <button
                      key={notice.id}
                      type="button"
                      onClick={() => setActiveNotice(notice)}
                      className="w-full text-left p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white hover:border-pust-700/60 hover:shadow-sm transition-all space-y-1.5 cursor-pointer"
                    >
                      <p className="font-mono text-[11px] text-slate-500 tabular-nums">
                        {notice.publishedAt} · {notice.referenceNo}
                      </p>
                      <h3 className="font-serif text-base font-medium text-slate-900 leading-snug">
                        {notice.title}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2">{notice.summary}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <PersonProfileModal
        activeProfile={liveActiveProfile}
        department={department}
        deptPublications={deptPublications}
        isAdmin={isAdmin}
        canEdit={canAdminEdit}
        onToggleEditMode={toggleEditMode}
        onSavePerson={handleSavePersonInline}
        onEditPerson={
          liveActiveProfile
            ? () => {
                handleEditPerson(liveActiveProfile.person, liveActiveProfile.roleCategory);
              }
            : undefined
        }
        onClose={handleCloseProfile}
      />
    </main>
  );
}
