import assert from 'node:assert/strict';
import test from 'node:test';
import { claimsHaveRole, signAuthToken, verifyAuthToken } from '../../server/auth';
import type { AuthUser } from '../types/pust';
import {
  getAvailableRoleContexts,
  resolveActiveUserIdentity,
} from './roleContext';

function makeMultiRoleTeacher(): AuthUser {
  return {
    id: 'usr-teacher-1',
    name: 'Dr. Mahmudul Hasan',
    email: 'mahmud.cse@pust.ac.bd',
    role: 'teacher',
    approvalStatus: 'approved',
    departmentCode: 'CSE',
    academicId: 'FAC-CSE-04',
    hallAffiliation: 'Academic Block',
    designation: 'Professor',
    createdAt: '2026-01-10T00:00:00.000Z',
    additionalRoles: [
      {
        id: 'appt-hall-1',
        role: 'hall',
        appointmentType: 'hall_provost',
        scopeType: 'hall',
        scopeCode: 'July 06 Hall',
        scopeName: 'July 06 Hall',
        title: 'Provost, July 06 Hall',
        effectiveFrom: '2026-01-01',
        status: 'active',
        assignedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'appt-chair-eee',
        role: 'chairman',
        appointmentType: 'department_chairman',
        scopeType: 'department',
        scopeCode: 'EEE',
        scopeName: 'Department of Electrical and Electronic Engineering',
        title: 'Acting Chairman, EEE',
        effectiveFrom: '2026-02-01',
        status: 'active',
        assignedAt: '2026-02-01T00:00:00.000Z',
      },
      {
        id: 'appt-ended',
        role: 'proctor',
        appointmentType: 'assistant_proctor',
        scopeType: 'university',
        scopeName: 'University-wide',
        title: 'Assistant Proctor',
        effectiveFrom: '2024-01-01',
        effectiveUntil: '2025-01-01',
        status: 'ended',
        assignedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'appt-future',
        role: 'dean',
        appointmentType: 'dean',
        scopeType: 'faculty',
        scopeCode: 'Faculty of Engineering and Technology',
        scopeName: 'Faculty of Engineering and Technology',
        title: 'Dean',
        effectiveFrom: '2099-01-01',
        status: 'scheduled',
        assignedAt: '2026-06-01T00:00:00.000Z',
      },
    ],
  };
}

test('single-role user only sees primary context', () => {
  const user: AuthUser = {
    id: 'usr-stu-1',
    name: 'Mehedy Hasan',
    email: 'mehedy.cse@pust.ac.bd',
    role: 'student',
    approvalStatus: 'approved',
    departmentCode: 'CSE',
    academicId: '220101',
    hallAffiliation: 'July 06 Hall',
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const contexts = getAvailableRoleContexts(user, Date.parse('2026-11-28T00:00:00Z'));
  assert.equal(contexts.length, 1);
  assert.equal(contexts[0].key, 'primary');
  assert.equal(contexts[0].role, 'student');
});

test('multi-role user receives only primary and currently in-force appointments', () => {
  const teacher = makeMultiRoleTeacher();
  const now = Date.parse('2026-11-28T00:00:00Z');
  const contexts = getAvailableRoleContexts(teacher, now);

  assert.deepEqual(
    contexts.map((c) => c.key),
    ['primary', 'appt-hall-1', 'appt-chair-eee']
  );
  assert.equal(contexts[1].hallAffiliation, 'July 06 Hall');
  assert.equal(contexts[2].departmentCode, 'EEE');
});

test('resolveActiveUserIdentity switches scope accurately and blocks ended/unassigned keys', () => {
  const teacher = makeMultiRoleTeacher();
  const now = Date.parse('2026-11-28T00:00:00Z');

  const hallActive = resolveActiveUserIdentity(teacher, 'appt-hall-1', now);
  assert.equal(hallActive.role, 'hall');
  assert.equal(hallActive.hallAffiliation, 'July 06 Hall');
  assert.equal(hallActive.departmentCode, 'CSE');
  assert.equal(hallActive.primaryRole, 'teacher');
  assert.equal(hallActive.activeRoleKey, 'appt-hall-1');

  // Switching from already-switched object to another appointment still preserves primary identity
  const chairActive = resolveActiveUserIdentity(hallActive, 'appt-chair-eee', now);
  assert.equal(chairActive.role, 'chairman');
  assert.equal(chairActive.departmentCode, 'EEE');
  assert.equal(chairActive.hallAffiliation, 'Academic Block');
  assert.equal(chairActive.primaryRole, 'teacher');
  assert.equal(chairActive.primaryDepartmentCode, 'CSE');
  assert.equal(chairActive.activeRoleKey, 'appt-chair-eee');

  // Ended or forged role keys cleanly fall back to primary
  const endedFallback = resolveActiveUserIdentity(chairActive, 'appt-ended', now);
  assert.equal(endedFallback.role, 'teacher');
  assert.equal(endedFallback.departmentCode, 'CSE');
  assert.equal(endedFallback.activeRoleKey, 'primary');

  const forgedFallback = resolveActiveUserIdentity(chairActive, 'admin-escalation', now);
  assert.equal(forgedFallback.role, 'teacher');
  assert.equal(forgedFallback.activeRoleKey, 'primary');
});

test('signAuthToken persists activeRoleKey and primaryRole while claimsHaveRole honors active + additional roles', () => {
  const teacher = makeMultiRoleTeacher();
  const now = Date.parse('2026-11-28T00:00:00Z');
  const switched = resolveActiveUserIdentity(teacher, 'appt-hall-1', now);

  const token = signAuthToken(switched);
  const claims = verifyAuthToken(token);
  assert.ok(claims);
  assert.equal(claims.role, 'hall');
  assert.equal(claims.primaryRole, 'teacher');
  assert.equal(claims.activeRoleKey, 'appt-hall-1');

  assert.equal(claimsHaveRole(claims, 'hall'), true);
  assert.equal(claimsHaveRole(claims, 'teacher'), true);
  assert.equal(claimsHaveRole(claims, 'chairman'), true);
  assert.equal(claimsHaveRole(claims, 'proctor'), false);
  assert.equal(claimsHaveRole(claims, 'admin'), false);
});
