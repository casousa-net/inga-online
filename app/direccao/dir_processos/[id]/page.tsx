"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, ImageIcon, FileIcon, Upload, User, Package, CheckCircle, Ban, FileX, ChevronLeft, Clock, AlertCircle } from "lucide-react";

type Solicitacao = {
  id: number;
  tipo: string;
  status: string;
  valorTotalKz: number;
  createdAt: string;
  validadoPorTecnico?: boolean;
  validadoPorChefe?: boolean;
  tecnicoValidador?: string;
  chefeValidador?: string;
  rupePago?: boolean;
  rupeValidado?: boolean;
  aprovadoPorDirecao?: boolean;
  rupeReferencia?: string | null;
  rupeDocumento?: string | null;
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

export default function ProcessoDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const [solicitacao, setSolicitacao] = useState<Solicitacao | null>(null);
  const [loading, setLoading] = useState(true);
  const [aprovando, setAprovando] = useState(false);
  const [rejeitando, setRejeitando] = useState(false);
  const [motivoRejeicao, setMotivoRejeicao] = useState("");
  const [showRejeicaoModal, setShowRejeicaoModal] = useState(false);

  useEffect(() => {
    const fetchSolicitacao = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/solicitacoes/${params.id}`);
        if (!response.ok) throw new Error('Erro ao carregar dados do processo');
        const data = await response.json();
        setSolicitacao(data);
      } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar dados do processo. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchSolicitacao();
    }
  }, [params.id]);

  const aprovarProcesso = async () => {
    if (!solicitacao) return;
    
    try {
      setAprovando(true);
      const response = await fetch(`/api/solicitacoes/${solicitacao.id}/aprovar-direcao`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Falha ao aprovar processo');
      }
      
      const data = await response.json();
      
      // Atualizar o estado local
      setSolicitacao(prev => prev ? { ...prev, aprovadoPorDirecao: true, status: 'Aprovado' } : null);
      
      // Mostrar mensagem de sucesso
      alert('Processo aprovado com sucesso!');
      
      // Redirecionar para a lista de processos após um breve delay
      setTimeout(() => {
        router.push('/direccao/dir_processos');
      }, 1500);
      
    } catch (error) {
      console.error('Erro ao aprovar processo:', error);
      alert('Erro ao aprovar processo. Tente novamente mais tarde.');
    } finally {
      setAprovando(false);
    }
  };

  const rejeitarProcesso = async () => {
    if (!solicitacao || !motivoRejeicao.trim()) return;
    
    try {
      setRejeitando(true);
      const response = await fetch(`/api/solicitacoes/${solicitacao.id}/rejeitar-direcao`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ motivoRejeicao })
      });
      
      if (!response.ok) {
        throw new Error('Falha ao rejeitar processo');
      }
      
      // Mostrar mensagem de sucesso
      alert('Processo rejeitado com sucesso.');
      
      // Redirecionar para a lista de processos após um breve delay
      setTimeout(() => {
        router.push('/direccao/dir_processos');
      }, 1500);
      
    } catch (error) {
      console.error('Erro ao rejeitar processo:', error);
      alert('Erro ao rejeitar processo. Tente novamente mais tarde.');
    } finally {
      setRejeitando(false);
      setShowRejeicaoModal(false);
    }
  };

  // Função para calcular a taxa conforme as regras do sistema
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
      (solicitacao?.moeda?.nome === 'Kwanza' ? 1 : (solicitacao?.moeda?.taxaCambio || 1));
  };
  
  // Função para calcular o valor da taxa de um item
  const calcularValorTaxa = (item: any) => {
    const baseTaxa = calcularBaseTaxa(item);
    return calcularTaxa(baseTaxa, item.codigoPautal?.taxa).valor;
  };

  // Calcular o valor total a pagar (incluindo taxas)
  const calcularValorTotalComTaxas = () => {
    if (!solicitacao || !solicitacao.itens) return solicitacao?.valorTotalKz || 0;
    
    let valorTotal = 0;
    let valorTaxasKz = 0;
    
    solicitacao.itens.forEach(item => {
      // Valor total do item (valor unitário * quantidade)
      const valorItemTotal = item.valorUnitario * item.quantidade;
      
      // Calcular taxa para este item
      const taxa = calcularTaxa(valorItemTotal, item.codigoPautal?.taxa);
      
      // Adicionar valor do item ao total
      valorTotal += valorItemTotal;
      
      // Adicionar valor da taxa em KZ ao total de taxas
      valorTaxasKz += taxa.valor;
    });
    
    // Converter o valor total para KZ usando a taxa de câmbio
    const valorTotalKz = valorTotal * (solicitacao?.moeda?.taxaCambio || 1);
    
    // Valor final a pagar = valor total em KZ + taxas em KZ
    return valorTotalKz + valorTaxasKz;
  };
  
  const valorTotalComTaxas = calcularValorTotalComTaxas();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lime-500 mb-4"></div>
        <p className="text-gray-600">Carregando detalhes do processo...</p>
      </div>
    );
  }

  if (!solicitacao) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Processo não encontrado</h2>
        <p className="text-gray-600 mb-4">Não foi possível encontrar os detalhes deste processo.</p>
        <Button onClick={() => router.push('/direccao/dir_processos')}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Voltar para a lista
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="mr-4" 
          onClick={() => router.push('/direccao/dir_processos')}
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <h1 className="text-2xl font-bold text-primary flex-1">
          Processo PA-{solicitacao.id.toString().padStart(4, '0')}
        </h1>
        <div className="flex items-center gap-2">
          {solicitacao.status === 'Pagamento_Confirmado' && !solicitacao.aprovadoPorDirecao ? (
            <>
              <Button 
                variant="outline" 
                className="border-red-600 text-red-600 hover:bg-red-50" 
                onClick={() => setShowRejeicaoModal(true)}
                disabled={rejeitando}
              >
                <Ban className="mr-2 h-4 w-4" /> Rejeitar
              </Button>
              <Button 
                className="bg-lime-600 hover:bg-lime-700" 
                onClick={aprovarProcesso}
                disabled={aprovando}
              >
                <CheckCircle className="mr-2 h-4 w-4" /> {aprovando ? 'Aprovando...' : 'Aprovar Processo'}
              </Button>
            </>
          ) : solicitacao.aprovadoPorDirecao ? (
            <Badge className="bg-green-100 text-green-800 px-3 py-1 text-sm flex items-center gap-1">
              <CheckCircle className="h-4 w-4" /> Processo Aprovado
            </Badge>
          ) : (
            <Badge className="bg-orange-100 text-orange-800 px-3 py-1 text-sm flex items-center gap-1">
              <Clock className="h-4 w-4" /> Aguardando Pagamento
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Utente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <User className="h-8 w-8 text-lime-600 mr-2" />
              <div>
                <h3 className="font-semibold">{solicitacao.utente.nome}</h3>
                <p className="text-sm text-gray-500">NIF: {solicitacao.utente.nif}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Detalhes do Processo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-lime-600 mr-2" />
              <div>
                <h3 className="font-semibold">{solicitacao.tipo}</h3>
                <p className="text-sm text-gray-500">
                  Criado em: {new Date(solicitacao.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Valor Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center space-x-3">
                <Package className="w-8 h-8 text-lime-600" />
                <div>
                  <h3 className="text-xl font-bold">
                    {(solicitacao.itens || []).reduce((acc, item) => acc + calcularValorTaxa(item), 0).toLocaleString('pt-AO')} KZ
                  </h3>
                  <div className="text-sm text-gray-500">
                    <p>Valor Taxado: {(solicitacao.itens || []).reduce((acc, item) => acc + calcularBaseTaxa(item), 0).toLocaleString('pt-AO')} KZ</p>
                    <p className="mt-1">{solicitacao.status.replace(/_/g, ' ')}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="detalhes" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
          <TabsTrigger value="itens">Itens</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="rupe">RUPE</TabsTrigger>
        </TabsList>

        <TabsContent value="detalhes" className="bg-white p-6 rounded-lg shadow-sm border mt-2">
          <h2 className="text-xl font-semibold mb-4">Informações do Utente</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label className="text-gray-500">Nome</Label>
              <Input value={solicitacao.utente.nome} readOnly className="bg-gray-50" />
            </div>
            <div>
              <Label className="text-gray-500">NIF</Label>
              <Input value={solicitacao.utente.nif} readOnly className="bg-gray-50" />
            </div>
            <div>
              <Label className="text-gray-500">Email</Label>
              <Input value={solicitacao.utente.email} readOnly className="bg-gray-50" />
            </div>
            <div>
              <Label className="text-gray-500">Telefone</Label>
              <Input value={solicitacao.utente.telefone} readOnly className="bg-gray-50" />
            </div>
            <div className="md:col-span-2">
              <Label className="text-gray-500">Endereço</Label>
              <Input value={solicitacao.utente.endereco} readOnly className="bg-gray-50" />
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-4">Estado do Processo</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col items-center p-4 border rounded-lg bg-gray-50">
              <div className={`rounded-full p-2 ${solicitacao.validadoPorTecnico ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'}`}>
                <CheckCircle className="h-6 w-6" />
              </div>
              <p className="mt-2 font-medium">Validado por Técnico</p>
              <p className="text-sm text-gray-500">
                {solicitacao.validadoPorTecnico 
                  ? solicitacao.tecnicoValidador || 'Validado'
                  : 'Não'}
              </p>
            </div>
            
            <div className="flex flex-col items-center p-4 border rounded-lg bg-gray-50">
              <div className={`rounded-full p-2 ${solicitacao.validadoPorChefe ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'}`}>
                <CheckCircle className="h-6 w-6" />
              </div>
              <p className="mt-2 font-medium">Validado por Chefe</p>
              <p className="text-sm text-gray-500">
                {solicitacao.validadoPorChefe 
                  ? solicitacao.chefeValidador || 'Validado'
                  : 'Não'}
              </p>
            </div>
            
            <div className="flex flex-col items-center p-4 border rounded-lg bg-gray-50">
              <div className={`rounded-full p-2 ${solicitacao.aprovadoPorDirecao ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'}`}>
                <CheckCircle className="h-6 w-6" />
              </div>
              <p className="mt-2 font-medium">Aprovado pela Direção</p>
              <p className="text-sm text-gray-500">{solicitacao.aprovadoPorDirecao ? 'Sim' : 'Não'}</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="itens" className="bg-white p-4 rounded-lg shadow-sm border mt-2">
          <h2 className="text-lg font-semibold mb-3">Itens do Processo</h2>
          
          {solicitacao.itens && solicitacao.itens.length > 0 ? (
            <div className="overflow-x-auto rounded-lg">
              <table className="w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Código Pautal</th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Qtd</th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Val. Unit. ({solicitacao.moeda.simbolo})</th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Val. Total ({solicitacao.moeda.simbolo})</th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Val. KZ</th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Taxa</th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Val. Taxado</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {solicitacao.itens.map((item) => {
                    const baseTaxa = calcularBaseTaxa(item);
                    const taxa = calcularTaxa(baseTaxa, item.codigoPautal?.taxa);
                    const valorTaxa = calcularValorTaxa(item);
                    return (
                      <tr key={item.id}>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                          {item.codigoPautal?.codigo}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{item.quantidade}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                          {item.valorUnitario.toLocaleString('pt-AO')}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                          {(item.valorUnitario * item.quantidade).toLocaleString('pt-AO')}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                          {baseTaxa.toLocaleString('pt-AO')}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                          {taxa.percentagem}%
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                          {valorTaxa.toLocaleString('pt-AO')}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-gray-50">
                    <td colSpan={3} className="px-3 py-2 whitespace-nowrap text-xs font-bold text-gray-900 text-right">
                      Totais:
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-bold text-gray-900">
                      {solicitacao.itens.reduce((acc, item) => acc + (item.valorUnitario * item.quantidade), 0).toLocaleString('pt-AO')} {solicitacao.moeda.simbolo}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-bold text-gray-900">
                      {solicitacao.itens.reduce((acc, item) => acc + calcularBaseTaxa(item), 0).toLocaleString('pt-AO')} KZ
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-bold text-gray-900">-</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-bold text-lime-700">
                      {solicitacao.itens.reduce((acc, item) => acc + calcularValorTaxa(item), 0).toLocaleString('pt-AO')} KZ
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 italic">Nenhum item encontrado para este processo.</p>
          )}
        </TabsContent>

        <TabsContent value="documentos" className="bg-white p-6 rounded-lg shadow-sm border mt-2">
          <h2 className="text-xl font-semibold mb-4">Documentos Anexados</h2>
          
          {solicitacao.documentos && solicitacao.documentos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {solicitacao.documentos.map((doc) => (
                <div key={doc.id} className="border rounded-lg p-4 flex items-start">
                  {doc.tipo.includes('image') ? (
                    <ImageIcon className="h-10 w-10 text-blue-500 mr-3" />
                  ) : (
                    <FileIcon className="h-10 w-10 text-red-500 mr-3" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">{doc.nome}</h3>
                    <p className="text-sm text-gray-500 mb-2">{doc.tipo}</p>
                    <div className="flex space-x-2">
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Visualizar
                      </a>
                      <a 
                        href={doc.url} 
                        download 
                        className="text-sm text-lime-600 hover:text-lime-800"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">Nenhum documento encontrado para este processo.</p>
          )}
        </TabsContent>

        <TabsContent value="rupe" className="bg-white p-6 rounded-lg shadow-sm border mt-2">
          <h2 className="text-xl font-semibold mb-4">Referência Única de Pagamento ao Estado (RUPE)</h2>
          
          {solicitacao.rupeReferencia ? (
            <div className="space-y-6">
              <div className="p-4 border rounded-lg bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Referência RUPE:</h3>
                  <Badge className="bg-lime-100 text-lime-800 px-3 py-1">Gerado</Badge>
                </div>
                <p className="text-lg font-mono font-bold text-gray-900">{solicitacao.rupeReferencia}</p>
                
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">Status do Pagamento:</h3>
                    {solicitacao.rupePago ? (
                      <Badge className="bg-green-100 text-green-800 px-3 py-1 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Confirmado pelo Utente
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800 px-3 py-1">Aguardando Pagamento</Badge>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">Validação do Chefe:</h3>
                    {solicitacao.rupeValidado ? (
                      <Badge className="bg-green-100 text-green-800 px-3 py-1 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Validado
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800 px-3 py-1">Aguardando Validação</Badge>
                    )}
                  </div>
                </div>
                
                {solicitacao.rupeDocumento && (
                  <div className="mt-4 pt-4 border-t">
                    <h3 className="font-medium mb-2">Documento RUPE:</h3>
                    <div className="flex items-center">
                      <FileText className="h-6 w-6 text-red-500 mr-2" />
                      <div>
                        <p className="text-sm font-medium">RUPE_{solicitacao.id}.pdf</p>
                        <div className="flex space-x-2 mt-1">
                          <a 
                            href={solicitacao.rupeDocumento} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Visualizar
                          </a>
                          <a 
                            href={solicitacao.rupeDocumento} 
                            download 
                            className="text-sm text-lime-600 hover:text-lime-800"
                          >
                            Download
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 border rounded-lg bg-gray-50 text-center">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900">RUPE ainda não gerado</h3>
              <p className="text-gray-500 mt-1">Este processo ainda não possui uma referência RUPE.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de Rejeição */}
      {showRejeicaoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Rejeitar Processo</h2>
            <p className="mb-4 text-gray-600">Por favor, informe o motivo da rejeição deste processo:</p>
            
            <div className="mb-4">
              <Label htmlFor="motivoRejeicao" className="block mb-2">Motivo da Rejeição</Label>
              <textarea
                id="motivoRejeicao"
                className="w-full p-2 border rounded-md"
                rows={4}
                value={motivoRejeicao}
                onChange={(e) => setMotivoRejeicao(e.target.value)}
                placeholder="Descreva o motivo da rejeição..."
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowRejeicaoModal(false)}
                disabled={rejeitando}
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={rejeitarProcesso}
                disabled={!motivoRejeicao.trim() || rejeitando}
              >
                {rejeitando ? 'Rejeitando...' : 'Confirmar Rejeição'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
