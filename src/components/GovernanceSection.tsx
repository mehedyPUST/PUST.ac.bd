'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import type { AppRoute } from '../lib/routes';

interface GovernanceSectionProps {
  route: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

const GOVERNANCE_TABS: Array<{
  route: AppRoute;
  label: string;
  code: string;
  heading: string;
  subtitle: string;
}> = [
  {
    route: '/governance/university-act',
    label: 'University Act',
    code: 'ACT NO. 43 OF 2001 · PASSED 15 JULY 2001 · EFFECTIVE 12 OCT 2008',
    heading: 'Pabna University of Science and Technology Act, 2001',
    subtitle:
      'Statutory charter enacted by the Parliament of Bangladesh (Act No. 43 of 2001, passed 15 July 2001 and operationalized via Gazette notification on 12 October 2008) establishing PUST as a public university for science and technology.',
  },
  {
    route: '/governance/regent-board',
    label: 'Regent Board',
    code: 'STATUTORY BODY · SECTION 18',
    heading: 'The Regent Board',
    subtitle:
      'Highest executive and policy-making governing authority responsible for statutes, university administration, property stewardship, and senior appointments.',
  },
  {
    route: '/governance/academic-council',
    label: 'Academic Council',
    code: 'STATUTORY BODY · SECTION 21',
    heading: 'The Academic Council',
    subtitle:
      'Principal academic body governing curricula, degree standards, faculties, examinations, research supervision, and departmental ordinances across 21 departments.',
  },
  {
    route: '/governance/finance-committee',
    label: 'Finance Committee',
    code: 'STATUTORY BODY · SECTION 24',
    heading: 'The Finance Committee',
    subtitle:
      'Statutory financial oversight body reviewing annual revenue and development budgets, UGC allocations, audit compliance, and capital infrastructure grants.',
  },
  {
    route: '/governance/academic-ordinance',
    label: 'Academic Ordinance',
    code: 'REGULATIONS · SEMESTER & GRADING',
    heading: 'Academic Ordinance & Examination Regulations',
    subtitle:
      'Uniform rules governing undergraduate and postgraduate credit systems, 4.00 grading scale, attendance eligibility, semester promotion, and degree conferral.',
  },
];

const REGENT_BOARD_MEMBERS = [
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
    designation: 'Senior Officials Nominated by the Ministry of Education & Ministry of Science and Technology',
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
];

const GRADING_ORDINANCE = [
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
];

export function GovernanceSection({ route, onNavigate }: GovernanceSectionProps) {
  const activeRoute =
    route === '/governance' || route === '/governance/pust-act'
      ? '/governance/university-act'
      : route;
  const activeTab =
    GOVERNANCE_TABS.find((t) => t.route === activeRoute) || GOVERNANCE_TABS[0];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-10">
      {/* Header + Sub-Navigation Bar */}
      <div className="border-b border-stone-200 pb-6 space-y-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-emerald-800">
            Statutory Governance · {activeTab.code}
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-slate-900 mt-1">
            {route === '/governance' ? 'University Governance & Statutory Framework' : activeTab.heading}
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed">
            {activeTab.subtitle}
          </p>
        </div>

        <nav aria-label="Governance sub-navigation" className="flex flex-wrap gap-1.5">
          {GOVERNANCE_TABS.map((tab) => {
            const isActive = activeRoute === tab.route;
            return (
              <Link
                key={tab.route}
                href={tab.route}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(tab.route);
                }}
                className={`px-3.5 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-emerald-800 text-white'
                    : 'bg-stone-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Content by Governance Sub-Page */}
      {activeRoute === '/governance/university-act' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7 space-y-5">
            <h2 className="font-serif text-2xl font-medium text-slate-900">
              Statutory Mandate Under the University Act (Act No. 43 of 2001)
            </h2>
            <p className="text-base leading-[1.8] text-slate-700">
              Pabna University of Science and Technology operates as a public statutory university
              under the Pabna University of Science and Technology Act, 2001 (Act No. 43 of 2001),
              passed by the Parliament of Bangladesh on 15 July 2001 and brought into force by
              Government Gazette notification on 12 October 2008. Under Section 3 of the Act, the
              university is constituted as a body corporate comprising the Chancellor,
              Vice-Chancellor, Treasurer, Regent Board, and Academic Council.
            </p>
            <div className="divide-y divide-stone-200 border border-stone-200 bg-[#FAF8F4]">
              {[
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
              ].map((item) => (
                <div key={item.clause} className="p-5 space-y-1.5">
                  <p className="font-mono text-xs font-semibold text-emerald-800">{item.clause}</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="lg:col-span-5 bg-[#FAF8F4] border border-stone-200 p-6 space-y-5">
            <p className="font-mono text-xs uppercase tracking-widest text-emerald-800">
              Official Bangladesh Laws Citation
            </p>
            <dl className="divide-y divide-stone-200 border-y border-stone-200 text-sm">
              <div className="py-3 flex justify-between gap-4">
                <dt className="text-slate-600">Enabling Legislation</dt>
                <dd className="font-mono font-medium text-slate-900">Act No. 43 of 2001</dd>
              </div>
              <div className="py-3 flex justify-between gap-4">
                <dt className="text-slate-600">Date Passed</dt>
                <dd className="font-mono font-medium text-slate-900">15 July 2001</dd>
              </div>
              <div className="py-3 flex justify-between gap-4">
                <dt className="text-slate-600">Gazette Effective Date</dt>
                <dd className="font-mono font-medium text-slate-900">12 October 2008</dd>
              </div>
              <div className="py-3 flex justify-between gap-4">
                <dt className="text-slate-600">Chancellor</dt>
                <dd className="font-medium text-slate-900 text-right">
                  Hon’ble President of Bangladesh
                </dd>
              </div>
              <div className="py-3 flex justify-between gap-4">
                <dt className="text-slate-600">Regulatory Liaison</dt>
                <dd className="font-medium text-slate-900 text-right">
                  UGC of Bangladesh
                </dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-3 pt-1">
              <a
                href="https://bdlaws.minlaw.gov.bd/act-details-872.html"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-emerald-800 text-white hover:bg-emerald-900 transition-colors"
              >
                Read Official Act (Laws of Bangladesh)
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <Link
                href="/governance/regent-board"
                className="px-4 py-2 text-xs font-medium border border-stone-300 bg-white text-slate-800 hover:border-emerald-800 hover:text-emerald-800 transition-colors"
              >
                Regent Board →
              </Link>
            </div>
          </aside>
        </div>
      )}

      {activeRoute === '/governance/regent-board' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 border border-stone-200 bg-white">
              <div className="px-5 py-4 border-b border-stone-200 bg-[#FAF8F4]">
                <h2 className="font-serif text-xl font-medium text-slate-900">
                  Composition of the Regent Board
                </h2>
              </div>
              <div className="divide-y divide-stone-200">
                {REGENT_BOARD_MEMBERS.map((m) => (
                  <div
                    key={m.designation}
                    className="px-5 py-4 grid grid-cols-1 sm:grid-cols-12 gap-2 items-baseline text-sm"
                  >
                    <p className="sm:col-span-4 font-mono text-xs font-semibold text-emerald-800">
                      {m.seat}
                    </p>
                    <p className="sm:col-span-6 text-slate-800">{m.designation}</p>
                    <p className="sm:col-span-2 sm:text-right font-mono text-xs text-slate-500">
                      {m.term}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 space-y-4 bg-[#FAF8F4] border border-stone-200 p-6">
              <h2 className="font-serif text-xl font-medium text-slate-900">
                Core Executive Functions
              </h2>
              <ul className="space-y-3 text-sm text-slate-700 leading-relaxed list-disc pl-5">
                <li>
                  Approves university statutes, administrative policies, and institutional budgets
                  submitted by the Finance Committee.
                </li>
                <li>
                  Ratifies decisions of the Academic Council regarding establishment of new
                  faculties, departments, institutes, and research centers.
                </li>
                <li>
                  Approves appointments of faculty members and Class-I administrative officers upon
                  recommendation of statutory Selection Boards.
                </li>
                <li>
                  Oversees university campus masterplans, residential halls, and Convocation
                  resolutions.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeRoute === '/governance/academic-council' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-5">
            <h2 className="font-serif text-2xl font-medium text-slate-900">
              Mandate &amp; Jurisdiction of the Academic Council
            </h2>
            <p className="text-base leading-[1.8] text-slate-700">
              Chaired by the Vice-Chancellor with the Registrar acting as Secretary, the Academic
              Council comprises the Pro-Vice-Chancellor, all Deans of the 5 Faculties, Chairmen of
              the 21 academic departments, senior professors, and external academic experts. It
              maintains the academic integrity of all undergraduate, postgraduate, and doctoral
              programs.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
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
              ].map((card) => (
                <div key={card.title} className="p-5 border border-stone-200 bg-[#FAF8F4] space-y-1.5">
                  <h3 className="font-serif text-lg font-medium text-slate-900">{card.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{card.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 border border-stone-200 bg-white p-6 space-y-4">
            <p className="font-mono text-xs uppercase tracking-widest text-emerald-800">
              Council Structure
            </p>
            <dl className="divide-y divide-stone-200 text-sm">
              <div className="py-3 flex justify-between">
                <dt className="text-slate-600">Chairperson</dt>
                <dd className="font-medium text-slate-900">Vice-Chancellor</dd>
              </div>
              <div className="py-3 flex justify-between">
                <dt className="text-slate-600">Faculties Represented</dt>
                <dd className="font-mono font-medium text-slate-900">5 Faculties</dd>
              </div>
              <div className="py-3 flex justify-between">
                <dt className="text-slate-600">Academic Departments</dt>
                <dd className="font-mono font-medium text-slate-900">21 Departments</dd>
              </div>
              <div className="py-3 flex justify-between">
                <dt className="text-slate-600">Member-Secretary</dt>
                <dd className="font-medium text-slate-900">Registrar</dd>
              </div>
            </dl>
            <Link
              href="/academics/deans"
              className="inline-block text-xs font-semibold text-emerald-800 hover:underline"
            >
              View All Faculty Deans &amp; Chairmen →
            </Link>
          </div>
        </div>
      )}

      {activeRoute === '/governance/finance-committee' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-5">
            <h2 className="font-serif text-2xl font-medium text-slate-900">
              Financial Stewardship &amp; Audit Oversight
            </h2>
            <p className="text-base leading-[1.8] text-slate-700">
              Constituted under Section 24 of the PUST Act, the Finance Committee advises the Regent
              Board on all fiscal matters of the university—ensuring transparent allocation of UGC
              recurring grants, development project funds, residential hall revenues, and student
              welfare endowments.
            </p>
            <div className="divide-y divide-stone-200 border border-stone-200 bg-white">
              {[
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
              ].map((item) => (
                <div key={item.scope} className="p-5 space-y-1">
                  <p className="font-serif text-lg font-medium text-slate-900">{item.scope}</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 bg-[#FAF8F4] border border-stone-200 p-6 space-y-4">
            <p className="font-mono text-xs uppercase tracking-widest text-emerald-800">
              Committee Leadership
            </p>
            <dl className="divide-y divide-stone-200 text-sm">
              <div className="py-3 flex justify-between">
                <dt className="text-slate-600">Chair / Convener</dt>
                <dd className="font-medium text-slate-900">Treasurer / Vice-Chancellor</dd>
              </div>
              <div className="py-3 flex justify-between">
                <dt className="text-slate-600">Fiscal Cycle</dt>
                <dd className="font-mono font-medium text-slate-900">July 01 – June 30</dd>
              </div>
              <div className="py-3 flex justify-between">
                <dt className="text-slate-600">Accounts Administration</dt>
                <dd className="font-medium text-slate-900">Office of the Treasurer</dd>
              </div>
              <div className="py-3 flex justify-between">
                <dt className="text-slate-600">Procurement Framework</dt>
                <dd className="font-mono font-medium text-slate-900">e-GP &amp; PPR Rules</dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {activeRoute === '/governance/academic-ordinance' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-6 space-y-4">
              <h2 className="font-serif text-2xl font-medium text-slate-900">
                Unified 4.00 Grading Scale &amp; Credit Rules
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                All undergraduate and postgraduate degree programs at PUST follow the UGC-aligned
                bi-semester credit-hour system. Students must maintain minimum attendance, clear
                all Residential Hall dues prior to examination form fill-up, and earn passing grade
                points in all required courses.
              </p>

              <div className="divide-y divide-stone-200 border border-stone-200 bg-[#FAF8F4] text-sm">
                <div className="p-4 flex justify-between gap-4">
                  <span className="text-slate-600">Standard Undergraduate Duration</span>
                  <span className="font-mono font-medium text-slate-900">
                    4 Years · 8 Semesters (5 Yrs / 10 Sem for B.Arch.)
                  </span>
                </div>
                <div className="p-4 flex justify-between gap-4">
                  <span className="text-slate-600">Minimum Attendance Requirement</span>
                  <span className="font-mono font-medium text-slate-900">75% (Non-collegiate 60%–74%)</span>
                </div>
                <div className="p-4 flex justify-between gap-4">
                  <span className="text-slate-600">Minimum Passing SGPA / CGPA</span>
                  <span className="font-mono font-medium text-slate-900">2.00 (Degree Conferral)</span>
                </div>
                <div className="p-4 flex justify-between gap-4">
                  <span className="text-slate-600">Exam Clearance Gate</span>
                  <span className="font-medium text-emerald-800 text-right">
                    Hall Dues Clearance Required Before Admit Card
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 border border-stone-200 bg-white">
              <div className="px-5 py-3.5 border-b border-stone-200 bg-[#FAF8F4]">
                <h3 className="font-serif text-lg font-medium text-slate-900">
                  PUST Official Letter Grade &amp; Grade Point Table
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="border-b border-stone-200 bg-stone-50 font-mono text-xs text-slate-600">
                    <tr>
                      <th className="px-4 py-2.5">Numerical Marks</th>
                      <th className="px-4 py-2.5">Letter Grade</th>
                      <th className="px-4 py-2.5">Grade Point</th>
                      <th className="px-4 py-2.5">Assessment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {GRADING_ORDINANCE.map((row) => (
                      <tr key={row.letter}>
                        <td className="px-4 py-2 font-mono tabular-nums text-slate-700">
                          {row.range}
                        </td>
                        <td className="px-4 py-2 font-mono font-semibold text-emerald-800">
                          {row.letter}
                        </td>
                        <td className="px-4 py-2 font-mono tabular-nums text-slate-900">
                          {row.gp}
                        </td>
                        <td className="px-4 py-2 text-slate-600">{row.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
