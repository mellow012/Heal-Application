
import './globals.css';
import { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import Navbar from './components/NavBar';
import Footer from './components/Footer';
import { Toaster } from '@/components/ui/sonner';


export const metadata = {
  title: 'Heal E-Health System',
  description: 'A healthcare PWA for Malawi',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
    <html lang="en">
      <body>
        <Navbar />
          <main className="min-h-screen bg-white">{children}</main>
          <Toaster richColors position="top-right" />
        <Footer/>
      </body>
    </html>
    </ClerkProvider>
  );
}
