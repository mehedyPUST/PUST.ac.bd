import type { Metadata, Viewport } from 'next';
import { Fraunces, JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import type { ReactNode } from 'react';
import { PustShell, type PustInitialData } from '../components/PustContext';
import { pustRepo } from '../../server/db';
import 'react-loading-skeleton/dist/skeleton.css';
import './globals.css';

export const dynamic = 'force-dynamic';

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
  themeColor: '#5B0A0E',
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

async function loadInitialPublicData(): Promise<PustInitialData | undefined> {
  try {
    await pustRepo.init();
    const [
      profile,
      aboutSections,
      vcProfiles,
      rawGalleryItems,
      bannerSlides,
      departments,
      publications,
      notices,
    ] = await Promise.all([
      pustRepo.getUniversityProfile(),
      pustRepo.listAboutSections(),
      pustRepo.listViceChancellors(),
      pustRepo.listGalleryItems(),
      pustRepo.listBannerSlides(),
      pustRepo.listDepartments(),
      pustRepo.listPublications(),
      pustRepo.listNotices({ isAuthenticated: false }),
    ]);

    const departmentSummaries = departments.map((dept) => ({
      id: dept.id,
      code: dept.code,
      officialCode: dept.officialCode,
      name: dept.name,
      faculty: dept.faculty,
      established: dept.established,
      degrees: dept.degrees,
      intakeSeats: dept.intakeSeats,
      facultyCount: dept.facultyCount,
      building: dept.building,
      chairmanName: dept.chairmanName,
      contactPhone: dept.contactPhone,
      contactEmail: dept.contactEmail,
      summary: dept.summary,
      researchFocus: dept.researchFocus,
      laboratories: dept.laboratories,
      researchTotal: dept.researchTotal,
    }));

    return {
      profile,
      aboutSections,
      vcProfiles,
      galleryItems: rawGalleryItems.filter((g) => (g.visibility || 'public') === 'public'),
      bannerSlides,
      departments: departmentSummaries,
      publications,
      notices,
    };
  } catch {
    return undefined;
  }
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const initialData = await loadInitialPublicData();

  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-[#F8F7F4] text-ink-900 antialiased selection:bg-pust-700 selection:text-white">
        <PustShell initialData={initialData}>{children}</PustShell>
      </body>
    </html>
  );
}
