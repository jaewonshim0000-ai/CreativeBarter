import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/hooks/useAuth';
import { Navbar } from '@/components/layout/Navbar';
import { ScrollRevealProvider } from '@/components/ui/ScrollReveal';

export const metadata: Metadata = {
  title: 'Nuvra',
  description: 'Hyperlocal skill & resource bartering for creatives',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-surface-950 text-stone-200 min-h-screen">
        <AuthProvider>
          <ScrollRevealProvider />
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
