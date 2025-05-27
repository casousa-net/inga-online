"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
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
  estado: string;
  link: string;
};

interface UtentePerfilClientProps {
  id: string;
}

export function UtentePerfilClient({ id }: UtentePerfilClientProps) {
  const router = useRouter();
  const [utente, setUtente] = useState<Utente | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('Ativo');
  const [emailVerificado, setEmailVerificado] = useState(false);
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");

  useEffect(() => {
    const fetchUtente = async () => {
      try {
        const response = await fetch(`/api/utentes/${id}`);
        if (!response.ok) {
          throw new Error("Erro ao carregar dados do utente");
        }
        const data = await response.json();
        setUtente(data);
        setStatus(data.status || 'Ativo');
        setEmailVerificado(data.emailVerificado || false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    };

    fetchUtente();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/utentes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar status');
      }

      setStatus(newStatus);
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      setError('Erro ao atualizar status. Tente novamente.');
    }
  };

  const handleEmailVerification = async (verified: boolean) => {
    try {
      const response = await fetch(`/api/utentes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailVerificado: verified }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar verificação de email');
      }

      setEmailVerificado(verified);
    } catch (err) {
      console.error('Erro ao atualizar verificação de email:', err);
      setError('Erro ao atualizar verificação de email. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-lime-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 0L6 8.586 4.707 7.293a1 1 0 00-1.414 1.414L4.586 10l-1.293 1.293a1 1 0 101.414 1.414L6 11.414l1.293 1.293a1 1 0 001.414-1.414L7.414 10l1.293-1.293a1 1 0 000-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!utente) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Utente não encontrado</p>
      </div>
    );
  }

  const solicitacoesFiltradas = utente.solicitacoes.filter(solicitacao => {
    const tipoMatch = !tipoFiltro || solicitacao.tipo === tipoFiltro;
    const estadoMatch = !estadoFiltro || solicitacao.estado === estadoFiltro;
    return tipoMatch && estadoMatch;
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Perfil do Utente</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Voltar
        </Button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Informações Pessoais</h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Nome</dt>
              <dd className="mt-1 text-sm text-gray-900">{utente.nome}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">NIF</dt>
              <dd className="mt-1 text-sm text-gray-900">{utente.nif}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <div className="flex items-center">
                  {utente.email}
                  <button
                    onClick={() => handleEmailVerification(!emailVerificado)}
                    className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: emailVerificado ? '#DCFCE7' : '#FEE2E2',
                      color: emailVerificado ? '#166534' : '#991B1B'
                    }}
                  >
                    {emailVerificado ? 'Verificado' : 'Não verificado'}
                  </button>
                </div>
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Telefone</dt>
              <dd className="mt-1 text-sm text-gray-900">{utente.telefone}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Endereço</dt>
              <dd className="mt-1 text-sm text-gray-900">{utente.endereco}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <div className="mt-1">
                <Select value={status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                    <SelectItem value="Suspenso">Suspenso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </dl>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Solicitações</h3>
          
          <div className="flex space-x-4">
            <div className="w-48">
              <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os tipos</SelectItem>
                  <SelectItem value="Autorização">Autorização</SelectItem>
                  <SelectItem value="Renovação">Renovação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os estados</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Em análise">Em análise</SelectItem>
                  <SelectItem value="Aprovado">Aprovado</SelectItem>
                  <SelectItem value="Rejeitado">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Processo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Subtipo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {solicitacoesFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                    Nenhuma solicitação encontrada
                  </TableCell>
                </TableRow>
              ) : (
                solicitacoesFiltradas.map((solicitacao) => (
                  <TableRow key={solicitacao.id}>
                    <TableCell className="font-medium">{solicitacao.numero}</TableCell>
                    <TableCell>{solicitacao.tipo}</TableCell>
                    <TableCell>{solicitacao.subtipo}</TableCell>
                    <TableCell>{new Date(solicitacao.data).toLocaleDateString('pt-PT')}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          solicitacao.estado === 'Aprovado' ? 'default' :
                          solicitacao.estado === 'Rejeitado' ? 'destructive' : 'secondary'
                        }
                      >
                        {solicitacao.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={solicitacao.link} className="flex items-center">
                          <Eye className="h-4 w-4 mr-2" />
                          Ver
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
    </div>
  );
}
