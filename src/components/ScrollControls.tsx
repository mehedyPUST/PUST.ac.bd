'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowUp } from 'lucide-react';
import { computeScrollMetrics, type ScrollMetrics } from '../lib/scrollProgress';

const INITIAL_METRICS: ScrollMetrics = {
  progress: 0,
  percent: 0,
  maxScroll: 0,
  isScrollable: false,
  showGoToTop: false,
};

function readWindowScrollMetrics(showThreshold = 260): ScrollMetrics {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return INITIAL_METRICS;
  }
  const docEl = document.documentElement;
  const scrollY = window.scrollY || docEl.scrollTop || 0;
  const scrollHeight = Math.max(docEl.scrollHeight, document.body?.scrollHeight ?? 0);
  const clientHeight = window.innerHeight || docEl.clientHeight || 0;

  return computeScrollMetrics({
    scrollY,
    scrollHeight,
    clientHeight,
    showThreshold,
  });
}

export function useScrollMetrics(showThreshold = 260): ScrollMetrics {
  const pathname = usePathname();
  const [metrics, setMetrics] = useState<ScrollMetrics>(INITIAL_METRICS);

  useEffect(() => {
    let rafId = 0;

    const update = () => {
      rafId = 0;
      const next = readWindowScrollMetrics(showThreshold);
      setMetrics((prev) =>
        prev.percent === next.percent &&
        prev.showGoToTop === next.showGoToTop &&
        prev.isScrollable === next.isScrollable &&
        Math.abs(prev.progress - next.progress) < 0.002
          ? prev
          : next
      );
    };

    const scheduleUpdate = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && document.body) {
      resizeObserver = new ResizeObserver(scheduleUpdate);
      resizeObserver.observe(document.body);
    }

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      resizeObserver?.disconnect();
    };
  }, [pathname, showThreshold]);

  return metrics;
}

export function ScrollMarkerBar() {
  const { progress, percent, isScrollable } = useScrollMetrics();

  return (
    <div
      role="progressbar"
      aria-label="Page scroll progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      data-scroll-marker="true"
      className="pointer-events-none fixed bottom-0 inset-x-0 z-50 h-[3px] bg-transparent overflow-hidden print:hidden"
    >
      <div
        className="h-full w-full bg-gradient-to-r from-pust-800 via-amber-500 to-amber-300 shadow-[0_-1px_8px_rgba(139,9,18,0.28)] transition-opacity duration-150"
        style={{
          transform: `scaleX(${isScrollable ? progress : 0})`,
          transformOrigin: 'left center',
          opacity: isScrollable && progress > 0.005 ? 1 : 0,
        }}
      />
    </div>
  );
}

export function GoToTopButton() {
  const { percent, showGoToTop } = useScrollMetrics(260);

  function handleScrollToTop() {
    if (typeof window === 'undefined') return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({
      top: 0,
      behavior: reduced ? 'auto' : 'smooth',
    });
  }

  return (
    <button
      type="button"
      onClick={handleScrollToTop}
      aria-label="Go to top"
      aria-hidden={!showGoToTop}
      tabIndex={showGoToTop ? 0 : -1}
      data-go-to-top="true"
      className={`fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-30 print:hidden group inline-flex items-center gap-2 overflow-hidden rounded-xl border border-stone-300/90 bg-white/95 backdrop-blur-sm px-3.5 py-2.5 text-xs font-semibold text-slate-900 shadow-md hover:border-pust-700 hover:bg-pust-700 hover:text-white transition-all duration-200 cursor-pointer ${
        showGoToTop
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-3 pointer-events-none'
      }`}
    >
      <ArrowUp className="w-3.5 h-3.5 text-pust-700 group-hover:text-amber-300 transition-colors shrink-0" />
      <span>Top</span>
      <span className="font-mono text-[11px] text-slate-500 group-hover:text-amber-200 tabular-nums border-l border-stone-200 group-hover:border-white/25 pl-2">
        {percent}%
      </span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-pust-800 group-hover:bg-amber-300 transition-colors"
        style={{
          transform: `scaleX(${percent / 100})`,
          transformOrigin: 'left center',
        }}
      />
    </button>
  );
}
