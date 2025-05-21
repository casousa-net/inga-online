import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
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
        status: true
      },
    });

    if (!solicitacao) {
      return NextResponse.json(
        { error: 'Solicitação não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se já foi validada
    if (solicitacao.validadoPorTecnico) {
      return NextResponse.json(
        { error: 'Esta solicitação já foi validada' },
        { status: 400 }
      );
    }

    // Verificar se existem processos mais antigos não validados
    const processosPendentes = await prisma.solicitacaoautorizacao.findMany({
      where: {
        validadoPorTecnico: false,
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

    // Se existirem processos mais antigos não validados, retornar erro
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

    // Buscar o nome do técnico logado do localStorage
    const { nome } = body;

    // Atualizar a solicitação usando SQL direto para contornar restrições de tipo
    await prisma.$executeRaw`
      UPDATE solicitacaoautorizacao 
      SET validadoPorTecnico = 1, 
          observacoes = ${observacoes || null},
          tecnicoId = 1,
          tecnicoValidador = ${nome}
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

    return NextResponse.json(updatedSolicitacao);
  } catch (error) {
    console.error('Erro ao validar solicitação pelo técnico:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
