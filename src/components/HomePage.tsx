'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
  Maximize2,
  PlayCircle,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { resolveUniversityContent } from '../lib/cmsDefaults';
import {
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
  parseYouTubeVideoId,
} from '../lib/media';
import type { AppRoute } from '../lib/routes';
import { CampusMapSection } from './CampusMapSection';
import { EditTriggerButton } from './EditTriggerButton';
import { MotionCard, MotionReveal } from './MotionPrimitives';
import {
  HeroSummarySkeleton,
  MediaGridSkeleton,
  NoticeListSkeleton,
} from './PustSkeletons';
import { ResilientImage } from './ResilientImage';
import type {
  AboutContentRecord,
  BannerSlideRecord,
  GalleryItemRecord,
  NoticeRecord,
  PublicationRecord,
  UniversityProfile,
  ViceChancellorRecord,
} from '../types/pust';

interface HomePageProps {
  bannerSlides?: BannerSlideRecord[];
  profile: UniversityProfile | null;
  aboutSections: AboutContentRecord[];
  vcProfiles: ViceChancellorRecord[];
  galleryItems: GalleryItemRecord[];
  publications: PublicationRecord[];
  notices: NoticeRecord[];
  loadingData?: boolean;
  dataError?: string | null;
  onRetry?: () => void;
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

function getEventGradientClass(category: GalleryItemRecord['category']) {
  if (category === 'Convocation') return 'card-gradient-gold hover:border-gold-600/40';
  if (category === 'Academic Event') return 'card-gradient-lapis hover:border-lapis-600/40';
  if (category === 'Festival') return 'card-gradient-crimson hover:border-pust-600/40';
  return 'card-gradient-sage hover:border-sage-600/40';
}

function getEventAccentClass(category: GalleryItemRecord['category']) {
  if (category === 'Convocation') return 'text-gold-700';
  if (category === 'Academic Event') return 'text-lapis-700';
  if (category === 'Festival') return 'text-pust-800';
  return 'text-sage-700';
}

export function HomePage({
  bannerSlides = [],
  profile,
  aboutSections,
  vcProfiles,
  galleryItems,
  publications,
  notices,
  loadingData = false,
  dataError = null,
  onRetry,
  onSelectNotice,
}: HomePageProps) {
  const resolved = useMemo(
    () => (profile ? resolveUniversityContent(profile) : null),
    [profile]
  );
  const institutionalLinksEyebrow = resolved?.institutionalLinksEyebrow ?? '';
  const institutionalLinksHeading = resolved?.institutionalLinksHeading ?? '';
  const institutionalLinks = resolved?.institutionalLinks ?? [];
  const upcomingSeminars = resolved?.upcomingSeminars ?? [];
  const [showPreviousVcs, setShowPreviousVcs] = useState(false);
  const [noticeCategory, setNoticeCategory] =
    useState<'All' | NoticeRecord['category']>('All');
  const [pubDeptFilter, setPubDeptFilter] = useState<string>('ALL');
  const [eventCategory, setEventCategory] =
    useState<'All' | GalleryItemRecord['category']>('All');
  const [activeMedia, setActiveMedia] = useState<GalleryItemRecord | null>(null);

  const slides = bannerSlides;

  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [bannerPaused, setBannerPaused] = useState(false);
  const [fullViewSlide, setFullViewSlide] = useState<BannerSlideRecord | null>(null);

  useEffect(() => {
    setActiveSlideIdx((prev) => (prev >= slides.length ? 0 : prev));
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1 || bannerPaused || fullViewSlide) return;
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    const timer = window.setInterval(() => {
      setActiveSlideIdx((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [slides.length, bannerPaused, fullViewSlide]);

  const currentSlide = slides[activeSlideIdx] || slides[0] || null;

  useEffect(() => {
    if (!activeMedia && !fullViewSlide) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (fullViewSlide) setFullViewSlide(null);
        if (activeMedia) setActiveMedia(null);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [activeMedia, fullViewSlide]);

  const filteredNotices =
    noticeCategory === 'All'
      ? notices
      : notices.filter((n) => n.category === noticeCategory);
  const featuredNotices = filteredNotices.slice(0, 4);
  const leadNotice = featuredNotices[0];
  const secondaryNotices = featuredNotices.slice(1);

  const currentVc = vcProfiles.find((v) => v.isCurrent) || vcProfiles[0] || null;
  const previousVcs = vcProfiles
    .filter((v) => !v.isCurrent)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const ourUniversity =
    aboutSections.find((s) => s.slug === 'our-university') || aboutSections[0] || null;
  const missionVision = aboutSections.find((s) => s.slug === 'mission-vision') || null;

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
      {dataError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-sm text-red-900">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
              <span>{dataError}</span>
            </div>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-red-300 text-red-800 hover:bg-red-100 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {/* 1. Banner */}
      <section
        id="banner"
        className="editable-region bg-gradient-to-b from-white via-[#FBF9F4] to-[#F3EDE2] border-b border-slate-200 scroll-mt-28"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 lg:pt-14 lg:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-between py-2">
              {loadingData && !profile ? (
                <HeroSummarySkeleton />
              ) : profile ? (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-pust-700">
                      {profile.heroEyebrow ||
                        (profile.convocationDate
                          ? `Rajapur, Pabna-6600 · First Convocation: ${profile.convocationDate}`
                          : 'Rajapur, Pabna-6600')}
                    </p>
                    <EditTriggerButton
                      target={{ kind: 'hero-profile' }}
                      label="Edit Hero & Stats"
                      variant="compact"
                    />
                  </div>
                  <h1 className="font-serif text-[clamp(2.25rem,4vw,3.5rem)] leading-[1.08] font-semibold tracking-tight text-slate-950">
                    {profile.heroTitle}
                  </h1>
                  {profile.heroSubtitle && (
                    <p className="text-base sm:text-[17.5px] leading-[1.68] text-slate-700 max-w-xl">
                      {profile.heroSubtitle}
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-2">
                  <h1 className="font-serif text-2xl font-semibold text-slate-950">
                    Pabna University of Science and Technology
                  </h1>
                  <p className="text-sm text-slate-700">
                    University profile summary is currently unavailable.
                  </p>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-slate-300/80 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3">
                <Link
                  href="/portal"
                  className="inline-flex items-center justify-center min-h-[44px] px-5 py-3 rounded-lg text-sm font-semibold bg-pust-800 text-white hover:bg-pust-900 hover:-translate-y-0.5 hover:shadow-md shadow-sm transition-all duration-200 whitespace-nowrap shrink-0"
                >
                  Open Digital Campus Portal
                </Link>
                <Link
                  href="/academics/departments"
                  className="inline-flex items-center justify-center min-h-[44px] px-5 py-3 rounded-lg text-sm font-semibold border border-slate-300 bg-white text-slate-900 hover:border-lapis-700 hover:text-lapis-800 hover:bg-lapis-50/40 hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap shrink-0"
                >
                  {profile?.departmentsCount
                    ? `Explore ${profile.departmentsCount} Departments`
                    : 'Explore Departments'}
                </Link>
                <Link
                  href="/verify"
                  className="group inline-flex items-center justify-center sm:justify-start min-h-[44px] gap-1.5 px-4 py-3 rounded-lg text-sm font-semibold text-pust-800 hover:bg-pust-100/70 transition-colors whitespace-nowrap shrink-0"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Verify Document
                  <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>
            </div>

            <div
              className="lg:col-span-6 flex flex-col"
              onMouseEnter={() => setBannerPaused(true)}
              onMouseLeave={() => setBannerPaused(false)}
              onFocusCapture={() => setBannerPaused(true)}
              onBlurCapture={() => setBannerPaused(false)}
            >
              <div className="group relative w-full h-full min-h-[300px] lg:min-h-[420px] overflow-hidden rounded-xl border border-slate-200 bg-slate-900 shadow-sm">
                {loadingData && !currentSlide ? (
                  <div className="w-full h-full min-h-[300px] lg:min-h-[420px] bg-slate-200 animate-pulse" />
                ) : currentSlide ? (
                  <>
                    <AnimatePresence initial={false}>
                      <motion.div
                        key={currentSlide.id}
                        initial={{ opacity: 0.4 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0.4 }}
                        transition={{ duration: 0.18 }}
                        className="absolute inset-0 w-full h-full"
                      >
                        <ResilientImage
                          src={currentSlide.imageUrl}
                          alt={
                            currentSlide.alt ||
                            currentSlide.caption ||
                            'Pabna University of Science and Technology campus banner'
                          }
                          containerClassName="w-full h-full"
                          frameClassName="bg-slate-900"
                          className="w-full h-full min-h-[300px] lg:min-h-[420px] object-cover"
                          priority
                        />
                      </motion.div>
                    </AnimatePresence>

                    <EditTriggerButton
                      target={{ kind: 'banner', slideId: currentSlide.id }}
                      label="Edit Banner"
                      variant="overlay"
                      className="absolute top-3 left-3 z-10"
                    />

                    <button
                      type="button"
                      onClick={() => setFullViewSlide(currentSlide)}
                      aria-label={`View full image: ${currentSlide.caption}`}
                      className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950/80 text-white text-xs font-medium border border-white/20 shadow-md opacity-95 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 hover:bg-slate-950 transition-opacity duration-150 cursor-pointer whitespace-nowrap"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      View Full
                    </button>

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-transparent pt-14 pb-4 px-4 sm:px-5 text-white pointer-events-none">
                      <div className="flex items-end justify-between gap-4">
                        <p className="text-xs sm:text-sm font-serif italic text-white leading-snug line-clamp-2 drop-shadow-xs">
                          {currentSlide.caption}
                        </p>
                        {slides.length > 1 && (
                          <span className="font-mono text-[11px] font-semibold tabular-nums text-amber-200 shrink-0">
                            {String(activeSlideIdx + 1).padStart(2, '0')} /{' '}
                            {String(slides.length).padStart(2, '0')}
                          </span>
                        )}
                      </div>
                    </div>

                    {slides.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveSlideIdx((prev) => (prev - 1 + slides.length) % slides.length)
                          }
                          aria-label="Previous banner slide"
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 inline-flex items-center justify-center rounded-full bg-slate-950/60 text-white hover:bg-slate-950/85 transition-colors cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveSlideIdx((prev) => (prev + 1) % slides.length)}
                          aria-label="Next banner slide"
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 inline-flex items-center justify-center rounded-full bg-slate-950/60 text-white hover:bg-slate-950/85 transition-colors cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="relative w-full h-full min-h-[300px] lg:min-h-[420px]">
                    <ResilientImage
                      src=""
                      alt="No banner slides published"
                      containerClassName="w-full h-full"
                      className="w-full h-full"
                    />
                    <EditTriggerButton
                      target={{ kind: 'banner' }}
                      label="Add Banner Slide"
                      icon="add"
                      variant="overlay"
                      className="absolute top-3 left-3 z-10"
                    />
                  </div>
                )}
              </div>

              {slides.length > 1 && (
                <div
                  className="mt-1.5 flex items-center justify-between gap-3"
                  aria-label="Banner slide controls"
                >
                  <div className="flex items-center gap-0.5">
                    {slides.map((s, idx) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setActiveSlideIdx(idx)}
                        aria-label={`View slide ${idx + 1}: ${s.caption}`}
                        aria-current={idx === activeSlideIdx ? 'true' : undefined}
                        className="py-2.5 px-1 inline-flex items-center justify-center cursor-pointer group"
                      >
                        <span
                          className={`block h-1.5 rounded-full transition-all ${
                            idx === activeSlideIdx
                              ? 'w-7 bg-pust-800'
                              : 'w-2.5 bg-slate-400 group-hover:bg-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="font-mono text-[11px] font-medium text-slate-600 truncate">
                    {bannerPaused ? 'Paused' : 'Auto-sliding'} · {slides.length} Campus Photos
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Operational Utility Ribbon */}
          {profile && (
            <dl className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 rounded-2xl border border-slate-300/80 bg-white shadow-sm overflow-hidden">
              <div className="card-gradient-crimson px-5 py-4 border-b lg:border-b-0 sm:border-r border-slate-200 transition-colors">
                <dt className="text-xs uppercase tracking-wider text-pust-700 font-semibold">
                  Established
                </dt>
                <dd className="font-mono tabular-nums text-[15px] font-semibold text-slate-950 mt-1">
                  {profile.establishedYear} · Act No. 43 of 2001
                </dd>
              </div>
              <div className="card-gradient-lapis px-5 py-4 border-b lg:border-b-0 lg:border-r border-slate-200 transition-colors">
                <dt className="text-xs uppercase tracking-wider text-lapis-700 font-semibold">
                  Academic Scope
                </dt>
                <dd className="font-mono tabular-nums text-[15px] font-semibold text-slate-950 mt-1">
                  {profile.facultiesCount} Faculties · {profile.departmentsCount} Departments
                </dd>
              </div>
              <div className="card-gradient-gold px-5 py-4 border-b sm:border-b-0 sm:border-r border-slate-200 transition-colors">
                <dt className="text-xs uppercase tracking-wider text-gold-700 font-semibold">
                  Community
                </dt>
                <dd className="font-mono tabular-nums text-[15px] font-semibold text-slate-950 mt-1">
                  {profile.facultyMembersCount} Faculty · ~{profile.studentsCount.toLocaleString('en-US')} Students
                </dd>
              </div>
              <div className="bg-gradient-to-br from-pust-900 to-pust-950 hover:from-pust-800 hover:to-pust-950 text-white transition-colors group">
                <Link href="/verify" className="block h-full px-5 py-4">
                  <dt className="text-xs uppercase tracking-wider font-semibold text-amber-300 flex items-center justify-between">
                    <span>Public Registry</span>
                    <FileCheck2 className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                  </dt>
                  <dd className="font-mono tabular-nums text-sm font-semibold text-white mt-1 flex items-center gap-1">
                    <span>Verify Certificates &amp; Receipts</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                  </dd>
                </Link>
              </div>
            </dl>
          )}
        </div>
      </section>

      {/* 2. Vice-Chancellor's Welcome Message & History */}
      <section
        id="vc-message"
        className="bg-white border-b border-slate-200 py-14 lg:py-16 scroll-mt-28"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Unified Card: VC Portrait, Credentials & Welcome Message */}
          {loadingData && vcProfiles.length === 0 ? (
            <HeroSummarySkeleton />
          ) : currentVc ? (
            <MotionReveal>
              <article className="editable-region rounded-2xl card-gradient-parchment border border-amber-900/15 overflow-hidden shadow-sm hover:border-pust-600/40 hover:shadow-md transition-all duration-200">
                <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
                  {/* Portrait & Office Info (Left Column inside the Card) */}
                  <div className="lg:col-span-4 bg-[#EFE8DA]/80 border-b lg:border-b-0 lg:border-r border-slate-200 p-6 sm:p-8 flex flex-col justify-between gap-6">
                    <div className="space-y-5">
                      <div className="max-w-[240px] mx-auto lg:max-w-none">
                        <ResilientImage
                          src={currentVc.photoUrl || ''}
                          alt={currentVc.name}
                          className="w-full aspect-[3/4] object-cover object-top"
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-pust-700">
                          Honorable Vice-Chancellor
                        </p>
                        <h2 className="font-serif text-xl sm:text-2xl font-semibold text-slate-950 leading-snug">
                          {currentVc.name}
                        </h2>
                        <p className="font-mono text-xs font-medium text-slate-700 tabular-nums">
                          {currentVc.tenure}
                        </p>
                        <div className="font-mono text-xs text-slate-700 tabular-nums pt-2 border-t border-slate-300/80 space-y-1">
                          {currentVc.email && (
                            <a
                              href={`mailto:${currentVc.email}`}
                              className="block font-semibold text-pust-800 hover:underline break-all"
                            >
                              {currentVc.email}
                            </a>
                          )}
                          {currentVc.phone && (
                            <a
                              href={`tel:${currentVc.phone.replace(/\s+/g, '')}`}
                              className="block hover:text-slate-950"
                            >
                              {currentVc.phone}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-300/80 flex items-center justify-between gap-3">
                      <Link
                        href="/administration/vc-office"
                        className="text-xs font-semibold text-pust-800 hover:underline whitespace-nowrap"
                      >
                        Vice-Chancellor Office →
                      </Link>
                    </div>
                  </div>

                  {/* Welcome Message (Right Column inside the Card) */}
                  <div className="lg:col-span-8 p-6 sm:p-8 lg:p-10 space-y-6 flex flex-col justify-between">
                    <div className="space-y-6">
                      <header className="space-y-2 border-b border-slate-200 pb-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-pust-700">
                            Welcome Message from the Vice-Chancellor · {currentVc.tenure}
                          </p>
                          <EditTriggerButton
                            target={{ kind: 'vc' }}
                            label="Edit VC Profile & Message"
                            variant="compact"
                          />
                        </div>
                        <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-950">
                          {currentVc.name}
                        </h3>
                        <p className="text-sm font-medium text-slate-700">
                          Honorable Vice-Chancellor, Pabna University of Science and Technology
                        </p>
                      </header>

                      {vcBodyParagraphs.length > 0 ? (
                        <div className="space-y-4 flow-root prose-justify max-w-[66ch] text-[15.5px] sm:text-[16.5px] text-slate-800 leading-[1.78]">
                          {vcBodyParagraphs.map((paragraph, idx) => (
                            <p
                              key={idx}
                              className={
                                idx === 0
                                  ? 'first-letter:font-serif first-letter:text-5xl first-letter:font-semibold first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:leading-[0.84] first-letter:text-pust-800'
                                  : ''
                              }
                            >
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-700">
                          No welcome message published for this profile yet.
                        </p>
                      )}
                    </div>

                    {vcClosingLine && (
                      <div className="pt-4 border-t border-slate-200 space-y-1.5">
                        <p className="font-serif italic text-lg font-medium text-slate-950">{vcClosingLine}</p>
                        <p className="text-sm font-semibold text-slate-800">
                          {currentVc.name} · Vice-Chancellor
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            </MotionReveal>
          ) : (
            <div className="editable-region rounded-2xl border border-slate-200 bg-[#FAF8F4] p-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-pust-800">
                  Office of the Vice-Chancellor
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  Vice-Chancellor profile is not currently published.
                </p>
              </div>
              <EditTriggerButton
                target={{ kind: 'vc' }}
                label="Add VC Profile"
                icon="add"
                variant="compact"
              />
            </div>
          )}

          {/* Vice-Chancellor History (Directly below the VC Picture & Message Card) */}
          <div className="editable-region rounded-2xl border border-slate-200 card-gradient-crimson overflow-hidden shadow-xs">
            <div className="px-6 py-4 bg-white/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-pust-800">
                  Institutional Leadership Archive
                  {profile?.establishedYear ? ` · ${profile.establishedYear} – Present` : ''}
                </p>
                <h3 className="font-serif text-xl font-medium text-slate-900 mt-0.5">
                  Vice-Chancellor History ({previousVcs.length} Former Vice-Chancellors)
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <EditTriggerButton
                  target={{ kind: 'vc', vcId: 'new-former' }}
                  label="Add Former VC"
                  icon="add"
                  variant="compact"
                />
                <button
                  type="button"
                  onClick={() => setShowPreviousVcs((prev) => !prev)}
                  aria-expanded={showPreviousVcs}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-300 bg-white text-slate-800 hover:border-pust-800 hover:text-pust-900 hover:bg-pust-50/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {showPreviousVcs ? 'Hide History' : 'Show History'}
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      showPreviousVcs ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {showPreviousVcs && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {previousVcs.length === 0 ? (
                    <p className="text-sm text-slate-600 col-span-full py-2">
                      No former Vice-Chancellor records archived yet.
                    </p>
                  ) : (
                    previousVcs.map((vc, idx) => (
                      <MotionCard
                        key={vc.id}
                        delay={idx * 0.03}
                        className="card-gradient-crimson rounded-xl border border-pust-200/70 hover:border-pust-600/50 hover:shadow-md p-5 space-y-2 flex flex-col justify-between transition-colors"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-mono text-[11px] font-semibold text-pust-800 tabular-nums">
                              {String(idx + 1).padStart(2, '0')} · {vc.tenure}
                            </span>
                            <EditTriggerButton
                              target={{ kind: 'vc', vcId: vc.id }}
                              label="Edit"
                              variant="compact"
                            />
                          </div>
                          <h4 className="font-serif text-base font-semibold text-slate-950 leading-snug">
                            {vc.name}
                          </h4>
                          <p className="text-[11px] font-mono font-medium uppercase tracking-wider text-slate-600">
                            {vc.title}
                          </p>
                          <p className="text-xs text-slate-700 leading-relaxed pt-0.5">{vc.message}</p>
                        </div>
                      </MotionCard>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* About PUST Brief & Sub-Topic Links */}
          <MotionReveal>
            <div className="rounded-2xl border border-gold-200 card-gradient-gold p-6 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start shadow-sm hover:border-gold-600/50 hover:shadow-md transition-all duration-200">
              <div className="lg:col-span-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs font-semibold uppercase tracking-widest text-gold-700">
                      About PUST
                    </p>
                    <h3 className="font-serif text-xl font-semibold text-slate-950 mt-1">
                      {ourUniversity?.title || 'About the University'}
                    </h3>
                  </div>
                  <EditTriggerButton
                    target={{ kind: 'about', slug: 'our-university' }}
                    label="Edit About"
                    variant="compact"
                  />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1 text-xs font-semibold">
                  <Link
                    href="/about/our-university"
                    className="text-pust-800 hover:underline whitespace-nowrap"
                  >
                    Our University →
                  </Link>
                  <Link
                    href="/about/mission-vision"
                    className="text-slate-800 hover:text-pust-800 transition-colors whitespace-nowrap"
                  >
                    Mission &amp; Vision
                  </Link>
                  <Link
                    href="/about/history"
                    className="text-slate-800 hover:text-pust-800 transition-colors whitespace-nowrap"
                  >
                    History
                  </Link>
                  <Link
                    href="/about/plans"
                    className="text-slate-800 hover:text-pust-800 transition-colors whitespace-nowrap"
                  >
                    Strategic Plans
                  </Link>
                </div>
              </div>
              <div className="lg:col-span-8 space-y-3">
                {ourUniversity ? (
                  <p className="text-[15px] leading-[1.7] text-slate-800 line-clamp-3">
                    {ourUniversity.body}
                  </p>
                ) : loadingData ? (
                  <HeroSummarySkeleton />
                ) : (
                  <p className="text-sm text-slate-700">
                    University overview content is not currently published.
                  </p>
                )}
                {missionVision && (
                  <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed line-clamp-2 pt-3 border-t border-gold-200/80">
                    {missionVision.body.replace(/^Our Mission\s*\n/i, '')}
                  </p>
                )}
              </div>
            </div>
          </MotionReveal>
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
              <div className="flex items-center gap-3 shrink-0">
                <EditTriggerButton
                  target={{ kind: 'notice', notice: null }}
                  label="Add Notice"
                  icon="add"
                  variant="compact"
                />
                <Link
                  href="/notices"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-pust-900 hover:underline whitespace-nowrap shrink-0"
                >
                  All Notices
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
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

            {loadingData && notices.length === 0 ? (
              <NoticeListSkeleton rows={4} />
            ) : (
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
                        <div
                          key={leadNotice.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => onSelectNotice(leadNotice)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onSelectNotice(leadNotice);
                            }
                          }}
                          className="w-full text-left p-6 card-gradient-crimson hover:brightness-[0.985] transition-all space-y-2 group cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-mono text-xs text-slate-600 tabular-nums">
                              {leadNotice.publishedAt} ·{' '}
                              <span className="font-semibold text-pust-800">{leadNotice.category}</span> ·{' '}
                              {leadNotice.referenceNo}
                              {leadNotice.visibility === 'registered' && ' · Campus Members Only'}
                            </p>
                            <EditTriggerButton
                              target={{ kind: 'notice', notice: leadNotice }}
                              label="Edit"
                              variant="compact"
                            />
                          </div>
                          <h3 className="font-serif text-xl font-semibold text-slate-950 group-hover:text-pust-800 transition-colors">
                            {leadNotice.title}
                          </h3>
                          <p className="prose-justify text-sm text-slate-700 leading-relaxed">
                            {leadNotice.summary}
                          </p>
                        </div>
                      )}

                      {secondaryNotices.map((notice) => (
                        <div
                          key={notice.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => onSelectNotice(notice)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onSelectNotice(notice);
                            }
                          }}
                          className="w-full text-left px-6 py-4 hover:bg-pust-50/70 transition-colors space-y-1.5 group cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-mono text-xs text-slate-600 tabular-nums">
                              {notice.publishedAt} ·{' '}
                              <span className="font-semibold text-pust-800">{notice.category}</span> ·{' '}
                              {notice.referenceNo}
                              {notice.visibility === 'registered' && ' · Campus Members Only'}
                            </p>
                            <EditTriggerButton
                              target={{ kind: 'notice', notice }}
                              label="Edit"
                              variant="compact"
                            />
                          </div>
                          <h3 className="font-serif text-lg font-semibold text-slate-950 group-hover:text-pust-800 transition-colors">
                            {notice.title}
                          </h3>
                          <p className="prose-justify text-sm text-slate-700 leading-relaxed line-clamp-2">
                            {notice.summary}
                          </p>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="editable-region lg:col-span-5 space-y-5">
            <div className="pb-4 border-b border-slate-200 flex items-end justify-between gap-3">
              <div>
                <p className="font-mono text-xs font-semibold uppercase tracking-widest text-lapis-700">
                  {institutionalLinksEyebrow || 'Digital Services & Directory'}
                </p>
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-950 mt-1">
                  {institutionalLinksHeading || 'Institutional Sections'}
                </h2>
              </div>
              <EditTriggerButton
                target={{ kind: 'institutional-links' }}
                label="Edit Links"
                variant="compact"
              />
            </div>

            {loadingData && !profile ? (
              <NoticeListSkeleton rows={4} />
            ) : institutionalLinks.length === 0 ? (
              <div className="p-6 rounded-2xl border border-slate-200 bg-white text-sm text-slate-700">
                No institutional directory links configured yet.
              </div>
            ) : (
              <div className="rounded-2xl border border-lapis-200 card-gradient-lapis shadow-sm overflow-hidden">
                <div className="divide-y divide-lapis-200/70">
                  {institutionalLinks.map((item) => (
                    <Link
                      key={item.id}
                      href={item.route}
                      className="w-full text-left px-5 py-4 hover:bg-white/85 transition-colors flex items-center justify-between gap-4 group cursor-pointer"
                    >
                      <div>
                        <h3 className="font-serif text-base font-semibold text-slate-950 group-hover:text-lapis-700 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-xs sm:text-[13px] text-slate-700 mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-lapis-700 group-hover:translate-x-1 shrink-0 transition-all duration-200" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
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
              <div className="flex items-center gap-3 shrink-0">
                <EditTriggerButton
                  target={{ kind: 'publication', publication: null }}
                  label="Add Publication"
                  icon="add"
                  variant="compact"
                />
                <Link
                  href="/academics/publications"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-pust-900 hover:underline whitespace-nowrap shrink-0"
                >
                  All Publications
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
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
                  <article
                    key={pub.id}
                    className="py-4 px-2 -mx-2 rounded-xl hover:bg-lapis-50/55 transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-mono text-xs font-semibold text-lapis-700 tabular-nums">
                        {pub.departmentCode} · {pub.domain} · {pub.year}
                      </p>
                      <EditTriggerButton
                        target={{ kind: 'publication', publication: pub }}
                        label="Edit"
                        variant="compact"
                      />
                    </div>
                    <h3 className="font-serif text-lg font-semibold text-slate-950 leading-snug">
                      {pub.title}
                    </h3>
                    <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed">
                      Authors: {pub.authors}
                    </p>
                  </article>
                ))
              )}
            </div>
          </div>

          {/* Official PUST Journals Sidebar */}
          <aside className="lg:col-span-5 rounded-2xl border border-gold-200 card-gradient-gold p-6 sm:p-7 space-y-5 shadow-sm hover:border-gold-600/50 transition-colors">
            <div className="flex items-end justify-between gap-4 border-b border-gold-200/80 pb-4">
              <div>
                <p className="font-mono text-xs font-semibold uppercase tracking-widest text-gold-700">
                  University Periodicals
                </p>
                <h3 className="font-serif text-2xl font-semibold text-slate-950 mt-1">
                  Official PUST Journals
                </h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <EditTriggerButton
                  target={{ kind: 'journals' }}
                  label="Edit Journals"
                  variant="compact"
                />
                <Link
                  href="/academics/journals"
                  className="text-xs font-semibold text-pust-800 hover:underline whitespace-nowrap shrink-0"
                >
                  Journals →
                </Link>
              </div>
            </div>

            <div className="divide-y divide-gold-200/70">
              {loadingData && !profile ? (
                <NoticeListSkeleton rows={3} />
              ) : (profile?.journals ?? []).length === 0 ? (
                <p className="py-4 text-sm text-slate-700">
                  No university journals are currently listed.
                </p>
              ) : (
                (profile?.journals ?? []).map((journal) => (
                  <div key={journal.id} className="py-4 first:pt-1 last:pb-1 space-y-1.5">
                    <p className="font-mono text-xs font-medium text-slate-600 tabular-nums">{journal.issn}</p>
                    <h4 className="font-serif text-base font-semibold text-slate-950">
                      {journal.title}
                    </h4>
                    <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed">{journal.scope}</p>
                    <p className="text-xs font-semibold text-gold-800">{journal.currentIssue}</p>
                  </div>
                ))
              )}
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
              <EditTriggerButton
                target={{ kind: 'gallery', item: null }}
                label="Add Event"
                icon="add"
                variant="compact"
              />
              <Link
                href="/gallery"
                className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-pust-900 hover:underline whitespace-nowrap shrink-0 group"
              >
                Full Archive
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {loadingData && galleryItems.length === 0 ? (
            <MediaGridSkeleton count={4} />
          ) : visibleEvents.length === 0 ? (
            <div className="p-8 rounded-2xl border border-slate-200 bg-white text-center space-y-3">
              <p className="text-sm text-slate-600">
                No news or campus events currently listed
                {eventCategory !== 'All' ? ` under ${eventCategory}` : ''}.
              </p>
              {eventCategory !== 'All' && (
                <button
                  type="button"
                  onClick={() => setEventCategory('All')}
                  className="px-4 py-2 rounded-lg text-xs font-medium border border-slate-300 bg-slate-50 text-pust-900 hover:border-pust-800 transition-colors cursor-pointer"
                >
                  Show All Categories
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {visibleEvents.slice(0, 4).map((item, idx) => {
                const ytId = item.mediaType === 'video' ? parseYouTubeVideoId(item.mediaUrl) : null;
                const thumbUrl = ytId ? getYouTubeThumbnailUrl(ytId) : item.mediaUrl;
                return (
                  <MotionCard
                    key={item.id}
                    delay={idx * 0.04}
                    role="button"
                    tabIndex={0}
                    onClick={() => setActiveMedia(item)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveMedia(item);
                      }
                    }}
                    className={`text-left rounded-2xl border border-slate-200 ${getEventGradientClass(
                      item.category
                    )} shadow-xs hover:shadow-md transition-all group cursor-pointer flex flex-col overflow-hidden`}
                  >
                    <div className="relative w-full overflow-hidden bg-slate-900 aspect-[4/3]">
                      <ResilientImage
                        src={thumbUrl}
                        alt={item.title}
                        containerClassName="w-full h-full"
                        frameClassName="bg-slate-900"
                        className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300"
                      />
                      <EditTriggerButton
                        target={{ kind: 'gallery', item }}
                        label="Edit"
                        variant="overlay"
                        className="absolute top-2.5 right-2.5 z-10"
                      />
                      {item.mediaType === 'video' && (
                        <span className="absolute inset-0 flex items-center justify-center bg-slate-950/35 text-white pointer-events-none">
                          <PlayCircle className="w-10 h-10 transition-transform duration-200 group-hover:scale-110" />
                        </span>
                      )}
                    </div>
                    <div className="p-4 space-y-1.5 flex-1">
                      <p
                        className={`font-mono text-[11px] tabular-nums font-semibold ${getEventAccentClass(
                          item.category
                        )}`}
                      >
                        {item.category} · {ytId ? 'YOUTUBE' : item.mediaType.toUpperCase()} ·{' '}
                        {item.eventDate}
                        {item.visibility === 'registered' && (
                          <span className="text-amber-800 font-semibold"> · MEMBERS ONLY</span>
                        )}
                      </p>
                      <h3 className="font-serif text-base font-semibold text-slate-950 group-hover:text-pust-800 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  </MotionCard>
                );
              })}
            </div>
          )}

          {/* Scheduled University Seminars & Milestones */}
          <div className="editable-region rounded-2xl border border-sage-200 card-gradient-sage overflow-hidden shadow-sm">
            <div className="px-6 py-4 bg-white/85 border-b border-sage-200/80 flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-sage-800">
                Upcoming Seminars, Workshops &amp; Academic Milestones
              </p>
              <div className="flex items-center gap-3">
                <EditTriggerButton
                  target={{ kind: 'seminars' }}
                  label="Edit Seminars"
                  variant="compact"
                />
                <Link
                  href="/academics/seminars"
                  className="text-xs font-semibold text-sage-800 hover:text-pust-900 hover:underline whitespace-nowrap"
                >
                  All Seminars &amp; Workshops →
                </Link>
              </div>
            </div>
            {upcomingSeminars.length === 0 ? (
              <p className="p-5 text-sm text-slate-700">
                No upcoming seminars or workshops are currently scheduled.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-sage-200/80">
                {upcomingSeminars.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-5 space-y-1.5 hover:bg-white/75 transition-colors"
                  >
                    <p className="font-mono text-xs font-semibold text-sage-700 tabular-nums">
                      {ev.date} · {ev.organizer}
                    </p>
                    <h3 className="font-serif text-base font-semibold text-slate-950 leading-snug">
                      {ev.title}
                    </h3>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 6. Interactive Campus Map & Building Directory */}
      <CampusMapSection />

      {/* Media Preview Modal */}
      {activeMedia && (() => {
        const activeYtId =
          activeMedia.mediaType === 'video' ? parseYouTubeVideoId(activeMedia.mediaUrl) : null;
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
            onClick={() => setActiveMedia(null)}
          >
            <div
              className="w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-200 bg-slate-50">
                <div>
                  <p className="font-mono text-xs text-pust-800 tabular-nums">
                    {activeMedia.category} ·{' '}
                    {activeYtId ? 'YOUTUBE' : activeMedia.mediaType.toUpperCase()} ·{' '}
                    {activeMedia.eventDate}
                    {activeMedia.visibility === 'registered' ? ' · REGISTERED MEMBERS ONLY' : ''}
                  </p>
                  <h3 className="font-serif text-xl font-medium text-slate-900 mt-0.5">
                    {activeMedia.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMedia(null)}
                  aria-label="Close media modal"
                  className="min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                {activeYtId ? (
                  <iframe
                    src={getYouTubeEmbedUrl(activeYtId)}
                    title={activeMedia.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full aspect-video rounded-xl border border-slate-200 bg-black"
                  />
                ) : activeMedia.mediaUrl.endsWith('.mp4') || activeMedia.mediaUrl.endsWith('.webm') ? (
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
        );
      })()}
      {/* Banner Full Image Lightbox Modal */}
      {fullViewSlide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Full banner image view"
          onClick={() => setFullViewSlide(null)}
        >
          <div
            className="relative w-full max-w-5xl rounded-2xl bg-slate-950 border border-white/15 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setFullViewSlide(null)}
              aria-label="Close full image view"
              className="absolute top-3 right-3 z-20 min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-lg bg-slate-950/80 text-white border border-white/20 hover:bg-white hover:text-slate-900 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-center bg-black max-h-[80vh]">
              <ResilientImage
                src={fullViewSlide.imageUrl}
                alt={fullViewSlide.alt || fullViewSlide.caption}
                containerClassName="w-full flex items-center justify-center bg-black"
                frameClassName="bg-black"
                className="max-h-[80vh] w-auto max-w-full object-contain"
              />
            </div>

            <div className="px-5 py-3.5 bg-slate-950 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-white">
              <p className="text-xs sm:text-sm font-serif italic text-white/95 leading-snug">
                {fullViewSlide.caption}
              </p>
              <span className="font-mono text-[11px] text-white/60 shrink-0">
                Press ESC or × to close
              </span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
