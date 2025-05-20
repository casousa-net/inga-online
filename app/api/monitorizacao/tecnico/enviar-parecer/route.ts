import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { writeFile } from "fs/promises";
import { join } from "path";
import { mkdir } from "fs/promises";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  console.log('[API] Iniciando envio de parecer técnico...');
  
  try {
    // Tentar obter a sessão do usuário
    let tecnicoId: number;
    let tecnicoNome: string;
    
    try {
      const session = await getServerSession(authOptions);
      console.log("[API] Sessão do usuário:", session ? "Autenticado" : "Não autenticado");
      
      // Verificar se o usuário está autenticado e tem a função de técnico
      if (session && session.user && session.user.role === "TECNICO") {
        tecnicoId = Number(session.user.id);
        tecnicoNome = session.user.name || `Técnico ${tecnicoId}`;
        console.log(`[API] Técnico autenticado, ID: ${tecnicoId}, Nome: ${tecnicoNome}`);
      } else {
        // Para desenvolvimento, permitir o uso de valores padrão
        const url = new URL(request.url);
        const tecnicoIdParam = url.searchParams.get('tecnicoId');
        tecnicoId = tecnicoIdParam ? parseInt(tecnicoIdParam) : 1; // Usar ID 1 como padrão
        tecnicoNome = "Técnico de Teste";
        console.log(`[API] Usando ID de técnico padrão: ${tecnicoId}, Nome: ${tecnicoNome}`);
      }
    } catch (authError) {
      console.error("[API] Erro ao verificar autenticação:", authError);
      // Fallback para desenvolvimento
      tecnicoId = 1;
      tecnicoNome = "Técnico de Teste";
      console.log(`[API] Usando ID de técnico padrão após erro: ${tecnicoId}, Nome: ${tecnicoNome}`);
    }
    
    // Processar o formulário
    const formData = await request.formData();
    const monitorizacaoId = formData.get('monitorizacaoId');
    const parecer = formData.get('parecer');
    const parecerFile = formData.get('parecerFile') as File | null;
    
    console.log(`[API] Dados recebidos: monitorizacaoId=${monitorizacaoId}, parecer=${parecer ? 'fornecido' : 'não fornecido'}, arquivo=${parecerFile ? 'fornecido' : 'não fornecido'}`);
    
    // Validar dados obrigatórios
    if (!monitorizacaoId) {
      console.log('[API] Erro: ID da monitorização não informado');
      return NextResponse.json({ error: "ID da monitorização não informado" }, { status: 400 });
    }
    
    if (!parecer && !parecerFile) {
      console.log('[API] Erro: Nenhum parecer ou arquivo fornecido');
      return NextResponse.json({ error: "É necessário fornecer um parecer ou um arquivo" }, { status: 400 });
    }
    
    // Verificar se o processo existe
    console.log(`[API] Verificando processo ID: ${monitorizacaoId}`);
    const processo = await prisma.monitorizacao.findUnique({
      where: { id: Number(monitorizacaoId) }
    });
    
    if (!processo) {
      console.log(`[API] Erro: Processo ID ${monitorizacaoId} não encontrado`);
      return NextResponse.json({ error: "Processo de monitorização não encontrado" }, { status: 404 });
    }
    
    // Verificar se o processo está no estado correto
    console.log(`[API] Estado atual do processo: ${processo.estadoProcesso}`);
    if (processo.estadoProcesso !== 'AGUARDANDO_DOCUMENTO_FINAL') {
      console.log(`[API] Erro: Processo não está no estado correto. Estado atual: ${processo.estadoProcesso}`);
      return NextResponse.json({ 
        error: `O processo não está no estado correto para enviar parecer técnico. Estado atual: ${processo.estadoProcesso}`,
        estadoAtual: processo.estadoProcesso
      }, { status: 400 });
    }
    
    // Verificar se o técnico está associado a este processo
    console.log(`[API] Verificando se o técnico ID ${tecnicoId} está associado ao processo`);
    const tecnicoAssociado = await prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*) as count FROM tecnicomonitorizacao 
      WHERE monitorizacaoId = ${Number(monitorizacaoId)}
      AND tecnicoId = ${tecnicoId}
    `;
    
    if (!tecnicoAssociado || tecnicoAssociado[0].count < 1) {
      console.log(`[API] Erro: Técnico ID ${tecnicoId} não está autorizado para este processo`);
      return NextResponse.json(
        { error: "Você não está autorizado a enviar parecer para este processo" },
        { status: 403 }
      );
    }
    
    // Salvar arquivo se fornecido
    let parecerFilePath = null;
    
    if (parecerFile) {
      try {
        console.log(`[API] Processando arquivo: ${parecerFile.name}, tamanho: ${parecerFile.size} bytes`);
        const bytes = await parecerFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Criar diretório se não existir
        const uploadDir = join(process.cwd(), 'uploads', 'pareceres');
        await mkdir(uploadDir, { recursive: true });
        
        // Gerar nome de arquivo único e sanitizar o nome do arquivo para evitar problemas com caracteres especiais
        const sanitizedFileName = parecerFile.name
          .replace(/\s+/g, '_')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove acentos
          .replace(/[^a-zA-Z0-9._-]/g, '_'); // Substitui caracteres especiais por _
        
        const fileName = `parecer-${monitorizacaoId}-${Date.now()}-${sanitizedFileName}`;
        const filePath = join(uploadDir, fileName);
        
        // Salvar arquivo
        await writeFile(filePath, buffer);
        parecerFilePath = `pareceres/${fileName}`;
        
        console.log(`[API] Arquivo de parecer salvo com sucesso em: ${parecerFilePath}`);
      } catch (fileError) {
        console.error('[API] Erro ao salvar arquivo de parecer:', fileError);
        return NextResponse.json({ 
          error: "Erro ao salvar arquivo de parecer", 
          details: fileError instanceof Error ? fileError.message : String(fileError) 
        }, { status: 500 });
      }
    }
    
    try {
      console.log(`[API] Atualizando processo ${monitorizacaoId} com parecer técnico`);
      
      // Usar transação para garantir a integridade dos dados
      await prisma.$transaction(async (tx) => {
        // Registrar quem enviou o parecer
        await tx.$executeRaw`
          INSERT INTO parecertecnico (monitorizacaoId, tecnicoId, tecnicoNome, dataEnvio, conteudo, arquivoPath)
          VALUES (
            ${Number(monitorizacaoId)}, 
            ${tecnicoId}, 
            ${tecnicoNome}, 
            ${new Date().toISOString()}, 
            ${parecer ? String(parecer) : null}, 
            ${parecerFilePath}
          )
          ON DUPLICATE KEY UPDATE 
            tecnicoId = ${tecnicoId},
            tecnicoNome = ${tecnicoNome},
            dataEnvio = ${new Date().toISOString()},
            conteudo = ${parecer ? String(parecer) : null},
            arquivoPath = ${parecerFilePath}
        `;
        
        // Atualizar o processo com o parecer
        await tx.$executeRaw`
          UPDATE monitorizacao 
          SET 
            parecerTecnico = ${parecer ? String(parecer) : null},
            parecerTecnicoPath = ${parecerFilePath},
            estadoProcesso = 'AGUARDANDO_DOCUMENTO_FINAL',
            updatedAt = ${new Date().toISOString()}
          WHERE id = ${Number(monitorizacaoId)}
        `;
      });
      
      console.log(`[API] Parecer técnico enviado com sucesso para o processo ${monitorizacaoId}`);
      
      // Buscar o processo atualizado com informações detalhadas
      const processoAtualizado = await prisma.monitorizacao.findUnique({
        where: { id: Number(monitorizacaoId) },
        include: {
          utente: {
            select: {
              nome: true,
              nif: true
            }
          },
          periodo: {
            select: {
              numeroPeriodo: true,
              configuracao: {
                select: {
                  tipoPeriodo: true
                }
              }
            }
          }
        }
      });
      
      return NextResponse.json({ 
        success: true, 
        message: "Parecer técnico enviado com sucesso",
        processo: processoAtualizado
      });
    } catch (updateError) {
      console.error('[API] Erro ao atualizar processo com parecer técnico:', updateError);
      return NextResponse.json({ 
        error: "Erro ao atualizar processo com parecer técnico",
        details: updateError instanceof Error ? updateError.message : String(updateError)
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[API] Falha ao processar parecer técnico:', error);
    return NextResponse.json({ 
      success: false,
      error: "Erro ao processar parecer técnico",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
