import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const id = parseInt(context.params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }
    
    // Buscar a autorização pelo ID
    const autorizacao = await prisma.$queryRaw`
      SELECT 
        aa.*, 
        sa.id as solicitacaoId,
        u.nome as entidadeNome,
        u.nif as entidadeNif
      FROM autorizacaoambiental aa
      JOIN solicitacaoautorizacao sa ON aa.solicitacaoId = sa.id
      JOIN utente u ON sa.utenteId = u.id
      WHERE aa.id = ${id}
      LIMIT 1
    `;
    
    if (!autorizacao || (Array.isArray(autorizacao) && autorizacao.length === 0)) {
      return NextResponse.json(
        { error: 'Autorização não encontrada' },
        { status: 404 }
      );
    }
    
    // Converter para objeto único se for array
    const auth = Array.isArray(autorizacao) ? autorizacao[0] : autorizacao;
    
    // Buscar códigos pautais associados
    const codigosPautais = await prisma.$queryRaw<{codigo: string, descricao: string}[]>`
      SELECT codigo, descricao FROM codigopautalautorizacao
      WHERE autorizacaoId = ${id}
    `;
    
    // Formatar os dados para retornar
    const resposta = {
      id: auth.id,
      numeroAutorizacao: auth.numeroAutorizacao,
      tipoAutorizacao: auth.tipoAutorizacao,
      solicitacaoId: auth.solicitacaoId,
      entidade: auth.entidadeNome,
      nif: auth.entidadeNif,
      numeroFactura: auth.numeroFactura,
      dataEmissao: auth.dataEmissao,
      produtos: auth.produtos,
      quantidade: auth.quantidade,
      revogado: auth.revogado,
      dataRevogacao: auth.dataRevogacao,
      motivoRevogacao: auth.motivoRevogacao,
      assinadoPor: auth.assinadoPor,
      codigosPautais: codigosPautais.map((cp) => cp.codigo).join(', '),
      codigosPautaisDetalhes: codigosPautais
    };
    
    return NextResponse.json(resposta);
    
  } catch (error) {
    console.error('Erro ao buscar autorização:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar autorização' },
      { status: 500 }
    );
  }
}
