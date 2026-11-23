'use client';

import { VerifyPage } from '../../components/VerifyPage';
import { usePust } from '../../components/PustContext';

export default function VerifyRoutePage() {
  const { navigateTo } = usePust();

  return (
    <main className="flex-1 bg-[#F7F7F5]">
      <VerifyPage onNavigate={navigateTo} />
    </main>
  );
}
