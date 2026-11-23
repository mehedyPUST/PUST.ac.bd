'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Menu, X } from 'lucide-react';
import { NAV_GROUPS, type AppRoute } from '../lib/routes';
import type { AuthUser } from '../types/pust';

interface NavbarProps {
  route: AppRoute;
  user: AuthUser | null;
  onNavigate: (route: AppRoute) => void;
}

export function Navbar({ route, user, onNavigate }: NavbarProps) {
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);
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

  return (
    <header
      ref={navRef}
      className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single-line Brand Wordmark + Official Crest */}
        <Link
          href="/"
          onClick={() => {
            setHoveredGroup(null);
            setMobileMenuOpen(false);
          }}
          className="inline-flex items-center gap-2 font-serif text-sm sm:text-base font-semibold tracking-tight text-slate-900 hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0"
        >
          {!logoFailed && (
            <img
              src="https://pust.ac.bd/includes/images/pust_logo.png?key=38"
              alt="PUST Official Crest"
              referrerPolicy="no-referrer"
              onError={() => setLogoFailed(true)}
              className="w-8 h-8 object-contain shrink-0"
            />
          )}
          <span className="hidden sm:inline">Pabna University of Science &amp; Technology</span>
          <span className="sm:hidden">PUST</span>
        </Link>

        {/* Zone 2: Direct Page Navigation Links (Subtopics shown on hover) */}
        <nav
          aria-label="Primary navigation"
          className="hidden xl:flex items-center gap-4 2xl:gap-5 text-[13px] 2xl:text-sm font-medium text-slate-700"
        >
          {NAV_GROUPS.map((group) => {
            const isActiveGroup =
              route === group.defaultRoute || group.items.some((item) => item.route === route);
            const isHovered = hoveredGroup === group.id;

            return (
              <div
                key={group.id}
                className="relative"
                onMouseEnter={() => setHoveredGroup(group.id)}
                onMouseLeave={() => setHoveredGroup((prev) => (prev === group.id ? null : prev))}
              >
                <Link
                  href={group.defaultRoute}
                  onClick={() => setHoveredGroup(null)}
                  className={`inline-block py-2 transition-colors whitespace-nowrap shrink-0 ${
                    isActiveGroup
                      ? 'text-emerald-800 font-semibold underline underline-offset-4'
                      : 'hover:text-emerald-800'
                  }`}
                >
                  {group.label}
                </Link>

                {/* Non-dropdown hover preview of section subtopics */}
                {isHovered && (
                  <div className="absolute left-0 top-full pt-1 w-60 z-50 animate__animated animate__fadeIn" style={{ animationDuration: '150ms' }}>
                    <div className="bg-white border border-stone-200 shadow-xl overflow-hidden">
                      <div className="h-0.5 bg-gradient-to-r from-emerald-900 to-emerald-700" />
                      <p className="px-3.5 py-2 font-mono text-[10px] uppercase tracking-widest text-emerald-800 border-b border-stone-100 bg-[#FAF8F4]">
                        {group.label} Subtopics
                      </p>
                      {group.items.map((item) => {
                        const activeItem = route === item.route;
                        return (
                          <Link
                            key={item.route}
                            href={item.route}
                            onClick={() => setHoveredGroup(null)}
                            className={`block w-full text-left px-3.5 py-1.5 text-xs transition-colors ${
                              activeItem
                                ? 'bg-emerald-50 text-emerald-900 font-semibold'
                                : 'text-slate-700 hover:bg-stone-50 hover:text-emerald-800'
                            }`}
                          >
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <Link
            href="/notices"
            className={`py-2 transition-colors whitespace-nowrap shrink-0 ${
              route === '/notices'
                ? 'text-emerald-800 font-semibold underline underline-offset-4'
                : 'hover:text-emerald-800'
            }`}
          >
            Notices
          </Link>

          <Link
            href="/gallery"
            className={`py-2 transition-colors whitespace-nowrap shrink-0 ${
              route === '/gallery'
                ? 'text-emerald-800 font-semibold underline underline-offset-4'
                : 'hover:text-emerald-800'
            }`}
          >
            Gallery
          </Link>
        </nav>

        {/* Zone 3: Single Primary Action CTA + Mobile Drawer Trigger */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href={route === '/portal' ? '/' : '/portal'}
            onClick={() => {
              setHoveredGroup(null);
              setMobileMenuOpen(false);
            }}
            className="px-4 py-2 text-xs sm:text-sm font-medium bg-gradient-to-r from-emerald-900 to-emerald-800 hover:from-emerald-950 hover:to-emerald-900 text-white shadow-xs transition-all whitespace-nowrap shrink-0"
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
            className="xl:hidden p-2 text-slate-700 hover:text-emerald-800 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-stone-200 bg-white max-h-[80vh] overflow-y-auto px-4 py-3 space-y-1 text-sm">
          <button
            type="button"
            onClick={() => go('/')}
            className={`w-full text-left py-2.5 px-2 border-b border-stone-100 font-medium ${
              route === '/' ? 'text-emerald-800' : 'text-slate-800'
            }`}
          >
            Home
          </button>

          {NAV_GROUPS.map((group) => {
            const expanded = mobileExpanded === group.id;
            return (
              <div key={group.id} className="border-b border-stone-100">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => go(group.defaultRoute)}
                    className="flex-1 text-left py-2.5 px-2 font-medium text-slate-800 hover:text-emerald-800"
                  >
                    {group.label}
                  </button>
                  <button
                    type="button"
                    aria-label={`Toggle ${group.label} subtopics`}
                    onClick={() => setMobileExpanded(expanded ? null : group.id)}
                    className="p-2 text-slate-500 hover:text-emerald-800"
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>
                {expanded && (
                  <div className="pl-4 pb-2 space-y-1 bg-stone-50">
                    {group.items.map((item) => (
                      <button
                        key={item.route}
                        type="button"
                        onClick={() => go(item.route)}
                        className={`block w-full text-left py-1.5 px-2 text-xs ${
                          route === item.route
                            ? 'text-emerald-800 font-semibold'
                            : 'text-slate-700 hover:text-emerald-800'
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
            className="w-full text-left py-2.5 px-2 border-b border-stone-100 font-medium text-slate-800"
          >
            Notice Board
          </button>
          <button
            type="button"
            onClick={() => go('/gallery')}
            className="w-full text-left py-2.5 px-2 font-medium text-slate-800"
          >
            Campus Gallery (Photos &amp; Videos)
          </button>
        </div>
      )}
    </header>
  );
}
