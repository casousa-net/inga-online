import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Detalhes do Processo | INGA',
  description: 'Detalhes do processo de licenciamento',
};

// Forçando o Next.js a tratar esta rota como dinâmica
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function ProcessoDetalhesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
