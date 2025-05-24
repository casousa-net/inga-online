import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Detalhes da Autorização | Utente | INGA',
  description: 'Detalhes da autorização para o Utente',
};

// Forçando o Next.js a tratar esta rota como dinâmica
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AutorizacaoUtenteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
