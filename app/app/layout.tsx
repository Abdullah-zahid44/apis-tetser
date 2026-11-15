import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ variable: '--font-sans', subsets: ['latin'], display: 'swap' });
const jetbrainsMono = JetBrains_Mono({ variable: '--font-mono', subsets: ['latin'], display: 'swap' });

import { Providers } from '@/components/providers';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  interactiveWidget: 'resizes-content',
};

export const metadata: Metadata = {
  title: 'AsaanPay Console — API Testing Workspace',
  description: 'Internal API testing, debugging and support workspace for AsaanPay engineering.',
  manifest: '/manifest.webmanifest',
  applicationName: 'AsaanPay Developer Console',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'AsaanPay' },
  icons: {
    icon: [
      { url: '/icons/asaanpay-app-v2-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/asaanpay-app-v2-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/icons/asaanpay-app-v2-192.png',
    apple: [{ url: '/icons/apple-touch-icon-v2.png', sizes: '180x180', type: 'image/png' }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground min-h-screen selection:bg-primary/25 selection:text-foreground`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
