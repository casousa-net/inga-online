"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileText, ImageIcon, FileIcon, Upload, User, Package, FileCheck, Ban, FileX, ChevronLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";

type Solicitacao = {
  id: number;
  tipo: string;
  status: string;
  valorTotalKz: number;
  createdAt: string;
  validadoPorTecnico?: boolean;
  validadoPorChefe?: boolean;
  rupePago?: boolean;
  rupeValidado?: boolean;
  rupeReferencia?: string | null;
  rupePdf?: string | null;
  utente: {
    id: number;
    nome: string;
    nif: string;
    email: string;
    telefone: string;
    endereco: string;
  };
  moeda: {
    nome: string;
    simbolo: string;
    taxaCambio: number;
  };
  documentos?: Array<{
    id: number;
    nome: string;
    url: string;
    tipo: string;
  }>;
  itens?: Array<{
    id: number;
    descricao: string;
    quantidade: number;
    valorUnitario: number;
    valorTotal: number;
    codigoPautal: {
      codigo: string;
      descricao: string;
      taxa: number;
    };
  }>;
};

export default function ProcessoPage() {
  const params = useParams();
  const router = useRouter();
  const [solicitacao, setSolicitacao] = useState<Solicitacao | null>(null);
  const [loading, setLoading] = useState(true);
  const [rupeReferencia, setRupeReferencia] = useState("");
  const [rupePdf, setRupePdf] = useState<File | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [documentosVerificados, setDocumentosVerificados] = useState(false);
  const [rupeCorreta, setRupeCorreta] = useState(false);
  const [confirmandoPagamento, setConfirmandoPagamento] = useState(false);
  const [validando, setValidando] = useState(false);
  const [showValidarDialog, setShowValidarDialog] = useState(false);
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    const fetchSolicitacao = async () => {
      try {
        const response = await fetch(`/api/solicitacao/${params.id}`);
        const data = await response.json();
        console.log('Documentos recebidos:', data.documentos);
        setSolicitacao(data);
      } catch (error) {
        console.error('Erro ao carregar solicitação:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchSolicitacao();
    }
  }, [params.id]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  if (!solicitacao) {
    return <div className="flex items-center justify-center min-h-screen">Processo não encontrado</div>;
  }

  const handleRupeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rupeReferencia || !rupePdf) return;

    // Mostrar modal de confirmação
    setShowConfirmModal(true);
  };

  const confirmarEnvioRupe = async () => {
    if (!documentosVerificados || !rupeCorreta) return;

    try {
      const formData = new FormData();
      formData.append('rupeReferencia', rupeReferencia);
      formData.append('rupePdf', rupePdf!);

      const response = await fetch(`/api/solicitacao/${solicitacao.id}/adicionar-rupe`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Erro ao adicionar RUPE');

      // Fechar o modal e recarregar a página
      setShowConfirmModal(false);
      window.location.reload();
    } catch (error) {
      console.error('Erro:', error);
    }
  };
  
  const confirmarPagamento = async () => {
    if (!solicitacao) return;
    
    try {
      setConfirmandoPagamento(true);
      
      const response = await fetch(`/api/solicitacoes/${solicitacao.id}/validar-pagamento-new`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Erro ao validar pagamento');
      }
      
      // Mostrar mensagem de sucesso
      alert('Pagamento validado com sucesso! O processo enviado para a Direcção.');
      
      // Redirecionar para a lista de processos
      router.push('/chefe/processos/autorizacao');
      
    } catch (error) {
      console.error('Erro ao validar pagamento:', error);
      alert('Erro ao validar pagamento. Tente novamente.');
    } finally {
      setConfirmandoPagamento(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setRupePdf(e.target.files[0]);
    }
  };

  const calcularTaxa = (valor: number, taxaPersonalizada?: number): { valor: number; percentagem: number } => {
    // Se houver uma taxa personalizada definida no código pautal, usar essa
    if (taxaPersonalizada !== undefined && taxaPersonalizada > 0) {
      return { valor: valor * (taxaPersonalizada / 100), percentagem: taxaPersonalizada };
    }
    
    // Caso contrário, usar a tabela de taxas padrão
    if (valor <= 6226000) return { valor: valor * 0.006, percentagem: 0.6 };
    if (valor <= 25000000) return { valor: valor * 0.004, percentagem: 0.4 };
    if (valor <= 62480000) return { valor: valor * 0.003, percentagem: 0.3 };
    if (valor <= 249040000) return { valor: valor * 0.002, percentagem: 0.2 };
    return { valor: valor * 0.0018, percentagem: 0.18 };
  };

  // Função para calcular a base de taxa de um item
  const calcularBaseTaxa = (item: any) => {
    return (item.valorUnitario || 0) * (item.quantidade || 0) * 
      (solicitacao.moeda?.nome === 'Kwanza' ? 1 : (solicitacao.moeda?.taxaCambio || 1));
  };
  
  // Função para calcular o valor da taxa de um item
  const calcularValorTaxa = (item: any) => {
    const baseTaxa = calcularBaseTaxa(item);
    return calcularTaxa(baseTaxa, item.codigoPautal?.taxa).valor;
  };
  
  // Calcular o total de taxas
  let valorTotalTaxas = solicitacao.itens?.reduce((total, item) => {
    return total + calcularValorTaxa(item);
  }, 0) || 0;

  // Aplicar valor mínimo se necessário
  if (valorTotalTaxas < 2000) {
    valorTotalTaxas = 2000;
  }

  const formatarNumero = (valor: number): string => {
    return valor.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const getDocumentIcon = (tipo: string) => {
    switch (tipo?.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-primary" />;
      case 'image':
      case 'png':
      case 'jpg':
      case 'jpeg':
        return <ImageIcon className="w-5 h-5 text-primary" />;
      default:
        return <FileIcon className="w-5 h-5 text-primary" />;
    }
  };

  // Função para validar o processo pelo chefe
  const validarProcesso = async () => {
    try {
      setValidando(true);
      console.log('Iniciando validação do processo:', solicitacao.id);
      
      // Buscar o nome do chefe do localStorage
      const nome = localStorage.getItem('userName');

      const response = await fetch(`/api/solicitacoes/${solicitacao.id}/validar-chefe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ observacoes, nome })
      });
      
      console.log('Status da resposta:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Detalhes do erro:', errorData);
        throw new Error(errorData.error || 'Erro ao validar processo');
      }
      
      // Atualizar a solicitação
      const updatedSolicitacao = await response.json();
      console.log('Solicitação atualizada:', updatedSolicitacao);
      setSolicitacao(updatedSolicitacao);
      
      // Fechar o diálogo e mostrar mensagem de sucesso
      setShowValidarDialog(false);
      toast.success('Processo validado com sucesso!');
      
      // Redirecionar para a lista de processos após um breve delay
      setTimeout(() => {
        router.push('/chefe/processos/autorizacao');
      }, 1500);
      
    } catch (error) {
      console.error('Erro ao validar processo:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao validar o processo. Tente novamente.');
    } finally {
      setValidando(false);
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Button 
              variant="outline" 
              className="flex items-center gap-2 text-lime-700"
              onClick={() => router.push('/chefe/processos/autorizacao')}
            >
              <ChevronLeft size={16} /> Voltar para Autorizações
            </Button>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="text-primary" />
            PA-{solicitacao.id.toString().padStart(4, '0')}
          </h1>
          <p className="text-muted-foreground">
            Criado em {solicitacao.createdAt ? new Date(solicitacao.createdAt).toLocaleString('pt-BR') : '-'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge
            variant={solicitacao.status === 'Pendente' ? 'destructive' : 'outline'}
            className={solicitacao.status === 'Pendente' ? 'bg-red-100 text-red-700 border-none' : ''}
          >
            {solicitacao.status}
          </Badge>
          
          {/* Status de validação do técnico */}
          <Badge
            variant={solicitacao.validadoPorTecnico ? 'success' : 'outline'}
            className={solicitacao.validadoPorTecnico ? 'bg-green-100 text-green-700 border-none' : ''}
          >
            {solicitacao.validadoPorTecnico ? 'Validado pelo Técnico' : 'Pendente Validação Técnica'}
          </Badge>
          
          {/* Status de validação do chefe */}
          <Badge
            variant={solicitacao.validadoPorChefe ? 'success' : 'outline'}
            className={solicitacao.validadoPorChefe ? 'bg-green-100 text-green-700 border-none' : ''}
          >
            {solicitacao.validadoPorChefe ? 'Validado pelo Chefe' : 'Pendente Validação Chefe'}
          </Badge>
        </div>
      </div>

      {/* Botão de Validação do Chefe */}
      {!solicitacao.validadoPorChefe && (
        <Card className="border-lime-200 bg-lime-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-lime-800">Validação do Chefe Pendente</h3>
                <p className="text-lime-700 mt-1">
                  Este processo precisa da sua validação para prosseguir.
                </p>
              </div>
              <Button 
                className="bg-lime-600 hover:bg-lime-700 text-white"
                onClick={() => setShowValidarDialog(true)}
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Validar Processo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Conteúdo Principal */}
      <Tabs defaultValue="utente" className="w-full">
        <TabsList>
          <TabsTrigger value="utente" className="flex items-center gap-2">
            <User className="w-4 h-4" /> Dados do Utente
          </TabsTrigger>
          <TabsTrigger value="documentos" className="flex items-center gap-2">
            <FileText className="w-4 h-4" /> Documentos
          </TabsTrigger>
          <TabsTrigger value="itens" className="flex items-center gap-2">
            <Package className="w-4 h-4" /> Itens
          </TabsTrigger>
          <TabsTrigger value="rupe" className="flex items-center gap-2">
            <FileCheck className="w-4 h-4" /> RUPE
          </TabsTrigger>
        </TabsList>

        {/* Aba de Dados do Utente */}
        <TabsContent value="utente">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Utente</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome</Label>
                  <p className="text-lg">{solicitacao.utente.nome}</p>
                </div>
                <div>
                  <Label>NIF</Label>
                  <p className="text-lg">{solicitacao.utente.nif}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-lg">{solicitacao.utente.email}</p>
                </div>
                <div>
                  <Label>Telefone</Label>
                  <p className="text-lg">{solicitacao.utente.telefone}</p>
                </div>
                <div className="col-span-2">
                  <Label>Endereço</Label>
                  <p className="text-lg">{solicitacao.utente.endereco}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Documentos */}
        <TabsContent value="documentos">
          <Card>
            <CardHeader>
              <CardTitle>Documentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {solicitacao.documentos?.length ? (
                  solicitacao.documentos.map((doc) => {
                    // Extrair o nome do arquivo da URL, se o nome não estiver disponível
                    const fileName = doc.url ? doc.url.split('/').pop() : '';
                    const displayName = doc.nome || fileName || `Documento ${doc.id}`;

                    // Log detalhado para depuração
                    console.log('Documento (chefe):', {
                      id: doc.id,
                      tipo: doc.tipo,
                      nome: doc.nome,
                      url: doc.url,
                      fileName: fileName,
                      displayName: displayName
                    });

                    return (
                      <div key={doc.id} className="flex flex-col p-4 border rounded-lg bg-card hover:bg-accent/10 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          {getDocumentIcon(doc.tipo)}
                          <div className="flex flex-col">
                            <span className="font-medium truncate">
                              {doc.tipo === 'foto' ? 'Foto do Produto' :
                                doc.tipo === 'carta' ? 'Carta de Solicitação' :
                                  doc.tipo === 'factura' ? 'Factura Comercial' :
                                    doc.tipo === 'comprovativo' ? 'Comprovativo de Pagamento' :
                                      doc.tipo === 'especificacao' ? 'Especificação Técnica' :
                                        doc.tipo || 'Documento'}
                            </span>
                            <span className="text-xs text-muted-foreground truncate mt-1">
                              {displayName}
                            </span>
                            {/* Logs de depuração são feitos fora do JSX */}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-muted-foreground">
                            Tipo: {doc.tipo?.toUpperCase() || 'Desconhecido'}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => {
                              // Usar a nova API de documentos para garantir acesso
                              let documentUrl;
                              
                              if (doc.url) {
                                // Usar a API de arquivo com o caminho do documento
                                documentUrl = `/api/documentos/arquivo?path=${encodeURIComponent(doc.url)}&nome=${encodeURIComponent(doc.nome || 'documento')}`;
                              } else {
                                // Fallback para a API por ID
                                documentUrl = `/api/documentos/${doc.id}`;
                              }
                              
                              console.log('Abrindo documento via API:', documentUrl);
                              window.open(documentUrl, '_blank');
                            }}
                          >
                            <FileText className="w-4 h-4" />
                            Visualizar
                          </Button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-2 flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <FileX className="w-12 h-12 mb-2 text-muted-foreground/50" />
                    <p>Nenhum documento disponível</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Itens */}
        <TabsContent value="itens">
          <Card>
            <CardHeader>
              <CardTitle>Itens do Processo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="rounded-lg border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="p-2 text-right">Qtd.</th>
                        <th className="p-2 text-right">Valor Unit.</th>
                        <th className="p-2 text-right">Valor Total</th>
                        <th className="p-2 text-right">Base de Taxa (Valor em Moeda)</th>
                        <th className="p-2 text-left">Código Pautal</th>
                        <th className="p-2 text-right">Taxa</th>
                        <th className="p-2 text-right">Valor da Taxa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {solicitacao.itens?.length ? (
                        solicitacao.itens.map((item) => (
                          <tr key={item.id} className="border-b">
                            <td className="p-2 text-right">{(item.quantidade || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}</td>
                            <td className="p-2 text-right">
                              {solicitacao.moeda?.simbolo} {formatarNumero(item.valorUnitario || 0)}
                            </td>
                            <td className="p-2 text-right">
                              {solicitacao.moeda?.simbolo} {formatarNumero((item.valorUnitario || 0) * (item.quantidade || 0))}
                            </td>
                            <td className="p-2 text-right">
                              {solicitacao.moeda?.nome !== 'Kwanza' ? (
                                <>
                                  {solicitacao.moeda?.simbolo} {formatarNumero((item.valorUnitario || 0) * (item.quantidade || 0))}
                                  <span className="text-muted-foreground ml-1">
                                    (KZ {formatarNumero((item.valorUnitario || 0) * (item.quantidade || 0) * (solicitacao.moeda?.taxaCambio || 1))})
                                  </span>
                                </>
                              ) : (
                                <>KZ {formatarNumero((item.valorUnitario || 0) * (item.quantidade || 0))}</>
                              )}
                            </td>
                            <td className="p-2">
                              {item.codigoPautal?.codigo} - {item.codigoPautal?.descricao}
                            </td>
                            <td className="p-2 text-right">
                              {calcularTaxa(0, item.codigoPautal?.taxa).percentagem}%
                            </td>
                            <td className="p-2 text-right">
                              {(() => {
                                // Calcular a base de taxa (valor em Kwanzas)
                                const baseTaxa = (item.valorUnitario || 0) * (item.quantidade || 0) * 
                                  (solicitacao.moeda?.nome === 'Kwanza' ? 1 : (solicitacao.moeda?.taxaCambio || 1));
                                // Calcular o valor da taxa
                                const valorTaxa = calcularTaxa(baseTaxa, item.codigoPautal?.taxa).valor;
                                return `KZ ${formatarNumero(valorTaxa)}`;
                              })()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-muted-foreground">
                            Nenhum item disponível
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="border-t bg-muted/50 font-medium">
                        <td colSpan={3} className="p-2 text-right">Total:</td>
                        <td className="p-2 text-right">
                          KZ {formatarNumero(solicitacao.valorTotalKz || 0)}
                        </td>
                        <td colSpan={2} className="p-2 text-right">
                          Total de Taxas: KZ {formatarNumero(valorTotalTaxas)}
                        </td>
                        <td className="p-2 text-right">
                          KZ {formatarNumero(valorTotalTaxas)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de RUPE */}
        <TabsContent value="rupe">
          <Card>
            <CardHeader>
              <CardTitle>RUPE - Referência Única de Pagamento ao Estado</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Mostrar botão de confirmação de pagamento quando o utente marcou como pago mas o chefe ainda não validou */}
              {solicitacao.rupeReferencia && solicitacao.rupePago && !solicitacao.rupeValidado && (
                <div className="mb-6 p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-yellow-800">Pagamento aguardando validação</h3>
                      <p className="text-yellow-700 text-sm mt-1">O utente confirmou o pagamento do RUPE. Por favor, verifique e confirme.</p>
                    </div>
                    <Button 
                      className="bg-green-600 hover:bg-green-700 text-white font-bold"
                      onClick={confirmarPagamento}
                      disabled={confirmandoPagamento}
                      size="lg"
                    >
                      {confirmandoPagamento ? (
                        <>
                          <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          Processando...
                        </>
                      ) : (
                        <>
                          <FileCheck className="h-4 w-4 mr-2" />
                          PAGO
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Status de pagamento validado */}
              {solicitacao.rupeValidado && (
                <div className="mb-6 p-4 border border-green-200 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <FileCheck className="h-5 w-5 text-green-600 mr-2" />
                    <div>
                      <h3 className="font-medium text-green-800">Pagamento validado</h3>
                      <p className="text-green-700 text-sm mt-1">O pagamento foi confirmado e validado.</p>
                    </div>
                  </div>
                </div>
              )}
              
              {solicitacao.rupeReferencia ? (
                <div className="space-y-4">
                  <div>
                    <Label>Referência RUPE</Label>
                    <p className="text-lg font-medium">{solicitacao.rupeReferencia}</p>
                  </div>
                  {solicitacao.rupePdf && (
                    <div>
                      <Label>Documento RUPE</Label>
                      <div className="mt-2">
                        <Button
                          variant="outline"
                          onClick={() => window.open(solicitacao.rupePdf!, '_blank')}
                          className="flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          Visualizar RUPE
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : solicitacao.validadoPorTecnico || solicitacao.validadoPorChefe ? (
                <form onSubmit={handleRupeSubmit} className="space-y-4">
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="rupeReferencia">Referência RUPE</Label>
                      <Input
                        id="rupeReferencia"
                        value={rupeReferencia}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRupeReferencia(e.target.value)}
                        placeholder="Digite a referência RUPE"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="rupePdf">Documento RUPE (PDF)</Label>
                      <Input
                        id="rupePdf"
                        type="file"
                        accept=".pdf"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e)}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    Adicionar RUPE
                  </Button>

                  {/* Modal de Confirmação */}
                  {showConfirmModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                      <div className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full space-y-4">
                        <h3 className="text-lg font-bold">Confirmação de Envio</h3>
                        <p className="text-muted-foreground">Antes de enviar a RUPE, confirme que:</p>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="documentosVerificados"
                              checked={documentosVerificados}
                              onChange={(e) => setDocumentosVerificados(e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor="documentosVerificados" className="text-sm font-medium">
                              Verifiquei todos os documentos do processo
                            </label>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="rupeCorreta"
                              checked={rupeCorreta}
                              onChange={(e) => setRupeCorreta(e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor="rupeCorreta" className="text-sm font-medium">
                              Confirmo que a referência RUPE está correta
                            </label>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <Button
                            variant="outline"
                            onClick={() => setShowConfirmModal(false)}
                            type="button"
                          >
                            Cancelar
                          </Button>
                          <Button
                            onClick={confirmarEnvioRupe}
                            disabled={!documentosVerificados || !rupeCorreta}
                            type="button"
                          >
                            Confirmar Envio
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
                  <div className="flex items-center gap-2 text-amber-800">
                    <Ban className="h-5 w-5" />
                    <div>
                      <h3 className="font-medium">Validação pendente</h3>
                      <p className="text-sm mt-1">Este processo precisa ser validado por um Técnico ou pelo Chefe antes de adicionar o RUPE.</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {/* Diálogo de Validação */}
      <Dialog open={showValidarDialog} onOpenChange={setShowValidarDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Validar Processo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Você está prestes a validar o processo PA-{solicitacao.id.toString().padStart(4, '0')}.
                Esta ação confirma que você revisou todos os documentos e informações do processo.
              </p>
              <p className="text-sm font-medium">
                Deseja adicionar alguma observação?
              </p>
            </div>
            <Textarea
              value={observacoes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setObservacoes(e.target.value)}
              placeholder="Observações (opcional)"
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowValidarDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={validarProcesso}
              disabled={validando}
              className="bg-lime-600 hover:bg-lime-700 text-white"
            >
              {validando ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Validando...
                </>
              ) : (
                <>
                  <FileCheck className="h-4 w-4 mr-2" />
                  Confirmar Validação
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
