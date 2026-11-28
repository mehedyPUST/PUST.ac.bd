import type { DepartmentPersonRecord, DepartmentRecord } from '../types/pust';

export type PersonRoleCategory =
  | 'Chairman'
  | 'Faculty Member'
  | 'Faculty Member (Contractual)'
  | 'Department Officer';

export function getDepartmentPersonHref(departmentCode: string, personId: string): string {
  const safeCode = encodeURIComponent((departmentCode || '').trim().toLowerCase());
  const safeId = encodeURIComponent((personId || '').trim());
  return `/academics/departments/${safeCode}/people/${safeId}`;
}

export function sanitizeTelHref(phone: string): string {
  return (phone || '').replace(/[^\d+]/g, '');
}

export function resolveDepartmentChairman(department: DepartmentRecord): DepartmentPersonRecord {
  if (department.chairmanProfile) {
    return department.chairmanProfile;
  }

  const normalizedChair = department.chairmanName.trim().toLowerCase();
  const matchedFaculty = (department.facultyMembers || []).find(
    (member) => member.name.trim().toLowerCase() === normalizedChair
  );

  if (matchedFaculty) {
    return {
      ...matchedFaculty,
      id: `${department.id}-chair`,
      designation: matchedFaculty.designation.includes('Chairman')
        ? matchedFaculty.designation
        : `${matchedFaculty.designation} & Chairman`,
    };
  }

  return {
    id: `${department.id}-chair`,
    name: department.chairmanName,
    designation: `Chairman, Department of ${department.name}`,
    officeLocation: `${department.building}`,
    phones: department.contactPhone
      ? [{ value: department.contactPhone, type: 'Office' }]
      : [],
    emails: department.contactEmail
      ? [{ value: department.contactEmail, type: 'Office' }]
      : [],
  };
}

export function findDepartmentPerson(
  department: DepartmentRecord,
  personId: string
): { person: DepartmentPersonRecord; roleCategory: PersonRoleCategory } | null {
  const targetId = (personId || '').trim();
  if (!targetId) return null;

  const chairId = `${department.id}-chair`;
  if (
    targetId === chairId ||
    (department.chairmanProfile && department.chairmanProfile.id === targetId)
  ) {
    return {
      person: resolveDepartmentChairman(department),
      roleCategory: 'Chairman',
    };
  }

  const facultyMatch = (department.facultyMembers || []).find((m) => m.id === targetId);
  if (facultyMatch) {
    return { person: facultyMatch, roleCategory: 'Faculty Member' };
  }

  const contractualMatch = (department.contractualFacultyMembers || []).find(
    (m) => m.id === targetId
  );
  if (contractualMatch) {
    return {
      person: contractualMatch,
      roleCategory: 'Faculty Member (Contractual)',
    };
  }

  const officerMatch = (department.officers || []).find((m) => m.id === targetId);
  if (officerMatch) {
    return { person: officerMatch, roleCategory: 'Department Officer' };
  }

  return null;
}
