'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, ChevronRight, Home } from 'lucide-react';
import { getBreadcrumbsForPath } from '../lib/routes';
import { usePust } from './PustContext';

export function Breadcrumb() {
  const pathname = usePathname() || '/';
  const { departments } = usePust();

  const crumbs = useMemo(
    () => getBreadcrumbsForPath(pathname, { departments }),
    [pathname, departments]
  );

  if (crumbs.length === 0) {
    return null;
  }

  const parentCrumb = crumbs.length >= 2 ? crumbs[crumbs.length - 2] : null;

  return (
    <div className="bg-[#FBF9F4] border-b border-slate-200 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-4">
        <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
          <ol className="flex flex-nowrap sm:flex-wrap items-center gap-1.5 text-xs text-slate-700 overflow-x-auto no-scrollbar">
            {crumbs.map((crumb, index) => {
              const isFirst = index === 0;
              const isLast = index === crumbs.length - 1;

              return (
                <li
                  key={`${crumb.label}-${index}`}
                  className="inline-flex items-center gap-1.5 shrink-0"
                >
                  {!isFirst && (
                    <ChevronRight
                      className="w-3.5 h-3.5 text-slate-400 shrink-0"
                      aria-hidden="true"
                    />
                  )}

                  {isLast || !crumb.href ? (
                    <span
                      aria-current="page"
                      title={crumb.label}
                      className="inline-flex items-center px-2 py-0.5 rounded-md bg-pust-50 border border-pust-200/70 font-semibold text-pust-900 whitespace-nowrap truncate max-w-[230px] sm:max-w-md"
                    >
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="inline-flex items-center gap-1.5 px-1 py-0.5 rounded text-slate-700 hover:text-pust-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
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

        {parentCrumb?.href && (
          <Link
            href={parentCrumb.href}
            className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 hover:text-pust-900 transition-colors whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-3 h-3" aria-hidden="true" />
            <span>Back to {parentCrumb.label}</span>
          </Link>
        )}
      </div>
    </div>
  );
}
