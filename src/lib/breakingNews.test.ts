import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBreakingNewsFeed } from './breakingNews';
import type { GalleryItemRecord, NoticeRecord, SeminarItem } from '../types/pust';

const makeNotice = (
  id: string,
  title: string,
  publishedAt: string,
  pinned = false
): NoticeRecord => ({
  id,
  referenceNo: `PUST/${id}`,
  title,
  category: 'General',
  publishedAt,
  departmentCode: 'REGISTRAR',
  boardScope: 'central',
  visibility: 'public',
  summary: title,
  body: title,
  pinned,
  authorName: 'Registrar',
  authorRole: 'registrar',
});

const makeEvent = (id: string, title: string, eventDate: string): GalleryItemRecord => ({
  id,
  title,
  description: title,
  category: 'Academic Event',
  mediaType: 'photo',
  mediaUrl: '/assets/pust-logo.png',
  eventDate,
  visibility: 'public',
});

const makeSeminar = (id: string, title: string): SeminarItem => ({
  id,
  date: '2026-12-01',
  organizer: 'CSE',
  title,
});

test('buildBreakingNewsFeed prioritizes pinned notices and interleaves events and seminars', () => {
  const feed = buildBreakingNewsFeed({
    notices: [
      makeNotice('n-old', 'Older General Notice', '2026-10-01', false),
      makeNotice('n-pinned', 'First Convocation Circular', '2026-11-10', true),
      makeNotice('n-new', 'Admission Results Published', '2026-11-20', false),
    ],
    galleryItems: [
      makeEvent('e-1', 'Annual Tech Fest Opening', '2026-11-19'),
      makeEvent('e-0', 'Spring Orientation', '2026-03-01'),
    ],
    seminars: [makeSeminar('s-1', 'AI & Robotics Colloquium')],
    maxItems: 8,
  });

  assert.equal(feed.length, 6);
  assert.equal(feed[0].id, 'notice-n-pinned');
  assert.equal(feed[1].id, 'notice-n-new');
  assert.equal(feed[2].id, 'event-e-1');
  assert.equal(feed[3].id, 'notice-n-old');
  assert.equal(feed[4].id, 'seminar-s-1');
  assert.equal(feed[5].id, 'event-e-0');
});

test('buildBreakingNewsFeed caps results at maxItems and handles empty inputs safely', () => {
  assert.deepEqual(
    buildBreakingNewsFeed({ notices: [], galleryItems: [], seminars: [] }),
    []
  );

  const capped = buildBreakingNewsFeed({
    notices: [
      makeNotice('1', 'N1', '2026-11-01'),
      makeNotice('2', 'N2', '2026-11-02'),
      makeNotice('3', 'N3', '2026-11-03'),
    ],
    galleryItems: [makeEvent('e1', 'E1', '2026-11-04')],
    maxItems: 2,
  });
  assert.equal(capped.length, 2);
});
