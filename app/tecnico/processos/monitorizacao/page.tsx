"use client";
import { useState, useEffect } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { 
  CalendarCheck2, BadgeCheck, FileText, Loader2, Search, Clock,
  FileIcon, ClipboardCheck, Receipt, FileCheck
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Tipo para técnico selecionado
type TecnicoSelecionado = {
  id: number;
  nome: string;
};

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
  rupeReferencia?: string | null;
  rupePago?: boolean;
  dataPrevistaVisita?: string | null;
  dataVisita?: string | null;
  observacoesVisita?: string | null;
  relatorioPath?: string | null;
  parecerTecnicoPath?: string | null;
  documentoFinalPath?: string | null;
  tecnicosSelecionados?: TecnicoSelecionado[];
};

// Mapeamento de estados para labels
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

// Mapeamento de estados para cores
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

export default function TecnicoMonitorizacao() {
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProcesso, setSelectedProcesso] = useState<Processo | null>(null);
  const [isVisitaDialogOpen, setIsVisitaDialogOpen] = useState(false);
  const [isParecerDialogOpen, setIsParecerDialogOpen] = useState(false);
  const [observacoesVisita, setObservacoesVisita] = useState("");
  const [parecerTecnico, setParecerTecnico] = useState("");
  const [parecerFile, setParecerFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProcessos, setFilteredProcessos] = useState<Processo[]>([]);

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
      const response = await fetch("/api/monitorizacao/tecnico/processos");
      
      if (!response.ok) {
        throw new Error("Erro ao buscar processos");
      }
      const data = await response.json();
      console.log('Dados recebidos da API:', data);
        
      // Verificar se a resposta está no novo formato (com solicitacoes e diagnostico)
      // Determinar os dados corretos com base no formato da resposta
      const processosData = data.solicitacoes || data;
      console.log('Quantidade de processos:', processosData.length);
      
      // Definir os processos e os processos filtrados
      setProcessos(processosData);
      setFilteredProcessos(processosData);
    } catch (error) {
      console.error("Erro ao buscar processos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os processos de monitorização",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Efeito para buscar dados na inicialização
  useEffect(() => {
    fetchProcessos();
  }, []);

  // Efeito para filtrar processos quando o termo de busca muda
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredProcessos(processos);
    } else {
      const normalizedSearchTerm = searchTerm.toLowerCase().trim();
      const filtered = processos.filter(processo => 
        processo.utenteNome.toLowerCase().includes(normalizedSearchTerm) ||
        processo.utenteNif.includes(normalizedSearchTerm) ||
        processo.id.toString().includes(normalizedSearchTerm)
      );
      setFilteredProcessos(filtered);
    }
  }, [searchTerm, processos]);

  // Abrir diálogo para registrar visita
  const handleOpenVisitaDialog = (processo: Processo) => {
    setSelectedProcesso(processo);
    setObservacoesVisita("");
    setIsVisitaDialogOpen(true);
  };

  // Registrar visita realizada
  const handleRegistrarVisita = async () => {
    if (!selectedProcesso) return;
    
    try {
      setIsSubmitting(true);
      const response = await fetch("/api/monitorizacao/tecnico/registrar-visita", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          monitorizacaoId: selectedProcesso.id,
          observacoes: observacoesVisita
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.error || "Erro ao registrar visita",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Visita registrada com sucesso."
      });
      setIsVisitaDialogOpen(false);
      fetchProcessos();
    } catch (error) {
      console.error("Erro ao registrar visita:", error);
      toast({
        title: "Erro",
        description: "Erro ao registrar visita",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Abrir diálogo para enviar parecer
  const handleOpenParecerDialog = (processo: Processo) => {
    setSelectedProcesso(processo);
    setParecerTecnico("");
    setParecerFile(null);
    setIsParecerDialogOpen(true);
  };
  
  // Enviar parecer técnico
  const handleSubmitParecer = async () => {
    if (!selectedProcesso) return;
    if (!parecerFile && !parecerTecnico) {
      toast({
        title: "Atenção",
        description: "Você deve fornecer um parecer ou anexar um arquivo",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const formData = new FormData();
      formData.append("monitorizacaoId", selectedProcesso.id.toString());
      formData.append("parecer", parecerTecnico);
      
      if (parecerFile) {
        formData.append("parecerFile", parecerFile);
      }
      
      const response = await fetch("/api/monitorizacao/tecnico/enviar-parecer", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = "Erro ao enviar parecer";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // Ignorar erro de parse
        }
        
        toast({
          title: "Erro",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Parecer enviado com sucesso para o Chefe."
      });
      setIsParecerDialogOpen(false);
      fetchProcessos();
    } catch (error) {
      console.error("Erro ao enviar parecer:", error);
      toast({
        title: "Erro",
        description: "Erro ao enviar parecer",
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
            <BadgeCheck className="w-4 h-4" /> Processos aguardando visita técnica
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
          <span className="ml-2 text-muted-foreground">Carregando processos...</span>
        </div>
      ) : (
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm w-full overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead className="text-left w-36">ID</TableHead>
                <TableHead className="w-[120px]">Utente</TableHead>
                <TableHead className="w-[100px]">NIF</TableHead>
                <TableHead className="w-[120px]">Período</TableHead>
                <TableHead className="w-[120px]">Técnicos</TableHead>
                <TableHead className="w-[120px]">Estado</TableHead>
                <TableHead className="w-[200px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProcessos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum processo de monitorização pendente.</TableCell>
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
                    </TableCell>
                    <TableCell>{processo.utenteNif}</TableCell>
                    <TableCell>
                      <div className="font-medium">{processo.tipoPeriodo}</div>
                      <div className="text-sm text-muted-foreground">Período {processo.numeroPeriodo}</div>
                    </TableCell>
                    <TableCell>
                      {processo.tecnicosSelecionados && processo.tecnicosSelecionados.length > 0 ? (
                        <div className="text-sm">
                          {processo.tecnicosSelecionados.map((tecnico, index) => (
                            <div key={tecnico.id} className="flex items-center gap-1 mb-1">
                              <Badge variant="outline" className="text-xs py-0 px-1">
                                {tecnico.nome}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Nenhum técnico selecionado</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={estadoProcessoColors[processo.estadoProcesso] || ""}>
                        {estadoProcessoLabels[processo.estadoProcesso] || processo.estadoProcesso}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex flex-wrap gap-2">
                      {/* Ações baseadas no estado do processo */}
                      {processo.estadoProcesso === "AGUARDANDO_VISITA" && (
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          className="text-cyan-700 border-cyan-700 flex items-center gap-1" 
                          title="Registrar Visita Realizada"
                          onClick={() => handleOpenVisitaDialog(processo)}
                        >
                          <CalendarCheck2 className="w-4 h-4" /> Registrar Visita
                        </Button>
                      )}
                      
                      {processo.estadoProcesso === "VISITA_REALIZADA" && (
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          className="text-purple-700 border-purple-700 flex items-center gap-1" 
                          title="Enviar Parecer Técnico"
                          onClick={() => handleOpenParecerDialog(processo)}
                        >
                          <FileText className="w-4 h-4" /> Enviar Parecer
                        </Button>
                      )}

                      {/* Mostrar data prevista da visita se existir */}
                      {processo.dataPrevistaVisita && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" /> Visita prevista: {formatarData(processo.dataPrevistaVisita)}
                        </div>
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
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Diálogo para registrar visita */}
      <Dialog open={isVisitaDialogOpen} onOpenChange={setIsVisitaDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Visita Realizada</DialogTitle>
            <DialogDescription>
              Registre as observações da visita técnica ao processo #{selectedProcesso?.id}.
            </DialogDescription>
          </DialogHeader>
          
          {selectedProcesso && (
            <div className="bg-muted p-3 rounded-md text-sm">
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
                const tecnicos = normalizeTecnicosSelecionados(selectedProcesso.tecnicosSelecionados);
                if (tecnicos.length > 0) {
                  return (
                    <div className="mt-2">
                      <span className="font-semibold">Técnicos designados:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {tecnicos.map(tecnico => (
                          <Badge 
                            key={tecnico.id} 
                            variant="outline" 
                            className="text-xs bg-blue-50 text-blue-700 border-blue-200"
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
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="observacoes">Observações da Visita</Label>
              <Textarea
                id="observacoes"
                placeholder="Descreva as observações e conclusões da visita técnica..."
                value={observacoesVisita}
                onChange={(e) => setObservacoesVisita(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsVisitaDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleRegistrarVisita} 
              disabled={isSubmitting}
              className="bg-lime-600 hover:bg-lime-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                "Confirmar Visita"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para enviar parecer técnico */}
      <Dialog open={isParecerDialogOpen} onOpenChange={setIsParecerDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Parecer Técnico</DialogTitle>
            <DialogDescription>
              Envie seu parecer técnico sobre o processo #{selectedProcesso?.id} para o Chefe.
            </DialogDescription>
          </DialogHeader>
          
          {selectedProcesso && (
            <div className="bg-muted p-3 rounded-md text-sm">
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
                  <span className="font-semibold">Data da Visita:</span> {selectedProcesso.dataVisita ? formatarData(selectedProcesso.dataVisita) : 'Não registrada'}
                </div>
              </div>
              
              {selectedProcesso.observacoesVisita && (
                <div className="mt-2">
                  <span className="font-semibold">Observações da Visita:</span>
                  <div className="mt-1 text-xs bg-background p-2 rounded border">
                    {selectedProcesso.observacoesVisita}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="parecer">Parecer Técnico</Label>
              <Textarea
                id="parecer"
                placeholder="Escreva seu parecer técnico sobre o processo..."
                value={parecerTecnico}
                onChange={(e) => setParecerTecnico(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="parecerFile">Anexar Documento (opcional)</Label>
              <Input
                id="parecerFile"
                type="file"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setParecerFile(e.target.files[0]);
                  }
                }}
              />
              {parecerFile && (
                <div className="text-xs text-muted-foreground">
                  Arquivo selecionado: {parecerFile.name} ({Math.round(parecerFile.size / 1024)} KB)
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsParecerDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmitParecer} 
              disabled={isSubmitting}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                "Enviar Parecer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
