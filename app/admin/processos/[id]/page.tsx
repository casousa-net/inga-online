'use client';

import { Metadata } from 'next';
import { useParams } from 'next/navigation';
import ProcessoDetalhesPageClient from './page-client';

export const metadata: Metadata = {
  title: 'Detalhes do Processo | INGA',
  description: 'Detalhes do processo de licenciamento',
};

// Forçando o Next.js a tratar esta rota como dinâmica
export const dynamic = 'force-dynamic';

// Componente da página
export default function ProcessoDetalhesPage() {
  const params = useParams();
  const id = params?.id as string;
  
  if (!id) {
    return <div>ID do processo não encontrado</div>;
  }
  
  return <ProcessoDetalhesPageClient id={id} />;
}

// Garantindo que o Next.js saiba que esta é uma rota dinâmica
export const revalidate = 0;
