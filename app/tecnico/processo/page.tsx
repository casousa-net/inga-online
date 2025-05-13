"use client";
import React, { useState, useEffect } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Eye, CheckCircle, XCircle, Search, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

type Solicitacao = {
  id: number;
  tipo: string;
  status: string;
  createdAt: string;
  valorTotalKz: number;
  validadoPorTecnico?: boolean;
  validadoPorChefe?: boolean;
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

export default function TecnicoProcessos() {
  const router = useRouter();
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    tipo: "",
    status: "",
    search: "",
  });

  // Carregar solicitações validadas pelo técnico
  useEffect(() => {
    const fetchSolicitacoes = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/solicitacoes/tecnico?validados=true");
        
        if (!response.ok) {
          throw new Error("Erro ao carregar processos");
        }
        
        const data = await response.json();
        setSolicitacoes(data);
      } catch (error) {
        console.error("Erro ao carregar processos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSolicitacoes();
  }, []);

  // Filtrar solicitações
  const filteredData = solicitacoes.filter(item => {
    const matchesTipo = filters.tipo ? item.tipo === filters.tipo : true;
    const matchesStatus = filters.status ? item.status === filters.status : true;
    const matchesSearch = filters.search
      ? `PA-${String(item.id).padStart(6, '0')}`.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.utente.nome.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.utente.nif.toLowerCase().includes(filters.search.toLowerCase())
      : true;

    return matchesTipo && matchesStatus && matchesSearch;
  });

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

  // Lista de tipos e estados para os filtros
  const tipos = ["", "Importação", "Exportação", "Reexportação"];
  const estados = ["", "Pendente", "Valido_RUPE", "Aguardando_Pagamento", "Pagamento_Confirmado", "Aprovado", "Rejeitado"];

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <FileText className="text-lime-700" size={28} /> Meus Processos
        </h1>
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-100 text-lime-800 text-sm font-semibold">
          <CheckCircle className="w-4 h-4" /> Processos Validados
        </span>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número, nome ou NIF..."
            className="pl-8"
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
          />
        </div>
        <Select
          value={filters.tipo}
          onValueChange={v => setFilters(f => ({ ...f, tipo: v }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            {tipos.map(t => <SelectItem key={t} value={t}>{t || 'Todos'}</SelectItem>)}
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
            {estados.map(e => <SelectItem key={e} value={e}>{e || 'Todos'}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          className="text-gray-500 border border-gray-200 hover:bg-gray-100"
          onClick={() => setFilters({ tipo: '', status: '', search: '' })}
        >
          Limpar Filtros
        </Button>
      </div>

      {/* Tabela de Processos */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-700"></div>
        </div>
      ) : (
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm w-full overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead className="text-left w-36">Nº Processo</TableHead>
                <TableHead className="text-left w-40">Utente</TableHead>
                <TableHead className="text-left w-40">Tipo</TableHead>
                <TableHead className="text-left w-32">Data</TableHead>
                <TableHead className="text-left w-40">Valor (KZ)</TableHead>
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
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum processo encontrado.</TableCell>
                </TableRow>
              ) : (
                filteredData.map((solicitacao: Solicitacao) => (
                  <TableRow key={solicitacao.id} className="hover:bg-muted/50">
                    <TableCell className="font-semibold text-primary flex items-center gap-2">
                      <FileText className="w-4 h-4 text-lime-700" />
                      PA-{solicitacao.id.toString().padStart(6, '0')}
                    </TableCell>
                    <TableCell>{solicitacao.utente.nome}</TableCell>
                    <TableCell>{solicitacao.tipo}</TableCell>
                    <TableCell>{solicitacao.createdAt ? new Date(solicitacao.createdAt).toLocaleString('pt-BR') : '-'}</TableCell>
                    <TableCell>KZ {solicitacao.valorTotalKz?.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0,00'}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={getBadgeVariant(solicitacao.status)}
                        className={solicitacao.status === 'Pendente' ? 'bg-yellow-100 text-yellow-700 border-none' : ''}
                      >
                        {solicitacao.status === 'Pendente' && <Clock className="w-3 h-3 mr-1" />}
                        {solicitacao.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/tecnico/processo/${solicitacao.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
