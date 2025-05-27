import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    // Obter o motivo da rejeição do corpo da requisição
    const body = await request.json();
    const { motivoRejeicao } = body;

    if (!motivoRejeicao || motivoRejeicao.trim() === '') {
      return NextResponse.json(
        { error: 'Motivo de rejeição é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se a solicitação existe
    const solicitacao = await prisma.solicitacaoAutorizacao.findUnique({
      where: { id },
    });

    if (!solicitacao) {
      return NextResponse.json(
        { error: 'Solicitação não encontrada' },
        { status: 404 }
      );
    }

    // Atualizar a solicitação
    const updatedSolicitacao = await prisma.solicitacaoAutorizacao.update({
      where: { id },
      data: {
        status: 'Rejeitado',
        motivoRejeicao: motivoRejeicao
      },
    });

    return NextResponse.json(updatedSolicitacao);
  } catch (error) {
    console.error('Erro ao rejeitar solicitação:', error);
    return NextResponse.json(
      { error: 'Erro ao rejeitar solicitação' },
      { status: 500 }
    );
  }
}
