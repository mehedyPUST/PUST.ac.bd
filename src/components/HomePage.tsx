import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { ResilientImage } from './ResilientImage';
import type { NoticeRecord, UniversityProfile } from '../types/pust';

export type AppRoute =
  | '/'
  | '/administration'
  | '/academics'
  | '/notices'
  | '/research'
  | '/admissions'
  | '/portal';

interface HomePageProps {
  heroImage: string;
  profile: UniversityProfile | null;
  notices: NoticeRecord[];
  onNavigate: (route: AppRoute) => void;
  onSelectNotice: (notice: NoticeRecord) => void;
}

export function HomePage({
  heroImage,
  profile,
  notices,
  onNavigate,
  onSelectNotice,
}: HomePageProps) {
  const featuredNotices = notices.slice(0, 3);

  return (
    <main className="flex-1">
      {/* Institutional Hero & Operational Utility Ribbon */}
      <section className="bg-gradient-to-b from-emerald-50/40 via-slate-50 to-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 lg:pt-14 lg:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-between py-2">
              <div className="space-y-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
                  Rajapur, Pabna-6600 · First Convocation: {profile?.convocationDate ?? '15 March 2027'}
                </p>
                <h1 className="font-serif text-[clamp(2.25rem,4vw,3.5rem)] leading-[1.08] font-medium tracking-tight text-slate-900">
                  Advancing Science, Engineering &amp; Human Inquiry from Pabna
                </h1>
                <p className="text-base sm:text-[17px] leading-relaxed text-slate-600 max-w-xl">
                  Established in 2008 beside the Dhaka–Pabna highway in Rajapur, Pabna University
                  of Science and Technology serves nearly 5,000 students and 172 faculty members
                  across 5 faculties and 21 academic departments.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap items-center gap-5">
                <button
                  type="button"
                  onClick={() => onNavigate('/academics')}
                  className="px-6 py-3 text-sm font-medium bg-emerald-700 text-white hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
                >
                  Explore 21 Departments
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/notices')}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Official Notice Board
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-6">
              <ResilientImage
                src={heroImage}
                alt="Pabna University of Science and Technology Rajapur campus academic complex"
                caption="Fig. 1 — Main Academic Promenade and Library Complex, Rajapur Campus, Pabna."
                containerClassName="h-full flex flex-col"
                className="w-full h-full min-h-[300px] lg:min-h-[420px] object-cover"
              />
            </div>
          </div>

          {/* Operational Utility Ribbon */}
          <dl className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-slate-200 bg-white shadow-xs">
            <div className="px-5 py-4 border-b sm:border-b-0 sm:border-r border-slate-200">
              <dt className="text-xs uppercase tracking-wider text-slate-500">Established</dt>
              <dd className="font-mono tabular-nums text-sm font-medium text-slate-900 mt-1">
                2008 · 30-Acre Campus
              </dd>
            </div>
            <div className="px-5 py-4 border-b lg:border-b-0 lg:border-r border-slate-200">
              <dt className="text-xs uppercase tracking-wider text-slate-500">Academic Scope</dt>
              <dd className="font-mono tabular-nums text-sm font-medium text-slate-900 mt-1">
                5 Faculties · 21 Departments
              </dd>
            </div>
            <div className="px-5 py-4 border-b sm:border-b-0 sm:border-r border-slate-200">
              <dt className="text-xs uppercase tracking-wider text-slate-500">Community</dt>
              <dd className="font-mono tabular-nums text-sm font-medium text-slate-900 mt-1">
                172 Faculty · ~5,000 Students
              </dd>
            </div>
            <div className="px-5 py-4 bg-emerald-50/40">
              <dt className="text-xs uppercase tracking-wider text-slate-500">First Convocation</dt>
              <dd className="font-mono tabular-nums text-sm font-semibold text-emerald-700 mt-1">
                15 March 2027 · Rajapur
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Latest Official Bulletins + Dedicated Section Directory */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Latest 3 Notices */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-end justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
                  Latest Bulletins
                </p>
                <h2 className="font-serif text-2xl sm:text-3xl font-medium text-slate-900 mt-1">
                  Recent University Circulars
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('/notices')}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-900 whitespace-nowrap shrink-0 cursor-pointer"
              >
                All Notices
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-slate-200 border border-slate-200 bg-white">
              {featuredNotices.map((notice) => (
                <button
                  key={notice.id}
                  type="button"
                  onClick={() => onSelectNotice(notice)}
                  className="w-full text-left p-5 hover:bg-emerald-50/35 transition-colors space-y-1.5 group cursor-pointer"
                >
                  <p className="font-mono text-xs text-slate-500 tabular-nums">
                    {notice.publishedAt} ·{' '}
                    <span className="font-semibold text-emerald-700">{notice.category}</span> ·{' '}
                    {notice.referenceNo}
                  </p>
                  <h3 className="font-serif text-lg font-medium text-slate-900 group-hover:text-emerald-800 transition-colors">
                    {notice.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{notice.summary}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Dedicated University Pages Gateway */}
          <div className="lg:col-span-5 space-y-5">
            <div className="pb-4 border-b border-slate-200">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
                University Directory
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-medium text-slate-900 mt-1">
                Explore PUST Sections
              </h2>
            </div>

            <div className="divide-y divide-slate-200 border border-slate-200 bg-white">
              {[
                {
                  route: '/administration' as AppRoute,
                  title: 'Administration & Governance',
                  desc: 'Vice-Chancellor’s message, executive offices, Regent Board, APA & IQAC.',
                },
                {
                  route: '/academics' as AppRoute,
                  title: 'Faculties & 21 Departments',
                  desc: 'Degree pathways, seat intake, laboratories, and departmental prospectuses.',
                },
                {
                  route: '/research' as AppRoute,
                  title: 'Research, Journals & Campus',
                  desc: 'Peer-reviewed faculty publications, PUST journals, Central Library & July 06 Hall.',
                },
                {
                  route: '/admissions' as AppRoute,
                  title: 'Admissions 2026–2027',
                  desc: 'GST undergraduate intake, graduate & evening programs, and inquiry desk.',
                },
                {
                  route: '/portal' as AppRoute,
                  title: 'JWT Campus Portal',
                  desc: 'Student, faculty, and Registrar sign-in with saved bookmarks and notice tools.',
                },
              ].map((item) => (
                <button
                  key={item.route}
                  type="button"
                  onClick={() => onNavigate(item.route)}
                  className="w-full text-left px-5 py-4 hover:bg-emerald-50/35 transition-colors flex items-center justify-between gap-4 group cursor-pointer"
                >
                  <div>
                    <h3 className="font-serif text-base font-medium text-slate-900 group-hover:text-emerald-800 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
