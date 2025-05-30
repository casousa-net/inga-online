'use client';

import { Users, User, Folder, BarChart2, LogOut, Home } from 'lucide-react';
import ActiveLink from './activeLink';
import { useState, useEffect } from 'react';

export default function SidebarDireccao() {
    const [userName, setUserName] = useState<string>('Direcção');

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
                {/* Menu Direcção */}
                <nav className="flex flex-col gap-2 mt-4 px-4">
                    <ActiveLink href="/direccao" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-900 transition">
                        <Home size={20} /> Dashboard
                    </ActiveLink>
                    <ActiveLink href="/direccao/dir_colaboradores" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-900 transition">
                        <Users size={20} /> Colaboradores
                    </ActiveLink>
                    <ActiveLink href="/direccao/dir_utentes" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-900 transition">
                        <User size={20} /> Utentes
                    </ActiveLink>
                    <ActiveLink href="/direccao/dir_processos" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-900 transition">
                        <Folder size={20} /> Autorização
                    </ActiveLink>
                    <ActiveLink href="/direccao/processos-monitorizacao" className="flex items-center gap-3 px-4 py-2 ml-4 rounded-lg hover:bg-gray-900 transition text-lime-300">
                        <Folder size={16} /> Monitorização
                    </ActiveLink>
                    <ActiveLink href="/direccao/reaberturas" className="flex items-center gap-3 px-4 py-2 ml-4 rounded-lg hover:bg-gray-900 transition text-lime-300">
                        <Folder size={16} /> Reabertura
                    </ActiveLink>
                    <ActiveLink href="/direccao/dir_relatorios" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-900 transition">
                        <BarChart2 size={20} /> Relatórios
                    </ActiveLink>
                </nav>
            </div>
            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-700">
                <button className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-900 transition">
                    <User size={20} /> {userName}
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
