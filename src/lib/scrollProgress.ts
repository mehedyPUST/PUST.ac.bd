export interface ScrollMetricsInput {
  scrollY: number;
  scrollHeight: number;
  clientHeight: number;
  showThreshold?: number;
}

export interface ScrollMetrics {
  progress: number;
  percent: number;
  maxScroll: number;
  isScrollable: boolean;
  showGoToTop: boolean;
}

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

/**
 * Computes normalized page scroll progress (0..1), integer percentage (0..100),
 * and whether the floating Go-to-Top control should be visible.
 */
export function computeScrollMetrics({
  scrollY,
  scrollHeight,
  clientHeight,
  showThreshold = 260,
}: ScrollMetricsInput): ScrollMetrics {
  const safeScrollY = Number.isFinite(scrollY) ? Math.max(0, scrollY) : 0;
  const safeScrollHeight = Number.isFinite(scrollHeight) ? Math.max(0, scrollHeight) : 0;
  const safeClientHeight = Number.isFinite(clientHeight) ? Math.max(0, clientHeight) : 0;
  const maxScroll = Math.max(0, safeScrollHeight - safeClientHeight);
  const isScrollable = maxScroll > 120;
  const progress = maxScroll <= 0 ? 0 : clamp01(safeScrollY / maxScroll);
  const percent = Math.round(progress * 100);
  const showGoToTop = isScrollable && safeScrollY >= showThreshold;

  return {
    progress,
    percent,
    maxScroll,
    isScrollable,
    showGoToTop,
  };
}
