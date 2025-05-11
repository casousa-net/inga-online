import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Buscar todos os processos sem filtros
    const processos = await prisma.solicitacaoAutorizacao.findMany({
      select: {
        id: true,
        tipo: true,
        status: true,
        valorTotalKz: true,
        createdAt: true,
        utente: {
          select: {
            nome: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('Total de processos no banco:', processos.length);
    
    return NextResponse.json({
      total: processos.length,
      processos: processos
    });
  } catch (error) {
    console.error('Erro ao buscar processos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar processos' },
      { status: 500 }
    );
  }
}
