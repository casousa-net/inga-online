import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('Buscando todas as autorizações...');
    
    // Verificar se a tabela autorizacao existe
    console.log('Verificando tabelas existentes...');
    const tabelas = await prisma.$queryRaw`SHOW TABLES`;
    console.log('Tabelas existentes:', tabelas);
    
    // Buscar todas as autorizações
    const autorizacoes = await prisma.$queryRaw`
      SELECT * FROM autorizacao
    `;
    
    console.log('Autorizações encontradas:', autorizacoes);
    
    return NextResponse.json({ 
      autorizacoes,
      count: Array.isArray(autorizacoes) ? autorizacoes.length : 0
    });
  } catch (error) {
    console.error('Erro ao buscar autorizações:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar autorizações' },
      { status: 500 }
    );
  }
}
