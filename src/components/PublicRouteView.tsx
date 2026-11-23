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
    navigateTo,
    setActiveDepartment,
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
      onNavigate={navigateTo}
      onSelectDepartment={setActiveDepartment}
      onSelectNotice={setActiveNotice}
      onSubmitInquiry={submitInquiry}
    />
  );
}
