import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'AssanPay Developer Console',
    short_name: 'AssanPay',
    description: 'AssanPay sandbox API testing workspace.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#faf7f1',
    theme_color: '#b45309',
    icons: [
      { src: '/pwa-icon/192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icon/512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icon/512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
