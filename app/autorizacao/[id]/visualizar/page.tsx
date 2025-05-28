'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { PDFViewer } from '@react-pdf/renderer';
import AutorizacaoAmbientalPDF from '@/components/pdf/AutorizacaoAmbientalPDF';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import QRCode from 'qrcode';

export default function VisualizarAutorizacaoPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const shouldDownload = searchParams.get('download') === 'true';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [assinaturaUrl, setAssinaturaUrl] = useState<string>('');
  const [pdfReady, setPdfReady] = useState(false);


  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Buscar dados da autorização
        const response = await fetch(`/api/autorizacao/${id}`);
        if (!response.ok) {
          throw new Error(`Erro ao buscar autorização: ${response.status}`);
        }
        const autorizacaoData = await response.json();

        // Gerar QR Code
        const baseUrl = window.location.origin;
        const verificationUrl = `${baseUrl}/verificar/${autorizacaoData.numeroAutorizacao}`;
        const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
          width: 150,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        // Definir URLs para recursos estáticos
        const logoUrl = `${baseUrl}/assets/pdf/logo-angola.png`;
        const assinaturaUrl = `${baseUrl}/assets/pdf/assinatura.png`;

        setData(autorizacaoData);
        setQrCodeUrl(qrCodeDataUrl);
        setLogoUrl(logoUrl);
        setAssinaturaUrl(assinaturaUrl);
        setPdfReady(true);
      } catch (err) {
        console.error('Erro ao carregar autorização:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);
  
  // Efeito para iniciar o download quando o PDF estiver pronto e shouldDownload for true
  useEffect(() => {
    if (shouldDownload && pdfReady && !loading && data) {
      // Usar o blob para download direto
      const downloadPDFDirectly = async () => {
        try {
          // Criar um elemento para renderizar o PDF
          const { pdf } = await import('@react-pdf/renderer');
          
          // Renderizar o PDF como blob
          const blob = await pdf(
            <AutorizacaoAmbientalPDF 
              data={data} 
              qrCodeUrl={qrCodeUrl}
              logoUrl={logoUrl}
              assinaturaUrl={assinaturaUrl}
            />
          ).toBlob();
          
          // Criar URL para o blob
          const url = URL.createObjectURL(blob);
          
          // Criar link para download
          const link = document.createElement('a');
          link.href = url;
          link.download = `autorizacao-ambiental-${data.numeroProcesso || data.id || 'documento'}.pdf`;
          document.body.appendChild(link);
          
          // Clicar no link para iniciar o download
          link.click();
          
          // Limpar
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          // Remover o parâmetro de download da URL
          const urlObj = new URL(window.location.href);
          urlObj.searchParams.delete('download');
          window.history.replaceState({}, '', urlObj.toString());
        } catch (error) {
          console.error('Erro ao gerar PDF para download:', error);
        }
      };
      
      downloadPDFDirectly();
    }
  }, [shouldDownload, pdfReady, loading, data, id, qrCodeUrl, logoUrl, assinaturaUrl]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-600">Carregando visualização da autorização...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-red-50 p-4 rounded-md border border-red-200 mb-4">
          <p className="text-red-600">{error}</p>
        </div>
        <Button variant="outline" onClick={() => window.history.back()}>
          Voltar
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 mb-4">
          <p className="text-yellow-600">Nenhum dado encontrado para esta autorização.</p>
        </div>
        <Button variant="outline" onClick={() => window.history.back()}>
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-4">
      <div className="w-full max-w-screen-lg mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Visualização da Autorização</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.history.back()}>
            Voltar
          </Button>
          <Button onClick={() => window.location.href = `/api/autorizacao/${id}/download`}>
            Baixar PDF
          </Button>
        </div>
      </div>
      
      <div className="w-full max-w-screen-lg h-[800px] border border-gray-300 rounded-md">
        <PDFViewer width="100%" height="100%" style={{ border: 'none' }}>
          <AutorizacaoAmbientalPDF 
            data={data} 
            qrCodeUrl={qrCodeUrl}
            logoUrl={logoUrl}
            assinaturaUrl={assinaturaUrl}
          />
        </PDFViewer>
      </div>
    </div>
  );
}
