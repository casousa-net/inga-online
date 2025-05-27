"use client";
import SidebarAdmin from "./SidebarAdmin";
import { usePathname } from "next/navigation";
import Sidebar from "./SidebarUtente";

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Rotas que não devem mostrar a sidebar
  const noSidebarRoutes = ["/", "/login", "/cadastro", "/recuperar-senha"];
  
  // Verificar se é página de verificação ou página de erro 404
  const isVerificationPage = pathname.startsWith("/verificar");
  const isErrorPage = pathname.includes("/404") || pathname.includes("/not-found");
  
  // Determinar se deve mostrar a sidebar
  const isAdmin = pathname.startsWith("/admin");
  const showSidebar = !noSidebarRoutes.includes(pathname) && !isVerificationPage && !isErrorPage;
  
  // Layout para páginas administrativas
  if (isAdmin) {
    return (
      <>
        <SidebarAdmin />
        <main className="flex-1 ml-64 p-8">{children}</main>
      </>
    );
  }
  
  // Layout para páginas regulares com sidebar
  if (showSidebar) {
    return (
      <>
        <Sidebar />
        <main className="flex-1 ml-64 p-8">{children}</main>
      </>
    );
  }
  
  // Layout para páginas sem sidebar (login, cadastro, verificação, 404)
  return (
    <main className="w-full flex flex-col min-h-screen">{children}</main>
  );
}
