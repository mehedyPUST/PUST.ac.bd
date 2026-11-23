import type { AppRoute } from '../lib/routes';

interface FooterProps {
  onNavigate: (route: AppRoute) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8">
        {/* About PUST */}
        <div className="lg:col-span-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
            About PUST
          </p>
          <h2 className="font-serif text-lg font-medium text-white">
            Pabna University of Science and Technology
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Established in 2008 by the Government of Bangladesh in Rajapur, Pabna-6600. Advancing
            applied engineering, scientific research, and regional higher education across 5
            faculties and 21 academic departments.
          </p>
          <div className="pt-2 flex flex-wrap gap-4 text-xs text-slate-400">
            <a
              href="https://pust.ac.bd/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-400 transition-colors"
            >
              Official Portal
            </a>
            <a
              href="https://www.facebook.com/pust.ac.bd"
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-400 transition-colors"
            >
              Facebook
            </a>
            <a
              href="https://www.youtube.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-400 transition-colors"
            >
              YouTube
            </a>
            <a
              href="https://www.linkedin.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-400 transition-colors"
            >
              LinkedIn
            </a>
          </div>
        </div>

        {/* Quick Links & Academic */}
        <div className="lg:col-span-2 space-y-2 text-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-2">
            Quick Links
          </p>
          <ul className="space-y-1.5 text-xs sm:text-sm">
            {[
              { label: 'Our University', route: '/about/our-university' as AppRoute },
              { label: 'History', route: '/about/history' as AppRoute },
              { label: 'Mission & Plans', route: '/about/mission-vision' as AppRoute },
              { label: 'Notice Board', route: '/notices' as AppRoute },
              { label: 'Photo & Video Gallery', route: '/gallery' as AppRoute },
              { label: 'Admission Desk', route: '/admissions' as AppRoute },
            ].map((item) => (
              <li key={item.route}>
                <button
                  type="button"
                  onClick={() => onNavigate(item.route)}
                  className="text-slate-300 hover:text-white transition-colors cursor-pointer text-left"
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Administration */}
        <div className="lg:col-span-2 space-y-2 text-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-2">
            Administration
          </p>
          <ul className="space-y-1.5 text-xs sm:text-sm">
            {[
              { label: 'VC Office', route: '/administration/vc-office' as AppRoute },
              { label: 'Pro-VC Office', route: '/administration/pro-vc-office' as AppRoute },
              { label: 'Registrar Office', route: '/administration/registrar-office' as AppRoute },
              { label: 'Proctor Office', route: '/administration/proctor-office' as AppRoute },
              { label: 'ICT Cell', route: '/administration/ict-cell' as AppRoute },
              { label: 'APA & Governance', route: '/administration/apa' as AppRoute },
            ].map((item) => (
              <li key={item.route}>
                <button
                  type="button"
                  onClick={() => onNavigate(item.route)}
                  className="text-slate-300 hover:text-white transition-colors cursor-pointer text-left"
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Academic & Student Services */}
        <div className="lg:col-span-2 space-y-2 text-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-2">
            Academic &amp; Services
          </p>
          <ul className="space-y-1.5 text-xs sm:text-sm">
            {[
              { label: '21 Departments', route: '/academics/departments' as AppRoute },
              { label: 'Academic Calendar', route: '/academics/calendar' as AppRoute },
              { label: 'Forms Download', route: '/academics/forms-download' as AppRoute },
              { label: 'Central Library', route: '/facilities/library' as AppRoute },
              { label: 'Residence & Halls', route: '/facilities/residence' as AppRoute },
              { label: 'Campus Portal', route: '/portal' as AppRoute },
            ].map((item) => (
              <li key={item.route}>
                <button
                  type="button"
                  onClick={() => onNavigate(item.route)}
                  className="text-slate-300 hover:text-white transition-colors cursor-pointer text-left"
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Information */}
        <div className="lg:col-span-2 space-y-2 text-xs text-slate-400">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-2">
            Contact
          </p>
          <p className="leading-relaxed text-slate-300">
            Rajapur, Pabna-6600, Bangladesh
            <br />
            Dhaka–Pabna Highway, 3 km east of Pabna town
          </p>
          <p className="font-mono pt-1">
            VC: +8802588842379
            <br />
            vc@pust.ac.bd
          </p>
          <p className="font-mono">
            Registrar: +8802588845193
            <br />
            registrar@pust.ac.bd
          </p>
        </div>
      </div>

      <div className="border-t border-slate-800 bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <p>© 2026 Pabna University of Science and Technology (PUST). All rights reserved.</p>
          <p className="font-mono">First Convocation: 15 March 2027 · Rajapur Campus</p>
        </div>
      </div>
    </footer>
  );
}
