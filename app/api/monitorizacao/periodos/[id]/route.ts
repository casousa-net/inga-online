import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Rota para solicitar reabertura de um período
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { action } = await req.json();
    const periodoId = parseInt(id);

    if (isNaN(periodoId)) {
      return NextResponse.json(
        { error: "ID do período inválido" },
        { status: 400 }
      );
    }

    // Verificar se o período existe
    const periodo = await prisma.periodoMonitorizacao.findUnique({
      where: { id: periodoId },
    });

    if (!periodo) {
      return NextResponse.json(
        { error: "Período não encontrado" },
        { status: 404 }
      );
    }

    // Atualizar o estado do período com base na ação
    if (action === "solicitar-reabertura") {
      await prisma.periodoMonitorizacao.update({
        where: { id: periodoId },
        data: { estado: "REABERTURA_SOLICITADA" },
      });
      return NextResponse.json({
        message: "Solicitação de reabertura enviada com sucesso",
      });
    } else if (action === "reavaliar") {
      await prisma.periodoMonitorizacao.update({
        where: { id: periodoId },
        data: { estado: "AGUARDANDO_REAVALIACAO" },
      });
      return NextResponse.json({
        message: "Solicitação de reavaliação enviada com sucesso",
      });
    } else {
      return NextResponse.json(
        { error: "Ação não reconhecida" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Erro ao processar solicitação:", error);
    return NextResponse.json(
      { error: "Erro ao processar solicitação" },
      { status: 500 }
    );
  }
}
