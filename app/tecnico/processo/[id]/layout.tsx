import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Detalhes do Processo | Técnico | INGA',
  description: 'Detalhes do processo para o Técnico',
};

// Forçando o Next.js a tratar esta rota como dinâmica
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function ProcessoTecnicoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
