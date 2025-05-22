import { Metadata } from 'next';
import ProcessoDetalhesPageClient from './page-client';

export const metadata: Metadata = {
  title: 'Detalhes do Processo | INGA',
  description: 'Detalhes do processo de licenciamento',
};

// Forçando o Next.js a tratar esta rota como dinâmica
export const dynamic = 'force-dynamic';

// Definindo os tipos para as props da página
type ProcessoDetalhesPageProps = {
  params: {
    id: string;
  };
  searchParams?: { [key: string]: string | string[] | undefined };
};

// Componente da página
export default async function ProcessoDetalhesPage({
  params,
  searchParams,
}: ProcessoDetalhesPageProps) {
  const { id } = params;
  
  // O componente cliente recebe o ID e lida com o carregamento dos dados
  return <ProcessoDetalhesPageClient id={id} />;
}

// Garantindo que o Next.js saiba que esta é uma rota dinâmica
export const revalidate = 0;
