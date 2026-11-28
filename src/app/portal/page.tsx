'use client';

import { Suspense } from 'react';
import { PortalView } from '../../components/PortalView';
import { usePust } from '../../components/PustContext';
import { PortalRecordsSkeleton } from '../../components/PustSkeletons';

export default function PortalPage() {
  const {
    user,
    departments,
    bookmarks,
    bootstrapStatus,
    aboutSections,
    vcProfiles,
    galleryItems,
    bannerSlides,
    notices,
    setUser,
    loadBookmarks,
    loadNotices,
    loadCmsProfile,
    loadDepartments,
    navigateTo,
  } = usePust();

  return (
    <main className="flex-1 bg-[#FAF9F6]">
      <Suspense
        fallback={
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <PortalRecordsSkeleton rows={4} />
          </div>
        }
      >
        <PortalView
          user={user}
          departments={departments}
          bookmarks={bookmarks}
          bootstrapStatus={bootstrapStatus}
          aboutSections={aboutSections}
          vcProfiles={vcProfiles}
          galleryItems={galleryItems}
          bannerSlides={bannerSlides}
          notices={notices}
          onUserChange={setUser}
          onBookmarksChange={loadBookmarks}
          onNoticesChange={loadNotices}
          onCmsChange={async () => {
            await Promise.all([loadCmsProfile(), loadDepartments()]);
          }}
          onBackToSite={() => navigateTo('/')}
        />
      </Suspense>
    </main>
  );
}
