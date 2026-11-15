import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'AsaanPay Developer Console',
    short_name: 'AsaanPay',
    description: 'AsaanPay API testing workspace.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#e79543',
    icons: [
      { src: '/icons/asaanpay-app-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/asaanpay-app-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/asaanpay-app-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
