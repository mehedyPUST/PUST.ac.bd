'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Copy,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Search,
  X,
} from 'lucide-react';
import type {
  AdministrationOfficeRecord,
  AdminOfficeCategory,
  AdminOfficePersonnel,
} from '../types/pust';

const OFFICE_CATEGORIES: Array<'All' | AdminOfficeCategory> = [
  'All',
  'Executive Leadership',
  'Administrative Sections & Offices',
  'Student Welfare & Campus Services',
  'Residential Halls & Accommodation',
  'Research, ICT & Quality Cells',
];

function sanitizeTel(phone: string): string {
  const digits = phone.replace(/[^+\d]/g, '');
  return digits || phone;
}

function PersonnelEntry({
  person,
  isHead = false,
  copiedEmail,
  onCopyEmail,
}: {
  person: AdminOfficePersonnel;
  isHead?: boolean;
  copiedEmail: string | null;
  onCopyEmail: (email: string) => void;
}) {
  const emails = person.emails ?? [];
  const phones = person.phones ?? [];

  return (
    <article
      className={`h-full rounded-xl border p-6 flex flex-col justify-between gap-5 text-left transition-colors duration-150 ${
        isHead
          ? 'bg-[#FBF9F5] border-pust-800/30'
          : 'bg-white border-stone-200 hover:border-stone-400'
      }`}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 border-b border-stone-200/80 pb-3">
          <p
            className={`text-xs font-semibold tracking-wide ${
              isHead ? 'text-pust-900' : 'text-pust-800'
            }`}
          >
            {person.designation}
          </p>
          {isHead && (
            <span className="font-mono text-[11px] text-stone-500 tabular-nums">
              Head of Office
            </span>
          )}
        </div>

        <h3 className="font-serif text-xl font-medium text-stone-950 leading-snug text-left">
          {person.name}
        </h3>

        {person.qualification && (
          <div className="flex items-start gap-2 text-[13px] text-stone-700 leading-relaxed">
            <GraduationCap className="w-4 h-4 text-pust-800 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-left">{person.qualification}</p>
          </div>
        )}

        {person.researchArea && (
          <p className="text-[13px] text-stone-600 leading-relaxed pt-1 text-left">
            <span className="font-semibold text-stone-800">Research Focus:</span>{' '}
            {person.researchArea}
          </p>
        )}
      </div>

      {(phones.length > 0 || emails.length > 0) && (
        <dl className="pt-4 border-t border-stone-200/90 space-y-2.5 text-xs font-mono tabular-nums">
          {phones.map((p, idx) => (
            <div key={`${p.value}-${idx}`} className="flex items-center justify-between gap-3">
              <dt className="sr-only">{p.type} phone</dt>
              <dd className="min-w-0">
                <a
                  href={`tel:${sanitizeTel(p.value)}`}
                  className="inline-flex items-center gap-1.5 text-stone-900 hover:text-pust-900 transition-colors break-all"
                >
                  <Phone className="w-3.5 h-3.5 text-pust-800 shrink-0" aria-hidden="true" />
                  {p.value}
                </a>
              </dd>
              <span className="font-sans text-[11px] font-medium text-stone-500 shrink-0">
                {p.type}
              </span>
            </div>
          ))}

          {emails.map((em, idx) => {
            const isCopied = copiedEmail === em.value;
            return (
              <div key={`${em.value}-${idx}`} className="flex items-center justify-between gap-2">
                <dt className="sr-only">{em.type} email</dt>
                <dd className="min-w-0">
                  <a
                    href={`mailto:${em.value}`}
                    className="inline-flex items-center gap-1.5 text-pust-900 hover:underline min-w-0 break-all"
                  >
                    <Mail className="w-3.5 h-3.5 text-pust-800 shrink-0" aria-hidden="true" />
                    <span className="truncate sm:whitespace-normal">{em.value}</span>
                  </a>
                </dd>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-sans text-[11px] font-medium text-stone-500">
                    {em.type}
                  </span>
                  <button
                    type="button"
                    onClick={() => onCopyEmail(em.value)}
                    aria-label={`Copy ${em.value}`}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-stone-200 bg-[#FBF9F5] text-[11px] font-sans font-medium text-stone-700 hover:border-pust-800 hover:text-pust-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-700" aria-hidden="true" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" aria-hidden="true" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </dl>
      )}
    </article>
  );
}

export function AdministrationOfficeDossier({
  office,
  copiedEmail,
  onCopyEmail,
}: {
  office: AdministrationOfficeRecord;
  copiedEmail: string | null;
  onCopyEmail: (email: string) => void;
}) {
  const [rosterQuery, setRosterQuery] = useState('');

  const filteredOfficers = useMemo(() => {
    const q = rosterQuery.trim().toLowerCase();
    if (!q) return office.officers;
    return office.officers.filter((o) => {
      const phones = (o.phones || []).map((p) => p.value).join(' ');
      const emails = (o.emails || []).map((e) => e.value).join(' ');
      return (
        o.name.toLowerCase().includes(q) ||
        o.designation.toLowerCase().includes(q) ||
        (o.qualification || '').toLowerCase().includes(q) ||
        phones.toLowerCase().includes(q) ||
        emails.toLowerCase().includes(q)
      );
    });
  }, [office.officers, rosterQuery]);

  const totalPersonnel = (office.head ? 1 : 0) + office.officers.length;

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-6 sm:p-8 space-y-10">
      <div className="space-y-10">
        {/* Office Accession Desk Header & Contact Strip */}
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-stone-200 pb-6">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600">
                <span className="font-mono font-semibold text-pust-900 tabular-nums">
                  {office.code}
                </span>
                <span aria-hidden="true">·</span>
                <span>{office.category}</span>
                {totalPersonnel > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums text-stone-700">
                      {totalPersonnel} {totalPersonnel === 1 ? 'Listed Official' : 'Listed Officials'}
                    </span>
                  </>
                )}
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-medium text-stone-950 text-left">
                {office.name} — Office Desk &amp; Personnel Roster
              </h2>
            </div>

            <Link
              href="/administration/all-office"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-[#FBF9F5] border border-stone-300 text-stone-900 hover:border-pust-800 hover:text-pust-900 transition-colors whitespace-nowrap shrink-0 self-start lg:self-auto"
            >
              Browse All 33 Offices
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>

          {(office.officeEmail || office.officePhone || office.deskEmail || office.location) && (
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-stone-200 rounded-xl bg-[#FBF9F5] divide-y sm:divide-y-0 sm:divide-x divide-stone-200">
              {office.officeEmail && (
                <div className="px-5 py-4 space-y-1">
                  <dt className="text-xs font-medium text-stone-500">Official Office Email</dt>
                  <dd className="font-mono text-xs font-semibold text-pust-900 break-all">
                    <a href={`mailto:${office.officeEmail}`} className="hover:underline">
                      {office.officeEmail}
                    </a>
                  </dd>
                </div>
              )}
              {office.officePhone && (
                <div className="px-5 py-4 space-y-1">
                  <dt className="text-xs font-medium text-stone-500">Office Telephone</dt>
                  <dd className="font-mono text-xs font-semibold text-stone-950 tabular-nums">
                    <a href={`tel:${sanitizeTel(office.officePhone)}`} className="hover:text-pust-900">
                      {office.officePhone}
                    </a>
                  </dd>
                </div>
              )}
              {office.deskEmail && office.deskEmail !== office.officeEmail && (
                <div className="px-5 py-4 space-y-1">
                  <dt className="text-xs font-medium text-stone-500">Front Desk Email</dt>
                  <dd className="font-mono text-xs font-semibold text-pust-900 break-all">
                    <a href={`mailto:${office.deskEmail}`} className="hover:underline">
                      {office.deskEmail}
                    </a>
                  </dd>
                </div>
              )}
              {office.location && (
                <div className="px-5 py-4 space-y-1">
                  <dt className="text-xs font-medium text-stone-500">Campus Location</dt>
                  <dd className="text-xs font-medium text-stone-900 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-pust-800 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{office.location}</span>
                  </dd>
                </div>
              )}
            </dl>
          )}
        </div>

        {/* Head of Office Section */}
        {office.head && (
          <div className="space-y-4">
            <div className="border-b border-stone-200 pb-3">
              <p className="text-xs font-medium text-pust-800">Executive Lead</p>
              <h3 className="font-serif text-xl font-medium text-stone-950 mt-0.5">
                Head of Office
              </h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PersonnelEntry
                person={office.head}
                isHead
                copiedEmail={copiedEmail}
                onCopyEmail={onCopyEmail}
              />
            </div>
          </div>
        )}

        {/* Officers Roster */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-200 pb-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-pust-800">
                Administrative Staff &amp; Section Wing
              </p>
              <h3 className="font-serif text-xl sm:text-2xl font-medium text-stone-950">
                {office.officersLabel || 'Officers'} ({office.officers.length})
              </h3>
            </div>

            {office.officers.length > 4 && (
              <div className="w-full sm:w-72 relative">
                <Search
                  className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={rosterQuery}
                  onChange={(e) => setRosterQuery(e.target.value)}
                  placeholder="Filter officers by name or role..."
                  aria-label="Filter office officers"
                  className="w-full pl-9 pr-8 py-2 text-xs bg-[#FBF9F5] border border-stone-300 rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-pust-800 focus:bg-white"
                />
                {rosterQuery && (
                  <button
                    type="button"
                    onClick={() => setRosterQuery('')}
                    aria-label="Clear officer filter"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            )}
          </div>

          {office.officers.length === 0 ? (
            <div className="rounded-xl border border-stone-200 bg-[#FBF9F5] p-6 text-sm text-stone-600">
              Official section desk inquiries for{' '}
              <span className="font-medium text-stone-900">{office.name}</span> are coordinated
              through the office contact desk and the central Registrar Registry.
            </div>
          ) : filteredOfficers.length === 0 ? (
            <div className="rounded-xl border border-stone-200 bg-[#FBF9F5] p-8 text-center space-y-3">
              <p className="text-sm text-stone-600">
                No officer matched <span className="font-medium text-stone-900">“{rosterQuery}”</span>.
              </p>
              <button
                type="button"
                onClick={() => setRosterQuery('')}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-stone-300 bg-white text-pust-900 hover:border-pust-800 cursor-pointer"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-stretch">
              {filteredOfficers.map((officer) => (
                <PersonnelEntry
                  key={officer.id}
                  person={officer}
                  copiedEmail={copiedEmail}
                  onCopyEmail={onCopyEmail}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function AllOfficesDirectory({
  offices,
  activeRoute,
}: {
  offices: AdministrationOfficeRecord[];
  activeRoute: string;
}) {
  const [category, setCategory] = useState<'All' | AdminOfficeCategory>('All');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return offices.filter((office) => {
      if (category !== 'All' && office.category !== category) return false;
      if (!q) return true;
      const peopleText = [
        office.head ? `${office.head.name} ${office.head.designation}` : '',
        ...office.officers.map((o) => `${o.name} ${o.designation}`),
      ]
        .join(' ')
        .toLowerCase();
      return (
        office.name.toLowerCase().includes(q) ||
        office.code.toLowerCase().includes(q) ||
        office.summary.toLowerCase().includes(q) ||
        (office.officeEmail || '').toLowerCase().includes(q) ||
        peopleText.includes(q)
      );
    });
  }, [offices, category, query]);

  return (
    <section
      id="all-offices-directory"
      className="rounded-xl border border-stone-200 bg-white p-6 sm:p-8 space-y-8"
    >
      <div className="space-y-8">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 border-b border-stone-200 pb-6">
          <div className="space-y-1.5 max-w-2xl">
            <p className="text-xs font-medium text-pust-800">
              Complete Administrative Registry · {offices.length} Official Offices, Halls &amp; Cells
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-medium text-stone-950">
              Directory of All {offices.length} University Offices
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              Select any administrative office, statutory section, residential hall, or specialized
              cell to inspect direct contact details, leadership, and full officer rosters.
            </p>
          </div>

          <div className="w-full lg:w-80 relative">
            <Search
              className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search 33 offices, heads, or staff..."
              aria-label="Filter all 33 administration offices"
              className="w-full pl-10 pr-9 py-2.5 text-sm bg-white border border-stone-300 rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-pust-800"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear directory search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Wing Segmented Filter Bar */}
        <div
          className="flex overflow-x-auto no-scrollbar sm:flex-wrap gap-1 p-1 bg-stone-200/60 border border-stone-200 rounded-lg -mx-4 px-4 sm:mx-0 sm:px-1"
          role="group"
          aria-label="Filter administration offices by wing"
        >
          {OFFICE_CATEGORIES.map((cat) => {
            const active = category === cat;
            const count =
              cat === 'All'
                ? offices.length
                : offices.filter((o) => o.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-white text-stone-950 shadow-xs'
                    : 'text-stone-600 hover:text-stone-950'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-stone-200 bg-white p-10 text-center space-y-3">
            <p className="text-sm text-stone-600">
              No administration office matched <span className="font-medium text-stone-900">“{query}”</span>.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setCategory('All');
              }}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-stone-300 bg-[#FBF9F5] text-pust-900 hover:border-pust-800 cursor-pointer"
            >
              Show All {offices.length} Offices
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-stretch">
            {filtered.map((office) => {
              const isCurrent = activeRoute === office.route;
              const officerCount = office.officers.length;
              return (
                <Link
                  key={office.slug}
                  href={office.route}
                  className={`group h-full flex flex-col justify-between p-5 rounded-xl border transition-colors duration-150 text-left ${
                    isCurrent
                      ? 'bg-pust-50/50 border-pust-800'
                      : 'bg-[#FBF9F5] border-stone-200 hover:bg-white hover:border-pust-700/60'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2 text-xs text-stone-500 font-mono tabular-nums">
                      <span className="font-semibold text-pust-900">{office.code}</span>
                      <span>
                        {officerCount > 0
                          ? `${officerCount} ${officerCount === 1 ? 'Officer' : 'Officers'}`
                          : office.head
                          ? 'Head Listed'
                          : 'Unit Desk'}
                      </span>
                    </div>
                    <h3 className="font-serif text-lg font-medium text-stone-950 group-hover:text-pust-900 transition-colors leading-snug text-left">
                      {office.name}
                    </h3>
                    <p className="text-xs text-stone-600 leading-relaxed line-clamp-2 text-left">
                      {office.summary}
                    </p>
                  </div>

                  <div className="pt-4 mt-5 border-t border-stone-200/80 space-y-2">
                    {office.head && (
                      <p className="text-xs font-medium text-stone-800 truncate text-left">
                        {office.head.name} ·{' '}
                        <span className="text-stone-500 font-normal">{office.head.designation}</span>
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-mono text-[11px] text-stone-600 truncate">
                        {office.officeEmail || office.officePhone || 'Rajapur Campus'}
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-pust-900 group-hover:translate-x-0.5 transition-transform shrink-0">
                        Open Dossier
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
