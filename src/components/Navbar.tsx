'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import {
  ChevronDown,
  ChevronRight,
  GraduationCap,
  LayoutGrid,
  Menu,
  Pencil,
  Plus,
  X,
} from 'lucide-react';
import { DEFAULT_NAVBAR_TAGLINE, resolveContextualEditTarget } from '../lib/cmsDefaults';
import { NAV_GROUPS, type AppRoute } from '../lib/routes';
import type {
  AboutContentRecord,
  AuthUser,
  DepartmentRecord,
  EditModalTarget,
  FacultyName,
  GovernanceTabKind,
  UniversityProfile,
} from '../types/pust';
import { AdminModeSwitch } from './AdminModeSwitch';
import { GlobalSearchBar } from './GlobalSearchBar';
import { PustCrest } from './PustCrest';
import { PwaInstallButton } from './PwaManager';

interface NavbarProps {
  route: AppRoute;
  user: AuthUser | null;
  profile?: UniversityProfile | null;
  departments?: DepartmentRecord[];
  editMode?: boolean;
  onToggleEditMode?: () => void;
  onOpenEditModal?: (target: EditModalTarget) => void;
  onOpenCmsDirectory?: () => void;
  onNavigate: (route: AppRoute | string) => void;
}

const HOME_SUBTOPICS = [
  { label: 'Vice-Chancellor’s Message', fullLabel: 'Vice-Chancellor’s Message', href: '/#vc-message' },
  { label: 'Notice Board', fullLabel: 'Notice Board', href: '/#notice-board' },
  { label: 'Recent Publications', fullLabel: 'Recent Publications', href: '/#recent-publications' },
  { label: 'News and Events', fullLabel: 'News & Events', href: '/#news-events' },
  { label: 'Campus Map', fullLabel: 'Campus Map', href: '/#campus-map' },
];

const FACULTY_DISPLAY_ORDER: FacultyName[] = [
  'Faculty of Engineering and Technology',
  'Faculty of Science',
  'Faculty of Business Studies',
  'Faculty of Humanities and Social Science',
  'Faculty of Life and Earth Science',
];

const MOBILE_GROUP_FULL_LABELS: Record<string, string> = {
  governance: 'Governance',
  about: 'About University',
  administration: 'Administration',
  academic: 'Academics',
  facilities: 'Facilities',
  notices: 'Notices',
  admission: 'Admissions',
};

const MOBILE_ROUTE_FULL_LABELS: Partial<Record<AppRoute, string>> = {
  '/governance/pust-act': 'PUST Act (2001)',
  '/governance/regent-board': 'Regent Board',
  '/governance/academic-council': 'Academic Council',
  '/governance/finance-committee': 'Finance Committee',
  '/governance/academic-ordinance': 'Academic Ordinance & Grading',
  '/about/our-university': 'Our University',
  '/about/mission-vision': 'Mission & Vision',
  '/about/history': 'History & Heritage',
  '/about/plans': 'Strategic Plans',
  '/administration/vc-office': 'Office of the Vice-Chancellor',
  '/administration/pro-vc-office': 'Office of the Pro-Vice-Chancellor',
  '/administration/treasurer-office': 'Office of the Treasurer',
  '/administration/registrar-office': 'Office of the Registrar',
  '/administration/controller-office': 'Controller of Examinations',
  '/administration/male-hall-1': 'July 06 Hall (Male Hall – 1)',
  '/administration/female-hall-1': 'Matribhasha Hall (Female Hall – 1)',
  '/administration/ict-cell': 'ICT Cell',
  '/administration/iqac': 'Quality Assurance Cell (IQAC)',
  '/administration/male-hall-2': 'Swadhinota Hall (Male Hall – 2)',
  '/administration/female-hall-2': 'Ganatantra Hall (Female Hall – 2)',
  '/administration/rttc': 'Research & Technology Transfer Cell',
  '/administration/all-office': 'All Offices Directory',
  '/administration/apa': 'Annual Performance Agreement (APA)',
  '/academics': 'Academic Overview',
  '/academics/programs': 'Academic Degree Programs',
  '/academics/faculty': 'Faculties & Deans',
  '/academics/departments': 'Departments & Chairmen',
  '/academics/calendar': 'Academic Calendar',
  '/academics/forms-download': 'Academic Forms Download',
  '/academics/scholarship': 'Scholarships & Financial Aid',
  '/academics/seminars': 'Seminars & Workshops',
  '/academics/publications': 'Journals & Publications',
  '/facilities/library': 'Central Library',
  '/facilities/transport': 'Transport Service',
  '/facilities/residence': 'Residential Halls',
  '/facilities/medical': 'Medical Center',
  '/facilities/ict-sheba': 'ICT Cell & Digital Services',
  '/notices/general': 'General Notices',
  '/notices/job': 'Job & Tender Notices',
  '/notices/press-release': 'Press Releases',
  '/notices/noc': 'NOC & Official Orders',
  '/notices/result': 'Examination Results',
  '/admissions/undergraduate': 'Undergraduate Admissions (GST)',
  '/admissions/graduate': 'Graduate & Postgraduate Admissions',
  '/admissions/evening-programs': 'Evening & Executive Programs',
  '/admissions/notice': 'Admission Notices',
};

export function Navbar({
  route,
  user,
  profile,
  departments = [],
  editMode = false,
  onToggleEditMode,
  onOpenEditModal,
  onOpenCmsDirectory,
  onNavigate,
}: NavbarProps) {
  const pathname = usePathname() || '/';
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  const groupedDepartments = useMemo(() => {
    const groups: Array<{ faculty: string; items: DepartmentRecord[] }> = [];
    const seen = new Set<string>();

    for (const faculty of FACULTY_DISPLAY_ORDER) {
      const items = departments.filter((d) => d.faculty === faculty);
      if (items.length > 0) {
        groups.push({ faculty, items });
        seen.add(faculty);
      }
    }

    for (const dept of departments) {
      if (!seen.has(dept.faculty)) {
        seen.add(dept.faculty);
        groups.push({
          faculty: dept.faculty,
          items: departments.filter((d) => d.faculty === dept.faculty),
        });
      }
    }

    return groups;
  }, [departments]);

  useEffect(() => {
    setHoveredGroup(null);
    setMobileMenuOpen(false);
  }, [pathname, route]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    function handleOutside(e: MouseEvent | TouchEvent) {
      const target = e.target as Node;
      const insideHeader = navRef.current?.contains(target) ?? false;
      const insideDrawer = drawerRef.current?.contains(target) ?? false;
      if (!insideHeader && !insideDrawer) {
        setHoveredGroup(null);
        setMobileMenuOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setHoveredGroup(null);
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside, { passive: true });
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  function openOrToggleMobileDrawer() {
    setMobileMenuOpen((prev) => {
      const next = !prev;
      if (next) {
        if (pathname.startsWith('/academics/departments')) {
          setMobileExpanded('departments');
        } else if (route.startsWith('/academics')) {
          setMobileExpanded('academic');
        } else {
          const activeGroup = NAV_GROUPS.find(
            (group) =>
              route === group.defaultRoute ||
              group.items.some((item) => item.route === route) ||
              route.startsWith(
                `/${
                  group.id === 'academic'
                    ? 'academics'
                    : group.id === 'admission'
                    ? 'admissions'
                    : group.id
                }`
              )
          );
          setMobileExpanded(activeGroup?.id ?? null);
        }
      }
      return next;
    });
  }

  function go(target: AppRoute | string) {
    setHoveredGroup(null);
    setMobileMenuOpen(false);
    onNavigate(target);
  }

  const aboutGroup = NAV_GROUPS.find((g) => g.id === 'about')!;
  const governanceGroup = NAV_GROUPS.find((g) => g.id === 'governance')!;
  const adminGroup = NAV_GROUPS.find((g) => g.id === 'administration')!;
  const academicGroup = NAV_GROUPS.find((g) => g.id === 'academic')!;
  const facilitiesGroup = NAV_GROUPS.find((g) => g.id === 'facilities')!;
  const noticesGroup = NAV_GROUPS.find((g) => g.id === 'notices')!;
  const admissionGroup = NAV_GROUPS.find((g) => g.id === 'admission')!;

  return (
    <>
      <header
        ref={navRef}
        className="sticky top-0 z-40 bg-white shadow-[0_1px_4px_-1px_rgba(28,25,23,0.1)] print:hidden"
      >
      <div className="relative z-10">
        {/* Full-bleed upper institutional title band backdrop */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 bottom-0 lg:bottom-auto lg:h-[64px] xl:h-[68px] bg-gradient-to-r from-[#48070B] via-[#680B10] to-[#48070B] lg:border-b lg:border-gold-500/35"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-stretch">
          {/* Left Column: Official University Crest */}
          <Link
            href="/"
            onClick={() => {
              setHoveredGroup(null);
              setMobileMenuOpen(false);
            }}
            title="Pabna University of Science and Technology"
            className="relative z-10 my-1.5 lg:my-0 rounded-md lg:rounded-none bg-white p-[3px] lg:p-3 flex items-center justify-center shrink-0 self-center lg:self-stretch"
          >
            <PustCrest size={24} className="lg:hidden" />
            <PustCrest size={80} className="hidden lg:block xl:hidden" />
            <PustCrest size={84} className="hidden xl:block" />
          </Link>

          {/* Right Column: Tier 1 University Title & Search + Tier 2 Nav & Portal */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Tier 1: University Title Band + Stacked Est. Tagline (md+) & Always-Expanded Search (Right) */}
            <div className="min-h-[54px] sm:h-[60px] lg:h-[64px] xl:h-[68px] py-1 lg:py-0 pl-3 sm:pl-4 pr-0 lg:pl-5 lg:pr-0 xl:pl-6 xl:pr-0 flex items-center justify-between gap-2 sm:gap-4 text-white">
              <div className="min-w-0 flex-1 flex flex-col justify-center">
                <Link
                  href="/"
                  onClick={() => {
                    setHoveredGroup(null);
                    setMobileMenuOpen(false);
                  }}
                  className="block font-serif text-[clamp(0.78rem,3.1vw,0.94rem)] leading-[1.16] sm:text-[15px] md:text-base lg:text-[clamp(1.15rem,0.95rem+0.45vw,1.45rem)] sm:leading-tight font-medium tracking-tight text-white hover:text-gold-200 transition-colors line-clamp-2 sm:line-clamp-none sm:truncate"
                >
                  Pabna University of Science and Technology
                </Link>
                <span className="hidden md:block text-[11px] font-medium tracking-wider text-gold-300/95 leading-tight mt-0.5 truncate">
                  {profile?.navbarTagline?.trim() || DEFAULT_NAVBAR_TAGLINE}
                </span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                {user?.role === 'admin' && editMode && onOpenEditModal && (
                  <button
                    type="button"
                    onClick={() => onOpenEditModal({ kind: 'hero-profile' })}
                    aria-label="Edit navbar tagline and hero profile"
                    title="Edit Tagline & Profile"
                    className="hidden lg:inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-400 text-slate-950 text-[10px] font-semibold hover:bg-amber-300 cursor-pointer"
                  >
                    <Pencil className="w-2.5 h-2.5" />
                    Edit Title
                  </button>
                )}

                <div className="hidden sm:block">
                  <GlobalSearchBar variant="desktop" />
                </div>

                {/* Mobile Admin Mode Toggle Switch */}
                {user?.role === 'admin' && onToggleEditMode && (
                  <AdminModeSwitch
                    checked={editMode}
                    onToggle={onToggleEditMode}
                    variant="mobile"
                  />
                )}

                {/* Mobile Portal CTA & Menu Trigger */}
                <Link
                  href={route === '/portal' ? '/' : '/portal'}
                  onClick={() => {
                    setHoveredGroup(null);
                    setMobileMenuOpen(false);
                  }}
                  className="lg:hidden min-h-[30px] inline-flex items-center px-2 sm:px-3 py-1 rounded-md text-[11px] sm:text-xs font-semibold bg-white text-pust-800 hover:bg-gold-50 shadow-xs transition-colors whitespace-nowrap shrink-0"
                >
                  {route === '/portal' ? (
                    'Public Site'
                  ) : user ? (
                    <>
                      <span className="sm:hidden">Portal</span>
                      <span className="hidden sm:inline">{`${user.name.split(' ')[0]} · Portal`}</span>
                    </>
                  ) : (
                    'Portal'
                  )}
                </Link>
                <button
                  type="button"
                  onClick={openOrToggleMobileDrawer}
                  aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                  aria-expanded={mobileMenuOpen}
                  aria-controls="mobile-off-canvas-drawer"
                  className={`lg:hidden w-8 h-8 sm:w-9 sm:h-9 inline-flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                    mobileMenuOpen ? 'bg-pust-800 text-white' : 'text-white hover:bg-pust-700'
                  }`}
                >
                  {mobileMenuOpen ? <X className="w-[18px] h-[18px]" /> : <Menu className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>

            {/* Tier 2: Desktop Navigation Links Strip + Portal */}
            <div className="hidden lg:flex h-10 pl-4 pr-0 lg:pl-5 lg:pr-0 xl:pl-6 xl:pr-0 bg-white items-center justify-between gap-4">
              <nav
                aria-label="Primary navigation"
                className="flex items-center gap-3.5 xl:gap-5 2xl:gap-6 text-[clamp(0.8125rem,0.75rem+0.12vw,0.9rem)] font-medium text-slate-900"
              >
                {/* Home */}
                <div
                  className="relative"
                  onMouseEnter={() => setHoveredGroup('home')}
                  onMouseLeave={() => setHoveredGroup((prev) => (prev === 'home' ? null : prev))}
                >
                  <Link
                    href="/"
                    aria-haspopup="true"
                    aria-expanded={hoveredGroup === 'home'}
                    onClick={() => setHoveredGroup(null)}
                    className={`h-10 inline-flex items-center border-y-2 border-t-transparent transition-colors whitespace-nowrap shrink-0 ${
                      route === '/'
                        ? 'border-b-pust-800 text-pust-800 font-semibold'
                        : 'border-b-transparent hover:text-pust-900 hover:border-b-pust-200'
                    }`}
                  >
                    Home
                  </Link>
                  {hoveredGroup === 'home' && (
                    <div className="absolute left-0 top-full pt-1 w-60 z-50">
                      <div className="bg-white rounded-xl border border-stone-200 shadow-[0_14px_32px_-12px_rgba(28,25,23,0.16)] p-1.5 space-y-0.5">
                        {HOME_SUBTOPICS.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setHoveredGroup(null)}
                            className="block rounded-lg px-3 py-2 text-xs text-slate-700 hover:bg-[#FAF9F6] hover:text-pust-900 transition-colors"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Governance */}
                <div
                  className="relative"
                  onMouseEnter={() => setHoveredGroup('governance')}
                  onMouseLeave={() =>
                    setHoveredGroup((prev) => (prev === 'governance' ? null : prev))
                  }
                >
                  <Link
                    href="/governance"
                    aria-haspopup="true"
                    aria-expanded={hoveredGroup === 'governance'}
                    onClick={() => setHoveredGroup(null)}
                    className={`h-10 inline-flex items-center border-y-2 border-t-transparent transition-colors whitespace-nowrap shrink-0 ${
                      route.startsWith('/governance')
                        ? 'border-b-pust-800 text-pust-800 font-semibold'
                        : 'border-b-transparent hover:text-pust-900 hover:border-b-pust-200'
                    }`}
                  >
                    Governance
                  </Link>
                  {hoveredGroup === 'governance' && (
                    <div className="absolute left-0 top-full pt-1 w-60 z-50">
                      <div className="bg-white rounded-xl border border-stone-200 shadow-[0_14px_32px_-12px_rgba(28,25,23,0.16)] p-1.5 space-y-0.5">
                        {governanceGroup.items.map((item) => (
                          <Link
                            key={item.route}
                            href={item.route}
                            onClick={() => setHoveredGroup(null)}
                            className={`block rounded-lg px-3 py-2 text-xs transition-colors ${
                              route === item.route ||
                              (route === '/governance/university-act' &&
                                item.route === '/governance/pust-act')
                                ? 'bg-[#FAF9F6] text-pust-900 font-semibold'
                                : 'text-slate-700 hover:bg-[#FAF9F6] hover:text-pust-900'
                            }`}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* About */}
                <div
                  className="relative"
                  onMouseEnter={() => setHoveredGroup('about')}
                  onMouseLeave={() => setHoveredGroup((prev) => (prev === 'about' ? null : prev))}
                >
                  <Link
                    href="/about"
                    aria-haspopup="true"
                    aria-expanded={hoveredGroup === 'about'}
                    onClick={() => setHoveredGroup(null)}
                    className={`h-10 inline-flex items-center border-y-2 border-t-transparent transition-colors whitespace-nowrap shrink-0 ${
                      route.startsWith('/about')
                        ? 'border-b-pust-800 text-pust-800 font-semibold'
                        : 'border-b-transparent hover:text-pust-900 hover:border-b-pust-200'
                    }`}
                  >
                    About
                  </Link>
                  {hoveredGroup === 'about' && (
                    <div className="absolute left-0 top-full pt-1 w-56 z-50">
                      <div className="bg-white rounded-xl border border-stone-200 shadow-[0_14px_32px_-12px_rgba(28,25,23,0.16)] p-1.5 space-y-0.5">
                        {aboutGroup.items.map((item) => (
                          <Link
                            key={item.route}
                            href={item.route}
                            onClick={() => setHoveredGroup(null)}
                            className={`block rounded-lg px-3 py-2 text-xs transition-colors ${
                              route === item.route
                                ? 'bg-[#FAF9F6] text-pust-900 font-semibold'
                                : 'text-slate-700 hover:bg-[#FAF9F6] hover:text-pust-900'
                            }`}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Administration */}
                <div
                  className="relative"
                  onMouseEnter={() => setHoveredGroup('administration')}
                  onMouseLeave={() =>
                    setHoveredGroup((prev) => (prev === 'administration' ? null : prev))
                  }
                >
                  <Link
                    href="/administration"
                    aria-haspopup="true"
                    aria-expanded={hoveredGroup === 'administration'}
                    onClick={() => setHoveredGroup(null)}
                    className={`h-10 inline-flex items-center border-y-2 border-t-transparent transition-colors whitespace-nowrap shrink-0 ${
                      route.startsWith('/administration')
                        ? 'border-b-pust-800 text-pust-800 font-semibold'
                        : 'border-b-transparent hover:text-pust-900 hover:border-b-pust-200'
                    }`}
                  >
                    Administration
                  </Link>
                  {hoveredGroup === 'administration' && (
                    <div className="absolute left-0 xl:-left-24 top-full pt-1 w-[680px] xl:w-[780px] max-w-[calc(100vw-2rem)] z-50">
                      <div className="bg-white rounded-xl border border-stone-200 shadow-[0_14px_32px_-12px_rgba(28,25,23,0.16)] p-2.5 max-h-[75vh] overflow-y-auto grid grid-cols-2 lg:grid-cols-3 gap-1">
                        {adminGroup.items.map((item) => (
                          <Link
                            key={item.route}
                            href={item.route}
                            onClick={() => setHoveredGroup(null)}
                            className={`block rounded-lg px-2.5 py-2 text-[11.5px] leading-snug transition-colors ${
                              route === item.route
                                ? 'bg-[#FAF9F6] text-pust-900 font-semibold'
                                : 'text-slate-700 hover:bg-[#FAF9F6] hover:text-pust-900'
                            }`}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Academic */}
                <div
                  className="relative"
                  onMouseEnter={() => setHoveredGroup('academic')}
                  onMouseLeave={() =>
                    setHoveredGroup((prev) => (prev === 'academic' ? null : prev))
                  }
                >
                  <Link
                    href="/academics"
                    aria-haspopup="true"
                    aria-expanded={hoveredGroup === 'academic'}
                    onClick={() => setHoveredGroup(null)}
                    className={`h-10 inline-flex items-center border-y-2 border-t-transparent transition-colors whitespace-nowrap shrink-0 ${
                      route.startsWith('/academics')
                        ? 'border-b-pust-800 text-pust-800 font-semibold'
                        : 'border-b-transparent hover:text-pust-900 hover:border-b-pust-200'
                    }`}
                  >
                    Academic
                  </Link>
                  {hoveredGroup === 'academic' && (
                    <div className="absolute left-0 top-full pt-1 w-[420px] max-w-[calc(100vw-2rem)] z-50">
                      <div className="bg-white rounded-xl border border-stone-200 shadow-[0_14px_32px_-12px_rgba(28,25,23,0.16)] p-2 grid grid-cols-2 gap-1">
                        {academicGroup.items.map((item) => (
                          <Link
                            key={item.route}
                            href={item.route}
                            onClick={() => setHoveredGroup(null)}
                            className={`block rounded-lg px-3 py-2 text-xs transition-colors ${
                              route === item.route
                                ? 'bg-[#FAF9F6] text-pust-900 font-semibold'
                                : 'text-slate-700 hover:bg-[#FAF9F6] hover:text-pust-900'
                            }`}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Facilities */}
                <div
                  className="relative"
                  onMouseEnter={() => setHoveredGroup('facilities')}
                  onMouseLeave={() =>
                    setHoveredGroup((prev) => (prev === 'facilities' ? null : prev))
                  }
                >
                  <Link
                    href="/facilities"
                    aria-haspopup="true"
                    aria-expanded={hoveredGroup === 'facilities'}
                    onClick={() => setHoveredGroup(null)}
                    className={`h-10 inline-flex items-center border-y-2 border-t-transparent transition-colors whitespace-nowrap shrink-0 ${
                      route.startsWith('/facilities')
                        ? 'border-b-pust-800 text-pust-800 font-semibold'
                        : 'border-b-transparent hover:text-pust-900 hover:border-b-pust-200'
                    }`}
                  >
                    Facilities
                  </Link>
                  {hoveredGroup === 'facilities' && (
                    <div className="absolute right-0 top-full pt-1 w-56 z-50">
                      <div className="bg-white rounded-xl border border-stone-200 shadow-[0_14px_32px_-12px_rgba(28,25,23,0.16)] p-1.5 space-y-0.5">
                        {facilitiesGroup.items.map((item) => (
                          <Link
                            key={item.route}
                            href={item.route}
                            onClick={() => setHoveredGroup(null)}
                            className={`block rounded-lg px-3 py-2 text-xs transition-colors ${
                              route === item.route
                                ? 'bg-[#FAF9F6] text-pust-900 font-semibold'
                                : 'text-slate-700 hover:bg-[#FAF9F6] hover:text-pust-900'
                            }`}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Notices */}
                <div
                  className="relative"
                  onMouseEnter={() => setHoveredGroup('notices')}
                  onMouseLeave={() =>
                    setHoveredGroup((prev) => (prev === 'notices' ? null : prev))
                  }
                >
                  <Link
                    href="/notices"
                    aria-haspopup="true"
                    aria-expanded={hoveredGroup === 'notices'}
                    onClick={() => setHoveredGroup(null)}
                    className={`h-10 inline-flex items-center border-y-2 border-t-transparent transition-colors whitespace-nowrap shrink-0 ${
                      route.startsWith('/notices')
                        ? 'border-b-pust-800 text-pust-800 font-semibold'
                        : 'border-b-transparent hover:text-pust-900 hover:border-b-pust-200'
                    }`}
                  >
                    Notices
                  </Link>
                  {hoveredGroup === 'notices' && (
                    <div className="absolute right-0 top-full pt-1 w-56 z-50">
                      <div className="bg-white rounded-xl border border-stone-200 shadow-[0_14px_32px_-12px_rgba(28,25,23,0.16)] p-1.5 space-y-0.5">
                        {noticesGroup.items.map((item) => (
                          <Link
                            key={item.route}
                            href={item.route}
                            onClick={() => setHoveredGroup(null)}
                            className={`block rounded-lg px-3 py-2 text-xs transition-colors ${
                              route === item.route
                                ? 'bg-[#FAF9F6] text-pust-900 font-semibold'
                                : 'text-slate-700 hover:bg-[#FAF9F6] hover:text-pust-900'
                            }`}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Admission */}
                <div
                  className="relative"
                  onMouseEnter={() => setHoveredGroup('admission')}
                  onMouseLeave={() =>
                    setHoveredGroup((prev) => (prev === 'admission' ? null : prev))
                  }
                >
                  <Link
                    href="/admissions"
                    aria-haspopup="true"
                    aria-expanded={hoveredGroup === 'admission'}
                    onClick={() => setHoveredGroup(null)}
                    className={`h-10 inline-flex items-center border-y-2 border-t-transparent transition-colors whitespace-nowrap shrink-0 ${
                      route.startsWith('/admissions')
                        ? 'border-b-pust-800 text-pust-800 font-semibold'
                        : 'border-b-transparent hover:text-pust-900 hover:border-b-pust-200'
                    }`}
                  >
                    Admission
                  </Link>
                  {hoveredGroup === 'admission' && (
                    <div className="absolute right-0 top-full pt-1 w-56 z-50">
                      <div className="bg-white rounded-xl border border-stone-200 shadow-[0_14px_32px_-12px_rgba(28,25,23,0.16)] p-1.5 space-y-0.5">
                        {admissionGroup.items.map((item) => (
                          <Link
                            key={item.route}
                            href={item.route}
                            onClick={() => setHoveredGroup(null)}
                            className={`block rounded-lg px-3 py-2 text-xs transition-colors ${
                              route === item.route
                                ? 'bg-[#FAF9F6] text-pust-900 font-semibold'
                                : 'text-slate-700 hover:bg-[#FAF9F6] hover:text-pust-900'
                            }`}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Verify */}
                <Link
                  href="/verify"
                  onClick={() => setHoveredGroup(null)}
                  className={`h-10 inline-flex items-center border-y-2 border-t-transparent transition-colors whitespace-nowrap shrink-0 ${
                    route === '/verify'
                      ? 'border-b-pust-800 text-pust-800 font-semibold'
                      : 'border-b-transparent hover:text-pust-900 hover:border-b-pust-200'
                  }`}
                >
                  Verify
                </Link>
              </nav>

              {/* Desktop Admin Mode Toggle Switch & Portal Action */}
              <div className="flex items-center gap-2 shrink-0">
                {user?.role === 'admin' && onToggleEditMode && (
                  <AdminModeSwitch
                    checked={editMode}
                    onToggle={onToggleEditMode}
                    variant="desktop"
                  />
                )}

                <Link
                  href={route === '/portal' ? '/' : '/portal'}
                  onClick={() => {
                    setHoveredGroup(null);
                    setMobileMenuOpen(false);
                  }}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold btn-primary-sheen transition-all whitespace-nowrap shrink-0"
                >
                  {route === '/portal'
                    ? 'Public Website'
                    : user
                    ? `${user.name.split(' ')[0]} · Portal`
                    : 'Portal'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Slim Active Admin Edit Mode Banner */}
      {user?.role === 'admin' && editMode && (() => {
        const contextual = resolveContextualEditTarget(route);
        function openContextual() {
          if (!contextual || !onOpenEditModal) return;
          const k = contextual.targetKind;
          if (k === 'governance') {
            const tab: GovernanceTabKind =
              route === '/governance/regent-board'
                ? 'regent-board'
                : route === '/governance/academic-council'
                ? 'academic-council'
                : route === '/governance/finance-committee'
                ? 'finance-committee'
                : route === '/governance/academic-ordinance'
                ? 'academic-ordinance'
                : 'pust-act';
            onOpenEditModal({ kind: 'governance', tab });
          } else if (k === 'about') {
            const slug: AboutContentRecord['slug'] =
              route === '/about/history'
                ? 'history'
                : route === '/about/mission-vision'
                ? 'mission-vision'
                : route === '/about/plans'
                ? 'plans'
                : 'our-university';
            onOpenEditModal({ kind: 'about', slug });
          } else if (k === 'facility') {
            onOpenEditModal({ kind: 'facility', route });
          } else if (k === 'department') {
            onOpenEditModal({ kind: 'department', department: null });
          } else if (k === 'gallery') {
            onOpenEditModal({ kind: 'gallery', item: null });
          } else if (k === 'notice') {
            onOpenEditModal({
              kind: 'notice',
              notice: null,
              defaultCategory: contextual.noticeCategory,
            });
          } else if (k === 'admin-office') {
            onOpenEditModal({ kind: 'admin-office', officeSlug: contextual.officeSlug });
          } else if (
            k === 'hero-profile' ||
            k === 'verify-page' ||
            k === 'admissions-info' ||
            k === 'degree-programs' ||
            k === 'faculty-deans' ||
            k === 'academic-calendar' ||
            k === 'scholarships' ||
            k === 'download-forms' ||
            k === 'seminars' ||
            k === 'apa-benchmarks' ||
            k === 'journals'
          ) {
            onOpenEditModal({ kind: k });
          }
        }

        return (
          <div className="relative z-10 border-t border-amber-300/90 bg-amber-50/95 backdrop-blur-xs text-amber-950 shadow-[0_2px_10px_-4px_rgba(180,83,9,0.18)]">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-1.5 md:py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-1.5 md:gap-2 text-xs">
              <div className="hidden md:flex items-center gap-2 shrink-0">
                <Pencil className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                <span className="font-semibold">Admin Edit Mode Active</span>
                <kbd className="hidden xl:inline px-1.5 py-0.5 rounded bg-amber-200/70 border border-amber-300 font-mono text-[10px] font-semibold text-amber-950">
                  Alt+E
                </kbd>
                <span className="hidden 2xl:inline text-amber-900">
                  — Edit sections inline or open any module from the CMS Directory.
                </span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar md:flex-wrap pb-0.5 md:pb-0">
                {onOpenCmsDirectory && (
                  <button
                    type="button"
                    onClick={onOpenCmsDirectory}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-pust-900 text-white font-semibold hover:bg-pust-950 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <LayoutGrid className="w-3 h-3" />
                    CMS Directory
                  </button>
                )}
                {onOpenEditModal && (
                  <>
                    {contextual && (
                      <button
                        type="button"
                        onClick={openContextual}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-400 border border-amber-500 text-slate-950 font-semibold hover:bg-amber-300 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        {contextual.label}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onOpenEditModal({ kind: 'hero-profile' })}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-amber-400 text-amber-950 font-semibold hover:bg-amber-100 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                      Hero &amp; Tagline
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenEditModal({ kind: 'banner' })}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-amber-400 text-amber-950 font-semibold hover:bg-amber-100 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                      Banners
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenEditModal({ kind: 'notice', notice: null })}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-amber-400 text-amber-950 font-semibold hover:bg-amber-100 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      New Notice
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenEditModal({ kind: 'campus-building' })}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-amber-400 text-amber-950 font-semibold hover:bg-amber-100 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                      Campus Map
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenEditModal({ kind: 'footer-config' })}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-amber-400 text-amber-950 font-semibold hover:bg-amber-100 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                      Footer
                    </button>
                  </>
                )}
                {onToggleEditMode && (
                  <button
                    type="button"
                    onClick={onToggleEditMode}
                    className="px-2.5 py-1 rounded-md bg-slate-900 text-white font-semibold hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Done Editing
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Always-Expanded Mobile Search Strip (< sm) */}
      <div className="sm:hidden relative z-10 border-b border-stone-200 bg-white px-4 py-2">
        <GlobalSearchBar variant="mobile" />
      </div>
      </header>

      {/* Slide-Out Off-Canvas Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="lg:hidden print:hidden">
            <motion.div
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-[55] bg-slate-950/55 backdrop-blur-[2px]"
            />

            <motion.aside
              ref={drawerRef}
              id="mobile-off-canvas-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile university navigation drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 36, mass: 0.9 }}
              className="fixed inset-y-0 right-0 z-[56] w-[min(78vw,310px)] h-dvh bg-white border-l border-stone-200 shadow-2xl flex flex-col"
            >
              {/* Drawer Institutional Header */}
              <div className="shrink-0 bg-gradient-to-r from-[#48070B] via-[#680B10] to-[#48070B] text-white px-3.5 py-2.5 border-b border-gold-500/35 flex items-center justify-between gap-2.5">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 min-w-0 flex-1 text-left"
                >
                  <span className="shrink-0 rounded-md bg-white p-1 flex items-center justify-center">
                    <PustCrest size={22} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-serif text-[12px] font-medium leading-tight text-white text-left">
                      Pabna University of Science and Technology
                    </p>
                    <p className="text-[10.5px] text-gold-300 font-medium mt-0.5 text-left truncate">
                      {profile?.navbarTagline?.trim() || DEFAULT_NAVBAR_TAGLINE}
                    </p>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation drawer"
                  className="min-w-[36px] min-h-[36px] inline-flex items-center justify-center rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Search Strip */}
              <div className="shrink-0 relative z-30 px-3.5 py-2.5 bg-[#FAF9F6] border-b border-stone-200">
                <GlobalSearchBar
                  variant="mobile"
                  onActionComplete={() => setMobileMenuOpen(false)}
                />
              </div>

              {/* Scrollable Navigation Sections */}
              <nav
                aria-label="Mobile navigation"
                className="relative z-10 flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-1.5 space-y-0.5 text-[13.5px]"
              >
                {/* Home */}
                <div className="border-b border-stone-200/80">
                  <div className="flex items-center justify-between gap-1">
                    <button
                      type="button"
                      onClick={() => go('/')}
                      className={`flex-1 min-h-[44px] text-left py-2.5 px-2 font-medium cursor-pointer ${
                        route === '/' ? 'text-pust-900 font-semibold' : 'text-slate-900 hover:text-pust-900'
                      }`}
                    >
                      Home
                    </button>
                    <button
                      type="button"
                      aria-label="Toggle Home sections"
                      aria-expanded={mobileExpanded === 'home'}
                      onClick={() => setMobileExpanded(mobileExpanded === 'home' ? null : 'home')}
                      className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-slate-500 hover:text-pust-900 cursor-pointer shrink-0"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          mobileExpanded === 'home' ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </div>
                  {mobileExpanded === 'home' && (
                    <div className="pl-2.5 pr-2 py-2 space-y-1 bg-[#FAF9F6] border border-stone-200/80 rounded-lg mb-2.5">
                      {HOME_SUBTOPICS.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center min-h-[40px] w-full text-left py-2 px-2.5 text-[13px] leading-snug rounded-md text-slate-700 hover:text-pust-900 hover:bg-white transition-colors"
                        >
                          {item.fullLabel}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* All Primary Navigation Groups + Dedicated Full-Form Academic Departments */}
                {NAV_GROUPS.map((group) => {
                  const expanded = mobileExpanded === group.id;
                  const isGroupActive =
                    route === group.defaultRoute ||
                    group.items.some((item) => item.route === route) ||
                    route.startsWith(
                      `/${
                        group.id === 'academic'
                          ? 'academics'
                          : group.id === 'admission'
                          ? 'admissions'
                          : group.id
                      }`
                    );
                  const groupFullLabel = MOBILE_GROUP_FULL_LABELS[group.id] || group.label;

                  return (
                    <div key={group.id}>
                      <div className="border-b border-stone-200/80">
                        <div className="flex items-center justify-between gap-1">
                          <button
                            type="button"
                            onClick={() => go(group.defaultRoute)}
                            className={`flex-1 min-h-[44px] text-left py-2.5 px-2 font-medium leading-snug cursor-pointer ${
                              isGroupActive
                                ? 'text-pust-900 font-semibold'
                                : 'text-slate-900 hover:text-pust-900'
                            }`}
                          >
                            {groupFullLabel}
                          </button>
                          <button
                            type="button"
                            aria-label={`Toggle ${groupFullLabel}`}
                            aria-expanded={expanded}
                            onClick={() => setMobileExpanded(expanded ? null : group.id)}
                            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-slate-500 hover:text-pust-900 cursor-pointer shrink-0"
                          >
                            <ChevronDown
                              className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
                            />
                          </button>
                        </div>

                        {expanded && (
                          <div className="pl-2.5 pr-2 py-2 space-y-1 bg-[#FAF9F6] border border-stone-200/80 rounded-lg mb-2.5">
                            {group.id === 'academic' && (
                              <button
                                type="button"
                                onClick={() => go('/academics')}
                                className={`flex items-center min-h-[40px] w-full text-left py-2 px-2.5 text-[13px] leading-snug rounded-md cursor-pointer transition-colors ${
                                  pathname === '/academics'
                                    ? 'text-pust-900 font-semibold bg-white border border-stone-200'
                                    : 'text-slate-700 hover:text-pust-900 hover:bg-white'
                                }`}
                              >
                                {MOBILE_ROUTE_FULL_LABELS['/academics']}
                              </button>
                            )}

                            {group.items.map((item) => {
                              const fullLabel = MOBILE_ROUTE_FULL_LABELS[item.route] || item.label;
                              const isItemActive =
                                route === item.route ||
                                (route === '/governance/university-act' &&
                                  item.route === '/governance/pust-act');
                              return (
                                <button
                                  key={item.route}
                                  type="button"
                                  onClick={() => go(item.route)}
                                  className={`flex items-center min-h-[40px] w-full text-left py-2 px-2.5 text-[13px] leading-snug rounded-md cursor-pointer transition-colors ${
                                    isItemActive
                                      ? 'text-pust-900 font-semibold bg-white border border-stone-200'
                                      : 'text-slate-700 hover:text-pust-900 hover:bg-white'
                                  }`}
                                >
                                  {fullLabel}
                                </button>
                              );
                            })}

                            {group.id === 'academic' && departments.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setMobileExpanded('departments')}
                                className="mt-1.5 flex items-center justify-between gap-2 min-h-[42px] w-full text-left py-2 px-2.5 text-[13px] font-semibold rounded-md bg-white border border-stone-200 text-pust-900 hover:bg-pust-50 transition-colors cursor-pointer"
                              >
                                <span className="inline-flex items-center gap-2 min-w-0">
                                  <GraduationCap className="w-4 h-4 shrink-0 text-pust-800" />
                                  <span>
                                    Browse All {departments.length} Departments
                                  </span>
                                </span>
                                <ChevronRight className="w-4 h-4 shrink-0 text-pust-700" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Full-Form Academic Departments Directory right under Academic */}
                      {group.id === 'academic' && departments.length > 0 && (
                        <div className="border-b border-stone-200/80">
                          <div className="flex items-center justify-between gap-1">
                            <button
                              type="button"
                              onClick={() => go('/academics/departments')}
                              className={`flex-1 min-h-[44px] text-left py-2.5 px-2 font-medium leading-snug cursor-pointer flex items-center justify-between gap-2 ${
                                pathname.startsWith('/academics/departments')
                                  ? 'text-pust-900 font-semibold'
                                  : 'text-slate-900 hover:text-pust-900'
                              }`}
                            >
                              <span>Departments</span>
                              <span className="font-mono text-[11px] font-medium text-slate-500 tabular-nums shrink-0">
                                {departments.length}
                              </span>
                            </button>
                            <button
                              type="button"
                              aria-label="Toggle All Academic Departments by Faculty"
                              aria-expanded={mobileExpanded === 'departments'}
                              onClick={() =>
                                setMobileExpanded(
                                  mobileExpanded === 'departments' ? null : 'departments'
                                )
                              }
                              className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-slate-500 hover:text-pust-900 cursor-pointer shrink-0"
                            >
                              <ChevronDown
                                className={`w-4 h-4 transition-transform ${
                                  mobileExpanded === 'departments' ? 'rotate-180' : ''
                                }`}
                              />
                            </button>
                          </div>

                          {mobileExpanded === 'departments' && (
                            <div className="pl-2.5 pr-2 py-2.5 space-y-3 bg-[#FAF9F6] border border-stone-200/80 rounded-lg mb-2.5">
                              {groupedDepartments.map((facultyGroup) => (
                                <div key={facultyGroup.faculty} className="space-y-1">
                                  <p className="px-2 pt-1 pb-1 text-[10px] font-mono uppercase tracking-[0.12em] text-pust-800 border-b border-stone-200 text-left">
                                    {facultyGroup.faculty}
                                  </p>
                                  {facultyGroup.items.map((dept) => {
                                    const deptHref = `/academics/departments/${encodeURIComponent(
                                      dept.code.toLowerCase()
                                    )}`;
                                    const isDeptActive =
                                      pathname.toLowerCase() === deptHref.toLowerCase();
                                    return (
                                      <button
                                        key={dept.id}
                                        type="button"
                                        onClick={() => go(deptHref)}
                                        className={`flex items-start justify-between gap-2 min-h-[40px] w-full text-left py-2 px-2.5 text-[13px] leading-snug rounded-md cursor-pointer transition-colors ${
                                          isDeptActive
                                            ? 'text-pust-900 font-semibold bg-white border border-stone-200'
                                            : 'text-slate-800 hover:text-pust-900 hover:bg-white'
                                        }`}
                                      >
                                        <span className="min-w-0 text-left">
                                          Department of {dept.name}
                                        </span>
                                        <span className="font-mono text-[10.5px] text-slate-500 shrink-0 mt-0.5 tabular-nums">
                                          {dept.code}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Standalone Links */}
                <button
                  type="button"
                  onClick={() => go('/verify')}
                  className={`w-full min-h-[44px] text-left py-2.5 px-2 border-b border-stone-200/80 font-medium leading-snug cursor-pointer ${
                    route === '/verify'
                      ? 'text-pust-900 font-semibold'
                      : 'text-slate-900 hover:text-pust-900'
                  }`}
                >
                  Document Verification
                </button>
                <button
                  type="button"
                  onClick={() => go('/gallery')}
                  className={`w-full min-h-[44px] text-left py-2.5 px-2 font-medium leading-snug cursor-pointer ${
                    route === '/gallery'
                      ? 'text-pust-900 font-semibold'
                      : 'text-slate-900 hover:text-pust-900'
                  }`}
                >
                  News &amp; Events Gallery
                </button>
              </nav>

              {/* Drawer Pinned Footer Actions */}
              <div className="shrink-0 px-3.5 py-2.5 bg-[#FAF9F6] border-t border-stone-200 space-y-2">
                {user?.role === 'admin' && (
                  <div className="flex items-center gap-2 pb-1">
                    {onToggleEditMode && (
                      <button
                        type="button"
                        role="switch"
                        aria-checked={editMode}
                        onClick={onToggleEditMode}
                        className={`flex-1 min-h-[38px] inline-flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                          editMode
                            ? 'bg-amber-400 border-amber-500 text-slate-950'
                            : 'bg-amber-50 border-amber-300 text-amber-950 hover:bg-amber-100'
                        }`}
                      >
                        <span>Admin Mode</span>
                        <span
                          aria-hidden="true"
                          className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full p-0.5 transition-colors ${
                            editMode ? 'bg-slate-950' : 'bg-amber-200 border border-amber-400'
                          }`}
                        >
                          <span
                            className={`inline-block h-3 w-3 rounded-full transition-transform duration-150 ${
                              editMode ? 'translate-x-3 bg-amber-300' : 'translate-x-0 bg-white'
                            }`}
                          />
                        </span>
                      </button>
                    )}
                    {onOpenCmsDirectory && (
                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          onOpenCmsDirectory();
                        }}
                        className="min-h-[38px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-pust-900 text-white hover:bg-pust-950 transition-colors cursor-pointer shrink-0"
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        CMS
                      </button>
                    )}
                  </div>
                )}
                <Link
                  href={route === '/portal' ? '/' : '/portal'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full min-h-[42px] inline-flex items-center justify-center px-3.5 py-2 rounded-lg text-[13px] font-semibold btn-primary-sheen transition-all"
                >
                  {route === '/portal'
                    ? 'Public Website'
                    : user
                    ? `${user.name.split(' ')[0]} · Campus Portal`
                    : 'Digital Campus Portal'}
                </Link>
                <PwaInstallButton variant="drawer" allowGuideFallback />
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
