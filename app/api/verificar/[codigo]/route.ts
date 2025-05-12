import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { addDays } from 'date-fns';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  context: { params: { codigo: string } }
) {
  try {
    const codigo = context.params.codigo;
    
    if (!codigo) {
      return NextResponse.json(
        { error: 'Código de verificação não fornecido' },
        { status: 400 }
      );
    }
    
    // Buscar a autorização pelo código
    const autorizacao = await prisma.$queryRaw`
      SELECT 
        aa.*, 
        sa.id as solicitacaoId,
        u.nome as entidadeNome,
        u.nif as entidadeNif
      FROM autorizacaoambiental aa
      JOIN solicitacaoautorizacao sa ON aa.solicitacaoId = sa.id
      JOIN utente u ON sa.utenteId = u.id
      WHERE aa.numeroAutorizacao = ${codigo}
      LIMIT 1
    `;
    
    if (!autorizacao || (Array.isArray(autorizacao) && autorizacao.length === 0)) {
      return NextResponse.json(
        { error: 'Autorização não encontrada' },
        { status: 404 }
      );
    }
    
    // Converter para objeto único se for array
    const auth = Array.isArray(autorizacao) ? autorizacao[0] : autorizacao as any;
    
    // Calcular a data de validade (180 dias após a emissão)
    const dataValidade = addDays(new Date(auth.dataEmissao), 180);
    const hoje = new Date();
    
    // Determinar o status da autorização
    let status: 'valido' | 'expirado' | 'revogado' = 'valido';
    
    if (auth.revogado) {
      status = 'revogado';
    } else if (dataValidade < hoje) {
      status = 'expirado';
    }
    
    // Buscar códigos pautais associados
    const codigosPautais = await prisma.$queryRaw<{codigo: string}[]>`
      SELECT codigo FROM codigopautalautorizacao
      WHERE autorizacaoId = ${auth.id}
    `;
    
    // Formatar os dados para retornar
    const resposta = {
      id: auth.id,
      numeroAutorizacao: auth.numeroAutorizacao,
      tipoAutorizacao: auth.tipoAutorizacao,
      entidade: auth.entidadeNome,
      nif: auth.entidadeNif,
      numeroFactura: auth.numeroFactura,
      dataEmissao: auth.dataEmissao,
      dataValidade: dataValidade.toISOString(),
      produtos: auth.produtos,
      quantidade: auth.quantidade,
      codigosPautais: codigosPautais.map((cp: {codigo: string}) => cp.codigo).join(', '),
      status
    };
    
    return NextResponse.json(resposta);
    
  } catch (error) {
    console.error('Erro ao verificar autorização:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar autorização' },
      { status: 500 }
    );
  }
}
