import type {
  DepartmentPersonRecord,
  DepartmentRecord,
  PublicationRecord,
} from '../types/pust';

export type PersonRoleCategory =
  | 'Chairman'
  | 'Faculty Member'
  | 'Faculty Member (Contractual)'
  | 'Department Officer';

export function getInitials(name: string): string {
  const cleaned = name
    .replace(/\b(Prof\.?|Dr\.?|Md\.?|Mst\.?|Engr\.?|A\.H\.M\.?|T\.H\.M\.?|S\.M\.?)\b/gi, '')
    .trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'PU';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function sanitizeTelHref(rawPhone: string): string {
  const withoutNotes = rawPhone.replace(/\([^)]*\)/g, '').trim();
  const digits = withoutNotes.replace(/[^+\d]/g, '');
  return digits || rawPhone.replace(/\s+/g, '');
}

export function resolveDepartmentChairman(department: DepartmentRecord): DepartmentPersonRecord {
  return (
    department.chairmanProfile ?? {
      id: `${department.id}-chair`,
      name: department.chairmanName,
      designation: 'Chairman',
      phones: department.contactPhone ? [{ value: department.contactPhone, type: 'Office' }] : [],
      emails: department.contactEmail ? [{ value: department.contactEmail, type: 'Office' }] : [],
    }
  );
}

export function findDepartmentPerson(
  department: DepartmentRecord,
  personId: string
): { person: DepartmentPersonRecord; roleCategory: PersonRoleCategory } | null {
  const targetId = personId.trim();
  if (!targetId) return null;

  const chairRecord = resolveDepartmentChairman(department);
  if (chairRecord.id === targetId) {
    return { person: chairRecord, roleCategory: 'Chairman' };
  }

  const fac = (department.facultyMembers ?? []).find((m) => m.id === targetId);
  if (fac) {
    return { person: fac, roleCategory: 'Faculty Member' };
  }

  const cfac = (department.contractualFacultyMembers ?? []).find((m) => m.id === targetId);
  if (cfac) {
    return { person: cfac, roleCategory: 'Faculty Member (Contractual)' };
  }

  const off = (department.officers ?? []).find((o) => o.id === targetId);
  if (off) {
    return { person: off, roleCategory: 'Department Officer' };
  }

  return null;
}

export function getDepartmentPersonHref(departmentCode: string, personId: string): string {
  return `/academics/departments/${encodeURIComponent(
    departmentCode.trim().toLowerCase()
  )}/people/${encodeURIComponent(personId)}`;
}

export function matchPersonPublications(
  personName: string,
  deptPublications: PublicationRecord[]
): PublicationRecord[] {
  const cleanedTokens = personName
    .replace(/\b(Prof\.?|Dr\.?|Md\.?|Mst\.?|Engr\.?)\b/gi, '')
    .replace(/[.,]/g, ' ')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length >= 3);

  if (cleanedTokens.length === 0) return [];
  const lastName = cleanedTokens[cleanedTokens.length - 1];
  const firstMeaningful = cleanedTokens[0];

  return deptPublications.filter((pub) => {
    const authorsLower = pub.authors.toLowerCase();
    if (authorsLower.includes(cleanedTokens.join(' '))) return true;
    if (lastName.length >= 4 && authorsLower.includes(lastName)) {
      if (cleanedTokens.length === 1) return true;
      return (
        authorsLower.includes(firstMeaningful) ||
        authorsLower.includes(`${firstMeaningful[0]}.`) ||
        authorsLower.includes(` ${firstMeaningful[0]} `)
      );
    }
    return false;
  });
}
