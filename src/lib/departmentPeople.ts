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
  const deptOfficeEmail = department.contactEmail?.trim() || '';
  const deptOfficePhone = department.contactPhone?.trim() || '';

  function withOfficialContact(person: DepartmentPersonRecord): DepartmentPersonRecord {
    const emails = [...(person.emails || [])];
    const phones = [...(person.phones || [])];
    // Prefer ensuring department official email is available as Office type
    if (
      deptOfficeEmail &&
      !emails.some((e) => e.value.trim().toLowerCase() === deptOfficeEmail.toLowerCase())
    ) {
      emails.unshift({ value: deptOfficeEmail, type: 'Office' });
    } else if (emails.length > 0 && !emails.some((e) => e.type === 'Office')) {
      // Promote first institutional address to Office when no Office type exists
      const pustIdx = emails.findIndex((e) => /@pust\.ac\.bd$/i.test(e.value));
      if (pustIdx >= 0) {
        emails[pustIdx] = { ...emails[pustIdx], type: 'Office' };
      }
    }
    if (
      deptOfficePhone &&
      !phones.some((p) => p.value.replace(/\s/g, '') === deptOfficePhone.replace(/\s/g, ''))
    ) {
      phones.unshift({ value: deptOfficePhone, type: 'Office' });
    }
    return { ...person, emails, phones };
  }

  if (department.chairmanProfile) {
    return withOfficialContact(department.chairmanProfile);
  }

  const normalizedChair = department.chairmanName.trim().toLowerCase();
  const matchedFaculty = (department.facultyMembers || []).find(
    (member) => member.name.trim().toLowerCase() === normalizedChair
  );

  if (matchedFaculty) {
    return withOfficialContact({
      ...matchedFaculty,
      id: `${department.id}-chair`,
      designation: matchedFaculty.designation.includes('Chairman')
        ? matchedFaculty.designation
        : `${matchedFaculty.designation} & Chairman`,
    });
  }

  return {
    id: `${department.id}-chair`,
    name: department.chairmanName,
    designation: `Chairman, Department of ${department.name}`,
    officeLocation: `${department.building}`,
    phones: deptOfficePhone ? [{ value: deptOfficePhone, type: 'Office' }] : [],
    emails: deptOfficeEmail ? [{ value: deptOfficeEmail, type: 'Office' }] : [],
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
