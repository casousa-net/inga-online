'use client';

import SidebarUtente from "../components/SidebarUtente";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function UtenteLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const role = localStorage.getItem('userRole');

        // Verificar se é utente
        if (role !== 'utente') {
          // Se for chefe, redireciona para /chefe
          if (role === 'chefe') {
            router.push('/chefe');
          } else if (role === 'admin' || role === 'direccao') {
            router.push('/admin');
          } else {
            router.push('/login');
          }
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lime-500"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full">
      <SidebarUtente />
      <main className="flex-1 ml-auto p-8">
        {children}
      </main>
    </div>
  );
}
