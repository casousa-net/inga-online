"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "components/ui/select";
import { Badge } from "components/ui/badge";
import { CheckCircle, Clock, XCircle, Download, Eye, FileText, AlertTriangle, RefreshCw } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "components/ui/table";
import { FiX } from "react-icons/fi";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Tipos para períodos de monitorização
interface Periodo {
  id: number;
  numeroPeriodo: number;
  dataInicio: string;
  dataFim: string;
  estado: "ABERTO" | "FECHADO" | "AGUARDANDO_REAVALIACAO" | "REABERTURA_SOLICITADA";
}

interface ConfiguracaoMonitorizacao {
  id: number;
  tipoPeriodo: "ANUAL" | "SEMESTRAL" | "TRIMESTRAL";
  dataInicio: string;
  periodos: Periodo[];
}

// Dados mockados para demonstração de períodos
const mockConfiguracao: ConfiguracaoMonitorizacao = {
  id: 1,
  tipoPeriodo: "TRIMESTRAL",
  dataInicio: "2025-01-01T00:00:00.000Z",
  periodos: [
    {
      id: 1,
      numeroPeriodo: 1,
      dataInicio: "2025-01-01T00:00:00.000Z",
      dataFim: "2025-03-31T23:59:59.999Z",
      estado: "FECHADO"
    },
    {
      id: 2,
      numeroPeriodo: 2,
      dataInicio: "2025-04-01T00:00:00.000Z",
      dataFim: "2025-06-30T23:59:59.999Z",
      estado: "ABERTO"
    },
    {
      id: 3,
      numeroPeriodo: 3,
      dataInicio: "2025-07-01T00:00:00.000Z",
      dataFim: "2025-09-30T23:59:59.999Z",
      estado: "FECHADO"
    },
    {
      id: 4,
      numeroPeriodo: 4,
      dataInicio: "2025-10-01T00:00:00.000Z",
      dataFim: "2025-12-31T23:59:59.999Z",
      estado: "REABERTURA_SOLICITADA"
    }
  ]
};

// Dados mockados para monitorização
const mockMonitorizacoes = [
  {
    numero: "MO-000001",
    data: "2025-05-01",
    estado: "Aguardando RUPE",
    rupe: "Sem RUPE",
    relatorio: "Relatorio1.pdf",
    parecer: null,
  },
  {
    numero: "MO-000002",
    data: "2025-04-22",
    estado: "Aguardando Pagamento",
    rupe: "123456789012345678901",
    relatorio: "Relatorio2.pdf",
    parecer: null,
  },
  {
    numero: "MO-000003",
    data: "2025-04-10",
    estado: "Aprovado",
    rupe: "123456789012345678901",
    relatorio: "Relatorio3.pdf",
    parecer: "ParecerTecnico3.pdf",
  },
];

const estados = ["Aguardando RUPE", "Aguardando Pagamento", "Aprovado", "Rejeitado", "Carece de Melhorias"];

export default function ut_Page() {
  const [loading, setLoading] = useState(false);
  const [configuracao, setConfiguracao] = useState<ConfiguracaoMonitorizacao | null>(null);
  const [loadingPeriodos, setLoadingPeriodos] = useState(true);

  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    estado: '',
    search: '',
  });
  const [form, setForm] = useState({
    relatorio: null as File | null,
    periodoId: null as number | null,
  });
  
  useEffect(() => {
    // Aqui seria feita a chamada à API para buscar a configuração real do utente
    // Por enquanto, usamos dados mockados
    setTimeout(() => {
      setConfiguracao(mockConfiguracao);
      setLoadingPeriodos(false);
    }, 500);
  }, []);

  const filteredData = mockMonitorizacoes.filter(item =>
    (filters.estado ? item.estado === filters.estado : true) &&
    (filters.search ? item.numero.includes(filters.search) : true)
  );

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, relatorio: e.target.files?.[0] || null });
  };

  // Funções para os períodos de monitorização
  // Função para obter o título do período baseado no número e tipo
  const getTituloPeriodo = (numeroPeriodo: number, tipoPeriodo: string) => {
    switch (tipoPeriodo) {
      case "ANUAL":
        return "Relatório Anual";
      case "SEMESTRAL":
        return `${numeroPeriodo}º Semestre`;
      case "TRIMESTRAL":
        return `${numeroPeriodo}º Trimestre`;
      default:
        return `Período ${numeroPeriodo}`;
    }
  };

  // Função para formatar a data em formato legível
  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return format(data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  // Função para obter a cor do badge baseado no estado
  const getCorBadge = (estado: string) => {
    switch (estado) {
      case "ABERTO":
        return "bg-green-100 text-green-800 border-green-300";
      case "FECHADO":
        return "bg-red-100 text-red-800 border-red-300";
      case "AGUARDANDO_REAVALIACAO":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "REABERTURA_SOLICITADA":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  // Função para obter o ícone baseado no estado
  const getIconeEstado = (estado: string) => {
    switch (estado) {
      case "ABERTO":
        return <CheckCircle className="text-green-600" size={18} />;
      case "FECHADO":
        return <XCircle className="text-red-600" size={18} />;
      case "AGUARDANDO_REAVALIACAO":
        return <Clock className="text-yellow-600" size={18} />;
      case "REABERTURA_SOLICITADA":
        return <RefreshCw className="text-blue-600" size={18} />;
      default:
        return <AlertTriangle className="text-gray-600" size={18} />;
    }
  };

  // Função para obter o texto do estado em português
  const getTextoEstado = (estado: string) => {
    switch (estado) {
      case "ABERTO":
        return "Aberto";
      case "FECHADO":
        return "Fechado";
      case "AGUARDANDO_REAVALIACAO":
        return "Aguardando Reavaliação";
      case "REABERTURA_SOLICITADA":
        return "Reabertura Solicitada";
      default:
        return estado;
    }
  };

  // Função para lidar com o clique no período
  const handleClickPeriodo = (periodo: Periodo) => {
    if (periodo.estado === "ABERTO") {
      setForm({ ...form, periodoId: periodo.id });
      setShowModal(true);
    } else if (periodo.estado === "FECHADO") {
      // Abrir modal para solicitar reabertura
      alert("Deseja solicitar a reabertura deste período?");
    }
  };

  // Função para solicitar reabertura
  const solicitarReabertura = (periodoId: number) => {
    // Aqui seria feita a chamada à API para solicitar a reabertura
    alert(`Reabertura solicitada para o período ${periodoId}`);
  };

  return (
    <div className="p-8 min-h-screen bg-background">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-lime-700 font-semibold">Monitorização</span>
      </div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-extrabold text-primary tracking-tight">Monitorização</h1>
        <Button
          className="bg-lime-600 hover:bg-lime-700 text-white font-semibold rounded-lg shadow"
          onClick={() => setShowModal(true)}
        >
          + Solicitar Monitorização
        </Button>
      </div>
      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <Input
          placeholder="Buscar Nº Processo"
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          className="max-w-xs"
        />
        <Select
          value={filters.estado}
          onValueChange={v => setFilters(f => ({ ...f, estado: v }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            {estados.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          className="text-gray-500 border border-gray-200 hover:bg-gray-100"
          onClick={() => setFilters({ estado: '', search: '' })}
        >
          Limpar Filtros
        </Button>
      </div>
      {/* Tabela */}
      <Table className="rounded-xl shadow-md bg-white border border-base-200">
        <TableHeader>
          <TableRow>
            <TableHead>Nº Processo</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>RUPE</TableHead>
            <TableHead>Relatório</TableHead>
            <TableHead>Parecer Técnico</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map(item => (
            <TableRow key={item.numero} className="hover:bg-base-100 transition">
              <TableCell className="font-mono">{item.numero}</TableCell>
              <TableCell>{item.data}</TableCell>
              <TableCell>
                <Badge variant={
                  item.estado === 'Aprovado' ? 'default' :
                    item.estado === 'Rejeitado' ? 'destructive' :
                      'secondary'
                } className="flex items-center gap-1 px-2">
                  {item.estado === 'Aprovado' && <CheckCircle className="text-green-600" size={16} />}
                  {item.estado.toLowerCase().includes('aguardando') && <Clock className="text-yellow-500" size={16} />}
                  {item.estado === 'Rejeitado' && <XCircle className="text-red-500" size={16} />}
                  {item.estado}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={item.rupe !== 'Sem RUPE' ? 'default' : 'secondary'} className="flex items-center gap-1 px-2">
                  {item.rupe !== 'Sem RUPE' && <CheckCircle className="text-green-600" size={16} />}
                  {item.rupe === 'Sem RUPE' && <XCircle className="text-red-500" size={16} />}
                  {item.rupe !== 'Sem RUPE' ? 'Disponível' : 'Sem RUPE'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={item.relatorio ? 'default' : 'secondary'} className="flex items-center gap-1 px-2">
                  {item.relatorio && <CheckCircle className="text-green-600" size={16} />}
                  {!item.relatorio && <XCircle className="text-red-500" size={16} />}
                  {item.relatorio ? 'Disponível' : 'Não enviado'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={item.parecer ? 'default' : 'secondary'} className="flex items-center gap-1 px-2">
                  {item.parecer && <CheckCircle className="text-green-600" size={16} />}
                  {!item.parecer && <XCircle className="text-red-500" size={16} />}
                  {item.parecer ? 'Disponível' : 'Indisponível'}
                </Badge>
              </TableCell>
              <TableCell className="flex gap-2">
                <Badge variant="secondary" className="flex items-center gap-1 px-2 cursor-pointer" asChild>
                  <Button size="sm" variant="ghost" onClick={() => {
                    setLoading(true);
                    router.push(`/utente/ut_monitorizacao/${item.numero}`);
                  }}>
                    <Eye className="text-green-600" size={16} /> Ver Processo
                  </Button>
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1 px-2 cursor-pointer" asChild>
                  <Button size="sm" variant="ghost">
                    <Download className="text-lime-700" size={16} /> Baixar
                  </Button>
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Seção de Períodos de Monitorização */}
      <div className="mt-12 mb-8">
        <h2 className="text-2xl font-bold text-lime-800 mb-6">Períodos para Envio de Relatórios</h2>
        
        {loadingPeriodos ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-700 mx-auto mb-4"></div>
              <p className="text-lime-700 font-medium">Carregando períodos...</p>
            </div>
          </div>
        ) : !configuracao ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertTriangle className="text-yellow-500 mr-3 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-yellow-800">Nenhuma configuração de monitorização encontrada</h3>
                <p className="text-yellow-700 mt-1">
                  Entre em contato com a administração para configurar seus períodos de monitorização.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-lime-50 border border-lime-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <CheckCircle className="text-lime-600 mr-3 mt-0.5" size={20} />
                <div>
                  <h3 className="font-semibold text-lime-800">Periodicidade: {configuracao.tipoPeriodo.charAt(0) + configuracao.tipoPeriodo.slice(1).toLowerCase()}</h3>
                  <p className="text-lime-700 mt-1">
                    Você deve enviar seus relatórios de monitorização conforme os períodos abaixo.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {configuracao.periodos.map((periodo) => (
                <Card 
                  key={periodo.id} 
                  className={`border-2 transition-all duration-300 hover:shadow-md ${periodo.estado === "ABERTO" ? "border-green-300" : periodo.estado === "FECHADO" ? "border-red-300" : periodo.estado === "REABERTURA_SOLICITADA" ? "border-blue-300" : "border-yellow-300"}`}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl font-bold text-lime-800">
                      {getTituloPeriodo(periodo.numeroPeriodo, configuracao.tipoPeriodo)}
                    </CardTitle>
                    <CardDescription>
                      {formatarData(periodo.dataInicio)} até {formatarData(periodo.dataFim)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge 
                      className={`px-3 py-1 ${getCorBadge(periodo.estado)} flex items-center gap-1.5 mb-4`}
                    >
                      {getIconeEstado(periodo.estado)}
                      {getTextoEstado(periodo.estado)}
                    </Badge>
                    
                    <p className="text-gray-600 text-sm mb-2">
                      {periodo.estado === "ABERTO" ? (
                        <>Você pode enviar seu relatório até <span className="font-semibold">{formatarData(periodo.dataFim)}</span></>
                      ) : periodo.estado === "FECHADO" ? (
                        <>Este período está fechado. Você pode solicitar a reabertura.</>
                      ) : periodo.estado === "REABERTURA_SOLICITADA" ? (
                        <>Aguardando aprovação da solicitação de reabertura.</>
                      ) : (
                        <>Seu relatório está sendo reavaliado pela equipe técnica.</>
                      )}
                    </p>
                  </CardContent>
                  <CardFooter>
                    {periodo.estado === "ABERTO" ? (
                      <Button 
                        className="w-full bg-lime-600 hover:bg-lime-700 text-white"
                        onClick={() => handleClickPeriodo(periodo)}
                      >
                        <FileText className="mr-2" size={16} />
                        Enviar Relatório
                      </Button>
                    ) : periodo.estado === "FECHADO" ? (
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => solicitarReabertura(periodo.id)}
                      >
                        <RefreshCw className="mr-2" size={16} />
                        Solicitar Reabertura
                      </Button>
                    ) : periodo.estado === "REABERTURA_SOLICITADA" ? (
                      <Button 
                        className="w-full bg-gray-400 hover:bg-gray-500 text-white"
                        disabled
                      >
                        <Clock className="mr-2" size={16} />
                        Aguardando Aprovação
                      </Button>
                    ) : (
                      <Button 
                        className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                        disabled
                      >
                        <Clock className="mr-2" size={16} />
                        Em Reavaliação
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal Solicitação Monitorização */}
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
              <h2 className="text-2xl font-extrabold mb-6 text-lime-700 tracking-tight animate-fade-down">Solicitar Monitorização</h2>
              <div className="mb-6 animate-fade-up">
                <label className="block text-sm font-semibold mb-2 text-gray-700">Relatório (PDF)</label>
                <Input type="file" accept="application/pdf" onChange={handleUpload} className="file:bg-lime-100 file:text-lime-900 file:rounded-lg file:border-none file:font-semibold file:shadow-sm transition" />
              </div>
              {form.periodoId && (
                <div className="mb-6 animate-fade-up bg-lime-50 p-3 rounded-lg border border-lime-200">
                  <p className="text-sm text-lime-800">
                    <span className="font-semibold">Período selecionado:</span> {configuracao?.periodos.find(p => p.id === form.periodoId)?.numeroPeriodo}º {configuracao ? configuracao.tipoPeriodo.charAt(0) + configuracao.tipoPeriodo.slice(1).toLowerCase() : ''}
                  </p>
                  <p className="text-xs text-lime-700 mt-1">
                    Este relatório será associado ao período selecionado.
                  </p>
                </div>
              )}
              <Button
                className="w-full bg-lime-600 text-white rounded-xl font-bold shadow-lg hover:bg-lime-700 hover:scale-[1.02] active:scale-95 transition-all duration-200"
                disabled={!form.relatorio}
                onClick={() => {
                  // Aqui seria feita a chamada à API para enviar o relatório
                  setShowModal(false);
                  alert("Relatório enviado com sucesso!");
                }}>
                Enviar Relatório
              </Button>
            </div>
          </div>
          <style jsx global>{`
            .animate-fade-in {
              animation: fadeInBg 0.35s cubic-bezier(.4,0,.2,1);
            }
            .animate-modal-pop {
              animation: modalPop 0.33s cubic-bezier(.4,0,.2,1);
            }
            .animate-fade-down {
              animation: fadeDown 0.3s 0.05s both;
            }
            .animate-fade-up {
              animation: fadeUp 0.3s 0.12s both;
            }
            @keyframes fadeInBg {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes modalPop {
              from { opacity: 0; transform: scale(0.93) translateY(30px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
            @keyframes fadeDown {
              from { opacity: 0; transform: translateY(-16px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes fadeUp {
              from { opacity: 0; transform: translateY(16px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      )}
      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <span className="inline-block animate-spin-slow">
            <svg className="w-16 h-16 text-lime-500" fill="none" viewBox="0 0 32 32">
              <circle className="opacity-20" cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="4" />
              <path d="M30 16a14 14 0 0 1-14 14" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </span>
          <style jsx global>{`
            .animate-spin-slow {
              animation: spin 1.2s linear infinite;
            }
            @keyframes spin {
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}