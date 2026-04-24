import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'ThreatXAI - Threat Detection Dashboard',
  description: 'AI-powered SOC threat detection system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0f0f0f" />
      </head>
      <body className="bg-dark-bg text-dark-text antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
