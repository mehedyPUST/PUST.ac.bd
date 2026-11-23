export type AppRoute =
  | '/'
  | '/about'
  | '/about/our-university'
  | '/about/history'
  | '/about/mission-vision'
  | '/about/plans'
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
  | '/portal';

export interface NavDropdownItem {
  label: string;
  route: AppRoute;
  description?: string;
}

export interface NavDropdownGroup {
  id: 'about' | 'administration' | 'academic' | 'admission' | 'facilities';
  label: string;
  defaultRoute: AppRoute;
  items: NavDropdownItem[];
}

export const NAV_DROPDOWN_GROUPS: NavDropdownGroup[] = [
  {
    id: 'about',
    label: 'About',
    defaultRoute: '/about',
    items: [
      { label: 'Our University', route: '/about/our-university' },
      { label: 'History', route: '/about/history' },
      { label: 'Mission and Vision', route: '/about/mission-vision' },
      { label: 'Strategic Plans', route: '/about/plans' },
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

const ALL_VALID_ROUTES = new Set<AppRoute>([
  '/',
  '/notices',
  '/gallery',
  '/portal',
  ...NAV_DROPDOWN_GROUPS.flatMap((g) => [g.defaultRoute, ...g.items.map((i) => i.route)]),
]);

export function parseRouteFromPath(pathname: string): AppRoute {
  const clean = (pathname.replace(/\/+$/, '') || '/') as AppRoute;
  return ALL_VALID_ROUTES.has(clean) ? clean : '/';
}
