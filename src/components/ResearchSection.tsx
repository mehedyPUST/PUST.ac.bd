'use client';

import { useState } from 'react';
import { resolveUniversityContent } from '../lib/cmsDefaults';
import { EditTriggerButton } from './EditTriggerButton';
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

  const deptFilters = ['ALL', ...Array.from(new Set(publications.map((p) => p.departmentCode)))];
  const visiblePubs =
    selectedDeptFilter === 'ALL'
      ? publications
      : publications.filter((p) => p.departmentCode === selectedDeptFilter);

  const publicationsBlock = (
    <div className={focus === 'journals' ? 'lg:col-span-6 space-y-6' : 'lg:col-span-7 space-y-6'}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-pust-800">
            Faculty Research &amp; Periodicals
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl font-medium text-slate-900 mt-1">
            Recent Peer-Reviewed Publications
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <EditTriggerButton
            target={{ kind: 'publication', publication: null }}
            label="Add Publication"
            icon="add"
            variant="compact"
          />
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
      </div>

      {visiblePubs.length === 0 ? (
        <p className="text-sm text-slate-600 py-6">
          No publications listed for the selected department filter.
        </p>
      ) : (
        <div className="divide-y divide-slate-200 border-b border-slate-200">
          {visiblePubs.map((pub) => (
            <article key={pub.id} className="py-4 space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-xs text-pust-800 tabular-nums">
                  {pub.departmentCode} · {pub.domain} · {pub.year}
                </p>
                <EditTriggerButton
                  target={{ kind: 'publication', publication: pub }}
                  label="Edit"
                  variant="compact"
                />
              </div>
              <h3 className="font-serif text-lg font-medium text-slate-900 leading-snug">
                {pub.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">Authors: {pub.authors}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );

  const journalsBlock = (
    <div
      className={`${
        focus === 'journals' ? 'lg:col-span-6' : 'lg:col-span-5'
      } bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden`}
    >
      <div className="p-6 sm:p-7 space-y-5">
        <div className="border-b border-slate-200 pb-4 flex items-end justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-pust-800">
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

        <div className="divide-y divide-slate-200">
          {journals.map((journal) => (
            <div key={journal.id} className="py-4 first:pt-1 last:pb-1 space-y-1.5">
              <p className="font-mono text-xs text-slate-500 tabular-nums">{journal.issn}</p>
              <h3 className="font-serif text-lg font-medium text-slate-900">{journal.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{journal.scope}</p>
              <p className="text-xs font-semibold text-pust-800">{journal.currentIssue}</p>
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
              return (
                <article
                  key={card.id}
                  className="bg-[#F7F7F5] rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-pust-700/50 transition-all space-y-4"
                >
                  <ResilientImage
                    src={card.imageUrl || fallbackImg}
                    fallbackSrc={fallbackImg}
                    alt={card.title}
                    caption={card.caption}
                    className="w-full aspect-[4/3] object-cover"
                  />
                  <div>
                    <p className="font-mono text-xs text-pust-800">{card.tag}</p>
                    <h3 className="font-serif text-xl font-medium text-slate-900 mt-1">
                      {card.title}
                    </h3>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
