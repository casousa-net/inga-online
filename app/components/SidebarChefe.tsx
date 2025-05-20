"use client";

import { Home, FileText, Leaf, Users, Layers, BarChart, ChevronDown, LogOut } from "lucide-react";
import ActiveLink from "./activeLink";
import { useState, useEffect } from "react";

export default function SidebarChefe() {
  const [processosOpen, setProcessosOpen] = useState(false);
  const [userName, setUserName] = useState<string>('Chefe de Departamento');
  const [departamento, setDepartamento] = useState<string | null>(null);

  useEffect(() => {
    // Recuperar o nome e departamento do usuário do localStorage
    const storedUserName = localStorage.getItem('userName');
    const storedDepartamento = localStorage.getItem('userDepartamento');

    if (storedUserName) {
      setUserName(storedUserName);
    }

    if (storedDepartamento) {
      // Normalizar o valor do departamento (remover acentos e converter para minúsculas)
      const normalizedDepartamento = storedDepartamento
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      setDepartamento(normalizedDepartamento);

    }
  }, []);

  return (
    <aside className="flex flex-col justify-between h-screen w-64 bg-gray-800 text-lime-100 fixed left-0 top-0 z-40 transition-all shadow-lg">
      <div>
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 py-6">
          <img src={"/logo_inga.png"} alt="Logo" className="w-24 h-24" />
        </div>
        {/* Menu Chefe de Departamento */}
        <nav className="flex flex-col gap-2 mt-4 px-4">
          <ActiveLink href="/chefe" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-900 transition">
            <Home size={20} /> Dashboard
          </ActiveLink>
          <button
            className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-900 transition w-full text-left"
            onClick={() => setProcessosOpen(!processosOpen)}>
            <Layers size={20} /> Processos
            <ChevronDown size={18} className={processosOpen ? "rotate-180 transition-transform" : "transition-transform"} />
          </button>
          {processosOpen && (
            <div className="ml-8 flex flex-col gap-1">
              {departamento === 'monitorizacao' && (
                <ActiveLink href="/chefe/processos/monitorizacao" className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-900 transition text-sm">
                  <FileText size={16} /> Monitorização
                </ActiveLink>
              )}
              {departamento === 'monitorizacao' && (
                <ActiveLink href="/chefe/reaberturas" className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-900 transition text-sm">
                  <FileText size={16} /> Reabertura
                </ActiveLink>
              )}
              {departamento === 'autorizacao' && (
                <ActiveLink href="/chefe/processos/autorizacao" className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-900 transition text-sm">
                  <FileText size={16} /> Autorização
                </ActiveLink>
              )}
              {departamento === 'espacos-verdes' && (
                <ActiveLink href="/chefe/processos/espacos-verdes" className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-900 transition text-sm">
                  <Leaf size={16} /> Espaços Verdes
                </ActiveLink>
              )}
            </div>
          )}
          <ActiveLink href="/chefe/rupes" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-900 transition">
            <BarChart size={20} /> RUPES
          </ActiveLink>
        </nav>
      </div>
      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-700">
        <button className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-900 transition w-full text-left">
          <Users size={20} /> {userName}
        </button>
        <button
          className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-900 transition w-full text-left"
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
