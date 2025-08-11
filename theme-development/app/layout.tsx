import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'
import '../styles/themes/comic-book.css'
import '../styles/themes/star-trek.css'
import { ThemeProvider } from '../components/shared/ThemeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Dynamic Theme System - Comic Book & Star Trek',
  description: 'A showcase of dynamic theme switching with comic book and Star Trek themes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
