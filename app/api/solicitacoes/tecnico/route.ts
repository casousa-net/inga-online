import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Obter departamento da query string
    const { searchParams } = new URL(request.url);
    const departamento = searchParams.get('departamento') || 'todos';

    // Buscar todas as solicitações que precisam de atenção do Técnico
    // Isso inclui solicitações pendentes que ainda não foram validadas
    
    // Usar uma abordagem mais abrangente para garantir que todos os processos apareçam
    // Vamos usar OR para incluir diferentes condições que podem fazer um processo precisar de atenção
    let whereClause: any = {
      OR: [
        // Processos que não foram validados pelo técnico
        { validadoPorTecnico: false },
        // Processos com status pendente (independente da validação)
        { status: 'Pendente' },
        // Processos com status "Pendente Validação Técnica"
        { status: 'Pendente Validação Técnica' }
      ]
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
    
    // Primeiro, buscar todas as solicitações que atendem aos critérios
    const todasSolicitacoes = await prisma.solicitacaoautorizacao.findMany({
      where: whereClause,
      select: {
        id: true,
        tipo: true,
        status: true,
        valorTotalKz: true,
        createdAt: true,
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

    // Para cada solicitação, verificar se há processos mais antigos não validados
    const solicitacoesComStatus = await Promise.all(
      todasSolicitacoes.map(async (solicitacao) => {
        // Verificar se existem processos mais antigos não validados
        const processosAnterioresNaoValidados = await prisma.solicitacaoautorizacao.findFirst({
          where: {
            validadoPorTecnico: false,
            status: 'Pendente',
            createdAt: { lt: new Date(solicitacao.createdAt) },
            id: { not: solicitacao.id }
          },
          orderBy: {
            createdAt: 'asc'
          },
          select: {
            id: true,
            createdAt: true
          }
        });

        // Adicionar informação se pode ser validado ou não
        return {
          ...solicitacao,
          podeValidar: !processosAnterioresNaoValidados,
          processoAnteriorId: processosAnterioresNaoValidados?.id || null,
          processoAnteriorData: processosAnterioresNaoValidados?.createdAt || null
        };
      })
    );

    const solicitacoes = solicitacoesComStatus;

    // Adicionar informações de diagnóstico à resposta
    const diagnostico = {
      total: solicitacoes.length,
      pendentes: solicitacoes.filter(s => s.status === 'Pendente').length,
      pendentesValidacaoTecnica: solicitacoes.filter(s => s.status === 'Pendente Validação Técnica').length,
      naoValidadosPorTecnico: solicitacoes.filter(s => !s.validadoPorTecnico).length,
      whereClause: whereClause
    };

    // Registrar informações no console do servidor para diagnóstico
    console.log('Diagnóstico de solicitações para técnico:', diagnostico);

    return NextResponse.json({
      solicitacoes,
      diagnostico
    });
  } catch (error) {
    console.error('Erro ao buscar solicitações:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar solicitações' },
      { status: 500 }
    );
  }
}
