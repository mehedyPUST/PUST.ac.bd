'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Eye, Menu, Pencil, Plus, Search, X } from 'lucide-react';
import { DEFAULT_NAVBAR_TAGLINE, resolveContextualEditTarget } from '../lib/cmsDefaults';
import { NAV_GROUPS, type AppRoute } from '../lib/routes';
import type {
  AboutContentRecord,
  AuthUser,
  EditModalTarget,
  GovernanceTabKind,
  UniversityProfile,
} from '../types/pust';
import { GlobalSearchBar } from './GlobalSearchBar';
import { PustCrest } from './PustCrest';
import { PwaInstallButton } from './PwaManager';

interface NavbarProps {
  route: AppRoute;
  user: AuthUser | null;
  profile?: UniversityProfile | null;
  editMode?: boolean;
  onToggleEditMode?: () => void;
  onOpenEditModal?: (target: EditModalTarget) => void;
  onNavigate: (route: AppRoute | string) => void;
}

const HOME_SUBTOPICS = [
  { label: 'Vice-Chancellor’s Message', href: '/#vc-message' },
  { label: 'Notice Board', href: '/#notice-board' },
  { label: 'Recent Publications', href: '/#recent-publications' },
  { label: 'News and Events', href: '/#news-events' },
  { label: 'Campus Map', href: '/#campus-map' },
];

export function Navbar({
  route,
  user,
  profile,
  editMode = false,
  onToggleEditMode,
  onOpenEditModal,
  onNavigate,
}: NavbarProps) {
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setHoveredGroup(null);
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
  }, [route]);

  useEffect(() => {
    function handleOutside(e: MouseEvent | TouchEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setHoveredGroup(null);
        setMobileMenuOpen(false);
        setMobileSearchOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setHoveredGroup(null);
        setMobileMenuOpen(false);
        setMobileSearchOpen(false);
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

  function go(target: AppRoute | string) {
    setHoveredGroup(null);
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
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
    <header
      ref={navRef}
      className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs print:hidden"
    >
      <div className="relative z-10">
        {/* Full-bleed upper institutional title band backdrop (official PUST shield maroon + Bengal emerald accent rule) */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-11 sm:h-12 lg:h-[52px] bg-gradient-to-r from-[#380305] via-pust-800 to-pust-700 border-b-2 border-sage-700"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-stretch">
          {/* Left Column: Official University Crest */}
          <Link
            href="/"
            onClick={() => {
              setHoveredGroup(null);
              setMobileMenuOpen(false);
              setMobileSearchOpen(false);
            }}
            title="Pabna University of Science and Technology"
            className="relative z-10 my-1 lg:my-0 rounded-lg lg:rounded-none bg-white px-1.5 py-0.5 lg:px-3 xl:px-4 lg:py-2 flex items-center justify-center shrink-0 shadow-xs lg:shadow-none"
          >
            <PustCrest size={28} className="lg:hidden" />
            <PustCrest size={58} className="hidden lg:block xl:hidden" />
            <PustCrest size={68} className="hidden xl:block" />
          </Link>

          {/* Right Column: Tier 1 University Title & Search + Tier 2 Nav & Portal */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Tier 1: University Title Band + Est. Tagline (Left) & Expanded Search (Right) */}
            <div className="h-11 sm:h-12 lg:h-[52px] pl-2.5 pr-0 sm:pl-3 sm:pr-0 lg:pl-5 lg:pr-0 xl:pl-6 xl:pr-0 flex items-center justify-between gap-4 text-white">
              <div className="min-w-0 flex-1 flex items-center gap-3">
                <Link
                  href="/"
                  onClick={() => {
                    setHoveredGroup(null);
                    setMobileMenuOpen(false);
                    setMobileSearchOpen(false);
                  }}
                  className="font-serif text-base sm:text-lg md:text-xl lg:text-2xl xl:text-[25px] font-medium tracking-tight text-white hover:text-pust-100 transition-colors truncate leading-none"
                >
                  <span className="sm:hidden">PUST</span>
                  <span className="hidden sm:inline">Pabna University of Science and Technology</span>
                </Link>

                <span
                  aria-hidden="true"
                  className="hidden xl:block h-4 w-px bg-white/25 shrink-0"
                />
                <span className="hidden xl:inline text-[11px] font-medium tracking-wide text-gold-300 whitespace-nowrap shrink-0">
                  {profile?.navbarTagline?.trim() || DEFAULT_NAVBAR_TAGLINE}
                </span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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

                <div className="hidden lg:block">
                  <GlobalSearchBar variant="desktop" />
                </div>

                {/* Mobile Search Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setMobileSearchOpen((prev) => !prev);
                    setMobileMenuOpen(false);
                  }}
                  aria-label="Toggle site search"
                  aria-expanded={mobileSearchOpen}
                  className={`lg:hidden w-9 h-9 inline-flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                    mobileSearchOpen ? 'bg-pust-800 text-white' : 'text-white hover:bg-pust-800'
                  }`}
                >
                  {mobileSearchOpen ? <X className="w-[17px] h-[17px]" /> : <Search className="w-[17px] h-[17px]" />}
                </button>

                {/* Mobile Admin Edit Mode Toggle */}
                {user?.role === 'admin' && onToggleEditMode && (
                  <button
                    type="button"
                    onClick={onToggleEditMode}
                    aria-pressed={editMode}
                    aria-label={editMode ? 'Exit Edit Mode' : 'Switch to Edit Mode'}
                    title={editMode ? 'Exit Edit Mode' : 'Switch to Edit Mode'}
                    className={`lg:hidden min-h-[34px] min-w-[34px] inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      editMode
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-pust-800 text-amber-200 border border-amber-300/40 hover:bg-pust-700'
                    }`}
                  >
                    {editMode ? <Eye className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{editMode ? 'Editing' : 'Edit'}</span>
                  </button>
                )}

                {/* Mobile Portal CTA & Menu Trigger */}
                <Link
                  href={route === '/portal' ? '/' : '/portal'}
                  onClick={() => {
                    setHoveredGroup(null);
                    setMobileMenuOpen(false);
                    setMobileSearchOpen(false);
                  }}
                  className="lg:hidden min-h-[32px] inline-flex items-center px-2.5 sm:px-3 py-1 rounded-md text-[11px] sm:text-xs font-semibold bg-white text-pust-900 hover:bg-pust-50 transition-colors whitespace-nowrap shrink-0"
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
                  onClick={() => {
                    setMobileMenuOpen((prev) => !prev);
                    setMobileSearchOpen(false);
                  }}
                  aria-label="Toggle navigation menu"
                  aria-expanded={mobileMenuOpen}
                  className={`lg:hidden w-9 h-9 inline-flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                    mobileMenuOpen ? 'bg-pust-800 text-white' : 'text-white hover:bg-pust-800'
                  }`}
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Tier 2: Desktop Navigation Links Strip + Portal */}
            <div className="hidden lg:flex h-11 pl-4 pr-0 lg:pl-5 lg:pr-0 xl:pl-6 xl:pr-0 bg-white items-center justify-between gap-4">
              <nav
                aria-label="Primary navigation"
                className="flex items-center gap-3.5 xl:gap-5 2xl:gap-6 text-[13.5px] xl:text-sm font-medium text-slate-900"
              >
                {/* Home */}
                <div
                  className="relative"
                  onMouseEnter={() => setHoveredGroup('home')}
                  onMouseLeave={() => setHoveredGroup((prev) => (prev === 'home' ? null : prev))}
                >
                  <Link
                    href="/"
                    onClick={() => setHoveredGroup(null)}
                    className={`inline-block py-2.5 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                      route === '/'
                        ? 'border-pust-800 text-pust-900 font-semibold'
                        : 'border-transparent hover:text-pust-900 hover:border-pust-200'
                    }`}
                  >
                    Home
                  </Link>
                  {hoveredGroup === 'home' && (
                    <div className="absolute left-0 top-full pt-1 w-60 z-50">
                      <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-1.5 space-y-0.5">
                        {HOME_SUBTOPICS.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setHoveredGroup(null)}
                            className="block rounded-lg px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-pust-900 transition-colors"
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
                    onClick={() => setHoveredGroup(null)}
                    className={`inline-block py-2.5 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                      route.startsWith('/governance')
                        ? 'border-pust-800 text-pust-900 font-semibold'
                        : 'border-transparent hover:text-pust-900 hover:border-pust-200'
                    }`}
                  >
                    Governance
                  </Link>
                  {hoveredGroup === 'governance' && (
                    <div className="absolute left-0 top-full pt-1 w-60 z-50">
                      <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-1.5 space-y-0.5">
                        {governanceGroup.items.map((item) => (
                          <Link
                            key={item.route}
                            href={item.route}
                            onClick={() => setHoveredGroup(null)}
                            className={`block rounded-lg px-3 py-2 text-xs transition-colors ${
                              route === item.route ||
                              (route === '/governance/university-act' &&
                                item.route === '/governance/pust-act')
                                ? 'bg-pust-50 text-pust-900 font-semibold'
                                : 'text-slate-700 hover:bg-slate-50 hover:text-pust-900'
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
                    onClick={() => setHoveredGroup(null)}
                    className={`inline-block py-2.5 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                      route.startsWith('/about')
                        ? 'border-pust-800 text-pust-900 font-semibold'
                        : 'border-transparent hover:text-pust-900 hover:border-pust-200'
                    }`}
                  >
                    About
                  </Link>
                  {hoveredGroup === 'about' && (
                    <div className="absolute left-0 top-full pt-1 w-56 z-50">
                      <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-1.5 space-y-0.5">
                        {aboutGroup.items.map((item) => (
                          <Link
                            key={item.route}
                            href={item.route}
                            onClick={() => setHoveredGroup(null)}
                            className={`block rounded-lg px-3 py-2 text-xs transition-colors ${
                              route === item.route
                                ? 'bg-pust-50 text-pust-900 font-semibold'
                                : 'text-slate-700 hover:bg-slate-50 hover:text-pust-900'
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
                    onClick={() => setHoveredGroup(null)}
                    className={`inline-block py-2.5 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                      route.startsWith('/administration')
                        ? 'border-pust-800 text-pust-900 font-semibold'
                        : 'border-transparent hover:text-pust-900 hover:border-pust-200'
                    }`}
                  >
                    Administration
                  </Link>
                  {hoveredGroup === 'administration' && (
                    <div className="absolute left-0 xl:-left-24 top-full pt-1 w-[680px] xl:w-[780px] max-w-[calc(100vw-2rem)] z-50">
                      <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-2.5 max-h-[75vh] overflow-y-auto grid grid-cols-2 lg:grid-cols-3 gap-1">
                        {adminGroup.items.map((item) => (
                          <Link
                            key={item.route}
                            href={item.route}
                            onClick={() => setHoveredGroup(null)}
                            className={`block rounded-lg px-2.5 py-1.5 text-[11.5px] leading-snug transition-colors ${
                              route === item.route
                                ? 'bg-pust-50 text-pust-900 font-semibold'
                                : 'text-slate-700 hover:bg-slate-50 hover:text-pust-900'
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
                    onClick={() => setHoveredGroup(null)}
                    className={`inline-block py-2.5 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                      route.startsWith('/academics')
                        ? 'border-pust-800 text-pust-900 font-semibold'
                        : 'border-transparent hover:text-pust-900 hover:border-pust-200'
                    }`}
                  >
                    Academic
                  </Link>
                  {hoveredGroup === 'academic' && (
                    <div className="absolute left-0 top-full pt-1 w-[420px] max-w-[calc(100vw-2rem)] z-50">
                      <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-2 grid grid-cols-2 gap-1">
                        {academicGroup.items.map((item) => (
                          <Link
                            key={item.route}
                            href={item.route}
                            onClick={() => setHoveredGroup(null)}
                            className={`block rounded-lg px-3 py-2 text-xs transition-colors ${
                              route === item.route
                                ? 'bg-pust-50 text-pust-900 font-semibold'
                                : 'text-slate-700 hover:bg-slate-50 hover:text-pust-900'
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
                    onClick={() => setHoveredGroup(null)}
                    className={`inline-block py-2.5 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                      route.startsWith('/facilities')
                        ? 'border-pust-800 text-pust-900 font-semibold'
                        : 'border-transparent hover:text-pust-900 hover:border-pust-200'
                    }`}
                  >
                    Facilities
                  </Link>
                  {hoveredGroup === 'facilities' && (
                    <div className="absolute right-0 top-full pt-1 w-56 z-50">
                      <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-1.5 space-y-0.5">
                        {facilitiesGroup.items.map((item) => (
                          <Link
                            key={item.route}
                            href={item.route}
                            onClick={() => setHoveredGroup(null)}
                            className={`block rounded-lg px-3 py-2 text-xs transition-colors ${
                              route === item.route
                                ? 'bg-pust-50 text-pust-900 font-semibold'
                                : 'text-slate-700 hover:bg-slate-50 hover:text-pust-900'
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
                    onClick={() => setHoveredGroup(null)}
                    className={`inline-block py-2.5 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                      route.startsWith('/notices')
                        ? 'border-pust-800 text-pust-900 font-semibold'
                        : 'border-transparent hover:text-pust-900 hover:border-pust-200'
                    }`}
                  >
                    Notices
                  </Link>
                  {hoveredGroup === 'notices' && (
                    <div className="absolute right-0 top-full pt-1 w-56 z-50">
                      <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-1.5 space-y-0.5">
                        {noticesGroup.items.map((item) => (
                          <Link
                            key={item.route}
                            href={item.route}
                            onClick={() => setHoveredGroup(null)}
                            className={`block rounded-lg px-3 py-2 text-xs transition-colors ${
                              route === item.route
                                ? 'bg-pust-50 text-pust-900 font-semibold'
                                : 'text-slate-700 hover:bg-slate-50 hover:text-pust-900'
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
                    onClick={() => setHoveredGroup(null)}
                    className={`inline-block py-2.5 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                      route.startsWith('/admissions')
                        ? 'border-pust-800 text-pust-900 font-semibold'
                        : 'border-transparent hover:text-pust-900 hover:border-pust-200'
                    }`}
                  >
                    Admission
                  </Link>
                  {hoveredGroup === 'admission' && (
                    <div className="absolute right-0 top-full pt-1 w-56 z-50">
                      <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-1.5 space-y-0.5">
                        {admissionGroup.items.map((item) => (
                          <Link
                            key={item.route}
                            href={item.route}
                            onClick={() => setHoveredGroup(null)}
                            className={`block rounded-lg px-3 py-2 text-xs transition-colors ${
                              route === item.route
                                ? 'bg-pust-50 text-pust-900 font-semibold'
                                : 'text-slate-700 hover:bg-slate-50 hover:text-pust-900'
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
                  className={`inline-block py-2.5 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                    route === '/verify'
                      ? 'border-pust-800 text-pust-900 font-semibold'
                      : 'border-transparent hover:text-pust-900 hover:border-pust-200'
                  }`}
                >
                  Verify
                </Link>
              </nav>

              {/* Desktop Admin Edit Mode & Portal Action */}
              <div className="flex items-center gap-2 shrink-0">
                {user?.role === 'admin' && onToggleEditMode && (
                  <button
                    type="button"
                    onClick={onToggleEditMode}
                    aria-pressed={editMode}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      editMode
                        ? 'bg-amber-400 text-slate-950 border-amber-500 hover:bg-amber-300'
                        : 'bg-amber-50 text-amber-950 border-amber-300 hover:bg-amber-100'
                    }`}
                  >
                    {editMode ? (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Exit Edit</span>
                      </>
                    ) : (
                      <>
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Edit Mode</span>
                      </>
                    )}
                  </button>
                )}

                <Link
                  href={route === '/portal' ? '/' : '/portal'}
                  onClick={() => {
                    setHoveredGroup(null);
                    setMobileMenuOpen(false);
                  }}
                  className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-pust-900 hover:bg-pust-950 text-white shadow-xs transition-colors whitespace-nowrap shrink-0"
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
          } else if (
            k === 'verify-page' ||
            k === 'admissions-info' ||
            k === 'degree-programs' ||
            k === 'faculty-deans' ||
            k === 'academic-calendar' ||
            k === 'scholarships' ||
            k === 'download-forms' ||
            k === 'seminars' ||
            k === 'research-infra' ||
            k === 'apa-benchmarks'
          ) {
            onOpenEditModal({ kind: k });
          }
        }

        return (
          <div className="relative z-10 border-t border-amber-300 bg-amber-50 text-amber-950">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-1.5 md:py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-1.5 md:gap-2 text-xs">
              <div className="hidden md:flex items-center gap-2 shrink-0">
                <Pencil className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                <span className="font-semibold">Admin Edit Mode Active</span>
                <span className="hidden 2xl:inline text-amber-900">
                  — Click any inline Edit trigger across sections, cards, maps, governance, or
                  footer to modify directly.
                </span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar md:flex-wrap pb-0.5 md:pb-0">
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
                      onClick={() => onOpenEditModal({ kind: 'seminars' })}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-amber-400 text-amber-950 font-semibold hover:bg-amber-100 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                      Seminars
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

      {/* Expandable Mobile / Tablet Search Strip */}
      {mobileSearchOpen && (
        <>
          <div
            aria-hidden="true"
            onClick={() => setMobileSearchOpen(false)}
            className="fixed inset-x-0 top-11 sm:top-12 bottom-0 bg-slate-950/35 backdrop-blur-[1px] lg:hidden"
          />
          <div className="relative z-10 lg:hidden border-t border-slate-200 bg-white px-3.5 py-3 shadow-md">
            <GlobalSearchBar
              variant="mobile"
              autoFocus
              onActionComplete={() => setMobileSearchOpen(false)}
            />
          </div>
        </>
      )}

      {/* Responsive Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <>
          <div
            aria-hidden="true"
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-x-0 top-11 sm:top-12 bottom-0 bg-slate-950/35 backdrop-blur-[1px] lg:hidden"
          />
          <nav
            aria-label="Mobile navigation"
            className="relative z-10 lg:hidden border-t border-slate-200 bg-white max-h-[calc(100dvh-2.75rem)] sm:max-h-[calc(100dvh-3rem)] overflow-y-auto overscroll-contain px-4 pt-3 pb-6 space-y-1 text-sm shadow-xl"
          >
            <div className="pb-2.5 mb-1 border-b border-slate-100">
              <GlobalSearchBar
                variant="mobile"
                onActionComplete={() => setMobileMenuOpen(false)}
              />
            </div>

            <div className="border-b border-slate-100">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => go('/')}
                  className={`flex-1 min-h-[44px] text-left py-2.5 px-2 font-medium cursor-pointer ${
                    route === '/' ? 'text-pust-900 font-semibold' : 'text-slate-800'
                  }`}
                >
                  Home
                </button>
                <button
                  type="button"
                  aria-label="Toggle Home sections"
                  aria-expanded={mobileExpanded === 'home'}
                  onClick={() => setMobileExpanded(mobileExpanded === 'home' ? null : 'home')}
                  className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-slate-500 hover:text-pust-900 cursor-pointer"
                >
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      mobileExpanded === 'home' ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </div>
              {mobileExpanded === 'home' && (
                <div className="pl-3 pr-2 py-1.5 space-y-0.5 bg-slate-50 rounded-lg mb-2">
                  {HOME_SUBTOPICS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center min-h-[40px] w-full text-left py-2 px-2.5 text-xs rounded-md text-slate-700 hover:text-pust-900 hover:bg-white transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {NAV_GROUPS.map((group) => {
              const expanded = mobileExpanded === group.id;
              const isGroupActive =
                route === group.defaultRoute ||
                group.items.some((item) => item.route === route) ||
                route.startsWith(`/${group.id === 'academic' ? 'academics' : group.id === 'admission' ? 'admissions' : group.id}`);
              return (
                <div key={group.id} className="border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => go(group.defaultRoute)}
                      className={`flex-1 min-h-[44px] text-left py-2.5 px-2 font-medium cursor-pointer ${
                        isGroupActive ? 'text-pust-900 font-semibold' : 'text-slate-800 hover:text-pust-900'
                      }`}
                    >
                      {group.label}
                    </button>
                    <button
                      type="button"
                      aria-label={`Toggle ${group.label} subtopics`}
                      aria-expanded={expanded}
                      onClick={() => setMobileExpanded(expanded ? null : group.id)}
                      className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-slate-500 hover:text-pust-900 cursor-pointer"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
                      />
                    </button>
                  </div>
                  {expanded && (
                    <div
                      className={`pl-3 pr-2 py-1.5 space-y-0.5 bg-slate-50 rounded-lg mb-2 ${
                        group.items.length > 10 ? 'max-h-[50vh] overflow-y-auto' : ''
                      }`}
                    >
                      {group.items.map((item) => (
                        <button
                          key={item.route}
                          type="button"
                          onClick={() => go(item.route)}
                          className={`flex items-center min-h-[40px] w-full text-left py-2 px-2.5 text-xs rounded-md cursor-pointer transition-colors ${
                            route === item.route ||
                            (route === '/governance/university-act' &&
                              item.route === '/governance/pust-act')
                              ? 'text-pust-900 font-semibold bg-pust-50'
                              : 'text-slate-700 hover:text-pust-900 hover:bg-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            <button
              type="button"
              onClick={() => go('/verify')}
              className={`w-full min-h-[44px] text-left py-2.5 px-2 border-b border-slate-100 font-medium cursor-pointer ${
                route === '/verify' ? 'text-pust-900 font-semibold' : 'text-slate-800 hover:text-pust-900'
              }`}
            >
              Verify
            </button>
            <button
              type="button"
              onClick={() => go('/gallery')}
              className={`w-full min-h-[44px] text-left py-2.5 px-2 font-medium cursor-pointer ${
                route === '/gallery' ? 'text-pust-900 font-semibold' : 'text-slate-800 hover:text-pust-900'
              }`}
            >
              News &amp; Events Gallery
            </button>
            <div className="pt-3 mt-1 border-t border-slate-100">
              <PwaInstallButton variant="drawer" allowGuideFallback />
            </div>
          </nav>
        </>
      )}
    </header>
  );
}
