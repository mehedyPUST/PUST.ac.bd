'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowUpRight,
  Award,
  Bookmark,
  BookOpen,
  Building2,
  Check,
  Copy,
  ExternalLink,
  FileText,
  FlaskConical,
  Globe,
  GraduationCap,
  Link2,
  Mail,
  MapPin,
  Phone,
  QrCode,
  UserPlus,
  X,
} from 'lucide-react';
import {
  getDepartmentPersonHref,
  matchPersonPublications,
  type PersonRoleCategory,
  sanitizeTelHref,
} from '../lib/departmentPeople';
import { downloadPersonVCard } from '../lib/vcard';
import type {
  DepartmentPersonRecord,
  DepartmentRecord,
  PublicationRecord,
} from '../types/pust';
import { EditTriggerButton } from './EditTriggerButton';
import { PersonThumbnail } from './PersonProfileView';

interface ModalTopicSection {
  key: string;
  title: string;
  rightSlot?: ReactNode;
  renderContent: (isLapisBand: boolean) => ReactNode;
}

interface PersonProfileModalProps {
  open: boolean;
  onClose: () => void;
  person: DepartmentPersonRecord;
  department: DepartmentRecord;
  roleCategory: PersonRoleCategory;
  publications: PublicationRecord[];
  canEdit?: boolean;
  onEditPerson?: (person: DepartmentPersonRecord, roleCategory: PersonRoleCategory) => void;
  onSharePerson?: (person: DepartmentPersonRecord, roleCategory: PersonRoleCategory) => void;
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to textarea fallback
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export function PersonProfileModal({
  open,
  onClose,
  person,
  department,
  roleCategory,
  publications,
  canEdit = false,
  onEditPerson,
  onSharePerson,
}: PersonProfileModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [savedContact, setSavedContact] = useState(false);
  const [showAllArticles, setShowAllArticles] = useState(false);
  const [showAllProceedings, setShowAllProceedings] = useState(false);
  const [showAllConferences, setShowAllConferences] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    setCopiedLink(false);
    setCopiedEmail(null);
    setSavedContact(false);
    setShowAllArticles(false);
    setShowAllProceedings(false);
    setShowAllConferences(false);

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && document.querySelectorAll('[role="dialog"]').length <= 1) {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, person.id, onClose]);

  const deptPublications = useMemo(
    () =>
      publications.filter(
        (p) => p.departmentCode.toUpperCase() === department.code.toUpperCase()
      ),
    [publications, department.code]
  );

  const matchedPublications = useMemo(
    () => matchPersonPublications(person.name, deptPublications),
    [person.name, deptPublications]
  );

  if (!open) return null;

  const profileHref = getDepartmentPersonHref(department.code, person.id);
  const deptHref = `/academics/departments/${encodeURIComponent(department.code.toLowerCase())}`;
  const isOfficer = roleCategory === 'Department Officer';
  const officeLocation = person.officeLocation || `${department.building}, Rajapur Campus`;
  const primaryEmail = person.emails[0]?.value;
  const primaryPhone = person.phones[0]?.value;

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

  async function handleCopyProfileLink() {
    const absoluteUrl =
      typeof window !== 'undefined' ? `${window.location.origin}${profileHref}` : profileHref;
    const ok = await copyTextToClipboard(absoluteUrl);
    if (!ok) return;
    setCopiedLink(true);
    window.setTimeout(() => setCopiedLink(false), 2000);
  }

  async function handleCopyEmail(email: string) {
    const ok = await copyTextToClipboard(email);
    if (!ok) return;
    setCopiedEmail(email);
    window.setTimeout(() => {
      setCopiedEmail((prev) => (prev === email ? null : prev));
    }, 1800);
  }

  function handleSaveVCard() {
    const absoluteUrl =
      typeof window !== 'undefined' ? `${window.location.origin}${profileHref}` : profileHref;
    downloadPersonVCard({
      person,
      department,
      profileUrl: absoluteUrl,
    });
    setSavedContact(true);
    window.setTimeout(() => setSavedContact(false), 2200);
  }

  const cardSurface = (isLapisBand: boolean) =>
    isLapisBand
      ? 'bg-white border-lapis-200/75'
      : 'bg-[#FAF9F6] border-stone-200';

  const dividerColor = (isLapisBand: boolean) =>
    isLapisBand ? 'divide-lapis-100' : 'divide-stone-200';

  const accentIconColor = (isLapisBand: boolean) =>
    isLapisBand ? 'text-lapis-700' : 'text-pust-800';

  const topicSections: ModalTopicSection[] = [];

  if (person.bio) {
    topicSections.push({
      key: 'bio',
      title: 'Biography',
      renderContent: (isLapis) => (
        <div className={`rounded-xl border px-4 sm:px-5 py-3.5 sm:py-4 ${cardSurface(isLapis)}`}>
          <p className="text-sm text-slate-800 leading-relaxed prose-justify">{person.bio}</p>
        </div>
      ),
    });
  }

  if (person.qualification || person.researchArea) {
    topicSections.push({
      key: 'academic-profile',
      title: isOfficer ? 'Academic & Service Qualifications' : 'Academic & Research Profile',
      renderContent: (isLapis) => (
        <dl
          className={`divide-y ${dividerColor(isLapis)} border rounded-xl text-sm ${cardSurface(
            isLapis
          )}`}
        >
          {person.qualification && (
            <div className="px-4 sm:px-5 py-3 flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-6">
              <dt className="text-xs font-medium text-slate-500 shrink-0">Qualification</dt>
              <dd className="text-slate-900 sm:text-right leading-relaxed">
                {person.qualification}
              </dd>
            </div>
          )}
          {person.researchArea && (
            <div className="px-4 sm:px-5 py-3 flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-6">
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

  if (person.education && person.education.length > 0) {
    topicSections.push({
      key: 'education',
      title: `Education (${person.education.length})`,
      renderContent: (isLapis) => (
        <ul
          className={`divide-y ${dividerColor(isLapis)} border rounded-xl text-xs sm:text-sm ${cardSurface(
            isLapis
          )}`}
        >
          {person.education!.map((item, idx) => (
            <li
              key={`${item}-${idx}`}
              className="px-4 sm:px-5 py-3 flex items-start gap-3 text-slate-800 leading-relaxed"
            >
              <GraduationCap className={`w-4 h-4 shrink-0 mt-0.5 ${accentIconColor(isLapis)}`} />
              <span className="flex-1 prose-justify">{item}</span>
            </li>
          ))}
        </ul>
      ),
    });
  }

  if (person.teachingExperience && person.teachingExperience.length > 0) {
    topicSections.push({
      key: 'teaching-experience',
      title: `Teaching Experience (${person.teachingExperience.length})`,
      renderContent: (isLapis) => (
        <ul
          className={`divide-y ${dividerColor(isLapis)} border rounded-xl text-xs sm:text-sm ${cardSurface(
            isLapis
          )}`}
        >
          {person.teachingExperience!.map((item, idx) => (
            <li
              key={`${item}-${idx}`}
              className="px-4 sm:px-5 py-3 flex items-start gap-3 text-slate-800 leading-relaxed"
            >
              <BookOpen className={`w-4 h-4 shrink-0 mt-0.5 ${accentIconColor(isLapis)}`} />
              <span className="flex-1 prose-justify">{item}</span>
            </li>
          ))}
        </ul>
      ),
    });
  }

  if (person.administrativeExperience && person.administrativeExperience.length > 0) {
    topicSections.push({
      key: 'admin-experience',
      title: `Administrative & Other Experience (${person.administrativeExperience.length})`,
      renderContent: (isLapis) => (
        <ul
          className={`divide-y ${dividerColor(isLapis)} border rounded-xl text-xs sm:text-sm ${cardSurface(
            isLapis
          )}`}
        >
          {person.administrativeExperience!.map((item, idx) => (
            <li
              key={`${item}-${idx}`}
              className="px-4 sm:px-5 py-3 flex items-start gap-3 text-slate-800 leading-relaxed"
            >
              <Building2 className={`w-4 h-4 shrink-0 mt-0.5 ${accentIconColor(isLapis)}`} />
              <span className="flex-1 prose-justify">{item}</span>
            </li>
          ))}
        </ul>
      ),
    });
  }

  if (person.researchInterests && person.researchInterests.length > 0) {
    topicSections.push({
      key: 'research-interests',
      title: `Research Interests (${person.researchInterests.length})`,
      renderContent: (isLapis) => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {person.researchInterests!.map((interest, idx) => (
            <div
              key={`${interest}-${idx}`}
              className={`px-3.5 py-2.5 rounded-lg border text-xs sm:text-[13px] text-slate-800 flex items-center gap-2 ${cardSurface(
                isLapis
              )}`}
            >
              <FlaskConical className={`w-3.5 h-3.5 shrink-0 ${accentIconColor(isLapis)}`} />
              <span>{interest}</span>
            </div>
          ))}
        </div>
      ),
    });
  }

  if (person.activeResearchProjects && person.activeResearchProjects.length > 0) {
    topicSections.push({
      key: 'active-projects',
      title: `Active Research Projects (${person.activeResearchProjects.length})`,
      renderContent: (isLapis) => (
        <ul
          className={`divide-y ${dividerColor(isLapis)} border rounded-xl text-xs sm:text-sm ${cardSurface(
            isLapis
          )}`}
        >
          {person.activeResearchProjects!.map((proj, idx) => (
            <li
              key={`${proj}-${idx}`}
              className="px-4 sm:px-5 py-3 flex items-start gap-3 text-slate-800 leading-relaxed"
            >
              <FlaskConical className={`w-4 h-4 shrink-0 mt-0.5 ${accentIconColor(isLapis)}`} />
              <span className="flex-1 prose-justify">{proj}</span>
            </li>
          ))}
        </ul>
      ),
    });
  }

  if (person.previousResearchProjects && person.previousResearchProjects.length > 0) {
    topicSections.push({
      key: 'previous-projects',
      title: `Previous Research Projects (${person.previousResearchProjects.length})`,
      renderContent: (isLapis) => (
        <ul
          className={`divide-y ${dividerColor(isLapis)} border rounded-xl text-xs sm:text-sm ${cardSurface(
            isLapis
          )}`}
        >
          {person.previousResearchProjects!.map((proj, idx) => (
            <li
              key={`${proj}-${idx}`}
              className="px-4 sm:px-5 py-3 flex items-start gap-3 text-slate-800 leading-relaxed"
            >
              <FileText className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <span className="flex-1 prose-justify">{proj}</span>
            </li>
          ))}
        </ul>
      ),
    });
  }

  if (person.externalAffiliations && person.externalAffiliations.length > 0) {
    topicSections.push({
      key: 'external-affiliations',
      title: `External Affiliations (${person.externalAffiliations.length})`,
      renderContent: (isLapis) => (
        <ul
          className={`divide-y ${dividerColor(isLapis)} border rounded-xl text-xs sm:text-sm ${cardSurface(
            isLapis
          )}`}
        >
          {person.externalAffiliations!.map((item, idx) => (
            <li
              key={`${item}-${idx}`}
              className="px-4 sm:px-5 py-3 flex items-start gap-3 text-slate-800 leading-relaxed"
            >
              <Globe className={`w-4 h-4 shrink-0 mt-0.5 ${accentIconColor(isLapis)}`} />
              <span className="flex-1 prose-justify">{item}</span>
            </li>
          ))}
        </ul>
      ),
    });
  }

  if (person.awards && person.awards.length > 0) {
    topicSections.push({
      key: 'awards',
      title: `Awards & Recognition (${person.awards.length})`,
      renderContent: (isLapis) => (
        <ul
          className={`divide-y ${dividerColor(isLapis)} border rounded-xl text-xs sm:text-sm ${cardSurface(
            isLapis
          )}`}
        >
          {person.awards!.map((item, idx) => (
            <li
              key={`${item}-${idx}`}
              className="px-4 sm:px-5 py-3 flex items-start gap-3 text-slate-800 leading-relaxed"
            >
              <Award className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span className="flex-1 prose-justify">{item}</span>
            </li>
          ))}
        </ul>
      ),
    });
  }

  if (person.conductedCourses && person.conductedCourses.length > 0) {
    topicSections.push({
      key: 'conducted-courses',
      title: `Conducted Courses (${person.conductedCourses.length})`,
      renderContent: (isLapis) => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {person.conductedCourses!.map((course, idx) => (
            <div
              key={`${course}-${idx}`}
              className={`px-3.5 py-2.5 rounded-lg border text-xs sm:text-[13px] text-slate-800 flex items-center gap-2 ${cardSurface(
                isLapis
              )}`}
            >
              <Bookmark className={`w-3.5 h-3.5 shrink-0 ${accentIconColor(isLapis)}`} />
              <span>{course}</span>
            </div>
          ))}
        </div>
      ),
    });
  }

  if (person.graduateSupervision && person.graduateSupervision.length > 0) {
    topicSections.push({
      key: 'graduate-supervision',
      title: `Graduate Supervision (${person.graduateSupervision.length})`,
      renderContent: (isLapis) => (
        <ol
          className={`divide-y ${dividerColor(isLapis)} border rounded-xl text-xs sm:text-[13px] ${cardSurface(
            isLapis
          )}`}
        >
          {person.graduateSupervision!.map((thesis, idx) => (
            <li key={`${thesis}-${idx}`} className="px-4 sm:px-5 py-3 flex items-start gap-3">
              <span
                className={`font-mono text-[11px] font-semibold tabular-nums shrink-0 mt-0.5 ${accentIconColor(
                  isLapis
                )}`}
              >
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
    title: 'Official & Personal Contacts',
    renderContent: (isLapis) =>
      person.phones.length === 0 && person.emails.length === 0 ? (
        <p className={`text-xs text-slate-600 rounded-xl border px-4 py-3 ${cardSurface(isLapis)}`}>
          Direct personal contacts have not been listed. Use the departmental office contact
          {department.contactEmail ? ` (${department.contactEmail})` : ''} for inquiries.
        </p>
      ) : (
        <div
          className={`divide-y ${dividerColor(isLapis)} border rounded-xl text-xs sm:text-sm ${cardSurface(
            isLapis
          )}`}
        >
          {person.phones.map((phone, idx) => (
            <div
              key={`${phone.value}-${idx}`}
              className="px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-3"
            >
              <a
                href={`tel:${sanitizeTelHref(phone.value)}`}
                className="inline-flex items-center gap-2 font-mono text-slate-900 hover:text-pust-900 hover:underline tabular-nums"
              >
                <Phone className={`w-4 h-4 shrink-0 ${accentIconColor(isLapis)}`} />
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
                className="px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-3"
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
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 bg-white text-[11px] font-sans font-medium text-slate-700 hover:border-pust-800 hover:text-pust-900 transition-colors cursor-pointer"
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

  if (journalArticles.length > 0) {
    topicSections.push({
      key: 'journal-articles',
      title: `Journal Articles (${journalArticles.length})`,
      rightSlot:
        journalArticles.length > 6 ? (
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
      renderContent: (isLapis) => (
        <ol
          className={`divide-y ${dividerColor(isLapis)} border rounded-xl text-xs sm:text-[13px] ${cardSurface(
            isLapis
          )}`}
        >
          {visibleArticles.map((article, idx) => (
            <li
              key={`${idx}-${article.slice(0, 32)}`}
              className="px-4 sm:px-5 py-3 flex items-start gap-3"
            >
              <span
                className={`font-mono text-[11px] font-semibold tabular-nums shrink-0 mt-0.5 ${accentIconColor(
                  isLapis
                )}`}
              >
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

  if (conferenceProceedings.length > 0) {
    topicSections.push({
      key: 'conference-proceedings',
      title: `Conference Proceedings (${conferenceProceedings.length})`,
      rightSlot:
        conferenceProceedings.length > 6 ? (
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
      renderContent: (isLapis) => (
        <ol
          className={`divide-y ${dividerColor(isLapis)} border rounded-xl text-xs sm:text-[13px] ${cardSurface(
            isLapis
          )}`}
        >
          {visibleProceedings.map((item, idx) => (
            <li
              key={`${idx}-${item.slice(0, 32)}`}
              className="px-4 sm:px-5 py-3 flex items-start gap-3"
            >
              <span
                className={`font-mono text-[11px] font-semibold tabular-nums shrink-0 mt-0.5 ${accentIconColor(
                  isLapis
                )}`}
              >
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

  if (bookChapters.length > 0) {
    topicSections.push({
      key: 'book-chapters',
      title: `Published Book Chapters (${bookChapters.length})`,
      renderContent: (isLapis) => (
        <ol
          className={`divide-y ${dividerColor(isLapis)} border rounded-xl text-xs sm:text-[13px] ${cardSurface(
            isLapis
          )}`}
        >
          {bookChapters.map((item, idx) => (
            <li
              key={`${idx}-${item.slice(0, 32)}`}
              className="px-4 sm:px-5 py-3 flex items-start gap-3"
            >
              <span
                className={`font-mono text-[11px] font-semibold tabular-nums shrink-0 mt-0.5 ${accentIconColor(
                  isLapis
                )}`}
              >
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

  if (conferencesAttended.length > 0) {
    topicSections.push({
      key: 'conferences-attended',
      title: `Conferences & Seminars Attended (${conferencesAttended.length})`,
      rightSlot:
        conferencesAttended.length > 6 ? (
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
      renderContent: (isLapis) => (
        <ol
          className={`divide-y ${dividerColor(isLapis)} border rounded-xl text-xs sm:text-[13px] ${cardSurface(
            isLapis
          )}`}
        >
          {visibleConferences.map((item, idx) => (
            <li
              key={`${idx}-${item.slice(0, 32)}`}
              className="px-4 sm:px-5 py-3 flex items-start gap-3"
            >
              <span
                className={`font-mono text-[11px] font-semibold tabular-nums shrink-0 mt-0.5 ${accentIconColor(
                  isLapis
                )}`}
              >
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
      renderContent: (isLapis) => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {matchedPublications.map((pub) => (
            <div key={pub.id} className={`p-4 rounded-xl border space-y-1.5 ${cardSurface(isLapis)}`}>
              <p className={`font-mono text-[11px] font-semibold ${accentIconColor(isLapis)}`}>
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-[2px] p-2.5 sm:p-5 lg:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="person-profile-modal-title"
      onClick={onClose}
    >
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 14, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-6xl xl:max-w-7xl rounded-2xl bg-white border border-stone-200 shadow-2xl max-h-[92vh] overflow-y-auto overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky 1-Line Top Bar (Remains Pinned While Scrolling) */}
        <div className="sticky top-0 z-30 border-b border-stone-200 bg-[#FAF8F4]/95 backdrop-blur-md px-4 sm:px-7 py-2.5 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1 flex items-center gap-2">
            <span className="hidden sm:inline font-mono text-[11px] uppercase tracking-wider font-semibold text-pust-800 shrink-0">
              {department.code}
            </span>
            <span className="hidden sm:inline text-stone-300 shrink-0" aria-hidden="true">
              ·
            </span>
            <h2
              id="person-profile-modal-title"
              className="font-serif text-base sm:text-lg font-semibold text-slate-950 truncate min-w-0 leading-tight"
            >
              {person.name}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyProfileLink}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                copiedLink
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-white border-pust-800/30 text-pust-900 hover:bg-pust-900 hover:text-white hover:border-pust-900'
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

            <Link
              href={profileHref}
              onClick={onClose}
              title="Open Dedicated Full-Page Profile"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-stone-300 bg-white text-slate-800 hover:border-pust-800 hover:text-pust-900 transition-colors whitespace-nowrap shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden md:inline">Full Page</span>
            </Link>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close profile modal"
              className="min-w-[36px] min-h-[36px] inline-flex items-center justify-center rounded-lg text-slate-600 hover:bg-stone-200/75 hover:text-slate-950 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hero Identity Banner */}
        <div className="bg-gradient-to-br from-[#FAF8F4] via-white to-[#F3F6FA] px-5 sm:px-8 py-6 sm:py-7 border-b border-stone-200 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6 min-w-0">
              <PersonThumbnail person={person} roleCategory={roleCategory} size="lg" />
              <div className="min-w-0 space-y-1.5">
                <p className="font-mono text-xs uppercase tracking-widest text-pust-800 font-semibold">
                  {department.code} · {roleCategory}
                </p>
                <p className="font-serif text-2xl sm:text-3xl font-semibold text-slate-950 leading-tight">
                  {person.name}
                </p>
                <p className="text-sm sm:text-base font-medium text-pust-900">
                  {person.designation}
                </p>
                <p className="text-xs sm:text-sm text-slate-600">
                  <Link
                    href={deptHref}
                    onClick={onClose}
                    className="font-medium text-slate-800 hover:text-pust-900 hover:underline"
                  >
                    Department of {department.name}
                  </Link>
                  {' · '}
                  {department.faculty}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {primaryEmail && (
                <a
                  href={`mailto:${primaryEmail}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-pust-900 text-white hover:bg-pust-950 transition-colors whitespace-nowrap"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Send Email
                </a>
              )}
              {primaryPhone && (
                <a
                  href={`tel:${sanitizeTelHref(primaryPhone)}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-stone-300 text-slate-900 hover:border-pust-700 hover:text-pust-900 transition-colors whitespace-nowrap"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Call Office
                </a>
              )}
              <button
                type="button"
                onClick={handleSaveVCard}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap cursor-pointer ${
                  savedContact
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-white border-stone-300 text-slate-900 hover:border-pust-700 hover:text-pust-900'
                }`}
              >
                {savedContact ? (
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
              {onSharePerson && (
                <button
                  type="button"
                  onClick={() => onSharePerson(person, roleCategory)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#FAF8F4] border border-pust-800/30 text-pust-900 hover:bg-pust-900 hover:text-white hover:border-pust-900 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  Share QR
                </button>
              )}
              {canEdit && onEditPerson && (
                <EditTriggerButton
                  label="Edit Profile"
                  variant="compact"
                  onClick={() => {
                    onClose();
                    onEditPerson(person, roleCategory);
                  }}
                />
              )}
            </div>
          </div>

          {/* Quick Fact Ribbon */}
          <dl
            className={`grid grid-cols-1 ${
              !isOfficer && person.totalPublications !== undefined
                ? 'sm:grid-cols-3'
                : 'sm:grid-cols-2'
            } gap-4 rounded-xl bg-white/95 border border-stone-200 p-4 text-sm shadow-2xs`}
          >
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

        {/* Alternating Color Bands for Each Dossier Topic */}
        <div className="divide-y divide-stone-200">
          {topicSections.map((section, idx) => {
            const isLapisBand = idx % 2 === 1;
            return (
              <section
                key={section.key}
                className={`px-5 sm:px-8 py-5 sm:py-6 space-y-3.5 transition-colors ${
                  isLapisBand ? 'bg-[#F3F6FA]' : 'bg-white'
                }`}
              >
                <div
                  className={`flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b ${
                    isLapisBand ? 'border-lapis-200/80' : 'border-stone-200'
                  }`}
                >
                  <h3
                    className={`font-mono text-xs uppercase tracking-widest font-semibold ${
                      isLapisBand ? 'text-lapis-800' : 'text-pust-800'
                    }`}
                  >
                    {section.title}
                  </h3>
                  {section.rightSlot && <div className="shrink-0">{section.rightSlot}</div>}
                </div>
                {section.renderContent(isLapisBand)}
              </section>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-8 py-4 border-t border-stone-200 bg-[#FAF8F4] flex flex-wrap items-center justify-between gap-3">
          <Link
            href={profileHref}
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-pust-900 hover:underline underline-offset-4"
          >
            Open Dedicated Profile Page
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-white border border-stone-300 text-slate-800 hover:border-pust-800 hover:text-pust-900 transition-colors cursor-pointer"
          >
            Close Dossier
          </button>
        </div>
      </motion.div>
    </div>
  );
}
