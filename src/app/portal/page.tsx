'use client';

import { PortalView } from '../../components/PortalView';
import { usePust } from '../../components/PustContext';

export default function PortalPage() {
  const {
    user,
    departments,
    bookmarks,
    bootstrapStatus,
    aboutSections,
    vcProfiles,
    galleryItems,
    notices,
    setUser,
    loadBookmarks,
    loadNotices,
    loadCmsProfile,
    navigateTo,
  } = usePust();

  return (
    <main className="flex-1 bg-[#FAF8F4]">
      <PortalView
        user={user}
        departments={departments}
        bookmarks={bookmarks}
        bootstrapStatus={bootstrapStatus}
        aboutSections={aboutSections}
        vcProfiles={vcProfiles}
        galleryItems={galleryItems}
        notices={notices}
        onUserChange={setUser}
        onBookmarksChange={loadBookmarks}
        onNoticesChange={loadNotices}
        onCmsChange={loadCmsProfile}
        onBackToSite={() => navigateTo('/')}
      />
    </main>
  );
}
