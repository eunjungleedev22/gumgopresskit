import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/components/providers/QueryProvider';

export const metadata: Metadata = {
  title: 'Remote Job Search Machine',
  description: 'Remote-first international job aggregator for music, web3, tech and startup roles. Optimized for Korean-speaking professionals.',
  openGraph: {
    title: 'Remote Job Search Machine',
    description: 'Find remote jobs in music, web3, tech — optimized for Korean professionals.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
