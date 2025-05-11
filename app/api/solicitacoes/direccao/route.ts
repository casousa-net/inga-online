import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Buscar todas as solicitações que precisam de atenção da Direção
    // Isso inclui solicitações com pagamento confirmado que ainda não foram aprovadas
    const solicitacoes = await prisma.solicitacaoautorizacao.findMany({
      where: {
        OR: [
          // Pagamento confirmado, aguardando aprovação
          {
            status: 'Pagamento_Confirmado',
            aprovadoPorDirecao: false
          },
          // Aguardando assinatura
          {
            status: 'Aguardando_Assinatura'
          },
          // Já aprovadas (para histórico)
          {
            status: 'Aprovado',
            aprovadoPorDirecao: true
          }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
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
