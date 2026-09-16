import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ variable: '--font-sans', subsets: ['latin'] });
const jetbrainsMono = JetBrains_Mono({ variable: '--font-mono', subsets: ['latin'] });

import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'AssanPay API Console & Testing Workspace',
  description: 'Internal API Testing, Debugging & Support Workspace for AssanPay',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
