'use client';

import Link from 'next/link';
import { formatFooterDescription, resolveUniversityContent } from '../lib/cmsDefaults';
import type { AppRoute } from '../lib/routes';
import { EditTriggerButton } from './EditTriggerButton';
import { MotionReveal } from './MotionPrimitives';
import { usePust } from './PustContext';
import { PustCrest } from './PustCrest';
import { PwaInstallButton } from './PwaManager';

interface FooterProps {
  onNavigate?: (route: AppRoute | string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const { profile, loadingData } = usePust();
  const { footerConfig } = resolveUniversityContent(profile);
  const resolvedDescription = profile
    ? formatFooterDescription(
        footerConfig.description,
        profile.facultiesCount,
        profile.departmentsCount
      )
    : '';

  const hasCareerLink = [
    ...footerConfig.quickLinks,
    ...footerConfig.governanceLinks,
    ...footerConfig.serviceLinks,
  ].some((item) => item.route === '/career');

  const resolvedQuickLinks = hasCareerLink
    ? footerConfig.quickLinks
    : [...footerConfig.quickLinks, { label: 'Career', route: '/career' }];

  function handleLinkClick(
    e: React.MouseEvent<HTMLAnchorElement>,
    target: string
  ) {
    if (
      !onNavigate ||
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    ) {
      return;
    }
    e.preventDefault();
    onNavigate(target);
  }

  return (
    <footer
      id="footer"
      className="editable-region bg-gradient-to-b from-[#48070B] via-[#340407] to-[#210204] text-stone-100 border-t border-gold-500/40 print:hidden"
    >
      <MotionReveal distance={18} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8">
        {/* About PUST */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center gap-3">
            <PustCrest size={42} variant="light" className="shrink-0" />
            <div>
              {profile && (
                <p className="text-xs font-semibold uppercase tracking-widest text-gold-300">
                  {footerConfig.tagline}
                </p>
              )}
              <h2 className="font-serif text-fluid-h3 font-medium text-white">
                Pabna University of Science and Technology
              </h2>
            </div>
          </div>
          {profile ? (
            <p className="text-sm text-slate-200 leading-relaxed text-left">{resolvedDescription}</p>
          ) : loadingData ? (
            <div className="space-y-2 py-1">
              <div className="h-3 w-5/6 rounded bg-white/10 animate-pulse" />
              <div className="h-3 w-2/3 rounded bg-white/10 animate-pulse" />
            </div>
          ) : null}
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
          {profile && footerConfig.socialLinks.length > 0 && (
            <div className="pt-2 flex flex-wrap gap-4 text-xs text-slate-200">
              {footerConfig.socialLinks.map((social) => (
                <a
                  key={`${social.label}-${social.url}`}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-gold-300 hover:underline underline-offset-4 transition-colors"
                >
                  {social.label}
                </a>
              ))}
            </div>
          )}
          <div className="pt-2">
            <PwaInstallButton variant="footer" allowGuideFallback />
          </div>
        </div>

        {/* Quick Links & About */}
        <div className="lg:col-span-2 space-y-2 text-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-300 mb-2">
            Quick Links
          </p>
          <ul className="space-y-1.5 text-xs sm:text-sm">
            {resolvedQuickLinks.map((item) => (
              <li key={`${item.route}-${item.label}`}>
                <Link
                  href={item.route}
                  onClick={(e) => handleLinkClick(e, item.route)}
                  className="text-slate-200 hover:text-white hover:underline underline-offset-4 transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Administration & Governance */}
        <div className="lg:col-span-2 space-y-2 text-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-300 mb-2">
            Governance &amp; Admin
          </p>
          <ul className="space-y-1.5 text-xs sm:text-sm">
            {footerConfig.governanceLinks.map((item) => (
              <li key={`${item.route}-${item.label}`}>
                <Link
                  href={item.route}
                  onClick={(e) => handleLinkClick(e, item.route)}
                  className="text-slate-200 hover:text-white hover:underline underline-offset-4 transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Academic & Student Services */}
        <div className="lg:col-span-2 space-y-2 text-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-300 mb-2">
            Digital Services
          </p>
          <ul className="space-y-1.5 text-xs sm:text-sm">
            {footerConfig.serviceLinks.map((item) => (
              <li key={`${item.route}-${item.label}`}>
                <Link
                  href={item.route}
                  onClick={(e) => handleLinkClick(e, item.route)}
                  className="text-slate-200 hover:text-white hover:underline underline-offset-4 transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Information */}
        <div className="lg:col-span-2 space-y-2 text-xs text-slate-200">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-300 mb-2">
            Contact
          </p>
          {profile ? (
            <>
              <p className="leading-relaxed text-slate-200 text-left">
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
                  className={`font-mono tabular-nums text-left ${idx === 0 ? 'pt-1' : ''}`}
                >
                  {c.label}:{' '}
                  <a
                    href={`tel:${c.phone.replace(/\s+/g, '')}`}
                    className="hover:text-gold-300 transition-colors"
                  >
                    {c.phone}
                  </a>
                  <br />
                  <a
                    href={`mailto:${c.email}`}
                    className="hover:text-gold-300 underline decoration-slate-400 hover:decoration-gold-300 transition-colors break-all"
                  >
                    {c.email}
                  </a>
                </p>
              ))}
            </>
          ) : (
            <p className="text-slate-300 text-left">
              {loadingData ? 'Loading directory contacts...' : 'Contact directory unavailable.'}
            </p>
          )}
        </div>
      </MotionReveal>

      <div className="border-t border-white/10 bg-[#1B0203]/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-200">
          <p className="text-center sm:text-left">
            {profile ? footerConfig.copyrightText : 'Pabna University of Science and Technology'}
          </p>
          {profile?.convocationDate && (
            <p className="font-mono tabular-nums">
              First Convocation: {profile.convocationDate} · Rajapur Campus
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
