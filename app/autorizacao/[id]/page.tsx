import React from 'react';
import ClientPage from './client-page';

// Definindo os tipos para as props da página
type AutorizacaoPageProps = {
  params: {
    id: string;
  };
  searchParams?: { [key: string]: string | string[] | undefined };
};

// Componente da página
export default async function AutorizacaoPage({
  params,
  searchParams,
}: AutorizacaoPageProps) {
  return <ClientPage id={params.id} />;
}

// Garantindo que o Next.js saiba que esta é uma rota dinâmica
export const dynamic = 'force-dynamic';
export const revalidate = 0;
