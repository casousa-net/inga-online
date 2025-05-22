import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  context: any
) {
  const { params } = context;
  try {
    console.log('Buscando autorização com ID:', params.id);
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      console.log('ID inválido:', params.id);
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }
    
    console.log('ID convertido para número:', id);
    
    // Buscar a autorização usando SQL bruto para evitar problemas de tipagem
    console.log('Buscando autorização com ID:', id);
    const [autorizacao] = await prisma.$queryRaw<any[]>`
      SELECT 
        a.*, 
        sa.id as solicitacaoId,
        u.nome as entidadeNome,
        u.nif as entidadeNif
      FROM autorizacao a
      JOIN solicitacaoautorizacao sa ON a.solicitacaoId = sa.id
      JOIN utente u ON sa.utenteId = u.id
      WHERE a.id = ${id}
      LIMIT 1
    `;
    
    console.log('Resultado da consulta:', autorizacao);
    
    if (!autorizacao) {
      console.log('Autorização não encontrada para o ID:', id);
      return NextResponse.json(
        { error: 'Autorização não encontrada' },
        { status: 404 }
      );
    }
    
    // Gerar o número do processo no formato PA-000000
    const numeroProcesso = `PA-${String(autorizacao.solicitacaoId).padStart(6, '0')}`;
    console.log('Número do processo gerado:', numeroProcesso);
    
    // Buscar códigos pautais
    const codigosPautais = await prisma.$queryRaw<any[]>`
      SELECT codigo, descricao FROM codigopautalautorizacao
      WHERE autorizacaoId = ${id}
    `;
    
    // Obter a descrição dos códigos pautais
    const descricaoCodigosPautais = Array.isArray(codigosPautais) 
      ? codigosPautais.map((cp: any) => cp.descricao).join(', ')
      : '';
    
    // Formatar os dados para retornar
    const resposta = {
      id: autorizacao.id,
      numeroAutorizacao: autorizacao.numeroAutorizacao,
      tipoAutorizacao: autorizacao.tipoAutorizacao,
      solicitacaoId: autorizacao.solicitacaoId,
      entidade: autorizacao.entidadeNome,
      nif: autorizacao.entidadeNif,
      numeroFactura: autorizacao.numeroFactura,
      dataEmissao: autorizacao.dataEmissao,
      produtos: autorizacao.produtos,
      quantidade: autorizacao.quantidade,
      revogado: autorizacao.revogado,
      dataRevogacao: autorizacao.dataRevogacao,
      motivoRevogacao: autorizacao.motivoRevogacao,
      assinadoPor: autorizacao.assinadoPor,
      codigosPautais: codigosPautais.map((cp: any) => cp.codigo).join(', '),
      descricaoCodigosPautais: descricaoCodigosPautais,
      numeroProcesso: numeroProcesso,
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
