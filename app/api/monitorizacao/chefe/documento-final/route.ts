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
    const observacoes = formData.get("observacoes") || "";
    const documentoFinalFile = formData.get("documentoFinalFile");
    
    if (!monitorId || !(documentoFinalFile instanceof File)) {
      return NextResponse.json(
        { error: "ID da monitorização e documento final são obrigatórios" },
        { status: 400 }
      );
    }

    // Criar diretório de uploads se não existir
    const uploadDir = path.join(process.cwd(), "public", "uploads", "documentos-finais");
    
    try {
      if (!fs.existsSync(path.join(process.cwd(), "public", "uploads"))) {
        await mkdir(path.join(process.cwd(), "public", "uploads"), { recursive: true });
      }
      
      if (!fs.existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }
    } catch (error) {
      console.error("Erro ao criar diretório:", error);
      return NextResponse.json(
        { error: "Erro ao criar diretório de uploads" },
        { status: 500 }
      );
    }
    
    // Salvar o arquivo
    const bytes = await documentoFinalFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Gerar nome de arquivo único
    const fileName = `doc-final-${Date.now()}-${documentoFinalFile.name}`;
    const filePath = path.join(uploadDir, fileName);
    
    try {
      await writeFile(filePath, buffer);
    } catch (error) {
      console.error("Erro ao salvar arquivo:", error);
      return NextResponse.json(
        { error: "Erro ao salvar arquivo" },
        { status: 500 }
      );
    }
    
    const documentoFinalPath = `/uploads/documentos-finais/${fileName}`;
    
    try {
      // Verificar se a monitorização existe
      const monitorizacao = await prisma.monitorizacao.findUnique({
        where: { id: Number(monitorId) }
      });
      
      if (!monitorizacao) {
        return NextResponse.json(
          { error: "Monitorização não encontrada" },
          { status: 404 }
        );
      }
      
      // Atualizar o registro de monitorização com as informações do documento final
      // Usar Prisma model em vez de SQL raw para evitar problemas com colunas inexistentes
      await prisma.monitorizacao.update({
        where: { id: Number(monitorId) },
        data: {
          documentoFinalPath: documentoFinalPath,
          estadoProcesso: 'CONCLUIDO'
          // Removido updatedAt pois não existe na tabela
        }
      });
      
      return NextResponse.json({
        message: "Documento final enviado com sucesso",
        documentoFinalPath: documentoFinalPath
      });
    } catch (dbError) {
      console.error("Erro ao atualizar registro no banco de dados:", dbError);
      return NextResponse.json(
        { error: "Erro ao salvar informações no banco de dados" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Erro ao enviar documento final:", error);
    return NextResponse.json(
      { error: "Erro ao enviar documento final" },
      { status: 500 }
    );
  }
}
