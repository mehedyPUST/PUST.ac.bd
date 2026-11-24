'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  FileCheck2,
  PlayCircle,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { AppRoute } from '../lib/routes';
import { HeroSummarySkeleton } from './PustSkeletons';
import { ResilientImage } from './ResilientImage';
import type {
  AboutContentRecord,
  GalleryItemRecord,
  NoticeRecord,
  PublicationRecord,
  UniversityProfile,
  ViceChancellorRecord,
} from '../types/pust';

const VC_PORTRAIT_IMAGE = '/src/assets/images/VC_Sir_PUST_2026.JPG';
const VC_PORTRAIT_FALLBACK = 'https://pust.ac.bd/includes/images/messages_pic/VC_Sir_PUST_2026.JPG';

interface HomePageProps {
  heroImage: string;
  profile: UniversityProfile | null;
  aboutSections: AboutContentRecord[];
  vcProfiles: ViceChancellorRecord[];
  galleryItems: GalleryItemRecord[];
  publications: PublicationRecord[];
  notices: NoticeRecord[];
  onNavigate: (route: AppRoute | string) => void;
  onSelectNotice: (notice: NoticeRecord) => void;
}

const NEWS_EVENT_CATS: Array<'All' | GalleryItemRecord['category']> = [
  'All',
  'Convocation',
  'Academic Event',
  'Festival',
  'Campus Life',
];

const NOTICE_CATS: Array<'All' | NoticeRecord['category']> = [
  'All',
  'Admission',
  'Examination',
  'Academic',
  'General',
];

const UPCOMING_CAMPUS_EVENTS = [
  {
    date: '2026-12-03',
    organizer: 'IQAC & ICT Cell',
    title: 'Outcome-Based Education (OBE) & Digital Assessment Symposium',
  },
  {
    date: '2026-12-18',
    organizer: 'Faculty of Engineering & Technology',
    title: '2nd Regional Workshop on Smart Grid, VLSI & River Basin Geotechnics',
  },
  {
    date: '2027-01-14',
    organizer: 'Dept. of Pharmacy & Chemistry',
    title: 'Phytochemistry & Sustainable Nanomaterials Research Colloquium',
  },
  {
    date: '2027-03-15',
    organizer: 'Office of the Vice-Chancellor',
    title: 'Historic First University Convocation at Rajapur Ceremonial Pavilion',
  },
];

export function HomePage({
  heroImage,
  profile,
  aboutSections,
  vcProfiles,
  galleryItems,
  publications,
  notices,
  onSelectNotice,
}: HomePageProps) {
  const [showPreviousVcs, setShowPreviousVcs] = useState(false);
  const [noticeCategory, setNoticeCategory] =
    useState<'All' | NoticeRecord['category']>('All');
  const [pubDeptFilter, setPubDeptFilter] = useState<string>('ALL');
  const [eventCategory, setEventCategory] =
    useState<'All' | GalleryItemRecord['category']>('All');
  const [activeMedia, setActiveMedia] = useState<GalleryItemRecord | null>(null);

  useEffect(() => {
    if (!activeMedia) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setActiveMedia(null);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [activeMedia]);

  const filteredNotices =
    noticeCategory === 'All'
      ? notices
      : notices.filter((n) => n.category === noticeCategory);
  const featuredNotices = filteredNotices.slice(0, 4);
  const leadNotice = featuredNotices[0];
  const secondaryNotices = featuredNotices.slice(1);

  const currentVc = vcProfiles.find((v) => v.isCurrent) || vcProfiles[0];
  const previousVcs = vcProfiles
    .filter((v) => !v.isCurrent)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const ourUniversity =
    aboutSections.find((s) => s.slug === 'our-university') || aboutSections[0];
  const missionVision = aboutSections.find((s) => s.slug === 'mission-vision');

  const pubDeptFilters = useMemo(
    () => ['ALL', ...Array.from(new Set(publications.map((p) => p.departmentCode)))],
    [publications]
  );

  const visiblePublications = useMemo(() => {
    const list =
      pubDeptFilter === 'ALL'
        ? publications
        : publications.filter((p) => p.departmentCode === pubDeptFilter);
    return list.slice(0, 4);
  }, [publications, pubDeptFilter]);

  const visibleEvents =
    eventCategory === 'All'
      ? galleryItems
      : galleryItems.filter((g) => g.category === eventCategory);

  const vcParagraphs = (currentVc?.message || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const vcClosingLine =
    vcParagraphs.length > 1 && vcParagraphs[vcParagraphs.length - 1].startsWith('Long Live')
      ? vcParagraphs[vcParagraphs.length - 1]
      : null;
  const vcBodyParagraphs = vcClosingLine ? vcParagraphs.slice(0, -1) : vcParagraphs;

  return (
    <main className="flex-1 bg-[#F7F7F5]">
      {/* 1. Banner */}
      <section id="banner" className="bg-[#F7F7F5] border-b border-slate-200 scroll-mt-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 lg:pt-14 lg:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-between py-2">
              <div className="space-y-5">
                <p className="font-mono text-xs uppercase tracking-widest text-pust-800">
                  Rajapur, Pabna-6600 · First Convocation:{' '}
                  {profile?.convocationDate ?? '15 March 2027'}
                </p>
                <h1 className="font-serif text-[clamp(2.2rem,3.9vw,3.45rem)] leading-[1.08] font-medium tracking-tight text-slate-900">
                  Advancing Science, Engineering &amp; Human Inquiry from Pabna
                </h1>
                <p className="text-base sm:text-[17px] leading-relaxed text-slate-600 max-w-xl">
                  Established in 2008 beside the Dhaka–Pabna highway in Rajapur (Gayeshpur, Pabna),
                  Pabna University of Science and Technology serves nearly 5,000 scholars and{' '}
                  {profile?.facultyMembersCount ?? 185} faculty members across {profile?.facultiesCount ?? 5}{' '}
                  faculties, {profile?.departmentsCount ?? 21} academic departments, and end-to-end
                  digital workflows.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap items-center gap-3">
                <Link
                  href="/portal"
                  className="px-5 py-3 rounded-lg text-sm font-semibold bg-pust-900 text-white hover:bg-pust-950 shadow-xs transition-colors whitespace-nowrap shrink-0"
                >
                  Open Digital Campus Portal
                </Link>
                <Link
                  href="/academics/departments"
                  className="px-5 py-3 rounded-lg text-sm font-medium border border-slate-300 bg-white text-slate-800 hover:border-pust-800 hover:text-pust-900 transition-colors whitespace-nowrap shrink-0"
                >
                  Explore 21 Departments
                </Link>
                <Link
                  href="/verify"
                  className="inline-flex items-center gap-1.5 px-4 py-3 rounded-lg text-sm font-medium text-pust-900 hover:bg-pust-50 transition-colors whitespace-nowrap shrink-0"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Verify Document
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <ResilientImage
                src={heroImage}
                fallbackSrc="/src/assets/images/pust_banner_official_2026.jpeg"
                alt="Pabna University of Science and Technology Rajapur campus academic complex"
                caption="Fig. 1 — Main Academic Promenade and Campus Grounds, Rajapur Campus, Pabna."
                containerClassName="h-full flex flex-col"
                className="w-full h-full min-h-[300px] lg:min-h-[420px] object-cover"
                priority
              />
            </div>
          </div>

          {/* Operational Utility Ribbon */}
          <dl className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b sm:border-b-0 sm:border-r border-slate-200">
              <dt className="text-xs uppercase tracking-wider text-slate-500">Established</dt>
              <dd className="font-mono tabular-nums text-sm font-medium text-slate-900 mt-1">
                2008 · Act No. 43 of 2001
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
                {profile?.facultyMembersCount ?? 185} Faculty · ~{profile?.studentsCount?.toLocaleString() ?? '4,800'} Students
              </dd>
            </div>
            <div className="bg-pust-950 hover:bg-pust-900 text-white transition-colors">
              <Link href="/verify" className="block h-full px-5 py-4">
                <dt className="text-xs uppercase tracking-wider text-pust-200 flex items-center justify-between">
                  <span>Public Registry</span>
                  <FileCheck2 className="w-3.5 h-3.5" />
                </dt>
                <dd className="font-mono tabular-nums text-sm font-semibold text-white mt-1">
                  Verify Certificates &amp; Receipts →
                </dd>
              </Link>
            </div>
          </dl>
        </div>
      </section>

      {/* 2. Vice-Chancellor's Welcome Message */}
      <section
        id="vc-message"
        className="bg-white border-b border-slate-200 py-14 lg:py-16 scroll-mt-28"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Sticky Column: VC Portrait, Desk Dossier & About PUST Summary */}
          <aside className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
            <div className="rounded-2xl bg-[#F7F7F5] border border-slate-200 p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                <div className="sm:col-span-5">
                  <ResilientImage
                    src={VC_PORTRAIT_IMAGE}
                    fallbackSrc={VC_PORTRAIT_FALLBACK}
                    alt={currentVc?.name || 'Current Vice-Chancellor of PUST'}
                    className="w-full aspect-[3/4] object-cover object-top"
                  />
                </div>
                <div className="sm:col-span-7 space-y-2">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-pust-800">
                    Honorable Vice-Chancellor
                  </p>
                  <h2 className="font-serif text-xl sm:text-2xl font-medium text-slate-900 leading-snug">
                    {currentVc?.name || 'Prof. Dr. Abul Hasnat Md. Shamim'}
                  </h2>
                  <p className="font-mono text-xs text-slate-600 tabular-nums">
                    {currentVc?.tenure}
                  </p>
                  <p className="font-mono text-xs text-slate-600 tabular-nums pt-1">
                    {currentVc?.email}
                    <br />
                    {currentVc?.phone}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowPreviousVcs((prev) => !prev)}
                  aria-expanded={showPreviousVcs}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium border border-slate-300 bg-white text-slate-800 hover:border-pust-800 hover:text-pust-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
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
                  className="text-xs font-medium text-pust-900 hover:underline whitespace-nowrap"
                >
                  Vice-Chancellor Office →
                </Link>
              </div>
            </div>

            {/* About PUST Brief & Sub-Topic Links */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-pust-800">
                  About PUST
                </p>
                <h3 className="font-serif text-xl font-medium text-slate-900 mt-1">
                  {ourUniversity?.title || 'Our University'}
                </h3>
              </div>
              {ourUniversity ? (
                <p className="text-sm leading-relaxed text-slate-600 line-clamp-4">
                  {ourUniversity.body}
                </p>
              ) : (
                <HeroSummarySkeleton />
              )}
              {missionVision && (
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 pt-3 border-t border-slate-200">
                  {missionVision.body.replace(/^Our Mission\s*\n/i, '')}
                </p>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2 text-xs font-semibold">
                <Link
                  href="/about/our-university"
                  className="text-pust-900 hover:underline whitespace-nowrap"
                >
                  Our University →
                </Link>
                <Link
                  href="/about/mission-vision"
                  className="text-slate-700 hover:text-pust-900 whitespace-nowrap"
                >
                  Mission &amp; Vision
                </Link>
                <Link
                  href="/about/history"
                  className="text-slate-700 hover:text-pust-900 whitespace-nowrap"
                >
                  History and Plans
                </Link>
              </div>
            </div>
          </aside>

          {/* Right Reading Column: Full Vice-Chancellor Welcome Address */}
          <article className="lg:col-span-7 rounded-2xl bg-[#FAF8F4] border border-slate-200 p-6 sm:p-8 lg:p-10 space-y-6">
            <header className="space-y-2 border-b border-slate-200 pb-5">
              <p className="font-mono text-xs uppercase tracking-widest text-pust-800">
                Welcome Message from the Vice-Chancellor · {currentVc?.tenure}
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-medium text-slate-900">
                {currentVc?.name || 'Prof. Dr. Abul Hasnat Md. Shamim'}
              </h2>
              <p className="text-sm text-slate-600">
                Honorable Vice-Chancellor, Pabna University of Science and Technology
              </p>
            </header>

            <div className="space-y-4 text-[15px] sm:text-base text-slate-700 leading-[1.78]">
              {vcBodyParagraphs.map((paragraph, idx) => (
                <p
                  key={idx}
                  className={
                    idx === 0
                      ? 'first-letter:font-serif first-letter:text-5xl first-letter:font-medium first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:leading-[0.84] first-letter:text-pust-800'
                      : ''
                  }
                >
                  {paragraph}
                </p>
              ))}
            </div>

            {vcClosingLine && (
              <div className="pt-4 border-t border-slate-200 space-y-1.5">
                <p className="font-serif italic text-lg text-slate-900">{vcClosingLine}</p>
                <p className="text-sm font-medium text-slate-700">
                  {currentVc?.name} · Vice-Chancellor
                </p>
              </div>
            )}

            {showPreviousVcs && (
              <div className="pt-6 border-t border-slate-200 space-y-3">
                <p className="font-mono text-xs uppercase tracking-widest text-slate-600">
                  Former Vice-Chancellors Chronological Archive
                </p>
                <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white overflow-hidden">
                  {previousVcs.map((vc) => (
                    <div
                      key={vc.id}
                      className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
                    >
                      <div>
                        <p className="font-serif font-medium text-slate-900">{vc.name}</p>
                        <p className="text-xs text-slate-500">{vc.message}</p>
                      </div>
                      <span className="font-mono tabular-nums text-xs text-pust-800 whitespace-nowrap shrink-0">
                        {vc.tenure}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>
        </div>
      </section>

      {/* 3. Notice Board */}
      <section
        id="notice-board"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16 scroll-mt-28"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          <div className="lg:col-span-7 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-pust-800">
                  Notice Board
                </p>
                <h2 className="font-serif text-2xl sm:text-3xl font-medium text-slate-900 mt-1">
                  Recent University Circulars
                </h2>
              </div>
              <Link
                href="/notices"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-pust-900 hover:underline whitespace-nowrap shrink-0"
              >
                All Notices
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter circulars by category">
              {NOTICE_CATS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setNoticeCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    noticeCategory === cat
                      ? 'bg-pust-900 text-white border-pust-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-pust-700 hover:text-pust-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
              <div className="divide-y divide-slate-200">
                {featuredNotices.length === 0 ? (
                  <div className="p-8 text-center space-y-3">
                    <p className="text-sm text-slate-600">
                      No circulars currently listed under{' '}
                      <span className="font-medium text-slate-900">{noticeCategory}</span>.
                    </p>
                    <button
                      type="button"
                      onClick={() => setNoticeCategory('All')}
                      className="px-4 py-2 rounded-lg text-xs font-medium border border-slate-300 bg-slate-50 text-pust-900 hover:border-pust-800 transition-colors cursor-pointer"
                    >
                      Show All Circulars
                    </button>
                  </div>
                ) : (
                  <>
                    {leadNotice && (
                      <button
                        key={leadNotice.id}
                        type="button"
                        onClick={() => onSelectNotice(leadNotice)}
                        className="w-full text-left p-6 bg-pust-50/35 hover:bg-pust-50/70 transition-colors space-y-2 group cursor-pointer"
                      >
                        <p className="font-mono text-xs text-slate-500 tabular-nums">
                          {leadNotice.publishedAt} ·{' '}
                          <span className="font-semibold text-pust-800">{leadNotice.category}</span> ·{' '}
                          {leadNotice.referenceNo}
                          {leadNotice.visibility === 'registered' && ' · Campus Members Only'}
                        </p>
                        <h3 className="font-serif text-xl font-medium text-slate-900 group-hover:text-pust-900 transition-colors">
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
                        className="w-full text-left px-6 py-4 hover:bg-slate-50 transition-colors space-y-1 group cursor-pointer"
                      >
                        <p className="font-mono text-xs text-slate-500 tabular-nums">
                          {notice.publishedAt} ·{' '}
                          <span className="font-semibold text-pust-800">{notice.category}</span> ·{' '}
                          {notice.referenceNo}
                          {notice.visibility === 'registered' && ' · Campus Members Only'}
                        </p>
                        <h3 className="font-serif text-lg font-medium text-slate-900 group-hover:text-pust-900 transition-colors">
                          {notice.title}
                        </h3>
                        <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">
                          {notice.summary}
                        </p>
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-5">
            <div className="pb-4 border-b border-slate-200">
              <p className="font-mono text-xs uppercase tracking-widest text-pust-800">
                Digital Services &amp; Directory
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-medium text-slate-900 mt-1">
                Institutional Sections
              </h2>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
              <div className="divide-y divide-slate-200">
                {[
                  {
                    route: '/portal' as AppRoute,
                    title: 'Digital Campus Portal & Workflows',
                    desc: 'Online fee checkout, Hall seat allotment & clearance, Library QR cards, Admit cards & 4-office Certificates.',
                  },
                  {
                    route: '/verify' as AppRoute,
                    title: 'Public Document Verification Registry',
                    desc: 'Verify issued Certificates, Admit Cards, Hall Clearances, Library Cards & Payment Receipts.',
                  },
                  {
                    route: '/governance/pust-act' as AppRoute,
                    title: 'Governance & Statutory Bodies',
                    desc: 'PUST Act (Act No. 43 of 2001), Regent Board, Academic Council, Finance Committee & Ordinance.',
                  },
                  {
                    route: '/administration' as AppRoute,
                    title: 'University Administration & Offices',
                    desc: 'Vice-Chancellor Office, Registrar, Treasurer, Proctor, Student Advisor, ICT Cell & APA.',
                  },
                  {
                    route: '/academics/departments' as AppRoute,
                    title: '5 Faculties & 21 Academic Departments',
                    desc: 'Programs, calendars, deans, chairmen, scholarships, forms & faculty research.',
                  },
                  {
                    route: '/admissions' as AppRoute,
                    title: 'Admissions 2026–2027 & Tracker',
                    desc: 'Undergraduate (GST), Graduate, Evening Programs, Inquiry Desk & Live Status Tracker.',
                  },
                ].map((item) => (
                  <Link
                    key={item.route}
                    href={item.route}
                    className="w-full text-left px-5 py-4 hover:bg-pust-50/40 transition-colors flex items-center justify-between gap-4 group cursor-pointer"
                  >
                    <div>
                      <h3 className="font-serif text-base font-medium text-slate-900 group-hover:text-pust-900 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-pust-800 shrink-0 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Recent Publications */}
      <section
        id="recent-publications"
        className="bg-white border-t border-b border-slate-200 py-14 lg:py-16 scroll-mt-28"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-pust-800">
                  Faculty Research Output
                </p>
                <h2 className="font-serif text-2xl sm:text-3xl font-medium text-slate-900 mt-1">
                  Recent Publications
                </h2>
              </div>
              <Link
                href="/academics/publications"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-pust-900 hover:underline whitespace-nowrap shrink-0"
              >
                All Publications
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter publications by department">
              {pubDeptFilters.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setPubDeptFilter(code)}
                  className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    pubDeptFilter === code
                      ? 'bg-pust-900 text-white'
                      : 'bg-[#F7F7F5] border border-slate-200 text-slate-700 hover:text-pust-900 hover:border-pust-700/50'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>

            <div className="divide-y divide-slate-200 border-y border-slate-200">
              {visiblePublications.length === 0 ? (
                <p className="py-6 text-sm text-slate-600">
                  No peer-reviewed publications found for the selected department.
                </p>
              ) : (
                visiblePublications.map((pub) => (
                  <article key={pub.id} className="py-4 space-y-1.5">
                    <p className="font-mono text-xs text-pust-800 tabular-nums">
                      {pub.departmentCode} · {pub.domain} · {pub.year}
                    </p>
                    <h3 className="font-serif text-lg font-medium text-slate-900 leading-snug">
                      {pub.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Authors: {pub.authors}
                    </p>
                  </article>
                ))
              )}
            </div>
          </div>

          {/* Official PUST Journals Sidebar */}
          <aside className="lg:col-span-5 rounded-2xl border border-slate-200 bg-[#FAF8F4] p-6 sm:p-7 space-y-5">
            <div className="flex items-end justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-pust-800">
                  University Periodicals
                </p>
                <h3 className="font-serif text-2xl font-medium text-slate-900 mt-1">
                  Official PUST Journals
                </h3>
              </div>
              <Link
                href="/academics/journals"
                className="text-xs font-semibold text-pust-900 hover:underline whitespace-nowrap shrink-0"
              >
                Journals →
              </Link>
            </div>

            <div className="divide-y divide-slate-200">
              {(profile?.journals ?? []).map((journal) => (
                <div key={journal.id} className="py-4 first:pt-1 last:pb-1 space-y-1.5">
                  <p className="font-mono text-xs text-slate-500 tabular-nums">{journal.issn}</p>
                  <h4 className="font-serif text-base font-medium text-slate-900">
                    {journal.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{journal.scope}</p>
                  <p className="text-xs font-semibold text-pust-800">{journal.currentIssue}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      {/* 5. News and Events */}
      <section
        id="news-events"
        className="bg-[#F7F7F5] py-14 lg:py-16 scroll-mt-28"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-5 border-b border-slate-200">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-pust-800">
                Campus Chronicles &amp; Seminars
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl font-medium text-slate-900 mt-1">
                News and Events
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {NEWS_EVENT_CATS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setEventCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    eventCategory === cat
                      ? 'bg-pust-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-pust-50 hover:text-pust-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
              <Link
                href="/gallery"
                className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-pust-900 hover:underline whitespace-nowrap shrink-0"
              >
                Full Archive
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {visibleEvents.slice(0, 4).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveMedia(item)}
                className="text-left rounded-2xl border border-slate-200 bg-white hover:border-pust-700/60 transition-colors group cursor-pointer flex flex-col overflow-hidden"
              >
                <div className="relative w-full overflow-hidden bg-slate-900 aspect-[4/3]">
                  <ResilientImage
                    src={item.mediaUrl}
                    alt={item.title}
                    containerClassName="w-full h-full"
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                  />
                  {item.mediaType === 'video' && (
                    <span className="absolute inset-0 flex items-center justify-center bg-slate-950/35 text-white">
                      <PlayCircle className="w-10 h-10" />
                    </span>
                  )}
                </div>
                <div className="p-4 space-y-1 flex-1">
                  <p className="font-mono text-[11px] text-pust-800 tabular-nums">
                    {item.category} · {item.mediaType.toUpperCase()} · {item.eventDate}
                  </p>
                  <h3 className="font-serif text-base font-medium text-slate-900 group-hover:text-pust-900">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2">{item.description}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Scheduled University Seminars & Milestones */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-6 py-4 bg-[#FAF8F4] border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-xs uppercase tracking-widest text-pust-800">
                Upcoming Seminars, Workshops &amp; Academic Milestones
              </p>
              <Link
                href="/academics/seminars"
                className="text-xs font-semibold text-pust-900 hover:underline whitespace-nowrap"
              >
                All Seminars &amp; Workshops →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-200">
              {UPCOMING_CAMPUS_EVENTS.map((ev) => (
                <div key={ev.title} className="p-5 space-y-1.5">
                  <p className="font-mono text-xs text-pust-800 tabular-nums">
                    {ev.date} · {ev.organizer}
                  </p>
                  <h3 className="font-serif text-base font-medium text-slate-900 leading-snug">
                    {ev.title}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Media Preview Modal */}
      {activeMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          onClick={() => setActiveMedia(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <p className="font-mono text-xs text-pust-800 tabular-nums">
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
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {activeMedia.mediaUrl.endsWith('.mp4') || activeMedia.mediaUrl.endsWith('.webm') ? (
                <video src={activeMedia.mediaUrl} controls className="w-full aspect-video rounded-xl bg-black" />
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
