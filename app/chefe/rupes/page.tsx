'use client';

import React, { useState, useEffect } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, FileText, Eye, Download, Search, RefreshCw, AlertTriangle } from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

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
  const taxa = calcularTaxa(valor);
  let totalCobrar = valor * taxa;
  
  if (totalCobrar < 2000) {
    totalCobrar = 2000;
  }
  
  return totalCobrar;
}

// Interface para as solicitações
interface Solicitacao {
  id: number;
  tipo: string;
  status: string;
  createdAt: string;
  valorTotalKz: number;
  rupeReferencia?: string;
  rupeDocumento?: string;
  rupePago: boolean;
  rupeValidado: boolean;
  validadoPorTecnico: boolean;
  validadoPorChefe: boolean;
  utente: {
    id: number;
    nome: string;
    nif: string;
  };
  moeda?: {
    nome: string;
  };
}

export default function RupesPage() {
  const router = useRouter();
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tipoFiltro, setTipoFiltro] = useState<string>('all');
  const [busca, setBusca] = useState<string>('');
  const [stats, setStats] = useState({
    total: 0,
    pendentes: 0,
    validados: 0
  });

  // Buscar solicitações com RUPEs
  const fetchSolicitacoes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Usar a API de solicitações do Chefe existente
      const response = await fetch('/api/solicitacoes/chefe');
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar solicitações: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Dados recebidos da API:', data);
      
      // Filtrar apenas solicitações que têm RUPE ou estão em estados relevantes
      const solicitacoesComRupe = data
        .filter((sol: any) => {
          // Verificar se a solicitação tem RUPE ou está em um estado relevante
          const temRupe = sol.rupeReferencia !== null && sol.rupeReferencia !== undefined;
          const estadoRelevante = [
            'Valido_RUPE', 
            'Aguardando_Pagamento', 
            'Aguardando_Confirmacao_Pagamento',
            'Pagamento_Confirmado'
          ].includes(sol.status);
          
          return temRupe || estadoRelevante;
        })
        .map((sol: Solicitacao) => {
          // Log detalhado de cada solicitação
          console.log(`Solicitação ID ${sol.id}:`, {
            tipo: sol.tipo,
            status: sol.status,
            rupeReferencia: sol.rupeReferencia,
            rupeDocumento: sol.rupeDocumento,
            rupePago: sol.rupePago,
            rupeValidado: sol.rupeValidado
          });
          
          // Construir o caminho correto para o documento RUPE
          let documentoUrl = undefined;
          if (sol.rupeDocumento) {
            // Acessar o documento diretamente da pasta public
            documentoUrl = `/uploads/rupe/${sol.rupeDocumento}`;
            console.log(`URL do documento para solicitação ${sol.id}:`, documentoUrl);
          }
          
          return {
            ...sol,
            rupeDocumento: documentoUrl
          };
        });
      
      console.log(`Encontradas ${solicitacoesComRupe.length} solicitações com RUPE ou em estados relevantes`);
      
      setSolicitacoes(solicitacoesComRupe);
      
      // Calcular estatísticas
      setStats({
        total: solicitacoesComRupe.length,
        pendentes: solicitacoesComRupe.filter((s: Solicitacao) => !s.rupeValidado && s.rupePago).length,
        validados: solicitacoesComRupe.filter((s: Solicitacao) => s.rupeValidado).length
      });
      
      console.log('Solicitações com RUPE carregadas:', solicitacoesComRupe.length);
    } catch (error) {
      console.error('Erro ao buscar solicitações:', error);
      setError('Não foi possível carregar as solicitações. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Buscar solicitações ao carregar a página
  useEffect(() => {
    fetchSolicitacoes();
  }, []);

  // Validar pagamento de uma solicitação
  const validarPagamento = async (id: number) => {
    try {
      console.log(`Validando pagamento para solicitação ID: ${id}`);
      
      // Usar a API existente para validar pagamento
      const response = await fetch(`/api/solicitacoes/${id}/validar-pagamento`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      const responseData = await response.json();
      console.log('Resposta da API de validação:', responseData);
      
      if (!response.ok) {
        throw new Error(`Falha ao validar pagamento: ${responseData.error || response.status}`);
      }
      
      // Atualizar a lista de solicitações
      fetchSolicitacoes();
      
      // Mostrar mensagem de sucesso
      alert('Pagamento validado com sucesso!');
    } catch (error) {
      console.error('Erro ao validar pagamento:', error);
      alert(`Erro ao validar pagamento: ${error instanceof Error ? error.message : 'Tente novamente mais tarde'}`);
    }
  };

  // Filtrar solicitações
  const solicitacoesFiltradas = React.useMemo(() => {
    return solicitacoes.filter(sol => {
      const tipoMatch = tipoFiltro === 'all' || sol.tipo === tipoFiltro;
      const buscaMatch = !busca || 
        sol.utente.nome.toLowerCase().includes(busca.toLowerCase()) ||
        sol.utente.nif.includes(busca) ||
        (sol.rupeReferencia && sol.rupeReferencia.includes(busca));
      
      return tipoMatch && buscaMatch;
    });
  }, [solicitacoes, tipoFiltro, busca]);

  // Extrair tipos únicos das solicitações
  const tipos = Array.from(new Set(solicitacoes.map(s => s.tipo)));

  // Renderizar estado de carregamento
  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto mt-8 flex flex-col items-center justify-center py-12">
        <Clock className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Carregando solicitações...</p>
      </div>
    );
  }

  // Renderizar erro
  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto mt-8 flex flex-col items-center justify-center py-12">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-lg text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchSolicitacoes} variant="outline" className="gap-2">
          <RefreshCw size={16} />
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto mt-8">
      <h1 className="text-3xl font-bold mb-6">Gestão de RUPEs</h1>
      
      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de RUPEs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Solicitações com RUPE</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendentes}</div>
            <p className="text-xs text-muted-foreground">Aguardando validação</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos Validados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.validados}</div>
            <p className="text-xs text-muted-foreground">Pagamentos confirmados</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Filtros e busca */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nome, NIF ou RUPE..."
              className="pl-8"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          
          <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Todos os Tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              {tipos.map(tipo => (
                <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          variant="outline" 
          size="icon" 
          className="ml-2" 
          onClick={fetchSolicitacoes} 
          title="Atualizar dados"
        >
          <RefreshCw size={16} />
        </Button>
      </div>
      
      {/* Tabela de RUPEs */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Processo</TableHead>
            <TableHead>Utente</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Referência RUPE</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {solicitacoesFiltradas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                {busca || tipoFiltro ? 
                  'Nenhuma solicitação encontrada com os filtros aplicados' : 
                  'Nenhuma solicitação com RUPE encontrada'}
              </TableCell>
            </TableRow>
          ) : (
            solicitacoesFiltradas.map((sol) => (
              <TableRow key={sol.id}>
                <TableCell className="font-semibold text-primary flex items-center gap-2">
                  <FileText className="w-4 h-4 text-lime-700" />
                  PA-{sol.id.toString().padStart(4, '0')}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{sol.utente.nome}</span>
                    <span className="text-xs text-gray-500">NIF: {sol.utente.nif}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                    {sol.tipo}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{sol.rupeReferencia}</span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(sol.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{calcularValorFinal(sol.valorTotalKz).toLocaleString('pt-AO')} Kz</span>
                    <span className="text-xs text-gray-500">
                      Taxa: {(calcularTaxa(sol.valorTotalKz) * 100).toFixed(2)}%
                      {calcularValorFinal(sol.valorTotalKz) === 2000 && (
                        <span className="ml-1 text-amber-600">(mín.)</span>
                      )}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {sol.rupeValidado ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
                      <CheckCircle size={12} /> Validado
                    </Badge>
                  ) : sol.rupePago ? (
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 flex items-center gap-1">
                      <Clock size={12} /> Aguardando Validação
                    </Badge>
                  ) : (
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1">
                      <Clock size={12} /> Aguardando Pagamento
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {/* Botão para visualizar documento RUPE */}
                    {sol.rupeDocumento && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-blue-700 border-blue-700" 
                        title="Visualizar RUPE"
                        onClick={() => {
                          // Acessar o documento diretamente da pasta public
                          console.log('Abrindo documento RUPE:', sol.rupeDocumento);
                          window.open(sol.rupeDocumento!, '_blank');
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    
                    {/* Botão para validar pagamento */}
                    {sol.rupePago && !sol.rupeValidado && (
                      <Button 
                        size="sm" 
                        variant="default" 
                        className="bg-green-600 hover:bg-green-700 text-white" 
                        title="Validar Pagamento"
                        onClick={() => {
                          console.log('Validando pagamento para solicitação:', sol.id);
                          validarPagamento(sol.id);
                        }}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" /> Validar
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
  );
}
