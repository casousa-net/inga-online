"use client";
import React, { useState, useEffect } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Eye, FilePlus2, Upload, CalendarCheck2, BadgeCheck, AlertCircle, XCircle,
  FileText, Loader2, CheckCircle2 as CheckCircle, Calendar, CheckSquare, FileCheck,
  FileIcon, ClipboardCheck, Receipt, RefreshCw
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import AprovarReaberturaButton from "./components/AprovarReaberturaButton";

interface TecnicoSelecionado {
  id: number;
  nome: string;
}

// Função utilitária para normalizar tecnicosSelecionados
function normalizeTecnicosSelecionados(tecnicosSelecionados: string | TecnicoSelecionado[] | undefined): { id: number; nome: string }[] {
  console.log("Normalizando técnicos:", tecnicosSelecionados);

  if (!tecnicosSelecionados) return [];

  // Se for uma string, tentar vários formatos possíveis
  if (typeof tecnicosSelecionados === 'string') {
    // Verificar se é um formato "id:nome|id:nome"
    if (tecnicosSelecionados.includes('|') || tecnicosSelecionados.includes(':')) {
      console.log("Detectado formato id:nome|id:nome");
      return tecnicosSelecionados
        .split('|')
        .filter(Boolean)
        .map((tecnicoStr: string) => {
          const [id, ...nomeParts] = tecnicoStr.split(':');
          const nome = nomeParts.join(':').trim() || `Técnico ${id}`;
          return {
            id: Number(id) || 0,
            nome: nome
          };
        });
    }

    // Tentar parsear como JSON
    try {
      console.log("Tentando parsear como JSON");
      const parsed = JSON.parse(tecnicosSelecionados);
      if (Array.isArray(parsed)) {
        return parsed.map((t: any) => ({
          id: Number(t.id ?? t.tecnicoId ?? 0),
          nome: String(t.nome ?? t.label ?? t.name ?? `Técnico ${t.id ?? ''}`)
        }));
      }
    } catch (e) {
      console.log("Erro ao parsear JSON:", e);
    }

    // Fallback: pode ser uma lista separada por vírgulas
    console.log("Usando fallback de lista separada por vírgulas");
    return tecnicosSelecionados.split(',').map((nome, idx) => ({ id: idx + 1, nome: nome.trim() }));
  }

  // Se for um array, mapear para o formato correto
  if (Array.isArray(tecnicosSelecionados)) {
    console.log("Processando array de técnicos");
    return tecnicosSelecionados.map((t: any) => {
      const id = Number(t.id ?? t.tecnicoId ?? 0);
      const nome = String(t.nome ?? t.label ?? t.name ?? `Técnico ${id}`);
      console.log(`Técnico processado: id=${id}, nome=${nome}`);
      return { id, nome };
    });
  }

  console.log("Nenhum técnico encontrado");
  return [];
}


interface Monitorizacao {
  id: number;
  utenteId: number;
  utente: {
    nome: string;
    telefone: string;
    email: string;
  };
  dataVisita?: string | null;
  dataVisitaRealizada?: string | null;
  observacoes?: string | null;
  status: string;
  documentos: any[];
  tecnicosSelecionados?: string | TecnicoSelecionado[];
  createdAt: string;
  updatedAt: string;
  departamento: string;
  documentoFinalUrl?: string | null;
  documentoFinalName?: string | null;
  periodoId: number;
  relatorioPath: string;
  parecerTecnicoPath: string | null;
  rupePath: string | null;
  rupeReferencia: string | null;
  rupePago: boolean;
  documentoFinalPath: string | null;
  estado: string;
  estadoProcesso: string;
  autorizacaoDirecao: boolean;
  utenteNome: string;
  utenteNif: string;
  numeroPeriodo: number;
  periodoInicio: string;
  periodoFim: string;
  tipoPeriodo: string;
  motivoRejeicao?: string;
  dataPrevistaVisita?: string;
  dataRealizadaVisita?: string;
  relatorioVisitaPath?: string;
  // Campos para reabertura
  periodoEstado?: string;
  motivoReabertura?: string;
  dataSolicitacaoReabertura?: string;
  statusReabertura?: string;
}

interface Processo {
  id: number;
  utenteId: number;
  utenteNome: string;
  utenteNif: string;
  numeroPeriodo: number;
  tipoPeriodo: string;
  estadoProcesso: string;
  createdAt: string;
  rupePath?: string | null;
  rupePago?: boolean;
  dataPrevistaVisita?: string | null;
  dataVisita?: string | null;
  observacoesVisita?: string | null;
  documentoFinalPath?: string | null;
  tecnicosSelecionados?: { id: number; nome: string }[];
  periodoId: number;
  periodoEstado?: string;
  motivoReabertura?: string;
  dataSolicitacaoReabertura?: string;
  statusReabertura?: string;
}

const estadoProcessoLabels: Record<string, string> = {
  "AGUARDANDO_PARECER": "Aguardando Parecer Técnico",
  "AGUARDANDO_RUPE": "Aguardando RUPE",
  "AGUARDANDO_PAGAMENTO": "Aguardando Pagamento",
  "AGUARDANDO_CONFIRMACAO_PAGAMENTO": "Aguardando Confirmação de Pagamento",
  "AGUARDANDO_SELECAO_TECNICOS": "Aguardando Seleção de Técnicos",
  "AGUARDANDO_VISITA": "Aguardando Visita",
  "AGUARDANDO_DOCUMENTO_FINAL": "Aguardando Documento Final",
  "CONCLUIDO": "Concluído"
};

const estadoPeriodoLabels: Record<string, string> = {
  "ABERTO": "Aberto",
  "FECHADO": "Fechado",
  "SOLICITADA_REABERTURA": "Solicitação de Reabertura",
  "AGUARDANDO_APROVACAO_REABERTURA": "Aguardando Aprovação de Reabertura",
  "REABERTURA_SOLICITADA": "Reabertura Solicitada"
};

const estadoProcessoColors: Record<string, string> = {
  "AGUARDANDO_PARECER": "bg-blue-100 text-blue-700 border-none",
  "AGUARDANDO_RUPE": "bg-purple-100 text-purple-700 border-none",
  "AGUARDANDO_PAGAMENTO": "bg-amber-100 text-amber-700 border-none",
  "AGUARDANDO_CONFIRMACAO_PAGAMENTO": "bg-yellow-100 text-yellow-700 border-none",
  "AGUARDANDO_SELECAO_TECNICOS": "bg-orange-100 text-orange-700 border-none",
  "AGUARDANDO_VISITA": "bg-cyan-100 text-cyan-700 border-none",
  "AGUARDANDO_DOCUMENTO_FINAL": "bg-indigo-100 text-indigo-700 border-none",
  "CONCLUIDO": "bg-green-100 text-green-700 border-none"
};

export default function ChefeMonitorizacao() {
  const [processos, setProcessos] = useState<Monitorizacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProcesso, setSelectedProcesso] = useState<Monitorizacao | null>(null);
  const [isRupeDialogOpen, setIsRupeDialogOpen] = useState(false);
  const [isVisitaDialogOpen, setIsVisitaDialogOpen] = useState(false);
  const [isParecerDialogOpen, setIsParecerDialogOpen] = useState(false);
  const [isVisitaFeitaDialogOpen, setIsVisitaFeitaDialogOpen] = useState(false);
  const [isDocumentoFinalDialogOpen, setIsDocumentoFinalDialogOpen] = useState(false);
  const [selectedDocumentoFinalProcesso, setSelectedDocumentoFinalProcesso] = useState<Processo | null>(null);
  const [uploadingDocumentoFinal, setUploadingDocumentoFinal] = useState(false);
  const [rupeReferencia, setRupeReferencia] = useState("");
  const [rupeFile, setRupeFile] = useState<File | null>(null);
  const [dataPrevista, setDataPrevista] = useState("");
  const [tecnicosIds, setTecnicosIds] = useState<string[]>([]);
  const [parecerTipo, setParecerTipo] = useState<"APROVADO" | "CARECE_MELHORIAS" | "REJEITADO">("APROVADO");
  const [observacoes, setObservacoes] = useState("");
  const [parecerFile, setParecerFile] = useState<File | null>(null);
  const [relatorioVisitaFile, setRelatorioVisitaFile] = useState<File | null>(null);
  const [documentoFinalFile, setDocumentoFinalFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProcessos, setFilteredProcessos] = useState<Monitorizacao[]>([]);

  // Estado para o modal de aprovação de reabertura
  const [isReaberturaDialogOpen, setIsReaberturaDialogOpen] = useState(false);
  const [selectedReaberturaPeriodoId, setSelectedReaberturaPeriodoId] = useState<number | null>(null);
  const [rupeReaberturaNumero, setRupeReaberturaNumero] = useState('');
  const [processandoReabertura, setProcessandoReabertura] = useState(false);

  // Função para formatar datas
  const formatarData = (dataString: string) => {
    try {
      const data = new Date(dataString);
      return format(data, "dd/MM/yyyy", { locale: ptBR });
    } catch (error) {
      return dataString;
    }
  };

  // Função para processar os técnicos de um processo
  const processarTecnicos = (processo: Monitorizacao): TecnicoSelecionado[] => {
    try {
      if (!processo.tecnicosSelecionados) {
        return [];
      }

      // Se for uma string, converter para array de objetos
      if (typeof processo.tecnicosSelecionados === 'string') {
        // Verificar se é um JSON string
        if (processo.tecnicosSelecionados.trim().startsWith('[')) {
          try {
            const parsed = JSON.parse(processo.tecnicosSelecionados);
            if (Array.isArray(parsed)) {
              return parsed.map((item: any) => ({
                id: Number(item?.id || 0),
                nome: String(item?.nome || `Técnico ${item?.id || ''}`)
              }));
            }
          } catch (e) {
            console.warn('Falha ao fazer parse do JSON de técnicos:', e);
          }
        }

        // Se for formato "id:nome|id:nome"
        if (processo.tecnicosSelecionados.includes('|') || processo.tecnicosSelecionados.includes(':')) {
          return processo.tecnicosSelecionados
            .split('|')
            .filter(Boolean)
            .map((tecnicoStr: string) => {
              const [id, ...nomeParts] = tecnicoStr.split(':');
              const nome = nomeParts.join(':').trim();
              return {
                id: Number(id) || 0,
                nome: nome || `Técnico ${id || ''}`
              };
            });
        }

        // Se for apenas um ID
        const id = parseInt(processo.tecnicosSelecionados, 10);
        if (!isNaN(id)) {
          return [{ id, nome: `Técnico ${id}` }];
        }

        return [];
      }

      // Se for um array, mapear para o formato correto
      if (Array.isArray(processo.tecnicosSelecionados)) {
        return processo.tecnicosSelecionados.map((tecnico: any) => ({
          id: Number(tecnico?.id || 0),
          nome: String(tecnico?.nome || `Técnico ${tecnico?.id || ''}`)
        }));
      }

      return [];
    } catch (error) {
      console.error('Erro ao processar técnicos:', error);
      return [];
    }
  };

  // Função para renderizar o botão de rejeição
  const renderRejectButton = (processo: Monitorizacao) => {
    // Implementação do botão de rejeição
    return null; // Placeholder - implementar conforme necessário
  };

  // Buscar processos de monitorização
  const fetchProcessos = async () => {
    try {
      setLoading(true);
      // Obter o departamento do localStorage
      const departamento = localStorage.getItem('departamento') || 'monitorizacao';
      console.log('Buscando processos para departamento:', departamento);

      // Adicionar timestamp para evitar cache e garantir resposta mais recente
      const timestamp = new Date().getTime();
      const url = `/api/monitorizacao/chefe?departamento=${departamento}&t=${timestamp}`;
      console.log('Endpoint da API:', url);

      // Log para debug
      console.log('Iniciando fetch com credenciais:', 'include');

      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        // Adicionar credenciais para garantir que os cookies sejam enviados
        credentials: 'include'
      });

      // Log detalhado da resposta para debug
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries([...response.headers]));

      if (!response.ok) {
        // Tentar obter o corpo da resposta como texto para debug
        const responseText = await response.text();
        console.error('Resposta de erro (texto):', responseText);

        let errorMessage = `Erro do servidor: ${response.status}`;
        try {
          // Tentar parsear como JSON se possível
          const errorData = JSON.parse(responseText);
          console.error('Resposta da API não OK (JSON):', response.status, errorData);
          errorMessage = errorData.message || errorData.error || errorData.details || errorMessage;
        } catch (parseError) {
          console.error('Erro ao analisar resposta de erro como JSON:', parseError);
          // Se não for JSON, usar o texto bruto
          errorMessage = `${errorMessage} - ${responseText}`;
        }
        throw new Error(errorMessage);
      }

      // Log para debug
      console.log('Resposta OK, obtendo JSON...');

      const responseText = await response.text();
      console.log('Resposta como texto:', responseText.substring(0, 200) + '...');

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (jsonError: unknown) {
        console.error('Erro ao parsear resposta como JSON:', jsonError);
        console.error('Conteúdo da resposta:', responseText);
        throw new Error(`Erro ao parsear resposta da API: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
      }

      console.log(`Processos recebidos: ${data.processos ? data.processos.length : 0}`);
      if (data.processos) {
        console.log('Amostra dos dados:', JSON.stringify(data.processos[0] || {}, null, 2));
        
        // Verificar os dados de técnicos especificamente
        if (data.processos && data.processos.length > 0) {
          data.processos.forEach((processo: any, index: number) => {
            console.log(`Processo ${index} (ID: ${processo.id}) - Técnicos:`, processo.tecnicosSelecionados);
          });
        }
      } else {
        console.error('Dados recebidos sem processos:', data);
      }

      setProcessos(data.processos || []);
    } catch (error) {
      console.error('Erro ao buscar processos:', error);

      // Mensagem de erro mais detalhada
      let errorMessage = "Não foi possível carregar os processos de monitorização.";
      if (error instanceof Error) {
        errorMessage = `Não foi possível carregar os processos: ${error.message}`;
      }

      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });

      // Definir uma lista vazia para evitar erros na interface
      setProcessos([]);
    } finally {
      setLoading(false);
    }
  };

  // Carregar processos ao montar o componente
  useEffect(() => {
    fetchProcessos();
  }, []);

  // Função para abrir o diálogo de documento final
  const handleOpenDocumentoFinalDialog = (processo: Monitorizacao) => {
    console.log("Abrindo diálogo para processo:", processo);
    
    // Verificar se o processo já tem documento final
    if (processo.documentoFinalPath && processo.estadoProcesso === "CONCLUIDO") {
      toast({
        title: "Informação",
        description: "Este processo já possui um documento final anexado."
      });
      
      // Abrir o documento em uma nova aba
      window.open(`/api/documentos/${processo.documentoFinalPath}`, '_blank');
      return;
    }
    
    // Converter Monitorizacao para Processo se necessário
    if (setSelectedDocumentoFinalProcesso) {
      const processoConvertido: Processo = {
        id: processo.id,
        utenteId: processo.utenteId,
        utenteNome: processo.utenteNome,
        utenteNif: processo.utenteNif,
        numeroPeriodo: processo.numeroPeriodo,
        tipoPeriodo: processo.tipoPeriodo,
        estadoProcesso: processo.estadoProcesso,
        createdAt: processo.createdAt,
        rupePath: processo.rupePath,
        rupePago: processo.rupePago,
        dataPrevistaVisita: processo.dataPrevistaVisita,
        dataVisita: processo.dataVisita,
        observacoesVisita: processo.observacoes,
        documentoFinalPath: processo.documentoFinalPath,
        tecnicosSelecionados: processarTecnicos(processo),
        periodoId: processo.periodoId,
        periodoEstado: processo.periodoEstado,
        motivoReabertura: processo.motivoReabertura,
        dataSolicitacaoReabertura: processo.dataSolicitacaoReabertura,
        statusReabertura: processo.statusReabertura
      };
      setSelectedDocumentoFinalProcesso(processoConvertido);
    }
    
    // Preparar o diálogo
    setSelectedProcesso(processo);
    setDocumentoFinalFile(null);
    setObservacoes("");
    setIsDocumentoFinalDialogOpen(true);
  };

  // Função para abrir o diálogo de aprovação de reabertura
  const handleOpenReaberturaDialog = (periodoId: number) => {
    setSelectedReaberturaPeriodoId(periodoId);
    setIsReaberturaDialogOpen(true);
  };

  // Função para lidar com a mudança do arquivo RUPE
  const handleRupeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setRupeFile(e.target.files[0]);
    }
  };

  // Função para lidar com a mudança do arquivo de documento final
  const handleDocumentoFinalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocumentoFinalFile(e.target.files[0]);
    }
  };

  // Função para adicionar RUPE
  const handleAdicionarRupe = async () => {
    if (!selectedProcesso || !rupeReferencia || !rupeFile) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append('monitorId', selectedProcesso.id.toString());
      formData.append('rupeReferencia', rupeReferencia);
      formData.append('rupeFile', rupeFile);

      const response = await fetch('/api/monitorizacao/chefe/adicionar-rupe', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao adicionar RUPE');
      }

      toast({
        title: "Sucesso",
        description: "RUPE adicionado com sucesso!"
      });

      setIsRupeDialogOpen(false);
      fetchProcessos();
    } catch (error) {
      console.error('Erro ao adicionar RUPE:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao adicionar RUPE",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para validar pagamento
  const handleValidarPagamento = async (id: number) => {
    try {
      setIsSubmitting(true);
      const response = await fetch("/api/monitorizacao/chefe/confirmar-pagamento", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ monitorizacaoId: id }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.error || "Erro ao confirmar pagamento do RUPE",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Pagamento do RUPE confirmado com sucesso. O processo avançou para a etapa de visita técnica."
      });
      fetchProcessos();
    } catch (error) {
      console.error("Erro ao confirmar pagamento do RUPE:", error);
      toast({
        title: "Erro",
        description: "Erro ao confirmar pagamento do RUPE",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para marcar visita técnica
  const handleMarcarVisita = async () => {
    try {
      if (!selectedProcesso || !dataPrevista) {
        toast({
          title: "Erro",
          description: "Selecione um processo e informe a data prevista",
          variant: "destructive"
        });
        return;
      }

      setIsSubmitting(true);
      const response = await fetch("/api/monitorizacao/chefe/marcar-visita", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          monitorId: selectedProcesso.id,
          dataPrevista,
          tecnicosIds
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.error || "Erro ao marcar visita técnica",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Visita técnica marcada com sucesso"
      });
      setIsVisitaDialogOpen(false);
      setDataPrevista("");
      setTecnicosIds([]);
      fetchProcessos();
    } catch (error) {
      console.error("Erro ao marcar visita técnica:", error);
      toast({
        title: "Erro",
        description: "Erro ao marcar visita técnica",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para adicionar parecer técnico
  const handleAdicionarParecer = async () => {
    try {
      if (!selectedProcesso || !parecerFile) {
        toast({
          title: "Erro",
          description: "Selecione um processo e anexe o parecer técnico",
          variant: "destructive"
        });
        return;
      }

      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("monitorId", selectedProcesso.id.toString());
      formData.append("parecer", parecerTipo);
      formData.append("observacoes", observacoes);
      formData.append("parecerFile", parecerFile);

      const response = await fetch("/api/monitorizacao/chefe/adicionar-parecer", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.error || "Erro ao adicionar parecer técnico",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Parecer técnico adicionado com sucesso"
      });
      setIsParecerDialogOpen(false);
      setParecerTipo("APROVADO");
      setObservacoes("");
      setParecerFile(null);
      fetchProcessos();
    } catch (error) {
      console.error("Erro ao adicionar parecer técnico:", error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar parecer técnico",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para aprovar solicitação de reabertura de período
  const handleAprovarReabertura = async () => {
    try {
      if (!selectedReaberturaPeriodoId || !rupeReaberturaNumero) {
        toast({
          title: "Erro",
          description: "Informe o número do RUPE para aprovar a reabertura",
          variant: "destructive"
        });
        return;
      }

      setProcessandoReabertura(true);

      const response = await fetch(`/api/monitorizacao/periodos/${selectedReaberturaPeriodoId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "aprovar-reabertura",
          rupeReferencia: rupeReaberturaNumero
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.error || "Erro ao aprovar reabertura do período",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Reabertura do período aprovada com sucesso"
      });

      setIsReaberturaDialogOpen(false);
      setRupeReaberturaNumero("");
      setSelectedReaberturaPeriodoId(null);
      fetchProcessos();
    } catch (error) {
      console.error("Erro ao aprovar reabertura:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar a aprovação da reabertura",
        variant: "destructive"
      });
    } finally {
      setProcessandoReabertura(false);
    }
  };

  // Função para marcar visita como feita
  const handleMarcarVisitaFeita = async () => {
    try {
      if (!selectedProcesso || !relatorioVisitaFile) {
        toast({
          title: "Erro",
          description: "Selecione um processo e anexe o relatório da visita",
          variant: "destructive"
        });
        return;
      }

      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("monitorId", selectedProcesso.id.toString());
      formData.append("observacoes", observacoes);
      formData.append("relatorioVisitaFile", relatorioVisitaFile);

      const response = await fetch("/api/monitorizacao/chefe/visita-feita", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.error || "Erro ao marcar visita como realizada",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Visita marcada como realizada com sucesso"
      });
      setIsVisitaFeitaDialogOpen(false);
      setObservacoes("");
      setRelatorioVisitaFile(null);
      fetchProcessos();
    } catch (error) {
      console.error("Erro ao marcar visita como realizada:", error);
      toast({
        title: "Erro",
        description: "Erro ao marcar visita como realizada",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para abrir o diálogo de RUPE
  const handleOpenRupeDialog = (processo: Monitorizacao) => {
    setSelectedProcesso(processo);
    setRupeReferencia("");
    setRupeFile(null);
    setIsRupeDialogOpen(true);
  };

  // Função para enviar documento final
  const handleEnviarDocumentoFinal = async () => {
    try {
      if (!selectedProcesso || !documentoFinalFile) {
        toast({
          title: "Erro",
          description: "Selecione um processo e anexe o documento final",
          variant: "destructive"
        });
        return;
      }

      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("monitorId", selectedProcesso.id.toString());
      formData.append("documentoFinalFile", documentoFinalFile);

      const response = await fetch("/api/monitorizacao/chefe/documento-final", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.error || "Erro ao enviar documento final",
          variant: "destructive"
        });
        return;
      }

      // Ler o corpo da resposta uma única vez
      const responseData = await response.json();
      console.log("Resposta do servidor após upload:", responseData);
      
      // Atualizar o estado local do processo selecionado para refletir a mudança imediatamente
      const updatedProcesso = {
        ...selectedProcesso,
        estadoProcesso: 'CONCLUIDO',
        documentoFinalPath: responseData.documentoFinalPath || '/uploads/documentos-finais/documento.pdf'
      };
      
      console.log("Processo atualizado localmente:", updatedProcesso);
      
      // Atualizar o estado dos processos localmente
      setProcessos(prevProcessos => {
        const updated = prevProcessos.map(p => 
          p.id === selectedProcesso.id ? updatedProcesso : p
        );
        console.log("Lista de processos atualizada:", updated);
        return updated;
      });
      
      toast({
        title: "Sucesso",
        description: "Documento final enviado com sucesso"
      });
      
      setIsDocumentoFinalDialogOpen(false);
      setDocumentoFinalFile(null);
      
      // Buscar dados atualizados do servidor após um pequeno atraso
      setTimeout(() => {
        fetchProcessos();
      }, 1000);
    } catch (error) {
      console.error("Erro ao enviar documento final:", error);
      toast({
        title: "Erro",
        description: "Erro ao enviar documento final",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col gap-6 p-0">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <FileText className="text-lime-700" size={28} /> Processos de Monitorização
        </h1>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-100 text-lime-800 text-sm font-semibold">
            <BadgeCheck className="w-4 h-4" /> Processos aguardando ações do Chefe
          </span>
          <Button
            variant="outline"
            className="ml-2"
            onClick={fetchProcessos}
            title="Atualizar lista de processos"
          >
            Atualizar
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Carregando processos...</span>
        </div>
      ) : (
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm w-full overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead className="text-left w-36">ID</TableHead>
                <TableHead className="text-left w-40">Utente</TableHead>
                <TableHead className="text-left w-40">Período</TableHead>
                <TableHead className="text-left w-40">Técnicos</TableHead>
                <TableHead className="text-left w-32">Data</TableHead>
                <TableHead className="text-left w-44">Estado</TableHead>
                <TableHead className="text-left w-64">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum processo de monitorização pendente.</TableCell>
                </TableRow>
              ) : (
                processos.map((processo) => (
                  <TableRow key={processo.id} className="hover:bg-muted/50">
                    <TableCell className="font-semibold text-primary flex items-center gap-2">
                      <FileText className="w-4 h-4 text-lime-700" />
                      {processo.id}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{processo.utenteNome}</div>
                      <div className="text-sm text-muted-foreground">NIF: {processo.utenteNif}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">Período {processo.numeroPeriodo}</div>
                      <div className="text-sm text-muted-foreground">{processo.tipoPeriodo}</div>
                      {processo.periodoEstado === 'SOLICITADA_REABERTURA' && (
                        <Badge className="mt-1 bg-amber-100 text-amber-800 border-none">
                          Solicitação de Reabertura
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {/* Normalizar tecnicosSelecionados para garantir compatibilidade de tipos */}
                      {(() => {
                        // Processar os técnicos apenas uma vez para evitar processamento duplicado
                        const tecnicos = normalizeTecnicosSelecionados(processo.tecnicosSelecionados);
                        console.log(`Processo ${processo.id}: Técnicos normalizados:`, tecnicos);

                        if (tecnicos.length > 0) {
                          return (
                            <div className="text-sm space-y-1">
                              {tecnicos.map((tecnico) => (
                                <div key={`${processo.id}-${tecnico.id}`} className="flex items-center gap-1">
                                  <Badge
                                    variant="outline"
                                    className="text-xs py-0 px-1 bg-blue-50 text-blue-700 border-blue-200"
                                  >
                                    <span className="flex items-center gap-1">
                                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 mr-1">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                      </svg>
                                      {tecnico.nome}
                                    </span>
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          );
                        } else {
                          return (
                            <span className="text-sm text-muted-foreground italic">
                              Aguardando seleção de técnicos
                            </span>
                          );
                        }
                      })()}

                    </TableCell>
                    <TableCell>{formatarData(processo.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={estadoProcessoColors[processo.estadoProcesso] || ""}>
                        {estadoProcessoLabels[processo.estadoProcesso] || processo.estadoProcesso}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {/* Ações disponíveis baseadas no estado do processo */}
                      <div className="flex flex-wrap gap-2">
                        {processo.periodoEstado === 'SOLICITADA_REABERTURA' && (
                          <AprovarReaberturaButton
                            periodoId={processo.periodoId}
                            onSuccess={fetchProcessos}
                          />
                        )}

                        {processo.estadoProcesso === 'AGUARDANDO_PARECER' || processo.estadoProcesso === 'AGUARDANDO_VISITA' || processo.estadoProcesso === 'VISITA_REALIZADA' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedProcesso(processo);
                              setIsParecerDialogOpen(true);
                            }}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Parecer
                          </Button>
                        ) : null}

                        {processo.estadoProcesso === 'AGUARDANDO_RUPE' && (
                          <Button size="sm" variant="outline" onClick={() => handleOpenRupeDialog(processo)}>
                            <FileText className="mr-2 h-4 w-4" />
                            RUPE
                          </Button>
                        )}

                        {processo.estadoProcesso === 'AGUARDANDO_CONFIRMACAO_PAGAMENTO' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleValidarPagamento(processo.id)}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Confirmar
                          </Button>
                        )}

                        {processo.estadoProcesso === 'AGUARDANDO_VISITA' && (
                          <Button
                            size="sm"
                            variant="outline"
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            Marcar
                          </Button>
                        )}

                        {processo.estadoProcesso === 'AGUARDANDO_VISITA' && processo.dataPrevistaVisita && (
                          <Button
                            size="sm"
                            variant="outline"
                          >
                            <CheckSquare className="mr-2 h-4 w-4" />
                            Realizada
                          </Button>
                        )}

                        {(processo.estadoProcesso === 'AGUARDANDO_DOCUMENTO_FINAL' || 
                          (processo.estadoProcesso === 'CONCLUIDO' && processo.documentoFinalPath)) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDocumentoFinalDialog(processo)}
                          >
                            <FileCheck className="mr-2 h-4 w-4" />
                            {processo.estadoProcesso === 'CONCLUIDO' && processo.documentoFinalPath 
                              ? 'Ver Documento Final' 
                              : 'Enviar Documento Final'}
                          </Button>
                        )}

                        {/* Botões para visualização de documentos */}
                        {/* RUPE - Disponível quando o RUPE foi gerado */}
                        {processo.rupePath && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-700 border-blue-700 flex items-center gap-1"
                            title="Visualizar RUPE"
                            onClick={() => window.open(`/api/documentos/${processo.rupePath}`, '_blank')}
                          >
                            <Receipt className="w-4 h-4" /> Ver RUPE
                          </Button>
                        )}

                        {/* Relatório de Visita - Disponível desde que exista */}
                        {processo.relatorioPath && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-700 border-green-700 flex items-center gap-1"
                            title="Visualizar Relatório de Visita"
                            onClick={() => window.open(`/api/documentos/${processo.relatorioPath}`, '_blank')}
                          >
                            <FileIcon className="w-4 h-4" /> Ver Relatório
                          </Button>
                        )}

                        {/* Parecer Técnico - Disponível desde que exista */}
                        {processo.parecerTecnicoPath && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-purple-700 border-purple-700 flex items-center gap-1"
                            title="Visualizar Parecer Técnico"
                            onClick={() => window.open(`/api/documentos/${processo.parecerTecnicoPath}`, '_blank')}
                          >
                            <ClipboardCheck className="w-4 h-4" /> Ver Parecer
                          </Button>
                        )}

                        {/* Documento Final - Disponível quando o processo estiver concluído */}
                        {processo.documentoFinalPath && processo.estadoProcesso === "CONCLUIDO" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-amber-700 border-amber-700 flex items-center gap-1"
                            title="Visualizar Documento Final"
                            onClick={() => window.open(`/api/documentos/${processo.documentoFinalPath}`, '_blank')}
                          >
                            <FileCheck className="w-4 h-4" /> Ver Doc. Final
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
      )}

      {/* Diálogo para marcar visita técnica */}
      <Dialog open={isVisitaDialogOpen} onOpenChange={setIsVisitaDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Marcar Visita Técnica</DialogTitle>
            <DialogDescription>
              Defina a data prevista para a visita técnica ao processo #{selectedProcesso?.id}.
            </DialogDescription>
          </DialogHeader>

          {selectedProcesso && (
            <div className="bg-muted p-3 rounded-md text-sm mb-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-semibold">Utente:</span> {selectedProcesso.utenteNome}
                </div>
                <div>
                  <span className="font-semibold">NIF:</span> {selectedProcesso.utenteNif}
                </div>
                <div>
                  <span className="font-semibold">Período:</span> {selectedProcesso.tipoPeriodo} {selectedProcesso.numeroPeriodo}
                </div>
              </div>

              {processarTecnicos(selectedProcesso).length > 0 && (
                <div className="mt-2">
                  <span className="font-semibold">Técnicos designados:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {processarTecnicos(selectedProcesso).map((tecnico: TecnicoSelecionado) => (
                      <Badge key={tecnico.id} variant="outline" className="text-xs">
                        {tecnico.nome}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo para marcar visita como realizada */}
      <Dialog open={isVisitaFeitaDialogOpen} onOpenChange={setIsVisitaFeitaDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Marcar Visita como Realizada</DialogTitle>
            <DialogDescription>
              Registre as observações e o relatório da visita técnica ao processo #{selectedProcesso?.id}.
            </DialogDescription>
          </DialogHeader>

          {selectedProcesso && (
            <div>
              <div className="bg-muted p-3 rounded-md text-sm mb-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-semibold">Utente:</span> {selectedProcesso.utenteNome}
                  </div>
                  <div>
                    <span className="font-semibold">NIF:</span> {selectedProcesso.utenteNif}
                  </div>
                  <div>
                    <span className="font-semibold">Período:</span> {selectedProcesso.tipoPeriodo} {selectedProcesso.numeroPeriodo}
                  </div>
                  <div>
                    <span className="font-semibold">Data Prevista:</span> {selectedProcesso.dataPrevistaVisita ? formatarData(selectedProcesso.dataPrevistaVisita) : 'Não definida'}
                  </div>
                </div>

                {(() => {
                  const tecnicos = processarTecnicos(selectedProcesso);
                  return tecnicos.length > 0 && (
                    <div className="mt-2">
                      <span className="font-semibold">Técnicos designados:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {tecnicos.map((tecnico: TecnicoSelecionado) => (
                          <Badge key={tecnico.id} variant="outline" className="text-xs">
                            {tecnico.nome}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                {relatorioVisitaFile && (
                  <p className="text-sm text-muted-foreground">
                    Arquivo selecionado: {relatorioVisitaFile.name}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacoesVisita">Observações (opcional)</Label>
                <textarea
                  id="observacoesVisita"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Observações sobre a visita realizada"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVisitaFeitaDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleMarcarVisitaFeita}
              disabled={isSubmitting || !relatorioVisitaFile}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Marcar como Realizada"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para enviar documento final */}
      <Dialog open={isDocumentoFinalDialogOpen} onOpenChange={setIsDocumentoFinalDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Documento Final</DialogTitle>
            <DialogDescription>
              Envie o documento final para o processo #{selectedProcesso?.id}.
            </DialogDescription>
          </DialogHeader>

          {selectedProcesso && (
            <div className="bg-muted p-3 rounded-md text-sm mb-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-semibold">Utente:</span> {selectedProcesso.utenteNome}
                </div>
                <div>
                  <span className="font-semibold">NIF:</span> {selectedProcesso.utenteNif}
                </div>
                <div>
                  <span className="font-semibold">Período:</span> {selectedProcesso.tipoPeriodo} {selectedProcesso.numeroPeriodo}
                </div>
              </div>

              {selectedProcesso.tecnicosSelecionados && normalizeTecnicosSelecionados(selectedProcesso.tecnicosSelecionados).length > 0 && (
                <div className="mt-2">
                  <span className="font-semibold">Técnicos designados:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {normalizeTecnicosSelecionados(selectedProcesso.tecnicosSelecionados).map((tecnico) => (
                      <Badge key={tecnico.id} variant="outline" className="text-xs">
                        {tecnico.nome}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="documentoFinalFile">Documento Final</Label>
              <Input
                id="documentoFinalFile"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => e.target.files && e.target.files[0] && setDocumentoFinalFile(e.target.files[0])}
              />
              {documentoFinalFile && (
                <p className="text-sm text-muted-foreground">
                  Arquivo selecionado: {documentoFinalFile.name}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="observacoesDocumento">Observações (opcional)</Label>
              <textarea
                id="observacoesDocumento"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Observações sobre o documento final"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDocumentoFinalDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleEnviarDocumentoFinal}
              disabled={isSubmitting || !documentoFinalFile}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Documento Final"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para adicionar RUPE */}
      <Dialog open={isRupeDialogOpen} onOpenChange={setIsRupeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar RUPE</DialogTitle>
            <DialogDescription>
              Adicione informações de RUPE ao processo #{selectedProcesso?.id}.
            </DialogDescription>
          </DialogHeader>

          {selectedProcesso && (
            <div className="bg-muted p-3 rounded-md text-sm mb-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-semibold">Utente:</span> {selectedProcesso.utenteNome}
                </div>
                <div>
                  <span className="font-semibold">NIF:</span> {selectedProcesso.utenteNif}
                </div>
                <div>
                  <span className="font-semibold">Período:</span> {selectedProcesso.tipoPeriodo} {selectedProcesso.numeroPeriodo}
                </div>
              </div>

              {selectedProcesso.tecnicosSelecionados && normalizeTecnicosSelecionados(selectedProcesso.tecnicosSelecionados).length > 0 && (
                <div className="mt-2">
                  <span className="font-semibold">Técnicos designados:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {normalizeTecnicosSelecionados(selectedProcesso.tecnicosSelecionados).map((tecnico) => (
                      <Badge key={tecnico.id} variant="outline" className="text-xs">
                        {tecnico.nome}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rupeReferencia">Referência RUPE</Label>
              <Input
                id="rupeReferencia"
                placeholder="Ex: RUPE-2025-12345"
                value={rupeReferencia}
                onChange={(e) => setRupeReferencia(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rupeFile">Arquivo RUPE (PDF)</Label>
              <Input
                id="rupeFile"
                type="file"
                accept=".pdf"
                onChange={handleRupeFileChange}
              />
              {rupeFile && (
                <p className="text-sm text-muted-foreground">
                  Arquivo selecionado: {rupeFile.name}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRupeDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleAdicionarRupe}
              disabled={isSubmitting || !rupeReferencia || !rupeFile}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Adicionar RUPE"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para adicionar parecer */}
      <Dialog open={isParecerDialogOpen} onOpenChange={setIsParecerDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Parecer</DialogTitle>
            <DialogDescription>
              Adicione seu parecer ao processo #{selectedProcesso?.id}.
            </DialogDescription>
          </DialogHeader>

          {selectedProcesso && (
            <div className="bg-muted p-3 rounded-md text-sm mb-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-semibold">Utente:</span> {selectedProcesso.utenteNome}
                </div>
                <div>
                  <span className="font-semibold">NIF:</span> {selectedProcesso.utenteNif}
                </div>
                <div>
                  <span className="font-semibold">Período:</span> {selectedProcesso.tipoPeriodo} {selectedProcesso.numeroPeriodo}
                </div>
              </div>

              {selectedProcesso.tecnicosSelecionados && normalizeTecnicosSelecionados(selectedProcesso.tecnicosSelecionados).length > 0 && (
                <div className="mt-2">
                  <span className="font-semibold">Técnicos designados:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {normalizeTecnicosSelecionados(selectedProcesso.tecnicosSelecionados).map((tecnico) => (
                      <Badge key={tecnico.id} variant="outline" className="text-xs">
                        {tecnico.nome}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedProcesso.parecerTecnicoPath && (
                <div className="mt-2">
                  <span className="font-semibold">Parecer Técnico:</span>
                  <div className="flex items-center gap-1 mt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 px-2"
                      onClick={() => window.open(`/api/documentos/${selectedProcesso.parecerTecnicoPath}`, '_blank')}
                    >
                      <FileText className="mr-1 h-3 w-3" /> Ver Parecer Técnico
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="parecerTipo">Tipo de Parecer</Label>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="aprovado"
                    name="parecerTipo"
                    value="APROVADO"
                    checked={parecerTipo === "APROVADO"}
                    onChange={() => setParecerTipo("APROVADO")}
                    className="h-4 w-4 text-primary"
                  />
                  <Label htmlFor="aprovado" className="text-sm font-normal">Aprovado</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="carece_melhorias"
                    name="parecerTipo"
                    value="CARECE_MELHORIAS"
                    checked={parecerTipo === "CARECE_MELHORIAS"}
                    onChange={() => setParecerTipo("CARECE_MELHORIAS")}
                    className="h-4 w-4 text-primary"
                  />
                  <Label htmlFor="carece_melhorias" className="text-sm font-normal">Carece de Melhorias</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="rejeitado"
                    name="parecerTipo"
                    value="REJEITADO"
                    checked={parecerTipo === "REJEITADO"}
                    onChange={() => setParecerTipo("REJEITADO")}
                    className="h-4 w-4 text-primary"
                  />
                  <Label htmlFor="rejeitado" className="text-sm font-normal">Rejeitado</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <textarea
                id="observacoes"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Observações sobre o parecer"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parecerFile">Anexar Documento (opcional)</Label>
              <Input
                id="parecerFile"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => e.target.files && e.target.files[0] && setParecerFile(e.target.files[0])}
              />
              {parecerFile && (
                <p className="text-sm text-muted-foreground">
                  Arquivo selecionado: {parecerFile.name}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsParecerDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleAdicionarParecer}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Adicionar Parecer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para aprovar reabertura de período */}
      <Dialog open={isReaberturaDialogOpen} onOpenChange={setIsReaberturaDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Aprovar Reabertura de Período</DialogTitle>
            <DialogDescription>
              Informe o número do RUPE para aprovar a reabertura do período.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rupeReabertura">Número do RUPE</Label>
              <Input
                id="rupeReabertura"
                type="text"
                placeholder="Informe o número do RUPE"
                value={rupeReaberturaNumero}
                onChange={(e) => setRupeReaberturaNumero(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsReaberturaDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              onClick={handleAprovarReabertura}
              disabled={!rupeReaberturaNumero || processandoReabertura}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {processandoReabertura ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Aprovar Reabertura
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

