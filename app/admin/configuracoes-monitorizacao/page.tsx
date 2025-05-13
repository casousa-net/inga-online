"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "components/ui/select";
import { Badge } from "components/ui/badge";
import { CheckCircle, Clock, XCircle, Download, Eye, Edit, Trash2, Plus, Calendar, User } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "components/ui/table";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "components/ui/dialog";
import { Label } from "components/ui/label";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FiX } from "react-icons/fi";

// Tipos
interface Utente {
  id: number;
  nome: string;
  nif: string;
  email: string;
}

interface ConfiguracaoMonitorizacao {
  id: number;
  utenteId: number;
  utente: Utente;
  tipoPeriodo: "ANUAL" | "SEMESTRAL" | "TRIMESTRAL";
  dataInicio: string;
  createdAt: string;
  updatedAt: string;
}

// Dados mockados para demonstração
const mockUtentes: Utente[] = [
  { id: 1, nome: "Empresa A", nif: "5000123456", email: "empresa.a@example.com" },
  { id: 2, nome: "Empresa B", nif: "5000789012", email: "empresa.b@example.com" },
  { id: 3, nome: "Empresa C", nif: "5000345678", email: "empresa.c@example.com" },
  { id: 4, nome: "Empresa D", nif: "5000901234", email: "empresa.d@example.com" },
  { id: 5, nome: "Empresa E", nif: "5000567890", email: "empresa.e@example.com" },
];

const mockConfiguracoes: ConfiguracaoMonitorizacao[] = [
  {
    id: 1,
    utenteId: 1,
    utente: mockUtentes[0],
    tipoPeriodo: "TRIMESTRAL",
    dataInicio: "2025-01-01T00:00:00.000Z",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z"
  },
  {
    id: 2,
    utenteId: 2,
    utente: mockUtentes[1],
    tipoPeriodo: "SEMESTRAL",
    dataInicio: "2025-01-01T00:00:00.000Z",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z"
  },
  {
    id: 3,
    utenteId: 3,
    utente: mockUtentes[2],
    tipoPeriodo: "ANUAL",
    dataInicio: "2025-01-01T00:00:00.000Z",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z"
  }
];

export default function ConfiguracoesMonitorizacaoPage() {
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoMonitorizacao[]>([]);
  const [utentesDisponiveis, setUtentesDisponiveis] = useState<Utente[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    tipoPeriodo: 'all',
  });
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    utenteId: '',
    tipoPeriodo: 'TRIMESTRAL',
    dataInicio: format(new Date(), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    // Aqui seria feita a chamada à API para buscar as configurações
    // Por enquanto, usamos dados mockados
    setTimeout(() => {
      setConfiguracoes(mockConfiguracoes);
      
      // Filtrar utentes que já têm configuração
      const utentesComConfiguracao = new Set(mockConfiguracoes.map(config => config.utenteId));
      const utentesDisponiveis = mockUtentes.filter(utente => !utentesComConfiguracao.has(utente.id));
      setUtentesDisponiveis(utentesDisponiveis);
      
      setLoading(false);
    }, 500);
  }, []);

  const filteredData = configuracoes.filter(item =>
    (filters.tipoPeriodo && filters.tipoPeriodo !== 'all' ? item.tipoPeriodo === filters.tipoPeriodo : true) &&
    (filters.search 
      ? item.utente.nome.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.utente.nif.includes(filters.search) ||
        item.utente.email.toLowerCase().includes(filters.search.toLowerCase())
      : true)
  );

  const handleOpenModal = (id?: number) => {
    if (id) {
      // Modo edição
      const config = configuracoes.find(c => c.id === id);
      if (config) {
        setForm({
          utenteId: config.utenteId.toString(),
          tipoPeriodo: config.tipoPeriodo,
          dataInicio: format(new Date(config.dataInicio), 'yyyy-MM-dd'),
        });
        setEditingId(id);
      }
    } else {
      // Modo criação
      setForm({
        utenteId: '',
        tipoPeriodo: 'TRIMESTRAL',
        dataInicio: format(new Date(), 'yyyy-MM-dd'),
      });
      setEditingId(null);
    }
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (editingId) {
      // Atualizar configuração existente
      const updatedConfiguracoes = configuracoes.map(config => 
        config.id === editingId 
          ? {
              ...config,
              tipoPeriodo: form.tipoPeriodo as "ANUAL" | "SEMESTRAL" | "TRIMESTRAL",
              dataInicio: new Date(form.dataInicio).toISOString(),
              updatedAt: new Date().toISOString()
            }
          : config
      );
      setConfiguracoes(updatedConfiguracoes);
    } else {
      // Criar nova configuração
      if (!form.utenteId) {
        alert("Selecione um utente");
        return;
      }

      const utenteId = parseInt(form.utenteId);
      const utente = mockUtentes.find(u => u.id === utenteId);
      
      if (!utente) {
        alert("Utente não encontrado");
        return;
      }

      const newConfig: ConfiguracaoMonitorizacao = {
        id: Math.max(0, ...configuracoes.map(c => c.id)) + 1,
        utenteId,
        utente,
        tipoPeriodo: form.tipoPeriodo as "ANUAL" | "SEMESTRAL" | "TRIMESTRAL",
        dataInicio: new Date(form.dataInicio).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setConfiguracoes([...configuracoes, newConfig]);
      
      // Atualizar a lista de utentes disponíveis
      setUtentesDisponiveis(utentesDisponiveis.filter(u => u.id !== utenteId));
    }

    setShowModal(false);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta configuração? Isso removerá todos os períodos associados.")) {
      const configToDelete = configuracoes.find(c => c.id === id);
      const updatedConfiguracoes = configuracoes.filter(config => config.id !== id);
      setConfiguracoes(updatedConfiguracoes);
      
      // Adicionar o utente de volta à lista de disponíveis
      if (configToDelete) {
        const utente = mockUtentes.find(u => u.id === configToDelete.utenteId);
        if (utente) {
          setUtentesDisponiveis([...utentesDisponiveis, utente]);
        }
      }
    }
  };

  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return format(data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const getTipoPeriodoFormatado = (tipo: string) => {
    switch (tipo) {
      case "ANUAL":
        return "Anual";
      case "SEMESTRAL":
        return "Semestral";
      case "TRIMESTRAL":
        return "Trimestral";
      default:
        return tipo;
    }
  };

  const getCorBadgeTipoPeriodo = (tipo: string) => {
    switch (tipo) {
      case "ANUAL":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "SEMESTRAL":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "TRIMESTRAL":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  if (loading) {
    return (
      <div className="p-8 min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-700 mx-auto mb-4"></div>
          <p className="text-lime-700 font-medium">Carregando configurações de monitorização...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen bg-background">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-lime-700 font-semibold">Configurações de Monitorização</span>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-extrabold text-primary tracking-tight">Configurações de Monitorização</h1>
        <Button
          className="bg-lime-600 hover:bg-lime-700 text-white font-semibold rounded-lg shadow"
          onClick={() => handleOpenModal()}
        >
          <Plus className="mr-2" size={16} />
          Nova Configuração
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <Input
          placeholder="Buscar por Nome, NIF ou Email"
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          className="max-w-xs"
        />
        <Select
          value={filters.tipoPeriodo}
          onValueChange={v => setFilters(f => ({ ...f, tipoPeriodo: v }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo de Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="ANUAL">Anual</SelectItem>
            <SelectItem value="SEMESTRAL">Semestral</SelectItem>
            <SelectItem value="TRIMESTRAL">Trimestral</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          className="text-gray-500 border border-gray-200 hover:bg-gray-100"
          onClick={() => setFilters({ tipoPeriodo: 'all', search: '' })}
        >
          Limpar Filtros
        </Button>
      </div>

      {/* Tabela */}
      <Table className="rounded-xl shadow-md bg-white border border-base-200">
        <TableHeader>
          <TableRow>
            <TableHead>Utente</TableHead>
            <TableHead>NIF</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Tipo de Período</TableHead>
            <TableHead>Data de Início</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                Nenhuma configuração encontrada
              </TableCell>
            </TableRow>
          ) : (
            filteredData.map(item => (
              <TableRow key={item.id} className="hover:bg-base-100 transition">
                <TableCell className="font-medium">{item.utente.nome}</TableCell>
                <TableCell>{item.utente.nif}</TableCell>
                <TableCell>{item.utente.email}</TableCell>
                <TableCell>
                  <Badge className={`px-3 py-1 ${getCorBadgeTipoPeriodo(item.tipoPeriodo)}`}>
                    {getTipoPeriodoFormatado(item.tipoPeriodo)}
                  </Badge>
                </TableCell>
                <TableCell>{formatarData(item.dataInicio)}</TableCell>
                <TableCell className="flex gap-2">
                  <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50" onClick={() => handleOpenModal(item.id)}>
                    <Edit size={16} />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-800 hover:bg-red-50" onClick={() => handleDelete(item.id)}>
                    <Trash2 size={16} />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Modal para adicionar/editar configuração */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg min-w-[350px] p-0">
            <div className="bg-white text-black rounded-3xl shadow-2xl border border-lime-100 p-8 animate-modal-pop relative">
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-lime-700 transition-transform duration-200 ease-in-out hover:scale-125 focus:outline-none"
                onClick={() => setShowModal(false)}
                title="Fechar"
                aria-label="Fechar modal">
                <span className="inline-block transition-transform duration-300 ease-in-out">
                  <FiX size={28} />
                </span>
              </button>
              <h2 className="text-2xl font-extrabold mb-6 text-lime-700 tracking-tight animate-fade-down">
                {editingId ? "Editar Configuração" : "Nova Configuração de Monitorização"}
              </h2>
              <div className="space-y-6 animate-fade-up">
                {!editingId && (
                  <div>
                    <Label htmlFor="utente" className="block text-sm font-semibold mb-2 text-gray-700">Utente</Label>
                    <Select
                      value={form.utenteId}
                      onValueChange={v => setForm(f => ({ ...f, utenteId: v }))}
                      disabled={!!editingId}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione um utente" />
                      </SelectTrigger>
                      <SelectContent>
                        {utentesDisponiveis.length === 0 ? (
                          <SelectItem value="" disabled>Nenhum utente disponível</SelectItem>
                        ) : (
                          utentesDisponiveis.map(utente => (
                            <SelectItem key={utente.id} value={utente.id.toString()}>
                              {utente.nome} ({utente.nif})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="tipoPeriodo" className="block text-sm font-semibold mb-2 text-gray-700">Tipo de Período</Label>
                  <Select
                    value={form.tipoPeriodo}
                    onValueChange={v => setForm(f => ({ ...f, tipoPeriodo: v }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o tipo de período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ANUAL">Anual</SelectItem>
                      <SelectItem value="SEMESTRAL">Semestral</SelectItem>
                      <SelectItem value="TRIMESTRAL">Trimestral</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    {form.tipoPeriodo === "ANUAL" && "O utente deverá enviar 1 relatório por ano."}
                    {form.tipoPeriodo === "SEMESTRAL" && "O utente deverá enviar 2 relatórios por ano."}
                    {form.tipoPeriodo === "TRIMESTRAL" && "O utente deverá enviar 4 relatórios por ano."}
                  </p>
                </div>

                <div>
                  <Label htmlFor="dataInicio" className="block text-sm font-semibold mb-2 text-gray-700">Data de Início</Label>
                  <Input
                    type="date"
                    id="dataInicio"
                    value={form.dataInicio}
                    onChange={e => setForm(f => ({ ...f, dataInicio: e.target.value }))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    A partir desta data serão calculados os períodos de monitorização.
                  </p>
                </div>

                <Button
                  className="w-full bg-lime-600 text-white rounded-xl font-bold shadow-lg hover:bg-lime-700 hover:scale-[1.02] active:scale-95 transition-all duration-200"
                  onClick={handleSubmit}
                  disabled={!editingId && !form.utenteId}
                >
                  {editingId ? "Salvar Alterações" : "Criar Configuração"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
