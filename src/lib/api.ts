import type {
  AuthUser,
  BookmarkRecord,
  BootstrapStatus,
  DepartmentRecord,
  InquiryRecord,
  NoticeCategory,
  NoticeRecord,
  PublicationRecord,
  UniversityProfile,
} from '../types/pust';

async function apiFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('X-Requested-With', 'XMLHttpRequest');
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, {
    ...init,
    headers,
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof data?.error === 'string' ? data.error : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

export const pustApi = {
  getUniversityProfile: () => apiFetch<{ profile: UniversityProfile }>('/api/university-profile'),

  getDepartments: () => apiFetch<{ departments: DepartmentRecord[] }>('/api/departments'),

  getPublications: () => apiFetch<{ publications: PublicationRecord[] }>('/api/publications'),

  getNotices: (category?: string, search?: string) => {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.set('category', category);
    if (search && search.trim()) params.set('search', search.trim());
    const qs = params.toString();
    return apiFetch<{ notices: NoticeRecord[] }>(`/api/notices${qs ? `?${qs}` : ''}`);
  },

  createNotice: (payload: {
    referenceNo: string;
    title: string;
    category: NoticeCategory;
    departmentCode: string;
    summary: string;
    body: string;
    pinned?: boolean;
  }) =>
    apiFetch<{ notice: NoticeRecord }>('/api/notices', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteNotice: (id: string) =>
    apiFetch<{ deleted: boolean }>(`/api/notices/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  submitInquiry: (payload: {
    fullName: string;
    email: string;
    phone: string;
    programLevel: InquiryRecord['programLevel'];
    departmentCode: string;
    message: string;
  }) =>
    apiFetch<{ inquiry: InquiryRecord }>('/api/inquiries', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getInquiries: () => apiFetch<{ inquiries: InquiryRecord[] }>('/api/inquiries'),

  markInquiryReviewed: (id: string) =>
    apiFetch<{ updated: boolean }>(`/api/inquiries/${encodeURIComponent(id)}/review`, {
      method: 'PATCH',
    }),

  getBootstrapStatus: () => apiFetch<BootstrapStatus>('/api/auth/bootstrap-status'),

  getMe: () => apiFetch<{ user: AuthUser | null }>('/api/auth/me'),

  login: (email: string, password: string) =>
    apiFetch<{ user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (payload: {
    name: string;
    email: string;
    password: string;
    role: 'student' | 'faculty';
    departmentCode: string;
    academicId: string;
    hallAffiliation: string;
  }) =>
    apiFetch<{ user: AuthUser }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  bootstrapAdmin: (payload: { name: string; email: string; password: string }) =>
    apiFetch<{ user: AuthUser }>('/api/auth/bootstrap-admin', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  adminPasscodeLogin: (payload: { name?: string; email: string; passcode: string }) =>
    apiFetch<{ user: AuthUser }>('/api/auth/admin-passcode-login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  logout: () =>
    apiFetch<{ ok: boolean }>('/api/auth/logout', {
      method: 'POST',
    }),

  getBookmarks: () => apiFetch<{ bookmarks: BookmarkRecord[] }>('/api/bookmarks'),

  addBookmark: (payload: {
    itemType: 'department' | 'notice';
    itemId: string;
    title: string;
    subtitle: string;
  }) =>
    apiFetch<{ bookmark: BookmarkRecord }>('/api/bookmarks', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  removeBookmark: (itemId: string) =>
    apiFetch<{ removed: boolean }>(`/api/bookmarks/${encodeURIComponent(itemId)}`, {
      method: 'DELETE',
    }),
};
