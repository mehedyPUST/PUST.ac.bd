'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { MotionConfig } from 'motion/react';
import { SkeletonTheme } from 'react-loading-skeleton';
import { pustApi } from '../lib/api';
import { parseRouteFromPath, type AppRoute } from '../lib/routes';
import { PageReveal } from './MotionPrimitives';
import { OfflineIndicator, PwaRegistrar } from './PwaManager';
import type {
  AboutContentRecord,
  AuthUser,
  BannerSlideRecord,
  BookmarkRecord,
  BootstrapStatus,
  DepartmentRecord,
  EditModalTarget,
  GalleryItemRecord,
  InquiryRecord,
  NoticeRecord,
  PublicationRecord,
  UniversityProfile,
  ViceChancellorRecord,
} from '../types/pust';
import { AdminEditModal } from './AdminEditModal';
import { Breadcrumb } from './Breadcrumb';
import { DepartmentModal } from './DepartmentModal';
import { Footer } from './Footer';
import { Navbar } from './Navbar';
import { NoticeModal } from './NoticeModal';

interface PustContextValue {
  route: AppRoute;
  profile: UniversityProfile | null;
  aboutSections: AboutContentRecord[];
  vcProfiles: ViceChancellorRecord[];
  galleryItems: GalleryItemRecord[];
  bannerSlides: BannerSlideRecord[];
  departments: DepartmentRecord[];
  publications: PublicationRecord[];
  notices: NoticeRecord[];
  loadingData: boolean;
  dataError: string | null;
  user: AuthUser | null;
  bookmarks: BookmarkRecord[];
  bookmarkedIds: Set<string>;
  bootstrapStatus: BootstrapStatus;
  editMode: boolean;
  setEditMode: (enabled: boolean) => void;
  toggleEditMode: () => void;
  openEditModal: (target: EditModalTarget) => void;
  closeEditModal: () => void;
  setUser: (user: AuthUser | null) => void;
  isNavigating: boolean;
  prefetchRoute: (target: AppRoute | string) => void;
  navigateTo: (target: AppRoute | string) => void;
  setActiveDepartment: (dept: DepartmentRecord | null) => void;
  setActiveNotice: (notice: NoticeRecord | null) => void;
  loadCmsProfile: () => Promise<void>;
  loadNotices: () => Promise<void>;
  loadDepartments: () => Promise<void>;
  loadPublications: () => Promise<void>;
  loadBookmarks: () => Promise<void>;
  retryLoad: () => Promise<void>;
  submitInquiry: (payload: {
    fullName: string;
    email: string;
    phone: string;
    programLevel: InquiryRecord['programLevel'];
    departmentCode: string;
    message: string;
  }) => Promise<InquiryRecord>;
}

const PustContext = createContext<PustContextValue | null>(null);

export function usePust(): PustContextValue {
  const ctx = useContext(PustContext);
  if (!ctx) {
    throw new Error('usePust must be used within PustShell');
  }
  return ctx;
}

export interface PustInitialData {
  profile: UniversityProfile;
  aboutSections: AboutContentRecord[];
  vcProfiles: ViceChancellorRecord[];
  galleryItems: GalleryItemRecord[];
  bannerSlides: BannerSlideRecord[];
  departments: DepartmentRecord[];
  publications: PublicationRecord[];
  notices: NoticeRecord[];
}

export function PustShell({
  children,
  initialData,
}: {
  children: ReactNode;
  initialData?: PustInitialData;
}) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const route = parseRouteFromPath(pathname);

  const [profile, setProfile] = useState<UniversityProfile | null>(initialData?.profile ?? null);
  const [aboutSections, setAboutSections] = useState<AboutContentRecord[]>(
    initialData?.aboutSections ?? []
  );
  const [vcProfiles, setVcProfiles] = useState<ViceChancellorRecord[]>(
    initialData?.vcProfiles ?? []
  );
  const [galleryItems, setGalleryItems] = useState<GalleryItemRecord[]>(
    initialData?.galleryItems ?? []
  );
  const [bannerSlides, setBannerSlides] = useState<BannerSlideRecord[]>(
    initialData?.bannerSlides ?? []
  );
  const [departments, setDepartments] = useState<DepartmentRecord[]>(
    initialData?.departments ?? []
  );
  const [publications, setPublications] = useState<PublicationRecord[]>(
    initialData?.publications ?? []
  );
  const [notices, setNotices] = useState<NoticeRecord[]>(initialData?.notices ?? []);
  const [loadingData, setLoadingData] = useState(!initialData);
  const [dataError, setDataError] = useState<string | null>(null);

  const [user, setUser] = useState<AuthUser | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkRecord[]>([]);
  const [bootstrapStatus, setBootstrapStatus] = useState<BootstrapStatus>({
    adminConfigured: false,
    envAdminActive: false,
    storageBackend: 'memory',
  });

  const [activeDepartment, setActiveDepartment] = useState<DepartmentRecord | null>(null);
  const [activeNotice, setActiveNotice] = useState<NoticeRecord | null>(null);
  const [editMode, setEditModeState] = useState(false);
  const [editTarget, setEditTarget] = useState<EditModalTarget | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [isTransitionPending, startTransition] = useTransition();
  const [pendingTarget, setPendingTarget] = useState<string | null>(null);
  const prevPathnameRef = useRef(pathname);
  const isNavigating = isTransitionPending || pendingTarget !== null;

  const isAdmin = user?.role === 'admin';
  const effectiveEditMode = isAdmin && editMode;

  useEffect(() => {
    if (!user) {
      setBookmarks([]);
    }
  }, [user]);

  useEffect(() => {
    if (typeof window === 'undefined' || !authResolved) return;
    if (!isAdmin) {
      setEditModeState(false);
      setEditTarget(null);
      try {
        window.sessionStorage.removeItem('pust_admin_edit_mode');
      } catch {
        // ignore storage errors
      }
      return;
    }
    try {
      if (window.sessionStorage.getItem('pust_admin_edit_mode') === '1') {
        setEditModeState(true);
      }
    } catch {
      // ignore storage errors
    }
  }, [isAdmin, authResolved]);

  const setEditMode = useCallback(
    (enabled: boolean) => {
      if (!isAdmin) {
        setEditModeState(false);
        return;
      }
      setEditModeState(enabled);
      if (typeof window !== 'undefined') {
        try {
          if (enabled) {
            window.sessionStorage.setItem('pust_admin_edit_mode', '1');
          } else {
            window.sessionStorage.removeItem('pust_admin_edit_mode');
          }
        } catch {
          // ignore storage errors
        }
      }
    },
    [isAdmin]
  );

  const toggleEditMode = useCallback(() => {
    if (!isAdmin) return;
    setEditModeState((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        try {
          if (next) {
            window.sessionStorage.setItem('pust_admin_edit_mode', '1');
          } else {
            window.sessionStorage.removeItem('pust_admin_edit_mode');
          }
        } catch {
          // ignore storage errors
        }
      }
      return next;
    });
  }, [isAdmin]);

  const openEditModal = useCallback(
    (target: EditModalTarget) => {
      if (!isAdmin) return;
      setEditTarget(target);
    },
    [isAdmin]
  );

  const closeEditModal = useCallback(() => {
    setEditTarget(null);
  }, []);

  useEffect(() => {
    setPendingTarget(null);
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    }
  }, [pathname]);

  useEffect(() => {
    if (!pendingTarget) return;
    const timer = window.setTimeout(() => {
      setPendingTarget(null);
    }, 15000);
    return () => window.clearTimeout(timer);
  }, [pendingTarget]);

  const prefetchRoute = useCallback(
    (target: AppRoute | string) => {
      try {
        router.prefetch(target);
      } catch {
        // Ignore prefetch errors
      }
    },
    [router]
  );

  const navigateTo = useCallback(
    (target: AppRoute | string) => {
      if (target === pathname) {
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'auto' });
        }
        return;
      }
      setPendingTarget(target);
      startTransition(() => {
        router.push(target);
      });
    },
    [router, pathname, startTransition]
  );

  const loadCmsProfile = useCallback(async () => {
    const profileRes = await pustApi.getUniversityProfile();
    setProfile(profileRes.profile ?? null);
    setAboutSections(Array.isArray(profileRes.aboutSections) ? profileRes.aboutSections : []);
    setVcProfiles(Array.isArray(profileRes.vcProfiles) ? profileRes.vcProfiles : []);
    setGalleryItems(Array.isArray(profileRes.galleryItems) ? profileRes.galleryItems : []);
    setBannerSlides(Array.isArray(profileRes.bannerSlides) ? profileRes.bannerSlides : []);
  }, []);

  const loadNotices = useCallback(async () => {
    const res = await pustApi.getNotices();
    setNotices(res.notices);
    setActiveNotice((curr) => (curr ? res.notices.find((n) => n.id === curr.id) ?? null : null));
  }, []);

  const loadDepartments = useCallback(async () => {
    const res = await pustApi.getDepartments();
    setDepartments(res.departments);
    setActiveDepartment((curr) =>
      curr ? res.departments.find((d) => d.id === curr.id) ?? null : null
    );
  }, []);

  const loadPublications = useCallback(async () => {
    const res = await pustApi.getPublications();
    setPublications(res.publications);
  }, []);

  const loadBookmarks = useCallback(async () => {
    try {
      const res = await pustApi.getBookmarks();
      setBookmarks(res.bookmarks);
    } catch {
      setBookmarks([]);
    }
  }, []);

  const bootstrapData = useCallback(async (forceFullRefresh: boolean) => {
    if (forceFullRefresh) {
      setLoadingData(true);
    }
    setDataError(null);
    try {
      if (forceFullRefresh || !initialData) {
        const [profileRes, deptRes, pubRes, noticeRes, meRes, statusRes] = await Promise.all([
          pustApi.getUniversityProfile(),
          pustApi.getDepartments(),
          pustApi.getPublications(),
          pustApi.getNotices(),
          pustApi.getMe(),
          pustApi.getBootstrapStatus(),
        ]);
        setProfile(profileRes.profile ?? null);
        setAboutSections(Array.isArray(profileRes.aboutSections) ? profileRes.aboutSections : []);
        setVcProfiles(Array.isArray(profileRes.vcProfiles) ? profileRes.vcProfiles : []);
        setGalleryItems(Array.isArray(profileRes.galleryItems) ? profileRes.galleryItems : []);
        setBannerSlides(Array.isArray(profileRes.bannerSlides) ? profileRes.bannerSlides : []);
        setDepartments(Array.isArray(deptRes.departments) ? deptRes.departments : []);
        setPublications(Array.isArray(pubRes.publications) ? pubRes.publications : []);
        setNotices(Array.isArray(noticeRes.notices) ? noticeRes.notices : []);
        setUser(meRes.user);
        setAuthResolved(true);
        setBootstrapStatus(statusRes);
        if (meRes.user) {
          const bmRes = await pustApi.getBookmarks().catch(() => ({ bookmarks: [] }));
          setBookmarks(bmRes.bookmarks);
        }
      } else {
        const [meRes, statusRes] = await Promise.all([
          pustApi.getMe(),
          pustApi.getBootstrapStatus(),
        ]);
        setUser(meRes.user);
        setAuthResolved(true);
        setBootstrapStatus(statusRes);
        if (meRes.user) {
          const [bmRes, noticeRes] = await Promise.all([
            pustApi.getBookmarks().catch(() => ({ bookmarks: [] })),
            pustApi.getNotices().catch(() => null),
          ]);
          setBookmarks(bmRes.bookmarks);
          if (noticeRes && Array.isArray(noticeRes.notices)) {
            setNotices(noticeRes.notices);
          }
        }
      }
    } catch (err) {
      setAuthResolved(true);
      setDataError(err instanceof Error ? err.message : 'Unable to load university records.');
    } finally {
      setAuthResolved(true);
      setLoadingData(false);
    }
  }, [initialData]);

  const retryLoad = useCallback(() => bootstrapData(true), [bootstrapData]);

  useEffect(() => {
    let active = true;
    if (!active) return;
    bootstrapData(!initialData);
    return () => {
      active = false;
    };
  }, [initialData, bootstrapData]);

  const bookmarkedIds = useMemo(() => new Set(bookmarks.map((b) => b.itemId)), [bookmarks]);

  const handleToggleBookmarkDepartment = useCallback(
    async (dept: DepartmentRecord) => {
      if (!user) return;
      try {
        if (bookmarkedIds.has(dept.id)) {
          await pustApi.removeBookmark(dept.id);
        } else {
          await pustApi.addBookmark({
            itemType: 'department',
            itemId: dept.id,
            title: `Department of ${dept.name} (${dept.code})`,
            subtitle: dept.faculty,
          });
        }
        await loadBookmarks();
      } catch (err) {
        setDataError(err instanceof Error ? err.message : 'Unable to update department bookmark.');
      }
    },
    [user, bookmarkedIds, loadBookmarks]
  );

  const handleToggleBookmarkNotice = useCallback(
    async (notice: NoticeRecord) => {
      if (!user) return;
      try {
        if (bookmarkedIds.has(notice.id)) {
          await pustApi.removeBookmark(notice.id);
        } else {
          await pustApi.addBookmark({
            itemType: 'notice',
            itemId: notice.id,
            title: notice.title,
            subtitle: `${notice.referenceNo} · ${notice.publishedAt}`,
          });
        }
        await loadBookmarks();
      } catch (err) {
        setDataError(err instanceof Error ? err.message : 'Unable to update notice bookmark.');
      }
    },
    [user, bookmarkedIds, loadBookmarks]
  );

  const handleDeleteNotice = useCallback(
    async (id: string) => {
      try {
        await pustApi.deleteNotice(id);
        setActiveNotice(null);
        await loadNotices();
      } catch (err) {
        setDataError(err instanceof Error ? err.message : 'Unable to remove notice.');
      }
    },
    [loadNotices]
  );

  const submitInquiry = useCallback(
    async (payload: {
      fullName: string;
      email: string;
      phone: string;
      programLevel: InquiryRecord['programLevel'];
      departmentCode: string;
      message: string;
    }) => {
      const res = await pustApi.submitInquiry(payload);
      return res.inquiry;
    },
    []
  );

  const value = useMemo<PustContextValue>(
    () => ({
      route,
      profile,
      aboutSections,
      vcProfiles,
      galleryItems,
      bannerSlides,
      departments,
      publications,
      notices,
      loadingData,
      dataError,
      user,
      bookmarks,
      bookmarkedIds,
      bootstrapStatus,
      editMode: effectiveEditMode,
      setEditMode,
      toggleEditMode,
      openEditModal,
      closeEditModal,
      setUser,
      isNavigating,
      prefetchRoute,
      navigateTo,
      setActiveDepartment,
      setActiveNotice,
      loadCmsProfile,
      loadNotices,
      loadDepartments,
      loadPublications,
      loadBookmarks,
      retryLoad,
      submitInquiry,
    }),
    [
      route,
      profile,
      aboutSections,
      vcProfiles,
      galleryItems,
      bannerSlides,
      departments,
      publications,
      notices,
      loadingData,
      dataError,
      user,
      bookmarks,
      bookmarkedIds,
      bootstrapStatus,
      effectiveEditMode,
      setEditMode,
      toggleEditMode,
      openEditModal,
      closeEditModal,
      isNavigating,
      prefetchRoute,
      navigateTo,
      loadCmsProfile,
      loadNotices,
      loadDepartments,
      loadPublications,
      loadBookmarks,
      retryLoad,
      submitInquiry,
    ]
  );

  return (
    <SkeletonTheme baseColor="#EAE4D8" highlightColor="#FBF9F5" borderRadius={8}>
      <MotionConfig reducedMotion="user">
        <PustContext.Provider value={value}>
          <div
            data-edit-mode={effectiveEditMode ? 'true' : undefined}
            className="min-h-screen flex flex-col bg-[#F7F7F5] text-slate-900"
          >
            {isNavigating && (
              <>
                <div
                  aria-hidden="true"
                  className="fixed top-0 left-0 right-0 z-[70] h-[3px] bg-pust-900/15 overflow-hidden pointer-events-none"
                >
                  <div className="h-full w-1/2 bg-pust-800 animate-pulse" />
                </div>
                <div
                  role="status"
                  aria-live="polite"
                  className="fixed top-20 left-1/2 -translate-x-1/2 z-[65] pointer-events-none rounded-xl border border-pust-800/30 bg-white shadow-lg px-4 py-2.5 flex items-center gap-2.5 text-xs font-semibold text-slate-900"
                >
                  <Loader2 className="w-4 h-4 animate-spin text-pust-800 shrink-0" />
                  <span>
                    {pendingTarget?.startsWith('/academics/departments/')
                      ? 'Loading department page...'
                      : 'Loading page...'}
                  </span>
                </div>
              </>
            )}
            <Navbar
              route={route}
              user={user}
              profile={profile}
              editMode={effectiveEditMode}
              onToggleEditMode={toggleEditMode}
              onOpenEditModal={openEditModal}
              onNavigate={navigateTo}
            />
            <Breadcrumb />
            <div className="flex-1 flex flex-col">
              <PageReveal routeKey={pathname}>{children}</PageReveal>
            </div>
            <Footer onNavigate={navigateTo} />
          </div>

          <DepartmentModal
            department={activeDepartment}
            onClose={() => setActiveDepartment(null)}
            user={user}
            isBookmarked={activeDepartment ? bookmarkedIds.has(activeDepartment.id) : false}
            onToggleBookmark={handleToggleBookmarkDepartment}
            onOpenPortal={() => navigateTo('/portal')}
            editMode={effectiveEditMode}
            onEditDepartment={(dept) => openEditModal({ kind: 'department', department: dept })}
          />

          <NoticeModal
            notice={activeNotice}
            onClose={() => setActiveNotice(null)}
            user={user}
            isBookmarked={activeNotice ? bookmarkedIds.has(activeNotice.id) : false}
            onToggleBookmark={handleToggleBookmarkNotice}
            onDeleteNotice={handleDeleteNotice}
            onOpenPortal={() => navigateTo('/portal')}
            editMode={effectiveEditMode}
            onEditNotice={(n) => openEditModal({ kind: 'notice', notice: n })}
          />

          <AdminEditModal
            target={editTarget}
            onClose={closeEditModal}
            profile={profile}
            aboutSections={aboutSections}
            vcProfiles={vcProfiles}
            bannerSlides={bannerSlides}
            departments={departments}
            onRefreshProfile={loadCmsProfile}
            onRefreshNotices={loadNotices}
            onRefreshDepartments={loadDepartments}
            onRefreshPublications={loadPublications}
          />
          <PwaRegistrar />
          <OfflineIndicator />
        </PustContext.Provider>
      </MotionConfig>
    </SkeletonTheme>
  );
}
