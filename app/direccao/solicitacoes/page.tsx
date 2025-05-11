'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, Clock, Download, Eye, FileText, XCircle } from "lucide-react";
import { useRouter } from 'next/navigation';

type Solicitacao = {
  id: number;
  tipo: string;
  createdAt: string;
  status: string;
  rupeReferencia?: string | null;
  rupeDocumento?: string | null;
  valorTotalKz: number;
  validadoPorTecnico: boolean;
  validadoPorChefe: boolean;
  rupePago: boolean;
  rupeValidado: boolean;
  aprovadoPorDirecao: boolean;
  licencaDocumento?: string | null;
  moeda?: { nome: string };
  utente: {
    id: number;
    nome: string;
    nif: string;
  };
};

export default function SolicitacoesDirecaoPage() {
  const router = useRouter();
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    tipo: '',
    search: '',
  });
  const [showModal, setShowModal] = useState(false);
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<Solicitacao | null>(null);
  const [observacoes, setObservacoes] = useState('');

  // Opções para filtros
  const tipos = ['', 'Importação', 'Exportação', 'Reexportação'];

  // Carregar solicitações
  useEffect(() => {
    const fetchSolicitacoes = async () => {
      try {
        const direcaoId = localStorage.getItem('utenteId');
        if (!direcaoId) {
          alert('Sessão expirada. Por favor, faça login novamente.');
          window.location.href = '/login';
          return;
        }

        const response = await fetch('/api/solicitacoes/direccao');
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
    const matchesTipo = filters.tipo ? item.tipo === filters.tipo : true;
    const matchesSearch = filters.search
      ? `PA-${String(item.id).padStart(6, '0')}`.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.utente.nome.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.utente.nif.toLowerCase().includes(filters.search.toLowerCase())
      : true;

    return matchesTipo && matchesSearch;
  });

  // Aprovar solicitação
  const handleAprovar = async () => {
    if (!selectedSolicitacao) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/solicitacoes/${selectedSolicitacao.id}/aprovar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ observacoes }),
      });

      if (!response.ok) {
        throw new Error('Erro ao aprovar solicitação');
      }

      const data = await response.json();

      // Atualizar lista de solicitações
      const updatedSolicitacoes = solicitacoes.map(s => {
        if (s.id === selectedSolicitacao.id) {
          return {
            ...s,
            aprovadoPorDirecao: true,
            status: 'Aprovado',
            licencaDocumento: data.licencaDocumento,
          };
        }
        return s;
      });

      setSolicitacoes(updatedSolicitacoes);
      setShowModal(false);
      setSelectedSolicitacao(null);
      setObservacoes('');
      alert('Solicitação aprovada com sucesso!');
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao aprovar solicitação. Por favor, tente novamente.');
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

  // Modal de detalhes e aprovação
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
          <h3 className="font-semibold mb-2">Informações de RUPE</h3>
          <p><span className="text-gray-600">Referência:</span> {selectedSolicitacao.rupeReferencia}</p>
          <p><span className="text-gray-600">Pagamento:</span> {selectedSolicitacao.rupePago ? 'Confirmado pelo Utente' : 'Pendente'}</p>
          <p><span className="text-gray-600">Validação:</span> {selectedSolicitacao.rupeValidado ? 'Validado pelo Chefe' : 'Pendente'}</p>
          
          {selectedSolicitacao.rupeDocumento && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => window.open(`/api/rupe/${selectedSolicitacao.id}/download`, '_blank')}
            >
              <Download size={16} className="mr-1" /> Baixar RUPE
            </Button>
          )}
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
          
          {!selectedSolicitacao.aprovadoPorDirecao && (
            <>
              <Button
                variant="destructive"
                onClick={handleRejeitar}
                disabled={loading}
              >
                Rejeitar
              </Button>
              <Button
                onClick={handleAprovar}
                disabled={loading}
                className="bg-lime-600 hover:bg-lime-700 text-white"
              >
                Aprovar e Assinar
              </Button>
            </>
          )}
          
          {selectedSolicitacao.aprovadoPorDirecao && selectedSolicitacao.licencaDocumento && (
            <Button
              variant="outline"
              onClick={() => window.open(`/api/autorizacao/${selectedSolicitacao.id}/download`, '_blank')}
              className="text-lime-700 border-lime-700"
            >
              <Download size={16} className="mr-1" /> Baixar Licença
            </Button>
          )}
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
        <h1 className="text-3xl font-extrabold text-primary tracking-tight">Aprovação de Solicitações</h1>
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
            {tipos.map(tipo => <SelectItem key={tipo} value={tipo}>{tipo || 'Todos'}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          className="text-gray-500 border border-gray-200 hover:bg-gray-100"
          onClick={() => setFilters({ tipo: '', search: '' })}
        >
          Limpar Filtros
        </Button>
      </div>

      {/* Tabela de Solicitações */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-700"></div>
        </div>
      ) : (
        <Table className="rounded-xl shadow-md bg-white border border-base-200">
          <TableHeader>
            <TableRow>
              <TableHead>Nº Pedido</TableHead>
              <TableHead>Utente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>RUPE</TableHead>
              <TableHead>Valor (Kz)</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  Nenhuma solicitação encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map(item => {
                const numero = `PA-${String(item.id).padStart(6, '0')}`;
                return (
                  <TableRow key={item.id} className="hover:bg-base-100 transition">
                    <TableCell className="font-mono">{numero}</TableCell>
                    <TableCell>{item.utente.nome}</TableCell>
                    <TableCell>{item.tipo}</TableCell>
                    <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === 'Aprovado' ? 'default' : 'outline'} className="flex items-center gap-1 px-2">
                        {item.status === 'Aprovado' && <CheckCircle className="text-green-600" size={16} />}
                        {item.status === 'Pagamento_Confirmado' && <Clock className="text-blue-500" size={16} />}
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                        {item.rupeReferencia}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.valorTotalKz.toLocaleString('pt-AO')}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-lime-700"
                          onClick={() => {
                            setSelectedSolicitacao(item);
                            setShowModal(true);
                          }}
                        >
                          <Eye size={16} className="mr-1" /> Ver
                        </Button>
                        
                        {!item.aprovadoPorDirecao && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-700"
                            onClick={() => {
                              setSelectedSolicitacao(item);
                              setShowModal(true);
                            }}
                          >
                            <FileText size={16} className="mr-1" /> Assinar
                          </Button>
                        )}
                        
                        {item.aprovadoPorDirecao && item.licencaDocumento && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-blue-700"
                            onClick={() => window.open(`/api/autorizacao/${item.id}/download`, '_blank')}
                          >
                            <Download size={16} className="mr-1" /> Licença
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      )}

      {/* Modal de Detalhes */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        {renderModal()}
      </Dialog>
    </div>
  );
}
