'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Check,
  Copy,
  ExternalLink,
  FlaskConical,
  Library,
  Search,
  X,
} from 'lucide-react';
import { resolveUniversityContent } from '../lib/cmsDefaults';
import type {
  DepartmentRecord,
  FacultyName,
  JournalRecord,
  PublicationRecord,
} from '../types/pust';
import { EditTriggerButton } from './EditTriggerButton';
import { MotionCard, MotionReveal } from './MotionPrimitives';
import { usePust } from './PustContext';
import { ResilientImage } from './ResilientImage';

interface ResearchSectionProps {
  publications: PublicationRecord[];
  journals: JournalRecord[];
  departments?: DepartmentRecord[];
  focus?: 'journals' | 'publications';
  showInfrastructure?: boolean;
}

const RESEARCH_FACULTY_FILTERS: Array<{ label: string; value: 'All' | FacultyName }> = [
  { label: 'All Faculties', value: 'All' },
  { label: 'Engineering & Technology', value: 'Faculty of Engineering and Technology' },
  { label: 'Science', value: 'Faculty of Science' },
  { label: 'Business Studies', value: 'Faculty of Business Studies' },
  { label: 'Humanities & Social Science', value: 'Faculty of Humanities and Social Science' },
  { label: 'Life & Earth Science', value: 'Faculty of Life and Earth Science' },
];

export function ResearchSection({
  publications,
  journals,
  departments = [],
  focus = 'publications',
  showInfrastructure = true,
}: ResearchSectionProps) {
  const { profile } = usePust();
  const { academicExtras } = resolveUniversityContent(profile);
  const [selectedFaculty, setSelectedFaculty] = useState<'All' | FacultyName>('All');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [doiOnly, setDoiOnly] = useState(false);
  const [pubQuery, setPubQuery] = useState('');
  const [showAllDepts, setShowAllDepts] = useState(false);
  const [copiedPubId, setCopiedPubId] = useState<string | null>(null);

  const deptByCode = useMemo(
    () => new Map(departments.map((d) => [d.code.toUpperCase(), d])),
    [departments]
  );

  const deptResearchList = useMemo(
    () =>
      departments
        .filter((d) => (d.researchTotal ?? 0) > 0)
        .sort((a, b) => (b.researchTotal ?? 0) - (a.researchTotal ?? 0)),
    [departments]
  );

  const filteredResearchDepts = useMemo(
    () =>
      deptResearchList.filter(
        (d) => selectedFaculty === 'All' || d.faculty === selectedFaculty
      ),
    [deptResearchList, selectedFaculty]
  );

  const visibleResearchDepts = showAllDepts
    ? filteredResearchDepts
    : filteredResearchDepts.slice(0, 8);

  const maxDeptWorks = useMemo(
    () =>
      deptResearchList.reduce(
        (max, d) => Math.max(max, d.researchTotal ?? 0),
        1
      ),
    [deptResearchList]
  );

  const totalResearchOutputs = useMemo(
    () => deptResearchList.reduce((sum, d) => sum + (d.researchTotal ?? 0), 0),
    [deptResearchList]
  );

  const totalFaculty = useMemo(
    () =>
      departments.some((d) => (d.facultyCount ?? 0) > 0)
        ? departments.reduce((sum, d) => sum + (d.facultyCount ?? 0), 0)
        : profile?.facultyMembersCount ?? 0,
    [departments, profile?.facultyMembersCount]
  );

  const doiIndexedCount = useMemo(
    () => publications.filter((p) => Boolean(p.doi || p.url)).length,
    [publications]
  );

  const publicationDeptCodes = useMemo(
    () => ['ALL', ...Array.from(new Set(publications.map((p) => p.departmentCode)))],
    [publications]
  );

  const q = pubQuery.trim().toLowerCase();
  const visiblePubs = useMemo(() => {
    return publications.filter((p) => {
      const dept = deptByCode.get(p.departmentCode.toUpperCase());
      const matchesFaculty =
        selectedFaculty === 'All' || !dept || dept.faculty === selectedFaculty;
      const matchesDept =
        selectedDeptFilter === 'ALL' || p.departmentCode === selectedDeptFilter;
      const matchesDoi = !doiOnly || Boolean(p.doi || p.url);
      const matchesQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.authors.toLowerCase().includes(q) ||
        p.domain.toLowerCase().includes(q) ||
        p.departmentCode.toLowerCase().includes(q) ||
        (p.venue || '').toLowerCase().includes(q) ||
        (p.doi || '').toLowerCase().includes(q) ||
        String(p.year).includes(q);
      return matchesFaculty && matchesDept && matchesDoi && matchesQuery;
    });
  }, [publications, deptByCode, selectedFaculty, selectedDeptFilter, doiOnly, q]);

  const featuredPub = focus === 'publications' && visiblePubs.length > 0 ? visiblePubs[0] : null;
  const catalogPubs = featuredPub ? visiblePubs.slice(1) : visiblePubs;

  async function handleCopyCitation(pub: PublicationRecord) {
    const doiSuffix = pub.doi ? ` DOI: ${pub.doi}.` : '';
    const citation = `${pub.authors} (${pub.year}). "${pub.title}." ${
      pub.venue || `${pub.domain} Research Series`
    }, Dept. of ${pub.departmentCode}, Pabna University of Science and Technology.${doiSuffix}`;
    try {
      await navigator.clipboard.writeText(citation);
      setCopiedPubId(pub.id);
      window.setTimeout(() => {
        setCopiedPubId((prev) => (prev === pub.id ? null : prev));
      }, 1800);
    } catch {
      // Clipboard unavailable
    }
  }

  function renderPublicationActions(pub: PublicationRecord) {
    const isCopied = copiedPubId === pub.id;
    const externalUrl = pub.url || (pub.doi ? `https://doi.org/${pub.doi}` : undefined);
    const dept = deptByCode.get(pub.departmentCode.toUpperCase());

    return (
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {externalUrl && (
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-pust-800/30 bg-pust-50/50 text-[11px] font-semibold text-pust-900 hover:border-pust-800 hover:bg-pust-50 transition-colors whitespace-nowrap"
          >
            <ExternalLink className="w-3 h-3" />
            {pub.doi ? 'Open DOI' : 'View Paper'}
          </a>
        )}
        <button
          type="button"
          onClick={() => handleCopyCitation(pub)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-stone-200 bg-white text-[11px] font-medium text-slate-700 hover:border-pust-800 hover:text-pust-900 transition-colors cursor-pointer whitespace-nowrap"
        >
          {isCopied ? (
            <>
              <Check className="w-3 h-3 text-emerald-700" />
              Citation Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy Citation
            </>
          )}
        </button>
        {dept && (
          <Link
            href={`/academics/departments/${encodeURIComponent(dept.code.toLowerCase())}`}
            prefetch={true}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-stone-200 bg-[#FAF9F6] text-[11px] font-medium text-slate-700 hover:border-pust-800 hover:text-pust-900 transition-colors whitespace-nowrap"
          >
            Dept. {dept.code}
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
        <EditTriggerButton
          target={{ kind: 'publication', publication: pub }}
          label="Edit"
          variant="compact"
        />
      </div>
    );
  }

  const publicationsBlock = (
    <MotionReveal
      className={
        focus === 'journals' ? 'lg:col-span-6 space-y-6' : 'lg:col-span-8 space-y-6'
      }
    >
      <div className="editable-region rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-200 pb-4">
          <div className="space-y-1">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-pust-800 text-left">
              Curated Bibliography · Peer-Reviewed Works
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-950 text-left">
              Recent Faculty Publications
            </h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <EditTriggerButton
              target={{ kind: 'publication', publication: null }}
              label="Add Publication"
              icon="add"
              variant="compact"
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex overflow-x-auto no-scrollbar sm:flex-wrap items-center gap-1.5 -mx-1 px-1 pb-1 sm:pb-0">
            {publicationDeptCodes.map((code) => {
              const active = selectedDeptFilter === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setSelectedDeptFilter(code)}
                  className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-pust-900 text-white'
                      : 'bg-[#FAF9F6] border border-stone-200 text-slate-800 hover:text-pust-900 hover:border-pust-700/50'
                  }`}
                >
                  {code}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setDoiOnly((prev) => !prev)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                doiOnly
                  ? 'bg-lapis-900 text-white'
                  : 'bg-[#FAF9F6] border border-stone-200 text-slate-700 hover:border-lapis-700/50 hover:text-lapis-900'
              }`}
            >
              DOI Indexed Only
            </button>
          </div>

          <div className="relative w-full md:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={pubQuery}
              onChange={(e) => setPubQuery(e.target.value)}
              placeholder="Search title, author, DOI..."
              aria-label="Filter publications"
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-300 bg-[#FAF9F6] focus:bg-white focus:border-pust-700 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <span className="font-mono tabular-nums">
            Showing <strong className="text-slate-950">{visiblePubs.length}</strong> of{' '}
            <strong className="text-slate-950">{publications.length}</strong> highlighted works
            {selectedDeptFilter !== 'ALL' ? ` in ${selectedDeptFilter}` : ''}
          </span>
          {(selectedDeptFilter !== 'ALL' ||
            selectedFaculty !== 'All' ||
            doiOnly ||
            pubQuery.trim() !== '') && (
            <button
              type="button"
              onClick={() => {
                setSelectedFaculty('All');
                setSelectedDeptFilter('ALL');
                setDoiOnly(false);
                setPubQuery('');
              }}
              className="inline-flex items-center gap-1 font-semibold text-pust-800 hover:underline cursor-pointer"
            >
              <X className="w-3 h-3" />
              Reset filters
            </button>
          )}
        </div>
      </div>

      {visiblePubs.length === 0 ? (
        <div className="p-8 rounded-2xl border border-stone-200 bg-white space-y-3">
          <p className="text-sm text-slate-700 text-left">
            No highlighted publication matched{' '}
            <span className="font-mono font-semibold">{selectedDeptFilter}</span>
            {pubQuery ? ` for "${pubQuery}"` : ''}. Browse the full departmental archive on the
            official PUST Publications Portal.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => {
                setSelectedFaculty('All');
                setSelectedDeptFilter('ALL');
                setDoiOnly(false);
                setPubQuery('');
              }}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-stone-300 bg-[#FAF9F6] text-pust-900 hover:border-pust-800 cursor-pointer"
            >
              Show All Highlighted Papers
            </button>
            <a
              href="https://pust.ac.bd/academic/publications/D00"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-pust-900 text-white hover:bg-pust-950"
            >
              PUST Official Publications Portal
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {featuredPub && (
            <article className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-7 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-mono text-xs font-semibold text-pust-800 tabular-nums text-left">
                  01 · Featured Study · {featuredPub.departmentCode} · {featuredPub.domain} ·{' '}
                  {featuredPub.year}
                </p>
                {featuredPub.doi && (
                  <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                    DOI: {featuredPub.doi}
                  </span>
                )}
              </div>

              <h3 className="font-serif text-xl sm:text-2xl font-semibold text-slate-950 leading-snug text-left">
                {featuredPub.title}
              </h3>

              <div className="space-y-1 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <p className="text-left">
                  <span className="font-medium text-slate-500">Authors:</span>{' '}
                  {featuredPub.authors}
                </p>
                {featuredPub.venue && (
                  <p className="text-left">
                    <span className="font-medium text-slate-500">Published in:</span>{' '}
                    <span className="font-medium text-slate-900">{featuredPub.venue}</span>
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-stone-200/80 flex flex-wrap items-center justify-between gap-3">
                {renderPublicationActions(featuredPub)}
              </div>
            </article>
          )}

          {catalogPubs.length > 0 && (
            <div className="rounded-2xl border border-stone-200 bg-white divide-y divide-stone-200 overflow-hidden">
              {catalogPubs.map((pub, idx) => {
                const entryNumber = String(featuredPub ? idx + 2 : idx + 1).padStart(2, '0');
                return (
                  <article
                    key={pub.id}
                    className={`p-5 sm:p-6 space-y-2.5 transition-colors hover:bg-[#FAF9F6] ${
                      idx % 2 === 1 ? 'bg-[#FAF9F6]/50' : 'bg-white'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <p className="font-mono text-xs font-semibold text-pust-800 tabular-nums text-left">
                        {entryNumber} · {pub.departmentCode} · {pub.domain} · {pub.year}
                      </p>
                      {pub.doi && (
                        <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                          DOI: {pub.doi}
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif text-lg font-semibold text-slate-950 leading-snug text-left">
                      {pub.title}
                    </h3>

                    <p className="text-xs text-slate-700 leading-relaxed text-left">
                      <span className="text-slate-500">Authors:</span> {pub.authors}
                      {pub.venue ? ` · ${pub.venue}` : ''}
                    </p>

                    <div className="pt-1">{renderPublicationActions(pub)}</div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}
    </MotionReveal>
  );

  const journalsBlock = (
    <MotionReveal
      delay={0.05}
      className={`${
        focus === 'journals' ? 'lg:col-span-6' : 'lg:col-span-4'
      } space-y-6`}
    >
      <div className="editable-region bg-[#FAF9F6] rounded-2xl border border-stone-200 p-6 space-y-5">
        <div className="border-b border-stone-200 pb-4 flex items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-gold-700 text-left">
              University Periodicals
            </p>
            <h2 className="font-serif text-2xl font-semibold text-slate-950 mt-1 text-left">
              Official PUST Journals
            </h2>
          </div>
          <EditTriggerButton
            target={{ kind: 'journals' }}
            label="Edit Journals"
            variant="compact"
          />
        </div>

        {journals.length === 0 ? (
          <p className="text-sm text-slate-700 py-4 text-left">
            No official journals are currently listed in the periodicals directory.
          </p>
        ) : (
          <div className="divide-y divide-stone-200">
            {journals.map((journal, idx) => (
              <div key={journal.id} className="py-4 first:pt-0 last:pb-0 space-y-1.5">
                <p className="font-mono text-[11px] font-semibold text-slate-600 tabular-nums text-left">
                  0{idx + 1} · {journal.issn}
                </p>
                <h3 className="font-serif text-lg font-semibold text-slate-950 leading-snug text-left">
                  {journal.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed text-left">
                  {journal.scope}
                </p>
                <p className="font-mono text-[11px] font-semibold text-pust-800 text-left">
                  {journal.currentIssue}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="pt-3 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-slate-600">Call for Papers &amp; Editorial Boards</span>
          <a
            href="https://pust.ac.bd/academic/pust-journals"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-pust-900 hover:underline whitespace-nowrap"
          >
            PUST Journals Archive
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* RTTC & IIED Institutional Research Gateway */}
      <div className="rounded-2xl border border-pust-900 bg-pust-950 text-white p-6 space-y-4">
        <div className="space-y-1.5">
          <p className="font-mono text-[11px] uppercase tracking-widest text-gold-300 text-left">
            Research Governance · RTTC &amp; IIED
          </p>
          <h3 className="font-serif text-xl font-semibold text-white text-left">
            Research Grants, Patents &amp; Industry MoUs
          </h3>
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed text-left">
            Coordinated by the Research &amp; Technology Transfer Cell (RTTC) and the Institute of
            Innovation and Entrepreneurship Development (IIED) across all five faculties.
          </p>
        </div>

        <div className="pt-3 border-t border-white/15 flex flex-col gap-2 text-xs font-semibold">
          <a
            href="https://pust.ac.bd/academic/publications/D00"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-between text-gold-200 hover:text-white transition-colors"
          >
            <span>Complete Faculty Publication Archive (pust.ac.bd)</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </a>
          <Link
            href="/academics/seminars"
            className="inline-flex items-center justify-between text-stone-200 hover:text-white transition-colors"
          >
            <span>Symposia, IQAC Workshops &amp; Colloquia</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </Link>
          <Link
            href="/facilities/library"
            className="inline-flex items-center justify-between text-stone-200 hover:text-white transition-colors"
          >
            <span>Central Library IEEE &amp; SpringerLink Access</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </Link>
        </div>
      </div>
    </MotionReveal>
  );

  return (
    <div id="research" className="space-y-12">
      {/* 1. Institutional Scholarship Ledger */}
      <MotionReveal>
        <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-200">
            <div className="p-5 sm:p-6 space-y-1.5">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-pust-800 text-left">
                01 · Faculty Outputs
              </p>
              <p className="font-serif text-2xl sm:text-3xl font-semibold text-slate-950 tabular-nums text-left">
                {totalResearchOutputs > 0
                  ? `${totalResearchOutputs.toLocaleString('en-US')}+`
                  : '4,200+'}
              </p>
              <p className="text-xs text-slate-600 text-left">
                Indexed articles &amp; conference works across {totalFaculty || 228} faculty members.
              </p>
            </div>

            <div className="p-5 sm:p-6 space-y-1.5 bg-[#FAF9F6]/70">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-pust-800 text-left">
                02 · Highlighted Studies
              </p>
              <p className="font-serif text-2xl sm:text-3xl font-semibold text-slate-950 tabular-nums text-left">
                {publications.length} Works
              </p>
              <p className="text-xs text-slate-600 text-left">
                {doiIndexedCount} studies with verified DOI links in IEEE, Elsevier Q1 &amp; journals.
              </p>
            </div>

            <div className="p-5 sm:p-6 space-y-1.5">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-pust-800 text-left">
                03 · PUST Periodicals
              </p>
              <p className="font-serif text-2xl sm:text-3xl font-semibold text-slate-950 tabular-nums text-left">
                {journals.length || 3} Journals
              </p>
              <p className="text-xs text-slate-600 text-left">
                PUST Studies (ISSN 2308-6246), JHSS &amp; Journal of Business Studies.
              </p>
            </div>

            <div className="p-5 sm:p-6 space-y-1.5 bg-[#FAF9F6]/70">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-pust-800 text-left">
                04 · Research Cells
              </p>
              <p className="font-serif text-2xl sm:text-3xl font-semibold text-slate-950 text-left">
                RTTC &amp; IIED
              </p>
              <p className="text-xs text-slate-600 text-left">
                University research funding, technology transfer &amp; 30+ departmental labs.
              </p>
            </div>
          </div>
        </div>
      </MotionReveal>

      {/* 2. Departmental Research Output Index */}
      {deptResearchList.length > 0 && (
        <MotionReveal>
          <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-stone-200 pb-4">
              <div className="space-y-1">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-pust-800 flex items-center gap-1.5 text-left">
                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                  Official Faculty Publication Index (pust.ac.bd)
                </p>
                <h2 className="font-serif text-xl sm:text-2xl font-semibold text-slate-950 text-left">
                  Research Output by Department — Click to Filter Catalog
                </h2>
              </div>
              <a
                href="https://pust.ac.bd/academic/publications/D00"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-pust-900 hover:underline whitespace-nowrap shrink-0"
              >
                View Official Index
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="flex overflow-x-auto no-scrollbar sm:flex-wrap gap-1.5 -mx-1 px-1 pb-1 sm:pb-0">
              {RESEARCH_FACULTY_FILTERS.map((fac) => {
                const active = selectedFaculty === fac.value;
                return (
                  <button
                    key={fac.value}
                    type="button"
                    onClick={() => {
                      setSelectedFaculty(fac.value);
                      if (fac.value !== 'All' && selectedDeptFilter !== 'ALL') {
                        const currentDept = deptByCode.get(selectedDeptFilter);
                        if (currentDept && currentDept.faculty !== fac.value) {
                          setSelectedDeptFilter('ALL');
                        }
                      }
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-pust-900 text-white'
                        : 'bg-[#FAF9F6] border border-stone-200 text-slate-800 hover:border-pust-700/50 hover:text-pust-900'
                    }`}
                  >
                    {fac.label}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {visibleResearchDepts.map((dept, idx) => {
                const active = selectedDeptFilter === dept.code;
                const works = dept.researchTotal ?? 0;
                const barWidth = Math.max(8, Math.round((works / maxDeptWorks) * 100));

                return (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() =>
                      setSelectedDeptFilter((prev) => (prev === dept.code ? 'ALL' : dept.code))
                    }
                    className={`text-left p-4 rounded-xl border transition-colors cursor-pointer flex flex-col justify-between gap-3 ${
                      active
                        ? 'bg-pust-950 text-white border-pust-950'
                        : 'bg-[#FAF9F6] border-stone-200 text-slate-950 hover:border-pust-700/50 hover:bg-white'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`font-mono text-xs font-semibold tabular-nums ${
                            active ? 'text-gold-300' : 'text-pust-800'
                          }`}
                        >
                          {String(idx + 1).padStart(2, '0')} · {dept.code}
                        </span>
                        <span
                          className={`font-mono text-sm font-semibold tabular-nums ${
                            active ? 'text-white' : 'text-slate-950'
                          }`}
                        >
                          {works.toLocaleString('en-US')}
                        </span>
                      </div>
                      <p
                        className={`text-xs font-medium leading-snug line-clamp-1 text-left ${
                          active ? 'text-stone-200' : 'text-slate-700'
                        }`}
                      >
                        {dept.name}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <div
                        className={`h-1 w-full rounded-full overflow-hidden ${
                          active ? 'bg-white/15' : 'bg-stone-200'
                        }`}
                      >
                        <div
                          className={`h-full rounded-full ${
                            active ? 'bg-gold-300' : 'bg-pust-800'
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <p
                        className={`font-mono text-[10px] tabular-nums text-left ${
                          active ? 'text-stone-300' : 'text-slate-500'
                        }`}
                      >
                        {dept.facultyCount ? `${dept.facultyCount} Faculty · ` : ''}
                        {active ? 'Filtered Below' : 'Filter Papers →'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {filteredResearchDepts.length > 8 && (
              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowAllDepts((prev) => !prev)}
                  className="text-xs font-semibold text-pust-900 hover:underline cursor-pointer"
                >
                  {showAllDepts
                    ? 'Show top 8 departments'
                    : `Show all ${filteredResearchDepts.length} departments with indexed outputs`}
                </button>
              </div>
            )}
          </section>
        </MotionReveal>
      )}

      {/* 3. Peer-Reviewed Publications & Official PUST Journals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {focus === 'journals' ? (
          <>
            {journalsBlock}
            {publicationsBlock}
          </>
        ) : (
          <>
            {publicationsBlock}
            {journalsBlock}
          </>
        )}
      </div>

      {/* 4. Compact Research Access & Lab Pathways */}
      {!showInfrastructure && (
        <MotionReveal>
          <section className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-stone-200">
              <div className="p-6 space-y-2">
                <div className="flex items-center justify-between text-pust-800">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider">
                    Digital Library Access
                  </span>
                  <Library className="w-4 h-4 shrink-0" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-slate-950 text-left">
                  IEEE Xplore, SpringerLink &amp; ACM
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed text-left">
                  Campus-IP e-journal subscriptions and print thesis archives at the Central Library &amp; Information Center.
                </p>
                <Link
                  href="/facilities/library"
                  className="inline-flex items-center gap-1 pt-1 text-xs font-semibold text-pust-900 hover:underline"
                >
                  Central Library Services
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="p-6 space-y-2 bg-[#FAF9F6]/60">
                <div className="flex items-center justify-between text-pust-800">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider">
                    Departmental Labs
                  </span>
                  <FlaskConical className="w-4 h-4 shrink-0" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-slate-950 text-left">
                  30+ Specialized Laboratories
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed text-left">
                  Facilities spanning VLSI, THz wireless, explainable AI, pharmaceutical HPLC, and nanotechnology synthesis.
                </p>
                <Link
                  href="/academics/departments"
                  className="inline-flex items-center gap-1 pt-1 text-xs font-semibold text-pust-900 hover:underline"
                >
                  Explore All Departments
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="p-6 space-y-2">
                <div className="flex items-center justify-between text-pust-800">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider">
                    Symposia &amp; Colloquia
                  </span>
                  <BookOpen className="w-4 h-4 shrink-0" />
                </div>
                <h3 className="font-serif text-lg font-semibold text-slate-950 text-left">
                  Academic Seminars &amp; Workshops
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed text-left">
                  Upcoming faculty colloquia, IQAC assessment symposia, and regional engineering workshops.
                </p>
                <Link
                  href="/academics/seminars"
                  className="inline-flex items-center gap-1 pt-1 text-xs font-semibold text-pust-900 hover:underline"
                >
                  View Seminars Schedule
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </section>
        </MotionReveal>
      )}

      {/* Optional Full Media Infrastructure Grid (when showInfrastructure=true) */}
      {showInfrastructure && (
        <div id="campus" className="editable-region pt-12 border-t border-stone-200 space-y-10">
          <MotionReveal className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-7">
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-mono text-xs uppercase tracking-widest text-pust-800 text-left">
                  Research Infrastructure
                </p>
                <EditTriggerButton
                  target={{ kind: 'research-infra' }}
                  label="Edit Infrastructure"
                  variant="compact"
                />
              </div>
              <h2 className="font-serif text-fluid-h2 font-semibold text-slate-950 mt-1 text-left">
                Central Library, Laboratories &amp; Residential Halls
              </h2>
            </div>
            <div className="lg:col-span-5">
              <p className="text-sm text-slate-700 leading-relaxed text-left">
                {academicExtras.researchIntro}
              </p>
            </div>
          </MotionReveal>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {academicExtras.researchInfraCards.map((card, idx) => {
              const surfaceClass =
                idx % 2 === 0
                  ? 'bg-white border-stone-200 hover:border-pust-700/45'
                  : 'bg-[#FAF9F6] border-stone-200 hover:border-pust-700/45';

              return (
                <MotionCard
                  key={card.id}
                  delay={idx * 0.05}
                  className={`${surfaceClass} h-full flex flex-col rounded-2xl border p-5 transition-colors space-y-4 group`}
                >
                  <div className="overflow-hidden rounded-xl">
                    <ResilientImage
                      src={card.imageUrl}
                      alt={card.title}
                      caption={card.caption}
                      className="w-full aspect-[4/3] object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                  </div>
                  <div>
                    <p className="font-mono text-xs font-semibold text-pust-800 text-left">
                      {card.tag}
                    </p>
                    <h3 className="font-serif text-xl font-semibold text-slate-950 mt-1 text-left">
                      {card.title}
                    </h3>
                    <p className="text-sm text-slate-700 mt-2 leading-relaxed text-left">
                      {card.description}
                    </p>
                  </div>
                </MotionCard>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
