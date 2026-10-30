import type { Metadata } from 'next';
import 'katex/dist/katex.min.css';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { TelegramPopup } from '@/components/TelegramPopup';
import { BRANDING } from '@/lib/branding';
import { AuthProvider } from '@/components/auth/AuthContext';
import { AuthModal } from '@/components/auth/AuthModal';

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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const saved = localStorage.getItem('theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (saved === 'dark' || (!saved && prefersDark)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 antialiased selection:bg-blue-500 selection:text-white">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <AuthModal />
          <TelegramPopup />
        </AuthProvider>
      </body>
    </html>
  );
}
