'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  Check,
  Copy,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Search,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import type {
  AdministrationOfficeRecord,
  AdminOfficeCategory,
  AdminOfficePersonnel,
} from '../types/pust';
import { MotionCard } from './MotionPrimitives';

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

function PersonnelCard({
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
    <MotionCard
      className={`h-full rounded-2xl border p-5 sm:p-6 flex flex-col justify-between gap-4 text-left transition-all ${
        isHead
          ? 'card-gradient-parchment border-pust-700/35 shadow-sm'
          : 'bg-white border-slate-200 hover:border-pust-600/40 hover:shadow-md'
      }`}
    >
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
              isHead
                ? 'bg-pust-900 text-white border-pust-900'
                : 'bg-pust-50 text-pust-800 border-pust-200'
            }`}
          >
            {isHead ? <UserCheck className="w-3 h-3" /> : <Users className="w-3 h-3" />}
            {person.designation}
          </span>
        </div>

        <h3 className="font-serif text-lg sm:text-xl font-semibold text-slate-950 leading-snug text-left">
          {person.name}
        </h3>

        {person.qualification && (
          <div className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed pt-0.5">
            <GraduationCap className="w-3.5 h-3.5 text-pust-700 shrink-0 mt-0.5" />
            <p className="text-left">{person.qualification}</p>
          </div>
        )}

        {person.researchArea && (
          <p className="text-xs text-slate-600 leading-relaxed border-l-2 border-amber-500/60 pl-2.5 text-left">
            <span className="font-semibold text-slate-800">Research:</span> {person.researchArea}
          </p>
        )}
      </div>

      {(phones.length > 0 || emails.length > 0) && (
        <div className="pt-3 border-t border-slate-200/80 space-y-2 text-xs font-mono tabular-nums">
          {phones.map((p, idx) => (
            <div key={`${p.value}-${idx}`} className="flex items-center justify-between gap-2">
              <a
                href={`tel:${sanitizeTel(p.value)}`}
                className="inline-flex items-center gap-1.5 text-slate-800 hover:text-pust-900 transition-colors break-all"
              >
                <Phone className="w-3.5 h-3.5 text-pust-700 shrink-0" />
                {p.value}
              </a>
              <span className="font-sans text-[10px] font-semibold uppercase tracking-wider text-slate-500 shrink-0">
                {p.type}
              </span>
            </div>
          ))}

          {emails.map((em, idx) => {
            const isCopied = copiedEmail === em.value;
            return (
              <div key={`${em.value}-${idx}`} className="flex items-center justify-between gap-2">
                <a
                  href={`mailto:${em.value}`}
                  className="inline-flex items-center gap-1.5 text-pust-900 hover:underline min-w-0 break-all"
                >
                  <Mail className="w-3.5 h-3.5 text-pust-700 shrink-0" />
                  <span className="truncate sm:whitespace-normal">{em.value}</span>
                </a>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="font-sans text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    {em.type}
                  </span>
                  <button
                    type="button"
                    onClick={() => onCopyEmail(em.value)}
                    aria-label={`Copy ${em.value}`}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-200 bg-[#FAF8F4] text-[10px] font-sans font-medium text-slate-700 hover:border-pust-800 hover:text-pust-900 transition-colors cursor-pointer"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-2.5 h-2.5 text-emerald-700" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-2.5 h-2.5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </MotionCard>
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
    <section className="bg-white border-b border-slate-200 py-12 lg:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Office Contact Ribbon */}
        <div className="rounded-2xl border border-amber-900/15 bg-[#FAF8F4] p-6 sm:p-8 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-semibold uppercase tracking-widest text-pust-800">
                  {office.code} · {office.category}
                </span>
                {totalPersonnel > 0 && (
                  <span className="font-mono text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                    {totalPersonnel} {totalPersonnel === 1 ? 'Listed Official' : 'Listed Officials'}
                  </span>
                )}
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-950 text-left">
                {office.name} — Office Desk &amp; Personnel Roster
              </h2>
            </div>

            <Link
              href="/administration/all-office"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-800 hover:border-pust-800 hover:text-pust-900 transition-colors whitespace-nowrap self-start lg:self-auto"
            >
              Browse All 33 Offices
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            {office.officeEmail && (
              <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-1">
                <dt className="text-xs font-medium text-slate-500">Official Office Email</dt>
                <dd className="font-mono text-xs font-semibold text-pust-900 break-all">
                  <a href={`mailto:${office.officeEmail}`} className="hover:underline">
                    {office.officeEmail}
                  </a>
                </dd>
              </div>
            )}
            {office.officePhone && (
              <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-1">
                <dt className="text-xs font-medium text-slate-500">Office Telephone</dt>
                <dd className="font-mono text-xs font-semibold text-slate-950 tabular-nums">
                  <a href={`tel:${sanitizeTel(office.officePhone)}`} className="hover:text-pust-800">
                    {office.officePhone}
                  </a>
                </dd>
              </div>
            )}
            {office.deskEmail && office.deskEmail !== office.officeEmail && (
              <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-1">
                <dt className="text-xs font-medium text-slate-500">Front Desk Email</dt>
                <dd className="font-mono text-xs font-semibold text-pust-900 break-all">
                  <a href={`mailto:${office.deskEmail}`} className="hover:underline">
                    {office.deskEmail}
                  </a>
                </dd>
              </div>
            )}
            {office.location && (
              <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-1">
                <dt className="text-xs font-medium text-slate-500">Campus Location</dt>
                <dd className="text-xs font-semibold text-slate-900 flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-pust-700 shrink-0 mt-0.5" />
                  <span>{office.location}</span>
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Head of Office Card */}
        {office.head && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-pust-800" />
              <h3 className="font-serif text-xl font-medium text-slate-950">
                Head of Office / Executive Lead
              </h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <PersonnelCard
                person={office.head}
                isHead
                copiedEmail={copiedEmail}
                onCopyEmail={onCopyEmail}
              />
            </div>
          </div>
        )}

        {/* Officers Roster */}
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-pust-800">
                Administrative Staff &amp; Section Wing
              </p>
              <h3 className="font-serif text-xl sm:text-2xl font-medium text-slate-950">
                {office.officersLabel || 'Officers'} ({office.officers.length})
              </h3>
            </div>

            {office.officers.length > 4 && (
              <div className="w-full sm:w-72 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="search"
                  value={rosterQuery}
                  onChange={(e) => setRosterQuery(e.target.value)}
                  placeholder="Filter officers by name or role..."
                  aria-label="Filter office officers"
                  className="w-full pl-9 pr-8 py-2 text-xs bg-[#FAF8F4] border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-pust-800 focus:bg-white"
                />
                {rosterQuery && (
                  <button
                    type="button"
                    onClick={() => setRosterQuery('')}
                    aria-label="Clear officer filter"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {office.officers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-[#FAF8F4] p-6 text-sm text-slate-600">
              Official section desk inquiries for <span className="font-medium text-slate-900">{office.name}</span> are
              coordinated through the office contact desk and central Registrar Registry.
            </div>
          ) : filteredOfficers.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-[#FAF8F4] p-8 text-center space-y-2">
              <p className="text-sm text-slate-600">
                No officer matched <span className="font-medium text-slate-900">“{rosterQuery}”</span>.
              </p>
              <button
                type="button"
                onClick={() => setRosterQuery('')}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-pust-900 hover:border-pust-800 cursor-pointer"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
              {filteredOfficers.map((officer) => (
                <PersonnelCard
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
      className="bg-white border-b border-slate-200 py-14 lg:py-16"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div className="space-y-1 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-pust-800">
              Complete Administrative Registry · {offices.length} Official Offices, Halls &amp; Cells
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-medium text-slate-950">
              PUST Administration Directory (All {offices.length} Offices)
            </h2>
            <p className="text-sm text-slate-600">
              Select any administrative office, statutory wing, residential hall, or specialized cell to
              inspect direct contact details, office heads, and full officer rosters.
            </p>
          </div>

          <div className="w-full lg:w-80 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search all 33 offices or officers..."
              aria-label="Filter all 33 administration offices"
              className="w-full pl-10 pr-9 py-2.5 text-sm bg-[#FAF8F4] border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-pust-800 focus:bg-white"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear directory search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Ribbon */}
        <div
          className="flex overflow-x-auto no-scrollbar sm:flex-wrap gap-1.5 p-1.5 bg-[#FAF8F4] border border-slate-200 rounded-xl -mx-4 px-4 sm:mx-0 sm:px-1.5"
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
                className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-pust-900 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-white hover:text-pust-900'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-[#FAF8F4] p-10 text-center space-y-3">
            <p className="text-sm text-slate-600">
              No administration office matched <span className="font-medium text-slate-900">“{query}”</span>.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setCategory('All');
              }}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-pust-900 hover:border-pust-800 cursor-pointer"
            >
              Show All {offices.length} Offices
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
            {filtered.map((office) => {
              const isCurrent = activeRoute === office.route;
              const officerCount = office.officers.length;
              return (
                <Link
                  key={office.slug}
                  href={office.route}
                  className={`group h-full flex flex-col justify-between p-5 sm:p-6 rounded-2xl border transition-all text-left ${
                    isCurrent
                      ? 'card-gradient-crimson border-pust-800 shadow-sm'
                      : 'bg-[#FAF8F4]/75 border-slate-200 hover:bg-white hover:border-pust-700/50 hover:shadow-md'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-pust-800">
                        {office.code}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">
                        {officerCount > 0 ? `${officerCount} Officers` : office.head ? 'Head Listed' : 'Unit Desk'}
                      </span>
                    </div>
                    <h3 className="font-serif text-lg font-semibold text-slate-950 group-hover:text-pust-900 transition-colors leading-snug text-left">
                      {office.name}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 text-left">
                      {office.summary}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-200/80 space-y-1.5">
                    {office.head && (
                      <p className="text-xs font-medium text-slate-800 truncate">
                        {office.head.name} · <span className="text-slate-500">{office.head.designation}</span>
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-2 pt-0.5 text-xs">
                      <span className="font-mono text-[11px] text-pust-800 truncate">
                        {office.officeEmail || office.officePhone || 'Rajapur Campus'}
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-pust-900 group-hover:translate-x-0.5 transition-transform shrink-0">
                        View
                        <ArrowRight className="w-3.5 h-3.5" />
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
