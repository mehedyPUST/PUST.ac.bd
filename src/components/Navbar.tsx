'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Menu, X } from 'lucide-react';
import { NAV_GROUPS, type AppRoute } from '../lib/routes';
import type { AuthUser } from '../types/pust';
import { PustCrest } from './PustCrest';

interface NavbarProps {
  route: AppRoute;
  user: AuthUser | null;
  onNavigate: (route: AppRoute | string) => void;
}

const HOME_SUBTOPICS = [
  { label: 'Banner', href: '/#banner' },
  { label: 'Vice-Chancellor’s Message', href: '/#vc-message' },
  { label: 'Notice Board', href: '/#notice-board' },
  { label: 'Recent Publications', href: '/#recent-publications' },
  { label: 'News and Events', href: '/#news-events' },
  { label: 'Footer', href: '/#footer' },
];

export function Navbar({ route, user, onNavigate }: NavbarProps) {
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setHoveredGroup(null);
    setMobileMenuOpen(false);
  }, [route]);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setHoveredGroup(null);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setHoveredGroup(null);
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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
    <header
      ref={navRef}
      className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs print:hidden"
    >
      <div className="relative">
        {/* Full-bleed upper institutional title band backdrop (official PUST crimson) */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-14 sm:h-[60px] bg-pust-900"
        />

        <div className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-stretch">
          {/* Left Column: Spanning Official University Crest Box */}
          <Link
            href="/"
            onClick={() => {
              setHoveredGroup(null);
              setMobileMenuOpen(false);
            }}
            title="Pabna University of Science and Technology"
            className="relative z-10 bg-white px-2.5 sm:px-4 py-1.5 sm:py-2 flex items-center justify-center shrink-0"
          >
            <PustCrest size={44} className="lg:hidden" />
            <PustCrest size={78} className="hidden lg:block" />
          </Link>

          {/* Right Column: Tier 1 University Title + Tier 2 Navigation Bar */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Tier 1: University Title Band */}
            <div className="h-14 sm:h-[60px] px-3.5 sm:px-6 flex items-center justify-between gap-3 text-white">
              <Link
                href="/"
                onClick={() => {
                  setHoveredGroup(null);
                  setMobileMenuOpen(false);
                }}
                className="font-serif text-base sm:text-xl lg:text-[26px] font-medium tracking-tight text-white hover:text-pust-100 transition-colors truncate leading-none"
              >
                Pabna University of Science and Technology
              </Link>

              <div className="flex items-center gap-2 shrink-0">
                <span className="hidden xl:inline font-mono text-[11px] uppercase tracking-widest text-pust-200">
                  Est. 2008 · Rajapur, Pabna
                </span>

                {/* Mobile Portal CTA & Menu Trigger */}
                <Link
                  href={route === '/portal' ? '/' : '/portal'}
                  onClick={() => {
                    setHoveredGroup(null);
                    setMobileMenuOpen(false);
                  }}
                  className="lg:hidden px-3 py-1.5 rounded-md text-xs font-semibold bg-white text-pust-900 hover:bg-pust-50 transition-colors whitespace-nowrap shrink-0"
                >
                  {route === '/portal'
                    ? 'Public Site'
                    : user
                    ? `${user.name.split(' ')[0]} · Portal`
                    : 'Portal'}
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen((prev) => !prev)}
                  aria-label="Toggle navigation menu"
                  aria-expanded={mobileMenuOpen}
                  className="lg:hidden min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-md text-white hover:bg-pust-800 cursor-pointer"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Tier 2: Desktop Navigation Links Strip */}
            <div className="hidden lg:flex h-11 px-4 sm:px-6 bg-white items-center justify-between gap-4">
              <nav
                aria-label="Primary navigation"
                className="flex items-center gap-4 xl:gap-6 text-[13.5px] font-medium text-slate-800"
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
                    <div className="absolute left-0 top-full pt-1 w-[440px] max-w-[calc(100vw-2rem)] z-50">
                      <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-2 grid grid-cols-2 gap-1">
                        {adminGroup.items.map((item) => (
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

              {/* Desktop Portal Action */}
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

      {/* Responsive Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white max-h-[80vh] overflow-y-auto px-4 py-3 space-y-1 text-sm">
          <div className="border-b border-slate-100">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => go('/')}
                className={`flex-1 text-left py-2.5 px-2 font-medium ${
                  route === '/' ? 'text-pust-900' : 'text-slate-800'
                }`}
              >
                Home
              </button>
              <button
                type="button"
                aria-label="Toggle Home sections"
                onClick={() => setMobileExpanded(mobileExpanded === 'home' ? null : 'home')}
                className="p-2 text-slate-500 hover:text-pust-900"
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    mobileExpanded === 'home' ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>
            {mobileExpanded === 'home' && (
              <div className="pl-3 pb-2 space-y-0.5 bg-slate-50 rounded-lg mb-1.5">
                {HOME_SUBTOPICS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-left py-1.5 px-2 text-xs rounded-md text-slate-700 hover:text-pust-900"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {NAV_GROUPS.map((group) => {
            const expanded = mobileExpanded === group.id;
            return (
              <div key={group.id} className="border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => go(group.defaultRoute)}
                    className="flex-1 text-left py-2.5 px-2 font-medium text-slate-800 hover:text-pust-900"
                  >
                    {group.label}
                  </button>
                  <button
                    type="button"
                    aria-label={`Toggle ${group.label} subtopics`}
                    onClick={() => setMobileExpanded(expanded ? null : group.id)}
                    className="p-2 text-slate-500 hover:text-pust-900"
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>
                {expanded && (
                  <div className="pl-3 pb-2 space-y-0.5 bg-slate-50 rounded-lg mb-1.5">
                    {group.items.map((item) => (
                      <button
                        key={item.route}
                        type="button"
                        onClick={() => go(item.route)}
                        className={`block w-full text-left py-1.5 px-2 text-xs rounded-md ${
                          route === item.route
                            ? 'text-pust-900 font-semibold bg-pust-50'
                            : 'text-slate-700 hover:text-pust-900'
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
            className={`w-full text-left py-2.5 px-2 border-b border-slate-100 font-medium ${
              route === '/verify' ? 'text-pust-900' : 'text-slate-800'
            }`}
          >
            Verify
          </button>
          <button
            type="button"
            onClick={() => go('/gallery')}
            className="w-full text-left py-2.5 px-2 font-medium text-slate-800"
          >
            News &amp; Events Gallery
          </button>
        </div>
      )}
    </header>
  );
}
