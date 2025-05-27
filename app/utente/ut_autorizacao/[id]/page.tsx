'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ChevronLeft, CheckCircle } from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Autorizacao = {
  id: number;
  tipo: string;
  createdAt: string;
  status: string;
  rupeReferencia?: string | null;
  rupePdf?: string | null;
  rupePago?: boolean;
  rupeValidado?: boolean;
  valorTotalKz: number;
  moeda?: { nome: string; simbolo: string };
  itens?: {
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
  }[];
  documentos?: {
    id: number;
    tipo: string;
    nome: string;
    url: string;
  }[];
};

// Função para calcular a taxa baseada no valor
function calcularTaxa(valor: number): number {
  if (valor <= 6226000) return 0.006;
  if (valor <= 25000000) return 0.004;
  if (valor <= 62480000) return 0.003;
  if (valor <= 249040000) return 0.002;
  return 0.0018;
}

// Função para calcular o valor final com a taxa e aplicar o mínimo
function calcularValorFinal(valor: number): number {
  // Calcular a taxa sobre o valor em Kwanzas
  const taxa = calcularTaxa(valor);
  let totalCobrar = valor * taxa;
  
  // Aplicar valor mínimo se necessário
  if (totalCobrar < 2000) {
    totalCobrar = 2000;
  }
  
  return totalCobrar;
}

export default function AutorizacaoDetalhesPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [autorizacao, setAutorizacao] = useState<Autorizacao | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixCode, setPixCode] = useState('');
  const [pixExpiration, setPixExpiration] = useState('');
  const [pixStatus, setPixStatus] = useState<'pending' | 'paid' | 'expired'>('pending');
  const [pixCheckInterval, setPixCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'mpesa' | null>(null);
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [mpesaLoading, setMpesaLoading] = useState(false);
  const [mpesaError, setMpesaError] = useState('');
  const [mpesaSuccess, setMpesaSuccess] = useState(false);
  const [mpesaCheckInterval, setMpesaCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [showMpesaModal, setShowMpesaModal] = useState(false);
  const [mpesaReference, setMpesaReference] = useState('');
  const [mpesaAmount, setMpesaAmount] = useState(0);
  const [mpesaExpiration, setMpesaExpiration] = useState('');
  const [confirmandoPagamento, setConfirmandoPagamento] = useState(false);

  useEffect(() => {
    // Extrair apenas o número do ID, caso esteja no formato PA-000002
    const idNumerico = id.toString().replace(/^PA-0*/, '');
    
    fetch(`/api/solicitacao/${idNumerico}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (data.error) {
          throw new Error(data.error);
        }
        setAutorizacao(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erro ao carregar autorização:', err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-4 text-lime-700 hover:text-lime-800 hover:bg-lime-50"
          onClick={() => router.push('/utente/ut_autorizacao')}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Voltar para Autorizações
        </Button>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-700"></div>
        </div>
      </div>
    );
  }

  if (!autorizacao) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-4 text-lime-700 hover:text-lime-800 hover:bg-lime-50"
          onClick={() => router.push('/utente/ut_autorizacao')}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Voltar para Autorizações
        </Button>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-center py-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Processo não encontrado</h2>
            <p className="text-gray-600">Não foi possível encontrar os detalhes deste processo.</p>
          </div>
        </div>
      </div>
    );
  }

  const confirmarPagamento = async () => {
    if (!autorizacao) return;
    
    try {
      setConfirmandoPagamento(true);
      const response = await fetch(`/api/solicitacoes/${autorizacao.id}/confirmar-pagamento`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Falha ao confirmar pagamento');
      }
      
      const data = await response.json();
      
      // Atualizar o estado local
      setAutorizacao(prev => prev ? { ...prev, rupePago: true, status: 'Aguardando_Confirmacao_Pagamento' } : null);
      
      // Mostrar mensagem de sucesso
      alert('Pagamento enviado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      alert('Erro ao confirmar pagamento. Tente novamente mais tarde.');
    } finally {
      setConfirmandoPagamento(false);
    }
  };

  const getBadgeColor = (status: string) => {
    switch (status) {
      case 'Pendente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Valido_RUPE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Aguardando_Pagamento':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Pagamento_Confirmado':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Aprovado':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Rejeitado':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        className="mb-4 text-lime-700 hover:text-lime-800 hover:bg-lime-50"
        onClick={() => router.push('/utente/ut_autorizacao')}
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        Voltar para Autorizações
      </Button>

      <div className="bg-white rounded-xl shadow-lg p-6">
        {/* Cabeçalho */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              PA-{String(autorizacao.id).padStart(6, "0")}
            </h1>
            <p className="text-gray-600">
              Criado em {format(new Date(autorizacao.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm:ss", { locale: ptBR })}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={`px-3 py-1 ${getBadgeColor(autorizacao.status)}`}>
              {autorizacao.status}
            </Badge>
          </div>
        </div>

        {/* Detalhes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações Gerais</h2>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-600">Tipo de Autorização:</span>
                <Badge className="ml-2 bg-blue-100 text-blue-800 border-blue-200">
                  {autorizacao.tipo}
                </Badge>
              </div>
              <div>
                <span className="text-sm text-gray-600">Moeda:</span>
                <Badge className="ml-2 bg-purple-100 text-purple-800 border-purple-200">
                  {autorizacao.moeda?.nome || 'Não especificada'}
                </Badge>
              </div>
              <div>
                <span className="text-sm text-gray-600">Estado:</span>
                <Badge className={`ml-2 ${getBadgeColor(autorizacao.status)}`}>
                  {autorizacao.status}
                </Badge>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações de Pagamento</h2>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-600">RUPE:</span>
                {autorizacao.rupeReferencia ? (
                  <Badge className="ml-2 bg-green-100 text-green-800 border-green-200">
                    {autorizacao.rupeReferencia}
                  </Badge>
                ) : (
                  <Badge className="ml-2 bg-red-100 text-red-800 border-red-200">
                    Não disponível
                  </Badge>
                )}
              </div>
              
              <div>
                <span className="text-sm text-gray-600">Total em Kwanzas:</span>
                <div className="mt-1">
                  <Badge className="px-3 py-1.5 text-base font-medium bg-amber-100 text-amber-800 border-amber-200">
                    {autorizacao.valorTotalKz ? calcularValorFinal(autorizacao.valorTotalKz).toLocaleString('pt-AO', { minimumFractionDigits: 2 }) + ' Kz' : 'Não calculado'}
                  </Badge>
                </div>
                {autorizacao.valorTotalKz && autorizacao.valorTotalKz > 0 && (
                  <div className="mt-1 text-xs text-gray-500">
                    Valor original: {autorizacao.valorTotalKz.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz 
                    <span className="mx-1">•</span> 
                    Taxa aplicada: {(calcularTaxa(autorizacao.valorTotalKz) * 100).toFixed(2)}%
                    {calcularValorFinal(autorizacao.valorTotalKz) === 2000 && (
                      <span className="ml-1 text-amber-600">(valor mínimo aplicado)</span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 mt-4">
                {autorizacao.rupePdf && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-lime-700 border-lime-700 hover:bg-lime-50"
                    onClick={() => window.open(autorizacao.rupePdf!, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar RUPE
                  </Button>
                )}
                
                {/* Botão PAGUEI - Visível quando tem RUPE mas ainda não está marcado como pago */}
                {autorizacao.rupeReferencia && 
                 autorizacao.status === 'Aguardando_Pagamento' && 
                 !autorizacao.rupePago && (
                  <Button
                    size="sm"
                    variant="default"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={confirmarPagamento}
                    disabled={confirmandoPagamento}
                  >
                    {confirmandoPagamento ? (
                      <>
                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Processando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        PAGUEI
                      </>
                    )}
                  </Button>
                )}
                
                {/* Badge de status de pagamento */}
                {autorizacao.rupePago && (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="h-4 w-4 mr-2" /> Pagamento Confirmado
                  </Badge>
                )}
                
                {autorizacao.status === 'Aprovado' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-lime-700 border-lime-700 hover:bg-lime-50"
                    onClick={() => window.open(`/api/autorizacao/${autorizacao.id}/download`, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Licença
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Itens */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Itens</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantidade</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Preço Unit.</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {autorizacao.itens?.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.codigoPautal?.codigo || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.codigoPautal?.descricao || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">{Number(item.quantidade || 0).toLocaleString('pt-AO')}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {Number(item.valorUnitario || 0).toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {Number(item.valorTotal || 0).toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Documentos */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Documentos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {autorizacao.documentos?.map((doc) => {
              // Extrair o nome do arquivo da URL, se o nome não estiver disponível
              const fileName = doc.url ? doc.url.split('/').pop() : '';
              const displayName = doc.nome || fileName || `Documento ${doc.id}`;
              
              // Log detalhado para depuração
              console.log('Documento (utente):', {
                id: doc.id,
                tipo: doc.tipo,
                nome: doc.nome,
                url: doc.url,
                fileName: fileName,
                displayName: displayName
              });
              
              return (
                <div key={doc.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {doc.tipo === 'foto' ? 'Foto do Produto' : 
                         doc.tipo === 'carta' ? 'Carta de Solicitação' :
                         doc.tipo === 'factura' ? 'Factura Comercial' :
                         doc.tipo === 'comprovativo' ? 'Comprovativo de Pagamento' :
                         doc.tipo === 'especificacao' ? 'Especificação Técnica' :
                         doc.tipo || 'Documento'}
                      </p>
                      <p className="text-sm text-gray-600 font-medium">
                        {displayName}
                      </p>
                    </div>
                    {autorizacao.status === 'Aprovado' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-lime-700 hover:text-lime-800"
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
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
