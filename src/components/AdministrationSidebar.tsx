'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, Menu, Search, X } from 'lucide-react';
import type { AdministrationOfficeRecord, AdminOfficeCategory } from '../types/pust';

const WING_ORDER: AdminOfficeCategory[] = [
  'Executive Leadership',
  'Administrative Sections & Offices',
  'Student Welfare & Campus Services',
  'Residential Halls & Accommodation',
  'Research, ICT & Quality Cells',
];

const SHORT_WING_LABELS: Record<AdminOfficeCategory, string> = {
  'Executive Leadership': 'Executive Leadership',
  'Administrative Sections & Offices': 'Administrative Sections',
  'Student Welfare & Campus Services': 'Welfare & Campus Services',
  'Residential Halls & Accommodation': 'Residential Halls',
  'Research, ICT & Quality Cells': 'Research, ICT & Quality',
};

const QUICK_ROUTES = [
  { href: '/administration', label: 'Overview & VC Address', code: 'MAIN' },
  { href: '/administration/all-office', label: 'All Offices Directory', code: 'ALL' },
  { href: '/administration/apa', label: 'APA & Integrity Charter', code: 'APA' },
];

interface AdministrationSidebarProps {
  offices: AdministrationOfficeRecord[];
  activeRoute: string;
}

export function AdministrationSidebar({
  offices,
  activeRoute,
}: AdministrationSidebarProps) {
  const [query, setQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeOffice = offices.find((o) => o.route === activeRoute);

  const [collapsedWings, setCollapsedWings] = useState<Record<string, boolean>>({});

  const normalizedQuery = query.trim().toLowerCase();

  const groupedOffices = useMemo(() => {
    return WING_ORDER.map((category) => {
      const wingOffices = offices.filter((o) => o.category === category);
      const matching = normalizedQuery
        ? wingOffices.filter((o) => {
            const headText = o.head ? `${o.head.name} ${o.head.designation}` : '';
            return (
              o.name.toLowerCase().includes(normalizedQuery) ||
              o.code.toLowerCase().includes(normalizedQuery) ||
              headText.toLowerCase().includes(normalizedQuery)
            );
          })
        : wingOffices;
      return {
        category,
        shortLabel: SHORT_WING_LABELS[category],
        offices: matching,
      };
    }).filter((g) => g.offices.length > 0);
  }, [offices, normalizedQuery]);

  function toggleWing(category: AdminOfficeCategory) {
    setCollapsedWings((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  }

  const sidebarContent = (
    <div className="flex flex-col min-h-0 flex-1">
      {/* Search Input */}
      <div className="p-3.5 border-b border-stone-200 bg-[#FBF9F5]">
        <div className="relative">
          <Search
            className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter 33 offices or heads..."
            aria-label="Filter administration sidebar"
            className="w-full pl-8 pr-8 py-2 text-xs bg-white border border-stone-300 rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-pust-800"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear sidebar filter"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              <X className="w-3 h-3" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Navigation Body */}
      <nav
        aria-label="Administration offices directory sidebar"
        className="flex-1 overflow-y-auto divide-y divide-stone-200"
      >
        {/* Quick Core Routes */}
        {!normalizedQuery && (
          <div className="p-2.5 space-y-0.5">
            {QUICK_ROUTES.map((item) => {
              const isActive = activeRoute === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                    isActive
                      ? 'bg-pust-900 text-white font-semibold'
                      : 'text-stone-800 font-medium hover:bg-[#FBF9F5] hover:text-pust-900'
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                  <span
                    className={`font-mono text-[10px] tabular-nums shrink-0 ${
                      isActive ? 'text-pust-100' : 'text-stone-400'
                    }`}
                  >
                    {item.href === '/administration/all-office' ? offices.length : item.code}
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Wing Accordions */}
        {groupedOffices.length === 0 ? (
          <div className="p-5 text-center space-y-2">
            <p className="text-xs text-stone-600">
              No office matched <span className="font-medium text-stone-900">“{query}”</span>.
            </p>
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-xs font-semibold text-pust-900 hover:underline cursor-pointer"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          groupedOffices.map((group) => {
            const hasActiveChild = group.offices.some((o) => o.route === activeRoute);
            const isExpanded = normalizedQuery
              ? true
              : hasActiveChild
              ? collapsedWings[group.category] !== true
              : !collapsedWings[group.category];

            return (
              <div key={group.category} className="py-2 px-2.5">
                <button
                  type="button"
                  onClick={() => toggleWing(group.category)}
                  aria-expanded={isExpanded}
                  className="w-full flex items-center justify-between gap-2 px-2 py-1.5 text-left rounded-md hover:bg-[#FBF9F5] transition-colors cursor-pointer"
                >
                  <span className="text-[11px] font-semibold tracking-wide text-stone-500 truncate">
                    {group.shortLabel}
                  </span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono text-[10px] text-stone-400 tabular-nums">
                      {group.offices.length}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-150 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </span>
                </button>

                {isExpanded && (
                  <ul className="mt-1 space-y-0.5">
                    {group.offices.map((office) => {
                      const isActive = activeRoute === office.route;
                      return (
                        <li key={office.slug}>
                          <Link
                            href={office.route}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors ${
                              isActive
                                ? 'bg-pust-50 text-pust-900 font-semibold'
                                : 'text-stone-700 hover:bg-[#FBF9F5] hover:text-stone-950'
                            }`}
                          >
                            <span className="truncate">{office.name}</span>
                            {isActive ? (
                              <ChevronRight
                                className="w-3.5 h-3.5 text-pust-800 shrink-0"
                                aria-hidden="true"
                              />
                            ) : (
                              <span className="font-mono text-[10px] text-stone-400 tabular-nums shrink-0">
                                {office.code}
                              </span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })
        )}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile / Tablet Collapsible Office Switcher */}
      <div className="lg:hidden rounded-xl border border-stone-200 bg-white overflow-hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-expanded={mobileOpen}
          className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-[#FBF9F5] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Menu className="w-4 h-4 text-pust-900 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-stone-500">
                Administration Index · {offices.length} Offices
              </p>
              <p className="text-xs font-semibold text-stone-950 truncate">
                {activeOffice
                  ? activeOffice.name
                  : activeRoute === '/administration/all-office'
                  ? 'All 33 Offices Directory'
                  : activeRoute === '/administration/apa'
                  ? 'Annual Performance Agreement (APA)'
                  : 'Overview & Vice-Chancellor Office'}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-pust-900 shrink-0">
            {mobileOpen ? 'Close' : 'Switch Office'}
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-150 ${
                mobileOpen ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </span>
        </button>

        {mobileOpen && (
          <div className="border-t border-stone-200 max-h-[65vh] flex flex-col">
            {sidebarContent}
          </div>
        )}
      </div>

      {/* Desktop Sticky Archival Sidebar */}
      <aside
        aria-label="Administration navigation"
        className="hidden lg:flex flex-col rounded-xl border border-stone-200 bg-white overflow-hidden lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)]"
      >
        <div className="px-4 py-3.5 border-b border-stone-200 bg-white flex items-center justify-between gap-2 shrink-0">
          <div>
            <p className="text-[11px] font-medium text-pust-800">PUST Registry</p>
            <h2 className="font-serif text-base font-semibold text-stone-950">
              Administration Index
            </h2>
          </div>
          <span className="font-mono text-xs font-semibold text-stone-500 tabular-nums">
            {offices.length}
          </span>
        </div>

        {sidebarContent}
      </aside>
    </>
  );
}
