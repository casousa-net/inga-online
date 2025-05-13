'use client';

import { useEffect, useState } from 'react';
import { Card, Text, Metric, Flex, ProgressBar } from '@tremor/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/20/solid';

type DashboardData = {
  totalColaboradores: number;
  totalUtentes: number;
  processosPendentes: {
    hoje: number;
    ontem: number;
    variacao: number;
  };
  taxasRecebidas: {
    hoje: number;
    ontem: number;
    mes: number;
    ano: number;
  };
  processosAssinados: {
    hoje: number;
    mes: number;
    ano: number;
  };
  topProdutos: {
    mes: Array<{
      codigo: string;
      descricao: string;
      total: number;
    }>;
    ano: Array<{
      codigo: string;
      descricao: string;
      total: number;
    }>;
  };
  topUtentes: {
    mes: Array<{
      nome: string;
      nif: string;
      total_solicitacoes: number;
    }>;
    ano: Array<{
      nome: string;
      nif: string;
      total_solicitacoes: number;
    }>;
  };
};

export default function DireccaoHome() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Default data structure to prevent undefined errors
  const defaultData: DashboardData = {
    totalColaboradores: 0,
    totalUtentes: 0,
    processosPendentes: {
      hoje: 0,
      ontem: 0,
      variacao: 0
    },
    taxasRecebidas: {
      hoje: 0,
      ontem: 0,
      mes: 0,
      ano: 0
    },
    processosAssinados: {
      hoje: 0,
      mes: 0,
      ano: 0
    },
    topProdutos: {
      mes: [],
      ano: []
    },
    topUtentes: {
      mes: [],
      ano: []
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard/autorizacao');
        if (!response.ok) {
          throw new Error(`Erro na resposta: ${response.status}`);
        }
        const jsonData = await response.json();
        
        // Validate data structure
        if (!jsonData || typeof jsonData !== 'object') {
          throw new Error('Formato de dados inválido');
        }
        
        setData(jsonData);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        setError(error instanceof Error ? error.message : 'Erro desconhecido');
        // Set default data to prevent undefined errors
        setData(defaultData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-lg">Carregando dados do dashboard...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-lg text-red-500">
          Erro ao carregar dados do dashboard: {error || 'Erro desconhecido'}. Por favor, tente novamente.
        </div>
      </div>
    );
  }
  
  // Log data for debugging
  console.log('Dashboard data:', data);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">Painel da Direcção</h1>
        <Badge variant="outline">Autorização</Badge>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-md hover:shadow-lg transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <Text className="text-blue-500 font-medium">Total de Colaboradores</Text>
              <Metric className="text-blue-700">{data.totalColaboradores}</Metric>
            </div>
            <div className="bg-blue-100 p-2 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-md hover:shadow-lg transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <Text className="text-purple-500 font-medium">Total de Utentes</Text>
              <Metric className="text-purple-700">{data.totalUtentes}</Metric>
            </div>
            <div className="bg-purple-100 p-2 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 shadow-md hover:shadow-lg transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <Text className="text-amber-500 font-medium">Processos Pendentes</Text>
              <Metric className="text-amber-700">{data.processosPendentes.hoje}</Metric>
            </div>
            <div className="bg-amber-100 p-2 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <Flex className="mt-2">
            <Text className="text-gray-600">Assinados Hoje</Text>
            <div className="flex items-center">
              <Text className="text-amber-700 font-medium">{data.processosAssinados.hoje}</Text>
            </div>
          </Flex>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-md hover:shadow-lg transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <Text className="text-emerald-500 font-medium">Taxas Recebidas (Hoje)</Text>
              <Metric className="text-emerald-700">{data.taxasRecebidas.hoje.toLocaleString('pt-AO')} KZ</Metric>
            </div>
            <div className="bg-emerald-100 p-2 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <Flex className="mt-2">
            <Text className="text-gray-600">Ontem</Text>
            <div className="flex items-center">
              {data.taxasRecebidas.hoje > data.taxasRecebidas.ontem ? (
                <>
                  <ArrowUpIcon className="w-4 h-4 text-green-500 mr-1" />
                  <Text className="text-green-500 font-medium">{data.taxasRecebidas.ontem.toLocaleString('pt-AO')} KZ</Text>
                </>
              ) : (
                <>
                  <ArrowDownIcon className="w-4 h-4 text-red-500 mr-1" />
                  <Text className="text-red-500 font-medium">{data.taxasRecebidas.ontem.toLocaleString('pt-AO')} KZ</Text>
                </>
              )}
            </div>
          </Flex>
        </Card>
      </div>

      {/* Gráficos e Tabelas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Produtos */}
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <Tabs defaultValue="mes" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <Text className="text-lg font-medium">Top 10 Produtos Mais Solicitados</Text>
              <TabsList className="bg-gray-100">
                <TabsTrigger value="mes" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Mês</TabsTrigger>
                <TabsTrigger value="ano" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Ano</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="mes">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.topProdutos.mes} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorTotalMes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="codigo" 
                    tick={{ fontSize: 12 }} 
                    angle={-45} 
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      borderRadius: '8px', 
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)', 
                      border: 'none' 
                    }} 
                    formatter={(value) => [`${value} solicitações`, 'Total']}
                    labelFormatter={(label) => `Código: ${label}`}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Bar 
                    dataKey="total" 
                    name="Solicitações" 
                    fill="url(#colorTotalMes)" 
                    radius={[4, 4, 0, 0]}
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
              {data.topProdutos.mes.length === 0 && (
                <div className="flex justify-center items-center h-[200px]">
                  <Text className="text-gray-500">Nenhum produto encontrado para este mês</Text>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="ano">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.topProdutos.ano} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorTotalAno" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="codigo" 
                    tick={{ fontSize: 12 }} 
                    angle={-45} 
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      borderRadius: '8px', 
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)', 
                      border: 'none' 
                    }} 
                    formatter={(value) => [`${value} solicitações`, 'Total']}
                    labelFormatter={(label) => `Código: ${label}`}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Bar 
                    dataKey="total" 
                    name="Solicitações" 
                    fill="url(#colorTotalAno)" 
                    radius={[4, 4, 0, 0]}
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
              {data.topProdutos.ano.length === 0 && (
                <div className="flex justify-center items-center h-[200px]">
                  <Text className="text-gray-500">Nenhum produto encontrado para este ano</Text>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>

        {/* Top Utentes */}
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <Tabs defaultValue="mes" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <Text className="text-lg font-medium">Top 10 Utentes</Text>
              <TabsList className="bg-gray-100">
                <TabsTrigger value="mes" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">Mês</TabsTrigger>
                <TabsTrigger value="ano" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">Ano</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="mes">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={data.topUtentes.mes} 
                  layout="vertical" 
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="colorUtentesMes" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={true} />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="nome" 
                    type="category" 
                    tick={{ fontSize: 12 }}
                    width={100}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      borderRadius: '8px', 
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)', 
                      border: 'none' 
                    }} 
                    formatter={(value) => [`${value} solicitações`, 'Total']}
                    labelFormatter={(label) => `Utente: ${label}`}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Bar 
                    dataKey="total_solicitacoes" 
                    name="Solicitações" 
                    fill="url(#colorUtentesMes)" 
                    radius={[0, 4, 4, 0]}
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
              {data.topUtentes.mes.length === 0 && (
                <div className="flex justify-center items-center h-[200px]">
                  <Text className="text-gray-500">Nenhum utente encontrado para este mês</Text>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="ano">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={data.topUtentes.ano} 
                  layout="vertical" 
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="colorUtentesAno" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="5%" stopColor="#047857" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={true} />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="nome" 
                    type="category" 
                    tick={{ fontSize: 12 }}
                    width={100}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      borderRadius: '8px', 
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)', 
                      border: 'none' 
                    }} 
                    formatter={(value) => [`${value} solicitações`, 'Total']}
                    labelFormatter={(label) => `Utente: ${label}`}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Bar 
                    dataKey="total_solicitacoes" 
                    name="Solicitações" 
                    fill="url(#colorUtentesAno)" 
                    radius={[0, 4, 4, 0]}
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
              {data.topUtentes.ano.length === 0 && (
                <div className="flex justify-center items-center h-[200px]">
                  <Text className="text-gray-500">Nenhum utente encontrado para este ano</Text>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* Taxas e Processos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <Tabs defaultValue="mes" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <Text className="text-lg font-medium">Taxas e Processos</Text>
              <TabsList className="bg-gray-100">
                <TabsTrigger value="mes" className="data-[state=active]:bg-primary data-[state=active]:text-white">Mês</TabsTrigger>
                <TabsTrigger value="ano" className="data-[state=active]:bg-primary data-[state=active]:text-white">Ano</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="mes">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-indigo-100 p-2 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <Text className="text-indigo-500 font-medium">Total de Taxas Recebidas</Text>
                  </div>
                  <Metric className="text-indigo-700 ml-11">{data.taxasRecebidas.mes.toLocaleString('pt-AO')} KZ</Metric>
                  <div className="mt-2 ml-11">
                    <ProgressBar value={65} color="indigo" className="mt-2" />
                    <Text className="text-xs text-gray-500 mt-1">65% da meta mensal</Text>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-rose-50 to-rose-100 p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-rose-100 p-2 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <Text className="text-rose-500 font-medium">Processos Assinados</Text>
                  </div>
                  <Metric className="text-rose-700 ml-11">{data.processosAssinados.mes}</Metric>
                  <div className="mt-2 ml-11">
                    <ProgressBar value={80} color="rose" className="mt-2" />
                    <Text className="text-xs text-gray-500 mt-1">80% da meta mensal</Text>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="ano">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-indigo-100 p-2 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <Text className="text-indigo-500 font-medium">Total de Taxas Recebidas</Text>
                  </div>
                  <Metric className="text-indigo-700 ml-11">{data.taxasRecebidas.ano.toLocaleString('pt-AO')} KZ</Metric>
                  <div className="mt-2 ml-11">
                    <ProgressBar value={45} color="indigo" className="mt-2" />
                    <Text className="text-xs text-gray-500 mt-1">45% da meta anual</Text>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-rose-50 to-rose-100 p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-rose-100 p-2 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <Text className="text-rose-500 font-medium">Processos Assinados</Text>
                  </div>
                  <Metric className="text-rose-700 ml-11">{data.processosAssinados.ano}</Metric>
                  <div className="mt-2 ml-11">
                    <ProgressBar value={50} color="rose" className="mt-2" />
                    <Text className="text-xs text-gray-500 mt-1">50% da meta anual</Text>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
        
        {/* Gráfico de Donut para Distribuição de Processos */}
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <Text className="text-lg font-medium">Distribuição de Processos</Text>
            <Badge variant="outline" className="bg-cyan-50">Mensal</Badge>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart 
              data={[
                { name: 'Importação', value: 65 },
                { name: 'Exportação', value: 25 },
                { name: 'Reexportação', value: 10 }
              ]} 
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorProcessos" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#7dd3fc" stopOpacity={0.3}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={true} />
              <XAxis type="number" />
              <YAxis 
                dataKey="name" 
                type="category" 
                tick={{ fontSize: 12 }}
                width={100}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  borderRadius: '8px', 
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)', 
                  border: 'none' 
                }} 
                formatter={(value) => [`${value} processos`, 'Total']}
                labelFormatter={(label) => `Tipo: ${label}`}
              />
              <Bar 
                dataKey="value" 
                name="Processos" 
                fill="url(#colorProcessos)" 
                radius={[0, 4, 4, 0]}
                animationDuration={1500}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
