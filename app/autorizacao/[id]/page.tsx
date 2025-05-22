import React from 'react';
import ClientPage from './client-page';

interface PageProps {
  params: {
    id: string;
  };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function AutorizacaoPage({ params }: PageProps) {
  // Componente do servidor que apenas passa o ID para o componente do cliente
  const { id } = params;
  
  return <ClientPage id={id} />;
}
