'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  MapPin,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { resolveUniversityContent } from '../lib/cmsDefaults';
import { animateStagger } from '../lib/gsap';
import type { CampusZoneType } from '../types/pust';
import { EditTriggerButton } from './EditTriggerButton';
import { MotionReveal } from './MotionPrimitives';
import { usePust } from './PustContext';
import { PageHeaderAndSectionSkeleton } from './PustSkeletons';
import { ResilientImage } from './ResilientImage';

type CampusZone = 'All' | CampusZoneType;

const ZONES: CampusZone[] = [
  'All',
  'Administration',
  'Academic',
  'Library & Culture',
  'Residential & Wellness',
];

export function CampusMapSection() {
  const { profile, loadingData, dataError, retryLoad } = usePust();
  const { campusMapMeta, campusBuildings } = resolveUniversityContent(profile);
  const [selectedZone, setSelectedZone] = useState<CampusZone>('All');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const mapSectionRef = useRef<HTMLElement>(null);
  const buildingIndexRef = useRef<HTMLDivElement>(null);
  const prevZoneRef = useRef(selectedZone);

  const filteredBuildings =
    selectedZone === 'All'
      ? campusBuildings
      : campusBuildings.filter((b) => b.zone === selectedZone);

  const activeBuilding =
    campusBuildings.find((b) => b.id === selectedBuildingId) ||
    filteredBuildings[0] ||
    campusBuildings[0];

  useEffect(() => {
    if (prevZoneRef.current === selectedZone) return;
    prevZoneRef.current = selectedZone;
    return animateStagger(buildingIndexRef.current, '[data-gsap-building-btn]', {
      y: 6,
      duration: 0.25,
      stagger: 0.03,
    });
  }, [selectedZone]);

  if (loadingData && !profile) {
    return (
      <section id="campus-map" className="bg-[#F8F7F4] border-t border-stone-200 py-14 lg:py-16">
        <PageHeaderAndSectionSkeleton />
      </section>
    );
  }

  if (!profile) {
    return (
      <section id="campus-map" className="bg-[#F8F7F4] border-t border-stone-200 py-14 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-red-800">
              {dataError || 'Campus map directory is unavailable.'}
            </p>
            <button
              type="button"
              onClick={() => retryLoad()}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-pust-700 text-white hover:bg-pust-800 cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!activeBuilding) {
    return (
      <section id="campus-map" className="bg-[#F8F7F4] border-t border-stone-200 py-14 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-stone-200 bg-white p-8 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="font-mono text-xs uppercase tracking-widest text-pust-800">
                {campusMapMeta.eyebrow}
              </p>
              <h2 className="font-serif text-2xl font-medium text-slate-900">
                {campusMapMeta.title}
              </h2>
              <p className="text-sm text-slate-600">
                No campus buildings have been added to the interactive map yet.
              </p>
            </div>
            <EditTriggerButton
              target={{ kind: 'campus-building' }}
              label="Add Campus Building"
              icon="add"
              variant="compact"
            />
          </div>
        </div>
      </section>
    );
  }

  function handleZoneChange(zone: CampusZone) {
    setSelectedZone(zone);
    const matching =
      zone === 'All' ? campusBuildings : campusBuildings.filter((b) => b.zone === zone);
    if (matching.length > 0 && !matching.some((b) => b.id === selectedBuildingId)) {
      setSelectedBuildingId(matching[0].id);
    }
  }

  const activeListIndex = filteredBuildings.findIndex((b) => b.id === activeBuilding.id);
  const currentListPos = activeListIndex >= 0 ? activeListIndex : 0;

  function stepBuilding(delta: number) {
    const list = filteredBuildings.length > 0 ? filteredBuildings : campusBuildings;
    if (list.length === 0) return;
    const baseIdx = list.findIndex((b) => b.id === activeBuilding.id);
    const nextIdx = ((baseIdx >= 0 ? baseIdx : 0) + delta + list.length) % list.length;
    setSelectedBuildingId(list[nextIdx].id);
  }

  return (
    <section
      ref={mapSectionRef}
      id="campus-map"
      aria-labelledby="campus-map-heading"
      className="editable-region bg-[#F8F7F4] border-t border-stone-200 py-14 lg:py-16 scroll-mt-36"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <MotionReveal>
          <div className="space-y-6">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-stone-200">
              <div>
                <p className="font-mono text-xs font-semibold uppercase tracking-widest text-pust-700">
                  {campusMapMeta.eyebrow}
                </p>
                <h2
                  id="campus-map-heading"
                  className="font-serif text-fluid-h2 font-semibold text-slate-950 mt-1"
                >
                  {campusMapMeta.title}
                </h2>
                <p className="text-fluid-body text-slate-700 mt-1.5 max-w-3xl text-left">
                  {campusMapMeta.subtitle}
                </p>
              </div>

              <div className="shrink-0">
                <EditTriggerButton
                  target={{ kind: 'campus-building', buildingId: activeBuilding?.id }}
                  label="Edit Map & Buildings"
                  variant="compact"
                />
              </div>
            </div>

            {/* Precinct Filter Bar + Active Building Stepper */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div
                role="group"
                aria-label="Filter campus buildings by precinct"
                className="inline-flex overflow-x-auto no-scrollbar sm:flex-wrap gap-1 p-1 rounded-lg bg-white border border-stone-200 max-w-full"
              >
                {ZONES.map((zone) => {
                  const active = selectedZone === zone;
                  return (
                    <button
                      key={zone}
                      type="button"
                      onClick={() => handleZoneChange(zone)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[36px] ${
                        active
                          ? 'bg-pust-700 text-white'
                          : 'text-stone-600 hover:text-slate-950 hover:bg-[#FAF9F6]'
                      }`}
                    >
                      {zone === 'All' ? 'All Precincts' : zone}
                    </button>
                  );
                })}
              </div>

              <div className="inline-flex items-center self-start md:self-auto gap-1.5 rounded-lg bg-white border border-stone-200 p-1">
                <button
                  type="button"
                  onClick={() => stepBuilding(-1)}
                  aria-label="Previous campus building"
                  className="w-9 h-9 inline-flex items-center justify-center rounded-md text-slate-700 hover:bg-[#FAF9F6] hover:text-pust-900 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-mono text-xs font-semibold tabular-nums text-slate-700 whitespace-nowrap">
                  {String(currentListPos + 1).padStart(2, '0')} /{' '}
                  {String(filteredBuildings.length || campusBuildings.length).padStart(2, '0')}
                </span>
                <button
                  type="button"
                  onClick={() => stepBuilding(1)}
                  aria-label="Next campus building"
                  className="w-9 h-9 inline-flex items-center justify-center rounded-md text-slate-700 hover:bg-[#FAF9F6] hover:text-pust-900 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </MotionReveal>

        {/* Unified Architectural Folio: Interactive Blueprint (7) + Building Guide Monograph (5) */}
        <MotionReveal distance={32} delay={0.06}>
          <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* Left Column: Architectural Drafting Sheet & Building Directory */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-[#FAF7F0] border-b lg:border-b-0 lg:border-r border-stone-200">
            {/* Plan Header Strip */}
            <div className="px-5 sm:px-6 py-3 border-b border-stone-200 bg-[#FAF9F6] flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-700">
                Rajapur Campus Site Plan · 30 Acres
              </p>
              <div className="inline-flex items-center gap-1.5 font-mono text-[11px] text-slate-600 tabular-nums">
                <Compass className="w-3.5 h-3.5 text-pust-800 shrink-0" />
                <span>{campusMapMeta.coordinates}</span>
              </div>
            </div>

            {/* Interactive Architectural Blueprint Canvas */}
            <div className="relative w-full aspect-[16/10] bg-[#FAF7F0] select-none overflow-hidden">
              <svg
                viewBox="0 0 800 500"
                className="w-full h-full block"
                role="img"
                aria-label="Schematic architectural map of Pabna University of Science and Technology Rajapur Campus"
              >
                <defs>
                  <pattern
                    id="campus-grid"
                    width="40"
                    height="40"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 40 0 L 0 0 0 40"
                      fill="none"
                      stroke="#E5E0D5"
                      strokeWidth="0.75"
                    />
                  </pattern>
                  <pattern
                    id="quad-hatch"
                    width="8"
                    height="8"
                    patternTransform="rotate(45 0 0)"
                    patternUnits="userSpaceOnUse"
                  >
                    <line x1="0" y1="0" x2="0" y2="8" stroke="#6A9978" strokeOpacity="0.16" strokeWidth="1" />
                  </pattern>
                </defs>

                {/* Base Drafting Paper */}
                <rect width="800" height="500" fill="#FAF7F0" />
                <rect width="800" height="500" fill="url(#campus-grid)" />

                {/* Top & Left Architectural Survey Grid Labels (A-D / 1-4) */}
                <g className="fill-stone-400 font-mono text-[9px] font-semibold">
                  <text x="145" y="16" textAnchor="middle">GRID A</text>
                  <text x="305" y="16" textAnchor="middle">GRID B</text>
                  <text x="485" y="16" textAnchor="middle">GRID C</text>
                  <text x="665" y="16" textAnchor="middle">GRID D</text>
                  <text x="15" y="88" textAnchor="middle">1</text>
                  <text x="15" y="190" textAnchor="middle">2</text>
                  <text x="15" y="290" textAnchor="middle">3</text>
                  <text x="15" y="385" textAnchor="middle">4</text>
                </g>

                {/* Campus Boundary Perimeter */}
                <rect
                  x="28"
                  y="24"
                  width="744"
                  height="408"
                  rx="2"
                  fill="#F3EFE5"
                  stroke="#B8B0A2"
                  strokeWidth="1.5"
                />
                <rect
                  x="33"
                  y="29"
                  width="734"
                  height="398"
                  fill="none"
                  stroke="#D6CFC2"
                  strokeWidth="0.75"
                  strokeDasharray="4 4"
                />

                {/* Central Green Quadrangle Lawn */}
                <rect
                  x="278"
                  y="144"
                  width="254"
                  height="136"
                  fill="#DDF0E3"
                  stroke="#6A9978"
                  strokeWidth="1.2"
                />
                <rect x="278" y="144" width="254" height="136" fill="url(#quad-hatch)" />
                {/* Quadrangle Diagonal Pathways */}
                <line x1="278" y1="144" x2="532" y2="280" stroke="#FAF9F6" strokeWidth="2.5" strokeOpacity="0.8" />
                <line x1="532" y1="144" x2="278" y2="280" stroke="#FAF9F6" strokeWidth="2.5" strokeOpacity="0.8" />

                {/* Campus Reflecting Lake (East-North Sector, clear of Hall pins) */}
                <path
                  d="M 608 78 C 642 66, 704 72, 718 96 C 730 116, 696 132, 650 128 C 608 124, 592 94, 608 78 Z"
                  fill="#CFE3F0"
                  stroke="#4B7B99"
                  strokeWidth="1.3"
                />
                <path
                  d="M 624 96 Q 656 90 688 99"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeOpacity="0.6"
                  strokeWidth="1.2"
                />
                <text
                  x="658"
                  y="108"
                  textAnchor="middle"
                  className="fill-slate-800 font-mono text-[9.5px] font-semibold"
                >
                  Campus Lake
                </text>

                {/* Central Playground & Athletics Oval */}
                <rect
                  x="56"
                  y="296"
                  width="184"
                  height="112"
                  fill="#DDF0E3"
                  stroke="#6A9978"
                  strokeDasharray="4 3"
                  strokeWidth="1.2"
                />
                <rect
                  x="76"
                  y="314"
                  width="144"
                  height="76"
                  rx="38"
                  fill="none"
                  stroke="#5E8C6C"
                  strokeWidth="1.1"
                />
                <text
                  x="148"
                  y="356"
                  textAnchor="middle"
                  className="fill-emerald-950 font-mono text-[10px] font-semibold"
                >
                  Central Playground
                </text>

                {/* Subtle Landscaped Canopy Clusters */}
                <g fill="#B7D7C1" fillOpacity="0.7" stroke="#6A9978" strokeWidth="0.8">
                  <circle cx="72" cy="70" r="10" />
                  <circle cx="88" cy="82" r="8" />
                  <circle cx="72" cy="212" r="11" />
                  <circle cx="742" cy="210" r="10" />
                  <circle cx="734" cy="228" r="8" />
                  <circle cx="290" cy="402" r="9" />
                  <circle cx="486" cy="402" r="9" />
                </g>

                {/* Main Internal Campus Roads & Walkways */}
                <path
                  d="M 384 432 L 384 128 M 136 234 L 664 234 M 176 122 L 585 122 M 176 122 L 176 284 M 614 134 L 614 358 M 256 335 L 558 335"
                  fill="none"
                  stroke="#D6D1C7"
                  strokeWidth="10"
                  strokeLinecap="square"
                />
                <path
                  d="M 384 432 L 384 128 M 136 234 L 664 234 M 176 122 L 585 122 M 176 122 L 176 284 M 614 134 L 614 358 M 256 335 L 558 335"
                  fill="none"
                  stroke="#FCFBF8"
                  strokeWidth="5"
                  strokeLinecap="square"
                />

                {/* Architectural Building Footprints (Aligned to xPercent/yPercent centers) */}
                {/* 1. Wazed Engineering Bhaban (center ~176, 115) */}
                <g>
                  <rect x="111" y="77" width="136" height="78" fill="#D6D1C7" />
                  <rect
                    x="108"
                    y="74"
                    width="136"
                    height="78"
                    fill={activeBuilding.id === 'wazed-bhaban' ? '#720E13' : '#E9E6DF'}
                    stroke={activeBuilding.id === 'wazed-bhaban' ? '#48070B' : '#78716C'}
                    strokeWidth="1.4"
                  />
                  <rect
                    x="152"
                    y="96"
                    width="48"
                    height="32"
                    fill="#FAF7F0"
                    fillOpacity="0.45"
                    stroke="#78716C"
                    strokeOpacity="0.4"
                    strokeWidth="0.8"
                  />
                </g>

                {/* 2. Residential Halls Sector (center ~496, 90) */}
                <g>
                  <rect x="423" y="57" width="72" height="64" fill="#D6D1C7" />
                  <rect x="507" y="57" width="76" height="64" fill="#D6D1C7" />
                  <rect
                    x="420"
                    y="54"
                    width="72"
                    height="64"
                    fill={activeBuilding.id === 'residential-halls' ? '#720E13' : '#E9E6DF'}
                    stroke={activeBuilding.id === 'residential-halls' ? '#48070B' : '#78716C'}
                    strokeWidth="1.4"
                  />
                  <rect
                    x="504"
                    y="54"
                    width="76"
                    height="64"
                    fill={activeBuilding.id === 'residential-halls' ? '#720E13' : '#E9E6DF'}
                    stroke={activeBuilding.id === 'residential-halls' ? '#48070B' : '#78716C'}
                    strokeWidth="1.4"
                  />
                </g>

                {/* 3. Academic Building I (center ~200, 235) */}
                <g>
                  <rect x="139" y="201" width="128" height="72" fill="#D6D1C7" />
                  <rect
                    x="136"
                    y="198"
                    width="128"
                    height="72"
                    fill={activeBuilding.id === 'academic-1' ? '#720E13' : '#E9E6DF'}
                    stroke={activeBuilding.id === 'academic-1' ? '#48070B' : '#78716C'}
                    strokeWidth="1.4"
                  />
                </g>

                {/* 4. Central Library (center ~408, 205) */}
                <g>
                  <rect x="351" y="171" width="120" height="72" fill="#D6D1C7" />
                  <rect
                    x="348"
                    y="168"
                    width="120"
                    height="72"
                    fill={activeBuilding.id === 'central-library' ? '#720E13' : '#E9E6DF'}
                    stroke={activeBuilding.id === 'central-library' ? '#48070B' : '#78716C'}
                    strokeWidth="1.4"
                  />
                </g>

                {/* 5. Central Auditorium & Plaza (center ~608, 225) */}
                <g>
                  <rect x="555" y="191" width="112" height="72" fill="#D6D1C7" />
                  <rect
                    x="552"
                    y="188"
                    width="112"
                    height="72"
                    fill={activeBuilding.id === 'convocation-plaza' ? '#720E13' : '#E9E6DF'}
                    stroke={activeBuilding.id === 'convocation-plaza' ? '#48070B' : '#78716C'}
                    strokeWidth="1.4"
                  />
                </g>

                {/* 6. Administrative Building (center ~384, 335) */}
                <g>
                  <rect x="321" y="303" width="132" height="68" fill="#D6D1C7" />
                  <rect
                    x="318"
                    y="300"
                    width="132"
                    height="68"
                    fill={activeBuilding.id === 'admin-bhaban' ? '#720E13' : '#E9E6DF'}
                    stroke={activeBuilding.id === 'admin-bhaban' ? '#48070B' : '#78716C'}
                    strokeWidth="1.4"
                  />
                </g>

                {/* 7. TSC & Medical Center (center ~616, 345) */}
                <g>
                  <rect x="561" y="315" width="116" height="64" fill="#D6D1C7" />
                  <rect
                    x="558"
                    y="312"
                    width="116"
                    height="64"
                    fill={activeBuilding.id === 'medical-tsc' ? '#720E13' : '#E9E6DF'}
                    stroke={activeBuilding.id === 'medical-tsc' ? '#48070B' : '#78716C'}
                    strokeWidth="1.4"
                  />
                </g>

                {/* Southern Boundary: Dhaka–Pabna Highway + Main Gate */}
                <rect x="0" y="446" width="800" height="54" fill="#1E293B" />
                <line
                  x1="0"
                  y1="473"
                  x2="800"
                  y2="473"
                  stroke="#94A3B8"
                  strokeDasharray="14 10"
                  strokeWidth="1.5"
                />
                <text
                  x="48"
                  y="466"
                  className="fill-slate-300 font-mono text-[10px] tracking-wider"
                >
                  DHAKA–PABNA HIGHWAY (N6) · RAJAPUR
                </text>
                <rect x="344" y="422" width="80" height="24" rx="2" fill="#720E13" />
                <text
                  x="384"
                  y="438"
                  textAnchor="middle"
                  className="fill-white font-mono text-[9.5px] font-semibold tracking-wider"
                >
                  MAIN GATE
                </text>
              </svg>

              {/* Interactive Clickable Building Name Hotspots */}
              {campusBuildings.map((b) => {
                const isSelected = activeBuilding.id === b.id;
                const isInZone = selectedZone === 'All' || b.zone === selectedZone;

                return (
                  <button
                    key={b.id}
                    data-gsap-map-pin
                    type="button"
                    onClick={() => setSelectedBuildingId(b.id)}
                    aria-pressed={isSelected}
                    aria-label={b.name}
                    style={{
                      left: `${b.xPercent}%`,
                      top: `${b.yPercent}%`,
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold border transition-all whitespace-nowrap cursor-pointer inline-flex items-center gap-1 sm:gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pust-700 ${
                      isSelected
                        ? 'z-20 bg-pust-800 text-white border-pust-950 shadow-md scale-[1.04]'
                        : isInZone
                        ? 'z-10 bg-white/95 text-slate-900 border-stone-300 shadow-xs hover:border-pust-700 hover:text-pust-900'
                        : 'z-0 bg-white/65 text-slate-400 border-stone-200 hover:bg-white hover:text-slate-700'
                    }`}
                  >
                    <MapPin
                      className={`w-3 h-3 shrink-0 ${
                        isSelected ? 'text-gold-300' : 'text-pust-700'
                      }`}
                    />
                    <span className="font-mono sm:hidden">{b.code}</span>
                    <span className="hidden sm:inline">{b.shortName}</span>
                  </button>
                );
              })}
            </div>

            {/* Compact Building Selector Directory Strip */}
            <div className="border-t border-stone-200 bg-white p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-600">
                  Buildings Index ({filteredBuildings.length})
                </p>
                <span className="font-mono text-[11px] text-stone-500 tabular-nums">
                  {selectedZone === 'All' ? 'All Precincts' : selectedZone}
                </span>
              </div>

              <div
                ref={buildingIndexRef}
                className="grid grid-cols-1 sm:grid-cols-2 gap-2"
              >
                {filteredBuildings.map((b) => {
                  const isSelected = activeBuilding.id === b.id;
                  return (
                    <button
                      key={b.id}
                      data-gsap-building-btn
                      type="button"
                      onClick={() => setSelectedBuildingId(b.id)}
                      aria-pressed={isSelected}
                      className={`min-h-[42px] px-3.5 py-2 rounded-lg border text-left transition-colors duration-150 flex items-center justify-between gap-2.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pust-700 ${
                        isSelected
                          ? 'bg-pust-700 text-white border-pust-800'
                          : 'bg-[#FAF9F6] text-slate-900 border-stone-200 hover:border-pust-700/45 hover:bg-white'
                      }`}
                    >
                      <span className="text-xs font-semibold truncate">{b.shortName}</span>
                      <span
                        className={`font-mono text-[10px] shrink-0 tabular-nums ${
                          isSelected ? 'text-gold-300 font-semibold' : 'text-stone-500'
                        }`}
                      >
                        {b.code}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Active Building Photo & Architectural Dossier */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-white">
            <AnimatePresence mode="wait">
              <motion.article
                key={activeBuilding.id}
                initial={{ opacity: 0.4, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0.4 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="flex-1 flex flex-col justify-between"
              >
                <div>
                  <ResilientImage
                    src={activeBuilding.photo}
                    alt={activeBuilding.name}
                    caption={activeBuilding.caption}
                    containerClassName="p-5 sm:p-6 pb-0"
                    className="w-full aspect-[16/10] object-cover"
                  />

                  <div className="p-5 sm:p-6 space-y-4">
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-mono text-xs font-semibold text-pust-800 tabular-nums">
                          {activeBuilding.code} · {activeBuilding.zone} · {activeBuilding.gridRef}
                        </p>
                        <EditTriggerButton
                          target={{ kind: 'campus-building', buildingId: activeBuilding.id }}
                          label="Edit"
                          variant="compact"
                        />
                      </div>
                      <h3 className="font-serif text-fluid-h3 font-semibold text-slate-950 mt-1.5 leading-snug">
                        {activeBuilding.name}
                      </h3>
                    </div>

                    <p className="text-sm text-slate-700 leading-relaxed text-left">
                      {activeBuilding.summary}
                    </p>

                    <dl className="divide-y divide-stone-200 border-y border-stone-200 text-xs sm:text-sm">
                      <div className="py-3 space-y-1">
                        <dt className="font-mono text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                          Offices &amp; Academic Units
                        </dt>
                        <dd className="text-slate-900 font-medium leading-relaxed text-left">
                          {activeBuilding.offices}
                        </dd>
                      </div>
                      <div className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
                        <dt className="font-mono text-[11px] font-semibold uppercase tracking-wider text-stone-500 inline-flex items-center gap-1.5 shrink-0">
                          <Clock className="w-3.5 h-3.5 text-pust-700 shrink-0" />
                          <span>Visiting Hours</span>
                        </dt>
                        <dd className="font-mono text-xs font-semibold text-slate-950 sm:text-right tabular-nums">
                          {activeBuilding.hours}
                        </dd>
                      </div>
                      <div className="py-3 space-y-1">
                        <dt className="font-mono text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                          Key Facilities
                        </dt>
                        <dd className="text-slate-800 leading-relaxed text-left">
                          {activeBuilding.facilities}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div className="px-5 sm:px-6 py-4 border-t border-stone-200 bg-[#FAF9F6] flex items-center justify-between gap-4">
                  <Link
                    href={activeBuilding.route}
                    className="btn-primary-sheen group inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold text-white whitespace-nowrap shrink-0"
                  >
                    <span>{activeBuilding.routeLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                  <span className="font-mono text-[11px] font-semibold text-slate-600 tabular-nums whitespace-nowrap">
                    Building{' '}
                    {String(
                      campusBuildings.findIndex((b) => b.id === activeBuilding.id) + 1
                    ).padStart(2, '0')}{' '}
                    of {String(campusBuildings.length).padStart(2, '0')}
                  </span>
                </div>
              </motion.article>
            </AnimatePresence>
          </div>
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}
