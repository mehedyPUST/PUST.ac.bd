'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Award,
  BookOpen,
  Building2,
  Calendar,
  EyeOff,
  FileText,
  Globe,
  GraduationCap,
  Image as ImageIcon,
  Landmark,
  LayoutGrid,
  MapPin,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { resolveContextualEditTarget } from '../lib/cmsDefaults';
import type { AppRoute } from '../lib/routes';
import type {
  AboutContentRecord,
  DepartmentRecord,
  EditModalTarget,
  GovernanceTabKind,
} from '../types/pust';

interface DirectoryModuleItem {
  id: string;
  group: 'Global & Homepage' | 'Academics & Research' | 'Administration & Governance' | 'Pages & Public Services';
  title: string;
  description: string;
  keywords: string;
  target: EditModalTarget;
  icon: typeof Pencil;
  routeHint?: string;
}

export function AdminCmsDirectoryModal({
  open,
  onClose,
  route,
  currentDepartment,
  editMode,
  onToggleEditMode,
  onSelectTarget,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  route: AppRoute;
  currentDepartment: DepartmentRecord | null;
  editMode: boolean;
  onToggleEditMode: () => void;
  onSelectTarget: (target: EditModalTarget) => void;
  onNavigate: (target: AppRoute | string) => void;
}) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) return;
    setQuery('');
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const modules = useMemo<DirectoryModuleItem[]>(
    () => [
      {
        id: 'hero-profile',
        group: 'Global & Homepage',
        title: 'Hero, Tagline & University Stats',
        description: 'Top navbar tagline, hero headline, faculty/student counters & convocation date.',
        keywords: 'hero navbar tagline stats homepage established',
        target: { kind: 'hero-profile' },
        icon: Sparkles,
        routeHint: '/',
      },
      {
        id: 'banners',
        group: 'Global & Homepage',
        title: 'Homepage Banner Carousel',
        description: 'Add, edit, reorder, or upload campus photography slides.',
        keywords: 'banner carousel slider images hero photos',
        target: { kind: 'banner' },
        icon: ImageIcon,
        routeHint: '/',
      },
      {
        id: 'inst-links',
        group: 'Global & Homepage',
        title: 'Institutional Quick Links Grid',
        description: 'Homepage section cards pointing to Governance, Academics & Services.',
        keywords: 'links cards homepage quick access',
        target: { kind: 'institutional-links' },
        icon: LayoutGrid,
        routeHint: '/',
      },
      {
        id: 'campus-map',
        group: 'Global & Homepage',
        title: 'Interactive Campus Map & Buildings',
        description: 'Update building pins, GPS coordinates, office hours, and photos.',
        keywords: 'map campus buildings pin rajapur map coordinates',
        target: { kind: 'campus-building' },
        icon: MapPin,
        routeHint: '/#campus-map',
      },
      {
        id: 'footer',
        group: 'Global & Homepage',
        title: 'Global Footer, Contacts & Links',
        description: 'Edit global footer columns, emergency phones, addresses, and copyright.',
        keywords: 'footer address contact phone social copyright',
        target: { kind: 'footer-config' },
        icon: Globe,
      },
      {
        id: 'dept-create',
        group: 'Academics & Research',
        title: 'Create New Academic Department',
        description: 'Add a new department card with degrees, seats, chairman, and labs.',
        keywords: 'department create add faculty curriculum',
        target: { kind: 'department', department: null },
        icon: Plus,
        routeHint: '/academics',
      },
      {
        id: 'degree-programs',
        group: 'Academics & Research',
        title: 'Academic Degree Programs',
        description: 'Manage B.Sc., B.Arch., M.Sc., MBA, and Ph.D. tracks and credit loads.',
        keywords: 'programs degrees bsc msc barch credits',
        target: { kind: 'degree-programs' },
        icon: GraduationCap,
        routeHint: '/academics/programs',
      },
      {
        id: 'faculty-deans',
        group: 'Academics & Research',
        title: '5 Faculties & Deans Directory',
        description: 'Update Dean names, emails, phones, qualifications, and research areas.',
        keywords: 'deans faculties engineering science business humanities',
        target: { kind: 'faculty-deans' },
        icon: Users,
        routeHint: '/academics/faculty',
      },
      {
        id: 'calendar',
        group: 'Academics & Research',
        title: 'Academic Calendar & Milestones',
        description: 'Manage semester registration, exam schedules, and official holidays.',
        keywords: 'calendar exams holidays deadlines semester',
        target: { kind: 'academic-calendar' },
        icon: Calendar,
        routeHint: '/academics/calendar',
      },
      {
        id: 'scholarships',
        group: 'Academics & Research',
        title: 'Scholarships & Financial Aid',
        description: 'Update merit scholarships, stipends, and UGC research fellowships.',
        keywords: 'scholarships stipend fellowships financial aid',
        target: { kind: 'scholarships' },
        icon: Award,
        routeHint: '/academics/scholarship',
      },
      {
        id: 'forms',
        group: 'Academics & Research',
        title: 'Printable & Official Forms Archive',
        description: 'Edit fillable digital forms and downloadable PDF/DOCX job & academic forms.',
        keywords: 'forms download pdf docx career application leave',
        target: { kind: 'download-forms' },
        icon: FileText,
        routeHint: '/academics/forms-download',
      },
      {
        id: 'seminars',
        group: 'Academics & Research',
        title: 'Seminars, Colloquia & Workshops',
        description: 'Publish upcoming faculty symposia, IQAC workshops, and dates.',
        keywords: 'seminars workshops conferences dates events',
        target: { kind: 'seminars' },
        icon: BookOpen,
        routeHint: '/academics/seminars',
      },
      {
        id: 'publication-add',
        group: 'Academics & Research',
        title: 'Publish Faculty Research Paper',
        description: 'Add a curated journal/conference publication with DOI and venue.',
        keywords: 'publications papers doi research ieee springer',
        target: { kind: 'publication', publication: null },
        icon: Plus,
        routeHint: '/academics/publications',
      },
      {
        id: 'journals',
        group: 'Academics & Research',
        title: 'Official PUST Journals & ISSN',
        description: 'Manage PUST Studies, JHSS, and Journal of Business Studies volumes.',
        keywords: 'journals periodicals issn issue volume',
        target: { kind: 'journals' },
        icon: BookOpen,
        routeHint: '/academics/publications',
      },
      {
        id: 'research-infra',
        group: 'Academics & Research',
        title: 'Research Infrastructure Showcase',
        description: 'Edit lab facilities intro and Central Library/Hall infrastructure cards.',
        keywords: 'research infrastructure labs library cards',
        target: { kind: 'research-infra' },
        icon: Building2,
        routeHint: '/academics',
      },
      {
        id: 'vc-profile',
        group: 'Administration & Governance',
        title: 'Vice-Chancellor & VC History Archive',
        description: 'Update Honorable VC portrait/address or add former Vice-Chancellors.',
        keywords: 'vc vice chancellor message history former',
        target: { kind: 'vc' },
        icon: ShieldCheck,
        routeHint: '/administration/vc-office',
      },
      {
        id: 'admin-offices',
        group: 'Administration & Governance',
        title: '33 Administration Offices & Personnel',
        description: 'Manage every office desk email, phone, head of office, and officers roster.',
        keywords: 'offices registrar proctor ict cell hall provost medical',
        target: { kind: 'admin-office' },
        icon: Building2,
        routeHint: '/administration/all-office',
      },
      {
        id: 'leadership',
        group: 'Administration & Governance',
        title: 'Executive Administration Ledger',
        description: 'Edit principal administrative desks (VC, Pro-VC, Treasurer, Registrar).',
        keywords: 'leadership principal officers contacts',
        target: { kind: 'leadership' },
        icon: Users,
        routeHint: '/administration',
      },
      {
        id: 'units',
        group: 'Administration & Governance',
        title: 'Statutory & Administrative Units',
        description: 'Manage Statutory Governance, Administrative Office & Cell summaries.',
        keywords: 'units iqac rttc governance cells',
        target: { kind: 'unit' },
        icon: Landmark,
        routeHint: '/administration',
      },
      {
        id: 'apa-benchmarks',
        group: 'Administration & Governance',
        title: 'Administration Showcase & APA',
        description: 'Edit Admin Building showcase photo, charter tag, and APA milestones.',
        keywords: 'apa annual performance agreement benchmarks',
        target: { kind: 'apa-benchmarks' },
        icon: ShieldCheck,
        routeHint: '/administration/apa',
      },
      {
        id: 'gov-act',
        group: 'Administration & Governance',
        title: 'PUST Act (2001) & Statutory Charter',
        description: 'Edit Act No. 43 clauses, gazette citations, and official statute URL.',
        keywords: 'pust act 2001 governance charter law',
        target: { kind: 'governance', tab: 'pust-act' },
        icon: Landmark,
        routeHint: '/governance/pust-act',
      },
      {
        id: 'gov-regent',
        group: 'Administration & Governance',
        title: 'Regent Board Composition',
        description: 'Edit Regent Board seats, designations, and statutory powers.',
        keywords: 'regent board governance members',
        target: { kind: 'governance', tab: 'regent-board' },
        icon: Landmark,
        routeHint: '/governance/regent-board',
      },
      {
        id: 'gov-council',
        group: 'Administration & Governance',
        title: 'Academic Council & Finance Committee',
        description: 'Edit Academic Council bodies, Finance Committee scopes, and chairs.',
        keywords: 'academic council finance committee',
        target: { kind: 'governance', tab: 'academic-council' },
        icon: Landmark,
        routeHint: '/governance/academic-council',
      },
      {
        id: 'gov-ordinance',
        group: 'Administration & Governance',
        title: 'Academic Ordinance & Grading Scale',
        description: 'Edit examination ordinance rules and official UGC 4.00 grading table.',
        keywords: 'ordinance cgpa sgpa grading scale rules',
        target: { kind: 'governance', tab: 'academic-ordinance' },
        icon: Landmark,
        routeHint: '/governance/academic-ordinance',
      },
      {
        id: 'about-uni',
        group: 'Pages & Public Services',
        title: 'About: Our University Overview',
        description: 'Edit university introduction narrative and rajapur campus brief.',
        keywords: 'about our university narrative',
        target: { kind: 'about', slug: 'our-university' },
        icon: FileText,
        routeHint: '/about/our-university',
      },
      {
        id: 'about-mission',
        group: 'Pages & Public Services',
        title: 'About: Mission & Vision',
        description: 'Edit institutional Mission points and Vision statement.',
        keywords: 'about mission vision values',
        target: { kind: 'about', slug: 'mission-vision' },
        icon: FileText,
        routeHint: '/about/mission-vision',
      },
      {
        id: 'about-history',
        group: 'Pages & Public Services',
        title: 'About: History & Campus Milestones',
        description: 'Edit PUST founding heritage photo and 2001–Present milestone cards.',
        keywords: 'history heritage milestones timeline campus photo',
        target: { kind: 'milestones' },
        icon: Calendar,
        routeHint: '/about/history',
      },
      {
        id: 'about-plans',
        group: 'Pages & Public Services',
        title: 'About: Strategic Plans',
        description: 'Edit PUST institutional roadmap and strategic priorities.',
        keywords: 'strategic plans roadmap future',
        target: { kind: 'about', slug: 'plans' },
        icon: FileText,
        routeHint: '/about/plans',
      },
      {
        id: 'admissions',
        group: 'Pages & Public Services',
        title: 'Admissions 2026–2027 & GST Tracks',
        description: 'Edit GST cluster units, graduate/evening programs, and admission desk email.',
        keywords: 'admissions gst undergraduate graduate evening',
        target: { kind: 'admissions-info' },
        icon: GraduationCap,
        routeHint: '/admissions',
      },
      {
        id: 'facilities',
        group: 'Pages & Public Services',
        title: 'Campus Facilities (Library, Hall, Medical, ICT)',
        description: 'Edit Central Library, Transport, Residential Halls, Medical Center, and ICT.',
        keywords: 'facilities library transport residence medical ict sheba',
        target: { kind: 'facility' },
        icon: Building2,
        routeHint: '/facilities/library',
      },
      {
        id: 'verify',
        group: 'Pages & Public Services',
        title: 'Public Document Verification Page',
        description: 'Edit /verify hero copy, sample certificate serials, and employer guidance.',
        keywords: 'verify document certificate employer sample serial',
        target: { kind: 'verify-page' },
        icon: ShieldCheck,
        routeHint: '/verify',
      },
      {
        id: 'notice-new',
        group: 'Pages & Public Services',
        title: 'Publish Official Notice / Circular',
        description: 'Post General, Admission, Academic, Result, NOC, or Job & Tender notices.',
        keywords: 'notice circular job tender result noc press release',
        target: { kind: 'notice', notice: null },
        icon: Plus,
        routeHint: '/notices',
      },
      {
        id: 'gallery-new',
        group: 'Pages & Public Services',
        title: 'Add News, Event or Gallery Media',
        description: 'Upload event photography or embed official campus YouTube highlights.',
        keywords: 'gallery news events photo video youtube',
        target: { kind: 'gallery', item: null },
        icon: ImageIcon,
        routeHint: '/gallery',
      },
    ],
    []
  );

  const contextualAction = useMemo(() => {
    if (currentDepartment) {
      return {
        label: `Edit ${currentDepartment.code} Department Profile`,
        target: { kind: 'department', department: currentDepartment } as EditModalTarget,
      };
    }
    const ctx = resolveContextualEditTarget(route);
    if (!ctx) return null;

    if (ctx.targetKind === 'governance') {
      const tab: GovernanceTabKind =
        route === '/governance/regent-board'
          ? 'regent-board'
          : route === '/governance/academic-council'
          ? 'academic-council'
          : route === '/governance/finance-committee'
          ? 'finance-committee'
          : route === '/governance/academic-ordinance'
          ? 'academic-ordinance'
          : 'pust-act';
      return { label: ctx.label, target: { kind: 'governance', tab } as EditModalTarget };
    }
    if (ctx.targetKind === 'about') {
      const slug: AboutContentRecord['slug'] =
        route === '/about/history'
          ? 'history'
          : route === '/about/mission-vision'
          ? 'mission-vision'
          : route === '/about/plans'
          ? 'plans'
          : 'our-university';
      return { label: ctx.label, target: { kind: 'about', slug } as EditModalTarget };
    }
    if (ctx.targetKind === 'facility') {
      return { label: ctx.label, target: { kind: 'facility', route } as EditModalTarget };
    }
    if (ctx.targetKind === 'admin-office') {
      return {
        label: ctx.label,
        target: { kind: 'admin-office', officeSlug: ctx.officeSlug } as EditModalTarget,
      };
    }
    if (ctx.targetKind === 'department') {
      return { label: ctx.label, target: { kind: 'department', department: null } as EditModalTarget };
    }
    if (ctx.targetKind === 'gallery') {
      return { label: ctx.label, target: { kind: 'gallery', item: null } as EditModalTarget };
    }
    if (ctx.targetKind === 'notice') {
      return {
        label: ctx.label,
        target: {
          kind: 'notice',
          notice: null,
          defaultCategory: ctx.noticeCategory,
        } as EditModalTarget,
      };
    }
    return { label: ctx.label, target: { kind: ctx.targetKind } as EditModalTarget };
  }, [currentDepartment, route]);

  const filteredModules = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return modules;
    return modules.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.group.toLowerCase().includes(q) ||
        m.keywords.toLowerCase().includes(q)
    );
  }, [modules, query]);

  const groups: Array<DirectoryModuleItem['group']> = [
    'Global & Homepage',
    'Academics & Research',
    'Administration & Governance',
    'Pages & Public Services',
  ];

  if (!open) return null;

  function launchTarget(target: EditModalTarget) {
    onClose();
    onSelectTarget(target);
  }

  return (
    <div
      className="fixed inset-0 z-[65] flex items-center justify-center bg-slate-950/60 p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cms-directory-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl rounded-2xl bg-white border border-stone-200 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-stone-200 bg-[#FAF8F4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-widest text-amber-800 font-semibold">
              Admin Edit Studio · Complete App Control
            </p>
            <h2
              id="cms-directory-title"
              className="font-serif text-xl sm:text-2xl font-semibold text-slate-950 mt-0.5"
            >
              Site-Wide CMS Directory
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                onToggleEditMode();
                onClose();
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                editMode
                  ? 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800'
                  : 'bg-amber-400 border-amber-500 text-slate-950 hover:bg-amber-300'
              }`}
            >
              {editMode ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  Exit Edit Mode
                </>
              ) : (
                <>
                  <Pencil className="w-3.5 h-3.5" />
                  Enable Live Edit Mode
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigate('/portal?tab=governance');
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-stone-300 bg-white text-slate-800 hover:border-pust-800 hover:text-pust-900 cursor-pointer"
            >
              Portal CMS &amp; Audit
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close CMS Directory"
              className="min-w-[36px] min-h-[36px] inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-950 hover:bg-stone-200/70 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search + Contextual Action Bar */}
        <div className="px-5 sm:px-6 py-3.5 border-b border-stone-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find any page, directory, office, or section..."
              aria-label="Search CMS modules"
              className="w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm rounded-lg border border-stone-300 bg-[#FAF9F6] text-slate-950 focus:bg-white focus:border-pust-800 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {contextualAction && (
              <button
                type="button"
                onClick={() => launchTarget(contextualAction.target)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-amber-400 border border-amber-500 text-slate-950 hover:bg-amber-300 cursor-pointer whitespace-nowrap"
              >
                <Pencil className="w-3.5 h-3.5" />
                Current Page: {contextualAction.label}
              </button>
            )}
            <span className="hidden md:inline font-mono text-[11px] text-slate-500">
              Shortcut: Alt+E toggles Edit Mode
            </span>
          </div>
        </div>

        {/* Categorized Grid */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-7 bg-[#F9F8F5]">
          {filteredModules.length === 0 ? (
            <div className="rounded-xl border border-stone-200 bg-white p-8 text-center space-y-3">
              <p className="text-sm text-slate-700">
                No CMS section matched &ldquo;{query}&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => setQuery('')}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-pust-900 text-white cursor-pointer"
              >
                Show All {modules.length} CMS Sections
              </button>
            </div>
          ) : (
            groups.map((group) => {
              const items = filteredModules.filter((m) => m.group === group);
              if (items.length === 0) return null;
              return (
                <section key={group} className="space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                    <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-pust-800">
                      {group}
                    </h3>
                    <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                      {items.length} {items.length === 1 ? 'module' : 'modules'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items.map((mod) => {
                      const Icon = mod.icon;
                      return (
                        <div
                          key={mod.id}
                          className="rounded-xl border border-stone-200 bg-white p-4 flex flex-col justify-between gap-3 hover:border-pust-700/50 transition-colors"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#FAF8F4] border border-stone-200 text-pust-800 shrink-0">
                                <Icon className="w-3.5 h-3.5" />
                              </span>
                              {mod.routeHint && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onClose();
                                    onNavigate(mod.routeHint!);
                                  }}
                                  className="font-mono text-[10px] text-slate-500 hover:text-pust-900 hover:underline cursor-pointer"
                                >
                                  {mod.routeHint} →
                                </button>
                              )}
                            </div>
                            <h4 className="font-serif text-base font-semibold text-slate-950 leading-snug text-left">
                              {mod.title}
                            </h4>
                            <p className="text-xs text-slate-600 leading-relaxed text-left">
                              {mod.description}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => launchTarget(mod.target)}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FAF8F4] border border-stone-300 text-slate-900 hover:bg-amber-400 hover:border-amber-500 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3 h-3" />
                            Edit Section
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
