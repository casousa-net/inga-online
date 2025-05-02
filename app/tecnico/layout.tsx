"use client";
import SidebarTecnico from "../components/SidebarTecnico";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarTecnico />
      <main className="flex-1 ml-auto p-8">
        {children}
      </main>
    </div>
  );
}
