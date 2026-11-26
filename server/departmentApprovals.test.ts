import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { getApiApp } from './apiApp';
import { AUTH_COOKIE_NAME, signAuthToken } from './auth';
import { pustRepo } from './db';
import type { AuthUser } from '../src/types/pust';

const CSE_CHAIRMAN: AuthUser = {
  id: 'usr-chair-cse-test',
  name: 'Dr. Mahmudul Hasan',
  email: 'chairman.cse@pust.ac.bd',
  role: 'chairman',
  approvalStatus: 'approved',
  departmentCode: 'CSE',
  academicId: 'FAC-CSE-001',
  hallAffiliation: 'Academic Block',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const EEE_CHAIRMAN: AuthUser = {
  id: 'usr-chair-eee-test',
  name: 'Prof. Tanvir Ahmed',
  email: 'chairman.eee@pust.ac.bd',
  role: 'chairman',
  approvalStatus: 'approved',
  departmentCode: 'EEE',
  academicId: 'FAC-EEE-001',
  hallAffiliation: 'Academic Block',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const CSE_TEACHER: AuthUser = {
  id: 'usr-teacher-cse-test',
  name: 'Md. Rakibul Islam',
  email: 'rakibul.cse@pust.ac.bd',
  role: 'teacher',
  approvalStatus: 'approved',
  departmentCode: 'CSE',
  academicId: 'FAC-CSE-014',
  hallAffiliation: 'Academic Block',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const ADMIN_USER: AuthUser = {
  id: 'usr-admin-test',
  name: 'Central Admin Office',
  email: 'admin@pust.ac.bd',
  role: 'admin',
  approvalStatus: 'approved',
  departmentCode: 'ADMIN',
  academicId: 'ADM-001',
  hallAffiliation: 'Admin Building',
  createdAt: '2026-01-01T00:00:00.000Z',
};

async function withServer(run: (baseUrl: string) => Promise<void>): Promise<void> {
  const app = await getApiApp();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

function authHeaders(user: AuthUser | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };
  if (user) {
    const token = signAuthToken(user);
    headers.Cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}`;
  }
  return headers;
}

test('Department Approval Dashboard enforces authentication, department scoping, revision loop, and final approval', async () => {
  await pustRepo.init();

  await withServer(async (baseUrl) => {
    // 1. Unauthenticated requests are rejected with 401
    const unauthRes = await fetch(`${baseUrl}/api/portal/approvals`);
    assert.equal(unauthRes.status, 401);

    // 2. CSE Chairman only sees CSE requests + crossChecks
    const cseListRes = await fetch(`${baseUrl}/api/portal/approvals`, {
      headers: authHeaders(CSE_CHAIRMAN),
    });
    assert.equal(cseListRes.status, 200);
    const cseListJson = (await cseListRes.json()) as {
      requests: Array<{ id: string; departmentCode: string; status: string }>;
      crossChecks: Record<string, number>;
    };
    assert.ok(cseListJson.requests.length >= 1);
    assert.ok(cseListJson.requests.every((r) => r.departmentCode === 'CSE'));
    assert.equal(typeof cseListJson.crossChecks.pendingLibrarySeals, 'number');

    // 3. CSE Teacher submits a new request -> scoped automatically to CSE
    const createRes = await fetch(`${baseUrl}/api/portal/approvals`, {
      method: 'POST',
      headers: authHeaders(CSE_TEACHER),
      body: JSON.stringify({
        title: 'Embedded Systems Lab Microcontrollers Order',
        category: 'Procurement & Lab',
        priority: 'Urgent',
        departmentCode: 'EEE', // ignored for non-admin, forced to CSE
        summary: 'Acquire 25 ESP32-S3 dev kits and logic probes for CSE-3204 lab.',
        justification:
          'Current batch of 48 students shares 8 aging boards; additional kits prevent lab scheduling bottlenecks.',
        requestedAmountBdt: 38500,
        targetDate: '2026-12-15',
        attachments: ['ESP32_Vendor_Quote.pdf'],
      }),
    });
    assert.equal(createRes.status, 201);
    const createdJson = (await createRes.json()) as {
      request: { id: string; departmentCode: string; status: string; referenceCode: string };
    };
    assert.equal(createdJson.request.departmentCode, 'CSE');
    assert.equal(createdJson.request.status, 'pending');
    const requestId = createdJson.request.id;

    // 4. EEE Chairman is blocked (403) from reviewing a CSE request
    const crossDeptRes = await fetch(`${baseUrl}/api/portal/approvals/${requestId}/decision`, {
      method: 'PATCH',
      headers: authHeaders(EEE_CHAIRMAN),
      body: JSON.stringify({ decision: 'approve', note: 'Cross dept attempt' }),
    });
    assert.equal(crossDeptRes.status, 403);

    // 5. Teacher cannot review/approve requests (403)
    const teacherReviewRes = await fetch(`${baseUrl}/api/portal/approvals/${requestId}/decision`, {
      method: 'PATCH',
      headers: authHeaders(CSE_TEACHER),
      body: JSON.stringify({ decision: 'approve' }),
    });
    assert.equal(teacherReviewRes.status, 403);

    // 6. Requesting revision without written note >= 5 chars fails with 400
    const shortNoteRes = await fetch(`${baseUrl}/api/portal/approvals/${requestId}/decision`, {
      method: 'PATCH',
      headers: authHeaders(CSE_CHAIRMAN),
      body: JSON.stringify({ decision: 'request_revision', note: 'fix' }),
    });
    assert.equal(shortNoteRes.status, 400);

    // 7. CSE Chairman requests revisions with clear note
    const revRes = await fetch(`${baseUrl}/api/portal/approvals/${requestId}/decision`, {
      method: 'PATCH',
      headers: authHeaders(CSE_CHAIRMAN),
      body: JSON.stringify({
        decision: 'request_revision',
        note: 'Attach two comparative vendor quotes and confirm store room inventory.',
      }),
    });
    assert.equal(revRes.status, 200);
    const revJson = (await revRes.json()) as {
      request: { status: string; revisionInstructions?: string; history: Array<{ action: string }> };
    };
    assert.equal(revJson.request.status, 'revision_requested');
    assert.match(revJson.request.revisionInstructions || '', /comparative vendor quotes/i);
    assert.equal(revJson.request.history[revJson.request.history.length - 1]?.action, 'revision_requested');

    // 8. Different non-admin user (EEE Chairman) cannot resubmit someone else's revision (403)
    const hijackResubmitRes = await fetch(`${baseUrl}/api/portal/approvals/${requestId}/resubmit`, {
      method: 'POST',
      headers: authHeaders(EEE_CHAIRMAN),
      body: JSON.stringify({
        summary: 'Hijacked updated summary attempt',
        justification: 'Attempting unauthorized modification of another user request.',
        responseNote: 'Unauthorized update',
      }),
    });
    assert.equal(hijackResubmitRes.status, 403);

    // 9. Original requester (CSE Teacher) resubmits -> status returns to pending
    const resubmitRes = await fetch(`${baseUrl}/api/portal/approvals/${requestId}/resubmit`, {
      method: 'POST',
      headers: authHeaders(CSE_TEACHER),
      body: JSON.stringify({
        summary: 'Updated: Acquire 25 ESP32-S3 dev kits with dual vendor quotations.',
        justification:
          'Confirmed store room stock is 0; attached comparative quotations from StarTech and TechShopBD.',
        responseNote: 'Added comparative quotes and store verification.',
        attachments: ['ESP32_Vendor_Quote_A.pdf', 'ESP32_Vendor_Quote_B.pdf'],
      }),
    });
    assert.equal(resubmitRes.status, 200);
    const resubmitJson = (await resubmitRes.json()) as {
      request: { status: string; history: Array<{ action: string }> };
    };
    assert.equal(resubmitJson.request.status, 'pending');
    assert.equal(resubmitJson.request.history[resubmitJson.request.history.length - 1]?.action, 'resubmitted');

    // 10. CSE Chairman approves the resubmitted request
    const approveRes = await fetch(`${baseUrl}/api/portal/approvals/${requestId}/decision`, {
      method: 'PATCH',
      headers: authHeaders(CSE_CHAIRMAN),
      body: JSON.stringify({
        decision: 'approve',
        note: 'Approved for departmental procurement disbursement.',
      }),
    });
    assert.equal(approveRes.status, 200);
    const approveJson = (await approveRes.json()) as {
      request: { status: string; reviewerName?: string };
    };
    assert.equal(approveJson.request.status, 'approved');
    assert.equal(approveJson.request.reviewerName, CSE_CHAIRMAN.name);

    // 11. Duplicate finalization is rejected with 409, and Admin can view across departments
    const duplicateRes = await fetch(`${baseUrl}/api/portal/approvals/${requestId}/decision`, {
      method: 'PATCH',
      headers: authHeaders(ADMIN_USER),
      body: JSON.stringify({ decision: 'decline', note: 'Too late to decline' }),
    });
    assert.equal(duplicateRes.status, 409);

    const adminListRes = await fetch(`${baseUrl}/api/portal/approvals?department=ALL`, {
      headers: authHeaders(ADMIN_USER),
    });
    assert.equal(adminListRes.status, 200);
    const adminListJson = (await adminListRes.json()) as {
      requests: Array<{ departmentCode: string }>;
    };
    const depts = new Set(adminListJson.requests.map((r) => r.departmentCode));
    assert.ok(depts.has('CSE') && depts.has('EEE'));
  });
});
