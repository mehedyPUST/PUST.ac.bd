'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { MotionConfig } from 'motion/react';
import { SkeletonTheme } from 'react-loading-skeleton';
import { pustApi } from '../lib/api';
import { parseRouteFromPath, type AppRoute } from '../lib/routes';
import type {
  AboutContentRecord,
  AuthUser,
  BookmarkRecord,
  BootstrapStatus,
  DepartmentRecord,
  GalleryItemRecord,
  InquiryRecord,
  NoticeRecord,
  PublicationRecord,
  UniversityProfile,
  ViceChancellorRecord,
} from '../types/pust';
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
  departments: DepartmentRecord[];
  publications: PublicationRecord[];
  notices: NoticeRecord[];
  loadingData: boolean;
  dataError: string | null;
  user: AuthUser | null;
  bookmarks: BookmarkRecord[];
  bookmarkedIds: Set<string>;
  bootstrapStatus: BootstrapStatus;
  setUser: (user: AuthUser | null) => void;
  navigateTo: (target: AppRoute | string) => void;
  setActiveDepartment: (dept: DepartmentRecord | null) => void;
  setActiveNotice: (notice: NoticeRecord | null) => void;
  loadCmsProfile: () => Promise<void>;
  loadNotices: () => Promise<void>;
  loadBookmarks: () => Promise<void>;
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

export function PustShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const route = parseRouteFromPath(pathname);

  const [profile, setProfile] = useState<UniversityProfile | null>(null);
  const [aboutSections, setAboutSections] = useState<AboutContentRecord[]>([]);
  const [vcProfiles, setVcProfiles] = useState<ViceChancellorRecord[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItemRecord[]>([]);
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [publications, setPublications] = useState<PublicationRecord[]>([]);
  const [notices, setNotices] = useState<NoticeRecord[]>([]);
  const [loadingData, setLoadingData] = useState(true);
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

  const navigateTo = useCallback(
    (target: AppRoute | string) => {
      router.push(target);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    },
    [router]
  );

  const loadCmsProfile = useCallback(async () => {
    const profileRes = await pustApi.getUniversityProfile();
    setProfile(profileRes.profile);
    setAboutSections(profileRes.aboutSections);
    setVcProfiles(profileRes.vcProfiles);
    setGalleryItems(profileRes.galleryItems);
  }, []);

  const loadNotices = useCallback(async () => {
    const res = await pustApi.getNotices();
    setNotices(res.notices);
  }, []);

  const loadBookmarks = useCallback(async () => {
    try {
      const res = await pustApi.getBookmarks();
      setBookmarks(res.bookmarks);
    } catch {
      setBookmarks([]);
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function bootstrap() {
      setLoadingData(true);
      setDataError(null);
      try {
        const [profileRes, deptRes, pubRes, noticeRes, meRes, statusRes] = await Promise.all([
          pustApi.getUniversityProfile(),
          pustApi.getDepartments(),
          pustApi.getPublications(),
          pustApi.getNotices(),
          pustApi.getMe(),
          pustApi.getBootstrapStatus(),
        ]);
        if (!active) return;
        setProfile(profileRes.profile);
        setAboutSections(profileRes.aboutSections);
        setVcProfiles(profileRes.vcProfiles);
        setGalleryItems(profileRes.galleryItems);
        setDepartments(deptRes.departments);
        setPublications(pubRes.publications);
        setNotices(noticeRes.notices);
        setUser(meRes.user);
        setBootstrapStatus(statusRes);
        if (meRes.user) {
          const bmRes = await pustApi.getBookmarks().catch(() => ({ bookmarks: [] }));
          if (active) setBookmarks(bmRes.bookmarks);
        }
      } catch (err) {
        if (active) {
          setDataError(err instanceof Error ? err.message : 'Unable to load university records.');
        }
      } finally {
        if (active) setLoadingData(false);
      }
    }
    bootstrap();
    return () => {
      active = false;
    };
  }, []);

  const bookmarkedIds = useMemo(() => new Set(bookmarks.map((b) => b.itemId)), [bookmarks]);

  const handleToggleBookmarkDepartment = useCallback(
    async (dept: DepartmentRecord) => {
      if (!user) return;
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
    },
    [user, bookmarkedIds, loadBookmarks]
  );

  const handleToggleBookmarkNotice = useCallback(
    async (notice: NoticeRecord) => {
      if (!user) return;
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
      departments,
      publications,
      notices,
      loadingData,
      dataError,
      user,
      bookmarks,
      bookmarkedIds,
      bootstrapStatus,
      setUser,
      navigateTo,
      setActiveDepartment,
      setActiveNotice,
      loadCmsProfile,
      loadNotices,
      loadBookmarks,
      submitInquiry,
    }),
    [
      route,
      profile,
      aboutSections,
      vcProfiles,
      galleryItems,
      departments,
      publications,
      notices,
      loadingData,
      dataError,
      user,
      bookmarks,
      bookmarkedIds,
      bootstrapStatus,
      navigateTo,
      loadCmsProfile,
      loadNotices,
      loadBookmarks,
      submitInquiry,
    ]
  );

  return (
    <SkeletonTheme baseColor="#E2E8F0" highlightColor="#F8FAFC" borderRadius={8}>
      <MotionConfig reducedMotion="user">
        <PustContext.Provider value={value}>
        <div className="min-h-screen flex flex-col bg-[#F7F7F5] text-slate-900">
          <Navbar route={route} user={user} onNavigate={navigateTo} />
          <div className="flex-1 flex flex-col">{children}</div>
          <Footer onNavigate={navigateTo} />
        </div>

        <DepartmentModal
          department={activeDepartment}
          onClose={() => setActiveDepartment(null)}
          user={user}
          isBookmarked={activeDepartment ? bookmarkedIds.has(activeDepartment.id) : false}
          onToggleBookmark={handleToggleBookmarkDepartment}
          onOpenPortal={() => navigateTo('/portal')}
        />

        <NoticeModal
          notice={activeNotice}
          onClose={() => setActiveNotice(null)}
          user={user}
          isBookmarked={activeNotice ? bookmarkedIds.has(activeNotice.id) : false}
          onToggleBookmark={handleToggleBookmarkNotice}
          onDeleteNotice={handleDeleteNotice}
          onOpenPortal={() => navigateTo('/portal')}
        />
      </PustContext.Provider>
    </MotionConfig>
    </SkeletonTheme>
  );
}
