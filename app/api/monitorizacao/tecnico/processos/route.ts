import { NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    console.log("[API] Iniciando busca de processos para técnico");
    
    // Tentar obter a sessão do usuário
    let tecnicoId: number;
    
    try {
      const session = await getServerSession(authOptions);
      console.log("[API] Sessão do usuário:", session ? "Autenticado" : "Não autenticado");
      
      // Verificar se o usuário está autenticado e tem a função de técnico
      if (session && session.user && session.user.role === "TECNICO") {
        tecnicoId = Number(session.user.id);
        console.log(`[API] Técnico autenticado, ID: ${tecnicoId}`);
      } else {
        // Para desenvolvimento, permitir o uso de um ID da query string
        const url = new URL(request.url);
        const tecnicoIdParam = url.searchParams.get('tecnicoId');
        tecnicoId = tecnicoIdParam ? parseInt(tecnicoIdParam) : 1; // Usar ID 1 como padrão
        console.log(`[API] Usando ID de técnico da query string: ${tecnicoId}`);
      }
    } catch (authError) {
      console.error("[API] Erro ao verificar autenticação:", authError);
      // Fallback para desenvolvimento
      tecnicoId = 1;
      console.log("[API] Usando ID de técnico padrão: 1");
    }
    
    // Verificar se a tabela de técnicos de monitorização existe e tem a estrutura correta
    try {
      // Verificar se a coluna 'nome' existe na tabela tecnicomonitorizacao
      const checkColumnResult = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM information_schema.COLUMNS 
        WHERE TABLE_NAME = 'tecnicomonitorizacao' 
        AND COLUMN_NAME = 'nome'
      `;
      
      const columnExists = Array.isArray(checkColumnResult) && 
                          checkColumnResult.length > 0 && 
                          (checkColumnResult[0] as any).count > 0;
      
      if (!columnExists) {
        console.log("[API] Adicionando coluna 'nome' à tabela tecnicomonitorizacao");
        try {
          await prisma.$executeRaw`
            ALTER TABLE tecnicomonitorizacao ADD COLUMN nome VARCHAR(255) NULL
          `;
        } catch (alterError) {
          console.error("[API] Falha ao adicionar coluna 'nome':", alterError);
        }
      }
    } catch (error) {
      console.log("[API] Falha ao verificar estrutura da tabela:", error);
      // Continuar mesmo com erro
    }

    // Buscar processos de monitorização onde o técnico foi selecionado
    console.log(`[API] Buscando processos para o técnico ID: ${tecnicoId}`);
    let processosResult;
    
    try {
      // Primeiro vamos verificar a estrutura da tabela monitorizacao
      console.log("[API] Verificando estrutura da tabela monitorizacao");
      
      try {
        const tableInfo = await prisma.$queryRaw`DESCRIBE monitorizacao`;
        console.log("[API] Estrutura da tabela monitorizacao:", JSON.stringify(tableInfo));
      } catch (describeError) {
        console.error("[API] Erro ao verificar estrutura da tabela:", describeError);
      }
      
      // Consulta extremamente simplificada para verificar se a tabela existe e tem dados
      console.log("[API] Tentando consulta básica para verificar a tabela");
      try {
        const basicCheck = await prisma.$queryRaw`SELECT COUNT(*) as count FROM monitorizacao`;
        console.log("[API] Contagem de registros na tabela monitorizacao:", JSON.stringify(basicCheck));
      } catch (countError) {
        console.error("[API] Erro na contagem básica:", countError);
      }
      
      // Consulta simplificada sem usar campos que podem não existir
      console.log("[API] Executando consulta principal simplificada");
      processosResult = await prisma.$queryRaw`
        SELECT 
          m.id, m.utenteId, m.periodoId, m.estadoProcesso, 
          m.dataPrevistaVisita, m.dataVisita, m.observacoesVisita,
          m.rupePath, m.rupeReferencia, m.rupePago,
          m.relatorioPath, m.parecerTecnicoPath, m.documentoFinalPath,
          u.nome as utenteNome, u.nif as utenteNif,
          p.numeroPeriodo as numeroPeriodo,
          p.tipoPeriodo as tipoPeriodo,
          (SELECT GROUP_CONCAT(CONCAT(tm.tecnicoId, ':', COALESCE(t.nome, u2.nome, tm.nome, CONCAT('Técnico ', tm.tecnicoId))) SEPARATOR '|')
           FROM tecnicomonitorizacao tm
           LEFT JOIN tecnico t ON tm.tecnicoId = t.id
           LEFT JOIN utente u2 ON tm.tecnicoId = u2.id
           WHERE tm.monitorizacaoId = m.id) as tecnicosSelecionados
        FROM monitorizacao m
        JOIN utente u ON m.utenteId = u.id
        JOIN periodomonitorizacao p ON m.periodoId = p.id
        WHERE EXISTS (SELECT 1 FROM tecnicomonitorizacao tm WHERE tm.monitorizacaoId = m.id AND tm.tecnicoId = ${tecnicoId})
        LIMIT 50
      `;
      
      console.log('[API] Resultado da consulta principal:', JSON.stringify(processosResult));
      
      console.log(`[API] Consulta SQL executada com sucesso, encontrados ${Array.isArray(processosResult) ? processosResult.length : 0} processos`);
      
      
      // Se temos resultados, buscar os técnicos para cada processo
      if (Array.isArray(processosResult) && processosResult.length > 0) {
        // Obter os IDs dos processos
        const processosIds = processosResult.map(p => p.id);
        
        console.log(`[API] Buscando técnicos para os processos: ${processosIds.join(', ')}`);
        
        // Buscar os técnicos para esses processos
        const tecnicosResult = await prisma.$queryRaw`
          SELECT tm.monitorizacaoId, tm.tecnicoId, 
                 COALESCE(tm.nome, t.nome, u2.nome, CONCAT('Técnico ', tm.tecnicoId)) as nome
          FROM tecnicomonitorizacao tm
          LEFT JOIN tecnico t ON tm.tecnicoId = t.id
          LEFT JOIN utente u2 ON tm.tecnicoId = u2.id
          WHERE tm.monitorizacaoId IN (${Prisma.join(processosIds)})
        `;
        
        console.log(`[API] Técnicos encontrados: ${JSON.stringify(tecnicosResult)}`);
        
        // Definir interface para o objeto de técnicos por processo
        interface TecnicosPorProcesso {
          [key: number]: string[];
        }
        
        // Agrupar os técnicos por processo
        const tecnicosPorProcesso: TecnicosPorProcesso = {};
        if (Array.isArray(tecnicosResult)) {
          for (const tecnico of tecnicosResult) {
            const monitorizacaoId = Number(tecnico.monitorizacaoId);
            if (!tecnicosPorProcesso[monitorizacaoId]) {
              tecnicosPorProcesso[monitorizacaoId] = [];
            }
            tecnicosPorProcesso[monitorizacaoId].push(
              `${tecnico.tecnicoId}:${tecnico.nome || 'Técnico ' + tecnico.tecnicoId}`
            );
          }
        }
        
        console.log(`[API] Técnicos agrupados por processo: ${JSON.stringify(tecnicosPorProcesso)}`);
        
        // Adicionar os técnicos aos processos
        for (const processo of processosResult) {
          const processoId = Number(processo.id);
          processo.tecnicosSelecionados = tecnicosPorProcesso[processoId] ? 
            tecnicosPorProcesso[processoId].join('|') : 
            null;
          console.log(`[API] Processo ${processoId}: tecnicosSelecionados = ${processo.tecnicosSelecionados}`);
        }
      }
    } catch (error) {
      console.error("[API] Erro na consulta SQL principal:", error);
      
      try {
        // Tentar uma consulta extremamente simples como fallback
        console.log("[API] Tentando consulta SQL extremamente simplificada como fallback");
        processosResult = await prisma.$queryRaw`
          SELECT 
            m.id, m.utenteId, m.estadoProcesso, 
            m.dataPrevistaVisita, m.dataVisita,
            u.nome as utenteNome, u.nif as utenteNif
          FROM monitorizacao m
          JOIN utente u ON m.utenteId = u.id
          LIMIT 10
        `;
        
        console.log(`[API] Consulta SQL fallback executada com sucesso, encontrados ${Array.isArray(processosResult) ? processosResult.length : 0} processos`);
      } catch (fallbackError) {
        console.error("[API] Erro na consulta SQL de fallback:", fallbackError);
        // Se ambas as consultas falharem, retornar um array vazio
        processosResult = [];
        console.log("[API] Retornando array vazio devido a erros nas consultas");
      }
    }

    // Definir tipos para os dados
    type TecnicoSelecionado = {
      id: number;
      nome: string;
    };

    type ProcessoRaw = {
      id: number;
      utenteId: number;
      utenteNome: string;
      utenteNif: string;
      numeroPeriodo: number;
      tipoPeriodo: string;
      estadoProcesso: string;
      rupePath?: string | null;
      rupeReferencia?: string | null;
      rupePago?: number;
      dataPrevistaVisita?: Date | null;
      dataVisita?: Date | null;
      observacoesVisita?: string | null;
      relatorioPath?: string | null;
      parecerTecnicoPath?: string | null;
      documentoFinalPath?: string | null;
      tecnicosSelecionados?: string;
    };

    // Formatar os dados para o frontend
    console.log("[API] Formatando dados para o frontend");
    const processos = Array.isArray(processosResult) ? (processosResult as ProcessoRaw[]).map((processo: ProcessoRaw) => {
      // Processar os técnicos selecionados da string concatenada
      let tecnicosSelecionados: TecnicoSelecionado[] = [];
      
      if (processo.tecnicosSelecionados) {
        try {
          tecnicosSelecionados = processo.tecnicosSelecionados.split('|').map((tecnico: string) => {
            const [id, nome] = tecnico.split(':');
            return { id: parseInt(id), nome: nome || `Técnico ${id}` };
          });
          console.log(`[API] Processo ${processo.id}: ${tecnicosSelecionados.length} técnicos processados`);
        } catch (error) {
          console.error(`[API] Erro ao processar técnicos para processo ${processo.id}:`, error);
        }
      } else {
        console.log(`[API] Processo ${processo.id}: Nenhum técnico encontrado`);
      }

      return {
        id: processo.id,
        utenteId: processo.utenteId,
        utenteNome: processo.utenteNome || 'Nome não disponível',
        utenteNif: processo.utenteNif || 'NIF não disponível',
        numeroPeriodo: processo.numeroPeriodo || 1,
        tipoPeriodo: processo.tipoPeriodo || 'SEMESTRAL',
        estadoProcesso: processo.estadoProcesso,
        rupePath: processo.rupePath,
        rupePago: processo.rupePago === 1,
        dataPrevistaVisita: processo.dataPrevistaVisita,
        dataVisita: processo.dataVisita,
        observacoesVisita: processo.observacoesVisita,
        relatorioPath: processo.relatorioPath,
        parecerTecnicoPath: processo.parecerTecnicoPath,
        documentoFinalPath: processo.documentoFinalPath,
        tecnicosSelecionados
      };
    }) : [];

    console.log(`[API] Encontrados ${processos.length} processos para o técnico`);
    return NextResponse.json(processos);
  } catch (error) {
    console.error("[API] Erro ao buscar processos de monitorização:", error);
    return NextResponse.json(
      { error: "Erro ao buscar processos de monitorização" },
      { status: 500 }
    );
  }
}
