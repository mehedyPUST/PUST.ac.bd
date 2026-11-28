import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { pustRepo } from '../../../../../../../server/db';
import { PersonProfileView } from '../../../../../../components/PersonProfileView';
import { findDepartmentPerson } from '../../../../../../lib/departmentPeople';

export const dynamic = 'force-dynamic';

export default async function DepartmentPersonPage({
  params,
}: {
  params: Promise<{ code: string; personId: string }>;
}) {
  const { code, personId } = await params;
  const normalizedCode = decodeURIComponent(code).trim().toUpperCase();
  const normalizedPersonId = decodeURIComponent(personId).trim();

  await pustRepo.init();
  const department = await pustRepo.getDepartmentByCode(normalizedCode);

  if (!department) {
    notFound();
  }

  const matched = findDepartmentPerson(department, normalizedPersonId);
  if (!matched) {
    notFound();
  }

  const deptHref = `/academics/departments/${encodeURIComponent(department.code.toLowerCase())}`;

  return (
    <main className="flex-1 bg-[#F9F8F5]">
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-6">
        <div>
          <Link
            href={deptHref}
            className="inline-flex items-center gap-2 text-xs font-semibold text-pust-900 hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Department of {department.name} ({department.code})
          </Link>
        </div>

        <PersonProfileView
          person={matched.person}
          department={department}
          roleCategory={matched.roleCategory}
        />
      </section>
    </main>
  );
}
