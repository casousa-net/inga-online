import { Metadata } from 'next';
import ProcessoDetalhesPageClient from './page-client';

export const metadata: Metadata = {
  title: 'Detalhes do Processo | INGA',
  description: 'Detalhes do processo de licenciamento',
};

// Usando uma abordagem mais simples sem tipagem explícita
export default function ProcessoDetalhesPage(props: any) {
  const id = props.params?.id;
  return <ProcessoDetalhesPageClient id={id} />;
}
