"use client";

import React, { useState, useEffect } from "react";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "components/ui/badge";
import { Button } from "components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "components/ui/table";
import { Eye, Loader2 } from "lucide-react";

type Utente = {
  id: number;
  nif: string;
  nome: string;
  endereco: string;
  email: string;
  telefone: string;
  status: string;
  emailVerificado: boolean;
  createdAt: string;
  updatedAt: string;
  solicitacoes: Solicitacao[];
};

type Solicitacao = {
  id: number;
  numero: string;
  tipo: string;
  subtipo: string;
  data: string;
  status: string;
  link: string;
};

interface PageProps {
  params: {
    id: string;
  };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function UtentePerfilPage({
  params,
}: {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const router = useRouter();
  const { id } = params;
  const [utente, setUtente] = useState<Utente | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('Ativo');
  const [emailVerificado, setEmailVerificado] = useState(false);
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");

  // Buscar dados do utente da API
  useEffect(() => {
    const fetchUtente = async () => {
      try {
        setLoading(true);
        
        // Buscar os detalhes do utente pelo ID
        const response = await fetch(`/api/usuarios/utentes/${id}`);
        
        if (!response.ok) {
          throw new Error('Erro ao buscar detalhes do utente');
        }
        
        const data = await response.json();
        setUtente(data);
        setStatus(data.status || 'Ativo');
        setEmailVerificado(data.emailVerificado || false);
        setError(null);
      } catch (err) {
        console.error('Erro ao buscar utente:', err);
        setError('Falha ao carregar os dados. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUtente();
  }, [id]);

  // Se estiver carregando, mostrar indicador de carregamento
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-lime-600 mb-4" />
        <p className="text-gray-500">Carregando dados do utente...</p>
      </div>
    );
  }

  // Se houver erro, mostrar mensagem de erro
  if (error) {
    return (
      <div className="p-8 max-w-4xl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-primary">Perfil do Utente</h1>
          <Button asChild variant="outline">
            <Link href="/direccao/dir_utentes">← Voltar</Link>
          </Button>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-center">
          <p>{error}</p>
          <Button 
            variant="outline" 
            className="mt-4 border-red-300 text-red-700 hover:bg-red-50"
            onClick={() => router.refresh()}
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  // Se não houver utente, mostrar página não encontrada
  if (!utente) return notFound();

  // Processar solicitações para exibição
  const solicitacoes = utente.solicitacoes || [];
  
  // Extrair tipos e estados únicos para os filtros
  const tipos = Array.from(new Set(solicitacoes.map(p => p.tipo)));
  const estados = Array.from(new Set(solicitacoes.map(p => p.estado)));

  // Filtrar solicitações com base nos filtros selecionados
  const solicitacoesFiltradas = solicitacoes.filter(proc => {
    const tipoOk = !tipoFiltro || tipoFiltro === "all" || proc.tipo === tipoFiltro;
    const estadoOk = !estadoFiltro || estadoFiltro === "all" || proc.estado === estadoFiltro;
    return tipoOk && estadoOk;
  });

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-primary">Perfil do Utente</h1>
        <Button asChild variant="outline">
          <Link href="/direccao/dir_utentes">← Voltar</Link>
        </Button>
      </div>
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <div className="mb-2"><span className="font-semibold">Nome:</span> {utente.nome}</div>
        <div className="mb-2"><span className="font-semibold">NIF:</span> {utente.nif}</div>
        <div className="mb-2"><span className="font-semibold">Endereço:</span> {utente.endereco}</div>
        <div className="mb-2"><span className="font-semibold">Email:</span> {utente.email}</div>
        <div className="mb-2"><span className="font-semibold">Telefone:</span> {utente.telefone}</div>
        <div className="mb-2"><span className="font-semibold">Data de Cadastro:</span> {new Date(utente.createdAt).toLocaleString('pt-BR')}</div>
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
              {tipos.map((t, index) => (
                <SelectItem key={`tipo-${index}-${t}`} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={estadoFiltro || "all"} onValueChange={setEstadoFiltro}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todos os Estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Estados</SelectItem>
              {estados.map((e, index) => (
                <SelectItem key={`estado-${index}-${e}`} value={e}>{e}</SelectItem>
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
            {solicitacoesFiltradas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-gray-400">Nenhum processo encontrado.</TableCell>
              </TableRow>
            ) : (
              solicitacoesFiltradas.map((proc: Solicitacao, idx: number) => (
                <TableRow key={proc.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
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
                          : proc.estado === "Pendente" || proc.estado === "Aguardando Pagamento" || proc.estado === "Aguardando RUPE" || proc.estado === "Validado" || proc.estado === "Pagamento Confirmado"
                            ? "text-yellow-400"
                            : "text-gray-300")
                    }>
                      {proc.estado === "Aprovado" ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9 12l2 2 4-4"></path></svg>
                      ) : proc.estado === "Rejeitado" ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                      ) : proc.estado === "Pendente" || proc.estado === "Aguardando Pagamento" || proc.estado === "Aguardando RUPE" || proc.estado === "Validado" || proc.estado === "Pagamento Confirmado" ? (
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
