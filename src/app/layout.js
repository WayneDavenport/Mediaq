import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/SessionProvider";
import NavBar from '@/components/navigation/NavBar'
import { Toaster } from 'sonner';
import { ThemeProvider } from "@/components/theme-provider"


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: 'MediaQ',
  description: 'Track your media consumption',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name='impact-site-verification' value='c5968420-4242-4be1-831d-0cf027548400' />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <NavBar />
            {children}
          </AuthProvider>
        </ThemeProvider>
        {/* Desktop Toaster */}
        <div className="hidden sm:block">
          <Toaster />
        </div>
        {/* Mobile Toaster */}
        <div className="block sm:hidden">
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                maxWidth: '90vw',
                top: '30%',
                transform: 'translateY(-30%)',
              },
            }}
            closeButton
          />
        </div>
      </body>
    </html>
  );
}
