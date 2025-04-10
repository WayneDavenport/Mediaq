import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/SessionProvider";
import NavBar from '@/components/navigation/NavBar'
/* import { ToasterProvider } from '@/components/providers/toaster-provider'; */
import { ThemeProvider } from "@/components/theme-provider"
import PointerEventsHandler from "@/components/PointerEventsHandler";
import { PageTracker } from 'react-page-tracker';




const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL('https://www.mediaq.io'),
  title: {
    default: 'MediaQ - Track Your Media Consumption',
    template: '%s | MediaQ'
  },
  description: 'MediaQ helps you track books, movies, TV shows, and games you consume. Create your personal media library and discover new content.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.mediaq.io',
    siteName: 'MediaQ',
    title: 'MediaQ - Track Your Media Consumption',
    description: 'Track your books, movies, TV shows, and games. Create your personal media library.',
    images: [
      {
        url: 'https://www.mediaq.io/og-image.png', // Create this image
        width: 1200,
        height: 630,
        alt: 'MediaQ'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MediaQ - Track Your Media Consumption',
    description: 'Track your books, movies, TV shows, and games. Create your personal media library.',
    images: ['https://www.mediaq.io/og-image.png'] // Same as OG image
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-video-preview': -1,
      'max-snippet': -1
    }
  },
  alternates: {
    canonical: 'https://www.mediaq.io',
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // Changed from 1 to 5 for accessibility
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name='impact-site-verification' value='c5968420-4242-4be1-831d-0cf027548400' />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ pointerEvents: 'auto' }}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>

            <PointerEventsHandler />
            <PageTracker />
            <NavBar />
            {children}
            {/* <ToasterProvider /> */}

          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
