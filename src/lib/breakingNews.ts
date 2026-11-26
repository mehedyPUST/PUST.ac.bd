import type { GalleryItemRecord, NoticeRecord, SeminarItem } from '../types/pust';

export type BreakingNewsKind = 'notice' | 'event' | 'seminar';

export interface BreakingNewsItem {
  id: string;
  kind: BreakingNewsKind;
  tag: string;
  dateLabel: string;
  title: string;
  notice?: NoticeRecord;
  event?: GalleryItemRecord;
  href?: string;
}

export interface BuildBreakingNewsInput {
  notices: NoticeRecord[];
  galleryItems: GalleryItemRecord[];
  seminars?: SeminarItem[];
  maxItems?: number;
}

/**
 * Builds a prioritized, interleaved ticker feed combining pinned/recent official
 * notices, campus news & events, and upcoming academic seminars.
 */
export function buildBreakingNewsFeed({
  notices,
  galleryItems,
  seminars = [],
  maxItems = 8,
}: BuildBreakingNewsInput): BreakingNewsItem[] {
  const sortedNotices = [...notices]
    .filter((n) => n.title?.trim())
    .sort((a, b) => {
      const pinDiff = Number(Boolean(b.pinned)) - Number(Boolean(a.pinned));
      if (pinDiff !== 0) return pinDiff;
      return (b.publishedAt || '').localeCompare(a.publishedAt || '');
    })
    .slice(0, 5)
    .map<BreakingNewsItem>((notice) => ({
      id: `notice-${notice.id}`,
      kind: 'notice',
      tag: notice.pinned ? `Pinned · ${notice.category}` : notice.category,
      dateLabel: notice.publishedAt,
      title: notice.title.trim(),
      notice,
    }));

  const sortedEvents = [...galleryItems]
    .filter((g) => g.title?.trim())
    .sort((a, b) => (b.eventDate || '').localeCompare(a.eventDate || ''))
    .slice(0, 3)
    .map<BreakingNewsItem>((event) => ({
      id: `event-${event.id}`,
      kind: 'event',
      tag: `News · ${event.category}`,
      dateLabel: event.eventDate,
      title: event.title.trim(),
      event,
    }));

  const topSeminars = seminars
    .filter((s) => s.title?.trim())
    .slice(0, 2)
    .map<BreakingNewsItem>((seminar) => ({
      id: `seminar-${seminar.id}`,
      kind: 'seminar',
      tag: 'Seminar',
      dateLabel: seminar.date,
      title: `${seminar.title.trim()} (${seminar.organizer})`,
      href: '/academics/seminars',
    }));

  const combined: BreakingNewsItem[] = [];
  const maxQueue = Math.max(sortedNotices.length, sortedEvents.length, topSeminars.length);

  // Lead with the top two notices (pinned/latest), then interleave events & seminars
  if (sortedNotices[0]) combined.push(sortedNotices[0]);
  if (sortedNotices[1]) combined.push(sortedNotices[1]);

  for (let i = 0; i < maxQueue; i++) {
    if (sortedEvents[i]) combined.push(sortedEvents[i]);
    const noticeIdx = i + 2;
    if (sortedNotices[noticeIdx]) combined.push(sortedNotices[noticeIdx]);
    if (topSeminars[i]) combined.push(topSeminars[i]);
  }

  return combined.slice(0, Math.max(0, maxItems));
}
