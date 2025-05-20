// This is a fixed version of the file with proper handling of tecnicosSelecionados
// The main changes are in the rendering of the tecnicosSelecionados array

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
  // Other fields as needed
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

  // Renderização condicional dos técnicos designados
  const renderTecnicosDesignados = (processo: Monitorizacao) => {
    const tecnicos = processarTecnicos(processo);
    if (tecnicos.length === 0) return null;
    
    return (
      <div className="mt-2">
        <span className="font-semibold">Técnicos designados:</span>
        <div className="flex flex-wrap gap-1 mt-1">
          {tecnicos.map((tecnico) => (
            <Badge key={tecnico.id} variant="outline" className="text-xs">
              {tecnico.nome}
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  // Resto do código do componente...
  // Inclua aqui as outras funções e JSX do componente

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Processos de Monitorização</h1>
      
      {/* Exemplo de uso do renderTecnicosDesignados */}
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
          
          {/* Renderização dos técnicos designados */}
          {renderTecnicosDesignados(selectedProcesso)}
        </div>
      )}
      
      {/* Resto do JSX do componente */}
    </div>
  );
}
