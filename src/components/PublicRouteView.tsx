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
      onSelectDepartment={(dept) =>
        navigateTo(`/academics/departments/${encodeURIComponent(dept.code.toLowerCase())}`)
      }
      onSelectNotice={setActiveNotice}
      onSubmitInquiry={submitInquiry}
    />
  );
}
