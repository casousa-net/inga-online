import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Obter departamento da query string
    const { searchParams } = new URL(request.url);
    const departamento = searchParams.get('departamento') || 'todos';

    // Buscar todas as solicitações que precisam de atenção do Técnico
    // Isso inclui solicitações pendentes que ainda não foram validadas
    
    // Filtrar pelo departamento do técnico
    let whereClause: any = {
      status: 'Pendente',
      // Removido o filtro validadoPorTecnico: false para mostrar todos os processos pendentes
    };
    
    // Aplicar filtro com base no departamento do técnico
    if (departamento !== 'todos') {
      if (departamento === 'autorizacao') {
        whereClause.tipo = { in: ['Importação', 'Exportação', 'Reexportação'] };
      } else if (departamento === 'monitorizacao') {
        whereClause.tipo = { in: ['Monitoração', 'Fiscalização'] };
      } else if (departamento === 'espacos-verdes') {
        whereClause.tipo = { in: ['Espaços Verdes', 'Arborização'] };
      }
    }
    
    const solicitacoes = await prisma.solicitacaoautorizacao.findMany({
      where: whereClause,
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
