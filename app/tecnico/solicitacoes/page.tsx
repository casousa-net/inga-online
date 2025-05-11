'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, Clock, Eye, XCircle, FileText } from "lucide-react";
import { useRouter } from 'next/navigation';

type Solicitacao = {
  id: number;
  tipo: string;
  createdAt: string;
  status: string;
  rupeReferencia?: string | null;
  valorTotalKz: number;
  validadoPorTecnico: boolean;
  validadoPorChefe: boolean;
  rupePago: boolean;
  rupeValidado: boolean;
  aprovadoPorDirecao: boolean;
  moeda?: { nome: string };
  utente: {
    id: number;
    nome: string;
    nif: string;
  };
};

export default function SolicitacoesTecnicoPage() {
  const router = useRouter();
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    tipo: 'all',
    status: 'all',
    search: '',
  });
  const [showModal, setShowModal] = useState(false);
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<Solicitacao | null>(null);
  const [observacoes, setObservacoes] = useState('');

  // Opções para filtros
  const tipos = ['all', 'Importação', 'Exportação', 'Reexportação'];
  const estados = ['all', 'Pendente', 'Valido_RUPE', 'Aguardando_Pagamento', 'Pagamento_Confirmado', 'Aprovado', 'Rejeitado'];

  // Carregar solicitações
  useEffect(() => {
    const fetchSolicitacoes = async () => {
      try {
        const tecnicoId = localStorage.getItem('utenteId');
        const departamento = localStorage.getItem('userDepartamento') || 'todos';
        
        if (!tecnicoId) {
          alert('Sessão expirada. Por favor, faça login novamente.');
          window.location.href = '/login';
          return;
        }

        const response = await fetch(`/api/solicitacoes/tecnico?departamento=${departamento}`);
        if (!response.ok) {
          throw new Error('Erro ao carregar solicitações');
        }

        const data = await response.json();
        setSolicitacoes(data);
      } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar solicitações. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchSolicitacoes();
  }, []);

  // Filtrar solicitações
  const filteredData = solicitacoes.filter(item => {
    const matchesTipo = filters.tipo === 'all' ? true : item.tipo === filters.tipo;
    const matchesStatus = filters.status === 'all' ? true : item.status === filters.status;
    const matchesSearch = filters.search
      ? `PA-${String(item.id).padStart(6, '0')}`.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.utente.nome.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.utente.nif.toLowerCase().includes(filters.search.toLowerCase())
      : true;

    return matchesTipo && matchesStatus && matchesSearch;
  });

  // Validar solicitação para RUPE
  const handleValidarParaRUPE = async () => {
    if (!selectedSolicitacao) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/solicitacoes/${selectedSolicitacao.id}/validar-tecnico`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ observacoes }),
      });

      if (!response.ok) {
        throw new Error('Erro ao validar solicitação');
      }

      // Atualizar lista de solicitações
      const updatedSolicitacoes = solicitacoes.map(s => {
        if (s.id === selectedSolicitacao.id) {
          return {
            ...s,
            validadoPorTecnico: true,
            status: 'Valido_RUPE',
          };
        }
        return s;
      });

      setSolicitacoes(updatedSolicitacoes);
      setShowModal(false);
      setSelectedSolicitacao(null);
      setObservacoes('');
      alert('Solicitação validada com sucesso!');
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao validar solicitação. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Rejeitar solicitação
  const handleRejeitar = async () => {
    if (!selectedSolicitacao) return;
    if (!observacoes.trim()) {
      alert('Por favor, informe o motivo da rejeição.');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/solicitacoes/${selectedSolicitacao.id}/rejeitar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ motivoRejeicao: observacoes }),
      });

      if (!response.ok) {
        throw new Error('Erro ao rejeitar solicitação');
      }

      // Atualizar lista de solicitações
      const updatedSolicitacoes = solicitacoes.map(s => {
        if (s.id === selectedSolicitacao.id) {
          return {
            ...s,
            status: 'Rejeitado',
          };
        }
        return s;
      });

      setSolicitacoes(updatedSolicitacoes);
      setShowModal(false);
      setSelectedSolicitacao(null);
      setObservacoes('');
      alert('Solicitação rejeitada com sucesso!');
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao rejeitar solicitação. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Função para obter a cor do badge de status
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'Pendente':
        return 'secondary';
      case 'Valido_RUPE':
        return 'outline';
      case 'Aguardando_Pagamento':
        return 'outline';
      case 'Pagamento_Confirmado':
        return 'outline';
      case 'Aprovado':
        return 'default';
      case 'Rejeitado':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  // Modal de detalhes e validação
  const renderModal = () => {
    if (!selectedSolicitacao) return null;

    return (
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detalhes da Solicitação</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="font-semibold mb-2">Informações Gerais</h3>
            <p><span className="text-gray-600">Processo:</span> PA-{String(selectedSolicitacao.id).padStart(6, '0')}</p>
            <p><span className="text-gray-600">Tipo:</span> {selectedSolicitacao.tipo}</p>
            <p><span className="text-gray-600">Data:</span> {new Date(selectedSolicitacao.createdAt).toLocaleDateString()}</p>
            <p><span className="text-gray-600">Status:</span> {selectedSolicitacao.status}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Informações do Utente</h3>
            <p><span className="text-gray-600">Nome:</span> {selectedSolicitacao.utente.nome}</p>
            <p><span className="text-gray-600">NIF:</span> {selectedSolicitacao.utente.nif}</p>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold mb-2">Valor Total</h3>
          <p><span className="text-gray-600">Valor em Kwanzas:</span> {selectedSolicitacao.valorTotalKz.toLocaleString('pt-AO')} Kz</p>
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-2">Observações</label>
          <textarea
            className="w-full p-2 border border-gray-300 rounded-md"
            rows={4}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Adicione observações ou motivo de rejeição"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setShowModal(false);
              setSelectedSolicitacao(null);
              setObservacoes('');
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleRejeitar}
            disabled={loading || selectedSolicitacao.validadoPorTecnico}
          >
            Rejeitar
          </Button>
          <Button
            onClick={handleValidarParaRUPE}
            disabled={loading || selectedSolicitacao.validadoPorTecnico}
            className="bg-lime-600 hover:bg-lime-700 text-white"
          >
            Validar para RUPE
          </Button>
        </div>
      </DialogContent>
    );
  };

  return (
    <div className="p-8 min-h-screen bg-background">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-lime-700 font-semibold">Solicitações</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-extrabold text-primary tracking-tight">Solicitações para Análise</h1>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <Input
          placeholder="Buscar Nº Processo ou Utente"
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          className="max-w-xs"
        />
        <Select
          value={filters.tipo}
          onValueChange={v => setFilters(f => ({ ...f, tipo: v }))}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            {tipos.map(tipo => <SelectItem key={tipo} value={tipo}>{tipo === 'all' ? 'Todos' : tipo}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select
          value={filters.status}
          onValueChange={v => setFilters(f => ({ ...f, status: v }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {estados.map(e => <SelectItem key={e} value={e}>{e === 'all' ? 'Todos' : e}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          className="text-gray-500 border border-gray-200 hover:bg-gray-100"
          onClick={() => setFilters({ tipo: 'all', status: 'all', search: '' })}
        >
          Limpar Filtros
        </Button>
      </div>

      {/* Tabela de Solicitações */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm w-full overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead className="text-left w-36">Nº Processo</TableHead>
              <TableHead className="text-left w-40">Utente</TableHead>
              <TableHead className="text-left w-40">Subtipo</TableHead>
              <TableHead className="text-left w-32">Data</TableHead>
              <TableHead className="text-left w-40">Taxa Sobre</TableHead>
              <TableHead className="text-left w-44">Estado</TableHead>
              <TableHead className="text-left w-56">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando processos...</TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum processo pendente encontrado.</TableCell>
              </TableRow>
            ) : (
              filteredData.map(item => (
                <TableRow key={item.id} className="hover:bg-muted/50">
                  <TableCell className="font-semibold text-primary flex items-center gap-2">
                    <FileText className="w-4 h-4 text-lime-700" />
                    PR-{item.id}
                  </TableCell>
                  <TableCell>{item.utente.nome}</TableCell>
                  <TableCell>Autorização</TableCell>
                  <TableCell>{new Date(item.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>KZ {item.valorTotalKz.toLocaleString('pt-AO', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={item.status === 'Pendente' ? 'destructive' : 'outline'} 
                      className={item.status === 'Pendente' ? 'bg-red-100 text-red-700 border-none' : ''}
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="text-blue-700 border-blue-700 flex items-center gap-1" 
                      title="Ver Processo"
                      onClick={() => {
                        setSelectedSolicitacao(item);
                        setShowModal(true);
                      }}
                    >
                      <Eye className="w-4 h-4" /> Ver Processo
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal de Detalhes */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        {renderModal()}
      </Dialog>
    </div>
  );
}
