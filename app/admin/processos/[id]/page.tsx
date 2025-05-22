import { Metadata } from 'next';
import ProcessoDetalhesPageClient from './page-client';

export const metadata: Metadata = {
  title: 'Detalhes do Processo | INGA',
  description: 'Detalhes do processo de licenciamento',
};

type PageProps = {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default async function ProcessoDetalhesPage({ params }: PageProps) {
  return <ProcessoDetalhesPageClient id={params.id} />;
}

// Adiciona a tipagem de parâmetros para o Next.js
export type { PageProps };
