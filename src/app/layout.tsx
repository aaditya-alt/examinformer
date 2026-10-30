import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { BRANDING } from '@/lib/branding';

export const metadata: Metadata = {
  title: `${BRANDING.name} — CBT Mocks, Answer Key Parser & Rank Calculator`,
  description: 'Evaluate SSC & Railway answer keys with instant marks, All-India ranks, shift analysis, and practice real-time CBT mock tests.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#080d19] text-slate-900 dark:text-slate-100 antialiased selection:bg-blue-500 selection:text-white">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
