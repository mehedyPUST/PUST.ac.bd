'use client';

import { Suspense } from 'react';
import { PageHeaderAndSectionSkeleton } from '../../components/PustSkeletons';
import { VerifyPage } from '../../components/VerifyPage';
import { usePust } from '../../components/PustContext';

export default function VerifyRoutePage() {
  const { navigateTo } = usePust();

  return (
    <main className="flex-1 bg-[#F8F7F4]">
      <Suspense fallback={<PageHeaderAndSectionSkeleton />}>
        <VerifyPage onNavigate={navigateTo} />
      </Suspense>
    </main>
  );
}
