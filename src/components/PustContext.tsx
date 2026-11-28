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
import {
  isDepartmentTab,
  parseDepartmentPath,
  type DepartmentTab,
} from '../lib/departmentNav';
import { buildStudentClassSchedules } from '../lib/studentDashboard';
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
  CertificateApplicationRecord,
  ClassScheduleSlot,
  CourseRecord,
  DepartmentRecord,
  EditModalTarget,
  ExamApplicationRecord,
  ExamResultRecord,
  FeeConfig,
  GalleryItemRecord,
  HallDueRecord,
  InquiryRecord,
  NoticeRecord,
  PaymentReceiptRecord,
  PublicationRecord,
  StudentRecord,
  UniversityProfile,
  ViceChancellorRecord,
} from '../types/pust';
import { AdminCmsDirectoryModal } from './AdminCmsDirectoryModal';
import { AdminEditModal } from './AdminEditModal';
import { Breadcrumb } from './Breadcrumb';
import { DepartmentModal } from './DepartmentModal';
import { DepartmentNavbar } from './DepartmentNavbar';
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
  cmsDirectoryOpen: boolean;
  openCmsDirectory: () => void;
  closeCmsDirectory: () => void;
  openEditModal: (target: EditModalTarget) => void;
  closeEditModal: () => void;
  setUser: (user: AuthUser | null) => void;
  isNavigating: boolean;
  departmentTab: DepartmentTab;
  setDepartmentTab: (tab: DepartmentTab, options?: { scrollToTop?: boolean }) => void;
  prefetchRoute: (target: AppRoute | string) => void;
  navigateTo: (target: AppRoute | string) => void;
  setActiveDepartment: (dept: DepartmentRecord | null) => void;
  setActiveNotice: (notice: NoticeRecord | null) => void;
  loadCmsProfile: () => Promise<void>;
  loadNotices: () => Promise<void>;
  loadDepartments: () => Promise<void>;
  loadPublications: () => Promise<void>;
  loadBookmarks: () => Promise<void>;
  studentProfile: StudentRecord | null;
  studentExamResults: ExamResultRecord[];
  studentCourses: CourseRecord[];
  studentClassSchedules: ClassScheduleSlot[];
  studentExamApplications: ExamApplicationRecord[];
  studentHallDues: HallDueRecord[];
  studentCertificateApps: CertificateApplicationRecord[];
  studentPaymentReceipts: PaymentReceiptRecord[];
  studentFeeConfig: FeeConfig | null;
  studentHallClearanceBlocked: boolean;
  loadingStudentDashboard: boolean;
  studentDashboardError: string | null;
  loadStudentDashboard: () => Promise<void>;
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
  const parsedDepartmentRoute = useMemo(() => parseDepartmentPath(pathname), [pathname]);
  const [departmentTab, setDepartmentTabState] = useState<DepartmentTab>('overview');

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

  const [studentProfile, setStudentProfile] = useState<StudentRecord | null>(null);
  const [studentExamResults, setStudentExamResults] = useState<ExamResultRecord[]>([]);
  const [studentCourses, setStudentCourses] = useState<CourseRecord[]>([]);
  const [studentExamApplications, setStudentExamApplications] = useState<ExamApplicationRecord[]>(
    []
  );
  const [studentHallDues, setStudentHallDues] = useState<HallDueRecord[]>([]);
  const [studentCertificateApps, setStudentCertificateApps] = useState<
    CertificateApplicationRecord[]
  >([]);
  const [studentPaymentReceipts, setStudentPaymentReceipts] = useState<PaymentReceiptRecord[]>([]);
  const [studentFeeConfig, setStudentFeeConfig] = useState<FeeConfig | null>(null);
  const [studentHallClearanceBlocked, setStudentHallClearanceBlocked] = useState(false);
  const [loadingStudentDashboard, setLoadingStudentDashboard] = useState(false);
  const [studentDashboardError, setStudentDashboardError] = useState<string | null>(null);

  const [activeDepartment, setActiveDepartment] = useState<DepartmentRecord | null>(null);
  const [activeNotice, setActiveNotice] = useState<NoticeRecord | null>(null);
  const [editMode, setEditModeState] = useState(false);
  const [cmsDirectoryOpen, setCmsDirectoryOpen] = useState(false);
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

  const userId = user?.id ?? null;
  const userRole = user?.role ?? null;
  const userDepartmentCode = user?.departmentCode ?? '';
  const userSession = user?.session ?? '';

  useEffect(() => {
    if (!userId) {
      setBookmarks([]);
    }
  }, [userId]);

  const loadStudentDashboard = useCallback(async () => {
    if (!userId || userRole !== 'student') {
      setStudentProfile(null);
      setStudentExamResults([]);
      setStudentCourses([]);
      setStudentExamApplications([]);
      setStudentHallDues([]);
      setStudentCertificateApps([]);
      setStudentPaymentReceipts([]);
      setStudentFeeConfig(null);
      setStudentHallClearanceBlocked(false);
      setLoadingStudentDashboard(false);
      setStudentDashboardError(null);
      return;
    }

    setLoadingStudentDashboard(true);
    setStudentDashboardError(null);

    try {
      const [studentsRes, examsRes, hallsRes, receiptsRes, certsRes] = await Promise.allSettled([
        pustApi.getStudents(
          userDepartmentCode ? { department: userDepartmentCode } : undefined
        ),
        pustApi.getExamsOverview(),
        pustApi.getHallsOverview(),
        pustApi.getPaymentReceipts(),
        pustApi.getCertificatesOverview(),
      ]);

      if (!mountedRef.current) return;

      const resolvedStudent =
        studentsRes.status === 'fulfilled' && studentsRes.value.students.length > 0
          ? studentsRes.value.students[0]
          : certsRes.status === 'fulfilled'
            ? certsRes.value.student
            : null;
      setStudentProfile(resolvedStudent ?? null);

      if (examsRes.status === 'fulfilled') {
        setStudentExamResults(examsRes.value.results);
        setStudentCourses(examsRes.value.courses);
        setStudentExamApplications(examsRes.value.applications);
        setStudentHallClearanceBlocked(Boolean(examsRes.value.hallClearanceBlocked));
      } else {
        setStudentExamResults([]);
        setStudentCourses([]);
        setStudentExamApplications([]);
        setStudentHallClearanceBlocked(false);
      }

      if (hallsRes.status === 'fulfilled') {
        setStudentHallDues(hallsRes.value.dues);
      } else {
        setStudentHallDues([]);
      }

      if (receiptsRes.status === 'fulfilled') {
        setStudentPaymentReceipts(receiptsRes.value.receipts);
      } else {
        setStudentPaymentReceipts([]);
      }

      if (certsRes.status === 'fulfilled') {
        setStudentCertificateApps(certsRes.value.applications);
        setStudentFeeConfig(certsRes.value.feeConfig);
      } else {
        setStudentCertificateApps([]);
        setStudentFeeConfig(null);
      }

      const settled = [studentsRes, examsRes, hallsRes, receiptsRes, certsRes];
      const allRejected = settled.every((r) => r.status === 'rejected');
      if (allRejected) {
        const firstReason = settled.find((r) => r.status === 'rejected') as
          | PromiseRejectedResult
          | undefined;
        setStudentDashboardError(
          firstReason?.reason instanceof Error
            ? firstReason.reason.message
            : 'Unable to load student academic and fee records.'
        );
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setStudentDashboardError(
        err instanceof Error
          ? err.message
          : 'Unable to load student academic and fee records.'
      );
    } finally {
      if (mountedRef.current) {
        setLoadingStudentDashboard(false);
      }
    }
  }, [userId, userRole, userDepartmentCode]);

  useEffect(() => {
    void loadStudentDashboard();
  }, [loadStudentDashboard]);

  const studentProfileSemester = studentProfile?.currentSemester;
  const studentProfileSession = studentProfile?.session;

  const studentClassSchedules = useMemo(
    () =>
      buildStudentClassSchedules({
        courses: studentCourses,
        departments,
        departmentCode: userDepartmentCode || undefined,
        currentSemester: studentProfileSemester,
        session: studentProfileSession || userSession || undefined,
      }),
    [
      studentCourses,
      departments,
      userDepartmentCode,
      studentProfileSemester,
      studentProfileSession,
      userSession,
    ]
  );

  const ADMIN_EDIT_MODE_STORAGE_KEY = 'pust_admin_edit_mode';

  const persistEditModePreference = useCallback((enabled: boolean) => {
    if (typeof window === 'undefined') return;
    try {
      if (enabled) {
        window.localStorage.setItem(ADMIN_EDIT_MODE_STORAGE_KEY, '1');
        window.sessionStorage.setItem(ADMIN_EDIT_MODE_STORAGE_KEY, '1');
      } else {
        window.localStorage.removeItem(ADMIN_EDIT_MODE_STORAGE_KEY);
        window.sessionStorage.removeItem(ADMIN_EDIT_MODE_STORAGE_KEY);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !authResolved) return;
    if (!isAdmin) {
      setEditModeState(false);
      setCmsDirectoryOpen(false);
      setEditTarget(null);
      persistEditModePreference(false);
      return;
    }
    try {
      const saved =
        window.localStorage.getItem(ADMIN_EDIT_MODE_STORAGE_KEY) === '1' ||
        window.sessionStorage.getItem(ADMIN_EDIT_MODE_STORAGE_KEY) === '1';
      if (saved) {
        setEditModeState(true);
        window.localStorage.setItem(ADMIN_EDIT_MODE_STORAGE_KEY, '1');
      }
    } catch {
      // ignore storage errors
    }
  }, [isAdmin, authResolved, persistEditModePreference]);

  useEffect(() => {
    if (typeof window === 'undefined' || !isAdmin) return;
    function handleStorageSync(event: StorageEvent) {
      if (event.key !== ADMIN_EDIT_MODE_STORAGE_KEY) return;
      setEditModeState(event.newValue === '1');
    }
    window.addEventListener('storage', handleStorageSync);
    return () => window.removeEventListener('storage', handleStorageSync);
  }, [isAdmin]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (effectiveEditMode) {
      document.body.setAttribute('data-edit-mode', 'true');
    } else {
      document.body.removeAttribute('data-edit-mode');
    }
    return () => {
      document.body.removeAttribute('data-edit-mode');
    };
  }, [effectiveEditMode]);

  const setEditMode = useCallback(
    (enabled: boolean) => {
      if (!isAdmin) {
        setEditModeState(false);
        persistEditModePreference(false);
        return;
      }
      setEditModeState(enabled);
      persistEditModePreference(enabled);
    },
    [isAdmin, persistEditModePreference]
  );

  const toggleEditMode = useCallback(() => {
    if (!isAdmin) return;
    setEditModeState((prev) => {
      const next = !prev;
      persistEditModePreference(next);
      return next;
    });
  }, [isAdmin, persistEditModePreference]);

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

  const openCmsDirectory = useCallback(() => {
    if (!isAdmin) return;
    setCmsDirectoryOpen(true);
  }, [isAdmin]);

  const closeCmsDirectory = useCallback(() => {
    setCmsDirectoryOpen(false);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !isAdmin) return;
    function handleAdminShortcut(e: KeyboardEvent) {
      if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.key.toLowerCase() !== 'e') {
        return;
      }
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      toggleEditMode();
    }
    window.addEventListener('keydown', handleAdminShortcut);
    return () => window.removeEventListener('keydown', handleAdminShortcut);
  }, [isAdmin, toggleEditMode]);

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
    if (typeof window !== 'undefined' && parsedDepartmentRoute && !parsedDepartmentRoute.isPersonPage) {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      setDepartmentTabState(isDepartmentTab(tabParam) ? tabParam : 'overview');
    } else if (!parsedDepartmentRoute) {
      setDepartmentTabState('overview');
    }

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
  }, [pathname, parsedDepartmentRoute, scrollToHashId]);

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

  const setDepartmentTab = useCallback(
    (nextTab: DepartmentTab, options?: { scrollToTop?: boolean }) => {
      const shouldScroll = options?.scrollToTop ?? true;
      if (parsedDepartmentRoute?.isPersonPage) {
        const basePath = `/academics/departments/${encodeURIComponent(
          parsedDepartmentRoute.code.toLowerCase()
        )}`;
        const dest = nextTab === 'overview' ? basePath : `${basePath}?tab=${nextTab}`;
        navigateTo(dest);
        return;
      }

      setDepartmentTabState(nextTab);
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (nextTab === 'overview') {
          url.searchParams.delete('tab');
        } else {
          url.searchParams.set('tab', nextTab);
        }
        window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
        if (shouldScroll) {
          const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
          window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
        }
      }
    },
    [parsedDepartmentRoute, navigateTo]
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
          const [bmRes, noticeRes, profileRes, deptRes] = await Promise.all([
            pustApi.getBookmarks().catch(() => ({ bookmarks: [] })),
            pustApi.getNotices().catch(() => null),
            pustApi.getUniversityProfile().catch(() => null),
            pustApi.getDepartments().catch(() => null),
          ]);
          if (!mountedRef.current) return;
          setBookmarks(bmRes.bookmarks);
          if (noticeRes && Array.isArray(noticeRes.notices)) {
            setNotices(noticeRes.notices);
          }
          if (deptRes && Array.isArray(deptRes.departments)) {
            setDepartments(deptRes.departments);
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
      await pustApi.deleteNotice(id);
      setActiveNotice(null);
      await loadNotices();
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
      cmsDirectoryOpen: isAdmin && cmsDirectoryOpen,
      openCmsDirectory,
      closeCmsDirectory,
      openEditModal,
      closeEditModal,
      setUser,
      isNavigating,
      departmentTab,
      setDepartmentTab,
      prefetchRoute,
      navigateTo,
      setActiveDepartment,
      setActiveNotice,
      loadCmsProfile,
      loadNotices,
      loadDepartments,
      loadPublications,
      loadBookmarks,
      studentProfile,
      studentExamResults,
      studentCourses,
      studentClassSchedules,
      studentExamApplications,
      studentHallDues,
      studentCertificateApps,
      studentPaymentReceipts,
      studentFeeConfig,
      studentHallClearanceBlocked,
      loadingStudentDashboard,
      studentDashboardError,
      loadStudentDashboard,
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
      isAdmin,
      cmsDirectoryOpen,
      openCmsDirectory,
      closeCmsDirectory,
      openEditModal,
      closeEditModal,
      isNavigating,
      departmentTab,
      setDepartmentTab,
      prefetchRoute,
      navigateTo,
      loadCmsProfile,
      loadNotices,
      loadDepartments,
      loadPublications,
      loadBookmarks,
      studentProfile,
      studentExamResults,
      studentCourses,
      studentClassSchedules,
      studentExamApplications,
      studentHallDues,
      studentCertificateApps,
      studentPaymentReceipts,
      studentFeeConfig,
      studentHallClearanceBlocked,
      loadingStudentDashboard,
      studentDashboardError,
      loadStudentDashboard,
      retryLoad,
      submitInquiry,
    ]
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SkeletonTheme baseColor="#ECECE8" highlightColor="#F8F8F6" borderRadius={8}>
        <MotionConfig reducedMotion="user">
          <PustContext.Provider value={value}>
          <div className="min-h-screen flex flex-col bg-transparent text-ink-900">
            <AnimatePresence>
              {isNavigating && (
                <motion.div
                  aria-hidden="true"
                  initial={{ scaleX: 0.08, opacity: 0 }}
                  animate={{ scaleX: 0.86, opacity: 1 }}
                  exit={{ scaleX: 1, opacity: 0 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  style={{ transformOrigin: 'left center' }}
                  className="fixed top-0 left-0 right-0 z-[70] h-[2px] bg-gradient-to-r from-pust-700 via-gold-400 to-pust-800 pointer-events-none"
                />
              )}
            </AnimatePresence>
            {parsedDepartmentRoute ? (
              <DepartmentNavbar
                departmentCode={parsedDepartmentRoute.code}
                isPersonPage={parsedDepartmentRoute.isPersonPage}
                activeTab={departmentTab}
                profile={profile}
                departments={departments}
                user={user}
                editMode={effectiveEditMode}
                onToggleEditMode={toggleEditMode}
                onOpenEditModal={openEditModal}
                onOpenCmsDirectory={openCmsDirectory}
                onSelectTab={setDepartmentTab}
                onNavigate={navigateTo}
              />
            ) : (
              <Navbar
                route={route}
                user={user}
                profile={profile}
                departments={departments}
                editMode={effectiveEditMode}
                onToggleEditMode={toggleEditMode}
                onOpenEditModal={openEditModal}
                onOpenCmsDirectory={openCmsDirectory}
                onNavigate={navigateTo}
              />
            )}
            <div className="flex-1 flex flex-col">
              {(!parsedDepartmentRoute || parsedDepartmentRoute.isPersonPage) && <Breadcrumb />}
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

          <AdminCmsDirectoryModal
            open={isAdmin && cmsDirectoryOpen}
            onClose={closeCmsDirectory}
            route={route}
            currentDepartment={
              parsedDepartmentRoute
                ? departments.find(
                    (d) => d.code.toUpperCase() === parsedDepartmentRoute.code.toUpperCase()
                  ) ?? null
                : null
            }
            editMode={effectiveEditMode}
            onToggleEditMode={toggleEditMode}
            onSelectTarget={openEditModal}
            onNavigate={navigateTo}
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
