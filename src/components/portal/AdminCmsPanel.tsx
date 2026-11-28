'use client';

import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Check,
  Copy,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Link2,
  Lock,
  Pin,
  PinOff,
  Trash2,
  Upload,
  Video,
} from 'lucide-react';
import { pustApi } from '../../lib/api';
import {
  detectAttachmentType,
  getYouTubeThumbnailUrl,
  isSafeMediaUrl,
  parseYouTubeVideoId,
} from '../../lib/media';
import { usePust } from '../PustContext';
import { AdminUserDirectoryPanel } from './AdminUserDirectoryPanel';
import type {
  AboutContentRecord,
  AuditLogRecord,
  AuthUser,
  BannerSlideRecord,
  DepartmentRecord,
  FeeConfig,
  GalleryItemRecord,
  InquiryRecord,
  NoticeBoardScope,
  NoticeCategory,
  NoticeRecord,
  NoticeVisibility,
  PaymentGatewayConfig,
  SignupTokenRecord,
  ViceChancellorRecord,
} from '../../types/pust';

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Unable to read selected file.'));
    reader.readAsDataURL(file);
  });
}

const HALL_OPTIONS = [
  'July 06 Hall',
  'Male Hall-1',
  'Male Hall-2',
  'Female Hall-1',
  'Female Hall-2',
];

type GovernanceSubTab = 'notices' | 'approvals' | 'users' | 'cms' | 'finance' | 'inquiries';

interface AdminCmsPanelProps {
  user: AuthUser;
  departments: DepartmentRecord[];
  aboutSections: AboutContentRecord[];
  vcProfiles: ViceChancellorRecord[];
  galleryItems: GalleryItemRecord[];
  bannerSlides?: BannerSlideRecord[];
  notices?: NoticeRecord[];
  onNoticesChange: () => Promise<void>;
  onCmsChange: () => Promise<void>;
}

export function AdminCmsPanel({
  user,
  departments,
  aboutSections,
  vcProfiles,
  galleryItems,
  bannerSlides = [],
  notices = [],
  onNoticesChange,
  onCmsChange,
}: AdminCmsPanelProps) {
  const { profile } = usePust();
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
  const [inquiryNotes, setInquiryNotes] = useState<Record<string, string>>({});

  const availableTabs = useMemo<Array<{ id: GovernanceSubTab; label: string }>>(() => {
    const tabs: Array<{ id: GovernanceSubTab; label: string }> = [];
    if (user.role !== 'student') {
      tabs.push({ id: 'notices', label: 'Notice Publisher' });
    }
    if (user.role === 'admin' || user.role === 'chairman') {
      tabs.push({ id: 'approvals', label: 'Tokens & Approvals' });
    }
    if (user.role === 'admin') {
      tabs.push({ id: 'users', label: 'User Directory' });
      tabs.push({ id: 'cms', label: 'Public CMS' });
      tabs.push({ id: 'finance', label: 'Gateways & Fees' });
    }
    if (user.role === 'admin' || user.role === 'registrar' || user.role === 'vc') {
      tabs.push({
        id: 'inquiries',
        label: user.role === 'vc' ? 'Audit Trail' : 'Inquiries & Audit',
      });
    }
    return tabs;
  }, [user.role]);

  const defaultTab: GovernanceSubTab =
    user.role === 'admin' || user.role === 'chairman'
      ? 'approvals'
      : user.role === 'registrar'
      ? 'inquiries'
      : 'notices';

  const [activeSubTab, setActiveSubTab] = useState<GovernanceSubTab>(defaultTab);

  useEffect(() => {
    if (!availableTabs.some((t) => t.id === activeSubTab) && availableTabs[0]) {
      setActiveSubTab(availableTabs[0].id);
    }
  }, [availableTabs, activeSubTab]);

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
  const [noticeAttachmentUrl, setNoticeAttachmentUrl] = useState('');
  const [noticeAttachmentType, setNoticeAttachmentType] = useState<'image' | 'pdf' | 'other' | ''>('');
  const [noticeAttachMode, setNoticeAttachMode] = useState<'upload' | 'link'>('upload');
  const [noticeTypeOverride, setNoticeTypeOverride] = useState<'auto' | 'image' | 'pdf'>('auto');
  const [uploadingNoticeFile, setUploadingNoticeFile] = useState(false);
  const [noticeSummary, setNoticeSummary] = useState('');
  const [noticeBody, setNoticeBody] = useState('');
  const [noticePinned, setNoticePinned] = useState(false);
  const [publishingNotice, setPublishingNotice] = useState(false);
  const [noticeActionId, setNoticeActionId] = useState<string | null>(null);
  const [noticeFilterQuery, setNoticeFilterQuery] = useState('');

  // Admin About CMS
  const [aboutSlug, setAboutSlug] = useState<AboutContentRecord['slug']>('our-university');
  const [aboutTitle, setAboutTitle] = useState(aboutSections[0]?.title || '');
  const [aboutBody, setAboutBody] = useState(aboutSections[0]?.body || '');

  // Admin Current VC CMS
  const currentVc = vcProfiles.find((v) => v.isCurrent) || vcProfiles[0];
  const [vcName, setVcName] = useState(currentVc?.name || '');
  const [vcEmail, setVcEmail] = useState(currentVc?.email || '');
  const [vcPhone, setVcPhone] = useState(currentVc?.phone || '');
  const [vcTenure, setVcTenure] = useState(currentVc?.tenure || '');
  const [vcMsg, setVcMsg] = useState(currentVc?.message || '');
  const [promoteNewVc, setPromoteNewVc] = useState(false);

  // Admin Hero Banner Slides CMS
  const [bannerSourceMode, setBannerSourceMode] = useState<'upload' | 'link'>('upload');
  const [bannerUrl, setBannerUrl] = useState('');
  const [bannerCaption, setBannerCaption] = useState('');
  const [bannerAlt, setBannerAlt] = useState('');
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [savingBanner, setSavingBanner] = useState(false);
  const [bannerCaptionsDraft, setBannerCaptionsDraft] = useState<Record<string, string>>({});

  // Admin Gallery / News & Events CMS
  const [galTitle, setGalTitle] = useState('');
  const [galDesc, setGalDesc] = useState('');
  const [galCat, setGalCat] = useState<GalleryItemRecord['category']>('Academic Event');
  const [galType, setGalType] = useState<GalleryItemRecord['mediaType']>('photo');
  const [galPhotoSourceMode, setGalPhotoSourceMode] = useState<'upload' | 'link'>('upload');
  const [galVisibility, setGalVisibility] = useState<'public' | 'registered'>('public');
  const [galUrl, setGalUrl] = useState('');
  const [galDate, setGalDate] = useState('');
  const [uploadingGalleryPhoto, setUploadingGalleryPhoto] = useState(false);

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

  useEffect(() => {
    if (!currentVc) return;
    setVcName(currentVc.name || '');
    setVcEmail(currentVc.email || '');
    setVcPhone(currentVc.phone || '');
    setVcTenure(currentVc.tenure || '');
    setVcMsg(currentVc.message || '');
  }, [currentVc]);

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
    const trimmedRef = noticeRef.trim();
    const trimmedTitle = noticeTitle.trim();
    const trimmedDept = noticeDept.trim();
    const trimmedSummary = noticeSummary.trim();
    const trimmedBody = noticeBody.trim();

    if (trimmedRef.length < 2 || trimmedTitle.length < 3 || trimmedDept.length < 2) {
      setError('Memo reference, circular title, and unit/department code are required.');
      return;
    }
    if (trimmedSummary.length < 3 || trimmedBody.length < 5) {
      setError('Please enter an executive summary (3+ chars) and circular details (5+ chars).');
      return;
    }
    if (noticeScope === 'course' && !noticeTargetCourse.trim()) {
      setError('Target Course Code is required for course-scoped notices.');
      return;
    }

    const resolvedUrl = noticeAttachmentUrl.trim() || undefined;
    if (resolvedUrl && !isSafeMediaUrl(resolvedUrl)) {
      setError('Attachment direct link must start with https://, http://, or a valid local / path.');
      return;
    }

    setPublishingNotice(true);
    try {
      const explicitKind = noticeTypeOverride === 'auto' ? undefined : noticeTypeOverride;
      const resolvedType = resolvedUrl
        ? explicitKind ||
          (noticeAttachmentType || undefined) ||
          detectAttachmentType(resolvedUrl || noticeAttachment)
        : undefined;
      await pustApi.createNotice({
        referenceNo: trimmedRef,
        title: trimmedTitle,
        category: noticeCat,
        departmentCode: trimmedDept,
        boardScope: noticeScope,
        visibility: noticeVisibility,
        targetSession: noticeTargetSession.trim() || undefined,
        targetCourseCode: noticeTargetCourse.trim() || undefined,
        attachmentName: noticeAttachment.trim() || undefined,
        attachmentUrl: resolvedUrl,
        attachmentType: resolvedType,
        summary: trimmedSummary,
        body: trimmedBody,
        pinned: noticePinned,
      });
      setFeedback(`Published ${noticeVisibility} ${noticeScope} notice "${trimmedTitle}".`);
      setNoticeRef('');
      setNoticeTitle('');
      setNoticeTargetSession('');
      setNoticeTargetCourse('');
      setNoticeAttachment('');
      setNoticeAttachmentUrl('');
      setNoticeAttachmentType('');
      setNoticeTypeOverride('auto');
      setNoticeSummary('');
      setNoticeBody('');
      setNoticePinned(false);
      await onNoticesChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to publish notice.');
    } finally {
      setPublishingNotice(false);
    }
  }

  async function handleNoticeFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    setFeedback(null);
    if (file.size > 8 * 1024 * 1024) {
      setError('Attachment size must be 8 MB or less.');
      return;
    }
    setUploadingNoticeFile(true);
    try {
      const dataBase64 = await readFileAsDataUrl(file);
      const uploaded = await pustApi.uploadMediaToImageKit({
        purpose: 'notice',
        fileName: file.name,
        mimeType: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
        dataBase64,
      });
      setNoticeAttachment(file.name);
      setNoticeAttachmentUrl(uploaded.url);
      setNoticeAttachmentType(uploaded.attachmentType);
      setNoticeTypeOverride(uploaded.attachmentType === 'pdf' ? 'pdf' : 'image');
      setFeedback(`Uploaded "${file.name}" to ImageKit.io and attached to notice draft.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload attachment to ImageKit.io.');
    } finally {
      setUploadingNoticeFile(false);
    }
  }

  async function handleTogglePinNotice(notice: NoticeRecord) {
    setError(null);
    setFeedback(null);
    setNoticeActionId(notice.id);
    try {
      await pustApi.updateNotice(notice.id, { pinned: !notice.pinned });
      setFeedback(
        !notice.pinned
          ? `Pinned "${notice.title}" to top of Notice Board.`
          : `Unpinned "${notice.title}".`
      );
      await onNoticesChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update notice pin status.');
    } finally {
      setNoticeActionId(null);
    }
  }

  async function handleDeleteNotice(notice: NoticeRecord) {
    setError(null);
    setFeedback(null);
    setNoticeActionId(notice.id);
    try {
      await pustApi.deleteNotice(notice.id);
      setFeedback(`Removed circular "${notice.title}".`);
      await onNoticesChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete notice.');
    } finally {
      setNoticeActionId(null);
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

  async function handleBannerFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    setFeedback(null);
    if (file.size > 8 * 1024 * 1024) {
      setError('Banner image size must be 8 MB or less.');
      return;
    }
    setUploadingBanner(true);
    try {
      const dataBase64 = await readFileAsDataUrl(file);
      const uploaded = await pustApi.uploadMediaToImageKit({
        purpose: 'banner',
        fileName: file.name,
        mimeType: file.type || 'image/jpeg',
        dataBase64,
      });
      setBannerUrl(uploaded.url);
      if (!bannerCaption.trim()) {
        setBannerCaption(file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '));
      }
      setFeedback(`Uploaded banner image "${file.name}" to ImageKit.io. Enter caption and click Add Banner Slide.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload banner image to ImageKit.io.');
    } finally {
      setUploadingBanner(false);
    }
  }

  async function handleAddBannerSlide(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    const trimmedUrl = bannerUrl.trim();
    if (!trimmedUrl || !bannerCaption.trim()) {
      setError('Upload an image or enter a direct banner image URL and photo caption.');
      return;
    }
    if (!isSafeMediaUrl(trimmedUrl)) {
      setError('Direct banner image link must start with https://, http://, or a valid local / path.');
      return;
    }
    setSavingBanner(true);
    try {
      await pustApi.createBannerSlide({
        imageUrl: trimmedUrl,
        caption: bannerCaption.trim(),
        alt: bannerAlt.trim() || undefined,
      });
      setFeedback('Added new slide to the Homepage Hero Banner carousel.');
      setBannerUrl('');
      setBannerCaption('');
      setBannerAlt('');
      await onCmsChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add banner slide.');
    } finally {
      setSavingBanner(false);
    }
  }

  async function handleMoveBannerSlide(index: number, direction: -1 | 1) {
    const nextIdx = index + direction;
    if (nextIdx < 0 || nextIdx >= bannerSlides.length) return;
    setError(null);
    setFeedback(null);
    const reordered = [...bannerSlides];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(nextIdx, 0, moved);
    try {
      await pustApi.reorderBannerSlides(reordered.map((s) => s.id));
      await onCmsChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reorder banner slides.');
    }
  }

  async function handleSaveBannerCaption(slide: BannerSlideRecord) {
    const nextCaption = (bannerCaptionsDraft[slide.id] ?? slide.caption).trim();
    if (nextCaption.length < 3) {
      setError('Banner caption must be at least 3 characters.');
      return;
    }
    setError(null);
    setFeedback(null);
    try {
      await pustApi.updateBannerSlide(slide.id, { caption: nextCaption });
      setFeedback('Updated banner slide caption.');
      await onCmsChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update banner caption.');
    }
  }

  async function handleGalleryPhotoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    setFeedback(null);
    if (file.size > 8 * 1024 * 1024) {
      setError('Photo size must be 8 MB or less.');
      return;
    }
    setUploadingGalleryPhoto(true);
    try {
      const dataBase64 = await readFileAsDataUrl(file);
      const uploaded = await pustApi.uploadMediaToImageKit({
        purpose: 'gallery',
        fileName: file.name,
        mimeType: file.type || 'image/jpeg',
        dataBase64,
      });
      setGalType('photo');
      setGalUrl(uploaded.url);
      setFeedback(`Uploaded photo "${file.name}" to ImageKit.io.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload photo to ImageKit.io.');
    } finally {
      setUploadingGalleryPhoto(false);
    }
  }

  async function handleAddGallery(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    const trimmedUrl = galUrl.trim();
    if (galType === 'video' && !parseYouTubeVideoId(trimmedUrl) && !trimmedUrl.match(/\.(mp4|webm)(\?|$)/i)) {
      setError('Please enter a valid YouTube video URL (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...).');
      return;
    }
    if (galType === 'photo' && !isSafeMediaUrl(trimmedUrl)) {
      setError('Please upload a photo or enter a valid direct photo link (https://, http://, or local / path).');
      return;
    }
    try {
      await pustApi.createGalleryItem({
        title: galTitle,
        description: galDesc,
        category: galCat,
        mediaType: galType,
        mediaUrl: trimmedUrl,
        eventDate: galDate,
        visibility: galVisibility,
      });
      setFeedback(`Added "${galTitle}" (${galVisibility === 'registered' ? 'Registered Users Only' : 'Public'}) to News & Events.`);
      setGalTitle('');
      setGalDesc('');
      if (galType === 'video') {
        setGalUrl('');
      }
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

  async function handleReviewInquiry(inq: InquiryRecord) {
    setError(null);
    setFeedback(null);
    const note = inquiryNotes[inq.id]?.trim();
    try {
      await pustApi.markInquiryReviewed(inq.id, note || undefined);
      setFeedback(`Marked inquiry ${inq.referenceCode || inq.fullName} as Reviewed.`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to mark inquiry as reviewed.');
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
            'Issue university-wide notices, respond to admission inquiries, and oversee administrative audit logs.',
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-pust-800">
              {headerMeta.kicker}
            </p>
            <h2 className="font-serif text-2xl font-medium text-slate-900">{headerMeta.title}</h2>
            <p className="text-xs text-slate-600 max-w-2xl">{headerMeta.subtitle}</p>
          </div>
          {(user.role === 'admin' || user.role === 'chairman') && (
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums">
              <div className="px-3.5 py-2 rounded-xl bg-[#F7F7F5] border border-slate-200">
                <span className="block text-[10px] uppercase tracking-wider text-slate-500">
                  Pending Approvals
                </span>
                <span className="text-base font-semibold text-amber-800">{pendingUsersCount}</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-[#F7F7F5] border border-slate-200">
                <span className="block text-[10px] uppercase tracking-wider text-slate-500">
                  Active Tokens
                </span>
                <span className="text-base font-semibold text-pust-800">
                  {tokens.filter((t) => !t.used).length}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Sub-workspace navigation tabs */}
        {availableTabs.length > 1 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4">
            {availableTabs.map((tab) => {
              const active = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveSubTab(tab.id);
                    setError(null);
                    setFeedback(null);
                  }}
                  className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'border-pust-900 bg-pust-900 text-white'
                      : 'border-slate-200 bg-[#F7F7F5] text-slate-700 hover:border-pust-700 hover:text-pust-900'
                  }`}
                >
                  {tab.label}
                  {tab.id === 'approvals' && pendingUsersCount > 0 && (
                    <span className="ml-1.5 font-mono tabular-nums opacity-85">
                      ({pendingUsersCount})
                    </span>
                  )}
                  {tab.id === 'inquiries' && receivedInquiriesCount > 0 && user.role !== 'vc' && (
                    <span className="ml-1.5 font-mono tabular-nums opacity-85">
                      ({receivedInquiriesCount})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Teacher Assigned Courses & Sessions Context */}
      {user.role === 'teacher' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-4 h-4 text-pust-800 shrink-0" />
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
        <div className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-sm text-red-900">
          {error}
        </div>
      )}
      {feedback && (
        <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 text-sm text-emerald-900">
          {feedback}
        </div>
      )}

      {/* 1. Role-Scoped Notice Board Publisher & Registry */}
      {activeSubTab === 'notices' && user.role !== 'student' && (() => {
        const isExecutiveCentral = ['admin', 'registrar', 'vc'].includes(user.role);
        const centralUnitDefaults = new Set([
          'REG',
          'REGISTRAR',
          'ADMIN',
          'ADMISSION',
          'CONTROLLER',
          'IQAC',
          'PR',
          'LIB',
          'HALL',
          'PROCTOR',
        ]);
        const managedNotices = notices.filter((n) => {
          const matchesRole =
            isExecutiveCentral || n.departmentCode === user.departmentCode;
          const q = noticeFilterQuery.trim().toLowerCase();
          const matchesQuery =
            !q ||
            n.title.toLowerCase().includes(q) ||
            n.referenceNo.toLowerCase().includes(q) ||
            n.departmentCode.toLowerCase().includes(q);
          return matchesRole && matchesQuery;
        });

        return (
          <div className="space-y-6">
            <form
              onSubmit={handleCreateNotice}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4"
            >
              <div className="border-b border-slate-200 pb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-serif text-lg font-medium text-slate-900">{noticeHeading}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Published circulars appear immediately on the University Notice Board and targeted member portals.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                    Memo Ref
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    value={noticeRef}
                    onChange={(e) => setNoticeRef(e.target.value)}
                    placeholder="PUST/REG/2026/..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:outline-none focus:border-pust-800"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                    Notice Board Scope
                  </label>
                  <select
                    value={noticeScope}
                    onChange={(e) => {
                      const nextScope = e.target.value as NoticeBoardScope;
                      setNoticeScope(nextScope);
                      if (isExecutiveCentral) {
                        if (nextScope === 'central' && !centralUnitDefaults.has(noticeDept)) {
                          setNoticeDept('REG');
                        } else if (nextScope !== 'central' && centralUnitDefaults.has(noticeDept)) {
                          setNoticeDept(departments[0]?.code || 'CSE');
                        }
                      }
                    }}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:outline-none focus:border-pust-800"
                  >
                    {['admin', 'registrar', 'vc', 'proctor', 'library', 'hall'].includes(user.role) && (
                      <option value="central">Central Notice Board</option>
                    )}
                    {(isExecutiveCentral || user.role === 'chairman' || user.role === 'teacher') && (
                      <option value="department">Department Notice Board</option>
                    )}
                    {(isExecutiveCentral || user.role === 'teacher') && (
                      <option value="course">Course &amp; Session Notice</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                    Visibility
                  </label>
                  <select
                    value={noticeVisibility}
                    onChange={(e) => setNoticeVisibility(e.target.value as NoticeVisibility)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:outline-none focus:border-pust-800"
                  >
                    <option value="public">Public (Everyone)</option>
                    <option value="registered">Registered Members Only</option>
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                    Category
                  </label>
                  <select
                    value={noticeCat}
                    onChange={(e) => setNoticeCat(e.target.value as NoticeCategory)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:outline-none focus:border-pust-800"
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
                        'Press Release',
                      ] as NoticeCategory[]
                    ).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                    Circular Title
                  </label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    value={noticeTitle}
                    onChange={(e) => setNoticeTitle(e.target.value)}
                    placeholder="Official Circular Title"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:outline-none focus:border-pust-800"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                    {noticeScope === 'central' ? 'Issuing Unit Code' : 'Target Department'}
                  </label>
                  {isExecutiveCentral && noticeScope !== 'central' ? (
                    <select
                      value={noticeDept}
                      onChange={(e) => setNoticeDept(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:outline-none focus:border-pust-800"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.code}>
                          {d.code} — {d.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      minLength={2}
                      disabled={user.role === 'chairman' || user.role === 'teacher'}
                      value={noticeDept}
                      onChange={(e) => setNoticeDept(e.target.value)}
                      placeholder="Unit / Dept Code (e.g. REG, ADMIN, CSE)"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] disabled:opacity-75 focus:bg-white focus:outline-none focus:border-pust-800"
                    />
                  )}
                </div>
              </div>
              {(noticeScope === 'department' || noticeScope === 'course') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={noticeTargetSession}
                    onChange={(e) => setNoticeTargetSession(e.target.value)}
                    placeholder="Optional Target Session (e.g. 2022-23)"
                    className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:outline-none focus:border-pust-800"
                  />
                  <input
                    type="text"
                    required={noticeScope === 'course'}
                    value={noticeTargetCourse}
                    onChange={(e) => setNoticeTargetCourse(e.target.value)}
                    placeholder="Target Course Code (required for Course scope)"
                    className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:outline-none focus:border-pust-800"
                  />
                </div>
              )}
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                  Executive Summary
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  value={noticeSummary}
                  onChange={(e) => setNoticeSummary(e.target.value)}
                  placeholder="One-line executive summary shown on notice cards"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:outline-none focus:border-pust-800"
                />
              </div>
              <div className="rounded-xl border border-slate-200 bg-[#F7F7F5] p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-slate-600 font-semibold">
                      Official Attachment — Image or PDF
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Upload a circular image/PDF to ImageKit.io or add a direct image/PDF link.
                    </p>
                  </div>
                  <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 text-[11px] font-medium shrink-0">
                    <button
                      type="button"
                      onClick={() => setNoticeAttachMode('upload')}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                        noticeAttachMode === 'upload'
                          ? 'bg-pust-900 text-white'
                          : 'text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      <Upload className="w-3 h-3" />
                      Upload (ImageKit.io)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNoticeAttachMode('link')}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                        noticeAttachMode === 'link'
                          ? 'bg-pust-900 text-white'
                          : 'text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      <Link2 className="w-3 h-3" />
                      Direct Link (Image / PDF)
                    </button>
                  </div>
                </div>

                {noticeAttachMode === 'upload' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                    <label className="sm:col-span-5 inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-medium bg-white border border-dashed border-slate-400 text-slate-800 hover:border-pust-800 hover:text-pust-900 cursor-pointer whitespace-nowrap">
                      <Upload className="w-3.5 h-3.5 text-pust-800" />
                      {uploadingNoticeFile ? 'Uploading to ImageKit.io...' : 'Choose Image or PDF File'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                        disabled={uploadingNoticeFile}
                        onChange={handleNoticeFileUpload}
                        className="sr-only"
                      />
                    </label>
                    <input
                      type="text"
                      value={noticeAttachment}
                      onChange={(e) => setNoticeAttachment(e.target.value)}
                      placeholder="Display Label (e.g. Exam-Schedule-2026.pdf)"
                      className="sm:col-span-7 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-pust-800"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                    <div className="sm:col-span-6">
                      <label className="block font-mono text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                        Direct Image or PDF URL
                      </label>
                      <input
                        type="text"
                        value={noticeAttachmentUrl}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNoticeAttachmentUrl(val);
                          const detected = val.trim() ? detectAttachmentType(val) : '';
                          setNoticeAttachmentType(detected);
                        }}
                        placeholder="https://example.edu/circular.pdf or https://.../photo.jpg"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-pust-800"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block font-mono text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                        Link File Type
                      </label>
                      <select
                        value={noticeTypeOverride}
                        onChange={(e) => {
                          const next = e.target.value as 'auto' | 'image' | 'pdf';
                          setNoticeTypeOverride(next);
                          if (next !== 'auto') {
                            setNoticeAttachmentType(next);
                          } else {
                            setNoticeAttachmentType(
                              noticeAttachmentUrl.trim()
                                ? detectAttachmentType(noticeAttachmentUrl)
                                : ''
                            );
                          }
                        }}
                        aria-label="Direct link attachment format"
                        className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-pust-800"
                      >
                        <option value="auto">Auto-detect (.pdf / .jpg)</option>
                        <option value="image">Image (JPG / PNG / WebP)</option>
                        <option value="pdf">PDF Document</option>
                      </select>
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block font-mono text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                        Display Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={noticeAttachment}
                        onChange={(e) => setNoticeAttachment(e.target.value)}
                        placeholder="e.g. Exam-Circular.pdf"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-pust-800"
                      />
                    </div>
                  </div>
                )}

                {noticeAttachmentUrl.trim() && !isSafeMediaUrl(noticeAttachmentUrl) && (
                  <p className="text-[11px] font-mono text-red-700">
                    Enter a valid direct link starting with https://, http://, or a local / path.
                  </p>
                )}

                {(noticeAttachment || noticeAttachmentUrl) && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-2.5 text-[11px] font-mono text-slate-700">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {(() => {
                        const effectiveType =
                          noticeTypeOverride !== 'auto'
                            ? noticeTypeOverride
                            : noticeAttachmentType ||
                              detectAttachmentType(noticeAttachmentUrl || noticeAttachment);
                        const safeUrl = isSafeMediaUrl(noticeAttachmentUrl)
                          ? noticeAttachmentUrl.trim()
                          : '';
                        if (effectiveType === 'image' && safeUrl) {
                          return (
                            <img
                              src={safeUrl}
                              alt={noticeAttachment || 'Attachment preview'}
                              referrerPolicy="no-referrer"
                              className="w-12 h-9 rounded object-cover border border-slate-200 bg-slate-100 shrink-0"
                            />
                          );
                        }
                        return <FileText className="w-4 h-4 text-pust-800 shrink-0" />;
                      })()}
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {noticeAttachment || noticeAttachmentUrl}
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase">
                          {noticeTypeOverride !== 'auto'
                            ? noticeTypeOverride
                            : noticeAttachmentType ||
                              detectAttachmentType(noticeAttachmentUrl || noticeAttachment)}{' '}
                          {noticeAttachmentUrl ? '· Link attached' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {isSafeMediaUrl(noticeAttachmentUrl) && (
                        <a
                          href={noticeAttachmentUrl.trim()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-pust-800 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Open
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setNoticeAttachment('');
                          setNoticeAttachmentUrl('');
                          setNoticeAttachmentType('');
                          setNoticeTypeOverride('auto');
                        }}
                        className="text-red-700 hover:underline cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                  Full Circular Details
                </label>
                <textarea
                  rows={4}
                  required
                  minLength={5}
                  value={noticeBody}
                  onChange={(e) => setNoticeBody(e.target.value)}
                  placeholder="Full circular details and instructions..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:outline-none focus:border-pust-800"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                {['admin', 'registrar', 'vc', 'chairman'].includes(user.role) ? (
                  <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={noticePinned}
                      onChange={(e) => setNoticePinned(e.target.checked)}
                    />
                    Pin circular to top of Notice Board
                  </label>
                ) : (
                  <span />
                )}
                <button
                  type="submit"
                  disabled={publishingNotice}
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-pust-900 text-white hover:bg-pust-950 disabled:opacity-60 cursor-pointer whitespace-nowrap shrink-0"
                >
                  {publishingNotice ? 'Publishing Circular...' : 'Publish Official Circular'}
                </button>
              </div>
            </form>

            {/* Published Circulars Registry & Management */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <h3 className="font-serif text-lg font-medium text-slate-900 tabular-nums">
                    Published Circulars ({managedNotices.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verify live circulars, pin featured announcements, or remove outdated notices.
                  </p>
                </div>
                <input
                  type="search"
                  value={noticeFilterQuery}
                  onChange={(e) => setNoticeFilterQuery(e.target.value)}
                  placeholder="Filter by title, memo ref, or unit..."
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:outline-none focus:border-pust-800 w-full sm:w-64"
                />
              </div>

              {managedNotices.length === 0 ? (
                <p className="text-xs text-slate-600 p-4 rounded-xl border border-slate-200 bg-[#F7F7F5]">
                  No circulars match your current filter.
                </p>
              ) : (
                <div className="rounded-xl border border-slate-200 overflow-hidden text-xs max-h-[420px] overflow-y-auto overscroll-contain">
                  <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-3.5 py-2 bg-[#FAF9F6] border-b border-slate-200 font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    <div className="sm:col-span-1">S.N</div>
                    <div className="sm:col-span-8">Circular Details</div>
                    <div className="sm:col-span-3 text-right">Actions</div>
                  </div>
                  <div className="divide-y divide-slate-200">
                    {managedNotices.map((n, idx) => {
                      const canManage =
                        user.role === 'admin' ||
                        user.role === 'registrar' ||
                        (user.role === 'chairman' && n.departmentCode === user.departmentCode);
                      const canPin =
                        canManage || user.role === 'vc';
                      const busy = noticeActionId === n.id;
                      return (
                        <div
                          key={n.id}
                          className={`p-3.5 grid grid-cols-1 sm:grid-cols-12 sm:items-center gap-3 hover:bg-[#F7F7F5]/60 transition-colors ${
                            idx % 2 === 0 ? 'bg-white' : 'bg-[#FAF9F6]/60'
                          }`}
                        >
                          <div className="sm:col-span-1 font-mono text-xs font-semibold text-slate-500 tabular-nums">
                            <span className="sm:hidden text-[10px] uppercase mr-1 text-slate-400">
                              S.N
                            </span>
                            {String(idx + 1).padStart(2, '0')}
                          </div>
                          <div className="sm:col-span-8 space-y-1 min-w-0">
                            <p className="font-mono text-[11px] text-pust-800 tabular-nums flex flex-wrap items-center gap-1.5">
                              <span>{n.publishedAt}</span>
                              <span>· {n.referenceNo}</span>
                              <span>· {n.category}</span>
                              <span>· {n.departmentCode}</span>
                              <span className="uppercase">· {n.boardScope}</span>
                              {n.visibility === 'registered' && (
                                <span className="font-semibold text-amber-800">· REGISTERED ONLY</span>
                              )}
                              {(n.attachmentName || n.attachmentUrl) && (
                                <span className="text-slate-600">
                                  · FILE: {n.attachmentName || 'Attached'}
                                </span>
                              )}
                              {n.pinned && (
                                <span className="px-1.5 py-0.5 rounded bg-pust-50 border border-pust-200 text-pust-900 font-semibold">
                                  PINNED
                                </span>
                              )}
                            </p>
                            <p className="font-medium text-sm text-slate-900">{n.title}</p>
                            <p className="text-slate-600 line-clamp-1">{n.summary}</p>
                          </div>

                        {(canPin || canManage) && (
                          <div className="sm:col-span-3 flex items-center sm:justify-end gap-2 shrink-0">
                            {canPin && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleTogglePinNotice(n)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:border-pust-800 hover:text-pust-900 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                              >
                                {n.pinned ? (
                                  <>
                                    <PinOff className="w-3.5 h-3.5" />
                                    Unpin
                                  </>
                                ) : (
                                  <>
                                    <Pin className="w-3.5 h-3.5" />
                                    Pin
                                  </>
                                )}
                              </button>
                            )}
                            {canManage && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleDeleteNotice(n)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 bg-white text-red-700 hover:bg-red-50 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* 2. Student Portal Signup Tokens & User Approvals (Admin & Chairman) */}
      {activeSubTab === 'approvals' && (user.role === 'admin' || user.role === 'chairman') && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="border-b border-slate-200 pb-3">
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
                className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:outline-none focus:border-pust-800"
              />
              <input
                type="email"
                required
                value={tokEmail}
                onChange={(e) => setTokEmail(e.target.value)}
                placeholder="Student Email"
                className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:outline-none focus:border-pust-800"
              />
              <input
                type="tel"
                required
                value={tokPhone}
                onChange={(e) => setTokPhone(e.target.value)}
                placeholder="Phone (+880...)"
                className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:outline-none focus:border-pust-800"
              />
              <input
                type="text"
                required
                value={tokAcademicId}
                onChange={(e) => setTokAcademicId(e.target.value)}
                placeholder="Academic ID (e.g. 250112)"
                className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:outline-none focus:border-pust-800"
              />
              <select
                value={tokDept}
                disabled={user.role === 'chairman'}
                onChange={(e) => setTokDept(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] disabled:opacity-75 focus:outline-none focus:border-pust-800"
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
                className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:outline-none focus:border-pust-800"
              />
              <select
                value={tokHall}
                onChange={(e) => setTokHall(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:outline-none focus:border-pust-800"
              >
                {HALL_OPTIONS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-pust-900 text-white hover:bg-pust-950 cursor-pointer whitespace-nowrap shrink-0"
              >
                Generate Signup Token
              </button>
            </form>

            {tokens.length > 0 && (
              <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 overflow-hidden text-xs">
                {tokens.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 flex flex-wrap items-center justify-between gap-2 bg-[#F7F7F5]/60"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-semibold text-pust-800 tabular-nums">
                        {t.token}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyToken(t.id, t.token)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-md border border-slate-300 bg-white text-slate-700 hover:border-pust-700 hover:text-pust-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      >
                        {copiedTokenId === t.id ? (
                          <>
                            <Check className="w-3 h-3 text-pust-700" />
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
                      <span
                        className={t.used ? 'text-slate-500' : 'text-pust-800 font-semibold'}
                      >
                        {t.used ? 'USED' : 'ACTIVE'}
                      </span>{' '}
                      · Issued by {t.createdBy}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Account Approvals */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
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
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                      approvalFilter === tab.id
                        ? 'border-pust-900 bg-pust-900 text-white'
                        : 'border-slate-300 bg-[#F7F7F5] text-slate-700 hover:border-pust-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredUsers.length === 0 ? (
              <p className="text-xs text-slate-600 p-4 rounded-xl border border-slate-200 bg-[#F7F7F5]">
                No accounts match this approval status filter.
              </p>
            ) : (
              <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 overflow-hidden text-xs">
                {filteredUsers.map((u) => {
                  const assignVal = teacherAssigns[u.id] || {
                    courses: (u.assignedCourses || []).join(', '),
                    sessions: (u.assignedSessions || []).join(', '),
                  };
                  return (
                    <div
                      key={u.id}
                      className="p-3.5 space-y-2 bg-white hover:bg-[#F7F7F5]/60 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm text-slate-900">
                            {u.name} ·{' '}
                            <span className="font-mono text-pust-800 uppercase">{u.role}</span>
                          </p>
                          <p className="font-mono text-slate-500 tabular-nums">
                            {u.email} · {u.departmentCode} · ID {u.academicId} ·{' '}
                            <span
                              className={`font-semibold uppercase ${
                                u.approvalStatus === 'approved'
                                  ? 'text-pust-800'
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
                              className="px-3 py-1.5 font-medium rounded-lg bg-pust-900 text-white hover:bg-pust-950 cursor-pointer whitespace-nowrap shrink-0"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUserApproval(u.id, 'rejected')}
                              className="px-3 py-1.5 font-medium rounded-lg border border-red-300 bg-white text-red-700 hover:bg-red-50 cursor-pointer whitespace-nowrap shrink-0"
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
                            className="px-2.5 py-2 rounded-lg border border-slate-300 bg-[#F7F7F5] w-full sm:w-auto sm:flex-1 sm:min-w-[200px] focus:bg-white focus:outline-none focus:border-pust-800"
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
                            className="px-2.5 py-2 rounded-lg border border-slate-300 bg-[#F7F7F5] w-full sm:w-52 focus:bg-white focus:outline-none focus:border-pust-800"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveTeacherAssign(u.id)}
                            className="px-3 py-1.5 rounded-lg border border-pust-800 bg-white text-pust-800 hover:bg-pust-900 hover:text-white cursor-pointer whitespace-nowrap shrink-0"
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
        </div>
      )}

      {/* 2B. Admin User Directory */}
      {activeSubTab === 'users' && user.role === 'admin' && (
        <AdminUserDirectoryPanel
          currentUser={user}
          departments={departments}
          offices={profile?.adminOffices}
          onUsersChanged={refresh}
        />
      )}

      {/* 3. Admin Public CMS: About PUST, Vice-Chancellor Archive, Gallery */}
      {activeSubTab === 'cms' && user.role === 'admin' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form
              onSubmit={handleSaveAbout}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3"
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
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:outline-none focus:border-pust-800"
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
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:outline-none focus:border-pust-800"
              />
              <textarea
                rows={4}
                required
                value={aboutBody}
                onChange={(e) => setAboutBody(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:outline-none focus:border-pust-800"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-pust-900 text-white hover:bg-pust-950 cursor-pointer whitespace-nowrap shrink-0"
              >
                Save About Section
              </button>
            </form>

            <form
              onSubmit={handleSaveVc}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3"
            >
              <h3 className="font-serif text-lg font-medium text-slate-900">
                Vice-Chancellor CMS &amp; Archive Promotion
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={vcName}
                  onChange={(e) => setVcName(e.target.value)}
                  placeholder="VC Name"
                  className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:outline-none focus:border-pust-800"
                />
                <input
                  type="text"
                  required
                  value={vcTenure}
                  onChange={(e) => setVcTenure(e.target.value)}
                  placeholder="Tenure"
                  className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:outline-none focus:border-pust-800"
                />
                <input
                  type="email"
                  required
                  value={vcEmail}
                  onChange={(e) => setVcEmail(e.target.value)}
                  className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:outline-none focus:border-pust-800"
                />
                <input
                  type="text"
                  required
                  value={vcPhone}
                  onChange={(e) => setVcPhone(e.target.value)}
                  className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:outline-none focus:border-pust-800"
                />
              </div>
              <textarea
                rows={3}
                required
                value={vcMsg}
                onChange={(e) => setVcMsg(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:outline-none focus:border-pust-800"
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
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-pust-900 text-white hover:bg-pust-950 cursor-pointer whitespace-nowrap shrink-0"
              >
                Update Vice-Chancellor Record
              </button>
            </form>
          </div>

          {/* Homepage Hero Banner Carousel Manager */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-serif text-lg font-medium text-slate-900">
                  Homepage Banner Carousel &amp; Photo Captions
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload banner photos to ImageKit.io or add a direct image link. Multiple slides auto-slide on the homepage with captions.
                </p>
              </div>
              <div className="inline-flex rounded-lg border border-slate-300 bg-[#F7F7F5] p-0.5 text-[11px] font-medium shrink-0">
                <button
                  type="button"
                  onClick={() => setBannerSourceMode('upload')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    bannerSourceMode === 'upload'
                      ? 'bg-pust-900 text-white'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-3 h-3" />
                  Upload (ImageKit.io)
                </button>
                <button
                  type="button"
                  onClick={() => setBannerSourceMode('link')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    bannerSourceMode === 'link'
                      ? 'bg-pust-900 text-white'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  <Link2 className="w-3 h-3" />
                  Direct Image Link
                </button>
              </div>
            </div>

            <form onSubmit={handleAddBannerSlide} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                    {bannerSourceMode === 'upload'
                      ? 'Upload Banner Image (ImageKit.io)'
                      : 'Direct Banner Image Link (HTTPS / Local Path)'}
                  </label>
                  {bannerSourceMode === 'upload' ? (
                    <div className="flex items-center gap-2">
                      <label className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium border border-dashed border-pust-800 bg-[#F7F7F5] text-pust-900 hover:bg-pust-900 hover:text-white transition-colors cursor-pointer whitespace-nowrap">
                        <Upload className="w-3.5 h-3.5" />
                        {uploadingBanner
                          ? 'Uploading to ImageKit...'
                          : bannerUrl
                          ? 'Replace Banner Image'
                          : 'Choose Banner Image (JPG / PNG / WebP)'}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          disabled={uploadingBanner}
                          onChange={handleBannerFileUpload}
                          className="sr-only"
                        />
                      </label>
                    </div>
                  ) : (
                    <input
                      type="text"
                      required
                      value={bannerUrl}
                      onChange={(e) => setBannerUrl(e.target.value)}
                      placeholder="https://example.edu/images/campus-banner.jpg"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:outline-none focus:border-pust-800"
                    />
                  )}
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                    Photo Caption (Displayed on Slider)
                  </label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    value={bannerCaption}
                    onChange={(e) => setBannerCaption(e.target.value)}
                    placeholder="e.g. Fig. 5 — Academic Building & Campus Quadrangle"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:outline-none focus:border-pust-800"
                  />
                </div>
              </div>

              {bannerUrl.trim() && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-[#F7F7F5] p-2.5">
                  {isSafeMediaUrl(bannerUrl) ? (
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <img
                        src={bannerUrl.trim()}
                        alt={bannerAlt || bannerCaption || 'Banner preview'}
                        referrerPolicy="no-referrer"
                        className="w-20 h-12 rounded-lg object-cover border border-slate-200 bg-slate-100 shrink-0"
                      />
                      <div className="min-w-0 font-mono text-[11px]">
                        <p className="text-emerald-800 font-semibold">Banner image ready</p>
                        <p className="text-slate-500 truncate">{bannerUrl.trim()}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] font-mono text-red-700">
                      Enter a valid image URL starting with https://, http://, or a local / path.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setBannerUrl('')}
                    className="text-[11px] font-mono text-red-700 hover:underline cursor-pointer shrink-0"
                  >
                    Clear Image
                  </button>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <input
                  type="text"
                  value={bannerAlt}
                  onChange={(e) => setBannerAlt(e.target.value)}
                  placeholder="Optional accessibility alt description"
                  className="w-full sm:w-auto sm:flex-1 sm:min-w-[220px] px-3 py-2 rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:outline-none focus:border-pust-800"
                />
                <button
                  type="submit"
                  disabled={savingBanner || uploadingBanner}
                  className="px-4 py-2 font-semibold rounded-lg bg-pust-900 text-white hover:bg-pust-950 disabled:opacity-60 cursor-pointer whitespace-nowrap shrink-0"
                >
                  {savingBanner ? 'Saving Slide...' : 'Add Banner Slide'}
                </button>
              </div>
            </form>

            <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 overflow-hidden text-xs">
              {bannerSlides.length === 0 ? (
                <p className="p-4 text-slate-600 bg-[#F7F7F5]">
                  No custom slides configured; homepage uses default institutional banner.
                </p>
              ) : (
                bannerSlides.map((slide, idx) => (
                  <div
                    key={slide.id}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center gap-3 bg-white"
                  >
                    <div className="w-24 h-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                      <img
                        src={slide.imageUrl}
                        alt={slide.alt || slide.caption}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500 tabular-nums">
                        Slide {String(idx + 1).padStart(2, '0')} · {slide.imageUrl.slice(0, 64)}
                        {slide.imageUrl.length > 64 ? '…' : ''}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={bannerCaptionsDraft[slide.id] ?? slide.caption}
                          onChange={(e) =>
                            setBannerCaptionsDraft((prev) => ({
                              ...prev,
                              [slide.id]: e.target.value,
                            }))
                          }
                          className="w-full sm:w-auto sm:flex-1 sm:min-w-[200px] px-2.5 py-1.5 rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:outline-none focus:border-pust-800"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveBannerCaption(slide)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 hover:border-pust-800 hover:text-pust-900 cursor-pointer whitespace-nowrap shrink-0"
                        >
                          Save Caption
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveBannerSlide(idx, -1)}
                        aria-label={`Move slide ${idx + 1} up`}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:border-pust-800 disabled:opacity-40 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === bannerSlides.length - 1}
                        onClick={() => handleMoveBannerSlide(idx, 1)}
                        aria-label={`Move slide ${idx + 1} down`}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:border-pust-800 disabled:opacity-40 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          setError(null);
                          setFeedback(null);
                          try {
                            await pustApi.deleteBannerSlide(slide.id);
                            setFeedback('Removed banner slide.');
                            await onCmsChange();
                          } catch (err) {
                            setError(err instanceof Error ? err.message : 'Unable to remove banner slide.');
                          }
                        }}
                        aria-label={`Delete slide ${idx + 1}`}
                        className="p-1.5 rounded-lg text-red-700 hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* News & Events / Gallery CMS (Photos via ImageKit.io, YouTube Videos, Public/Registered Privacy) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-serif text-lg font-medium text-slate-900">
                  News &amp; Events CMS (Photos, YouTube Videos &amp; Privacy)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload event photos to ImageKit.io, add a direct image link, or embed YouTube videos with Public/Registered privacy.
                </p>
              </div>
              {galType === 'photo' && (
                <div className="inline-flex rounded-lg border border-slate-300 bg-[#F7F7F5] p-0.5 text-[11px] font-medium shrink-0">
                  <button
                    type="button"
                    onClick={() => setGalPhotoSourceMode('upload')}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      galPhotoSourceMode === 'upload'
                        ? 'bg-pust-900 text-white'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <Upload className="w-3 h-3" />
                    Upload (ImageKit.io)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGalPhotoSourceMode('link')}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      galPhotoSourceMode === 'link'
                        ? 'bg-pust-900 text-white'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <Link2 className="w-3 h-3" />
                    Direct Image Link
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleAddGallery} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                <input
                  type="text"
                  required
                  value={galTitle}
                  onChange={(e) => setGalTitle(e.target.value)}
                  placeholder="News / Event Title"
                  className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:outline-none focus:border-pust-800"
                />
                <select
                  value={galCat}
                  onChange={(e) => setGalCat(e.target.value as GalleryItemRecord['category'])}
                  className="px-2.5 py-2 rounded-lg border border-slate-300 bg-[#F7F7F5] focus:outline-none focus:border-pust-800"
                >
                  <option value="Festival">Festival</option>
                  <option value="Academic Event">Academic Event</option>
                  <option value="Convocation">Convocation</option>
                  <option value="Campus Life">Campus Life</option>
                </select>
                <select
                  value={galType}
                  onChange={(e) => {
                    const nextType = e.target.value as GalleryItemRecord['mediaType'];
                    setGalType(nextType);
                    if (nextType === 'video' && galUrl.startsWith('/src/assets/')) {
                      setGalUrl('');
                    } else if (nextType === 'photo' && !galUrl.trim()) {
                      setGalUrl('https://i.ibb.co.com/chBZ45sr/pust-campus-hero-1795431408503.jpg');
                    }
                  }}
                  className="px-2.5 py-2 rounded-lg border border-slate-300 bg-[#F7F7F5] focus:outline-none focus:border-pust-800"
                >
                  <option value="photo">Photo</option>
                  <option value="video">YouTube Video</option>
                </select>
                <select
                  value={galVisibility}
                  onChange={(e) => setGalVisibility(e.target.value as 'public' | 'registered')}
                  aria-label="News and Events Privacy"
                  className="px-2.5 py-2 rounded-lg border border-slate-300 bg-[#F7F7F5] focus:outline-none focus:border-pust-800"
                >
                  <option value="public">Public (Everyone)</option>
                  <option value="registered">Registered Users Only</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                {galType === 'photo' && galPhotoSourceMode === 'upload' ? (
                  <label className="sm:col-span-5 inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium border border-dashed border-pust-800 bg-[#F7F7F5] text-pust-900 hover:bg-pust-900 hover:text-white transition-colors cursor-pointer whitespace-nowrap">
                    <Upload className="w-3.5 h-3.5" />
                    {uploadingGalleryPhoto ? 'Uploading Photo...' : 'Upload Photo to ImageKit.io'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      disabled={uploadingGalleryPhoto}
                      onChange={handleGalleryPhotoUpload}
                      className="sr-only"
                    />
                  </label>
                ) : (
                  <input
                    type="text"
                    required
                    value={galUrl}
                    onChange={(e) => setGalUrl(e.target.value)}
                    placeholder={
                      galType === 'video'
                        ? 'YouTube Link (https://www.youtube.com/watch?v=... or https://youtu.be/...)'
                        : 'https://example.edu/images/event-photo.jpg'
                    }
                    className="sm:col-span-5 px-3 py-2 rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:outline-none focus:border-pust-800"
                  />
                )}
                <input
                  type="text"
                  required
                  value={galDesc}
                  onChange={(e) => setGalDesc(e.target.value)}
                  placeholder="Event summary / description"
                  className="sm:col-span-5 px-3 py-2 rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:outline-none focus:border-pust-800"
                />
                <input
                  type="date"
                  value={galDate}
                  onChange={(e) => setGalDate(e.target.value)}
                  className="sm:col-span-2 px-2.5 py-2 rounded-lg border border-slate-300 bg-[#F7F7F5] focus:outline-none focus:border-pust-800"
                />
              </div>

              {galType === 'photo' && galUrl.trim() && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-[#F7F7F5] p-2.5">
                  {isSafeMediaUrl(galUrl) ? (
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <img
                        src={galUrl.trim()}
                        alt={galTitle || 'Event photo preview'}
                        referrerPolicy="no-referrer"
                        className="w-16 h-11 rounded-lg object-cover border border-slate-200 bg-slate-100 shrink-0"
                      />
                      <div className="min-w-0 font-mono text-[11px]">
                        <p className="text-emerald-800 font-semibold">Event photo ready</p>
                        <p className="text-slate-500 truncate">{galUrl.trim()}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] font-mono text-red-700">
                      Enter a valid image link starting with https://, http://, or a local / path.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setGalUrl('')}
                    className="text-[11px] font-mono text-red-700 hover:underline cursor-pointer shrink-0"
                  >
                    Clear
                  </button>
                </div>
              )}

              {galType === 'video' && galUrl.trim() && (
                <div className="text-[11px] font-mono">
                  {parseYouTubeVideoId(galUrl) ? (
                    <span className="text-emerald-800">
                      Valid YouTube video detected (ID: {parseYouTubeVideoId(galUrl)}) — thumbnail &amp; player ready.
                    </span>
                  ) : (
                    <span className="text-amber-800">
                      Paste a standard YouTube watch, youtu.be, or Shorts link for embedded playback.
                    </span>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={uploadingGalleryPhoto}
                className="px-4 py-2 font-semibold rounded-lg bg-pust-900 text-white hover:bg-pust-950 disabled:opacity-60 cursor-pointer whitespace-nowrap shrink-0"
              >
                Publish to News &amp; Events
              </button>
            </form>

            <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 overflow-hidden text-xs max-h-72 overflow-y-auto overscroll-contain">
              {galleryItems.map((item) => {
                const ytId = item.mediaType === 'video' ? parseYouTubeVideoId(item.mediaUrl) : null;
                const thumbUrl = ytId ? getYouTubeThumbnailUrl(ytId) : item.mediaUrl;
                const isRegisteredOnly = item.visibility === 'registered';
                return (
                  <div key={item.id} className="p-3 flex flex-wrap items-center justify-between gap-3 bg-white">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-16 h-11 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0 flex items-center justify-center">
                        <img
                          src={thumbUrl}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{item.title}</p>
                        <p className="font-mono text-slate-500 flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1">
                            {item.mediaType === 'video' ? (
                              <Video className="w-3 h-3 text-pust-800" />
                            ) : (
                              <ImageIcon className="w-3 h-3 text-pust-800" />
                            )}
                            {ytId ? 'YOUTUBE' : item.mediaType.toUpperCase()}
                          </span>
                          <span>· {item.category}</span>
                          <span>· {item.eventDate}</span>
                          <span
                            className={`font-semibold ${
                              isRegisteredOnly ? 'text-amber-800' : 'text-emerald-800'
                            }`}
                          >
                            · {isRegisteredOnly ? 'REGISTERED ONLY' : 'PUBLIC'}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={async () => {
                          setError(null);
                          setFeedback(null);
                          try {
                            const nextVis = isRegisteredOnly ? 'public' : 'registered';
                            await pustApi.updateGalleryItem(item.id, { visibility: nextVis });
                            setFeedback(
                              `Set "${item.title}" to ${
                                nextVis === 'registered' ? 'Registered Users Only' : 'Public'
                              }.`
                            );
                            await onCmsChange();
                          } catch (err) {
                            setError(err instanceof Error ? err.message : 'Unable to update gallery visibility.');
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-800 hover:border-pust-800 hover:text-pust-900 cursor-pointer whitespace-nowrap"
                      >
                        <Lock className="w-3 h-3" />
                        {isRegisteredOnly ? 'Make Public' : 'Set Reg. Only'}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          setError(null);
                          setFeedback(null);
                          try {
                            await pustApi.deleteGalleryItem(item.id);
                            setFeedback(`Removed "${item.title}".`);
                            await onCmsChange();
                          } catch (err) {
                            setError(err instanceof Error ? err.message : 'Unable to remove gallery item.');
                          }
                        }}
                        className="p-1.5 rounded-lg text-red-700 hover:bg-red-50 cursor-pointer"
                        aria-label={`Remove ${item.title}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. Payment Gateways & Fee Schedule */}
      {activeSubTab === 'finance' && user.role === 'admin' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div>
            <h3 className="font-serif text-lg font-medium text-slate-900">
              Digital Payment Gateways &amp; University Fee Schedule
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enable/disable checkout channels displayed in the unified Student Payment modal and configure fees.
            </p>
          </div>
          <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 overflow-hidden text-xs">
            {gateways.map((g) => (
              <div key={g.id} className="p-3.5 flex items-center justify-between gap-3 bg-white">
                <div>
                  <p className="font-medium text-slate-900">
                    {g.name} <span className="font-mono text-slate-500">({g.code})</span>
                  </p>
                  <p className="text-slate-500 mt-0.5">{g.instructions}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleGateway(g)}
                  className={`px-3.5 py-1.5 font-medium rounded-lg cursor-pointer whitespace-nowrap shrink-0 ${
                    g.enabled
                      ? 'bg-pust-900 text-white hover:bg-pust-950'
                      : 'bg-[#F7F7F5] border border-slate-300 text-slate-700 hover:border-slate-400'
                  }`}
                >
                  {g.enabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleSaveFees} className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs items-end">
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
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-[#F7F7F5] tabular-nums focus:bg-white focus:outline-none focus:border-pust-800"
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
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-[#F7F7F5] tabular-nums focus:bg-white focus:outline-none focus:border-pust-800"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 font-semibold rounded-lg bg-pust-900 text-white hover:bg-pust-950 cursor-pointer whitespace-nowrap shrink-0"
            >
              Save Fee Configuration
            </button>
          </form>
        </div>
      )}

      {/* 5. Admission Inquiries & System Audit Logs */}
      {activeSubTab === 'inquiries' &&
        (user.role === 'admin' || user.role === 'registrar' || user.role === 'vc') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {(user.role === 'admin' || user.role === 'registrar') && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <h3 className="font-serif text-lg font-medium text-slate-900 tabular-nums">
                    Admission Inquiries ({inquiries.length})
                  </h3>
                  <div className="flex items-center gap-1">
                    {(
                      [
                        { id: 'all', label: 'All' },
                        { id: 'Received', label: `Pending (${receivedInquiriesCount})` },
                        { id: 'Reviewed', label: 'Reviewed' },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setInquiryFilter(tab.id)}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border cursor-pointer whitespace-nowrap shrink-0 ${
                          inquiryFilter === tab.id
                            ? 'border-pust-900 bg-pust-900 text-white'
                            : 'border-slate-300 bg-[#F7F7F5] text-slate-700 hover:border-pust-700'
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
                  <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 overflow-hidden text-xs max-h-96 overflow-y-auto overscroll-contain">
                    {filteredInquiries.map((inq) => (
                      <div key={inq.id} className="p-3.5 space-y-2 bg-white">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium text-slate-900">
                            {inq.fullName} · {inq.departmentCode} ({inq.programLevel})
                          </p>
                          <span className="font-mono text-[11px] bg-slate-100 border border-slate-200 rounded-md px-2 py-0.5 text-slate-700">
                            {inq.referenceCode}
                          </span>
                        </div>
                        <p className="text-slate-600 leading-relaxed">{inq.message}</p>
                        <p className="font-mono text-slate-500">
                          {inq.email} · {inq.phone} ·{' '}
                          <span
                            className={
                              inq.status === 'Received'
                                ? 'text-amber-800 font-semibold'
                                : 'text-pust-800 font-semibold'
                            }
                          >
                            {inq.status}
                          </span>
                        </p>

                        {inq.status === 'Reviewed' && inq.responseNote && (
                          <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-emerald-950">
                            <p className="font-semibold text-[11px]">
                              Registrar Response ({inq.respondedBy || 'Office'} ·{' '}
                              {inq.respondedAt || inq.createdAt.slice(0, 10)})
                            </p>
                            <p className="mt-0.5">{inq.responseNote}</p>
                          </div>
                        )}

                        {inq.status === 'Received' && (
                          <div className="flex flex-col sm:flex-row gap-2 pt-1">
                            <input
                              type="text"
                              value={inquiryNotes[inq.id] ?? ''}
                              onChange={(e) =>
                                setInquiryNotes((prev) => ({
                                  ...prev,
                                  [inq.id]: e.target.value,
                                }))
                              }
                              placeholder="Official response / applicant guidance..."
                              className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-[#F7F7F5] focus:bg-white focus:outline-none focus:border-pust-800"
                            />
                            <button
                              type="button"
                              onClick={() => handleReviewInquiry(inq)}
                              className="px-3 py-1.5 rounded-lg bg-pust-900 text-white hover:bg-pust-950 cursor-pointer whitespace-nowrap shrink-0 font-medium"
                            >
                              Mark Reviewed &amp; Save Response
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div
              className={`bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3 ${
                user.role === 'vc' ? 'lg:col-span-2' : ''
              }`}
            >
              <div className="border-b border-slate-200 pb-3">
                <h3 className="font-serif text-lg font-medium text-slate-900 tabular-nums">
                  University Audit Trail ({auditLogs.length})
                </h3>
              </div>
              <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 overflow-hidden text-xs max-h-96 overflow-y-auto overscroll-contain">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3 font-mono bg-white">
                    <span className="text-pust-800 font-semibold">{log.action}</span> —{' '}
                    {log.target}
                    <span className="block text-slate-500 tabular-nums mt-0.5">
                      {log.actorName} ({log.actorRole}) ·{' '}
                      {log.timestamp.slice(0, 16).replace('T', ' ')}
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
