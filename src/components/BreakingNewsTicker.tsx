'use client';

import { Fragment, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Pause, Play, Radio } from 'lucide-react';
import { buildBreakingNewsFeed, type BreakingNewsItem } from '../lib/breakingNews';
import type { GalleryItemRecord, NoticeRecord, SeminarItem } from '../types/pust';

interface BreakingNewsTickerProps {
  notices: NoticeRecord[];
  galleryItems: GalleryItemRecord[];
  seminars?: SeminarItem[];
  loading?: boolean;
  onSelectNotice: (notice: NoticeRecord) => void;
  onSelectEvent?: (event: GalleryItemRecord) => void;
}

export function BreakingNewsTicker({
  notices,
  galleryItems,
  seminars = [],
  loading = false,
  onSelectNotice,
  onSelectEvent,
}: BreakingNewsTickerProps) {
  const [paused, setPaused] = useState(false);

  const items = useMemo(
    () =>
      buildBreakingNewsFeed({
        notices,
        galleryItems,
        seminars,
        maxItems: 8,
      }),
    [notices, galleryItems, seminars]
  );

  if (loading && items.length === 0) {
    return (
      <section
        aria-label="Latest university news and notices"
        className="border-b border-slate-200 bg-[#F8F8F6] print:hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center gap-3">
          <div className="h-5 w-28 rounded bg-slate-200 animate-pulse" />
          <div className="h-4 flex-1 max-w-md rounded bg-slate-200/80 animate-pulse" />
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return null;
  }

  function renderTickerItem(item: BreakingNewsItem, duplicateCopy: boolean) {
    const content = (
      <>
        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-pust-800">
          {item.tag}
        </span>
        {item.dateLabel && (
          <>
            <span aria-hidden="true" className="text-slate-300 text-[10px]">
              ·
            </span>
            <span className="font-mono text-[10px] text-slate-500 tabular-nums">
              {item.dateLabel}
            </span>
          </>
        )}
        <span className="text-xs sm:text-[13px] font-medium text-slate-900 group-hover:text-pust-900 group-hover:underline underline-offset-4">
          {item.title}
        </span>
      </>
    );

    if (item.kind === 'notice' && item.notice) {
      const targetNotice = item.notice;
      return (
        <button
          type="button"
          onClick={() => onSelectNotice(targetNotice)}
          tabIndex={duplicateCopy ? -1 : 0}
          className="group inline-flex items-center gap-2 whitespace-nowrap cursor-pointer"
        >
          {content}
        </button>
      );
    }

    if (item.kind === 'event' && item.event && onSelectEvent) {
      const targetEvent = item.event;
      return (
        <button
          type="button"
          onClick={() => onSelectEvent(targetEvent)}
          tabIndex={duplicateCopy ? -1 : 0}
          className="group inline-flex items-center gap-2 whitespace-nowrap cursor-pointer"
        >
          {content}
        </button>
      );
    }

    return (
      <Link
        href={item.href || '/notices'}
        tabIndex={duplicateCopy ? -1 : 0}
        className="group inline-flex items-center gap-2 whitespace-nowrap"
      >
        {content}
      </Link>
    );
  }

  return (
    <section
      aria-label="Latest university news and notices"
      data-breaking-ticker="true"
      className="border-b border-slate-200 bg-[#F8F8F6] print:hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-10 border-x border-slate-200/80 bg-[#F8F8F6]">
          {/* Institutional Bulletin Tag */}
          <div className="shrink-0 h-full bg-pust-900 text-white px-3 sm:px-4 inline-flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-gold-300 shrink-0" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] whitespace-nowrap">
              Latest
            </span>
          </div>

          {/* Scrolling Ticker Track */}
          <div className="pust-ticker-wrap flex-1 min-w-0 h-full overflow-hidden relative flex items-center">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-[#F8F8F6] to-transparent z-10"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-[#F8F8F6] to-transparent z-10"
            />

            <div
              data-paused={paused ? 'true' : 'false'}
              className="pust-ticker-track flex items-center w-max px-4"
            >
              {[0, 1].map((copyIndex) => {
                const isDuplicate = copyIndex === 1;
                return (
                  <div
                    key={copyIndex}
                    aria-hidden={isDuplicate ? 'true' : undefined}
                    className="flex items-center shrink-0"
                  >
                    {items.map((item) => (
                      <Fragment key={`${copyIndex}-${item.id}`}>
                        {renderTickerItem(item, isDuplicate)}
                        <span
                          aria-hidden="true"
                          className="mx-4 text-[10px] text-pust-700/45 select-none"
                        >
                          ◆
                        </span>
                      </Fragment>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Controls & Notices Archive Link */}
          <div className="shrink-0 h-full flex items-center border-l border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => setPaused((prev) => !prev)}
              aria-label={paused ? 'Resume latest news ticker' : 'Pause latest news ticker'}
              aria-pressed={paused}
              title={paused ? 'Resume ticker' : 'Pause ticker'}
              className={`w-9 h-full inline-flex items-center justify-center transition-colors cursor-pointer ${
                paused
                  ? 'bg-pust-50 text-pust-900'
                  : 'text-slate-600 hover:text-pust-900 hover:bg-slate-50'
              }`}
            >
              {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
            <Link
              href="/notices"
              className="hidden sm:inline-flex items-center gap-1 px-3.5 h-full border-l border-slate-200 text-[11px] font-semibold text-pust-900 hover:bg-pust-50 whitespace-nowrap transition-colors"
            >
              All Notices
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
