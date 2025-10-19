
import './globals.css';
import { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import Navbar from './components/NavBar';
import Footer from './components/Footer';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from './components/AuthProvide';




export const metadata = {
  title: 'Heal E-Health System',
  description: 'A healthcare PWA for Malawi',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
        <Navbar />
          <main className="min-h-screen bg-white">{children}</main>
          <Toaster richColors position="top-right" />
        <Footer/>
        </AuthProvider>
      </body>
    </html>
  );
}
