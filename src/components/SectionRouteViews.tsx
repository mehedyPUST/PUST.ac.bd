'use client';

import { AdministrationSection } from './AdministrationSection';
import { GovernanceSection } from './GovernanceSection';
import { usePust } from './PustContext';

export function GovernanceRouteView() {
  const { route, navigateTo } = usePust();

  return (
    <main className="flex-1 bg-white">
      <GovernanceSection route={route} onNavigate={navigateTo} />
    </main>
  );
}

export function AdministrationRouteView() {
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
