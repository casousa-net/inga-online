import { Home, UserPlus, Users, UserCog, FileText, LogOut } from "lucide-react";
import Link from "next/link";

export default function SidebarAdmin() {
  return (
    <aside className="flex flex-col justify-between h-screen w-64 bg-gray-800 text-lime-100 fixed left-0 top-0 z-40 transition-all shadow-lg">
      <div>
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 py-6">
          <img src={"/logo_inga.png"} alt="Logo" className="w-24 h-24" />
        </div>
        {/* Menu Admin */}
        <nav className="flex flex-col gap-2 mt-4 px-4">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-900 transition">
            <Home size={20} /> Dashboard
          </Link>
          <Link href="/admin/cadastro" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-900 transition">
            <UserPlus size={20} /> Cadastrar Usuário
          </Link>
          <Link href="/admin/usuarios" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-900 transition">
            <Users size={20} /> Gerir Usuários
          </Link>
          <Link href="/admin/utentes" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-900 transition">
            <UserCog size={20} /> Gerir Utentes
          </Link>
          <Link href="/admin/processos" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-900 transition">
            <FileText size={20} /> Todos os Processos
          </Link>
        </nav>
      </div>
      <div className="px-4 pb-8">
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-900 transition w-full text-left">
          <LogOut size={20} /> Sair
        </button>
      </div>
    </aside>
  );
}
