import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
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

    // Buscar a solicitação com todas as informações relacionadas
    const solicitacao = await prisma.solicitacaoautorizacao.findUnique({
      where: { id },
      include: {
        utente: {
          select: {
            id: true,
            nome: true,
            nif: true,
            email: true,
            telefone: true,
            endereco: true
          }
        },
        moeda: true,
        solicitacaoitem: {
          include: {
            codigopautal: true
          }
        },
        documentosolicitacao: true
      }
    });

    if (!solicitacao) {
      return NextResponse.json(
        { error: 'Solicitação não encontrada' },
        { status: 404 }
      );
    }

    // Mapear os campos para garantir compatibilidade com o frontend
    const mappedResponse = {
      ...solicitacao,
      itens: solicitacao.solicitacaoitem.map(item => ({
        ...item,
        codigoPautal: item.codigopautal
      })),
      documentos: solicitacao.documentosolicitacao
    };
    
    return NextResponse.json(mappedResponse);
  } catch (error) {
    console.error('Erro ao buscar solicitação:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar solicitação' },
      { status: 500 }
    );
  }
}
