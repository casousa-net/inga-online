"use client";

import React, { useEffect, useState, useRef } from 'react';
import PDFPreview from 'components/pdf/PDFPreview';
import AutorizacaoAmbientalDownload from 'components/pdf/AutorizacaoAmbientalDownload';
import { Button } from 'components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import type { AutorizacaoAmbientalData } from 'components/pdf/AutorizacaoAmbientalPDF';

interface ClientPageProps {
  id: string;
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default function ClientPage({ id, searchParams: initialSearchParams }: ClientPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const download = searchParams?.get('download') === 'true';
  const qrCodeUrl = searchParams?.get('qrcode') || '';
  const numeroProcesso = searchParams?.get('numeroProcesso') || '';
  const descricaoCodigosPautais = searchParams?.get('descricaoCodigosPautais') || '';
  const downloadRef = useRef<HTMLButtonElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dadosAutorizacao, setDadosAutorizacao] = useState<AutorizacaoAmbientalData | null>(null);
  const shouldDownload = searchParams.get('download') === 'true';

  // Efeito para carregar a autorização
  useEffect(() => {
    const fetchAutorizacao = async () => {
      setLoading(true);
      try {
        // Se temos o parâmetro download=true, buscar da API de download
        const endpoint = searchParams?.get('download') === 'true' 
          ? `/api/autorizacao/${id}/download` 
          : `/api/autorizacao/${id}`;
          
        console.log('Buscando dados da autorização de:', endpoint);
        
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error('Erro ao carregar autorização');
        }
        
        const result = await response.json();
        console.log('Dados da autorização recebidos:', result);
        
        // Usar os dados da autorização da resposta
        const data = result.autorizacao || result;
        
        // Gerar o número do processo no formato PA-000000 se não existir
        const processNumber = numeroProcesso || data.numeroProcesso || `PA-${String(data.solicitacaoId || data.id).padStart(6, '0')}`;        
        console.log('Número do processo gerado:', processNumber);
        
        // Criar objeto de dados da autorização
        setDadosAutorizacao({
          tipoAutorizacao: data.tipoAutorizacao,
          entidade: data.entidade,
          nif: data.nif,
          numeroFactura: data.numeroFactura,
          produtos: data.descricaoCodigosPautais || data.produtos,
          quantidade: data.quantidade,
          codigosPautais: data.codigosPautais,
          descricaoCodigosPautais: data.descricaoCodigosPautais,
          dataEmissao: new Date(data.dataEmissao),
          numeroAutorizacao: data.numeroAutorizacao,
          numeroProcesso: processNumber
        });
        
        // Se for download automático, acionar o download
        if (searchParams?.get('download') === 'true' && downloadRef.current) {
          console.log('Acionando download automático');
          setTimeout(() => {
            if (downloadRef.current) {
              downloadRef.current.click();
            }
          }, 1000);
        }
      } catch (err) {
        console.error('Erro ao carregar autorização:', err);
        setError('Erro ao carregar autorização');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAutorizacao();
    }
  }, [id, numeroProcesso, searchParams]);

  // Efeito para acionar o download automaticamente quando shouldDownload for true
  useEffect(() => {
    if (download && downloadRef.current && !loading && !error) {
      console.log('Iniciando download automático...');
      // Pequeno delay para garantir que o componente de download esteja pronto
      const timer = setTimeout(() => {
        if (downloadRef.current) {
          console.log('Clicando no botão de download...');
          downloadRef.current.click();
        }
      }, 1500); // Aumentar o delay para garantir que o PDF esteja pronto
      
      return () => clearTimeout(timer);
    }
  }, [download, loading, error, dadosAutorizacao]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 text-xl mb-4">Erro: {error}</div>
        <Button onClick={() => router.back()}>Voltar</Button>
      </div>
    );
  }

  if (!dadosAutorizacao) {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          Voltar
        </Button>
        
        {dadosAutorizacao && (
          <>
            <AutorizacaoAmbientalDownload 
              data={dadosAutorizacao} 
              ref={downloadRef}
              autoDownload={download}
            />
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
                <p className="font-bold">Erro ao gerar PDF</p>
                <p>{error}</p>
              </div>
            )}
          </>
        )}
      </div>
      <div className="bg-white rounded-xl shadow-md" style={{ height: "calc(100vh - 200px)" }}>
        {dadosAutorizacao && (
          <PDFPreview 
            solicitacaoId={parseInt(id, 10)}
            tipoSolicitacao={dadosAutorizacao.tipoAutorizacao}
            entidade={dadosAutorizacao.entidade}
            nif={dadosAutorizacao.nif}
            isApproved={true}
            numeroAutorizacao={dadosAutorizacao.numeroAutorizacao}
          />
        )}
      </div>
    </div>
  );
}
