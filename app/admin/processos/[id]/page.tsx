import { Metadata } from 'next';
import ProcessoDetalhesPageClient from './page-client';

export const metadata: Metadata = {
  title: 'Detalhes do Processo | INGA',
  description: 'Detalhes do processo de licenciamento',
};

export default function ProcessoDetalhesPage({
  params,
}: {
  params: { id: string };
}) {
  return <ProcessoDetalhesPageClient id={params.id} />;
}
