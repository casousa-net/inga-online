'use client';

import { Home, BarChart, FileText, Search, Leaf, CreditCard, User, LogOut } from 'lucide-react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import ActiveLink from './activeLink';
import { useState } from 'react';

export default function Sidebar() {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const toggleSettingsMenu = () => {
        setIsSettingsOpen(!isSettingsOpen);
    };

    return (
        <aside className="flex flex-col justify-between h-screen w-64 bg-gray-800 text-lime-100 fixed left-0 top-0 z-40 transition-all shadow-lg">
            <div>
                {/* Logo */}
                <div className="flex items-center gap-2 px-6 py-6">
                    <img src={"/logo_inga.png"} alt="Logo" className="w-24 h-24" />
                </div>
                {/* Menu */}
                <nav className="flex flex-col gap-2 mt-4 px-4">
                    <ActiveLink href="/" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-900 transition">
                        <Home size={20} /> Dashboard
                    </ActiveLink>
                    <ActiveLink href="/ut_autorizacao" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-900 transition">
                        <FileText size={20} /> Autorizações
                    </ActiveLink>
                    <ActiveLink href="/ut_monitorizacao" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-900 transition">
                        <Search size={20} /> Monitorização
                    </ActiveLink>
                    <ActiveLink href="/ut_espacoVerde" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-900 transition">
                        <Leaf size={20} /> Espaços Verdes
                    </ActiveLink>
                    {/* Dropdown for Settings */}
                    <div>
                        <button
                            onClick={toggleSettingsMenu}
                            className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-900 transition w-full text-left">
                            <BarChart size={20} /> Relatórios
                            {/* Ícone de seta que muda dependendo do estado do dropdown */}
                            {isSettingsOpen ? (
                                <FiChevronUp size={20} className="ml-auto" />
                            ) : (
                                <FiChevronDown size={20} className="ml-auto" />
                            )}
                        </button>
                        {isSettingsOpen && (
                            <div className="pl-8">
                                <ActiveLink href="/settings/general" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-900 transition">
                                    Relatório 1
                                </ActiveLink>
                                <ActiveLink href="/settings/privacy" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-900 transition">
                                    Relatório 2
                                </ActiveLink>
                                <ActiveLink href="/settings/privacy" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-900 transition">
                                    Relatório 3
                                </ActiveLink>
                            </div>
                        )}
                    </div>
                    <ActiveLink href="/ut_pagamentos" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-900 transition">
                        <CreditCard size={20} /> Pagamentos
                    </ActiveLink>
                </nav>
            </div>
            {/* User & Logout */}
            <div className="flex flex-col gap-2 px-4 pb-6">
                <button className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-900 transition">
                    <User size={20} /> Usuário
                </button>
                <button className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-900 transition">
                    <LogOut size={20} /> Sair
                </button>
            </div>
        </aside>
    );
}