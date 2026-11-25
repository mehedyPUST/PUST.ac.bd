'use client';

import { useState } from 'react';
import { BookOpen, Check, Copy, ExternalLink, Search } from 'lucide-react';
import { resolveUniversityContent } from '../lib/cmsDefaults';
import { EditTriggerButton } from './EditTriggerButton';
import { MotionCard } from './MotionPrimitives';
import { usePust } from './PustContext';
import { ResilientImage } from './ResilientImage';
import type { DepartmentRecord, JournalRecord, PublicationRecord } from '../types/pust';

interface ResearchSectionProps {
  publications: PublicationRecord[];
  journals: JournalRecord[];
  departments?: DepartmentRecord[];
  labImage: string;
  libraryImage: string;
  groundsImage: string;
  focus?: 'journals' | 'publications';
  showInfrastructure?: boolean;
}

export function ResearchSection({
  publications,
  journals,
  departments = [],
  labImage,
  libraryImage,
  groundsImage,
  focus = 'publications',
  showInfrastructure = true,
}: ResearchSectionProps) {
  const { profile } = usePust();
  const { academicExtras } = resolveUniversityContent(profile);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [pubQuery, setPubQuery] = useState('');
  const [copiedPubId, setCopiedPubId] = useState<string | null>(null);

  const deptResearchList = departments
    .filter((d) => (d.researchTotal ?? 0) > 0)
    .sort((a, b) => (b.researchTotal ?? 0) - (a.researchTotal ?? 0));

  const totalResearchOutputs =
    deptResearchList.length > 0
      ? deptResearchList.reduce((sum, d) => sum + (d.researchTotal ?? 0), 0)
      : 3934;
  const totalFaculty =
    departments.some((d) => (d.facultyCount ?? 0) > 0)
      ? departments.reduce((sum, d) => sum + (d.facultyCount ?? 0), 0)
      : profile?.facultyMembersCount ?? 212;

  const deptFilters = [
    'ALL',
    ...Array.from(
      new Set([
        ...publications.map((p) => p.departmentCode),
        ...deptResearchList.slice(0, 8).map((d) => d.code),
      ])
    ),
  ];

  const q = pubQuery.trim().toLowerCase();
  const visiblePubs = publications.filter((p) => {
    const matchesDept =
      selectedDeptFilter === 'ALL' || p.departmentCode === selectedDeptFilter;
    const matchesQuery =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.authors.toLowerCase().includes(q) ||
      p.domain.toLowerCase().includes(q) ||
      (p.venue || '').toLowerCase().includes(q) ||
      (p.doi || '').toLowerCase().includes(q) ||
      String(p.year).includes(q);
    return matchesDept && matchesQuery;
  });

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

  const publicationsBlock = (
    <div className={focus === 'journals' ? 'lg:col-span-6 space-y-6' : 'lg:col-span-7 space-y-6'}>
      <div className="space-y-4 pb-4 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-pust-800">
              Faculty Research &amp; Periodicals
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl font-medium text-slate-900 mt-1">
              Recent Peer-Reviewed Publications
            </h2>
          </div>
          <EditTriggerButton
            target={{ kind: 'publication', publication: null }}
            label="Add Publication"
            icon="add"
            variant="compact"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex overflow-x-auto no-scrollbar sm:flex-wrap items-center gap-1.5 pb-1 sm:pb-0">
            {deptFilters.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setSelectedDeptFilter(code)}
                className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedDeptFilter === code
                    ? 'bg-pust-900 text-white'
                    : 'bg-[#F7F7F5] border border-slate-200 text-slate-700 hover:text-pust-900 hover:border-pust-700/50'
                }`}
              >
                {code}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={pubQuery}
              onChange={(e) => setPubQuery(e.target.value)}
              placeholder="Search title, author, DOI..."
              aria-label="Filter publications"
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-700 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {visiblePubs.length === 0 ? (
        <div className="p-6 rounded-2xl border border-slate-200 bg-[#F7F7F5] space-y-2.5">
          <p className="text-sm text-slate-700">
            No highlighted paper matched <span className="font-mono font-semibold">{selectedDeptFilter}</span>
            {pubQuery ? ` for "${pubQuery}"` : ''}. Browse the full departmental faculty publication archive on PUST Portal.
          </p>
          <div className="flex flex-wrap gap-2">
            {(selectedDeptFilter !== 'ALL' || pubQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDeptFilter('ALL');
                  setPubQuery('');
                }}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-pust-900 hover:border-pust-800 cursor-pointer"
              >
                Show All Highlighted Papers
              </button>
            )}
            <a
              href="https://pust.ac.bd/academic/publications/D00"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-pust-900 text-white hover:bg-pust-950"
            >
              PUST Official Publications Portal
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-slate-200 border-b border-slate-200">
          {visiblePubs.map((pub) => {
            const isCopied = copiedPubId === pub.id;
            const externalUrl =
              pub.url || (pub.doi ? `https://doi.org/${pub.doi}` : undefined);
            return (
              <article key={pub.id} className="py-4 space-y-1.5 hover:bg-slate-50/70 px-2 -mx-2 rounded-lg transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-mono text-xs text-pust-800 tabular-nums">
                    {pub.departmentCode} · {pub.domain} · {pub.year}
                  </p>
                  <div className="flex items-center gap-2">
                    {externalUrl && (
                      <a
                        href={externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-lapis-200 bg-lapis-50/80 text-[11px] font-medium text-lapis-800 hover:border-lapis-600 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {pub.doi ? 'DOI' : 'View Paper'}
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleCopyCitation(pub)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 bg-[#F7F7F5] text-[11px] font-medium text-slate-700 hover:border-pust-800 hover:text-pust-900 transition-colors cursor-pointer"
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
                    <EditTriggerButton
                      target={{ kind: 'publication', publication: pub }}
                      label="Edit"
                      variant="compact"
                    />
                  </div>
                </div>
                <h3 className="font-serif text-lg font-medium text-slate-900 leading-snug">
                  {pub.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Authors: {pub.authors}
                  {pub.venue ? ` · ${pub.venue}` : ''}
                  {pub.doi ? ` · DOI: ${pub.doi}` : ''}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );

  const journalsBlock = (
    <div
      className={`${
        focus === 'journals' ? 'lg:col-span-6' : 'lg:col-span-5'
      } card-gradient-gold rounded-2xl border border-gold-200/80 shadow-xs hover:border-gold-600/40 transition-colors overflow-hidden`}
    >
      <div className="p-6 sm:p-7 space-y-5">
        <div className="border-b border-gold-200/70 pb-4 flex items-end justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-gold-700">
              University Periodicals
            </p>
            <h2 className="font-serif text-2xl font-medium text-slate-900 mt-1">
              Official PUST Journals
            </h2>
          </div>
          <EditTriggerButton
            target={{ kind: 'journals' }}
            label="Edit Journals"
            variant="compact"
          />
        </div>

        <div className="divide-y divide-gold-200/60">
          {journals.map((journal) => (
            <div key={journal.id} className="py-4 first:pt-1 last:pb-1 space-y-1.5">
              <p className="font-mono text-xs text-slate-500 tabular-nums">{journal.issn}</p>
              <h3 className="font-serif text-lg font-medium text-slate-900">{journal.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{journal.scope}</p>
              <p className="text-xs font-semibold text-gold-800">{journal.currentIssue}</p>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-gold-200/70 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-slate-600">Call for Papers &amp; Editorial Boards</span>
          <a
            href="https://pust.ac.bd/academic/pust-journals"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-pust-900 hover:underline"
          >
            PUST Journals Archive
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <section id="research" className="bg-white border-t border-slate-200 pt-8 pb-14 lg:pb-16">
      <div className="space-y-12">
        {/* Verified Institutional Research Output Summary */}
        {deptResearchList.length > 0 && (
          <div className="card-gradient-lapis rounded-2xl border border-lapis-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-lapis-700 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  Official Faculty Publication Index (pust.ac.bd)
                </p>
                <h2 className="font-serif text-xl sm:text-2xl font-medium text-slate-900 mt-1 tabular-nums">
                  {totalResearchOutputs.toLocaleString()} Research Outputs Across {totalFaculty} Faculty Members
                </h2>
              </div>
              <a
                href="https://pust.ac.bd/academic/publications/D00"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-lapis-800 hover:underline whitespace-nowrap shrink-0"
              >
                View Complete Directory
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {deptResearchList.map((dept) => {
                const active = selectedDeptFilter === dept.code;
                return (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() =>
                      setSelectedDeptFilter((prev) => (prev === dept.code ? 'ALL' : dept.code))
                    }
                    className={`text-left px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                      active
                        ? 'bg-pust-900 text-white border-pust-900 shadow-xs'
                        : 'bg-white/85 border-lapis-200/70 text-slate-800 hover:border-pust-700/60 hover:bg-white'
                    }`}
                  >
                    <p
                      className={`font-mono text-[11px] font-semibold ${
                        active ? 'text-pust-200' : 'text-lapis-800'
                      }`}
                    >
                      {dept.code}
                    </p>
                    <p className="font-mono text-sm font-semibold tabular-nums mt-0.5">
                      {(dept.researchTotal ?? 0).toLocaleString()}{' '}
                      <span
                        className={`text-[10px] font-normal ${
                          active ? 'text-pust-100' : 'text-slate-500'
                        }`}
                      >
                        works
                      </span>
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Peer-Reviewed Publications & PUST Journals */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
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

        {/* Campus Facilities, Library & Student Life */}
        {showInfrastructure && (
          <div id="campus" className="editable-region pt-12 border-t border-slate-200 space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
              <div className="lg:col-span-7">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-mono text-xs uppercase tracking-widest text-pust-800">
                    Research Infrastructure
                  </p>
                  <EditTriggerButton
                    target={{ kind: 'research-infra' }}
                    label="Edit Infrastructure"
                    variant="compact"
                  />
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-medium text-slate-900 mt-1">
                  Central Library, Laboratories &amp; Residential Halls
                </h2>
              </div>
              <div className="lg:col-span-5">
                <p className="text-sm text-slate-600 leading-relaxed">
                  {academicExtras.researchIntro}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {academicExtras.researchInfraCards.map((card, idx) => {
                const fallbackImg =
                  idx === 0 ? labImage : idx === 1 ? libraryImage : groundsImage;
                const gradientClass =
                  idx === 0
                    ? 'card-gradient-lapis border-lapis-200/80 hover:border-lapis-600/45'
                    : idx === 1
                    ? 'card-gradient-gold border-gold-200/80 hover:border-gold-600/45'
                    : 'card-gradient-sage border-sage-200/80 hover:border-sage-600/45';
                const tagColor =
                  idx === 0 ? 'text-lapis-700' : idx === 1 ? 'text-gold-700' : 'text-sage-700';

                return (
                  <MotionCard
                    key={card.id}
                    delay={idx * 0.05}
                    className={`${gradientClass} rounded-2xl border p-5 shadow-xs hover:shadow-md transition-all space-y-4 group`}
                  >
                    <div className="overflow-hidden rounded-xl">
                      <ResilientImage
                        src={card.imageUrl || fallbackImg}
                        fallbackSrc={fallbackImg}
                        alt={card.title}
                        caption={card.caption}
                        className="w-full aspect-[4/3] object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      />
                    </div>
                    <div>
                      <p className={`font-mono text-xs font-medium ${tagColor}`}>{card.tag}</p>
                      <h3 className="font-serif text-xl font-medium text-slate-900 mt-1">
                        {card.title}
                      </h3>
                      <p className="text-sm text-slate-600 mt-2 leading-relaxed">
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
    </section>
  );
}
