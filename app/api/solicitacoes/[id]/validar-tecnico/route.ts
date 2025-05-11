import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    // Verificar se a solicitação existe
    const solicitacao = await prisma.solicitacaoautorizacao.findUnique({
      where: { id },
    });

    if (!solicitacao) {
      return NextResponse.json(
        { error: 'Solicitação não encontrada' },
        { status: 404 }
      );
    }

    // Atualizar a solicitação usando SQL direto para contornar restrições de tipo
    await prisma.$executeRaw`
      UPDATE solicitacaoautorizacao 
      SET validadoPorTecnico = 1, 
          observacoes = ${observacoes || null},
          tecnicoId = 1
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
