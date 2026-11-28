export type DepartmentTab = 'overview' | 'faculty' | 'officers' | 'research' | 'notices' | 'contact';

export interface DepartmentNavItem {
  id: DepartmentTab;
  label: string;
  shortLabel: string;
  mastheadKicker: string;
  mastheadTitle: string;
  description: string;
}

export const DEPARTMENT_NAV_ITEMS: DepartmentNavItem[] = [
  {
    id: 'overview',
    label: 'Overview & Message',
    shortLabel: 'Overview',
    mastheadKicker: 'Department Profile',
    mastheadTitle: 'Academic Overview & Chairman’s Desk',
    description: 'Departmental mission, leadership message, degree tracks, and intake highlights.',
  },
  {
    id: 'faculty',
    label: 'Faculty Members',
    shortLabel: 'Faculty',
    mastheadKicker: 'Academic Roster',
    mastheadTitle: 'Faculty & Teaching Staff',
    description: 'Professors, associate professors, assistant professors, lecturers, and visiting scholars.',
  },
  {
    id: 'officers',
    label: 'Officers & Staff',
    shortLabel: 'Officers',
    mastheadKicker: 'Administrative Support',
    mastheadTitle: 'Departmental Officers & Technical Staff',
    description: 'Laboratory engineers, demonstrators, and administrative office staff.',
  },
  {
    id: 'research',
    label: 'Research & Labs',
    shortLabel: 'Research',
    mastheadKicker: 'Research Infrastructure',
    mastheadTitle: 'Laboratories, Thrust Areas & Publications',
    description: 'Departmental laboratories, research focus areas, and indexed faculty publications.',
  },
  {
    id: 'notices',
    label: 'Notice Board',
    shortLabel: 'Notices',
    mastheadKicker: 'Department Circulars',
    mastheadTitle: 'Departmental & Course Notice Board',
    description: 'Official announcements, examination schedules, and course circulars.',
  },
  {
    id: 'contact',
    label: 'Contact',
    shortLabel: 'Contact',
    mastheadKicker: 'Department Correspondence',
    mastheadTitle: 'Office Address & Contact Details',
    description: 'Official office location, telephone extensions, and departmental email addresses.',
  },
];

const DEPARTMENT_TAB_SET = new Set<DepartmentTab>(
  DEPARTMENT_NAV_ITEMS.map((item) => item.id)
);

export function isDepartmentTab(value: unknown): value is DepartmentTab {
  return typeof value === 'string' && DEPARTMENT_TAB_SET.has(value as DepartmentTab);
}

export interface ParsedDepartmentPath {
  code: string;
  isPersonPage: boolean;
  personId?: string;
}

export function parseDepartmentPath(pathname: string): ParsedDepartmentPath | null {
  const clean = (pathname || '').replace(/\/+$/, '');
  const prefix = '/academics/departments/';
  if (!clean.startsWith(prefix)) {
    return null;
  }
  const rest = clean.slice(prefix.length);
  const segments = rest.split('/').filter(Boolean);
  if (segments.length === 0) {
    return null;
  }
  const code = decodeURIComponent(segments[0]).trim().toUpperCase();
  if (!code) {
    return null;
  }
  if (segments.length >= 3 && segments[1] === 'people') {
    return {
      code,
      isPersonPage: true,
      personId: decodeURIComponent(segments[2]).trim(),
    };
  }
  return {
    code,
    isPersonPage: false,
  };
}
