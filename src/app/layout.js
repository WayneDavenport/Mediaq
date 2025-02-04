import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/SessionProvider";
import NavBar from '@/components/navigation/NavBar'
import { Toaster } from 'sonner';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Mediaq",
  description: "Elevated Media Consumption",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <NavBar />
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
