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
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const { id } = params;
  return <ProcessoDetalhesPageClient id={id} />;
}
