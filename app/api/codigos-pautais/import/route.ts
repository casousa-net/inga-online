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
    
    for (const codigo of codigos) {
      try {
        // Verificar se o código já existe
        const existing = await prisma.codigoPautal.findUnique({
          where: { codigo: codigo.codigo }
        });
        
        if (existing) {
          // Atualizar código existente
          await prisma.codigoPautal.update({
            where: { id: existing.id },
            data: { descricao: codigo.descricao }
          });
          results.updated++;
        } else {
          // Criar novo código
          await prisma.codigoPautal.create({
            data: {
              codigo: codigo.codigo,
              descricao: codigo.descricao
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

    return NextResponse.json({
      message: `Importação concluída: ${results.created} criados, ${results.updated} atualizados, ${results.skipped} ignorados.`,
      results
    });
  } catch (error: any) {
    console.error('Erro ao importar códigos pautais:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar a importação de códigos pautais.' },
      { status: 500 }
    );
  }
}
