import assert from 'node:assert/strict';
import http from 'node:http';
import test from 'node:test';
import type { AddressInfo } from 'node:net';
import { getApiApp } from './apiApp';
import { hashPassword } from './auth';
import { pustRepo } from './db';

function extractCookieHeader(setCookieHeader: string | string[] | undefined): string {
  const values = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : setCookieHeader
    ? [setCookieHeader]
    : [];
  const cookies = values.map((v) => v.split(';')[0]).filter(Boolean);
  return cookies.join('; ');
}

test('Multi-role user can switch securely across primary and in-force additional roles via /api/auth/switch-role', async () => {
  const app = await getApiApp();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const email = `multirole.${Date.now()}@pust.ac.bd`;
    const password = 'MultiRolePass#2026';

    await pustRepo.createUser({
      name: 'Dr. Multi Role Scholar',
      email,
      passwordHash: hashPassword(password),
      role: 'teacher',
      approvalStatus: 'approved',
      departmentCode: 'CSE',
      academicId: `FAC-MR-${Date.now()}`,
      hallAffiliation: 'Academic Block',
      designation: 'Associate Professor',
      additionalRoles: [
        {
          id: 'appt-eee-chair',
          role: 'chairman',
          appointmentType: 'department_chairman',
          scopeType: 'department',
          scopeCode: 'EEE',
          scopeName: 'Department of EEE',
          title: 'Acting Chairman, EEE',
          effectiveFrom: '2026-01-01',
          status: 'active',
          assignedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'appt-july-provost',
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
          id: 'appt-ended-proctor',
          role: 'proctor',
          appointmentType: 'proctor',
          scopeType: 'university',
          scopeName: 'University-wide',
          title: 'Proctor',
          effectiveFrom: '2024-01-01',
          effectiveUntil: '2025-01-01',
          status: 'ended',
          assignedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
    });

    // 1. Login -> defaults to primary teacher role in CSE
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({ email, password }),
    });
    assert.equal(loginRes.status, 200);
    let cookieHeader = extractCookieHeader(loginRes.headers.getSetCookie?.() || loginRes.headers.get('set-cookie') || undefined);
    const loginJson = (await loginRes.json()) as {
      user: { role: string; departmentCode: string; activeRoleKey?: string };
    };
    assert.equal(loginJson.user.role, 'teacher');
    assert.equal(loginJson.user.departmentCode, 'CSE');
    assert.equal(loginJson.user.activeRoleKey, 'primary');

    // 2. Reject switching to ended or unassigned/admin role (403)
    for (const badKey of ['appt-ended-proctor', 'admin', 'non-existent-role']) {
      const badRes = await fetch(`${baseUrl}/api/auth/switch-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          Cookie: cookieHeader,
        },
        body: JSON.stringify({ roleKey: badKey }),
      });
      assert.equal(badRes.status, 403);
    }

    // 3. Switch to EEE Chairman appointment -> /api/auth/me and /api/portal/approvals reflect EEE Chairman
    const chairSwitchRes = await fetch(`${baseUrl}/api/auth/switch-role`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({ roleKey: 'appt-eee-chair' }),
    });
    assert.equal(chairSwitchRes.status, 200);
    cookieHeader = extractCookieHeader(
      chairSwitchRes.headers.getSetCookie?.() || chairSwitchRes.headers.get('set-cookie') || undefined
    );
    const chairJson = (await chairSwitchRes.json()) as {
      user: { role: string; departmentCode: string; primaryRole?: string; activeRoleKey?: string };
    };
    assert.equal(chairJson.user.role, 'chairman');
    assert.equal(chairJson.user.departmentCode, 'EEE');
    assert.equal(chairJson.user.primaryRole, 'teacher');
    assert.equal(chairJson.user.activeRoleKey, 'appt-eee-chair');

    const meChairRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: cookieHeader },
    });
    assert.equal(meChairRes.status, 200);
    const meChairJson = (await meChairRes.json()) as {
      user: { role: string; departmentCode: string; activeRoleKey?: string };
    };
    assert.equal(meChairJson.user.role, 'chairman');
    assert.equal(meChairJson.user.departmentCode, 'EEE');
    assert.equal(meChairJson.user.activeRoleKey, 'appt-eee-chair');

    // 4. Switch to Hall Provost -> /api/portal/halls/overview scopes cleanly to July 06 Hall
    const hallSwitchRes = await fetch(`${baseUrl}/api/auth/switch-role`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({ roleKey: 'appt-july-provost' }),
    });
    assert.equal(hallSwitchRes.status, 200);
    cookieHeader = extractCookieHeader(
      hallSwitchRes.headers.getSetCookie?.() || hallSwitchRes.headers.get('set-cookie') || undefined
    );
    const hallOverviewRes = await fetch(`${baseUrl}/api/portal/halls/overview`, {
      headers: { Cookie: cookieHeader },
    });
    assert.equal(hallOverviewRes.status, 200);
    const hallOverviewJson = (await hallOverviewRes.json()) as {
      applications: Array<{ hallName: string }>;
      dues: Array<{ hallName: string }>;
    };
    assert.ok(hallOverviewJson.applications.every((a) => a.hallName === 'July 06 Hall'));
    assert.ok(hallOverviewJson.dues.every((d) => d.hallName === 'July 06 Hall'));

    // 5. Switch back to primary role -> restores CSE Teacher
    const primaryRes = await fetch(`${baseUrl}/api/auth/switch-role`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Cookie: cookieHeader,
      },
      body: JSON.stringify({ roleKey: 'primary' }),
    });
    assert.equal(primaryRes.status, 200);
    const primaryJson = (await primaryRes.json()) as {
      user: { role: string; departmentCode: string; activeRoleKey?: string };
    };
    assert.equal(primaryJson.user.role, 'teacher');
    assert.equal(primaryJson.user.departmentCode, 'CSE');
    assert.equal(primaryJson.user.activeRoleKey, 'primary');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
