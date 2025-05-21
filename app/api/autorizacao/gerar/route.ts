import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      solicitacaoId, 
      tipoAutorizacao, 
      numeroFactura, 
      produtos, 
      quantidade, 
      codigosPautais 
    } = body;
    
    if (!solicitacaoId) {
      return NextResponse.json({ error: 'ID da solicitação não fornecido' }, { status: 400 });
    }
    
    // Verificar se a solicitação existe e está aprovada
    const solicitacao = await prisma.solicitacaoautorizacao.findUnique({
      where: { id: solicitacaoId },
      include: { utente: true }
    });
    
    if (!solicitacao) {
      return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 });
    }
    
    if (!solicitacao.aprovadoPorDirecao) {
      return NextResponse.json({ error: 'Solicitação não está aprovada pela Direção' }, { status: 400 });
    }
    
    // Verificar se já existe uma autorização para esta solicitação
    const autorizacaoExistente = await prisma.$queryRaw`
      SELECT id FROM autorizacao WHERE solicitacaoId = ${solicitacaoId}
    `;
    
    if (autorizacaoExistente && Array.isArray(autorizacaoExistente) && autorizacaoExistente.length > 0) {
      return NextResponse.json({ error: 'Já existe uma autorização para esta solicitação' }, { status: 400 });
    }
    
    // Gerar número de autorização único baseado no ano atual e um contador sequencial
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
    
    // Criar a autorização ambiental
    const autorizacao = await prisma.$executeRaw`
      INSERT INTO autorizacao (
        numeroAutorizacao, 
        tipoAutorizacao, 
        solicitacaoId, 
        dataEmissao, 
        numeroFactura, 
        produtos, 
        quantidade, 
        revogado
      ) VALUES (
        ${numeroAutorizacao},
        ${tipoAutorizacao || 'IMPORTAÇÃO'},
        ${solicitacaoId},
        ${new Date()},
        ${numeroFactura || ''},
        ${produtos || ''},
        ${quantidade || ''},
        false
      )
    `;
    
    // Obter o ID da autorização recém-criada
    const novaAutorizacao = await prisma.$queryRaw<{ id: number }[]>`
      SELECT id FROM autorizacao WHERE numeroAutorizacao = ${numeroAutorizacao}
    `;
    
    if (!novaAutorizacao || Array.isArray(novaAutorizacao) && novaAutorizacao.length === 0) {
      return NextResponse.json({ error: 'Erro ao criar autorização' }, { status: 500 });
    }
    
    const autorizacaoId = (novaAutorizacao[0] as { id: number }).id;
    
    // Adicionar códigos pautais à autorização
    if (codigosPautais && Array.isArray(codigosPautais) && codigosPautais.length > 0) {
      for (const cp of codigosPautais) {
        await prisma.$executeRaw`
          INSERT INTO codigopautalautorizacao (
            autorizacaoId,
            codigo,
            descricao
          ) VALUES (
            ${autorizacaoId},
            ${cp.codigo},
            ${cp.descricao}
          )
        `;
      }
    }
    
    // Atualizar status da solicitação
    await prisma.solicitacaoautorizacao.update({
      where: { id: solicitacaoId },
      data: { status: 'Aprovado' }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Autorização ambiental gerada com sucesso',
      numeroAutorizacao,
      autorizacaoId
    });
    
  } catch (error) {
    console.error('Erro ao gerar autorização ambiental:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar autorização ambiental' },
      { status: 500 }
    );
  }
}
