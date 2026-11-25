'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { getBreadcrumbsForPath } from '../lib/routes';

export function Breadcrumb() {
  const pathname = usePathname() || '/';
  const crumbs = getBreadcrumbsForPath(pathname);

  if (crumbs.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border-b border-slate-200 print:hidden">
      <nav
        aria-label="Breadcrumb"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2"
      >
        <ol className="flex flex-nowrap sm:flex-wrap items-center gap-1.5 text-xs text-slate-700 overflow-x-auto no-scrollbar">
          {crumbs.map((crumb, index) => {
            const isFirst = index === 0;
            const isLast = index === crumbs.length - 1;

            return (
              <li key={`${crumb.label}-${index}`} className="inline-flex items-center gap-1.5">
                {!isFirst && (
                  <ChevronRight
                    className="w-3.5 h-3.5 text-slate-500 shrink-0"
                    aria-hidden="true"
                  />
                )}

                {isLast || !crumb.href ? (
                  <span
                    aria-current="page"
                    className="font-semibold text-pust-800 whitespace-nowrap truncate max-w-[240px] sm:max-w-none"
                  >
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="inline-flex items-center gap-1.5 text-slate-700 hover:text-pust-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
                  >
                    {isFirst && (
                      <Home className="w-3.5 h-3.5 text-pust-800 shrink-0" aria-hidden="true" />
                    )}
                    <span>{crumb.label}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
