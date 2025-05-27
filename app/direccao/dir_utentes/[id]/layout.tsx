import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Detalhes do Utente | Direção | INGA',
  description: 'Detalhes do utente para a Direção',
};

// Forçando o Next.js a tratar esta rota como dinâmica
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function UtenteDirecaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
