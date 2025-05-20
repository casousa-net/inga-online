import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const monitorId = formData.get("monitorId");
    const rupeReferencia = formData.get("rupeReferencia");
    const rupeFile = formData.get("rupeFile");
    
    if (!monitorId || !rupeReferencia || !rupeFile || !(rupeFile instanceof File)) {
      return NextResponse.json(
        { error: "Dados incompletos" },
        { status: 400 }
      );
    }

    console.log('Processando upload de RUPE:', { monitorId, rupeReferencia, rupeFile: rupeFile.name });
    
    // Criar diretório de uploads se não existir
    // Usar o diretório uploads na raiz, não em public
    const uploadDir = path.join(process.cwd(), "uploads", "rupe");
    
    try {
      // Garantir que o diretório uploads existe
      await mkdir(path.join(process.cwd(), "uploads"), { recursive: true });
      console.log('Diretório uploads verificado');
      
      // Garantir que o diretório uploads/rupe existe
      await mkdir(uploadDir, { recursive: true });
      console.log('Diretório uploads/rupe verificado');
    } catch (error) {
      console.error("Erro ao criar diretório:", error);
      return NextResponse.json(
        { error: "Erro ao criar diretório de uploads", detalhes: error instanceof Error ? error.message : 'Erro desconhecido' },
        { status: 500 }
      );
    }
    
    // Salvar o arquivo
    const bytes = await rupeFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Gerar nome de arquivo único com nome sanitizado
    const sanitizedFileName = rupeFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `rupe-${Date.now()}-${sanitizedFileName}`;
    const filePath = path.join(uploadDir, fileName);
    
    console.log(`Salvando arquivo em: ${filePath}`);
    
    try {
      await writeFile(filePath, buffer);
      console.log(`Arquivo salvo com sucesso: ${filePath}`);
    } catch (error) {
      console.error("Erro ao salvar arquivo:", error);
      return NextResponse.json(
        { error: "Erro ao salvar arquivo", detalhes: error instanceof Error ? error.message : 'Erro desconhecido' },
        { status: 500 }
      );
    }
    
    // Usar o caminho relativo para o arquivo sem o 'public'
    const rupePath = `rupe/${fileName}`;
    
    try {
      // Atualizar o registro de monitorização com as informações do RUPE
      await prisma.$executeRawUnsafe(`
        UPDATE monitorizacao 
        SET 
          rupePath = '${rupePath}',
          rupeReferencia = '${rupeReferencia}',
          estadoProcesso = 'AGUARDANDO_PAGAMENTO'
        WHERE 
          id = ${Number(monitorId)}
      `);
      
      return NextResponse.json({
        message: "RUPE adicionado com sucesso"
      });
    } catch (dbError) {
      console.error("Erro ao atualizar registro no banco de dados:", dbError);
      return NextResponse.json(
        { error: "Erro ao salvar informações no banco de dados" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Erro ao adicionar RUPE:", error);
    return NextResponse.json(
      { error: "Erro ao adicionar RUPE" },
      { status: 500 }
    );
  }
}
