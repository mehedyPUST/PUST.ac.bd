'use client';

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
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-pust-800 text-pust-900 bg-white hover:bg-pust-900 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit Dept</span>
              </button>
            )}
            {isAdmin && onOpenCmsDirectory && (
              <button
                type="button"
                onClick={onOpenCmsDirectory}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-stone-300 bg-[#FAF9F6] text-slate-800 hover:border-pust-800 hover:text-pust-900 transition-colors cursor-pointer whitespace-nowrap"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>CMS</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigate('/portal')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-pust-900 text-white hover:bg-pust-950 transition-colors cursor-pointer whitespace-nowrap"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{user ? 'Portal' : 'Sign In'}</span>
            </button>
          </div>
        </div>

        {/* Sub-navigation tabs */}
        <nav
          aria-label="Department section navigation"
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2"
        >
          {DEPARTMENT_NAV_ITEMS.map((item) => {
            const active = !isPersonPage && activeTab === item.id;
            return (
              <button
                key={item.id}
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
                    ? 'bg-pust-900 text-white'
                    : 'text-slate-700 hover:bg-[#FAF9F6] hover:text-pust-900'
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
