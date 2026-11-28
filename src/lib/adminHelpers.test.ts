import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildStudentRecordPatch,
  canClearCourseNoticeTarget,
  normalizeClearablePatch,
  toNullableClearable,
} from './adminHelpers';

test('buildStudentRecordPatch allows admin to update all four ledger fields', () => {
  const result = buildStudentRecordPatch('admin', {
    chairmanNotes: 'Verified transcript',
    adminNotes: 'Clearance reviewed by Registrar/Admin',
    disciplinaryStatus: 'Warning',
    disciplinaryNotes: 'Library fine pending clearance',
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.patch, {
      chairmanNotes: 'Verified transcript',
      adminNotes: 'Clearance reviewed by Registrar/Admin',
      disciplinaryStatus: 'Warning',
      disciplinaryNotes: 'Library fine pending clearance',
    });
  }
});

test('buildStudentRecordPatch enforces role-scoped permissions for chairman, proctor, and teacher', () => {
  const chairmanRes = buildStudentRecordPatch('chairman', {
    chairmanNotes: 'Dept approved',
    adminNotes: 'Should be ignored',
    disciplinaryStatus: 'Warning',
  });
  assert.equal(chairmanRes.ok, true);
  if (chairmanRes.ok) {
    assert.deepEqual(chairmanRes.patch, { chairmanNotes: 'Dept approved' });
  }

  const proctorRes = buildStudentRecordPatch('proctor', {
    chairmanNotes: 'Should be ignored',
    disciplinaryStatus: 'Under Review',
    disciplinaryNotes: 'Inquiry opened',
  });
  assert.equal(proctorRes.ok, true);
  if (proctorRes.ok) {
    assert.deepEqual(proctorRes.patch, {
      disciplinaryStatus: 'Under Review',
      disciplinaryNotes: 'Inquiry opened',
    });
  }

  const unauthorizedRes = buildStudentRecordPatch('teacher', {
    chairmanNotes: 'No access',
  });
  assert.equal(unauthorizedRes.ok, false);
});

test('normalizeClearablePatch converts null and blank strings to undefined for $unset while preserving defined values', () => {
  const normalized = normalizeClearablePatch(
    {
      title: 'Updated Notice',
      targetSession: null,
      targetCourseCode: '   ',
      attachmentUrl: null,
      attachmentName: '',
      attachmentType: null,
      facultyCount: null,
      pinned: false,
    },
    [
      'targetSession',
      'targetCourseCode',
      'attachmentUrl',
      'attachmentName',
      'attachmentType',
      'facultyCount',
    ] as const
  );

  assert.equal(normalized.title, 'Updated Notice');
  assert.equal(normalized.pinned, false);
  assert.equal('targetSession' in normalized, true);
  assert.equal(normalized.targetSession, undefined);
  assert.equal(normalized.targetCourseCode, undefined);
  assert.equal(normalized.attachmentUrl, undefined);
  assert.equal(normalized.attachmentName, undefined);
  assert.equal(normalized.attachmentType, undefined);
  assert.equal(normalized.facultyCount, undefined);
});

test('toNullableClearable preserves cleared strings across JSON serialization', () => {
  const json = JSON.stringify({
    doi: toNullableClearable('   '),
    url: toNullableClearable('https://pust.ac.bd/paper'),
  });
  const parsed = JSON.parse(json) as { doi: string | null; url: string | null };

  assert.equal('doi' in parsed, true);
  assert.equal(parsed.doi, null);
  assert.equal(parsed.url, 'https://pust.ac.bd/paper');
});

test('canClearCourseNoticeTarget rejects clearing course code on course-scoped notices unless scope changes', () => {
  assert.equal(canClearCourseNoticeTarget('course', undefined, null), false);
  assert.equal(canClearCourseNoticeTarget('department', 'course', ''), false);
  assert.equal(canClearCourseNoticeTarget('course', 'department', null), true);
  assert.equal(canClearCourseNoticeTarget('course', 'course', 'CSE-3101'), true);
});
