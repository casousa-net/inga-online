import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { monitorizacaoId } = await req.json();
    
    if (!monitorizacaoId) {
      return NextResponse.json({ error: "ID da monitorização não informado" }, { status: 400 });
    }

    // Atualiza o registro para marcar como pago e muda o estado do processo para aguardando seleção de técnicos pela Direção
    await prisma.monitorizacao.update({
      where: { id: Number(monitorizacaoId) },
      data: {
        rupePago: true,
        estadoProcesso: "AGUARDANDO_SELECAO_TECNICOS"
      }
    });

    return NextResponse.json({ message: "Pagamento do RUPE confirmado com sucesso" });
  } catch (error) {
    console.error("Erro ao confirmar pagamento do RUPE:", error);
    return NextResponse.json({ error: "Erro ao confirmar pagamento do RUPE" }, { status: 500 });
  }
}
