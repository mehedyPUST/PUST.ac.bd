'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, Compass, MapPin } from 'lucide-react';
import type { AppRoute } from '../lib/routes';
import { ResilientImage } from './ResilientImage';

type CampusZone =
  | 'All'
  | 'Administration'
  | 'Academic'
  | 'Library & Culture'
  | 'Residential & Wellness';

interface CampusBuilding {
  id: string;
  code: string;
  name: string;
  shortName: string;
  zone: Exclude<CampusZone, 'All'>;
  gridRef: string;
  xPercent: number;
  yPercent: number;
  photo: string;
  caption: string;
  summary: string;
  offices: string;
  hours: string;
  facilities: string;
  route: AppRoute;
  routeLabel: string;
}

const BUILDINGS: CampusBuilding[] = [
  {
    id: 'admin-bhaban',
    code: 'A-01',
    name: 'Administrative Building',
    shortName: 'Admin Building',
    zone: 'Administration',
    gridRef: 'South-Central Axis · Grid C4',
    xPercent: 48,
    yPercent: 67,
    photo: '/src/assets/images/pust_admin_building_1795441924646.jpg',
    caption: 'Fig. M1 — Administrative Building housing VC, Registrar & Examination Offices.',
    summary:
      'Central governance hub of the Rajapur campus situated directly north of the Main Gate promenade. Houses executive offices, statutory committee rooms, and student certificate verification counters.',
    offices: 'VC Office, Pro-VC, Treasurer, Registrar, Controller of Examinations, ICT Cell',
    hours: 'Sun – Thu · 09:00 – 17:00',
    facilities: 'Regent Board Hall, Transcript Counter, Automated Fee Desk',
    route: '/administration/vc-office',
    routeLabel: 'Explore Administration',
  },
  {
    id: 'academic-1',
    code: 'AC-01',
    name: 'Academic Building I (Core Bhaban)',
    shortName: 'Academic Bldg I',
    zone: 'Academic',
    gridRef: 'Central Quad West · Grid B3',
    xPercent: 25,
    yPercent: 47,
    photo: '/src/assets/images/pust_campus_hero_1795431408503.jpg',
    caption: 'Fig. M2 — Main Academic Promenade and Academic Building I.',
    summary:
      'Founding multi-story academic complex supporting Faculty of Science, Faculty of Business Studies, and Humanities & Social Science classrooms, smart lecture theaters, and Dean offices.',
    offices: 'Mathematics, Physics, Chemistry, Statistics, Business Admin, Economics, English, Bangla',
    hours: 'Sun – Thu · 08:30 – 17:30',
    facilities: 'Multimedia Lecture Halls, Seminar Libraries, Faculty Lounge',
    route: '/academics/departments',
    routeLabel: 'View All 21 Departments',
  },
  {
    id: 'wazed-bhaban',
    code: 'AC-02',
    name: 'Dr. M. A. Wazed Miah Engineering Bhaban',
    shortName: 'Wazed Engineering Bhaban',
    zone: 'Academic',
    gridRef: 'West Research Wing · Grid A2',
    xPercent: 22,
    yPercent: 23,
    photo: '/src/assets/images/pust_engineering_lab_1795431408924.jpg',
    caption: 'Fig. M3 — Engineering & Applied Science Research Laboratories.',
    summary:
      'Dedicated engineering and technology complex equipped with high-performance computing clusters, VLSI & THz microwave testbeds, architecture design studios, and structural materials labs.',
    offices: 'CSE, EEE, ETE, ICE, Architecture, Civil Engineering, URP, IQAC & IIED Labs',
    hours: 'Sun – Thu · 08:30 – 18:00 (Labs by schedule)',
    facilities: '30+ Research Labs, High-Speed Campus Fiber Node, Robotics Studio',
    route: '/academics/faculty',
    routeLabel: 'Explore 5 Faculties',
  },
  {
    id: 'central-library',
    code: 'LB-01',
    name: 'Central Library & Information Center',
    shortName: 'Central Library',
    zone: 'Library & Culture',
    gridRef: 'Central Quad North · Grid C2',
    xPercent: 51,
    yPercent: 41,
    photo: '/src/assets/images/pust_central_library_1795431408614.jpg',
    caption: 'Fig. M4 — Central Library Reading Floor and Digital Archive.',
    summary:
      'Quiet climate-controlled academic archive featuring general reference floors, postgraduate thesis stacks, dedicated digital workstation bays, and institutional IEEE/SpringerLink access.',
    offices: 'Librarian Office, Circulation & Digital Card Desk, Acquisition & Archive',
    hours: 'Sun – Thu · 08:30 – 21:00',
    facilities: '45,000+ Volumes, Wi-Fi Reading Bays, Digital Library Card Portal',
    route: '/facilities/library',
    routeLabel: 'Library Services',
  },
  {
    id: 'convocation-plaza',
    code: 'CU-01',
    name: 'Central Auditorium & Independence Plaza',
    shortName: 'Auditorium & Plaza',
    zone: 'Library & Culture',
    gridRef: 'East Cultural Axis · Grid D3',
    xPercent: 76,
    yPercent: 45,
    photo: '/src/assets/images/pust_convocation_pavilion_1795438822077.jpg',
    caption: 'Fig. M5 — Convocation Grounds and Central Ceremonial Pavilion.',
    summary:
      'Ceremonial cultural precinct anchoring Shaheed Minar, Mukta Mancha, and the main auditorium grounds—designated venue for national academic symposia and the First Convocation (15 March 2027).',
    offices: 'Auditorium Management, Cultural Affairs & Convocation Secretariat',
    hours: 'Daily · 08:00 – 20:00 (Event schedules)',
    facilities: 'Main Assembly Grounds, Exhibition Lawn, Media Briefing Stage',
    route: '/gallery',
    routeLabel: 'Campus Events Gallery',
  },
  {
    id: 'residential-halls',
    code: 'RH-01',
    name: 'July 06 Hall & Residential Precinct',
    shortName: 'Residential Halls',
    zone: 'Residential & Wellness',
    gridRef: 'North Campus Sector · Grid D1',
    xPercent: 62,
    yPercent: 18,
    photo: '/src/assets/images/pust_campus_grounds_1795431408500.jpg',
    caption: 'Fig. M6 — Residential Halls Precinct and Landscaped Quadrangle.',
    summary:
      'Gated northern residential zone encompassing July 06 Hall, Male Halls 1–2, and Female Halls 1–2 with dining commons, reading rooms, indoor sports courts, and 24-hour security.',
    offices: 'Provost Offices (5 Halls), House Tutors, Hall Allotment & Clearance Desk',
    hours: '24/7 Residential Access · Office 09:00 – 17:00',
    facilities: 'Student Dormitories, Hall Dining, Reading Rooms, Online Dues Clearance',
    route: '/facilities/residence',
    routeLabel: 'Halls & Residence Details',
  },
  {
    id: 'medical-tsc',
    code: 'SW-01',
    name: 'TSC, Cafeteria & Medical Center',
    shortName: 'TSC & Medical Center',
    zone: 'Residential & Wellness',
    gridRef: 'East Lawn Sector · Grid D4',
    xPercent: 77,
    yPercent: 69,
    photo: '/src/assets/images/pust_medical_tsc_1795441926681.jpg',
    caption: 'Fig. M7 — Teacher-Student Center (TSC) & Campus Medical Pavilion.',
    summary:
      'Integrated student life and wellness pavilion connecting the Central Cafeteria, debating & robotics club rooms, primary outpatient clinic, pharmacy dispensary, and emergency ambulance bay.',
    offices: 'Chief Medical Officer, Student Advisor Office, Club Commons, Cafeteria Wing',
    hours: 'Medical: 08:00 – 20:00 (24/7 Ambulance) · TSC: 08:00 – 21:00',
    facilities: 'Outpatient Consultation, Student Lounge, Campus Dining & Bus Stand Link',
    route: '/facilities/medical',
    routeLabel: 'Medical & Student Care',
  },
];

const ZONES: CampusZone[] = [
  'All',
  'Administration',
  'Academic',
  'Library & Culture',
  'Residential & Wellness',
];

export function CampusMapSection() {
  const [selectedZone, setSelectedZone] = useState<CampusZone>('All');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(BUILDINGS[0].id);

  const filteredBuildings =
    selectedZone === 'All' ? BUILDINGS : BUILDINGS.filter((b) => b.zone === selectedZone);

  const activeBuilding =
    BUILDINGS.find((b) => b.id === selectedBuildingId) || filteredBuildings[0] || BUILDINGS[0];

  function handleZoneChange(zone: CampusZone) {
    setSelectedZone(zone);
    const matching = zone === 'All' ? BUILDINGS : BUILDINGS.filter((b) => b.zone === zone);
    if (matching.length > 0 && !matching.some((b) => b.id === selectedBuildingId)) {
      setSelectedBuildingId(matching[0].id);
    }
  }

  return (
    <section
      id="campus-map"
      aria-labelledby="campus-map-heading"
      className="bg-[#FAF8F4] border-t border-stone-200 py-14 lg:py-16"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Header + Zone Filter */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 border-b border-stone-200 pb-5">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-emerald-800">
              Rajapur 30-Acre Masterplan · Interactive Campus Directory
            </p>
            <h2
              id="campus-map-heading"
              className="font-serif text-2xl sm:text-3xl font-medium text-slate-900 mt-1"
            >
              Interactive Campus Map &amp; Building Guide
            </h2>
            <p className="text-sm text-slate-600 mt-1.5 max-w-2xl">
              Click any building name directly on the campus plan or directory bar below to inspect
              offices, visiting hours, and photography.
            </p>
          </div>

          <div
            role="group"
            aria-label="Filter campus buildings by precinct"
            className="flex flex-wrap gap-1.5"
          >
            {ZONES.map((zone) => {
              const active = selectedZone === zone;
              return (
                <button
                  key={zone}
                  type="button"
                  onClick={() => handleZoneChange(zone)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-emerald-800 text-white'
                      : 'bg-white border border-stone-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
                  }`}
                >
                  {zone === 'All' ? 'All Precincts' : zone}
                </button>
              );
            })}
          </div>
        </div>

        {/* 12-Column Interactive Blueprint + Selected Building Detail Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Interactive Architectural Blueprint */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="relative w-full aspect-[16/10] bg-white border border-stone-200 overflow-hidden select-none">
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
                <rect width="800" height="500" fill="#FCFBF8" />
                <rect width="800" height="500" fill="url(#campus-grid)" />

                {/* Landscaped Campus Grounds Boundary */}
                <rect
                  x="28"
                  y="24"
                  width="744"
                  height="408"
                  fill="#F4F1EA"
                  stroke="#D6D3CD"
                  strokeWidth="1.5"
                />

                {/* Central Green Quadrangle Lawn */}
                <rect
                  x="255"
                  y="148"
                  width="290"
                  height="155"
                  fill="#ECFDF5"
                  stroke="#A7F3D0"
                  strokeWidth="1"
                />

                {/* Campus Lake / Reflecting Pond */}
                <path
                  d="M 430 100 C 460 88, 520 92, 535 112 C 548 128, 515 142, 470 138 C 430 135, 412 114, 430 100 Z"
                  fill="#E0F2FE"
                  stroke="#BAE6FD"
                  strokeWidth="1.2"
                />
                <text
                  x="480"
                  y="119"
                  textAnchor="middle"
                  className="fill-sky-800/70 font-mono text-[9px]"
                >
                  Campus Lake
                </text>

                {/* Central Playground / Sports Field */}
                <rect
                  x="56"
                  y="286"
                  width="176"
                  height="112"
                  fill="#ECFDF5"
                  stroke="#A7F3D0"
                  strokeDasharray="4 3"
                  strokeWidth="1"
                />
                <text
                  x="144"
                  y="346"
                  textAnchor="middle"
                  className="fill-emerald-900/60 font-mono text-[10px]"
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
                  fill={activeBuilding.id === 'wazed-bhaban' ? '#065F46' : '#E7E5E4'}
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
                    fill={activeBuilding.id === 'residential-halls' ? '#065F46' : '#E7E5E4'}
                    stroke="#78716C"
                    strokeWidth="1.2"
                  />
                  <rect
                    x="510"
                    y="42"
                    width="96"
                    height="36"
                    fill={activeBuilding.id === 'residential-halls' ? '#065F46' : '#E7E5E4'}
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
                  fill={activeBuilding.id === 'academic-1' ? '#065F46' : '#E7E5E4'}
                  stroke="#78716C"
                  strokeWidth="1.2"
                />
                {/* Central Library */}
                <rect
                  x="348"
                  y="168"
                  width="112"
                  height="64"
                  fill={activeBuilding.id === 'central-library' ? '#065F46' : '#E7E5E4'}
                  stroke="#78716C"
                  strokeWidth="1.2"
                />
                {/* Central Auditorium & Plaza */}
                <rect
                  x="556"
                  y="186"
                  width="104"
                  height="66"
                  fill={activeBuilding.id === 'convocation-plaza' ? '#065F46' : '#E7E5E4'}
                  stroke="#78716C"
                  strokeWidth="1.2"
                />
                {/* Administrative Building */}
                <rect
                  x="324"
                  y="302"
                  width="124"
                  height="68"
                  fill={activeBuilding.id === 'admin-bhaban' ? '#065F46' : '#E7E5E4'}
                  stroke="#78716C"
                  strokeWidth="1.2"
                />
                {/* TSC & Medical Center */}
                <rect
                  x="560"
                  y="314"
                  width="112"
                  height="60"
                  fill={activeBuilding.id === 'medical-tsc' ? '#065F46' : '#E7E5E4'}
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
                <rect x="348" y="424" width="72" height="22" fill="#065F46" />
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
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 bg-white/95 border border-stone-200 absolute top-3 right-3 font-mono text-[10px] text-slate-600">
                <Compass className="w-3.5 h-3.5 text-emerald-800" />
                <span>N ↑ · 24.0130° N, 89.2797° E</span>
              </div>

              {/* Interactive Clickable Building Name Hotspots */}
              {BUILDINGS.map((b) => {
                const isSelected = activeBuilding.id === b.id;
                const isInZone =
                  selectedZone === 'All' || b.zone === selectedZone;

                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBuildingId(b.id)}
                    aria-pressed={isSelected}
                    style={{
                      left: `${b.xPercent}%`,
                      top: `${b.yPercent}%`,
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 px-2.5 py-1.5 text-[11px] sm:text-xs font-medium border shadow-sm transition-all whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${
                      isSelected
                        ? 'z-20 bg-emerald-800 text-white border-emerald-900 shadow-md scale-[1.03]'
                        : isInZone
                        ? 'z-10 bg-white/95 text-slate-900 border-stone-300 hover:border-emerald-700 hover:text-emerald-900'
                        : 'z-0 bg-white/60 text-slate-400 border-stone-200 hover:bg-white hover:text-slate-700'
                    }`}
                  >
                    <MapPin
                      className={`w-3 h-3 shrink-0 ${
                        isSelected ? 'text-emerald-200' : 'text-emerald-800'
                      }`}
                    />
                    <span>{b.shortName}</span>
                  </button>
                );
              })}
            </div>

            {/* Direct Clickable Building Directory Grid (Accessible on Desktop & Mobile) */}
            <div className="bg-white border border-stone-200 p-4 space-y-2.5">
              <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
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
                      className={`px-3 py-2.5 text-left border transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-800 text-white border-emerald-900'
                          : 'bg-[#FAF8F4] text-slate-800 border-stone-200 hover:border-emerald-700 hover:bg-emerald-50/40'
                      }`}
                    >
                      <span className="text-xs font-medium truncate">{b.name}</span>
                      <span
                        className={`font-mono text-[10px] shrink-0 tabular-nums ${
                          isSelected ? 'text-emerald-200' : 'text-slate-500'
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
          <motion.article
            key={activeBuilding.id}
            initial={{ opacity: 0.4, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="lg:col-span-5 bg-white border border-stone-200 shadow-sm flex flex-col justify-between animate__animated animate__fadeIn"
            style={{ animationDuration: '200ms' }}
          >
            <div>
              <div className="h-1 bg-gradient-to-r from-emerald-950 via-emerald-800 to-emerald-700" />
              <ResilientImage
                src={activeBuilding.photo}
                alt={activeBuilding.name}
                caption={activeBuilding.caption}
                className="w-full aspect-[4/3] object-cover"
              />

              <div className="p-6 space-y-4">
                <div>
                  <p className="font-mono text-xs text-emerald-800 tabular-nums">
                    {activeBuilding.code} · {activeBuilding.zone} · {activeBuilding.gridRef}
                  </p>
                  <h3 className="font-serif text-2xl font-medium text-slate-900 mt-1">
                    {activeBuilding.name}
                  </h3>
                </div>

                <p className="text-sm text-slate-700 leading-relaxed">{activeBuilding.summary}</p>

                <dl className="divide-y divide-stone-200 border-y border-stone-200 text-xs sm:text-sm">
                  <div className="py-2.5 space-y-0.5">
                    <dt className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
                      Offices &amp; Academic Units
                    </dt>
                    <dd className="text-slate-800 font-medium">{activeBuilding.offices}</dd>
                  </div>
                  <div className="py-2.5 flex justify-between gap-4">
                    <dt className="font-mono text-[11px] uppercase tracking-wider text-slate-500 shrink-0">
                      Visiting Hours
                    </dt>
                    <dd className="font-mono text-xs text-slate-900 text-right tabular-nums">
                      {activeBuilding.hours}
                    </dd>
                  </div>
                  <div className="py-2.5 space-y-0.5">
                    <dt className="font-mono text-[11px] uppercase tracking-wider text-slate-500">
                      Key Facilities
                    </dt>
                    <dd className="text-slate-700">{activeBuilding.facilities}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="px-6 pb-6 pt-1 flex items-center justify-between gap-4">
              <Link
                href={activeBuilding.route}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium bg-emerald-800 text-white hover:bg-emerald-900 transition-colors whitespace-nowrap"
              >
                {activeBuilding.routeLabel}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                {BUILDINGS.findIndex((b) => b.id === activeBuilding.id) + 1} / {BUILDINGS.length}
              </span>
            </div>
          </motion.article>
        </div>
      </div>
    </section>
  );
}
