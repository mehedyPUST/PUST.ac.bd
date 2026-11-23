import type { Metadata } from 'next';
import { Fraunces, JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import type { ReactNode } from 'react';
import { PustShell } from '../components/PustContext';
import 'animate.css';
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

export const metadata: Metadata = {
  title: 'Pabna University of Science and Technology (PUST)',
  description:
    'Modern academic and institutional portal for Pabna University of Science and Technology (PUST), Rajapur, Pabna, featuring 5 faculties, 21 departments, notices, research showcase, admissions, and JWT cookie-based portal.',
  openGraph: {
    title: 'Pabna University of Science and Technology (PUST)',
    description:
      'Modern academic and institutional portal for Pabna University of Science and Technology (PUST), Rajapur, Pabna.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-[#FAF8F4] text-slate-900 antialiased selection:bg-pust-800 selection:text-white">
        <PustShell>{children}</PustShell>
      </body>
    </html>
  );
}
