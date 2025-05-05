import './globals.css'
import ClientLayoutWrapper from './components/ClientLayoutWrapper';

export const metadata = {
  title: 'Dashboard IngaOnline',
  description: 'Dashboard responsiva com Next.js, ShadCN UI e Tailwind',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className="bg-gray-50 min-h-screen flex">
        <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
      </body>
    </html>
  );
}