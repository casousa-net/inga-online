import { Metadata } from 'next';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { UtentePerfilClient } from './utente-perfil-client';

export const metadata: Metadata = {
  title: 'Detalhes do Utente | Direção | INGA',
  description: 'Detalhes do utente para a Direção',
};

interface PageProps {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function UtentePerfilPage({
  params,
}: PageProps) {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">Detalhes do Utente</h1>
        <Button asChild variant="outline">
          <Link href="/direccao/dir_utentes">
            ← Voltar para Lista de Utentes
          </Link>
        </Button>
      </div>
      
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-lime-600" />
          </div>
        }
      >
        <UtentePerfilClient id={params.id} />
      </Suspense>
    </div>
  );
}
