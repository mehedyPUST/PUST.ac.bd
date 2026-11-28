'use client';

import { useEffect } from 'react';
import {
  BookOpen,
  Building2,
  Calendar,
  FileText,
  Globe,
  GraduationCap,
  Image as ImageIcon,
  Landmark,
  Layers,
  Newspaper,
  Pencil,
  ScrollText,
  ShieldCheck,
  ShieldPlus,
  Users,
  X,
} from 'lucide-react';
import { resolveContextualEditTarget } from '../lib/cmsDefaults';
import type { DepartmentRecord, EditModalTarget } from '../types/pust';
import { AdminModeSwitch } from './AdminModeSwitch';

interface AdminCmsDirectoryModalProps {
  open: boolean;
  onClose: () => void;
  route: string;
  currentDepartment: DepartmentRecord | null;
  editMode: boolean;
  onToggleEditMode: () => void;
  onSelectTarget: (target: EditModalTarget) => void;
  onNavigate: (route: string) => void;
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
}: AdminCmsDirectoryModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const contextual = resolveContextualEditTarget(route);

  function trigger(target: EditModalTarget) {
    onClose();
    onSelectTarget(target);
  }

  function triggerContextual() {
    if (!contextual) return;
    switch (contextual.targetKind) {
      case 'hero-profile':
        return trigger({ kind: 'hero-profile' });
      case 'verify-page':
        return trigger({ kind: 'verify-page' });
      case 'gallery':
        return trigger({ kind: 'gallery', item: null });
      case 'notice':
        return trigger({
          kind: 'notice',
          notice: null,
          defaultCategory: contextual.noticeCategory,
        });
      case 'governance':
        return trigger({ kind: 'governance', tab: 'pust-act' });
      case 'admissions-info':
        return trigger({ kind: 'admissions-info' });
      case 'facility':
        return trigger({ kind: 'facility', route });
      case 'about':
        return trigger({ kind: 'about', slug: 'our-university' });
      case 'department':
        return trigger({ kind: 'department', department: currentDepartment });
      case 'degree-programs':
        return trigger({ kind: 'degree-programs' });
      case 'faculty-deans':
        return trigger({ kind: 'faculty-deans' });
      case 'academic-calendar':
        return trigger({ kind: 'academic-calendar' });
      case 'scholarships':
        return trigger({ kind: 'scholarships' });
      case 'download-forms':
        return trigger({ kind: 'download-forms' });
      case 'seminars':
        return trigger({ kind: 'seminars' });
      case 'journals':
        return trigger({ kind: 'journals' });
      case 'admin-office':
        return trigger({ kind: 'admin-office', officeSlug: contextual.officeSlug });
      case 'apa-benchmarks':
        return trigger({ kind: 'apa-benchmarks' });
      default:
        return;
    }
  }

  const sections: Array<{
    group: string;
    items: Array<{
      label: string;
      desc: string;
      icon: typeof Globe;
      onClick: () => void;
    }>;
  }> = [
    {
      group: 'Homepage & Core Identity',
      items: [
        {
          label: 'Hero, Tagline & Key Stats',
          desc: 'Headline, campus acreage, faculties & stats',
          icon: Globe,
          onClick: () => trigger({ kind: 'hero-profile' }),
        },
        {
          label: 'Homepage Banner Carousel',
          desc: 'Upload slides to ImageKit.io & edit captions',
          icon: ImageIcon,
          onClick: () => trigger({ kind: 'banner' }),
        },
        {
          label: 'Vice-Chancellor Profile',
          desc: 'Current VC message, portrait & archive',
          icon: Users,
          onClick: () => trigger({ kind: 'vc' }),
        },
        {
          label: 'About PUST & Milestones',
          desc: 'University history, vision & strategic plans',
          icon: Landmark,
          onClick: () => trigger({ kind: 'about', slug: 'our-university' }),
        },
        {
          label: 'Campus Map & Buildings',
          desc: 'Interactive Rajapur campus map pins & photos',
          icon: Building2,
          onClick: () => trigger({ kind: 'campus-building' }),
        },
        {
          label: 'Institutional Quick Links',
          desc: 'Homepage spotlight links & portal cards',
          icon: Layers,
          onClick: () => trigger({ kind: 'institutional-links' }),
        },
      ],
    },
    {
      group: 'Academics, Departments & Research',
      items: [
        {
          label: 'Departments & Programs',
          desc: 'Create or edit departments, chairs & seats',
          icon: GraduationCap,
          onClick: () => trigger({ kind: 'department', department: currentDepartment }),
        },
        {
          label: 'Degree Programs Table',
          desc: 'Undergraduate, graduate & credit rules',
          icon: BookOpen,
          onClick: () => trigger({ kind: 'degree-programs' }),
        },
        {
          label: 'Faculties & Deans',
          desc: 'Faculty dean profiles & contact emails',
          icon: Users,
          onClick: () => trigger({ kind: 'faculty-deans' }),
        },
        {
          label: 'Academic Calendar & Seminars',
          desc: 'Term milestones, exam dates & symposia',
          icon: Calendar,
          onClick: () => trigger({ kind: 'academic-calendar' }),
        },
        {
          label: 'Journals & Publications',
          desc: 'Peer-reviewed university periodicals & research',
          icon: BookOpen,
          onClick: () => trigger({ kind: 'journals' }),
        },
        {
          label: 'Research Infrastructure',
          desc: 'Central labs, library & residential showcase cards',
          icon: Layers,
          onClick: () => trigger({ kind: 'research-infra' }),
        },
      ],
    },
    {
      group: 'Administration, Governance & Notices',
      items: [
        {
          label: '33 University Offices',
          desc: 'VC, Registrar, Proctor, Halls, ICT Cell & officers',
          icon: Building2,
          onClick: () => trigger({ kind: 'admin-office' }),
        },
        {
          label: 'Executive Leadership Roster',
          desc: 'Homepage statutory leadership directory',
          icon: Users,
          onClick: () => trigger({ kind: 'leadership' }),
        },
        {
          label: 'Governance & PUST Act',
          desc: 'Regent Board, Academic Council & Ordinance',
          icon: ShieldCheck,
          onClick: () => trigger({ kind: 'governance', tab: 'pust-act' }),
        },
        {
          label: 'APA Benchmarks',
          desc: 'Annual Performance Agreement targets',
          icon: FileText,
          onClick: () => trigger({ kind: 'apa-benchmarks' }),
        },
        {
          label: 'Publish Notice Circular',
          desc: 'Central, departmental & course notices',
          icon: Newspaper,
          onClick: () => trigger({ kind: 'notice', notice: null }),
        },
        {
          label: 'News & Events Gallery',
          desc: 'Photos & YouTube videos with privacy controls',
          icon: ImageIcon,
          onClick: () => trigger({ kind: 'gallery', item: null }),
        },
      ],
    },
    {
      group: 'Admissions, Services & Footer',
      items: [
        {
          label: 'Admissions & GST Units',
          desc: 'Intake seats, unit breakdowns & desk email',
          icon: GraduationCap,
          onClick: () => trigger({ kind: 'admissions-info' }),
        },
        {
          label: 'Scholarships & Forms',
          desc: 'Financial aid policies & downloadable forms',
          icon: FileText,
          onClick: () => trigger({ kind: 'scholarships' }),
        },
        {
          label: 'Campus Facilities Pages',
          desc: 'Library, Transport, Residence, Medical & ICT',
          icon: Building2,
          onClick: () => trigger({ kind: 'facility' }),
        },
        {
          label: 'Verification & Footer Config',
          desc: 'Document verify registry & footer links',
          icon: Globe,
          onClick: () => trigger({ kind: 'footer-config' }),
        },
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-[2px] p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cms-directory-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl bg-white rounded-2xl border border-stone-200 shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 bg-gradient-to-r from-pust-950 via-pust-900 to-pust-800 text-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-pust-200">
              Administrator Control Surface
            </p>
            <h2 id="cms-directory-title" className="font-serif text-xl font-medium text-white">
              Site-Wide CMS &amp; Directory Editor
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <AdminModeSwitch checked={editMode} onToggle={onToggleEditMode} variant="desktop" />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close CMS directory"
              className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/15 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Contextual Actions */}
          <div className="rounded-xl border border-stone-200 bg-[#FAF9F6] p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
                Current Route: {route || '/'}
              </p>
              <p className="text-xs text-slate-700 mt-0.5">
                Jump directly into editing the current section or manage portal user accounts.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {contextual && (
                <button
                  type="button"
                  onClick={triggerContextual}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-pust-900 text-white hover:bg-pust-950 cursor-pointer whitespace-nowrap"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  {contextual.label}
                </button>
              )}
              {currentDepartment && (
                <button
                  type="button"
                  onClick={() => trigger({ kind: 'department', department: currentDepartment })}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-pust-800 bg-white text-pust-900 hover:bg-pust-900 hover:text-white cursor-pointer whitespace-nowrap"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit {currentDepartment.code} Department
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigate('/portal?tab=users');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-stone-300 bg-white text-slate-800 hover:border-pust-800 hover:text-pust-900 cursor-pointer whitespace-nowrap"
              >
                <Users className="w-3.5 h-3.5" />
                User Directory
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigate('/portal?tab=users&action=create-admin');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-pust-800 bg-white text-pust-900 hover:bg-pust-900 hover:text-white cursor-pointer whitespace-nowrap"
              >
                <ShieldPlus className="w-3.5 h-3.5" />
                Add Co-Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigate('/portal?tab=audit');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-stone-300 bg-white text-slate-800 hover:border-pust-800 hover:text-pust-900 cursor-pointer whitespace-nowrap"
              >
                <ScrollText className="w-3.5 h-3.5" />
                Audit Log
              </button>
            </div>
          </div>

          {sections.map((section) => (
            <div key={section.group} className="space-y-3">
              <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-pust-900 border-b border-stone-200 pb-1.5">
                {section.group}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {section.items.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={item.onClick}
                      className={`p-4 rounded-xl border border-stone-200 hover:border-pust-800 text-left transition-colors cursor-pointer flex items-start gap-3 ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-[#FAF9F6]'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-lg bg-pust-900/10 text-pust-900 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                        <p className="text-xs text-slate-600 mt-0.5 leading-snug">{item.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
