'use client';
import React, { useState, useEffect } from 'react';
import { Button } from "components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "components/ui/select";
import { Badge } from "components/ui/badge";
import { CheckCircle, Clock, FileText, AlertTriangle, Download, RefreshCw } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';

// Função para calcular a taxa baseada no valor
function calcularTaxa(valor: number): number {
  if (valor <= 6226000) return 0.006;
  if (valor <= 25000000) return 0.004;
  if (valor <= 62480000) return 0.003;
  if (valor <= 249040000) return 0.002;
  return 0.0018;
}

// Função para calcular o valor final com a taxa e aplicar o mínimo
function calcularValorFinal(valor: number): number {
  // Calcular a taxa sobre o valor em Kwanzas
  const taxa = calcularTaxa(valor);
  let totalCobrar = valor * taxa;
  
  // Aplicar valor mínimo se necessário
  if (totalCobrar < 2000) {
    totalCobrar = 2000;
  }
  
  return totalCobrar;
}

// Interface para os pagamentos
interface Pagamento {
  id: number;
  tipo: string;
  descricao: string;
  valor: number;
  status: string;
  validado: boolean;
  referencia: string;
  data: string;
}

interface PagamentosResponse {
  pagamentos: Pagamento[];
  total: number;
  totalPagos: number;
  totalPendentes: number;
}

const statusOptions = ['TODOS', 'PENDENTE', 'PAGA'];

export default function Pagamentos() {
  const [statusFiltro, setStatusFiltro] = useState('TODOS');
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, totalPagos: 0, totalPendentes: 0 });

  // Função para buscar os pagamentos
  const fetchPagamentos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/utente/pagamentos');
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar pagamentos: ${response.status}`);
      }
      
      const data: PagamentosResponse = await response.json();
      setPagamentos(data.pagamentos);
      setStats({
        total: data.total,
        totalPagos: data.totalPagos,
        totalPendentes: data.totalPendentes
      });
      
      console.log('Pagamentos carregados:', data.pagamentos.length);
    } catch (error) {
      console.error('Erro ao buscar pagamentos:', error);
      setError('Não foi possível carregar os pagamentos. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Buscar pagamentos ao carregar a página
  useEffect(() => {
    fetchPagamentos();
  }, []);

  // Filtrar pagamentos por status
  const pagamentosFiltrados = React.useMemo(() => {
    if (statusFiltro === 'TODOS') return pagamentos;
    return pagamentos.filter(p => p.status === statusFiltro);
  }, [pagamentos, statusFiltro]);
  
  // Debug: Log dos pagamentos recebidos
  useEffect(() => {
    console.log('Pagamentos recebidos:', pagamentos);
    console.log('Tipos de pagamentos:', [...new Set(pagamentos.map(p => p.tipo))]);
    console.log('Status atual do filtro:', statusFiltro);
    console.log('Pagamentos filtrados:', pagamentosFiltrados);
    
    // Log detalhado de cada pagamento
    pagamentos.forEach((p, i) => {
      console.log(`Pagamento ${i + 1}:`, {
        tipo: p.tipo,
        descricao: p.descricao,
        status: p.status,
        valor: p.valor,
        referencia: p.referencia
      });
    });
  }, [pagamentos, statusFiltro, pagamentosFiltrados]);

  const gerarRelatorio = () => {
    // Aqui pode implementar exportação para PDF/Excel
    alert('Funcionalidade de relatório a implementar');
  };

  // Função para formatar a data
  const formatarData = (dataString: string) => {
    try {
      return format(parseISO(dataString), 'dd/MM/yyyy', { locale: pt });
    } catch (error) {
      return dataString;
    }
  };

  // Renderizar estado de carregamento
  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto mt-8 flex flex-col items-center justify-center py-12">
        <Clock className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Carregando pagamentos...</p>
      </div>
    );
  }

  // Renderizar erro
  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto mt-8 flex flex-col items-center justify-center py-12">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-lg text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchPagamentos} variant="outline" className="gap-2">
          <RefreshCw size={16} />
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6">Pagamentos</h1>
      
      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pagamentos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Pagamentos registrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos Efetuados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPagos}</div>
            <p className="text-xs text-muted-foreground">Pagamentos confirmados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPendentes}</div>
            <p className="text-xs text-muted-foreground">Aguardando pagamento</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Filtros e botões */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <Select value={statusFiltro} onValueChange={setStatusFiltro}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(opt => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button 
          variant="outline" 
          size="icon" 
          className="ml-2" 
          onClick={fetchPagamentos} 
          title="Atualizar dados"
        >
          <RefreshCw size={16} />
        </Button>
        
        <Button 
          className="ml-auto bg-lime-600 hover:bg-lime-700 text-white font-semibold rounded-lg shadow flex items-center gap-2" 
          onClick={gerarRelatorio}
        >
          <Download size={16} />
          Gerar Relatório
        </Button>
      </div>
      
      {/* Tabela de pagamentos */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Referência</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagamentosFiltrados.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                {statusFiltro === 'TODOS' ? 
                  'Nenhum pagamento encontrado' : 
                  `Nenhum pagamento com status "${statusFiltro}" encontrado`}
              </TableCell>
            </TableRow>
          ) : (
            pagamentosFiltrados.map((pagamento) => (
              <TableRow key={`${pagamento.tipo}-${pagamento.id}`}>
                <TableCell>{pagamento.id}</TableCell>
                <TableCell className="max-w-xs truncate">{pagamento.descricao}</TableCell>
                <TableCell>{pagamento.referencia}</TableCell>
                <TableCell>
                  {pagamento.tipo === 'SOLICITACAO' ? (
                    <div className="flex flex-col">
                      <span>{calcularValorFinal(pagamento.valor).toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz</span>
                      <span className="text-xs text-gray-500">
                        Taxa: {(calcularTaxa(pagamento.valor) * 100).toFixed(2)}%
                        {calcularValorFinal(pagamento.valor) === 2000 && (
                          <span className="ml-1 text-amber-600">(mín.)</span>
                        )}
                      </span>
                    </div>
                  ) : (
                    <span>{pagamento.valor.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} Kz</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={pagamento.status === 'PAGA' ? 'default' : 'secondary'} 
                    className="flex items-center gap-1 px-2"
                  >
                    {pagamento.status === 'PAGA' && <CheckCircle className="text-green-600" size={16} />}
                    {pagamento.status === 'PENDENTE' && <Clock className="text-yellow-500" size={16} />}
                    {pagamento.status}
                  </Badge>
                </TableCell>
                <TableCell>{formatarData(pagamento.data)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
