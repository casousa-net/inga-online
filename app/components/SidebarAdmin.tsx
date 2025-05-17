import { Home, UserPlus, Users, UserCog, FileText, LogOut, DollarSign, Package, Settings, User, UserCheck } from "lucide-react";
import Link from "next/link";
import ActiveLink from "./activeLink";
import { useState, useEffect } from "react";

export default function SidebarAdmin() {
  const [userName, setUserName] = useState<string>('Usuário');

  useEffect(() => {
    // Recuperar o nome do usuário do localStorage
    const storedUserName = localStorage.getItem('userName');
    if (storedUserName) {
      setUserName(storedUserName);
    }
  }, []);
  
  return (
    <aside className="flex flex-col justify-between h-screen w-64 bg-gray-800 text-lime-100 fixed left-0 top-0 z-40 transition-all shadow-lg">
      <div>
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 py-6">
          <img src={"/logo_inga.png"} alt="Logo" className="w-24 h-24" />
        </div>
        {/* Menu Admin */}
        <nav className="flex flex-col gap-2 mt-4 px-4">
          <ActiveLink href="/admin" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-900 transition">
            <Home size={20} /> Dashboard
          </ActiveLink>
          <ActiveLink href="/admin/funcionarios" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-900 transition">
            <UserCheck size={20} /> Gerir Funcionários
          </ActiveLink>
          <ActiveLink href="/admin/utentes" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-900 transition">
            <UserCog size={20} /> Gerir Utentes
          </ActiveLink>
          <ActiveLink href="/admin/processos" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-900 transition">
            <FileText size={20} /> Todos os Processos
          </ActiveLink>

          {/* Novos links para configurações */}
          <div className="mt-4 border-t border-gray-700 pt-4">
            <h3 className="text-xs uppercase text-gray-500 font-semibold px-4 mb-2">Configurações do Sistema</h3>
            <ActiveLink href="/admin/moedas" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-900 transition">
              <DollarSign size={20} /> Moedas e Câmbio
            </ActiveLink>
            <ActiveLink href="/admin/codigos-pautais" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-900 transition">
              <Package size={20} /> Códigos Pautais
            </ActiveLink>
            <ActiveLink href="/admin/configuracoes-monitorizacao" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-900 transition">
              <Settings size={20} /> Outras Definições
            </ActiveLink>
          </div>
        </nav>
      </div>
      {/* User & Logout */}
      <div className="flex flex-col gap-2 px-4 pb-6">
        <button className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-900 transition">
          <User size={20} /> {userName}
        </button>
        <button
          className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-900 transition"
          onClick={async () => {
            try {
              await fetch("/api/auth/logout", { method: "POST" });
              window.location.href = "/login";
            } catch (err) {
              alert("Erro ao sair. Tente novamente.");
            }
          }}
        >
          <LogOut size={20} /> Sair
        </button>
      </div>
    </aside>
  );
}
