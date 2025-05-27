'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TestPage() {
  const router = useRouter();
  
  useEffect(() => {
    console.log('Test page loaded');
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">Página de Teste</h1>
      <p className="mb-4">Esta página está funcionando corretamente.</p>
      <button 
        onClick={() => router.push('/')}
        className="px-4 py-2 bg-[#84cc16] hover:bg-[#65a30d] text-white rounded-lg"
      >
        Voltar para a página inicial
      </button>
    </div>
  );
}
