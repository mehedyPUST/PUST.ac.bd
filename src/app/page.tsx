'use client';

import { HomePage } from '../components/HomePage';
import { usePust } from '../components/PustContext';

const OFFICIAL_BANNER_IMAGE =
  'https://pust.ac.bd/includes/images/slides/1791951638WhatsApp%20Image%202026-09-22%20at%201.42.30%20PM%20(1).jpeg';

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
