import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { writeFile } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const utenteId = formData.get("utenteId");
    const periodoId = formData.get("periodoId");
    const relatorio = formData.get("relatorio");
    
    // Validar dados
    if (!utenteId || !periodoId || !relatorio || !(relatorio instanceof File)) {
      return NextResponse.json(
        { error: "Dados incompletos" },
        { status: 400 }
      );
    }

    // Gerar número de processo único
    const numeroProcesso = `MON-${new Date().getFullYear()}-${uuidv4().substring(0, 8)}`;
    
    // Salvar o arquivo
    const bytes = await relatorio.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Criar diretório de uploads se não existir
    const uploadDir = path.join(process.cwd(), "public", "uploads", "monitorizacao");
    
    // Gerar nome de arquivo único
    const fileName = `${numeroProcesso}-${relatorio.name}`;
    const filePath = path.join(uploadDir, fileName);
    
    // Salvar arquivo
    await writeFile(filePath, buffer);
    const relatorioPath = `/uploads/monitorizacao/${fileName}`;
    
    // Criar registro de monitorização
    const novaMonitorizacao = await prisma.monitorizacao.create({
      data: {
        utenteId: Number(utenteId),
        periodoId: Number(periodoId),
        numeroProcesso,
        relatorioPath,
        estado: "Pendente"
      }
    });
    
    // Atualizar estado do período
    await prisma.periodoMonitorizacao.update({
      where: { id: Number(periodoId) },
      data: { estado: "FECHADO" }
    });
    
    return NextResponse.json({
      message: "Relatório enviado com sucesso",
      monitorizacao: novaMonitorizacao
    });
    
  } catch (error) {
    console.error("Erro ao enviar relatório:", error);
    return NextResponse.json(
      { error: "Erro ao enviar relatório" },
      { status: 500 }
    );
  }
}
