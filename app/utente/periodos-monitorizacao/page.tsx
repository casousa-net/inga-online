"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "components/ui/button";
import { Badge } from "components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "components/ui/card";
import { CheckCircle, Clock, XCircle, FileText, AlertTriangle, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Tipos
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

// Dados mockados para demonstração
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

export default function PeriodosMonitorizacaoPage() {
  const [configuracao, setConfiguracao] = useState<ConfiguracaoMonitorizacao | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Aqui seria feita a chamada à API para buscar a configuração real do utente
    // Por enquanto, usamos dados mockados
    setTimeout(() => {
      setConfiguracao(mockConfiguracao);
      setLoading(false);
    }, 500);
  }, []);

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
      router.push("/utente/ut_monitorizacao");
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

  if (loading) {
    return (
      <div className="p-8 min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-700 mx-auto mb-4"></div>
          <p className="text-lime-700 font-medium">Carregando períodos de monitorização...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen bg-background">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-lime-700 font-semibold">Períodos de Monitorização</span>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">Períodos de Monitorização</h1>
          {configuracao && (
            <p className="text-gray-600 mt-2">
              Periodicidade: <span className="font-semibold">{configuracao.tipoPeriodo.charAt(0) + configuracao.tipoPeriodo.slice(1).toLowerCase()}</span>
            </p>
          )}
        </div>
      </div>

      {!configuracao ? (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {configuracao.periodos.map((periodo) => (
            <Card 
              key={periodo.id} 
              className={`border-2 transition-all duration-300 hover:shadow-md ${
                periodo.estado === "ABERTO" ? "border-green-300" : 
                periodo.estado === "FECHADO" ? "border-red-300" : 
                periodo.estado === "REABERTURA_SOLICITADA" ? "border-blue-300" : "border-yellow-300"
              }`}
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
      )}
    </div>
  );
}
