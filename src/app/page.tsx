'use client';

import { HomePage } from '../components/HomePage';
import { usePust } from '../components/PustContext';

export default function Home() {
  const {
    profile,
    aboutSections,
    vcProfiles,
    galleryItems,
    bannerSlides,
    publications,
    notices,
    loadingData,
    dataError,
    retryLoad,
    navigateTo,
    setActiveNotice,
  } = usePust();

  return (
    <HomePage
      bannerSlides={bannerSlides}
      profile={profile}
      aboutSections={aboutSections}
      vcProfiles={vcProfiles}
      galleryItems={galleryItems}
      publications={publications}
      notices={notices}
      loadingData={loadingData}
      dataError={dataError}
      onRetry={retryLoad}
      onNavigate={navigateTo}
      onSelectNotice={setActiveNotice}
    />
  );
}
