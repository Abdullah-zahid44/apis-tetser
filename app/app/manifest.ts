import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'AssanPay Developer Console',
    short_name: 'AssanPay',
    description: 'AssanPay API testing workspace.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#e79543',
    icons: [
      { src: '/icons/asaanpay-app-v2-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/asaanpay-app-v2-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/asaanpay-app-v2-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
