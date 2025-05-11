'use client';
import { Button } from "components/ui/button";
import { DollarSign, Package, Settings, Users, UserCog, FileText } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div className="p-8 min-h-screen bg-background">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <h1 className="text-3xl font-extrabold text-primary tracking-tight">Painel de Administração</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Gestão de Usuários */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Gestão de Usuários</h2>
            <div className="p-2 bg-blue-50 rounded-full">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          <p className="text-gray-600 mb-4">Gerencie usuários do sistema, incluindo funcionários e utentes.</p>
          <div className="flex flex-col gap-2">
            <Link href="/admin/usuarios" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium">
              Gerir Funcionários
            </Link>
            <Link href="/admin/utentes" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium">
              Gerir Utentes
            </Link>
          </div>
        </div>

        {/* Processos */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Processos</h2>
            <div className="p-2 bg-green-50 rounded-full">
              <FileText className="h-6 w-6 text-green-500" />
            </div>
          </div>
          <p className="text-gray-600 mb-4">Visualize e gerencie todos os processos de autorização no sistema.</p>
          <div className="flex flex-col gap-2">
            <Link href="/admin/processos" className="inline-flex items-center text-green-600 hover:text-green-800 font-medium">
              Ver Todos os Processos
            </Link>
          </div>
        </div>

        {/* Configurações do Sistema */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Configurações</h2>
            <div className="p-2 bg-purple-50 rounded-full">
              <Settings className="h-6 w-6 text-purple-500" />
            </div>
          </div>
          <p className="text-gray-600 mb-4">Configure parâmetros do sistema como moedas e códigos pautais.</p>
          <div className="flex flex-col gap-2">
            <Link href="/admin/moedas" className="inline-flex items-center text-purple-600 hover:text-purple-800 font-medium">
              <DollarSign className="h-4 w-4 mr-1" /> Moedas e Câmbio
            </Link>
            <Link href="/admin/codigos-pautais" className="inline-flex items-center text-purple-600 hover:text-purple-800 font-medium">
              <Package className="h-4 w-4 mr-1" /> Códigos Pautais
            </Link>
          </div>
        </div>
      </div>
      
      {/* Estatísticas */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 mt-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Estatísticas do Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Total de Usuários</p>
            <p className="text-2xl font-bold text-blue-700">124</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Processos Ativos</p>
            <p className="text-2xl font-bold text-green-700">87</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">Processos Pendentes</p>
            <p className="text-2xl font-bold text-amber-700">32</p>
          </div>
        </div>
      </div>
    </div>
  );
}
