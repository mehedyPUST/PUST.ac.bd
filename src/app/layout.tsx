import type { Metadata, Viewport } from 'next';
import { Fraunces, JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import type { ReactNode } from 'react';
import { PustShell } from '../components/PustContext';
import {
  SEED_ABOUT_SECTIONS,
  SEED_BANNER_SLIDES,
  SEED_DEPARTMENTS,
  SEED_GALLERY_ITEMS,
  SEED_NOTICES,
  SEED_PUBLICATIONS,
  SEED_UNIVERSITY_PROFILE,
  SEED_VC_PROFILES,
} from '../../server/seedData';
import 'react-loading-skeleton/dist/skeleton.css';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jakarta',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#520000',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Pabna University of Science and Technology (PUST)',
  description:
    'Modern academic and institutional portal for Pabna University of Science and Technology (PUST), Rajapur, Pabna, featuring 5 faculties, 21 departments, notices, research showcase, admissions, and JWT cookie-based portal.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PUST',
  },
  openGraph: {
    title: 'Pabna University of Science and Technology (PUST)',
    description:
      'Modern academic and institutional portal for Pabna University of Science and Technology (PUST), Rajapur, Pabna.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
  icons: {
    icon: [
      { url: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: '/favicon.ico',
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const initialPublicNotices = SEED_NOTICES.filter((n) => n.visibility === 'public').sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
    return b.publishedAt.localeCompare(a.publishedAt);
  });

  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-[#FAF8F4] text-slate-900 antialiased selection:bg-pust-800 selection:text-white">
        <PustShell
          initialData={{
            profile: SEED_UNIVERSITY_PROFILE,
            aboutSections: SEED_ABOUT_SECTIONS,
            vcProfiles: [...SEED_VC_PROFILES].sort((a, b) => b.orderIndex - a.orderIndex),
            galleryItems: [...SEED_GALLERY_ITEMS]
              .filter((g) => (g.visibility || 'public') === 'public')
              .sort((a, b) => b.eventDate.localeCompare(a.eventDate)),
            bannerSlides: [...SEED_BANNER_SLIDES].sort((a, b) => a.orderIndex - b.orderIndex),
            departments: SEED_DEPARTMENTS,
            publications: SEED_PUBLICATIONS,
            notices: initialPublicNotices,
          }}
        >
          {children}
        </PustShell>
      </body>
    </html>
  );
}
