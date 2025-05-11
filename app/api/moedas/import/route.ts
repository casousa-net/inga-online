import { NextRequest, NextResponse } from 'next/server';
import { prisma } from 'lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { moedas } = await request.json();

    if (!Array.isArray(moedas) || moedas.length === 0) {
      return NextResponse.json(
        { error: 'Formato inválido. É necessário fornecer um array de moedas.' },
        { status: 400 }
      );
    }

    // Validar todas as moedas
    for (const moeda of moedas) {
      if (!moeda.nome) {
        return NextResponse.json(
          { error: 'Nome da moeda é obrigatório.' },
          { status: 400 }
        );
      }
      if (!moeda.simbolo) {
        return NextResponse.json(
          { error: `Símbolo ausente para a moeda: ${moeda.nome}` },
          { status: 400 }
        );
      }
      if (!moeda.taxaCambio || isNaN(Number(moeda.taxaCambio))) {
        return NextResponse.json(
          { error: `Taxa de câmbio inválida para a moeda: ${moeda.nome}` },
          { status: 400 }
        );
      }
    }

    // Criar ou atualizar moedas em massa
    const result = await Promise.all(
      moedas.map(async (moeda) => {
        return prisma.moeda.upsert({
          where: { nome: moeda.nome },
          update: { 
            simbolo: moeda.simbolo,
            taxaCambio: Number(moeda.taxaCambio)
          },
          create: {
            nome: moeda.nome,
            simbolo: moeda.simbolo,
            taxaCambio: Number(moeda.taxaCambio)
          }
        });
      })
    );

    return NextResponse.json({
      message: `${result.length} moedas importadas com sucesso.`,
      count: result.length
    });
  } catch (error: any) {
    console.error('Erro ao importar moedas:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar a importação de moedas.' },
      { status: 500 }
    );
  }
}
