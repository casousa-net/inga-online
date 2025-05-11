import { use } from 'react';
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
}

export default function ProcessoDetalhesPage({ params }: ProcessoDetalhesPageProps) {
  const id = use(Promise.resolve(params.id));
  return <ProcessoDetalhesPageClient id={id} />;
}
