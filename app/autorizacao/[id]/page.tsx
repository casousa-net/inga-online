import React from 'react';
import ClientPage from './client-page';

export const dynamic = 'force-dynamic';

export default function AutorizacaoPage({
  params,
}: {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  // Componente do servidor que apenas passa o ID para o componente do cliente
  const { id } = params;
  
  return <ClientPage id={id} />;
}
