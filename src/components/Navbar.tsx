import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
import { NAV_DROPDOWN_GROUPS, type AppRoute } from '../lib/routes';
import type { AuthUser } from '../types/pust';

interface NavbarProps {
  route: AppRoute;
  user: AuthUser | null;
  onNavigate: (route: AppRoute) => void;
}

export function Navbar({ route, user, onNavigate }: NavbarProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  function go(target: AppRoute) {
    setOpenDropdown(null);
    setMobileMenuOpen(false);
    onNavigate(target);
  }

  return (
    <header
      ref={navRef}
      className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            go('/');
          }}
          className="font-serif text-base sm:text-lg font-semibold tracking-tight text-slate-900 hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0"
        >
          Pabna University of Science &amp; Technology
        </a>

        {/* Zone 2: Clean Dropdown Navigation */}
        <nav
          aria-label="Primary navigation"
          className="hidden xl:flex items-center gap-5 text-sm font-medium text-slate-700"
        >
          {NAV_DROPDOWN_GROUPS.map((group) => {
            const isActiveGroup =
              route === group.defaultRoute || group.items.some((item) => item.route === route);
            const isOpen = openDropdown === group.id;

            return (
              <div
                key={group.id}
                className="relative"
                onMouseEnter={() => setOpenDropdown(group.id)}
                onMouseLeave={() => setOpenDropdown((prev) => (prev === group.id ? null : prev))}
              >
                <button
                  type="button"
                  onClick={() => setOpenDropdown((prev) => (prev === group.id ? null : group.id))}
                  aria-expanded={isOpen}
                  className={`inline-flex items-center gap-1 py-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActiveGroup || isOpen
                      ? 'text-emerald-700 font-semibold'
                      : 'hover:text-emerald-700'
                  }`}
                >
                  {group.label}
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isOpen && (
                  <div className="absolute left-0 top-full pt-1 w-60 z-50">
                    <div className="bg-white border border-slate-200 shadow-lg py-1.5">
                      <button
                        type="button"
                        onClick={() => go(group.defaultRoute)}
                        className="w-full text-left px-4 py-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 border-b border-slate-100 hover:bg-emerald-50/50 transition-colors cursor-pointer"
                      >
                        {group.label} Overview
                      </button>
                      {group.items.map((item) => {
                        const activeItem = route === item.route;
                        return (
                          <button
                            key={item.route}
                            type="button"
                            onClick={() => go(item.route)}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer ${
                              activeItem
                                ? 'bg-emerald-50 text-emerald-800 font-semibold'
                                : 'text-slate-700 hover:bg-slate-50 hover:text-emerald-700'
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <a
            href="/notices"
            onClick={(e) => {
              e.preventDefault();
              go('/notices');
            }}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              route === '/notices'
                ? 'text-emerald-700 font-semibold underline underline-offset-4'
                : 'hover:text-emerald-700'
            }`}
          >
            Notices
          </a>

          <a
            href="/gallery"
            onClick={(e) => {
              e.preventDefault();
              go('/gallery');
            }}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              route === '/gallery'
                ? 'text-emerald-700 font-semibold underline underline-offset-4'
                : 'hover:text-emerald-700'
            }`}
          >
            Gallery
          </a>
        </nav>

        {/* Zone 3: Primary Campus Portal CTA + Mobile Drawer Button */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => go(route === '/portal' ? '/' : '/portal')}
            className="px-4 py-2 text-xs sm:text-sm font-medium bg-emerald-700 text-white hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
          >
            {route === '/portal'
              ? 'Public Website'
              : user
              ? `${user.name.split(' ')[0]} · Portal`
              : 'Campus Portal'}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="xl:hidden p-2 text-slate-700 hover:text-emerald-700 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile Accordion Navigation */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-200 bg-white max-h-[80vh] overflow-y-auto px-4 py-3 space-y-1 text-sm">
          <button
            type="button"
            onClick={() => go('/')}
            className={`w-full text-left py-2.5 px-2 border-b border-slate-100 font-medium ${
              route === '/' ? 'text-emerald-700' : 'text-slate-800'
            }`}
          >
            Home
          </button>

          {NAV_DROPDOWN_GROUPS.map((group) => {
            const expanded = mobileExpanded === group.id;
            return (
              <div key={group.id} className="border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => setMobileExpanded(expanded ? null : group.id)}
                  className="w-full flex items-center justify-between py-2.5 px-2 font-medium text-slate-800"
                >
                  <span>{group.label}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform ${
                      expanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {expanded && (
                  <div className="pl-4 pb-2 space-y-1 bg-slate-50">
                    {group.items.map((item) => (
                      <button
                        key={item.route}
                        type="button"
                        onClick={() => go(item.route)}
                        className={`block w-full text-left py-1.5 px-2 text-xs ${
                          route === item.route
                            ? 'text-emerald-700 font-semibold'
                            : 'text-slate-700 hover:text-emerald-700'
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
