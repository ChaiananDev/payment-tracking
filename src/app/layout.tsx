import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/lib/context/ThemeContext';

export const metadata: Metadata = {
  title: 'Party Tracker - ระบบติดตามการจ่ายค่าสมาชิก',
  description: 'ระบบติดตามการจ่ายค่าสมาชิกและคำนวณเงินจ่ายล่วงหน้าสำหรับหัว Party',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
