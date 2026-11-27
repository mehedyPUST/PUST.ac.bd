'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  ChevronDown,
  ChevronRight,
  Eye,
  Menu,
  Pencil,
  Plus,
  X,
} from 'lucide-react';
import {
  DEPARTMENT_NAV_ITEMS,
  type DepartmentTab,
} from '../lib/departmentNav';
import type {
  AuthUser,
  DepartmentRecord,
  EditModalTarget,
  FacultyName,
} from '../types/pust';
import { PustCrest } from './PustCrest';

const FACULTY_DISPLAY_ORDER: FacultyName[] = [
  'Faculty of Engineering and Technology',
  'Faculty of Science',
  'Faculty of Business Studies',
  'Faculty of Humanities and Social Science',
  'Faculty of Life and Earth Science',
];

interface DepartmentNavbarProps {
  departmentCode: string;
  isPersonPage: boolean;
  activeTab: DepartmentTab;
  departments: DepartmentRecord[];
  user: AuthUser | null;
  editMode?: boolean;
  onSelectTab: (tab: DepartmentTab) => void;
  onToggleEditMode?: () => void;
  onOpenEditModal?: (target: EditModalTarget) => void;
  onNavigate: (target: string) => void;
}

export function DepartmentNavbar({
  departmentCode,
  isPersonPage,
  activeTab,
  departments,
  user,
  editMode = false,
  onSelectTab,
  onToggleEditMode,
  onOpenEditModal,
  onNavigate,
}: DepartmentNavbarProps) {
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileSwitchExpanded, setMobileSwitchExpanded] = useState(false);

  const headerRef = useRef<HTMLElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  const currentDepartment = useMemo(
    () =>
      departments.find(
        (d) => d.code.trim().toUpperCase() === departmentCode.trim().toUpperCase()
      ) ?? null,
    [departments, departmentCode]
  );

  const groupedDepartments = useMemo(() => {
    const groups: Array<{ faculty: string; items: DepartmentRecord[] }> = [];
    const seen = new Set<string>();

    for (const faculty of FACULTY_DISPLAY_ORDER) {
      const items = departments.filter((d) => d.faculty === faculty);
      if (items.length > 0) {
        groups.push({ faculty, items });
        seen.add(faculty);
      }
    }

    for (const dept of departments) {
      if (!seen.has(dept.faculty)) {
        seen.add(dept.faculty);
        groups.push({
          faculty: dept.faculty,
          items: departments.filter((d) => d.faculty === dept.faculty),
        });
      }
    }

    return groups;
  }, [departments]);

  useEffect(() => {
    setSwitcherOpen(false);
    setMobileDrawerOpen(false);
  }, [departmentCode, isPersonPage]);

  useEffect(() => {
    if (!mobileDrawerOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileDrawerOpen]);

  useEffect(() => {
    function handleOutside(e: MouseEvent | TouchEvent) {
      const target = e.target as Node;
      const inHeader = headerRef.current?.contains(target) ?? false;
      const inDrawer = drawerRef.current?.contains(target) ?? false;
      if (!inHeader && !inDrawer) {
        setSwitcherOpen(false);
        setMobileDrawerOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSwitcherOpen(false);
        setMobileDrawerOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside, { passive: true });
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const departmentTitle = currentDepartment
    ? `Department of ${currentDepartment.name}`
    : `Department of ${departmentCode}`;

  const effectiveActiveTab: DepartmentTab = isPersonPage ? 'faculty' : activeTab;

  function handleTabClick(tab: DepartmentTab) {
    setSwitcherOpen(false);
    setMobileDrawerOpen(false);
    onSelectTab(tab);
  }

  function handleSwitchDepartment(code: string) {
    setSwitcherOpen(false);
    setMobileDrawerOpen(false);
    onNavigate(`/academics/departments/${encodeURIComponent(code.toLowerCase())}`);
  }

  return (
    <>
      <header
        ref={headerRef}
        className="sticky top-0 z-40 bg-white shadow-[0_1px_4px_-1px_rgba(28,25,23,0.1)] print:hidden"
      >
        {/* Slim Desktop Institutional Parent Strip (Links back to PUST Main Site) */}
        <div className="hidden lg:block bg-[#3A0407] text-stone-200 border-b border-gold-500/35">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-8 flex items-center justify-between gap-4 text-[11px] font-medium">
            <div className="flex items-center gap-2.5 min-w-0">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-gold-200 hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                <ArrowLeft className="w-3 h-3 shrink-0" />
                Pabna University of Science and Technology
              </Link>
              <span aria-hidden="true" className="text-white/35">
                ·
              </span>
              <Link
                href="/academics/departments"
                className="text-stone-200 hover:text-gold-200 transition-colors whitespace-nowrap shrink-0"
              >
                All Departments
              </Link>
              {currentDepartment?.faculty && (
                <>
                  <span aria-hidden="true" className="text-white/35">
                    ·
                  </span>
                  <span className="text-stone-300 truncate">{currentDepartment.faculty}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <Link
                href="/notices"
                className="text-stone-200 hover:text-gold-200 transition-colors whitespace-nowrap"
              >
                Central Notices
              </Link>
              <Link
                href="/admissions/undergraduate"
                className="text-stone-200 hover:text-gold-200 transition-colors whitespace-nowrap"
              >
                Admissions
              </Link>
              {user?.role === 'admin' && onToggleEditMode && (
                <button
                  type="button"
                  onClick={onToggleEditMode}
                  aria-pressed={editMode}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    editMode
                      ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                      : 'bg-white/10 text-amber-200 hover:bg-white/20'
                  }`}
                >
                  {editMode ? <Eye className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                  <span>{editMode ? 'Exit Edit' : 'Edit Mode'}</span>
                </button>
              )}
              <Link
                href="/portal"
                className="text-gold-200 hover:text-white font-semibold transition-colors whitespace-nowrap"
              >
                {user ? `${user.name.split(' ')[0]} · Portal` : 'Campus Portal'}
              </Link>
            </div>
          </div>
        </div>

        {/* Primary Department Microsite Bar (3-Zone Top Bar Contract, 56px tall) */}
        <div className="bg-white border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4 lg:gap-6">
            {/* Zone 1: Single-line Department Identity */}
            <button
              type="button"
              onClick={() => handleTabClick('overview')}
              title={departmentTitle}
              className="min-w-0 flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <PustCrest size={28} className="lg:hidden shrink-0" />
              <PustCrest size={34} className="hidden lg:block shrink-0" />
              <span className="font-serif text-sm sm:text-base lg:text-[17px] font-semibold tracking-tight text-slate-950 group-hover:text-pust-900 transition-colors truncate max-w-[215px] sm:max-w-[340px] lg:max-w-[250px] xl:max-w-[340px]">
                {departmentTitle}
              </span>
            </button>

            {/* Zone 2: Departmental Section Navigation Links */}
            <nav
              aria-label={`${departmentTitle} navigation`}
              className="hidden lg:flex items-center gap-5 xl:gap-7 text-[13.5px] font-medium text-slate-800 shrink-0"
            >
              {DEPARTMENT_NAV_ITEMS.map((item) => {
                const isActive = effectiveActiveTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => handleTabClick(item.id)}
                    className={`h-14 inline-flex items-center border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'border-pust-800 text-pust-900 font-semibold'
                        : 'border-transparent text-slate-700 hover:text-pust-900 hover:border-pust-200'
                    }`}
                  >
                    {item.shortLabel}
                  </button>
                );
              })}
            </nav>

            {/* Zone 3: Department Switcher (Desktop) & Drawer Trigger (Mobile) */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Desktop Department Switcher Dropdown */}
              <div className="relative hidden lg:block">
                <button
                  type="button"
                  onClick={() => setSwitcherOpen((prev) => !prev)}
                  aria-expanded={switcherOpen}
                  aria-haspopup="true"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-stone-300 bg-[#FAF8F4] text-slate-900 hover:border-pust-800 hover:text-pust-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5 text-pust-800 shrink-0" />
                  <span>{currentDepartment ? currentDepartment.code : departmentCode}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
                      switcherOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {switcherOpen && (
                  <div className="absolute right-0 top-full pt-2 w-[660px] max-w-[calc(100vw-2rem)] z-50">
                    <div className="bg-white rounded-xl border border-stone-200 shadow-[0_18px_40px_-14px_rgba(28,25,23,0.2)] p-4 space-y-4 max-h-[75vh] overflow-y-auto">
                      <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-stone-200">
                        <div>
                          <p className="font-mono text-[11px] uppercase tracking-wider font-semibold text-pust-800">
                            Switch Academic Department
                          </p>
                          <p className="text-xs text-slate-600">
                            Jump directly to any of PUST&apos;s {departments.length} departmental portals
                          </p>
                        </div>
                        <Link
                          href="/academics/departments"
                          onClick={() => setSwitcherOpen(false)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-pust-900 hover:underline whitespace-nowrap shrink-0"
                        >
                          Directory
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {groupedDepartments.map((group) => (
                          <div key={group.faculty} className="space-y-1.5">
                            <p className="font-mono text-[10px] uppercase tracking-wider font-semibold text-slate-500 pb-1 border-b border-stone-100">
                              {group.faculty}
                            </p>
                            <div className="space-y-0.5">
                              {group.items.map((dept) => {
                                const isCurrent =
                                  dept.code.toUpperCase() === departmentCode.toUpperCase();
                                return (
                                  <button
                                    key={dept.id}
                                    type="button"
                                    onClick={() => handleSwitchDepartment(dept.code)}
                                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                                      isCurrent
                                        ? 'bg-pust-900 text-white font-semibold'
                                        : 'text-slate-700 hover:bg-[#FAF8F4] hover:text-pust-900'
                                    }`}
                                  >
                                    <span className="truncate">{dept.name}</span>
                                    <span
                                      className={`font-mono text-[10px] shrink-0 ${
                                        isCurrent ? 'text-gold-200' : 'text-slate-400'
                                      }`}
                                    >
                                      {dept.code}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Admin Edit Toggle */}
              {user?.role === 'admin' && onToggleEditMode && (
                <button
                  type="button"
                  onClick={onToggleEditMode}
                  aria-pressed={editMode}
                  aria-label={editMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
                  className={`lg:hidden w-9 h-9 inline-flex items-center justify-center rounded-lg border transition-colors cursor-pointer ${
                    editMode
                      ? 'bg-amber-400 border-amber-500 text-slate-950'
                      : 'bg-amber-50 border-amber-300 text-amber-950'
                  }`}
                >
                  {editMode ? <Eye className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                </button>
              )}

              {/* Mobile Department Menu Drawer Trigger */}
              <button
                type="button"
                onClick={() => setMobileDrawerOpen((prev) => !prev)}
                aria-label={mobileDrawerOpen ? 'Close department menu' : 'Open department menu'}
                aria-expanded={mobileDrawerOpen}
                aria-controls="dept-mobile-drawer"
                className="lg:hidden inline-flex items-center gap-1.5 px-2.5 h-9 rounded-lg border border-stone-300 bg-[#FAF8F4] text-slate-900 hover:border-pust-800 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              >
                {mobileDrawerOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                <span>Menu</span>
              </button>
            </div>
          </div>
        </div>

        {/* Slim Contextual Admin Edit Mode Strip */}
        {user?.role === 'admin' && editMode && currentDepartment && (
          <div className="border-b border-amber-300 bg-amber-50 text-amber-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between gap-2 text-xs overflow-x-auto no-scrollbar">
              <div className="hidden md:flex items-center gap-2 shrink-0">
                <Pencil className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                <span className="font-semibold">
                  Editing {currentDepartment.code} Department Portal
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {onOpenEditModal && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        onOpenEditModal({ kind: 'department', department: currentDepartment })
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-400 border border-amber-500 text-slate-950 font-semibold hover:bg-amber-300 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit {currentDepartment.code} Info
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onOpenEditModal({
                          kind: 'notice',
                          notice: null,
                          defaultDepartmentCode: currentDepartment.code,
                        })
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-amber-400 text-amber-950 font-semibold hover:bg-amber-100 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      Post {currentDepartment.code} Notice
                    </button>
                  </>
                )}
                {onToggleEditMode && (
                  <button
                    type="button"
                    onClick={onToggleEditMode}
                    className="px-2.5 py-1 rounded-md bg-slate-900 text-white font-semibold hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Done
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Slide-Out Department Navigation Drawer */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <div className="lg:hidden print:hidden">
            <motion.div
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setMobileDrawerOpen(false)}
              className="fixed inset-0 z-[55] bg-slate-950/55 backdrop-blur-[2px]"
            />

            <motion.aside
              ref={drawerRef}
              id="dept-mobile-drawer"
              aria-label="Department navigation drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 right-0 bottom-0 z-[60] w-full max-w-[340px] bg-white shadow-2xl border-l border-stone-200 flex flex-col overflow-hidden"
            >
              <div className="px-4 py-3.5 bg-pust-950 text-white flex items-center justify-between gap-3 shrink-0">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-gold-300">
                    {currentDepartment?.code || departmentCode} Departmental Portal
                  </p>
                  <p className="font-serif text-base font-medium text-white truncate">
                    {departmentTitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  aria-label="Close menu"
                  className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
                {/* Department Sections */}
                <div className="space-y-1.5">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500 px-2">
                    Department Sections
                  </p>
                  <div className="space-y-1">
                    {DEPARTMENT_NAV_ITEMS.map((item) => {
                      const isActive = effectiveActiveTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleTabClick(item.id)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-pust-900 text-white font-semibold'
                              : 'text-slate-800 hover:bg-[#FAF8F4] hover:text-pust-900'
                          }`}
                        >
                          <span>{item.label}</span>
                          <ChevronRight
                            className={`w-4 h-4 ${isActive ? 'text-gold-200' : 'text-slate-400'}`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Department Switcher Accordion */}
                <div className="pt-4 border-t border-stone-200 space-y-2">
                  <button
                    type="button"
                    onClick={() => setMobileSwitchExpanded((prev) => !prev)}
                    className="w-full px-3 py-2.5 rounded-lg border border-stone-200 bg-[#FAF8F4] text-xs font-semibold text-slate-900 flex items-center justify-between cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-pust-800" />
                      Switch Department ({departments.length})
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 transition-transform ${
                        mobileSwitchExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {mobileSwitchExpanded && (
                    <div className="space-y-3 pl-1 pt-1">
                      {groupedDepartments.map((group) => (
                        <div key={group.faculty} className="space-y-1">
                          <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500 px-2">
                            {group.faculty}
                          </p>
                          {group.items.map((dept) => {
                            const isCurrent =
                              dept.code.toUpperCase() === departmentCode.toUpperCase();
                            return (
                              <button
                                key={dept.id}
                                type="button"
                                onClick={() => handleSwitchDepartment(dept.code)}
                                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between gap-2 cursor-pointer ${
                                  isCurrent
                                    ? 'bg-pust-900 text-white font-semibold'
                                    : 'text-slate-700 hover:bg-[#FAF8F4]'
                                }`}
                              >
                                <span className="truncate">{dept.name}</span>
                                <span className="font-mono text-[10px] opacity-80 shrink-0">
                                  {dept.code}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Return to PUST Main Website */}
                <div className="pt-4 border-t border-stone-200 space-y-1.5">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500 px-2">
                    PUST Main University
                  </p>
                  <Link
                    href="/"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="block px-3 py-2 rounded-lg text-xs font-semibold text-pust-900 hover:bg-[#FAF8F4]"
                  >
                    ← PUST Home Website
                  </Link>
                  <Link
                    href="/academics/departments"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-[#FAF8F4]"
                  >
                    All Academic Departments
                  </Link>
                  <Link
                    href="/notices"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="block px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-[#FAF8F4]"
                  >
                    Central Notice Board
                  </Link>
                  <Link
                    href="/portal"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="block px-3 py-2 rounded-lg text-xs font-semibold text-lapis-900 hover:bg-[#F3F6FA]"
                  >
                    {user ? `${user.name.split(' ')[0]} · Digital Portal` : 'Digital Campus Portal'}
                  </Link>
                </div>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
