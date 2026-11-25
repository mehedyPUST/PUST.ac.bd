import type {
  AboutExtrasConfig,
  AcademicExtrasConfig,
  AdminShowcaseConfig,
  AdmissionsConfig,
  CampusBuildingItem,
  CampusMapMeta,
  FacilityItemConfig,
  FooterConfig,
  GovernanceContent,
  InstitutionalLinkItem,
  OfficialFormItem,
  SeminarItem,
  UniversityProfile,
  VerifyPageConfig,
} from '../types/pust';

export const DEFAULT_NAVBAR_TAGLINE = 'Est. 2008 · Rajapur, Pabna';

export const DEFAULT_INSTITUTIONAL_LINKS_EYEBROW = 'Digital Services & Directory';
export const DEFAULT_INSTITUTIONAL_LINKS_HEADING = 'Institutional Sections';

export const DEFAULT_INSTITUTIONAL_LINKS: InstitutionalLinkItem[] = [
  {
    id: 'link-portal',
    route: '/portal',
    title: 'Digital Campus Portal & Workflows',
    desc: 'Online fee checkout, Hall seat allotment & clearance, Library QR cards, Admit cards & 4-office Certificates.',
  },
  {
    id: 'link-verify',
    route: '/verify',
    title: 'Public Document Verification Registry',
    desc: 'Verify issued Certificates, Admit Cards, Hall Clearances, Library Cards & Payment Receipts.',
  },
  {
    id: 'link-governance',
    route: '/governance/pust-act',
    title: 'Governance & Statutory Bodies',
    desc: 'PUST Act (Act No. 43 of 2001), Regent Board, Academic Council, Finance Committee & Ordinance.',
  },
  {
    id: 'link-admin',
    route: '/administration',
    title: 'University Administration & Offices',
    desc: 'Vice-Chancellor Office, Registrar, Treasurer, Proctor, Student Advisor, ICT Cell & APA.',
  },
  {
    id: 'link-depts',
    route: '/academics/departments',
    title: '5 Faculties & 21 Academic Departments',
    desc: 'Programs, calendars, deans, chairmen, scholarships, forms & faculty research.',
  },
  {
    id: 'link-admissions',
    route: '/admissions',
    title: 'Admissions 2026–2027 & Tracker',
    desc: 'Undergraduate (GST), Graduate, Evening Programs, Inquiry Desk & Live Status Tracker.',
  },
];

export const DEFAULT_UPCOMING_SEMINARS: SeminarItem[] = [
  {
    id: 'sem-1',
    date: '2026-12-03',
    organizer: 'IQAC & ICT Cell',
    title: 'Outcome-Based Education (OBE) & Digital Assessment Symposium',
  },
  {
    id: 'sem-2',
    date: '2026-12-18',
    organizer: 'Faculty of Engineering & Technology',
    title: '2nd Regional Workshop on Smart Grid, VLSI & River Basin Geotechnics',
  },
  {
    id: 'sem-3',
    date: '2027-01-14',
    organizer: 'Dept. of Pharmacy & Chemistry',
    title: 'Phytochemistry & Sustainable Nanomaterials Research Colloquium',
  },
  {
    id: 'sem-4',
    date: '2027-03-15',
    organizer: 'Office of the Vice-Chancellor',
    title: 'Historic First University Convocation at Rajapur Ceremonial Pavilion',
  },
];

export const DEFAULT_CAMPUS_MAP_META: CampusMapMeta = {
  eyebrow: 'Rajapur 30-Acre Masterplan · Interactive Campus Directory',
  title: 'Interactive Campus Map & Building Guide',
  subtitle:
    'Click any building name directly on the campus plan or directory bar below to inspect offices, visiting hours, and photography.',
  coordinates: 'N ↑ · 24.0130° N, 89.2797° E',
};

export const DEFAULT_CAMPUS_BUILDINGS: CampusBuildingItem[] = [
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
    offices:
      'VC Office, Pro-VC, Treasurer (+8802588844963), Registrar, Controller (+8802588844965), ICT Cell',
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
      'Founding multi-story academic complex supporting Faculty of Science (including Pharmacy), Faculty of Business Studies, Humanities & Social Science, and Geography & Environment.',
    offices:
      'Mathematics, Physics, Pharmacy, Chemistry, Statistics, BBA, THM, Economics, Bangla, English, SW, PA, History, GE',
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
    offices: 'CSE, EEE, EECE, ICE, CE, Architecture, URP, IQAC & RTTC Research Labs',
    hours: 'Sun – Thu · 08:30 – 18:00 (Labs by schedule)',
    facilities: '30+ Research Labs, High-Speed Campus Fiber Node, Robotics Studio',
    route: '/academics/faculty',
    routeLabel: 'Explore 5 Faculties',
  },
  {
    id: 'central-library',
    code: 'LB-01',
    name: 'Central Library & Information Center (CLIC)',
    shortName: 'Central Library',
    zone: 'Library & Culture',
    gridRef: 'Central Quad North · Grid C2',
    xPercent: 51,
    yPercent: 41,
    photo: '/src/assets/images/pust_central_library_1795431408614.jpg',
    caption: 'Fig. M4 — Central Library Reading Floor and Digital Archive.',
    summary:
      'Academic and research hub (clic@pust.ac.bd) managed by Additional Librarian Md. Hafizur Rahaman Mollah with faculty-wise monograph collections, thesis archives, and institutional IEEE/SpringerLink access.',
    offices: 'Librarian Office (clic@pust.ac.bd), Circulation & Digital Card Desk, Archive',
    hours: 'Sun – Thu · 08:30 – 21:00',
    facilities: 'Faculty Book Collections, E-Journal IP Bays, Digital Library Card Portal',
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
    name: 'Residential Halls Precinct (July 06, Swadhinota, Matribhasha & Ganatantra)',
    shortName: 'Residential Halls',
    zone: 'Residential & Wellness',
    gridRef: 'North Campus Sector · Grid D1',
    xPercent: 62,
    yPercent: 18,
    photo: '/src/assets/images/pust_campus_grounds_1795431408500.jpg',
    caption: 'Fig. M6 — Residential Halls Precinct and Landscaped Quadrangle.',
    summary:
      'Gated northern residential zone encompassing July 06 Hall (Male Hall-1), Swadhinota Hall (Male Hall-2), Matribhasha Hall (Female Hall-1), and Ganatantra Hall (Female Hall-2) with dining commons and reading rooms.',
    offices:
      'Provosts: Md. Al-Fahad Bhuiyan, Dr. Md. Kamruzzaman, Dr. Rebeka Sultana Rekha, Laila Arzumand Banu',
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
      'Integrated student life and wellness pavilion connecting the Student Advisor Office (Dr. Md. Rashedul Haque), Central Cafeteria, student club rooms, and the Medical Center (+8802588844975, medicalsection@pust.ac.bd).',
    offices:
      'Medical Center (Dr. Md. Rafiqul Islam & Dr. Nasrin Sultana), Student Advisor (director.sao@pust.ac.bd)',
    hours: 'Medical: Sun–Thu (24/7 Ambulance) · TSC: 08:00 – 21:00',
    facilities: 'Outpatient Clinic, Student Lounge, Campus Dining & Transport Pool (+8802588845650)',
    route: '/facilities/medical',
    routeLabel: 'Medical & Student Care',
  },
];

export const DEFAULT_GOVERNANCE_CONTENT: GovernanceContent = {
  officialActUrl: 'https://bdlaws.minlaw.gov.bd/act-details-872.html',
  actIntro:
    'Pabna University of Science and Technology operates as a public statutory university under the Pabna University of Science and Technology Act, 2001 (Act No. 43 of 2001), passed by the Parliament of Bangladesh on 15 July 2001 and brought into force by Government Gazette notification on 12 October 2008. Under Section 3 of the Act, the university is constituted as a body corporate comprising the Chancellor, Vice-Chancellor, Treasurer, Regent Board, and Academic Council.',
  actClauses: [
    {
      clause: 'Section 3 · Incorporation & Statutory Constitution',
      detail:
        'Establishes Pabna University of Science and Technology as a statutory body corporate with perpetual succession, common seal, and academic seat in Pabna.',
    },
    {
      clause: 'Officers of the University',
      detail:
        'Defines the statutory powers and duties of the Chancellor, Vice-Chancellor, Pro-Vice-Chancellor, Treasurer, Registrar, Deans, Chairmen, Proctor, Librarian, and Controller of Examinations.',
    },
    {
      clause: 'Authorities of the University',
      detail:
        'Constitutes the Regent Board, Academic Council, Finance Committee, Planning & Development Committee, Faculties, and Selection Boards with statutory quorum rules.',
    },
    {
      clause: 'Statutes, Ordinances & Regulations',
      detail:
        'Empowers the Regent Board and Academic Council to promulgate university statutes, semester academic ordinances, hall codes, and examination regulations.',
    },
  ],
  actCitations: [
    { label: 'Enabling Legislation', value: 'Act No. 43 of 2001' },
    { label: 'Date Passed', value: '15 July 2001' },
    { label: 'Gazette Effective Date', value: '12 October 2008' },
    { label: 'Chancellor', value: 'Hon’ble President of Bangladesh' },
    { label: 'Regulatory Liaison', value: 'UGC of Bangladesh' },
  ],
  regentBoardMembers: [
    {
      seat: 'Chairman (Ex-Officio)',
      designation: 'Vice-Chancellor, Pabna University of Science and Technology',
      term: 'Statutory',
    },
    {
      seat: 'Member (Ex-Officio)',
      designation: 'Pro-Vice-Chancellor, Pabna University of Science and Technology',
      term: 'Statutory',
    },
    {
      seat: 'Member (Ex-Officio)',
      designation: 'Treasurer, Pabna University of Science and Technology',
      term: 'Statutory',
    },
    {
      seat: 'Government Representatives',
      designation:
        'Senior Officials Nominated by the Ministry of Education & Ministry of Science and Technology',
      term: '3 Years',
    },
    {
      seat: 'UGC Representative',
      designation: 'Nominee of the University Grants Commission (UGC) of Bangladesh',
      term: '3 Years',
    },
    {
      seat: 'Deans & Professors',
      designation: 'Faculty Deans and Senior Professors Nominated Under the PUST Act',
      term: '2 Years',
    },
    {
      seat: 'Secretary (Ex-Officio)',
      designation: 'Registrar, Pabna University of Science and Technology',
      term: 'Statutory',
    },
  ],
  regentFunctions: [
    'Approves university statutes, administrative policies, and institutional budgets submitted by the Finance Committee.',
    'Ratifies decisions of the Academic Council regarding establishment of new faculties, departments, institutes, and research centers.',
    'Approves appointments of faculty members and Class-I administrative officers upon recommendation of statutory Selection Boards.',
    'Oversees university campus masterplans, residential halls, and Convocation resolutions.',
  ],
  academicCouncilIntro:
    'Chaired by the Vice-Chancellor with the Registrar acting as Secretary, the Academic Council comprises the Pro-Vice-Chancellor, all Deans of the 5 Faculties, Chairmen of the 21 academic departments, senior professors, and external academic experts. It maintains the academic integrity of all undergraduate, postgraduate, and doctoral programs.',
  academicCouncilCards: [
    {
      title: 'Curriculum & OBE Approval',
      detail:
        'Reviews and approves Outcome-Based Education (OBE) syllabi, credit structures, and course prerequisites recommended by Faculty Boards.',
    },
    {
      title: 'Examination & Result Ratification',
      detail:
        'Appoints examination committees, approves moderation norms, and ratifies semester examination results prior to publication.',
    },
    {
      title: 'Research & Doctoral Degrees',
      detail:
        'Establishes M.Phil. and Ph.D. supervision guidelines, thesis evaluation panels, and research fellowship standards.',
    },
    {
      title: 'Academic Calendar & Admission Policy',
      detail:
        'Determines GST undergraduate admission unit allocations, intake seats (920+), and annual academic schedules.',
    },
  ],
  academicCouncilStructure: [
    { label: 'Chairperson', value: 'Vice-Chancellor' },
    { label: 'Faculties Represented', value: '5 Faculties' },
    { label: 'Academic Departments', value: '21 Departments' },
    { label: 'Member-Secretary', value: 'Registrar' },
  ],
  financeCommitteeIntro:
    'Constituted under Section 24 of the PUST Act, the Finance Committee advises the Regent Board on all fiscal matters of the university—ensuring transparent allocation of UGC recurring grants, development project funds, residential hall revenues, and student welfare endowments.',
  financeCommitteeScopes: [
    {
      scope: 'Annual & Revised Budget Scrutiny',
      desc: 'Examines annual revenue and expenditure estimates prepared by the Treasurer and Director of Accounts prior to submission to the Regent Board and UGC.',
    },
    {
      scope: 'Digital Fee & Gateway Reconciliation',
      desc: 'Monitors semester examination fees, hall seat charges, library fines, and certificate fees collected through automated bank and mobile-banking gateways.',
    },
    {
      scope: 'Statutory Audit & APA Compliance',
      desc: 'Reviews external observations by the Education Audit Directorate and enforces Public Procurement Rules (PPR) across laboratory and campus works.',
    },
  ],
  financeCommitteeLeadership: [
    { label: 'Chair / Convener', value: 'Treasurer / Vice-Chancellor' },
    { label: 'Fiscal Cycle', value: 'July 01 – June 30' },
    { label: 'Accounts Administration', value: 'Office of the Treasurer' },
    { label: 'Procurement Framework', value: 'e-GP & PPR Rules' },
  ],
  ordinanceIntro:
    'All undergraduate and postgraduate degree programs at PUST follow the UGC-aligned bi-semester credit-hour system. Students must maintain minimum attendance, clear all Residential Hall dues prior to examination form fill-up, and earn passing grade points in all required courses.',
  ordinanceRules: [
    {
      label: 'Standard Undergraduate Duration',
      value: '4 Years · 8 Semesters (5 Yrs / 10 Sem for B.Arch.)',
    },
    {
      label: 'Minimum Attendance Requirement',
      value: '75% (Non-collegiate 60%–74%)',
    },
    {
      label: 'Minimum Passing SGPA / CGPA',
      value: '2.00 (Degree Conferral)',
    },
    {
      label: 'Exam Clearance Gate',
      value: 'Hall Dues Clearance Required Before Admit Card',
    },
  ],
  gradingScale: [
    { range: '80% and above', letter: 'A+', gp: '4.00', remarks: 'Outstanding' },
    { range: '75% to < 80%', letter: 'A', gp: '3.75', remarks: 'Excellent' },
    { range: '70% to < 75%', letter: 'A-', gp: '3.50', remarks: 'Very Good' },
    { range: '65% to < 70%', letter: 'B+', gp: '3.25', remarks: 'Good' },
    { range: '60% to < 65%', letter: 'B', gp: '3.00', remarks: 'Satisfactory' },
    { range: '55% to < 60%', letter: 'B-', gp: '2.75', remarks: 'Above Average' },
    { range: '50% to < 55%', letter: 'C+', gp: '2.50', remarks: 'Average' },
    { range: '45% to < 50%', letter: 'C', gp: '2.25', remarks: 'Below Average' },
    { range: '40% to < 45%', letter: 'D', gp: '2.00', remarks: 'Pass' },
    { range: 'Below 40%', letter: 'F', gp: '0.00', remarks: 'Fail' },
  ],
};

export const DEFAULT_ADMIN_SHOWCASE: AdminShowcaseConfig = {
  buildingImage: '/src/assets/images/pust_admin_building_1795441924646.jpg',
  buildingCaption: 'Fig. 1 — Administrative Building & Central Executive Complex, Rajapur Campus, Pabna.',
  charterTag: 'Act No. 43 of 2001',
  accountabilityCycle: 'APA FY 2026–2027 · UGC',
  apaFyLabel: 'FY 2026–2027 · University Grants Commission (UGC)',
  apaBenchmarks: [
    {
      code: '01. E-Governance & Service',
      title: '100% Digital Clearance',
      detail:
        '4-office certificate workflow, residential hall dues, and CLIC library card issuance tracked end-to-end with verifiable timestamps.',
    },
    {
      code: '02. Academic Quality (IQAC)',
      title: '21 OBE Curricula Active',
      detail:
        'Continuous self-assessment, outcome-based curriculum auditing, and faculty pedagogy workshops across all 5 faculties.',
    },
    {
      code: '03. National Integrity Strategy',
      title: 'Transparent Procurement',
      detail:
        'National e-GP compliance, quarterly Citizen’s Charter disclosures, and statutory audit committee reporting.',
    },
  ],
};

export const DEFAULT_ABOUT_EXTRAS: AboutExtrasConfig = {
  campusImage: '/src/assets/images/pust_campus_grounds_1795431408500.jpg',
  campusCaption: 'Rajapur Campus Quadrangle along the Dhaka–Pabna Highway.',
  milestones: [
    {
      year: '15 July 2001',
      title: 'University Act Enacted',
      detail:
        'Parliament passes Pabna University of Science and Technology Act, 2001 (Act No. 43 of 2001).',
    },
    {
      year: '5 June 2008',
      title: 'Curriculum Inaugurated',
      detail:
        'Academic program formally inaugurated alongside Government Gazette operationalization on 12 October 2008.',
    },
    {
      year: '2009',
      title: 'Inaugural 140 Students',
      detail:
        'First academic batch enrolled across CSE, EEE, Mathematics, and Business Administration.',
    },
    {
      year: '2026',
      title: '5 Faculties · 21 Departments',
      detail:
        'Nearly 5,000 scholars and 212 faculty members on the 30-acre Rajapur digital campus.',
    },
    {
      year: '15 Mar 2027',
      title: 'First Convocation',
      detail: 'Historic First Convocation scheduled on the Rajapur Ceremonial Pavilion.',
    },
  ],
};

export const DEFAULT_OFFICIAL_FORMS: OfficialFormItem[] = [
  {
    serial: 1,
    title: 'Institutional Email Opening Form (Only for Students)',
    category: 'Student & Academic',
    pdfUrl: 'https://pust.ac.bd/includes/images/forms/WOP_Form_for%20students%20August_2026_V5.pdf',
  },
  {
    serial: 2,
    title: 'Institutional Email Opening Form (Teachers & Officers)',
    category: 'Faculty, Officer & Leave',
    pdfUrl: 'https://pust.ac.bd/includes/images/forms/WOP_Form_for%20teacher_officers_Agust_2026.pdf',
  },
  {
    serial: 3,
    title: 'Personal Information Adding / Correction on Website Form (Teachers & Officers)',
    category: 'Faculty, Officer & Leave',
    pdfUrl: 'https://pust.ac.bd/includes/images/forms/Personal%20Information%20Adding%20Form_August2026.pdf',
  },
  {
    serial: 7,
    title: 'Student Clearance Form — Provisional / Original Certificate (শিক্ষার্থী ক্লিয়ারেন্স ফরম-সার্টিফিকেট)',
    category: 'Student & Academic',
    pdfUrl: 'https://pust.ac.bd/includes/images/forms/%E0%A6%B6%E0%A6%BF%E0%A6%95%E0%A7%8D%E0%A6%B7%E0%A6%BE%E0%A6%B0%E0%A7%8D%E0%A6%A5%E0%A7%80%20%E0%A6%95%E0%A7%8D%E0%A6%B2%E0%A6%BF%E0%A7%9F%E0%A6%BE%E0%A6%B0%E0%A7%87%E0%A6%A8%E0%A7%8D%E0%A6%B8%20%E0%A6%AB%E0%A6%B0%E0%A6%AE-%E0%A6%B8%E0%A6%BE%E0%A6%B0%E0%A7%8D%E0%A6%9F%E0%A6%BF%E0%A6%AB%E0%A6%BF%E0%A6%95%E0%A7%87%E0%A6%9F.pdf',
    docUrl: 'https://pust.ac.bd/includes/images/forms/%E0%A6%B6%E0%A6%BF%E0%A6%95%E0%A7%8D%E0%A6%B7%E0%A6%BE%E0%A6%B0%E0%A7%8D%E0%A6%A5%E0%A7%80%20%E0%A6%95%E0%A7%8D%E0%A6%B2%E0%A6%BF%E0%A7%9F%E0%A6%BE%E0%A6%B0%E0%A7%87%E0%A6%A8%E0%A7%8D%E0%A6%B8%20%E0%A6%AB%E0%A6%B0%E0%A6%AE-%E0%A6%B8%E0%A6%BE%E0%A6%B0%E0%A7%8D%E0%A6%9F%E0%A6%BF%E0%A6%AB%E0%A6%BF%E0%A6%95%E0%A7%87%E0%A6%9F.docx',
  },
  {
    serial: 8,
    title: 'Student Clearance Form — Admission Cancellation (ভর্তি বাতিল)',
    category: 'Student & Academic',
    pdfUrl: 'https://pust.ac.bd/includes/images/forms/%E0%A6%B6%E0%A6%BF%E0%A6%95%E0%A7%8D%E0%A6%B7%E0%A6%BE%E0%A6%B0%E0%A7%8D%E0%A6%A5%E0%A7%80%20%E0%A6%95%E0%A7%8D%E0%A6%B2%E0%A6%BF%E0%A7%9F%E0%A6%BE%E0%A6%B0%E0%A7%87%E0%A6%A8%E0%A7%8D%E0%A6%B8%20%E0%A6%AB%E0%A6%B0%E0%A6%AE-%E0%A6%AD%E0%A6%B0%E0%A7%8D%E0%A6%A4%E0%A6%BF%20%E0%A6%AC%E0%A6%BE%E0%A6%A4%E0%A6%BF%E0%A6%B2.pdf',
    docUrl: 'https://pust.ac.bd/includes/images/forms/%E0%A6%B6%E0%A6%BF%E0%A6%95%E0%A7%8D%E0%A6%B7%E0%A6%BE%E0%A6%B0%E0%A7%8D%E0%A6%A5%E0%A7%80%20%E0%A6%95%E0%A7%8D%E0%A6%B2%E0%A6%BF%E0%A7%9F%E0%A6%BE%E0%A6%B0%E0%A7%87%E0%A6%A8%E0%A7%8D%E0%A6%B8%20%E0%A6%AB%E0%A6%B0%E0%A6%AE-%E0%A6%AD%E0%A6%B0%E0%A7%8D%E0%A6%A4%E0%A6%BF%20%E0%A6%AC%E0%A6%BE%E0%A6%A4%E0%A6%BF%E0%A6%B2.docx',
  },
  {
    serial: 9,
    title: 'Student Clearance Form — Caution Money Refund (জামানত)',
    category: 'Student & Academic',
    pdfUrl: 'https://pust.ac.bd/includes/images/forms/%E0%A6%B6%E0%A6%BF%E0%A6%95%E0%A7%8D%E0%A6%B7%E0%A6%BE%E0%A6%B0%E0%A7%8D%E0%A6%A5%E0%A7%80%20%E0%A6%95%E0%A7%8D%E0%A6%B2%E0%A6%BF%E0%A7%9F%E0%A6%BE%E0%A6%B0%E0%A7%87%E0%A6%A8%E0%A7%8D%E0%A6%B8%20%E0%A6%AB%E0%A6%B0%E0%A6%AE-%E0%A6%9C%E0%A6%BE%E0%A6%AE%E0%A6%BE%E0%A6%A8%E0%A6%A4.pdf',
    docUrl: 'https://pust.ac.bd/includes/images/forms/%E0%A6%B6%E0%A6%BF%E0%A6%95%E0%A7%8D%E0%A6%B7%E0%A6%BE%E0%A6%B0%E0%A7%8D%E0%A6%A5%E0%A7%80%20%E0%A6%95%E0%A7%8D%E0%A6%B2%E0%A6%BF%E0%A7%9F%E0%A6%BE%E0%A6%B0%E0%A7%87%E0%A6%A8%E0%A7%8D%E0%A6%B8%20%E0%A6%AB%E0%A6%B0%E0%A6%AE-%E0%A6%9C%E0%A6%BE%E0%A6%AE%E0%A6%BE%E0%A6%A8%E0%A6%A4.docx',
  },
  {
    serial: 10,
    title: 'Migration / Medium of Instruction Certificate Application Form',
    category: 'Student & Academic',
    pdfUrl: 'https://pust.ac.bd/includes/images/forms/%E0%A6%AE%E0%A6%BE%E0%A6%87%E0%A6%97%E0%A7%8D%E0%A6%B0%E0%A7%87%E0%A6%B6%E0%A6%A8-%E0%A6%AE%E0%A6%BF%E0%A6%A1%E0%A6%BF%E0%A7%9F%E0%A6%BE%20%E0%A6%85%E0%A6%AB%20%E0%A6%87%E0%A6%A8%E0%A6%B8%E0%A7%8D%E0%A6%9F%E0%A7%8D%E0%A6%B0%E0%A6%BE%E0%A6%95%E0%A6%B6%E0%A6%A8%20%E0%A6%B8%E0%A6%BE%E0%A6%B0%E0%A7%8D%E0%A6%9F%E0%A6%BF%E0%A6%AB%E0%A6%BF%E0%A6%95%E0%A7%87%E0%A6%9F%E0%A7%87%E0%A6%B0%20%E0%A6%86%E0%A6%AC%E0%A7%87%E0%A6%A6%E0%A6%A8%20%E0%A6%AB%E0%A6%B0%E0%A6%AE.pdf',
    docUrl: 'https://pust.ac.bd/includes/images/forms/%E0%A6%AE%E0%A6%BE%E0%A6%87%E0%A6%97%E0%A7%8D%E0%A6%B0%E0%A7%87%E0%A6%B6%E0%A6%A8-%E0%A6%AE%E0%A6%BF%E0%A6%A1%E0%A6%BF%E0%A7%9F%E0%A6%BE%20%E0%A6%85%E0%A6%AB%20%E0%A6%87%E0%A6%A8%E0%A6%B8%E0%A7%8D%E0%A6%9F%E0%A7%8D%E0%A6%B0%E0%A6%BE%E0%A6%95%E0%A6%B6%E0%A6%A8%20%E0%A6%B8%E0%A6%BE%E0%A6%B0%E0%A7%8D%E0%A6%9F%E0%A6%BF%E0%A6%AB%E0%A6%BF%E0%A6%95%E0%A7%87%E0%A6%9F%E0%A7%87%E0%A6%B0%20%E0%A6%86%E0%A6%AC%E0%A7%87%E0%A6%A6%E0%A6%A8%20%E0%A6%AB%E0%A6%B0%E0%A6%AE.docx',
  },
  {
    serial: 21,
    title: 'No Objection Certificate (NOC) Sample Format',
    category: 'Faculty, Officer & Leave',
    pdfUrl: 'https://pust.ac.bd/includes/images/forms/NOC%20Sample%20Format%20(2).pdf',
  },
  {
    serial: 22,
    title: 'Duplicate Registration Card or Name Correction Form',
    category: 'Student & Academic',
    pdfUrl: 'https://pust.ac.bd/includes/images/forms/Duplicate%20registration%20card%20or%20name%20correction_form.pdf',
  },
  {
    serial: 23,
    title: 'Dormitory / Residential Hall Application Form',
    category: 'Student & Academic',
    pdfUrl: 'https://pust.ac.bd/includes/images/forms/Dorm_Application%20form.pdf',
  },
  {
    serial: 25,
    title: 'Virtual Class Room Requisition Form',
    category: 'Faculty, Officer & Leave',
    pdfUrl: 'https://pust.ac.bd/includes/images/forms/Virtual_Class_Room_Requisition_Form.pdf',
    docUrl: 'https://pust.ac.bd/includes/images/forms/Virtual_Class_Room_Requisition_Form.docx',
  },
  {
    serial: 26,
    title: 'Smart ID Card Registration Form (Officers & Staffs)',
    category: 'Faculty, Officer & Leave',
    docUrl: 'https://pust.ac.bd/includes/images/forms/Smart_ID_Card_Officer_Staff_Form.docx',
  },
  {
    serial: 27,
    title: 'Smart ID Card Registration Form (Teachers)',
    category: 'Faculty, Officer & Leave',
    docUrl: 'https://pust.ac.bd/includes/images/forms/Smart_ID_Card_Teacher_Form.docx',
  },
  {
    serial: 28,
    title: 'Job Application Form (Officers & Staff)',
    category: 'Faculty, Officer & Leave',
    pdfUrl: 'https://pust.ac.bd/includes/images/forms/PUST-Application-Form-Officers-Staff.pdf',
    docUrl: 'https://pust.ac.bd/includes/images/forms/PUST-Application-Form-Officers-Staff.doc',
  },
  {
    serial: 29,
    title: 'Job & Upgradation Application Form (Teachers)',
    category: 'Faculty, Officer & Leave',
    pdfUrl: 'https://pust.ac.bd/includes/images/forms/PUST_Recruitment_Upgradation_Form1.pdf',
    docUrl: 'https://pust.ac.bd/includes/images/forms/PUST_Recruitment_Upgradation_Form1.docx',
  },
  {
    serial: 16,
    title: 'University Transport / Vehicle Requisition Form (গাড়ী ব্যবহারের ফরমায়েশপত্র)',
    category: 'Accounts & Transport',
    pdfUrl: 'https://pust.ac.bd/includes/images/forms/%E0%A6%97%E0%A6%BE%E0%A7%9C%E0%A7%80%20%E0%A6%AC%E0%A7%8D%E0%A6%AF%E0%A6%AC%E0%A6%B9%E0%A6%BE%E0%A6%B0%E0%A7%87%E0%A6%B0%20%E0%A6%AB%E0%A6%B0%E0%A6%AE%E0%A6%BE%E0%A7%9F%E0%A7%87%E0%A6%B6%E0%A6%AA%E0%A6%A4%E0%A7%8D%E0%A6%B0.pdf',
    docUrl: 'https://pust.ac.bd/includes/images/forms/%E0%A6%97%E0%A6%BE%E0%A7%9C%E0%A7%80%20%E0%A6%AC%E0%A7%8D%E0%A6%AF%E0%A6%AC%E0%A6%B9%E0%A6%BE%E0%A6%B0%E0%A7%87%E0%A6%B0%20%E0%A6%AB%E0%A6%B0%E0%A6%AE%E0%A6%BE%E0%A7%9F%E0%A7%87%E0%A6%B6%E0%A6%AA%E0%A6%A4%E0%A7%8D%E0%A6%B0.docx',
  },
  {
    serial: 12,
    title: 'Travel Allowance (TA/DA) Bill Form (ভ্রমণ ভাতা বিল ফরম)',
    category: 'Accounts & Transport',
    pdfUrl: 'https://pust.ac.bd/includes/images/forms/%E0%A6%AD%E0%A7%8D%E0%A6%B0%E0%A6%AE%E0%A6%A3%20%E0%A6%AD%E0%A6%BE%E0%A6%A4%E0%A6%BE%20%E0%A6%AC%E0%A6%BF%E0%A6%B2%20%E0%A6%AB%E0%A6%B0%E0%A6%AE.pdf',
    docUrl: 'https://pust.ac.bd/includes/images/forms/%E0%A6%AD%E0%A7%8D%E0%A6%B0%E0%A6%AE%E0%A6%A3%20%E0%A6%AD%E0%A6%BE%E0%A6%A4%E0%A6%BE%20%E0%A6%AC%E0%A6%BF%E0%A6%B2%20%E0%A6%AB%E0%A6%B0%E0%A6%AE.docx',
  },
  {
    serial: 19,
    title: 'Temporary Advance Adjustment Top-Sheet (অস্থায়ী অগ্রিম সমন্বয়ের টপশীট)',
    category: 'Accounts & Transport',
    pdfUrl: 'https://pust.ac.bd/includes/images/forms/%E0%A6%85%E0%A6%B8%E0%A7%8D%E0%A6%A5%E0%A6%BE%E0%A6%AF%E0%A6%BC%E0%A7%80%20%E0%A6%85%E0%A6%97%E0%A7%8D%E0%A6%B0%E0%A6%BF%E0%A6%AE%20%E0%A6%B8%E0%A6%AE%E0%A6%A8%E0%A7%8D%E0%A6%AC%E0%A6%AF%E0%A6%BC%E0%A7%87%E0%A6%B0%20%E0%A6%9F%E0%A6%AA%E0%A6%B6%E0%A7%80%E0%A6%9F_up.pdf',
    docUrl: 'https://pust.ac.bd/includes/images/forms/%E0%A6%85%E0%A6%B8%E0%A7%8D%E0%A6%A5%E0%A6%BE%E0%A6%AF%E0%A6%BC%E0%A7%80%20%E0%A6%85%E0%A6%97%E0%A7%8D%E0%A6%B0%E0%A6%BF%E0%A6%AE%20%E0%A6%B8%E0%A6%AE%E0%A6%A8%E0%A7%8D%E0%A6%AC%E0%A6%AF%E0%A6%BC%E0%A7%87%E0%A6%B0%20%E0%A6%9F%E0%A6%AA%E0%A6%B6%E0%A7%80%E0%A6%9F_up.docx',
  },
];

export const DEFAULT_ACADEMIC_EXTRAS: AcademicExtrasConfig = {
  degreePrograms: [
    {
      level: 'Undergraduate Honors & Engineering',
      degrees: 'B.Sc. (Engineering), B.Sc. (Honours), B.B.A., B.U.R.P., B.Arch., B.Pharm. (Professional), B.A. (Honours), B.S.S. (Honours)',
      duration: '4 Years / 8 Semesters (B.Arch. & B.Pharm.: 5 Years / 10 Semesters)',
      credits: '140 – 195 Credit Hours',
      entry: 'Bangladesh GST Integrated Admission Test (Units A, B, C)',
    },
    {
      level: 'Graduate & Master Programs',
      degrees: 'M.Sc. (Engineering), M. Engineering, M.Sc., M.Pharm., M.B.A. (Regular), M.A., M.S.S.',
      duration: '1 – 1.5 Years (2 – 3 Semesters)',
      credits: '36 – 45 Credit Hours (Thesis & Non-Thesis Tracks)',
      entry: 'Departmental Postgraduate Selection & Merit Verification',
    },
    {
      level: 'Doctoral & Research Fellowships',
      degrees: 'M.Phil. & Ph.D.',
      duration: '2 – 5 Years Full-Time / Part-Time Research',
      credits: 'Coursework + Original Dissertation Defense',
      entry: 'Academic Council & Advanced Research Committee Approval',
    },
    {
      level: 'Evening & Executive Cohorts',
      degrees: 'Executive MBA (EMBA) & Evening M.Sc. / M.Engg.',
      duration: '2 Years (Weekend / Evening Schedule)',
      credits: '48 – 60 Credit Hours',
      entry: 'Working Professionals & Industry Sponsored Track',
    },
  ],
  facultyDeans: [
    {
      faculty: 'Faculty of Engineering and Technology',
      dean: 'Prof. Dr. Md. Anwar Hossain',
      email: 'dean.et@pust.ac.bd',
      phone: '+8801717330923',
      personalEmail: 'manwar.ice@gmail.com',
      qualification: 'Ph.D. in ICE (PUST), M.Phil. (PUST), B.Sc. & M.Sc. in ICE (RU)',
      researchArea: 'Image Processing, Deep Learning',
      publicationCount: 54,
      code: 'FET · 7 Departments (Codes 01, 02, 05, 06, 11, 12, 17)',
      depts: 'CSE, EEE, EECE, ICE, Civil Engineering, Architecture, URP',
    },
    {
      faculty: 'Faculty of Science',
      dean: 'Prof. Dr. Md. Shamim Reza',
      email: 'dean.s@pust.ac.bd',
      phone: '+8801717725553',
      personalEmail: 'mshamim.pust@gmail.com',
      qualification: 'Ph.D., Peking University (China)',
      researchArea: 'Statistical Learning & Intelligent Information Processing, Deep Learning, Medical Imaging',
      publicationCount: 35,
      code: 'FS · 5 Departments (Codes 03, 07, 13, 14, 16)',
      depts: 'Mathematics, Physics, Pharmacy, Chemistry, Statistics and Data Science',
    },
    {
      faculty: 'Faculty of Business Studies',
      dean: 'Prof. Dr. Md. Hasebur Rahman',
      email: 'dean.bs@pust.ac.bd',
      phone: '+8801718293000',
      personalEmail: 'hasebur7208@gmail.com',
      qualification: 'BBA (Honours in Management), MBA (RU)',
      researchArea: 'Work Motivation, Job Satisfaction, OCB, Entrepreneurship, HRM',
      publicationCount: 40,
      code: 'FBS · 2 Departments (Codes 04, 21)',
      depts: 'Business Administration, Tourism & Hospitality Management',
    },
    {
      faculty: 'Faculty of Humanities and Social Science',
      dean: 'Prof. Dr. Mir Humayun Kabir',
      email: 'dean.hss@pust.ac.bd',
      phone: '+8801716383136',
      qualification: 'M.Phil., Ph.D. (University of Dhaka)',
      researchArea: 'Bangla Drama and Short Story',
      publicationCount: 19,
      code: 'FHSS · 6 Departments (Codes 08, 10, 15, 18, 19, 20)',
      depts: 'Economics, Bangla, Social Work, English, Public Administration, History',
    },
    {
      faculty: 'Faculty of Life and Earth Science',
      dean: 'Prof. Dr. Mohammad Najmul Islam',
      email: 'dean.les@pust.ac.bd',
      qualification: 'Ph.D. (Kyoto University, Japan), JSPS Fellow',
      researchArea: 'Disaster Risk Management, Climate Change Impacts, River & Floodplain Management, IWRM, Socio-hydrology',
      publicationCount: 41,
      code: 'FLES · 1 Department (Code 09)',
      depts: 'Geography and Environment',
    },
  ],
  academicCalendar: [
    {
      term: 'Academic Session 2025–2026 (Sem-I)',
      event: 'Orientation & Semester-I Class Commencement',
      date: '2026-07-15',
      category: 'academic',
      venue: 'Academic Building I & Central Auditorium',
      details:
        'Formal welcome for incoming undergraduate batches and commencement of Semester-I lectures across all 21 departments.',
    },
    {
      term: 'Academic Session 2025–2026 (Sem-I)',
      event: 'Course Add/Drop & Semester Registration Deadline',
      date: '2026-09-20',
      endDate: '2026-09-24',
      category: 'deadline',
      venue: 'Departmental Chairman Offices & Campus Portal',
      details:
        'Final window to add or drop elective courses and lock credit hours with departmental advisor approval.',
    },
    {
      term: 'Academic Session 2025–2026 (Sem-I)',
      event: 'Mid-Term Continuous Assessments',
      date: '2026-10-04',
      endDate: '2026-10-12',
      category: 'exam',
      venue: 'Departmental Lecture Rooms & Wazed Engineering Bhaban',
      details:
        'Scheduled mid-semester written assessments, laboratory quizzes, and continuous evaluation milestones.',
    },
    {
      term: 'University Holiday',
      event: 'Durga Puja & Autumn Academic Recess',
      date: '2026-10-19',
      endDate: '2026-10-22',
      category: 'holiday',
      venue: 'All Academic & Administrative Wings Closed',
      details:
        'Scheduled national holiday and autumn recess; essential Residential Hall and Medical Center duties remain operational.',
    },
    {
      term: 'Semester-I Final Cycle',
      event: 'Exam Form Fill-Up & Hall Dues Clearance Deadline',
      date: '2026-11-16',
      endDate: '2026-11-30',
      category: 'deadline',
      venue: 'Controller of Examinations & PUST Campus Portal',
      details:
        'Mandatory deadline to clear Residential Hall dues, pay exam fees, and secure Chairman verification for digital Admit Cards.',
    },
    {
      term: 'Semester-I Final Cycle',
      event: 'Thesis & Final-Year Project Proposal Submission Deadline',
      date: '2026-12-01',
      category: 'deadline',
      venue: 'Respective Department Research Committees',
      details:
        'Final submission date for 4th-year undergraduate thesis synopses and M.Sc./M.Engg. research proposals.',
    },
    {
      term: 'Seminars & Quality Assurance',
      event: 'Outcome-Based Education (OBE) & Digital Assessment Symposium',
      date: '2026-12-03',
      category: 'academic',
      venue: 'Central Auditorium · IQAC & ICT Cell',
      details:
        'Faculty and scholar symposium reviewing OBE curriculum attainment metrics and automated examination workflows.',
    },
    {
      term: 'Semester-I Final Cycle',
      event: 'Semester-I Term-End Final Examinations (21 Departments)',
      date: '2026-12-06',
      endDate: '2026-12-21',
      category: 'exam',
      venue: 'Academic Building I & Wazed Engineering Bhaban',
      details:
        'Term-end written, studio, and practical examinations across all 5 faculties. Digital Admit Cards are required at examination halls.',
    },
    {
      term: 'University Holiday',
      event: 'Victory Day (National Holiday & Campus Observance)',
      date: '2026-12-16',
      category: 'holiday',
      venue: 'Independence Plaza & Administrative Promenade',
      details:
        'National holiday observing Victory Day with ceremonial flag hoisting and floral tribute at the university memorial.',
    },
    {
      term: 'University Holiday',
      event: 'Winter Vacation & Christmas Recess',
      date: '2026-12-22',
      endDate: '2026-12-31',
      category: 'holiday',
      venue: 'University Campus (Rajapur, Pabna)',
      details:
        'Post-examination winter break across all undergraduate and postgraduate classes prior to Semester-II reopening.',
    },
    {
      term: 'Academic Session 2025–2026 (Sem-II)',
      event: 'Semester-II Classes Begin & Enrollment Opens',
      date: '2027-01-03',
      category: 'academic',
      venue: 'All 5 Faculties & 21 Departments',
      details:
        'Formal commencement of Semester-II teaching schedules and opening of portal course enrollment.',
    },
    {
      term: 'Academic Session 2025–2026 (Sem-II)',
      event: 'Semester-II Course Registration & Tuition Fee Deadline',
      date: '2027-01-18',
      category: 'deadline',
      venue: 'Office of the Treasurer & Campus Portal',
      details:
        'Last day for Semester-II course registration without late surcharge and settlement of semester tuition dues.',
    },
    {
      term: 'Financial Aid & Merit Cycle',
      event: 'Merit Scholarship & Dean’s List Application Deadline',
      date: '2027-01-25',
      category: 'deadline',
      venue: 'Student Advisor Office & Faculty Deans',
      details:
        'Closing date for UGC stipend, PUST Merit Scholarship, and Residential Fee Waiver applications.',
    },
    {
      term: 'University Holiday',
      event: 'Shab-e-Barat Holiday (Subject to Lunar Sighting)',
      date: '2027-02-04',
      category: 'holiday',
      venue: 'All Academic & Administrative Offices Closed',
      details:
        'Scheduled university holiday for Shab-e-Barat; classes and administrative counters remain closed.',
    },
    {
      term: 'University Holiday',
      event: 'Shaheed Dibosh & International Mother Language Day',
      date: '2027-02-21',
      category: 'holiday',
      venue: 'Central Shaheed Minar, Rajapur Campus',
      details:
        'National holiday and morning Prabhat Pheri honoring the Language Movement martyrs.',
    },
    {
      term: 'Academic Session 2025–2026 (Sem-II)',
      event: 'Semester-II Mid-Term Examinations',
      date: '2027-02-22',
      endDate: '2027-02-28',
      category: 'exam',
      venue: 'Academic Building I & Wazed Engineering Bhaban',
      details:
        'Mandatory mid-semester assessment week covering core theory and departmental laboratory courses.',
    },
    {
      term: 'Convocation Milestone',
      event: 'First University Convocation at Rajapur Ceremonial Pavilion',
      date: '2027-03-15',
      category: 'academic',
      venue: 'Convocation Grounds, Rajapur Campus',
      details:
        'Historic First Convocation of PUST conferring degrees upon graduating undergraduate and postgraduate cohorts.',
    },
    {
      term: 'University Holiday',
      event: 'Eid-ul-Fitr & Independence Day Recess',
      date: '2027-03-19',
      endDate: '2027-03-27',
      category: 'holiday',
      venue: 'All Academic & Administrative Wings Closed',
      details:
        'Combined Eid-ul-Fitr vacation (subject to moon sighting) and Bangladesh Independence & National Day on 26 March.',
    },
    {
      term: 'University Holiday',
      event: 'Pahela Baishakh (Bengali New Year 1434)',
      date: '2027-04-14',
      category: 'holiday',
      venue: 'Campus Quadrangle & Independence Plaza',
      details:
        'National cultural holiday celebrating Bengali New Year with campus festivities.',
    },
    {
      term: 'Semester-II Final Cycle',
      event: 'Semester-II Exam Form Fill-Up & Clearance Deadline',
      date: '2027-04-25',
      endDate: '2027-05-03',
      category: 'deadline',
      venue: 'Departmental Chairman Offices & Campus Portal',
      details:
        'Deadline for final exam form fill-up, hall financial clearance, and digital Admit Card approval.',
    },
    {
      term: 'Semester-II Final Cycle',
      event: 'Semester-II Term-End Final Examinations',
      date: '2027-05-09',
      endDate: '2027-05-24',
      category: 'exam',
      venue: 'All Academic Buildings & Departmental Labs',
      details:
        'Annual term-end examinations concluding Academic Session 2025–2026 prior to summer result publication.',
    },
  ],
  scholarships: [
    {
      title: 'PUST Merit & Dean’s List Scholarship',
      detail:
        'Awarded per semester to top CGPA achievers in each of the 21 academic departments based on published examination results.',
    },
    {
      title: 'UGC & Government Stipend Programs',
      detail:
        'Need-based and research stipends administered via the Student Advisor Office and Registrar desk.',
    },
    {
      title: 'Prime Minister / ICT Innovation Fellowships',
      detail:
        'Research grants supporting M.Sc., M.Phil., and thesis undergraduates in Engineering and Applied Sciences.',
    },
    {
      title: 'Residential Fee Waiver Assistance',
      detail:
        'Financial waivers coordinated between July 06 Hall / dormitories and the Student Welfare Directorate.',
    },
  ],
  downloadForms: [
    {
      code: 'PUST-REG-01',
      title: 'Admission Verification & Token Request Form',
      office: 'Office of the Registrar / Department Chairman',
      note: 'Digital token issuance and document verification handled inside Campus Portal.',
      portalTarget: '/portal',
      portalLabel: 'Activate via Portal Token',
      fields: [
        'Applicant Full Name (as per SSC/HSC)',
        'GST Unit & Admission Roll Number',
        'Department Allocated & Session',
        'Academic ID / Temporary Reference',
        'Digital Document Verification Packet Hash',
      ],
    },
    {
      code: 'PUST-LIB-02',
      title: 'Central Library Membership & Card Requisition Form',
      office: 'Department Chairman Seal + Central Library',
      note: 'Forwarded digitally with Chairman official seal and signature JSON.',
      portalTarget: '/portal?tab=library',
      portalLabel: 'Start Library Application',
      fields: [
        'Student Name & Academic ID',
        'Department Code & Academic Session',
        'Chairman Digital Seal JSON Endorsement',
        'Central Library Verification Officer',
        'Linked Digital / Physical Library Card Ref',
      ],
    },
    {
      code: 'PUST-HALL-03',
      title: 'Residential Hall Seat Application & Clearance Form',
      office: 'Provost Office (July 06 Hall & Dormitories)',
      note: 'Check vacancy circulars, hall dues, and clearance references in Campus Portal.',
      portalTarget: '/portal?tab=halls',
      portalLabel: 'Apply / Clear Hall Dues',
      fields: [
        'Student Name, Academic ID & Department',
        'Preferred Residential Hall (July 06 Hall / Dormitories)',
        'Permanent District & Residential Statement',
        'Hall Financial Receipt & Clearance Reference',
        'Provost / House Tutor Seat Allotment Endorsement',
      ],
    },
    {
      code: 'PUST-EX-04',
      title: 'Semester Examination Form Fill-up & Admit Card Application',
      office: 'Department Chairman & Controller of Examinations',
      note: 'Enforces automatic Hall clearance check and online payment receipt.',
      portalTarget: '/portal?tab=exams',
      portalLabel: 'Open Exam Form Fill-up',
      fields: [
        'Student Name, Academic ID & Semester',
        'Registered Course Codes & Credit Total',
        'Verified Hall Financial Clearance Status',
        'Digital Checkout Receipt (SSLCommerz / Bangla QR / MFS)',
        'Chairman Digital Admit Card Verification',
      ],
    },
    {
      code: 'PUST-CERT-05',
      title: 'Provisional / Temporary Certificate & 4-Office Clearance Form',
      office: 'Chairman, Hall, Library, Proctor & Admin Office',
      note: 'Track real-time 4-office clearances and download verified Temporary Certificate.',
      portalTarget: '/portal?tab=certificates',
      portalLabel: 'Start Certificate Clearance',
      fields: [
        'Graduating Student Name & Academic ID',
        '8-Semester Completion & Final CGPA Verification',
        'Certificate Fee Payment Receipt Reference',
        '4-Office Clearances (Chairman, Hall, Library, Proctor)',
        'Central Admin Certificate Serial & Public Verify Hash',
      ],
    },
  ],
  officialForms: DEFAULT_OFFICIAL_FORMS,
  researchIntro:
    'Serving nearly 5,000 students across academic blocks, the Central Library & Information Center, July 06 Hall & dormitories, Medical Center, Transport Pool, and active student chapters including IEEE PUST SB.',
  researchInfraCards: [
    {
      id: 'infra-labs',
      tag: 'IIED & Research Cell · 30+ Departmental Labs',
      title: 'Engineering & Scientific Laboratories',
      description:
        'Hands-on facilities for VLSI, THz wireless communications, deep learning, supercapacitor synthesis, pharmaceutical HPLC, and river-basin geotechnics.',
      imageUrl: '/src/assets/images/pust_engineering_lab_1795431408924.jpg',
      caption: 'Fig. 2 — Applied Engineering & Instrumentation Laboratories.',
    },
    {
      id: 'infra-library',
      tag: 'Central Library · Sun–Thu 08:30–21:00 BST',
      title: 'Central Library & Digital Subscriptions',
      description:
        'Print monograph collections paired with institutional journal access to IEEE Xplore, SpringerLink, ACM Digital Library, and quiet thesis research floors.',
      imageUrl: '/src/assets/images/pust_central_library_1795431408614.jpg',
      caption: 'Fig. 3 — Central Library & Information Center Reading Floor.',
    },
    {
      id: 'infra-halls',
      tag: 'July 06 · Swadhinota · Matribhasha · Ganatantra',
      title: 'Residential Halls, Medical & Transport',
      description:
        'Residential accommodation across Male and Female Halls, PUST Medical Section (+8802588844975), ICT Cell, Student Advisor Office, and Transportation Pool bus routes (+8802588845650).',
      imageUrl: '/src/assets/images/pust_campus_grounds_1795431408500.jpg',
      caption: 'Fig. 4 — Rajapur Campus Quadrangle & Residential Precinct.',
    },
  ],
};

export const DEFAULT_ADMISSIONS_CONFIG: AdmissionsConfig = {
  kicker: 'Admissions 2026–2027',
  gstUnits: [
    {
      unitLabel: 'GST UNIT A · SCIENCE & ENGG.',
      deptCountLabel: '13 Departments',
      departmentsText:
        'CSE, EEE, EECE, ICE, CE, Architecture (with drawing test), URP, Mathematics, Physics, Pharmacy, Chemistry, Statistics & Data Science, Geography & Environment.',
    },
    {
      unitLabel: 'GST UNIT B · HUMANITIES',
      deptCountLabel: '6 Departments',
      departmentsText:
        'Economics (Math eligibility), Bangla, Social Work, English (min. 20% English score), Public Administration (min. 20% English score), and History.',
    },
    {
      unitLabel: 'GST UNIT C · BUSINESS',
      deptCountLabel: '2 Departments',
      departmentsText:
        'Business Administration (BBA) & Tourism and Hospitality Management (THM).',
    },
  ],
  undergradText:
    'Undergraduate admissions into all 21 departments follow the centralized Bangladesh GST Integrated Admission Test (Units A, B, and C)—PUST holds no separate university test, aside from Architecture aptitude drawing evaluation.',
  gradText:
    'Graduate programs (M.Sc. Engg., M.Engg., M.Sc., M.Pharm., M.B.A., M.A., M.S.S.) and M.Phil./Ph.D. admissions are coordinated departmentally (e.g., CSE & ICE postgraduate cohorts) under Academic Council rules.',
  eveningText:
    'Evening professional tracks including Executive MBA (EMBA) and Applied Engineering postgraduate cohorts offer weekend and evening schedules for working professionals.',
  totalIntakeLabel: '830+ – 920 Seats / Session',
  signupMethodLabel: 'Via Dept. Portal Token',
  deskEmail: 'registrar@pust.ac.bd',
};

export const DEFAULT_FACILITIES_CONFIG: FacilityItemConfig[] = [
  {
    label: 'Library',
    route: '/facilities/library',
    title: 'Central Library & Information Center (CLIC)',
    body: 'Managed by Additional Librarian Md. Hafizur Rahaman Mollah (clic@pust.ac.bd), the Central Library houses academic and reference books across all 5 faculties plus registered campus-IP access to IEEE Xplore, SpringerLink, and ACM Digital Library. Students apply in the Campus Portal with Department Chairman digital seal JSON for Digital and Physical Library Cards.',
    img: '/src/assets/images/pust_central_library_1795431408614.jpg',
    hours: 'Sun–Thu · 08:30–21:00 BST',
    location: 'Central Library Complex · clic@pust.ac.bd',
    portalRoute: '/portal?tab=library',
    highlights: [
      'Chairman-sealed digital membership approval workflow',
      'Linked Digital & Physical Library Card ID issuance',
      'Faculty-wise textbook stacks, thesis archive & e-journals',
    ],
  },
  {
    label: 'Transport',
    route: '/facilities/transport',
    title: 'University Transportation Pool',
    body: 'Administered by Dr. Mir Humayun Kabir (transport@pust.ac.bd, +8802588845650), the Transportation Pool operates university-owned and contracted buses connecting Rajapur Campus with Pabna Town, Central Terminal, Edward College, and highway corridors for students, faculty, and officers.',
    img: '/src/assets/images/pust_campus_grounds_1795431408500.jpg',
    hours: 'Sun–Thu · 07:15–18:30 BST',
    location: 'Transport Pool · +8802588845650 · transport@pust.ac.bd',
    portalRoute: '/portal',
    highlights: [
      'Dedicated student, teacher & officer shuttle schedules',
      'Pabna Town, Terminal, Edward College & Highway corridors',
      'Convocation & semester examination special bus dispatch',
    ],
  },
  {
    label: 'Residence',
    route: '/facilities/residence',
    title: 'Residential Halls (July 06, Swadhinota, Matribhasha & Ganatantra)',
    body: 'PUST provides campus residential accommodation including July 06 Hall / Male Hall-1 (Provost: Md. Al-Fahad Bhuiyan), Swadhinota Hall / Male Hall-2 (Provost: Dr. Md. Kamruzzaman), Matribhasha Hall / Female Hall-1 (Provost: Dr. Rebeka Sultana Rekha), and Ganatantra Hall / Female Hall-2 (Provost: Laila Arzumand Banu). Vacancy circulars, seat history, and Hall Financial Clearances are fully online.',
    img: '/src/assets/images/pust_campus_grounds_1795431408500.jpg',
    hours: '24/7 Provost & House Tutor Duty',
    location: 'North Residential Precinct, Rajapur',
    portalRoute: '/portal?tab=halls',
    highlights: [
      'July 06 Hall, Swadhinota Hall, Matribhasha Hall & Ganatantra Hall',
      'Full retained seat allotment & change history per student ID',
      'Mandatory Hall dues clearance synced directly with Exam Portal',
    ],
  },
  {
    label: 'Medical',
    route: '/facilities/medical',
    title: 'PUST Medical Section & Health Center',
    body: 'Staffed by Deputy Chief Medical Officers Dr. Md. Rafiqul Islam and Dr. Nasrin Sultana (medicalsection@pust.ac.bd, +8802588844975), the PUST Medical Center provides primary healthcare, outpatient consultations, essential medications, and 24/7 ambulance referral for residential students, faculty, and staff.',
    img: '/src/assets/images/pust_medical_tsc_1795441926681.jpg',
    hours: 'Outpatient Sun–Thu · 24/7 Ambulance',
    location: 'Medical Center · +8802588844975 · medicalsection@pust.ac.bd',
    portalRoute: '/portal',
    highlights: [
      'Deputy Chief Medical Officers & campus nursing unit',
      'Free primary consultation, first aid & dispensary services',
      '24/7 emergency ambulance referral to Pabna General Hospital',
    ],
  },
  {
    label: 'ICT Sheba',
    route: '/facilities/ict-sheba',
    title: 'ICT Cell & ICT Sheba Portal',
    body: 'Directed by Dr. Md. Abdur Rahim (ictdirector@pust.ac.bd), the ICT Cell maintains PUST’s campus fiber-optic backbone, high-speed Wi-Fi across academic & residential wings, institutional @pust.ac.bd accounts, and automated portal clearance infrastructure.',
    img: '/src/assets/images/pust_engineering_lab_1795431408924.jpg',
    hours: 'Sun–Thu · 09:00–17:00 BST',
    location: 'ICT Cell Wing · ictdirector@pust.ac.bd',
    portalRoute: '/portal',
    highlights: [
      'University-wide fiber backbone & campus Wi-Fi network',
      'Institutional @pust.ac.bd account & signup token provisioning',
      'Digital admit card & 4-office certificate workflow support',
    ],
  },
];

export const DEFAULT_VERIFY_PAGE_CONFIG: VerifyPageConfig = {
  kicker: 'Public Authenticity Registry',
  title: 'Digital Document & Receipt Verification',
  subtitle:
    'Verify Temporary Certificates, Examination Admit Cards, Residential Hall Clearances, Digital Library Cards, Chairman Seals, and official Payment Receipts issued through the PUST Digital Campus Portal.',
  sampleSerials: [
    { label: 'Temporary Certificate', code: 'PUST-CERT-CSE-2026A1' },
    { label: 'Semester Admit Card', code: 'ADMIT-CSE-220101-4' },
    { label: 'Hall Financial Clearance', code: 'PUST-HALL-CLR-2026-091' },
    { label: 'Digital Library Card', code: 'PUST-LIB-CSE-220101' },
    { label: 'Payment Receipt', code: 'PUST-RCPT-2026-091' },
  ],
  employerCardTitle: 'For Employers & External Institutions',
  employerCardBody:
    'Every Temporary Certificate and Provisional Transcript issued through PUST includes a unique serial and SHA-256 verification digest reflected immediately in this registry.',
  portalCardTitle: 'Need to Apply or Download Your Copy?',
  portalCardBody:
    'Sign in to the Digital Campus Portal to settle fees, view admit cards, print hall clearances, or download certificates.',
};

export const DEFAULT_FOOTER_CONFIG: FooterConfig = {
  tagline: 'Est. 2008 · Rajapur, Pabna',
  description:
    'A public university in Bangladesh advancing engineering, pure and applied sciences, business, and humanities across {facultiesCount} faculties and {departmentsCount} academic departments.',
  socialLinks: [
    { label: 'Official Site', url: 'https://pust.ac.bd/' },
    { label: 'Facebook', url: 'https://www.facebook.com/pust.ac.bd' },
    { label: 'YouTube', url: 'https://www.youtube.com' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com' },
  ],
  quickLinks: [
    { label: 'Our University', route: '/about/our-university' },
    { label: 'History and Plans', route: '/about/history' },
    { label: 'Notice Board', route: '/notices' },
    { label: 'Recent Publications', route: '/academics/publications' },
    { label: 'News & Events', route: '/gallery' },
    { label: 'Verify Documents', route: '/verify' },
  ],
  governanceLinks: [
    { label: 'PUST Act (2001)', route: '/governance/pust-act' },
    { label: 'Regent Board', route: '/governance/regent-board' },
    { label: 'Academic Council', route: '/governance/academic-council' },
    { label: 'Academic Ordinance', route: '/governance/academic-ordinance' },
    { label: 'VC Office', route: '/administration/vc-office' },
    { label: 'Registrar Office', route: '/administration/registrar-office' },
  ],
  serviceLinks: [
    { label: '21 Departments', route: '/academics/departments' },
    { label: 'Academic Calendar', route: '/academics/calendar' },
    { label: 'Digital Forms', route: '/academics/forms-download' },
    { label: 'Central Library', route: '/facilities/library' },
    { label: 'Residence & Halls', route: '/facilities/residence' },
    { label: 'Campus Portal', route: '/portal' },
  ],
  addressLines: [
    'Rajapur, Gayeshpur, Pabna-6600, Bangladesh',
    'Dhaka–Pabna Highway, 3 km east of Pabna town',
  ],
  contacts: [
    { label: 'VC', phone: '+8802588842379', email: 'vc@pust.ac.bd' },
    { label: 'Registrar', phone: '+8802588845193', email: 'registrar@pust.ac.bd' },
    { label: 'Controller', phone: '+8802588844965', email: 'controller@pust.ac.bd' },
  ],
  copyrightText: '© 2026 Pabna University of Science and Technology (PUST). All rights reserved.',
};

export interface ResolvedUniversityContent {
  navbarTagline: string;
  institutionalLinksEyebrow: string;
  institutionalLinksHeading: string;
  institutionalLinks: InstitutionalLinkItem[];
  upcomingSeminars: SeminarItem[];
  campusMapMeta: CampusMapMeta;
  campusBuildings: CampusBuildingItem[];
  governanceContent: GovernanceContent;
  adminShowcase: AdminShowcaseConfig;
  aboutExtras: AboutExtrasConfig;
  academicExtras: AcademicExtrasConfig;
  admissionsConfig: AdmissionsConfig;
  facilitiesConfig: FacilityItemConfig[];
  verifyPageConfig: VerifyPageConfig;
  footerConfig: FooterConfig;
}

export function resolveUniversityContent(
  profile: Partial<UniversityProfile> | null | undefined
): ResolvedUniversityContent {
  const gov = profile?.governanceContent;
  const admin = profile?.adminShowcase;
  const about = profile?.aboutExtras;
  const acad = profile?.academicExtras;
  const adm = profile?.admissionsConfig;
  const ver = profile?.verifyPageConfig;
  const foot = profile?.footerConfig;
  const mapMeta = profile?.campusMapMeta;

  return {
    navbarTagline: profile?.navbarTagline?.trim() || DEFAULT_NAVBAR_TAGLINE,
    institutionalLinksEyebrow:
      profile?.institutionalLinksEyebrow?.trim() || DEFAULT_INSTITUTIONAL_LINKS_EYEBROW,
    institutionalLinksHeading:
      profile?.institutionalLinksHeading?.trim() || DEFAULT_INSTITUTIONAL_LINKS_HEADING,
    institutionalLinks: Array.isArray(profile?.institutionalLinks)
      ? profile.institutionalLinks
      : DEFAULT_INSTITUTIONAL_LINKS,
    upcomingSeminars: Array.isArray(profile?.upcomingSeminars)
      ? profile.upcomingSeminars
      : DEFAULT_UPCOMING_SEMINARS,
    campusMapMeta: {
      eyebrow: mapMeta?.eyebrow?.trim() || DEFAULT_CAMPUS_MAP_META.eyebrow,
      title: mapMeta?.title?.trim() || DEFAULT_CAMPUS_MAP_META.title,
      subtitle: mapMeta?.subtitle?.trim() || DEFAULT_CAMPUS_MAP_META.subtitle,
      coordinates: mapMeta?.coordinates?.trim() || DEFAULT_CAMPUS_MAP_META.coordinates,
    },
    campusBuildings: Array.isArray(profile?.campusBuildings)
      ? profile.campusBuildings
      : DEFAULT_CAMPUS_BUILDINGS,
    governanceContent: {
      officialActUrl: gov?.officialActUrl?.trim() || DEFAULT_GOVERNANCE_CONTENT.officialActUrl,
      actIntro: gov?.actIntro?.trim() || DEFAULT_GOVERNANCE_CONTENT.actIntro,
      actClauses: Array.isArray(gov?.actClauses)
        ? gov.actClauses
        : DEFAULT_GOVERNANCE_CONTENT.actClauses,
      actCitations: Array.isArray(gov?.actCitations)
        ? gov.actCitations
        : DEFAULT_GOVERNANCE_CONTENT.actCitations,
      regentBoardMembers: Array.isArray(gov?.regentBoardMembers)
        ? gov.regentBoardMembers
        : DEFAULT_GOVERNANCE_CONTENT.regentBoardMembers,
      regentFunctions: Array.isArray(gov?.regentFunctions)
        ? gov.regentFunctions
        : DEFAULT_GOVERNANCE_CONTENT.regentFunctions,
      academicCouncilIntro:
        gov?.academicCouncilIntro?.trim() || DEFAULT_GOVERNANCE_CONTENT.academicCouncilIntro,
      academicCouncilCards: Array.isArray(gov?.academicCouncilCards)
        ? gov.academicCouncilCards
        : DEFAULT_GOVERNANCE_CONTENT.academicCouncilCards,
      academicCouncilStructure: Array.isArray(gov?.academicCouncilStructure)
        ? gov.academicCouncilStructure
        : DEFAULT_GOVERNANCE_CONTENT.academicCouncilStructure,
      financeCommitteeIntro:
        gov?.financeCommitteeIntro?.trim() || DEFAULT_GOVERNANCE_CONTENT.financeCommitteeIntro,
      financeCommitteeScopes: Array.isArray(gov?.financeCommitteeScopes)
        ? gov.financeCommitteeScopes
        : DEFAULT_GOVERNANCE_CONTENT.financeCommitteeScopes,
      financeCommitteeLeadership: Array.isArray(gov?.financeCommitteeLeadership)
        ? gov.financeCommitteeLeadership
        : DEFAULT_GOVERNANCE_CONTENT.financeCommitteeLeadership,
      ordinanceIntro: gov?.ordinanceIntro?.trim() || DEFAULT_GOVERNANCE_CONTENT.ordinanceIntro,
      ordinanceRules: Array.isArray(gov?.ordinanceRules)
        ? gov.ordinanceRules
        : DEFAULT_GOVERNANCE_CONTENT.ordinanceRules,
      gradingScale: Array.isArray(gov?.gradingScale)
        ? gov.gradingScale
        : DEFAULT_GOVERNANCE_CONTENT.gradingScale,
    },
    adminShowcase: {
      buildingImage: admin?.buildingImage?.trim() || DEFAULT_ADMIN_SHOWCASE.buildingImage,
      buildingCaption: admin?.buildingCaption?.trim() || DEFAULT_ADMIN_SHOWCASE.buildingCaption,
      charterTag: admin?.charterTag?.trim() || DEFAULT_ADMIN_SHOWCASE.charterTag,
      accountabilityCycle:
        admin?.accountabilityCycle?.trim() || DEFAULT_ADMIN_SHOWCASE.accountabilityCycle,
      apaFyLabel: admin?.apaFyLabel?.trim() || DEFAULT_ADMIN_SHOWCASE.apaFyLabel,
      apaBenchmarks: Array.isArray(admin?.apaBenchmarks)
        ? admin.apaBenchmarks
        : DEFAULT_ADMIN_SHOWCASE.apaBenchmarks,
    },
    aboutExtras: {
      campusImage: about?.campusImage?.trim() || DEFAULT_ABOUT_EXTRAS.campusImage,
      campusCaption: about?.campusCaption?.trim() || DEFAULT_ABOUT_EXTRAS.campusCaption,
      milestones: Array.isArray(about?.milestones)
        ? about.milestones
        : DEFAULT_ABOUT_EXTRAS.milestones,
    },
    academicExtras: {
      degreePrograms: Array.isArray(acad?.degreePrograms)
        ? acad.degreePrograms
        : DEFAULT_ACADEMIC_EXTRAS.degreePrograms,
      facultyDeans: (Array.isArray(acad?.facultyDeans)
        ? acad.facultyDeans
        : DEFAULT_ACADEMIC_EXTRAS.facultyDeans
      ).map((dean) => {
        const base = DEFAULT_ACADEMIC_EXTRAS.facultyDeans.find(
          (d) => d.faculty === dean.faculty
        );
        return base ? { ...base, ...dean } : dean;
      }),
      academicCalendar: Array.isArray(acad?.academicCalendar)
        ? acad.academicCalendar
        : DEFAULT_ACADEMIC_EXTRAS.academicCalendar,
      scholarships: Array.isArray(acad?.scholarships)
        ? acad.scholarships
        : DEFAULT_ACADEMIC_EXTRAS.scholarships,
      downloadForms: Array.isArray(acad?.downloadForms)
        ? acad.downloadForms
        : DEFAULT_ACADEMIC_EXTRAS.downloadForms,
      officialForms: Array.isArray(acad?.officialForms)
        ? acad.officialForms
        : DEFAULT_OFFICIAL_FORMS,
      researchIntro: acad?.researchIntro?.trim() || DEFAULT_ACADEMIC_EXTRAS.researchIntro,
      researchInfraCards: Array.isArray(acad?.researchInfraCards)
        ? acad.researchInfraCards
        : DEFAULT_ACADEMIC_EXTRAS.researchInfraCards,
    },
    admissionsConfig: {
      kicker: adm?.kicker?.trim() || DEFAULT_ADMISSIONS_CONFIG.kicker,
      gstUnits: Array.isArray(adm?.gstUnits)
        ? adm.gstUnits
        : DEFAULT_ADMISSIONS_CONFIG.gstUnits,
      undergradText: adm?.undergradText?.trim() || DEFAULT_ADMISSIONS_CONFIG.undergradText,
      gradText: adm?.gradText?.trim() || DEFAULT_ADMISSIONS_CONFIG.gradText,
      eveningText: adm?.eveningText?.trim() || DEFAULT_ADMISSIONS_CONFIG.eveningText,
      totalIntakeLabel:
        adm?.totalIntakeLabel?.trim() || DEFAULT_ADMISSIONS_CONFIG.totalIntakeLabel,
      signupMethodLabel:
        adm?.signupMethodLabel?.trim() || DEFAULT_ADMISSIONS_CONFIG.signupMethodLabel,
      deskEmail: adm?.deskEmail?.trim() || DEFAULT_ADMISSIONS_CONFIG.deskEmail,
    },
    facilitiesConfig: Array.isArray(profile?.facilitiesConfig)
      ? profile.facilitiesConfig
      : DEFAULT_FACILITIES_CONFIG,
    verifyPageConfig: {
      kicker: ver?.kicker?.trim() || DEFAULT_VERIFY_PAGE_CONFIG.kicker,
      title: ver?.title?.trim() || DEFAULT_VERIFY_PAGE_CONFIG.title,
      subtitle: ver?.subtitle?.trim() || DEFAULT_VERIFY_PAGE_CONFIG.subtitle,
      sampleSerials: Array.isArray(ver?.sampleSerials)
        ? ver.sampleSerials
        : DEFAULT_VERIFY_PAGE_CONFIG.sampleSerials,
      employerCardTitle:
        ver?.employerCardTitle?.trim() || DEFAULT_VERIFY_PAGE_CONFIG.employerCardTitle,
      employerCardBody:
        ver?.employerCardBody?.trim() || DEFAULT_VERIFY_PAGE_CONFIG.employerCardBody,
      portalCardTitle: ver?.portalCardTitle?.trim() || DEFAULT_VERIFY_PAGE_CONFIG.portalCardTitle,
      portalCardBody: ver?.portalCardBody?.trim() || DEFAULT_VERIFY_PAGE_CONFIG.portalCardBody,
    },
    footerConfig: {
      tagline: foot?.tagline?.trim() || DEFAULT_FOOTER_CONFIG.tagline,
      description: foot?.description?.trim() || DEFAULT_FOOTER_CONFIG.description,
      socialLinks: Array.isArray(foot?.socialLinks)
        ? foot.socialLinks
        : DEFAULT_FOOTER_CONFIG.socialLinks,
      quickLinks: Array.isArray(foot?.quickLinks)
        ? foot.quickLinks
        : DEFAULT_FOOTER_CONFIG.quickLinks,
      governanceLinks: Array.isArray(foot?.governanceLinks)
        ? foot.governanceLinks
        : DEFAULT_FOOTER_CONFIG.governanceLinks,
      serviceLinks: Array.isArray(foot?.serviceLinks)
        ? foot.serviceLinks
        : DEFAULT_FOOTER_CONFIG.serviceLinks,
      addressLines: Array.isArray(foot?.addressLines)
        ? foot.addressLines
        : DEFAULT_FOOTER_CONFIG.addressLines,
      contacts: Array.isArray(foot?.contacts)
        ? foot.contacts
        : DEFAULT_FOOTER_CONFIG.contacts,
      copyrightText: foot?.copyrightText?.trim() || DEFAULT_FOOTER_CONFIG.copyrightText,
    },
  };
}

export function formatFooterDescription(
  template: string,
  facultiesCount = 5,
  departmentsCount = 21
): string {
  return template
    .replace(/\{facultiesCount\}/g, String(facultiesCount))
    .replace(/\{departmentsCount\}/g, String(departmentsCount));
}

export function clampMapPercent(value: number): number {
  if (!Number.isFinite(value)) return 50;
  return Math.min(95, Math.max(5, Math.round(value)));
}

export function moveArrayItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const nextIndex = index + direction;
  if (index < 0 || index >= items.length || nextIndex < 0 || nextIndex >= items.length) {
    return items;
  }
  const copy = [...items];
  const [item] = copy.splice(index, 1);
  copy.splice(nextIndex, 0, item);
  return copy;
}

export function resolveContextualEditTarget(
  route: string
): { label: string; targetKind: string } | null {
  if (route === '/verify') return { label: 'Edit Verify Page', targetKind: 'verify-page' };
  if (route.startsWith('/governance'))
    return { label: 'Edit Governance Section', targetKind: 'governance' };
  if (route.startsWith('/admissions'))
    return { label: 'Edit Admissions Info', targetKind: 'admissions-info' };
  if (route.startsWith('/facilities'))
    return { label: 'Edit Facility Page', targetKind: 'facility' };
  if (route.startsWith('/about')) return { label: 'Edit About & Milestones', targetKind: 'about' };
  if (route === '/academics/programs')
    return { label: 'Edit Programs', targetKind: 'degree-programs' };
  if (route === '/academics/faculty' || route === '/academics/deans')
    return { label: 'Edit Faculty Deans', targetKind: 'faculty-deans' };
  if (route === '/academics/calendar')
    return { label: 'Edit Academic Calendar', targetKind: 'academic-calendar' };
  if (route === '/academics/scholarship')
    return { label: 'Edit Scholarships', targetKind: 'scholarships' };
  if (route === '/academics/forms-download')
    return { label: 'Edit Download Forms', targetKind: 'download-forms' };
  if (route === '/academics/seminars')
    return { label: 'Edit Seminars', targetKind: 'seminars' };
  if (route === '/academics/publications' || route === '/academics/journals')
    return { label: 'Edit Research Infra', targetKind: 'research-infra' };
  if (route.startsWith('/administration'))
    return { label: 'Edit Admin & APA', targetKind: 'apa-benchmarks' };
  return null;
}
