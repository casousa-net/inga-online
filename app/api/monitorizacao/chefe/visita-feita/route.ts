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
    const relatorioVisitaFile = formData.get("relatorioVisitaFile");
    
    if (!monitorId || !(relatorioVisitaFile instanceof File)) {
      return NextResponse.json(
        { error: "ID da monitorização e relatório da visita são obrigatórios" },
        { status: 400 }
      );
    }

    // Criar diretório de uploads se não existir
    const uploadDir = path.join(process.cwd(), "public", "uploads", "visitas");
    
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
    const bytes = await relatorioVisitaFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Gerar nome de arquivo único
    const fileName = `visita-${Date.now()}-${relatorioVisitaFile.name}`;
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
    
    const relatorioVisitaPath = `/uploads/visitas/${fileName}`;
    
    try {
      // Verificar se a monitorização existe e obter o período
      const monitorizacao = await prisma.monitorizacao.findUnique({
        where: { id: Number(monitorId) },
        select: { id: true, periodoId: true }
      });
      
      if (!monitorizacao) {
        return NextResponse.json(
          { error: "Monitorização não encontrada" },
          { status: 404 }
        );
      }
      
      // Atualizar o registro de monitorização usando SQL nativo
      await prisma.$executeRaw`
        UPDATE monitorizacao
        SET
          relatorioPath = ${relatorioVisitaPath},
          estado = 'APROVADO',
          estadoProcesso = 'AGUARDANDO_DOCUMENTO_FINAL',
          updatedAt = NOW()
        WHERE id = ${Number(monitorId)}
      `;
      
      return NextResponse.json({
        message: "Visita marcada como realizada com sucesso",
        relatorioVisitaPath: relatorioVisitaPath
      });
    } catch (dbError) {
      console.error("Erro ao atualizar registro no banco de dados:", dbError);
      return NextResponse.json(
        { error: "Erro ao salvar informações no banco de dados" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Erro ao marcar visita como realizada:", error);
    return NextResponse.json(
      { error: "Erro ao marcar visita como realizada" },
      { status: 500 }
    );
  }
}
