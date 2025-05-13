import React, { useState, forwardRef, ForwardedRef, useEffect } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Button } from 'components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import AutorizacaoAmbientalPDF, { AutorizacaoAmbientalData } from './AutorizacaoAmbientalPDF';
import QRCode from 'qrcode';

interface AutorizacaoAmbientalDownloadProps {
  data: AutorizacaoAmbientalData;
  fileName?: string;
  autoDownload?: boolean;
  qrCodeUrl?: string;
}

const AutorizacaoAmbientalDownload = forwardRef<HTMLButtonElement, AutorizacaoAmbientalDownloadProps>(({ 
  data, 
  fileName = `autorizacao-ambiental-${data.numeroProcesso}.pdf`,
  autoDownload = false
}, ref) => {
  const [isClient, setIsClient] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Gerar QR Code no lado do cliente
  useEffect(() => {
    const generateQRCode = async () => {
      try {
        if (typeof window !== 'undefined' && data.numeroProcesso) {
          const baseUrl = window.location.origin;
          const verificationUrl = `${baseUrl}/verificar/${data.numeroProcesso}`;
          
          // Usar opções mais simples para o QR Code para evitar problemas
          const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
            width: 120,
            margin: 0,
            errorCorrectionLevel: 'M'
          });
          
          setQrCodeUrl(qrCodeDataUrl);
          console.log('QR Code gerado com sucesso no componente');
        }
      } catch (error) {
        console.error('Erro ao gerar QR Code:', error);
        // Continuar mesmo sem o QR Code
        setQrCodeUrl('');
      }
    };
    
    if (isClient) {
      generateQRCode();
    }
  }, [isClient, data.numeroAutorizacao]);
  
  // Usar useEffect para garantir que o componente só seja renderizado no cliente
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Efeito separado para auto-download
  useEffect(() => {
    // Se autoDownload for true, simular um clique no botão de download
    if (isClient && autoDownload && ref && 'current' in ref && ref.current) {
      // Aumentar o delay para garantir que o PDF e QR Code estejam prontos
      const timer = setTimeout(() => {
        if (ref.current) {
          console.log('Iniciando download automático');
          ref.current.click();
        }
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isClient, autoDownload, ref]);

  if (!isClient) {
    return (
      <Button disabled className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Preparando documento...
      </Button>
    );
  }

  // Preparar os dados para o PDF
  const pdfData = {
    ...data,
    // Garantir que todos os campos necessários existam
    numeroProcesso: data.numeroProcesso || `PA-${String(data.numeroAutorizacao).padStart(6, '0')}`
  };
  
  // Função para baixar o PDF diretamente
  const handleDownload = async () => {
    try {
      console.log('Iniciando download direto do PDF');
      const response = await fetch(`/api/autorizacao/${data.id}/download`);
      
      if (!response.ok) {
        throw new Error('Erro ao baixar PDF');
      }
      
      // Obter o blob do PDF
      const blob = await response.blob();
      
      // Criar URL para o blob
      const url = window.URL.createObjectURL(blob);
      
      // Criar link temporário para download
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Limpar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao iniciar download:', error);
    }
  };
  
  return (
    <PDFDownloadLink
      document={<AutorizacaoAmbientalPDF data={pdfData} qrCodeUrl={qrCodeUrl} />}
      fileName={fileName}
      className="inline-block"
    >
      {({ loading, error }) => {
        // Se estiver no modo de download automático, acionar o download direto
        if (autoDownload && !loading && ref && 'current' in ref && ref.current) {
          setTimeout(() => {
            handleDownload();
          }, 500);
        }
        
        return (
          <Button 
            ref={ref}
            disabled={loading} 
            className="flex items-center gap-2"
            variant="default"
            onClick={() => {
              if (!loading) {
                handleDownload();
              }
            }}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Gerando PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Baixar Autorização
              </>
            )}
          </Button>
        );
      }}
    </PDFDownloadLink>
  );
});

export default AutorizacaoAmbientalDownload;
