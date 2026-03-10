import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/hooks/useAuth';
import { Navbar } from '@/components/layout/Navbar';

export const metadata: Metadata = {
  title: 'Creative Barter Network',
  description: 'Hyperlocal skill & resource bartering for creatives',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-surface-50 text-surface-900 min-h-screen">
        <AuthProvider>
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
