import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { pustRepo } from '../../../../../server/db';
import { DepartmentDetailView } from '../../../../components/DepartmentDetailView';
import DepartmentDetailLoading from './loading';

export const dynamic = 'force-dynamic';

export default async function DepartmentPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const normalizedCode = decodeURIComponent(code).trim().toUpperCase();

  await pustRepo.init();
  const matched = await pustRepo.getDepartmentByCode(normalizedCode);

  if (!matched) {
    notFound();
  }

  return (
    <Suspense fallback={<DepartmentDetailLoading />}>
      <DepartmentDetailView code={matched.code} initialDepartment={matched} />
    </Suspense>
  );
}
