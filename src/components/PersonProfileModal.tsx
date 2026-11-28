'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import {
  Award,
  BookOpen,
  Briefcase,
  Building2,
  ExternalLink,
  GraduationCap,
  Mail,
  Pencil,
  Phone,
  QrCode,
  UserPlus,
  X,
} from 'lucide-react';
import {
  getDepartmentPersonHref,
  sanitizeTelHref,
  type PersonRoleCategory,
} from '../lib/departmentPeople';
import type {
  DepartmentPersonRecord,
  DepartmentRecord,
  PublicationRecord,
} from '../types/pust';
import { PersonThumbnail } from './PersonProfileView';

interface PersonProfileModalProps {
  open: boolean;
  onClose: () => void;
  person: DepartmentPersonRecord;
  department: DepartmentRecord;
  roleCategory: PersonRoleCategory;
  publications?: PublicationRecord[];
  canEdit?: boolean;
  onEditPerson?: (person: DepartmentPersonRecord, roleCategory: PersonRoleCategory) => void;
  onSharePerson?: (person: DepartmentPersonRecord, roleCategory: PersonRoleCategory) => void;
  onAddAsUser?: (person: DepartmentPersonRecord, roleCategory: PersonRoleCategory) => void;
}

export function PersonProfileModal({
  open,
  onClose,
  person,
  department,
  roleCategory,
  publications = [],
  canEdit = false,
  onEditPerson,
  onSharePerson,
  onAddAsUser,
}: PersonProfileModalProps) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const normalizedLastName = person.name.split(/\s+/).filter(Boolean).pop()?.toLowerCase() || '';
  const matchedPubs = publications.filter(
    (pub) =>
      pub.departmentCode.toUpperCase() === department.code.toUpperCase() &&
      normalizedLastName.length > 2 &&
      pub.authors.toLowerCase().includes(normalizedLastName)
  );

  const profileHref = getDepartmentPersonHref(department.code, person.id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-[2px] p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="person-profile-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white rounded-2xl border border-stone-200 shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-pust-900 via-pust-800 to-pust-700 text-white px-6 py-5 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <PersonThumbnail person={person} roleCategory={roleCategory} size="md" />
            <div className="min-w-0 space-y-1">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-pust-200">
                {department.name} ({department.code}) · {roleCategory}
              </p>
              <h2
                id="person-profile-modal-title"
                className="font-serif text-xl sm:text-2xl font-medium text-white leading-snug"
              >
                {person.name}
              </h2>
              <p className="text-xs sm:text-sm text-pust-100">{person.designation}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile dialog"
            className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/15 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-700">
          {person.onStudyLeave && (
            <div className="px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-medium text-amber-900">
              Academic Status: Currently on Study Leave
            </div>
          )}

          {/* Quick Metrics & Contact Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] p-4 space-y-2.5">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Contact &amp; Chamber
              </p>
              {person.officeLocation && (
                <p className="flex items-start gap-2 text-xs text-slate-800">
                  <Building2 className="w-4 h-4 text-pust-800 shrink-0 mt-0.5" />
                  <span>{person.officeLocation}</span>
                </p>
              )}
              {person.phones.map((phone, idx) => (
                <a
                  key={`${phone.value}-${idx}`}
                  href={`tel:${sanitizeTelHref(phone.value)}`}
                  className="flex items-center justify-between gap-2 text-xs font-mono text-slate-800 hover:text-pust-900 hover:underline tabular-nums"
                >
                  <span className="inline-flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-pust-700 shrink-0" />
                    {phone.value}
                  </span>
                  <span className="text-slate-500">({phone.type})</span>
                </a>
              ))}
              {person.emails.map((email, idx) => (
                <a
                  key={`${email.value}-${idx}`}
                  href={`mailto:${email.value}`}
                  className="flex items-center justify-between gap-2 text-xs font-mono text-slate-800 hover:text-pust-900 hover:underline"
                >
                  <span className="inline-flex items-center gap-2 min-w-0 truncate">
                    <Mail className="w-3.5 h-3.5 text-lapis-700 shrink-0" />
                    <span className="truncate">{email.value}</span>
                  </span>
                  <span className="text-slate-500 shrink-0">({email.type})</span>
                </a>
              ))}
              {person.phones.length === 0 &&
                person.emails.length === 0 &&
                !person.officeLocation && (
                  <p className="text-xs text-slate-500">
                    Contact via Department of {department.code} Office.
                  </p>
                )}
            </div>

            <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] p-4 space-y-2.5">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Academic Credentials
              </p>
              {person.qualification && (
                <div>
                  <span className="text-[11px] font-mono text-slate-500 block">Qualification</span>
                  <span className="text-xs font-medium text-slate-900">{person.qualification}</span>
                </div>
              )}
              {person.researchArea && (
                <div>
                  <span className="text-[11px] font-mono text-slate-500 block">
                    Primary Research Area
                  </span>
                  <span className="text-xs text-slate-800 leading-relaxed">
                    {person.researchArea}
                  </span>
                </div>
              )}
              {person.totalPublications !== undefined && (
                <div className="pt-1 flex items-center justify-between border-t border-stone-200/80 text-xs">
                  <span className="text-slate-600">Indexed Publications</span>
                  <span className="font-mono font-semibold text-pust-900 tabular-nums">
                    {person.totalPublications}
                  </span>
                </div>
              )}
            </div>
          </div>

          {person.bio && (
            <div className="space-y-1.5">
              <h3 className="font-serif text-base font-medium text-slate-950">Biography</h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {person.bio}
              </p>
            </div>
          )}

          {person.education && person.education.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-serif text-base font-medium text-slate-950 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-pust-800" />
                Education
              </h3>
              <ul className="list-disc pl-5 text-xs sm:text-sm space-y-1 text-slate-700">
                {person.education.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {((person.teachingExperience && person.teachingExperience.length > 0) ||
            (person.administrativeExperience && person.administrativeExperience.length > 0)) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {person.teachingExperience && person.teachingExperience.length > 0 && (
                <div className="space-y-1.5">
                  <h3 className="font-serif text-base font-medium text-slate-950 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-pust-800" />
                    Teaching Experience
                  </h3>
                  <ul className="list-disc pl-5 text-xs space-y-1 text-slate-700">
                    {person.teachingExperience.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {person.administrativeExperience && person.administrativeExperience.length > 0 && (
                <div className="space-y-1.5">
                  <h3 className="font-serif text-base font-medium text-slate-950 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-pust-800" />
                    Administrative Roles
                  </h3>
                  <ul className="list-disc pl-5 text-xs space-y-1 text-slate-700">
                    {person.administrativeExperience.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {person.researchInterests && person.researchInterests.length > 0 && (
            <div className="space-y-1.5">
              <h3 className="font-serif text-base font-medium text-slate-950 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-pust-800" />
                Research Interests
              </h3>
              <p className="text-xs sm:text-sm text-slate-700">
                {person.researchInterests.join(' · ')}
              </p>
            </div>
          )}

          {person.awards && person.awards.length > 0 && (
            <div className="space-y-1.5">
              <h3 className="font-serif text-base font-medium text-slate-950 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-700" />
                Awards &amp; Fellowships
              </h3>
              <ul className="list-disc pl-5 text-xs space-y-1 text-slate-700">
                {person.awards.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {(matchedPubs.length > 0 ||
            (person.journalArticles && person.journalArticles.length > 0) ||
            (person.conferenceProceedings && person.conferenceProceedings.length > 0)) && (
            <div className="space-y-2.5 pt-2 border-t border-stone-200">
              <h3 className="font-serif text-base font-medium text-slate-950">
                Selected Publications
              </h3>
              <ul className="space-y-2 text-xs text-slate-700">
                {matchedPubs.slice(0, 6).map((pub) => (
                  <li key={pub.id} className="p-3 rounded-lg bg-[#FAF9F6] border border-stone-200">
                    <p className="font-medium text-slate-900">{pub.title}</p>
                    <p className="font-mono text-[11px] text-slate-500 mt-0.5 tabular-nums">
                      {pub.venue} · {pub.year}
                      {pub.doi ? ` · DOI: ${pub.doi}` : ''}
                    </p>
                  </li>
                ))}
                {(person.journalArticles || []).slice(0, 5).map((art, idx) => (
                  <li key={`j-${idx}`} className="p-2.5 rounded-lg bg-[#FAF9F6] border border-stone-200">
                    {art}
                  </li>
                ))}
                {(person.conferenceProceedings || []).slice(0, 4).map((proc, idx) => (
                  <li key={`c-${idx}`} className="p-2.5 rounded-lg bg-white border border-stone-200">
                    {proc}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-stone-200 bg-[#FAF9F6] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <Link
            href={profileHref}
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-pust-900 hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Direct Profile Link
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            {canEdit && onAddAsUser && (
              <button
                type="button"
                onClick={() => {
                  onAddAsUser(person, roleCategory);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-pust-800 bg-pust-700 text-white hover:bg-pust-800 transition-colors cursor-pointer whitespace-nowrap"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add as site user
              </button>
            )}
            {canEdit && onEditPerson && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditPerson(person, roleCategory);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-pust-700 text-pust-800 bg-white hover:bg-pust-700 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit Profile
              </button>
            )}
            {onSharePerson && (
              <button
                type="button"
                onClick={() => onSharePerson(person, roleCategory)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-300 bg-white text-slate-800 hover:border-pust-700 hover:text-pust-800 transition-colors cursor-pointer whitespace-nowrap"
              >
                <QrCode className="w-3.5 h-3.5" />
                Share &amp; vCard
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-pust-700 text-white hover:bg-pust-800 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
