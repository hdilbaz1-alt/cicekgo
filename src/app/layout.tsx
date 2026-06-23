import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { NotificationProvider } from '@/components/NotificationSystem';
import PwaProvider from '@/components/pwa/PwaProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ÇiçekGo - Sipariş Yönetim Sistemi',
  description: 'Çiçekçi sipariş yönetim sistemi',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'ÇiçekGo' },
  icons: { icon: '/icons/icon-192.png', apple: '/icons/apple-touch-icon.png' },
};

export const viewport: Viewport = {
  themeColor: '#4F46E5',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <NotificationProvider>
          <div className="min-h-screen bg-gray-50 overflow-x-hidden">
            {children}
          </div>
        </NotificationProvider>
        <PwaProvider />
      </body>
    </html>
  );
}
