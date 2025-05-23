'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import ClientPage from './client-page';

// Componente da página
export default function AutorizacaoPage() {
  const params = useParams();
  const id = params?.id as string;
  
  if (!id) {
    return <div>ID da autorização não encontrado</div>;
  }
  
  return <ClientPage id={id} />;
}

// Garantindo que o Next.js saiba que esta é uma rota dinâmica
export const dynamic = 'force-dynamic';
export const revalidate = 0;
