'use client';

import Link from 'next/link';
import { formatFooterDescription, resolveUniversityContent } from '../lib/cmsDefaults';
import type { AppRoute } from '../lib/routes';
import { EditTriggerButton } from './EditTriggerButton';
import { usePust } from './PustContext';
import { PustCrest } from './PustCrest';

interface FooterProps {
  onNavigate?: (route: AppRoute | string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const { profile } = usePust();
  const { footerConfig } = resolveUniversityContent(profile);
  const resolvedDescription = formatFooterDescription(
    footerConfig.description,
    profile?.facultiesCount ?? 5,
    profile?.departmentsCount ?? 21
  );

  return (
    <footer
      id="footer"
      className="editable-region bg-[#210707] text-slate-200 border-t border-pust-900 print:hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8">
        {/* About PUST */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center gap-3">
            <PustCrest size={42} variant="light" className="shrink-0" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-300">
                {footerConfig.tagline}
              </p>
              <h2 className="font-serif text-lg font-medium text-white">
                Pabna University of Science and Technology
              </h2>
            </div>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{resolvedDescription}</p>
          <div className="pt-1 flex flex-wrap items-center gap-2 empty:hidden">
            <EditTriggerButton
              target={{ kind: 'hero-profile' }}
              label="Edit University Stats"
              variant="dark"
            />
            <EditTriggerButton
              target={{ kind: 'footer-config' }}
              label="Edit Footer & Contact"
              variant="dark"
            />
          </div>
          <div className="pt-2 flex flex-wrap gap-4 text-xs text-slate-300">
            {footerConfig.socialLinks.map((social) => (
              <a
                key={`${social.label}-${social.url}`}
                href={social.url}
                target="_blank"
                rel="noreferrer"
                className="hover:text-amber-300 transition-colors"
              >
                {social.label}
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links & About */}
        <div className="lg:col-span-2 space-y-2 text-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-300 mb-2">
            Quick Links
          </p>
          <ul className="space-y-1.5 text-xs sm:text-sm">
            {footerConfig.quickLinks.map((item) => (
              <li key={`${item.route}-${item.label}`}>
                <Link
                  href={item.route}
                  onClick={() => onNavigate?.(item.route)}
                  className="text-slate-300 hover:text-white transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Administration & Governance */}
        <div className="lg:col-span-2 space-y-2 text-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-300 mb-2">
            Governance &amp; Admin
          </p>
          <ul className="space-y-1.5 text-xs sm:text-sm">
            {footerConfig.governanceLinks.map((item) => (
              <li key={`${item.route}-${item.label}`}>
                <Link
                  href={item.route}
                  onClick={() => onNavigate?.(item.route)}
                  className="text-slate-300 hover:text-white transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Academic & Student Services */}
        <div className="lg:col-span-2 space-y-2 text-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-300 mb-2">
            Digital Services
          </p>
          <ul className="space-y-1.5 text-xs sm:text-sm">
            {footerConfig.serviceLinks.map((item) => (
              <li key={`${item.route}-${item.label}`}>
                <Link
                  href={item.route}
                  onClick={() => onNavigate?.(item.route)}
                  className="text-slate-300 hover:text-white transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Information */}
        <div className="lg:col-span-2 space-y-2 text-xs text-slate-300">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-300 mb-2">
            Contact
          </p>
          <p className="leading-relaxed text-slate-300">
            {footerConfig.addressLines.map((line, idx) => (
              <span key={`${line}-${idx}`}>
                {idx > 0 && <br />}
                {line}
              </span>
            ))}
          </p>
          {footerConfig.contacts.map((c, idx) => (
            <p
              key={`${c.label}-${idx}`}
              className={`font-mono tabular-nums ${idx === 0 ? 'pt-1' : ''}`}
            >
              {c.label}: {c.phone}
              <br />
              {c.email}
            </p>
          ))}
        </div>
      </div>

      <div className="border-t border-pust-900 bg-black/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-300">
          <p>{footerConfig.copyrightText}</p>
          <p className="font-mono tabular-nums">
            First Convocation: {profile?.convocationDate ?? '15 March 2027'} · Rajapur Campus
          </p>
        </div>
      </div>
    </footer>
  );
}
