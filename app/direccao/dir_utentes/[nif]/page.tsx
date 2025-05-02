"use client";

import React from "react";
import { notFound } from "next/navigation";

const mockUtentes = [
  { nif: '500100200', nome: 'João Silva', endereco: 'Rua das Flores, 123', email: 'joao.silva@email.com', telefone: '923456789', status: 'Ativo', emailVerificado: true },
  { nif: '400200300', nome: 'Maria Santos', endereco: 'Av. Central, 456', email: 'maria.santos@email.com', telefone: '933112233', status: 'Inativo', emailVerificado: false },
  { nif: '600300400', nome: 'Pedro Oliveira', endereco: 'Travessa Norte, 789', email: 'pedro.oliveira@email.com', telefone: '912223344', status: 'Ativo', emailVerificado: true },
];

import Link from "next/link";
import { Badge } from "components/ui/badge";
import { Button } from "components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "components/ui/table";
import { Eye } from "lucide-react";
import { useState } from "react";

export default function UtentePerfilPage({ params }: { params: Promise<{ nif: string }> }) {
  const { nif } = React.use(params);
  const [status, setStatus] = React.useState(() => {
    const ut = mockUtentes.find(u => u.nif === nif);
    return ut?.status || 'Ativo';
  });
  const [emailVerificado, setEmailVerificado] = React.useState(() => {
    const ut = mockUtentes.find(u => u.nif === nif);
    return ut?.emailVerificado || false;
  });
  const utente = mockUtentes.find(u => u.nif === nif);
  if (!utente) return notFound();

  // Mock histórico de processos do utente (dados variados)
  const historicoProcessos = [
    // Autorizações
    { numero: "PA-000001", tipo: "Autorização", subtipo: "Importações", data: "2025-04-10", estado: "Aprovado", cor: "green", link: "/ut_autorizacao/PA-000001" },
    { numero: "PA-000002", tipo: "Autorização", subtipo: "Exportações", data: "2025-04-12", estado: "Pendente", cor: "yellow", link: "/ut_autorizacao/PA-000002" },
    { numero: "PA-000003", tipo: "Autorização", subtipo: "Re-exportações", data: "2025-03-28", estado: "Rejeitado", cor: "red", link: "/ut_autorizacao/PA-000003" },

    // Monitorização
    { numero: "MO-000001", tipo: "Monitorização", subtipo: "Espaços Verdes", data: "2025-05-01", estado: "Aguardando RUPE", cor: "gray", link: "/ut_monitorizacao/MO-000001" },
    { numero: "MO-000002", tipo: "Monitorização", subtipo: "Espaços Verdes", data: "2025-04-22", estado: "Aguardando Pagamento", cor: "yellow", link: "/ut_monitorizacao/MO-000002" },
    { numero: "MO-000003", tipo: "Monitorização", subtipo: "Espaços Verdes", data: "2025-04-10", estado: "Aprovado", cor: "green", link: "/ut_monitorizacao/MO-000003" },
    { numero: "MO-000004", tipo: "Monitorização", subtipo: "Espaços Verdes", data: "2025-03-05", estado: "Rejeitado", cor: "red", link: "/ut_monitorizacao/MO-000004" },
    { numero: "MO-000005", tipo: "Monitorização", subtipo: "Espaços Verdes", data: "2025-01-20", estado: "Aprovado", cor: "green", link: "/ut_monitorizacao/MO-000005" },
  ];

  const [tipoFiltro, setTipoFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");

  const tipos = Array.from(new Set(historicoProcessos.map(p => p.tipo)));
  const estados = Array.from(new Set(historicoProcessos.map(p => p.estado)));

  // Corrigir para garantir que sempre mostra os dados se não houver filtro
  const processosFiltrados = historicoProcessos.filter(proc => {
    const tipoOk = !tipoFiltro || tipoFiltro === "all" || proc.tipo === tipoFiltro;
    const estadoOk = !estadoFiltro || estadoFiltro === "all" || proc.estado === estadoFiltro;
    return tipoOk && estadoOk;
  });

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-primary">Perfil do Utente</h1>
        <Button asChild variant="outline">
          <Link href="/dir_utentes">← Voltar</Link>
        </Button>
      </div>
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <div className="mb-2"><span className="font-semibold">Nome:</span> {utente.nome}</div>
        <div className="mb-2"><span className="font-semibold">NIF:</span> {utente.nif}</div>
        <div className="mb-2"><span className="font-semibold">Endereço:</span> {utente.endereco}</div>
        <div className="mb-2"><span className="font-semibold">Email:</span> {utente.email}</div>
        <div className="mb-2"><span className="font-semibold">Telefone:</span> {utente.telefone}</div>
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="font-semibold">Status:</span>
            <Badge variant={status === 'Ativo' ? 'default' : 'secondary'} className={status === 'Ativo' ? 'flex items-center gap-1 px-2 bg-green-600 text-white' : 'flex items-center gap-1 px-2 bg-red-500 text-white'}>
              {status === 'Ativo' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="text-white" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9 12l2 2 4-4"></path></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="text-white" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
              )}
              {status}
            </Badge>
            <Button size="sm" variant={status === 'Ativo' ? 'destructive' : 'default'} onClick={() => setStatus(status === 'Ativo' ? 'Inativo' : 'Ativo')}>
              {status === 'Ativo' ? 'Desativar Utente' : 'Ativar Utente'}
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-semibold">Email Verificado:</span>
            <Badge variant={emailVerificado ? 'default' : 'secondary'} className={emailVerificado ? 'flex items-center gap-1 px-2 bg-green-600 text-white' : 'flex items-center gap-1 px-2 bg-yellow-400 text-white'}>
              {emailVerificado ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="text-white" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9 12l2 2 4-4"></path></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="text-white" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              )}
              {emailVerificado ? 'Sim' : 'Não verificado'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-base-200 p-6 mt-8">
        <h2 className="text-xl font-bold mb-4 text-lime-800">Histórico de Solicitações de Processos</h2>
        <div className="flex gap-4 mb-4">
          <Select value={tipoFiltro || "all"} onValueChange={setTipoFiltro}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos os Tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              {tipos.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={estadoFiltro || "all"} onValueChange={setEstadoFiltro}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos os Estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Estados</SelectItem>
              {estados.map(e => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Table className="rounded-xl shadow-md bg-white border border-base-200">
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead className="text-left">Nº Processo</TableHead>
              <TableHead className="text-left">Tipo</TableHead>
              <TableHead className="text-left">Subtipo</TableHead>
              <TableHead className="text-left">Data</TableHead>
              <TableHead className="text-left">Estado</TableHead>
              <TableHead className="text-left">Ver</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-gray-400">Nenhum processo encontrado.</TableCell>
              </TableRow>
            ) : (
              processosFiltrados.map((proc, idx) => (
                <TableRow key={proc.numero} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <TableCell className="py-2 font-mono text-sm text-gray-800">{proc.numero}</TableCell>
                  <TableCell className="py-2 font-semibold text-gray-900">{proc.tipo}</TableCell>
                  <TableCell className="py-2 text-gray-700">{proc.subtipo}</TableCell>
                  <TableCell className="py-2 text-gray-700">{proc.data}</TableCell>
                  <TableCell className="py-2">
                    <Badge className={
                      `flex items-center gap-1 px-2 bg-black ` +
                      (proc.estado === "Aprovado"
                        ? "text-green-400"
                        : proc.estado === "Rejeitado"
                          ? "text-red-400"
                          : proc.estado === "Pendente" || proc.estado === "Aguardando Pagamento" || proc.estado === "Aguardando RUPE"
                            ? "text-yellow-400"
                            : "text-gray-300")
                    }>
                      {proc.estado === "Aprovado" ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9 12l2 2 4-4"></path></svg>
                      ) : proc.estado === "Rejeitado" ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                      ) : proc.estado === "Pendente" || proc.estado === "Aguardando Pagamento" || proc.estado === "Aguardando RUPE" ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>
                      )}
                      {proc.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2">
                    <Button asChild variant="link" className="inline-flex items-center gap-1 text-lime-700">
                      <Link href={proc.link}>
                        <Eye size={16} /> Ver
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
