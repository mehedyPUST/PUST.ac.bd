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
  | '/gallery'
  | '/verify'
  | '/portal';

export interface NavSubItem {
  label: string;
  route: AppRoute;
  description?: string;
}

export interface NavGroup {
  id: 'about' | 'governance' | 'administration' | 'academic' | 'admission' | 'facilities';
  label: string;
  defaultRoute: AppRoute;
  items: NavSubItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'about',
    label: 'About',
    defaultRoute: '/about',
    items: [
      { label: 'Our University', route: '/about/our-university' },
      { label: 'History and Plans', route: '/about/history' },
      { label: 'Mission and Vision', route: '/about/mission-vision' },
      { label: 'Strategic Plans', route: '/about/plans' },
    ],
  },
  {
    id: 'governance',
    label: 'Governance',
    defaultRoute: '/governance',
    items: [
      { label: 'University Act', route: '/governance/university-act' },
      { label: 'Regent Board', route: '/governance/regent-board' },
      { label: 'Academic Council', route: '/governance/academic-council' },
      { label: 'Finance Committee', route: '/governance/finance-committee' },
      { label: 'Academic Ordinance', route: '/governance/academic-ordinance' },
    ],
  },
  {
    id: 'administration',
    label: 'Administration',
    defaultRoute: '/administration',
    items: [
      { label: 'VC Office', route: '/administration/vc-office' },
      { label: 'Pro-VC Office', route: '/administration/pro-vc-office' },
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
      { label: 'Faculty', route: '/academics/faculty' },
      { label: 'Departments', route: '/academics/departments' },
      { label: 'Forms Download', route: '/academics/forms-download' },
      { label: 'Academic Calendar', route: '/academics/calendar' },
      { label: 'Scholarship', route: '/academics/scholarship' },
      { label: 'Seminars & Workshops', route: '/academics/seminars' },
      { label: 'All Dean', route: '/academics/deans' },
      { label: 'All Chairman', route: '/academics/chairmen' },
      { label: 'PUST Journals', route: '/academics/journals' },
      { label: 'Publications', route: '/academics/publications' },
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
];

// Backward-compatible alias if any module imports NAV_DROPDOWN_GROUPS
export const NAV_DROPDOWN_GROUPS = NAV_GROUPS;

const ALL_VALID_ROUTES = new Set<AppRoute>([
  '/',
  '/notices',
  '/gallery',
  '/verify',
  '/portal',
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
  '/admissions': 'Admissions',
  '/facilities': 'Facilities',
};

const STANDALONE_ROUTE_LABELS: Record<string, string> = {
  '/notices': 'University Notices',
  '/gallery': 'Campus Gallery',
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

  if (clean === '/governance/pust-act') {
    crumbs.push({ label: 'Governance', href: '/governance' });
    crumbs.push({ label: 'University Act' });
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
