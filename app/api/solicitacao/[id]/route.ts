import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface SolicitacaoAutorizacao {
  id: number;
  tipo: string;
  status: string;
  valorTotalKz: number;
  createdAt: Date;
  validadoPorTecnico: boolean;
  validadoPorChefe: boolean;
  rupePago: boolean;
  rupeValidado: boolean;
  rupeReferencia: string | null;
  rupeDocumento: string | null;
  utente: {
    id: number;
    nome: string;
    nif: string;
    email: string;
    telefone: string;
    endereco: string;
  };
  moeda: {
    id: number;
    nome: string;
    simbolo: string;
    taxaCambio: number;
  };
  solicitacaoitem: Array<{
    id: number;
    descricao: string;
    quantidade: number;
    valorUnitario: number;
    valorTotal: number;
    codigopautal: {
      id: number;
      codigo: string;
      descricao: string;
      taxa: number;
    };
  }>;
  documentosolicitacao: Array<{
    id: number;
    nome: string;
    url: string;
    tipo: string;
    nomeArquivo?: string;
    caminhoArquivo?: string;
  }>;
}

interface Utente {
  id: number;
  nome: string;
  nif: string;
  email: string;
  telefone: string;
  endereco: string;
}

interface Moeda {
  id: number;
  nome: string;
  simbolo: string;
  taxaCambio: number;
}

interface Item {
  id: number;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  codigoPautal: {
    id: number;
    codigo: string;
    descricao: string;
    taxa: number;
  };
}

interface Documento {
  id: number;
  nome: string;
  url: string;
  tipo: string;
  nomeArquivo?: string;
  caminhoArquivo?: string;
}

interface CodigoPautal {
  id: number;
  codigo: string;
  descricao: string;
  taxa: number;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Aguarda a resolução dos parâmetros
    const resolvedParams = await Promise.resolve(params);
    const id = parseInt(resolvedParams.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const solicitacao = await prisma.solicitacaoautorizacao.findUnique({
      where: { id },
      include: {
        utente: true,
        moeda: true,
        solicitacaoitem: {
          include: {
            codigopautal: true
          }
        },
        documentosolicitacao: true
      }
    }) as SolicitacaoAutorizacao | null;

    if (!solicitacao) {
      console.log('Solicitação não encontrada para ID:', id);
      return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 });
    }
    
    console.log('Documentos da solicitação:', JSON.stringify(solicitacao.documentosolicitacao, null, 2));

    // Imprimir os documentos originais para depuração
    console.log('Documentos originais:', JSON.stringify(solicitacao.documentosolicitacao, null, 2));
    
    // Mapear os campos para o formato esperado
    const mappedSolicitacao = {
      id: solicitacao.id,
      tipo: solicitacao.tipo,
      status: solicitacao.status,
      valorTotalKz: solicitacao.valorTotalKz,
      createdAt: solicitacao.createdAt,
      validadoPorTecnico: solicitacao.validadoPorTecnico,
      validadoPorChefe: solicitacao.validadoPorChefe,
      rupePago: solicitacao.rupePago,
      rupeValidado: solicitacao.rupeValidado,
      rupeReferencia: solicitacao.rupeReferencia,
      rupePdf: solicitacao.rupeDocumento,
      utente: solicitacao.utente,
      moeda: solicitacao.moeda,
      itens: solicitacao.solicitacaoitem.map(item => {
        // Log para debug dos valores dos itens
        console.log(`Item ${item.id} valores:`, {
          valorUnitario: item.valorUnitario,
          valorTotal: item.valorTotal,
          quantidade: item.quantidade
        });
        
        return {
          id: item.id,
          descricao: item.descricao || '',
          quantidade: Number(item.quantidade) || 0,
          valorUnitario: Number(item.valorUnitario) || 0,
          valorTotal: Number(item.valorTotal) || 0,
          codigoPautal: {
            codigo: item.codigopautal.codigo,
            descricao: item.codigopautal.descricao,
            taxa: Number(item.codigopautal.taxa) || 0
          }
        };
      }),
      documentos: solicitacao.documentosolicitacao.map(doc => {
        // Extrair o nome do arquivo da URL, se o nome não estiver disponível
        const fileName = doc.url ? doc.url.split('/').pop() : '';
        
        // Verificar todos os campos possíveis para o nome
        let displayName = '';
        
        if (doc.nome && doc.nome.trim() !== '') {
          displayName = doc.nome;
        } else if (doc.nomeArquivo && doc.nomeArquivo.trim() !== '') {
          displayName = doc.nomeArquivo;
        } else if (fileName && fileName.trim() !== '') {
          displayName = fileName;
        } else {
          displayName = `Documento ${doc.id}`;
        }
        
        // Log detalhado para depuração
        console.log('Processando documento na API:', {
          id: doc.id,
          tipo: doc.tipo,
          nome: doc.nome,
          nomeArquivo: doc.nomeArquivo,
          url: doc.url,
          caminhoArquivo: doc.caminhoArquivo,
          fileName: fileName,
          displayName: displayName
        });
        
        return {
          id: doc.id,
          nome: displayName,
          url: doc.url || '',
          tipo: doc.tipo || 'unknown'
        };
      }) as Array<Documento>
    };

    return NextResponse.json(mappedSolicitacao);
  } catch (error) {
    console.error('Erro ao buscar solicitação:', error);
    return NextResponse.json({ error: 'Erro interno ao buscar solicitação' }, { status: 500 });
  }
}
