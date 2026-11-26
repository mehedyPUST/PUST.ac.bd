import type { NoticeRecord } from '../types/pust';

/**
 * Filters and sorts official notices scoped to a specific academic department.
 * Pinned notices appear first, followed by newest `publishedAt` (and `createdAt` tie-breaker).
 */
export function getDepartmentNotices(
  notices: NoticeRecord[],
  departmentCode: string
): NoticeRecord[] {
  const normalizedCode = departmentCode.trim().toUpperCase();
  if (!normalizedCode) return [];

  return notices
    .filter((notice) => (notice.departmentCode || '').trim().toUpperCase() === normalizedCode)
    .sort((a, b) => {
      const pinDiff = Number(Boolean(b.pinned)) - Number(Boolean(a.pinned));
      if (pinDiff !== 0) return pinDiff;

      const dateDiff = (b.publishedAt || '').localeCompare(a.publishedAt || '');
      if (dateDiff !== 0) return dateDiff;

      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
}
