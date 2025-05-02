"use client";

import { Home, FileText, Leaf, Layers, BarChart, ChevronDown, LogOut, Users } from "lucide-react";
import ActiveLink from "./activeLink";
import { useState } from "react";
import { BiExit } from "react-icons/bi";

export default function SidebarTecnico() {
  const [processosOpen, setProcessosOpen] = useState(false);

  return (
    <aside className="flex flex-col justify-between h-screen w-64 bg-gray-800 text-lime-100 fixed left-0 top-0 z-40 transition-all shadow-lg">
      <div>
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 py-6">
          <img src={"/logo_inga.png"} alt="Logo" className="w-24 h-24" />
        </div>
        {/* Menu Técnico */}
        <nav className="flex flex-col gap-2 mt-4 px-4">
          <ActiveLink href="/tecnico/dashboard" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-900 transition">
            <Home size={20} /> Dashboard
          </ActiveLink>
          <button
            className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-900 transition w-full text-left"
            onClick={() => setProcessosOpen(!processosOpen)}
          >
            <Layers size={20} /> Processos
            <ChevronDown size={18} className={processosOpen ? "rotate-180 transition-transform" : "transition-transform"} />
          </button>
          {processosOpen && (
            <div className="ml-8 flex flex-col gap-1">
              <ActiveLink href="/tecnico/processos/monitorizacao" className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-900 transition text-sm">
                <FileText size={16} /> Monitorização
              </ActiveLink>
              <ActiveLink href="/tecnico/processos/autorizacao" className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-900 transition text-sm">
                <FileText size={16} /> Autorização
              </ActiveLink>
              <ActiveLink href="/tecnico/processos/espacos-verdes" className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-900 transition text-sm">
                <Leaf size={16} /> Espaços Verdes
              </ActiveLink>
            </div>
          )}

        </nav>
      </div>
      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-700">
        <button className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-900 transition w-full text-left">
          <Users size={20} /> Técnico
        </button>
        <button className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-900 transition w-full text-left">
          <BiExit size={20} /> Sair
        </button>
      </div>
    </aside>
  );
}
