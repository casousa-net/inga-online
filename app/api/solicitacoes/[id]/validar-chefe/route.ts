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

    // Não é mais necessário verificar se já foi validada pelo técnico

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
