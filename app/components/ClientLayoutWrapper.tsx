"use client";
import Sidebar from "./Sidebar";
import SidebarAdmin from "./SidebarAdmin";
import { usePathname } from "next/navigation";

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Sidebar só aparece em rotas internas
  const noSidebarRoutes = ["/", "/login", "/cadastro"];
  const isAdmin = pathname.startsWith("/admin");
  const showSidebar = !noSidebarRoutes.includes(pathname);
  if (isAdmin) {
    return (
      <>
        <SidebarAdmin />
        <main className="flex-1 ml-64 p-8">{children}</main>
      </>
    );
  }
  return showSidebar ? (
    <>
      <Sidebar />
      <main className="flex-1 ml-64 p-8">{children}</main>
    </>
  ) : (
    <main className="w-full flex flex-col min-h-screen">{children}</main>
  );
}
