'use client';

import { AdministrationSection } from '../../../components/AdministrationSection';
import { usePust } from '../../../components/PustContext';

export default function AdministrationSubPage() {
  const { route, profile, vcProfiles, navigateTo } = usePust();

  return (
    <main className="flex-1 bg-white">
      <AdministrationSection
        route={route}
        profile={profile}
        vcProfiles={vcProfiles}
        onNavigate={navigateTo}
      />
    </main>
  );
}
