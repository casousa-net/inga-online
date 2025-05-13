import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Loader2, FileText, Download } from 'lucide-react';
import AutorizacaoAmbientalDownload from './AutorizacaoAmbientalDownload';
import { AutorizacaoAmbientalData } from './AutorizacaoAmbientalPDF';

interface AutorizacaoAmbientalViewerProps {
  solicitacaoId: number;
  autorizacaoId?: number;
  numeroAutorizacao?: string;
  tipoSolicitacao: string;
  entidade: string;
  nif: string;
  isApproved: boolean;
}

const AutorizacaoAmbientalViewer: React.FC<AutorizacaoAmbientalViewerProps> = ({
  solicitacaoId,
  autorizacaoId,
  numeroAutorizacao,
  tipoSolicitacao,
  entidade,
  nif,
  isApproved
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [numeroFactura, setNumeroFactura] = useState('');
  const [autorizacao, setAutorizacao] = useState<AutorizacaoAmbientalData | null>(null);
  
  // Função para gerar a autorização ambiental
  const handleGerarAutorizacao = async () => {
    if (!numeroFactura) {
      setError('Por favor, informe o número da factura');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Obter os produtos e códigos pautais da solicitação
      const resSolicitacao = await fetch(`/api/solicitacao/${solicitacaoId}`);
      if (!resSolicitacao.ok) {
        throw new Error('Erro ao obter detalhes da solicitação');
      }
      
      const solicitacaoData = await resSolicitacao.json();
      const produtos = solicitacaoData.itens.map((item: any) => item.descricao).join(', ');
      const quantidade = solicitacaoData.itens.map((item: any) => `${item.quantidade} ${item.unidade || 'un'}`).join(', ');
      const codigosPautais = solicitacaoData.itens.map((item: any) => ({
        codigo: item.codigoPautal.codigo,
        descricao: item.codigoPautal.descricao
      }));
      
      // Gerar a autorização ambiental
      const res = await fetch('/api/autorizacao/gerar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          solicitacaoId,
          tipoAutorizacao: tipoSolicitacao === 'Importação' ? 'IMPORTAÇÃO' : 
                           tipoSolicitacao === 'Exportação' ? 'EXPORTAÇÃO' : 'REEXPORTAÇÃO',
          numeroFactura,
          produtos,
          quantidade,
          codigosPautais
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erro ao gerar autorização');
      }
      
      const data = await res.json();
      
      // Preparar dados para o PDF
      setAutorizacao({
        tipoAutorizacao: tipoSolicitacao === 'Importação' ? 'IMPORTAÇÃO' : 
                         tipoSolicitacao === 'Exportação' ? 'EXPORTAÇÃO' : 'REEXPORTAÇÃO',
        entidade,
        nif,
        numeroFactura,
        produtos,
        quantidade,
        codigosPautais: codigosPautais.map((cp: any) => cp.codigo).join(', '),
        dataEmissao: new Date(),
        numeroAutorizacao: data.numeroAutorizacao
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar autorização');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função para buscar autorização existente
  const handleBuscarAutorizacao = async () => {
    if (!autorizacaoId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const res = await fetch(`/api/autorizacao/${autorizacaoId}`);
      if (!res.ok) {
        throw new Error('Erro ao buscar autorização');
      }
      
      const data = await res.json();
      
      setAutorizacao({
        tipoAutorizacao: data.tipoAutorizacao,
        entidade,
        nif,
        numeroFactura: data.numeroFactura,
        produtos: data.produtos,
        quantidade: data.quantidade,
        codigosPautais: data.codigosPautais,
        dataEmissao: new Date(data.dataEmissao),
        numeroAutorizacao: data.numeroAutorizacao
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar autorização');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <Button 
        onClick={() => {
          setIsOpen(true);
          if (autorizacaoId) {
            handleBuscarAutorizacao();
          }
        }}
        className="flex items-center gap-2"
        variant="outline"
      >
        <FileText className="h-4 w-4" />
        {autorizacaoId ? 'Ver Autorização' : 'Gerar Autorização'}
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {autorizacaoId ? 'Autorização Ambiental' : 'Gerar Autorização Ambiental'}
            </DialogTitle>
          </DialogHeader>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          {!autorizacaoId && !autorizacao && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="numeroFactura">Número da Factura</Label>
                <Input
                  id="numeroFactura"
                  value={numeroFactura}
                  onChange={(e) => setNumeroFactura(e.target.value)}
                  placeholder="Informe o número da factura"
                  disabled={isLoading}
                />
              </div>
              
              <Button
                onClick={handleGerarAutorizacao}
                className="w-full"
                disabled={isLoading || !isApproved}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  'Gerar Autorização'
                )}
              </Button>
              
              {!isApproved && (
                <p className="text-sm text-amber-600">
                  A solicitação precisa estar aprovada para gerar a autorização.
                </p>
              )}
            </div>
          )}
          
          {autorizacao && (
            <div className="space-y-4 py-4">
              <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-md">
                <h3 className="font-semibold mb-2">Autorização Ambiental Gerada</h3>
                <p className="text-sm mb-1">
                  <span className="font-medium">Número:</span> PA {autorizacao.numeroProcesso}
                </p>
                <p className="text-sm mb-1">
                  <span className="font-medium">Tipo:</span> {autorizacao.tipoAutorizacao}
                </p>
                <p className="text-sm mb-1">
                  <span className="font-medium">Entidade:</span> {autorizacao.entidade}
                </p>
                <p className="text-sm mb-1">
                  <span className="font-medium">Factura:</span> {autorizacao.numeroFactura}
                </p>
              </div>
              
              <div className="flex justify-center">
                <AutorizacaoAmbientalDownload 
                  data={autorizacao} 
                  fileName={`autorizacao-ambiental-${autorizacao.numeroProcesso}.pdf`}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AutorizacaoAmbientalViewer;