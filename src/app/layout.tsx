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
  title: `${BRANDING.fullName} — Online Mock Test Platform & Answer Key Rank Calculator`,
  description: 'Practice 100% genuine SSC & Railway CBT mock tests, calculate instant marks & All-India Shift Ranks from official answer key links.',
  icons: {
    icon: '/images/mockyoddha-logo.jpg',
    apple: '/images/mockyoddha-logo.jpg'
  }
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
