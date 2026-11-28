'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, GraduationCap, LayoutGrid, Pencil } from 'lucide-react';
import { DEPARTMENT_NAV_ITEMS, type DepartmentTab } from '../lib/departmentNav';
import type {
  AuthUser,
  DepartmentRecord,
  EditModalTarget,
  UniversityProfile,
} from '../types/pust';
import { AdminModeSwitch } from './AdminModeSwitch';
import { PustCrest } from './PustCrest';

interface DepartmentNavbarProps {
  departmentCode: string;
  isPersonPage?: boolean;
  activeTab: DepartmentTab;
  profile?: UniversityProfile | null;
  departments?: DepartmentRecord[];
  user: AuthUser | null;
  editMode?: boolean;
  onToggleEditMode?: () => void;
  onOpenEditModal?: (target: EditModalTarget) => void;
  onOpenCmsDirectory?: () => void;
  onSelectTab: (tab: DepartmentTab, options?: { scrollToTop?: boolean }) => void;
  onNavigate: (route: string) => void;
}

export function DepartmentNavbar({
  departmentCode,
  isPersonPage = false,
  activeTab,
  departments = [],
  user,
  editMode = false,
  onToggleEditMode,
  onOpenEditModal,
  onOpenCmsDirectory,
  onSelectTab,
  onNavigate,
}: DepartmentNavbarProps) {
  const normalizedCode = departmentCode.trim().toUpperCase();
  const matchedDept = departments.find(
    (d) => d.code.trim().toUpperCase() === normalizedCode
  );
  const deptHref = `/academics/departments/${encodeURIComponent(normalizedCode.toLowerCase())}`;
  const isAdmin = user?.role === 'admin';
  const navRef = useRef<HTMLElement>(null);
  const activeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const navEl = navRef.current;
    const btnEl = activeBtnRef.current;
    if (!navEl || !btnEl || typeof window === 'undefined') return;
    if (navEl.scrollWidth <= navEl.clientWidth + 2) return;

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const neighborPad = Math.max(btnEl.offsetWidth * 0.75, 36);
    const btnLeft = btnEl.offsetLeft;
    const btnRight = btnLeft + btnEl.offsetWidth;
    const viewLeft = navEl.scrollLeft;
    const viewRight = viewLeft + navEl.clientWidth;
    let nextLeft = viewLeft;

    if (btnLeft - neighborPad < viewLeft) {
      nextLeft = Math.max(0, btnLeft - neighborPad);
    } else if (btnRight + neighborPad > viewRight) {
      nextLeft = Math.min(
        navEl.scrollWidth - navEl.clientWidth,
        btnRight + neighborPad - navEl.clientWidth
      );
    } else {
      return;
    }

    navEl.scrollTo({
      left: nextLeft,
      behavior: reduced ? 'auto' : 'smooth',
    });
  }, [activeTab, isPersonPage]);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 py-2.5 border-b border-stone-100">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-pust-900 whitespace-nowrap shrink-0"
            >
              <PustCrest variant="primary" size={26} />
              <span className="hidden sm:inline">PUST Home</span>
            </Link>
            <span className="text-stone-300">/</span>
            <Link
              href="/academics/departments"
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-pust-900 whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Departments</span>
            </Link>
            <span className="text-stone-300">/</span>
            <Link
              href={deptHref}
              className="font-serif text-sm sm:text-base font-semibold text-pust-900 truncate hover:underline"
            >
              {matchedDept ? `${matchedDept.name} (${matchedDept.code})` : `Department of ${normalizedCode}`}
            </Link>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isAdmin && onToggleEditMode && (
              <AdminModeSwitch checked={editMode} onToggle={onToggleEditMode} variant="desktop" />
            )}
            {isAdmin && editMode && matchedDept && onOpenEditModal && (
              <button
                type="button"
                onClick={() => onOpenEditModal({ kind: 'department', department: matchedDept })}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-pust-700 text-pust-800 bg-white hover:bg-pust-700 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit Dept</span>
              </button>
            )}
            {isAdmin && onOpenCmsDirectory && (
              <button
                type="button"
                onClick={onOpenCmsDirectory}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-stone-300 bg-[#FAF9F6] text-slate-800 hover:border-pust-700 hover:text-pust-800 transition-colors cursor-pointer whitespace-nowrap"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>CMS</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigate('/portal')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-pust-700 text-white hover:bg-pust-800 transition-colors cursor-pointer whitespace-nowrap"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{user ? 'Portal' : 'Sign In'}</span>
            </button>
          </div>
        </div>

        {/* Sub-navigation tabs */}
        <nav
          ref={navRef}
          aria-label="Department section navigation"
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2 scroll-smooth"
        >
          {DEPARTMENT_NAV_ITEMS.map((item) => {
            const active = !isPersonPage && activeTab === item.id;
            return (
              <button
                key={item.id}
                ref={active ? activeBtnRef : undefined}
                type="button"
                onClick={() => {
                  if (isPersonPage) {
                    onNavigate(`${deptHref}?tab=${item.id}`);
                  } else {
                    onSelectTab(item.id, { scrollToTop: true });
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-pust-700 text-white'
                    : 'text-slate-700 hover:bg-[#FAF9F6] hover:text-pust-800'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
