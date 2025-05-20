import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { monitorId, dataPrevista } = data;
    
    if (!monitorId || !dataPrevista) {
      return NextResponse.json(
        { error: "ID da monitorização e data prevista são obrigatórios" },
        { status: 400 }
      );
    }

    // Converter a string de data para objeto Date
    const dataVisita = new Date(dataPrevista);
    
    // Verificar se a data é válida
    if (isNaN(dataVisita.getTime())) {
      return NextResponse.json(
        { error: "Data inválida" },
        { status: 400 }
      );
    }

    try {
      // Verificar se a monitorização existe
      const monitorizacao = await prisma.monitorizacao.findUnique({
        where: { id: Number(monitorId) }
      });
      
      if (!monitorizacao) {
        return NextResponse.json(
          { error: "Monitorização não encontrada" },
          { status: 404 }
        );
      }
      
      // Verificar se o processo está no estado correto
      if (monitorizacao.estadoProcesso !== "AGUARDANDO_VISITA") {
        return NextResponse.json(
          { error: "Este processo não está no estado correto para marcar visita" },
          { status: 400 }
        );
      }
      
      // Verificar se existem técnicos selecionados para este processo
      const tecnicosSelecionados = await prisma.$queryRaw<{ count: number }[]>`
        SELECT COUNT(*) as count FROM tecnicomonitorizacao 
        WHERE monitorizacaoId = ${Number(monitorId)}
      `;
      
      if (!tecnicosSelecionados || tecnicosSelecionados[0].count < 1) {
        return NextResponse.json(
          { error: "Não há técnicos selecionados para este processo. A Direção precisa selecionar os técnicos primeiro." },
          { status: 400 }
        );
      }
      
      // Atualizar a data prevista da visita usando SQL bruto para evitar problemas de tipagem
      await prisma.$executeRaw`
        UPDATE monitorizacao 
        SET 
          dataPrevistaVisita = ${dataVisita},
          updatedAt = NOW()
        WHERE 
          id = ${Number(monitorId)}
      `;
      
      return NextResponse.json({
        message: "Visita técnica marcada com sucesso"
      });
    } catch (dbError) {
      console.error("Erro ao marcar visita:", dbError);
      return NextResponse.json(
        { error: "Erro ao marcar visita no banco de dados" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Erro ao marcar visita:", error);
    return NextResponse.json(
      { error: "Erro ao marcar visita" },
      { status: 500 }
    );
  }
}
