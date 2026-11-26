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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { SkeletonTheme } from 'react-loading-skeleton';
import { pustApi } from '../lib/api';
import { getRouteSectionKey, parseRouteFromPath, type AppRoute } from '../lib/routes';
import { PageReveal } from './MotionPrimitives';
import { OfflineIndicator, PwaRegistrar } from './PwaManager';
import { GoToTopButton, ScrollMarkerBar } from './ScrollControls';
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
  const mountedRef = useRef(true);
  const isNavigating = isTransitionPending || pendingTarget !== null;
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 15 * 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

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

  const scrollToHashId = useCallback((hashId: string) => {
    if (typeof window === 'undefined' || !hashId) return;
    const cleanId = decodeURIComponent(hashId.replace(/^#/, ''));
    if (!cleanId) return;
    let attempts = 0;
    const tryScroll = () => {
      const targetEl = document.getElementById(cleanId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      if (attempts < 8) {
        attempts += 1;
        window.setTimeout(tryScroll, 80);
      }
    };
    window.requestAnimationFrame(tryScroll);
  }, []);

  useEffect(() => {
    setPendingTarget(null);
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      if (typeof window !== 'undefined') {
        if (window.location.hash) {
          scrollToHashId(window.location.hash);
        } else {
          window.scrollTo({ top: 0, behavior: 'auto' });
        }
      }
    }
  }, [pathname, scrollToHashId]);

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
      let targetPath = target;
      let targetSearch = '';
      let targetHash = '';
      try {
        const parsed = new URL(target, 'http://localhost');
        targetPath = parsed.pathname || '/';
        targetSearch = parsed.search || '';
        targetHash = parsed.hash ? parsed.hash.slice(1) : '';
      } catch {
        // Fallback if target cannot be parsed as URL
      }

      if (targetPath === pathname) {
        if (typeof window !== 'undefined') {
          const currentSearch = window.location.search || '';
          if (targetSearch !== currentSearch || (targetHash && `#${targetHash}` !== window.location.hash)) {
            startTransition(() => {
              router.push(target);
            });
          }
          if (targetHash) {
            scrollToHashId(targetHash);
          } else if (targetSearch === currentSearch) {
            window.scrollTo({ top: 0, behavior: 'auto' });
          }
        }
        return;
      }

      const sameSection = getRouteSectionKey(targetPath) === getRouteSectionKey(pathname);
      if (!sameSection) {
        setPendingTarget(target);
      }
      startTransition(() => {
        router.push(target);
      });
    },
    [router, pathname, startTransition, scrollToHashId]
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
    await queryClient.invalidateQueries({ queryKey: ['department'] });
  }, [queryClient]);

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
        if (!mountedRef.current) return;
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
          if (!mountedRef.current) return;
          setBookmarks(bmRes.bookmarks);
        }
      } else {
        const [meRes, statusRes] = await Promise.all([
          pustApi.getMe(),
          pustApi.getBootstrapStatus(),
        ]);
        if (!mountedRef.current) return;
        setUser(meRes.user);
        setAuthResolved(true);
        setBootstrapStatus(statusRes);
        if (meRes.user) {
          const [bmRes, noticeRes, profileRes] = await Promise.all([
            pustApi.getBookmarks().catch(() => ({ bookmarks: [] })),
            pustApi.getNotices().catch(() => null),
            pustApi.getUniversityProfile().catch(() => null),
          ]);
          if (!mountedRef.current) return;
          setBookmarks(bmRes.bookmarks);
          if (noticeRes && Array.isArray(noticeRes.notices)) {
            setNotices(noticeRes.notices);
          }
          if (profileRes) {
            if (profileRes.profile) setProfile(profileRes.profile);
            if (Array.isArray(profileRes.aboutSections)) setAboutSections(profileRes.aboutSections);
            if (Array.isArray(profileRes.vcProfiles)) setVcProfiles(profileRes.vcProfiles);
            if (Array.isArray(profileRes.galleryItems)) setGalleryItems(profileRes.galleryItems);
            if (Array.isArray(profileRes.bannerSlides)) setBannerSlides(profileRes.bannerSlides);
          }
        }
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setAuthResolved(true);
      setDataError(err instanceof Error ? err.message : 'Unable to load university records.');
    } finally {
      if (mountedRef.current) {
        setAuthResolved(true);
        setLoadingData(false);
      }
    }
  }, [initialData]);

  const retryLoad = useCallback(() => bootstrapData(true), [bootstrapData]);

  useEffect(() => {
    mountedRef.current = true;
    void bootstrapData(!initialData);
    return () => {
      mountedRef.current = false;
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
    <QueryClientProvider client={queryClient}>
      <SkeletonTheme baseColor="#EAE4D8" highlightColor="#FBF9F5" borderRadius={8}>
        <MotionConfig reducedMotion="user">
          <PustContext.Provider value={value}>
          <div
            data-edit-mode={effectiveEditMode ? 'true' : undefined}
            className="min-h-screen flex flex-col bg-[#F7F7F5] text-slate-900"
          >
            <AnimatePresence>
              {isNavigating && (
                <motion.div
                  aria-hidden="true"
                  initial={{ scaleX: 0.08, opacity: 0 }}
                  animate={{ scaleX: 0.86, opacity: 1 }}
                  exit={{ scaleX: 1, opacity: 0 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  style={{ transformOrigin: 'left center' }}
                  className="fixed top-0 left-0 right-0 z-[70] h-[2.5px] bg-gradient-to-r from-pust-600 via-gold-500 to-pust-700 pointer-events-none"
                />
              )}
            </AnimatePresence>
            <Navbar
              route={route}
              user={user}
              profile={profile}
              editMode={effectiveEditMode}
              onToggleEditMode={toggleEditMode}
              onOpenEditModal={openEditModal}
              onNavigate={navigateTo}
            />
            <div className="flex-1 flex flex-col">
              <Breadcrumb />
              <PageReveal routeKey={getRouteSectionKey(pathname)}>
                {children}
              </PageReveal>
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
          <ScrollMarkerBar />
          <GoToTopButton />
        </PustContext.Provider>
      </MotionConfig>
    </SkeletonTheme>
    </QueryClientProvider>
  );
}
