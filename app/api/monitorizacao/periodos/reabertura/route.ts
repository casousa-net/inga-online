import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { periodoId, rupeReferencia } = data;
    
    if (!periodoId || !rupeReferencia) {
      return NextResponse.json(
        { error: "ID do período e número do RUPE são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se o período existe
    const existingPeriod = await prisma.periodomonitorizacao.findUnique({
      where: { id: periodoId },
      include: {
        configuracao: {
          include: {
            utente: true
          }
        }
      }
    });

    if (!existingPeriod) {
      return NextResponse.json(
        { error: "Período não encontrado" },
        { status: 404 }
      );
    }

    if (existingPeriod.estado !== "SOLICITADA_REABERTURA") {
      return NextResponse.json(
        { error: "Período não está com solicitação de reabertura pendente" },
        { status: 400 }
      );
    }

    // Calcular data de validade (7 dias a partir de agora)
    const dataValidade = new Date();
    dataValidade.setDate(dataValidade.getDate() + 7);

    // Atualizar o período com os dados da RUPE e reabrir usando SQL bruto para evitar erros de tipagem
    await prisma.$executeRaw`
      UPDATE periodomonitorizacao 
      SET 
        estado = 'ABERTO', 
        rupeReferencia = ${rupeReferencia}, 
        rupeValidado = true, 
        rupePago = true, 
        dataReaberturaAprovada = ${new Date()}, 
        dataValidadeReabertura = ${dataValidade}, 
        statusReabertura = 'APROVADA' 
      WHERE id = ${periodoId}
    `;
    
    // Buscar o período atualizado
    const periodoAtualizado = await prisma.periodomonitorizacao.findUnique({
      where: { id: periodoId },
      include: {
        configuracao: {
          include: {
            utente: true
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Período reaberto com sucesso por 7 dias',
      dataValidade,
      periodo: periodoAtualizado
    });
  } catch (error) {
    console.error("Erro ao aprovar reabertura do período:", error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
}
