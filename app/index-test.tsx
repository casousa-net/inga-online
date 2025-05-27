'use client';

import { useEffect } from 'react';

export default function IndexTest() {
  useEffect(() => {
    console.log('Index test page loaded');
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">Página Inicial de Teste</h1>
      <p className="mb-4">Esta é uma página inicial de teste.</p>
      <a 
        href="/login"
        className="px-4 py-2 bg-[#84cc16] hover:bg-[#65a30d] text-white rounded-lg"
      >
        Ir para login
      </a>
    </div>
  );
}
