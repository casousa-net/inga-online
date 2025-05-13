'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, ArrowLeft, Calendar, DollarSign, FileText, Download, User, CheckCircle, XCircle, HelpCircle } from "lucide-react";

interface Processo {
  id: number;
  tipo: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  valorTotalKz: number;
  utenteId: number;
  rupeReferencia?: string;
  rupeDocumento?: string;
  rupePago: boolean;
  rupeValidado: boolean;
  validadoPorTecnico: boolean;
  validadoPorChefe: boolean;
  aprovadoPorDirecao: boolean;
  observacoes?: string;
  motivoRejeicao?: string;
  licencaDocumento?: string;
  dataAprovacao?: string;
  utente?: {
    id: number;
    nome: string;
    nif: string;
    telefone: string;
    email: string;
  };
  moeda?: {
    id: number;
    nome: string;
    simbolo: string;
    taxaCambio: number;
  };
  itens?: Array<{
    id: number;
    quantidade: number;
    precoUnitario: number;
    codigoPautal?: {
      id: number;
      codigo: string;
      descricao: string;
    }
  }>;
  documentos?: Array<{
    id: number;
    tipo: string;
    url: string;
  }>;
}

interface ProcessoDetalhesPageClientProps {
  id: string;
}

export default function ProcessoDetalhesPageClient({ id }: ProcessoDetalhesPageClientProps) {
  const router = useRouter();
  const [processo, setProcesso] = useState<Processo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado adicional para guardar os dados do utente separadamente
  const [utente, setUtente] = useState<{id: number; nome: string; nif: string; email?: string; telefone?: string} | null>(null);

  useEffect(() => {
    const fetchProcesso = async () => {
      try {
        setLoading(true);
        console.log('Buscando processo com ID:', id);
        const response = await fetch(`/api/solicitacao/${id}`);
        
        if (!response.ok) {
          console.error('Resposta da API não OK:', response.status, response.statusText);
          throw new Error('Processo não encontrado');
        }
        
        const data = await response.json();
        if (data.error) {
          console.error('Erro retornado pela API:', data.error);
          throw new Error(data.error);
        }
        
        console.log('Dados completos recebidos:', data);
        console.log('Dados do utente:', data.utente);
        console.log('Dados da moeda:', data.moeda);
        console.log('Itens:', data.itens?.length || 0);
        console.log('Documentos:', data.documentos?.length || 0);
        
        setProcesso(data);
        
        // Buscar dados do utente separadamente se não estiver disponível no processo
        if (!data.utente && data.utenteId) {
          try {
            console.log('Buscando dados do utente separadamente, ID:', data.utenteId);
            const utenteResponse = await fetch(`/api/usuarios/${data.utenteId}`);
            if (utenteResponse.ok) {
              const utenteData = await utenteResponse.json();
              console.log('Dados do utente obtidos separadamente:', utenteData);
              setUtente(utenteData);
            }
          } catch (utenteError) {
            console.error('Erro ao buscar dados do utente separadamente:', utenteError);
          }
        } else if (data.utente) {
          // Se o utente já estiver disponível no processo, usar esses dados
          setUtente(data.utente);
        }
      } catch (error) {
        console.error('Erro ao carregar processo:', error);
        setError('Não foi possível carregar os detalhes do processo');
      } finally {
        setLoading(false);
      }
    };

    fetchProcesso();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !processo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <h2 className="text-lg font-semibold">Processo não encontrado</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    );
  }

  // Função para formatar a data
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Data não disponível';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR');
    } catch (e) {
      return 'Data inválida';
    }
  };

  // Função para formatar valores monetários
  const formatMoney = (value: number | undefined) => {
    if (value === undefined) return 'Valor não disponível';
    try {
      return value.toLocaleString('pt-AO') + ' Kz';
    } catch (e) {
      return 'Valor inválido';
    }
  };

  // Função para obter a descrição do status baseado no código do status
  const getStatusDescription = (status: string) => {
    const statusMap: Record<string, string> = {
      'Pendente': 'Aguardando análise inicial',
      'Valido_RUPE': 'Validado, aguardando RUPE',
      'Aguardando_Pagamento': 'RUPE emitido, aguardando pagamento',
      'Pagamento_Confirmado': 'Pagamento confirmado, aguardando aprovação final',
      'Aprovado': 'Processo aprovado, licença emitida',
      'Rejeitado': 'Processo rejeitado'      
    };
    return statusMap[status] || status;
  };

  // Função para obter a descrição do tipo de processo
  const getTipoDescription = (tipo: string) => {
    const tipoMap: Record<string, string> = {
      'Autorização': 'Autorização de Importação',
      'Monitorização': 'Monitorização Ambiental',
      'Espaços_Verdes': 'Licença para Espaços Verdes'
    };
    return tipoMap[tipo] || tipo;
  };

  // Função para obter o estilo do badge de status
  const getStatusBadgeVariant = (status: string) => {
    const statusMap: Record<string, "default" | "secondary" | "destructive" | "outline" | "success"> = {
      'Pendente': 'secondary',
      'Valido_RUPE': 'default',
      'Aguardando_Pagamento': 'outline',
      'Pagamento_Confirmado': 'default',
      'Aprovado': 'success',
      'Rejeitado': 'destructive'
    };
    return statusMap[status] || 'outline';
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Processo PA-{String(processo.id).padStart(6, '0')}</h1>
          <p className="text-muted-foreground">{getTipoDescription(processo.tipo)}</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Coluna da esquerda */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Informações Gerais</span>
                <Badge variant={getStatusBadgeVariant(processo.status)}>
                  {processo.status || 'Não definido'}
                </Badge>
              </CardTitle>
              <CardDescription>
                {getStatusDescription(processo.status)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Data de Criação</p>
                    <p>{formatDate(processo.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                    <p className="font-medium">{formatMoney(processo.valorTotalKz)}</p>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Data de Atualização</p>
                <p>{formatDate(processo.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" /> Dados do Utente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nome</p>
                <p className="font-medium">{utente?.nome || processo.utente?.nome || 'Não disponível'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">NIF</p>
                <p className="font-medium font-mono">{utente?.nif || processo.utente?.nif || 'Não disponível'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="font-medium">{utente?.email || processo.utente?.email || 'Não disponível'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                <p className="font-medium">{utente?.telefone || processo.utente?.telefone || 'Não disponível'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" /> Fluxo de Aprovação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Validado por Técnico</p>
                  <Badge variant={processo.validadoPorTecnico ? "success" : "outline"}>
                    {processo.validadoPorTecnico ? 'Sim' : 'Não'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Validado por Chefe</p>
                  <Badge variant={processo.validadoPorChefe ? "success" : "outline"}>
                    {processo.validadoPorChefe ? 'Sim' : 'Não'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Aprovado pela Direção</p>
                  <Badge variant={processo.aprovadoPorDirecao ? "success" : "outline"}>
                    {processo.aprovadoPorDirecao ? 'Sim' : 'Não'}
                  </Badge>
                </div>
                {processo.dataAprovacao && (
                  <div className="pt-2">
                    <p className="text-sm font-medium text-muted-foreground">Data de Aprovação</p>
                    <p className="font-medium">{formatDate(processo.dataAprovacao)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {processo.rupeReferencia && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" /> Informações RUPE
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Referência</p>
                  <p className="font-medium font-mono">{processo.rupeReferencia}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant={processo.rupePago ? "success" : "outline"}>
                    {processo.rupePago ? 'Pago' : 'Não Pago'}
                  </Badge>
                  <Badge variant={processo.rupeValidado ? "success" : "outline"}>
                    {processo.rupeValidado ? 'Validado' : 'Não Validado'}
                  </Badge>
                </div>
                {processo.rupeDocumento && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Documento RUPE</p>
                    <p className="font-medium">{processo.rupeDocumento.split('/').pop()}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {processo.licencaDocumento && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Licença
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Documento</p>
                  <p className="font-medium">{processo.licencaDocumento.split('/').pop()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data de Emissão</p>
                  <p className="font-medium">{formatDate(processo.dataAprovacao)}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Coluna da direita */}
        <div className="space-y-6">
          {processo.observacoes && (
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{processo.observacoes}</p>
              </CardContent>
            </Card>
          )}

          {processo.motivoRejeicao && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-destructive" /> Motivo da Rejeição
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{processo.motivoRejeicao}</p>
              </CardContent>
            </Card>
          )}

          {processo.documentos && processo.documentos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Documentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2">
                  {processo.documentos.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-2 border rounded-md hover:bg-gray-50">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>{doc.tipo}: {doc.url ? doc.url.split('/').pop() : 'Sem nome'}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Dados Técnicos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ID Interno</p>
                <p className="font-medium font-mono">{processo.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Criado em</p>
                <p className="font-medium">{formatDate(processo.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Atualizado em</p>
                <p className="font-medium">{formatDate(processo.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {processo.itens && processo.itens.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Itens</CardTitle>
            <CardDescription>Lista de itens do processo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-2 text-left font-medium">Código Pautal</th>
                    <th className="p-2 text-left font-medium">Descrição</th>
                    <th className="p-2 text-right font-medium">Quantidade</th>
                    <th className="p-2 text-right font-medium">Preço Unit.</th>
                    <th className="p-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {processo.itens.map((item) => {
                    const total = item.quantidade * item.precoUnitario;
                    return (
                      <tr key={item.id} className="border-t">
                        <td className="p-2 font-mono">{item.codigoPautal?.codigo || 'N/A'}</td>
                        <td className="p-2">{item.codigoPautal?.descricao || 'N/A'}</td>
                        <td className="p-2 text-right">{item.quantidade}</td>
                        <td className="p-2 text-right">{item.precoUnitario} {processo.moeda?.simbolo || 'Kz'}</td>
                        <td className="p-2 text-right font-medium">{total} {processo.moeda?.simbolo || 'Kz'}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-muted/50">
                  <tr className="border-t">
                    <td colSpan={4} className="p-2 text-right font-medium">Total em {processo.moeda?.nome || 'Moeda'}</td>
                    <td className="p-2 text-right font-medium">
                      {processo.itens.reduce((acc, item) => acc + (item.quantidade * item.precoUnitario), 0)} {processo.moeda?.simbolo || 'Kz'}
                    </td>
                  </tr>
                  <tr className="border-t">
                    <td colSpan={4} className="p-2 text-right font-medium">Total em Kwanzas</td>
                    <td className="p-2 text-right font-medium">{formatMoney(processo.valorTotalKz)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
