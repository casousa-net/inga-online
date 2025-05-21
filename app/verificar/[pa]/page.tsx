"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Image from 'next/image';
import { XCircle } from 'lucide-react';

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

export default function VerificarPage() {
  const params = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const paValue = params.pa as string;
        const response = await fetch(`/api/verificar/${encodeURIComponent(paValue)}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`Autorização não encontrada com o código ${params.pa}`);
          } else {
            throw new Error(`Erro ao buscar dados: ${response.status}`);
          }
        }

        const result = await response.json();
        if (result.error) {
          throw new Error(result.message || result.error);
        }

        setData(result);
      } catch (err: any) {
        console.error('Erro ao buscar dados da autorização:', err);
        setError(err.message || 'Não foi possível carregar os dados da autorização. Por favor, tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.pa]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen py-10 px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-10 px-4">
        <div className="mb-8">
          <Image src="/assets/pdf/logo-inga.png" alt="INGA" width={120} height={120} />
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-lg w-full text-center shadow-sm">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-700 mb-2">Documento não encontrado</h2>
          <p className="text-gray-600 mb-4">{error || 'Não foi possível encontrar a autorização ambiental solicitada.'}</p>
          <p className="text-sm text-gray-500 mb-4">Verifique o código do documento e tente novamente.</p>
          <Link href="/" className="mt-4 px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors inline-block">
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    );
  }

  // Formatar datas para exibição
  const formatarData = (data: string | Date) => {
    if (!data) return 'N/A';
    const dataObj = typeof data === 'string' ? new Date(data) : data;
    return format(dataObj, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  // Determinar o status da autorização
  const dataAtual = new Date();
  const dataValidade = new Date(data.dataValidade);
  const isValido = data.isValido !== false && dataAtual <= dataValidade && !data.revogado;
  const isExpirado = dataAtual > dataValidade && !data.revogado;
  const isRevogado = data.revogado === true;

  let statusText = 'Válido';
  let statusColor = 'bg-green-100 text-green-800';
  let statusBorderColor = 'border-green-200';

  if (isExpirado) {
    statusText = 'Expirado';
    statusColor = 'bg-yellow-100 text-yellow-800';
    statusBorderColor = 'border-yellow-200';
  } else if (isRevogado) {
    statusText = 'Revogado';
    statusColor = 'bg-red-100 text-red-800';
    statusBorderColor = 'border-red-200';
  }

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 max-w-5xl">
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4 border-b pb-6">
        <div className="flex items-center">
          <Image src="/assets/pdf/logo-inga.png" alt="INGA" width={80} height={80} className="mr-4" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Verificação de Autorização Ambiental</h1>
            <p className="text-gray-600">Documento: {params.pa}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`px-4 py-2 rounded-full ${statusColor} font-medium border ${statusBorderColor}`}>
            {statusText}
          </div>
          <Image src="/assets/pdf/logo_50_anos.png" alt="Angola 50 Anos" width={90} height={90} className="ml-2" />
        </div>
      </header>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Informações da Autorização</h3>

            <div className="space-y-2">
              <div>
                <span className="text-gray-600 font-medium">Número do Processo:</span>
                <span className="ml-2 text-gray-800">{data.pa || 'N/A'}</span>
              </div>

              <div>
                <span className="text-gray-600 font-medium">Tipo de Autorização:</span>
                <span className="ml-2 text-gray-800">{data.tipoAutorizacao || 'N/A'}</span>
              </div>

              <div>
                <span className="text-gray-600 font-medium">Data de Emissão:</span>
                <span className="ml-2 text-gray-800">{formatarData(data.dataEmissao)}</span>
              </div>

              <div>
                <span className="text-gray-600 font-medium">Data de Validade:</span>
                <span className="ml-2 text-gray-800">{formatarData(data.dataValidade)}</span>
              </div>

              <div>
                <span className="text-gray-600 font-medium">Número da Factura:</span>
                <span className="ml-2 text-gray-800">{data.numeroFactura || 'N/A'}</span>
              </div>

            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Dados do Utente</h3>

            <div className="space-y-2">
              <div>
                <span className="text-gray-600 font-medium">Entidade:</span>
                <span className="ml-2 text-gray-800">{data.entidade || 'N/A'}</span>
              </div>

              <div>
                <span className="text-gray-600 font-medium">NIF:</span>
                <span className="ml-2 text-gray-800">{data.nif || 'N/A'}</span>
              </div>

              <div>
                <span className="text-gray-600 font-medium">Endereço:</span>
                <span className="ml-2 text-gray-800">{data.endereco || 'N/A'}</span>
              </div>

              <div>
                <span className="text-gray-600 font-medium">Telefone:</span>
                <span className="ml-2 text-gray-800">{data.telefone || 'N/A'}</span>
              </div>

              <div>
                <span className="text-gray-600 font-medium">Email:</span>
                <span className="ml-2 text-gray-800">{data.email || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Produtos e Códigos</h3>

        <div className="space-y-4">
          <div>
            <h4 className="text-gray-600 font-medium mb-2">Códigos Pautais:</h4>
            <div className="bg-gray-50 p-3 rounded-md text-sm whitespace-pre-line border border-gray-200">
              {data.codigosPautais || 'N/A'}
            </div>
          </div>

          <div>
            <h4 className="text-gray-600 font-medium mb-2">Produtos:</h4>
            <div className="bg-gray-50 p-3 rounded-md text-sm border border-gray-200">
              {data.produtos || 'N/A'}
            </div>
          </div>

          <div>
            <h4 className="text-gray-600 font-medium mb-2">Quantidade:</h4>
            <div className="bg-gray-50 p-3 rounded-md text-sm border border-gray-200">
              {data.quantidade || 'N/A'}
            </div>
          </div>

          {data.valorTotalKz && (
            <div>
              <h4 className="text-gray-600 font-medium mb-2">Valor Total em Kwanzas:</h4>
              <div className="bg-amber-50 p-3 rounded-md text-sm border border-amber-200 font-medium">
                {calcularValorFinal(data.valorTotalKz).toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                <div className="mt-1 text-xs text-gray-500">
                  Valor original: {data.valorTotalKz.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} Kz
                  <span className="mx-1">•</span>
                  Taxa aplicada: {(calcularTaxa(data.valorTotalKz) * 100).toFixed(2)}%
                  {calcularValorFinal(data.valorTotalKz) === 2000 && (
                    <span className="ml-1 text-amber-600">(valor mínimo aplicado)</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isRevogado && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6 shadow-sm">
          <h3 className="text-lg font-semibold text-red-700 mb-3">Autorização Revogada</h3>
          <p className="text-gray-700 mb-2">
            <span className="font-medium">Motivo:</span> {data.motivoRevogacao || 'Não especificado'}
          </p>
          {data.dataRevogacao && (
            <p className="text-gray-700">
              <span className="font-medium">Data de Revogação:</span> {formatarData(data.dataRevogacao)}
            </p>
          )}
        </div>
      )}

      <footer className="text-center text-gray-500 text-sm mt-12 pb-8 border-t pt-6">
        <p>Este documento pode ser verificado através do código QR ou acessando:</p>
        <p className="font-medium">{`${window.location.origin}/verificar/${params.pa}`}</p>
        <div className="mt-6 flex justify-center gap-6 items-center">
          <Image src="/assets/pdf/logo-inga.png" alt="INGA" width={70} height={70} className="opacity-70" />
          <Image src="/assets/pdf/minamb.png" alt="MINAMB" width={200} height={80} className="opacity-70" />
          <Image src="/assets/pdf/logo-angola.png" alt="Angola" width={60} height={60} className="opacity-70" />
        </div>
        <p className="mt-4">© {new Date().getFullYear()} Instituto Nacional de Gestão Ambiental (INGA)</p>
      </footer>
    </div>
  );
}
