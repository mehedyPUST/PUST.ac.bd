'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Compass, MapPin } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { resolveUniversityContent } from '../lib/cmsDefaults';
import type { CampusZoneType } from '../types/pust';
import { EditTriggerButton } from './EditTriggerButton';
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

  const filteredBuildings =
    selectedZone === 'All'
      ? campusBuildings
      : campusBuildings.filter((b) => b.zone === selectedZone);

  const activeBuilding =
    campusBuildings.find((b) => b.id === selectedBuildingId) ||
    filteredBuildings[0] ||
    campusBuildings[0];

  if (loadingData && !profile) {
    return (
      <section id="campus-map" className="bg-[#F7F7F5] border-t border-slate-200 py-14 lg:py-16">
        <PageHeaderAndSectionSkeleton />
      </section>
    );
  }

  if (!profile) {
    return (
      <section id="campus-map" className="bg-[#F7F7F5] border-t border-slate-200 py-14 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-red-800">
              {dataError || 'Campus map directory is unavailable.'}
            </p>
            <button
              type="button"
              onClick={() => retryLoad()}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-pust-900 text-white hover:bg-pust-950 cursor-pointer"
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
      <section id="campus-map" className="bg-[#F7F7F5] border-t border-slate-200 py-14 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 flex flex-wrap items-center justify-between gap-4">
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

  return (
    <section
      id="campus-map"
      aria-labelledby="campus-map-heading"
      className="editable-region bg-[#F7F7F5] border-t border-slate-200 py-14 lg:py-16 scroll-mt-36"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Header + Zone Filter */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 border-b border-slate-200 pb-5">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-pust-700">
              {campusMapMeta.eyebrow}
            </p>
            <h2
              id="campus-map-heading"
              className="font-serif text-2xl sm:text-3xl font-semibold text-slate-950 mt-1"
            >
              {campusMapMeta.title}
            </h2>
            <p className="text-sm text-slate-700 mt-1.5 max-w-2xl">{campusMapMeta.subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <EditTriggerButton
              target={{ kind: 'campus-building', buildingId: activeBuilding?.id }}
              label="Edit Map & Buildings"
              variant="compact"
            />
            <div
              role="group"
              aria-label="Filter campus buildings by precinct"
              className="flex overflow-x-auto no-scrollbar sm:flex-wrap gap-1.5 max-w-full pb-1 sm:pb-0"
            >
              {ZONES.map((zone) => {
                const active = selectedZone === zone;
                return (
                  <button
                    key={zone}
                    type="button"
                    onClick={() => handleZoneChange(zone)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-pust-900 text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-pust-50 hover:text-pust-900'
                    }`}
                  >
                    {zone === 'All' ? 'All Precincts' : zone}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 12-Column Interactive Blueprint + Selected Building Detail Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Interactive Architectural Blueprint */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="relative w-full aspect-[16/10] rounded-2xl bg-white border border-slate-200 overflow-hidden select-none shadow-xs">
              {/* Architectural Blueprint SVG Layer */}
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
                      stroke="#E7E5E4"
                      strokeWidth="0.75"
                    />
                  </pattern>
                </defs>

                {/* Base Drafting Paper */}
                <rect width="800" height="500" fill="#FAF7F0" />
                <rect width="800" height="500" fill="url(#campus-grid)" />

                {/* Landscaped Campus Grounds Boundary */}
                <rect
                  x="28"
                  y="24"
                  width="744"
                  height="408"
                  fill="#F1ECE1"
                  stroke="#B8B0A2"
                  strokeWidth="1.5"
                />

                {/* Central Green Quadrangle Lawn */}
                <rect
                  x="255"
                  y="148"
                  width="290"
                  height="155"
                  fill="#DCFCE7"
                  stroke="#4ADE80"
                  strokeWidth="1.2"
                />

                {/* Campus Lake / Reflecting Pond */}
                <path
                  d="M 430 100 C 460 88, 520 92, 535 112 C 548 128, 515 142, 470 138 C 430 135, 412 114, 430 100 Z"
                  fill="#BAE6FD"
                  stroke="#0284C7"
                  strokeWidth="1.4"
                />
                <text
                  x="480"
                  y="119"
                  textAnchor="middle"
                  className="fill-sky-900 font-mono text-[9.5px] font-semibold"
                >
                  Campus Lake
                </text>

                {/* Central Playground / Sports Field */}
                <rect
                  x="56"
                  y="286"
                  width="176"
                  height="112"
                  fill="#DCFCE7"
                  stroke="#22C55E"
                  strokeDasharray="4 3"
                  strokeWidth="1.2"
                />
                <text
                  x="144"
                  y="346"
                  textAnchor="middle"
                  className="fill-emerald-950/85 font-mono text-[10px] font-semibold"
                >
                  Central Playground
                </text>

                {/* Main Internal Campus Roads & Walkways */}
                <path
                  d="M 384 432 L 384 140 M 140 225 L 670 225 M 170 118 L 620 118 M 170 118 L 170 275 M 618 118 L 618 355"
                  fill="none"
                  stroke="#D6D3CD"
                  strokeWidth="8"
                  strokeLinecap="square"
                />
                <path
                  d="M 384 432 L 384 140 M 140 225 L 670 225 M 170 118 L 620 118 M 170 118 L 170 275 M 618 118 L 618 355"
                  fill="none"
                  stroke="#FAF8F4"
                  strokeWidth="4"
                  strokeLinecap="square"
                />

                {/* Architectural Building Footprints */}
                {/* Wazed Engineering Bhaban */}
                <rect
                  x="110"
                  y="68"
                  width="132"
                  height="74"
                  fill={activeBuilding.id === 'wazed-bhaban' ? '#6A0000' : '#E7E5E4'}
                  stroke="#78716C"
                  strokeWidth="1.2"
                />
                {/* Residential Halls Sector */}
                <g>
                  <rect
                    x="412"
                    y="42"
                    width="82"
                    height="36"
                    fill={activeBuilding.id === 'residential-halls' ? '#6A0000' : '#E7E5E4'}
                    stroke="#78716C"
                    strokeWidth="1.2"
                  />
                  <rect
                    x="510"
                    y="42"
                    width="96"
                    height="36"
                    fill={activeBuilding.id === 'residential-halls' ? '#6A0000' : '#E7E5E4'}
                    stroke="#78716C"
                    strokeWidth="1.2"
                  />
                </g>
                {/* Academic Building I */}
                <rect
                  x="128"
                  y="196"
                  width="116"
                  height="68"
                  fill={activeBuilding.id === 'academic-1' ? '#6A0000' : '#E7E5E4'}
                  stroke="#78716C"
                  strokeWidth="1.2"
                />
                {/* Central Library */}
                <rect
                  x="348"
                  y="168"
                  width="112"
                  height="64"
                  fill={activeBuilding.id === 'central-library' ? '#6A0000' : '#E7E5E4'}
                  stroke="#78716C"
                  strokeWidth="1.2"
                />
                {/* Central Auditorium & Plaza */}
                <rect
                  x="556"
                  y="186"
                  width="104"
                  height="66"
                  fill={activeBuilding.id === 'convocation-plaza' ? '#6A0000' : '#E7E5E4'}
                  stroke="#78716C"
                  strokeWidth="1.2"
                />
                {/* Administrative Building */}
                <rect
                  x="324"
                  y="302"
                  width="124"
                  height="68"
                  fill={activeBuilding.id === 'admin-bhaban' ? '#6A0000' : '#E7E5E4'}
                  stroke="#78716C"
                  strokeWidth="1.2"
                />
                {/* TSC & Medical Center */}
                <rect
                  x="560"
                  y="314"
                  width="112"
                  height="60"
                  fill={activeBuilding.id === 'medical-tsc' ? '#6A0000' : '#E7E5E4'}
                  stroke="#78716C"
                  strokeWidth="1.2"
                />

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
                <rect x="348" y="424" width="72" height="22" fill="#6A0000" />
                <text
                  x="384"
                  y="439"
                  textAnchor="middle"
                  className="fill-white font-mono text-[9px] font-semibold"
                >
                  MAIN GATE
                </text>
              </svg>

              {/* Top-Right Compass / Scale Overlay */}
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/95 border border-slate-200 absolute top-3 right-3 font-mono text-[10px] text-slate-600">
                <Compass className="w-3.5 h-3.5 text-pust-800" />
                <span>{campusMapMeta.coordinates}</span>
              </div>

              {/* Interactive Clickable Building Name Hotspots */}
              {campusBuildings.map((b) => {
                const isSelected = activeBuilding.id === b.id;
                const isInZone =
                  selectedZone === 'All' || b.zone === selectedZone;

                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBuildingId(b.id)}
                    aria-pressed={isSelected}
                    aria-label={b.name}
                    style={{
                      left: `${b.xPercent}%`,
                      top: `${b.yPercent}%`,
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium border shadow-sm transition-all whitespace-nowrap cursor-pointer inline-flex items-center gap-1 sm:gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pust-700 ${
                      isSelected
                        ? 'z-20 bg-pust-900 text-white border-pust-950 shadow-md scale-[1.03]'
                        : isInZone
                        ? 'z-10 bg-white/95 text-slate-900 border-slate-300 hover:border-pust-700 hover:text-pust-900'
                        : 'z-0 bg-white/60 text-slate-400 border-slate-200 hover:bg-white hover:text-slate-700'
                    }`}
                  >
                    <MapPin
                      className={`w-3 h-3 shrink-0 ${
                        isSelected ? 'text-pust-200' : 'text-pust-800'
                      }`}
                    />
                    <span className="font-mono sm:hidden">{b.code}</span>
                    <span className="hidden sm:inline">{b.shortName}</span>
                  </button>
                );
              })}
            </div>

              {/* Direct Clickable Building Directory Grid (Accessible on Desktop & Mobile) */}
            <div className="rounded-2xl card-gradient-parchment border border-slate-200 p-4 space-y-2.5 shadow-sm">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-700">
                Campus Buildings Index ({filteredBuildings.length}) — Click a building name
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredBuildings.map((b) => {
                  const isSelected = activeBuilding.id === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBuildingId(b.id)}
                      className={`px-3 py-2.5 rounded-lg text-left border transition-all duration-150 flex items-center justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-pust-800 text-white border-pust-950 shadow-sm'
                          : 'bg-white/90 text-slate-900 border-slate-200 hover:border-pust-700 hover:bg-white hover:-translate-y-0.5'
                      }`}
                    >
                      <span className="text-xs font-medium truncate">{b.name}</span>
                      <span
                        className={`font-mono text-[10px] shrink-0 tabular-nums ${
                          isSelected ? 'text-amber-200 font-semibold' : 'text-slate-600'
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

          {/* Right: Active Building Photo & Architectural Dossier */}
          <div className="lg:col-span-5 flex">
            <AnimatePresence mode="wait">
              <motion.article
                key={activeBuilding.id}
                initial={{ opacity: 0.4, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0.4 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="w-full rounded-2xl card-gradient-sage border border-sage-200 shadow-sm hover:shadow-md hover:border-sage-600/50 transition-all flex flex-col justify-between overflow-hidden"
              >
                <div>
                  <ResilientImage
                    src={activeBuilding.photo}
                    alt={activeBuilding.name}
                    caption={activeBuilding.caption}
                    containerClassName="p-4 pb-0"
                    className="w-full aspect-[4/3] object-cover"
                  />

                  <div className="p-6 space-y-4">
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-mono text-xs font-semibold text-sage-800 tabular-nums">
                          {activeBuilding.code} · {activeBuilding.zone} · {activeBuilding.gridRef}
                        </p>
                        <EditTriggerButton
                          target={{ kind: 'campus-building', buildingId: activeBuilding.id }}
                          label="Edit Building"
                          variant="compact"
                        />
                      </div>
                      <h3 className="font-serif text-2xl font-semibold text-slate-950 mt-1">
                        {activeBuilding.name}
                      </h3>
                    </div>

                    <p className="text-sm text-slate-800 leading-relaxed">{activeBuilding.summary}</p>

                    <dl className="divide-y divide-sage-200/80 border-y border-sage-200/80 text-xs sm:text-sm">
                      <div className="py-2.5 space-y-0.5">
                        <dt className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                          Offices &amp; Academic Units
                        </dt>
                        <dd className="text-slate-900 font-medium leading-relaxed">{activeBuilding.offices}</dd>
                      </div>
                      <div className="py-2.5 flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                        <dt className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-600 shrink-0">
                          Visiting Hours
                        </dt>
                        <dd className="font-mono text-xs font-medium text-slate-950 sm:text-right tabular-nums">
                          {activeBuilding.hours}
                        </dd>
                      </div>
                      <div className="py-2.5 space-y-0.5">
                        <dt className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                          Key Facilities
                        </dt>
                        <dd className="text-slate-800 leading-relaxed">{activeBuilding.facilities}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-1 flex items-center justify-between gap-4">
                  <Link
                    href={activeBuilding.route}
                    className="group inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold bg-pust-800 text-white hover:bg-pust-900 transition-colors whitespace-nowrap"
                  >
                    <span>{activeBuilding.routeLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                  <span className="font-mono text-[11px] font-medium text-slate-600 tabular-nums">
                    {campusBuildings.findIndex((b) => b.id === activeBuilding.id) + 1} /{' '}
                    {campusBuildings.length}
                  </span>
                </div>
              </motion.article>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
