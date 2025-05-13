"use client";

import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VerificacaoProps {
  params: {
    codigo: string;
  };
}

interface Autorizacao {
  id: number;
  numeroAutorizacao: string;
  tipoAutorizacao: string;
  entidade: string;
  nif: string;
  numeroFactura: string;
  dataEmissao: string;
  dataValidade: string;
  status: 'valido' | 'expirado' | 'revogado';
}

export default function VerificacaoPage({ params }: VerificacaoProps) {
  const [autorizacao, setAutorizacao] = useState<Autorizacao | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAutorizacao = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/verificar/${params.codigo}`);
        
        if (!response.ok) {
          throw new Error('Autorização não encontrada ou inválida');
        }
        
        const data = await response.json();
        setAutorizacao(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao verificar autorização');
      } finally {
        setLoading(false);
      }
    };

    if (params.codigo) {
      fetchAutorizacao();
    }
  }, [params.codigo]);

  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return format(data, "dd 'de' MMMM 'de' yyyy 'às' HH:mm:ss", { locale: ptBR });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full text-center">
          <Loader2 className="h-16 w-16 text-lime-600 animate-spin mx-auto" />
          <h1 className="text-2xl font-bold mt-4 text-gray-800">Verificando autenticidade...</h1>
          <p className="text-gray-600 mt-2">Aguarde enquanto verificamos a autenticidade do documento.</p>
        </div>
      </div>
    );
  }

  if (error || !autorizacao) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold mt-4 text-gray-800">Documento Inválido</h1>
          <p className="text-gray-600 mt-2">
            {error || 'Não foi possível verificar a autenticidade deste documento. O código de verificação não é válido.'}
          </p>
          <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">
              Se você recebeu este documento, por favor entre em contato com o Instituto Nacional de Gestão Ambiental para verificar sua autenticidade.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <div className="flex items-center">
            <img 
              src="/assets/pdf/logo-angola.png" 
              alt="Logo Angola" 
              className="h-16 w-16 object-contain"
            />
            <div className="ml-4">
              <h1 className="text-lg font-bold text-gray-800">REPÚBLICA DE ANGOLA</h1>
              <p className="text-sm text-gray-600">INSTITUTO NACIONAL DE GESTÃO AMBIENTAL</p>
            </div>
          </div>
          {autorizacao.status === 'valido' ? (
            <div className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              <CheckCircle className="h-4 w-4 mr-1" />
              Válido
            </div>
          ) : autorizacao.status === 'expirado' ? (
            <div className="flex items-center bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
              <XCircle className="h-4 w-4 mr-1" />
              Expirado
            </div>
          ) : (
            <div className="flex items-center bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
              <XCircle className="h-4 w-4 mr-1" />
              Revogado
            </div>
          )}
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-bold text-center text-lime-800 mb-6">
            VERIFICAÇÃO DE AUTORIZAÇÃO AMBIENTAL
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Número de Autorização</p>
                <p className="font-medium">PA {autorizacao.numeroAutorizacao}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Tipo de Autorização</p>
                <p className="font-medium">{autorizacao.tipoAutorizacao}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-500">Entidade</p>
              <p className="font-medium">{autorizacao.entidade}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">NIF</p>
                <p className="font-medium">{autorizacao.nif}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Número da Factura</p>
                <p className="font-medium">{autorizacao.numeroFactura}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Data de Emissão</p>
                <p className="font-medium">{formatarData(autorizacao.dataEmissao)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Válido até</p>
                <p className="font-medium">{formatarData(autorizacao.dataValidade)}</p>
              </div>
            </div>
          </div>

          {autorizacao.status === 'valido' ? (
            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <p className="text-green-700 font-medium">Este documento é autêntico e está válido</p>
              </div>
              <p className="text-green-600 text-sm mt-1">
                A autorização ambiental foi emitida pelo Instituto Nacional de Gestão Ambiental e está dentro do prazo de validade.
              </p>
            </div>
          ) : autorizacao.status === 'expirado' ? (
            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <XCircle className="h-5 w-5 text-yellow-500 mr-2" />
                <p className="text-yellow-700 font-medium">Este documento está expirado</p>
              </div>
              <p className="text-yellow-600 text-sm mt-1">
                A autorização ambiental foi emitida pelo Instituto Nacional de Gestão Ambiental, mas o prazo de validade expirou.
              </p>
            </div>
          ) : (
            <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <XCircle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-red-700 font-medium">Este documento foi revogado</p>
              </div>
              <p className="text-red-600 text-sm mt-1">
                A autorização ambiental foi revogada pelo Instituto Nacional de Gestão Ambiental e não é mais válida.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
