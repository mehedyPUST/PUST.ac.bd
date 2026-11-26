'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { isValidSectionSlug } from '../lib/routes';
import { AdministrationSection } from './AdministrationSection';
import { GovernanceSection } from './GovernanceSection';
import { PublicRouteView } from './PublicRouteView';
import { usePust } from './PustContext';

export type PersistentSectionName =
  | 'about'
  | 'governance'
  | 'administration'
  | 'academics'
  | 'admissions'
  | 'facilities'
  | 'notices';

export function GovernanceRouteView() {
  const { route, navigateTo } = usePust();

  return (
    <main className="flex-1 w-full bg-[#FAF8F5]">
      <GovernanceSection route={route} onNavigate={navigateTo} />
    </main>
  );
}

export function AdministrationRouteView() {
  const { route, profile, vcProfiles, navigateTo } = usePust();

  return (
    <main className="flex-1 w-full bg-[#FAF8F5]">
      <AdministrationSection
        route={route}
        profile={profile}
        vcProfiles={vcProfiles}
        onNavigate={navigateTo}
      />
    </main>
  );
}

export function PersistentSectionLayout({
  section,
  children,
}: {
  section: PersistentSectionName;
  children: ReactNode;
}) {
  const pathname = (usePathname() || '/').replace(/\/+$/, '') || '/';
  const basePath = `/${section}`;

  if (section === 'academics' && pathname.startsWith('/academics/departments/')) {
    return <>{children}</>;
  }

  let isSectionRoute = pathname === basePath;
  if (!isSectionRoute && pathname.startsWith(`${basePath}/`)) {
    const rest = pathname.slice(basePath.length + 1);
    isSectionRoute = !rest.includes('/') && isValidSectionSlug(section, rest);
  }

  if (!isSectionRoute) {
    return <>{children}</>;
  }

  if (section === 'governance') {
    return <GovernanceRouteView />;
  }

  if (section === 'administration') {
    return <AdministrationRouteView />;
  }

  return <PublicRouteView />;
}
