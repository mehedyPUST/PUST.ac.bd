import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Pabna University of Science and Technology',
    short_name: 'PUST',
    description:
      'Official academic portal, digital campus services, notices, research showcase, and admissions for Pabna University of Science and Technology (PUST).',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    theme_color: '#520000',
    background_color: '#FAF8F4',
    categories: ['education', 'productivity', 'reference'],
    icons: [
      {
        src: '/pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Campus Portal',
        short_name: 'Portal',
        description: 'Open PUST Digital Campus Portal',
        url: '/portal',
        icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'Notice Board',
        short_name: 'Notices',
        description: 'View official university circulars and notices',
        url: '/notices',
        icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'Departments',
        short_name: 'Academics',
        description: 'Explore 5 faculties and 21 academic departments',
        url: '/academics/departments',
        icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'Verify Document',
        short_name: 'Verify',
        description: 'Verify admit cards, clearances, and certificates',
        url: '/verify',
        icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
      },
    ],
  };
}
