import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    console.log('[API Chefe/RUPEs] Iniciando busca de RUPEs');
    
    // Buscar todas as solicitações que têm referência RUPE
    const solicitacoes = await prisma.solicitacaoautorizacao.findMany({
      where: {
        rupeReferencia: {
          not: null
        }
      },
      select: {
        id: true,
        tipo: true,
        status: true,
        valorTotalKz: true,
        createdAt: true,
        rupeReferencia: true,
        rupeDocumento: true,
        rupePago: true,
        rupeValidado: true,
        validadoPorTecnico: true,
        validadoPorChefe: true,
        utente: {
          select: {
            id: true,
            nome: true,
            nif: true
          }
        },
        moeda: {
          select: {
            nome: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`[API Chefe/RUPEs] Encontradas ${solicitacoes.length} solicitações com RUPE`);
    
    // Log detalhado para depuração
    solicitacoes.forEach((sol, index) => {
      console.log(`[API Chefe/RUPEs] RUPE ${index + 1}:`, {
        id: sol.id,
        tipo: sol.tipo,
        status: sol.status,
        rupeReferencia: sol.rupeReferencia,
        rupeDocumento: sol.rupeDocumento,
        rupePago: sol.rupePago,
        rupeValidado: sol.rupeValidado
      });
    });

    return NextResponse.json(solicitacoes);
  } catch (error) {
    console.error('[API Chefe/RUPEs] Erro ao buscar RUPEs:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar RUPEs' },
      { status: 500 }
    );
  }
}
