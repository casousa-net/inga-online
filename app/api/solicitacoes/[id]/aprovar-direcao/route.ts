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

    // Verificar se o pagamento foi validado pelo chefe
    if (!solicitacao.rupeValidado) {
      return NextResponse.json(
        { error: 'Pagamento ainda não foi validado pelo chefe' },
        { status: 400 }
      );
    }

    // Atualizar a solicitação
    const updatedSolicitacao = await prisma.solicitacaoAutorizacao.update({
      where: { id },
      data: {
        aprovadoPorDirecao: true,
        status: 'Aprovado',
        dataAprovacao: new Date()
      },
    });

    return NextResponse.json(updatedSolicitacao);
  } catch (error) {
    console.error('Erro ao aprovar solicitação:', error);
    return NextResponse.json(
      { error: 'Erro ao aprovar solicitação' },
      { status: 500 }
    );
  }
}
