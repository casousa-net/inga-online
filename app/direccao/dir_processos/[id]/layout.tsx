import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Detalhes do Processo | Direção | INGA',
  description: 'Detalhes do processo para a Direção',
};

// Forçando o Next.js a tratar esta rota como dinâmica
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function ProcessoDirecaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
