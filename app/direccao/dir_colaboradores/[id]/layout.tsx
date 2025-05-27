import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Detalhes do Colaborador | INGA',
  description: 'Detalhes do colaborador',
};

// Forçando o Next.js a tratar esta rota como dinâmica
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function ColaboradorDetalhesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
