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
  | '/administration/proctor-office'
  | '/administration/student-advisor-office'
  | '/administration/ict-cell'
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
      { label: 'Proctor Office', route: '/administration/proctor-office' },
      { label: 'Student Advisor Office', route: '/administration/student-advisor-office' },
      { label: 'ICT Cell', route: '/administration/ict-cell' },
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
  return ALL_VALID_ROUTES.has(clean) ? clean : '/';
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
  '/verify': 'Document Verification',
  '/portal': 'Digital Campus Portal',
};

export function getBreadcrumbsForPath(pathname: string): BreadcrumbItem[] {
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
