'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ToastContainer, toast } from '@/components/ui/use-toast';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Upload, CheckCircle2, XCircle, RotateCw, Send, AlertTriangle, FileText } from 'lucide-react';

type PeriodoMonitorizacao = {
  id: number;
  configuracaoId: number;
  numeroPeriodo: number;
  dataInicio: string;
  dataFim: string;
  estado: 'ABERTO' | 'FECHADO' | 'AGUARDANDO_REAVALIACAO' | 'REABERTURA_SOLICITADA';
  monitorizacao?: {
    id: number;
    relatorioPath: string;
    estado: 'PENDENTE' | 'APROVADO' | 'REJEITADO';
  };
};

type ConfiguracaoMonitorizacao = {
  id: number;
  tipoPeriodo: 'ANUAL' | 'SEMESTRAL' | 'TRIMESTRAL';
  dataInicio: string;
};

export default function UtenteMonitorizacao() {
  const [periodos, setPeriodos] = useState<PeriodoMonitorizacao[]>([]);
  const [configuracao, setConfiguracao] = useState<ConfiguracaoMonitorizacao | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingPeriodoId, setUploadingPeriodoId] = useState<number | null>(null);

  const formatarData = (data: string) => {
    try {
      return format(parseISO(data), 'PP', { locale: ptBR });
    } catch (e) {
      return data;
    }
  };

  const fetchPeriodos = useCallback(async () => {
    try {
      setLoading(true);
      const utenteId = localStorage.getItem('utenteId');
      
      if (!utenteId) {
        setError('Utilizador não autenticado');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/monitorizacao/periodos?utenteId=${utenteId}`);
      
      if (response.status === 404) {
        setError('Configuração de monitorização não encontrada. Por favor, contacte o administrador.');
        setPeriodos([]);
        setConfiguracao(null);
        return;
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao carregar períodos de monitorização');
      }
      
      const data = await response.json();
      setConfiguracao(data.configuracao);
      setPeriodos(data.periodos || []);
      setError('');
    } catch (error) {
      console.error('Erro ao buscar períodos:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar períodos de monitorização');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPeriodos();
  }, [fetchPeriodos]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleSubmitRelatorio = async (periodoId: number) => {
    if (!selectedFile) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione um arquivo para enviar.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploadingPeriodoId(periodoId);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('periodoId', periodoId.toString());

      const response = await fetch('/api/monitorizacao/relatorios', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao enviar relatório');
      }

      toast({
        title: 'Sucesso',
        description: 'Relatório enviado com sucesso!',
      });
      
      await fetchPeriodos();
      setSelectedFile(null);
    } catch (error) {
      console.error('Erro ao enviar relatório:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao enviar relatório',
        variant: 'destructive',
      });
    } finally {
      setUploadingPeriodoId(null);
    }
  };

  const handleReabertura = async (periodoId: number) => {
    try {
      const response = await fetch(`/api/monitorizacao/periodos/${periodoId}/reabrir`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao solicitar reabertura');
      }

      toast({
        title: 'Sucesso',
        description: 'Solicitação de reabertura enviada com sucesso!',
      });
      
      await fetchPeriodos();
    } catch (error) {
      console.error('Erro ao solicitar reabertura:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao solicitar reabertura',
        variant: 'destructive',
      });
    }
  };

  const handleSolicitarReavaliacao = async (periodoId: number) => {
    try {
      const response = await fetch(`/api/monitorizacao/periodos/${periodoId}/solicitar-reavaliacao`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao solicitar reavaliação');
      }

      toast({
        title: 'Sucesso',
        description: 'Solicitação de reavaliação enviada com sucesso!',
      });
      
      await fetchPeriodos();
    } catch (error) {
      console.error('Erro ao solicitar reavaliação:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao solicitar reavaliação',
        variant: 'destructive',
      });
    }
  };

  const renderEstado = (periodo: PeriodoMonitorizacao) => {
    if (periodo.monitorizacao) {
      switch (periodo.monitorizacao.estado) {
        case 'APROVADO':
          return {
            icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
            text: 'Relatório Aprovado',
            className: 'text-green-700',
          };
        case 'REJEITADO':
          return {
            icon: <XCircle className="h-5 w-5 text-red-500" />,
            text: 'Relatório Rejeitado',
            className: 'text-red-700',
          };
        case 'PENDENTE':
          return {
            icon: <RotateCw className="h-5 w-5 text-yellow-500 animate-spin" />,
            text: 'Aguardando Avaliação',
            className: 'text-yellow-700',
          };
      }
    }

    switch (periodo.estado) {
      case 'ABERTO':
        return {
          icon: <AlertTriangle className="h-5 w-5 text-blue-500" />,
          text: 'Período Aberto',
          className: 'text-blue-700',
        };
      case 'FECHADO':
        return {
          icon: <XCircle className="h-5 w-5 text-gray-500" />,
          text: 'Período Fechado',
          className: 'text-gray-700',
        };
      case 'AGUARDANDO_REAVALIACAO':
        return {
          icon: <RotateCw className="h-5 w-5 text-yellow-500 animate-spin" />,
          text: 'Aguardando Reavaliação',
          className: 'text-yellow-700',
        };
      case 'REABERTURA_SOLICITADA':
        return {
          icon: <AlertTriangle className="h-5 w-5 text-orange-500" />,
          text: 'Reabertura Solicitada',
          className: 'text-orange-700',
        };
      default:
        return {
          icon: <AlertTriangle className="h-5 w-5 text-gray-500" />,
          text: 'Desconhecido',
          className: 'text-gray-700',
        };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg shadow">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Atenção</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={fetchPeriodos}
                  className="inline-flex items-center"
                >
                  <RotateCw className="mr-2 h-4 w-4" />
                  Tentar novamente
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Monitorização Ambiental</h1>
        <Button onClick={fetchPeriodos} variant="outline" size="sm">
          <RotateCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {configuracao && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Configuração de Monitorização</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Tipo de Período</p>
                <p className="font-medium">
                  {configuracao.tipoPeriodo === 'ANUAL' && 'Anual'}
                  {configuracao.tipoPeriodo === 'SEMESTRAL' && 'Semestral'}
                  {configuracao.tipoPeriodo === 'TRIMESTRAL' && 'Trimestral'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data de Início</p>
                <p className="font-medium">{formatarData(configuracao.dataInicio)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Períodos de Monitorização</h2>
        
        {periodos.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum período encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">Não há períodos de monitorização disponíveis no momento.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {periodos.map((periodo) => {
              const estado = renderEstado(periodo);
              return (
                <Card key={periodo.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-4 border-b flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">
                          Período {periodo.numeroPeriodo}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {formatarData(periodo.dataInicio)} - {formatarData(periodo.dataFim)}
                        </p>
                      </div>
                      <div className={`flex items-center ${estado.className}`}>
                        {estado.icon}
                        <span className="ml-2">{estado.text}</span>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50">
                      {periodo.estado === 'ABERTO' && (
                        <div>
                          <h4 className="font-medium mb-2">Enviar Relatório</h4>
                          <div className="flex items-end gap-2">
                            <div className="flex-1">
                              <Label htmlFor={`file-${periodo.id}`} className="sr-only">
                                Relatório
                              </Label>
                              <Input
                                id={`file-${periodo.id}`}
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={handleFileChange}
                                disabled={uploadingPeriodoId === periodo.id}
                              />
                              <p className="mt-1 text-xs text-muted-foreground">
                                Formatos aceitos: .pdf, .doc, .docx
                              </p>
                            </div>
                            <Button
                              onClick={() => handleSubmitRelatorio(periodo.id)}
                              disabled={!selectedFile || uploadingPeriodoId === periodo.id}
                            >
                              {uploadingPeriodoId === periodo.id ? (
                                <>
                                  <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                                  Enviando...
                                </>
                              ) : (
                                <>
                                  <Upload className="mr-2 h-4 w-4" />
                                  Enviar
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {periodo.estado === 'FECHADO' && !periodo.monitorizacao && (
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-muted-foreground">
                            O período está fechado. Entre em contato com o administrador para mais informações.
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => handleReabertura(periodo.id)}
                            disabled={periodo.estado === 'REABERTURA_SOLICITADA'}
                          >
                            {periodo.estado === 'REABERTURA_SOLICITADA' ? (
                              'Solicitação de Reabertura Enviada'
                            ) : (
                              'Solicitar Reabertura'
                            )}
                          </Button>
                        </div>
                      )}

                      {periodo.monitorizacao?.estado === 'REJEITADO' && (
                        <div className="mt-4">
                          <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              Seu relatório foi rejeitado. Por favor, faça as correções necessárias e envie novamente.
                            </AlertDescription>
                          </Alert>
                          <div className="mt-4">
                            <Button
                              variant="outline"
                              onClick={() => handleSolicitarReavaliacao(periodo.id)}
                              className="mt-2"
                            >
                              Solicitar Reavaliação
                            </Button>
                          </div>
                        </div>
                      )}

                      {periodo.monitorizacao?.relatorioPath && (
                        <div className="mt-4">
                          <a
                            href={periodo.monitorizacao.relatorioPath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline flex items-center"
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Visualizar relatório enviado
                          </a>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
}
