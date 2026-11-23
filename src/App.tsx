import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdministrationSection } from './components/AdministrationSection';
import { DepartmentModal } from './components/DepartmentModal';
import { Footer } from './components/Footer';
import { HomePage } from './components/HomePage';
import { Navbar } from './components/Navbar';
import { NoticeModal } from './components/NoticeModal';
import { PortalView } from './components/PortalView';
import { PublicSubPages } from './components/PublicSubPages';
import { pustApi } from './lib/api';
import { parseRouteFromPath, type AppRoute } from './lib/routes';
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
} from './types/pust';

const HERO_IMAGE = '/src/assets/images/pust_campus_hero_1795431408503.jpg';

export default function App() {
  const [route, setRoute] = useState<AppRoute>(() =>
    parseRouteFromPath(typeof window !== 'undefined' ? window.location.pathname : '/')
  );

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

  useEffect(() => {
    function handlePopState() {
      setRoute(parseRouteFromPath(window.location.pathname));
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = useCallback((target: AppRoute) => {
    setRoute(target);
    if (window.location.pathname !== target) {
      window.history.pushState({}, '', target);
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

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

  async function handleToggleBookmarkDepartment(dept: DepartmentRecord) {
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
  }

  async function handleToggleBookmarkNotice(notice: NoticeRecord) {
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
  }

  async function handleDeleteNotice(id: string) {
    await pustApi.deleteNotice(id);
    setActiveNotice(null);
    await loadNotices();
  }

  async function handleSubmitInquiry(payload: {
    fullName: string;
    email: string;
    phone: string;
    programLevel: InquiryRecord['programLevel'];
    departmentCode: string;
    message: string;
  }) {
    const res = await pustApi.submitInquiry(payload);
    return res.inquiry;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar route={route} user={user} onNavigate={navigateTo} />

      {route === '/' && (
        <HomePage
          heroImage={HERO_IMAGE}
          profile={profile}
          aboutSections={aboutSections}
          vcProfiles={vcProfiles}
          galleryItems={galleryItems}
          notices={notices}
          onNavigate={navigateTo}
          onSelectNotice={setActiveNotice}
        />
      )}

      {route.startsWith('/administration') && (
        <main className="flex-1">
          <AdministrationSection
            route={route}
            profile={profile}
            vcProfiles={vcProfiles}
            onNavigate={navigateTo}
          />
        </main>
      )}

      {route === '/portal' && (
        <div className="flex-1">
          <PortalView
            user={user}
            departments={departments}
            bookmarks={bookmarks}
            bootstrapStatus={bootstrapStatus}
            aboutSections={aboutSections}
            vcProfiles={vcProfiles}
            galleryItems={galleryItems}
            onUserChange={setUser}
            onBookmarksChange={loadBookmarks}
            onNoticesChange={loadNotices}
            onCmsChange={loadCmsProfile}
            onBackToSite={() => navigateTo('/')}
          />
        </div>
      )}

      {route !== '/' && !route.startsWith('/administration') && route !== '/portal' && (
        <PublicSubPages
          route={route}
          profile={profile}
          aboutSections={aboutSections}
          galleryItems={galleryItems}
          departments={departments}
          publications={publications}
          notices={notices}
          loadingData={loadingData}
          dataError={dataError}
          onNavigate={navigateTo}
          onSelectDepartment={setActiveDepartment}
          onSelectNotice={setActiveNotice}
          onSubmitInquiry={handleSubmitInquiry}
        />
      )}

      <Footer onNavigate={navigateTo} />

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
    </div>
  );
}
