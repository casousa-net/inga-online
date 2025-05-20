import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    console.log('[DEBUG] Iniciando adição de parecer do chefe...');
    
    const formData = await req.formData();
    const monitorId = formData.get("monitorizacaoId") || formData.get("monitorId");
    const parecer = formData.get("parecer") || formData.get("parecerTipo"); // APROVADO, CARECE_MELHORIAS, REJEITADO
    const observacoes = formData.get("observacoes");
    const parecerFile = formData.get("parecerFile");
    
    console.log('[DEBUG] Dados recebidos:', { monitorId, parecer, observacoes, parecerFile: parecerFile ? 'File present' : 'No file' });
    
    if (!monitorId || !parecer) {
      return NextResponse.json(
        { error: "ID da monitorização e tipo de parecer são obrigatórios" },
        { status: 400 }
      );
    }

    // Validar o tipo de parecer
    const parecerValido = ["APROVADO", "CARECE_MELHORIAS", "REJEITADO"].includes(parecer.toString());
    if (!parecerValido) {
      return NextResponse.json(
        { error: "Tipo de parecer inválido" },
        { status: 400 }
      );
    }

    // Variável para armazenar o caminho do arquivo de parecer
    let parecerPath: string | null = null;
    
    // Processar o arquivo se ele existir
    if (parecerFile && parecerFile instanceof File) {
      // Criar diretório de uploads se não existir
      const uploadDir = path.join(process.cwd(), "uploads", "pareceres");
      
      try {
        await mkdir(uploadDir, { recursive: true });
        console.log('[DEBUG] Diretório de uploads criado ou já existe:', uploadDir);
      } catch (error) {
        console.error("[ERRO] Falha ao criar diretório:", error);
        return NextResponse.json(
          { error: "Erro ao criar diretório de uploads" },
          { status: 500 }
        );
      }
      
      try {
        // Salvar o arquivo
        const bytes = await parecerFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Gerar nome de arquivo único e sanitizar o nome do arquivo para evitar problemas com caracteres especiais
        const sanitizedFileName = parecerFile.name
          .replace(/\s+/g, '_')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove acentos
          .replace(/[^a-zA-Z0-9._-]/g, '_'); // Substitui caracteres especiais por _
        
        const fileName = `parecer-${Date.now()}-${sanitizedFileName}`;
        const filePath = path.join(uploadDir, fileName);
        
        await writeFile(filePath, buffer);
        console.log('[DEBUG] Arquivo salvo com sucesso:', filePath);
        
        parecerPath = `pareceres/${fileName}`;
      } catch (error) {
        console.error("[ERRO] Falha ao salvar arquivo:", error);
        return NextResponse.json(
          { error: "Erro ao salvar arquivo" },
          { status: 500 }
        );
      }
    } else {
      console.log('[DEBUG] Nenhum arquivo de parecer fornecido');
    }
    
    try {
      // Verificar se o registro existe antes de atualizar
      const monitorizacao = await prisma.monitorizacao.findUnique({
        where: { id: Number(monitorId) }
      });
      
      if (!monitorizacao) {
        return NextResponse.json(
          { error: "Registro de monitorização não encontrado" },
          { status: 404 }
        );
      }
      
      console.log('[DEBUG] Atualizando registro de monitorização:', {
        id: monitorId,
        parecer: parecer.toString(),
        parecerPath
      });
      
      // Determinar o próximo estado do processo com base no tipo de parecer
      let proximoEstado = 'AGUARDANDO_RUPE';
      if (parecer.toString() === 'REJEITADO') {
        proximoEstado = 'REJEITADO';
      } else if (parecer.toString() === 'CARECE_MELHORIAS') {
        proximoEstado = 'AGUARDANDO_CORRECOES';
      }
      
      // Atualizar o registro de monitorização com as informações do parecer técnico usando SQL nativo
      await prisma.$executeRaw`
        UPDATE monitorizacao
        SET
          parecerTecnicoPath = ${parecerPath},
          observacoesVisita = ${observacoes ? String(observacoes) : null},
          estado = ${parecer.toString()},
          estadoProcesso = ${proximoEstado}
        WHERE id = ${Number(monitorId)}
      `;
      
      console.log('[DEBUG] Registro atualizado com sucesso. Novo estado:', proximoEstado);
      
      return NextResponse.json({
        message: "Parecer técnico adicionado com sucesso",
        parecer: parecer,
        parecerPath: parecerPath
      });
    } catch (dbError) {
      console.error("Erro ao atualizar registro no banco de dados:", dbError);
      return NextResponse.json(
        { error: "Erro ao salvar informações no banco de dados" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Erro ao adicionar parecer técnico:", error);
    return NextResponse.json(
      { error: "Erro ao adicionar parecer técnico" },
      { status: 500 }
    );
  }
}
