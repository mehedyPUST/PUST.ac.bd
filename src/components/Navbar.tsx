'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Menu, ShieldCheck, X } from 'lucide-react';
import { NAV_GROUPS, type AppRoute } from '../lib/routes';
import type { AuthUser } from '../types/pust';
import { PustCrest } from './PustCrest';

interface NavbarProps {
  route: AppRoute;
  user: AuthUser | null;
  onNavigate: (route: AppRoute | string) => void;
}

export function Navbar({ route, user, onNavigate }: NavbarProps) {
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setHoveredGroup(null);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  function go(target: AppRoute) {
    setHoveredGroup(null);
    setMobileMenuOpen(false);
    onNavigate(target);
  }

  const aboutGroup = NAV_GROUPS.find((g) => g.id === 'about')!;
  const academicGroup = NAV_GROUPS.find((g) => g.id === 'academic')!;
  const admissionGroup = NAV_GROUPS.find((g) => g.id === 'admission')!;
  const governanceGroup = NAV_GROUPS.find((g) => g.id === 'governance')!;
  const adminGroup = NAV_GROUPS.find((g) => g.id === 'administration')!;
  const facilitiesGroup = NAV_GROUPS.find((g) => g.id === 'facilities')!;

  const isCampusActive =
    route.startsWith('/governance') ||
    route.startsWith('/administration') ||
    route.startsWith('/facilities');

  return (
    <header
      ref={navRef}
      className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 print:hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single-line Brand Wordmark + Vector Official Crest */}
        <Link
          href="/"
          onClick={() => {
            setHoveredGroup(null);
            setMobileMenuOpen(false);
          }}
          className="inline-flex items-center gap-2.5 font-serif text-sm sm:text-base font-semibold tracking-tight text-slate-900 hover:text-emerald-900 transition-colors whitespace-nowrap shrink-0"
        >
          <PustCrest size={34} className="shrink-0" />
          <span className="hidden md:inline">Pabna University of Science &amp; Technology</span>
          <span className="md:hidden">PUST</span>
        </Link>

        {/* Zone 2: Clean 6-item Navigation Surface with Rich Hover Menus */}
        <nav
          aria-label="Primary navigation"
          className="hidden lg:flex items-center gap-5 xl:gap-6 text-[13px] xl:text-sm font-medium text-slate-700"
        >
          {/* About */}
          <div
            className="relative"
            onMouseEnter={() => setHoveredGroup('about')}
            onMouseLeave={() => setHoveredGroup((prev) => (prev === 'about' ? null : prev))}
          >
            <Link
              href="/about"
              onClick={() => setHoveredGroup(null)}
              className={`inline-block py-2 transition-colors whitespace-nowrap shrink-0 ${
                route.startsWith('/about') || route === '/gallery'
                  ? 'text-emerald-900 font-semibold'
                  : 'hover:text-emerald-900'
              }`}
            >
              About
            </Link>
            {hoveredGroup === 'about' && (
              <div className="absolute left-0 top-full pt-1.5 w-60 z-50">
                <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-1.5 space-y-0.5">
                  {aboutGroup.items.map((item) => (
                    <Link
                      key={item.route}
                      href={item.route}
                      onClick={() => setHoveredGroup(null)}
                      className={`block rounded-lg px-3 py-2 text-xs transition-colors ${
                        route === item.route
                          ? 'bg-emerald-50 text-emerald-900 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-emerald-900'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <Link
                    href="/gallery"
                    onClick={() => setHoveredGroup(null)}
                    className={`block rounded-lg px-3 py-2 text-xs transition-colors border-t border-slate-100 mt-1 pt-2 ${
                      route === '/gallery'
                        ? 'bg-emerald-50 text-emerald-900 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-emerald-900'
                    }`}
                  >
                    Campus Photo &amp; Video Gallery
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Academics */}
          <div
            className="relative"
            onMouseEnter={() => setHoveredGroup('academic')}
            onMouseLeave={() => setHoveredGroup((prev) => (prev === 'academic' ? null : prev))}
          >
            <Link
              href="/academics"
              onClick={() => setHoveredGroup(null)}
              className={`inline-block py-2 transition-colors whitespace-nowrap shrink-0 ${
                route.startsWith('/academics')
                  ? 'text-emerald-900 font-semibold'
                  : 'hover:text-emerald-900'
              }`}
            >
              Academics
            </Link>
            {hoveredGroup === 'academic' && (
              <div className="absolute left-0 top-full pt-1.5 w-[420px] z-50">
                <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-2 grid grid-cols-2 gap-1">
                  {academicGroup.items.map((item) => (
                    <Link
                      key={item.route}
                      href={item.route}
                      onClick={() => setHoveredGroup(null)}
                      className={`block rounded-lg px-3 py-2 text-xs transition-colors ${
                        route === item.route
                          ? 'bg-emerald-50 text-emerald-900 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-emerald-900'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Admissions */}
          <div
            className="relative"
            onMouseEnter={() => setHoveredGroup('admission')}
            onMouseLeave={() => setHoveredGroup((prev) => (prev === 'admission' ? null : prev))}
          >
            <Link
              href="/admissions"
              onClick={() => setHoveredGroup(null)}
              className={`inline-block py-2 transition-colors whitespace-nowrap shrink-0 ${
                route.startsWith('/admissions')
                  ? 'text-emerald-900 font-semibold'
                  : 'hover:text-emerald-900'
              }`}
            >
              Admissions
            </Link>
            {hoveredGroup === 'admission' && (
              <div className="absolute left-0 top-full pt-1.5 w-60 z-50">
                <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-1.5 space-y-0.5">
                  {admissionGroup.items.map((item) => (
                    <Link
                      key={item.route}
                      href={item.route}
                      onClick={() => setHoveredGroup(null)}
                      className={`block rounded-lg px-3 py-2 text-xs transition-colors ${
                        route === item.route
                          ? 'bg-emerald-50 text-emerald-900 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-emerald-900'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Governance, Administration & Facilities */}
          <div
            className="relative"
            onMouseEnter={() => setHoveredGroup('campus')}
            onMouseLeave={() => setHoveredGroup((prev) => (prev === 'campus' ? null : prev))}
          >
            <Link
              href="/administration"
              onClick={() => setHoveredGroup(null)}
              className={`inline-block py-2 transition-colors whitespace-nowrap shrink-0 ${
                isCampusActive
                  ? 'text-emerald-900 font-semibold'
                  : 'hover:text-emerald-900'
              }`}
            >
              Campus &amp; Admin
            </Link>
            {hoveredGroup === 'campus' && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full pt-1.5 w-[540px] z-50">
                <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-3 grid grid-cols-3 gap-3">
                  <div>
                    <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-800">
                      Governance
                    </p>
                    {governanceGroup.items.map((item) => (
                      <Link
                        key={item.route}
                        href={item.route}
                        onClick={() => setHoveredGroup(null)}
                        className={`block rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                          route === item.route
                            ? 'bg-emerald-50 text-emerald-900 font-semibold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                  <div>
                    <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-800">
                      Administration
                    </p>
                    {adminGroup.items.slice(0, 6).map((item) => (
                      <Link
                        key={item.route}
                        href={item.route}
                        onClick={() => setHoveredGroup(null)}
                        className={`block rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                          route === item.route
                            ? 'bg-emerald-50 text-emerald-900 font-semibold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                    <Link
                      href="/administration/all-office"
                      onClick={() => setHoveredGroup(null)}
                      className="block rounded-lg px-2.5 py-1.5 text-xs text-emerald-800 font-medium hover:bg-emerald-50"
                    >
                      All Offices &amp; APA
                    </Link>
                  </div>
                  <div>
                    <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-800">
                      Facilities
                    </p>
                    {facilitiesGroup.items.map((item) => (
                      <Link
                        key={item.route}
                        href={item.route}
                        onClick={() => setHoveredGroup(null)}
                        className={`block rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                          route === item.route
                            ? 'bg-emerald-50 text-emerald-900 font-semibold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <Link
            href="/notices"
            className={`py-2 transition-colors whitespace-nowrap shrink-0 ${
              route === '/notices'
                ? 'text-emerald-900 font-semibold'
                : 'hover:text-emerald-900'
            }`}
          >
            Notices
          </Link>

          <Link
            href="/verify"
            className={`inline-flex items-center gap-1.5 py-2 transition-colors whitespace-nowrap shrink-0 ${
              route === '/verify'
                ? 'text-emerald-900 font-semibold'
                : 'hover:text-emerald-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Verify</span>
          </Link>
        </nav>

        {/* Zone 3: Single Primary Action CTA + Mobile Drawer Trigger */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={route === '/portal' ? '/' : '/portal'}
            onClick={() => {
              setHoveredGroup(null);
              setMobileMenuOpen(false);
            }}
            className="px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-emerald-900 hover:bg-emerald-950 text-white shadow-xs transition-colors whitespace-nowrap shrink-0"
          >
            {route === '/portal'
              ? 'Public Website'
              : user
              ? `${user.name.split(' ')[0]} · Portal`
              : 'Campus Portal'}
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-emerald-900 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white max-h-[80vh] overflow-y-auto px-4 py-3 space-y-1 text-sm">
          <button
            type="button"
            onClick={() => go('/')}
            className={`w-full text-left py-2.5 px-2 border-b border-slate-100 font-medium ${
              route === '/' ? 'text-emerald-900' : 'text-slate-800'
            }`}
          >
            Home
          </button>

          {NAV_GROUPS.map((group) => {
            const expanded = mobileExpanded === group.id;
            return (
              <div key={group.id} className="border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => go(group.defaultRoute)}
                    className="flex-1 text-left py-2.5 px-2 font-medium text-slate-800 hover:text-emerald-900"
                  >
                    {group.label}
                  </button>
                  <button
                    type="button"
                    aria-label={`Toggle ${group.label} subtopics`}
                    onClick={() => setMobileExpanded(expanded ? null : group.id)}
                    className="p-2 text-slate-500 hover:text-emerald-900"
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
                            ? 'text-emerald-900 font-semibold bg-emerald-50'
                            : 'text-slate-700 hover:text-emerald-900'
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
            onClick={() => go('/notices')}
            className="w-full text-left py-2.5 px-2 border-b border-slate-100 font-medium text-slate-800"
          >
            Notice Board
          </button>
          <button
            type="button"
            onClick={() => go('/verify')}
            className="w-full text-left py-2.5 px-2 border-b border-slate-100 font-medium text-emerald-900"
          >
            Verify Digital Documents
          </button>
          <button
            type="button"
            onClick={() => go('/gallery')}
            className="w-full text-left py-2.5 px-2 font-medium text-slate-800"
          >
            Campus Gallery
          </button>
        </div>
      )}
    </header>
  );
}
