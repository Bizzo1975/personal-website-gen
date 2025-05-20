'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import PageTransition from '@/components/PageTransition';

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
        <PageTransition mode="fade">
          {children}
        </PageTransition>
      </NextThemesProvider>
    </SessionProvider>
  );
}