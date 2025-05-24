import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Detalhes do Processo | Chefe | INGA',
  description: 'Detalhes do processo para o Chefe',
};

// Forçando o Next.js a tratar esta rota como dinâmica
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function ProcessoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
