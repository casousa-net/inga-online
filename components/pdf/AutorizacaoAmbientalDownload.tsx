import React, { useState, forwardRef, ForwardedRef, useEffect } from 'react';
import { Button } from 'components/ui/button';
import { Download, Loader2, Eye } from 'lucide-react';
import { AutorizacaoAmbientalData } from './AutorizacaoAmbientalPDF';
import QRCode from 'qrcode';

interface AutorizacaoAmbientalDownloadProps {
  data: AutorizacaoAmbientalData;
  fileName?: string;
  autoDownload?: boolean;
  qrCodeUrl?: string;
  logoUrl?: string;
  assinaturaUrl?: string;
}

const AutorizacaoAmbientalDownload = forwardRef<HTMLButtonElement, AutorizacaoAmbientalDownloadProps>(({ 
  data, 
  fileName = `autorizacao-ambiental-${data.numeroProcesso || 'documento'}.pdf`,
  autoDownload = false,
  logoUrl = 'http://localhost:3000/assets/pdf/logo-angola.png',
  assinaturaUrl = 'http://localhost:3000/assets/pdf/assinatura.png',
  qrCodeUrl: initialQrCodeUrl = ''
}, ref) => {
  const [isClient, setIsClient] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Gerar QR Code no lado do cliente
  useEffect(() => {
    const generateQRCode = async () => {
      try {
        if (typeof window === 'undefined' || !data.numeroAutorizacao) return;
        
        // Usar o endereço base da aplicação
        const baseUrl = window.location.origin;
        const numeroAutorizacao = data.numeroAutorizacao;
        
        console.log('Gerando QR code para:', {
          baseUrl,
          numeroAutorizacao,
          hasQrCodeUrl: !!qrCodeUrl
        });
        
        // Se já tivermos uma URL de QR code fornecida, usá-la
        if (qrCodeUrl) {
          console.log('Usando URL de QR code fornecida:', qrCodeUrl);
          return;
        }
        
        // Criar URL de verificação
        const verificationUrl = `${baseUrl}/verificar/${encodeURIComponent(numeroAutorizacao)}`;
        console.log('URL de verificação para QR code:', verificationUrl);
        
        // Gerar QR code como data URL
        const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        console.log('QR code gerado com sucesso');
        setQrCodeUrl(qrCodeDataUrl);
      } catch (error) {
        console.error('Erro ao gerar QR Code:', error);
        // Continuar mesmo sem o QR Code
        setQrCodeUrl('');
      }
    };
    
    if (isClient) {
      generateQRCode();
    }
  }, [isClient, data.numeroAutorizacao, qrCodeUrl]);
  
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
  
  // Estado para controlar erros de download
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Função para baixar o PDF redirecionando para a página de visualização com parâmetro download=true
  const handleDownload = () => {
    try {
      setIsDownloading(true);
      setDownloadError(null);
      console.log('Iniciando download do PDF via página de visualização');
      
      // Verificar se temos o ID da autorização
      if (!data.id) {
        throw new Error('ID da autorização não encontrado');
      }
      
      // Redirecionar para a página de visualização com parâmetro download=true
      window.location.href = `/autorizacao/${data.id}/visualizar?download=true`;
      
      console.log('Redirecionando para download do PDF');
    } catch (error) {
      console.error('Erro ao iniciar download do PDF:', error);
      setDownloadError(error instanceof Error ? error.message : 'Erro desconhecido');
      setIsDownloading(false);
    }
    // Não definimos setIsDownloading(false) aqui porque o usuário será redirecionado
  };
  
  // Função para visualizar
  const handleView = () => {
    if (!data.id) {
      console.error('ID da autorização não fornecido');
      return;
    }
    
    window.open(`/autorizacao/${data.id}/visualizar`, '_blank');
  };
  
  // Função para download automático (se necessário)
  useEffect(() => {
    if (autoDownload && isClient && data.id) {
      // Usar a nova abordagem de redirecionamento para a página de visualização
      window.location.href = `/autorizacao/${data.id}/visualizar?download=true`;
    }
  }, [autoDownload, isClient, data.id]);
  
  return (
    <div className="flex space-x-2">
      {/* Botão para baixar via API */}
      <Button
        ref={ref}
        onClick={handleDownload}
        disabled={isDownloading}
        className="bg-green-600 hover:bg-green-700"
      >
        {isDownloading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Baixando...
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            Baixar Autorização
          </>
        )}
      </Button>
      
      {/* Botão para visualizar */}
      <Button
        onClick={handleView}
        className="bg-blue-600 hover:bg-blue-700"
      >
        <Eye className="mr-2 h-4 w-4" />
        Visualizar
      </Button>
    </div>
  );
});

export default AutorizacaoAmbientalDownload;
