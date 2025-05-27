import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  context: any
) {
  const { params } = context;
  try {
    const { nome } = await request.json();

    if (!nome) {
      return NextResponse.json(
        { error: 'Nome do diretor é obrigatório' },
        { status: 400 }
      );
    }

    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    // Buscar a solicitação com todos os dados relacionados
    const solicitacao = await prisma.solicitacaoautorizacao.findUnique({
      where: { id },
      include: {
        utente: true,
        solicitacaoitem: {
          include: {
            codigopautal: true
          }
        }
      }
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

    // Verificar se a solicitação já foi aprovada
    if (solicitacao.aprovadoPorDirecao) {
      return NextResponse.json(
        { error: 'Solicitação já foi aprovada' },
        { status: 400 }
      );
    }

    const dataEmissao = new Date();

    // Gerar número de autorização baseado no ano atual e um contador sequencial
    const ano = new Date().getFullYear();
    
    // Buscar o último número de autorização para este ano
    const ultimaAutorizacao = await prisma.$queryRaw<{ max_num: number | null }[]>`
      SELECT MAX(CAST(SUBSTRING_INDEX(numeroAutorizacao, '-', -1) AS UNSIGNED)) as max_num
      FROM autorizacao
      WHERE numeroAutorizacao LIKE ${'AUT-' + ano + '-%'}
    `;
    
    // Determinar o próximo número sequencial
    let sequencial = 1;
    if (ultimaAutorizacao && ultimaAutorizacao[0] && ultimaAutorizacao[0].max_num) {
      sequencial = Number(ultimaAutorizacao[0].max_num) + 1;
    }
    
    // Formatar o número de autorização: AUT-ANO-SEQUENCIAL (ex: AUT-2025-0001)
    const numeroAutorizacao = `AUT-${ano}-${sequencial.toString().padStart(4, '0')}`;
    
    // Criar a autorização usando Prisma
    const novaAutorizacao = await prisma.autorizacao.create({
      data: {
        numeroAutorizacao,
        tipoAutorizacao: solicitacao.tipo,
        solicitacaoId: id,
        numeroFactura: solicitacao.numeroFactura || solicitacao.rupeReferencia || '',
        produtos: solicitacao.solicitacaoitem
          .map(item => item.codigopautal.descricao)
          .join(', '),
        quantidade: solicitacao.solicitacaoitem
          .map(item => item.quantidade.toString())
          .join(', '),
        dataEmissao,
        assinadoPor: nome
      }
    });

    // Criar os códigos pautais associados
    await Promise.all(
      solicitacao.solicitacaoitem.map(item =>
        prisma.codigopautalautorizacao.create({
          data: {
            autorizacaoId: novaAutorizacao.id,
            codigo: item.codigopautal.codigo,
            descricao: item.codigopautal.descricao
          }
        })
      )
    );

    // Atualizar o status da solicitação
    const updatedSolicitacao = await prisma.solicitacaoautorizacao.update({
      where: { id },
      data: {
        status: 'Aprovado',
        aprovadoPorDirecao: true,
        dataAprovacao: dataEmissao
      }
    });

    return NextResponse.json({
      ...updatedSolicitacao,
      autorizacao: novaAutorizacao
    });
  } catch (error) {
    console.error('Erro ao aprovar solicitação:', error);
    return NextResponse.json(
      { error: 'Erro ao aprovar solicitação' },
      { status: 500 }
    );
  }
}
