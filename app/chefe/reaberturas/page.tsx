'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { ToastContainer } from '@/components/ui/use-toast';
import { 
  RotateCw, 
  Check, 
  X, 
  Clock, 
  CalendarIcon 
} from 'lucide-react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatReaberturaMotivo } from '@/lib/utils/formatReaberturaMotivo';

interface PeriodoReabertura {
  id: number;
  numeroPeriodo: number;
  dataInicio: string;
  dataFim: string;
  estado: string;
  dataSolicitacaoReabertura: string;
  motivoReabertura: string;
  statusReabertura: string;
  utenteId: number;
  utenteNome: string;
  utenteNif: string;
  rupeNumero?: string;
  rupePath?: string;
  rupePago?: boolean;
  rupeValidado?: boolean;
}

// Função para formatar datas
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export default function ReaberturasPage() {
  const [reaberturas, setReaberturas] = useState<PeriodoReabertura[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isConfirmPaymentModalOpen, setIsConfirmPaymentModalOpen] = useState(false);
  const [selectedReabertura, setSelectedReabertura] = useState<PeriodoReabertura | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [numeroRupe, setNumeroRupe] = useState<string>('');
  const [rupeFile, setRupeFile] = useState<File | null>(null);
  
  const fetchReaberturas = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Recuperar token do localStorage, se existir
      const authToken = localStorage.getItem('token');
      
      console.log('[Client] Iniciando busca de reaberturas...');
      console.log('[Client] Possui token em localStorage:', !!authToken);
      
      // Preparar headers com todos os métodos de autenticação possíveis
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      // Adicionar token de autenticação manualmente, se existir
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const response = await fetch('/api/monitorizacao/periodos/reaberturas', {
        method: 'GET',
        credentials: 'include', // Incluir cookies na requisição
        headers
      });
      
      console.log('[Client] Status da resposta:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Client] Erro na resposta da API:', response.status, errorText);
        throw new Error(`Erro ao buscar solicitações de reabertura: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('[Client] Dados recebidos:', data);
      console.log('[Client] Reaberturas encontradas:', data.reaberturas?.length || 0);
      
      setReaberturas(data.reaberturas || []);
    } catch (error) {
      console.error('[Client] Erro ao buscar reaberturas:', error);
      setError('Não foi possível carregar as solicitações de reabertura. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchReaberturas();
  }, []);
  
  const handleOpenViewModal = (reabertura: PeriodoReabertura) => {
    setSelectedReabertura(reabertura);
    setIsViewModalOpen(true);
  };
  
  const handleOpenApproveModal = (reabertura: PeriodoReabertura) => {
    setSelectedReabertura(reabertura);
    setIsApproveModalOpen(true);
  };
  
  const handleOpenRejectModal = (reabertura: PeriodoReabertura) => {
    setSelectedReabertura(reabertura);
    setIsRejectModalOpen(true);
  };
  
  const handleOpenConfirmPaymentModal = (reabertura: PeriodoReabertura) => {
    setSelectedReabertura(reabertura);
    setIsConfirmPaymentModalOpen(true);
  };
  
  const handleConfirmPayment = async () => {
    if (!selectedReabertura) return;
    
    setIsProcessing(true);
    
    try {
      // Verificar o estado atual da reabertura para fornecer feedback adequado
      console.log('Confirmando pagamento de RUPE para reabertura:', selectedReabertura.id);
      console.log('Estado atual:', selectedReabertura.estado);
      console.log('Status de reabertura:', selectedReabertura.statusReabertura);
      
      // Verificar se o período está em um estado válido para confirmação
      const estadosValidos = ['AGUARDANDO_CONFIRMACAO_PAGAMENTO', 'AGUARDANDO_PAGAMENTO', 'SOLICITADA_REABERTURA'];
      const statusValidos = ['AGUARDANDO_CONFIRMACAO_PAGAMENTO', 'AGUARDANDO_PAGAMENTO', 'PENDENTE'];
      
      if (!estadosValidos.includes(selectedReabertura.estado) && 
          !statusValidos.includes(selectedReabertura.statusReabertura || '')) {
        throw new Error(`Não é possível confirmar o pagamento no estado atual (${selectedReabertura.statusReabertura || selectedReabertura.estado})`);
      }
      
      const response = await fetch(`/api/monitorizacao/periodos/${selectedReabertura.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'validar-pagamento-rupe',
        }),
      });
      
      console.log('Resposta da confirmação de pagamento:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (!response.ok) {
        // Tentar obter mais detalhes sobre o erro
        try {
          const errorData = await response.json();
          console.error('Detalhes do erro:', errorData);
          throw new Error(`Erro ao confirmar pagamento: ${errorData.error || 'Erro desconhecido'}`);
        } catch (parseError) {
          console.error('Erro ao analisar resposta de erro:', parseError);
          throw new Error(`Erro ao confirmar pagamento (${response.status}: ${response.statusText})`);
        }
      }
      
      // Processar a resposta bem-sucedida
      const data = await response.json();
      console.log('Dados da resposta:', data);
      
      // Atualizar a lista de reaberturas
      await fetchReaberturas();
      
      // Fechar o modal e mostrar mensagem de sucesso
      setIsConfirmPaymentModalOpen(false);
      
      toast({
        title: 'Sucesso',
        description: 'Pagamento confirmado com sucesso. O período será reaberto por 7 dias.',
      });
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao confirmar pagamento',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleApprove = async () => {
    if (!selectedReabertura) return;
    
    // Validar campos
    if (!numeroRupe.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, informe o número da RUPE',
        variant: 'destructive',
      });
      return;
    }
    
    if (!rupeFile) {
      toast({
        title: 'Erro',
        description: 'Por favor, anexe o documento da RUPE em PDF',
        variant: 'destructive',
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      console.log('Iniciando adição de RUPE...');
      
      // Preparar o FormData com todos os dados necessários
      const formData = new FormData();
      formData.append('numeroRupe', numeroRupe);
      formData.append('file', rupeFile);
      
      console.log('Dados do formulário:', {
        numeroRupe,
        fileName: rupeFile.name,
        fileSize: rupeFile.size,
        fileType: rupeFile.type,
        periodoId: selectedReabertura.id
      });
      
      // Usar o novo endpoint que combina upload e atualização do período
      const response = await fetch(`/api/monitorizacao/periodos/${selectedReabertura.id}/adicionar-rupe`, {
        method: 'POST',
        body: formData,
      });
      
      console.log('Resposta da adição de RUPE:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (!response.ok) {
        // Tentar obter mais detalhes sobre o erro
        try {
          const errorData = await response.json();
          console.error('Detalhes do erro:', errorData);
          throw new Error(`Erro ao adicionar RUPE: ${errorData.error || 'Erro desconhecido'}`);
        } catch (parseError) {
          console.error('Erro ao analisar resposta de erro:', parseError);
          throw new Error(`Erro ao adicionar RUPE (${response.status}: ${response.statusText})`);
        }
      }
      
      let responseData;
      try {
        responseData = await response.json();
        console.log('Dados da resposta:', responseData);
      } catch (parseError) {
        console.error('Erro ao analisar resposta de sucesso:', parseError);
        throw new Error('Erro ao processar resposta do servidor');
      }
      
      // Atualizar a lista de reaberturas
      await fetchReaberturas();
      
      // Fechar o modal e mostrar mensagem de sucesso
      setIsApproveModalOpen(false);
      setNumeroRupe('');
      setRupeFile(null);
      
      toast({
        title: 'Sucesso',
        description: `RUPE ${numeroRupe} enviado. O utente deve realizar o pagamento.`,
      });
    } catch (error) {
      console.error('Erro ao aprovar solicitação:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível aprovar a solicitação. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleReject = async () => {
    if (!selectedReabertura) return;
    
    setIsProcessing(true);
    
    try {
      const response = await fetch(`/api/monitorizacao/periodos/${selectedReabertura.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'rejeitar-reabertura-chefe',
          motivoRejeicao: rejectReason || 'Solicitação rejeitada pelo Chefe'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao rejeitar solicitação');
      }
      
      toast({
        title: 'Solicitação rejeitada',
        description: 'A solicitação de reabertura foi rejeitada pelo Chefe.',
      });
      
      setIsRejectModalOpen(false);
      await fetchReaberturas();
    } catch (error) {
      console.error('Erro ao rejeitar solicitação:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível rejeitar a solicitação. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      return 'Data inválida';
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDENTE':
        return <Badge className="bg-yellow-500">Pendente</Badge>;
      case 'APROVADA':
        return <Badge className="bg-green-500">Aprovada</Badge>;
      case 'REJEITADA':
        return <Badge className="bg-red-500">Rejeitada</Badge>;
      default:
        return <Badge className="bg-gray-500">Aguardando Pagamento</Badge>;
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Solicitações de Reabertura</h1>
        <Button onClick={fetchReaberturas} variant="outline" size="sm">
          <RotateCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <RotateCw className="animate-spin h-8 w-8 text-gray-500" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center text-center gap-4">
              <X className="h-12 w-12 text-red-500" />
              <p className="text-gray-600">{error}</p>
              <Button onClick={fetchReaberturas} variant="outline">
                <RotateCw className="mr-2 h-4 w-4" />
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : reaberturas.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center text-center gap-4">
              <Clock className="h-12 w-12 text-blue-500" />
              <p className="text-gray-600">Não há solicitações de reabertura pendentes no momento.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utente</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Data da Solicitação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reaberturas.map((reabertura) => (
                  <TableRow key={reabertura.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{reabertura.utenteNome}</div>
                        <div className="text-sm text-gray-500">{reabertura.utenteNif}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">Período {reabertura.numeroPeriodo}</div>
                        <div className="text-sm text-gray-500">
                          {formatDate(reabertura.dataInicio)} - {formatDate(reabertura.dataFim)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {reabertura.dataSolicitacaoReabertura ? (
                        <div>
                          <div>{formatDate(reabertura.dataSolicitacaoReabertura)}</div>
                          <div className="text-xs text-gray-500">
                            {formatDistanceToNow(parseISO(reabertura.dataSolicitacaoReabertura), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </div>
                        </div>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(reabertura.statusReabertura || 'PENDENTE')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleOpenViewModal(reabertura)}
                        >
                          Ver
                        </Button>
                        {(reabertura.statusReabertura === 'PENDENTE' || !reabertura.statusReabertura) && (
                          <>
                            <Button 
                              variant="default" 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleOpenApproveModal(reabertura)}
                            >
                              Enviar RUPE
                            </Button>
                            <Button 
                              variant="default" 
                              size="sm" 
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => handleOpenRejectModal(reabertura)}
                            >
                              Rejeitar
                            </Button>
                          </>
                        )}
                        
                        {reabertura.statusReabertura === 'AGUARDANDO_CONFIRMACAO_PAGAMENTO' && (
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => handleOpenConfirmPaymentModal(reabertura)}
                          >
                            Confirmar Pagamento
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Modal de Visualização */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitação de Reabertura</DialogTitle>
            <DialogDescription>
              Detalhes da solicitação de reabertura
            </DialogDescription>
          </DialogHeader>
          
          {selectedReabertura && (
            <div className="space-y-4 py-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Utente</p>
                <p>{selectedReabertura.utenteNome}</p>
                <p className="text-sm text-gray-500">{selectedReabertura.utenteNif}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Período</p>
                <p>Período {selectedReabertura.numeroPeriodo}</p>
                <p className="text-sm text-gray-500">
                  {formatDate(selectedReabertura.dataInicio)} - {formatDate(selectedReabertura.dataFim)}
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Data da Solicitação</p>
                <p>{formatDate(selectedReabertura.dataSolicitacaoReabertura)}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Status</p>
                <p>{getStatusBadge(selectedReabertura.statusReabertura || 'PENDENTE')}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">Motivo da Reabertura</p>
                <p className="p-3 bg-gray-50 rounded-md whitespace-pre-wrap">
                  {formatReaberturaMotivo(selectedReabertura.motivoReabertura)}
                </p>
                
                {/* Se houver um caminho de RUPE nos metadados, exibir link para download */}
                {selectedReabertura.motivoReabertura && (() => {
                  try {
                    const metadata = JSON.parse(selectedReabertura.motivoReabertura);
                    if (metadata && metadata.rupePath) {
                      return (
                        <div className="mt-2">
                          <a 
                            href={metadata.rupePath} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline flex items-center"
                          >
                            <CalendarIcon className="mr-1 h-4 w-4" />
                            Baixar PDF da RUPE
                          </a>
                        </div>
                      );
                    }
                    return null;
                  } catch (e) {
                    return null;
                  }
                })()}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de Envio de RUPE */}
      <Dialog open={isApproveModalOpen} onOpenChange={setIsApproveModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar RUPE para Reabertura</DialogTitle>
            <DialogDescription>
              Ao enviar o RUPE, o utente deverá realizar o pagamento para prosseguir com a reabertura.
            </DialogDescription>
          </DialogHeader>
          
          {selectedReabertura && (
            <div className="space-y-4 py-4">
              <div>
                <h4 className="font-semibold text-sm">Utente</h4>
                <p className="text-sm">{selectedReabertura.utenteNome} (NIF: {selectedReabertura.utenteNif})</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm">Período</h4>
                <p className="text-sm">
                  Período {selectedReabertura.numeroPeriodo}: {formatDate(selectedReabertura.dataInicio)} - {formatDate(selectedReabertura.dataFim)}
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm">Motivo da Solicitação</h4>
                <p className="text-sm">{selectedReabertura.motivoReabertura || 'Não informado'}</p>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="numeroRupe" className="text-sm font-medium">Número da RUPE</Label>
                  <Input
                    id="numeroRupe"
                    value={numeroRupe}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumeroRupe(e.target.value)}
                    placeholder="Informe o número da RUPE"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="rupeFile" className="text-sm font-medium">Documento da RUPE (PDF)</Label>
                  <Input
                    id="rupeFile"
                    type="file"
                    accept=".pdf"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setRupeFile(e.target.files[0]);
                      }
                    }}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Apenas arquivos PDF são aceitos</p>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
                <h4 className="font-semibold text-sm text-yellow-800">Fluxo de Aprovação</h4>
                <ol className="text-sm text-yellow-700 list-decimal pl-5 mt-1 space-y-1">
                  <li>Chefe envia RUPE para o Utente</li>
                  <li>Utente realiza o pagamento do RUPE</li>
                  <li>Chefe confirma o pagamento</li>
                  <li>Período é reaberto por 7 dias</li>
                </ol>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex space-x-2 justify-between">
            <Button 
              variant="outline" 
              onClick={() => setIsApproveModalOpen(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleApprove}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <>
                  <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Enviar RUPE
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de Confirmação de Pagamento */}
      <Dialog open={isConfirmPaymentModalOpen} onOpenChange={setIsConfirmPaymentModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento de RUPE</DialogTitle>
            <DialogDescription>
              Confirme que o pagamento da RUPE foi realizado pelo utente.
            </DialogDescription>
          </DialogHeader>
          
          {selectedReabertura && (
            <div className="space-y-4 py-4">
              <div>
                <h4 className="font-semibold text-sm">Utente</h4>
                <p className="text-sm">{selectedReabertura.utenteNome} (NIF: {selectedReabertura.utenteNif})</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm">Período</h4>
                <p className="text-sm">
                  Período {selectedReabertura.numeroPeriodo}: {formatDate(selectedReabertura.dataInicio)} - {formatDate(selectedReabertura.dataFim)}
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm">Número da RUPE</h4>
                <p className="text-sm font-medium">
                  {(() => {
                    // Verificar primeiro o campo rupeNumero diretamente
                    if (selectedReabertura.rupeNumero) {
                      return selectedReabertura.rupeNumero;
                    }
                    
                    // Se não tiver, tentar extrair dos metadados
                    if (selectedReabertura.motivoReabertura) {
                      try {
                        const metadata = JSON.parse(selectedReabertura.motivoReabertura);
                        if (metadata && metadata.rupeNumero) {
                          return metadata.rupeNumero;
                        }
                      } catch (e) {
                        console.log('Erro ao extrair rupeNumero dos metadados:', e);
                      }
                    }
                    
                    return 'Não informado';
                  })()}
                </p>
              </div>
              
              {selectedReabertura.motivoReabertura && (
                <div>
                  <h4 className="font-semibold text-sm">Documento da RUPE</h4>
                  {(() => {
                    try {
                      // Tentar extrair o caminho do arquivo dos metadados
                      const metadata = JSON.parse(selectedReabertura.motivoReabertura);
                      if (metadata && metadata.rupePath) {
                        return (
                          <a 
                            href={metadata.rupePath} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            Ver documento da RUPE
                          </a>
                        );
                      }
                    } catch (e) {
                      // Se não for um JSON válido, não exibir nada
                    }
                    return <p className="text-sm">Documento não disponível</p>;
                  })()}
                </div>
              )}
              
              <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
                <h4 className="font-semibold text-sm text-yellow-800">Atenção</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Ao confirmar o pagamento, o período será reaberto por 7 dias para que o utente possa submeter os relatórios pendentes.
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex space-x-2 justify-between">
            <Button 
              variant="outline" 
              onClick={() => setIsConfirmPaymentModalOpen(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmPayment}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <>
                  <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Confirmar Pagamento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de Rejeição */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rejeitar Solicitação</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição da solicitação de reabertura.
            </DialogDescription>
          </DialogHeader>
          
          {selectedReabertura && (
            <div className="space-y-4 py-4">
              <div>
                <h4 className="font-semibold text-sm">Utente</h4>
                <p className="text-sm">{selectedReabertura.utenteNome} (NIF: {selectedReabertura.utenteNif})</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm">Período</h4>
                <p className="text-sm">
                  Período {selectedReabertura.numeroPeriodo}: {formatDate(selectedReabertura.dataInicio)} - {formatDate(selectedReabertura.dataFim)}
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm">Motivo da Solicitação</h4>
                <p className="text-sm">{selectedReabertura.motivoReabertura || 'Não informado'}</p>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="rejectReason" className="text-sm font-medium">
                  Motivo da Rejeição
                </label>
                <textarea
                  id="rejectReason"
                  className="w-full min-h-[100px] p-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Informe o motivo da rejeição..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="flex space-x-2 justify-between">
            <Button 
              variant="outline" 
              onClick={() => {
                setRejectReason('');
                setIsRejectModalOpen(false);
              }}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleReject}
              disabled={isProcessing || !rejectReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? (
                <>
                  <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Confirmar Rejeição
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <ToastContainer />
    </div>
  );
}
