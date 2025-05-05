'use client';
import SidebarAdmin from "../components/SidebarAdmin";
import { Button } from "components/ui/button";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#f4f7fa] to-[#e1e7ef]">
      <SidebarAdmin />
      <main className="flex-1 ml-64 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h1 className="text-2xl font-bold text-primary mb-6 text-center">Painel do Administrador</h1>
          <p className="mb-4 text-gray-700 text-center">Aqui você pode cadastrar e gerir usuários do sistema (Direcção, Chefe e Técnico) e controlar todos os processos.</p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Button variant="outline" className="w-full md:w-auto">Cadastrar Usuário</Button>
            <Button variant="outline" className="w-full md:w-auto">Gerir Usuários</Button>
            <Button variant="outline" className="w-full md:w-auto">Gerir Utentes</Button>
            <Button variant="outline" className="w-full md:w-auto">Ver Todos os Processos</Button>
          </div>
        </div>
      </main>
    </div>
  );
}
