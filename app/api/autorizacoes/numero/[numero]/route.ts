import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  context: any
) {
  const { params } = context;
  try {
    const numero = params.numero;
    console.log('Buscando autorização pelo número:', numero);
    
    // Buscar a autorização pelo número
    const autorizacoes = await prisma.$queryRaw`
      SELECT 
        a.*, 
        sa.id as solicitacaoId,
        u.nome as entidadeNome,
        u.nif as entidadeNif
      FROM autorizacao a
      JOIN solicitacaoautorizacao sa ON a.solicitacaoId = sa.id
      JOIN utente u ON sa.utenteId = u.id
      WHERE a.numeroAutorizacao = ${numero}
      LIMIT 1
    `;
    
    console.log('Resultado da consulta:', autorizacoes);
    
    if (!autorizacoes || (Array.isArray(autorizacoes) && autorizacoes.length === 0)) {
      console.log('Autorização não encontrada para o número:', numero);
      return NextResponse.json(
        { error: 'Autorização não encontrada' },
        { status: 404 }
      );
    }
    
    // Converter para objeto único se for array
    const auth = Array.isArray(autorizacoes) ? autorizacoes[0] : autorizacoes;
    
    // Buscar códigos pautais associados
    const codigosPautais = await prisma.$queryRaw`
      SELECT codigo, descricao FROM codigopautalautorizacao
      WHERE autorizacaoId = ${auth.id}
    `;
    
    console.log('Códigos pautais encontrados:', codigosPautais);
    
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
      codigosPautais: Array.isArray(codigosPautais) ? codigosPautais.map((cp: any) => cp.codigo).join(', ') : '',
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
