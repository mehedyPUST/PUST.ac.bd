'use client';

import { usePust } from './PustContext';
import { PublicSubPages } from './PublicSubPages';

export function PublicRouteView() {
  const {
    route,
    profile,
    aboutSections,
    galleryItems,
    departments,
    publications,
    notices,
    loadingData,
    dataError,
    retryLoad,
    prefetchRoute,
    navigateTo,
    setActiveNotice,
    submitInquiry,
  } = usePust();

  return (
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
      onRetry={retryLoad}
      onNavigate={navigateTo}
      onPrefetchDepartment={(dept) =>
        prefetchRoute(`/academics/departments/${encodeURIComponent(dept.code.toLowerCase())}`)
      }
      onSelectDepartment={(dept) =>
        navigateTo(`/academics/departments/${encodeURIComponent(dept.code.toLowerCase())}`)
      }
      onSelectNotice={setActiveNotice}
      onSubmitInquiry={submitInquiry}
    />
  );
}
