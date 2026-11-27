export type DepartmentTab =
  | 'overview'
  | 'faculty'
  | 'officers'
  | 'research'
  | 'notices'
  | 'contact';

export const VALID_DEPARTMENT_TABS: readonly DepartmentTab[] = [
  'overview',
  'faculty',
  'officers',
  'research',
  'notices',
  'contact',
] as const;

export function isDepartmentTab(value: string | null | undefined): value is DepartmentTab {
  return Boolean(
    value && (VALID_DEPARTMENT_TABS as readonly string[]).includes(value)
  );
}

export interface DepartmentNavItem {
  id: DepartmentTab;
  label: string;
  shortLabel: string;
  mastheadKicker: string;
  mastheadTitle: string;
}

export const DEPARTMENT_NAV_ITEMS: readonly DepartmentNavItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    shortLabel: 'Overview',
    mastheadKicker: 'Departmental Portal',
    mastheadTitle: 'Overview',
  },
  {
    id: 'faculty',
    label: 'Faculty Members',
    shortLabel: 'Faculty',
    mastheadKicker: 'Academic Personnel & Leadership',
    mastheadTitle: 'Faculty Members',
  },
  {
    id: 'officers',
    label: 'Officers & Staff',
    shortLabel: 'Officers',
    mastheadKicker: 'Administration & Laboratory Support',
    mastheadTitle: 'Officers & Technical Staff',
  },
  {
    id: 'research',
    label: 'Programs & Research',
    shortLabel: 'Research',
    mastheadKicker: 'Degree Pathways, Labs & Scholarship',
    mastheadTitle: 'Programs, Research & Laboratories',
  },
  {
    id: 'notices',
    label: 'Notice Board',
    shortLabel: 'Notices',
    mastheadKicker: 'Official Departmental Circulars',
    mastheadTitle: 'Departmental Notice Board',
  },
  {
    id: 'contact',
    label: 'Contact & Location',
    shortLabel: 'Contact',
    mastheadKicker: 'Office Address & Correspondence',
    mastheadTitle: 'Contact & Location',
  },
] as const;

export interface ParsedDepartmentRoute {
  code: string;
  isPersonPage: boolean;
}

export function parseDepartmentPath(pathname: string): ParsedDepartmentRoute | null {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (!clean.startsWith('/academics/departments/')) {
    return null;
  }
  const segments = clean
    .slice('/academics/departments/'.length)
    .split('/')
    .filter(Boolean);
  if (segments.length === 0) {
    return null;
  }
  const code = decodeURIComponent(segments[0]).trim().toUpperCase();
  if (!code) {
    return null;
  }
  return {
    code,
    isPersonPage: segments.length >= 3 && segments[1] === 'people',
  };
}
