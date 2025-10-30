import { ReactNode } from 'react';
import '@/styles/globals.css';
import Providers from './providers';
import PerformanceMonitor from '@/components/PerformanceMonitor';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'light') {
                  document.documentElement.classList.remove('dark')
                } else {
                  document.documentElement.classList.add('dark')
                }
              } catch (_) {
                document.documentElement.classList.add('dark')
              }
            `,
          }}
        />
      </head>
      <body>
        <Providers>
          <PerformanceMonitor 
            enabled={true}
            reportToAnalytics={process.env.NODE_ENV === 'production'}
            showDebugInfo={process.env.NODE_ENV === 'development'}
          />
          {children}
        </Providers>
      </body>
    </html>
  );
}
