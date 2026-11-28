'use client';

import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Link2,
  Mail,
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

  // Directory Search & Editor Mode
  const [directorySearch, setDirectorySearch] = useState('');
  const [editorMode, setEditorMode] = useState<'edit_claimed' | 'create_new'>('create_new');
  const [facultyGroup, setFacultyGroup] = useState<'faculty' | 'contractual'>('faculty');
  const [photoSourceMode, setPhotoSourceMode] = useState<'upload' | 'link'>('upload');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [draft, setDraft] = useState<ProfileDraft>(() => draftFromPerson(null, user));

  const applyLoadedState = useCallback(
    (res: {
      user: AuthUser;
      department: DepartmentRecord | null;
      claimedMember: DepartmentPersonRecord | null;
      claimedMap: Record<string, { claimedByMe: boolean; claimedByName?: string }>;
      requests: FacultyProfileRequestRecord[];
    }) => {
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
      } else if (res.claimedMember) {
        setEditorMode('edit_claimed');
        setFacultyGroup(res.user.claimedFacultyGroup || 'faculty');
        setDraft(draftFromPerson(res.claimedMember, res.user));
      } else {
        setEditorMode('create_new');
        setFacultyGroup('faculty');
        setDraft(draftFromPerson(null, res.user));
      }
    },
    [onUserChange]
  );

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await pustApi.getTeacherProfileStatus();
      applyLoadedState(res);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load faculty directory profile status.'
      );
    } finally {
      setLoading(false);
    }
  }, [applyLoadedState]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

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

  async function handleClaimProfile(
    member: DepartmentPersonRecord,
    group: 'faculty' | 'contractual'
  ) {
    setError(null);
    setFeedback(null);
    setClaimingId(member.id);
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
      setFeedback(
        `Claimed "${res.claimedMember.name}" from the ${res.user.departmentCode} directory. You can now propose edits below for Administrator approval.`
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
      setEditorMode('create_new');
      setDraft(draftFromPerson(null, res.user));
      setFeedback(
        'Released claimed directory profile. You may claim another entry or create a new profile for Admin review.'
      );
      await loadStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to release claimed profile.');
    } finally {
      setUnclaiming(false);
    }
  }

  function switchToCreateNewMode() {
    setEditorMode('create_new');
    if (claimedMember && pendingRequest?.requestType !== 'create_new') {
      setDraft(draftFromPerson(null, user));
    }
    setFeedback(null);
    setError(null);
  }

  function switchToEditClaimedMode() {
    if (!claimedMember) return;
    setEditorMode('edit_claimed');
    setFacultyGroup(user.claimedFacultyGroup || 'faculty');
    setDraft(
      draftFromPerson(
        pendingRequest?.requestType === 'edit_claimed'
          ? pendingRequest.proposedProfile
          : claimedMember,
        user
      )
    );
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
          ? `New directory profile for "${res.request.proposedProfile.name}" submitted. It will appear on the public department page once approved by an Administrator.`
          : `Profile update for "${res.request.proposedProfile.name}" submitted and is awaiting Administrator approval.`
      );
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
        <div className="rounded-2xl border border-amber-300 bg-[#FBF6EE] px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-amber-950">
                Pending Administrator Approval
              </p>
              <p className="text-xs text-amber-900">
                Your{' '}
                <span className="font-semibold">
                  {pendingRequest.requestType === 'create_new'
                    ? 'new directory profile'
                    : 'profile edit'}
                </span>{' '}
                submission for <span className="font-semibold">{pendingRequest.proposedProfile.name}</span>{' '}
                ({formatDateTime(pendingRequest.updatedAt)}) is waiting for Admin review. Changes will go live on the public{' '}
                {user.departmentCode} department page once approved.
              </p>
            </div>
          </div>
          <span className="font-mono text-[11px] font-semibold text-amber-900 whitespace-nowrap shrink-0 tabular-nums">
            Awaiting Admin Review
          </span>
        </div>
      )}

      {!pendingRequest && latestFinalizedRequest && latestFinalizedRequest.status === 'rejected' && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-red-950">
              Previous Profile Request Declined by Administrator
            </p>
            <p className="text-xs text-red-900">
              Reviewer Note: {latestFinalizedRequest.adminNote || 'No note provided.'} — Update your profile below and resubmit for review.
            </p>
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

      {/* Section A: Department Directory Claim */}
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
              01. Claim Your Profile in the Department Directory
            </h2>
            <p className="text-xs text-slate-600 max-w-2xl">
              If your name already appears in your department&apos;s faculty roster, claim your profile below to link your account. Not listed in the directory? Switch to create and edit a new profile for Administrator approval.
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

        {/* Current Claim Summary Strip */}
        <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {claimedMember ? (
            <>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-pust-900 text-white flex items-center justify-center font-serif text-sm font-semibold shrink-0 overflow-hidden">
                  {claimedMember.photoUrl && isSafeMediaUrl(claimedMember.photoUrl) ? (
                    <img
                      src={claimedMember.photoUrl}
                      alt={claimedMember.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{claimedMember.name.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Claimed Directory Profile</span>
                  </p>
                  <p className="text-sm font-medium text-slate-950 truncate">
                    {claimedMember.name}{' '}
                    <span className="text-xs font-normal text-slate-600">
                      · {claimedMember.designation}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={switchToEditClaimedMode}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-pust-900 text-white hover:bg-pust-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Edit Claimed Profile</span>
                </button>
                <button
                  type="button"
                  onClick={() => void handleUnclaimProfile()}
                  disabled={unclaiming}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-300 bg-white text-slate-700 hover:border-red-300 hover:text-red-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>{unclaiming ? 'Releasing...' : 'Release Claim'}</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-slate-900">
                  No Directory Profile Claimed Yet
                </p>
                <p className="text-xs text-slate-600">
                  Find your name in the {user.departmentCode} list below to claim it, or click &quot;Not Listed — Create My Profile&quot; to submit a new profile for Admin approval.
                </p>
              </div>
              <button
                type="button"
                onClick={switchToCreateNewMode}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-pust-900 text-white hover:bg-pust-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Not Listed — Create My Profile</span>
              </button>
            </>
          )}
        </div>

        {/* Directory Search + List */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={directorySearch}
                onChange={(e) => setDirectorySearch(e.target.value)}
                placeholder={`Search ${user.departmentCode} faculty by name, designation, or email...`}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-stone-300 bg-[#F7F7F5] text-slate-900 focus:bg-white focus:outline-none focus:border-pust-800"
              />
            </div>
            <button
              type="button"
              onClick={switchToCreateNewMode}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-pust-900 bg-white text-pust-900 hover:bg-pust-900 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Not in Directory? Create New Profile</span>
            </button>
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
                If your profile is not yet listed in the department directory, compose a new profile below and submit it for Administrator approval.
              </p>
              <button
                type="button"
                onClick={switchToCreateNewMode}
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
                    <th className="py-2.5 px-3">Claim Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {directoryEntries.map(({ member, group, groupLabel }, idx) => {
                    const claimInfo = claimedMap[member.id];
                    const claimedByMe =
                      Boolean(claimInfo?.claimedByMe) || claimedMember?.id === member.id;
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
                          {claimedByMe ? (
                            <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Claimed by You</span>
                            </span>
                          ) : claimedByOther ? (
                            <span className="text-slate-500">
                              Claimed by {claimInfo.claimedByName || 'another teacher'}
                            </span>
                          ) : (
                            <span className="text-pust-800 font-medium">Available to Claim</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          {claimedByMe ? (
                            <button
                              type="button"
                              onClick={switchToEditClaimedMode}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              Load into Editor
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={claimedByOther || claimingId === member.id}
                              onClick={() => void handleClaimProfile(member, group)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-pust-900 bg-white text-pust-900 hover:bg-pust-900 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                            >
                              {claimingId === member.id ? 'Claiming...' : 'Claim This Profile'}
                            </button>
                          )}
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

      {/* Section B: Faculty Profile Editor (Admin Approval Required) */}
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
              02. {editorMode === 'edit_claimed' ? 'Edit Claimed Faculty Profile' : 'Create & Edit New Directory Profile'}
            </h2>
            <p className="text-xs text-slate-600">
              {editorMode === 'edit_claimed' && claimedMember
                ? `Proposing updates for "${claimedMember.name}" (${user.departmentCode}). Live public profile stays unchanged until an Administrator approves your submission.`
                : `Composing a new faculty entry for the ${user.departmentCode} Department directory. Upon Administrator approval, this profile will be published and automatically claimed by your account.`}
            </p>
          </div>

          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-stone-100 border border-stone-200 shrink-0 self-start lg:self-auto">
            {claimedMember && (
              <button
                type="button"
                onClick={switchToEditClaimedMode}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  editorMode === 'edit_claimed'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Edit Claimed Profile
              </button>
            )}
            <button
              type="button"
              onClick={switchToCreateNewMode}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                editorMode === 'create_new'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create New Profile
            </button>
          </div>
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
                onChange={(e) => setDraft((prev) => ({ ...prev, officeLocation: e.target.value }))}
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
                onChange={(e) => setDraft((prev) => ({ ...prev, qualification: e.target.value }))}
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
            <span>Currently on Study Leave (displays official Study Leave badge on department page)</span>
          </label>

          <label className="block space-y-1 text-xs">
            <span className="font-semibold text-slate-700">Academic Biography</span>
            <textarea
              rows={3}
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
          {/* Phones */}
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

          {/* Emails */}
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
            Submitted profiles remain in a <span className="font-semibold text-slate-900">Pending Approval</span> state until verified by a University Administrator.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {claimedMember && editorMode === 'edit_claimed' && (
              <button
                type="button"
                onClick={() => setDraft(draftFromPerson(claimedMember, user))}
                className="px-3.5 py-2 rounded-lg text-xs font-medium border border-stone-300 bg-[#F7F7F5] text-slate-700 hover:border-pust-800 hover:text-slate-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Reset to Live Directory Values
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
                  ? 'Submit New Profile for Admin Approval'
                  : 'Submit Edit for Admin Approval'}
              </span>
            </button>
          </div>
        </div>
      </form>

      {/* Section C: Submission History Ledger */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-2 border-b border-stone-200 pb-3">
          <div>
            <h3 className="font-serif text-lg font-medium text-slate-950">
              03. Profile Approval Submission History
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
            No profile change requests submitted yet. Use Section 02 above to submit an edit or create a new directory entry.
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
    </div>
  );
}
