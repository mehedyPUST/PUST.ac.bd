'use client';

import { useState } from 'react';
import { Check, Copy, Search } from 'lucide-react';
import { resolveUniversityContent } from '../lib/cmsDefaults';
import { EditTriggerButton } from './EditTriggerButton';
import { MotionCard } from './MotionPrimitives';
import { usePust } from './PustContext';
import { ResilientImage } from './ResilientImage';
import type { JournalRecord, PublicationRecord } from '../types/pust';

interface ResearchSectionProps {
  publications: PublicationRecord[];
  journals: JournalRecord[];
  labImage: string;
  libraryImage: string;
  groundsImage: string;
  focus?: 'journals' | 'publications';
}

export function ResearchSection({
  publications,
  journals,
  labImage,
  libraryImage,
  groundsImage,
  focus = 'publications',
}: ResearchSectionProps) {
  const { profile } = usePust();
  const { academicExtras } = resolveUniversityContent(profile);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [pubQuery, setPubQuery] = useState('');
  const [copiedPubId, setCopiedPubId] = useState<string | null>(null);

  const deptFilters = ['ALL', ...Array.from(new Set(publications.map((p) => p.departmentCode)))];
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
      String(p.year).includes(q);
    return matchesDept && matchesQuery;
  });

  async function handleCopyCitation(pub: PublicationRecord) {
    const citation = `${pub.authors} (${pub.year}). "${pub.title}." ${
      pub.venue || `${pub.domain} Research Series`
    }, Dept. of ${pub.departmentCode}, Pabna University of Science and Technology.`;
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
              placeholder="Search title, author, domain..."
              aria-label="Filter publications"
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:border-pust-700 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {visiblePubs.length === 0 ? (
        <div className="py-6 space-y-2">
          <p className="text-sm text-slate-600">
            No publications matched your selected department or keyword.
          </p>
          {(selectedDeptFilter !== 'ALL' || pubQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedDeptFilter('ALL');
                setPubQuery('');
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 text-pust-900 hover:border-pust-800 cursor-pointer"
            >
              Reset Publication Filters
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-slate-200 border-b border-slate-200">
          {visiblePubs.map((pub) => {
            const isCopied = copiedPubId === pub.id;
            return (
              <article key={pub.id} className="py-4 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-mono text-xs text-pust-800 tabular-nums">
                    {pub.departmentCode} · {pub.domain} · {pub.year}
                  </p>
                  <div className="flex items-center gap-2">
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
      </div>
    </div>
  );

  return (
    <section id="research" className="bg-white border-t border-slate-200 pt-10 pb-14 lg:pb-16">
      <div className="space-y-14">
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
      </div>
    </section>
  );
}
