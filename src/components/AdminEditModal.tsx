'use client';

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { ArrowDown, ArrowUp, Plus, Save, Trash2, Upload, X } from 'lucide-react';
import { pustApi } from '../lib/api';
import { detectAttachmentType } from '../lib/media';
import type {
  AboutContentRecord,
  AdministrativeUnit,
  BannerSlideRecord,
  DepartmentRecord,
  EditModalTarget,
  FacultyName,
  GalleryItemRecord,
  JournalRecord,
  LeadershipOfficer,
  NoticeBoardScope,
  NoticeCategory,
  NoticeVisibility,
  UniversityProfile,
  ViceChancellorRecord,
} from '../types/pust';

interface AdminEditModalProps {
  target: EditModalTarget | null;
  onClose: () => void;
  profile: UniversityProfile | null;
  aboutSections: AboutContentRecord[];
  vcProfiles: ViceChancellorRecord[];
  bannerSlides: BannerSlideRecord[];
  departments: DepartmentRecord[];
  onRefreshProfile: () => Promise<void>;
  onRefreshNotices: () => Promise<void>;
  onRefreshDepartments: () => Promise<void>;
  onRefreshPublications: () => Promise<void>;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Unable to read selected file.'));
    reader.readAsDataURL(file);
  });
}

const NOTICE_CATEGORIES: NoticeCategory[] = [
  'General',
  'Admission',
  'Academic',
  'Examination',
  'Result',
  'Course',
  'Job & Tender',
  'NOC & Orders',
  'Press Release',
];

const FACULTIES: FacultyName[] = [
  'Faculty of Engineering and Technology',
  'Faculty of Science',
  'Faculty of Business Studies',
  'Faculty of Humanities and Social Science',
  'Faculty of Life and Earth Science',
];

const GALLERY_CATEGORIES: GalleryItemRecord['category'][] = [
  'Convocation',
  'Academic Event',
  'Festival',
  'Campus Life',
];

const UNIT_CATEGORIES: AdministrativeUnit['category'][] = [
  'Statutory Governance',
  'Administrative Office',
  'Specialized Cell & Institute',
];

const INPUT_CLASS =
  'w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-[#F7F7F5] text-slate-900 focus:outline-none focus:border-pust-800 focus:bg-white';
const LABEL_CLASS = 'block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5';

export function AdminEditModal({
  target,
  onClose,
  profile,
  aboutSections,
  vcProfiles,
  bannerSlides,
  departments,
  onRefreshProfile,
  onRefreshNotices,
  onRefreshDepartments,
  onRefreshPublications,
}: AdminEditModalProps) {
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // 1. Hero & Profile stats state
  const [heroEyebrow, setHeroEyebrow] = useState('');
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [convocationDate, setConvocationDate] = useState('');
  const [establishedYear, setEstablishedYear] = useState(2008);
  const [campusAcres, setCampusAcres] = useState(30);
  const [facultiesCount, setFacultiesCount] = useState(5);
  const [departmentsCount, setDepartmentsCount] = useState(21);
  const [facultyMembersCount, setFacultyMembersCount] = useState(185);
  const [studentsCount, setStudentsCount] = useState(4800);

  // 2. Banner slide state
  const [bannerMode, setBannerMode] = useState<'edit' | 'create'>('edit');
  const [selectedSlideId, setSelectedSlideId] = useState<string>('');
  const [slideImageUrl, setSlideImageUrl] = useState('');
  const [slideCaption, setSlideCaption] = useState('');
  const [slideAlt, setSlideAlt] = useState('');

  // 3. VC state
  const [vcName, setVcName] = useState('');
  const [vcTenure, setVcTenure] = useState('');
  const [vcEmail, setVcEmail] = useState('');
  const [vcPhone, setVcPhone] = useState('');
  const [vcPhotoUrl, setVcPhotoUrl] = useState('');
  const [vcMessage, setVcMessage] = useState('');
  const [vcPromoteNew, setVcPromoteNew] = useState(false);

  // 4. About state
  const [aboutSlug, setAboutSlug] = useState<AboutContentRecord['slug']>('our-university');
  const [aboutTitle, setAboutTitle] = useState('');
  const [aboutBody, setAboutBody] = useState('');

  // 5. Notice state
  const [noticeRef, setNoticeRef] = useState('');
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeCategory, setNoticeCategory] = useState<NoticeCategory>('General');
  const [noticeDeptCode, setNoticeDeptCode] = useState('REG');
  const [noticeScope, setNoticeScope] = useState<NoticeBoardScope>('central');
  const [noticeVisibility, setNoticeVisibility] = useState<NoticeVisibility>('public');
  const [noticeSession, setNoticeSession] = useState('');
  const [noticeCourseCode, setNoticeCourseCode] = useState('');
  const [noticeSummary, setNoticeSummary] = useState('');
  const [noticeBody, setNoticeBody] = useState('');
  const [noticePinned, setNoticePinned] = useState(false);
  const [noticeAttachName, setNoticeAttachName] = useState('');
  const [noticeAttachUrl, setNoticeAttachUrl] = useState('');
  const [noticeAttachType, setNoticeAttachType] = useState<'image' | 'pdf' | 'other'>('pdf');

  // 6. Gallery state
  const [galTitle, setGalTitle] = useState('');
  const [galDescription, setGalDescription] = useState('');
  const [galCategory, setGalCategory] = useState<GalleryItemRecord['category']>('Academic Event');
  const [galMediaType, setGalMediaType] = useState<GalleryItemRecord['mediaType']>('photo');
  const [galMediaUrl, setGalMediaUrl] = useState('');
  const [galEventDate, setGalEventDate] = useState('');
  const [galVisibility, setGalVisibility] = useState<'public' | 'registered'>('public');

  // 7. Publication state
  const [pubTitle, setPubTitle] = useState('');
  const [pubAuthors, setPubAuthors] = useState('');
  const [pubDeptCode, setPubDeptCode] = useState('CSE');
  const [pubDomain, setPubDomain] = useState('');
  const [pubYear, setPubYear] = useState(2026);
  const [pubVenue, setPubVenue] = useState('');

  // 8. Journals state
  const [journalsList, setJournalsList] = useState<JournalRecord[]>([]);

  // 9. Department state
  const [deptName, setDeptName] = useState('');
  const [deptFaculty, setDeptFaculty] = useState<FacultyName>('Faculty of Engineering and Technology');
  const [deptEstablished, setDeptEstablished] = useState(2008);
  const [deptChairman, setDeptChairman] = useState('');
  const [deptIntake, setDeptIntake] = useState(40);
  const [deptBuilding, setDeptBuilding] = useState('');
  const [deptDegreesText, setDeptDegreesText] = useState('');
  const [deptSummary, setDeptSummary] = useState('');
  const [deptResearchText, setDeptResearchText] = useState('');
  const [deptLabsText, setDeptLabsText] = useState('');

  // 10. Leadership state
  const [leadershipList, setLeadershipList] = useState<LeadershipOfficer[]>([]);
  const [selectedOfficerIdx, setSelectedOfficerIdx] = useState<number>(0);

  // 11. Unit state
  const [unitsList, setUnitsList] = useState<AdministrativeUnit[]>([]);
  const [selectedUnitIdx, setSelectedUnitIdx] = useState<number>(0);

  useEffect(() => {
    if (!target) return;
    setError(null);
    setConfirmDelete(false);
    setSaving(false);
    setUploading(false);

    if (target.kind === 'hero-profile') {
      setHeroEyebrow(
        profile?.heroEyebrow ||
          `Rajapur, Pabna-6600 · First Convocation: ${profile?.convocationDate ?? '15 March 2027'}`
      );
      setHeroTitle(
        profile?.heroTitle || 'Advancing Science, Engineering & Human Inquiry from Pabna'
      );
      setHeroSubtitle(
        profile?.heroSubtitle ||
          `Established in ${profile?.establishedYear ?? 2008} beside the Dhaka–Pabna highway in Rajapur (Gayeshpur, Pabna), Pabna University of Science and Technology serves nearly 5,000 scholars and ${profile?.facultyMembersCount ?? 185} faculty members across ${profile?.facultiesCount ?? 5} faculties, ${profile?.departmentsCount ?? 21} academic departments, and end-to-end digital workflows.`
      );
      setConvocationDate(profile?.convocationDate || '15 March 2027');
      setEstablishedYear(profile?.establishedYear ?? 2008);
      setCampusAcres(profile?.campusAcres ?? 30);
      setFacultiesCount(profile?.facultiesCount ?? 5);
      setDepartmentsCount(profile?.departmentsCount ?? 21);
      setFacultyMembersCount(profile?.facultyMembersCount ?? 185);
      setStudentsCount(profile?.studentsCount ?? 4800);
    } else if (target.kind === 'banner') {
      const slide =
        bannerSlides.find((s) => s.id === target.slideId) || bannerSlides[0] || null;
      if (slide) {
        setBannerMode('edit');
        setSelectedSlideId(slide.id);
        setSlideImageUrl(slide.imageUrl);
        setSlideCaption(slide.caption);
        setSlideAlt(slide.alt || '');
      } else {
        setBannerMode('create');
        setSelectedSlideId('');
        setSlideImageUrl('');
        setSlideCaption('');
        setSlideAlt('');
      }
    } else if (target.kind === 'vc') {
      const currentVc = vcProfiles.find((v) => v.isCurrent) || vcProfiles[0];
      setVcName(currentVc?.name || '');
      setVcTenure(currentVc?.tenure || '');
      setVcEmail(currentVc?.email || '');
      setVcPhone(currentVc?.phone || '');
      setVcPhotoUrl(currentVc?.photoUrl || '');
      setVcMessage(currentVc?.message || '');
      setVcPromoteNew(false);
    } else if (target.kind === 'about') {
      const sec = aboutSections.find((s) => s.slug === target.slug) || aboutSections[0];
      setAboutSlug(target.slug);
      setAboutTitle(sec?.title || '');
      setAboutBody(sec?.body || '');
    } else if (target.kind === 'notice') {
      const n = target.notice;
      if (n) {
        setNoticeRef(n.referenceNo);
        setNoticeTitle(n.title);
        setNoticeCategory(n.category);
        setNoticeDeptCode(n.departmentCode);
        setNoticeScope(n.boardScope);
        setNoticeVisibility(n.visibility);
        setNoticeSession(n.targetSession || '');
        setNoticeCourseCode(n.targetCourseCode || '');
        setNoticeSummary(n.summary);
        setNoticeBody(n.body);
        setNoticePinned(Boolean(n.pinned));
        setNoticeAttachName(n.attachmentName || '');
        setNoticeAttachUrl(n.attachmentUrl || '');
        setNoticeAttachType(n.attachmentType || 'pdf');
      } else {
        setNoticeRef(`PUST/REG/${new Date().getFullYear()}/`);
        setNoticeTitle('');
        setNoticeCategory('General');
        setNoticeDeptCode('REG');
        setNoticeScope('central');
        setNoticeVisibility('public');
        setNoticeSession('');
        setNoticeCourseCode('');
        setNoticeSummary('');
        setNoticeBody('');
        setNoticePinned(false);
        setNoticeAttachName('');
        setNoticeAttachUrl('');
        setNoticeAttachType('pdf');
      }
    } else if (target.kind === 'gallery') {
      const g = target.item;
      if (g) {
        setGalTitle(g.title);
        setGalDescription(g.description);
        setGalCategory(g.category);
        setGalMediaType(g.mediaType);
        setGalMediaUrl(g.mediaUrl);
        setGalEventDate(g.eventDate);
        setGalVisibility(g.visibility || 'public');
      } else {
        setGalTitle('');
        setGalDescription('');
        setGalCategory('Academic Event');
        setGalMediaType('photo');
        setGalMediaUrl('');
        setGalEventDate(new Date().toISOString().slice(0, 10));
        setGalVisibility('public');
      }
    } else if (target.kind === 'publication') {
      const p = target.publication;
      if (p) {
        setPubTitle(p.title);
        setPubAuthors(p.authors);
        setPubDeptCode(p.departmentCode);
        setPubDomain(p.domain);
        setPubYear(p.year);
        setPubVenue(p.venue);
      } else {
        setPubTitle('');
        setPubAuthors('');
        setPubDeptCode(departments[0]?.code || 'CSE');
        setPubDomain('');
        setPubYear(new Date().getFullYear());
        setPubVenue('');
      }
    } else if (target.kind === 'journals') {
      setJournalsList(structuredClone(profile?.journals || []));
    } else if (target.kind === 'department') {
      const d = target.department;
      setDeptName(d.name);
      setDeptFaculty(d.faculty);
      setDeptEstablished(d.established);
      setDeptChairman(d.chairmanName);
      setDeptIntake(d.intakeSeats);
      setDeptBuilding(d.building);
      setDeptDegreesText(d.degrees.join(', '));
      setDeptSummary(d.summary);
      setDeptResearchText(d.researchFocus.join('\n'));
      setDeptLabsText(d.laboratories.join('\n'));
    } else if (target.kind === 'leadership') {
      const list = structuredClone(profile?.leadership || []);
      setLeadershipList(list);
      const idx =
        typeof target.officerIndex === 'number' &&
        target.officerIndex >= 0 &&
        target.officerIndex < list.length
          ? target.officerIndex
          : 0;
      setSelectedOfficerIdx(idx);
    } else if (target.kind === 'unit') {
      const list = structuredClone(profile?.units || []);
      setUnitsList(list);
      const idx = target.unitCode
        ? Math.max(0, list.findIndex((u) => u.code === target.unitCode))
        : 0;
      setSelectedUnitIdx(idx);
    }
  }, [target, profile, aboutSections, vcProfiles, bannerSlides, departments]);

  useEffect(() => {
    if (!target) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [target, onClose]);

  if (!target) return null;

  async function handleImageUpload(
    e: ChangeEvent<HTMLInputElement>,
    purpose: 'banner' | 'notice' | 'gallery',
    onSuccess: (url: string, fileName: string, kind: 'image' | 'pdf') => void
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const dataBase64 = await readFileAsDataUrl(file);
      const res = await pustApi.uploadMediaToImageKit({
        purpose,
        fileName: file.name,
        mimeType: file.type || (purpose === 'notice' ? 'application/pdf' : 'image/jpeg'),
        dataBase64,
      });
      onSuccess(res.url, res.name, res.attachmentType);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload file.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  function switchBannerSlide(id: string) {
    const found = bannerSlides.find((s) => s.id === id);
    if (!found) return;
    setBannerMode('edit');
    setSelectedSlideId(found.id);
    setSlideImageUrl(found.imageUrl);
    setSlideCaption(found.caption);
    setSlideAlt(found.alt || '');
  }

  function switchAboutSlug(slug: AboutContentRecord['slug']) {
    const sec = aboutSections.find((s) => s.slug === slug);
    setAboutSlug(slug);
    setAboutTitle(sec?.title || '');
    setAboutBody(sec?.body || '');
  }

  async function handleMoveBanner(direction: -1 | 1) {
    const idx = bannerSlides.findIndex((s) => s.id === selectedSlideId);
    if (idx === -1) return;
    const nextIdx = idx + direction;
    if (nextIdx < 0 || nextIdx >= bannerSlides.length) return;
    const copy = [...bannerSlides];
    const [moved] = copy.splice(idx, 1);
    copy.splice(nextIdx, 0, moved);
    setSaving(true);
    setError(null);
    try {
      await pustApi.reorderBannerSlides(copy.map((s) => s.id));
      await onRefreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reorder banner slides.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteEntity() {
    if (!target) return;
    setSaving(true);
    setError(null);
    try {
      if (target.kind === 'banner' && selectedSlideId) {
        await pustApi.deleteBannerSlide(selectedSlideId);
        await onRefreshProfile();
      } else if (target.kind === 'notice' && target.notice) {
        await pustApi.deleteNotice(target.notice.id);
        await onRefreshNotices();
      } else if (target.kind === 'gallery' && target.item) {
        await pustApi.deleteGalleryItem(target.item.id);
        await onRefreshProfile();
      } else if (target.kind === 'publication' && target.publication) {
        await pustApi.deletePublication(target.publication.id);
        await onRefreshPublications();
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!target) return;
    setSaving(true);
    setError(null);

    try {
      if (target.kind === 'hero-profile') {
        await pustApi.updateUniversityProfile({
          heroEyebrow: heroEyebrow.trim(),
          heroTitle: heroTitle.trim(),
          heroSubtitle: heroSubtitle.trim(),
          convocationDate: convocationDate.trim(),
          establishedYear: Number(establishedYear),
          campusAcres: Number(campusAcres),
          facultiesCount: Number(facultiesCount),
          departmentsCount: Number(departmentsCount),
          facultyMembersCount: Number(facultyMembersCount),
          studentsCount: Number(studentsCount),
        });
        await onRefreshProfile();
      } else if (target.kind === 'banner') {
        if (bannerMode === 'create' || !selectedSlideId) {
          await pustApi.createBannerSlide({
            imageUrl: slideImageUrl.trim(),
            caption: slideCaption.trim(),
            alt: slideAlt.trim() || undefined,
          });
        } else {
          await pustApi.updateBannerSlide(selectedSlideId, {
            imageUrl: slideImageUrl.trim(),
            caption: slideCaption.trim(),
            alt: slideAlt.trim() || undefined,
          });
        }
        await onRefreshProfile();
      } else if (target.kind === 'vc') {
        await pustApi.updateViceChancellor({
          name: vcName.trim(),
          tenure: vcTenure.trim(),
          email: vcEmail.trim(),
          phone: vcPhone.trim(),
          photoUrl: vcPhotoUrl.trim(),
          message: vcMessage.trim(),
          promoteNewVc: vcPromoteNew,
        });
        await onRefreshProfile();
      } else if (target.kind === 'about') {
        await pustApi.upsertAboutSection({
          slug: aboutSlug,
          title: aboutTitle.trim(),
          body: aboutBody.trim(),
        });
        await onRefreshProfile();
      } else if (target.kind === 'notice') {
        const attachmentPayload = noticeAttachUrl.trim()
          ? {
              attachmentName: noticeAttachName.trim() || 'Official Attachment',
              attachmentUrl: noticeAttachUrl.trim(),
              attachmentType: detectAttachmentType(noticeAttachUrl.trim(), noticeAttachType),
            }
          : {
              attachmentName: noticeAttachName.trim() || undefined,
              attachmentUrl: undefined,
              attachmentType: undefined,
            };

        if (target.notice) {
          await pustApi.updateNotice(target.notice.id, {
            referenceNo: noticeRef.trim(),
            title: noticeTitle.trim(),
            category: noticeCategory,
            departmentCode: noticeDeptCode.trim(),
            boardScope: noticeScope,
            visibility: noticeVisibility,
            targetSession: noticeSession.trim() || undefined,
            targetCourseCode: noticeCourseCode.trim() || undefined,
            summary: noticeSummary.trim(),
            body: noticeBody.trim(),
            pinned: noticePinned,
            ...attachmentPayload,
          });
        } else {
          await pustApi.createNotice({
            referenceNo: noticeRef.trim(),
            title: noticeTitle.trim(),
            category: noticeCategory,
            departmentCode: noticeDeptCode.trim(),
            boardScope: noticeScope,
            visibility: noticeVisibility,
            targetSession: noticeSession.trim() || undefined,
            targetCourseCode: noticeCourseCode.trim() || undefined,
            summary: noticeSummary.trim(),
            body: noticeBody.trim(),
            pinned: noticePinned,
            ...attachmentPayload,
          });
        }
        await onRefreshNotices();
      } else if (target.kind === 'gallery') {
        if (target.item) {
          await pustApi.updateGalleryItem(target.item.id, {
            title: galTitle.trim(),
            description: galDescription.trim(),
            category: galCategory,
            mediaType: galMediaType,
            mediaUrl: galMediaUrl.trim(),
            eventDate: galEventDate.trim(),
            visibility: galVisibility,
          });
        } else {
          await pustApi.createGalleryItem({
            title: galTitle.trim(),
            description: galDescription.trim(),
            category: galCategory,
            mediaType: galMediaType,
            mediaUrl: galMediaUrl.trim(),
            eventDate: galEventDate.trim(),
            visibility: galVisibility,
          });
        }
        await onRefreshProfile();
      } else if (target.kind === 'publication') {
        const payload = {
          title: pubTitle.trim(),
          authors: pubAuthors.trim(),
          departmentCode: pubDeptCode.trim(),
          domain: pubDomain.trim(),
          year: Number(pubYear),
          venue: pubVenue.trim(),
        };
        if (target.publication) {
          await pustApi.updatePublication(target.publication.id, payload);
        } else {
          await pustApi.createPublication(payload);
        }
        await onRefreshPublications();
      } else if (target.kind === 'journals') {
        await pustApi.updateUniversityProfile({
          journals: journalsList.map((j) => ({
            id: j.id,
            title: j.title.trim(),
            issn: j.issn.trim(),
            scope: j.scope.trim(),
            currentIssue: j.currentIssue.trim(),
          })),
        });
        await onRefreshProfile();
      } else if (target.kind === 'department') {
        const degrees = deptDegreesText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        const researchFocus = deptResearchText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean);
        const laboratories = deptLabsText
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean);

        await pustApi.updateDepartment(target.department.id, {
          name: deptName.trim(),
          faculty: deptFaculty,
          established: Number(deptEstablished),
          chairmanName: deptChairman.trim(),
          intakeSeats: Number(deptIntake),
          building: deptBuilding.trim(),
          degrees: degrees.length > 0 ? degrees : target.department.degrees,
          summary: deptSummary.trim(),
          researchFocus: researchFocus.length > 0 ? researchFocus : target.department.researchFocus,
          laboratories: laboratories.length > 0 ? laboratories : target.department.laboratories,
        });
        await onRefreshDepartments();
      } else if (target.kind === 'leadership') {
        await pustApi.updateUniversityProfile({
          leadership: leadershipList.map((o) => ({
            role: o.role.trim(),
            name: o.name.trim(),
            email: o.email.trim(),
            phone: o.phone.trim(),
            office: o.office.trim(),
          })),
        });
        await onRefreshProfile();
      } else if (target.kind === 'unit') {
        await pustApi.updateUniversityProfile({
          units: unitsList.map((u) => ({
            code: u.code.trim(),
            name: u.name.trim(),
            category: u.category,
            description: u.description.trim(),
          })),
        });
        await onRefreshProfile();
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save changes.');
    } finally {
      setSaving(false);
    }
  }

  const canDelete =
    (target.kind === 'banner' && bannerMode === 'edit' && bannerSlides.length > 1) ||
    (target.kind === 'notice' && Boolean(target.notice)) ||
    (target.kind === 'gallery' && Boolean(target.item)) ||
    (target.kind === 'publication' && Boolean(target.publication));

  const modalTitle =
    target.kind === 'hero-profile'
      ? 'Edit Homepage Hero & University Profile Stats'
      : target.kind === 'banner'
      ? bannerMode === 'create'
        ? 'Add Homepage Banner Slide'
        : 'Edit Homepage Banner Carousel'
      : target.kind === 'vc'
      ? 'Edit Honorable Vice-Chancellor Profile & Address'
      : target.kind === 'about'
      ? 'Edit About PUST Content'
      : target.kind === 'notice'
      ? target.notice
        ? `Edit Circular · ${target.notice.referenceNo}`
        : 'Publish New Official Circular'
      : target.kind === 'gallery'
      ? target.item
        ? 'Edit News, Event or Gallery Entry'
        : 'Add News, Event or Gallery Entry'
      : target.kind === 'publication'
      ? target.publication
        ? 'Edit Faculty Publication'
        : 'Add Faculty Publication'
      : target.kind === 'journals'
      ? 'Manage Official PUST Journals'
      : target.kind === 'department'
      ? `Edit Department · ${target.department.code}`
      : target.kind === 'leadership'
      ? 'Edit Executive Administration Directory'
      : 'Edit Statutory & Administrative Units';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-[2px] p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-edit-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl bg-white border border-slate-200 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-200 bg-[#FAF8F4]">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-amber-800 font-semibold">
              Admin Edit Mode · Live CMS Editor
            </p>
            <h2
              id="admin-edit-modal-title"
              className="font-serif text-xl sm:text-2xl font-medium text-slate-900 mt-0.5"
            >
              {modalTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close editor"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-lg border border-red-200 bg-red-50 text-sm text-red-900">
              {error}
            </div>
          )}

          {/* 1. HERO & PROFILE STATS */}
          {target.kind === 'hero-profile' && (
            <div className="space-y-4">
              <div>
                <label className={LABEL_CLASS}>Hero Eyebrow / Location Line</label>
                <input
                  type="text"
                  value={heroEyebrow}
                  onChange={(e) => setHeroEyebrow(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Main Hero Headline</label>
                <input
                  type="text"
                  required
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Hero Lead Paragraph</label>
                <textarea
                  rows={3}
                  required
                  value={heroSubtitle}
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className={LABEL_CLASS}>Established</label>
                  <input
                    type="number"
                    required
                    value={establishedYear}
                    onChange={(e) => setEstablishedYear(Number(e.target.value))}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Faculties</label>
                  <input
                    type="number"
                    required
                    value={facultiesCount}
                    onChange={(e) => setFacultiesCount(Number(e.target.value))}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Departments</label>
                  <input
                    type="number"
                    required
                    value={departmentsCount}
                    onChange={(e) => setDepartmentsCount(Number(e.target.value))}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Campus Acres</label>
                  <input
                    type="number"
                    required
                    value={campusAcres}
                    onChange={(e) => setCampusAcres(Number(e.target.value))}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Faculty Members</label>
                  <input
                    type="number"
                    required
                    value={facultyMembersCount}
                    onChange={(e) => setFacultyMembersCount(Number(e.target.value))}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Students Count</label>
                  <input
                    type="number"
                    required
                    value={studentsCount}
                    onChange={(e) => setStudentsCount(Number(e.target.value))}
                    className={INPUT_CLASS}
                  />
                </div>
                <div className="col-span-2">
                  <label className={LABEL_CLASS}>First Convocation Date</label>
                  <input
                    type="text"
                    required
                    value={convocationDate}
                    onChange={(e) => setConvocationDate(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. BANNER CAROUSEL */}
          {target.kind === 'banner' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                <div className="flex flex-wrap gap-1.5">
                  {bannerSlides.map((s, idx) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => switchBannerSlide(s.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono cursor-pointer border ${
                        bannerMode === 'edit' && selectedSlideId === s.id
                          ? 'bg-pust-900 text-white border-pust-900'
                          : 'bg-[#F7F7F5] text-slate-700 border-slate-200 hover:border-pust-700'
                      }`}
                    >
                      Slide {idx + 1}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setBannerMode('create');
                      setSlideImageUrl('');
                      setSlideCaption('');
                      setSlideAlt('');
                    }}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border ${
                      bannerMode === 'create'
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Slide
                  </button>
                </div>

                {bannerMode === 'edit' && bannerSlides.length > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleMoveBanner(-1)}
                      title="Move slide earlier"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border border-slate-300 bg-white hover:bg-slate-50 cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                      Earlier
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleMoveBanner(1)}
                      title="Move slide later"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border border-slate-300 bg-white hover:bg-slate-50 cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                      Later
                    </button>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Banner Image URL
                  </label>
                  <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    {uploading ? 'Uploading...' : 'Upload Image'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) =>
                        handleImageUpload(e, 'banner', (url) => setSlideImageUrl(url))
                      }
                    />
                  </label>
                </div>
                <input
                  type="text"
                  required
                  value={slideImageUrl}
                  onChange={(e) => setSlideImageUrl(e.target.value)}
                  placeholder="/src/assets/images/... or https://..."
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className={LABEL_CLASS}>Slide Caption</label>
                <input
                  type="text"
                  required
                  value={slideCaption}
                  onChange={(e) => setSlideCaption(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className={LABEL_CLASS}>Accessible Alt Description</label>
                <input
                  type="text"
                  value={slideAlt}
                  onChange={(e) => setSlideAlt(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          )}

          {/* 3. VICE-CHANCELLOR */}
          {target.kind === 'vc' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLASS}>Vice-Chancellor Name</label>
                  <input
                    type="text"
                    required
                    value={vcName}
                    onChange={(e) => setVcName(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Tenure</label>
                  <input
                    type="text"
                    required
                    value={vcTenure}
                    onChange={(e) => setVcTenure(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Official Email</label>
                  <input
                    type="email"
                    required
                    value={vcEmail}
                    onChange={(e) => setVcEmail(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Direct Telephone</label>
                  <input
                    type="text"
                    required
                    value={vcPhone}
                    onChange={(e) => setVcPhone(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Portrait Photo URL (Optional)
                  </label>
                  <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    {uploading ? 'Uploading...' : 'Upload Portrait'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) =>
                        handleImageUpload(e, 'gallery', (url) => setVcPhotoUrl(url))
                      }
                    />
                  </label>
                </div>
                <input
                  type="text"
                  value={vcPhotoUrl}
                  onChange={(e) => setVcPhotoUrl(e.target.value)}
                  placeholder="Leave blank to use default official portrait"
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className={LABEL_CLASS}>Welcome Address / Message</label>
                <textarea
                  rows={8}
                  required
                  value={vcMessage}
                  onChange={(e) => setVcMessage(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>

              <label className="flex items-center gap-2.5 text-xs text-slate-700 bg-amber-50 border border-amber-200 rounded-lg p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={vcPromoteNew}
                  onChange={(e) => setVcPromoteNew(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <span>
                  Appoint as a <strong>new Vice-Chancellor</strong> and archive the current VC into
                  the Former Vice-Chancellors list.
                </span>
              </label>
            </div>
          )}

          {/* 4. ABOUT PUST */}
          {target.kind === 'about' && (
            <div className="space-y-4">
              <div>
                <label className={LABEL_CLASS}>About Section</label>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { slug: 'our-university', label: 'Our University' },
                      { slug: 'mission-vision', label: 'Mission & Vision' },
                      { slug: 'history', label: 'History' },
                      { slug: 'plans', label: 'Future Plans' },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.slug}
                      type="button"
                      onClick={() => switchAboutSlug(item.slug)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer border ${
                        aboutSlug === item.slug
                          ? 'bg-pust-900 text-white border-pust-900'
                          : 'bg-[#F7F7F5] text-slate-700 border-slate-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={LABEL_CLASS}>Section Heading</label>
                <input
                  type="text"
                  required
                  value={aboutTitle}
                  onChange={(e) => setAboutTitle(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Section Narrative Body</label>
                <textarea
                  rows={9}
                  required
                  value={aboutBody}
                  onChange={(e) => setAboutBody(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          )}

          {/* 5. NOTICE CIRCULAR */}
          {target.kind === 'notice' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={LABEL_CLASS}>Memo Reference No.</label>
                  <input
                    type="text"
                    required
                    value={noticeRef}
                    onChange={(e) => setNoticeRef(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Category</label>
                  <select
                    value={noticeCategory}
                    onChange={(e) => setNoticeCategory(e.target.value as NoticeCategory)}
                    className={INPUT_CLASS}
                  >
                    {NOTICE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLASS}>Unit / Dept Code</label>
                  <input
                    type="text"
                    required
                    value={noticeDeptCode}
                    onChange={(e) => setNoticeDeptCode(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              <div>
                <label className={LABEL_CLASS}>Circular Title</label>
                <input
                  type="text"
                  required
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={LABEL_CLASS}>Board Scope</label>
                  <select
                    value={noticeScope}
                    onChange={(e) => setNoticeScope(e.target.value as NoticeBoardScope)}
                    className={INPUT_CLASS}
                  >
                    <option value="central">Central Notice Board</option>
                    <option value="department">Department Board</option>
                    <option value="course">Course / Session</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLASS}>Visibility</label>
                  <select
                    value={noticeVisibility}
                    onChange={(e) => setNoticeVisibility(e.target.value as NoticeVisibility)}
                    className={INPUT_CLASS}
                  >
                    <option value="public">Public (Everyone)</option>
                    <option value="registered">Registered Members Only</option>
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={noticePinned}
                      onChange={(e) => setNoticePinned(e.target.checked)}
                    />
                    Pin to top of Notice Board
                  </label>
                </div>
              </div>

              {noticeScope !== 'central' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL_CLASS}>Target Session (Optional)</label>
                    <input
                      type="text"
                      value={noticeSession}
                      onChange={(e) => setNoticeSession(e.target.value)}
                      placeholder="e.g. 2022-23 or ALL"
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Target Course Code (Optional)</label>
                    <input
                      type="text"
                      value={noticeCourseCode}
                      onChange={(e) => setNoticeCourseCode(e.target.value)}
                      placeholder="e.g. CSE-3101"
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className={LABEL_CLASS}>Executive Summary</label>
                <textarea
                  rows={2}
                  required
                  value={noticeSummary}
                  onChange={(e) => setNoticeSummary(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label className={LABEL_CLASS}>Full Circular Body</label>
                <textarea
                  rows={5}
                  required
                  value={noticeBody}
                  onChange={(e) => setNoticeBody(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                <div>
                  <label className={LABEL_CLASS}>Attachment Label (Optional)</label>
                  <input
                    type="text"
                    value={noticeAttachName}
                    onChange={(e) => setNoticeAttachName(e.target.value)}
                    placeholder="e.g. Exam_Routine_Fall_2026.pdf"
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Attachment URL (PDF / Image)
                    </label>
                    <label className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer">
                      <Upload className="w-3 h-3" />
                      {uploading ? 'Uploading...' : 'Upload'}
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        disabled={uploading}
                        onChange={(e) =>
                          handleImageUpload(e, 'notice', (url, name, kind) => {
                            setNoticeAttachUrl(url);
                            if (!noticeAttachName) setNoticeAttachName(name);
                            setNoticeAttachType(kind);
                          })
                        }
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    value={noticeAttachUrl}
                    onChange={(e) => setNoticeAttachUrl(e.target.value)}
                    placeholder="https://... or /assets/..."
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 6. GALLERY / NEWS & EVENTS */}
          {target.kind === 'gallery' && (
            <div className="space-y-4">
              <div>
                <label className={LABEL_CLASS}>Headline / Event Title</label>
                <input
                  type="text"
                  required
                  value={galTitle}
                  onChange={(e) => setGalTitle(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className={LABEL_CLASS}>Category</label>
                  <select
                    value={galCategory}
                    onChange={(e) =>
                      setGalCategory(e.target.value as GalleryItemRecord['category'])
                    }
                    className={INPUT_CLASS}
                  >
                    {GALLERY_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLASS}>Media Type</label>
                  <select
                    value={galMediaType}
                    onChange={(e) =>
                      setGalMediaType(e.target.value as GalleryItemRecord['mediaType'])
                    }
                    className={INPUT_CLASS}
                  >
                    <option value="photo">Photo</option>
                    <option value="video">Video / YouTube</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLASS}>Event Date</label>
                  <input
                    type="date"
                    required
                    value={galEventDate}
                    onChange={(e) => setGalEventDate(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Visibility</label>
                  <select
                    value={galVisibility}
                    onChange={(e) => setGalVisibility(e.target.value as 'public' | 'registered')}
                    className={INPUT_CLASS}
                  >
                    <option value="public">Public</option>
                    <option value="registered">Members Only</option>
                  </select>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Media URL (Image, MP4, or YouTube Link)
                  </label>
                  {galMediaType === 'photo' && (
                    <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      {uploading ? 'Uploading...' : 'Upload Photo'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploading}
                        onChange={(e) =>
                          handleImageUpload(e, 'gallery', (url) => setGalMediaUrl(url))
                        }
                      />
                    </label>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={galMediaUrl}
                  onChange={(e) => setGalMediaUrl(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Description</label>
                <textarea
                  rows={3}
                  required
                  value={galDescription}
                  onChange={(e) => setGalDescription(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          )}

          {/* 7. PUBLICATION */}
          {target.kind === 'publication' && (
            <div className="space-y-4">
              <div>
                <label className={LABEL_CLASS}>Paper / Article Title</label>
                <input
                  type="text"
                  required
                  value={pubTitle}
                  onChange={(e) => setPubTitle(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Authors</label>
                <input
                  type="text"
                  required
                  value={pubAuthors}
                  onChange={(e) => setPubAuthors(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={LABEL_CLASS}>Department Code</label>
                  <select
                    value={pubDeptCode}
                    onChange={(e) => setPubDeptCode(e.target.value)}
                    className={INPUT_CLASS}
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.code}>
                        {d.code} — {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLASS}>Research Domain</label>
                  <input
                    type="text"
                    required
                    value={pubDomain}
                    onChange={(e) => setPubDomain(e.target.value)}
                    placeholder="e.g. Deep Learning & Medical AI"
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Publication Year</label>
                  <input
                    type="number"
                    required
                    value={pubYear}
                    onChange={(e) => setPubYear(Number(e.target.value))}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
              <div>
                <label className={LABEL_CLASS}>Journal / Conference Venue</label>
                <input
                  type="text"
                  required
                  value={pubVenue}
                  onChange={(e) => setPubVenue(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          )}

          {/* 8. OFFICIAL PUST JOURNALS */}
          {target.kind === 'journals' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600">
                  Manage official peer-reviewed university periodicals displayed across Research &amp;
                  Homepage sections.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setJournalsList((prev) => [
                      ...prev,
                      {
                        id: `jrn-${Date.now()}`,
                        title: 'New PUST Journal',
                        issn: 'ISSN 2999-0000',
                        scope: 'Multidisciplinary science and engineering research.',
                        currentIssue: 'Vol. 1, Issue 1 (2026)',
                      },
                    ])
                  }
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Journal
                </button>
              </div>
              <div className="space-y-4">
                {journalsList.map((j, idx) => (
                  <div
                    key={j.id}
                    className="p-4 rounded-xl border border-slate-200 bg-[#F7F7F5] space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-pust-800">
                        Periodical #{idx + 1}
                      </span>
                      {journalsList.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setJournalsList((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="inline-flex items-center gap-1 text-xs text-red-700 hover:underline cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={LABEL_CLASS}>Journal Title</label>
                        <input
                          type="text"
                          required
                          value={j.title}
                          onChange={(e) =>
                            setJournalsList((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, title: e.target.value } : item
                              )
                            )
                          }
                          className={INPUT_CLASS}
                        />
                      </div>
                      <div>
                        <label className={LABEL_CLASS}>ISSN</label>
                        <input
                          type="text"
                          required
                          value={j.issn}
                          onChange={(e) =>
                            setJournalsList((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, issn: e.target.value } : item
                              )
                            )
                          }
                          className={INPUT_CLASS}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>Scope</label>
                      <input
                        type="text"
                        required
                        value={j.scope}
                        onChange={(e) =>
                          setJournalsList((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, scope: e.target.value } : item
                            )
                          )
                        }
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>Current Issue</label>
                      <input
                        type="text"
                        required
                        value={j.currentIssue}
                        onChange={(e) =>
                          setJournalsList((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, currentIssue: e.target.value } : item
                            )
                          )
                        }
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 9. DEPARTMENT */}
          {target.kind === 'department' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLASS}>Department Name</label>
                  <input
                    type="text"
                    required
                    value={deptName}
                    onChange={(e) => setDeptName(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Faculty</label>
                  <select
                    value={deptFaculty}
                    onChange={(e) => setDeptFaculty(e.target.value as FacultyName)}
                    className={INPUT_CLASS}
                  >
                    {FACULTIES.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLASS}>Chairman Name</label>
                  <input
                    type="text"
                    required
                    value={deptChairman}
                    onChange={(e) => setDeptChairman(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Academic Building</label>
                  <input
                    type="text"
                    required
                    value={deptBuilding}
                    onChange={(e) => setDeptBuilding(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Established Year</label>
                  <input
                    type="number"
                    required
                    value={deptEstablished}
                    onChange={(e) => setDeptEstablished(Number(e.target.value))}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Annual Intake Seats</label>
                  <input
                    type="number"
                    required
                    value={deptIntake}
                    onChange={(e) => setDeptIntake(Number(e.target.value))}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
              <div>
                <label className={LABEL_CLASS}>Degrees Offered (comma-separated)</label>
                <input
                  type="text"
                  required
                  value={deptDegreesText}
                  onChange={(e) => setDeptDegreesText(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Department Summary</label>
                <textarea
                  rows={3}
                  required
                  value={deptSummary}
                  onChange={(e) => setDeptSummary(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLASS}>Research Priorities (one per line)</label>
                  <textarea
                    rows={4}
                    required
                    value={deptResearchText}
                    onChange={(e) => setDeptResearchText(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Academic Laboratories (one per line)</label>
                  <textarea
                    rows={4}
                    required
                    value={deptLabsText}
                    onChange={(e) => setDeptLabsText(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 10. LEADERSHIP OFFICER */}
          {target.kind === 'leadership' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                  {leadershipList.map((officer, idx) => (
                    <button
                      key={`${officer.role}-${idx}`}
                      type="button"
                      onClick={() => setSelectedOfficerIdx(idx)}
                      className={`px-2.5 py-1 rounded-lg text-xs cursor-pointer border ${
                        selectedOfficerIdx === idx
                          ? 'bg-pust-900 text-white border-pust-900'
                          : 'bg-[#F7F7F5] text-slate-700 border-slate-200'
                      }`}
                    >
                      {officer.role}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextIdx = leadershipList.length;
                    setLeadershipList((prev) => [
                      ...prev,
                      {
                        role: 'New Executive Role',
                        name: 'Officer Name',
                        email: 'office@pust.ac.bd',
                        phone: '+8802588800000',
                        office: 'Administrative Building',
                      },
                    ]);
                    setSelectedOfficerIdx(nextIdx);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Officer
                </button>
              </div>

              {leadershipList[selectedOfficerIdx] && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={LABEL_CLASS}>Designation / Role</label>
                      <input
                        type="text"
                        required
                        value={leadershipList[selectedOfficerIdx].role}
                        onChange={(e) =>
                          setLeadershipList((prev) =>
                            prev.map((o, i) =>
                              i === selectedOfficerIdx ? { ...o, role: e.target.value } : o
                            )
                          )
                        }
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>Officer Name</label>
                      <input
                        type="text"
                        required
                        value={leadershipList[selectedOfficerIdx].name}
                        onChange={(e) =>
                          setLeadershipList((prev) =>
                            prev.map((o, i) =>
                              i === selectedOfficerIdx ? { ...o, name: e.target.value } : o
                            )
                          )
                        }
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>Email</label>
                      <input
                        type="email"
                        required
                        value={leadershipList[selectedOfficerIdx].email}
                        onChange={(e) =>
                          setLeadershipList((prev) =>
                            prev.map((o, i) =>
                              i === selectedOfficerIdx ? { ...o, email: e.target.value } : o
                            )
                          )
                        }
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>Telephone</label>
                      <input
                        type="text"
                        required
                        value={leadershipList[selectedOfficerIdx].phone}
                        onChange={(e) =>
                          setLeadershipList((prev) =>
                            prev.map((o, i) =>
                              i === selectedOfficerIdx ? { ...o, phone: e.target.value } : o
                            )
                          )
                        }
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Office / Directorate</label>
                    <input
                      type="text"
                      required
                      value={leadershipList[selectedOfficerIdx].office}
                      onChange={(e) =>
                        setLeadershipList((prev) =>
                          prev.map((o, i) =>
                            i === selectedOfficerIdx ? { ...o, office: e.target.value } : o
                          )
                        )
                      }
                      className={INPUT_CLASS}
                    />
                  </div>
                  {leadershipList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setLeadershipList((prev) => prev.filter((_, i) => i !== selectedOfficerIdx));
                        setSelectedOfficerIdx(0);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-medium text-red-700 hover:underline cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove This Officer Entry
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 11. STATUTORY & ADMINISTRATIVE UNIT */}
          {target.kind === 'unit' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                  {unitsList.map((u, idx) => (
                    <button
                      key={`${u.code}-${idx}`}
                      type="button"
                      onClick={() => setSelectedUnitIdx(idx)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono cursor-pointer border ${
                        selectedUnitIdx === idx
                          ? 'bg-pust-900 text-white border-pust-900'
                          : 'bg-[#F7F7F5] text-slate-700 border-slate-200'
                      }`}
                    >
                      {u.code}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextIdx = unitsList.length;
                    setUnitsList((prev) => [
                      ...prev,
                      {
                        code: `UNIT${nextIdx + 1}`,
                        name: 'New Administrative Unit',
                        category: 'Administrative Office',
                        description: 'Institutional responsibilities and governance scope.',
                      },
                    ]);
                    setSelectedUnitIdx(nextIdx);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Unit
                </button>
              </div>

              {unitsList[selectedUnitIdx] && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className={LABEL_CLASS}>Unit Code</label>
                      <input
                        type="text"
                        required
                        value={unitsList[selectedUnitIdx].code}
                        onChange={(e) =>
                          setUnitsList((prev) =>
                            prev.map((u, i) =>
                              i === selectedUnitIdx ? { ...u, code: e.target.value } : u
                            )
                          )
                        }
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={LABEL_CLASS}>Category</label>
                      <select
                        value={unitsList[selectedUnitIdx].category}
                        onChange={(e) =>
                          setUnitsList((prev) =>
                            prev.map((u, i) =>
                              i === selectedUnitIdx
                                ? {
                                    ...u,
                                    category: e.target.value as AdministrativeUnit['category'],
                                  }
                                : u
                            )
                          )
                        }
                        className={INPUT_CLASS}
                      >
                        {UNIT_CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Unit Name</label>
                    <input
                      type="text"
                      required
                      value={unitsList[selectedUnitIdx].name}
                      onChange={(e) =>
                        setUnitsList((prev) =>
                          prev.map((u, i) =>
                            i === selectedUnitIdx ? { ...u, name: e.target.value } : u
                          )
                        )
                      }
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Description</label>
                    <textarea
                      rows={3}
                      required
                      value={unitsList[selectedUnitIdx].description}
                      onChange={(e) =>
                        setUnitsList((prev) =>
                          prev.map((u, i) =>
                            i === selectedUnitIdx ? { ...u, description: e.target.value } : u
                          )
                        )
                      }
                      className={INPUT_CLASS}
                    />
                  </div>
                  {unitsList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setUnitsList((prev) => prev.filter((_, i) => i !== selectedUnitIdx));
                        setSelectedUnitIdx(0);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-medium text-red-700 hover:underline cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove This Unit
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Footer Action Bar */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              {canDelete && !confirmDelete && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-red-300 text-red-700 hover:bg-red-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              )}
              {canDelete && confirmDelete && (
                <div className="inline-flex items-center gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleDeleteEntity}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-red-700 text-white hover:bg-red-800 cursor-pointer"
                  >
                    Confirm Delete
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setConfirmDelete(false)}
                    className="px-2.5 py-2 rounded-lg text-xs text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || uploading}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold bg-pust-900 text-white hover:bg-pust-950 disabled:opacity-60 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
