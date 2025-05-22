import { Metadata } from 'next';
import ProcessoDetalhesPageClient from './page-client';

export const metadata: Metadata = {
  title: 'Detalhes do Processo | INGA',
  description: 'Detalhes do processo de licenciamento',
};

interface ProcessoDetalhesPageProps {
  params: {
    id: string;
  };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function ProcessoDetalhesPage({ params }: ProcessoDetalhesPageProps) {
  return <ProcessoDetalhesPageClient id={params.id} />;
}
