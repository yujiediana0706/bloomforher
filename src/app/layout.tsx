import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { AuthGate } from '@/components/AuthGate';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  metadataBase: new URL('https://rebloom-ai-107927033625.asia-southeast1.run.app'),
  title: 'HerRise | Your experience. A brighter future in the AI era.',
  description:
    'An AI career-transition platform built for women: helping women move from "Why me" to "Why not me". Skill portrait · pick one path · evidence-based AI mentor · community plaza.',
  openGraph: {
    title: 'HerRise | Your experience. A brighter future in the AI era.',
    description:
      'An AI career-transition platform built for women: evidence-based skill portrait, one chosen path, an honest AI mentor, and a peer community.',
    type: 'website',
    siteName: 'HerRise',
    locale: 'en_US',
    url: '/',
  },
  twitter: {
    card: 'summary',
    title: 'HerRise | Your experience. A brighter future in the AI era.',
    description:
      'An AI career-transition platform built for women: evidence-based skill portrait, one chosen path, an honest AI mentor, and a peer community.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-silver-200 text-slateblue-900 antialiased">
        <AuthProvider>
          <AuthGate />
          <Navbar />
          <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
            {children}
          </main>
          <footer className="mt-12 border-t border-silver-300 bg-white py-6">
            <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-4 text-center text-xs text-slateblue-700 sm:flex-row sm:px-6 sm:text-left">
              <span>
                HerRise — Google AI Builder Cup prototype (Sustainability &
                Social Impact)
              </span>
              <span className="font-bold text-slateblue-900">
                Evidence-based coaching · Peer support 100% free
              </span>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
