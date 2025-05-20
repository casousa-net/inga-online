import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Obter o ID da monitorização da query string
    const url = new URL(request.url);
    const monitorId = url.searchParams.get('monitorId');
    
    if (!monitorId) {
      return NextResponse.json(
        { error: "ID da monitorização é obrigatório" },
        { status: 400 }
      );
    }
    
    // Buscar informações da visita
    const monitorizacao = await prisma.monitorizacao.findUnique({
      where: { id: Number(monitorId) },
    });
    
    if (!monitorizacao) {
      return NextResponse.json(
        { error: "Monitorização não encontrada" },
        { status: 404 }
      );
    }
    
    // Tentar buscar informações do técnico que realizou a visita
    let tecnicoVisita = null;
    try {
      // Verificar se a tabela visitatecnico existe
      const tableExists = await prisma.$queryRaw`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name = 'visitatecnico'
      `;
      
      // Se a tabela existir, buscar informações
      if (Array.isArray(tableExists) && tableExists[0] && tableExists[0].count > 0) {
        tecnicoVisita = await prisma.$queryRaw`
          SELECT * FROM visitatecnico 
          WHERE monitorizacaoId = ${Number(monitorId)}
          LIMIT 1
        `;
        
        if (Array.isArray(tecnicoVisita) && tecnicoVisita.length > 0) {
          tecnicoVisita = tecnicoVisita[0];
        } else {
          tecnicoVisita = null;
        }
      }
    } catch (error) {
      console.error("Erro ao buscar informações do técnico da visita:", error);
      // Não retornar erro, apenas continuar sem as informações do técnico
    }
    
    // Buscar informações dos técnicos selecionados
    const tecnicosSelecionados = await prisma.$queryRaw`
      SELECT tm.tecnicoId, u.nome as tecnicoNome
      FROM tecnicomonitorizacao tm
      JOIN utente u ON tm.tecnicoId = u.id
      WHERE tm.monitorizacaoId = ${Number(monitorId)}
    `;
    
    // Buscar informações de quem marcou a visita
    let responsavelMarcacao = null;
    try {
      // Aqui poderia buscar em uma tabela específica, mas como não temos essa informação,
      // vamos usar o chefe do departamento como responsável pela marcação
      const chefe = await prisma.$queryRaw`
        SELECT u.id, u.nome
        FROM utente u
        WHERE u.role = 'chefe' AND u.departamento = 'monitorizacao'
        LIMIT 1
      `;
      
      if (Array.isArray(chefe) && chefe.length > 0) {
        responsavelMarcacao = chefe[0];
      }
    } catch (error) {
      console.error("Erro ao buscar informações do responsável pela marcação:", error);
      // Não retornar erro, apenas continuar sem as informações do responsável
    }
    
    // Buscar informações adicionais da visita na tabela visitatecnico
    let dataPrevistaVisita = null;
    let dataVisita = null;
    let observacoesVisita = null;
    
    try {
      const visitaInfo = await prisma.$queryRaw`
        SELECT dataPrevista, dataRealizada, observacoes 
        FROM visitatecnico 
        WHERE monitorizacaoId = ${Number(monitorId)}
        LIMIT 1
      `;
      
      if (Array.isArray(visitaInfo) && visitaInfo.length > 0) {
        dataPrevistaVisita = visitaInfo[0].dataPrevista;
        dataVisita = visitaInfo[0].dataRealizada;
        observacoesVisita = visitaInfo[0].observacoes;
      }
    } catch (error) {
      console.error("Erro ao buscar informações adicionais da visita:", error);
      // Continuar sem as informações adicionais
    }
    
    return NextResponse.json({
      monitorizacao: {
        id: monitorizacao.id,
        estadoProcesso: monitorizacao.estadoProcesso,
        dataPrevistaVisita,
        dataVisita,
        observacoesVisita
      },
      tecnicoVisita,
      tecnicosSelecionados: Array.isArray(tecnicosSelecionados) ? tecnicosSelecionados : [],
      responsavelMarcacao
    });
  } catch (error) {
    console.error("Erro ao buscar informações da visita:", error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
}
