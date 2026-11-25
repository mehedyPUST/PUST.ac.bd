'use client';

import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  Bell,
  BookOpen,
  Building2,
  Compass,
  FileText,
  GraduationCap,
  Search,
  X,
} from 'lucide-react';
import { NAV_GROUPS, type AppRoute } from '../lib/routes';
import type { DepartmentRecord, NoticeRecord } from '../types/pust';
import { usePust } from './PustContext';

type SearchResultGroup = 'Departments' | 'Notices' | 'Academic & Campus Resources';

interface SearchEntry {
  id: string;
  group: SearchResultGroup;
  title: string;
  subtitle: string;
  keywords: string;
  rankBoost?: number;
  department?: DepartmentRecord;
  notice?: NoticeRecord;
  route?: AppRoute | string;
}

const STATIC_RESOURCE_ENRICHMENTS: Partial<Record<string, string>> = {
  '/academics/departments': '21 departments chairmen directory prospectus cse eee eece ice ce arch urp math physics pharmacy chemistry statistics bba thm economics bangla social work english public administration history geography',
  '/academics/programs': 'undergraduate bsc ba bba bpharm barch b.u.r.p graduate msc ma mba m.pharm mphil phd emba iied institute degree credit curriculum',
  '/academics/faculty': '5 faculties all deans leadership engineering science business humanities social science life earth dean.et dean.s dean.bs dean.hss dean.les email phone',
  '/academics/forms-download': 'forms download official pdf docx fillable form print html transcript testimonial temporary certificate id card readmission clearance syllabus',
  '/academics/calendar': 'academic calendar 2026 2027 20 weeks 14 weeks semester ics export add to calendar exam schedule deadlines midterm final classes vacation holiday',
  '/academics/scholarship': 'scholarship stipend fellowship merit need financial aid waiver tuition',
  '/academics/seminars': 'seminars workshops colloquium conference symposium research event iqac ics calendar',
  '/academics/publications': 'peer reviewed research papers articles journals pust studies jhss jbs issn ieee elsevier doi faculty publications 3934 works citation',
  '/admissions': 'gst admission 2026 2027 undergraduate unit a b c architecture eligibility checker gpa inquiry status tracker',
  '/admissions/undergraduate': 'gst unit a b c undergraduate eligibility checker gpa criteria architecture drawing',
  '/admissions/graduate': 'msc meng mba graduate admission circular postgraduate',
  '/admissions/evening-programs': 'evening emba weekend professional program',
  '/facilities/library': 'central library clic books e-journals ieee springerlink acm digital library card',
  '/facilities/residence': 'residential halls july 06 hall swadhinota matribhasha ganatantra provost dormitory seat',
  '/facilities/medical': 'medical center doctor ambulance health clinic emergency',
  '/facilities/transport': 'bus route schedule transport pool rajapur pabna town shuttle',
  '/facilities/ict-sheba': 'ict cell wifi eduroam institutional email portal support helpdesk',
  '/governance/pust-act': 'university act 2001 act 43 gazette charter statute',
  '/governance/regent-board': 'regent board syndicate governing body statutory',
  '/governance/academic-council': 'academic council curriculum regulations ordinance',
  '/governance/finance-committee': 'finance committee budget ugc audit',
  '/governance/academic-ordinance': 'academic ordinance grading scale cgpa sgpa calculator grade point semester rules',
  '/administration/vc-office': 'vice chancellor vc prof dr abul hasnat md shamim office',
  '/administration/pro-vc-office': 'pro vice chancellor prof dr md nazrul islam',
  '/administration/treasurer-office': 'treasurer prof dr md shamim ahsan accounts finance',
  '/administration/registrar-office': 'registrar bijon kumar brahma official orders administration',
  '/administration/proctor-office': 'proctor dr kamruzzaman khan campus discipline security clearance',
  '/administration/student-advisor-office': 'student advisor dsw dr md rashedul haque welfare counseling',
  '/administration/apa': 'apa annual performance agreement ugc transparency',
  '/verify': 'verify certificate admit card clearance library card receipt qr hash authenticity',
  '/portal': 'digital campus portal student login signup token fee payment clearance exam form',
  '/gallery': 'gallery photos videos convocation festival campus life archive',
};

function resolveOfficeRoute(text: string): AppRoute {
  const lower = text.toLowerCase();
  if (lower.includes('pro-vice') || lower.includes('pro vice')) return '/administration/pro-vc-office';
  if (lower.includes('vice-chancellor') || lower.includes('vc')) return '/administration/vc-office';
  if (lower.includes('treasurer')) return '/administration/treasurer-office';
  if (lower.includes('registrar')) return '/administration/registrar-office';
  if (lower.includes('proctor')) return '/administration/proctor-office';
  if (lower.includes('student advisor') || lower.includes('welfare') || lower.includes('dsw')) {
    return '/administration/student-advisor-office';
  }
  if (lower.includes('ict')) return '/administration/ict-cell';
  if (lower.includes('library') || lower.includes('clic')) return '/facilities/library';
  if (lower.includes('medical')) return '/facilities/medical';
  if (lower.includes('transport')) return '/facilities/transport';
  return '/administration/all-office';
}

interface GlobalSearchBarProps {
  variant: 'desktop' | 'mobile';
  autoFocus?: boolean;
  onActionComplete?: () => void;
}

export function GlobalSearchBar({
  variant,
  autoFocus = false,
  onActionComplete,
}: GlobalSearchBarProps) {
  const {
    departments,
    notices,
    publications,
    profile,
    aboutSections,
    navigateTo,
    setActiveDepartment,
    setActiveNotice,
  } = usePust();

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = `pust-global-search-list-${variant}`;

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  // Global keyboard shortcut: Cmd/Ctrl+K or '/' focuses the desktop search bar
  useEffect(() => {
    if (variant !== 'desktop') return;
    function handleGlobalKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isEditable =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      } else if (e.key === '/' && !isEditable && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (inputRef.current && inputRef.current.offsetParent !== null) {
          e.preventDefault();
          inputRef.current.focus();
          setOpen(true);
        }
      }
    }
    document.addEventListener('keydown', handleGlobalKey);
    return () => document.removeEventListener('keydown', handleGlobalKey);
  }, [variant]);

  // Outside click closes dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchIndex = useMemo<SearchEntry[]>(() => {
    const entries: SearchEntry[] = [];

    // 1. Departments
    for (const dept of departments) {
      entries.push({
        id: `dept-${dept.id}`,
        group: 'Departments',
        title: `${dept.name} (${dept.code})`,
        subtitle: `${dept.faculty} · Chair: ${dept.chairmanName}`,
        keywords: [
          dept.code,
          dept.name,
          dept.faculty,
          dept.chairmanName,
          dept.building,
          dept.summary,
          ...dept.degrees,
          ...dept.researchFocus,
          ...dept.laboratories,
        ]
          .join(' ')
          .toLowerCase(),
        rankBoost: 15,
        department: dept,
      });
    }

    // 2. Notices & Circulars
    for (const notice of notices) {
      entries.push({
        id: `notice-${notice.id}`,
        group: 'Notices',
        title: notice.title,
        subtitle: `${notice.publishedAt} · ${notice.category} · ${notice.referenceNo}`,
        keywords: [
          notice.title,
          notice.referenceNo,
          notice.category,
          notice.departmentCode,
          notice.publishedAt,
          notice.summary,
          notice.body,
        ]
          .join(' ')
          .toLowerCase(),
        rankBoost: notice.pinned ? 12 : 8,
        notice,
      });
    }

    // 3. Navigation Pages & Academic Resources
    for (const group of NAV_GROUPS) {
      for (const item of group.items) {
        entries.push({
          id: `nav-${item.route}`,
          group: 'Academic & Campus Resources',
          title: item.label,
          subtitle: `${group.label} · University Section`,
          keywords: `${item.label} ${group.label} ${item.route} ${
            STATIC_RESOURCE_ENRICHMENTS[item.route] ?? ''
          }`.toLowerCase(),
          rankBoost: 10,
          route: item.route,
        });
      }
    }

    entries.push(
      {
        id: 'nav-verify',
        group: 'Academic & Campus Resources',
        title: 'Verify Digital Documents & Certificates',
        subtitle: 'Public Authenticity Registry · Serial & QR Verification',
        keywords: STATIC_RESOURCE_ENRICHMENTS['/verify'] || 'verify certificate receipt',
        rankBoost: 10,
        route: '/verify',
      },
      {
        id: 'nav-portal',
        group: 'Academic & Campus Resources',
        title: 'Digital Campus Portal',
        subtitle: 'Student & Officer Workflows · Fee Payment, Library, Halls & Exams',
        keywords: STATIC_RESOURCE_ENRICHMENTS['/portal'] || 'portal login student',
        rankBoost: 10,
        route: '/portal',
      },
      {
        id: 'nav-gallery',
        group: 'Academic & Campus Resources',
        title: 'News, Convocation & Campus Gallery',
        subtitle: 'Campus Life, Events & Photo/Video Archive',
        keywords: STATIC_RESOURCE_ENRICHMENTS['/gallery'] || 'gallery photos videos',
        rankBoost: 6,
        route: '/gallery',
      },
      {
        id: 'tool-cgpa-calculator',
        group: 'Academic & Campus Resources',
        title: 'PUST SGPA & Cumulative CGPA Calculator',
        subtitle: 'Interactive 4.00 Grading Ordinance Tool',
        keywords: 'cgpa sgpa calculator grade point marks credit calculator grading scale',
        rankBoost: 12,
        route: '/governance/academic-ordinance#cgpa-calculator',
      },
      {
        id: 'tool-gst-eligibility',
        group: 'Academic & Campus Resources',
        title: 'GST Admission Eligibility & Department Matcher',
        subtitle: 'Check SSC/HSC GPA & Unit A/B/C Qualification',
        keywords: 'gst eligibility checker unit a b c ssc hsc gpa department matcher admissions',
        rankBoost: 12,
        route: '/admissions/undergraduate#gst-eligibility-checker',
      }
    );

    // 4. Journals, Forms, Scholarships, Deans, Seminars, Leadership, Publications
    for (const j of profile?.journals ?? []) {
      entries.push({
        id: `journal-${j.id}`,
        group: 'Academic & Campus Resources',
        title: j.title,
        subtitle: `Official PUST Journal · ${j.issn} · ${j.currentIssue}`,
        keywords: `${j.title} ${j.issn} ${j.scope} ${j.currentIssue} journal`.toLowerCase(),
        rankBoost: 7,
        route: '/academics/publications',
      });
    }

    for (const form of profile?.academicExtras?.downloadForms ?? []) {
      entries.push({
        id: `form-${form.code}`,
        group: 'Academic & Campus Resources',
        title: `${form.title} (${form.code})`,
        subtitle: `Digital Forms Hub · ${form.office}`,
        keywords: `${form.code} ${form.title} ${form.office} ${form.note} form download`.toLowerCase(),
        rankBoost: 7,
        route: '/academics/forms-download',
      });
    }

    for (const sch of profile?.academicExtras?.scholarships ?? []) {
      entries.push({
        id: `sch-${sch.title}`,
        group: 'Academic & Campus Resources',
        title: sch.title,
        subtitle: 'Scholarships & Financial Aid',
        keywords: `${sch.title} ${sch.detail} scholarship stipend aid`.toLowerCase(),
        rankBoost: 6,
        route: '/academics/scholarship',
      });
    }

    for (const dean of profile?.academicExtras?.facultyDeans ?? []) {
      entries.push({
        id: `dean-${dean.faculty}`,
        group: 'Academic & Campus Resources',
        title: `${dean.dean} — Dean, ${dean.faculty}`,
        subtitle: `${dean.code} · ${dean.email}`,
        keywords: `${dean.dean} ${dean.faculty} ${dean.email} ${dean.depts} ${dean.qualification || ''} ${dean.researchArea || ''} dean`.toLowerCase(),
        rankBoost: 6,
        route: '/academics/faculty',
      });
    }

    for (const sem of profile?.upcomingSeminars ?? []) {
      entries.push({
        id: `sem-${sem.id}`,
        group: 'Academic & Campus Resources',
        title: sem.title,
        subtitle: `Seminar · ${sem.date} · ${sem.organizer}`,
        keywords: `${sem.title} ${sem.organizer} ${sem.date} seminar workshop`.toLowerCase(),
        rankBoost: 5,
        route: '/academics/seminars',
      });
    }

    for (const officer of profile?.leadership ?? []) {
      entries.push({
        id: `officer-${officer.role}-${officer.name}`,
        group: 'Academic & Campus Resources',
        title: `${officer.name} (${officer.role})`,
        subtitle: `${officer.office} · ${officer.email}`,
        keywords: `${officer.name} ${officer.role} ${officer.office} ${officer.email} ${officer.phone}`.toLowerCase(),
        rankBoost: 6,
        route: resolveOfficeRoute(`${officer.role} ${officer.office}`),
      });
    }

    for (const pub of publications) {
      entries.push({
        id: `pub-${pub.id}`,
        group: 'Academic & Campus Resources',
        title: pub.title,
        subtitle: `Research (${pub.departmentCode}, ${pub.year}) · ${pub.authors}`,
        keywords: `${pub.title} ${pub.authors} ${pub.departmentCode} ${pub.domain} ${pub.venue} ${pub.year} publication paper`.toLowerCase(),
        rankBoost: 4,
        route: '/academics/publications',
      });
    }

    for (const sec of aboutSections) {
      entries.push({
        id: `about-${sec.id}`,
        group: 'Academic & Campus Resources',
        title: sec.title,
        subtitle: 'About PUST · Institutional Charter & Overview',
        keywords: `${sec.title} ${sec.body} about pust`.toLowerCase(),
        rankBoost: 4,
        route: `/about/${sec.slug}`,
      });
    }

    return entries;
  }, [departments, notices, publications, profile, aboutSections]);

  const { groupedResults, flatResults } = useMemo(() => {
    const trimmed = query.trim().toLowerCase();

    if (!trimmed) {
      // Quick curated suggestions when user focuses an empty search input
      const quickIds = [
        'nav-/academics/departments',
        'nav-/academics/calendar',
        'nav-/academics/forms-download',
        'nav-/admissions/undergraduate',
        'nav-/facilities/library',
        'nav-/verify',
      ];
      const quickItems: SearchEntry[] = [];
      for (const qid of quickIds) {
        const found = searchIndex.find((e) => e.id === qid);
        if (found) quickItems.push(found);
      }
      if (departments[0]) {
        quickItems.unshift({
          id: `quick-dept-${departments[0].id}`,
          group: 'Departments',
          title: `${departments[0].name} (${departments[0].code})`,
          subtitle: `${departments[0].faculty} · Chair: ${departments[0].chairmanName}`,
          keywords: '',
          department: departments[0],
        });
      }
      if (notices[0]) {
        quickItems.splice(1, 0, {
          id: `quick-notice-${notices[0].id}`,
          group: 'Notices',
          title: notices[0].title,
          subtitle: `${notices[0].publishedAt} · ${notices[0].category} · ${notices[0].referenceNo}`,
          keywords: '',
          notice: notices[0],
        });
      }

      const groups: Array<{ label: SearchResultGroup; items: SearchEntry[] }> = (
        ['Departments', 'Notices', 'Academic & Campus Resources'] as SearchResultGroup[]
      )
        .map((label) => ({
          label,
          items: quickItems.filter((item) => item.group === label),
        }))
        .filter((g) => g.items.length > 0);

      return {
        groupedResults: groups,
        flatResults: groups.flatMap((g) => g.items),
      };
    }

    const terms = trimmed.split(/\s+/).filter(Boolean);

    const scored: Array<{ entry: SearchEntry; score: number }> = [];
    for (const entry of searchIndex) {
      const titleLower = entry.title.toLowerCase();
      const subtitleLower = entry.subtitle.toLowerCase();
      const haystack = `${titleLower} ${subtitleLower} ${entry.keywords}`;

      const matchesAll = terms.every((t) => haystack.includes(t));
      if (!matchesAll) continue;

      let score = entry.rankBoost ?? 0;
      if (titleLower === trimmed) score += 100;
      else if (titleLower.startsWith(trimmed)) score += 60;
      else if (titleLower.includes(trimmed)) score += 40;

      if (entry.department && entry.department.code.toLowerCase() === trimmed) {
        score += 120;
      }
      for (const t of terms) {
        if (titleLower.includes(t)) score += 18;
        if (subtitleLower.includes(t)) score += 8;
      }

      scored.push({ entry, score });
    }

    scored.sort((a, b) => b.score - a.score);

    const deptHits = scored
      .filter((s) => s.entry.group === 'Departments')
      .slice(0, 4)
      .map((s) => s.entry);
    const noticeHits = scored
      .filter((s) => s.entry.group === 'Notices')
      .slice(0, 4)
      .map((s) => s.entry);
    const resourceHits = scored
      .filter((s) => s.entry.group === 'Academic & Campus Resources')
      .slice(0, 5)
      .map((s) => s.entry);

    const groups: Array<{ label: SearchResultGroup; items: SearchEntry[] }> = [
      { label: 'Departments' as const, items: deptHits },
      { label: 'Notices' as const, items: noticeHits },
      { label: 'Academic & Campus Resources' as const, items: resourceHits },
    ].filter((g) => g.items.length > 0);

    return {
      groupedResults: groups,
      flatResults: groups.flatMap((g) => g.items),
    };
  }, [query, searchIndex, departments, notices]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, flatResults.length]);

  function selectEntry(entry: SearchEntry) {
    setOpen(false);
    setQuery('');
    onActionComplete?.();
    if (entry.department) {
      setActiveDepartment(entry.department);
    } else if (entry.notice) {
      setActiveNotice(entry.notice);
    } else if (entry.route) {
      navigateTo(entry.route);
    }
  }

  function handleKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }

    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true);
    }

    if (flatResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % flatResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + flatResults.length) % flatResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const chosen = flatResults[activeIndex] || flatResults[0];
      if (chosen) selectEntry(chosen);
    }
  }

  function renderIcon(group: SearchResultGroup) {
    if (group === 'Departments') return <GraduationCap className="w-4 h-4 text-pust-800 shrink-0" />;
    if (group === 'Notices') return <Bell className="w-4 h-4 text-pust-800 shrink-0" />;
    return <BookOpen className="w-4 h-4 text-pust-800 shrink-0" />;
  }

  const activeItem = flatResults[activeIndex];

  return (
    <div
      ref={containerRef}
      className={variant === 'desktop' ? 'relative w-44 xl:w-64 2xl:w-72' : 'relative w-full'}
    >
      <div className="relative flex items-center">
        <Search
          className={`w-3.5 h-3.5 absolute left-3 pointer-events-none ${
            variant === 'desktop' ? 'text-slate-500' : 'text-slate-500'
          }`}
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={activeItem ? `${listboxId}-${activeItem.id}` : undefined}
          aria-label="Search departments, notices, and academic resources"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search depts, notices, resources..."
          className={`w-full pl-8 pr-12 text-xs rounded-lg border transition-colors focus:outline-none ${
            variant === 'desktop'
              ? 'py-1.5 bg-white/95 text-slate-900 placeholder:text-slate-500 border-pust-700/40 focus:bg-white focus:border-white focus:ring-2 focus:ring-white/40'
              : 'py-2.5 bg-[#F7F7F5] text-slate-900 placeholder:text-slate-500 border-slate-300 focus:bg-white focus:border-pust-800'
          }`}
        />

        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            aria-label="Clear search query"
            className="absolute right-2 p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          variant === 'desktop' && (
            <kbd
              aria-hidden="true"
              className="hidden sm:inline-block absolute right-2 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 bg-slate-100 border border-slate-200 rounded"
            >
              /
            </kbd>
          )
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            id={listboxId}
            role="listbox"
            aria-label="Site-wide search results"
            className={`absolute z-50 mt-2 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden ${
              variant === 'desktop'
                ? 'right-0 w-[min(92vw,480px)]'
                : 'left-0 right-0 w-full'
            }`}
          >
            <div className="px-3.5 py-2 border-b border-slate-100 bg-[#F7F7F5] flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-pust-800">
                {query.trim() ? `Matches for "${query.trim()}"` : 'Quick Academic & Campus Access'}
              </span>
              <span className="font-mono text-[10px] text-slate-500 tabular-nums">
                {flatResults.length} shown
              </span>
            </div>

            <div className="max-h-[65vh] overflow-y-auto divide-y divide-slate-100">
              {flatResults.length === 0 ? (
                <div className="p-5 text-center space-y-2.5">
                  <p className="text-xs text-slate-600">
                    No departments, circulars, or academic resources matched{' '}
                    <span className="font-semibold text-slate-900">“{query.trim()}”</span>.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        navigateTo('/academics/departments');
                        onActionComplete?.();
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-pust-900 hover:bg-pust-50 cursor-pointer"
                    >
                      Browse 21 Departments
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        navigateTo('/notices');
                        onActionComplete?.();
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-pust-900 hover:bg-pust-50 cursor-pointer"
                    >
                      All Official Notices
                    </button>
                  </div>
                </div>
              ) : (
                groupedResults.map((group) => (
                  <div key={group.label} className="py-1.5">
                    <div className="px-3.5 py-1 flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
                        {group.label}
                      </span>
                      {group.label === 'Departments' && (
                        <button
                          type="button"
                          onClick={() => {
                            setOpen(false);
                            navigateTo('/academics/departments');
                            onActionComplete?.();
                          }}
                          className="font-mono text-[10px] text-pust-800 hover:underline cursor-pointer"
                        >
                          All 21 →
                        </button>
                      )}
                      {group.label === 'Notices' && (
                        <button
                          type="button"
                          onClick={() => {
                            setOpen(false);
                            navigateTo('/notices');
                            onActionComplete?.();
                          }}
                          className="font-mono text-[10px] text-pust-800 hover:underline cursor-pointer"
                        >
                          Notice Board →
                        </button>
                      )}
                    </div>

                    {group.items.map((entry) => {
                      const itemIdx = flatResults.findIndex((f) => f.id === entry.id);
                      const isActive = itemIdx === activeIndex;

                      return (
                        <button
                          key={entry.id}
                          id={`${listboxId}-${entry.id}`}
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          onMouseEnter={() => setActiveIndex(itemIdx)}
                          onClick={() => selectEntry(entry)}
                          className={`w-full text-left px-3.5 py-2 flex items-start gap-2.5 transition-colors cursor-pointer ${
                            isActive ? 'bg-pust-50/80' : 'hover:bg-slate-50'
                          }`}
                        >
                          <span className="mt-0.5">{renderIcon(entry.group)}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-900 truncate">
                              {entry.title}
                            </p>
                            <p className="font-mono text-[11px] text-slate-500 truncate mt-0.5">
                              {entry.subtitle}
                            </p>
                          </div>
                          <ArrowRight
                            className={`w-3.5 h-3.5 mt-1 shrink-0 transition-colors ${
                              isActive ? 'text-pust-800' : 'text-slate-300'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            <div className="px-3.5 py-2 border-t border-slate-100 bg-[#F7F7F5] flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-500">
              <span className="inline-flex items-center gap-2">
                <span className="inline-flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> Depts
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Notices
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <Compass className="w-3 h-3" /> Resources
                </span>
              </span>
              <span className="hidden sm:inline">↑↓ Navigate · ↵ Open · Esc Close</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
