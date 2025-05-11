'use client';

import SidebarAdmin from "../components/SidebarAdmin";
import SidebarChefe from "../components/SidebarChefe";
import SidebarDireccao from "../components/SidebarDireccao";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Verificar se o usuário está autenticado e tem permissão adequada
    const checkAuth = async () => {
      try {
        const role = localStorage.getItem('userRole');
        setUserRole(role);
        
        if (role !== 'chefe' && role !== 'direccao' && role !== 'admin') {
          router.push('/login');
        } else {
          // Redirecionar usuários chefe para a rota correta
          if (role === 'chefe' && window.location.pathname.startsWith('/admin')) {
            router.push('/chefe');
          } else {
            setIsAuthorized(true);
          }
        }
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
    return null; // Não renderiza nada enquanto redireciona
  }

  // Renderizar o sidebar correto com base no nível do usuário
  return (
    <div className="flex min-h-screen w-full">
      {userRole === 'admin' && <SidebarAdmin />}
      {userRole === 'chefe' && <SidebarChefe />}
      {userRole === 'direccao' && <SidebarDireccao />}
      <main className="flex-1 ml-auto p-8">
        {children}
      </main>
    </div>
  );
}
