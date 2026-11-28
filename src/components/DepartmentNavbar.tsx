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
  Home,
  LayoutGrid,
  Menu,
  Pencil,
  Plus,
  Search,
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
  UniversityProfile,
} from '../types/pust';
import { AdminModeSwitch } from './AdminModeSwitch';
import { GlobalSearchBar } from './GlobalSearchBar';
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
  profile?: UniversityProfile | null;
  departments: DepartmentRecord[];
  user: AuthUser | null;
  editMode?: boolean;
  onSelectTab: (tab: DepartmentTab) => void;
  onToggleEditMode?: () => void;
  onOpenEditModal?: (target: EditModalTarget) => void;
  onOpenCmsDirectory?: () => void;
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
  onOpenCmsDirectory,
  onNavigate,
}: DepartmentNavbarProps) {
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
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
    setMobileSearchOpen(false);
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
        setMobileSearchOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSwitcherOpen(false);
        setMobileDrawerOpen(false);
        setMobileSearchOpen(false);
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
    setMobileSearchOpen(false);
    onSelectTab(tab);
  }

  function handleSwitchDepartment(code: string) {
    setSwitcherOpen(false);
    setMobileDrawerOpen(false);
    setMobileSearchOpen(false);
    onNavigate(`/academics/departments/${encodeURIComponent(code.toLowerCase())}`);
  }

  return (
    <>
      <header
        ref={headerRef}
        className="sticky top-0 z-40 bg-white shadow-[0_1px_4px_-1px_rgba(28,25,23,0.1)] print:hidden"
      >
        <div className="relative z-10">
          {/* Full-bleed Department + University Title Band Backdrop */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-[54px] sm:h-[58px] lg:h-[58px] xl:h-[62px] bg-gradient-to-r from-[#4A0508] via-[#680A0E] to-[#4A0508] border-b border-gold-500/35"
          />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-stretch">
            {/* Left Column: Official University Crest spanning Tier 1 & Tier 2 on desktop */}
            <Link
              href="/"
              onClick={() => {
                setSwitcherOpen(false);
                setMobileDrawerOpen(false);
                setMobileSearchOpen(false);
              }}
              title="Pabna University of Science and Technology — Main Website"
              className="relative z-10 my-1 lg:my-0 rounded-md lg:rounded-none bg-white px-1.5 py-0.5 lg:px-2.5 xl:px-3 lg:py-0.5 flex items-center justify-center shrink-0 self-center lg:self-stretch"
            >
              <PustCrest size={34} className="lg:hidden" />
              <PustCrest size={88} className="hidden lg:block xl:hidden" />
              <PustCrest size={92} className="hidden xl:block" />
            </Link>

            {/* Right Column: Tier 1 Two-Line Department & University Lockup + Tier 2 Department Nav */}
            <div className="flex-1 min-w-0 flex flex-col">
              {/* Tier 1: Stacked "Department of ..." + "Pabna University of Science and Technology, Pabna." */}
              <div className="h-[54px] sm:h-[58px] lg:h-[58px] xl:h-[62px] py-0.5 lg:py-0 pl-2.5 sm:pl-3.5 pr-0 lg:pl-5 lg:pr-0 xl:pl-6 xl:pr-0 flex items-center justify-between gap-2 sm:gap-4 text-white">
                <div className="min-w-0 flex-1 flex flex-col justify-center">
                  <button
                    type="button"
                    onClick={() => handleTabClick('overview')}
                    title={departmentTitle}
                    className="text-left font-serif text-[clamp(0.84rem,3.1vw,1rem)] sm:text-base lg:text-[1.15rem] xl:text-[1.25rem] font-semibold tracking-tight text-white hover:text-gold-200 transition-colors leading-[1.15] truncate cursor-pointer"
                  >
                    {departmentTitle}
                  </button>
                  <Link
                    href="/"
                    onClick={() => {
                      setSwitcherOpen(false);
                      setMobileDrawerOpen(false);
                      setMobileSearchOpen(false);
                    }}
                    title="Return to Pabna University of Science and Technology Main Website"
                    className="block mt-0.5 font-serif font-normal tracking-[0.01em] text-[clamp(0.66rem,2.2vw,0.76rem)] sm:text-[12px] lg:text-[12.5px] xl:text-[13.5px] text-gold-200/95 hover:text-white transition-colors leading-[1.2] truncate"
                  >
                    Pabna University of Science and Technology, Pabna.
                  </Link>
                </div>

                <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
                  {user?.role === 'admin' && editMode && onOpenEditModal && (
                    <button
                      type="button"
                      onClick={() => onOpenEditModal({ kind: 'hero-profile' })}
                      aria-label="Edit navbar tagline and hero profile"
                      title="Edit Tagline & Profile"
                      className="hidden lg:inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-400 text-slate-950 text-[10px] font-semibold hover:bg-amber-300 cursor-pointer"
                    >
                      <Pencil className="w-2.5 h-2.5" />
                      Edit Title
                    </button>
                  )}

                  <div className="hidden lg:block">
                    <GlobalSearchBar variant="desktop" />
                  </div>

                  {/* Mobile Search Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileSearchOpen((prev) => !prev);
                      setMobileDrawerOpen(false);
                    }}
                    aria-label="Toggle site search"
                    aria-expanded={mobileSearchOpen}
                    className={`lg:hidden w-8 h-8 sm:w-9 sm:h-9 inline-flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                      mobileSearchOpen ? 'bg-pust-800 text-white' : 'text-white hover:bg-pust-800'
                    }`}
                  >
                    {mobileSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                  </button>

                  {/* Mobile Admin Mode Toggle Switch */}
                  {user?.role === 'admin' && onToggleEditMode && (
                    <AdminModeSwitch
                      checked={editMode}
                      onToggle={onToggleEditMode}
                      variant="mobile"
                    />
                  )}

                  {/* Mobile Portal CTA & Menu Trigger */}
                  <Link
                    href="/portal"
                    onClick={() => {
                      setSwitcherOpen(false);
                      setMobileDrawerOpen(false);
                      setMobileSearchOpen(false);
                    }}
                    className="lg:hidden min-h-[30px] inline-flex items-center px-2 sm:px-3 py-1 rounded-md text-[11px] sm:text-xs font-semibold bg-white text-pust-800 hover:bg-gold-50 shadow-xs transition-colors whitespace-nowrap shrink-0"
                  >
                    {user ? (
                      <>
                        <span className="sm:hidden">Portal</span>
                        <span className="hidden sm:inline">{`${user.name.split(' ')[0]} · Portal`}</span>
                      </>
                    ) : (
                      'Portal'
                    )}
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setMobileSearchOpen(false);
                      setMobileDrawerOpen((prev) => !prev);
                    }}
                    aria-label={
                      mobileDrawerOpen ? 'Close department menu' : 'Open department menu'
                    }
                    aria-expanded={mobileDrawerOpen}
                    aria-controls="dept-mobile-drawer"
                    className={`lg:hidden w-8 h-8 sm:w-9 sm:h-9 inline-flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                      mobileDrawerOpen ? 'bg-pust-800 text-white' : 'text-white hover:bg-pust-700'
                    }`}
                  >
                    {mobileDrawerOpen ? (
                      <X className="w-[18px] h-[18px]" />
                    ) : (
                      <Menu className="w-[18px] h-[18px]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Tier 2 (Desktop): Department Navigation in the Site Navbar Position */}
              <div className="hidden lg:flex h-10 pl-4 pr-0 lg:pl-5 lg:pr-0 xl:pl-6 xl:pr-0 bg-white items-center justify-between gap-4">
                <nav
                  aria-label={`${departmentTitle} navigation`}
                  className="flex items-center gap-5 xl:gap-7 text-[clamp(0.8125rem,0.75rem+0.12vw,0.9rem)] font-medium text-slate-900"
                >
                  {DEPARTMENT_NAV_ITEMS.map((item) => {
                    const isActive = effectiveActiveTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-current={isActive ? 'page' : undefined}
                        onClick={() => handleTabClick(item.id)}
                        className={`h-10 inline-flex items-center border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          isActive
                            ? 'border-pust-800 text-pust-800 font-semibold'
                            : 'border-transparent hover:text-pust-900 hover:border-pust-200'
                        }`}
                      >
                        {item.shortLabel}
                      </button>
                    );
                  })}
                </nav>

                {/* Desktop Right Actions: PUST Home, Department Switcher, Edit Mode & Portal */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href="/"
                    onClick={() => {
                      setSwitcherOpen(false);
                      setMobileDrawerOpen(false);
                      setMobileSearchOpen(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold border border-stone-300 bg-white text-pust-900 hover:bg-[#FAF8F4] hover:border-pust-800 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Home className="w-3.5 h-3.5 text-pust-800 shrink-0" />
                    <span>PUST Home</span>
                  </Link>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setSwitcherOpen((prev) => !prev)}
                      aria-expanded={switcherOpen}
                      aria-haspopup="true"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold border border-stone-300 bg-[#FAF8F4] text-slate-800 hover:border-pust-800 hover:text-pust-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
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
                      <div className="absolute right-0 top-full pt-1.5 w-[660px] max-w-[calc(100vw-2rem)] z-50">
                        <div className="bg-white rounded-xl border border-stone-200 shadow-[0_18px_40px_-14px_rgba(28,25,23,0.2)] p-4 space-y-4 max-h-[75vh] overflow-y-auto">
                          <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-stone-200">
                            <div>
                              <p className="font-mono text-[11px] uppercase tracking-wider font-semibold text-pust-800">
                                Switch Academic Department
                              </p>
                              <p className="text-xs text-slate-600">
                                Browse any of PUST&apos;s {departments.length} departmental portals
                              </p>
                            </div>
                            <Link
                              href="/academics/departments"
                              onClick={() => setSwitcherOpen(false)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-pust-900 hover:underline whitespace-nowrap shrink-0"
                            >
                              All Departments
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

                  {user?.role === 'admin' && onToggleEditMode && (
                    <AdminModeSwitch
                      checked={editMode}
                      onToggle={onToggleEditMode}
                      variant="desktop"
                    />
                  )}

                  <Link
                    href="/portal"
                    onClick={() => {
                      setSwitcherOpen(false);
                      setMobileDrawerOpen(false);
                    }}
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold btn-primary-sheen transition-all whitespace-nowrap shrink-0"
                  >
                    {user ? `${user.name.split(' ')[0]} · Portal` : 'Portal'}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Tier 2 Strip: Compact Department Nav Links + PUST Home */}
        <div className="lg:hidden bg-white border-t border-stone-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-2 h-9">
            <nav
              aria-label={`${departmentTitle} mobile navigation`}
              className="min-w-0 flex-1 flex items-center overflow-x-auto no-scrollbar gap-4 h-9 text-xs font-medium text-slate-800"
            >
              {DEPARTMENT_NAV_ITEMS.map((item) => {
                const isActive = effectiveActiveTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => handleTabClick(item.id)}
                    className={`h-9 inline-flex items-center border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'border-pust-800 text-pust-900 font-semibold'
                        : 'border-transparent text-slate-700 hover:text-pust-900'
                    }`}
                  >
                    {item.shortLabel}
                  </button>
                );
              })}
            </nav>

            <Link
              href="/"
              onClick={() => {
                setSwitcherOpen(false);
                setMobileDrawerOpen(false);
                setMobileSearchOpen(false);
              }}
              className="inline-flex items-center gap-1 px-2 py-1 rounded border border-stone-300 bg-[#FAF8F4] text-[11px] font-semibold text-pust-900 hover:border-pust-800 whitespace-nowrap shrink-0"
            >
              <Home className="w-3 h-3 text-pust-800 shrink-0" />
              <span>PUST Home</span>
            </Link>
          </div>
        </div>

        {/* Slim Active Admin Edit Mode Banner */}
        {user?.role === 'admin' && editMode && currentDepartment && (
          <div className="relative z-10 border-t border-amber-300/90 bg-amber-50/95 backdrop-blur-xs text-amber-950 shadow-[0_2px_10px_-4px_rgba(180,83,9,0.18)]">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between gap-2 text-xs overflow-x-auto no-scrollbar">
              <div className="hidden md:flex items-center gap-2 shrink-0">
                <Pencil className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                <span className="font-semibold">
                  Editing {currentDepartment.code} Department Portal
                </span>
                <kbd className="hidden xl:inline px-1.5 py-0.5 rounded bg-amber-200/70 border border-amber-300 font-mono text-[10px] font-semibold text-amber-950">
                  Alt+E
                </kbd>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {onOpenCmsDirectory && (
                  <button
                    type="button"
                    onClick={onOpenCmsDirectory}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-pust-900 text-white font-semibold hover:bg-pust-950 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <LayoutGrid className="w-3 h-3" />
                    CMS Directory
                  </button>
                )}
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
                    <button
                      type="button"
                      onClick={() => onOpenEditModal({ kind: 'publication', publication: null })}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-amber-400 text-amber-950 font-semibold hover:bg-amber-100 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      Add Publication
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

        {/* Expandable Mobile / Tablet Search Strip */}
        {mobileSearchOpen && (
          <>
            <div
              aria-hidden="true"
              onClick={() => setMobileSearchOpen(false)}
              className="fixed inset-x-0 top-[54px] sm:top-[58px] bottom-0 bg-slate-950/35 backdrop-blur-[1px] lg:hidden"
            />
            <div className="relative z-10 lg:hidden border-t border-stone-200 bg-white px-3.5 py-3 shadow-md">
              <GlobalSearchBar
                variant="mobile"
                autoFocus
                onActionComplete={() => setMobileSearchOpen(false)}
              />
            </div>
          </>
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
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-pust-900 hover:bg-[#FAF8F4] w-full"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                    PUST Home Website
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

                {user?.role === 'admin' && (
                  <div className="pt-4 border-t border-stone-200 space-y-2">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-amber-800 px-2">
                      Administrator Controls
                    </p>
                    <div className="flex items-center gap-2">
                      {onToggleEditMode && (
                        <button
                          type="button"
                          role="switch"
                          aria-checked={editMode}
                          onClick={onToggleEditMode}
                          className={`flex-1 min-h-[38px] inline-flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                            editMode
                              ? 'bg-amber-400 border-amber-500 text-slate-950'
                              : 'bg-amber-50 border-amber-300 text-amber-950 hover:bg-amber-100'
                          }`}
                        >
                          <span>Admin Mode</span>
                          <span
                            aria-hidden="true"
                            className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full p-0.5 transition-colors ${
                              editMode ? 'bg-slate-950' : 'bg-amber-200 border border-amber-400'
                            }`}
                          >
                            <span
                              className={`inline-block h-3 w-3 rounded-full transition-transform duration-150 ${
                                editMode ? 'translate-x-3 bg-amber-300' : 'translate-x-0 bg-white'
                              }`}
                            />
                          </span>
                        </button>
                      )}
                      {onOpenCmsDirectory && (
                        <button
                          type="button"
                          onClick={() => {
                            setMobileDrawerOpen(false);
                            onOpenCmsDirectory();
                          }}
                          className="min-h-[38px] inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-pust-900 text-white hover:bg-pust-950 transition-colors cursor-pointer shrink-0"
                        >
                          <LayoutGrid className="w-3.5 h-3.5" />
                          CMS
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
