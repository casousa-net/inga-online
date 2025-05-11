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
    const solicitacao = await prisma.solicitacaoautorizacao.findUnique({
      where: { id },
    });

    if (!solicitacao) {
      return NextResponse.json(
        { error: 'Solicitação não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se tem RUPE
    if (!solicitacao.rupeReferencia) {
      return NextResponse.json(
        { error: 'RUPE ainda não foi gerado para esta solicitação' },
        { status: 400 }
      );
    }

    // Atualizar a solicitação
    const updatedSolicitacao = await prisma.solicitacaoautorizacao.update({
      where: { id },
      data: {
        rupePago: true,
        status: 'Aguardando_Confirmacao_Pagamento',
      },
    });

    return NextResponse.json(updatedSolicitacao);
  } catch (error) {
    console.error('Erro ao confirmar pagamento:', error);
    return NextResponse.json(
      { error: 'Erro ao confirmar pagamento' },
      { status: 500 }
    );
  }
}
