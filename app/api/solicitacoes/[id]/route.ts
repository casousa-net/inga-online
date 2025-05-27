import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
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

    // Buscar os validadores usando SQL direto para evitar problemas de tipagem
    const validadores = await prisma.$queryRaw`
      SELECT tecnicoValidador, chefeValidador, direcaoValidador
      FROM solicitacaoautorizacao
      WHERE id = ${id}
    ` as { tecnicoValidador: string | null, chefeValidador: string | null, direcaoValidador: string | null }[];

    const validadoresInfo = validadores[0] || {};

    if (!solicitacao) {
      return NextResponse.json(
        { error: 'Solicitação não encontrada' },
        { status: 404 }
      );
    }

    // Mapear os campos para garantir compatibilidade com o frontend
    const mappedResponse = {
      ...solicitacao,
      tecnicoValidador: validadoresInfo.tecnicoValidador,
      chefeValidador: validadoresInfo.chefeValidador,
      direcaoValidador: validadoresInfo.direcaoValidador,
      itens: solicitacao.solicitacaoitem.map(item => ({
        id: item.id,
        descricao: item.descricao,
        quantidade: item.quantidade,
        valorUnitario: item.valorUnitario,
        valorTotal: item.valorTotal,
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
