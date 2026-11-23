'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { BookOpen, Check, Copy, Trash2 } from 'lucide-react';
import { pustApi } from '../../lib/api';
import type {
  AboutContentRecord,
  AuditLogRecord,
  AuthUser,
  DepartmentRecord,
  FeeConfig,
  GalleryItemRecord,
  InquiryRecord,
  NoticeBoardScope,
  NoticeCategory,
  NoticeVisibility,
  PaymentGatewayConfig,
  SignupTokenRecord,
  ViceChancellorRecord,
} from '../../types/pust';

const HALL_OPTIONS = [
  'July 06 Hall',
  'Male Hall-1',
  'Male Hall-2',
  'Female Hall-1',
  'Female Hall-2',
];

interface AdminCmsPanelProps {
  user: AuthUser;
  departments: DepartmentRecord[];
  aboutSections: AboutContentRecord[];
  vcProfiles: ViceChancellorRecord[];
  galleryItems: GalleryItemRecord[];
  onNoticesChange: () => Promise<void>;
  onCmsChange: () => Promise<void>;
}

export function AdminCmsPanel({
  user,
  departments,
  aboutSections,
  vcProfiles,
  galleryItems,
  onNoticesChange,
  onCmsChange,
}: AdminCmsPanelProps) {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [tokens, setTokens] = useState<SignupTokenRecord[]>([]);
  const [inquiries, setInquiries] = useState<InquiryRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [gateways, setGateways] = useState<PaymentGatewayConfig[]>([]);
  const [feeConfig, setFeeConfig] = useState<FeeConfig>({
    certificateFeeBdt: 1500,
    defaultExamFeeBdt: 1450,
  });

  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);
  const [approvalFilter, setApprovalFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [inquiryFilter, setInquiryFilter] = useState<'all' | 'Received' | 'Reviewed'>('all');

  const handleCopyToken = (id: string, token: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(token).catch(() => {});
      setCopiedTokenId(id);
      setTimeout(() => setCopiedTokenId((curr) => (curr === id ? null : curr)), 1800);
    }
  };

  // Teacher assignment inputs
  const [teacherAssigns, setTeacherAssigns] = useState<
    Record<string, { courses: string; sessions: string }>
  >({});

  // Student Signup Token Form
  const [tokName, setTokName] = useState('');
  const [tokEmail, setTokEmail] = useState('');
  const [tokPhone, setTokPhone] = useState('');
  const [tokDept, setTokDept] = useState(
    user.role === 'chairman' ? user.departmentCode : 'CSE'
  );
  const [tokSession, setTokSession] = useState('2025-26');
  const [tokAcademicId, setTokAcademicId] = useState('');
  const [tokHall, setTokHall] = useState('July 06 Hall');

  // Notice Publisher Form
  const [noticeRef, setNoticeRef] = useState('');
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeCat, setNoticeCat] = useState<NoticeCategory>('General');
  const [noticeDept, setNoticeDept] = useState(
    user.role === 'chairman' || user.role === 'teacher' ? user.departmentCode : 'REG'
  );
  const [noticeScope, setNoticeScope] = useState<NoticeBoardScope>(
    user.role === 'chairman'
      ? 'department'
      : user.role === 'teacher'
      ? 'course'
      : 'central'
  );
  const [noticeVisibility, setNoticeVisibility] = useState<NoticeVisibility>('public');
  const [noticeTargetSession, setNoticeTargetSession] = useState('');
  const [noticeTargetCourse, setNoticeTargetCourse] = useState('');
  const [noticeAttachment, setNoticeAttachment] = useState('');
  const [noticeSummary, setNoticeSummary] = useState('');
  const [noticeBody, setNoticeBody] = useState('');

  // Admin About CMS
  const [aboutSlug, setAboutSlug] = useState<AboutContentRecord['slug']>('our-university');
  const [aboutTitle, setAboutTitle] = useState(aboutSections[0]?.title || 'Our University');
  const [aboutBody, setAboutBody] = useState(aboutSections[0]?.body || '');

  // Admin Current VC CMS
  const currentVc = vcProfiles.find((v) => v.isCurrent) || vcProfiles[0];
  const [vcName, setVcName] = useState(currentVc?.name || '');
  const [vcEmail, setVcEmail] = useState(currentVc?.email || 'vc@pust.ac.bd');
  const [vcPhone, setVcPhone] = useState(currentVc?.phone || '+8802588842379');
  const [vcTenure, setVcTenure] = useState(currentVc?.tenure || 'September 2024 – Present');
  const [vcMsg, setVcMsg] = useState(currentVc?.message || '');
  const [promoteNewVc, setPromoteNewVc] = useState(false);

  // Admin Gallery CMS
  const [galTitle, setGalTitle] = useState('');
  const [galDesc, setGalDesc] = useState('');
  const [galCat, setGalCat] = useState<GalleryItemRecord['category']>('Academic Event');
  const [galType, setGalType] = useState<GalleryItemRecord['mediaType']>('photo');
  const [galUrl, setGalUrl] = useState('/src/assets/images/pust_campus_hero_1795431408503.jpg');
  const [galDate, setGalDate] = useState('2026-11-20');

  const refresh = useCallback(async () => {
    try {
      if (['admin', 'registrar', 'vc', 'chairman'].includes(user.role)) {
        const uRes = await pustApi.getUsers();
        setUsers(uRes.users);
      }
      if (user.role === 'admin' || user.role === 'chairman') {
        const tRes = await pustApi.getSignupTokens();
        setTokens(tRes.tokens);
      }
      if (user.role === 'admin' || user.role === 'registrar') {
        const iRes = await pustApi.getInquiries();
        setInquiries(iRes.inquiries);
      }
      if (['admin', 'vc', 'registrar'].includes(user.role)) {
        const aRes = await pustApi.getAuditLogs();
        setAuditLogs(aRes.logs);
      }
      if (user.role === 'admin') {
        const pRes = await pustApi.getPaymentConfig();
        setGateways(pRes.gateways);
        setFeeConfig(pRes.feeConfig);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load governance records.');
    }
  }, [user.role]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleUserApproval(id: string, status: 'approved' | 'rejected') {
    setError(null);
    setFeedback(null);
    try {
      await pustApi.approveUser(id, status);
      setFeedback(`Account ${status}.`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update approval status.');
    }
  }

  async function handleSaveTeacherAssign(id: string) {
    setError(null);
    setFeedback(null);
    const val = teacherAssigns[id] || { courses: '', sessions: '' };
    const courses = val.courses
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const sessions = val.sessions
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      await pustApi.assignTeacher(id, courses, sessions);
      setFeedback('Updated teacher course and session assignments.');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save assignment.');
    }
  }

  async function handleCreateToken(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      const res = await pustApi.createSignupToken({
        studentName: tokName,
        studentEmail: tokEmail,
        studentPhone: tokPhone,
        departmentCode: tokDept,
        session: tokSession,
        academicId: tokAcademicId,
        hallAffiliation: tokHall,
      });
      setFeedback(
        `Generated Student Portal Token: ${res.token.token} (Share with ${res.token.studentName} for signup).`
      );
      setTokName('');
      setTokEmail('');
      setTokPhone('');
      setTokAcademicId('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate signup token.');
    }
  }

  async function handleCreateNotice(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      await pustApi.createNotice({
        referenceNo: noticeRef,
        title: noticeTitle,
        category: noticeCat,
        departmentCode: noticeDept,
        boardScope: noticeScope,
        visibility: noticeVisibility,
        targetSession: noticeTargetSession.trim() || undefined,
        targetCourseCode: noticeTargetCourse.trim() || undefined,
        attachmentName: noticeAttachment.trim() || undefined,
        summary: noticeSummary,
        body: noticeBody,
      });
      setFeedback(`Published ${noticeVisibility} ${noticeScope} notice "${noticeTitle}".`);
      setNoticeRef('');
      setNoticeTitle('');
      setNoticeAttachment('');
      setNoticeSummary('');
      setNoticeBody('');
      await onNoticesChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to publish notice.');
    }
  }

  async function handleSaveAbout(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      await pustApi.upsertAboutSection({ slug: aboutSlug, title: aboutTitle, body: aboutBody });
      setFeedback(`Updated About PUST section "${aboutTitle}".`);
      await onCmsChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update About content.');
    }
  }

  async function handleSaveVc(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      await pustApi.updateViceChancellor({
        name: vcName,
        email: vcEmail,
        phone: vcPhone,
        tenure: vcTenure,
        message: vcMsg,
        promoteNewVc,
      });
      setFeedback(
        promoteNewVc
          ? 'Appointed new Vice-Chancellor and moved predecessor into Former VCs archive.'
          : 'Updated current Vice-Chancellor profile.'
      );
      setPromoteNewVc(false);
      await onCmsChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update Vice-Chancellor profile.');
    }
  }

  async function handleAddGallery(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      await pustApi.createGalleryItem({
        title: galTitle,
        description: galDesc,
        category: galCat,
        mediaType: galType,
        mediaUrl: galUrl,
        eventDate: galDate,
      });
      setFeedback(`Added "${galTitle}" to Homepage Gallery.`);
      setGalTitle('');
      setGalDesc('');
      await onCmsChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add gallery item.');
    }
  }

  async function handleToggleGateway(g: PaymentGatewayConfig) {
    setError(null);
    setFeedback(null);
    try {
      await pustApi.savePaymentGateway({ ...g, enabled: !g.enabled });
      setFeedback(`Updated payment gateway ${g.name}.`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update gateway.');
    }
  }

  async function handleSaveFees(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    try {
      await pustApi.saveFeeConfig(feeConfig);
      setFeedback('Updated university fee schedule.');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update fees.');
    }
  }

  const pendingUsersCount = users.filter((u) => u.approvalStatus === 'pending').length;
  const approvedUsersCount = users.filter((u) => u.approvalStatus === 'approved').length;
  const filteredUsers = users.filter((u) => {
    if (approvalFilter === 'pending') return u.approvalStatus === 'pending';
    if (approvalFilter === 'approved') return u.approvalStatus === 'approved';
    return true;
  });

  const receivedInquiriesCount = inquiries.filter((i) => i.status === 'Received').length;
  const filteredInquiries = inquiries.filter((inq) => {
    if (inquiryFilter === 'all') return true;
    return inq.status === inquiryFilter;
  });

  const headerMeta = (() => {
    switch (user.role) {
      case 'teacher':
        return {
          kicker: `${user.departmentCode} Faculty Communication`,
          title: 'Course & Session Notice Board',
          subtitle:
            'Publish lecture updates, lab schedules, and departmental notices directly to your assigned students.',
        };
      case 'chairman':
        return {
          kicker: `${user.departmentCode} Department Governance`,
          title: 'Department Notices, Student Tokens & Account Approvals',
          subtitle:
            'Generate admitted student signup tokens, approve departmental teachers and students, and assign course loads.',
        };
      case 'library':
      case 'hall':
      case 'proctor':
        return {
          kicker: `${user.role.toUpperCase()} Administrative Desk`,
          title: 'Central Unit Notice Publisher',
          subtitle:
            'Publish official circulars and directives across the university notice board.',
        };
      case 'registrar':
      case 'vc':
        return {
          kicker: 'University Executive Governance',
          title:
            user.role === 'registrar'
              ? 'Official Circulars, Admission Inquiries & Governance Audit'
              : 'Executive Circulars, Directory & Audit Oversight',
          subtitle:
            'Issue university-wide notices, monitor administrative audit logs, and oversee officer accounts.',
        };
      default:
        return {
          kicker: 'Central University Administration',
          title: 'Governance, Approvals, Public CMS & Fee Schedule',
          subtitle:
            'Full authority over user approvals, student signup tokens, About/VC/Gallery CMS, payment gateways, and system audits.',
        };
    }
  })();

  const noticeHeading =
    user.role === 'teacher'
      ? `Publish ${user.departmentCode} Course or Department Notice`
      : user.role === 'chairman'
      ? `Publish ${user.departmentCode} Department Notice`
      : 'Publish Official Central Notice';

  return (
    <div className="space-y-6">
      {/* Role-Specific Governance Header Card */}
      <div className="bg-white border border-stone-200 shadow-xs overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800" />
        <div className="p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-emerald-800">
              {headerMeta.kicker}
            </p>
            <h2 className="font-serif text-2xl font-semibold text-slate-900">{headerMeta.title}</h2>
            <p className="text-xs text-slate-600 max-w-2xl">{headerMeta.subtitle}</p>
          </div>
          {(user.role === 'admin' || user.role === 'chairman') && (
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums">
              <div className="px-3 py-2 bg-[#FAF8F4] border border-stone-200">
                <span className="block text-[10px] uppercase tracking-wider text-slate-500">
                  Pending Approvals
                </span>
                <span className="text-base font-semibold text-amber-800">{pendingUsersCount}</span>
              </div>
              <div className="px-3 py-2 bg-[#FAF8F4] border border-stone-200">
                <span className="block text-[10px] uppercase tracking-wider text-slate-500">
                  Active Tokens
                </span>
                <span className="text-base font-semibold text-emerald-800">
                  {tokens.filter((t) => !t.used).length}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Teacher Assigned Courses & Sessions Context */}
      {user.role === 'teacher' && (
        <div className="bg-[#FAF8F4] border border-stone-200 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-4 h-4 text-emerald-800 shrink-0" />
            <div>
              <p className="font-semibold text-slate-900">Your Assigned Teaching Scope</p>
              <p className="font-mono text-slate-600 mt-0.5">
                Courses:{' '}
                <span className="text-slate-900 font-medium">
                  {(user.assignedCourses || []).length > 0
                    ? user.assignedCourses!.join(', ')
                    : 'Not yet assigned by Chairman'}
                </span>{' '}
                · Sessions:{' '}
                <span className="text-slate-900 font-medium tabular-nums">
                  {(user.assignedSessions || []).length > 0
                    ? user.assignedSessions!.join(', ')
                    : 'All department sessions'}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3.5 border border-red-200 bg-red-50 text-sm text-red-900">{error}</div>
      )}
      {feedback && (
        <div className="p-3.5 border border-emerald-200 bg-emerald-50 text-sm text-emerald-900">
          {feedback}
        </div>
      )}

      {/* 1. Role-Scoped Notice Board Publisher */}
      {user.role !== 'student' && (
        <form
          onSubmit={handleCreateNotice}
          className="bg-white border border-stone-200 shadow-xs p-6 space-y-4"
        >
          <div className="border-b border-stone-200 pb-3">
            <h3 className="font-serif text-lg font-medium text-slate-900">{noticeHeading}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="text"
              required
              value={noticeRef}
              onChange={(e) => setNoticeRef(e.target.value)}
              placeholder="Memo Ref (PUST/2026/...)"
              className="px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-800"
            />
            <select
              value={noticeScope}
              onChange={(e) => setNoticeScope(e.target.value as NoticeBoardScope)}
              className="px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-800"
            >
              {['admin', 'registrar', 'vc', 'proctor', 'library', 'hall'].includes(user.role) && (
                <option value="central">Central Notice Board</option>
              )}
              {(user.role === 'chairman' || user.role === 'teacher') && (
                <option value="department">Department Notice Board</option>
              )}
              {user.role === 'teacher' && (
                <option value="course">Teacher Course &amp; Session Notice</option>
              )}
            </select>
            <select
              value={noticeVisibility}
              onChange={(e) => setNoticeVisibility(e.target.value as NoticeVisibility)}
              className="px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-800"
            >
              <option value="public">Public (Everyone)</option>
              <option value="registered">Registered Members Only</option>
            </select>
            <select
              value={noticeCat}
              onChange={(e) => setNoticeCat(e.target.value as NoticeCategory)}
              className="px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-800"
            >
              {(
                [
                  'General',
                  'Admission',
                  'Academic',
                  'Examination',
                  'Result',
                  'Course',
                  'Job & Tender',
                  'NOC & Orders',
                ] as NoticeCategory[]
              ).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              value={noticeTitle}
              onChange={(e) => setNoticeTitle(e.target.value)}
              placeholder="Circular Title"
              className="sm:col-span-2 px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-800"
            />
            <input
              type="text"
              required
              disabled={user.role === 'chairman' || user.role === 'teacher'}
              value={noticeDept}
              onChange={(e) => setNoticeDept(e.target.value)}
              placeholder="Unit / Dept Code"
              className="px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4] disabled:opacity-75 focus:outline-none focus:border-emerald-800"
            />
          </div>
          {(noticeScope === 'department' || noticeScope === 'course') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={noticeTargetSession}
                onChange={(e) => setNoticeTargetSession(e.target.value)}
                placeholder="Optional Target Session (e.g. 2022-23)"
                className="px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-800"
              />
              <input
                type="text"
                required={noticeScope === 'course'}
                value={noticeTargetCourse}
                onChange={(e) => setNoticeTargetCourse(e.target.value)}
                placeholder="Target Course Code (required for Course scope)"
                className="px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-800"
              />
            </div>
          )}
          <input
            type="text"
            required
            value={noticeSummary}
            onChange={(e) => setNoticeSummary(e.target.value)}
            placeholder="One-line executive summary"
            className="w-full px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-800"
          />
          <input
            type="text"
            value={noticeAttachment}
            onChange={(e) => setNoticeAttachment(e.target.value)}
            placeholder="Optional Attachment Name (e.g. Exam-Schedule-2026.pdf)"
            className="w-full px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-800"
          />
          <textarea
            rows={2}
            required
            value={noticeBody}
            onChange={(e) => setNoticeBody(e.target.value)}
            placeholder="Full circular details..."
            className="w-full px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-800"
          />
          <button
            type="submit"
            className="px-5 py-2 text-xs font-medium bg-gradient-to-r from-emerald-900 to-emerald-800 text-white hover:from-emerald-950 hover:to-emerald-900 cursor-pointer whitespace-nowrap shrink-0"
          >
            Publish Official Circular
          </button>
        </form>
      )}

      {/* 2. Student Portal Signup Token Generator (Admin & Chairman) */}
      {(user.role === 'admin' || user.role === 'chairman') && (
        <div className="bg-white border border-stone-200 shadow-xs p-6 space-y-4">
          <div className="border-b border-stone-200 pb-3">
            <h3 className="font-serif text-lg font-medium text-slate-900">
              Generate Unique Student Portal Signup Token
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Admitted students use this one-time token to activate their Student Portal account.
            </p>
          </div>
          <form onSubmit={handleCreateToken} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="text"
              required
              value={tokName}
              onChange={(e) => setTokName(e.target.value)}
              placeholder="Admitted Student Name"
              className="px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-800"
            />
            <input
              type="email"
              required
              value={tokEmail}
              onChange={(e) => setTokEmail(e.target.value)}
              placeholder="Student Email"
              className="px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-800"
            />
            <input
              type="tel"
              required
              value={tokPhone}
              onChange={(e) => setTokPhone(e.target.value)}
              placeholder="Phone (+880...)"
              className="px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-800"
            />
            <input
              type="text"
              required
              value={tokAcademicId}
              onChange={(e) => setTokAcademicId(e.target.value)}
              placeholder="Academic ID (e.g. 250112)"
              className="px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-800"
            />
            <select
              value={tokDept}
              disabled={user.role === 'chairman'}
              onChange={(e) => setTokDept(e.target.value)}
              className="px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4] disabled:opacity-75 focus:outline-none focus:border-emerald-800"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.code}>
                  {d.code} — {d.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              required
              value={tokSession}
              onChange={(e) => setTokSession(e.target.value)}
              placeholder="Session (e.g. 2025-26)"
              className="px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-800"
            />
            <select
              value={tokHall}
              onChange={(e) => setTokHall(e.target.value)}
              className="px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-800"
            >
              {HALL_OPTIONS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium bg-gradient-to-r from-emerald-900 to-emerald-800 text-white hover:from-emerald-950 hover:to-emerald-900 cursor-pointer whitespace-nowrap shrink-0"
            >
              Generate Signup Token
            </button>
          </form>

          {tokens.length > 0 && (
            <div className="divide-y divide-stone-200 border border-stone-200 text-xs">
              {tokens.map((t) => (
                <div
                  key={t.id}
                  className="p-3 flex flex-wrap items-center justify-between gap-2 bg-[#FAF8F4]/60"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-semibold text-emerald-800 tabular-nums">
                      {t.token}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyToken(t.id, t.token)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] border border-stone-300 bg-white text-slate-700 hover:border-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {copiedTokenId === t.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-700" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy
                        </>
                      )}
                    </button>
                    <span className="font-mono text-slate-700 tabular-nums">
                      · {t.studentName} ({t.academicId}, {t.departmentCode} · {t.session})
                    </span>
                  </div>
                  <p className="font-mono text-slate-500">
                    <span className={t.used ? 'text-slate-500' : 'text-emerald-800 font-semibold'}>
                      {t.used ? 'USED' : 'ACTIVE'}
                    </span>{' '}
                    · Issued by {t.createdBy}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Role-Based User Approvals & Teacher Course/Session Assignments */}
      {(user.role === 'admin' || user.role === 'chairman') && (
        <div className="bg-white border border-stone-200 shadow-xs p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-3">
            <h3 className="font-serif text-lg font-medium text-slate-900">
              Account Approvals (
              {user.role === 'admin'
                ? 'All University Officers'
                : `${user.departmentCode} Teachers & Students`}
              )
            </h3>
            <div className="flex items-center gap-1.5">
              {(
                [
                  { id: 'all', label: `All (${users.length})` },
                  { id: 'pending', label: `Pending (${pendingUsersCount})` },
                  { id: 'approved', label: `Approved (${approvedUsersCount})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setApprovalFilter(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                    approvalFilter === tab.id
                      ? 'border-emerald-900 bg-gradient-to-r from-emerald-900 to-emerald-800 text-white'
                      : 'border-stone-300 bg-[#FAF8F4] text-slate-700 hover:border-emerald-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <p className="text-xs text-slate-600 p-4 border border-stone-200 bg-[#FAF8F4]">
              No accounts match this approval status filter.
            </p>
          ) : (
            <div className="divide-y divide-stone-200 border border-stone-200 text-xs">
              {filteredUsers.map((u) => {
                const assignVal = teacherAssigns[u.id] || {
                  courses: (u.assignedCourses || []).join(', '),
                  sessions: (u.assignedSessions || []).join(', '),
                };
                return (
                  <div key={u.id} className="p-3.5 space-y-2 bg-white hover:bg-[#FAF8F4]/50 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm text-slate-900">
                          {u.name} ·{' '}
                          <span className="font-mono text-emerald-800 uppercase">{u.role}</span>
                        </p>
                        <p className="font-mono text-slate-500 tabular-nums">
                          {u.email} · {u.departmentCode} · ID {u.academicId} ·{' '}
                          <span
                            className={`font-semibold uppercase ${
                              u.approvalStatus === 'approved'
                                ? 'text-emerald-800'
                                : u.approvalStatus === 'rejected'
                                ? 'text-red-700'
                                : 'text-amber-800'
                            }`}
                          >
                            {u.approvalStatus}
                          </span>
                        </p>
                      </div>

                      {u.approvalStatus !== 'approved' && u.role !== 'admin' && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleUserApproval(u.id, 'approved')}
                            className="px-3 py-1.5 font-medium bg-gradient-to-r from-emerald-900 to-emerald-800 text-white hover:from-emerald-950 hover:to-emerald-900 cursor-pointer whitespace-nowrap shrink-0"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUserApproval(u.id, 'rejected')}
                            className="px-3 py-1.5 font-medium border border-red-300 bg-white text-red-700 hover:bg-red-50 cursor-pointer whitespace-nowrap shrink-0"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>

                    {u.role === 'teacher' && u.approvalStatus === 'approved' && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        <input
                          type="text"
                          value={assignVal.courses}
                          onChange={(e) =>
                            setTeacherAssigns((prev) => ({
                              ...prev,
                              [u.id]: { ...assignVal, courses: e.target.value },
                            }))
                          }
                          placeholder="Courses (comma-separated, e.g. CSE-3201, CSE-3203)"
                          className="px-2.5 py-1.5 border border-stone-300 bg-[#FAF8F4] flex-1 min-w-[200px] focus:outline-none focus:border-emerald-800"
                        />
                        <input
                          type="text"
                          value={assignVal.sessions}
                          onChange={(e) =>
                            setTeacherAssigns((prev) => ({
                              ...prev,
                              [u.id]: { ...assignVal, sessions: e.target.value },
                            }))
                          }
                          placeholder="Sessions (e.g. 2022-23, 2023-24)"
                          className="px-2.5 py-1.5 border border-stone-300 bg-[#FAF8F4] w-52 focus:outline-none focus:border-emerald-800"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveTeacherAssign(u.id)}
                          className="px-3 py-1.5 border border-emerald-800 bg-white text-emerald-800 hover:bg-emerald-900 hover:text-white cursor-pointer whitespace-nowrap shrink-0"
                        >
                          Assign Courses/Sessions
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. Admin CMS: About PUST, Vice-Chancellor Archive, Gallery, Payment Gateways */}
      {user.role === 'admin' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form
              onSubmit={handleSaveAbout}
              className="bg-white border border-stone-200 shadow-xs p-6 space-y-3"
            >
              <h3 className="font-serif text-lg font-medium text-slate-900">
                Edit About PUST Content (CMS)
              </h3>
              <select
                value={aboutSlug}
                onChange={(e) => {
                  const slug = e.target.value as AboutContentRecord['slug'];
                  setAboutSlug(slug);
                  const found = aboutSections.find((s) => s.slug === slug);
                  if (found) {
                    setAboutTitle(found.title);
                    setAboutBody(found.body);
                  }
                }}
                className="w-full px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-800"
              >
                <option value="our-university">Our University</option>
                <option value="history">History</option>
                <option value="mission-vision">Mission &amp; Vision</option>
                <option value="plans">Strategic Plans</option>
              </select>
              <input
                type="text"
                required
                value={aboutTitle}
                onChange={(e) => setAboutTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-800"
              />
              <textarea
                rows={4}
                required
                value={aboutBody}
                onChange={(e) => setAboutBody(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-800"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium bg-gradient-to-r from-emerald-900 to-emerald-800 text-white hover:from-emerald-950 hover:to-emerald-900 cursor-pointer whitespace-nowrap shrink-0"
              >
                Save About Section
              </button>
            </form>

            <form
              onSubmit={handleSaveVc}
              className="bg-white border border-stone-200 shadow-xs p-6 space-y-3"
            >
              <h3 className="font-serif text-lg font-medium text-slate-900">
                Vice-Chancellor CMS &amp; Archive Promotion
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={vcName}
                  onChange={(e) => setVcName(e.target.value)}
                  placeholder="VC Name"
                  className="px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-800"
                />
                <input
                  type="text"
                  required
                  value={vcTenure}
                  onChange={(e) => setVcTenure(e.target.value)}
                  placeholder="Tenure"
                  className="px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-800"
                />
                <input
                  type="email"
                  required
                  value={vcEmail}
                  onChange={(e) => setVcEmail(e.target.value)}
                  className="px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-800"
                />
                <input
                  type="text"
                  required
                  value={vcPhone}
                  onChange={(e) => setVcPhone(e.target.value)}
                  className="px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-800"
                />
              </div>
              <textarea
                rows={3}
                required
                value={vcMsg}
                onChange={(e) => setVcMsg(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-800"
              />
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={promoteNewVc}
                  onChange={(e) => setPromoteNewVc(e.target.checked)}
                />
                Appoint as new Vice-Chancellor (moves current VC into Former VCs Archive)
              </label>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium bg-gradient-to-r from-emerald-900 to-emerald-800 text-white hover:from-emerald-950 hover:to-emerald-900 cursor-pointer whitespace-nowrap shrink-0"
              >
                Update Vice-Chancellor Record
              </button>
            </form>
          </div>

          {/* Gallery Manager + Payment Gateways */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-stone-200 shadow-xs p-6 space-y-4">
              <h3 className="font-serif text-lg font-medium text-slate-900">
                Homepage Gallery CMS (Photos &amp; Videos)
              </h3>
              <form onSubmit={handleAddGallery} className="space-y-2.5 text-xs">
                <input
                  type="text"
                  required
                  value={galTitle}
                  onChange={(e) => setGalTitle(e.target.value)}
                  placeholder="Event / Media Title"
                  className="w-full px-3 py-2 border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-800"
                />
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={galCat}
                    onChange={(e) => setGalCat(e.target.value as GalleryItemRecord['category'])}
                    className="px-2 py-2 border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-800"
                  >
                    <option value="Festival">Festival</option>
                    <option value="Academic Event">Academic Event</option>
                    <option value="Convocation">Convocation</option>
                    <option value="Campus Life">Campus Life</option>
                  </select>
                  <select
                    value={galType}
                    onChange={(e) => setGalType(e.target.value as GalleryItemRecord['mediaType'])}
                    className="px-2 py-2 border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-800"
                  >
                    <option value="photo">Photo</option>
                    <option value="video">Video</option>
                  </select>
                  <input
                    type="date"
                    value={galDate}
                    onChange={(e) => setGalDate(e.target.value)}
                    className="px-2 py-2 border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-800"
                  />
                </div>
                <input
                  type="text"
                  required
                  value={galUrl}
                  onChange={(e) => setGalUrl(e.target.value)}
                  placeholder="Image / Video Asset URL"
                  className="w-full px-3 py-2 border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-800"
                />
                <input
                  type="text"
                  required
                  value={galDesc}
                  onChange={(e) => setGalDesc(e.target.value)}
                  placeholder="Description"
                  className="w-full px-3 py-2 border border-stone-300 bg-[#FAF8F4] focus:outline-none focus:border-emerald-800"
                />
                <button
                  type="submit"
                  className="px-4 py-2 font-medium bg-gradient-to-r from-emerald-900 to-emerald-800 text-white hover:from-emerald-950 hover:to-emerald-900 cursor-pointer whitespace-nowrap shrink-0"
                >
                  Add Gallery Item
                </button>
              </form>

              <div className="divide-y divide-stone-200 border border-stone-200 text-xs max-h-48 overflow-y-auto">
                {galleryItems.map((item) => (
                  <div key={item.id} className="p-2.5 flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">{item.title}</p>
                      <p className="font-mono text-slate-500">
                        {item.category} · {item.mediaType}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await pustApi.deleteGalleryItem(item.id);
                        await onCmsChange();
                      }}
                      className="text-red-700 hover:underline cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-stone-200 shadow-xs p-6 space-y-4">
              <h3 className="font-serif text-lg font-medium text-slate-900">
                Payment Gateways &amp; Fee Schedule
              </h3>
              <div className="divide-y divide-stone-200 border border-stone-200 text-xs">
                {gateways.map((g) => (
                  <div key={g.id} className="p-3 flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">{g.name}</p>
                      <p className="text-slate-500">{g.instructions}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleGateway(g)}
                      className={`px-3 py-1 font-medium cursor-pointer whitespace-nowrap shrink-0 ${
                        g.enabled
                          ? 'bg-gradient-to-r from-emerald-900 to-emerald-800 text-white'
                          : 'bg-[#FAF8F4] border border-stone-300 text-slate-700'
                      }`}
                    >
                      {g.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSaveFees} className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1">Certificate Fee (BDT)</label>
                  <input
                    type="number"
                    value={feeConfig.certificateFeeBdt}
                    onChange={(e) =>
                      setFeeConfig((prev) => ({
                        ...prev,
                        certificateFeeBdt: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 border border-stone-300 bg-[#FAF8F4] tabular-nums focus:outline-none focus:border-emerald-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Default Exam Fee (BDT)</label>
                  <input
                    type="number"
                    value={feeConfig.defaultExamFeeBdt}
                    onChange={(e) =>
                      setFeeConfig((prev) => ({
                        ...prev,
                        defaultExamFeeBdt: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 border border-stone-300 bg-[#FAF8F4] tabular-nums focus:outline-none focus:border-emerald-800"
                  />
                </div>
                <button
                  type="submit"
                  className="col-span-2 px-4 py-2 font-medium bg-gradient-to-r from-emerald-900 to-emerald-800 text-white hover:from-emerald-950 hover:to-emerald-900 cursor-pointer whitespace-nowrap shrink-0"
                >
                  Save Fee Configuration
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 5. Admission Inquiries & System Audit Logs */}
      {(user.role === 'admin' || user.role === 'registrar' || user.role === 'vc') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(user.role === 'admin' || user.role === 'registrar') && (
            <div className="bg-white border border-stone-200 shadow-xs p-6 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-3">
                <h3 className="font-serif text-lg font-medium text-slate-900 tabular-nums">
                  Admission Inquiries ({inquiries.length})
                </h3>
                <div className="flex items-center gap-1">
                  {(
                    [
                      { id: 'all', label: `All` },
                      { id: 'Received', label: `Pending (${receivedInquiriesCount})` },
                      { id: 'Reviewed', label: `Reviewed` },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setInquiryFilter(tab.id)}
                      className={`px-2.5 py-1 text-[11px] font-medium border cursor-pointer whitespace-nowrap shrink-0 ${
                        inquiryFilter === tab.id
                          ? 'border-emerald-900 bg-gradient-to-r from-emerald-900 to-emerald-800 text-white'
                          : 'border-stone-300 bg-[#FAF8F4] text-slate-700 hover:border-emerald-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              {filteredInquiries.length === 0 ? (
                <p className="text-xs text-slate-600">No inquiries match the selected status.</p>
              ) : (
                <div className="divide-y divide-stone-200 border border-stone-200 text-xs max-h-64 overflow-y-auto">
                  {filteredInquiries.map((inq) => (
                    <div key={inq.id} className="p-3 flex justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-900">
                          {inq.fullName} · {inq.departmentCode}
                        </p>
                        <p className="text-slate-600">{inq.message}</p>
                        <p className="font-mono text-slate-500">
                          {inq.email} ·{' '}
                          <span
                            className={
                              inq.status === 'Received'
                                ? 'text-amber-800 font-semibold'
                                : 'text-emerald-800 font-semibold'
                            }
                          >
                            {inq.status}
                          </span>
                        </p>
                      </div>
                      {inq.status === 'Received' && (
                        <button
                          type="button"
                          onClick={async () => {
                            await pustApi.markInquiryReviewed(inq.id);
                            await refresh();
                          }}
                          className="px-2.5 py-1 border border-emerald-800 bg-[#FAF8F4] text-emerald-800 hover:bg-emerald-900 hover:text-white h-fit cursor-pointer whitespace-nowrap shrink-0"
                        >
                          Mark Reviewed
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="bg-white border border-stone-200 shadow-xs p-6 space-y-3">
            <div className="border-b border-stone-200 pb-3">
              <h3 className="font-serif text-lg font-medium text-slate-900 tabular-nums">
                University Audit Trail ({auditLogs.length})
              </h3>
            </div>
            <div className="divide-y divide-stone-200 border border-stone-200 text-xs max-h-64 overflow-y-auto">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-2.5 font-mono">
                  <span className="text-emerald-800 font-semibold">{log.action}</span> —{' '}
                  {log.target}
                  <span className="block text-slate-500 tabular-nums">
                    {log.actorName} ({log.actorRole}) · {log.timestamp.slice(0, 16).replace('T', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

