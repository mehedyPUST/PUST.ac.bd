export type AppRoute =
  | '/'
  | '/about'
  | '/about/our-university'
  | '/about/history'
  | '/about/mission-vision'
  | '/about/plans'
  | '/governance'
  | '/governance/university-act'
  | '/governance/pust-act'
  | '/governance/regent-board'
  | '/governance/academic-council'
  | '/governance/finance-committee'
  | '/governance/academic-ordinance'
  | '/administration'
  | '/administration/vc-office'
  | '/administration/pro-vc-office'
  | '/administration/treasurer-office'
  | '/administration/registrar-office'
  | '/administration/establishment-council'
  | '/administration/academic-section'
  | '/administration/central-library'
  | '/administration/planning-development'
  | '/administration/controller-office'
  | '/administration/finance-accounts'
  | '/administration/public-relations'
  | '/administration/medical-section'
  | '/administration/engineering-office'
  | '/administration/proctor-office'
  | '/administration/student-advisor-office'
  | '/administration/central-cafeteria'
  | '/administration/transportation-pool'
  | '/administration/male-hall-1'
  | '/administration/female-hall-1'
  | '/administration/ict-cell'
  | '/administration/central-store'
  | '/administration/security-section'
  | '/administration/iqac'
  | '/administration/central-mosque'
  | '/administration/estate-section'
  | '/administration/dormitory'
  | '/administration/physical-education'
  | '/administration/guest-house'
  | '/administration/male-hall-2'
  | '/administration/female-hall-2'
  | '/administration/iied'
  | '/administration/rttc'
  | '/administration/collaboration-cell'
  | '/administration/all-office'
  | '/administration/apa'
  | '/academics'
  | '/academics/programs'
  | '/academics/faculty'
  | '/academics/departments'
  | '/academics/forms-download'
  | '/academics/calendar'
  | '/academics/scholarship'
  | '/academics/seminars'
  | '/academics/deans'
  | '/academics/chairmen'
  | '/academics/journals'
  | '/academics/publications'
  | '/admissions'
  | '/admissions/undergraduate'
  | '/admissions/graduate'
  | '/admissions/evening-programs'
  | '/admissions/notice'
  | '/facilities'
  | '/facilities/library'
  | '/facilities/transport'
  | '/facilities/residence'
  | '/facilities/medical'
  | '/facilities/ict-sheba'
  | '/notices'
  | '/notices/general'
  | '/notices/job'
  | '/notices/press-release'
  | '/notices/noc'
  | '/notices/result'
  | '/gallery'
  | '/career'
  | '/verify'
  | '/portal';

export interface NavSubItem {
  label: string;
  route: AppRoute;
  description?: string;
}

export interface NavGroup {
  id:
    | 'about'
    | 'governance'
    | 'administration'
    | 'academic'
    | 'facilities'
    | 'notices'
    | 'admission';
  label: string;
  defaultRoute: AppRoute;
  items: NavSubItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'governance',
    label: 'Governance',
    defaultRoute: '/governance',
    items: [
      { label: 'PUST Act', route: '/governance/pust-act' },
      { label: 'Regent Board', route: '/governance/regent-board' },
      { label: 'Academic Council', route: '/governance/academic-council' },
      { label: 'Finance Committee', route: '/governance/finance-committee' },
      { label: 'Academic Ordinance', route: '/governance/academic-ordinance' },
    ],
  },
  {
    id: 'about',
    label: 'About',
    defaultRoute: '/about',
    items: [
      { label: 'Our University', route: '/about/our-university' },
      { label: 'Mission & Vision', route: '/about/mission-vision' },
      { label: 'History', route: '/about/history' },
      { label: 'Strategic Plans', route: '/about/plans' },
    ],
  },
  {
    id: 'administration',
    label: 'Administration',
    defaultRoute: '/administration',
    items: [
      { label: 'Vice-Chancellor Office', route: '/administration/vc-office' },
      { label: 'Pro Vice-Chancellor Office', route: '/administration/pro-vc-office' },
      { label: 'Treasurer Office', route: '/administration/treasurer-office' },
      { label: 'Registrar Office', route: '/administration/registrar-office' },
      { label: 'Establishment and Council Section', route: '/administration/establishment-council' },
      { label: 'Academic Section', route: '/administration/academic-section' },
      { label: 'Central Library and Information Center', route: '/administration/central-library' },
      { label: 'Planning, Development and Works Office', route: '/administration/planning-development' },
      { label: 'Controller Office', route: '/administration/controller-office' },
      { label: 'Finance and Accounts Office', route: '/administration/finance-accounts' },
      { label: 'Public Relations Office', route: '/administration/public-relations' },
      { label: 'Medical Section', route: '/administration/medical-section' },
      { label: 'Engineering Office', route: '/administration/engineering-office' },
      { label: 'Proctor Office', route: '/administration/proctor-office' },
      { label: 'Student Advisor Office', route: '/administration/student-advisor-office' },
      { label: 'Central Cafeteria', route: '/administration/central-cafeteria' },
      { label: 'Transportation Pool', route: '/administration/transportation-pool' },
      { label: 'Male Hall 1', route: '/administration/male-hall-1' },
      { label: 'Female Hall -1', route: '/administration/female-hall-1' },
      { label: 'ICT Cell', route: '/administration/ict-cell' },
      { label: 'Central Store', route: '/administration/central-store' },
      { label: 'Security Section', route: '/administration/security-section' },
      { label: 'Institutional Quality Assurance Cell (IQAC)', route: '/administration/iqac' },
      { label: 'Central Mosque', route: '/administration/central-mosque' },
      { label: 'Estate Section', route: '/administration/estate-section' },
      { label: 'Dormitory', route: '/administration/dormitory' },
      { label: 'Physical Education Office', route: '/administration/physical-education' },
      { label: 'Guest House', route: '/administration/guest-house' },
      { label: 'Male Hall -2', route: '/administration/male-hall-2' },
      { label: 'Female Hall -2', route: '/administration/female-hall-2' },
      { label: 'Institute of Innovation and Entrepreneurship Development', route: '/administration/iied' },
      { label: 'Research & Technology Transfer Cell', route: '/administration/rttc' },
      { label: 'Cell for National & International Collaboration', route: '/administration/collaboration-cell' },
      { label: 'All Office', route: '/administration/all-office' },
      { label: 'APA', route: '/administration/apa' },
    ],
  },
  {
    id: 'academic',
    label: 'Academic',
    defaultRoute: '/academics',
    items: [
      { label: 'Academic Programs', route: '/academics/programs' },
      { label: 'Faculties & Deans', route: '/academics/faculty' },
      { label: 'Departments & Chairmen', route: '/academics/departments' },
      { label: 'Academic Calendar', route: '/academics/calendar' },
      { label: 'Forms Download', route: '/academics/forms-download' },
      { label: 'Scholarships', route: '/academics/scholarship' },
      { label: 'Seminars & Workshops', route: '/academics/seminars' },
      { label: 'Journals & Research', route: '/academics/publications' },
    ],
  },
  {
    id: 'facilities',
    label: 'Facilities',
    defaultRoute: '/facilities',
    items: [
      { label: 'Library', route: '/facilities/library' },
      { label: 'Transport', route: '/facilities/transport' },
      { label: 'Residence', route: '/facilities/residence' },
      { label: 'Medical', route: '/facilities/medical' },
      { label: 'ICT Sheba', route: '/facilities/ict-sheba' },
    ],
  },
  {
    id: 'notices',
    label: 'Notices',
    defaultRoute: '/notices',
    items: [
      { label: 'General Notice', route: '/notices/general' },
      { label: 'Job Notice', route: '/notices/job' },
      { label: 'Press Release', route: '/notices/press-release' },
      { label: 'NOC', route: '/notices/noc' },
      { label: 'Result Notice', route: '/notices/result' },
    ],
  },
  {
    id: 'admission',
    label: 'Admission',
    defaultRoute: '/admissions',
    items: [
      { label: 'Undergraduate', route: '/admissions/undergraduate' },
      { label: 'Graduate', route: '/admissions/graduate' },
      { label: 'Evening Programs', route: '/admissions/evening-programs' },
      { label: 'Admission Notice', route: '/admissions/notice' },
    ],
  },
];

// Backward-compatible alias if any module imports NAV_DROPDOWN_GROUPS
export const NAV_DROPDOWN_GROUPS = NAV_GROUPS;

const ALL_VALID_ROUTES = new Set<AppRoute>([
  '/',
  '/notices',
  '/gallery',
  '/career',
  '/verify',
  '/portal',
  '/about/plans',
  '/governance/university-act',
  '/academics/deans',
  '/academics/chairmen',
  '/academics/journals',
  ...NAV_GROUPS.flatMap((g) => [g.defaultRoute, ...g.items.map((i) => i.route)]),
]);

export function parseRouteFromPath(pathname: string): AppRoute {
  const clean = (pathname.replace(/\/+$/, '') || '/') as AppRoute;
  if (clean.startsWith('/academics/departments/')) {
    return '/academics/departments';
  }
  return ALL_VALID_ROUTES.has(clean) ? clean : '/';
}

export function getRouteSectionKey(pathname: string): string {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/') return 'home';
  if (clean.startsWith('/academics/departments/')) {
    const segments = clean.slice('/academics/departments/'.length).split('/').filter(Boolean);
    if (segments.length >= 3 && segments[1] === 'people') {
      return `department-person:${segments[0].toLowerCase()}:${segments[2]}`;
    }
    return `department-detail:${clean.slice('/academics/departments/'.length).toLowerCase()}`;
  }
  for (const prefix of [
    '/governance',
    '/about',
    '/administration',
    '/academics',
    '/admissions',
    '/facilities',
    '/notices',
  ]) {
    if (clean === prefix || clean.startsWith(`${prefix}/`)) {
      return prefix.slice(1);
    }
  }
  return clean;
}

export function isValidSectionSlug(
  section:
    | 'about'
    | 'governance'
    | 'administration'
    | 'academics'
    | 'admissions'
    | 'facilities'
    | 'notices',
  slug: string
): boolean {
  return ALL_VALID_ROUTES.has(`/${section}/${slug}` as AppRoute);
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

const SECTION_ROOT_LABELS: Record<string, string> = {
  '/about': 'About',
  '/governance': 'Governance',
  '/administration': 'Administration',
  '/academics': 'Academics',
  '/facilities': 'Facilities',
  '/notices': 'Notices',
  '/admissions': 'Admissions',
};

const STANDALONE_ROUTE_LABELS: Record<string, string> = {
  '/gallery': 'News & Events Gallery',
  '/career': 'Career',
  '/verify': 'Document Verification',
  '/portal': 'Digital Campus Portal',
  '/offline': 'Offline Mode',
};

export interface BreadcrumbDepartmentPersonRef {
  id: string;
  name: string;
}

export interface BreadcrumbDepartmentRef {
  id?: string;
  code: string;
  name: string;
  chairmanName?: string;
  chairmanProfile?: BreadcrumbDepartmentPersonRef;
  facultyMembers?: ReadonlyArray<BreadcrumbDepartmentPersonRef>;
  contractualFacultyMembers?: ReadonlyArray<BreadcrumbDepartmentPersonRef>;
  officers?: ReadonlyArray<BreadcrumbDepartmentPersonRef>;
}

export interface BreadcrumbOptions {
  departments?: ReadonlyArray<BreadcrumbDepartmentRef>;
}

export function getBreadcrumbsForPath(
  pathname: string,
  options?: BreadcrumbOptions
): BreadcrumbItem[] {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/') {
    return [];
  }

  const crumbs: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];

  if (STANDALONE_ROUTE_LABELS[clean]) {
    crumbs.push({ label: STANDALONE_ROUTE_LABELS[clean] });
    return crumbs;
  }

  if (SECTION_ROOT_LABELS[clean]) {
    crumbs.push({ label: SECTION_ROOT_LABELS[clean] });
    return crumbs;
  }

  if (clean === '/about/plans') {
    crumbs.push({ label: 'About', href: '/about' });
    crumbs.push({ label: 'Strategic Plans' });
    return crumbs;
  }

  if (clean === '/governance/university-act' || clean === '/governance/pust-act') {
    crumbs.push({ label: 'Governance', href: '/governance' });
    crumbs.push({ label: 'PUST Act' });
    return crumbs;
  }

  if (clean === '/academics/deans') {
    crumbs.push({ label: 'Academics', href: '/academics' });
    crumbs.push({ label: 'Faculties & Deans' });
    return crumbs;
  }

  if (clean === '/academics/departments' || clean === '/academics/chairmen') {
    crumbs.push({ label: 'Academics', href: '/academics' });
    crumbs.push({ label: 'Departments' });
    return crumbs;
  }

  if (clean.startsWith('/academics/departments/')) {
    const segments = clean.slice('/academics/departments/'.length).split('/').filter(Boolean);
    const rawSegment = segments[0] || '';
    const deptCode = decodeURIComponent(rawSegment).trim().toUpperCase();
    const matchedDept = options?.departments?.find(
      (dept) => dept.code.trim().toUpperCase() === deptCode
    );
    const deptLabel = matchedDept
      ? `${matchedDept.name} (${matchedDept.code})`
      : `Department of ${deptCode}`;

    crumbs.push({ label: 'Academics', href: '/academics' });
    crumbs.push({ label: 'Departments', href: '/academics/departments' });

    if (segments.length >= 3 && segments[1] === 'people') {
      const personId = decodeURIComponent(segments[2]).trim();
      const deptHref = `/academics/departments/${encodeURIComponent(
        (matchedDept?.code || deptCode).toLowerCase()
      )}`;
      crumbs.push({ label: deptLabel, href: deptHref });

      let personName: string | undefined;
      if (matchedDept) {
        if (matchedDept.chairmanProfile?.id === personId) {
          personName = matchedDept.chairmanProfile.name;
        } else if (matchedDept.id && `${matchedDept.id}-chair` === personId) {
          personName = matchedDept.chairmanName;
        } else {
          const allPeople = [
            ...(matchedDept.facultyMembers ?? []),
            ...(matchedDept.contractualFacultyMembers ?? []),
            ...(matchedDept.officers ?? []),
          ];
          personName = allPeople.find((p) => p.id === personId)?.name;
        }
      }

      crumbs.push({ label: personName || 'Profile' });
      return crumbs;
    }

    crumbs.push({ label: deptLabel });
    return crumbs;
  }

  if (clean === '/academics/journals') {
    crumbs.push({ label: 'Academics', href: '/academics' });
    crumbs.push({ label: 'Journals & Research' });
    return crumbs;
  }

  for (const group of NAV_GROUPS) {
    const matchedItem = group.items.find((item) => item.route === clean);
    if (matchedItem) {
      const parentLabel = SECTION_ROOT_LABELS[group.defaultRoute] || group.label;
      crumbs.push({ label: parentLabel, href: group.defaultRoute });
      crumbs.push({ label: matchedItem.label });
      return crumbs;
    }

    if (clean.startsWith(`${group.defaultRoute}/`)) {
      const parentLabel = SECTION_ROOT_LABELS[group.defaultRoute] || group.label;
      crumbs.push({ label: parentLabel, href: group.defaultRoute });
      crumbs.push({ label: 'Page Not Found' });
      return crumbs;
    }
  }

  crumbs.push({ label: 'Page Not Found' });
  return crumbs;
}
