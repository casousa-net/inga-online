import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  console.log('[DEBUG] Iniciando seleção de técnicos...');
  
  // Configurar CORS
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  
  // Lidar com requisições OPTIONS para CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }
  
  try {
    const body = await request.json().catch(() => {
      throw new Error('Corpo da requisição inválido ou não é JSON');
    });
    
    console.log('[DEBUG] Dados recebidos:', JSON.stringify(body, null, 2));
    
    if (!body) {
      return new Response(JSON.stringify({ 
        error: 'Corpo da requisição inválido',
        received: body
      }), { status: 400, headers });
    }
    
    const { monitorizacaoId, tecnicosIds } = body;
    
    if (!monitorizacaoId) {
      const errorMsg = 'ID da monitorização não informado';
      console.error(`[ERRO] ${errorMsg}`);
      return new Response(JSON.stringify({ 
        error: errorMsg,
        received: { monitorizacaoId, tecnicosIds }
      }), { status: 400, headers });
    }

    if (!tecnicosIds || !Array.isArray(tecnicosIds) || tecnicosIds.length !== 3) {
      const errorMsg = 'É necessário selecionar exatamente 3 técnicos';
      console.error(`[ERRO] ${errorMsg}:`, tecnicosIds);
      return new Response(JSON.stringify({ 
        error: errorMsg,
        received: tecnicosIds,
        expected: 'Array com exatamente 3 IDs de técnicos'
      }), { status: 400, headers });
    }

    console.log(`[DEBUG] Verificando processo de monitorização ${monitorizacaoId}...`);
    
    // Verificar se o processo existe
    try {
      const processo = await prisma.monitorizacao.findUnique({
        where: { id: Number(monitorizacaoId) },
        select: { estadoProcesso: true, id: true }
      });
      
      if (!processo) {
        const errorMsg = `Processo de monitorização com ID ${monitorizacaoId} não encontrado`;
        console.error(`[ERRO] ${errorMsg}`);
        return new Response(JSON.stringify({ error: errorMsg }), { status: 404, headers });
      }
      
      // Não verificamos mais o estado do processo, permitindo alteração a qualquer momento
      console.log(`[DEBUG] Processo encontrado, ID: ${processo.id}, Estado: ${processo.estadoProcesso}`);
    } catch (error) {
      console.error('[ERRO] Falha ao verificar processo:', error);
      return new Response(JSON.stringify({ 
        error: 'Falha ao verificar processo',
        details: error
      }), { status: 500, headers });
    }

    // Verificar detalhes de cada técnico selecionado
    console.log(`[DEBUG] Verificando detalhes dos técnicos: ${tecnicosIds.join(', ')}`);
    
    // Buscar informações completas de cada técnico
    const tecnicosInfo = await Promise.all(
      tecnicosIds.map(async (tecnicoId) => {
        const tecnico = await prisma.utente.findUnique({
          where: { id: Number(tecnicoId) }
        });
        return tecnico;
      })
    );
    
    // Filtrar apenas técnicos válidos (existem, são técnicos e do departamento de monitorização)
    const tecnicosValidos = tecnicosInfo.filter((tecnico): tecnico is (typeof tecnico & { id: number; nome: string; role: string; departamento: string }) => 
      tecnico !== null && 
      typeof tecnico === 'object' &&
      tecnico.role === 'tecnico' && 
      tecnico.departamento === 'monitorizacao'
    );
    
    console.log(`[DEBUG] Técnicos válidos encontrados: ${tecnicosValidos.length} de ${tecnicosIds.length}`);
    tecnicosValidos.forEach(t => {
      console.log(`[DEBUG] Técnico válido: ID=${t.id}, Nome=${t.nome}, Role=${t.role}, Departamento=${t.departamento}`);
    });
    
    // Identificar técnicos inválidos
    const tecnicosInvalidos = tecnicosIds.filter(id => 
      !tecnicosValidos.some(t => t.id === Number(id))
    );
    
    if (tecnicosValidos.length !== 3) {
      const errorMsg = 'Um ou mais técnicos selecionados não existem ou não são do departamento de monitorização';
      console.error(`[ERRO] ${errorMsg}`, { 
        tecnicosIds, 
        tecnicosValidos: tecnicosValidos.map(t => ({ id: t.id, nome: t.nome })),
        tecnicosInvalidos
      });
      
      // Detalhes sobre os técnicos inválidos
      const detalhesInvalidos = await Promise.all(
        tecnicosInvalidos.map(async (id) => {
          const tecnico = tecnicosInfo.find(t => t && t.id === Number(id));
          if (!tecnico) return { id: Number(id), motivo: 'Técnico não encontrado' };
          return { 
            id: tecnico.id, 
            nome: tecnico.nome || 'Nome não disponível',
            motivo: tecnico.role !== 'tecnico' 
              ? `Role inválida: ${tecnico.role || 'não definida'}` 
              : `Departamento inválido: ${tecnico.departamento || 'não definido'}`
          };
        })
      );
      
      return new Response(JSON.stringify({ 
        error: errorMsg,
        details: {
          tecnicosSolicitados: tecnicosIds.map(Number),
          tecnicosValidos: tecnicosValidos.map(t => ({ id: t.id, nome: t.nome, role: t.role, departamento: t.departamento })),
          tecnicosInvalidos: detalhesInvalidos
        }
      }), { status: 400, headers });
    }

    // Usar SQL bruto para criar a tabela se não existir
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

    // Adicionar campos para visita técnica se não existirem
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE monitorizacao 
        ADD COLUMN IF NOT EXISTS dataPrevistaVisita DATETIME(3) NULL,
        ADD COLUMN IF NOT EXISTS dataVisita DATETIME(3) NULL,
        ADD COLUMN IF NOT EXISTS observacoesVisita TEXT NULL
      `);
    } catch (error) {
      console.log("Colunas já existem ou erro ao adicionar:", error);
      // Ignorar erro se as colunas já existirem
    }

    // Remover técnicos anteriores (se existirem) - usar try/catch para evitar erros
    try {
      console.log(`[DEBUG] Removendo técnicos anteriores para monitorizacaoId=${monitorizacaoId}`);
      await prisma.$executeRaw`
        DELETE FROM tecnicomonitorizacao WHERE monitorizacaoId = ${Number(monitorizacaoId)}
      `;
      console.log(`[DEBUG] Técnicos anteriores removidos para monitorizacaoId=${monitorizacaoId}`);
    } catch (deleteError) {
      console.error(`[ERRO] Falha ao remover técnicos anteriores:`, deleteError);
      // Continuar mesmo com erro na remoção
      
      // Verificar se a tabela existe
      try {
        const tableExists = await prisma.$queryRawUnsafe(`
          SELECT COUNT(*) as count
          FROM information_schema.tables 
          WHERE table_schema = DATABASE() 
          AND table_name = 'tecnicomonitorizacao'
        `);
        
        console.log(`[DEBUG] Verificação da tabela tecnicomonitorizacao:`, tableExists);
        
        if (!Array.isArray(tableExists) || tableExists.length === 0 || (tableExists[0] as any).count === 0) {
          console.log('[DEBUG] Tabela tecnicomonitorizacao não existe, criando...');
          // Tentar criar a tabela novamente
          await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS tecnicomonitorizacao (
              id INT NOT NULL AUTO_INCREMENT,
              monitorizacaoId INT NOT NULL,
              tecnicoId INT NOT NULL,
              nome VARCHAR(255) NULL,
              createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
              PRIMARY KEY (id),
              INDEX tecnicomonitorizacao_monitorizacaoId_idx (monitorizacaoId),
              INDEX tecnicomonitorizacao_tecnicoId_idx (tecnicoId)
            )
          `);
          console.log('[DEBUG] Tabela tecnicomonitorizacao criada com sucesso');
        }
      } catch (tableCheckError) {
        console.error('[ERRO] Falha ao verificar/criar tabela tecnicomonitorizacao:', tableCheckError);
      }
    }
    
    // Adicionar os novos técnicos
    const tecnicosAdicionados = [];
    
    for (const tecnicoId of tecnicosIds) {
      try {
        // Obter informações do técnico usando SQL bruto
        // Primeiro verificar se a tabela tecnico existe
        const checkTecnicoTable = await prisma.$queryRawUnsafe(`
          SELECT COUNT(*) as count FROM information_schema.tables 
          WHERE table_schema = DATABASE() AND table_name = 'tecnico'
        `);
        
        const tecnicoTableExists = Array.isArray(checkTecnicoTable) && 
          checkTecnicoTable.length > 0 && 
          (checkTecnicoTable[0] as any).count > 0;
        
        let tecnicoResult;
        
        if (tecnicoTableExists) {
          // Se a tabela tecnico existir, usar a query original
          tecnicoResult = await prisma.$queryRaw`
            SELECT id, nome FROM tecnico WHERE id = ${Number(tecnicoId)} LIMIT 1
          `;
        } else {
          // Se a tabela tecnico não existir, tentar usar a tabela utente
          tecnicoResult = await prisma.$queryRaw`
            SELECT id, nome FROM utente WHERE id = ${Number(tecnicoId)} LIMIT 1
          `;
        }
        
        if (!Array.isArray(tecnicoResult) || tecnicoResult.length === 0) {
          console.error(`[ERRO] Técnico com ID ${tecnicoId} não encontrado`);
          continue;
        }
        
        const tecnico = tecnicoResult[0];
        console.log(`[DEBUG] Adicionando técnico: ${tecnico.nome} (ID: ${tecnico.id})`);
               // Inserir diretamente, já que removemos todos anteriormente
        try {
          console.log(`[DEBUG] Iniciando inserção do técnico ID=${tecnicoId}, Nome="${tecnico.nome}" para processo ID=${monitorizacaoId}`);
          
          // Verificar a estrutura da tabela para garantir que está correta
          const tableInfo = await prisma.$queryRawUnsafe(`
            DESCRIBE tecnicomonitorizacao
          `);
          
          console.log('[DEBUG] Estrutura da tabela tecnicomonitorizacao:', tableInfo);
          
          // Verificar se a coluna 'nome' existe
          let hasNomeColumn = false;
          if (Array.isArray(tableInfo)) {
            hasNomeColumn = tableInfo.some((col: any) => 
              col.Field && col.Field.toString().toLowerCase() === 'nome'
            );
          }
          
          if (!hasNomeColumn) {
            console.log('[DEBUG] Adicionando coluna nome à tabela tecnicomonitorizacao');
            await prisma.$executeRawUnsafe(`
              ALTER TABLE tecnicomonitorizacao 
              ADD COLUMN IF NOT EXISTS nome VARCHAR(255) NULL
            `);
            console.log('[DEBUG] Coluna nome adicionada com sucesso');
          }
          
          // Verificar as foreign keys da tabela
          const foreignKeys = await prisma.$queryRawUnsafe(`
            SELECT 
              TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
            FROM 
              INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE 
              TABLE_NAME = 'tecnicomonitorizacao' AND 
              REFERENCED_TABLE_NAME IS NOT NULL
          `);
          
          console.log('[DEBUG] Foreign keys da tabela tecnicomonitorizacao:', foreignKeys);
          
          // Usar SQL direto para maior controle sobre o processo de inserção
          console.log('[DEBUG] Tentando inserir técnico com nome diretamente via SQL');
          
          const insertResult = await prisma.$executeRawUnsafe(`
            INSERT INTO tecnicomonitorizacao (monitorizacaoId, tecnicoId, nome) 
            VALUES (?, ?, ?)
          `, Number(monitorizacaoId), Number(tecnicoId), tecnico.nome);
          
          console.log(`[DEBUG] Resultado da inserção do técnico:`, insertResult);
        } catch (insertError) {
          console.error(`[ERRO] Falha ao inserir técnico com nome:`, insertError);
          
          try {
            // Tentar inserir sem o campo nome como fallback
            console.log('[DEBUG] Tentando inserir sem o campo nome');
            await prisma.$executeRawUnsafe(`
              INSERT INTO tecnicomonitorizacao (monitorizacaoId, tecnicoId) 
              VALUES (?, ?)
            `, Number(monitorizacaoId), Number(tecnicoId));
            console.log('[DEBUG] Técnico inserido com sucesso (sem nome)');
          } catch (fallbackError) {
            console.error(`[ERRO] Falha total ao inserir técnico:`, fallbackError);
            throw fallbackError; // Lançar o erro para ser tratado em um nível superior
          }
        }
        
        tecnicosAdicionados.push({
          id: Number(tecnicoId),
          nome: tecnico.nome
        });
        
        console.log(`[DEBUG] Técnico ${tecnico.nome} adicionado com sucesso`);
      } catch (tecnicoError) {
        console.error(`[ERRO] Falha ao adicionar técnico ${tecnicoId}:`, tecnicoError);
      }
    }

    // Atualizar o estado do processo apenas se estiver em AGUARDANDO_SELECAO_TECNICOS
    const processoAtual = await prisma.monitorizacao.findUnique({
      where: { id: Number(monitorizacaoId) },
      select: { estadoProcesso: true }
    });
    
    if (processoAtual && processoAtual.estadoProcesso === "AGUARDANDO_SELECAO_TECNICOS") {
      await prisma.monitorizacao.update({
        where: { id: Number(monitorizacaoId) },
        data: { estadoProcesso: "AGUARDANDO_VISITA" }
      });
      console.log(`[DEBUG] Estado do processo atualizado para AGUARDANDO_VISITA`);
    } else {
      console.log(`[DEBUG] Mantendo o estado atual do processo: ${processoAtual?.estadoProcesso}`);
    }

    const processoFinal = await prisma.monitorizacao.findUnique({
      where: { id: Number(monitorizacaoId) },
      select: { estadoProcesso: true }
    });

    const responseData = { 
      success: true, 
      message: "Técnicos selecionados com sucesso.",
      monitorizacaoId: Number(monitorizacaoId),
      tecnicosIds: tecnicosIds.map(Number),
      estadoProcesso: processoFinal?.estadoProcesso || 'AGUARDANDO_VISITA'
    };
    
    console.log('[SUCESSO] Técnicos selecionados:', responseData);
    return new Response(JSON.stringify(responseData), { status: 200, headers });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error("Erro ao processar seleção de técnicos:", error);
    
    return new Response(JSON.stringify({
      error: 'Erro ao processar a solicitação',
      message: errorMsg,
      stack: process.env.NODE_ENV === 'development' ? (error as Error)?.stack : undefined
    }), { 
      status: 500, 
      headers: new Headers({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      })
    });
  }
}
