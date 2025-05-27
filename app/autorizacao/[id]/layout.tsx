import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Autorização | INGA',
  description: 'Detalhes da autorização',
};

// Forçando o Next.js a tratar esta rota como dinâmica
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AutorizacaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
