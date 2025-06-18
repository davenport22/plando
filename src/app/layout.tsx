import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import AppHeader from '@/components/layout/AppHeader';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'PlanGenie - Your AI Trip Planner',
  description: 'Collaboratively plan your trips with AI-powered suggestions.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Fonts are already managed in next/font, but if explicit links are needed: */}
        {/* <link rel="preconnect" href="https://fonts.googleapis.com" /> */}
        {/* <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" /> */}
        {/* <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" /> */}
      </head>
      <body className={`${inter.variable} font-body antialiased flex flex-col min-h-screen`}>
        <AppHeader />
        <main className="flex-grow">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
