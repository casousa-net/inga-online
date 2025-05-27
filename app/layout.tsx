import './globals.css'
import ClientLayoutWrapper from './components/ClientLayoutWrapper';
import { ToastContainer } from 'components/ui/use-toast';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard IngaOnline',
  description: 'Dashboard responsiva com Next.js, ShadCN UI e Tailwind',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className="bg-gray-50 min-h-screen flex">
        <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
        <ToastContainer />
      </body>
    </html>
  );
}