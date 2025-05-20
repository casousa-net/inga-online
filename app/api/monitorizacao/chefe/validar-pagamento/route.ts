import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { monitorId } = data;
    
    if (!monitorId) {
      return NextResponse.json(
        { error: "ID da monitorização não informado" },
        { status: 400 }
      );
    }

    try {
      // Atualizar o registro de monitorização para confirmar o pagamento
      await prisma.$executeRawUnsafe(`
        UPDATE monitorizacao 
        SET 
          rupePago = true,
          estadoProcesso = 'AGUARDANDO_VISITA'
        WHERE 
          id = ${Number(monitorId)}
      `);
      
      return NextResponse.json({
        message: "Pagamento validado com sucesso"
      });
    } catch (dbError) {
      console.error("Erro ao validar pagamento:", dbError);
      return NextResponse.json(
        { error: "Erro ao validar pagamento no banco de dados" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Erro ao validar pagamento:", error);
    return NextResponse.json(
      { error: "Erro ao validar pagamento" },
      { status: 500 }
    );
  }
}
