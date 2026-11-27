import { notFound } from 'next/navigation';
import { pustRepo } from '../../../../../../../server/db';
import { findDepartmentPerson } from '../../../../../../lib/departmentPeople';
import { PersonProfileView } from '../../../../../../components/PersonProfileView';

export const dynamic = 'force-dynamic';

export default async function DepartmentPersonProfilePage({
  params,
}: {
  params: Promise<{ code: string; personId: string }>;
}) {
  const { code, personId } = await params;
  const normalizedCode = decodeURIComponent(code).trim().toUpperCase();
  const decodedPersonId = decodeURIComponent(personId).trim();

  await pustRepo.init();
  const matchedDept = await pustRepo.getDepartmentByCode(normalizedCode);

  if (!matchedDept) {
    notFound();
  }

  const matchedPerson = findDepartmentPerson(matchedDept, decodedPersonId);
  if (!matchedPerson) {
    notFound();
  }

  return (
    <PersonProfileView
      code={matchedDept.code}
      personId={matchedPerson.person.id}
      initialDepartment={matchedDept}
      initialRoleCategory={matchedPerson.roleCategory}
    />
  );
}
