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

interface Monitorizacao {
  id: number;
  utenteId: number;
  periodoId: number;
  relatorioPath: string;
  parecerTecnicoPath: string | null;
  rupePath: string | null;
  rupeReferencia: string | null;
  rupePago: boolean;
  documentoFinalPath: string | null;
  estado: string;
  estadoProcesso: string;
  createdAt: string;
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
  tecnicosSelecionados?: { id: number; nome: string }[];
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

  // Buscar processos de monitorização
  const fetchProcessos = async () => {
    try {
      setLoading(true);
      // Obter o departamento do localStorage
      const departamento = localStorage.getItem('departamento') || 'monitorizacao';
      console.log('Buscando processos para departamento:', departamento);

      // Adicionar timestamp para evitar cache e garantir resposta mais recente
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/monitorizacao/chefe?departamento=${departamento}&t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });

      if (!response.ok) {
        let errorMessage = `Erro do servidor: ${response.status}`;
        try {
          const errorData = await response.json();
          console.error('Resposta da API não OK:', response.status, errorData);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Erro ao analisar resposta de erro:', parseError);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log(`Processos recebidos: ${data.processos ? data.processos.length : 0}`);
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

  // Função para abrir o diálogo de adicionar RUPE
  const handleOpenRupeDialog = (processo: Monitorizacao) => {
    setSelectedProcesso(processo);
    setRupeReferencia("");
    setRupeFile(null);
    setIsRupeDialogOpen(true);
  };

  // Função para abrir o diálogo de documento final
  const handleOpenDocumentoFinalDialog = (processo: Processo) => {
    setSelectedDocumentoFinalProcesso(processo);
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

      toast({
        title: "Sucesso",
        description: "Documento final enviado com sucesso"
      });
      setIsDocumentoFinalDialogOpen(false);
      fetchProcessos();
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
                      {processo.tecnicosSelecionados && processo.tecnicosSelecionados.length > 0 ? (
                        <div className="text-sm">
                          {processo.tecnicosSelecionados.map((tecnico) => (
                            <div key={tecnico.id} className="flex items-center gap-1 mb-1">
                              <Badge variant="outline" className="text-xs py-0 px-1">
                                {tecnico.nome}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Nenhum técnico</span>
                      )}
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

                        {processo.estadoProcesso === 'AGUARDANDO_PARECER' && (
                          <Button size="sm" variant="outline">
                            <FileText className="mr-2 h-4 w-4" />
                            Parecer
                          </Button>
                        )}

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

                        {processo.estadoProcesso === 'AGUARDANDO_DOCUMENTO_FINAL' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDocumentoFinalDialog(processo)}
                          >
                            <FileCheck className="mr-2 h-4 w-4" />
                            Enviar Documento Final
                          </Button>
                        )}

                        {/* Botões para visualização de documentos */}
                        {/* RUPE - Disponível quando o RUPE foi gerado */}
                        {processo.rupePath && [
                          "AGUARDANDO_PAGAMENTO_RUPE",
                          "AGUARDANDO_CONFIRMACAO_PAGAMENTO",
                          "AGUARDANDO_VISITA",
                          "AGUARDANDO_PARECER",
                          "AGUARDANDO_DOCUMENTO_FINAL",
                          "CONCLUIDO"
                        ].includes(processo.estadoProcesso) && (
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

              {selectedProcesso.tecnicosSelecionados && selectedProcesso.tecnicosSelecionados.length > 0 && (
                <div>Técnicos selecionados</div>
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
                  
                  {selectedProcesso.tecnicosSelecionados && selectedProcesso.tecnicosSelecionados.length > 0 && (
                    <div className="mt-2">
                      <span className="font-semibold">Técnicos designados:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedProcesso.tecnicosSelecionados.map(tecnico => (
                          <Badge key={tecnico.id} variant="outline" className="text-xs">
                            {tecnico.nome}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
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

      {/* Diálogo para enviar documento final */ }
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

              {selectedProcesso.tecnicosSelecionados && selectedProcesso.tecnicosSelecionados.length > 0 && (
                <div className="mt-2">
                  <span className="font-semibold">Técnicos designados:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedProcesso.tecnicosSelecionados.map(tecnico => (
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

