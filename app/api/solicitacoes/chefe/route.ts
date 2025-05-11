import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Buscar todas as solicitações que precisam de atenção do Chefe
    // Isso inclui:
    // 1. Solicitações pendentes que já foram validadas pelo técnico
    // 2. Solicitações validadas pelo chefe que precisam de RUPE
    // 3. Solicitações com RUPE que precisam de validação de pagamento
    const solicitacoes = await prisma.solicitacaoautorizacao.findMany({
      where: {
        status: {
          in: ['Pendente', 'Valido_RUPE', 'Aguardando_Pagamento', 'Aguardando_Confirmacao_Pagamento']
        }
      },
      select: {
        id: true,
        tipo: true,
        status: true,
        valorTotalKz: true,
        createdAt: true,
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

    return NextResponse.json(solicitacoes);
  } catch (error) {
    console.error('Erro ao buscar solicitações:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar solicitações' },
      { status: 500 }
    );
  }
}
