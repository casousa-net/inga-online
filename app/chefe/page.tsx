'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChefePage() {
  const router = useRouter();

  useEffect(() => {
    // Recuperar o departamento do usuário
    const departamento = localStorage.getItem('userDepartamento');
    
    // Normalizar o departamento (remover acentos e converter para minúsculas)
    const normalizedDepartamento = departamento
      ?.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    // Redirecionar com base no departamento
    if (normalizedDepartamento) {
      router.push(`/chefe/processos/${normalizedDepartamento}`);
    } else {
      console.error('Departamento não encontrado');
      router.push('/login');
    }
  }, [router]);

  // Mostrar um loading enquanto redireciona
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lime-500"></div>
    </div>
  );
}
