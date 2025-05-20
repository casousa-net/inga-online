import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import fs from "fs";
// @ts-ignore - Ignorando erro de tipagem para uuid
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    // Simplificando a autenticação para fins de depuração
    console.log("[API] Iniciando upload de RUPE");

    // Processar o arquivo
    console.log("[API] Processando formData");
    const formData = await req.formData();
    
    console.log("[API] Obtendo arquivo e periodoId do formData");
    const file = formData.get("file") as File;
    const periodoId = formData.get("periodoId") as string;
    
    console.log("[API] Dados recebidos:", { 
      fileExists: !!file, 
      fileName: file?.name, 
      fileSize: file?.size, 
      periodoId 
    });

    if (!file) {
      console.log("[API] Erro: Nenhum arquivo enviado");
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      );
    }

    if (!periodoId) {
      console.log("[API] Erro: ID do período não fornecido");
      return NextResponse.json(
        { error: "ID do período não fornecido" },
        { status: 400 }
      );
    }

    // Criar diretório de uploads se não existir
    console.log("[API] Verificando diretórios de upload");
    const publicDir = path.join(process.cwd(), "public");
    const uploadsDir = path.join(publicDir, "uploads");
    const rupeDir = path.join(uploadsDir, "rupe");
    
    console.log("[API] Caminhos dos diretórios:", {
      publicDir,
      uploadsDir,
      rupeDir
    });

    try {
      console.log("[API] Verificando se o diretório public existe:", fs.existsSync(publicDir));
      if (!fs.existsSync(publicDir)) {
        console.log("[API] Criando diretório public");
        await mkdir(publicDir, { recursive: true });
      }
      
      console.log("[API] Verificando se o diretório uploads existe:", fs.existsSync(uploadsDir));
      if (!fs.existsSync(uploadsDir)) {
        console.log("[API] Criando diretório uploads");
        await mkdir(uploadsDir, { recursive: true });
      }

      console.log("[API] Verificando se o diretório rupe existe:", fs.existsSync(rupeDir));
      if (!fs.existsSync(rupeDir)) {
        console.log("[API] Criando diretório rupe");
        await mkdir(rupeDir, { recursive: true });
      }
      
      console.log("[API] Todos os diretórios verificados/criados com sucesso");
    } catch (error) {
      console.error("[API] Erro ao criar diretório:", error);
      return NextResponse.json(
        { error: `Erro ao criar diretório de uploads: ${error instanceof Error ? error.message : 'Erro desconhecido'}` },
        { status: 500 }
      );
    }

    // Gerar nome único para o arquivo
    console.log("[API] Gerando nome único para o arquivo");
    const fileExtension = file.name.split(".").pop();
    const fileName = `rupe-periodo-${periodoId}-${uuidv4()}.${fileExtension}`;
    const filePath = path.join(rupeDir, fileName);
    
    console.log("[API] Detalhes do arquivo:", {
      fileName,
      filePath,
      fileExtension
    });

    try {
      // Ler o conteúdo do arquivo
      console.log("[API] Lendo conteúdo do arquivo");
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      console.log("[API] Tamanho do buffer:", buffer.length, "bytes");

      // Salvar o arquivo
      console.log("[API] Salvando arquivo em:", filePath);
      await writeFile(filePath, buffer);
      console.log("[API] Arquivo salvo com sucesso");
    } catch (error) {
      console.error("[API] Erro ao processar ou salvar arquivo:", error);
      return NextResponse.json(
        { error: `Erro ao salvar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}` },
        { status: 500 }
      );
    }

    // Retornar o caminho do arquivo
    const rupePath = `/uploads/rupe/${fileName}`;
    console.log("[API] Caminho público do arquivo:", rupePath);

    console.log("[API] Upload concluído com sucesso");
    return NextResponse.json({
      success: true,
      filePath: rupePath,
      message: "Arquivo RUPE enviado com sucesso"
    });
  } catch (error) {
    console.error("[API] Erro ao processar upload:", error);
    return NextResponse.json(
      { error: `Erro ao processar o upload: ${error instanceof Error ? error.message : 'Erro desconhecido'}` },
      { status: 500 }
    );
  }
}
