"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Loader2, FileText, ClipboardCheck, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Tipo para os dados de estatísticas
type Estatisticas = {
  solicitacoes: {
    total: number;
    porStatus: Array<{ categoria: string; total: number }>;
    porMes: Array<{ mes: string; total: number }>;
    recentes: Array<{
      id: number;
      tipoSolicitacao: string;
      status: string;
      createdAt: string;
    }>;
  };
  monitorizacao: {
    total: number;
    porStatus: Array<{ categoria: string; total: number }>;
    porMes: Array<{ mes: string; total: number }>;
    recentes: Array<{
      id: number;
      estadoProcesso: string;
      createdAt: string;
      periodoId: number;
      periodo: {
        id: number;
        numeroPeriodo: number;
        tipoPeriodo: string;
      } | null;
    }>;
  };
};

// Cores para os gráficos
const COLORS = [
  "#0088FE", // Azul
  "#00C49F", // Verde
  "#FFBB28", // Amarelo
  "#FF8042", // Laranja
  "#8884D8", // Roxo
  "#FF6B6B", // Vermelho
];

// Mapeamento de status para labels
const statusLabels: Record<string, string> = {
  "Pendente": "Pendente",
  "Rejeitado": "Rejeitado",
  "Rejeitado_Direcao": "Rejeitado pela Direção",
  "Aprovado": "Aprovado",
  "Valido_RUPE": "Válido para RUPE",
  "Aguardando_Pagamento": "Aguardando Pagamento",
  "Pagamento_Confirmado": "Pagamento Confirmado",
  "AGUARDANDO_PARECER": "Aguardando Parecer",
  "AGUARDANDO_RUPE": "Aguardando RUPE",
  "AGUARDANDO_PAGAMENTO": "Aguardando Pagamento",
  "AGUARDANDO_CONFIRMACAO_PAGAMENTO": "Aguardando Confirmação de Pagamento",
  "AGUARDANDO_SELECAO_TECNICOS": "Aguardando Seleção de Técnicos",
  "AGUARDANDO_VISITA": "Aguardando Visita",
  "AGUARDANDO_DOCUMENTO_FINAL": "Aguardando Documento Final",
  "CONCLUIDO": "Concluído"
};

// Mapeamento de status para cores
const statusColors: Record<string, string> = {
  "Pendente": "bg-blue-100 text-blue-700",
  "Rejeitado": "bg-red-100 text-red-700",
  "Rejeitado_Direcao": "bg-red-100 text-red-700",
  "Aprovado": "bg-green-100 text-green-700",
  "Valido_RUPE": "bg-purple-100 text-purple-700",
  "Aguardando_Pagamento": "bg-amber-100 text-amber-700",
  "Pagamento_Confirmado": "bg-green-100 text-green-700",
  "AGUARDANDO_PARECER": "bg-blue-100 text-blue-700",
  "AGUARDANDO_RUPE": "bg-purple-100 text-purple-700",
  "AGUARDANDO_PAGAMENTO": "bg-amber-100 text-amber-700",
  "AGUARDANDO_CONFIRMACAO_PAGAMENTO": "bg-yellow-100 text-yellow-700",
  "AGUARDANDO_SELECAO_TECNICOS": "bg-orange-100 text-orange-700",
  "AGUARDANDO_VISITA": "bg-cyan-100 text-cyan-700",
  "AGUARDANDO_DOCUMENTO_FINAL": "bg-indigo-100 text-indigo-700",
  "CONCLUIDO": "bg-green-100 text-green-700"
};

// Função para formatar data
const formatarData = (dataString: string) => {
  try {
    const data = new Date(dataString);
    return format(data, "dd/MM/yyyy", { locale: pt });
  } catch (error) {
    return "Data inválida";
  }
};

// Função para formatar mês
const formatarMes = (mesString: string) => {
  try {
    const [ano, mes] = mesString.split("-");
    return format(new Date(parseInt(ano), parseInt(mes) - 1, 1), "MMM/yyyy", { locale: pt });
  } catch (error) {
    return mesString;
  }
};

export default function UtenteDashboard() {
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar estatísticas
  useEffect(() => {
    const fetchEstatisticas = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("Buscando estatísticas...");
        const response = await fetch("/api/utente/estatisticas");
        
        if (!response.ok) {
          console.error("Resposta não-OK da API:", response.status, response.statusText);
          throw new Error(`Erro ao buscar estatísticas: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("Dados recebidos:", data);
        
        // Verificar se os dados estão no formato esperado
        if (!data || typeof data !== 'object') {
          console.error("Dados inválidos recebidos:", data);
          throw new Error("Formato de dados inválido");
        }
        
        // Criar um objeto de estatísticas com valores padrão para evitar erros
        const estatisticasFormatadas: Estatisticas = {
          solicitacoes: {
            total: data.solicitacoes?.total || 0,
            porStatus: Array.isArray(data.solicitacoes?.porStatus) ? data.solicitacoes.porStatus : [],
            porMes: Array.isArray(data.solicitacoes?.porMes) ? data.solicitacoes.porMes : [],
            recentes: Array.isArray(data.solicitacoes?.recentes) ? data.solicitacoes.recentes : []
          },
          monitorizacao: {
            total: data.monitorizacao?.total || 0,
            porStatus: Array.isArray(data.monitorizacao?.porStatus) ? data.monitorizacao.porStatus : [],
            porMes: Array.isArray(data.monitorizacao?.porMes) ? data.monitorizacao.porMes : [],
            recentes: Array.isArray(data.monitorizacao?.recentes) ? data.monitorizacao.recentes : []
          }
        };
        
        setEstatisticas(estatisticasFormatadas);
      } catch (error) {
        console.error("Erro ao buscar estatísticas:", error);
        setError("Não foi possível carregar as estatísticas. Tente novamente mais tarde.");
        
        // Definir dados vazios para evitar erros de renderização
        setEstatisticas({
          solicitacoes: {
            total: 0,
            porStatus: [],
            porMes: [],
            recentes: []
          },
          monitorizacao: {
            total: 0,
            porStatus: [],
            porMes: [],
            recentes: []
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEstatisticas();
  }, []);

  // Preparar dados para gráficos de barras por mês
  const prepararDadosPorMes = () => {
    if (!estatisticas) return [];

    // Obter todos os meses únicos das duas categorias
    const mesesUnicos = new Set<string>();
    
    estatisticas.solicitacoes.porMes.forEach(item => mesesUnicos.add(item.mes));
    estatisticas.monitorizacao.porMes.forEach(item => mesesUnicos.add(item.mes));
    
    // Criar um mapa de mês para valores
    const solicitacoesPorMes = new Map<string, number>();
    const monitorizacaoPorMes = new Map<string, number>();
    
    estatisticas.solicitacoes.porMes.forEach(item => {
      solicitacoesPorMes.set(item.mes, item.total);
    });
    
    estatisticas.monitorizacao.porMes.forEach(item => {
      monitorizacaoPorMes.set(item.mes, item.total);
    });
    
    // Criar array de dados combinados
    return Array.from(mesesUnicos).sort().map(mes => ({
      mes: formatarMes(mes),
      solicitacoes: solicitacoesPorMes.get(mes) || 0,
      monitorizacao: monitorizacaoPorMes.get(mes) || 0
    }));
  };

  // Renderizar gráfico de barras por mês
  const renderGraficoPorMes = () => {
    const dados = prepararDadosPorMes();
    
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={dados} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="mes" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="solicitacoes" name="Autorizações" fill="#0088FE" />
          <Bar dataKey="monitorizacao" name="Monitorização" fill="#00C49F" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // Renderizar gráfico de pizza para solicitações por status
  const renderGraficoPizzaSolicitacoes = () => {
    if (!estatisticas || !estatisticas.solicitacoes.porStatus.length) {
      return <div className="text-center text-muted-foreground">Sem dados disponíveis</div>;
    }
    
    return (
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={estatisticas.solicitacoes.porStatus}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="total"
            nameKey="categoria"
          >
            {estatisticas.solicitacoes.porStatus.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value} processos`, 'Total']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // Renderizar gráfico de pizza para monitorização por status
  const renderGraficoPizzaMonitorizacao = () => {
    if (!estatisticas || !estatisticas.monitorizacao.porStatus.length) {
      return <div className="text-center text-muted-foreground">Sem dados disponíveis</div>;
    }
    
    return (
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={estatisticas.monitorizacao.porStatus}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="total"
            nameKey="categoria"
          >
            {estatisticas.monitorizacao.porStatus.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value} processos`, 'Total']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // Renderizar lista de solicitações recentes
  const renderSolicitacoesRecentes = () => {
    if (!estatisticas || !estatisticas.solicitacoes.recentes.length) {
      return <div className="text-center text-muted-foreground py-4">Nenhuma solicitação recente</div>;
    }
    
    return (
      <div className="space-y-3">
        {estatisticas.solicitacoes.recentes.map((solicitacao) => (
          <div key={solicitacao.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">{solicitacao.tipoSolicitacao || "Autorização"}</div>
                <div className="text-sm text-muted-foreground">ID: {solicitacao.id} • {formatarData(solicitacao.createdAt)}</div>
              </div>
            </div>
            <Badge className={statusColors[solicitacao.status] || ""}>
              {statusLabels[solicitacao.status] || solicitacao.status}
            </Badge>
          </div>
        ))}
        <div className="text-center pt-2">
          <Button variant="outline" size="sm" asChild>
            <a href="/utente/solicitacoes">Ver todas as solicitações</a>
          </Button>
        </div>
      </div>
    );
  };

  // Renderizar lista de processos de monitorização recentes
  const renderMonitorizacaoRecentes = () => {
    if (!estatisticas || !estatisticas.monitorizacao.recentes.length) {
      return <div className="text-center text-muted-foreground py-4">Nenhum processo de monitorização recente</div>;
    }
    
    return (
      <div className="space-y-3">
        {estatisticas.monitorizacao.recentes.map((processo) => (
          <div key={processo.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">
                  {processo.periodo ? `${processo.periodo.tipoPeriodo} - Período ${processo.periodo.numeroPeriodo}` : `Processo ${processo.id}`}
                </div>
                <div className="text-sm text-muted-foreground">ID: {processo.id} • {formatarData(processo.createdAt)}</div>
              </div>
            </div>
            <Badge className={statusColors[processo.estadoProcesso] || ""}>
              {statusLabels[processo.estadoProcesso] || processo.estadoProcesso}
            </Badge>
          </div>
        ))}
        <div className="text-center pt-2">
          <Button variant="outline" size="sm" asChild>
            <a href="/utente/ut_monitorizacao">Ver todos os processos</a>
          </Button>
        </div>
      </div>
    );
  };

  // Renderizar cards de resumo
  const renderCardsResumo = () => {
    if (!estatisticas) return null;
    
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Solicitações</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.solicitacoes.total}</div>
            <p className="text-xs text-muted-foreground">Autorizações ambientais solicitadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Monitorizações</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.monitorizacao.total}</div>
            <p className="text-xs text-muted-foreground">Processos de monitorização</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solicitações Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {estatisticas.solicitacoes.porStatus.find(s => s.categoria === "Pendentes")?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">Aguardando processamento</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monitorizações Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {estatisticas.monitorizacao.porStatus.find(s => s.categoria === "Pendentes")?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">Aguardando processamento</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Renderizar conteúdo principal
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Carregando estatísticas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertTriangle className="h-8 w-8 text-destructive mb-4" />
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral dos seus processos e solicitações.</p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Atualizar dados
        </Button>
      </div>

      {renderCardsResumo()}

      <Tabs defaultValue="grafico-mensal" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-3">
          <TabsTrigger value="grafico-mensal">Evolução Mensal</TabsTrigger>
          <TabsTrigger value="solicitacoes">Autorizações</TabsTrigger>
          <TabsTrigger value="monitorizacao">Monitorização</TabsTrigger>
        </TabsList>
        <TabsContent value="grafico-mensal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evolução Mensal de Processos</CardTitle>
              <CardDescription>
                Número de solicitações e processos de monitorização nos últimos 6 meses.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderGraficoPorMes()}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="solicitacoes" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Solicitações por Status</CardTitle>
                <CardDescription>
                  Distribuição das solicitações de autorização por status.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderGraficoPizzaSolicitacoes()}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Solicitações Recentes</CardTitle>
                <CardDescription>
                  Últimas solicitações de autorização ambiental.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderSolicitacoesRecentes()}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="monitorizacao" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monitorização por Status</CardTitle>
                <CardDescription>
                  Distribuição dos processos de monitorização por status.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderGraficoPizzaMonitorizacao()}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Processos Recentes</CardTitle>
                <CardDescription>
                  Últimos processos de monitorização ambiental.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderMonitorizacaoRecentes()}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
