import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import '@fontsource/inter';
import '@fontsource/jetbrains-mono';
import { ThemeProvider } from '@/components/ThemeProvider';
import Providers from './providers';
import SkipToContent from '@/components/SkipToContent';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'John Doe | Developer Portfolio',
  description: 'Personal website, portfolio and blog of John Doe - Full Stack Developer',
  icons: {
    icon: [
      { url: '/images/wizard-icon.svg' },
      { url: '/images/wizard-logo.svg', type: 'image/svg+xml' }
    ],
    apple: '/images/wizard-logo.svg',
    other: {
      rel: 'mask-icon',
      url: '/images/wizard-logo.svg',
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-tech-light dark:bg-tech-dark text-slate-800 dark:text-slate-200 min-h-screen flex flex-col antialiased`}>
        <div className="fixed inset-0 bg-[url('/grid-light.svg')] bg-center dark:bg-[url('/grid-dark.svg')] dark:opacity-20 opacity-10 pointer-events-none z-0"></div>
        <ThemeProvider>
          <Providers>
            <div className="relative z-10 flex flex-col min-h-screen">
              <SkipToContent />
              {children}
            </div>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
} 