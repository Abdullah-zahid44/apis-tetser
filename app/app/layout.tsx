import type { Metadata } from 'next';
import { Manrope, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const manrope = Manrope({ variable: '--font-sans', subsets: ['latin'], display: 'swap' });
const spaceGrotesk = Space_Grotesk({ variable: '--font-display', subsets: ['latin'], display: 'swap' });
const jetbrainsMono = JetBrains_Mono({ variable: '--font-mono', subsets: ['latin'], display: 'swap' });

import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'AssanPay Console — API Testing Workspace',
  description: 'Internal API testing, debugging and support workspace for AssanPay engineering.',
  manifest: '/manifest.webmanifest',
  applicationName: 'AssanPay Developer Console',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'AssanPay' },
  icons: { apple: [{ url: '/pwa-icon/192', sizes: '192x192', type: 'image/png' }] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
