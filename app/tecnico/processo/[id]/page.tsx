"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileText, ImageIcon, FileIcon, User, Package, FileCheck, Ban, ChevronLeft, CheckCircle } from "lucide-react";
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
  const [validando, setValidando] = useState(false);
  const [showValidarDialog, setShowValidarDialog] = useState(false);
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    const fetchSolicitacao = async () => {
      try {
        const response = await fetch(`/api/solicitacao/${params.id}`);
        const data = await response.json();
        console.log('Dados recebidos:', data);
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

  const validarProcesso = async () => {
    try {
      setValidando(true);
      
      const response = await fetch(`/api/solicitacoes/${solicitacao.id}/validar-tecnico`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ observacoes })
      });
      
      if (!response.ok) {
        throw new Error('Erro ao validar processo');
      }
      
      // Atualizar a solicitação
      const updatedSolicitacao = await response.json();
      setSolicitacao(updatedSolicitacao);
      
      // Fechar o diálogo e mostrar mensagem de sucesso
      setShowValidarDialog(false);
      toast.success('Processo validado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao validar processo:', error);
      toast.error('Erro ao validar o processo. Tente novamente.');
    } finally {
      setValidando(false);
    }
  };

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

  // Calcular o valor total das taxas
  const valorTotalTaxas = solicitacao?.itens?.reduce((acc, item) => {
    const valorBase = (item.valorUnitario || 0) * (item.quantidade || 0);
    const valorEmKwanza = valorBase * (solicitacao.moeda?.taxaCambio || 1);
    const taxa = (item.codigoPautal?.taxa || 0) / 100;
    const valorTaxa = valorEmKwanza * taxa;
    return acc + valorTaxa;
  }, 0) || 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Button 
              variant="outline" 
              className="flex items-center gap-2 text-lime-700"
              onClick={() => router.push('/tecnico/processos/autorizacao')}
            >
              <ChevronLeft size={16} /> Voltar para Autorizações
            </Button>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="text-primary" />
            PA-{solicitacao.id.toString().padStart(4, '0')}
          </h1>
          <p className="text-muted-foreground">
            Criado em {solicitacao.createdAt ? new Date(solicitacao.createdAt).toLocaleDateString('pt-BR') : '-'}
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
        </div>
      </div>

      {/* Botão de Validação */}
      {!solicitacao.validadoPorTecnico && (
        <Card className="border-lime-200 bg-lime-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-lime-800">Validação Técnica Pendente</h3>
                <p className="text-lime-700 mt-1">
                  Este processo precisa da sua validação técnica para prosseguir no fluxo de aprovação.
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
        </TabsList>

        <TabsContent value="utente">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Utente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-medium">{solicitacao.utente.nome}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">NIF</p>
                  <p className="font-medium">{solicitacao.utente.nif}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{solicitacao.utente.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium">{solicitacao.utente.telefone}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Endereço</p>
                  <p className="font-medium">{solicitacao.utente.endereco || 'Não informado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos">
          <Card>
            <CardHeader>
              <CardTitle>Documentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {solicitacao.documentos && solicitacao.documentos.length > 0 ? (
                  solicitacao.documentos.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getDocumentIcon(doc.tipo)}
                        <div>
                          <p className="font-medium">{doc.nome}</p>
                          <p className="text-sm text-muted-foreground">{doc.tipo}</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(`/api/documentos/${doc.id}`, '_blank')}
                      >
                        Ver
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-8 text-muted-foreground">
                    Nenhum documento disponível
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

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
                              {item.codigoPautal?.taxa || 0}%
                            </td>
                            <td className="p-2 text-right">
                              {(() => {
                                // Calcular a base de taxa (valor em Kwanzas)
                                const valorBase = (item.valorUnitario || 0) * (item.quantidade || 0);
                                const valorEmKwanza = valorBase * (solicitacao.moeda?.taxaCambio || 1);
                                const taxa = (item.codigoPautal?.taxa || 0) / 100;
                                const valorTaxa = valorEmKwanza * taxa;
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
                Deseja adicionar alguma observação técnica?
              </p>
            </div>
            <Textarea
              value={observacoes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setObservacoes(e.target.value)}
              placeholder="Observações técnicas (opcional)"
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
