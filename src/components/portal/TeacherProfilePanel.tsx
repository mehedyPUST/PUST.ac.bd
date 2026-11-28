'use client';

import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  BookOpen,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  FlaskConical,
  GraduationCap,
  Link2,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
  UserX,
  X,
  XCircle,
} from 'lucide-react';
import { pustApi } from '../../lib/api';
import { isSafeMediaUrl } from '../../lib/media';
import type {
  AuthUser,
  ContactDetailItem,
  DepartmentPersonRecord,
  DepartmentRecord,
  FacultyProfileRequestRecord,
} from '../../types/pust';

interface TeacherProfilePanelProps {
  user: AuthUser;
  onUserChange: (user: AuthUser) => void;
  onViewDepartment?: (departmentCode: string) => void;
}

type ContactChannelType = ContactDetailItem['type'];

interface ProfileDraft {
  name: string;
  designation: string;
  officeLocation: string;
  qualification: string;
  researchArea: string;
  photoUrl: string;
  bio: string;
  onStudyLeave: boolean;
  phones: ContactDetailItem[];
  emails: ContactDetailItem[];
  educationText: string;
  teachingExperienceText: string;
  researchInterestsText: string;
  activeResearchProjectsText: string;
  conductedCoursesText: string;
  journalArticlesText: string;
  conferenceProceedingsText: string;
  awardsText: string;
}

const CONTACT_TYPES: ContactChannelType[] = ['Office', 'Personal', 'IP Phone', 'PABX'];

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Unable to read selected image file.'));
    reader.readAsDataURL(file);
  });
}

function splitLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function sanitizeTelHref(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

function draftFromPerson(
  person: Partial<Omit<DepartmentPersonRecord, 'id'>> | null,
  fallbackUser: AuthUser
): ProfileDraft {
  const phones: ContactDetailItem[] =
    person?.phones && person.phones.length > 0
      ? person.phones.map((p) => ({ value: p.value, type: p.type }))
      : [{ value: '', type: 'Office' }];

  const emails: ContactDetailItem[] =
    person?.emails && person.emails.length > 0
      ? person.emails.map((e) => ({ value: e.value, type: e.type }))
      : [{ value: fallbackUser.email || '', type: 'Office' }];

  return {
    name: person?.name || fallbackUser.name || '',
    designation: person?.designation || fallbackUser.designation || 'Lecturer',
    officeLocation: person?.officeLocation || '',
    qualification: person?.qualification || '',
    researchArea: person?.researchArea || '',
    photoUrl: person?.photoUrl || '',
    bio: person?.bio || '',
    onStudyLeave: Boolean(person?.onStudyLeave),
    phones,
    emails,
    educationText: (person?.education || []).join('\n'),
    teachingExperienceText: (person?.teachingExperience || []).join('\n'),
    researchInterestsText: (person?.researchInterests || []).join('\n'),
    activeResearchProjectsText: (person?.activeResearchProjects || []).join('\n'),
    conductedCoursesText: (person?.conductedCourses || []).join('\n'),
    journalArticlesText: (person?.journalArticles || []).join('\n'),
    conferenceProceedingsText: (person?.conferenceProceedings || []).join('\n'),
    awardsText: (person?.awards || []).join('\n'),
  };
}

function buildProposedProfilePayload(draft: ProfileDraft): Omit<DepartmentPersonRecord, 'id'> {
  const cleanPhones = draft.phones
    .map((p) => ({ value: p.value.trim(), type: p.type }))
    .filter((p) => p.value.length >= 2);
  const cleanEmails = draft.emails
    .map((e) => ({ value: e.value.trim(), type: e.type }))
    .filter((e) => e.value.length >= 2);

  const education = splitLines(draft.educationText);
  const teachingExperience = splitLines(draft.teachingExperienceText);
  const researchInterests = splitLines(draft.researchInterestsText);
  const activeResearchProjects = splitLines(draft.activeResearchProjectsText);
  const conductedCourses = splitLines(draft.conductedCoursesText);
  const journalArticles = splitLines(draft.journalArticlesText);
  const conferenceProceedings = splitLines(draft.conferenceProceedingsText);
  const awards = splitLines(draft.awardsText);
  const cleanPhoto = draft.photoUrl.trim();
  const totalPublications = journalArticles.length + conferenceProceedings.length;

  return {
    name: draft.name.trim(),
    designation: draft.designation.trim(),
    onStudyLeave: draft.onStudyLeave || undefined,
    photoUrl: cleanPhoto ? cleanPhoto : undefined,
    officeLocation: draft.officeLocation.trim() || undefined,
    bio: draft.bio.trim() || undefined,
    qualification: draft.qualification.trim() || undefined,
    researchArea: draft.researchArea.trim() || undefined,
    phones: cleanPhones,
    emails: cleanEmails,
    totalPublications: totalPublications > 0 ? totalPublications : undefined,
    education: education.length > 0 ? education : undefined,
    teachingExperience: teachingExperience.length > 0 ? teachingExperience : undefined,
    researchInterests: researchInterests.length > 0 ? researchInterests : undefined,
    activeResearchProjects:
      activeResearchProjects.length > 0 ? activeResearchProjects : undefined,
    conductedCourses: conductedCourses.length > 0 ? conductedCourses : undefined,
    journalArticles: journalArticles.length > 0 ? journalArticles : undefined,
    conferenceProceedings:
      conferenceProceedings.length > 0 ? conferenceProceedings : undefined,
    awards: awards.length > 0 ? awards : undefined,
  };
}

function formatDateTime(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TeacherProfilePanel({
  user,
  onUserChange,
  onViewDepartment,
}: TeacherProfilePanelProps) {
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState<DepartmentRecord | null>(null);
  const [claimedMember, setClaimedMember] = useState<DepartmentPersonRecord | null>(null);
  const [claimedMap, setClaimedMap] = useState<
    Record<string, { claimedByMe: boolean; claimedByName?: string }>
  >({});
  const [requests, setRequests] = useState<FacultyProfileRequestRecord[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [unclaiming, setUnclaiming] = useState(false);
  const [confirmRelease, setConfirmRelease] = useState(false);

  // Reading vs Editing Mode
  const [isEditing, setIsEditing] = useState(false);
  const [readingSource, setReadingSource] = useState<'live' | 'pending'>('live');
  const [browseDirectoryWhenUnclaimed, setBrowseDirectoryWhenUnclaimed] = useState(false);
  const [previewCandidate, setPreviewCandidate] = useState<{
    member: DepartmentPersonRecord;
    group: 'faculty' | 'contractual';
    groupLabel: string;
  } | null>(null);

  // Directory Search & Editor State
  const [directorySearch, setDirectorySearch] = useState('');
  const [editorMode, setEditorMode] = useState<'edit_claimed' | 'create_new'>('create_new');
  const [facultyGroup, setFacultyGroup] = useState<'faculty' | 'contractual'>('faculty');
  const [photoSourceMode, setPhotoSourceMode] = useState<'upload' | 'link'>('upload');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [draft, setDraft] = useState<ProfileDraft>(() => draftFromPerson(null, user));

  const applyLoadedState = useCallback(
    (
      res: {
        user: AuthUser;
        department: DepartmentRecord | null;
        claimedMember: DepartmentPersonRecord | null;
        claimedMap: Record<string, { claimedByMe: boolean; claimedByName?: string }>;
        requests: FacultyProfileRequestRecord[];
      },
      options?: { preserveEditMode?: boolean }
    ) => {
      onUserChange(res.user);
      setDepartment(res.department);
      setClaimedMember(res.claimedMember);
      setClaimedMap(res.claimedMap);
      setRequests(res.requests);

      const pendingReq = res.requests.find((r) => r.status === 'pending');
      if (pendingReq) {
        setEditorMode(pendingReq.requestType);
        setFacultyGroup(pendingReq.facultyGroup);
        setDraft(draftFromPerson(pendingReq.proposedProfile, res.user));
        setReadingSource(res.claimedMember ? 'pending' : 'pending');
      } else if (res.claimedMember) {
        setEditorMode('edit_claimed');
        setFacultyGroup(res.user.claimedFacultyGroup || 'faculty');
        setDraft(draftFromPerson(res.claimedMember, res.user));
        setReadingSource('live');
      } else {
        setEditorMode('create_new');
        setFacultyGroup('faculty');
        setDraft(draftFromPerson(null, res.user));
        setReadingSource('live');
      }

      if (!options?.preserveEditMode) {
        // Default to Reading Mode whenever the teacher has a claimed profile or a submitted draft
        setIsEditing(false);
      }
    },
    [onUserChange]
  );

  const loadStatus = useCallback(
    async (options?: { preserveEditMode?: boolean }) => {
      setLoading(true);
      setError(null);
      try {
        const res = await pustApi.getTeacherProfileStatus();
        applyLoadedState(res, options);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Unable to load faculty directory profile status.'
        );
      } finally {
        setLoading(false);
      }
    },
    [applyLoadedState]
  );

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  // Close candidate preview modal with Escape
  useEffect(() => {
    if (!previewCandidate) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewCandidate(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [previewCandidate]);

  const directoryEntries = useMemo(() => {
    if (!department) return [];
    const list: Array<{
      member: DepartmentPersonRecord;
      group: 'faculty' | 'contractual';
      groupLabel: string;
    }> = [];
    for (const m of department.facultyMembers || []) {
      list.push({ member: m, group: 'faculty', groupLabel: 'Regular Faculty' });
    }
    for (const m of department.contractualFacultyMembers || []) {
      list.push({ member: m, group: 'contractual', groupLabel: 'Contractual / Adjunct' });
    }
    const q = directorySearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(({ member }) => {
      const haystack = [
        member.name,
        member.designation,
        member.officeLocation || '',
        ...member.emails.map((e) => e.value),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [department, directorySearch]);

  const pendingRequest = useMemo(
    () => requests.find((r) => r.status === 'pending') || null,
    [requests]
  );
  const latestFinalizedRequest = useMemo(
    () => requests.find((r) => r.status !== 'pending') || null,
    [requests]
  );

  // Active reading profile: either claimed live profile, pending draft, or create_new pending profile
  const readingProfile = useMemo<Omit<DepartmentPersonRecord, 'id'> | null>(() => {
    if (claimedMember) {
      if (pendingRequest && readingSource === 'pending') {
        return pendingRequest.proposedProfile;
      }
      return claimedMember;
    }
    if (pendingRequest?.requestType === 'create_new') {
      return pendingRequest.proposedProfile;
    }
    return null;
  }, [claimedMember, pendingRequest, readingSource]);

  const readingMetrics = useMemo(() => {
    if (!readingProfile) {
      return { courses: 0, projects: 0, publications: 0, awards: 0 };
    }
    const pubs =
      (readingProfile.journalArticles?.length || 0) +
      (readingProfile.conferenceProceedings?.length || 0);
    return {
      courses: readingProfile.conductedCourses?.length || 0,
      projects: readingProfile.activeResearchProjects?.length || 0,
      publications: Math.max(pubs, readingProfile.totalPublications || 0),
      awards: readingProfile.awards?.length || 0,
    };
  }, [readingProfile]);

  async function handleClaimProfile(
    member: DepartmentPersonRecord,
    group: 'faculty' | 'contractual'
  ) {
    setError(null);
    setFeedback(null);
    setClaimingId(member.id);
    setPreviewCandidate(null);
    try {
      const res = await pustApi.claimTeacherProfile({
        memberId: member.id,
        facultyGroup: group,
      });
      onUserChange(res.user);
      setClaimedMember(res.claimedMember);
      setEditorMode('edit_claimed');
      setFacultyGroup(res.facultyGroup);
      setDraft(draftFromPerson(res.claimedMember, res.user));
      setReadingSource('live');
      setIsEditing(false);
      setBrowseDirectoryWhenUnclaimed(false);
      setFeedback(
        `Profile claimed for "${res.claimedMember.name}". Reviewing your profile in reading mode — click "Edit / Update Profile" anytime to propose changes for Administrator approval.`
      );
      await loadStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to claim this faculty profile.');
    } finally {
      setClaimingId(null);
    }
  }

  async function handleUnclaimProfile() {
    setError(null);
    setFeedback(null);
    setUnclaiming(true);
    try {
      const res = await pustApi.unclaimTeacherProfile();
      onUserChange(res.user);
      setClaimedMember(null);
      setConfirmRelease(false);
      setEditorMode('create_new');
      setDraft(draftFromPerson(null, res.user));
      setIsEditing(false);
      setFeedback(
        'Released claimed directory profile. Select a profile from your department roster or create a new profile.'
      );
      await loadStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to release claimed profile.');
    } finally {
      setUnclaiming(false);
    }
  }

  function enterEditMode(mode?: 'edit_claimed' | 'create_new') {
    const resolvedMode = mode || (claimedMember ? 'edit_claimed' : 'create_new');
    setEditorMode(resolvedMode);
    if (resolvedMode === 'edit_claimed' && claimedMember) {
      setFacultyGroup(user.claimedFacultyGroup || 'faculty');
      setDraft(
        draftFromPerson(
          pendingRequest?.requestType === 'edit_claimed'
            ? pendingRequest.proposedProfile
            : claimedMember,
          user
        )
      );
    } else {
      setDraft(
        draftFromPerson(
          pendingRequest?.requestType === 'create_new' ? pendingRequest.proposedProfile : null,
          user
        )
      );
    }
    setIsEditing(true);
    setFeedback(null);
    setError(null);
  }

  async function handlePhotoFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    setFeedback(null);

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid PNG, JPG, or WebP portrait image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Portrait image size must be under 5 MB.');
      return;
    }

    setUploadingPhoto(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const uploaded = await pustApi.uploadMediaToImageKit({
        purpose: 'faculty_photo',
        fileName: file.name,
        mimeType: file.type,
        dataBase64: dataUrl,
      });
      setDraft((prev) => ({ ...prev, photoUrl: uploaded.url }));
      setFeedback('Portrait uploaded to media CDN. Submit your profile below for Admin approval.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Portrait upload failed.');
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSubmitProfileRequest(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFeedback(null);

    if (draft.name.trim().length < 2 || draft.designation.trim().length < 2) {
      setError('Full name and academic designation are required (minimum 2 characters).');
      return;
    }
    if (draft.photoUrl.trim() && !isSafeMediaUrl(draft.photoUrl.trim())) {
      setError('Photo URL must be a valid https://, http://, or local asset path.');
      return;
    }

    if (editorMode === 'edit_claimed' && !claimedMember) {
      setError('Claim a department directory profile first, or switch to Create New Profile.');
      return;
    }

    const proposedProfile = buildProposedProfilePayload(draft);
    setSubmittingRequest(true);
    try {
      const res = await pustApi.submitTeacherProfileRequest({
        requestType: editorMode,
        facultyGroup,
        targetMemberId: editorMode === 'edit_claimed' ? claimedMember?.id : undefined,
        proposedProfile,
      });
      setFeedback(
        editorMode === 'create_new'
          ? `New directory profile for "${res.request.proposedProfile.name}" submitted. It will publish to the public department page once approved by an Administrator.`
          : `Profile update for "${res.request.proposedProfile.name}" submitted and is awaiting Administrator approval.`
      );
      setIsEditing(false);
      setReadingSource('pending');
      setBrowseDirectoryWhenUnclaimed(false);
      await loadStatus();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to submit faculty profile request for admin approval.'
      );
    } finally {
      setSubmittingRequest(false);
    }
  }

  const waitingInitialClaimCheck = loading && Boolean(user.claimedFacultyMemberId) && !claimedMember;

  return (
    <div className="space-y-6">
      {/* Feedback & Error Alerts */}
      {feedback && (
        <div
          role="status"
          className="px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-medium text-emerald-900 flex items-center justify-between gap-3"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{feedback}</span>
          </span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-emerald-700 hover:text-emerald-950 cursor-pointer shrink-0"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-xs font-medium text-red-900 flex items-center justify-between gap-3"
        >
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
            <span>{error}</span>
          </span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-700 hover:text-red-950 cursor-pointer shrink-0"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Pending / Finalized Approval Status Banner */}
      {pendingRequest && (
        <div className="rounded-2xl border border-amber-300 bg-[#FBF6EE] px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-amber-950">
                Pending Chairman / Admin Approval
              </p>
              <p className="text-xs text-amber-900">
                Your{' '}
                <span className="font-semibold">
                  {pendingRequest.requestType === 'create_new'
                    ? 'new directory profile'
                    : 'profile edit'}
                </span>{' '}
                for <span className="font-semibold">{pendingRequest.proposedProfile.name}</span>{' '}
                ({formatDateTime(pendingRequest.updatedAt)}) is under review. Live public records stay unchanged until approved by your Department Chairman or University Admin.
              </p>
            </div>
          </div>
          {!isEditing && claimedMember && (
            <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-amber-100/80 border border-amber-200 shrink-0 self-start lg:self-auto">
              <button
                type="button"
                onClick={() => setReadingSource('live')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  readingSource === 'live'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-amber-950 hover:bg-white/60'
                }`}
              >
                Live Profile
              </button>
              <button
                type="button"
                onClick={() => setReadingSource('pending')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  readingSource === 'pending'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-amber-950 hover:bg-white/60'
                }`}
              >
                Pending Draft
              </button>
            </div>
          )}
        </div>
      )}

      {!pendingRequest && latestFinalizedRequest && latestFinalizedRequest.status === 'rejected' && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-red-950">
                Previous Profile Request Declined by Administrator
              </p>
              <p className="text-xs text-red-900">
                Reviewer Note: {latestFinalizedRequest.adminNote || 'No note provided.'} — Click Edit / Update Profile to revise and resubmit.
              </p>
            </div>
          </div>
        </div>
      )}

      {!pendingRequest && latestFinalizedRequest && latestFinalizedRequest.status === 'approved' && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-emerald-950">
              Latest Profile Change Approved &amp; Published ({formatDateTime(latestFinalizedRequest.reviewedAt)})
            </p>
            <p className="text-xs text-emerald-900">
              {latestFinalizedRequest.adminNote ||
                `Your profile is published live in the ${user.departmentCode} Department directory.`}
            </p>
          </div>
        </div>
      )}

      {/* Loading Skeleton for Claimed Profile */}
      {waitingInitialClaimCheck && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-stone-100 animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-48 bg-stone-100 animate-pulse rounded" />
              <div className="h-6 w-72 bg-stone-100 animate-pulse rounded" />
              <div className="h-3 w-60 bg-stone-100 animate-pulse rounded" />
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-16 rounded-xl bg-stone-100 animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {/* UNCLAIMED FLOW: Show Claim Directory if teacher has not yet claimed a profile and is not editing */}
      {!waitingInitialClaimCheck &&
        !claimedMember &&
        !isEditing &&
        (browseDirectoryWhenUnclaimed || pendingRequest?.requestType !== 'create_new') && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-200 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono text-pust-800">
                <Building2 className="w-3.5 h-3.5" />
                <span>
                  {department
                    ? `${department.name} (${department.code})`
                    : `${user.departmentCode} Department Directory`}
                </span>
              </div>
              <h2 className="font-serif text-xl font-medium text-slate-950">
                Claim Your Profile in the Department Directory
              </h2>
              <p className="text-xs text-slate-600 max-w-2xl">
                Select your existing faculty entry below to link your account and inspect your profile in reading mode. Not listed in the directory? Create a new faculty profile for Administrator approval.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {onViewDepartment && (
                <button
                  type="button"
                  onClick={() => onViewDepartment(user.departmentCode)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-stone-300 bg-[#F7F7F5] text-slate-800 hover:border-pust-800 hover:text-pust-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View Public Dept Page</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => void loadStatus()}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-stone-300 bg-[#F7F7F5] text-slate-700 hover:border-pust-800 hover:text-slate-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-slate-900">
                Not listed in the {user.departmentCode} directory?
              </p>
              <p className="text-xs text-slate-600">
                Compose your full academic profile directly and submit it for Administrator verification.
              </p>
            </div>
            <button
              type="button"
              onClick={() => enterEditMode('create_new')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-pust-900 text-white hover:bg-pust-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create &amp; Edit My Profile</span>
            </button>
          </div>

          {/* Directory Search + List */}
          <div className="space-y-3">
            <div className="relative max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={directorySearch}
                onChange={(e) => setDirectorySearch(e.target.value)}
                placeholder={`Search ${user.departmentCode} faculty by name, designation, or email...`}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
              />
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((row) => (
                  <div
                    key={row}
                    className="h-12 rounded-lg bg-stone-100 animate-pulse border border-stone-200"
                  />
                ))}
              </div>
            ) : directoryEntries.length === 0 ? (
              <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] p-6 text-center space-y-2">
                <p className="text-sm font-medium text-slate-900">
                  No matching faculty entries found in {user.departmentCode}
                </p>
                <p className="text-xs text-slate-600">
                  If your profile is not yet listed, create a new profile and submit it for Administrator approval.
                </p>
                <button
                  type="button"
                  onClick={() => enterEditMode('create_new')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-pust-900 text-white hover:bg-pust-950 transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create New Profile for Admin Approval</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-stone-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F7F7F5] border-b border-stone-200 text-slate-600 font-semibold">
                      <th className="py-2.5 px-3 w-12 font-mono">S.N</th>
                      <th className="py-2.5 px-3">Faculty Member</th>
                      <th className="py-2.5 px-3">Designation &amp; Group</th>
                      <th className="py-2.5 px-3">Contact</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {directoryEntries.map(({ member, group, groupLabel }, idx) => {
                      const claimInfo = claimedMap[member.id];
                      const claimedByMe = Boolean(claimInfo?.claimedByMe);
                      const claimedByOther = Boolean(claimInfo && !claimedByMe);
                      const primaryEmail = member.emails?.[0]?.value || '—';

                      return (
                        <tr
                          key={`${group}-${member.id}`}
                          className={idx % 2 === 0 ? 'bg-white' : 'bg-[#FAF9F6]'}
                        >
                          <td className="py-2.5 px-3 font-mono text-slate-500 tabular-nums">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-pust-50 border border-stone-200 text-pust-900 flex items-center justify-center font-serif text-xs font-semibold shrink-0 overflow-hidden">
                                {member.photoUrl && isSafeMediaUrl(member.photoUrl) ? (
                                  <img
                                    src={member.photoUrl}
                                    alt={member.name}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span>{member.name.slice(0, 2).toUpperCase()}</span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-slate-950 truncate">{member.name}</p>
                                <p className="font-mono text-[11px] text-slate-500 truncate">
                                  {member.officeLocation || user.departmentCode}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">
                            <p className="font-medium text-slate-900">{member.designation}</p>
                            <p className="text-[11px] text-slate-500">{groupLabel}</p>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                            {primaryEmail}
                          </td>
                          <td className="py-2.5 px-3">
                            {claimedByOther ? (
                              <span className="text-slate-500">
                                Claimed by {claimInfo.claimedByName || 'another teacher'}
                              </span>
                            ) : (
                              <span className="text-pust-800 font-medium">Available to Claim</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewCandidate({ member, group, groupLabel })
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-stone-300 bg-white text-slate-700 hover:border-pust-800 hover:text-pust-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View</span>
                              </button>
                              <button
                                type="button"
                                disabled={claimedByOther || claimingId === member.id}
                                onClick={() => void handleClaimProfile(member, group)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-pust-900 text-white hover:bg-pust-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                              >
                                {claimingId === member.id ? 'Claiming...' : 'Claim'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* READING MODE: Executive Academic Dossier View (default after claiming or submitting profile) */}
      {!waitingInitialClaimCheck &&
        !isEditing &&
        readingProfile &&
        (Boolean(claimedMember) || !browseDirectoryWhenUnclaimed) && (
        <div className="space-y-6">
          {/* Identity & Actions Header Card */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5 border-b border-stone-200 pb-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
                <div className="w-20 h-20 rounded-2xl bg-pust-900 text-white border border-stone-200 flex items-center justify-center font-serif text-2xl font-semibold shrink-0 overflow-hidden">
                  {readingProfile.photoUrl && isSafeMediaUrl(readingProfile.photoUrl) ? (
                    <img
                      src={readingProfile.photoUrl}
                      alt={readingProfile.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{readingProfile.name.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    <span className="font-mono font-semibold text-pust-800">
                      {department ? `${department.name} (${department.code})` : user.departmentCode}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {(claimedMember
                        ? user.claimedFacultyGroup === 'contractual'
                        : pendingRequest?.facultyGroup === 'contractual')
                        ? 'Contractual / Adjunct Faculty'
                        : 'Regular Faculty'}
                    </span>
                    {readingProfile.onStudyLeave && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-amber-800">On Study Leave</span>
                      </>
                    )}
                    {pendingRequest && readingSource === 'pending' && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-amber-800">Draft Preview</span>
                      </>
                    )}
                  </div>

                  <h2 className="font-serif text-2xl sm:text-3xl font-medium text-slate-950 leading-tight">
                    {readingProfile.name}
                  </h2>

                  <p className="text-sm font-medium text-pust-900">
                    {readingProfile.designation}
                    {readingProfile.qualification ? ` · ${readingProfile.qualification}` : ''}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-0.5">
                    {readingProfile.officeLocation && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{readingProfile.officeLocation}</span>
                      </span>
                    )}
                    {readingProfile.researchArea && (
                      <span className="inline-flex items-center gap-1.5">
                        <FlaskConical className="w-3.5 h-3.5 text-slate-400" />
                        <span>{readingProfile.researchArea}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => enterEditMode(claimedMember ? 'edit_claimed' : 'create_new')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-pust-900 text-white hover:bg-pust-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>
                    {pendingRequest ? 'Update Pending Edit' : 'Edit / Update Profile'}
                  </span>
                </button>

                {onViewDepartment && (
                  <button
                    type="button"
                    onClick={() => onViewDepartment(user.departmentCode)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-stone-300 bg-[#F7F7F5] text-slate-800 hover:border-pust-800 hover:text-pust-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Public Dept Page</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => void loadStatus()}
                  disabled={loading}
                  aria-label="Refresh profile"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-stone-300 bg-[#F7F7F5] text-slate-700 hover:border-pust-800 hover:text-slate-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>

                {claimedMember &&
                  (confirmRelease ? (
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => void handleUnclaimProfile()}
                        disabled={unclaiming}
                        className="px-3 py-2 rounded-lg text-xs font-semibold bg-red-700 text-white hover:bg-red-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                      >
                        {unclaiming ? 'Releasing...' : 'Confirm Release'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmRelease(false)}
                        className="px-2.5 py-2 rounded-lg text-xs font-medium border border-stone-300 bg-white text-slate-700 hover:text-slate-950 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmRelease(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-stone-300 bg-white text-slate-700 hover:border-red-300 hover:text-red-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Release Claim</span>
                    </button>
                  ))}

                {!claimedMember && (
                  <button
                    type="button"
                    onClick={() => setBrowseDirectoryWhenUnclaimed(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-stone-300 bg-white text-slate-700 hover:border-pust-800 hover:text-pust-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Browse Dept Directory</span>
                  </button>
                )}
              </div>
            </div>

            {/* 4-Column Quantitative Academic Overview */}
            <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] px-4 py-3">
                <dt className="text-[11px] font-medium text-slate-600">Conducted Courses</dt>
                <dd className="font-mono text-2xl font-semibold text-slate-950 tabular-nums mt-0.5">
                  {readingMetrics.courses}
                </dd>
              </div>
              <div className="rounded-xl border border-stone-200 bg-[#F5F7FA] px-4 py-3">
                <dt className="text-[11px] font-medium text-slate-600">Active Research Projects</dt>
                <dd className="font-mono text-2xl font-semibold text-pust-900 tabular-nums mt-0.5">
                  {readingMetrics.projects}
                </dd>
              </div>
              <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] px-4 py-3">
                <dt className="text-[11px] font-medium text-slate-600">Recorded Publications</dt>
                <dd className="font-mono text-2xl font-semibold text-slate-950 tabular-nums mt-0.5">
                  {readingMetrics.publications}
                </dd>
              </div>
              <div className="rounded-xl border border-stone-200 bg-[#FBF6EE] px-4 py-3">
                <dt className="text-[11px] font-medium text-slate-600">Awards &amp; Honors</dt>
                <dd className="font-mono text-2xl font-semibold text-amber-800 tabular-nums mt-0.5">
                  {readingMetrics.awards}
                </dd>
              </div>
            </dl>
          </div>

          {/* 2-Column Editorial Academic Dossier */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Rail: Contact, Research Focus & Education */}
            <div className="lg:col-span-4 space-y-5">
              {/* Contact & Office Card */}
              <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-3.5">
                <div className="flex items-center gap-2 border-b border-stone-200 pb-2.5">
                  <Phone className="w-4 h-4 text-pust-800" />
                  <h3 className="font-serif text-base font-medium text-slate-950">
                    Contact &amp; Office
                  </h3>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <p className="text-[11px] text-slate-500">Office Location</p>
                    <p className="font-medium text-slate-900 mt-0.5">
                      {readingProfile.officeLocation || 'Not specified'}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-slate-500 mb-1">Telephone</p>
                    {readingProfile.phones && readingProfile.phones.length > 0 ? (
                      <ul className="space-y-1.5">
                        {readingProfile.phones.map((p, idx) => (
                          <li key={idx} className="flex items-center justify-between gap-2">
                            <a
                              href={`tel:${sanitizeTelHref(p.value)}`}
                              className="font-mono text-slate-800 hover:text-pust-900 hover:underline tabular-nums truncate"
                            >
                              {p.value}
                            </a>
                            <span className="font-mono text-[11px] text-slate-500 shrink-0">
                              {p.type}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-500">No phone numbers listed</p>
                    )}
                  </div>

                  <div>
                    <p className="text-[11px] text-slate-500 mb-1">Email</p>
                    {readingProfile.emails && readingProfile.emails.length > 0 ? (
                      <ul className="space-y-1.5">
                        {readingProfile.emails.map((em, idx) => (
                          <li key={idx} className="flex items-center justify-between gap-2">
                            <a
                              href={`mailto:${em.value}`}
                              className="font-mono text-slate-800 hover:text-pust-900 hover:underline truncate"
                            >
                              {em.value}
                            </a>
                            <span className="font-mono text-[11px] text-slate-500 shrink-0">
                              {em.type}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-500">No email addresses listed</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Research Interests Card */}
              <div className="bg-[#FAF9F6] rounded-2xl border border-stone-200 p-5 space-y-3">
                <div className="flex items-center gap-2 border-b border-stone-200 pb-2.5">
                  <FlaskConical className="w-4 h-4 text-pust-800" />
                  <h3 className="font-serif text-base font-medium text-slate-950">
                    Research Focus
                  </h3>
                </div>
                {readingProfile.researchArea && (
                  <p className="text-xs font-medium text-slate-900 leading-relaxed">
                    {readingProfile.researchArea}
                  </p>
                )}
                {readingProfile.researchInterests &&
                readingProfile.researchInterests.length > 0 ? (
                  <ul className="divide-y divide-stone-200 text-xs text-slate-700">
                    {readingProfile.researchInterests.map((item, idx) => (
                      <li key={idx} className="py-2 first:pt-0 last:pb-0">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  !readingProfile.researchArea && (
                    <p className="text-xs text-slate-500">
                      No research areas listed yet.
                    </p>
                  )
                )}
              </div>

              {/* Education Card */}
              <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-3">
                <div className="flex items-center gap-2 border-b border-stone-200 pb-2.5">
                  <GraduationCap className="w-4 h-4 text-pust-800" />
                  <h3 className="font-serif text-base font-medium text-slate-950">
                    Education &amp; Degrees
                  </h3>
                </div>
                {readingProfile.education && readingProfile.education.length > 0 ? (
                  <ol className="space-y-2.5 text-xs text-slate-800">
                    {readingProfile.education.map((deg, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                        <span className="font-mono text-[11px] font-semibold text-pust-800 tabular-nums mt-0.5 shrink-0">
                          {String(idx + 1).padStart(2, '0')}.
                        </span>
                        <span>{deg}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-xs text-slate-500">
                    No academic degrees added yet.
                  </p>
                )}
              </div>
            </div>

            {/* Right Rail: Biography, Experience, Courses, Projects & Publications */}
            <div className="lg:col-span-8 space-y-5">
              {/* Academic Biography */}
              <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-stone-200 pb-2.5">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-pust-800" />
                    <h3 className="font-serif text-lg font-medium text-slate-950">
                      Academic Biography
                    </h3>
                  </div>
                  {!readingProfile.bio && (
                    <button
                      type="button"
                      onClick={() => enterEditMode(claimedMember ? 'edit_claimed' : 'create_new')}
                      className="text-xs font-semibold text-pust-900 hover:underline cursor-pointer"
                    >
                      Add Biography
                    </button>
                  )}
                </div>
                {readingProfile.bio ? (
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line max-w-[72ch]">
                    {readingProfile.bio}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">
                    No biography published yet. Click &quot;Edit / Update Profile&quot; to compose your academic summary for Administrator review.
                  </p>
                )}
              </div>

              {/* Teaching Experience & Conducted Courses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-[#FAF9F6] rounded-2xl border border-stone-200 p-5 space-y-3">
                  <div className="flex items-center gap-2 border-b border-stone-200 pb-2.5">
                    <Briefcase className="w-4 h-4 text-pust-800" />
                    <h3 className="font-serif text-base font-medium text-slate-950">
                      Teaching Experience
                    </h3>
                  </div>
                  {readingProfile.teachingExperience &&
                  readingProfile.teachingExperience.length > 0 ? (
                    <ul className="divide-y divide-stone-200 text-xs text-slate-800">
                      {readingProfile.teachingExperience.map((item, idx) => (
                        <li key={idx} className="py-2 first:pt-0 last:pb-0 leading-relaxed">
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500">No teaching experience entries yet.</p>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-3">
                  <div className="flex items-center gap-2 border-b border-stone-200 pb-2.5">
                    <BookOpen className="w-4 h-4 text-pust-800" />
                    <h3 className="font-serif text-base font-medium text-slate-950">
                      Conducted Courses
                    </h3>
                  </div>
                  {readingProfile.conductedCourses &&
                  readingProfile.conductedCourses.length > 0 ? (
                    <ul className="divide-y divide-stone-200 text-xs text-slate-800">
                      {readingProfile.conductedCourses.map((course, idx) => (
                        <li key={idx} className="py-2 first:pt-0 last:pb-0 leading-relaxed">
                          {course}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500">No conducted courses listed yet.</p>
                  )}
                </div>
              </div>

              {/* Active Research Projects & Awards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-3">
                  <div className="flex items-center gap-2 border-b border-stone-200 pb-2.5">
                    <FlaskConical className="w-4 h-4 text-pust-800" />
                    <h3 className="font-serif text-base font-medium text-slate-950">
                      Active Research Projects
                    </h3>
                  </div>
                  {readingProfile.activeResearchProjects &&
                  readingProfile.activeResearchProjects.length > 0 ? (
                    <ul className="divide-y divide-stone-200 text-xs text-slate-800">
                      {readingProfile.activeResearchProjects.map((proj, idx) => (
                        <li key={idx} className="py-2 first:pt-0 last:pb-0 leading-relaxed">
                          {proj}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500">No active research projects listed.</p>
                  )}
                </div>

                <div className="bg-[#FAF9F6] rounded-2xl border border-stone-200 p-5 space-y-3">
                  <div className="flex items-center gap-2 border-b border-stone-200 pb-2.5">
                    <Award className="w-4 h-4 text-pust-800" />
                    <h3 className="font-serif text-base font-medium text-slate-950">
                      Awards &amp; Distinctions
                    </h3>
                  </div>
                  {readingProfile.awards && readingProfile.awards.length > 0 ? (
                    <ul className="divide-y divide-stone-200 text-xs text-slate-800">
                      {readingProfile.awards.map((award, idx) => (
                        <li key={idx} className="py-2 first:pt-0 last:pb-0 leading-relaxed">
                          {award}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500">No awards recorded yet.</p>
                  )}
                </div>
              </div>

              {/* Scholarly Publications (Journals & Conferences) */}
              <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-stone-200 pb-2.5">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-pust-800" />
                    <h3 className="font-serif text-lg font-medium text-slate-950">
                      Publications &amp; Scholarly Works
                    </h3>
                  </div>
                  <span className="font-mono text-xs text-slate-500 tabular-nums">
                    {readingMetrics.publications} listed
                  </span>
                </div>

                {(!readingProfile.journalArticles || readingProfile.journalArticles.length === 0) &&
                (!readingProfile.conferenceProceedings ||
                  readingProfile.conferenceProceedings.length === 0) ? (
                  <p className="text-xs text-slate-500">
                    No journal articles or conference proceedings added yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {readingProfile.journalArticles &&
                      readingProfile.journalArticles.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-mono text-xs font-semibold text-pust-800">
                            Journal Articles ({readingProfile.journalArticles.length})
                          </h4>
                          <ol className="divide-y divide-stone-200 text-xs text-slate-800">
                            {readingProfile.journalArticles.map((art, idx) => (
                              <li
                                key={idx}
                                className="py-2 flex items-start gap-2.5 leading-relaxed"
                              >
                                <span className="font-mono text-[11px] text-slate-500 tabular-nums shrink-0 mt-0.5">
                                  {String(idx + 1).padStart(2, '0')}.
                                </span>
                                <span>{art}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                    {readingProfile.conferenceProceedings &&
                      readingProfile.conferenceProceedings.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-stone-200">
                          <h4 className="font-mono text-xs font-semibold text-pust-800">
                            Conference Proceedings ({readingProfile.conferenceProceedings.length})
                          </h4>
                          <ol className="divide-y divide-stone-200 text-xs text-slate-800">
                            {readingProfile.conferenceProceedings.map((conf, idx) => (
                              <li
                                key={idx}
                                className="py-2 flex items-start gap-2.5 leading-relaxed"
                              >
                                <span className="font-mono text-[11px] text-slate-500 tabular-nums shrink-0 mt-0.5">
                                  {String(idx + 1).padStart(2, '0')}.
                                </span>
                                <span>{conf}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDITING MODE: Full Faculty Profile Editor (Admin Approval Required) */}
      {isEditing && (
        <form
          onSubmit={handleSubmitProfileRequest}
          className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 space-y-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-200 pb-4">
            <div className="space-y-1">
              <p className="text-xs font-mono text-amber-800 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Administrator Approval Required Before Publishing Live</span>
              </p>
              <h2 className="font-serif text-xl font-medium text-slate-950">
                {editorMode === 'edit_claimed'
                  ? 'Update Faculty Profile'
                  : 'Create New Directory Profile'}
              </h2>
              <p className="text-xs text-slate-600">
                {editorMode === 'edit_claimed' && claimedMember
                  ? `Proposing updates for "${claimedMember.name}" (${user.departmentCode}). Changes stay pending until reviewed by an Administrator.`
                  : `Composing a new faculty entry for the ${user.departmentCode} Department directory. Upon Administrator approval, this profile publishes and links to your account.`}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-stone-300 bg-[#F7F7F5] text-slate-800 hover:border-pust-800 hover:text-slate-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer self-start lg:self-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>
                {readingProfile ? 'Back to Reading Mode' : 'Back to Directory'}
              </span>
            </button>
          </div>

          {/* Portrait Photo Upload or Direct Link */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-4 rounded-xl border border-stone-200 bg-[#FAF9F6] p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-900">Faculty Portrait</span>
                <div className="inline-flex items-center gap-1 p-0.5 rounded-md bg-stone-200/70">
                  <button
                    type="button"
                    onClick={() => setPhotoSourceMode('upload')}
                    className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
                      photoSourceMode === 'upload'
                        ? 'bg-white text-slate-950 shadow-sm'
                        : 'text-slate-600'
                    }`}
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoSourceMode('link')}
                    className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
                      photoSourceMode === 'link'
                        ? 'bg-white text-slate-950 shadow-sm'
                        : 'text-slate-600'
                    }`}
                  >
                    <Link2 className="w-3 h-3" />
                    <span>Direct Link</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-20 h-20 rounded-xl border border-stone-200 bg-white flex items-center justify-center overflow-hidden shrink-0">
                  {draft.photoUrl && isSafeMediaUrl(draft.photoUrl) ? (
                    <img
                      src={draft.photoUrl}
                      alt={draft.name || 'Faculty portrait'}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-serif text-lg font-semibold text-pust-800">
                      {(draft.name || user.name).slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  {photoSourceMode === 'upload' ? (
                    <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-stone-300 text-slate-800 hover:border-pust-800 hover:text-pust-900 transition-colors cursor-pointer whitespace-nowrap">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingPhoto ? 'Uploading...' : 'Choose Portrait'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handlePhotoFileSelect}
                        disabled={uploadingPhoto}
                        className="sr-only"
                      />
                    </label>
                  ) : (
                    <input
                      type="url"
                      value={draft.photoUrl}
                      onChange={(e) => setDraft((prev) => ({ ...prev, photoUrl: e.target.value }))}
                      placeholder="https://ik.imagekit.io/..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 bg-white text-slate-900 focus:outline-none focus:border-pust-800"
                    />
                  )}
                  {draft.photoUrl && (
                    <button
                      type="button"
                      onClick={() => setDraft((prev) => ({ ...prev, photoUrl: '' }))}
                      className="block text-[11px] text-red-700 hover:underline cursor-pointer"
                    >
                      Remove portrait
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Core Identity Fields */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="space-y-1 text-xs">
                <span className="font-semibold text-slate-700">Full Name *</span>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={140}
                  value={draft.name}
                  onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Dr. Md. Ashikur Rahman"
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                />
              </label>

              <label className="space-y-1 text-xs">
                <span className="font-semibold text-slate-700">Academic Designation *</span>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={140}
                  value={draft.designation}
                  onChange={(e) => setDraft((prev) => ({ ...prev, designation: e.target.value }))}
                  placeholder="Associate Professor"
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                />
              </label>

              <label className="space-y-1 text-xs">
                <span className="font-semibold text-slate-700">Directory Group</span>
                <select
                  value={facultyGroup}
                  disabled={editorMode === 'edit_claimed'}
                  onChange={(e) =>
                    setFacultyGroup(e.target.value as 'faculty' | 'contractual')
                  }
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800 disabled:opacity-60"
                >
                  <option value="faculty">Regular Faculty Member</option>
                  <option value="contractual">Contractual / Adjunct Faculty</option>
                </select>
              </label>

              <label className="space-y-1 text-xs">
                <span className="font-semibold text-slate-700">Office Location</span>
                <input
                  type="text"
                  maxLength={240}
                  value={draft.officeLocation}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, officeLocation: e.target.value }))
                  }
                  placeholder="Room 402, Academic Building 2"
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                />
              </label>

              <label className="space-y-1 text-xs">
                <span className="font-semibold text-slate-700">Highest Qualification</span>
                <input
                  type="text"
                  maxLength={400}
                  value={draft.qualification}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, qualification: e.target.value }))
                  }
                  placeholder="Ph.D. in Computer Science & Engineering"
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                />
              </label>

              <label className="space-y-1 text-xs">
                <span className="font-semibold text-slate-700">Primary Research Area</span>
                <input
                  type="text"
                  maxLength={400}
                  value={draft.researchArea}
                  onChange={(e) => setDraft((prev) => ({ ...prev, researchArea: e.target.value }))}
                  placeholder="Machine Learning, Edge IoT & Distributed Systems"
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                />
              </label>
            </div>
          </div>

          {/* Study Leave Checkbox + Biography */}
          <div className="space-y-4">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.onStudyLeave}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, onStudyLeave: e.target.checked }))
                }
                className="rounded border-stone-300 text-pust-900 focus:ring-pust-800"
              />
              <span>Currently on Study Leave (displays Study Leave status on department page)</span>
            </label>

            <label className="block space-y-1 text-xs">
              <span className="font-semibold text-slate-700">Academic Biography</span>
              <textarea
                rows={4}
                maxLength={4000}
                value={draft.bio}
                onChange={(e) => setDraft((prev) => ({ ...prev, bio: e.target.value }))}
                placeholder="Summarize academic background, teaching focus, and research leadership..."
                className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
              />
            </label>
          </div>

          {/* Dynamic Contacts (Phones & Emails) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2 border-t border-stone-200">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-pust-800" />
                  <span>Phone Numbers</span>
                </span>
                {draft.phones.length < 6 && (
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        phones: [...prev.phones, { value: '', type: 'Office' }],
                      }))
                    }
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-pust-900 hover:underline cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Phone</span>
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {draft.phones.map((phone, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={phone.type}
                      onChange={(e) => {
                        const next = [...draft.phones];
                        next[idx] = { ...next[idx], type: e.target.value as ContactChannelType };
                        setDraft((prev) => ({ ...prev, phones: next }));
                      }}
                      className="w-28 px-2.5 py-2 text-xs rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900"
                    >
                      {CONTACT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={phone.value}
                      onChange={(e) => {
                        const next = [...draft.phones];
                        next[idx] = { ...next[idx], value: e.target.value };
                        setDraft((prev) => ({ ...prev, phones: next }));
                      }}
                      placeholder="+880-17XX-XXXXXX"
                      className="flex-1 px-3 py-2 text-xs rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                    />
                    {draft.phones.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            phones: prev.phones.filter((_, i) => i !== idx),
                          }))
                        }
                        aria-label="Remove phone row"
                        className="p-2 rounded-lg border border-stone-200 text-slate-500 hover:text-red-700 hover:border-red-200 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-pust-800" />
                  <span>Email Addresses</span>
                </span>
                {draft.emails.length < 6 && (
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        emails: [...prev.emails, { value: '', type: 'Office' }],
                      }))
                    }
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-pust-900 hover:underline cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Email</span>
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {draft.emails.map((email, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={email.type}
                      onChange={(e) => {
                        const next = [...draft.emails];
                        next[idx] = { ...next[idx], type: e.target.value as ContactChannelType };
                        setDraft((prev) => ({ ...prev, emails: next }));
                      }}
                      className="w-28 px-2.5 py-2 text-xs rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900"
                    >
                      {CONTACT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={email.value}
                      onChange={(e) => {
                        const next = [...draft.emails];
                        next[idx] = { ...next[idx], value: e.target.value };
                        setDraft((prev) => ({ ...prev, emails: next }));
                      }}
                      placeholder="faculty@pust.ac.bd"
                      className="flex-1 px-3 py-2 text-xs rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
                    />
                    {draft.emails.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            emails: prev.emails.filter((_, i) => i !== idx),
                          }))
                        }
                        aria-label="Remove email row"
                        className="p-2 rounded-lg border border-stone-200 text-slate-500 hover:text-red-700 hover:border-red-200 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Multi-line Academic & Publication Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-stone-200">
            <label className="space-y-1 text-xs">
              <span className="font-semibold text-slate-700">Education (one degree per line)</span>
              <textarea
                rows={3}
                value={draft.educationText}
                onChange={(e) => setDraft((prev) => ({ ...prev, educationText: e.target.value }))}
                placeholder="Ph.D. in CSE, BUET&#10;M.Sc. in CSE, PUST&#10;B.Sc. in CSE, PUST"
                className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
              />
            </label>

            <label className="space-y-1 text-xs">
              <span className="font-semibold text-slate-700">
                Teaching Experience (one role per line)
              </span>
              <textarea
                rows={3}
                value={draft.teachingExperienceText}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, teachingExperienceText: e.target.value }))
                }
                placeholder="Associate Professor, Dept. of CSE, PUST (2022–Present)&#10;Assistant Professor, Dept. of CSE, PUST (2018–2022)"
                className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
              />
            </label>

            <label className="space-y-1 text-xs">
              <span className="font-semibold text-slate-700">
                Research Interests (one topic per line)
              </span>
              <textarea
                rows={3}
                value={draft.researchInterestsText}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, researchInterestsText: e.target.value }))
                }
                placeholder="Federated Learning&#10;Medical Image Segmentation"
                className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
              />
            </label>

            <label className="space-y-1 text-xs">
              <span className="font-semibold text-slate-700">
                Conducted Courses (one course per line)
              </span>
              <textarea
                rows={3}
                value={draft.conductedCoursesText}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, conductedCoursesText: e.target.value }))
                }
                placeholder="CSE-3101 Operating Systems&#10;CSE-4105 Machine Learning"
                className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
              />
            </label>

            <label className="space-y-1 text-xs">
              <span className="font-semibold text-slate-700">
                Active Research Projects (one project per line)
              </span>
              <textarea
                rows={3}
                value={draft.activeResearchProjectsText}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, activeResearchProjectsText: e.target.value }))
                }
                placeholder="Edge-AI Flood Telemetry Network for Pabna Basin (UGC Funded)"
                className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
              />
            </label>

            <label className="space-y-1 text-xs">
              <span className="font-semibold text-slate-700">
                Awards &amp; Honors (one item per line)
              </span>
              <textarea
                rows={3}
                value={draft.awardsText}
                onChange={(e) => setDraft((prev) => ({ ...prev, awardsText: e.target.value }))}
                placeholder="Best Paper Award, IEEE Region 10 Symposium 2024"
                className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
              />
            </label>

            <label className="space-y-1 text-xs">
              <span className="font-semibold text-slate-700">
                Journal Articles (one citation per line)
              </span>
              <textarea
                rows={3}
                value={draft.journalArticlesText}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, journalArticlesText: e.target.value }))
                }
                placeholder="Author et al., Title, IEEE Access, 2025."
                className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
              />
            </label>

            <label className="space-y-1 text-xs">
              <span className="font-semibold text-slate-700">
                Conference Proceedings (one citation per line)
              </span>
              <textarea
                rows={3}
                value={draft.conferenceProceedingsText}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, conferenceProceedingsText: e.target.value }))
                }
                placeholder="Author et al., Title, Proc. ICCIT, 2024."
                className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
              />
            </label>
          </div>

          {/* Submit Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-200">
            <p className="text-xs text-slate-600">
              Submitted profiles remain in <span className="font-semibold text-slate-900">Pending Approval</span> until verified by your Department Chairman or University Admin.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3.5 py-2 rounded-lg text-xs font-medium border border-stone-300 bg-white text-slate-700 hover:border-pust-800 hover:text-slate-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Cancel
              </button>
              {claimedMember && editorMode === 'edit_claimed' && (
                <button
                  type="button"
                  onClick={() => setDraft(draftFromPerson(claimedMember, user))}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium border border-stone-300 bg-[#F7F7F5] text-slate-700 hover:border-pust-800 hover:text-slate-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Reset to Live Values
                </button>
              )}
              <button
                type="submit"
                disabled={submittingRequest || uploadingPhoto}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-pust-900 text-white hover:bg-pust-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {submittingRequest
                    ? 'Submitting...'
                    : pendingRequest
                    ? 'Update Pending Submission'
                    : editorMode === 'create_new'
                    ? 'Submit New Profile for Approval'
                    : 'Submit Edit for Approval'}
                </span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Submission History Ledger */}
      {(claimedMember || requests.length > 0) && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-stone-200 pb-3">
            <div>
              <h3 className="font-serif text-lg font-medium text-slate-950">
                Profile Approval Submission History
              </h3>
              <p className="text-xs text-slate-600">
                Audit trail of directory updates and new faculty profile requests submitted from your account.
              </p>
            </div>
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              {requests.length} total
            </span>
          </div>

          {requests.length === 0 ? (
            <p className="text-xs text-slate-600 py-2">
              No profile change requests submitted yet. Click &quot;Edit / Update Profile&quot; above whenever you wish to propose updates for Administrator approval.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-stone-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F7F7F5] border-b border-stone-200 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3 w-12 font-mono">S.N</th>
                    <th className="py-2.5 px-3">Submitted</th>
                    <th className="py-2.5 px-3">Request Type</th>
                    <th className="py-2.5 px-3">Proposed Name &amp; Group</th>
                    <th className="py-2.5 px-3">Approval Status</th>
                    <th className="py-2.5 px-3">Admin Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {requests.map((reqItem, idx) => (
                    <tr
                      key={reqItem.id}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-[#FAF9F6]'}
                    >
                      <td className="py-2.5 px-3 font-mono text-slate-500 tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 tabular-nums whitespace-nowrap">
                        {formatDateTime(reqItem.updatedAt)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-800 font-medium">
                        {reqItem.requestType === 'create_new'
                          ? 'New Directory Profile'
                          : 'Edit Claimed Profile'}
                      </td>
                      <td className="py-2.5 px-3">
                        <p className="font-medium text-slate-950">{reqItem.proposedProfile.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {reqItem.proposedProfile.designation} ·{' '}
                          {reqItem.facultyGroup === 'contractual' ? 'Contractual' : 'Regular'}
                        </p>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {reqItem.status === 'pending' ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-800">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Pending Admin Approval</span>
                          </span>
                        ) : reqItem.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approved &amp; Live</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-red-700">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Declined</span>
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-xs">
                        {reqItem.adminNote || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Read-Only Directory Candidate Preview Modal */}
      {previewCandidate && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Preview Directory Profile"
          onClick={() => setPreviewCandidate(null)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-stone-200 bg-[#FAF9F6] flex items-start justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-pust-900 text-white flex items-center justify-center font-serif text-base font-semibold shrink-0 overflow-hidden">
                  {previewCandidate.member.photoUrl &&
                  isSafeMediaUrl(previewCandidate.member.photoUrl) ? (
                    <img
                      src={previewCandidate.member.photoUrl}
                      alt={previewCandidate.member.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{previewCandidate.member.name.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-[11px] text-pust-800 font-semibold">
                    {user.departmentCode} · {previewCandidate.groupLabel}
                  </p>
                  <h3 className="font-serif text-lg font-medium text-slate-950 truncate">
                    {previewCandidate.member.name}
                  </h3>
                  <p className="text-xs text-slate-600 truncate">
                    {previewCandidate.member.designation}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewCandidate(null)}
                aria-label="Close preview modal"
                className="p-2 rounded-lg border border-stone-200 bg-white text-slate-600 hover:text-slate-950 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              {previewCandidate.member.bio && (
                <div className="space-y-1">
                  <p className="font-semibold text-slate-900">Biography</p>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                    {previewCandidate.member.bio}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-slate-900">Office &amp; Qualification</p>
                  <p className="text-slate-700 mt-1">
                    {previewCandidate.member.officeLocation || 'Not specified'}
                  </p>
                  {previewCandidate.member.qualification && (
                    <p className="text-slate-600 mt-1">{previewCandidate.member.qualification}</p>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Contact Details</p>
                  <div className="space-y-1 mt-1 font-mono text-[11px] text-slate-700">
                    {previewCandidate.member.emails.map((em, i) => (
                      <p key={i}>
                        {em.value} ({em.type})
                      </p>
                    ))}
                    {previewCandidate.member.phones.map((ph, i) => (
                      <p key={i}>
                        {ph.value} ({ph.type})
                      </p>
                    ))}
                  </div>
                </div>
              </div>
              {previewCandidate.member.researchArea && (
                <div>
                  <p className="font-semibold text-slate-900">Research Area</p>
                  <p className="text-slate-700 mt-1">{previewCandidate.member.researchArea}</p>
                </div>
              )}
              {previewCandidate.member.education &&
                previewCandidate.member.education.length > 0 && (
                  <div>
                    <p className="font-semibold text-slate-900">Education</p>
                    <ul className="list-disc pl-4 text-slate-700 mt-1 space-y-0.5">
                      {previewCandidate.member.education.map((ed, i) => (
                        <li key={i}>{ed}</li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>

            <div className="px-6 py-4 border-t border-stone-200 bg-[#FAF9F6] flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setPreviewCandidate(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium border border-stone-300 bg-white text-slate-700 hover:border-pust-800 cursor-pointer"
              >
                Close
              </button>
              {!claimedMap[previewCandidate.member.id] && (
                <button
                  type="button"
                  disabled={claimingId === previewCandidate.member.id}
                  onClick={() =>
                    void handleClaimProfile(previewCandidate.member, previewCandidate.group)
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-pust-900 text-white hover:bg-pust-950 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>
                    {claimingId === previewCandidate.member.id
                      ? 'Claiming...'
                      : 'Claim This Profile'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
