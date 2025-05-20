import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { monitorId, acao, motivoRejeicao } = data;
    
    if (!monitorId || !acao) {
      return NextResponse.json(
        { error: "ID da monitorização e ação são obrigatórios" },
        { status: 400 }
      );
    }

    // Validar a ação
    if (!["APROVAR", "REJEITAR"].includes(acao)) {
      return NextResponse.json(
        { error: "Ação inválida. Use APROVAR ou REJEITAR" },
        { status: 400 }
      );
    }

    // Se for rejeição, o motivo é obrigatório
    if (acao === "REJEITAR" && !motivoRejeicao) {
      return NextResponse.json(
        { error: "Motivo de rejeição é obrigatório" },
        { status: 400 }
      );
    }

    try {
      // Verificar se a monitorização existe
      const monitorizacao = await prisma.$queryRaw`
        SELECT id, estado, estadoProcesso FROM monitorizacao WHERE id = ${Number(monitorId)}
      `;
      
      if (!Array.isArray(monitorizacao) || monitorizacao.length === 0) {
        return NextResponse.json(
          { error: "Monitorização não encontrada" },
          { status: 404 }
        );
      }
      
      // Definir o novo estado com base na ação
      const novoEstado = acao === "APROVAR" ? "APROVADO" : "REJEITADO";
      const novoEstadoProcesso = acao === "APROVAR" ? "AGUARDANDO_DOCUMENTO_FINAL" : "CONCLUIDO";
      
      // Atualizar o registro de monitorização
      await prisma.$executeRawUnsafe(`
        UPDATE monitorizacao 
        SET 
          estado = '${novoEstado}',
          estadoProcesso = '${novoEstadoProcesso}',
          ${acao === "APROVAR" ? "autorizacaoDirecao = true," : ""}
          ${acao === "REJEITAR" && motivoRejeicao ? `motivoRejeicao = '${motivoRejeicao.replace(/'/g, "''")}',` : ""}
          updatedAt = NOW()
        WHERE 
          id = ${Number(monitorId)}
      `);
      
      // Se for aprovação, podemos gerar um documento final ou preparar para a próxima etapa
      if (acao === "APROVAR") {
        // Aqui você pode implementar a lógica para gerar o documento final
        // ou preparar para a próxima etapa do fluxo
      }
      
      return NextResponse.json({
        message: acao === "APROVAR" ? "Processo aprovado com sucesso" : "Processo rejeitado com sucesso",
        estado: novoEstado,
        estadoProcesso: novoEstadoProcesso
      });
    } catch (dbError) {
      console.error("Erro ao atualizar registro no banco de dados:", dbError);
      return NextResponse.json(
        { error: "Erro ao salvar informações no banco de dados" },
        { status: 500 }
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
