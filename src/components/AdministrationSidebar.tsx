'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  ChevronDown,
  ChevronRight,
  FileCheck2,
  Landmark,
  Mail,
  Menu,
  Phone,
  Search,
  X,
} from 'lucide-react';
import type { AdministrationOfficeRecord, AdminOfficeCategory } from '../types/pust';

const WING_ORDER: AdminOfficeCategory[] = [
  'Executive Leadership',
  'Administrative Sections & Offices',
  'Student Welfare & Campus Services',
  'Residential Halls & Accommodation',
  'Research, ICT & Quality Cells',
];

const WING_META: Record<
  AdminOfficeCategory,
  { index: string; label: string; accentClass: string; activeBgClass: string }
> = {
  'Executive Leadership': {
    index: '01',
    label: 'Executive Leadership',
    accentClass: 'text-pust-800',
    activeBgClass: 'bg-pust-50/80 text-pust-900',
  },
  'Administrative Sections & Offices': {
    index: '02',
    label: 'Administrative Sections',
    accentClass: 'text-lapis-700',
    activeBgClass: 'bg-lapis-50/75 text-lapis-900',
  },
  'Student Welfare & Campus Services': {
    index: '03',
    label: 'Welfare & Campus Services',
    accentClass: 'text-sage-700',
    activeBgClass: 'bg-sage-50/75 text-sage-900',
  },
  'Residential Halls & Accommodation': {
    index: '04',
    label: 'Residential Halls',
    accentClass: 'text-gold-700',
    activeBgClass: 'bg-gold-50/80 text-gold-900',
  },
  'Research, ICT & Quality Cells': {
    index: '05',
    label: 'Research, ICT & Quality',
    accentClass: 'text-cerulean-700',
    activeBgClass: 'bg-cerulean-50/80 text-cerulean-900',
  },
};

const QUICK_ROUTES = [
  { href: '/administration', label: 'Overview & VC Address', icon: Landmark },
  { href: '/administration/all-office', label: 'All Offices Directory', icon: Building2 },
  { href: '/administration/apa', label: 'APA & Integrity Charter', icon: FileCheck2 },
] as const;

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
  const navScrollRef = useRef<HTMLElement>(null);
  const activeLinkRef = useRef<HTMLAnchorElement | null>(null);

  // Keep active office link + consecutive up/down links visible in the sidebar scroll area
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const navEl = navScrollRef.current;
        const linkEl = activeLinkRef.current;
        if (!navEl || !linkEl) return;
        if (navEl.scrollHeight <= navEl.clientHeight + 2) return;

        const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        const gap = 4;
        const navBox = navEl.getBoundingClientRect();
        const relativeTop = (el: HTMLElement) =>
          el.getBoundingClientRect().top - navBox.top + navEl.scrollTop;

        const itemEl = (linkEl.closest('li') as HTMLElement | null) || linkEl;
        const prevItem = itemEl.previousElementSibling as HTMLElement | null;
        const nextItem = itemEl.nextElementSibling as HTMLElement | null;

        const rangeTop = relativeTop(prevItem || itemEl) - (prevItem ? gap : 0);
        const bottomEl = nextItem || itemEl;
        const rangeBottom = relativeTop(bottomEl) + bottomEl.offsetHeight + (nextItem ? gap : 0);

        const viewTop = navEl.scrollTop;
        const viewBottom = viewTop + navEl.clientHeight;
        const maxScroll = Math.max(0, navEl.scrollHeight - navEl.clientHeight);
        const rangeHeight = rangeBottom - rangeTop;

        let nextScroll = viewTop;
        if (rangeHeight <= navEl.clientHeight) {
          if (rangeTop < viewTop) nextScroll = rangeTop;
          else if (rangeBottom > viewBottom) nextScroll = rangeBottom - navEl.clientHeight;
          else return;
        } else {
          nextScroll = relativeTop(itemEl) + itemEl.offsetHeight / 2 - navEl.clientHeight / 2;
        }

        nextScroll = Math.max(0, Math.min(maxScroll, nextScroll));
        if (Math.abs(nextScroll - viewTop) < 1) return;
        navEl.scrollTo({
          top: nextScroll,
          behavior: reduced ? 'auto' : 'smooth',
        });
      });
    });
    return () => window.cancelAnimationFrame(id);
  }, [activeRoute, mobileOpen]);

  const activeOffice = offices.find((o) => o.route === activeRoute);
  const defaultExpandedCategory: AdminOfficeCategory =
    activeOffice?.category || 'Executive Leadership';

  // Per-route wing overrides so navigating to any office automatically expands its wing
  const [wingOverrideState, setWingOverrideState] = useState<{
    route: string;
    map: Record<string, boolean>;
  }>({ route: activeRoute, map: {} });

  const activeOverrides = useMemo(
    () => (wingOverrideState.route === activeRoute ? wingOverrideState.map : {}),
    [wingOverrideState, activeRoute]
  );

  const normalizedQuery = query.trim().toLowerCase();

  const groupedOffices = useMemo(() => {
    return WING_ORDER.map((category) => {
      const wingOffices = offices.filter((o) => o.category === category);
      const matching = normalizedQuery
        ? wingOffices.filter((o) => {
            const headText = o.head ? `${o.head.name} ${o.head.designation}` : '';
            const officerText = o.officers.map((p) => `${p.name} ${p.designation}`).join(' ');
            return (
              o.name.toLowerCase().includes(normalizedQuery) ||
              o.code.toLowerCase().includes(normalizedQuery) ||
              headText.toLowerCase().includes(normalizedQuery) ||
              officerText.toLowerCase().includes(normalizedQuery)
            );
          })
        : wingOffices;
      const meta = WING_META[category];
      return {
        category,
        index: meta.index,
        label: meta.label,
        accentClass: meta.accentClass,
        activeBgClass: meta.activeBgClass,
        offices: matching,
      };
    }).filter((g) => g.offices.length > 0);
  }, [offices, normalizedQuery]);

  function isWingExpanded(category: AdminOfficeCategory): boolean {
    if (normalizedQuery) return true;
    if (category in activeOverrides) {
      return activeOverrides[category];
    }
    return category === defaultExpandedCategory;
  }

  function toggleWing(category: AdminOfficeCategory) {
    const currentlyExpanded = isWingExpanded(category);
    setWingOverrideState({
      route: activeRoute,
      map: {
        ...activeOverrides,
        [category]: !currentlyExpanded,
      },
    });
  }

  const allExpanded = WING_ORDER.every((cat) => isWingExpanded(cat));

  function handleToggleAllWings() {
    const nextState = !allExpanded;
    const nextMap: Record<string, boolean> = {};
    for (const cat of WING_ORDER) {
      nextMap[cat] = nextState;
    }
    setWingOverrideState({
      route: activeRoute,
      map: nextMap,
    });
  }

  function renderBody(isMobile: boolean) {
    return (
      <div className="flex flex-col min-h-0 flex-1">
        {/* Search Input */}
        <div className="px-3.5 py-3 border-b border-slate-200 bg-[#F8F8F6] shrink-0">
          <div className="relative">
            <Search
              className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              role="searchbox"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find office, head, or officer..."
              aria-label="Filter administration sidebar"
              className="w-full pl-8 pr-8 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-pust-800 transition-colors"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear sidebar filter"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Navigation Body */}
        <nav
          ref={navScrollRef}
          aria-label="Administration offices directory sidebar"
          className={`min-h-0 overflow-y-auto divide-y divide-slate-200/80 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent] ${
            isMobile ? 'max-h-[56vh]' : 'flex-1'
          }`}
        >
          {/* Core Administration Views */}
          {!normalizedQuery && (
            <div className="p-2.5 space-y-0.5 bg-white">
              {QUICK_ROUTES.map((item) => {
                const Icon = item.icon;
                const isActive = activeRoute === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`group flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                      isActive
                        ? 'bg-pust-900 text-white font-semibold'
                        : 'text-slate-800 font-medium hover:bg-[#F8F8F6] hover:text-pust-900'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive
                            ? 'text-gold-300'
                            : 'text-slate-400 group-hover:text-pust-800'
                        }`}
                        aria-hidden="true"
                      />
                      <span className="text-left leading-snug">{item.label}</span>
                    </span>
                    {item.href === '/administration/all-office' && (
                      <span
                        className={`font-mono text-[11px] tabular-nums shrink-0 ${
                          isActive ? 'text-gold-300' : 'text-slate-400'
                        }`}
                      >
                        {offices.length}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Wing Accordions */}
          {groupedOffices.length === 0 ? (
            <div className="p-6 text-center space-y-2.5">
              <p className="text-xs text-slate-600 text-center">
                No office matched <span className="font-medium text-slate-900">“{query}”</span>.
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
              const expanded = isWingExpanded(group.category);
              const hasActiveChild = group.offices.some((o) => o.route === activeRoute);

              return (
                <div key={group.category} className="py-2 px-2.5 bg-white">
                  <button
                    type="button"
                    onClick={() => toggleWing(group.category)}
                    aria-expanded={expanded}
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 text-left rounded-lg transition-colors cursor-pointer ${
                      hasActiveChild && !expanded
                        ? group.activeBgClass
                        : 'hover:bg-[#F8F8F6] text-slate-800'
                    }`}
                  >
                    <span className="flex items-baseline gap-2 min-w-0">
                      <span
                        className={`font-mono text-[10px] font-semibold tabular-nums shrink-0 ${group.accentClass}`}
                      >
                        {group.index}
                      </span>
                      <span className="text-xs font-semibold tracking-tight text-left leading-snug truncate">
                        {group.label}
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                        {group.offices.length}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                          expanded ? 'rotate-180' : ''
                        }`}
                        aria-hidden="true"
                      />
                    </span>
                  </button>

                  {expanded && (
                    <ul className="mt-1 space-y-0.5 pl-1">
                      {group.offices.map((office) => {
                        const isActive = activeRoute === office.route;
                        return (
                          <li key={office.slug}>
                            <Link
                              ref={isActive ? activeLinkRef : undefined}
                              href={office.route}
                              onClick={() => setMobileOpen(false)}
                              aria-current={isActive ? 'page' : undefined}
                              className={`flex items-start justify-between gap-2 px-2.5 py-2 rounded-lg transition-colors ${
                                isActive
                                  ? `${group.activeBgClass} font-semibold`
                                  : 'text-slate-700 hover:bg-[#F8F8F6] hover:text-slate-950'
                              }`}
                            >
                              <div className="min-w-0 flex-1 space-y-0.5">
                                <span className="block text-[12.5px] leading-snug text-left">
                                  {office.name}
                                </span>
                                {(normalizedQuery || isActive) && office.head && (
                                  <span className="block text-[11px] leading-tight text-left truncate text-slate-600 font-normal">
                                    {office.head.name}
                                  </span>
                                )}
                              </div>
                              {isActive && (
                                <ChevronRight
                                  className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${group.accentClass}`}
                                  aria-hidden="true"
                                />
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

        {/* Sidebar Footer: Wing Toggle & Central Registrar Helpdesk */}
        <div className="border-t border-slate-200 bg-[#F8F8F6] px-3.5 py-3 space-y-2.5 shrink-0">
          {!normalizedQuery && (
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                5 Wings · {offices.length} Offices
              </span>
              <button
                type="button"
                onClick={handleToggleAllWings}
                className="text-xs font-semibold text-pust-900 hover:underline cursor-pointer"
              >
                {allExpanded ? 'Collapse all' : 'Expand all'}
              </button>
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 space-y-1 text-[11px]">
            <p className="font-medium text-slate-500 text-left">Central Registry Desk</p>
            <div className="flex flex-wrap items-center justify-between gap-2 font-mono tabular-nums">
              <a
                href="mailto:registrar@pust.ac.bd"
                className="inline-flex items-center gap-1 text-pust-900 hover:underline truncate"
              >
                <Mail className="w-3 h-3 shrink-0" aria-hidden="true" />
                registrar@pust.ac.bd
              </a>
              <a
                href="tel:+8802588845193"
                className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-950 shrink-0"
              >
                <Phone className="w-3 h-3 shrink-0" aria-hidden="true" />
                +8802588845193
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile / Tablet Collapsible Office Switcher */}
      <div className="lg:hidden rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-expanded={mobileOpen}
          className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-[#F8F8F6] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Menu className="w-4 h-4 text-pust-900 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-500 text-left">
                Administration Index · {offices.length} Offices
              </p>
              <p className="text-xs font-semibold text-slate-950 truncate text-left">
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
          <div className="border-t border-slate-200 flex flex-col">
            {renderBody(true)}
          </div>
        )}
      </div>

      {/* Desktop Sticky Archival Sidebar */}
      <aside
        aria-label="Administration navigation"
        className="hidden lg:flex flex-col min-h-0 max-h-[calc(100vh-8.5rem)] rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs"
      >
        <div className="px-4 py-3.5 border-b border-slate-200 bg-[#F8F8F6] flex items-center justify-between gap-2 shrink-0">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-pust-800 text-left">PUST Governance</p>
            <h2 className="font-serif text-[17px] font-semibold text-slate-950 text-left leading-tight">
              Administration Index
            </h2>
          </div>
          <span className="font-mono text-xs font-semibold text-sage-700 tabular-nums shrink-0">
            {offices.length}
          </span>
        </div>

        {renderBody(false)}
      </aside>
    </>
  );
}
