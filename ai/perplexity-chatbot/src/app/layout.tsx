import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { MouseTracker } from '@/components/MouseTracker';
import { AuthProvider } from '@/hooks/useAuth';
import { ThemeProvider } from '@/hooks/useTheme';
import Footer from '@/components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AISync',
  description: 'Advanced AI chat platform powered by multiple AI models',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider>
            <div className="min-h-screen flex flex-col">
              <MouseTracker />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
