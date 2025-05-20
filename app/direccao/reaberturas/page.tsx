'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  CalendarIcon,
  FileText,
  Eye
} from 'lucide-react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
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
  parecerChefe?: string;
  parecerDirecao?: string;
}

export default function DirecaoReaberturasPage() {
  const [reaberturas, setReaberturas] = useState<PeriodoReabertura[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedReabertura, setSelectedReabertura] = useState<PeriodoReabertura | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fetchReaberturas = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Recuperar token do localStorage, se existir
      const authToken = localStorage.getItem('token');
      
      console.log('[Client-Dir] Iniciando busca de reaberturas...');
      console.log('[Client-Dir] Possui token em localStorage:', !!authToken);
      
      // Preparar headers com todos os métodos de autenticação possíveis
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      // Adicionar token de autenticação manualmente, se existir
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const response = await fetch('/api/monitorizacao/periodos/reaberturas-diretor', {
        method: 'GET',
        credentials: 'include', // Incluir cookies na requisição
        headers
      });
      
      console.log('[Client-Dir] Status da resposta:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Client-Dir] Erro na resposta da API:', response.status, errorText);
        throw new Error(`Erro ao buscar solicitações de reabertura: ${response.status}`);
      }
      
      const data = await response.json();
      setReaberturas(data.reaberturas || []);
    } catch (error) {
      console.error('Erro ao buscar reaberturas:', error);
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
  
  const handleApprove = async () => {
    if (!selectedReabertura) return;
    
    setIsProcessing(true);
    
    try {
      const response = await fetch(`/api/monitorizacao/periodos/${selectedReabertura.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'aprovar-reabertura-diretor',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao enviar RUPE');
      }
      
      const data = await response.json();
      
      toast({
        title: 'RUPE enviado com sucesso',
        description: `RUPE ${data.numeroRupe} enviado. O utente deve realizar o pagamento e o chefe confirmará o pagamento.`,
      });
      
      setIsApproveModalOpen(false);
      await fetchReaberturas();
    } catch (error) {
      console.error('Erro ao enviar RUPE:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar o RUPE. Tente novamente.',
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
          action: 'rejeitar-reabertura-diretor',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao rejeitar solicitação');
      }
      
      toast({
        title: 'Solicitação rejeitada',
        description: 'A solicitação de reabertura foi rejeitada pela Direcção.',
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
      case 'APROVADA_CHEFE':
        return <Badge className="bg-blue-500">Aprovada pelo Chefe</Badge>;
      case 'APROVADA':
        return <Badge className="bg-green-500">Aprovada</Badge>;
      case 'REJEITADA_CHEFE':
        return <Badge className="bg-orange-500">Rejeitada pelo Chefe</Badge>;
      case 'REJEITADA':
        return <Badge className="bg-red-500">Rejeitada</Badge>;
      default:
        return <Badge className="bg-gray-500">Aguardando Pagamento</Badge>;
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Solicitações de Reabertura - Direcção</h1>
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
              <p className="text-gray-600">Não há solicitações de reabertura pendentes para análise da Direcção.</p>
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
                  <TableHead>Solicitação</TableHead>
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
                            <FileText className="mr-1 h-4 w-4" />
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
              
              {selectedReabertura.parecerChefe && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Parecer do Chefe</p>
                  <p className="p-3 bg-blue-50 rounded-md whitespace-pre-wrap">
                    {selectedReabertura.parecerChefe}
                  </p>
                </div>
              )}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar RUPE para Reabertura</DialogTitle>
            <DialogDescription>
              Ao enviar o RUPE, o utente deverá realizar o pagamento e o chefe confirmará o pagamento para concluir a reabertura.
            </DialogDescription>
          </DialogHeader>
          
          {selectedReabertura && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm">Utente</h4>
                  <p className="text-sm">{selectedReabertura.utenteNome}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">NIF</h4>
                  <p className="text-sm">{selectedReabertura.utenteNif}</p>
                </div>
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
              
              <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
                <h4 className="font-semibold text-sm text-yellow-800">Fluxo de Aprovação</h4>
                <ol className="text-sm text-yellow-700 list-decimal pl-5 mt-1 space-y-1">
                  <li>Direção envia RUPE para o Utente</li>
                  <li>Utente realiza o pagamento do RUPE</li>
                  <li>Chefe confirma o pagamento</li>
                  <li>Período é reaberto por 7 dias</li>
                </ol>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveModalOpen(false)} disabled={isProcessing}>
              Cancelar
            </Button>
            <Button onClick={handleApprove} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Enviar RUPE'
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
              Tem certeza que deseja rejeitar esta solicitação de reabertura?
            </DialogDescription>
          </DialogHeader>
          
          {selectedReabertura && (
            <div className="space-y-2 py-4">
              <p className="text-sm">
                Ao rejeitar, a solicitação será arquivada e o utente <strong>{selectedReabertura.utenteNome}</strong> será notificado 
                que sua solicitação para reabrir o período {selectedReabertura.numeroPeriodo} foi rejeitada pela Direcção.
              </p>
              
              {selectedReabertura.parecerChefe && (
                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm font-medium text-blue-800">Parecer do Chefe:</p>
                  <p className="text-sm text-blue-700 mt-1 whitespace-pre-wrap">
                    {selectedReabertura.parecerChefe}
                  </p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="flex space-x-2 justify-between">
            <Button 
              variant="outline" 
              onClick={() => setIsRejectModalOpen(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleReject}
              disabled={isProcessing}
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
