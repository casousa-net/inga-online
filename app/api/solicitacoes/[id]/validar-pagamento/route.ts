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

    // Verificar se tem RUPE e se o pagamento foi confirmado pelo utente
    if (!solicitacao.rupeReferencia || !solicitacao.rupePago) {
      return NextResponse.json(
        { error: 'Pagamento ainda não foi confirmado pelo utente' },
        { status: 400 }
      );
    }

    // Atualizar a solicitação
    const updatedSolicitacao = await prisma.solicitacaoautorizacao.update({
      where: { id },
      data: {
        rupeValidado: true,
        status: 'Pagamento_Confirmado',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedSolicitacao);
  } catch (error) {
    console.error('Erro ao validar pagamento:', error);
    return NextResponse.json(
      { error: 'Erro ao validar pagamento' },
      { status: 500 }
    );
  }
}
