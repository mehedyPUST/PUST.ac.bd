'use client';

import { HomePage } from '../components/HomePage';
import { usePust } from '../components/PustContext';

const OFFICIAL_BANNER_IMAGE = '/src/assets/images/pust_campus_hero_1795431408503.jpg';

export default function Home() {
  const {
    profile,
    aboutSections,
    vcProfiles,
    galleryItems,
    notices,
    navigateTo,
    setActiveNotice,
  } = usePust();

  return (
    <HomePage
      heroImage={OFFICIAL_BANNER_IMAGE}
      profile={profile}
      aboutSections={aboutSections}
      vcProfiles={vcProfiles}
      galleryItems={galleryItems}
      notices={notices}
      onNavigate={navigateTo}
      onSelectNotice={setActiveNotice}
    />
  );
}
