'use client';

import { GovernanceSection } from '../../../components/GovernanceSection';
import { usePust } from '../../../components/PustContext';

export default function GovernanceSubPage() {
  const { route, navigateTo } = usePust();

  return (
    <main className="flex-1 bg-white">
      <GovernanceSection route={route} onNavigate={navigateTo} />
    </main>
  );
}
