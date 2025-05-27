import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST(
  request: Request,
  context: any
) {
  const { params } = context;
  try {
    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { observacoes } = body;

    // Verificar se a solicitação existe e obter a data de criação
    const solicitacao = await prisma.solicitacaoautorizacao.findUnique({
      where: { id },
      select: {
        id: true,
        createdAt: true,
        validadoPorTecnico: true,
        validadoPorChefe: true,
        status: true
      },
    });

    if (!solicitacao) {
      return NextResponse.json(
        { error: 'Solicitação não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se já foi validada pelo técnico
    if (!solicitacao.validadoPorTecnico) {
      return NextResponse.json(
        { error: 'Esta solicitação precisa ser validada pelo técnico primeiro' },
        { status: 400 }
      );
    }

    // Verificar se já foi validada pelo chefe
    if (solicitacao.validadoPorChefe) {
      return NextResponse.json(
        { error: 'Esta solicitação já foi validada pelo chefe' },
        { status: 400 }
      );
    }

    // Verificar se existem processos mais antigos validados pelo técnico mas não pelo chefe
    const processosPendentes = await prisma.solicitacaoautorizacao.findMany({
      where: {
        validadoPorTecnico: true,
        validadoPorChefe: false,
        status: 'Pendente',
        createdAt: { lt: new Date(solicitacao.createdAt) }
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: 1,
      select: {
        id: true,
        createdAt: true
      }
    });

    // Se existirem processos mais antigos não validados pelo chefe, retornar erro
    if (processosPendentes.length > 0) {
      const processoAntigo = processosPendentes[0];
      return NextResponse.json(
        { 
          error: 'Valide os processos mais antigos primeiro',
          processoAntigoId: processoAntigo.id,
          processoAntigoData: processoAntigo.createdAt
        },
        { status: 400 }
      );
    }

    // Buscar o nome do chefe logado do body
    const { nome } = body;

    // Atualizar a solicitação usando SQL direto para contornar restrições de tipo
    const dataValidacao = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    // Quando o chefe valida, o status deve ser 'Valido_RUPE'
    // O status 'Aguardando_Pagamento' só será definido após a adição da RUPE
    await prisma.$executeRaw`
      UPDATE solicitacaoautorizacao 
      SET validadoPorChefe = 1, 
          status = 'Valido_RUPE',
          observacoes = ${observacoes || null},
          chefeId = 1,
          chefeValidador = ${nome},
          updatedAt = ${dataValidacao}
      WHERE id = ${id}
    `;
    
    // Buscar a solicitação atualizada
    const updatedSolicitacao = await prisma.solicitacaoautorizacao.findUnique({
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
    });

    // Mapear os campos para garantir compatibilidade com o frontend
    const mappedResponse = {
      ...updatedSolicitacao,
      itens: updatedSolicitacao?.solicitacaoitem?.map(item => ({
        ...item,
        codigoPautal: item.codigopautal
      })) || [],
      documentos: updatedSolicitacao?.documentosolicitacao || []
    };
    
    return NextResponse.json(mappedResponse);
  } catch (error) {
    console.error('Erro ao validar solicitação:', error);
    return NextResponse.json(
      { error: 'Erro ao validar solicitação' },
      { status: 500 }
    );
  }
}
