import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log("[DEBUG] Iniciando busca de processos para direção");
    
    // Primeiro, vamos verificar se a tabela monitorizacao existe
    try {
      console.log("[DEBUG] Verificando se a tabela monitorizacao existe");
      interface TableCount {
        count: number;
      }
      
      const tableExists = await prisma.$queryRawUnsafe<TableCount[]>(`
        SELECT COUNT(*) as count
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name = 'monitorizacao'
      `);
      
      console.log("[DEBUG] Tabela monitorizacao existe?", tableExists);
      
      if (!tableExists || tableExists.length === 0 || tableExists[0].count === 0) {
        console.log("[DEBUG] Tabela monitorizacao não encontrada, retornando array vazio");
        return NextResponse.json([]);
      }
      
    } catch (error) {
      console.error("[DEBUG] Erro ao verificar tabela monitorizacao:", error);
      return NextResponse.json(
        { error: "Erro ao verificar tabela de monitorização" },
        { status: 500 }
      );
    }
    
    // Tenta criar a tabela de técnicos de monitorização se não existir
    try {
      console.log("[DEBUG] Verificando se a tabela tecnicomonitorizacao existe");
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS tecnicomonitorizacao (
          id INT NOT NULL AUTO_INCREMENT,
          monitorizacaoId INT NOT NULL,
          tecnicoId INT NOT NULL,
          createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          PRIMARY KEY (id),
          INDEX tecnicomonitorizacao_monitorizacaoId_idx (monitorizacaoId),
          INDEX tecnicomonitorizacao_tecnicoId_idx (tecnicoId),
          CONSTRAINT tecnicomonitorizacao_monitorizacaoId_fkey FOREIGN KEY (monitorizacaoId) REFERENCES monitorizacao (id) ON DELETE RESTRICT ON UPDATE CASCADE,
          CONSTRAINT tecnicomonitorizacao_tecnicoId_fkey FOREIGN KEY (tecnicoId) REFERENCES utente (id) ON DELETE RESTRICT ON UPDATE CASCADE
        )
      `);
      console.log("[DEBUG] Tabela tecnicomonitorizacao verificada/criada com sucesso");
    } catch (error) {
      console.log("[DEBUG] Tabela tecnicomonitorizacao já existe ou erro ao criar:", error);
    }

    console.log("[DEBUG] Iniciando consulta SQL para buscar processos");
    
    // Variáveis que serão usadas tanto na consulta principal quanto na de fallback
    let columns: any[] = [];
    let monitorColumns: string[] = [];
    let createdAtColumn = 'NOW() as createdAt';
    let orderByClause = 'ORDER BY m.id DESC';
    let hasCreatedAt = false;
    
    try {
      // Primeiro, vamos verificar quais colunas existem na tabela monitorizacao
      console.log("[DEBUG] Verificando colunas da tabela monitorizacao...");
      columns = await prisma.$queryRawUnsafe<any[]>(`
        SHOW COLUMNS FROM monitorizacao
      `);
      
      // Extrair nomes das colunas
      monitorColumns = columns.map((c: any) => (c.Field || c.field || '').toString());
      console.log("[DEBUG] Colunas encontradas:", monitorColumns);
      
      // Verificar se a coluna createdAt existe
      hasCreatedAt = monitorColumns.some((c: string) => 
        c.toLowerCase() === 'createdat' || 
        c.toLowerCase() === 'created_at'
      );
      
      createdAtColumn = hasCreatedAt ? 'm.createdAt' : 'NOW() as createdAt';
      orderByClause = hasCreatedAt ? 'ORDER BY m.createdAt DESC' : 'ORDER BY m.id DESC';
      
      console.log(`[DEBUG] Verificado se a coluna createdAt existe: ${hasCreatedAt}`);
      console.log(`[DEBUG] Expressão SQL para createdAt: ${createdAtColumn}`);
      console.log(`[DEBUG] Cláusula de ordenação: ${orderByClause}`);
      
      console.log(`[DEBUG] Usando coluna de data: ${createdAtColumn} e ordenação: ${orderByClause}`);
      
      // Consulta simplificada apenas para verificar se a tabela tem dados
      const processosResult = await prisma.$queryRawUnsafe<any[]>(`
        SELECT 
          m.id, m.estadoProcesso, ${createdAtColumn},
          u.nome as utenteNome
        FROM monitorizacao m
        JOIN utente u ON m.utenteId = u.id
        ${orderByClause}
        LIMIT 10
      `);
      
      console.log("[DEBUG] Consulta SQL executada com sucesso, encontrados", processosResult.length, "processos");
      
      // Se chegou até aqui, a consulta básica funcionou, então tenta a consulta completa
      // Verificar os nomes das tabelas no banco de dados
      console.log("[DEBUG] Verificando nomes das tabelas...");
      const tableNames = await prisma.$queryRawUnsafe<any[]>(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name LIKE '%periodo%' OR table_name LIKE '%configuracao%'
      `);
      console.log("[DEBUG] Tabelas encontradas:", tableNames);
      
      // Tentar determinar os nomes corretos das tabelas
      let periodoTable = 'periodoMonitorizacao';
      let configTable = 'configuracaoMonitorizacao';
      
      for (const table of tableNames) {
        const tableName = table.TABLE_NAME || table.table_name;
        if (tableName && typeof tableName === 'string') {
          if (tableName.toLowerCase().includes('periodo')) {
            periodoTable = tableName;
          } else if (tableName.toLowerCase().includes('configuracao')) {
            configTable = tableName;
          }
        }
      }
      
      console.log(`[DEBUG] Usando tabelas: ${periodoTable} e ${configTable}`);
      
      // Verificar quais colunas existem
      const hasColumn = (colName: string) => {
        return monitorColumns.some((c: string) => c.toLowerCase() === colName.toLowerCase());
      };
      
      // Construir a lista de colunas para a consulta
      const selectColumns = [
        'm.id',
        hasColumn('utenteId') ? 'm.utenteId' : 'NULL as utenteId',
        hasColumn('periodoId') ? 'm.periodoId' : 'NULL as periodoId',
        hasColumn('estado') ? 'm.estado' : 'NULL as estado',
        hasColumn('estadoProcesso') ? 'm.estadoProcesso' : '"DESCONHECIDO" as estadoProcesso',
        hasColumn('rupePath') ? 'm.rupePath' : 'NULL as rupePath',
        hasColumn('rupeReferencia') ? 'm.rupeReferencia' : 'NULL as rupeReferencia',
        hasColumn('rupePago') ? 'm.rupePago' : '0 as rupePago',
        hasColumn('dataPrevistaVisita') ? 'm.dataPrevistaVisita' : 'NULL as dataPrevistaVisita',
        hasColumn('dataVisita') ? 'm.dataVisita' : 'NULL as dataVisita',
        hasColumn('observacoesVisita') ? 'm.observacoesVisita' : 'NULL as observacoesVisita',
        hasColumn('relatorioPath') ? 'm.relatorioPath' : 'NULL as relatorioPath',
        hasColumn('parecerTecnicoPath') ? 'm.parecerTecnicoPath' : 'NULL as parecerTecnicoPath',
        hasColumn('documentoFinalPath') ? 'm.documentoFinalPath' : 'NULL as documentoFinalPath',
        createdAtColumn,
        hasColumn('updatedAt') ? 'm.updatedAt' : 'NULL as updatedAt',
        'u.nome as utenteNome',
        'u.nif as utenteNif',
        'u.email as utenteEmail',
        'COALESCE(p.numeroPeriodo, 1) as numeroPeriodo',
        'COALESCE(c.tipoPeriodo, "SEMESTRAL") as tipoPeriodo'
      ];
      
      // Verificar se a tabela tecnicomonitorizacao existe
      let tecnicosQuery = 'NULL as tecnicosSelecionados';
      try {
        const tecnicoTableExists = await prisma.$queryRawUnsafe<any[]>(`
          SELECT COUNT(*) as count
          FROM information_schema.tables 
          WHERE table_schema = DATABASE() 
          AND table_name = 'tecnicomonitorizacao'
        `);
        
        if (tecnicoTableExists && tecnicoTableExists[0].count > 0) {
          tecnicosQuery = `(SELECT GROUP_CONCAT(CONCAT(tec.id, ':', tec.nome) SEPARATOR '|') 
            FROM tecnicomonitorizacao tm2 
            JOIN utente tec ON tm2.tecnicoId = tec.id 
            WHERE tm2.monitorizacaoId = m.id) as tecnicosSelecionados`;
        }
      } catch (error) {
        console.error("[DEBUG] Erro ao verificar tabela tecnicomonitorizacao:", error);
      }
      
      selectColumns.push(tecnicosQuery);
      
      // Construir a consulta final para incluir tanto os processos de monitorizacao quanto os períodos com solicitação de reabertura
      const query = `
        SELECT * FROM (
          -- Consulta principal para processos com monitorizacao
          SELECT 
            ${selectColumns.join(',\n            ')}
          FROM monitorizacao m
          LEFT JOIN utente u ON m.utenteId = u.id
          LEFT JOIN ${periodoTable} p ON m.periodoId = p.id
          LEFT JOIN ${configTable} c ON p.configuracaoId = c.id
          GROUP BY m.id
          
          UNION ALL
          
          -- Consulta adicional para períodos com solicitação de reabertura sem monitorizacao
          SELECT 
            NULL as id,
            cm.utenteId as utenteId,
            p.id as periodoId,
            'PENDENTE' as estado,
            'AGUARDANDO_PARECER' as estadoProcesso,
            NULL as rupePath,
            NULL as rupeReferencia,
            0 as rupePago,
            NULL as dataPrevistaVisita,
            NULL as dataVisita,
            NULL as observacoesVisita,
            NULL as relatorioPath,
            NULL as parecerTecnicoPath,
            NULL as documentoFinalPath,
            COALESCE(p.dataSolicitacaoReabertura, NOW()) as createdAt,
            NULL as updatedAt,
            u.nome as utenteNome,
            u.nif as utenteNif,
            u.email as utenteEmail,
            p.numeroPeriodo as numeroPeriodo,
            COALESCE(cm.tipoPeriodo, 'SEMESTRAL') as tipoPeriodo,
            NULL as tecnicosSelecionados
          FROM 
            ${periodoTable} p
          JOIN 
            ${configTable} cm ON p.configuracaoId = cm.id
          JOIN 
            utente u ON cm.utenteId = u.id
          WHERE
            p.estado = 'SOLICITADA_REABERTURA'
            AND NOT EXISTS (
              SELECT 1 FROM monitorizacao m WHERE m.periodoId = p.id
            )
        ) AS todos_processos
        ORDER BY createdAt DESC
      `;
      
      console.log("[DEBUG] Consulta SQL completa:", query);
      
      const processosCompletos = await prisma.$queryRawUnsafe<any[]>(query);
      
      console.log("[DEBUG] Consulta completa executada com sucesso");
      
      // Formata os dados para o frontend
      const processosFormatados = await Promise.all(processosCompletos.map(async (processo: any) => {
        // Processar os técnicos selecionados da string concatenada
        let tecnicosSelecionados = [];
        
        if (processo.tecnicosSelecionados) {
          try {
            tecnicosSelecionados = processo.tecnicosSelecionados.split('|').map((tecnico: string) => {
              const [id, nome] = tecnico.split(':');
              return { id: parseInt(id), nome };
            });
          } catch (error) {
            console.error("[DEBUG] Erro ao processar técnicos para processo", processo.id, error);
          }
        }
        
        // Garantir que todos os campos necessários existam, mesmo que sejam nulos
        return {
          id: processo.id,
          utenteId: processo.utenteId,
          utenteNome: processo.utenteNome || 'Nome não disponível',
          utenteNif: processo.utenteNif || 'NIF não disponível',
          utenteEmail: processo.utenteEmail,
          periodoId: processo.periodoId,
          numeroPeriodo: processo.numeroPeriodo || 1,
          tipoPeriodo: processo.tipoPeriodo || 'SEMESTRAL',
          estadoProcesso: processo.estadoProcesso || 'AGUARDANDO_SELECAO_TECNICOS',
          rupePath: processo.rupePath,
          rupeReferencia: processo.rupeReferencia,
          rupePago: processo.rupePago === 1,
          dataPrevistaVisita: processo.dataPrevistaVisita,
          dataVisita: processo.dataVisita,
          observacoesVisita: processo.observacoesVisita,
          relatorioPath: processo.relatorioPath,
          parecerTecnicoPath: processo.parecerTecnicoPath,
          documentoFinalPath: processo.documentoFinalPath,
          createdAt: processo.createdAt instanceof Date 
            ? processo.createdAt.toISOString() 
            : new Date(processo.createdAt).toISOString(),
          tecnicosSelecionados
        };
      }));

      return NextResponse.json(processosFormatados);
      
    } catch (error) {
      console.error("[DEBUG] Erro na consulta SQL:", error);
      
      // Tenta uma consulta ainda mais básica para ver se consegue retornar algo
      try {
        console.log("[DEBUG] Tentando consulta de fallback mais simples");
        
        // Usar as mesmas funções e variáveis definidas anteriormente
        // Construir a consulta de fallback com apenas as colunas básicas
        const fallbackColumns = [
          'm.id'
        ];
        
        // Adicionar estadoProcesso se existir
        if (monitorColumns.some(c => c.toLowerCase() === 'estadoprocesso')) {
          fallbackColumns.push('m.estadoProcesso');
        } else {
          fallbackColumns.push('"DESCONHECIDO" as estadoProcesso');
        }
        
        // Adicionar coluna de data
        fallbackColumns.push(createdAtColumn);
        
        // Adicionar utenteId se existir
        if (monitorColumns.some(c => c.toLowerCase() === 'utenteid')) {
          fallbackColumns.push('m.utenteId');
        }
        
        const fallbackQuery = `
          SELECT 
            ${fallbackColumns.join(',\n            ')},
            u.nome as utenteNome, 
            u.nif as utenteNif
          FROM monitorizacao m
          LEFT JOIN utente u ON m.utenteId = u.id
          ${orderByClause}
          LIMIT 50
        `;
        
        console.log("[DEBUG] Consulta de fallback:", fallbackQuery);
        
        const fallbackResult = await prisma.$queryRawUnsafe<any[]>(fallbackQuery);
        
        console.log("[DEBUG] Consulta de fallback retornou:", fallbackResult.length, "resultados");
        
        // Buscar técnicos para cada processo
        const processosIds = fallbackResult.map(p => p.id);
        interface TecnicoInfo {
          id: number;
          nome: string;
        }
        
        interface TecnicosPorProcesso {
          [key: number]: TecnicoInfo[];
        }
        
        let tecnicosPorProcesso: TecnicosPorProcesso = {};
        
        if (processosIds.length > 0) {
          try {
            console.log('[DEBUG] Buscando técnicos para os processos...');
            
            // Verificar se a tabela tecnicomonitorizacao existe
            const checkTecnicoMonitTable = await prisma.$queryRawUnsafe(`
              SELECT COUNT(*) as count FROM information_schema.tables 
              WHERE table_schema = DATABASE() AND table_name = 'tecnicomonitorizacao'
            `);
            
            const tecnicoMonitTableExists = Array.isArray(checkTecnicoMonitTable) && 
              checkTecnicoMonitTable.length > 0 && 
              (checkTecnicoMonitTable[0] as any).count > 0;
            
            if (tecnicoMonitTableExists) {
              // Buscar técnicos da tabela utente (como feito na API de períodos)
              const tecnicosResult = await prisma.$queryRawUnsafe(`
                SELECT tm.monitorizacaoId, u.id as tecnicoId, u.nome as tecnicoNome 
                FROM tecnicomonitorizacao tm
                JOIN utente u ON tm.tecnicoId = u.id
                WHERE tm.monitorizacaoId IN (${processosIds.join(',')})
              `);
              
              // Organizar técnicos por processo
              if (Array.isArray(tecnicosResult)) {
                for (const tecnico of tecnicosResult) {
                  const monitId = tecnico.monitorizacaoId;
                  if (!tecnicosPorProcesso[monitId]) {
                    tecnicosPorProcesso[monitId] = [];
                  }
                  tecnicosPorProcesso[monitId].push({
                    id: tecnico.tecnicoId,
                    nome: tecnico.tecnicoNome
                  });
                }
              }
            }
          } catch (tecnicosError) {
            console.error('[DEBUG] Erro ao buscar técnicos:', tecnicosError);
          }
        }
        
        const processosFormatados = fallbackResult.map(p => {
          // Formatar técnicos para este processo
          const tecnicos = tecnicosPorProcesso[p.id] || [];
          // Enviamos os técnicos diretamente como um array de objetos, não como uma string
          const tecnicosSelecionados = tecnicos.length > 0 
            ? tecnicos
            : [];
            
          return {
            id: p.id,
            utenteId: p.utenteId,
            utenteNome: p.utenteNome || 'Nome não disponível',
            utenteNif: p.utenteNif || 'NIF não disponível',
            estadoProcesso: p.estadoProcesso || 'DESCONHECIDO',
            rupePath: p.rupePath,
            rupePago: p.rupePago === 1,
            dataPrevistaVisita: p.dataPrevistaVisita,
            dataVisita: p.dataVisita,
            observacoesVisita: p.observacoesVisita,
            relatorioPath: p.relatorioPath,
            parecerTecnicoPath: p.parecerTecnicoPath,
            documentoFinalPath: p.documentoFinalPath,
            tecnicosSelecionados: tecnicosSelecionados,
            createdAt: p.createdAt instanceof Date 
              ? p.createdAt.toISOString() 
              : new Date(p.createdAt).toISOString(),
            numeroPeriodo: 1, // Valor padrão
            tipoPeriodo: 'SEMESTRAL', // Valor padrão
            _fallback: true // Indicador de que são dados de fallback
          };
        });
        
        return NextResponse.json(processosFormatados);
        
      } catch (fallbackError) {
        console.error("[DEBUG] Erro na consulta de fallback:", fallbackError);
        throw error; // Lança o erro original
      }
    }
    
  } catch (error) {
    console.error("Erro ao buscar processos de monitorização:", error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Erro desconhecido ao buscar processos de monitorização';
      
    const errorResponse: {
      error: string;
      details?: string;
      stack?: string;
    } = { 
      error: "Erro ao buscar processos de monitorização",
      details: errorMessage
    };
    
    if (error instanceof Error && process.env.NODE_ENV === 'development') {
      errorResponse.stack = error.stack;
    }
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
