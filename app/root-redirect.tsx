'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    console.log('Root redirect page loaded');
    // Redirecionar explicitamente para a página inicial
    router.push('/');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Carregando...</h1>
        <p>Redirecionando para a página inicial</p>
      </div>
    </div>
  );
}
