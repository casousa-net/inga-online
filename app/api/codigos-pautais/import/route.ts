import { NextRequest, NextResponse } from 'next/server';
import { prisma } from 'lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { codigos } = await request.json();

    if (!Array.isArray(codigos) || codigos.length === 0) {
      return NextResponse.json(
        { error: 'Formato inválido. É necessário fornecer um array de códigos pautais.' },
        { status: 400 }
      );
    }

    // Validar todos os códigos
    for (const codigo of codigos) {
      if (!codigo.codigo || codigo.codigo.length !== 8 || !/^\d+$/.test(codigo.codigo)) {
        return NextResponse.json(
          { error: `Código inválido: ${codigo.codigo}. Os códigos pautais devem ter exatamente 8 dígitos.` },
          { status: 400 }
        );
      }
      if (!codigo.descricao) {
        return NextResponse.json(
          { error: `Descrição ausente para o código: ${codigo.codigo}` },
          { status: 400 }
        );
      }
    }

    // Criar ou atualizar códigos pautais em massa
    const results = { 
      created: 0, 
      updated: 0, 
      skipped: 0, 
      errors: [] as Array<{codigo: string, error: string}>
    };
    
    console.log('Iniciando processamento de', codigos.length, 'códigos pautais');
    console.log('Primeiros 3 códigos para processar:', codigos.slice(0, 3));
    
    for (const codigo of codigos) {
      console.log('--------------------------------------------------');
      console.log('Processando código:', JSON.stringify(codigo, null, 2));
      console.log('Processando código:', codigo.codigo, '-', codigo.descricao);
      try {
        // Verificar se o código já existe
        const existing = await prisma.codigopautal.findUnique({
          where: { codigo: codigo.codigo }
        });
        
        if (existing) {
          // Atualizar código existente
          console.log('Atualizando código existente ID:', existing.id);
          await prisma.codigopautal.update({
            where: { id: existing.id },
            data: { descricao: codigo.descricao }
          });
          console.log('Código atualizado com sucesso');
          results.updated++;
        } else {
          // Criar novo código
          await prisma.codigopautal.create({
            data: {
              codigo: codigo.codigo,
              descricao: codigo.descricao,
              taxa: 0 // valor padrão
            }
          });
          results.created++;
        }
      } catch (error: any) {
        console.error(`Erro ao processar código ${codigo.codigo}:`, error);
        results.errors.push({
          codigo: codigo.codigo,
          error: error.message || 'Erro desconhecido'
        });
        results.skipped++;
      }
    }

    // Buscar todos os códigos após a importação para verificação
    const codigosAtualizados = await prisma.codigopautal.findMany({
      orderBy: { codigo: 'asc' },
      take: 5 // Pegar apenas os primeiros 5 para log
    });
    
    console.log('Primeiros 5 códigos no banco após importação:', JSON.stringify(codigosAtualizados, null, 2));
    
    const responseData = {
      message: `Importação concluída: ${results.created} criados, ${results.updated} atualizados, ${results.skipped} ignorados.`,
      results,
      totalNoBanco: await prisma.codigopautal.count(),
      amostraCodigos: codigosAtualizados
    };
    
    console.log('Resposta da API:', JSON.stringify(responseData, null, 2));
    
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Erro ao importar códigos pautais:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar a importação de códigos pautais.' },
      { status: 500 }
    );
  }
}
