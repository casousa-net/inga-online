'use client';

import { useParams } from 'next/navigation';
import ProcessoDetalhesPageClient from './page-client';

// Componente da página
export default function ProcessoDetalhesPage() {
  const params = useParams();
  const id = params?.id as string;
  
  if (!id) {
    return <div>ID do processo não encontrado</div>;
  }
  
  return <ProcessoDetalhesPageClient id={id} />;
}
