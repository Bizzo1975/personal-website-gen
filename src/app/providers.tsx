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
  // Initialize axe-core for accessibility testing in development mode
  // useEffect(() => {
  //   if (process.env.NODE_ENV !== 'production') {
  //     import('@/lib/axe-helper').then(axeHelper => {
  //       axeHelper.initializeAxe();
  //     });
  //   }
  // }, []);

  return (
    <SessionProvider>
      <NextThemesProvider 
        attribute="class" 
        defaultTheme="dark" 
        enableSystem={false}
        disableTransitionOnChange
      >
        <PageTransition mode="fade">
          {children}
        </PageTransition>
      </NextThemesProvider>
    </SessionProvider>
  );
}