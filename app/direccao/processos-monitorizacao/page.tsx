"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
  FileText,
  Loader2,
  BadgeCheck,
  Users,
  UserCheck,
  Search,
  CheckCircle2,
  XCircle,
  Calendar,
  X,
  FileIcon,
  ClipboardCheck,
  Receipt,
  FileCheck,
} from "lucide-react";

// Tipo para o processo de monitorização
type Processo = {
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
  relatorioPath?: string | null;
  parecerTecnicoPath?: string | null;
  documentoFinalPath?: string | null;
  tecnicosSelecionados?: { id: number; nome: string }[];
  responsavelMarcacao?: { id: number; nome: string } | null;
  tecnicoVisita?: { id: number; nome: string; dataVisita: string };
};

// Tipo para o técnico
type Tecnico = {
  id: number;
  nome: string;
  email: string;
  cargo: string;
  departamento: string;
  ativo: boolean;
};

// Helper functions for conditional rendering
const renderRelatorioVisitaButton = (processo: Processo) => {
  if (processo.relatorioPath) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="text-green-700 border-green-700 flex items-center gap-1"
        title="Visualizar Relatório de Visita"
        onClick={() => {
          window.open(`/api/documentos/${processo.relatorioPath}`, "_blank");
        }}
      >
        <FileIcon className="w-4 h-4" /> Relatório
      </Button>
    );
  }
  return null;
};

const renderParecerTecnicoButton = (processo: Processo) => {
  if (processo.parecerTecnicoPath) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="text-purple-700 border-purple-700 flex items-center gap-1"
        title="Visualizar Parecer Técnico"
        onClick={() => {
          window.open(`/api/documentos/${processo.parecerTecnicoPath}`, "_blank");
        }}
      >
        <ClipboardCheck className="w-4 h-4" /> Parecer
      </Button>
    );
  }
  return null;
};

const renderDocumentoFinalButton = (processo: Processo) => {
  if (processo.documentoFinalPath && processo.estadoProcesso === "CONCLUIDO") {
    return (
      <Button
        size="sm"
        variant="outline"
        className="text-amber-700 border-amber-700 flex items-center gap-1"
        title="Visualizar Documento Final"
        onClick={() => {
          window.open(
            `/api/documentos/${processo.documentoFinalPath}`,
            "_blank",
          );
        }}
      >
        <FileCheck className="w-4 h-4" /> Doc. Final
      </Button>
    );
  }
  return null;
};

export default function DirecaoProcessosMonitorizacao() {
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProcesso, setSelectedProcesso] = useState<Processo | null>(
    null,
  );
  const [isTecnicosDialogOpen, setIsTecnicosDialogOpen] = useState(false);
  const [selectedTecnicos, setSelectedTecnicos] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Estados para os processos filtrados
  const [filteredProcessos, setFilteredProcessos] = useState<Processo[]>([]);

  // Mapeamento de estados para labels
  const estadoProcessoLabels: Record<string, string> = {
    AGUARDANDO_PARECER: "Aguardando Parecer Técnico",
    AGUARDANDO_RUPE: "Aguardando RUPE",
    AGUARDANDO_PAGAMENTO: "Aguardando Pagamento",
    AGUARDANDO_CONFIRMACAO_PAGAMENTO: "Aguardando Confirmação de Pagamento",
    AGUARDANDO_SELECAO_TECNICOS: "Aguardando Seleção de Técnicos",
    AGUARDANDO_VISITA: "Aguardando Visita",
    AGUARDANDO_DOCUMENTO_FINAL: "Aguardando Documento Final",
    CONCLUIDO: "Concluído",
    DESCONHECIDO: "Estado Desconhecido",
  };

  // Mapeamento de estados para cores
  const estadoProcessoColors: Record<string, string> = {
    AGUARDANDO_PARECER: "bg-blue-100 text-blue-700 border-none",
    AGUARDANDO_RUPE: "bg-purple-100 text-purple-700 border-none",
    AGUARDANDO_PAGAMENTO: "bg-amber-100 text-amber-700 border-none",
    AGUARDANDO_CONFIRMACAO_PAGAMENTO:
      "bg-yellow-100 text-yellow-700 border-none",
    AGUARDANDO_SELECAO_TECNICOS: "bg-orange-100 text-orange-700 border-none",
    AGUARDANDO_VISITA: "bg-cyan-100 text-cyan-700 border-none",
    AGUARDANDO_DOCUMENTO_FINAL: "bg-indigo-100 text-indigo-700 border-none",
    CONCLUIDO: "bg-green-100 text-green-700 border-none",
    DESCONHECIDO: "bg-gray-100 text-gray-700 border-none",
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

  // Buscar processos
  const fetchProcessos = async () => {
    try {
      setLoading(true);
      console.log("Iniciando busca de processos de monitorização...");
      
      // Adicionar timestamp para evitar cache
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/monitorizacao/direccao/processos?t=${timestamp}`, {
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
          errorMessage = errorData.message || errorData.details || errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Erro ao analisar resposta de erro:', parseError);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log(`Dados recebidos da API: ${data.length} processos`);
      
      // Verificar se os dados estão vazios
      if (!data || data.length === 0) {
        console.log("Nenhum processo encontrado");
        setProcessos([]);
        setFilteredProcessos([]);
        return;
      }

      // Array para armazenar os processos formatados com informações adicionais
      const processosFormatados = [];
      
      // Garantir que os dados tenham a estrutura esperada
      for (const processo of data) {
        // Formatar o processo com os dados básicos
        const processoFormatado: Processo = {
          id: processo.id,
          utenteId: processo.utenteId,
          utenteNome: processo.utenteNome || "Nome não disponível",
          utenteNif: processo.utenteNif || "N/A",
          numeroPeriodo: processo.numeroPeriodo || 0,
          tipoPeriodo: processo.tipoPeriodo || "Não especificado",
          estadoProcesso: processo.estadoProcesso || "DESCONHECIDO",
          createdAt: processo.createdAt || new Date().toISOString(),
          rupePath: processo.rupePath || null,
          rupePago: Boolean(processo.rupePago),
          dataPrevistaVisita: processo.dataPrevistaVisita || null,
          dataVisita: processo.dataVisita || null,
          observacoesVisita: processo.observacoesVisita || null,
          relatorioPath: processo.relatorioPath || null,
          parecerTecnicoPath: processo.parecerTecnicoPath || null,
          documentoFinalPath: processo.documentoFinalPath || null,
          tecnicosSelecionados: Array.isArray(processo.tecnicosSelecionados)
            ? processo.tecnicosSelecionados
            : []
        };
        
        // Buscar informações adicionais sobre a visita se o processo estiver em um estado relevante
        if (['AGUARDANDO_VISITA', 'AGUARDANDO_DOCUMENTO_FINAL', 'CONCLUIDO'].includes(processo.estadoProcesso)) {
          try {
            const visitaResponse = await fetch(`/api/monitorizacao/visita-info?monitorId=${processo.id}`);
            
            if (visitaResponse.ok) {
              const visitaInfo = await visitaResponse.json();
              
              // Adicionar informações sobre quem marcou a visita
              if (visitaInfo.responsavelMarcacao) {
                processoFormatado.responsavelMarcacao = visitaInfo.responsavelMarcacao;
              }
              
              // Adicionar informações sobre o técnico que realizou a visita
              if (visitaInfo.tecnicoVisita) {
                processoFormatado.tecnicoVisita = {
                  id: visitaInfo.tecnicoVisita.tecnicoId || 0,
                  nome: visitaInfo.tecnicoVisita.tecnicoNome || 'Nome não disponível',
                  dataVisita: visitaInfo.monitorizacao.dataVisita || ''
                } as { id: number; nome: string; dataVisita: string };
              }
              
              // Atualizar informações da visita se disponíveis
              if (visitaInfo.monitorizacao) {
                processoFormatado.dataPrevistaVisita = visitaInfo.monitorizacao.dataPrevistaVisita || processoFormatado.dataPrevistaVisita;
                processoFormatado.dataVisita = visitaInfo.monitorizacao.dataVisita || processoFormatado.dataVisita;
                processoFormatado.observacoesVisita = visitaInfo.monitorizacao.observacoesVisita || processoFormatado.observacoesVisita;
              }
            }
          } catch (visitaError) {
            console.error(`Erro ao buscar informações da visita para o processo ${processo.id}:`, visitaError);
            // Continuar sem as informações adicionais da visita
          }
        }
        
        processosFormatados.push(processoFormatado);
      }

      setProcessos(processosFormatados);
      setFilteredProcessos(processosFormatados);
      return processosFormatados;
    } catch (error) {
      console.error("Erro ao buscar processos:", error);
      
      // Mensagem de erro mais detalhada
      let errorMessage = "Não foi possível carregar os processos de monitorização";
      if (error instanceof Error) {
        errorMessage = `Erro ao carregar processos: ${error.message}`;
      }
      
      // Usar setTimeout para evitar o erro de atualização de estado durante a renderização
      setTimeout(() => {
        toast({
          title: "Erro",
          description: errorMessage,
          variant: "destructive",
        });
      }, 0);
      
      // Definir listas vazias para evitar erros na interface
      setProcessos([]);
      setFilteredProcessos([]);
    } finally {
      setLoading(false);
    }
  };

  // Buscar técnicos da área de monitorização (excluindo admin e direção)
  const fetchTecnicos = async () => {
    try {
      console.log("Buscando técnicos do departamento de monitorização...");
      // Adicionar timestamp para evitar cache
      const timestamp = new Date().getTime();
      // Buscar apenas usuários que são técnicos
      const response = await fetch(`/api/usuarios?role=tecnico&t=${timestamp}`, {
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
      console.log("Total de usuários retornados:", data.length);

      // Filtrar apenas técnicos da área de monitorização
      const tecnicosFiltrados = data.filter((usuario: any) => {
        // Verificar se os campos necessários existem
        if (!usuario.role || !usuario.departamento) {
          console.log(
            `Usuário ${usuario.id} (${usuario.nome}) não tem role ou departamento definidos`,
          );
          return false;
        }

        const isTecnico = usuario.role.toLowerCase() === "tecnico";
        const isMonitorizacao =
          usuario.departamento.toLowerCase() === "monitorizacao";

        // Logar informações sobre cada usuário para debug
        if (!isTecnico || !isMonitorizacao) {
          console.log(
            `Usuário ${usuario.id} (${usuario.nome}) não é técnico de monitorização: role=${usuario.role}, departamento=${usuario.departamento}`,
          );
        }

        return isTecnico && isMonitorizacao;
      });

      console.log("Técnicos filtrados:", tecnicosFiltrados.length);

      // Mapear para o formato esperado pelo componente
      const tecnicosFormatados = tecnicosFiltrados.map((tecnico: any) => ({
        id: tecnico.id,
        nome: tecnico.nome,
        email: tecnico.email,
        cargo: tecnico.role,
        departamento: tecnico.departamento,
        ativo: true,
      }));

      console.log(
        "Técnicos formatados para seleção:",
        tecnicosFormatados.map(
          (t: {
            id: number;
            nome: string;
            departamento: string;
            cargo: string;
          }) => ({
            id: t.id,
            nome: t.nome,
            departamento: t.departamento,
            cargo: t.cargo,
          }),
        ),
      );

      setTecnicos(tecnicosFormatados);
      return tecnicosFormatados;
    } catch (error) {
      console.error("Erro ao buscar técnicos:", error);
      
      // Mensagem de erro mais detalhada
      let errorMessage = "Não foi possível carregar a lista de técnicos";
      if (error instanceof Error) {
        errorMessage = `Erro ao carregar técnicos: ${error.message}`;
      }
      
      // Usar setTimeout para evitar o erro de atualização de estado durante a renderização
      setTimeout(() => {
        toast({
          title: "Erro",
          description: errorMessage,
          variant: "destructive",
        });
      }, 0);
      
      // Definir uma lista vazia para evitar erros na interface
      setTecnicos([]);
      return [];
    }
  };

  // Efeito para buscar dados na inicialização
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchProcessos(), fetchTecnicos()]);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Efeito para filtrar processos quando o termo de busca muda
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredProcessos(processos);
    } else {
      const normalizedSearchTerm = searchTerm.toLowerCase().trim();
      const filtered = processos.filter(
        (processo) =>
          processo.utenteNome.toLowerCase().includes(normalizedSearchTerm) ||
          processo.utenteNif.includes(normalizedSearchTerm) ||
          processo.id.toString().includes(normalizedSearchTerm),
      );
      setFilteredProcessos(filtered);
    }
  }, [searchTerm, processos]);

  // Abrir diálogo para selecionar técnicos
  const handleOpenTecnicosDialog = (processo: Processo) => {
    setSelectedProcesso(processo);
    // Limpar seleções anteriores
    setSelectedTecnicos([]);
    setIsTecnicosDialogOpen(true);
  };

  // Alternar seleção de técnico
  const toggleTecnicoSelection = (tecnicoId: number) => {
    setSelectedTecnicos((prev) => {
      if (prev.includes(tecnicoId)) {
        return prev.filter((id) => id !== tecnicoId);
      } else {
        // Limitar a 3 técnicos
        if (prev.length >= 3) {
          toast({
            title: "Limite atingido",
            description: "Você só pode selecionar até 3 técnicos",
            variant: "destructive",
          });
          return prev;
        }
        return [...prev, tecnicoId];
      }
    });
  };

  // Função para verificar o estado do processo
  const verificarEstadoProcesso = async (processoId: number) => {
    try {
      console.log(`Verificando estado do processo ${processoId}...`);
      const response = await fetch(
        `/api/monitorizacao/direccao/processos/${processoId}`,
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Resposta de erro:", errorData);
        throw new Error(
          `Erro ao verificar estado do processo: ${response.status} - ${errorData.error || "Erro desconhecido"}`,
        );
      }

      const data = await response.json();
      console.log("Estado do processo:", data);

      // Verificar se o processo está no estado correto
      const estadoAtual = data.estadoProcesso;
      const estadoEsperado =
        data.fluxoEstados?.aguardandoSelecaoTecnicos ||
        "AGUARDANDO_SELECAO_TECNICOS";

      return estadoAtual;
    } catch (error) {
      console.error("Erro ao verificar estado do processo:", error);
      throw error;
    }
  };

  // Enviar seleção de técnicos
  const handleSubmitTecnicos = async () => {
    if (!selectedProcesso) {
      console.error("Nenhum processo selecionado");
      toast({
        title: "Erro",
        description: "Nenhum processo selecionado",
        variant: "destructive",
      });
      return;
    }

    // Verificar se os técnicos selecionados são válidos
    console.log("Técnicos selecionados:", selectedTecnicos);

    // Verificar se os técnicos existem na lista de técnicos disponíveis
    const tecnicosInvalidos = selectedTecnicos.filter(
      (id) => !tecnicos.some((tecnico) => tecnico.id === id),
    );

    if (tecnicosInvalidos.length > 0) {
      console.error("Técnicos inválidos selecionados:", tecnicosInvalidos);
      toast({
        title: "Erro",
        description: "Um ou mais técnicos selecionados não são válidos",
        variant: "destructive",
      });
      return;
    }

    // Não precisamos mais verificar o estado do processo, pois a direção pode alterar os técnicos a qualquer momento
    console.log(
      "Prosseguindo com a seleção de técnicos para o processo:",
      selectedProcesso.id,
    );

    if (selectedTecnicos.length !== 3) {
      toast({
        title: "Seleção inválida",
        description: "Você deve selecionar exatamente 3 técnicos",
        variant: "destructive",
      });
      return;
    }

    console.log("Enviando seleção de técnicos:", {
      monitorizacaoId: selectedProcesso.id,
      tecnicosIds: selectedTecnicos,
      estadoAtual: selectedProcesso.estadoProcesso,
    });

    try {
      setIsSubmitting(true);
      console.log("Enviando requisição para selecionar técnicos...");

      const response = await fetch(
        "/api/monitorizacao/direccao/selecionar-tecnicos",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            monitorizacaoId: selectedProcesso.id,
            tecnicosIds: selectedTecnicos,
          }),
        },
      );

      let responseData;
      try {
        // Tentar ler o corpo da resposta como JSON
        responseData = await response.json();
      } catch (jsonError) {
        // Se não for JSON, ler como texto
        const textResponse = await response.text();
        console.error("Resposta não é JSON:", textResponse);
        throw new Error(`Resposta inesperada do servidor: ${textResponse}`);
      }

      if (response.ok) {
        const data = await response.json();
        console.log("Resposta da API:", data);

        toast({
          title: "Sucesso",
          description: data.message || "Técnicos selecionados com sucesso",
        });

        setIsTecnicosDialogOpen(false);
        setSelectedTecnicos([]);
        fetchProcessos(); // Atualizar a lista de processos
      } else {
        const errorMessage =
          responseData?.error ||
          responseData?.message ||
          `Erro ao selecionar técnicos: ${response.status} ${response.statusText}`;
        console.error("Erro detalhado:", errorMessage);

        toast({
          title: "Erro",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao selecionar técnicos:", error);

      // Verificar se é um erro de rede
      if (
        error instanceof TypeError &&
        error.message.includes("Failed to fetch")
      ) {
        toast({
          title: "Erro de conexão",
          description:
            "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
          variant: "destructive",
        });
      } else {
        // Outros erros
        toast({
          title: "Erro",
          description:
            error instanceof Error
              ? error.message
              : "Erro desconhecido ao selecionar técnicos",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col gap-6 p-0">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <FileText className="text-lime-700" size={28} /> Processos de
          Monitorização
        </h1>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-100 text-lime-800 text-sm font-semibold">
            <BadgeCheck className="w-4 h-4" /> Processos aguardando ações da
            Direção
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

      {/* Barra de busca */}
      <div className="relative w-full max-w-sm mb-4">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por ID, nome ou NIF..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">
            Carregando processos...
          </span>
        </div>
      ) : (
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm w-full overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead className="text-left w-36">ID</TableHead>
                <TableHead className="text-left w-40">Utente</TableHead>
                <TableHead className="text-left w-40">Período</TableHead>
                <TableHead className="text-left w-32">Data</TableHead>
                <TableHead className="text-left w-44">Estado</TableHead>
                <TableHead className="text-left w-64">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProcessos.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Nenhum processo de monitorização pendente.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProcessos.map((processo) => (
                  <TableRow key={processo.id} className="hover:bg-muted/50">
                    <TableCell className="font-semibold text-primary flex items-center gap-2">
                      <FileText className="w-4 h-4 text-lime-700" />
                      {processo.id}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{processo.utenteNome}</div>
                      <div className="text-sm text-muted-foreground">
                        NIF: {processo.utenteNif}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        Período {processo.numeroPeriodo}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {processo.tipoPeriodo}
                      </div>
                    </TableCell>
                    <TableCell>{formatarData(processo.createdAt)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          estadoProcessoColors[processo.estadoProcesso] || ""
                        }
                      >
                        {estadoProcessoLabels[processo.estadoProcesso] ||
                          processo.estadoProcesso}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex flex-wrap gap-2">
                      {/* Ações baseadas no estado do processo */}
                      {/* Botão para selecionar/alterar técnicos - apenas disponível antes da visita ser marcada */}
                      {(['AGUARDANDO_SELECAO_TECNICOS', 'AGUARDANDO_PARECER', 'AGUARDANDO_RUPE', 'AGUARDANDO_PAGAMENTO', 'AGUARDANDO_CONFIRMACAO_PAGAMENTO'].includes(processo.estadoProcesso)) && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="text-orange-700 border-orange-700 flex items-center gap-1"
                          title={
                            processo.estadoProcesso === "AGUARDANDO_SELECAO_TECNICOS"
                              ? "Selecionar Técnicos para Visita"
                              : "Alterar Técnicos Selecionados"
                          }
                          onClick={() => handleOpenTecnicosDialog(processo)}
                        >
                          <Users className="w-4 h-4" />{" "}
                          {processo.estadoProcesso === "AGUARDANDO_SELECAO_TECNICOS"
                            ? "Selecionar Técnicos"
                            : "Alterar Técnicos"}
                        </Button>
                      )}
                      
                      {/* Mensagem informativa quando não é possível alterar técnicos */}
                      {(['AGUARDANDO_VISITA', 'AGUARDANDO_DOCUMENTO_FINAL', 'CONCLUIDO'].includes(processo.estadoProcesso) && processo.tecnicosSelecionados && processo.tecnicosSelecionados.length > 0) && (
                        <div className="text-xs text-gray-500 italic">
                          Técnicos já designados para a visita
                        </div>
                      )}

                      {/* Botões para visualização de documentos baseados no estado do processo */}
                      {/* RUPE - Disponível quando o RUPE foi gerado */}
                      {processo.rupePath &&
                        [
                          "AGUARDANDO_PAGAMENTO_RUPE",
                          "AGUARDANDO_CONFIRMACAO_PAGAMENTO",
                          "AGUARDANDO_VISITA",
                          "AGUARDANDO_PARECER",
                          "AGUARDANDO_DOCUMENTO_FINAL",
                          "CONCLUIDO",
                        ].includes(processo.estadoProcesso) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-700 border-blue-700 flex items-center gap-1"
                            title="Visualizar RUPE"
                            onClick={() =>
                              window.open(
                                `/api/documentos/${processo.rupePath}`,
                                "_blank",
                              )
                            }
                          >
                            <Receipt className="w-4 h-4" /> RUPE
                          </Button>
                        )}

                      {/* Relatório de Visita - Disponível após a visita */}
                      {(() => renderRelatorioVisitaButton(processo))()}
                      {/* Parecer Técnico - Disponível após o parecer */}
                      {(() => renderParecerTecnicoButton(processo))()}
                      {/* Documento Final - Disponível quando o processo estiver concluído */}
                      {(() => renderDocumentoFinalButton(processo))()}

                      {/* Informações sobre a visita agendada */}
                      {processo.estadoProcesso === "AGUARDANDO_VISITA" && processo.dataPrevistaVisita && (
                        <div className="mt-2 text-sm text-gray-700 border border-gray-200 rounded p-2 w-full">
                          <div className="flex items-center gap-1 mb-1">
                            <Calendar className="w-4 h-4 text-indigo-600" />
                            <span className="font-medium">Visita agendada para:</span> {formatarData(processo.dataPrevistaVisita)}
                          </div>
                          {processo.responsavelMarcacao && (
                            <div className="flex items-center gap-1">
                              <UserCheck className="w-4 h-4 text-indigo-600" />
                              <span className="font-medium">Agendada por:</span> {processo.responsavelMarcacao.nome}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Informações sobre a visita realizada */}
                      {(processo.estadoProcesso === "AGUARDANDO_DOCUMENTO_FINAL" || processo.estadoProcesso === "CONCLUIDO") && processo.dataVisita && (
                        <div className="mt-2 text-sm text-gray-700 border border-gray-200 rounded p-2 w-full">
                          <div className="flex items-center gap-1 mb-1">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span className="font-medium">Visita realizada em:</span> {formatarData(processo.dataVisita)}
                          </div>
                          {processo.tecnicoVisita && (
                            <div className="flex items-center gap-1">
                              <UserCheck className="w-4 h-4 text-green-600" />
                              <span className="font-medium">Realizada por:</span> {processo.tecnicoVisita.nome}
                            </div>
                          )}
                          {processo.observacoesVisita && (
                            <div className="mt-1">
                              <span className="font-medium">Observações:</span> {processo.observacoesVisita}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Visualizar técnicos selecionados para AGUARDANDO_VISITA */}
                      {processo.estadoProcesso === "AGUARDANDO_VISITA" &&
                        processo.tecnicosSelecionados && (
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-muted-foreground">
                              Técnicos selecionados:
                            </span>
                            {processo.tecnicosSelecionados.map((tecnico) => (
                              <span
                                key={tecnico.id}
                                className="text-xs flex items-center gap-1"
                              >
                                <UserCheck className="w-3 h-3 text-green-600" />{" "}
                                {tecnico.nome}
                              </span>
                            ))}
                          </div>
                        )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Diálogo para selecionar técnicos */}
      <Dialog
        open={isTecnicosDialogOpen}
        onOpenChange={setIsTecnicosDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedProcesso?.estadoProcesso ===
              "AGUARDANDO_SELECAO_TECNICOS"
                ? "Selecionar Técnicos para Visita"
                : "Alterar Técnicos Selecionados"}
            </DialogTitle>
            <DialogDescription>
              {selectedProcesso?.estadoProcesso ===
              "AGUARDANDO_SELECAO_TECNICOS"
                ? "Selecione os técnicos que realizarão a visita de monitorização ao processo #" +
                  selectedProcesso?.id +
                  "."
                : "Altere os técnicos designados para o processo #" +
                  selectedProcesso?.id +
                  ". Esta ação não alterará o estado atual do processo."}
            </DialogDescription>
          </DialogHeader>

          {/* Exibir técnicos selecionados */}
          {selectedTecnicos.length > 0 && (
            <div className="my-4 p-3 bg-muted rounded-md">
              <h4 className="text-sm font-medium mb-2">
                Técnicos selecionados:
              </h4>
              <div className="space-y-1">
                {selectedTecnicos.map((tecnicoId) => {
                  const tecnico = tecnicos.find((t) => t.id === tecnicoId);
                  return (
                    <div
                      key={tecnicoId}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>
                          {tecnico?.nome || `Técnico ID: ${tecnicoId}`}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleTecnicoSelection(tecnicoId)}
                        className="h-6 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-3 w-3 mr-1" /> Remover
                      </Button>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {selectedTecnicos.length < 3
                  ? `Selecione mais ${3 - selectedTecnicos.length} técnico(s)`
                  : "Número máximo de técnicos selecionados"}
              </div>
            </div>
          )}

          <div className="max-h-[300px] overflow-y-auto">
            {!tecnicos || tecnicos.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Nenhum técnico disponível no departamento de monitorização.
                <p className="text-sm mt-2">
                  Verifique se existem técnicos cadastrados na área de
                  monitorização.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {tecnicos
                  // Garantir que apenas técnicos válidos são exibidos
                  .filter(
                    (tecnico) =>
                      // Verificar se os campos necessários existem
                      tecnico.cargo &&
                      tecnico.departamento &&
                      // Verificar se é um técnico da área de monitorização
                      tecnico.cargo.toLowerCase() === "tecnico" &&
                      tecnico.departamento.toLowerCase() === "monitorizacao",
                  )
                  .map((tecnico) => (
                    <div
                      key={tecnico.id}
                      className="flex items-center space-x-2 p-2 rounded hover:bg-muted"
                    >
                      <Checkbox
                        id={`tecnico-${tecnico.id}`}
                        checked={selectedTecnicos.includes(tecnico.id)}
                        onCheckedChange={() =>
                          toggleTecnicoSelection(tecnico.id)
                        }
                        disabled={!tecnico.ativo}
                      />
                      <Label
                        htmlFor={`tecnico-${tecnico.id}`}
                        className={`flex flex-col cursor-pointer flex-1 ${!tecnico.ativo ? "opacity-60" : ""}`}
                      >
                        <span className="font-medium">{tecnico.nome}</span>
                        <span className="text-sm text-muted-foreground">
                          {tecnico.email}
                          {!tecnico.ativo && " (Inativo)"}
                        </span>
                        <span className="text-xs text-green-600">
                          Técnico de Monitorização
                        </span>
                      </Label>
                      {selectedTecnicos.includes(tecnico.id) && (
                        <Badge className="bg-green-100 text-green-700 border-none">
                          Selecionado
                        </Badge>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {selectedTecnicos.length}/3 técnicos selecionados
            </div>
            {selectedTecnicos.length === 3 ? (
              <Badge className="bg-green-100 text-green-700 border-none flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Seleção completa
              </Badge>
            ) : (
              <Badge className="bg-yellow-100 text-yellow-700 border-none flex items-center gap-1">
                <XCircle className="w-3 h-3" /> Selecione mais{" "}
                {3 - selectedTecnicos.length} técnico(s)
              </Badge>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsTecnicosDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitTecnicos}
              disabled={selectedTecnicos.length !== 3 || isSubmitting}
              className="bg-lime-600 hover:bg-lime-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                "Confirmar Seleção"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
