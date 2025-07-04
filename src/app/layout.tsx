
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import AppHeader from '@/components/layout/AppHeader';
import ThemeApplicator from '@/components/layout/ThemeApplicator';
import { AuthProvider } from '@/context/AuthContext';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Plando - Your AI Planning Assistant',
  description: 'Collaboratively plan your adventures with AI-powered suggestions.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Fonts are managed via next/font */}
      </head>
      <body className={`${inter.variable} font-body antialiased flex flex-col min-h-screen`}>
        <AuthProvider>
          <ThemeApplicator />
          <AppHeader />
          <main className="flex-grow">
            {children}
          </main>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
