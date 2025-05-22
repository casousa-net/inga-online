import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Endpoint simplificado para verificar apenas o estado do processo
export async function GET(
  request: Request,
  context: any
) {
  const { params } = context;
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID do processo inválido" },
        { status: 400 }
      );
    }

    // Consulta SQL direta para obter apenas os dados essenciais
    const processoResult = await prisma.$queryRaw`
      SELECT id, estadoProcesso, utenteId 
      FROM monitorizacao 
      WHERE id = ${id}
    `;

    // Verificar se o processo foi encontrado
    if (!processoResult || !Array.isArray(processoResult) || processoResult.length === 0) {
      return NextResponse.json(
        { error: "Processo não encontrado" },
        { status: 404 }
      );
    }

    const processo = processoResult[0] as any;

    // Formatar a resposta com apenas os dados essenciais
    const response = {
      id: processo.id,
      estadoProcesso: processo.estadoProcesso,
      utenteId: processo.utenteId,
      // Incluir informação sobre os estados do fluxo para ajudar no debug
      fluxoEstados: {
        aguardandoConfirmacaoPagamento: "AGUARDANDO_CONFIRMACAO_PAGAMENTO",
        aguardandoSelecaoTecnicos: "AGUARDANDO_SELECAO_TECNICOS",
        aguardandoVisita: "AGUARDANDO_VISITA",
        aguardandoDocumentoFinal: "AGUARDANDO_DOCUMENTO_FINAL",
        concluido: "CONCLUIDO"
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erro ao buscar detalhes do processo:", error);
    return NextResponse.json(
      { 
        error: "Erro ao buscar detalhes do processo",
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}
