import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const rupes = await prisma.solicitacaoautorizacao.findMany({
      where: {
        rupeReferencia: { not: null },
        rupeValidado: true
      },
      select: {
        id: true,
        tipo: true,
        status: true,
        valorTotalKz: true,
        createdAt: true,
        rupeReferencia: true,
        rupeDocumento: true,
        utente: {
          select: {
            nome: true,
            nif: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Adicionar caminho completo do documento RUPE
    const rupesWithFullPath = rupes.map(rupe => ({
      ...rupe,
      rupeDocumento: rupe.rupeDocumento ? `/uploads/rupe/${rupe.rupeDocumento}` : null
    }));

    return NextResponse.json(rupesWithFullPath);
  } catch (error) {
    console.error('Erro ao buscar RUPEs:', error);
    return NextResponse.json({ error: 'Erro ao buscar RUPEs' }, { status: 500 });
  }
}
