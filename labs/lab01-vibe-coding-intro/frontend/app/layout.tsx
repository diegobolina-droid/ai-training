import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'URL Shortener',
  description: 'Lab 01 - Vibe Coding Intro',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <main className="min-h-screen bg-gray-50 p-8">{children}</main>
      </body>
    </html>
  );
}
