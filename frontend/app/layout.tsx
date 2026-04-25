import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastContainer } from '@/components/ui/Toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Ethar Pharmacy - Your Trusted Online Pharmacy',
  description: 'Quality medicines and healthcare products delivered to your doorstep',
  keywords: 'pharmacy, medicines, healthcare, online pharmacy, health products',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
          </div>
          <ToastContainer />
        </ErrorBoundary>
      </body>
    </html>
  );
}
