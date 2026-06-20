import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { NotificationProvider } from '@/components/NotificationSystem';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ÇiçekGo - Sipariş Yönetim Sistemi',
  description: 'Modern sipariş yönetim sistemi',
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
          <div className="min-h-screen bg-gray-50">
            {children}
          </div>
        </NotificationProvider>
      </body>
    </html>
  );
}
