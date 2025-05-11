'use client';

import { useState, useEffect } from 'react';
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "components/ui/table";
import { FileText, Eye, Search, Download, CheckCircle, XCircle, Clock } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
import { Badge } from "components/ui/badge";
import { toast } from "components/ui/use-toast";
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useSearchParams, useRouter } from 'next/navigation';

type Processo = {
  id: number;
  tipo: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  valorTotalKz: number;
  rupeReferencia?: string;
  utente: {
    id: number;
    nome: string;
    nif: string;
  };
  moeda: {
    nome: string;
    simbolo: string;
  };
};

export default function ProcessosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const utenteIdParam = searchParams.get('utenteId');
  
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [tipoFilter, setTipoFilter] = useState<string>('');
  const [filteredProcessos, setFilteredProcessos] = useState<Processo[]>([]);

  // Carregar processos
  useEffect(() => {
    fetchProcessos();
  }, [utenteIdParam]);

  // Filtrar processos quando os filtros mudarem
  useEffect(() => {
    let filtered = [...processos];
    
    // Filtrar por termo de busca
    if (searchTerm.trim() !== '') {
      const lowercaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        processo => 
          (processo.utente?.nome?.toLowerCase().includes(lowercaseSearch) || false) || 
          (processo.utente?.nif?.includes(searchTerm) || false) ||
          (processo.rupeReferencia && processo.rupeReferencia.includes(searchTerm))
      );
    }
    
    // Filtrar por status
    if (statusFilter !== 'all' && statusFilter !== '') {
      filtered = filtered.filter(processo => processo.status === statusFilter);
    }
    
    // Filtrar por tipo
    if (tipoFilter !== 'all' && tipoFilter !== '') {
      filtered = filtered.filter(processo => processo.tipo === tipoFilter);
    }
    
    setFilteredProcessos(filtered);
  }, [searchTerm, statusFilter, tipoFilter, processos]);

  const fetchProcessos = async () => {
    try {
      setLoading(true);
      
      // Construir URL com parâmetros de filtro
      let url = '/api/solicitacao';
      if (utenteIdParam) {
        url += `?utenteId=${utenteIdParam}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      setProcessos(data);
      setFilteredProcessos(data);
    } catch (error) {
      console.error('Erro ao carregar processos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os processos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: pt });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA'
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'em_validacao':
        return <Badge className="bg-amber-500 text-white"><Clock size={14} className="mr-1" /> Em Validação</Badge>;
      case 'aguardando_pagamento':
        return <Badge className="bg-blue-500 text-white"><Clock size={14} className="mr-1" /> Aguardando Pagamento</Badge>;
      case 'finalizado':
        return <Badge className="bg-green-500 text-white"><CheckCircle size={14} className="mr-1" /> Finalizado</Badge>;
      case 'rejeitado':
        return <Badge className="bg-red-500 text-white"><XCircle size={14} className="mr-1" /> Rejeitado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTipoBadge = (tipo: string) => {
    switch(tipo) {
      case 'importacao':
        return <Badge className="bg-purple-500 text-white">Importação</Badge>;
      case 'exportacao':
        return <Badge className="bg-indigo-500 text-white">Exportação</Badge>;
      case 'reexportacao':
        return <Badge className="bg-blue-500 text-white">Reexportação</Badge>;
      default:
        return <Badge>{tipo}</Badge>;
    }
  };

  return (
    <div className="p-8 min-h-screen bg-background">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">
            {utenteIdParam ? 'Processos do Utente' : 'Todos os Processos'}
          </h1>
          <p className="text-gray-500 mt-1">
            {utenteIdParam ? 'Visualize os processos de um utente específico' : 'Visualize e gerencie todos os processos do sistema'}
          </p>
        </div>
        {utenteIdParam && (
          <Button 
            variant="outline" 
            onClick={() => router.push('/admin/utentes')}
          >
            Voltar para Utentes
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              placeholder="Buscar por nome, NIF ou referência RUPE..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48">
            <Select 
              value={statusFilter} 
              onValueChange={setStatusFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="em_validacao">Em Validação</SelectItem>
                <SelectItem value="aguardando_pagamento">Aguardando Pagamento</SelectItem>
                <SelectItem value="finalizado">Finalizado</SelectItem>
                <SelectItem value="rejeitado">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-48">
            <Select 
              value={tipoFilter} 
              onValueChange={setTipoFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="importacao">Importação</SelectItem>
                <SelectItem value="exportacao">Exportação</SelectItem>
                <SelectItem value="reexportacao">Reexportação</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Utente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead>Data de Criação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-lime-500"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredProcessos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  {searchTerm.trim() !== '' || statusFilter !== '' || tipoFilter !== '' 
                    ? 'Nenhum resultado encontrado para a busca' 
                    : 'Nenhum processo encontrado'}
                </TableCell>
              </TableRow>
            ) : (
              filteredProcessos.map((processo) => (
                <TableRow key={processo.id}>
                  <TableCell>{processo.id}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{processo.utente?.nome || 'Nome não disponível'}</span>
                      <span className="text-xs text-gray-500">NIF: {processo.utente?.nif || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getTipoBadge(processo.tipo)}</TableCell>
                  <TableCell>{getStatusBadge(processo.status)}</TableCell>
                  <TableCell>{formatCurrency(processo.valorTotalKz)}</TableCell>
                  <TableCell>{formatDate(processo.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-blue-600 hover:text-blue-800"
                        title="Ver Detalhes"
                        onClick={() => router.push(`/admin/processos/${processo.id}`)}
                      >
                        <Eye size={16} />
                      </Button>
                      {processo.rupeReferencia && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-green-600 hover:text-green-800"
                          title="Baixar RUPE"
                        >
                          <Download size={16} />
                        </Button>
                      )}
                    </div>
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
