'use client';

import { useState } from 'react';
import { Award, BookOpen, Building2, Mail, Phone, UserPlus, UserRound } from 'lucide-react';
import { isSafeMediaUrl } from '../lib/media';
import { sanitizeTelHref, type PersonRoleCategory } from '../lib/departmentPeople';
import type { DepartmentPersonRecord, DepartmentRecord } from '../types/pust';
import { AddPersonAsUserModal } from './AddPersonAsUserModal';
import { usePust } from './PustContext';

function getInitials(name: string): string {
  const cleaned = (name || '')
    .replace(/\b(Prof\.|Professor|Dr\.|Engr\.|Md\.|Mr\.|Ms\.|Mrs\.)\s*/gi, '')
    .trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'PU';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function PersonThumbnail({
  person,
  roleCategory,
  size = 'md',
}: {
  person: DepartmentPersonRecord;
  roleCategory?: PersonRoleCategory;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [imgFailed, setImgFailed] = useState(false);

  const dims =
    size === 'sm'
      ? 'w-14 h-14 text-sm rounded-xl'
      : size === 'lg'
      ? 'w-20 h-20 sm:w-24 sm:h-24 text-xl rounded-2xl'
      : 'w-16 h-16 text-base rounded-xl';

  const hasValidPhoto =
    !imgFailed && typeof person.photoUrl === 'string' && isSafeMediaUrl(person.photoUrl.trim());

  if (hasValidPhoto) {
    return (
      <div
        className={`${dims} overflow-hidden border border-stone-200 bg-stone-100 shrink-0 shadow-xs`}
      >
        <img
          src={person.photoUrl!.trim()}
          alt={person.name}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  const palette =
    roleCategory === 'Chairman'
      ? 'bg-pust-900 text-white border-pust-950'
      : roleCategory === 'Department Officer'
      ? 'bg-slate-800 text-white border-slate-900'
      : 'bg-[#F4EFEA] text-pust-900 border-pust-800/20';

  return (
    <div
      aria-hidden="true"
      className={`${dims} ${palette} border shrink-0 flex flex-col items-center justify-center font-serif font-semibold tracking-tight select-none`}
    >
      <span>{getInitials(person.name)}</span>
    </div>
  );
}

export function PersonProfileView({
  person,
  department,
  roleCategory,
}: {
  person: DepartmentPersonRecord;
  department: DepartmentRecord;
  roleCategory: PersonRoleCategory;
}) {
  const { user, editMode } = usePust();
  const canAdminEdit = Boolean(user?.role === 'admin' && editMode);
  const [addAsUserOpen, setAddAsUserOpen] = useState(false);

  return (
    <>
    <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-5 pb-6 border-b border-stone-200">
        <PersonThumbnail person={person} roleCategory={roleCategory} size="lg" />
        <div className="min-w-0 space-y-1.5 flex-1">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-pust-800">
            {department.name} ({department.code}) · {roleCategory}
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl font-medium text-slate-950">
            {person.name}
          </h1>
          <p className="text-sm font-medium text-slate-700">{person.designation}</p>
          {person.qualification && (
            <p className="text-xs text-slate-600">{person.qualification}</p>
          )}
        </div>
        {canAdminEdit && (
          <button
            type="button"
            onClick={() => setAddAsUserOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-pust-900 text-white border border-pust-950 hover:bg-pust-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start sm:self-center"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add as site user
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        <div className="space-y-3">
          <h2 className="font-serif text-lg font-medium text-slate-900 flex items-center gap-2">
            <UserRound className="w-4 h-4 text-pust-800" />
            Contact &amp; Office
          </h2>
          <div className="space-y-2 text-xs sm:text-sm">
            {person.officeLocation && (
              <p className="flex items-center gap-2 text-slate-700">
                <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{person.officeLocation}</span>
              </p>
            )}
            {person.phones.map((phone, idx) => (
              <a
                key={`${phone.value}-${idx}`}
                href={`tel:${sanitizeTelHref(phone.value)}`}
                className="flex items-center gap-2 font-mono text-slate-800 hover:text-pust-900 hover:underline tabular-nums"
              >
                <Phone className="w-4 h-4 text-pust-700 shrink-0" />
                <span>
                  {phone.value} ({phone.type})
                </span>
              </a>
            ))}
            {person.emails.map((email, idx) => (
              <a
                key={`${email.value}-${idx}`}
                href={`mailto:${email.value}`}
                className="flex items-center gap-2 font-mono text-slate-800 hover:text-pust-900 hover:underline"
              >
                <Mail className="w-4 h-4 text-lapis-700 shrink-0" />
                <span>
                  {email.value} ({email.type})
                </span>
              </a>
            ))}
          </div>
        </div>

        {(person.researchArea || (person.researchInterests && person.researchInterests.length > 0)) && (
          <div className="space-y-3">
            <h2 className="font-serif text-lg font-medium text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-pust-800" />
              Research Focus
            </h2>
            {person.researchArea && (
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {person.researchArea}
              </p>
            )}
            {person.awards && person.awards.length > 0 && (
              <div className="pt-2 space-y-1">
                <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-700" />
                  Honors &amp; Awards
                </p>
                <ul className="list-disc pl-5 text-xs text-slate-700 space-y-1">
                  {person.awards.map((award, i) => (
                    <li key={i}>{award}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {person.bio && (
        <div className="pt-4 border-t border-stone-200 space-y-2">
          <h2 className="font-serif text-lg font-medium text-slate-900">Biography</h2>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{person.bio}</p>
        </div>
      )}
    </div>

    {addAsUserOpen && (
      <AddPersonAsUserModal
        open={true}
        onClose={() => setAddAsUserOpen(false)}
        person={person}
        department={department}
        roleCategory={roleCategory}
      />
    )}
    </>
  );
}
