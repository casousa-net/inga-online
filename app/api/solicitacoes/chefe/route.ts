import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Buscar todas as solicitações que precisam de atenção do Chefe
    // Isso inclui:
    // 1. Solicitações pendentes que já foram validadas pelo técnico
    // 2. Solicitações validadas pelo chefe que precisam de RUPE
    // 3. Solicitações com RUPE que precisam de validação de pagamento
    // Buscar todas as solicitações que têm RUPE, independentemente do status
    // Primeiro, buscar os processos que precisam de atenção do chefe
    const whereClause = {
      OR: [
        // Processos validados pelo técnico e aguardando validação do chefe
        {
          validadoPorTecnico: true,
          validadoPorChefe: false,
          status: 'Pendente'
        },
        // Processos com RUPE que precisam de atenção
        {
          OR: [
            { rupeReferencia: { not: null } },
            { status: { in: ['Valido_RUPE', 'Aguardando_Pagamento', 'Aguardando_Confirmacao_Pagamento'] } }
          ]
        }
      ]
    };

    console.log('Consulta do chefe - Filtro:', JSON.stringify(whereClause, null, 2));

    const solicitacoes = await prisma.solicitacaoautorizacao.findMany({
      where: whereClause,
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
        createdAt: 'asc'
      }
    });

    console.log('Processos encontrados para o chefe:', solicitacoes.length);
    return NextResponse.json(solicitacoes);
  } catch (error) {
    console.error('Erro ao buscar solicitações:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar solicitações' },
      { status: 500 }
    );
  }
}
