import type { Metadata } from 'next';
import '@/app/globals.css';
import { OfflineBanner } from '@/components/layout/OfflineBanner';

export const metadata: Metadata = {
  title: 'مطعم الأصالة والذوق | قائمة الطعام والطلبات الرقمية',
  description: 'منصة الطلبات الرقمية وإدارة المطعم الفاخرة باللغة العربية',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html dir="rtl" lang="ar">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-cairo bg-dark-950 text-white min-h-screen antialiased flex flex-col selection:bg-gold-500 selection:text-dark-950">
        <OfflineBanner />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
