'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, ChevronDown, PlayCircle, X } from 'lucide-react';
import type { AppRoute } from '../lib/routes';
import { ResilientImage } from './ResilientImage';
import type {
  AboutContentRecord,
  GalleryItemRecord,
  NoticeRecord,
  UniversityProfile,
  ViceChancellorRecord,
} from '../types/pust';

const VC_PORTRAIT_IMAGE = '/src/assets/images/pust_vc_portrait_1795438823012.jpg';

interface HomePageProps {
  heroImage: string;
  profile: UniversityProfile | null;
  aboutSections: AboutContentRecord[];
  vcProfiles: ViceChancellorRecord[];
  galleryItems: GalleryItemRecord[];
  notices: NoticeRecord[];
  onNavigate: (route: AppRoute) => void;
  onSelectNotice: (notice: NoticeRecord) => void;
}

const GALLERY_CATS: Array<'All' | GalleryItemRecord['category']> = [
  'All',
  'Convocation',
  'Festival',
  'Academic Event',
  'Campus Life',
];

const FACULTIES_OVERVIEW = [
  { code: 'FET', name: 'Engineering & Technology', depts: '7 Depts · CSE, EEE, ETE, ICE, ARCH, CE, URP' },
  { code: 'FS', name: 'Faculty of Science', depts: '4 Depts · Mathematics, Physics, Chemistry, Statistics' },
  { code: 'FBS', name: 'Business Studies', depts: '2 Depts · Business Admin, Tourism & Hospitality' },
  { code: 'FHSS', name: 'Humanities & Social Science', depts: '6 Depts · Economics, Bangla, English, PA, HIS, SW' },
  { code: 'FLES', name: 'Life & Earth Science', depts: '2 Depts · Geography & Environment, Pharmacy' },
];

export function HomePage({
  heroImage,
  profile,
  aboutSections,
  vcProfiles,
  galleryItems,
  notices,
  onNavigate,
  onSelectNotice,
}: HomePageProps) {
  const [showPreviousVcs, setShowPreviousVcs] = useState(false);
  const [galleryCategory, setGalleryCategory] =
    useState<'All' | GalleryItemRecord['category']>('All');
  const [activeMedia, setActiveMedia] = useState<GalleryItemRecord | null>(null);

  const featuredNotices = notices.slice(0, 4);
  const leadNotice = featuredNotices[0];
  const secondaryNotices = featuredNotices.slice(1);

  const currentVc = vcProfiles.find((v) => v.isCurrent) || vcProfiles[0];
  const previousVcs = vcProfiles
    .filter((v) => !v.isCurrent)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const ourUniversity =
    aboutSections.find((s) => s.slug === 'our-university') || aboutSections[0];
  const missionVision = aboutSections.find((s) => s.slug === 'mission-vision');

  const visibleGallery =
    galleryCategory === 'All'
      ? galleryItems
      : galleryItems.filter((g) => g.category === galleryCategory);

  return (
    <main className="flex-1 bg-[#FAF8F4]">
      {/* Institutional Hero & Operational Utility Ribbon */}
      <section className="bg-[#FAF8F4] border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 lg:pt-14 lg:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-between py-2">
              <div className="space-y-6">
                <p className="font-mono text-xs uppercase tracking-widest text-emerald-800">
                  Rajapur, Pabna-6600 · First Convocation:{' '}
                  {profile?.convocationDate ?? '15 March 2027'}
                </p>
                <h1 className="font-serif text-[clamp(2.2rem,3.9vw,3.45rem)] leading-[1.08] font-medium tracking-tight text-slate-900">
                  Advancing Science, Engineering &amp; Human Inquiry from Pabna
                </h1>
                <p className="text-base sm:text-[17px] leading-relaxed text-slate-600 max-w-xl">
                  Established in 2008 beside the Dhaka–Pabna highway in Rajapur, Pabna University
                  of Science and Technology serves nearly 5,000 students and 172 faculty members
                  across 5 faculties and 21 academic departments.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-stone-200 flex flex-wrap items-center gap-4">
                <Link
                  href="/academics/departments"
                  className="px-6 py-3 text-sm font-medium bg-emerald-800 text-white hover:bg-emerald-900 transition-colors whitespace-nowrap shrink-0"
                >
                  Explore 21 Departments
                </Link>
                <Link
                  href="/portal"
                  className="px-5 py-3 text-sm font-medium border border-stone-300 bg-white text-slate-800 hover:border-emerald-800 hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0"
                >
                  Open Digital Campus Portal
                </Link>
                <Link
                  href="/notices"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-800 hover:text-emerald-950 transition-colors whitespace-nowrap shrink-0"
                >
                  Notice Board
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <ResilientImage
                src={heroImage}
                fallbackSrc="/src/assets/images/pust_campus_hero_1795431408503.jpg"
                alt="Pabna University of Science and Technology Rajapur campus academic complex"
                caption="Fig. 1 — Main Academic Promenade and Campus Grounds, Rajapur Campus, Pabna."
                containerClassName="h-full flex flex-col"
                className="w-full h-full min-h-[300px] lg:min-h-[420px] object-cover"
              />
            </div>
          </div>

          {/* Operational Utility Ribbon */}
          <dl className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-stone-200 bg-white">
            <div className="px-5 py-4 border-b sm:border-b-0 sm:border-r border-stone-200">
              <dt className="text-xs uppercase tracking-wider text-slate-500">Established</dt>
              <dd className="font-mono tabular-nums text-sm font-medium text-slate-900 mt-1">
                2008 · 30-Acre Campus
              </dd>
            </div>
            <div className="px-5 py-4 border-b lg:border-b-0 lg:border-r border-stone-200">
              <dt className="text-xs uppercase tracking-wider text-slate-500">Academic Scope</dt>
              <dd className="font-mono tabular-nums text-sm font-medium text-slate-900 mt-1">
                5 Faculties · 21 Departments
              </dd>
            </div>
            <div className="px-5 py-4 border-b sm:border-b-0 sm:border-r border-stone-200">
              <dt className="text-xs uppercase tracking-wider text-slate-500">Community</dt>
              <dd className="font-mono tabular-nums text-sm font-medium text-slate-900 mt-1">
                172 Faculty · ~5,000 Students
              </dd>
            </div>
            <div className="px-5 py-4 bg-emerald-50/40">
              <dt className="text-xs uppercase tracking-wider text-slate-500">First Convocation</dt>
              <dd className="font-mono tabular-nums text-sm font-semibold text-emerald-800 mt-1">
                {profile?.convocationDate ?? '15 March 2027'} · Rajapur
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* About PUST Summary + Current VC Portrait & Expandable Previous VCs */}
      <section className="bg-white border-b border-stone-200 py-14 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* About PUST Summary */}
          <div className="lg:col-span-5 space-y-5">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-emerald-800">
                About PUST
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-medium text-slate-900 mt-1">
                {ourUniversity?.title || 'Our University'}
              </h2>
            </div>
            <p className="text-[15px] leading-relaxed text-slate-700 first-letter:font-serif first-letter:text-5xl first-letter:font-medium first-letter:float-left first-letter:mr-3 first-letter:leading-[0.86] first-letter:text-emerald-800">
              {ourUniversity?.body}
            </p>
            {missionVision && (
              <div className="pt-4 border-t border-stone-200 space-y-1.5">
                <p className="font-mono text-xs uppercase tracking-wider text-slate-500">
                  {missionVision.title}
                </p>
                <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                  {missionVision.body}
                </p>
              </div>
            )}
            <div className="flex flex-wrap gap-4 pt-2 text-sm font-medium">
              <Link
                href="/about/our-university"
                className="text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1 whitespace-nowrap"
              >
                University Overview
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/about/history"
                className="text-slate-700 hover:text-emerald-800 whitespace-nowrap"
              >
                History
              </Link>
              <Link
                href="/about/mission-vision"
                className="text-slate-700 hover:text-emerald-800 whitespace-nowrap"
              >
                Mission &amp; Vision
              </Link>
              <Link
                href="/about/plans"
                className="text-slate-700 hover:text-emerald-800 whitespace-nowrap"
              >
                Strategic Plans
              </Link>
            </div>
          </div>

          {/* Current Vice-Chancellor + Portrait + Expandable Previous VCs Archive */}
          <div className="lg:col-span-7 bg-[#FAF8F4] border border-stone-200 p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start border-b border-stone-200 pb-6">
              <div className="sm:col-span-4">
                <ResilientImage
                  src={VC_PORTRAIT_IMAGE}
                  alt={currentVc?.name || 'Current Vice-Chancellor of PUST'}
                  className="w-full aspect-[3/4] object-cover border border-stone-200"
                />
              </div>

              <div className="sm:col-span-8 flex flex-col justify-between space-y-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest text-emerald-800">
                    Current Vice-Chancellor · {currentVc?.tenure}
                  </p>
                  <h2 className="font-serif text-2xl font-medium text-slate-900 mt-1">
                    {currentVc?.name || 'Prof. Dr. Abul Hasnat Md. Shamim'}
                  </h2>
                  <p className="font-mono text-xs text-slate-500 mt-1 tabular-nums">
                    {currentVc?.email} · {currentVc?.phone}
                  </p>
                </div>

                <p className="text-[15px] text-slate-700 leading-relaxed">{currentVc?.message}</p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowPreviousVcs((prev) => !prev)}
                    aria-expanded={showPreviousVcs}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium border border-stone-300 bg-white text-slate-800 hover:border-emerald-800 hover:text-emerald-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Previous Vice-Chancellors ({previousVcs.length})
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${
                        showPreviousVcs ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <Link
                    href="/administration/vc-office"
                    className="text-xs font-medium text-emerald-800 hover:underline whitespace-nowrap"
                  >
                    VC Office Directory →
                  </Link>
                </div>
              </div>
            </div>

            {/* Hidden by default; toggles open on button click */}
            {showPreviousVcs && (
              <div className="space-y-3">
                <p className="font-mono text-xs uppercase tracking-widest text-slate-600">
                  Former Vice-Chancellors Chronological Archive
                </p>
                <div className="divide-y divide-stone-200 bg-white border border-stone-200">
                  {previousVcs.map((vc) => (
                    <div
                      key={vc.id}
                      className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
                    >
                      <div>
                        <p className="font-serif font-medium text-slate-900">{vc.name}</p>
                        <p className="text-xs text-slate-500">{vc.message}</p>
                      </div>
                      <span className="font-mono tabular-nums text-xs text-emerald-800 whitespace-nowrap shrink-0">
                        {vc.tenure}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Latest Official Bulletins + Dedicated Pages Directory */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-end justify-between gap-4 pb-4 border-b border-stone-200">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-emerald-800">
                  Latest Bulletins
                </p>
                <h2 className="font-serif text-2xl sm:text-3xl font-medium text-slate-900 mt-1">
                  Recent University Circulars
                </h2>
              </div>
              <Link
                href="/notices"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-800 hover:text-emerald-950 whitespace-nowrap shrink-0"
              >
                All Notices
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="border border-stone-200 bg-white divide-y divide-stone-200">
              {leadNotice && (
                <button
                  type="button"
                  onClick={() => onSelectNotice(leadNotice)}
                  className="w-full text-left p-6 bg-emerald-50/30 hover:bg-emerald-50/60 transition-colors space-y-2 group cursor-pointer"
                >
                  <p className="font-mono text-xs text-slate-500 tabular-nums">
                    {leadNotice.publishedAt} ·{' '}
                    <span className="font-semibold text-emerald-800">{leadNotice.category}</span> ·{' '}
                    {leadNotice.referenceNo}
                    {leadNotice.visibility === 'registered' && ' · Campus Members Only'}
                  </p>
                  <h3 className="font-serif text-xl font-medium text-slate-900 group-hover:text-emerald-900 transition-colors">
                    {leadNotice.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{leadNotice.summary}</p>
                </button>
              )}

              {secondaryNotices.map((notice) => (
                <button
                  key={notice.id}
                  type="button"
                  onClick={() => onSelectNotice(notice)}
                  className="w-full text-left px-6 py-4 hover:bg-emerald-50/30 transition-colors space-y-1 group cursor-pointer"
                >
                  <p className="font-mono text-xs text-slate-500 tabular-nums">
                    {notice.publishedAt} ·{' '}
                    <span className="font-semibold text-emerald-800">{notice.category}</span> ·{' '}
                    {notice.referenceNo}
                    {notice.visibility === 'registered' && ' · Campus Members Only'}
                  </p>
                  <h3 className="font-serif text-lg font-medium text-slate-900 group-hover:text-emerald-900 transition-colors">
                    {notice.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">
                    {notice.summary}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-5">
            <div className="pb-4 border-b border-stone-200">
              <p className="font-mono text-xs uppercase tracking-widest text-emerald-800">
                University Directory
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-medium text-slate-900 mt-1">
                Institutional Sections
              </h2>
            </div>

            <div className="divide-y divide-stone-200 border border-stone-200 bg-white">
              {[
                {
                  route: '/governance' as AppRoute,
                  title: 'Governance & Statutory Bodies',
                  desc: 'University Act (Act No. 43 of 2001), Regent Board, Academic Council, Finance Committee & Ordinance.',
                },
                {
                  route: '/administration' as AppRoute,
                  title: 'Administration & Offices',
                  desc: 'VC Office, Pro-VC, Treasurer, Registrar, Proctor, Student Advisor, ICT Cell & APA.',
                },
                {
                  route: '/academics/departments' as AppRoute,
                  title: '21 Academic Departments',
                  desc: 'Academic programs, calendars, deans, chairmen, scholarships & PUST journals.',
                },
                {
                  route: '/facilities' as AppRoute,
                  title: 'Campus Facilities & Halls',
                  desc: 'Central Library, Transport Pool, July 06 Hall & Dormitories, Medical & ICT Sheba.',
                },
                {
                  route: '/admissions' as AppRoute,
                  title: 'Admissions 2026–2027',
                  desc: 'Undergraduate (GST), Graduate, Evening Programs, and direct Admission Inquiry desk.',
                },
                {
                  route: '/portal' as AppRoute,
                  title: 'Digital University Platform',
                  desc: 'Library cards, Hall clearance & seat allotment, Exam form fill-up, Admit cards & Certificates.',
                },
              ].map((item) => (
                <button
                  key={item.route}
                  type="button"
                  onClick={() => onNavigate(item.route)}
                  className="w-full text-left px-5 py-4 hover:bg-emerald-50/35 transition-colors flex items-center justify-between gap-4 group cursor-pointer"
                >
                  <div>
                    <h3 className="font-serif text-base font-medium text-slate-900 group-hover:text-emerald-900 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-800 shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Homepage Campus Gallery (Photos & Videos) */}
      <section className="bg-white border-t border-b border-stone-200 py-14 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-5 border-b border-stone-200">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-emerald-800">
                Campus Life &amp; Chronicles
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-medium text-slate-900 mt-1">
                University Gallery — Photos &amp; Videos
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {GALLERY_CATS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setGalleryCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    galleryCategory === cat
                      ? 'bg-emerald-800 text-white'
                      : 'bg-stone-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
              <Link
                href="/gallery"
                className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 whitespace-nowrap shrink-0"
              >
                Full Archive
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {visibleGallery.slice(0, 4).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveMedia(item)}
                className="text-left border border-stone-200 bg-[#FAF8F4] hover:border-emerald-400 transition-colors group cursor-pointer flex flex-col"
              >
                <div className="relative overflow-hidden bg-slate-900 aspect-[4/3]">
                  <ResilientImage
                    src={item.mediaUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />
                  {item.mediaType === 'video' && (
                    <span className="absolute inset-0 flex items-center justify-center bg-slate-950/35 text-white">
                      <PlayCircle className="w-10 h-10" />
                    </span>
                  )}
                </div>
                <div className="p-4 space-y-1 flex-1">
                  <p className="font-mono text-[11px] text-emerald-800 tabular-nums">
                    {item.category} · {item.mediaType.toUpperCase()} · {item.eventDate}
                  </p>
                  <h3 className="font-serif text-base font-medium text-slate-900 group-hover:text-emerald-900">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2">{item.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 5 Faculties & Research Spotlight Strip */}
      <section className="bg-[#FAF8F4] py-12 lg:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-200 pb-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-emerald-800">
                Academic Architecture
              </p>
              <h2 className="font-serif text-2xl font-medium text-slate-900 mt-1">
                Five Faculties &amp; Research Journals
              </h2>
            </div>
            <div className="flex flex-wrap gap-4 text-xs font-medium">
              <Link href="/academics/journals" className="text-emerald-800 hover:underline whitespace-nowrap">
                PUST Journals →
              </Link>
              <Link href="/academics/publications" className="text-emerald-800 hover:underline whitespace-nowrap">
                Research Publications →
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 border border-stone-200 bg-white divide-y sm:divide-y-0 sm:divide-x divide-stone-200">
            {FACULTIES_OVERVIEW.map((f) => (
              <Link
                key={f.code}
                href="/academics/departments"
                className="p-4 hover:bg-emerald-50/40 transition-colors space-y-1.5 block"
              >
                <p className="font-mono text-xs font-semibold text-emerald-800">{f.code}</p>
                <h3 className="font-serif text-base font-medium text-slate-900">{f.name}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{f.depts}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Media Preview Modal */}
      {activeMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-[2px] p-4"
          onClick={() => setActiveMedia(null)}
        >
          <div
            className="w-full max-w-2xl bg-white border border-stone-200 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-stone-200 bg-[#FAF8F4]">
              <div>
                <p className="font-mono text-xs text-emerald-800 tabular-nums">
                  {activeMedia.category} · {activeMedia.mediaType.toUpperCase()} ·{' '}
                  {activeMedia.eventDate}
                </p>
                <h3 className="font-serif text-xl font-medium text-slate-900 mt-0.5">
                  {activeMedia.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveMedia(null)}
                aria-label="Close media modal"
                className="p-1.5 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {activeMedia.mediaUrl.endsWith('.mp4') || activeMedia.mediaUrl.endsWith('.webm') ? (
                <video src={activeMedia.mediaUrl} controls className="w-full aspect-video bg-black" />
              ) : (
                <ResilientImage
                  src={activeMedia.mediaUrl}
                  alt={activeMedia.title}
                  className="w-full aspect-video object-cover"
                />
              )}
              <p className="text-sm text-slate-700 leading-relaxed">{activeMedia.description}</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
