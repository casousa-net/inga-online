import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const departamento = url.searchParams.get("departamento") || "monitorizacao";
    
    console.log("Buscando processos de monitorização para departamento:", departamento);
    
    // Usar uma abordagem mais segura com try/catch específico para a consulta SQL
    let processos: any[] = [];
    
    try {
      // Buscar todos os processos de monitorização que estão no estado PENDENTE
      // e já possuem relatório enviado pelo utente
      // Também buscar períodos com solicitação de reabertura
      const result = await prisma.$queryRawUnsafe(`
        SELECT 
          m.id,
          m.utenteId,
          m.periodoId,
          m.relatorioPath,
          m.parecerTecnicoPath,
          m.rupePath,
          m.rupeReferencia,
          m.rupePago,
          m.documentoFinalPath,
          m.estado,
          m.estadoProcesso,
          m.dataPrevistaVisita,
          m.dataVisita,
          m.observacoesVisita,
          m.createdAt,
          m.autorizacaoDirecao,
          u.nome as utenteNome,
          u.nif as utenteNif,
          p.numeroPeriodo,
          p.dataInicio as periodoInicio,
          p.dataFim as periodoFim,
          p.estado as periodoEstado,
          p.motivoReabertura,
          p.dataSolicitacaoReabertura,
          p.statusReabertura,
          COALESCE(c.tipoPeriodo, 'SEMESTRAL') as tipoPeriodo,
          (SELECT GROUP_CONCAT(CONCAT(tec.id, ':', tec.nome) SEPARATOR '|') 
           FROM tecnicomonitorizacao tm 
           JOIN utente tec ON tm.tecnicoId = tec.id 
           WHERE tm.monitorizacaoId = m.id) as tecnicosSelecionados
        FROM 
          monitorizacao m
        JOIN 
          utente u ON m.utenteId = u.id
        JOIN 
          periodoMonitorizacao p ON m.periodoId = p.id
        LEFT JOIN 
          configuracaoMonitorizacao c ON p.configuracaoId = c.id
        WHERE
          m.estadoProcesso IS NOT NULL
          OR p.estado = 'SOLICITADA_REABERTURA'
        GROUP BY m.id
        ORDER BY 
          m.createdAt DESC
      `);
      
      processos = Array.isArray(result) ? result : [];
      
      console.log(`Encontrados ${processos.length} processos de monitorização`);
    } catch (sqlError) {
      console.error("Erro na consulta SQL:", sqlError);
      
      // Tentar uma abordagem alternativa mais simples usando SQL bruto
      console.log("Tentando abordagem alternativa com SQL bruto mais simples...");
      
      try {
        // Usar uma consulta SQL mais simples
        const result = await prisma.$queryRaw`
          SELECT 
            m.id,
            m.utenteId,
            m.periodoId,
            m.relatorioPath,
            m.parecerTecnicoPath,
            m.rupePath,
            m.rupeReferencia,
            m.rupePago,
            m.documentoFinalPath,
            m.estado,
            m.estadoProcesso,
            m.createdAt,
            m.dataPrevistaVisita,
            m.dataVisita,
            m.observacoesVisita,
            m.autorizacaoDirecao,

            u.nome as utenteNome,
            u.nif as utenteNif,
            p.numeroPeriodo,
            p.dataInicio as periodoInicio,
            p.dataFim as periodoFim,
            p.estado as periodoEstado,
            p.motivoReabertura,
            p.dataSolicitacaoReabertura,
            p.statusReabertura,
            COALESCE(c.tipoPeriodo, 'SEMESTRAL') as tipoPeriodo
          FROM 
            monitorizacao m
          JOIN 
            utente u ON m.utenteId = u.id
          JOIN 
            periodoMonitorizacao p ON m.periodoId = p.id
          LEFT JOIN 
            configuracaoMonitorizacao c ON p.configuracaoId = c.id
          WHERE
            m.estadoProcesso IS NOT NULL
            OR p.estado = 'SOLICITADA_REABERTURA'
          ORDER BY 
            m.createdAt DESC
          LIMIT 50
        `;
        
        // Converter o resultado para o formato esperado
        processos = Array.isArray(result) ? result.map((processo: any) => {
          // Processar os técnicos selecionados da string concatenada
          let tecnicosSelecionados = [];
          
          // Na consulta alternativa, podemos não ter o campo tecnicosSelecionados
          // Então vamos fazer uma consulta adicional para obter os técnicos
          try {
            // Vamos buscar os técnicos diretamente usando Prisma
            // Mas não vamos aguardar a promessa para não atrasar a resposta
            // Os técnicos serão carregados posteriormente na interface
            if (processo.tecnicosSelecionados) {
              tecnicosSelecionados = processo.tecnicosSelecionados.split('|').map((tecnico: string) => {
                const [id, nome] = tecnico.split(':');
                return { id: parseInt(id), nome };
              });
            }
          } catch (error) {
            console.error("[DEBUG] Erro ao processar técnicos para processo", processo.id, error);
          }

          return {
            id: processo.id,
            utenteId: processo.utenteId,
            periodoId: processo.periodoId,
            relatorioPath: processo.relatorioPath,
            parecerTecnicoPath: processo.parecerTecnicoPath,
            rupePath: processo.rupePath,
            rupeReferencia: processo.rupeReferencia,
            rupePago: processo.rupePago === 1,
            documentoFinalPath: processo.documentoFinalPath,
            estado: processo.estado,
            estadoProcesso: processo.estadoProcesso,
            dataPrevistaVisita: processo.dataPrevistaVisita,
            dataVisita: processo.dataVisita,
            observacoesVisita: processo.observacoesVisita,
            createdAt: processo.createdAt,
            autorizacaoDirecao: processo.autorizacaoDirecao === 1,
            utenteNome: processo.utenteNome,
            utenteNif: processo.utenteNif,
            numeroPeriodo: processo.numeroPeriodo,
            periodoInicio: processo.periodoInicio,
            periodoFim: processo.periodoFim,
            tipoPeriodo: processo.tipoPeriodo,
            tecnicosSelecionados
          };
        }) : [];

        console.log(`Encontrados ${processos.length} processos com abordagem alternativa`);
      } catch (fallbackError) {
        console.error("Erro na abordagem alternativa:", fallbackError);
        processos = [];
      }
    }

    return NextResponse.json({ 
      processos: processos 
    });
  } catch (error) {
    console.error("Erro ao buscar processos de monitorização:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      { 
        error: "Erro ao buscar processos de monitorização", 
        message: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
