"use client";
import Sidebar from "./Sidebar";
import { usePathname } from "next/navigation";

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Sidebar só aparece em rotas internas
  const noSidebarRoutes = ["/", "/login", "/cadastro"];
  const showSidebar = !noSidebarRoutes.includes(pathname);
  return showSidebar ? (
    <>
      <Sidebar />
      <main className="flex-1 ml-64 p-8">{children}</main>
    </>
  ) : (
    <>{children}</>
  );
}
