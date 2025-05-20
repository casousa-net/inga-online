import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const utenteId = formData.get("utenteId");
    const periodoId = formData.get("periodoId");
    const relatorio = formData.get("relatorio");
    
    console.log("Dados recebidos:", { 
      utenteId: utenteId ? true : false, 
      periodoId: periodoId ? true : false, 
      relatorio: relatorio ? true : false 
    });
    
    // Validar dados
    if (!utenteId || !periodoId || !relatorio || !(relatorio instanceof File)) {
      console.error("Dados incompletos:", { 
        utenteId: utenteId ? utenteId : "ausente", 
        periodoId: periodoId ? periodoId : "ausente", 
        relatorio: relatorio ? "presente" : "ausente" 
      });
      return NextResponse.json(
        { error: "Dados incompletos" },
        { status: 400 }
      );
    }

    // Verificar se já existe uma monitorização para este período usando SQL bruto
    const monitorExistente = await prisma.$queryRaw`
      SELECT id FROM monitorizacao WHERE periodoId = ${Number(periodoId)} LIMIT 1
    `;

    if (Array.isArray(monitorExistente) && monitorExistente.length > 0) {
      return NextResponse.json(
        { error: "O relatório só pode ser enviado 1 por vez" },
        { status: 400 }
      );
    }

    // Gerar identificador único para o arquivo
    const fileId = uuidv4().substring(0, 8);
    
    // Criar diretório de uploads se não existir
    const uploadDir = path.join(process.cwd(), "public", "uploads", "monitorizacao");
    
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
    const bytes = await relatorio.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Gerar nome de arquivo único
    const fileName = `relatorio-${fileId}-${relatorio.name}`;
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
    
    const relatorioPath = `/uploads/monitorizacao/${fileName}`;
    
    try {
      // Verificar o estado atual do período
      const periodoAtual = await prisma.$queryRaw`
        SELECT estado, statusReabertura FROM periodomonitorizacao 
        WHERE id = ${Number(periodoId)}
      `;
      
      console.log('Estado atual do período:', periodoAtual);
      
      // Determinar se o período está reaberto
      let estaReaberto = false;
      if (Array.isArray(periodoAtual) && periodoAtual.length > 0) {
        const periodo = periodoAtual[0];
        estaReaberto = periodo.estado === 'REABERTO' || periodo.statusReabertura === 'APROVADA';
      }
      
      // Inserir o registro de monitorização usando SQL simples
      console.log('Inserindo monitorização...');
      await prisma.$executeRaw`
        INSERT INTO monitorizacao (utenteId, periodoId, relatorioPath, estado) 
        VALUES (${Number(utenteId)}, ${Number(periodoId)}, ${relatorioPath}, 'PENDENTE')
      `;
      
      // Atualizar o estado do período
      console.log('Atualizando estado do período...');
      await prisma.$executeRaw`
        UPDATE periodomonitorizacao 
        SET estado = ${estaReaberto ? 'REABERTO' : 'FECHADO'} 
        WHERE id = ${Number(periodoId)}
      `;
      
      // Buscar o registro recém-criado
      const monitorCriado = await prisma.$queryRaw`
        SELECT * FROM monitorizacao 
        WHERE utenteId = ${Number(utenteId)} AND periodoId = ${Number(periodoId)} 
        ORDER BY id DESC LIMIT 1
      `;
      
      return NextResponse.json({
        message: "Relatório enviado com sucesso",
        monitorizacao: Array.isArray(monitorCriado) ? monitorCriado[0] : monitorCriado
      });
    } catch (error) {
      console.error("Erro ao salvar informações no banco de dados:", error);
      return NextResponse.json(
        { error: "Erro ao salvar informações no banco de dados" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Erro ao processar envio de relatório:", error);
    return NextResponse.json(
      { error: "Erro ao enviar relatório" },
      { status: 500 }
    );
  }
}
